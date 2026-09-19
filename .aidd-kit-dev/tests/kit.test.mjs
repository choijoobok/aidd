import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT=resolve(import.meta.dirname,"../..");
const KIT=join(ROOT,".aidd-kit-dev/tools/kit.mjs");
const run=(args,cwd=ROOT)=>spawnSync(process.execPath,[KIT,...args],{cwd,encoding:"utf8"});

test("kit status is readable",()=>{const result=run(["status"]);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/kit-source/);});
test("source and export boundary validate",()=>{const result=run(["validate"]);assert.equal(result.status,0,result.stderr);});
test("template export contains no management tree and carries the approval gate",()=>{const temp=mkdtempSync(join(tmpdir(),"aidd-export-test-")),output=join(temp,"template");try{const result=run(["export","--directory",output]);assert.equal(result.status,0,result.stderr);assert.ok(existsSync(join(output,".ai/tools/aidd.mjs")));assert.ok(!existsSync(join(output,".aidd-kit-dev")));assert.equal(JSON.parse(readFileSync(join(output,".aidd-role.json"),"utf8")).role,"kit-template");const config=JSON.stringify(JSON.parse(readFileSync(join(output,".codex/hooks.json"),"utf8")).hooks);assert.match(config,/approval-gate/);assert.match(config,/acknowledge/);assert.match(config,/approval-status/);assert.doesNotMatch(config,/project-init/);}finally{rmSync(temp,{recursive:true,force:true});}});
test("new project bootstraps with Node only",()=>{const temp=mkdtempSync(join(tmpdir(),"aidd-project-test-")),output=join(temp,"product");try{const result=run(["new-project","--directory",output,"--project-id","TEST","--name","테스트","--mode","greenfield"]);assert.equal(result.status,0,result.stderr);assert.ok(existsSync(join(output,"project/.aidd/ssot/project.json")));assert.equal(JSON.parse(readFileSync(join(output,".aidd-role.json"),"utf8")).role,"product-workspace");const validate=spawnSync(process.execPath,[join(output,".ai/tools/aidd.mjs"),"validate"],{cwd:output,encoding:"utf8"});assert.equal(validate.status,0,validate.stdout+validate.stderr);}finally{rmSync(temp,{recursive:true,force:true});}});
test("no executable Python sources remain",()=>{const result=spawnSync("rg",["--files","--hidden","-g","*.py","-g","!.git/**"],{cwd:ROOT,encoding:"utf8"});assert.ok(result.status===1||!result.stdout.trim(),result.stdout);});
test("current guides and reference runtime records require Node only",()=>{
  const roots=["AGENTS.md","README.md","CLAUDE.md",".ai/docs",".ai/hooks",".ai/skills",".ai/templates",".aidd-kit-dev/guides",".aidd-kit-dev/skills",".aidd-kit-dev/export/AGENTS.md",".aidd-kit-dev/export/README.md",".aidd-kit-dev/export/CLAUDE.md"];
  const paths=[];
  const collect=path=>{if(!existsSync(path))return;const entries=readdirSync(path,{withFileTypes:true});for(const entry of entries){const child=join(path,entry.name);if(entry.isDirectory())collect(child);else if(entry.isFile())paths.push(child);}};
  for(const name of roots){const path=join(ROOT,name);if(!existsSync(path))continue;if(statSync(path).isDirectory())collect(path);else paths.push(path);}
  const forbidden=/(?:\bpython(?:3)?\b|파이썬|\.py\b|\bunittest\b|setup-python|py_compile|\bpy\s+-3\b|\bpip(?:3)?\b)/i;
  const hits=paths.filter(path=>forbidden.test(readFileSync(path,"utf8"))).map(path=>path.slice(ROOT.length+1));
  assert.deepEqual(hits,[]);
  const fixture=join(ROOT,".aidd-kit-dev/fixtures/reference-project/.aidd/ssot");
  for(const name of ["deployment.json","technology.json","operations.json","foundation.json"])assert.doesNotMatch(readFileSync(join(fixture,name),"utf8"),forbidden);
});
test("reference fixture derived runtime guides match Node SSOT and preserve historical evidence",()=>{
  const generated=join(ROOT,".aidd-kit-dev/fixtures/reference-project/docs/generated");
  assert.match(readFileSync(join(generated,"deployment-and-runtime.md"),"utf8"),/Node\.js 22 이상 단기 실행 프로세스/);
  const technology=readFileSync(join(generated,"technology-gates.md"),"utf8");
  assert.match(technology,/외부 패키지 의존성이 없는 Node\.js 표준 라이브러리 CLI/);
  assert.doesNotMatch(technology,/Python 3\.11|Python 검증기/);
  assert.match(readFileSync(join(generated,"operations/runbooks.md"),"utf8"),/전체 Node 테스트/);
  assert.match(readFileSync(join(generated,"foundation/golden-paths.md"),"utf8"),/전체 Node 테스트/);
  assert.match(readFileSync(join(ROOT,".aidd-kit-dev/fixtures/reference-project/.aidd/ssot/evidence.json"),"utf8"),/Python unittest/);
});
test("exported Windows conversation hook writes UTF-8 history",()=>{if(process.platform!=="win32")return;const temp=mkdtempSync(join(tmpdir(),"aidd-log-e2e-")),output=join(temp,"product");try{let result=run(["new-project","--directory",output,"--project-id","LOG-TEST","--name","로그 테스트"]);assert.equal(result.status,0,result.stderr);result=spawnSync("git",["init","-b","main"],{cwd:output,encoding:"utf8"});assert.equal(result.status,0,result.stderr);const config=JSON.parse(readFileSync(join(output,".codex/hooks.json"),"utf8")),hook=config.hooks.UserPromptSubmit.flatMap(item=>item.hooks).find(item=>item.command?.includes("local-log --platform codex --role user")),command=hook?.commandWindows;assert.ok(command,"exported user conversation logger is missing");result=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",command],{cwd:join(output,".ai"),input:JSON.stringify({prompt:"대화 저장 한글 왕복"}),encoding:"utf8"});assert.equal(result.status,0,result.stderr);const month=readdirSync(join(output,"chat-history")).find(name=>/^\d{4}-\d{2}$/.test(name)),file=readdirSync(join(output,"chat-history",month))[0],text=readFileSync(join(output,"chat-history",month,file),"utf8");assert.match(text,/대화 저장 한글 왕복/);assert.match(text,/codex · 사용자/);}finally{rmSync(temp,{recursive:true,force:true});}});
test("exported Windows SessionStart approval notice works before Git initialization",()=>{if(process.platform!=="win32")return;const temp=mkdtempSync(join(tmpdir(),"aidd-trust-e2e-")),output=join(temp,"product");try{const result=run(["new-project","--directory",output,"--project-id","TRUST-TEST","--name","신뢰 테스트"]);assert.equal(result.status,0,result.stderr);assert.ok(!existsSync(join(output,".git")));const config=JSON.parse(readFileSync(join(output,".codex/hooks.json"),"utf8")),trustEntry=config.hooks.SessionStart.find(item=>JSON.stringify(item).includes("hook-trust-status")),trustCommand=trustEntry?.hooks?.[0]?.commandWindows,approvalEntry=config.hooks.SessionStart.find(item=>JSON.stringify(item).includes("approval-status")),approvalCommand=approvalEntry?.hooks?.[1]?.commandWindows;assert.ok(trustCommand,"exported SessionStart must wire hook-trust-status");assert.ok(approvalCommand,"exported SessionStart must wire approval-status");assert.doesNotMatch(trustCommand,/git rev-parse/);assert.doesNotMatch(approvalCommand,/git rev-parse/);let processResult=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",trustCommand],{cwd:output,encoding:"utf8"});assert.ok([0,1].includes(processResult.status),processResult.stderr);assert.match(processResult.stdout,/TRUST_RECORD_FOUND|REVIEW_REQUIRED/);processResult=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",approvalCommand],{cwd:output,input:JSON.stringify({session_id:"template-start"}),encoding:"utf8"});assert.equal(processResult.status,0,processResult.stderr);assert.match(processResult.stdout,/AIDD 훅 승인 게이트/);}finally{rmSync(temp,{recursive:true,force:true});}});
