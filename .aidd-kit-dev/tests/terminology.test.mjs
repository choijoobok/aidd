import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const ROOT=resolve(import.meta.dirname,"../..");
const readJson=path=>JSON.parse(readFileSync(path,"utf8"));
const writeJson=(path,value)=>writeFileSync(path,`${JSON.stringify(value,null,2)}\n`,"utf8");
const run=(workspace,args)=>spawnSync(process.execPath,[join(workspace,".ai/tools/aidd.mjs"),...args],{cwd:workspace,encoding:"utf8",maxBuffer:10*1024*1024});

test("용어 카드는 읽기 전용이고 오프라인 결정 뒤 신원·역할 없이 적용한다",()=>{
  const temporary=mkdtempSync(join(tmpdir(),"aidd-terminology-policy-")),workspace=join(temporary,"workspace");
  try{
    cpSync(join(ROOT,".ai"),join(workspace,".ai"),{recursive:true});
    cpSync(join(ROOT,".aidd-kit-dev/fixtures/reference-project"),join(workspace,"project"),{recursive:true});
    writeJson(join(workspace,".aidd-role.json"),{schema_version:1,role:"product-workspace",managed_by:"terminology.test",mutable_by_user:false});
    const terminologyPath=join(workspace,"project/.aidd/ssot/terminology.json"),beforeReview=readFileSync(terminologyPath,"utf8"),definition="고객이 지원이나 처리를 요청하는 업무 단위다.",scope="지원 조직이 접수하고 처리 상태를 추적하는 요청에 사용한다.",common=["--action","add","--id","TRM-002","--term","지원 요청","--key","supportRequest","--concept-type","business","--category","고객지원/처리","--definition",definition,"--scope",scope,"--example","지원 요청 SR-123의 처리 상태를 확인한다.","--related-term","TRM-001","--distinguish-from","TRM-001","--distinction","지원 요청은 지원 조직이 접수하고 처리 상태를 추적하지만 고객 요청은 분석 전 입력 전체를 뜻한다.","--decision-rule","지원 조직의 접수 번호와 상태가 있으면 지원 요청으로 부른다.","--audience","end_user","--visibility","customer"];
    const review=run(workspace,["term-review",...common]);
    assert.equal(review.status,0,review.stderr);
    assert.match(review.stdout,/정본 변경: 아직 수행하지 않음/);
    assert.match(review.stdout,/오프라인 결정용 용어 확인 카드/);
    assert.equal(readFileSync(terminologyPath,"utf8"),beforeReview);
    const externalWithoutOrigin=run(workspace,["term-review","--action","add","--id","TRM-003","--term","외부 노드","--key","externalNode","--concept-type","external","--category","프레임워크","--definition","외부 프레임워크가 정의한 실행 단위다.","--scope","해당 프레임워크 구현 설명에만 사용한다."]);
    assert.equal(externalWithoutOrigin.status,0,externalWithoutOrigin.stderr);
    assert.match(externalWithoutOrigin.stdout,/external terminology requires origin/);
    const added=run(workspace,["term-apply",...common,"--history","TCH-002","--confusion-reason","요구분석에서 두 표현이 같은 뜻으로 사용됐다.","--decided-by","프로젝트팀 오프라인 협의","--summary","영향 검토 후 용어 추가","--source-ref","회의록 2026-09-21"]);
    assert.equal(added.status,0,added.stderr);
    assert.match(added.stdout,/결정자·이유/);
    const afterAdd=readJson(terminologyPath),term=afterAdd.terms.find(item=>item.id==="TRM-002"),history=afterAdd.change_history.find(item=>item.id==="TCH-002");
    assert.equal(term.concept_type,"business");
    assert.equal(term.managed_by,undefined);
    assert.equal(history.decided_by,"프로젝트팀 오프라인 협의");
    assert.deepEqual(history.source_refs,["회의록 2026-09-21"]);
    assert.equal(history.approved_by,undefined);
    assert.match(readFileSync(join(workspace,"project/docs/generated/glossary.md"),"utf8"),/헷갈리기 쉬운 용어 구분/);
    const changed=run(workspace,["term-apply","--action","change","--id","TRM-002","--history","TCH-003","--term","서비스 요청","--decided-by","프로젝트팀 오프라인 협의","--summary","명칭 변경 결정"]);
    assert.equal(changed.status,0,changed.stderr);
    const removed=run(workspace,["term-apply","--action","remove","--id","TRM-002","--history","TCH-004","--decided-by","프로젝트팀 오프라인 협의","--summary","용어 제거 결정"]);
    assert.equal(removed.status,0,removed.stderr);
    assert.equal(readJson(terminologyPath).terms.some(item=>item.id==="TRM-002"),false);
    const validation=run(workspace,["validate"]);
    assert.equal(validation.status,0,validation.stdout+validation.stderr);
  }finally{
    const resolved=resolve(temporary),temporaryRoot=resolve(tmpdir());
    if(!resolved.startsWith(`${temporaryRoot}\\`)||!basename(resolved).startsWith("aidd-terminology-policy-"))throw new Error(`unsafe temporary cleanup target: ${resolved}`);
    rmSync(resolved,{recursive:true,force:true});
  }
});
