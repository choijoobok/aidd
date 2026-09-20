import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT=resolve(import.meta.dirname,"../..");
const AIDD=join(ROOT,".ai/tools/aidd.mjs");
const FIXTURE=join(ROOT,".aidd-kit-dev/fixtures/reference-project");
const run=(args,input="")=>spawnSync(process.execPath,[AIDD,...args],{cwd:ROOT,input,encoding:"utf8"});

function writeJson(path,value){writeFileSync(path,`${JSON.stringify(value,null,2)}\n`,"utf8");}
function relativeFiles(root,current=root,result=[]){for(const entry of readdirSync(current,{withFileTypes:true})){const path=join(current,entry.name);if(entry.isDirectory())relativeFiles(root,path,result);else if(entry.isFile())result.push(path.slice(root.length+1).replaceAll("\\","/"));}return result.sort();}
const escapeRegExp=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function git(cwd,args){const result=spawnSync("git",args,{cwd,encoding:"utf8"});assert.equal(result.status,0,result.stdout+result.stderr);return result;}
function initGit(temp,name="joobok",email="bbundoli@naver.com"){
  git(temp,["init","-b","main"]);
  git(temp,["config","user.name",name]);
  git(temp,["config","user.email",email]);
}

function withReferenceProject(callback){
  const temp=mkdtempSync(join(tmpdir(),"aidd-node-parity-"));
  try{
    cpSync(join(ROOT,".ai"),join(temp,".ai"),{recursive:true});
    cpSync(join(ROOT,".githooks"),join(temp,".githooks"),{recursive:true});
    cpSync(FIXTURE,join(temp,"project"),{recursive:true});
    cpSync(join(ROOT,".aidd-role.json"),join(temp,".aidd-role.json"));
    const cli=join(temp,".ai/tools/aidd.mjs");
    const execute=(args,env={})=>spawnSync(process.execPath,[cli,...args],{cwd:temp,encoding:"utf8",env:{...process.env,...env}});
    return callback({temp,cli,execute});
  }finally{
    rmSync(temp,{recursive:true,force:true});
  }
}

