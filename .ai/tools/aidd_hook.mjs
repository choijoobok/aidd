#!/usr/bin/env node
/** Small provider-neutral AIDD hook adapter. Node.js 22+, standard library only. */

import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT=resolve(process.env.AIDD_WORKSPACE_ROOT??dirname(fileURLToPath(import.meta.url))+"/../..");
const CONTRACT=join(ROOT,".ai/hooks/contract.json");
const POLICY=join(ROOT,".ai/hooks/policy.json");
const PROVIDERS=[".codex/hooks.json",".claude/settings.json",".aidd-kit-dev/export/.codex/hooks.json",".aidd-kit-dev/export/.claude/settings.json"];
const slash=value=>String(value).split(sep).join("/").replaceAll("\\","/");
const readJson=path=>JSON.parse(readFileSync(path,"utf8"));
function input(){try{return JSON.parse(readFileSync(0,"utf8")||"{}");}catch{return{};}}
function text(value){return typeof value==="string"?value:JSON.stringify(value??{});}
function payloadText(payload){return slash(text(payload.tool_input??payload.tool_input_json??payload));}
function workspaceRole(fallback="product-workspace"){try{return readJson(join(ROOT,".aidd-role.json")).role;}catch{return fallback;}}
const CODEX_HOOK_REVIEW_MESSAGE="[Codex 주의] 훅은 Codex CLI에서 승인해야 작동합니다. CLI의 `/hooks`에서 승인 여부를 반드시 확인하세요. 새로 승인했다면 기존 Windows 앱 세션에는 적용되지 않으므로 새 세션 창을 여세요.";
const CODEX_HOOK_REVIEW_STARTUP_CONTEXT=[
  CODEX_HOOK_REVIEW_MESSAGE,
  "",
  "[Codex 필수 최종 표시] 이 세션의 첫 사용자 요청에 대한 최종 답변(`final_answer`) 첫 줄에 위 `[Codex 주의]` 문구를 그대로 한 번 표시하세요. 진행 메시지(`commentary`)에 표시한 것은 이 요구를 충족한 것으로 보지 않으며, commentary에 이미 표시했더라도 final_answer에서 다시 표시하세요. 이 안내는 비차단 알림이며 사용자의 답변을 요구하거나 작업을 중단하지 마세요."
].join("\n");

export function generatedWriteError(payload,policy=readJson(POLICY)){
  const source=payloadText(payload);
  if((policy.allowed_generators??[]).some(command=>source.includes(command)))return null;
  const target=(policy.generated_roots??[]).map(slash).find(path=>source.includes(path));
  return target?`AIDD generated output is read-only: ${target} Run the matching generator instead.`:null;
}

function protect(){
  const error=generatedWriteError(input());
  if(error){console.error(error);process.exitCode=2;}
}

function providerEventErrors(path,contract){
  const errors=[];
  try{
    const provider=readJson(join(ROOT,path)),hooks=provider.hooks??{};
    for(const [event,definition] of Object.entries(contract.events??{})){
      const source=JSON.stringify(hooks[event]??{});
      for(const token of definition.required_tokens??[])if(!source.includes(token))errors.push(`${path}: ${event} missing ${token}`);
    }
    const providerName=slash(path).includes(".codex/")?"codex":"claude";
    for(const [event,definition] of Object.entries(contract.provider_events?.[providerName]??{})){
      const source=JSON.stringify(hooks[event]??{});
      for(const token of definition.required_tokens??[])if(!source.includes(token))errors.push(`${path}: ${event} missing provider token ${token}`);
      for(const token of definition.forbidden_tokens??[])if(source.includes(token))errors.push(`${path}: ${event} contains provider-forbidden token ${token}`);
    }
    const source=JSON.stringify(provider);
    if(/approval-gate|approval-status|hook-trust-status|\backnowledge\b|restart_required|verify-commit/.test(source))errors.push(`${path}: contains retired approval, restart, or signature behavior`);
  }catch(error){errors.push(`${path}: ${error.message}`);}
  return errors;
}

export function codexHookReviewOutput(source="startup"){
  return {
    continue:true,
    systemMessage:CODEX_HOOK_REVIEW_MESSAGE,
    hookSpecificOutput:{
      hookEventName:"SessionStart",
      additionalContext:source==="startup"?CODEX_HOOK_REVIEW_STARTUP_CONTEXT:CODEX_HOOK_REVIEW_MESSAGE
    }
  };
}

