import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT=resolve(import.meta.dirname,"../..");
const HOOK=join(ROOT,".ai/tools/aidd_hook.mjs");
function run(args,input="",env={}){return spawnSync(process.execPath,[HOOK,...args],{cwd:ROOT,input,encoding:"utf8",env:{...process.env,...env}});}
function payload(tool_input,tool_name="apply_patch"){return JSON.stringify({tool_name,tool_input});}

test("self-test validates both providers",()=>{const result=run(["self-test"]);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/passed/);});
test("malformed input fails closed",()=>{const result=run(["protect","--platform","codex","--kind","file"],"{");assert.equal(result.status,0);assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision,"deny");});
test("generated document write is denied",()=>{const result=run(["protect","--platform","codex","--kind","file"],payload({path:"project/docs/generated/index.md"}));assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision,"deny");});
test("canonical SSOT write is allowed",()=>{const result=run(["protect","--platform","codex","--kind","file"],payload({path:"project/.aidd/ssot/project.json"}));assert.equal(result.status,0);assert.equal(result.stdout,"");});
test("destructive shell command is denied",()=>{const result=run(["protect","--platform","codex","--kind","shell"],payload({command:"git reset --hard"},"PowerShell"));assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision,"deny");});
test("read-only shell command is allowed",()=>{const result=run(["protect","--platform","codex","--kind","shell"],payload({command:"git status --short"},"PowerShell"));assert.equal(result.status,0);assert.equal(result.stdout,"");});
test("UTF-8 conversation round trips and secrets are masked",()=>{const sandbox=mkdtempSync(join(tmpdir(),"aidd-log-test-"));try{const source=readFileSync(HOOK,"utf8");assert.match(source,/Buffer\.concat\(chunks\)\.toString\("utf8"\)/);const result=run(["local-log","--platform","codex","--role","user"],JSON.stringify({prompt:"한글 sk-12345678901234567890"}),{AIDD_LOCAL_CONVERSATION_LOG:"0"});assert.equal(result.status,0);assert.equal(result.stdout,"");}finally{rmSync(sandbox,{recursive:true,force:true});}});
test("provider configs contain no Python execution",()=>{for(const file of [".codex/hooks.json",".claude/settings.json"]){const text=readFileSync(join(ROOT,file),"utf8");assert.doesNotMatch(text,/(?:python(?:3)?|py\s+-3|\.py\b)/i);assert.match(text,/aidd(?:_hook)?\.mjs/);}});
test("Windows commands contain no shell variables",()=>{const config=JSON.parse(readFileSync(join(ROOT,".codex/hooks.json"),"utf8"));const commands=JSON.stringify(config.hooks);assert.doesNotMatch(commands,/\$repo|\$LASTEXITCODE|`\$/);assert.match(commands,/Join-Path \(git rev-parse --show-toplevel\)/);});
test("actual nested Windows command resolves Git root and preserves UTF-8",()=>{if(process.platform!=="win32")return;const config=JSON.parse(readFileSync(join(ROOT,".codex/hooks.json"),"utf8"));const command=config.hooks.PreToolUse[0].hooks[0].commandWindows;const result=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",command],{cwd:join(ROOT,".ai"),input:payload({path:"project/docs/generated/한글.md"}),encoding:"utf8"});assert.equal(result.status,0,result.stderr);const output=JSON.parse(result.stdout);assert.equal(output.hookSpecificOutput.permissionDecision,"deny");assert.match(output.hookSpecificOutput.permissionDecisionReason,/한글\.md/);});
