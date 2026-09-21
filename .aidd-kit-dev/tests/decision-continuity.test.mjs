import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const ROOT=resolve(import.meta.dirname,"../..");
const run=(workspace,args)=>spawnSync(process.execPath,[join(workspace,".ai/tools/aidd.mjs"),...args],{cwd:workspace,encoding:"utf8",maxBuffer:10*1024*1024});
const readJson=path=>JSON.parse(readFileSync(path,"utf8"));
const writeJson=(path,value)=>writeFileSync(path,`${JSON.stringify(value,null,2)}\n`,"utf8");

function withWorkspace(callback){
  const temporary=mkdtempSync(join(tmpdir(),"aidd-decision-continuity-")),workspace=join(temporary,"workspace");
  try{
    cpSync(join(ROOT,".ai"),join(workspace,".ai"),{recursive:true});
    cpSync(join(ROOT,".aidd-kit-dev/fixtures/reference-project"),join(workspace,"project"),{recursive:true});
    writeFileSync(join(workspace,".aidd-role.json"),'{"schema_version":1,"role":"product-workspace","managed_by":"decision-continuity.test","mutable_by_user":false}\n',"utf8");
    callback(workspace);
  }finally{
    const resolved=resolve(temporary),temporaryRoot=resolve(tmpdir());
    if(!resolved.startsWith(`${temporaryRoot}\\`)||!basename(resolved).startsWith("aidd-decision-continuity-"))throw new Error(`unsafe temporary cleanup target: ${resolved}`);
    rmSync(resolved,{recursive:true,force:true});
  }
}

test("상태 브리핑은 OI와 복수 DRQ 묶음을 구분하고 우선 질문을 마지막에 복원한다",()=>withWorkspace(workspace=>{
  const executive=run(workspace,["status"]);
  assert.equal(executive.status,0,`${executive.error?.message??""}\n${executive.stdout??""}\n${executive.stderr??""}`);
  assert.match(executive.stdout,/- 미결 항목\(OI\): \d+ \(차단 \d+\)/);
  assert.match(executive.stdout,/- 결정 요청\(DRQ\): 답변 대기 2건\/2묶음 \(차단 0\) · 준비 0 · 보류 0/);
  assert.match(executive.stdout,/- 권장 다음 작업: DRQ-001 우선 결정 묶음에 답변/);
  assert.match(executive.stdout,/첫 AIDD 파일럿은 신규 구축 제품과 기존 시스템의 단일 모듈 중 어느 쪽으로 진행할까요\?/);
  assert.match(executive.stdout,/1\. 신규 구축 제품/);
  assert.match(executive.stdout,/- 권장안: 기존 시스템의 경계가 작은 단일 모듈/);
  assert.equal(executive.stdout.trimEnd().endsWith("- 차단 여부: 비차단"),true);

  const detail=run(workspace,["status","--level","detail"]);
  assert.equal(detail.status,0,`${detail.error?.message??""}\n${detail.stdout??""}\n${detail.stderr??""}`);
  assert.match(detail.stdout,/## 결정 대기열/);
  assert.match(detail.stdout,/## 기록된 다음 작업/);
  assert.match(detail.stdout,/DRQ-002/);
  assert.ok(detail.stdout.lastIndexOf("## 우선 답변할 결정")>detail.stdout.lastIndexOf("## 기록된 다음 작업"));
}));

test("decision_requests가 없는 기존 작업 보드는 빈 대기열로 호환된다",()=>withWorkspace(workspace=>{
  const path=join(workspace,"project/.aidd/ssot/workboard.json"),board=readJson(path);
  delete board.decision_requests;
  writeJson(path,board);
  const generated=run(workspace,["generate"]);
  assert.equal(generated.status,0,`${generated.error?.message??""}\n${generated.stdout??""}\n${generated.stderr??""}`);
  const validated=run(workspace,["validate"]);
  assert.equal(validated.status,0,`${validated.error?.message??""}\n${validated.stdout??""}\n${validated.stderr??""}`);
  const status=run(workspace,["status"]);
  assert.match(status.stdout,/- 결정 요청\(DRQ\): 답변 대기 0건\/0묶음 \(차단 0\) · 준비 0 · 보류 0/);
}));

test("열린 OI 없는 질문, 알 수 없는 대상과 묶음당 3건 초과를 거부한다",()=>withWorkspace(workspace=>{
  const path=join(workspace,"project/.aidd/ssot/workboard.json"),board=readJson(path);
  board.decision_requests[0].subject_refs.push("REQ-999");
  board.decision_requests[1].subject_refs=["REQ-016"];
  for(let index=2;index<=4;index++)board.decision_requests.push({...structuredClone(board.decision_requests[0]),id:`DRQ-00${index+2}`,title:`추가 질문 ${index}`,question:`추가 질문 ${index}에 답하시겠습니까?`,sequence:index});
  writeJson(path,board);
  const validated=run(workspace,["validate"]);
  assert.notEqual(validated.status,0);
  assert.match(`${validated.stdout??""}${validated.stderr??""}`,/DRQ-001: unknown decision subject REQ-999/,validated.error?.message);
  assert.match(`${validated.stdout??""}${validated.stderr??""}`,/DRQ-002 pending decision must reference an open OI/,validated.error?.message);
  assert.match(`${validated.stdout??""}${validated.stderr??""}`,/workboard\.json decision batch 2026-09-18T09:00:00\+09:00 has more than 3 questions/,validated.error?.message);
}));

test("bootstrap 단계도 고정 문구로 숨기지 않고 실제 결정 현황을 보고한다",()=>withWorkspace(workspace=>{
  const path=join(workspace,"project/.aidd/ssot/project.json"),project=readJson(path);
  project.phase="bootstrap";
  writeJson(path,project);
  const status=run(workspace,["status"]);
  assert.equal(status.status,0,`${status.error?.message??""}\n${status.stdout??""}\n${status.stderr??""}`);
  assert.match(status.stdout,/- 착수 상태: 제품 정본 골격을 현재 프로젝트 사실로 구체화하는 중입니다\./);
  assert.match(status.stdout,/- 결정 요청\(DRQ\): 답변 대기 2건\/2묶음/);
  assert.doesNotMatch(status.stdout,/프로젝트 골격만 생성되었습니다/);
}));
