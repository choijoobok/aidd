#!/usr/bin/env node
/** Isolated Claude file protection hook. Policy is intentionally duplicated. */

import { readFileSync } from "node:fs";

const roots=["project/docs/generated/","build/deliverables/",".agents/skills/",".claude/skills/"];
const pathKeys=new Set(["file_path","filePath","path","paths","notebook_path","notebookPath","file","files","filename","file_name","source","source_path","destination","destination_path","target","target_path","directory","dir","folder","uri"]);

function input(){try{return JSON.parse(readFileSync(0,"utf8")||"{}");}catch{return{};}}
function normalize(value){return String(value).replaceAll("\\","/").replace(/\/{2,}/g,"/");}
function written(value,key,depth){
  if(depth>6)return[];
  if(typeof value==="string")return pathKeys.has(key)?[normalize(value)]:[];
  if(Array.isArray(value))return value.flatMap(item=>written(item,key,depth+1));
  if(value&&typeof value==="object")return Object.entries(value).flatMap(([name,item])=>written(item,name,depth+1));
  return[];
}

const payload=input();
const raw=payload.tool_input??payload.tool_input_json??payload;
const paths=typeof raw==="string"?[normalize(raw)]:written(raw,"",0);
const target=roots.find(root=>paths.some(path=>path.includes(root)));

if(target){console.error(`AIDD generated output is read-only: ${target} Run the matching generator instead.`);process.exitCode=2;}
