import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const ROOT=resolve(import.meta.dirname,"../..");
const readJson=path=>JSON.parse(readFileSync(path,"utf8"));
const writeJson=(path,value)=>writeFileSync(path,`${JSON.stringify(value,null,2)}\n`,"utf8");

function run(workspace,args){
  return spawnSync(process.execPath,[join(workspace,".ai/tools/aidd.mjs"),...args],{cwd:workspace,encoding:"utf8"});
}

test("PM reviews then atomically applies terminology while team members cannot apply it",()=>{
  const temporary=mkdtempSync(join(tmpdir(),"aidd-terminology-policy-")),workspace=join(temporary,"workspace");
  try{
    cpSync(join(ROOT,".ai"),join(workspace,".ai"),{recursive:true});
    cpSync(join(ROOT,".aidd-kit-dev/fixtures/reference-project"),join(workspace,"project"),{recursive:true});
    writeJson(join(workspace,".aidd-role.json"),{schema_version:1,role:"product-workspace",managed_by:"terminology.test",mutable_by_user:false});
    assert.equal(spawnSync("git",["init","-b","main"],{cwd:workspace,encoding:"utf8"}).status,0);
    assert.equal(spawnSync("git",["config","user.name","joobok"],{cwd:workspace,encoding:"utf8"}).status,0);
    assert.equal(spawnSync("git",["config","user.email","bbundoli@naver.com"],{cwd:workspace,encoding:"utf8"}).status,0);

    const terminologyPath=join(workspace,"project/.aidd/ssot/terminology.json"),beforeReview=readFileSync(terminologyPath,"utf8"),definition="고객이 지원이나 처리를 요청하는 업무 단위다.",scope="지원 조직이 접수하고 처리 상태를 추적하는 요청에 사용한다.";
    const review=run(workspace,["term-review","--action","add","--id","TRM-002","--term","지원 요청","--key","supportRequest","--concept-type","business","--category","고객지원/처리","--definition",definition,"--scope",scope,"--example","지원 요청 SR-123의 처리 상태를 확인한다.","--related-term","TRM-001","--distinguish-from","TRM-001","--distinction","지원 요청은 지원 조직이 접수하고 처리 상태를 추적하지만 고객 요청은 분석 전 입력 전체를 뜻한다.","--decision-rule","지원 조직의 접수 번호와 상태가 있으면 지원 요청으로 부른다.","--requested-by","HUM-001","--audience","project_team"]);
    assert.equal(review.status,0,review.stderr);
    assert.match(review.stdout,/정본 변경: 아직 수행하지 않음/);
    assert.match(review.stdout,/business \/ 고객지원\/처리/);
    assert.match(review.stdout,/TRM-001/);
    assert.equal(readFileSync(terminologyPath,"utf8"),beforeReview);
    const externalWithoutOrigin=run(workspace,["term-review","--action","add","--id","TRM-003","--term","외부 노드","--key","externalNode","--concept-type","external","--category","프레임워크","--definition","외부 프레임워크가 정의한 실행 단위다.","--scope","해당 프레임워크 구현 설명에만 사용한다.","--requested-by","HUM-001"]);
    assert.equal(externalWithoutOrigin.status,0,externalWithoutOrigin.stderr);
    assert.match(externalWithoutOrigin.stdout,/external terminology requires origin/);

    const collaborationPath=join(workspace,"project/.aidd/ssot/collaboration.json"),collaboration=readJson(collaborationPath);
    collaboration.policy.current_profile="CBP-TEAM";
    collaboration.participants.push({id:"HUM-002",name:"개발자",roles:["개발자"],status:"active",joined_at:"2026-09-21",left_at:null});
    collaboration.identity_mappings.push({id:"IDM-002",principal_type:"human",participant:"HUM-002",git_identities:[{name:"member",email:"member@example.com"}],hosting_accounts:[],verified_at:"2026-09-21",verified_by:"HUM-001",reason:"용어 정책 테스트"});
    writeJson(collaborationPath,collaboration);
    spawnSync("git",["config","user.name","member"],{cwd:workspace,encoding:"utf8"});
    spawnSync("git",["config","user.email","member@example.com"],{cwd:workspace,encoding:"utf8"});
    const denied=run(workspace,["term-apply","--action","add","--id","TRM-002","--history","TCH-002","--term","지원 요청","--key","supportRequest","--concept-type","business","--category","고객지원/처리","--definition",definition,"--scope",scope,"--approved-by","HUM-002","--summary","팀원 적용 시도"]);
    assert.notEqual(denied.status,0);
    assert.match(denied.stderr,/활성 PM만 요청하고 승인/);

    spawnSync("git",["config","user.name","joobok"],{cwd:workspace,encoding:"utf8"});
    spawnSync("git",["config","user.email","bbundoli@naver.com"],{cwd:workspace,encoding:"utf8"});
    const added=run(workspace,["term-apply","--action","add","--id","TRM-002","--history","TCH-002","--term","지원 요청","--key","supportRequest","--concept-type","business","--category","고객지원/처리","--definition",definition,"--scope",scope,"--example","지원 요청 SR-123의 처리 상태를 확인한다.","--related-term","TRM-001","--distinguish-from","TRM-001","--distinction","지원 요청은 지원 조직이 접수하고 처리 상태를 추적하지만 고객 요청은 분석 전 입력 전체를 뜻한다.","--decision-rule","지원 조직의 접수 번호와 상태가 있으면 지원 요청으로 부른다.","--confusion-reason","요구분석에서 두 표현이 같은 뜻으로 사용됐다.","--approved-by","HUM-001","--summary","PM 영향 검토 후 용어 추가","--audience","project_team"]);
    assert.equal(added.status,0,added.stderr);
    assert.match(added.stdout,/파생 문서 생성, 전체 검증을 완료/);
    const afterAdd=readJson(terminologyPath).terms.find(item=>item.id==="TRM-002");
    assert.equal(afterAdd.concept_type,"business");
    assert.equal(afterAdd.scope,scope);
    assert.deepEqual(afterAdd.related_terms,["TRM-001"]);
    assert.equal(afterAdd.distinctions[0].term,"TRM-001");
    assert.match(readFileSync(join(workspace,"project/docs/generated/glossary.md"),"utf8"),/헷갈리기 쉬운 용어 구분/);

    const changed=run(workspace,["term-apply","--action","change","--id","TRM-002","--history","TCH-003","--term","서비스 요청","--approved-by","HUM-001","--summary","PM 확인 후 명칭 변경"]);
    assert.equal(changed.status,0,changed.stderr);
    const removed=run(workspace,["term-apply","--action","remove","--id","TRM-002","--history","TCH-004","--approved-by","HUM-001","--summary","PM 확인 후 용어 제거"]);
    assert.equal(removed.status,0,removed.stderr);

    const terminology=readJson(terminologyPath);
    assert.equal(terminology.terms.some(item=>item.id==="TRM-002"),false);
    assert.deepEqual(terminology.change_history.slice(-3).map(item=>item.action),["add","change","remove"]);
    const validation=run(workspace,["validate"]);
    assert.equal(validation.status,0,validation.stdout+validation.stderr);
  }finally{
    const resolved=resolve(temporary),temporaryRoot=resolve(tmpdir());
    if(!resolved.startsWith(`${temporaryRoot}\\`)||!basename(resolved).startsWith("aidd-terminology-policy-"))throw new Error(`unsafe temporary cleanup target: ${resolved}`);
    rmSync(resolved,{recursive:true,force:true});
  }
});
