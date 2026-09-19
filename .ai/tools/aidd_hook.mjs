#!/usr/bin/env node
/** Provider-neutral AIDD hook guard. Node.js 22+, no package dependencies. */

import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
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
const APPROVAL_REVISION_PATHS = [
  ".ai/hooks/policy.json", ".ai/hooks/contract.json", ".ai/tools/aidd.mjs", ".ai/tools/aidd_hook.mjs", ".claude/settings.json", ".codex/hooks.json",
];
const HOOK_MAINTENANCE_PATHS = new Set([
  ...APPROVAL_REVISION_PATHS, ".ai/hooks/README.md", ".ai/tests/harness.test.mjs", ".ai/spec/conformance.md",
  ".ai/docs/guides/aidd-kit-guide.md", ".ai/docs/guides/project-team-guide.md", "AGENTS.md",
]);
const KIT_HOOK_MAINTENANCE_PATHS = new Set([
  ".aidd-kit-dev/changes/KIT-CHG-004.json", ".aidd-kit-dev/decisions/KIT-ADR-007.json", ".aidd-kit-dev/evidence/KIT-EVD-010.json", ".aidd-kit-dev/releases/UNRELEASED.md",
  ".aidd-kit-dev/export/AGENTS.md", ".aidd-kit-dev/export/.claude/settings.json", ".aidd-kit-dev/export/.codex/hooks.json", ".aidd-kit-dev/tests/kit.test.mjs",
]);
const APPROVAL_DECLARATION = "AIDD 훅을 검토했고 승인했습니다";
const EXISTING_APPROVAL_CONFIRMATION = "현재 세션 시작 전에 이미 모든 AIDD 훅이 승인된 상태였습니다";
const NEW_APPROVAL_CONFIRMATION = "현재 세션 시작 후 AIDD 훅을 새로 승인했습니다";
const RESTART_CONFIRMATION = "새 창에서 다시 시작했고 훅이 승인된 상태입니다";