export function skillSyncNotice(payload,currentRole=workspaceRole(),contract=readJson(CONTRACT)){
  const rule=contract.skill_sync_guidance?.[currentRole];
  if(!rule||!(rule.trigger_paths??[]).some(path=>payloadText(payload).includes(path)))return null;
  return `AIDD note: run \`${rule.command}\` before sharing skill changes.`;
}

function codexHookReviewReminder(){
  const payload=input();
  console.log(JSON.stringify(codexHookReviewOutput(payload.source??"startup")));
}

export function harnessErrors(){
  const errors=[];let contract,policy;
  try{contract=readJson(CONTRACT);}catch(error){return[`contract.json: ${error.message}`];}
  try{policy=readJson(POLICY);}catch(error){return[`policy.json: ${error.message}`];}
  if(contract.node_runtime?.minimum_major!==22)errors.push("contract must require Node.js 22");
  if(Number(process.versions.node.split(".")[0])<22)errors.push("hook runtime must be Node.js 22 or newer");
  if(!Array.isArray(policy.generated_roots)||!policy.generated_roots.length)errors.push("policy must declare generated_roots");
  for(const event of ["SessionStart","PreToolUse","PostToolUse","UserPromptSubmit","Stop"])if(!Array.isArray(contract.events?.[event]?.required_tokens))errors.push(`contract event missing: ${event}`);
  for(const role of ["kit-source","kit-template","product-workspace"]){const rule=contract.skill_sync_guidance?.[role];if(!Array.isArray(rule?.trigger_paths)||!rule.trigger_paths.length||!String(rule?.command??"").trim())errors.push(`contract skill sync guidance missing for ${role}`);}
  for(const path of PROVIDERS.filter(path=>existsSync(join(ROOT,path))))errors.push(...providerEventErrors(path,contract));
  return errors;
}

function selfTest(){
  const errors=harnessErrors();
  if(errors.length){console.error(`AIDD hook self-test failed:\n- ${errors.join("\n- ")}`);process.exitCode=1;return;}
  console.log("AIDD hook wiring check passed");
}

function sessionBrief(){
  const role=workspaceRole(null);
  if(role)console.log(`# AIDD session\n- role: ${role}\n- hooks: protect generated output, refresh terminology after SSOT changes, and keep optional local conversation logs`);
  else console.log("# AIDD session\n- workspace role marker is unavailable");
}

function postCheck(){
  const payload=input(),source=payloadText(payload);
  if(source.includes("project/.aidd/ssot/terminology.json")){
    const run=spawnSync(process.execPath,[join(ROOT,".ai/tools/aidd.mjs"),"terminology-refresh"],{cwd:ROOT,encoding:"utf8"});
    if(run.status!==0)console.error("AIDD terminology refresh needs attention; run `node .ai/tools/aidd.mjs terminology-refresh`.");
  }
  const notice=skillSyncNotice(payload);
  if(notice)console.error(notice);
}

function localLog(role){
  if(process.env.AIDD_LOCAL_CONVERSATION_LOG==="0")return;
  const payload=input(),message=String(payload.prompt??payload.message??payload.text??payload.assistant_message??"").trim();
  if(!message)return;
  try{
    const contract=readJson(CONTRACT).local_conversation_log??{},date=new Date(),day=date.toISOString().slice(0,10),folder=join(ROOT,contract.root??"chat-history",day.slice(0,7)),path=join(folder,`${day}.md`),entry=`\n## ${role} ${date.toISOString()}\n\n${message.slice(0,contract.max_entry_chars??16000)}\n`,limit=Number(contract.max_daily_file_bytes??5242880),current=existsSync(path)?statSync(path).size:0;
    if(current+Buffer.byteLength(entry,"utf8")>limit){console.error("AIDD local log size limit reached.");return;}
    mkdirSync(folder,{recursive:true});appendFileSync(path,entry,"utf8");
  }catch{console.error("AIDD local log write failed.");}
}

function main(){
  const [action,...args]=process.argv.slice(2);
  if(action==="protect")protect();
  else if(action==="post-check")postCheck();
  else if(action==="self-test")selfTest();
  else if(action==="session-brief")sessionBrief();
  else if(action==="codex-hook-review-reminder")codexHookReviewReminder();
  else if(action==="local-log")localLog(args[args.indexOf("--role")+1]??"assistant");
  else{console.error("usage: aidd_hook.mjs session-brief|codex-hook-review-reminder|self-test|protect|post-check|local-log");process.exitCode=2;}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
