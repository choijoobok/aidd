#!/usr/bin/env node
/** Isolated Claude file protection hook. Policy is intentionally duplicated. */

import { readFileSync } from "node:fs";

function input(){try{return JSON.parse(readFileSync(0,"utf8")||"{}");}catch{return{};}}
const payload=input();
const raw=payload.tool_input??payload.tool_input_json??payload;
const source=String(typeof raw==="string"?raw:JSON.stringify(raw)).replaceAll("\\","/");
const allowed=["aidd.mjs generate","aidd.mjs terminology-refresh","kit.mjs sync-providers"];
const roots=["project/docs/generated/","build/deliverables/",".agents/skills/",".claude/skills/"];

if(!allowed.some(command=>source.includes(command))){
  const target=roots.find(path=>source.includes(path));
  if(target){console.error(`AIDD generated output is read-only: ${target} Run the matching generator instead.`);process.exitCode=2;}
}