function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
function slash(value) { return value.split(sep).join("/"); }
function codexClientKind(environment=process.env) {
  const gate=loadContract().approval_gate, origin=(environment[gate.windows_desktop_origin_environment]??"").trim().toLowerCase(),desktopPackage=String(environment[gate.windows_desktop_package_environment]??"").trim();
  if(origin===gate.windows_desktop_origin_value.toLowerCase()||desktopPackage)return "windows-desktop";
  if(origin===gate.cli_origin_value.toLowerCase())return "cli";
  if(!origin&&gate.cli_origin_absence_means_cli===true)return "cli";
  return "unknown";
}
function approvalRoot() { return process.env.AIDD_HOOK_APPROVAL_DIR ? resolve(process.env.AIDD_HOOK_APPROVAL_DIR) : join(ROOT, "chat-history/.aidd-hook-approvals"); }
function sessionIdOf(payload) { const value=payload?.session_id??payload?.sessionId; return typeof value==="string"&&value.trim()?value.trim():null; }
function sessionKey(sessionId) { return createHash("sha256").update(sessionId).digest("hex"); }
function approvalStatePath() { return join(approvalRoot(), "hook-state.json"); }
function emptyApprovalState() { return {version:2,current_revision:null,revision_changed_at:null,restart_required:null,sessions:{}}; }
function readApprovalState() { try { const value=readJson(approvalStatePath()); return value?.version===2&&value.sessions&&!Array.isArray(value.sessions)?value:emptyApprovalState(); } catch { return emptyApprovalState(); } }
function writeApprovalState(value) { mkdirSync(approvalRoot(), {recursive:true}); writeFileSync(approvalStatePath(), `${JSON.stringify(value)}\n`, "utf8"); }
function currentHookRevision() {
  const hash=createHash("sha256");
  for (const path of APPROVAL_REVISION_PATHS) {
    hash.update(`${path}\0`);
    try { hash.update(readFileSync(join(ROOT,path))); } catch { hash.update("[missing]"); }
    hash.update("\0");
  }
  return hash.digest("hex");
}
function ensureApprovalState(sessionId) {
  const state=readApprovalState(), revision=currentHookRevision(), now=new Date().toISOString(); let changed=false;
  if (state.current_revision!==revision) {
    state.current_revision=revision; state.revision_changed_at=now; state.restart_required=null; changed=true;
  }
  let session=null;
  if (sessionId) {
    const key=sessionKey(sessionId); session=state.sessions[key];
    if (!session || session.session_key!==key) {
      session={session_key:key,start_revision:revision,state:"unconfirmed",observed_paths:[],started_at:now};
      state.sessions[key]=session; changed=true;
    }
  }
  if (changed) writeApprovalState(state);
  return {state,session,revision};
}
function writeStateIfChanged(state, changed) { if (changed) writeApprovalState(state); }
function sessionIsCurrent(session, revision) { return !!session && session.start_revision===revision; }
function isMaintenancePath(path) { return HOOK_MAINTENANCE_PATHS.has(path)||(repoRole()==="kit-source"&&KIT_HOOK_MAINTENANCE_PATHS.has(path)); }
function isMaintenancePaths(paths) { return paths.size>0&&[...paths].every(isMaintenancePath); }
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
  const gate=value.approval_gate;
  if (!gate || gate.platform!=="codex" || gate.unknown_tool_behavior!=="deny" || gate.windows_desktop_origin_environment!=="CODEX_INTERNAL_ORIGINATOR_OVERRIDE" || gate.windows_desktop_origin_value!=="Codex Desktop" || gate.windows_desktop_package_environment!=="CODEX_WINDOWS_SANDBOX_PACKAGE_FAMILY" || gate.cli_origin_value!=="Codex CLI" || gate.cli_origin_absence_means_cli!==true || gate.unknown_client_behavior!=="require_new_session" || gate.composed_shell_command_behavior!=="deny" || gate.windows_desktop_new_approval_requires_new_session!==true || gate.cli_new_approval_current_session_effective!==true || gate.cli_revision_reapproval_current_session_effective!==true || !Array.isArray(gate.locked_read_only_tools))
    throw new Error("contract approval_gate is malformed");
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
function normalizeApprovalMessage(value) {
  return value.normalize("NFKC").toLowerCase()
    .replace(/[`'"“”‘’()[\]{}<>]/g, " ")
    .replace(/[.,!?。…·:;/\\|*_~#>-]+/g, " ")
    .replace(/\s+/g, " ").trim();
}
function approvalMessageKind(value, state) {
  const raw=value.normalize("NFKC");
  const text=normalizeApprovalMessage(value);
  if (!text) return null;
  const negated=/(?:안|못)\s*(?:검토|확인|승인|신뢰|했|됐|되)|(?:검토|확인|승인|신뢰).{0,10}(?:안\s*했|못\s*했|하지\s*않|되지\s*않|아니|전(?:입니다|이다|임)?)/.test(text);
  const uncertain=/[?？]\s*$/.test(raw)||/(?:모르|기억나지|확실하지|아마|인\s*것\s*같|한\s*것\s*같|인가요|나요|까요|맞나요|말하면|쓰면|입력하면|예시)/.test(text);
  if (negated||uncertain) return null;
  const approved=/(?:승인|신뢰)(?:을|를|은|는|이|가)?\s*(?:했|함|완료|마쳤|됐|된|되어|되었|받았|상태)/.test(text);
  if (state==="unconfirmed"||state==="declared") {
    if (/^(?:1|1번|첫\s*번째|첫째)$/.test(text)) return "existing";
    if (/^(?:2|2번|두\s*번째|둘째)$/.test(text)) return "new";
    const existing=/(?:이번\s*(?:codex\s*)?세션\s*(?:시작\s*)?전|세션\s*시작\s*전|이미|기존|예전|사전|원래).{0,18}(?:승인|신뢰)|(?:승인|신뢰).{0,18}(?:되어\s*있|돼\s*있|된\s*상태|했었)/.test(text);
    const current=/(?:이번|현재|이)\s*(?:codex\s*)?(?:세션|창)\s*(?:(?:시작\s*)?(?:후|뒤)|에서|중에).{0,18}(?:승인|신뢰)|(?:새로|방금|지금).{0,18}(?:승인|신뢰)|(?:승인|신뢰).{0,18}(?:새로|방금|지금)/.test(text);
    if (approved&&existing&&!current) return "existing";
    if (approved&&current&&!existing) return "new";
    return state==="unconfirmed"&&approved?"declared":null;
  }
  if (state==="restart") {
    const newSession=/(?:새|다른)\s*(?:(?:codex|앱)\s*)?(?:창|세션)/.test(text);
    const restarted=/(?:다시\s*시작|재시작|새로\s*(?:열|시작)|열었|시작했)/.test(text);
    return approved&&newSession&&restarted?"restarted":null;
  }
  return null;
}
function approvalInstruction() { return `AIDD 훅을 직접 검토·신뢰했다면 승인 시점을 다음 두 선택지 중 하나로 알려주세요: 1) ${EXISTING_APPROVAL_CONFIRMATION} 2) ${NEW_APPROVAL_CONFIRMATION}. 답변은 \`1\` 또는 \`2\`만 입력해도 되며, 그 숫자는 훅을 직접 검토·승인했다는 확인도 함께 뜻합니다. 숫자 대신 자연스럽게 확인할 수도 있고 정해진 문구를 그대로 쓸 필요는 없습니다(예: \`${APPROVAL_DECLARATION}\`).`; }
function commandArgs(command) { return command.match(/(?:"[^"]*"|'[^']*'|[^\s])+/g)?.map(value=>value.replace(/^['"]|['"]$/g,""))??[]; }
function explicitGitAddPaths(command) {
  const match=command.trim().match(/^git\s+add\s+(.*)$/i); if (!match) return null;
  const args=commandArgs(match[1]); if (!args.length) return null;
  if (args[0]==="--") args.shift();
  if (!args.length||args.some(value=>value==="."||/[*?[]/.test(value)||value.startsWith(":")||value.startsWith("-"))) return null;
  const paths=new Set(args.map(repoPath).filter(Boolean)); return paths.size===args.length?paths:null;
}
function stagedPaths() {
  const run=spawnSync("git",["diff","--cached","--name-only"],{cwd:ROOT,encoding:"utf8"});
  if(run.error||run.status!==0)return null;
  return new Set(String(run.stdout??"").split(/\r?\n/).map(repoPath).filter(Boolean));
}
function isSafeCommitCommand(command) {
  const args=commandArgs(command.trim());
  if(args.length<4||args[0]?.toLowerCase()!=="git"||args[1]?.toLowerCase()!=="commit")return false;
  for(let index=2;index<args.length;index++){
    const value=args[index];
    if(value==="-m"||value==="--message"){if(++index>=args.length)return false;continue;}
    if((value.startsWith("-m")&&value.length>2)||value.startsWith("--message="))continue;
    return false;
  }
  return true;
}
function isCloseOutCommand(command, session) {
  const paths=explicitGitAddPaths(command);
  if (paths) return paths.size>0&&[...paths].every(path=>session.observed_paths?.includes(path));
  if(!isSafeCommitCommand(command))return false;
  const staged=stagedPaths();
  return !!staged&&staged.size>0&&[...staged].every(path=>session.observed_paths?.includes(path));
}
function isReadOnlyCommand(command) {
  const value=command.trim();
  if(/^(?:git\s+(?:diff|log|show)\b).*\s--output(?:=|\s)/i.test(value)||/^rg\b.*\s--pre(?:=|\s)/i.test(value))return false;
  if(/^git\s+branch\b/i.test(value)&&!/^git\s+branch(?:\s+--show-current)?\s*$/i.test(value))return false;
  return /^(?:git\s+(?:status|diff|log|show|rev-parse)\b|git\s+branch(?:\s+--show-current)?\s*$|rg\b|Get-(?:Content|ChildItem)\b|Test-Path\b|(?:dir|ls|type)\b|node\s+(?:\.ai[\\/]tools[\\/]aidd\.mjs\s+hook-trust-status\b|\.ai[\\/]tools[\\/]aidd_hook\.mjs\s+(?:self-test|approval-status)\b|\.aidd-kit-dev[\\/]tools[\\/]kit\.mjs\s+(?:status|validate)\b))/i.test(value);
}
function isMaintenanceCommand(command) {
  const value=command.trim().replaceAll("\\","/");
  return /^(?:node\s+--check\s+\.ai\/tools\/aidd(?:_hook)?\.mjs\s*|node\s+\.ai\/tools\/aidd_hook\.mjs\s+self-test(?:\s+--hook)?\s*|node\s+(?:--check|--test)\s+\.ai\/tests\/[A-Za-z0-9_.*?-]+\.mjs\s*|node\s+(?:--check|--test)\s+\.aidd-kit-dev\/tests\/[A-Za-z0-9_.*?-]+\.mjs\s*|node\s+\.aidd-kit-dev\/tools\/kit\.mjs\s+(?:sync-providers|validate)\s*)$/i.test(value);
}
function isReadOnlyTool(payload) {
  const name=nameOf(payload).toLowerCase().replace(/[^a-z0-9]/g,"");
  return new Set(loadContract().approval_gate.locked_read_only_tools.map(value=>value.toLowerCase().replace(/[^a-z0-9]/g,""))).has(name);
}
function hasUnsafeShellComposition(command){
  let quote=null;
  for(let index=0;index<command.length;index++){
    const char=command[index],next=command[index+1];
    if(quote==="'"){if(char==="'")quote=null;continue;}
    if(quote==='"'){if(char==='"')quote=null;else if(char==='`'||(char==="$"&&next==="("))return true;continue;}
    if(char==="'"||char==='"'){quote=char;continue;}
    if(";\r\n|&<>`".includes(char)||(char==="$"&&next==="("))return true;
  }
  return quote!==null;
}
function lockedToolAllowed(payload, session) {
  if (isReadOnlyTool(payload)) return true;
  const paths=targetPaths(payload); if (isMaintenancePaths(paths)) return true;
  const command=commandText(payload); if (!command) return false;
  if(hasUnsafeShellComposition(command))return false;
  const addPaths=explicitGitAddPaths(command); if(addPaths&&isMaintenancePaths(addPaths)) return true;
  return isReadOnlyCommand(command)||isMaintenanceCommand(command)||isCloseOutCommand(command,session);
}
function lockedReason(session, revision, restart, client=codexClientKind()) {
  if (!sessionIsCurrent(session,revision)) return client!=="cli"
    ? "AIDD 훅 정의가 이 앱 세션 시작 뒤 변경됐습니다. 일반 작업은 금지됩니다. 훅 유지보수, 알려진 읽기 전용 도구와 이 세션이 관측한 경로의 close-out 커밋만 허용됩니다. CLI의 /hooks에서 최신 훅을 승인한 뒤 새 Codex 앱 창에서 다시 시작하세요."
    : "AIDD 훅 정의가 이 CLI 세션 시작 뒤 변경됐습니다. 일반 작업은 최신 훅 승인 전까지 금지됩니다. /hooks에서 최신 AIDD 훅을 직접 검토·승인한 뒤 승인 질문에 `2`로 답하세요. 현재 acknowledge 훅이 그 응답을 받으면 새 CLI 세션 없이 작업을 계속할 수 있습니다. 승인 전에는 훅 유지보수, 알려진 읽기 전용 도구와 이 세션이 관측한 경로의 close-out 커밋만 허용됩니다.";
  if (session?.state === "restart_required") return `Windows Codex 앱에서 AIDD 훅을 이번 세션 시작 후 새로 승인했으므로 이 창에서는 일반 작업이 금지됩니다. 새 Codex 앱 창에서 같은 프로젝트를 다시 시작한 뒤, 새 창에서 재시작했고 훅이 승인된 상태라는 뜻을 명확히 알려주세요. 정해진 문구를 그대로 쓸 필요는 없습니다(예: \`${RESTART_CONFIRMATION}\`).`;
  if (restart) return `Windows Codex 앱에서 AIDD 훅을 새로 승인한 뒤 열린 새 세션입니다. 일반 작업 전에 새 앱 창에서 재시작했고 훅이 승인된 상태라는 뜻을 명확히 알려주세요. 정해진 문구를 그대로 쓸 필요는 없습니다(예: \`${RESTART_CONFIRMATION}\`).`;
  if (session?.state === "declared") return `AIDD 훅 승인 시점을 확인해야 합니다. 사용자에게 다음 두 선택지 중 하나를 고르게 질문하세요: 1) ${EXISTING_APPROVAL_CONFIRMATION} 2) ${NEW_APPROVAL_CONFIRMATION}. \`1\` 또는 \`2\`만 입력해도 처리하며, 답변의 의미가 분명하면 번호·어미·표현이 달라도 받아들이고 정해진 문구를 요구하지 마세요.`;
  return `AIDD 훅 승인 게이트(${client==="windows-desktop"?"Windows Codex 앱":client==="cli"?"Codex CLI":"알 수 없는 Codex 클라이언트"}): 모든 작업이 금지됩니다. ${approvalInstruction()}`;
}
async function approvalGate(platform) {
  if (platform!=="codex") return 0;
  let payload;
  try { payload=await readInput(); }
  catch (error) { return deny(`AIDD 훅 승인 게이트 내부 실패: ${error.name}: ${error.message}`); }
  const sessionId=sessionIdOf(payload); if (!sessionId) return deny(`AIDD 훅 승인 게이트: 세션 ID를 확인할 수 없어 모든 작업을 차단했습니다. ${approvalInstruction()}`);
  const {state,session,revision}=ensureApprovalState(sessionId);
  if (sessionIsCurrent(session,revision)&&session?.state==="approved") return 0;
  const reason=lockedReason(session,revision,state.restart_required,codexClientKind());
  if (lockedToolAllowed(payload,session)) return 0;
  return reason?deny(reason):0;
}
function applyApprovalMessage(state, session, revision, message, client=codexClientKind(), now=new Date().toISOString()) {
  if (!sessionIsCurrent(session,revision)) {
    const kind=approvalMessageKind(message,"unconfirmed");
    if(client==="cli"&&kind==="new"&&!state.restart_required){
      session.start_revision=revision; session.state="approved"; session.confirmed_at=now; session.approval_timing="new_after_revision"; session.client=client; session.revision_reapproved_at=now;
      return true;
    }
    return false;
  }
  const expectedState=state.restart_required?.revision===revision&&state.restart_required.origin_session_key!==session.session_key?"restart":session.state;
  const kind=approvalMessageKind(message,expectedState);
  if (kind==="declared"&&session.state==="unconfirmed") { session.state="declared"; session.declared_at=now; return true; }
  if (kind==="existing"&&["unconfirmed","declared"].includes(session.state)&&!state.restart_required) { session.state="approved"; session.confirmed_at=now; session.approval_timing="existing"; return true; }
  if (kind==="new"&&["unconfirmed","declared"].includes(session.state)&&!state.restart_required) {
    session.state=client==="cli"?"approved":"restart_required"; session.confirmed_at=now; session.approval_timing="new"; session.client=client;
    if(client!=="cli")state.restart_required={revision,origin_session_key:session.session_key,client,created_at:now};
    return true;
  }
  if (kind==="restarted"&&state.restart_required?.revision===revision&&state.restart_required.origin_session_key!==session.session_key) { session.state="approved"; session.confirmed_at=now; session.approval_timing="restarted"; state.restart_required=null; return true; }
  return false;
}
async function acknowledge(platform) {
  if (platform!=="codex") return 0;
  let payload;
  try { payload=await readInput(); }
  catch { return 0; }
  const sessionId=sessionIdOf(payload), message=conversationText(payload,"user")?.trim();
  if (!sessionId || !message) return 0;
  const {state,session,revision}=ensureApprovalState(sessionId);
  const changed=applyApprovalMessage(state,session,revision,message);
  writeStateIfChanged(state,changed);
  return 0;
}
async function approvalStatus(platform) {
  if (!platform&&process.env.CLAUDE_PROJECT_DIR) return 0;
  if (!platform) platform="codex";
  if (platform!=="codex") return 0;
  let payload={}; try { payload=await readInput(); } catch {}
  const sessionId=sessionIdOf(payload); if (!sessionId) { process.stdout.write(`# AIDD 훅 승인 게이트\n\n- AIDD 훅 승인 게이트: 세션 ID를 확인할 수 없어 모든 작업을 차단했습니다. ${approvalInstruction()}`); return 0; }
  const {state,session,revision}=ensureApprovalState(sessionId), reason=sessionIsCurrent(session,revision)&&session?.state==="approved"?`현재 ${codexClientKind()==="windows-desktop"?"Windows Codex 앱":"Codex CLI"} 세션은 최신 훅 리비전에 대해 승인되었습니다.`:lockedReason(session,revision,state.restart_required,codexClientKind());
  process.stdout.write(`# AIDD 훅 승인 게이트\n\n- ${reason}`);
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
    const provider=rel.startsWith(".codex/")?"codex":"claude";
    for(const event of Object.keys(contract.events??{})) {
      if(!(event in hooks)) errors.push(`${rel}: missing event ${event}`);
      const encoded=JSON.stringify(hooks[event]??[]);
      const tokens=[...(contract.events[event].required_tokens??[]),...(contract.events[event].provider_required_tokens?.[provider]??[])];
      for(const token of tokens) if(!encoded.includes(token)) errors.push(`${rel}: ${event} missing wiring token ${token}`);
    }
    for(const command of nestedStrings(hooks)) {
      if(/(?:python(?:3)?|py\s+-3|\.py\b)/i.test(command)) errors.push(`${rel}: Python hook execution is forbidden: ${command.slice(0,160)}`);
      if(command.includes("aidd_hook")&&!command.includes("aidd_hook.mjs")) errors.push(`${rel}: hook target must be .ai/tools/aidd_hook.mjs`);
    }
  } catch(error){errors.push(`${rel}: ${error.name}: ${error.message}`);}
  const major=Number(process.versions.node.split(".")[0]); if(major<22) errors.push(`Node.js 22+ required; current ${process.versions.node}`);
  if(!existsSync(join(ROOT,".ai/tools/aidd_hook.mjs"))) errors.push("canonical Node hook runtime missing");
  const approvalCases=[
    ["unconfirmed","1","existing"],
    ["unconfirmed","2번","new"],
    ["unconfirmed","네, `AIDD 훅` 내용을 확인하고 승인했어요.","declared"],
    ["unconfirmed","응, 승인했어","declared"],
    ["unconfirmed","훅은 아직 검토 안 했어요",null],
    ["unconfirmed","승인했어?",null],
    ["unconfirmed","AIDD 훅을 검토했고 승인했습니다 라고 말하면 돼?",null],
    ["declared","이미 승인되어 있었음","existing"],
    ["declared","1번","existing"],
    ["declared","현재 세션 시작 후 훅을 방금 새로 승인했어","new"],
    ["declared","2번","new"],
    ["declared","이번 세션에서 승인했는지 잘 모르겠어",null],
    ["restart","새 Codex 창을 열어 다시 시작했고 훅도 승인된 상태예요","restarted"],
  ];
  for(const [state,message,expected] of approvalCases){const actual=approvalMessageKind(message,state);if(actual!==expected)errors.push(`approval classifier: ${state} expected ${expected} but got ${actual}`);}
  if(codexClientKind({CODEX_INTERNAL_ORIGINATOR_OVERRIDE:"Codex Desktop"})!=="windows-desktop")errors.push("approval client classifier: Codex Desktop was not detected");
  if(codexClientKind({CODEX_INTERNAL_ORIGINATOR_OVERRIDE:"Codex CLI"})!=="cli")errors.push("approval client classifier: Codex CLI was not detected");
  if(codexClientKind({})!=="cli")errors.push("approval client classifier: origin-free CLI was not detected");
  if(codexClientKind({CODEX_INTERNAL_ORIGINATOR_OVERRIDE:"Unexpected Client"})!=="unknown")errors.push("approval client classifier: unexpected origin was not classified as unknown");
  if(codexClientKind({CODEX_WINDOWS_SANDBOX_PACKAGE_FAMILY:"OpenAI.Codex"})!=="windows-desktop")errors.push("approval client classifier: Windows package was not detected as Desktop");
  for(const tool_name of ["web.run","web__run","webrun"])if(!isReadOnlyTool({tool_name}))errors.push(`approval read-only classifier: ${tool_name} was not detected`);
  if(!lockedToolAllowed({tool_name:"Bash",tool_input:{command:"git add -- .ai/tools/aidd_hook.mjs"}},{observed_paths:[]}))errors.push("approval close-out classifier: explicit portable hook-maintenance staging was denied");
  if(repoRole()==="kit-source"&&!lockedToolAllowed({tool_name:"Bash",tool_input:{command:"git add -- .aidd-kit-dev/evidence/KIT-EVD-010.json"}},{observed_paths:[]}))errors.push("approval close-out classifier: explicit Kit hook-maintenance staging was denied");
  if(lockedToolAllowed({tool_name:"Bash",tool_input:{command:"git add -- project/src/unrelated.js"}},{observed_paths:[]}))errors.push("approval close-out classifier: unrelated staging was allowed");
  for(const command of ["git status --short; Set-Content project/src/x.js payload","git status --short | Set-Content project/src/x.js","git status --short > project/status.txt","git status --short $(Set-Content project/src/x.js payload)","git diff --output=project/diff.txt","git branch unsafe-write","node --test project/src/unsafe.test.mjs","node .ai/tools/aidd.mjs add-module --id MOD-UNSAFE --name unsafe --purpose unsafe"])
    if(lockedToolAllowed({tool_name:"Bash",tool_input:{command}},{observed_paths:[]}))errors.push(`approval read-only classifier allowed unsafe command: ${command}`);
  const revision="self-test-revision", at="2026-09-19T00:00:00.000Z";
  let state={restart_required:null}, session={session_key:"existing",start_revision:revision,state:"unconfirmed"};
  if(!applyApprovalMessage(state,session,revision,"1","windows-desktop",at)||session.state!=="approved")errors.push("approval transition: direct existing choice did not approve the session");
  state={restart_required:null}; session={session_key:"declared",start_revision:revision,state:"unconfirmed"};
  if(!applyApprovalMessage(state,session,revision,"승인했어","windows-desktop",at)||session.state!=="declared")errors.push("approval transition: declaration did not enter declared state");
  if(!applyApprovalMessage(state,session,revision,"1번","windows-desktop",at)||session.state!=="approved")errors.push("approval transition: existing choice after declaration did not approve the session");
  state={restart_required:null}; session={session_key:"desktop",start_revision:revision,state:"unconfirmed"};
  if(!applyApprovalMessage(state,session,revision,"2번","windows-desktop",at)||session.state!=="restart_required"||state.restart_required?.origin_session_key!=="desktop")errors.push("approval transition: Windows Desktop new approval did not require restart");
  const restarted={session_key:"desktop-new",start_revision:revision,state:"unconfirmed"};
  if(!applyApprovalMessage(state,restarted,revision,"새 앱 창에서 다시 시작했고 훅도 승인된 상태야","windows-desktop",at)||restarted.state!=="approved"||state.restart_required!==null)errors.push("approval transition: Windows Desktop restart confirmation did not approve the new session");
  state={restart_required:null}; session={session_key:"cli",start_revision:revision,state:"declared"};
  if(!applyApprovalMessage(state,session,revision,"2번","cli",at)||session.state!=="approved"||state.restart_required!==null)errors.push("approval transition: Codex CLI new approval unexpectedly required an app restart");
  state={restart_required:null}; session={session_key:"cli-stale",start_revision:"old-revision",state:"approved"};
  if(!applyApprovalMessage(state,session,revision,"2","cli",at)||session.state!=="approved"||session.start_revision!==revision||session.approval_timing!=="new_after_revision")errors.push("approval transition: stale Codex CLI session did not accept current acknowledge reapproval");
  state={restart_required:null}; session={session_key:"desktop-stale",start_revision:"old-revision",state:"approved"};
  if(applyApprovalMessage(state,session,revision,"2","windows-desktop",at)||session.start_revision===revision)errors.push("approval transition: stale Windows Desktop session bypassed the new-session requirement");
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
function recordObservedPaths(payload, platform) {
  if (platform!=="codex") return;
  const sessionId=sessionIdOf(payload); if (!sessionId) return;
  const {state,session}=ensureApprovalState(sessionId); if (!session) return;
  const paths=targetPaths(payload); for (const path of shellWriteTargets(commandText(payload))) paths.add(path);
  if (!paths.size) return;
  const known=new Set(session.observed_paths??[]); let changed=false;
  for (const path of paths) if (!known.has(path)) { known.add(path); changed=true; }
  if (changed) { session.observed_paths=[...known].sort(); writeApprovalState(state); }
}
async function postCheck(platform){try{const payload=await readInput();recordObservedPaths(payload,platform);let paths=targetPaths(payload);if(!paths.size)paths=shellWriteTargets(commandText(payload));const messages=[];if([...paths].some(path=>under(path,".ai"))){const errors=harnessErrors();if(errors.length)messages.push(`공통 AI 정본 변경 뒤 provider 파생물이 어긋났습니다. node ${repoRole()==="kit-source"?".aidd-kit-dev/tools/kit.mjs sync-providers":".ai/tools/aidd.mjs sync-ai"}를 실행하세요. ${errors.slice(0,5).join("; ")}`);}if(repoRole()==="kit-source"&&[...paths].some(path=>under(path,".ai")||under(path,".aidd-kit-dev"))){const result=runNode(".aidd-kit-dev/tools/kit.mjs",["validate"]);if(result.code)messages.push(`Kit 명세·export 경계 검증 경고:\n${result.output.slice(0,4000)}`);}if([...paths].some(path=>under(path,"project/src")))messages.push("소스 변경 뒤 문서 현행화 후보를 감지했습니다. node .ai/tools/aidd.mjs document-impact로 범위를 확인하세요.");return messages.length?warning(messages.join("\n\n")):0;}catch(error){return warning(`AIDD 사후 검사 내부 경고: ${error.name}: ${error.message}`);}}

function option(name, fallback=null){const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:fallback;}
const action=process.argv[2]; let code=0;
if(action==="approval-gate") code=await approvalGate(option("--platform"));
else if(action==="acknowledge") code=await acknowledge(option("--platform"));
else if(action==="approval-status") code=await approvalStatus(option("--platform"));
else if(action==="protect") code=await protect(option("--kind"));
else if(action==="local-log") code=await localLog(option("--platform"),option("--role"));
else if(action==="post-check") code=await postCheck(option("--platform"));
else if(action==="session-brief") code=sessionBrief();
else if(action==="self-test") code=selfTest(process.argv.includes("--hook"));
else {process.stderr.write("usage: aidd_hook.mjs approval-gate|acknowledge|approval-status|protect|post-check|local-log|session-brief|self-test\n");code=2;}
process.exitCode=code;
