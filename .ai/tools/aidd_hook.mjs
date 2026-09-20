#!/usr/bin/env node
/** Small provider-neutral AIDD hook adapter. Node.js 22+, standard library only. */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT=resolve(process.env.AIDD_WORKSPACE_ROOT??dirname(fileURLToPath(import.meta.url))+"/../..");
const CONTRACT=join(ROOT,".ai/hooks/contract.json");
const POLICY=join(ROOT,".ai/hooks/policy.json");
const GENERATED=["project/docs/generated/","project/docs/site/"];
const slash=value=>String(value).split(sep).join("/");
const readJson=path=>JSON.parse(readFileSync(path,"utf8"));
function input(){try{return JSON.parse(readFileSync(0,"utf8")||"{}");}catch{return{};}}
function text(value){return typeof value==="string"?value:JSON.stringify(value??{});}
function payloadText(payload){return text(payload.tool_input??payload.tool_input_json??payload);}
function generatedPath(value){
  const source=slash(value).replaceAll("\\","/");
  return GENERATED.find(path=>source.includes(path));
}
function isGenerator(value){return /(?:aidd\.mjs\s+(?:generate|terminology-refresh)|kit\.mjs\s+refresh-fixture-guides)/.test(value);}
function protect(){
  const payload=input(),source=payloadText(payload),target=generatedPath(source);
  if(target&&!isGenerator(source)){
    console.error(`AIDD generated output is read-only: ${target} Run the matching generator instead.`);
    process.exitCode=2;
  }
}
function hookContractErrors(){
  const errors=[];
  let contract,policy;
  try{contract=readJson(CONTRACT);}catch(error){return [`contract.json: ${error.message}`];}
  try{policy=readJson(POLICY);}catch(error){return [`policy.json: ${error.message}`];}
  if(contract.node_runtime?.minimum_major!==22)errors.push("contract must require Node.js 22");
  if(!policy||typeof policy!=="object")errors.push("policy must be an object");
  for(const event of ["SessionStart","PreToolUse","PostToolUse","UserPromptSubmit","Stop"]){
    if(!Array.isArray(contract.events?.[event]?.required_tokens))errors.push(`contract event missing: ${event}`);
  }
  for(const path of [".codex/hooks.json",".claude/settings.json",".aidd-kit-dev/export/.codex/hooks.json",".aidd-kit-dev/export/.claude/settings.json"]){
    try{
      const source=readFileSync(join(ROOT,path),"utf8");JSON.parse(source);
      for(const action of ["session-brief","self-test","protect","post-check","local-log"])if(!source.includes(action))errors.push(`${path}: missing hook action ${action}`);
      if(/approval-gate|approval-status|\backnowledge\b/.test(source))errors.push(`${path}: contains retired approval-gate action`);
    }catch(error){errors.push(`${path}: ${error.message}`);}
  }
  return errors;
}
function selfTest(){
  const errors=hookContractErrors();
  if(errors.length){console.error(`AIDD hook self-test failed:\n- ${errors.join("\n- ")}`);process.exitCode=1;return;}
  console.log("AIDD hook wiring check passed");
}
function sessionBrief(){
  try{
    const role=readJson(join(ROOT,".aidd-role.json")).role;
    console.log(`# AIDD session\n- role: ${role}\n- hooks: protect generated output, refresh terminology after SSOT changes, and keep local conversation logs`);
  }catch{console.log("# AIDD session\n- workspace role marker is unavailable");}
}
function postCheck(){
  const payload=input(),source=payloadText(payload);
  if(source.includes("project/.aidd/ssot/terminology.json")){
    const run=spawnSync(process.execPath,[join(ROOT,".ai/tools/aidd.mjs"),"terminology-refresh"],{cwd:ROOT,encoding:"utf8"});
    if(run.status!==0)console.error(`AIDD terminology refresh needs attention: ${(run.stderr||run.stdout||"unknown error").trim()}`);
  }
  if(source.includes(".ai/skills/")||source.includes(".aidd-kit-dev/skills/"))console.error("AIDD note: run `node .aidd-kit-dev/tools/kit.mjs check` before sharing provider skill changes.");
}
function localLog(role){
  if(process.env.AIDD_LOCAL_CONVERSATION_LOG==="0")return;
  const payload=input(),message=String(payload.prompt??payload.message??payload.text??payload.assistant_message??"").trim();
  if(!message)return;
  const date=new Date(),day=date.toISOString().slice(0,10),folder=join(ROOT,"chat-history",day.slice(0,7));
  mkdirSync(folder,{recursive:true});
  appendFileSync(join(folder,`${day}.md`),`\n## ${role} ${date.toISOString()}\n\n${message.slice(0,16000)}\n`,"utf8");
}
function main(){
  const [action,...args]=process.argv.slice(2);
  if(action==="protect")protect();
  else if(action==="post-check")postCheck();
  else if(action==="self-test")selfTest();
  else if(action==="session-brief")sessionBrief();
  else if(action==="local-log")localLog(args[args.indexOf("--role")+1]??"assistant");
  else {console.error("usage: aidd_hook.mjs session-brief|self-test|protect|post-check|local-log");process.exitCode=2;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
export { hookContractErrors as harnessErrors };
