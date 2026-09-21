#!/usr/bin/env node
/** AIDD hook wiring validator. Runtime hooks never import this file or each other. */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const CONTRACT=join(ROOT,".ai/hooks/contract.json");
const POLICY=join(ROOT,".ai/hooks/policy.json");
const RUNTIME_DIR=join(ROOT,".ai/hooks");
const PROVIDERS=[".codex/hooks.json",".claude/settings.json",".aidd-kit-dev/export/.codex/hooks.json",".aidd-kit-dev/export/.claude/settings.json"];
const readJson=path=>JSON.parse(readFileSync(path,"utf8"));

function providerHandlers(provider){
  return Object.entries(provider.hooks??{}).flatMap(([event,groups])=>(groups??[]).flatMap((group,groupIndex)=>(group.hooks??[]).map((handler,handlerIndex)=>({event,groupIndex,handlerIndex,handler}))));
}

function runtimePath(handler){
  const source=[handler.command,...(handler.args??[])].filter(Boolean).join(" ").replaceAll("\\","/");
  const match=source.match(/\.ai\/hooks\/([A-Za-z0-9._-]+\.mjs)/);
  return match?`.ai/hooks/${match[1]}`:null;
}

function providerEventErrors(path,contract){
  const errors=[];
  try{
    const provider=readJson(join(ROOT,path)),hooks=provider.hooks??{};
    for(const [event,definition] of Object.entries(contract.events??{})){
      const source=JSON.stringify(hooks[event]??{});
      for(const token of definition.required_tokens??[])if(!source.includes(token))errors.push(`${path}: ${event} missing ${token}`);
    }
    const providerName=path.includes(".codex/")?"codex":"claude";
    for(const [event,definition] of Object.entries(contract.provider_events?.[providerName]??{})){
      const source=JSON.stringify(hooks[event]??{});
      for(const token of definition.required_tokens??[])if(!source.includes(token))errors.push(`${path}: ${event} missing provider token ${token}`);
      for(const token of definition.forbidden_tokens??[])if(source.includes(token))errors.push(`${path}: ${event} contains provider-forbidden token ${token}`);
    }
    const used=new Set();
    for(const {event,groupIndex,handlerIndex,handler} of providerHandlers(provider)){
      const runtime=runtimePath(handler);
      if(!runtime){errors.push(`${path}: ${event}:${groupIndex}:${handlerIndex} must use one dedicated .ai/hooks runtime`);continue;}
      if(used.has(runtime))errors.push(`${path}: runtime reused by multiple hooks: ${runtime}`);
      used.add(runtime);
      if(!existsSync(join(ROOT,runtime)))errors.push(`${path}: missing isolated runtime ${runtime}`);
      const source=JSON.stringify(handler);
      if(source.includes("aidd_hook.mjs"))errors.push(`${path}: runtime hook must not use the shared validator`);
    }
  }catch(error){errors.push(`${path}: ${error.message}`);}
  return errors;
}

function runtimeIsolationErrors(){
  const errors=[];
  for(const entry of readdirSync(RUNTIME_DIR,{withFileTypes:true})){
    if(!entry.isFile()||!entry.name.endsWith(".mjs"))continue;
    const path=join(RUNTIME_DIR,entry.name),source=readFileSync(path,"utf8");
    for(const match of source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)){
      if(!match[1].startsWith("node:"))errors.push(`.ai/hooks/${entry.name}: local or package import is forbidden: ${match[1]}`);
    }
  }
  return errors;
}

export function harnessErrors(){
  const errors=[];let contract,policy;
  try{contract=readJson(CONTRACT);}catch(error){return[`contract.json: ${error.message}`];}
  try{policy=readJson(POLICY);}catch(error){return[`policy.json: ${error.message}`];}
  if(contract.node_runtime?.minimum_major!==22)errors.push("contract must require Node.js 22");
  if(Number(process.versions.node.split(".")[0])<22)errors.push("hook runtime must be Node.js 22 or newer");
  if(contract.hook_isolation?.priority!==1)errors.push("hook isolation must remain priority 1");
  if(contract.hook_isolation?.shared_runtime_allowed!==false)errors.push("shared hook runtimes must remain forbidden");
  if(!Array.isArray(policy.generated_roots)||!policy.generated_roots.length)errors.push("policy must declare generated_roots");
  for(const event of ["SessionStart","PreToolUse","PostToolUse","UserPromptSubmit","Stop"])if(!Array.isArray(contract.events?.[event]?.required_tokens))errors.push(`contract event missing: ${event}`);
  for(const path of PROVIDERS.filter(path=>existsSync(join(ROOT,path))))errors.push(...providerEventErrors(path,contract));
  errors.push(...runtimeIsolationErrors());
  return errors;
}

function main(){
  if(process.argv[2]!=="self-test"){
    console.error("usage: aidd_hook.mjs self-test --hook");
    process.exitCode=2;
    return;
  }
  const errors=harnessErrors();
  if(errors.length){console.error(`AIDD hook self-test failed:\n- ${errors.join("\n- ")}`);process.exitCode=1;return;}
  console.log("AIDD hook wiring check passed");
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
