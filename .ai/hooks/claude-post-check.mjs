#!/usr/bin/env node
/** Isolated Claude PostToolUse hook. Do not import another AIDD hook. */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
function input(){try{return JSON.parse(readFileSync(0,"utf8")||"{}");}catch{return{};}}
const payload=input();
const source=JSON.stringify(payload.tool_input??payload.tool_input_json??payload).replaceAll("\\","/").replace(/\/{2,}/g,"/");
const advisories=[];

if((source.includes("project/.aidd/ssot/terminology.json")||/project\/\.aidd\/ssot\/(?:common|modules\/MOD-[A-Z0-9-]+)\/(?:TRM|TCH)\//.test(source))&&!existsSync(join(ROOT,"project/.aidd/work/write.lock"))){
  const run=spawnSync(process.execPath,[join(ROOT,".ai/tools/aidd.mjs"),"terminology-refresh"],{cwd:ROOT,encoding:"utf8"});
  if(run.status!==0)advisories.push("AIDD terminology refresh needs attention; run `node .ai/tools/aidd.mjs terminology-refresh`.");
}

let role="product-workspace";
try{role=JSON.parse(readFileSync(join(ROOT,".aidd-role.json"),"utf8")).role;}catch{}
const portable=source.includes(".ai/skills/");
const maintainer=source.includes(".aidd-kit-dev/skills/");
if(role==="kit-source"&&(portable||maintainer))advisories.push("AIDD note: run `node .aidd-kit-dev/tools/kit.mjs sync-providers` before sharing skill changes.");
else if((role==="kit-template"||role==="product-workspace")&&portable)advisories.push("AIDD note: run `node .ai/tools/aidd.mjs sync-ai` before sharing skill changes.");

/** Claude Code hides stderr from a hook that exits 0, so an advisory uses the documented exit 2 path. */
if(advisories.length){console.error(advisories.join(" "));process.exitCode=2;}
