import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT=resolve(import.meta.dirname,"../..");
const AIDD=join(ROOT,".ai/tools/aidd.mjs");
const FIXTURE=join(ROOT,".aidd-kit-dev/fixtures/reference-project");
const run=(args,input="")=>spawnSync(process.execPath,[AIDD,...args],{cwd:ROOT,input,encoding:"utf8"});

test("Node CLI parses",()=>{const result=spawnSync(process.execPath,["--check",AIDD],{encoding:"utf8"});assert.equal(result.status,0,result.stderr);});
test("kit source stop hook uses Node validation",()=>{const result=run(["hook","--platform","codex","--event","Stop"],JSON.stringify({stop_hook_active:true}));assert.equal(result.status,0);assert.equal(result.stdout.trim(),"{}");});
test("hook trust status is read only",()=>{const before=readFileSync(join(ROOT,".codex/hooks.json"));const result=run(["hook-trust-status"]);assert.ok([0,1].includes(result.status));assert.match(result.stdout,/TRUST_RECORD_FOUND|REVIEW_REQUIRED/);assert.deepEqual(readFileSync(join(ROOT,".codex/hooks.json")),before);});
test("fixture contains canonical project data",()=>{const project=JSON.parse(readFileSync(join(FIXTURE,".aidd/ssot/project.json"),"utf8"));assert.ok(project.project_id);assert.ok(project.name);});
test("all public scripts use Node shebang",()=>{for(const file of [AIDD,join(ROOT,".ai/tools/aidd_hook.mjs"),join(ROOT,".aidd-kit-dev/tools/kit.mjs")])assert.match(readFileSync(file,"utf8"),/^#!\/usr\/bin\/env node/);});
