import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const ROOT=resolve(import.meta.dirname,"../..");
const run=(workspace,args)=>spawnSync(process.execPath,[join(workspace,".ai/tools/aidd.mjs"),...args],{cwd:workspace,encoding:"utf8",maxBuffer:10*1024*1024});

test("중요 결정은 안정 ID에 연결된 월별 append-only HIS로 기록한다",()=>{
  const temporary=mkdtempSync(join(tmpdir(),"aidd-history-policy-")),workspace=join(temporary,"workspace");
  try{
    cpSync(join(ROOT,".ai"),join(workspace,".ai"),{recursive:true});
    cpSync(join(ROOT,".aidd-kit-dev/fixtures/reference-project"),join(workspace,"project"),{recursive:true});
    writeFileSync(join(workspace,".aidd-role.json"),'{"schema_version":1,"role":"product-workspace","managed_by":"history.test","mutable_by_user":false}\n',"utf8");
    const result=run(workspace,["record-history","--id","HIS-20260921-002","--occurred-at","2026-09-21T12:00:00.000Z","--type","design","--subject","REQ-036","--subject","ADR-013","--change","CHG-014","--decided-by","프로젝트팀 오프라인 협의","--decision","현재 정본과 별도 결정 이력을 함께 유지한다.","--reason","현재 상태를 간결하게 유지하면서 과거 선택의 이유와 영향을 복원하기 위해서다.","--previous","현재 정본만 유지했다.","--impact","MOD-GOV","--source-ref","회의록 2026-09-21"]);
    assert.equal(result.status,0,`${result.error?.message??""}\n${result.stdout}\n${result.stderr}`);
    const path=join(workspace,"project/.aidd/ssot/history/2026-09/HIS-20260921-002.json");
    assert.equal(existsSync(path),true);
    const event=JSON.parse(readFileSync(path,"utf8"));
    assert.deepEqual(event.subjects,["REQ-036","ADR-013"]);
    assert.equal(event.decided_by,"프로젝트팀 오프라인 협의");
    assert.match(readFileSync(join(workspace,"project/docs/generated/decision-history.md"),"utf8"),/HIS-20260921-002/);
    const invalid=run(workspace,["record-history","--id","HIS-20260921-003","--occurred-at","2026-09-21T13:00:00.000Z","--type","design","--subject","REQ-999","--decided-by","프로젝트팀","--decision","잘못된 대상","--reason","검증"]);
    assert.notEqual(invalid.status,0);
    assert.match(invalid.stderr,/알 수 없는 이력 대상/);
    assert.equal(existsSync(join(workspace,"project/.aidd/ssot/history/2026-09/HIS-20260921-003.json")),false);
  }finally{
    const resolved=resolve(temporary),temporaryRoot=resolve(tmpdir());
    if(!resolved.startsWith(`${temporaryRoot}\\`)||!basename(resolved).startsWith("aidd-history-policy-"))throw new Error(`unsafe temporary cleanup target: ${resolved}`);
    rmSync(resolved,{recursive:true,force:true});
  }
});
