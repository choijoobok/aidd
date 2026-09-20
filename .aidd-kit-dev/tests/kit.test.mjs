import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT=resolve(import.meta.dirname,"../..");
const KIT=join(ROOT,".aidd-kit-dev/tools/kit.mjs");
const run=(args,cwd=ROOT)=>spawnSync(process.execPath,[KIT,...args],{cwd,encoding:"utf8"});
const runHookCommand=(command,{cwd,input,env={}})=>process.platform==="win32"
  ?spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",command],{cwd,input,encoding:"utf8",env:{...process.env,...env}})
  :spawnSync("/bin/sh",["-lc",command],{cwd,input,encoding:"utf8",env:{...process.env,...env}});

test("kit status is readable",()=>{const result=run(["status"]);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/kit-source/);});
test("Kit CLI rejects unknown, positional, missing, conflicting, and invalid options",()=>{
  for(const args of [["status","--typo","value"],["status","unexpected"],["export"],["export","--directory","one","--zip","two"],["new-project","--directory","one","--name","missing id"],["new-project","--directory","one","--project-id","TEST","--name","test","--mode","invalid"]]){
    const result=run(args);
    assert.equal(result.status,2,`${args.join(" ")}\n${result.stdout}${result.stderr}`);
  }
});
test("Kit CLI accepts equals-form options",()=>{const temp=mkdtempSync(join(tmpdir(),"aidd-kit-equals-")),output=join(temp,"template");try{const result=run(["export",`--directory=${output}`]);assert.equal(result.status,0,result.stderr);assert.ok(existsSync(join(output,".aidd-role.json")));}finally{rmSync(temp,{recursive:true,force:true});}});
test("source and export boundary validate",()=>{const result=run(["validate"]);assert.equal(result.status,0,result.stderr);});
test("template export contains no management tree and carries the approval gate",()=>{const temp=mkdtempSync(join(tmpdir(),"aidd-export-test-")),output=join(temp,"template");try{const result=run(["export","--directory",output]);assert.equal(result.status,0,result.stderr);assert.ok(existsSync(join(output,".ai/tools/aidd.mjs")));assert.ok(!existsSync(join(output,".aidd-kit-dev")));assert.equal(JSON.parse(readFileSync(join(output,".aidd-role.json"),"utf8")).role,"kit-template");const config=JSON.stringify(JSON.parse(readFileSync(join(output,".codex/hooks.json"),"utf8")).hooks);assert.match(config,/approval-gate/);assert.match(config,/acknowledge/);assert.match(config,/approval-status/);assert.doesNotMatch(config,/project-init/);}finally{rmSync(temp,{recursive:true,force:true});}});
test("new project bootstraps with Node only",()=>{const temp=mkdtempSync(join(tmpdir(),"aidd-project-test-")),output=join(temp,"product");try{const result=run(["new-project","--directory",output,"--project-id","TEST","--name","테스트","--mode","greenfield"]);assert.equal(result.status,0,result.stderr);assert.ok(existsSync(join(output,"project/.aidd/ssot/project.json")));assert.equal(JSON.parse(readFileSync(join(output,".aidd-role.json"),"utf8")).role,"product-workspace");const validate=spawnSync(process.execPath,[join(output,".ai/tools/aidd.mjs"),"validate"],{cwd:output,encoding:"utf8"});assert.equal(validate.status,0,validate.stdout+validate.stderr);}finally{rmSync(temp,{recursive:true,force:true});}});
const testSuiteNames=root=>readdirSync(join(root,".ai/tests")).filter(name=>name.endsWith(".test.mjs")).sort();
const distributedTestEnv=()=>Object.fromEntries(Object.entries(process.env).filter(([name])=>!name.startsWith("NODE_TEST_")&&name!=="NODE_OPTIONS"));
const tapCount=(output,label)=>{const match=output.match(new RegExp(`^# ${label} (\\d+)$`,"m"));return match?Number(match[1]):null;};
const MINIMUM_DISTRIBUTED_TESTS=20;
test("distributed AIDD tests pass in both export shapes",()=>{
  const temp=mkdtempSync(join(tmpdir(),"aidd-distributed-tests-")),template=join(temp,"template"),product=join(temp,"product");
  try{
    const exported=run(["export","--directory",template]);
    assert.equal(exported.status,0,exported.stderr);
    const created=run(["new-project","--directory",product,"--project-id","DIST-TEST","--name","배포 테스트","--mode","greenfield"]);
    assert.equal(created.status,0,created.stderr);
    const sourceNames=testSuiteNames(ROOT);
    assert.ok(sourceNames.length,"portable AIDD test suite is missing in the source");
    for(const output of [template,product]){
      const names=testSuiteNames(output);
      assert.deepEqual(names,sourceNames,`distributed AIDD test files differ from the portable source in ${output}`);
      for(const name of names)assert.equal(readFileSync(join(output,".ai/tests",name),"utf8"),readFileSync(join(ROOT,".ai/tests",name),"utf8"),`distributed AIDD test ${name} differs from the portable source in ${output}`);
      const result=spawnSync(process.execPath,["--test","--test-reporter=tap",...names.map(name=>join(output,".ai/tests",name))],{cwd:output,encoding:"utf8",env:distributedTestEnv()});
      const report=`${output}\n${result.stdout}${result.stderr}`;
      assert.equal(result.status,0,report);
      assert.doesNotMatch(result.stdout,/^not ok /m,report);
      const tests=tapCount(result.stdout,"tests"),passed=tapCount(result.stdout,"pass"),failed=tapCount(result.stdout,"fail");
      assert.equal(failed,0,report);
      assert.ok(tests>=MINIMUM_DISTRIBUTED_TESTS,`distributed AIDD suite reported ${tests} tests, fewer than the ${MINIMUM_DISTRIBUTED_TESTS} expected; an emptied or shrunk suite still exits 0\n${report}`);
      assert.equal(passed,tests,report);
    }
  }finally{rmSync(temp,{recursive:true,force:true});}
});
const copyRepositoryFixture=target=>{cpSync(ROOT,target,{recursive:true,filter:source=>{const path=relative(ROOT,source);return !path.startsWith(".git")&&!path.startsWith("chat-history")&&!path.startsWith("node_modules");}});return join(target,".aidd-kit-dev/tools/kit.mjs");};
test("record validation rejects malformed changes and evidence",()=>{
  const temp=mkdtempSync(join(tmpdir(),"aidd-record-validation-"));
  try{
    const fixture=join(temp,"repo"),kit=copyRepositoryFixture(fixture);
    const before=spawnSync(process.execPath,[kit,"validate"],{cwd:fixture,encoding:"utf8"});
    assert.equal(before.status,0,`fixture must validate before injection\n${before.stdout}${before.stderr}`);
    const changePath=join(fixture,".aidd-kit-dev/changes/KIT-CHG-005.json"),change=JSON.parse(readFileSync(changePath,"utf8"));
    change.status="garbage-status";delete change.problem;
    writeFileSync(changePath,`${JSON.stringify(change,null,2)}\n`,"utf8");
    const evidencePath=join(fixture,".aidd-kit-dev/evidence/KIT-EVD-023.json"),evidence=JSON.parse(readFileSync(evidencePath,"utf8"));
    evidence.change="KIT-CHG-999";evidence.performed_at=new Date(Date.now()+3600000).toISOString();
    writeFileSync(evidencePath,`${JSON.stringify(evidence,null,2)}\n`,"utf8");
    const after=spawnSync(process.execPath,[kit,"validate"],{cwd:fixture,encoding:"utf8"});
    const report=`${after.stdout}${after.stderr}`;
    assert.equal(after.status,1,report);
    assert.match(report,/KIT-CHG-005\.json: status must be one of/,report);
    assert.match(report,/KIT-CHG-005\.json: problem must be a non-empty string/,report);
    assert.match(report,/KIT-EVD-023\.json: change must reference an existing change record/,report);
    assert.match(report,/KIT-EVD-023\.json: performed_at .* is in the future/,report);
  }finally{rmSync(temp,{recursive:true,force:true});}
});
test("new-project reports child-process startup failures before export validation",()=>{const source=readFileSync(KIT,"utf8");assert.match(source,/if\(run\.error\)throw new Error\(`project-bootstrap process failed:/);assert.match(source,/if\(run\.status!==0\)throw new Error/);});
test("export provenance treats an unavailable Git status as dirty",()=>{const source=readFileSync(KIT,"utf8");assert.match(source,/source_dirty:status\.status!==0\|\|Boolean\(status\.stdout\.trim\(\)\)/);});
test("export staging is removed on success and failure",()=>{const source=readFileSync(KIT,"utf8");assert.match(source,/try\{mkdirSync\(stage\)/);assert.match(source,/finally\{rmSync\(temp,\{recursive:true,force:true\}\);\}/);});
test("no executable Python sources remain",()=>{
  const pythonSources=[];
  const collect=path=>{for(const entry of readdirSync(path,{withFileTypes:true})){if(entry.name===".git")continue;const child=join(path,entry.name);if(entry.isDirectory())collect(child);else if(entry.isFile()&&entry.name.endsWith(".py"))pythonSources.push(child.slice(ROOT.length+1));}};
  collect(ROOT);
  assert.deepEqual(pythonSources,[]);
});
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
test("exported Windows conversation hook writes UTF-8 history",()=>{if(process.platform!=="win32")return;const temp=mkdtempSync(join(tmpdir(),"aidd-log-e2e-")),output=join(temp,"product");try{let result=run(["new-project","--directory",output,"--project-id","LOG-TEST","--name","로그 테스트"]);assert.equal(result.status,0,result.stderr);result=spawnSync("git",["init","-b","main"],{cwd:output,encoding:"utf8"});assert.equal(result.status,0,result.stderr);const config=JSON.parse(readFileSync(join(output,".codex/hooks.json"),"utf8")),hook=config.hooks.UserPromptSubmit.flatMap(item=>item.hooks).find(item=>item.command?.includes("local-log --platform codex --role user")),command=hook?.commandWindows;assert.ok(command,"exported user conversation logger is missing");result=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",command],{cwd:output,input:JSON.stringify({prompt:"대화 저장 한글 왕복"}),encoding:"utf8"});assert.equal(result.status,0,result.stderr);const month=readdirSync(join(output,"chat-history")).find(name=>/^\d{4}-\d{2}$/.test(name)),file=readdirSync(join(output,"chat-history",month))[0],text=readFileSync(join(output,"chat-history",month,file),"utf8");assert.match(text,/대화 저장 한글 왕복/);assert.match(text,/codex · 사용자/);}finally{rmSync(temp,{recursive:true,force:true});}});
test("exported Windows SessionStart approval notice works before Git initialization",()=>{if(process.platform!=="win32")return;const temp=mkdtempSync(join(tmpdir(),"aidd-trust-e2e-")),output=join(temp,"product");try{const result=run(["new-project","--directory",output,"--project-id","TRUST-TEST","--name","신뢰 테스트"]);assert.equal(result.status,0,result.stderr);assert.ok(!existsSync(join(output,".git")));const config=JSON.parse(readFileSync(join(output,".codex/hooks.json"),"utf8")),trustEntry=config.hooks.SessionStart.find(item=>JSON.stringify(item).includes("hook-trust-status")),trustCommand=trustEntry?.hooks?.[0]?.commandWindows,approvalEntry=config.hooks.SessionStart.find(item=>JSON.stringify(item).includes("approval-status")),approvalCommand=approvalEntry?.hooks?.[1]?.commandWindows;assert.ok(trustCommand,"exported SessionStart must wire hook-trust-status");assert.ok(approvalCommand,"exported SessionStart must wire approval-status");assert.doesNotMatch(trustCommand,/git rev-parse/);assert.doesNotMatch(approvalCommand,/git rev-parse/);let processResult=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",trustCommand],{cwd:output,encoding:"utf8"});assert.ok([0,1].includes(processResult.status),processResult.stderr);assert.match(processResult.stdout,/TRUST_RECORD_FOUND|REVIEW_REQUIRED/);processResult=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",approvalCommand],{cwd:output,input:JSON.stringify({session_id:"template-start"}),encoding:"utf8"});assert.equal(processResult.status,0,processResult.stderr);assert.match(processResult.stdout,/AIDD 훅 승인 게이트/);}finally{rmSync(temp,{recursive:true,force:true});}});
test("exported approval and protection hooks work before Git initialization",()=>{
  const temp=mkdtempSync(join(tmpdir(),"aidd-pre-git-approval-e2e-")),output=join(temp,"template");
  try{
    const exported=run(["export","--directory",output]);
    assert.equal(exported.status,0,exported.stderr);
    assert.ok(!existsSync(join(output,".git")));
    const config=JSON.parse(readFileSync(join(output,".codex/hooks.json"),"utf8"));
    for(const entries of Object.values(config.hooks))for(const entry of entries)for(const hook of entry.hooks??[])for(const field of ["command","commandWindows"]){
      assert.ok(hook[field],`exported hook is missing ${field}`);
      assert.doesNotMatch(hook[field],/git rev-parse/,`pre-Git export ${field} must not require a Git root`);
    }
    const commandField=process.platform==="win32"?"commandWindows":"command";
    const approval=config.hooks.PreToolUse.flatMap(item=>item.hooks).find(item=>item.command?.includes("approval-gate --platform codex"))?.[commandField];
    const protection=config.hooks.PreToolUse.flatMap(item=>item.hooks).find(item=>item.command?.includes("protect --platform codex --kind file"))?.[commandField];
    const acknowledge=config.hooks.UserPromptSubmit.flatMap(item=>item.hooks).find(item=>item.command?.includes("acknowledge --platform codex"))?.[commandField];
    assert.ok(approval,"exported approval gate command is missing");
    assert.ok(protection,"exported file protection command is missing");
    assert.ok(acknowledge,"exported acknowledge command is missing");
    const approvalDir=join(temp,"approvals"),env={AIDD_HOOK_APPROVAL_DIR:approvalDir,CODEX_INTERNAL_ORIGINATOR_OVERRIDE:"Codex CLI",CODEX_WINDOWS_SANDBOX_PACKAGE_FAMILY:""};
    for(const choice of ["1","2"]){
      const session_id=`pre-git-${choice}`,request=JSON.stringify({session_id,tool_name:"apply_patch",tool_input:{patch:"*** Update File: project/src/x.js\n@@"}});
      let result=runHookCommand(approval,{cwd:output,input:request,env});
      assert.equal(result.status,0,result.stderr);
      assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision,"deny");
      result=runHookCommand(acknowledge,{cwd:output,input:JSON.stringify({session_id,prompt:choice}),env});
      assert.equal(result.status,0,result.stderr);
      result=runHookCommand(approval,{cwd:output,input:request,env});
      assert.equal(result.status,0,result.stderr);
      assert.equal(result.stdout,"");
    }
    const protectedResult=runHookCommand(protection,{cwd:output,input:JSON.stringify({tool_name:"apply_patch",tool_input:{path:"project/docs/generated/pre-git.md"}}),env});
    assert.equal(protectedResult.status,0,protectedResult.stderr);
    assert.equal(JSON.parse(protectedResult.stdout).hookSpecificOutput.permissionDecision,"deny");
  }finally{rmSync(temp,{recursive:true,force:true});}
});
