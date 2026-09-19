#!/usr/bin/env node
/** Provider-neutral AIDD hook guard. Node.js 22+, no package dependencies. */

import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const POLICY_PATH = join(ROOT, ".ai/hooks/policy.json");
const CONTRACT_PATH = join(ROOT, ".ai/hooks/contract.json");
const RECOVERY_PATHS = new Set([
  ".ai/hooks/policy.json", ".ai/hooks/contract.json", ".ai/hooks/README.md",
  ".ai/tools/aidd_hook.mjs", ".claude/settings.json", ".codex/hooks.json",
  ".ai/tests/harness.test.mjs",
]);

function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
function slash(value) { return value.split(sep).join("/"); }
function repoRole() {
  try { return readJson(join(ROOT, ".aidd-role.json")).role ?? "product-workspace"; }
  catch { return "product-workspace"; }
}
function loadPolicy() {
  const value = readJson(POLICY_PATH);
  if (value.version !== 1) throw new Error("unsupported hook policy version");
  for (const key of ["generated_roots", "destructive_command_patterns", "shell_write_patterns"])
    if (!Array.isArray(value[key])) throw new Error(`policy field ${key} must be a list`);
  return value;
}
function loadContract() {
  const value = readJson(CONTRACT_PATH);
  if (value.version !== 1 || !value.events || Array.isArray(value.events)) throw new Error("malformed hook contract");
  if (!Array.isArray(value.recovery_paths)) throw new Error("contract recovery_paths must be a list");
  const runtime = value.node_runtime;
  if (!runtime || runtime.minimum_major !== 22 || runtime.hook_input !== "utf-8-bytes" || runtime.dependencies !== "node-standard-library")
    throw new Error("contract node_runtime is malformed");
  const log = value.local_conversation_log;
  if (!log || log.root !== "chat-history" || log.transport_encoding !== "utf-8" || log.failure_reporting !== "sanitized-stderr")
    throw new Error("contract local_conversation_log is malformed");
  return value;
}
async function readInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) throw new Error("hook input is empty");
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("hook input must be a JSON object");
  return value;
}
function inputOf(payload) {
  for (const key of ["tool_input", "toolInput", "input", "arguments"])
    if (payload[key] && typeof payload[key] === "object" && !Array.isArray(payload[key])) return payload[key];
  return payload;
}
function nameOf(payload) {
  for (const key of ["tool_name", "toolName", "tool"]) {
    const value = payload[key];
    if (typeof value === "string") return value;
    if (value && typeof value.name === "string") return value.name;
  }
  return "unknown";
}
function *stringsAt(value, keys) {
  if (Array.isArray(value)) for (const item of value) yield* stringsAt(item, keys);
  else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) {
    if (keys.has(key) && typeof child === "string") yield child;
    else if (child && typeof child === "object") yield* stringsAt(child, keys);
  }
}
function repoPath(raw) {
  const text = raw.trim().replace(/^['"]|['"]$/g, "").replaceAll("\\", "/");
  if (!text) return null;
  const absolute = resolve(isAbsolute(text) ? text : join(ROOT, text));
  const value = slash(relative(ROOT, absolute));
  return value === "" || value === ".." || value.startsWith("../") ? null : value;
}
function targetPaths(payload) {
  const data = inputOf(payload);
  const keys = new Set(["file_path", "filePath", "filename", "path", "uri", "target", "target_path", "destination", "destination_path", "new_path"]);
  const found = new Set([...stringsAt(data, keys)].map(repoPath).filter(Boolean));
  for (const patch of stringsAt(data, new Set(["command", "patch", "patch_text", "input"]))) {
    for (const match of patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File:\s*(.+?)\s*$/gm)) {
      const path = repoPath(match[1]); if (path) found.add(path);
    }
  }
  return found;
}
function commandText(payload) { return [...stringsAt(inputOf(payload), new Set(["command", "cmd", "script", "code"]))].join("\n").trim(); }
function under(path, root) {
  const lhs = path.toLowerCase().replace(/^\/+|\/+$/g, "");
  const rhs = root.toLowerCase().replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
  return lhs === rhs || lhs.startsWith(`${rhs}/`);
}
function shellWriteTargets(command) {
  const found = new Set();
  const add = raw => { const value = repoPath(raw); if (value) found.add(value); };
  const token = String.raw`(?:'([^']+)'|"([^"]+)"|([^\s;|]+))`;
  const patterns = [
    new RegExp(String.raw`(?:^|\s)(?:>>?|\|\s*tee)\s*${token}`, "gi"),
    new RegExp(String.raw`\btee\b(?:\s+-[A-Za-z]+)*\s+${token}`, "gi"),
    new RegExp(String.raw`\b(?:Set-Content|Add-Content|Out-File|New-Item)\b\s+${token}`, "gi"),
  ];
  for (const regex of patterns) for (const match of command.matchAll(regex)) add(match.slice(1).find(Boolean));
  return found;
}
function deny(reason) {
  process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:reason}}));
  return 0;
}
function warning(message) {
  process.stdout.write(JSON.stringify({systemMessage:message,hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:message}}));
  return 0;
}
async function protect(kind) {
  let payload;
  try { payload = await readInput(); }
  catch (error) { return deny(`AIDD 사전 보호 내부 실패: ${error.name}: ${error.message}`); }
  try {
    const policy = loadPolicy(); loadContract();
    if (kind === "file") {
      const paths = targetPaths(payload);
      if (!paths.size) return deny(`${nameOf(payload)} 대상 경로를 해석할 수 없어 사전 보호가 차단했습니다.`);
      const blocked = [...paths].filter(path => policy.generated_roots.some(root => under(path, root))).sort();
      if (blocked.length) return deny(`파생 산출물은 직접 수정할 수 없습니다: ${blocked.join(", ")}. project/.aidd/ssot 또는 .ai 정본을 수정하고 generate/sync-ai를 실행하세요.`);
    } else if (kind === "shell") {
      const command = commandText(payload);
      if (!command) return deny(`${nameOf(payload)} 명령 문자열을 해석할 수 없어 사전 보호가 차단했습니다.`);
      if (policy.destructive_command_patterns.some(pattern => new RegExp(pattern, "i").test(command)))
        return deny("되돌리기 어렵거나 외부 상태를 바꾸는 명령은 훅에서 차단했습니다. 정확한 대상, 롤백과 고객 승인을 확인한 별도 경로를 사용하세요.");
      const writes = policy.shell_write_patterns.some(pattern => new RegExp(pattern, "i").test(command));
      const targets = shellWriteTargets(command);
      const normalized = command.replaceAll("\\", "/").toLowerCase();
      if (writes && ([...targets].some(path => policy.generated_roots.some(root => under(path, root))) || policy.generated_roots.some(root => normalized.includes(root.toLowerCase()))))
        return deny("셸을 통한 파생 산출물 직접 쓰기는 차단했습니다. 정본을 수정하고 생성 명령을 사용하세요.");
    } else throw new Error(`unknown protection kind: ${kind}`);
    return 0;
  } catch (error) {
    const paths = kind === "file" ? targetPaths(payload) : new Set();
    if (paths.size && [...paths].every(path => RECOVERY_PATHS.has(path.toLowerCase()))) return 0;
    return deny(`AIDD 사전 보호 내부 실패: ${error.name}: ${error.message}`);
  }
}
function redact(text) {
  return text
    .replace(/\b(?:sk|rk|pk)-[A-Za-z0-9_-]{16,}\b/g, "[REDACTED_API_KEY]")
    .replace(/\b(?:ghp|github_pat)_[A-Za-z0-9_]{16,}\b/g, "[REDACTED_GIT_TOKEN]")
    .replace(/(bearer\s+)[A-Za-z0-9._~+/-]{12,}/gi, "$1[REDACTED]")
    .replace(/((?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*)[^\s'"]+/gi, "$1[REDACTED]");
}
function conversationText(payload, role) {
  const keys = role === "user" ? ["prompt", "user_prompt", "userPrompt", "message", "text"] : ["last_assistant_message", "assistant_message", "assistantMessage", "response", "output", "text"];
  for (const source of [payload, inputOf(payload)]) for (const key of keys)
    if (typeof source[key] === "string" && source[key].trim()) return source[key];
  return null;
}
async function localLog(platform, role) {
  if (process.env.AIDD_LOCAL_CONVERSATION_LOG === "0") return 0;
  try {
    const payload = await readInput(); let content = conversationText(payload, role); if (!content) return 0;
    const settings = loadContract().local_conversation_log;
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23"}).formatToParts(now);
    const part = name => parts.find(item => item.type === name)?.value;
    const day = `${part("year")}-${part("month")}-${part("day")}`;
    const path = join(ROOT, settings.root, `${day.slice(0, 7)}/${day}.md`);
    content = redact(content);
    if (content.length > settings.max_entry_chars) content = `${content.slice(0, settings.max_entry_chars)}\n[TRUNCATED]`;
    mkdirSync(dirname(path), {recursive:true});
    const size = existsSync(path) ? statSync(path).size : 0;
    if (size >= settings.max_daily_file_bytes) return 0;
    const header = size === 0 ? `# ${day} 대화 원문\n\n` : "";
    const entry = `## ${part("hour")}:${part("minute")}:${part("second")} · ${platform} · ${role === "user" ? "사용자" : "AI"}\n\n${content}\n\n---\n\n`;
    appendFileSync(path, header + entry, "utf8");
  } catch (error) { process.stderr.write(`AIDD local-log warning: ${error.name}\n`); }
  return 0;
}
function runNode(script, args, timeout=30000) {
  const result = spawnSync(process.execPath, [join(ROOT, script), ...args], {cwd:ROOT, encoding:"utf8", timeout});
  return {code:result.status ?? 1, output:`${result.stdout ?? ""}${result.stderr ?? ""}`.trim()};
}
function allFiles(root) {
  if (!existsSync(root)) return [];
  const result=[]; for (const entry of readdirSync(root, {withFileTypes:true})) {
    const path=join(root,entry.name); if(entry.isDirectory()) result.push(...allFiles(path)); else if(entry.isFile()) result.push(path);
  } return result;
}
function digest(path) { return createHash("sha256").update(readFileSync(path)).digest("hex"); }
function skillMap(root) { return new Map(allFiles(root).map(path => [slash(relative(root,path)),digest(path)])); }
function compareSkills(common, provider, label) {
  const errors=[]; for(const [path,hash] of common) if(!provider.has(path)) errors.push(`skill missing: ${label}/${path}`); else if(provider.get(path)!==hash) errors.push(`skill drift: ${label}/${path}`);
  for(const path of provider.keys()) if(!common.has(path)) errors.push(`stale provider skill: ${label}/${path}`); return errors;
}
function nestedStrings(value, output=[]) { if(typeof value==="string") output.push(value); else if(Array.isArray(value)) value.forEach(item=>nestedStrings(item,output)); else if(value&&typeof value==="object") Object.values(value).forEach(item=>nestedStrings(item,output)); return output; }
export function harnessErrors() {
  const errors=[]; let contract={events:{}};
  try { const policy=loadPolicy(); for(const key of ["destructive_command_patterns","shell_write_patterns"]) policy[key].forEach(pattern=>new RegExp(pattern,"i")); } catch(error){errors.push(`policy: ${error.name}: ${error.message}`);}
  try { contract=loadContract(); if(JSON.stringify([...contract.recovery_paths].sort())!==JSON.stringify([...RECOVERY_PATHS].sort())) errors.push("contract: recovery_paths does not match runtime allow-list"); } catch(error){errors.push(`contract: ${error.name}: ${error.message}`);}
  for(const rel of [".claude/settings.json",".codex/hooks.json"]) try {
    const hooks=readJson(join(ROOT,rel)).hooks??{};
    for(const event of Object.keys(contract.events??{})) {
      if(!(event in hooks)) errors.push(`${rel}: missing event ${event}`);
      const encoded=JSON.stringify(hooks[event]??[]);
      for(const token of contract.events[event].required_tokens??[]) if(!encoded.includes(token)) errors.push(`${rel}: ${event} missing wiring token ${token}`);
    }
    for(const command of nestedStrings(hooks)) {
      if(/(?:python(?:3)?|py\s+-3|\.py\b)/i.test(command)) errors.push(`${rel}: Python hook execution is forbidden: ${command.slice(0,160)}`);
      if(command.includes("aidd_hook")&&!command.includes("aidd_hook.mjs")) errors.push(`${rel}: hook target must be .ai/tools/aidd_hook.mjs`);
    }
  } catch(error){errors.push(`${rel}: ${error.name}: ${error.message}`);}
  const major=Number(process.versions.node.split(".")[0]); if(major<22) errors.push(`Node.js 22+ required; current ${process.versions.node}`);
  if(!existsSync(join(ROOT,".ai/tools/aidd_hook.mjs"))) errors.push("canonical Node hook runtime missing");
  let common=skillMap(join(ROOT,".ai/skills"));
  if(repoRole()==="kit-source") for(const [path,hash] of skillMap(join(ROOT,".aidd-kit-dev/skills"))) { if(common.has(path)) errors.push(`maintainer skill collides with portable skill: ${path}`); common.set(path,hash); }
  for(const rel of [".agents/skills",".claude/skills"]) errors.push(...compareSkills(common,skillMap(join(ROOT,rel)),rel));
  return errors;
}
function selfTest(asHook) { const errors=harnessErrors(); if(errors.length){const message=`AIDD 하네스 self-test 경고:\n- ${errors.join("\n- ")}`; if(asHook){process.stdout.write(message);return 0;} process.stderr.write(`${message}\n`);return 1;} if(!asHook) console.log("AIDD harness self-test passed"); return 0; }
function sessionBrief() {
  const script=repoRole()==="kit-source"?".aidd-kit-dev/tools/kit.mjs":".ai/tools/aidd.mjs";
  const args=repoRole()==="kit-source"?["status"]:["status","--level","executive"];
  const result=runNode(script,args); process.stdout.write(`${repoRole()==="kit-source"?"# AIDD Kit 관리 세션 브리핑":"# AIDD 세션 브리핑"}\n\n${result.output}`.slice(0,9000)); return 0;
}
async function postCheck(){try{const payload=await readInput();let paths=targetPaths(payload);if(!paths.size)paths=shellWriteTargets(commandText(payload));const messages=[];if([...paths].some(path=>under(path,".ai"))){const errors=harnessErrors();if(errors.length)messages.push(`공통 AI 정본 변경 뒤 provider 파생물이 어긋났습니다. node ${repoRole()==="kit-source"?".aidd-kit-dev/tools/kit.mjs sync-providers":".ai/tools/aidd.mjs sync-ai"}를 실행하세요. ${errors.slice(0,5).join("; ")}`);}if(repoRole()==="kit-source"&&[...paths].some(path=>under(path,".ai")||under(path,".aidd-kit-dev"))){const result=runNode(".aidd-kit-dev/tools/kit.mjs",["validate"]);if(result.code)messages.push(`Kit 명세·export 경계 검증 경고:\n${result.output.slice(0,4000)}`);}if([...paths].some(path=>under(path,"project/src")))messages.push("소스 변경 뒤 문서 현행화 후보를 감지했습니다. node .ai/tools/aidd.mjs document-impact로 범위를 확인하세요.");return messages.length?warning(messages.join("\n\n")):0;}catch(error){return warning(`AIDD 사후 검사 내부 경고: ${error.name}: ${error.message}`);}}

function option(name, fallback=null){const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:fallback;}
const action=process.argv[2]; let code=0;
if(action==="protect") code=await protect(option("--kind"));
else if(action==="local-log") code=await localLog(option("--platform"),option("--role"));
else if(action==="post-check") code=await postCheck();
else if(action==="session-brief") code=sessionBrief();
else if(action==="self-test") code=selfTest(process.argv.includes("--hook"));
else {process.stderr.write("usage: aidd_hook.mjs protect|post-check|local-log|session-brief|self-test\n");code=2;}
process.exitCode=code;
