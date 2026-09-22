#!/usr/bin/env node
/** Isolated Codex shell protection hook. Policy is intentionally duplicated. */

import { readFileSync } from "node:fs";

const roots=["project/docs/generated/","project/.aidd/index/","project/.aidd/snapshots/","build/deliverables/",".agents/skills/",".claude/skills/"];
const generators=[/^node\s+\S*aidd\.mjs\s+(?:generate|terminology-refresh)\s*$/,/^node\s+\S*kit\.mjs\s+sync-providers\s*$/];
const mutators=new Set(["rm","rmdir","mv","cp","ln","tee","touch","truncate","dd","install","shred","mkdir","unlink","set-content","add-content","clear-content","out-file","new-item","remove-item","move-item","copy-item","rename-item"]);
const inPlace=new Set(["sed","perl","ruby"]);
const gitMutators=new Set(["checkout","restore","rm","mv","clean","apply","stash"]);
const commandKeys=new Set(["command","cmd","commandline","command_line","script","shell_command","run","input"]);

function input(){try{return JSON.parse(readFileSync(0,"utf8")||"{}");}catch{return{};}}
function normalize(value){return String(value).replaceAll("\\","/").replace(/\/{2,}/g,"/");}
function scripts(value,key,depth){
  if(depth>6)return[];
  if(typeof value==="string")return commandKeys.has(key.toLowerCase())?[normalize(value)]:[];
  if(Array.isArray(value))return value.flatMap(item=>scripts(item,key,depth+1));
  if(value&&typeof value==="object")return Object.entries(value).flatMap(([name,item])=>scripts(item,name,depth+1));
  return[];
}
function name(token){return String(token).split("/").pop().replace(/\.exe$/i,"").toLowerCase();}
function mutating(tokens){
  const first=name(tokens[0]);
  if(mutators.has(first))return true;
  if(inPlace.has(first))return tokens.some(token=>/^--?i/.test(token)||token==="--in-place");
  if(first==="git")return tokens.slice(1).some(token=>gitMutators.has(token.toLowerCase()));
  return false;
}
/** Deny only when a generated root is the target of a mutating command, so reading and documenting stay open. */
function target(script){
  for(const simple of script.split(/(?:\|\||&&|[;|\n])/)){
    const tokens=simple.trim().split(/\s+/).filter(Boolean);
    if(!tokens.length)continue;
    const mutates=mutating(tokens);
    for(let index=0;index<tokens.length;index+=1){
      const token=tokens[index];
      const root=roots.find(value=>token.includes(value));
      if(!root)continue;
      if(mutates||token.startsWith(">")||/^>>?$/.test(tokens[index-1]??""))return root;
    }
  }
  return null;
}

const payload=input();
const raw=payload.tool_input??payload.tool_input_json??payload;
const commands=typeof raw==="string"?[normalize(raw)]:scripts(raw,"",0);
const exempt=commands.some(script=>generators.some(pattern=>pattern.test(script.trim())));
const blocked=commands.filter(script=>!generators.some(pattern=>pattern.test(script.trim()))).map(script=>target(script)).find(Boolean)??(!commands.length&&typeof raw?.path==="string"?roots.find(root=>normalize(raw.path).includes(root)):null);

if(blocked){console.error(`AIDD generated output is read-only: ${blocked} Run the matching generator instead.`);process.exitCode=2;}