test("Node CLI parses",()=>{const result=spawnSync(process.execPath,["--check",AIDD],{encoding:"utf8"});assert.equal(result.status,0,result.stderr);});
test("Node CLI child-process gates fail closed on process start failures",()=>{
  const source=readFileSync(AIDD,"utf8");
  assert.match(source,/function childProcessFailure\(run,label\)/);
  assert.match(source,/childProcessFailure\(result,"AIDD hook self-test"\)/);
  assert.match(source,/childProcessFailure\(harness,"AIDD hook self-test"\)/);
  assert.match(source,/childProcessFailure\(run,"AIDD Kit validation"\)/);
  assert.doesNotMatch(source,/console\.log\(run\.status\?/);
  assert.match(source,/gitText\(\["log","--all"/);
  assert.doesNotMatch(source,/gitText\(\["log","--all"[^\n]+\{check:false\}/);
  assert.match(source,/gitText\(\["diff","--cached","--name-only","--diff-filter=ACMR"\]\)/);
});
test("Node CLI preserves required option and choice validation",()=>{
  let result=run(["hook","--platform","codex"],"{}");
  assert.equal(result.status,2,result.stdout+result.stderr);
  assert.match(result.stderr,/--event/);
  result=run(["project-bootstrap","--project-id","TEST","--name","테스트","--mode","unsupported"]);
  assert.equal(result.status,2,result.stdout+result.stderr);
  assert.match(result.stderr,/--mode must be one of/);
  result=run(["validate","--typo","value"]);
  assert.equal(result.status,2,result.stdout+result.stderr);
  assert.match(result.stderr,/unknown option.*--typo/);
  result=run(["validate","unexpected"]);
  assert.equal(result.status,2,result.stdout+result.stderr);
  assert.match(result.stderr,/unexpected argument/);
  result=run(["record-merge","2"]);
  assert.equal(result.status,2,result.stdout+result.stderr);
  assert.match(result.stderr,/must be 0 or 1/);
  result=run(["hook","--platform=claude","--event=Stop"],JSON.stringify({stop_hook_active:true}));
  assert.equal(result.status,0,result.stdout+result.stderr);
  assert.equal(result.stdout.trim(),"{}");
});
test("Node CLI rejects missing values for optional scalar and append options",()=>{
  for(const args of [
    ["status","--module"],
    ["document-impact","--path"],
    ["project-bootstrap","--project-id","TEST","--name","테스트","--source-location"],
    ["record-work","--summary","요약","--why","이유","--result","결과","--next","다음","--link"],
  ]){
    const result=run(args);
    assert.equal(result.status,2,`${args.join(" ")}\n${result.stdout}${result.stderr}`);
    assert.match(result.stderr,/requires a value/);
  }
});
test("evaluation commands preserve Python variadic scores and evidence gates",()=>withReferenceProject(({temp,execute})=>{
  const prompt=execute(["evaluation-prompt","--scenario","EVS-001"]);
  assert.equal(prompt.status,0,prompt.stdout+prompt.stderr);
  assert.match(prompt.stdout,/## 평가 루브릭/);
  assert.match(prompt.stdout,/의도와 성과 0~2점/);
  const valid=execute([
    "record-evaluation","--scenario","EVS-001","--platform","codex","--status","passed",
    "--evidence","EVD-UNKNOWN","--evidence","EVD-001","--scores","2","2","2","2","--summary","동등성 검증",
  ]);
  assert.equal(valid.status,0,valid.stdout+valid.stderr);
  const evaluations=JSON.parse(readFileSync(join(temp,"project/.aidd/ssot/evaluations.json"),"utf8"));
  assert.equal(evaluations.runs.length,1);
  assert.deepEqual(evaluations.runs[0].rubric_results.map(item=>item.score),[2,2,2,2]);
  assert.equal(evaluations.runs[0].executed_at,"2026-09-18T00:00:00+09:00");
  const status=execute(["evaluation-status"]);
  assert.equal(status.status,0,status.stdout+status.stderr);
  assert.match(status.stdout,/EVS-001.*codex.*passed/);
  assert.match(status.stdout,/EVS-001.*claude.*not_run/);
  for(const args of [
    ["record-evaluation","--scenario","EVS-001","--platform","codex","--status","passed","--evidence","EVD-001","--scores","2","2","2","--summary","점수 누락"],
    ["record-evaluation","--scenario","EVS-001","--platform","codex","--status","passed","--evidence","EVD-001","--scores","2","bad","2","2","--summary","정수 아님"],
    ["record-evaluation","--scenario","EVS-001","--platform","codex","--status","passed","--evidence","EVD-001","--scores","2","2","2","2","--critical-violation","금지 행동","--summary","통과 불가"],
    ["record-evaluation","--scenario","EVS-001","--platform","codex","--status","failed","--evidence","EVD-001","--scores","0","0","0","0","--summary","증거 상태 불일치"],
  ]){
    const denied=execute(args);
    assert.equal(denied.status,2,denied.stdout+denied.stderr);
  }
}));

test("merge assessment preserves variadic modules and recheck integrity",()=>withReferenceProject(({temp,execute})=>{
  const ssot=join(temp,"project/.aidd/ssot"),modules=JSON.parse(readFileSync(join(ssot,"modules.json"),"utf8")).modules;
  assert.ok(modules.length>=2);
  writeJson(join(ssot,"merges.json"),{schema_version:1,merges:[{
    id:"MRG-001",commit:"deadbeef",parents:["p1","p2"],changed_files:["project/src/app.js"],
    affected_modules:[],conflict_resolution_notes:"pending",additional_testing:"pending",rechecks:[],status:"needs_assessment",
  }]});
  let result=execute(["assess-merge","--merge","MRG-001","--modules",modules[0].id,modules[1].id,"--notes","상호작용 검토","--additional-testing","회귀 필요"]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  let merge=JSON.parse(readFileSync(join(ssot,"merges.json"),"utf8")).merges[0];
  assert.deepEqual(merge.affected_modules,[modules[0].id,modules[1].id].sort());
  assert.equal(merge.conflict_resolution_notes,"상호작용 검토");
  assert.equal(merge.notes,undefined);
  result=execute(["add-merge-recheck","--merge","MRG-001","--type","test","--title","회귀 재검증","--module",modules[0].id,"--test","TC-001","--blocking"]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  merge=JSON.parse(readFileSync(join(ssot,"merges.json"),"utf8")).merges[0];
  assert.equal(merge.rechecks[0].id,"MRC-001");
  assert.equal(merge.rechecks[0].reviewed_by,null);
  const missingEvidence=execute(["complete-merge-recheck","--merge","MRG-001","--recheck","MRC-001","--reviewed-by","HUM-001","--result","통과"]);
  assert.equal(missingEvidence.status,2,missingEvidence.stdout+missingEvidence.stderr);
  result=execute(["complete-merge-recheck","--merge","MRG-001","--recheck","MRC-001","--reviewed-by","HUM-001","--result","통과","--evidence","EVD-001"]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  merge=JSON.parse(readFileSync(join(ssot,"merges.json"),"utf8")).merges[0];
  assert.equal(merge.rechecks[0].status,"completed");
  assert.ok(merge.rechecks[0].reviewed_at);
  const unknown=execute(["assess-merge","--merge","MRG-001","--modules","MOD-UNKNOWN","--notes","거부","--additional-testing","거부"]);
  assert.equal(unknown.status,2,unknown.stdout+unknown.stderr);
}));

test("validate rejects corrupted evaluation and merge gate records",()=>withReferenceProject(({temp,execute})=>{
  const ssot=join(temp,"project/.aidd/ssot"),evaluations=JSON.parse(readFileSync(join(ssot,"evaluations.json"),"utf8"));
  evaluations.runs.push({
    id:"EVR-001",scenario:"EVS-001",platform:"codex",status:"passed",
    rubric_results:[{criterion:"잘못된 기준",score:3}],critical_violations:["금지 행동"],
    summary:"손상 fixture",evidence:"EVD-001",executed_at:"잘못된 시각",
  });
  writeJson(join(ssot,"evaluations.json"),evaluations);
  const modulePath=join(ssot,"modules/MOD-AI.json"),moduleSpec=JSON.parse(readFileSync(modulePath,"utf8"));
  moduleSpec.requirements[0].acceptance_criteria=[];
  writeJson(modulePath,moduleSpec);
  const openItems=JSON.parse(readFileSync(join(ssot,"open-items.json"),"utf8"));
  openItems.open_items.push({id:"MOD-AI"},{id:"bad"});
  writeJson(join(ssot,"open-items.json"),openItems);
  writeJson(join(ssot,"merges.json"),{schema_version:1,merges:[{
    id:"MRG-001",commit:"deadbeef",parents:["p1","p2"],changed_files:[],affected_modules:["MOD-UNKNOWN"],
    conflict_resolution_notes:"pending",additional_testing:"pending",rechecks:[],status:"assessed",
  }]});
  const result=execute(["validate"]);
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.match(result.stdout,/EVR-001: invalid rubric results/);
  assert.match(result.stdout,/EVR-001: passed evaluation has critical violations/);
  assert.match(result.stdout,/MRG-001: unknown affected module MOD-UNKNOWN/);
  assert.match(result.stdout,/MRG-001: assessed merge requires conflict notes/);
  assert.match(result.stdout,/duplicate stable ID across canonical records: MOD-AI/);
  assert.match(result.stdout,/invalid stable ID: "bad"/);
  assert.match(result.stdout,/REQ-013 has no acceptance criteria/);
  assert.doesNotMatch(result.stdout,/duplicate (?:stable )?ID.*(?:acceptance|procedure|context)/);
}));

test("collaboration mutations reject invalid membership and identity transitions",()=>withReferenceProject(({execute})=>{
  let result=execute(["collaboration-member","--id","HUM-002","--name","팀원","--role","개발자","--status","inactive","--reason","잘못된 신규 상태"]);
  assert.equal(result.status,2,result.stdout+result.stderr);
  result=execute(["collaboration-member","--id","HUM-002","--name","팀원","--role","개발자","--status","active","--reason","PM 없는 팀 전환"]);
  assert.equal(result.status,2,result.stdout+result.stderr);
  result=execute(["collaboration-identity","--id","IDM-002","--type","human","--git-name","member","--git-email","member@example.com","--reason","참여자 누락"]);
  assert.equal(result.status,2,result.stdout+result.stderr);
  result=execute(["collaboration-identity","--id","IDM-002","--type","bot","--participant","HUM-001","--hosting-account","build-bot","--reason","봇 사람 연결"]);
  assert.equal(result.status,2,result.stdout+result.stderr);
  result=execute(["collaboration-identity","--id","IDM-002","--type","bot","--git-name","build-bot","--reason","불완전 Git 신원"]);
  assert.equal(result.status,2,result.stdout+result.stderr);
}));
test("kit source stop hook uses Node validation",()=>{const result=run(["hook","--platform","codex","--event","Stop"],JSON.stringify({stop_hook_active:true}));assert.equal(result.status,0);assert.equal(result.stdout.trim(),"{}");});
test("hook trust status is read only",()=>{const before=readFileSync(join(ROOT,".codex/hooks.json"));const result=run(["hook-trust-status"]);assert.ok([0,1].includes(result.status));assert.match(result.stdout,/TRUST_RECORD_FOUND|REVIEW_REQUIRED/);assert.deepEqual(readFileSync(join(ROOT,".codex/hooks.json")),before);});
test("fixture contains canonical project data",()=>{const project=JSON.parse(readFileSync(join(FIXTURE,".aidd/ssot/project.json"),"utf8"));assert.ok(project.project_id);assert.ok(project.name);});
test("all public scripts use Node shebang",()=>{for(const file of [AIDD,join(ROOT,".ai/tools/aidd_hook.mjs"),join(ROOT,".aidd-kit-dev/tools/kit.mjs")])assert.match(readFileSync(file,"utf8"),/^#!\/usr\/bin\/env node/);});

test("Node CLI regenerates the reference project home and document portals",()=>withReferenceProject(({temp,execute})=>{
  const expected=relativeFiles(join(FIXTURE,"docs/generated"));
  rmSync(join(temp,"project/docs/generated"),{recursive:true,force:true});
  mkdirSync(join(temp,"project/docs/generated"),{recursive:true});
  mkdirSync(join(temp,"project/docs/generated/stale"),{recursive:true});
  writeFileSync(join(temp,"project/docs/generated/stale/old.md"),"stale\n","utf8");
  const result=execute(["generate"]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  const generated=join(temp,"project/docs/generated");
  for(const path of [
    "project-brief.md",
    "glossary.md",
    "foundation/documentation-standard.md",
    "modules/MOD-AI.md",
    "site/index.html",
    "site/design/index.html",
    "site/user/index.html",
    "site/operations/index.html",
    "site/assets/delivery.js",
  ])assert.ok(existsSync(join(generated,path)),path);
  const project=JSON.parse(readFileSync(join(temp,"project/.aidd/ssot/project.json"),"utf8"));
  assert.match(readFileSync(join(generated,"site/index.html"),"utf8"),new RegExp(project.name));
  assert.match(readFileSync(join(generated,"site/design/index.html"),"utf8"),/data-tree-filter/);
  const glossary=readFileSync(join(generated,"glossary.md"),"utf8");
  assert.match(glossary,/AIDD 공통 용어/);
  assert.match(glossary,/AIDD-TERM-031/);
  assert.match(glossary,/프로젝트 전용 용어/);
  assert.match(glossary,/TRM-001/);
  assert.match(glossary,/고객 요청/);
  assert.match(readFileSync(join(generated,"site/design/index.html"),"utf8"),/AIDD-TERM-031/);
  assert.match(readFileSync(join(generated,"site/operations/index.html"),"utf8"),/AIDD-TERM-031/);
  const userSite=readFileSync(join(generated,"site/user/index.html"),"utf8");
  assert.match(userSite,/고객 요청/);
  assert.doesNotMatch(userSite,/AIDD-TERM-031/);
  const module=readFileSync(join(generated,"modules/MOD-AI.md"),"utf8");
  assert.match(module,/## 작업 항목/);
  assert.match(module,/## 인터페이스/);
  assert.match(module,/## 모듈 의존성/);
  assert.match(module,/## 관련 변경/);
  assert.match(module,/## 관련 결정/);
  assert.match(module,/## 관련 테스트/);
  assert.match(module,/## 요구사항 상세/);
  assert.match(module,/\*\*rationale:\*\*/);
  const requirement=JSON.parse(readFileSync(join(temp,"project/.aidd/ssot/modules/MOD-AI.json"),"utf8")).requirements[0];
  const requirementDocument=readFileSync(join(generated,"requirements.md"),"utf8");
  for(const value of [requirement.statement,requirement.rationale,requirement.owner,requirement.source,...requirement.acceptance_criteria])assert.match(requirementDocument,new RegExp(escapeRegExp(value)));
  const architecture=JSON.parse(readFileSync(join(temp,"project/.aidd/ssot/architecture.json"),"utf8"));
  const architectureDocument=readFileSync(join(generated,"architecture.md"),"utf8");
  assert.match(architectureDocument,new RegExp(escapeRegExp(architecture.principles[0].rule)));
  assert.match(architectureDocument,new RegExp(escapeRegExp(architecture.components[0].responsibility)));
  assert.match(architectureDocument,/## 역할 관점/);
  assert.match(architectureDocument,/ROLE-OPS/);
  const operatorGuide=readFileSync(join(generated,"operator-guide.md"),"utf8");
  assert.match(operatorGuide,/node \.ai\/tools\/aidd\.mjs generate/);
  assert.match(operatorGuide,/운영자 가이드·런북 공통 항목/);
  const deploymentDocument=readFileSync(join(generated,"deployment-and-runtime.md"),"utf8");
  assert.match(deploymentDocument,/DPP-001/);
  assert.match(deploymentDocument,/DG-001/);
  assert.match(readFileSync(join(generated,"technology-gates.md"),"utf8"),/TSP-001/);
  assert.match(readFileSync(join(generated,"methodology-comparison.md"),"utf8"),/MTP-001/);
  assert.match(readFileSync(join(generated,"ai-evaluation.md"),"utf8"),/EVP-001/);
  const collaborationDocument=readFileSync(join(generated,"collaboration-governance.md"),"utf8");
  assert.match(collaborationDocument,/CBG-001/);
  assert.match(collaborationDocument,/IDP-001/);
  assert.deepEqual(relativeFiles(generated),expected);
  assert.equal(existsSync(join(generated,"stale")),false);
  writeFileSync(join(generated,"requirements.md"),"manually changed\n","utf8");
  writeFileSync(join(generated,"obsolete.md"),"obsolete\n","utf8");
  const drift=execute(["validate"]);
  assert.equal(drift.status,1,drift.stdout+drift.stderr);
  assert.match(drift.stdout,/stale generated document project\/docs\/generated\/requirements\.md/);
  assert.match(drift.stdout,/obsolete generated document project\/docs\/generated\/obsolete\.md/);
}));

test("terminology workflow preserves impact and approval history and refreshes the glossary",()=>withReferenceProject(({temp,execute})=>{
  const generated=join(temp,"project/docs/generated");
  let result=execute(["term-propose","--id","TRM-999","--term","처리 묶음","--key","processingBundle","--category","업무","--definition","함께 승인하고 추적하는 고객 요청의 묶음이다.","--requested-by","HUM-001","--audience","project_team","--audience","end_user","--visibility","customer","--alias","요청 묶음","--module","MOD-GOV","--requirement","REQ-001"]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  let terminology=JSON.parse(readFileSync(join(temp,"project/.aidd/ssot/terminology.json"),"utf8"));
  assert.equal(terminology.terms.find(item=>item.id==="TRM-999").status,"proposed");
  result=execute(["term-impact","--id","TIR-999","--term","TRM-999","--change-type","add","--performed-by","HUM-001","--recommendation","승인 후 요구사항과 사용자 문서에서 사용한다.","--scope","요구사항","--limitation","자연어 의미 검토는 사람이 확인한다."]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  result=execute(["term-decide","--id","TAP-999","--term","TRM-999","--impact-review","TIR-999","--decision","approved","--decided-by","HUM-001","--rationale","고객과 개발팀이 같은 단위를 사용하기로 결정했다."]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  const pending=execute(["validate"]);
  assert.equal(pending.status,1,pending.stdout+pending.stderr);
  assert.match(pending.stdout,/approved terminology impact application is not completed/);
  result=execute(["term-close","--impact-review","TIR-999","--closed-by","HUM-001","--result","연결된 요구사항과 사용자 문서에 승인 용어를 반영했다."]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  terminology=JSON.parse(readFileSync(join(temp,"project/.aidd/ssot/terminology.json"),"utf8"));
  const term=terminology.terms.find(item=>item.id==="TRM-999");
  assert.equal(term.status,"approved");
  assert.deepEqual(term.impact_reviews,["TIR-999"]);
  assert.deepEqual(term.approvals,["TAP-999"]);
  assert.equal(terminology.impact_reviews.find(item=>item.id==="TIR-999").status,"completed");
  assert.equal(terminology.impact_reviews.find(item=>item.id==="TIR-999").application_status,"completed");
  assert.match(readFileSync(join(generated,"glossary.md"),"utf8"),/처리 묶음/);
  assert.match(readFileSync(join(generated,"site/user/index.html"),"utf8"),/처리 묶음/);
  const validation=execute(["validate"]);
  assert.doesNotMatch(validation.stdout+validation.stderr,/terminology\.json|TRM-999|TIR-999|TAP-999/);
}));

test("terminology approval requires the project owner unless a delegate is recorded",()=>withReferenceProject(({temp,execute})=>{
  const collaborationPath=join(temp,"project/.aidd/ssot/collaboration.json"),collaboration=JSON.parse(readFileSync(collaborationPath,"utf8"));
  collaboration.participants[0].roles.push("PM");
  collaboration.policy.current_profile="CBP-TEAM";
  collaboration.participants.push({id:"HUM-002",name:"개발 참여자",roles:["개발자"],status:"active",joined_at:"2026-09-20",left_at:null});
  writeJson(collaborationPath,collaboration);
  assert.equal(execute(["term-propose","--id","TRM-996","--term","승인 대기 묶음","--key","approvalBundle","--category","업무","--definition","승인이 필요한 고객 요청 묶음이다.","--requested-by","HUM-002"]).status,0);
  assert.equal(execute(["term-impact","--id","TIR-996","--term","TRM-996","--change-type","add","--performed-by","HUM-002","--recommendation","승인 후 적용한다."]).status,0);
  const result=execute(["term-decide","--id","TAP-996","--term","TRM-996","--impact-review","TIR-996","--decision","approved","--decided-by","HUM-002","--rationale","권한 없는 승인 시도다."]);
  assert.equal(result.status,2,result.stdout+result.stderr);
  assert.match(result.stdout+result.stderr,/용어 승인은 프로젝트 PM/);
  const delegation=execute(["set-terminology-approval-policy","--mode","delegated","--delegate","HUM-002","--reason","PM 부재 중 용어 승인 위임"]);
  assert.equal(delegation.status,0,delegation.stdout+delegation.stderr);
  assert.deepEqual(JSON.parse(readFileSync(collaborationPath,"utf8")).terminology_approval_policy.delegates,["HUM-002"]);
  const delegated=execute(["term-decide","--id","TAP-996","--term","TRM-996","--impact-review","TIR-996","--decision","approved","--decided-by","HUM-002","--rationale","PM 위임에 따라 승인한다."]);
  assert.equal(delegated.status,0,delegated.stdout+delegated.stderr);
}));

test("terminology validation rejects reserved AIDD terms and normalized collisions",()=>withReferenceProject(({temp,execute})=>{
  const path=join(temp,"project/.aidd/ssot/terminology.json"),terminology=JSON.parse(readFileSync(path,"utf8"));
  terminology.terms.push({
    id:"TRM-998",term:"C2",key:"customerRequest",category:"업무",definition:"예약 용어를 덮어쓴다.",status:"proposed",requested_by:"HUM-001",aliases:["업무 요청"],audiences:["project_team"],visibility:"internal",
    impacts:{modules:[],requirements:[],architecture:[],data:[],apis:[],screens:[],tests:[],documents:[]},impact_reviews:[],approvals:[],replaced_by:null,
  });
  writeJson(path,terminology);
  const result=execute(["validate"]);
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.match(result.stdout,/reserved AIDD term or alias/);
  assert.match(result.stdout,/duplicate terminology key/);
  assert.match(result.stdout,/duplicate project term or alias/);
}));

test("terminology validation rejects duplicate TRM, TIR, and TAP stable IDs",()=>withReferenceProject(({temp,execute})=>{
  const path=join(temp,"project/.aidd/ssot/terminology.json"),terminology=JSON.parse(readFileSync(path,"utf8"));
  const duplicateTerm=structuredClone(terminology.terms[0]);
  duplicateTerm.term="별도 중복 식별자 용어";
  duplicateTerm.key="duplicateStableIdTerm";
  duplicateTerm.aliases=["별도 중복 식별자"];
  terminology.terms.push(duplicateTerm);
  terminology.impact_reviews.push(structuredClone(terminology.impact_reviews[0]));
  terminology.approval_decisions.push(structuredClone(terminology.approval_decisions[0]));
  writeJson(path,terminology);
  const result=execute(["validate"]);
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.equal((result.stdout.match(/duplicate terminology stable ID: TRM-001/g)??[]).length,1);
  assert.equal((result.stdout.match(/duplicate terminology stable ID: TIR-001/g)??[]).length,1);
  assert.equal((result.stdout.match(/duplicate terminology stable ID: TAP-001/g)??[]).length,1);
}));

test("product validation rejects modification of the immutable AIDD terminology registry",()=>withReferenceProject(({temp,execute})=>{
  const path=join(temp,".ai/manifests/terminology.json"),registry=JSON.parse(readFileSync(path,"utf8"));
  registry.terms[0].definition="프로젝트에서 바꾼 정의";
  writeJson(path,registry);
  const result=execute(["validate"]);
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.match(result.stdout,/immutable AIDD terminology registry differs from the Kit baseline/);
}));

test("validation blocks proposed terminology used as an established project fact",()=>withReferenceProject(({temp,execute})=>{
  let result=execute(["term-propose","--id","TRM-997","--term","검토 바구니","--key","reviewBasket","--category","업무","--definition","검토할 요청을 담는 업무 단위다.","--requested-by","HUM-001"]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  const path=join(temp,"project/.aidd/ssot/modules/MOD-GOV.json"),fragment=JSON.parse(readFileSync(path,"utf8"));
  fragment.requirements[0].title=`${fragment.requirements[0].title} 검토 바구니`;
  writeJson(path,fragment);
  result=execute(["validate"]);
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.match(result.stdout,/proposed terminology is used outside terminology\.json/);
}));

test("post-check refreshes generated terminology views through the portable generator",()=>withReferenceProject(({temp})=>{
  const generated=join(temp,"project/docs/generated"),hook=join(temp,".ai/tools/aidd_hook.mjs");
  writeJson(join(temp,".aidd-role.json"),{schema_version:1,role:"product-workspace",managed_by:".ai/tools/aidd.mjs",mutable_by_user:false});
  rmSync(generated,{recursive:true,force:true});
  const payload=JSON.stringify({tool_name:"Edit",tool_input:{file_path:"project/.aidd/ssot/terminology.json"}});
  const result=spawnSync(process.execPath,[hook,"post-check","--platform","claude"],{cwd:temp,input:payload,encoding:"utf8"});
  assert.equal(result.status,0,result.stdout+result.stderr);
  assert.ok(existsSync(join(generated,"glossary.md")));
  assert.match(readFileSync(join(generated,"glossary.md"),"utf8"),/고객 요청/);
}));

test("migrate-module-specs performs the legacy-to-sharded migration once",()=>withReferenceProject(({temp,execute})=>{
  const ssot=join(temp,"project/.aidd/ssot"),rootPath=join(ssot,"requirements.json"),fragmentRoot=join(ssot,"modules"),requirements=[];
  for(const file of readdirSync(fragmentRoot))requirements.push(...JSON.parse(readFileSync(join(fragmentRoot,file),"utf8")).requirements);
  writeJson(rootPath,{schema_version:1,requirements});
  rmSync(fragmentRoot,{recursive:true,force:true});
  const result=execute(["migrate-module-specs"]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  const migrated=JSON.parse(readFileSync(rootPath,"utf8"));
  assert.equal(migrated.storage,"module-sharded");
  assert.equal(migrated.requirements.length,0);
  assert.equal(relativeFiles(fragmentRoot).length,JSON.parse(readFileSync(join(ssot,"modules.json"),"utf8")).modules.length);
  assert.equal(readdirSync(fragmentRoot).flatMap(file=>JSON.parse(readFileSync(join(fragmentRoot,file),"utf8")).requirements).length,requirements.length);
  const repeated=execute(["migrate-module-specs"]);
  assert.equal(repeated.status,2,repeated.stdout+repeated.stderr);
  assert.match(repeated.stderr,/already stored/);
}));

test("Node CLI enforces work coverage and development gates",()=>withReferenceProject(({temp,execute})=>{
  initGit(temp);
  const coverage=execute(["workload-coverage","--change","CHG-011"]);
  assert.equal(coverage.status,0,coverage.stdout+coverage.stderr);
  assert.match(coverage.stdout,/배분 가능/);
  assert.match(coverage.stdout,/design, implementation, test, documentation, migration, operations, training/);
  const development=execute(["development-check","--change","CHG-001"]);
  assert.equal(development.status,1,development.stdout+development.stderr);
  assert.match(development.stdout,/승인되지 않았습니다/);
}));

test("add-module creates module, UI, and system-surface fragments with canonical ownership",()=>withReferenceProject(({temp,execute})=>{
  const result=execute([
    "add-module","--id","MOD-IGNORED","--id","MOD-ORDERS","--name","무시할 이름","--name","주문","--purpose","주문 수명주기 관리",
    "--dependency","MOD-GOV","--status","planned","--with-ui",
  ]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  const ssot=join(temp,"project/.aidd/ssot");
  const requirements=JSON.parse(readFileSync(join(ssot,"modules/MOD-ORDERS.json"),"utf8"));
  const catalog=JSON.parse(readFileSync(join(ssot,"modules.json"),"utf8")).modules.find(item=>item.id==="MOD-ORDERS");
  const ui=JSON.parse(readFileSync(join(ssot,"ui-modules/MOD-ORDERS.json"),"utf8"));
  const surfaces=JSON.parse(readFileSync(join(ssot,"system-surfaces/MOD-ORDERS.json"),"utf8"));
  assert.equal(catalog.name,"주문");
  assert.deepEqual(catalog.dependencies,["MOD-GOV"]);
  assert.equal(requirements.module,"MOD-ORDERS");
  assert.deepEqual(ui,{schema_version:1,module:"MOD-ORDERS",screens:[],manuals:[]});
  assert.deepEqual(surfaces,{schema_version:1,module:"MOD-ORDERS",surfaces:[]});
  const scalarRepeat=execute(["module-status","--module","MOD-IGNORED","--module","MOD-ORDERS","--status","in_progress"]);
  assert.equal(scalarRepeat.status,0,scalarRepeat.stdout+scalarRepeat.stderr);
  const updated=JSON.parse(readFileSync(join(ssot,"modules.json"),"utf8")).modules.find(item=>item.id==="MOD-ORDERS");
  assert.equal(updated.status,"in_progress");
}));

test("add-module fails atomically when a later fragment cannot be written",()=>withReferenceProject(({temp,execute})=>{
  const ssot=join(temp,"project/.aidd/ssot"),catalogPath=join(ssot,"modules.json"),before=readFileSync(catalogPath,"utf8"),uiRoot=join(ssot,"ui-modules");
  rmSync(uiRoot,{recursive:true,force:true});
  writeFileSync(uiRoot,"not a directory\n","utf8");
  const result=execute(["add-module","--id=MOD-ROLLBACK","--name=롤백","--purpose=부분 쓰기 방지","--with-ui"]);
  assert.equal(result.status,2,result.stdout+result.stderr);
  assert.equal(readFileSync(catalogPath,"utf8"),before);
  assert.equal(existsSync(join(ssot,"modules/MOD-ROLLBACK.json")),false);
  assert.equal(existsSync(join(ssot,"system-surfaces/MOD-ROLLBACK.json")),false);
}));

test("add-module respects an active repository write lock",()=>withReferenceProject(({temp,execute})=>{
  const ssot=join(temp,"project/.aidd/ssot"),catalogPath=join(ssot,"modules.json"),before=readFileSync(catalogPath,"utf8"),lockPath=join(ssot,".write.lock");
  writeFileSync(lockPath,`${JSON.stringify({pid:process.pid,created_at:new Date().toISOString()})}\n`,"utf8");
  const result=execute(["add-module","--id","MOD-LOCKED","--name","잠금","--purpose","동시 쓰기 방지"],{AIDD_WRITE_LOCK_TIMEOUT_MS:"50"});
  assert.equal(result.status,2,result.stdout+result.stderr);
  assert.match(result.stderr,/repository write lock/);
  assert.equal(readFileSync(catalogPath,"utf8"),before);
  assert.equal(existsSync(join(ssot,"modules/MOD-LOCKED.json")),false);
}));

test("add-module reclaims a stale repository lock through an exclusive cleanup lock",()=>withReferenceProject(({temp,execute})=>{
  const ssot=join(temp,"project/.aidd/ssot"),lockPath=join(ssot,".write.lock"),cleanupPath=`${lockPath}.cleanup`;
  writeFileSync(lockPath,`${JSON.stringify({pid:2147483647,token:"stale-owner",created_at:"2000-01-01T00:00:00.000Z"})}\n`,"utf8");
  const result=execute(["add-module","--id","MOD-RECOVERED","--name","회수","--purpose","stale lock 안전 회수"]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  assert.equal(existsSync(join(ssot,"modules/MOD-RECOVERED.json")),true);
  assert.equal(existsSync(lockPath),false);
  assert.equal(existsSync(cleanupPath),false);
}));

test("add-module fails closed when stale-lock cleanup is already claimed",()=>withReferenceProject(({temp,execute})=>{
  const ssot=join(temp,"project/.aidd/ssot"),catalogPath=join(ssot,"modules.json"),before=readFileSync(catalogPath,"utf8"),lockPath=join(ssot,".write.lock"),cleanupPath=`${lockPath}.cleanup`;
  writeFileSync(lockPath,`${JSON.stringify({pid:2147483647,token:"stale-owner",created_at:"2000-01-01T00:00:00.000Z"})}\n`,"utf8");
  writeFileSync(cleanupPath,`${JSON.stringify({pid:process.pid,token:"active-cleaner",created_at:new Date().toISOString()})}\n`,"utf8");
  const result=execute(["add-module","--id","MOD-CLEANUP-BUSY","--name","경쟁","--purpose","cleanup 경쟁 차단"],{AIDD_WRITE_LOCK_TIMEOUT_MS:"50"});
  assert.equal(result.status,2,result.stdout+result.stderr);
  assert.match(result.stderr,/repository write lock/);
  assert.equal(readFileSync(catalogPath,"utf8"),before);
  assert.equal(existsSync(join(ssot,"modules/MOD-CLEANUP-BUSY.json")),false);
}));

test("add-module reclaims stale main and cleanup locks left by dead owners",()=>withReferenceProject(({temp,execute})=>{
  const ssot=join(temp,"project/.aidd/ssot"),lockPath=join(ssot,".write.lock"),cleanupPath=`${lockPath}.cleanup`;
  writeFileSync(lockPath,`${JSON.stringify({pid:2147483647,token:"stale-owner",created_at:"2000-01-01T00:00:00.000Z"})}\n`,"utf8");
  writeFileSync(cleanupPath,`${JSON.stringify({pid:2147483647,token:"stale-cleaner",created_at:"2000-01-01T00:00:00.000Z"})}\n`,"utf8");
  const result=execute(["add-module","--id","MOD-CLEANUP-RECOVERED","--name","복구","--purpose","죽은 cleanup 소유자 회수"]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  assert.equal(existsSync(join(ssot,"modules/MOD-CLEANUP-RECOVERED.json")),true);
  assert.equal(existsSync(join(ssot,"system-surfaces/MOD-CLEANUP-RECOVERED.json")),true);
  assert.equal(existsSync(lockPath),false);
  assert.equal(existsSync(cleanupPath),false);
}));

test("add-module fails closed for a malformed cleanup lock owner",()=>withReferenceProject(({temp,execute})=>{
  const ssot=join(temp,"project/.aidd/ssot"),lockPath=join(ssot,".write.lock"),cleanupPath=`${lockPath}.cleanup`;
  writeFileSync(lockPath,`${JSON.stringify({pid:2147483647,token:"stale-owner",created_at:"2000-01-01T00:00:00.000Z"})}\n`,"utf8");
  writeFileSync(cleanupPath,`${JSON.stringify({pid:"invalid",token:"malformed-cleaner",created_at:"2000-01-01T00:00:00.000Z"})}\n`,"utf8");
  const result=execute(["add-module","--id","MOD-MALFORMED-CLEANUP","--name","형식 오류","--purpose","잘못된 cleanup owner 차단"],{AIDD_WRITE_LOCK_TIMEOUT_MS:"50"});
  assert.equal(result.status,2,result.stdout+result.stderr);
  assert.match(result.stderr,/repository write lock/);
  assert.equal(existsSync(join(ssot,"modules/MOD-MALFORMED-CLEANUP.json")),false);
  assert.equal(existsSync(lockPath),true);
  assert.equal(existsSync(cleanupPath),true);
}));

test("documentation-check requires the explicit staged mode",()=>withReferenceProject(({execute})=>{
  const result=execute(["documentation-check"]);
  assert.equal(result.status,2,result.stdout+result.stderr);
  assert.match(result.stderr,/--staged/);
}));

test("module fragment initialization uses the canonical module owner field",()=>withReferenceProject(({temp,execute})=>{
  const ssot=join(temp,"project/.aidd/ssot");
  rmSync(join(ssot,"ui-modules/MOD-GOV.json"),{force:true});
  rmSync(join(ssot,"system-surfaces/MOD-GOV.json"),{force:true});
  for(const command of ["init-module-ui","init-module-surfaces"]){
    const result=execute([command,"--module","MOD-GOV"]);
    assert.equal(result.status,0,result.stdout+result.stderr);
  }
  assert.equal(JSON.parse(readFileSync(join(ssot,"ui-modules/MOD-GOV.json"),"utf8")).module,"MOD-GOV");
  assert.equal(JSON.parse(readFileSync(join(ssot,"system-surfaces/MOD-GOV.json"),"utf8")).module,"MOD-GOV");
}));

test("identity and integration commands use mapped and reachable Git identities",()=>withReferenceProject(({temp,execute})=>{
  initGit(temp,"unknown-user","unknown@example.com");
  writeFileSync(join(temp,"identity.txt"),"identity\n","utf8");
  git(temp,["add","identity.txt"]);
  git(temp,["commit","-m","identity fixture"]);
  const identity=execute(["identity-check"]);
  assert.equal(identity.status,1,identity.stdout+identity.stderr);
  assert.match(identity.stdout,/미등록 Git 신원/);
  assert.equal(execute(["identity-check","--warning-only"]).status,0);
  writeFileSync(join(temp,"dirty.txt"),"dirty\n","utf8");
  const integration=execute(["integration-status"]);
  assert.equal(integration.status,0,integration.stdout+integration.stderr);
  assert.match(integration.stdout,/현재 브랜치: `main`/);
  assert.match(integration.stdout,/작업 트리: 변경 있음/);
}));

test("record-work resolves the canonical actor and writes the documented path",()=>withReferenceProject(({temp,execute})=>{
  initGit(temp);
  const actor=execute(["current-actor"]);
  assert.equal(actor.status,0,actor.stdout+actor.stderr);
  assert.match(actor.stdout,/HUM-001/);
  const result=execute(["record-work","--date","2026-09-19","--summary","동등성 점검","--why","Node 전환 검증","--result","경로 확인","--next","게이트 검토","--link","CHG-011"]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  const path=join(temp,"project/work-log/2026-09/2026-09-19/HUM-001.md");
  assert.ok(existsSync(path));
  assert.match(readFileSync(path,"utf8"),/동등성 점검/);
  const invalid=execute(["record-work","--date","2026-02-30","--summary","잘못된 날짜","--why","검증","--result","거부","--next","수정"]);
  assert.equal(invalid.status,2,invalid.stdout+invalid.stderr);
  assert.match(invalid.stderr,/YYYY-MM-DD/);
}));

test("branch and assignment policies distinguish solo and team work",()=>withReferenceProject(({temp,execute})=>{
  initGit(temp);
  assert.equal(execute(["branch-check","--change","CHG-001"]).status,0);
  const path=join(temp,"project/.aidd/ssot/collaboration.json"),collaboration=JSON.parse(readFileSync(path,"utf8"));
  collaboration.policy.current_profile="CBP-TEAM";
  collaboration.participants[0].roles.push("PM");
  collaboration.participants.push({id:"HUM-002",name:"팀원",roles:["개발자"],status:"active",joined_at:"2026-09-19",left_at:null});
  collaboration.identity_mappings.push({id:"IDM-002",principal_type:"human",participant:"HUM-002",git_identities:[{name:"team-member",email:"team@example.com"}],hosting_accounts:[],verified_at:"2026-09-19T00:00:00Z",verified_by:"HUM-001",reason:"회귀 테스트"});
  writeJson(path,collaboration);
  const branch=execute(["branch-check","--change","CHG-001"]);
  assert.equal(branch.status,1,branch.stdout+branch.stderr);
  assert.match(branch.stdout,/직접 커밋할 수 없습니다/);
  const policy=execute(["set-assignment-policy","--mode","self_assignment","--reason","회귀 테스트"]);
  assert.equal(policy.status,0,policy.stdout+policy.stderr);
  git(temp,["config","user.name","team-member"]);
  git(temp,["config","user.email","team@example.com"]);
  const denied=execute(["assign-work","--work","WRK-012","--participant","HUM-001","--reason","허용되지 않는 타인 배정"]);
  assert.equal(denied.status,2,denied.stdout+denied.stderr);
  assert.match(denied.stderr,/자신에게만/);
}));

test("documentation and release checks enforce their documented blockers",()=>withReferenceProject(({temp,execute})=>{
  initGit(temp);
  mkdirSync(join(temp,"project/src"),{recursive:true});
  writeFileSync(join(temp,"project/src/app.js"),"export const value = 1;\n","utf8");
  git(temp,["add","project/src/app.js"]);
  const documentation=execute(["documentation-check","--staged"]);
  assert.equal(documentation.status,1,documentation.stdout+documentation.stderr);
  assert.match(documentation.stdout,/대응하는 시스템 표면 또는 레거시 계획이 없습니다/);
  const release=execute(["release-check","--release","REL-001"]);
  assert.equal(release.status,1,release.stdout+release.stderr);
  assert.match(release.stdout,/TC-004 테스트가 통과하지 않았습니다/);
  assert.match(release.stdout,/Release REL-001 is blocked/);
}));
