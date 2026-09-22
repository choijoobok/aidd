import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, cpSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { bootstrapV2, runOwned } from '../../.ai/tools/lib/owned-cli.mjs';
import { record, recordPath, definitionHash } from '../../.ai/tools/lib/record-contracts.mjs';
import { RecordStore } from '../../.ai/tools/lib/record-store.mjs';
import { putRecord } from '../../.ai/tools/lib/record-transaction.mjs';
import { evaluate, POLICIES } from '../../.ai/tools/lib/readiness.mjs';
import { runGate } from '../../.ai/tools/lib/lifecycle-operations.mjs';
import { stagedDocumentation } from '../../.ai/tools/lib/source-documentation.mjs';
import { impactGraph } from '../../.ai/tools/lib/dependency-graph.mjs';
import { briefing } from '../../.ai/tools/lib/record-views.mjs';
import { developmentFixture, approval, known, na } from './helpers/modular-fixture.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(),'aidd-special-')); t.after(() => rmSync(root,{recursive:true,force:true}));
  bootstrapV2(root,{'project-id':'PRJ-S08',name:'integration fixture'}); const store = new RecordStore(join(root,'project'));
  mkdirSync(join(root,'.ai'),{recursive:true}); cpSync(resolve('.ai/manifests'),join(root,'.ai/manifests'),{recursive:true});
  const put = r => putRecord(store,r,{operation:`put-${r.id}`}); put(record('MOD','MOD-A','MOD-A','A')); put(record('MOD','MOD-B','MOD-B','B'));
  return {root,store,put,run:(cmd,args=[]) => runOwned(root,cmd,args).data};
}
test('term card is read-only; apply is atomic, replay-safe, retired history is preserved',t => {
  const {run,store} = fixture(t);
  const args = ['--action','add','--id','TRM-REQUEST','--term','고객 요청','--key','customerRequest','--concept-type','business','--category','고객지원','--definition','처리를 요청한 업무','--scope','접수부터 종료'];
  const card = run('term-review',args); assert.equal(card.after.type,'TRM'); assert.equal(store.readRecord('TRM-REQUEST').record,undefined);
  const apply = [...args,'--history','TCH-ADD','--decided-by','fixture decision','--summary','fixture only','--operation','term-add'];
  assert.equal(run('term-apply',apply).transaction.state,'committed'); assert.equal(run('term-apply',apply).replayed,true);
  run('term-apply',['--action','remove','--id','TRM-REQUEST','--history','TCH-REMOVE','--decided-by','fixture','--summary','retire','--operation','term-remove']);
  assert.equal(store.readRecord('TRM-REQUEST').record.lifecycle,'retired'); assert.equal(store.readRecord('TCH-ADD').record.definition.after.lifecycle,'active');
});
test('term removal with live reference is refused without losing current record',t => {
  const {run,store,put} = fixture(t); put(record('TRM','TRM-A',null,'old',{definition:'old concept',key:'oldKey'})); put(record('DOC','DOC-A','MOD-A','uses term',{term:'TRM-A'}));
  assert.throws(() => run('term-apply',['--action','remove','--id','TRM-A','--history','TCH-X','--decided-by','fixture','--summary','test','--operation','remove']),/DOC-A/);
  assert.notEqual(store.readRecord('TRM-A').record.lifecycle,'retired');
});
test('history preserves stable ID, date, supersession and append-only owner',t => {
  const {run,store} = fixture(t); const args = ['--id','HIS-20260922-001','--type','decision','--subject','MOD-A','--decided-by','fixture','--decision','keep scope','--reason','test','--occurred-at','2026-09-22T01:00:00.000Z','--operation','history'];
  run('record-history',args); assert.equal(store.readRecord('HIS-20260922-001').record.owner.id,'MOD-A'); assert.equal(run('record-history',args).replayed,true);
  assert.throws(() => run('record-history',args.map(x => x === 'history' ? 'history-again' : x)),{code:'immutable_record'});
  assert.throws(() => run('record-history',args.map(x => x === '2026-09-22T01:00:00.000Z' ? '2026-09-23T01:00:00.000Z' : x)),/operation/);
});
test('assumptions block only affected scope and are resolved with history',t => {
  const {run,store} = fixture(t); run('add-assumption',['--id','ASM-A','--statement','one instance','--rationale','unknown','--due-gate','DG-001','--module','MOD-A','--operation','asm']);
  const records = developmentFixture({ui:false}); records.push(store.readRecord('ASM-A').record);
  assert(evaluate(records,'WRK-A','development').blockers.some(b => b.subject === 'ASM-A'));
  records.at(-1).definition.applies_to = ['MOD-B']; assert.equal(evaluate(records,'WRK-A','development').readiness,'ready');
  run('resolve-assumption',['--id','ASM-A','--resolution','confirmed in fixture','--status','confirmed','--operation','resolve']); assert.equal(store.readRecord('ASM-A').record.execution.status,'completed');
});
test('module UI/surface entry points explain v2 drafts without inventing product facts',t => {
  const {run,store} = fixture(t); const before = store.scanAll().snapshot_token;
  for (const cmd of ['init-module-ui','init-module-surfaces']) { const r = run(cmd,['--module','MOD-A']); assert.equal(r.initialized,false); assert.deepEqual(r.records,[]); }
  assert.equal(store.scanAll().snapshot_token,before);
});
test('merge assessment and recheck retain actual test evidence and failed state',t => {
  const {run,put,store} = fixture(t); put(record('MRG','MRG-A',null,'merge',{assessment:'pending',applies_to:['project']}));
  run('assess-merge',['--merge','MRG-A','--modules','MOD-A','--notes','fixture','--additional-testing','required','--operation','assess']);
  const tc = record('TC','TC-A','MOD-A','test',{}); put(tc);
  run('add-merge-recheck',['--merge','MRG-A','--type','test','--title','retest','--module','MOD-A','--test','TC-A','--blocking','--operation','recheck']);
  const args = ['--merge','MRG-A','--recheck','MRC-001','--performed-by','fixture','--result','passed','--operation','complete'];
  assert.throws(() => run('complete-merge-recheck',args),/evidence/);
  put(record('EVD','EVD-TC','MOD-A','fixture evidence',{subjects:['TC-A'],kind:'test',result:'passed',input_hash:definitionHash(tc),command:'fixture test',occurred_at:'2026-09-22T01:00:00Z',artifacts:['fixture:test']}));
  run('complete-merge-recheck',[...args,'--evidence','EVD-TC']); assert.equal(store.readRecord('MRC-001').record.execution.status,'completed');
});
test('provider evaluation has explicit not_run/actual/stale; fixture without actual mode cannot pass',t => {
  const {run,put,store} = fixture(t); const s = record('EVS','EVS-A',null,'fixture scenario',{rubric:['trace','decision']}); put(s);
  assert(run('evaluation-status').evaluations.every(e => e.status === 'not_run'));
  const evd = record('EVD','EVD-EVAL',null,'simulated input, not real provider acceptance',{subjects:['EVS-A'],kind:'provider_evaluation',result:'passed',input_hash:definitionHash(s),command:'fixture mock',occurred_at:'2026-09-22T01:00:00Z',artifacts:['fixture:only'],environment:'codex',mode:'stub'}); put(evd);
  const args = ['--scenario','EVS-A','--platform','codex','--status','passed','--scores','2','2','--summary','fixture only','--operation','eval'];
  assert.throws(() => run('record-evaluation',[...args,'--evidence','EVD-EVAL']),/actual/);
  evd.id = 'EVD-ACTUAL'; evd.definition.mode = 'actual'; put(evd); run('record-evaluation',[...args,'--evidence','EVD-ACTUAL']);
  assert.equal(run('evaluation-status').evaluations[0].status,'passed');
  const v = store.readRecord('EVS-A'); s.revision++; s.definition.rubric.push('scope'); putRecord(store,s,{operation:'scenario-change',expected:v.hashes[recordPath(s)]}); assert.equal(run('evaluation-status').evaluations[0].status,'stale');
});
test('restored deployment/technology/foundation IDs cannot stand for release',t => {
  const {store,put} = fixture(t); put(record('REL','REL-A','MOD-A','release',{works:[]}));
  assert.equal(POLICIES['DG-001'],'deployment'); assert.equal(POLICIES['TG-001'],'technology'); assert.equal(POLICIES['TG-002'],'foundation');
  assert.throws(() => runGate(store,'REL-A','TG-001','wrong-scope'),/requires CHG/);
  const records = developmentFixture({ui:false}), chg = records.find(r => r.id === 'CHG-A');
  chg.definition.gate_applicability.deployment = known(['DEP-A']); const dep = record('DEP','DEP-A','MOD-A','deployment',{}); records.push(dep);
  assert(evaluate(records,'CHG-A','deployment').blockers.some(b => b.code === 'deployment_detail'));
  for (const key of ['location','dbms','instances','workload','slo','recovery','state','operating_constraints']) dep.definition[key] = known('fixture');
  records.splice(0,records.length,...records.filter(r => r.type !== 'RVW'));
  approval(records,'scope',['CHG-A'],'UPDATED-SCOPE'); approval(records,'design',['DEP-A'],'DEP');
  assert.equal(evaluate(records,'CHG-A','deployment').readiness,'ready');
});
test('staged source must have one CHG and changed canonical documentation or actionable legacy work',t => {
  const {root,store,put} = fixture(t);
  put(record('CHG','CHG-A','MOD-A','change',{delivery_path:{surfaces:['SURF-A'],documentation:'update_now'}}));
  putRecord(store,record('SURF','SURF-A','MOD-A','API',{source_patterns:['project/src/**'],documentation_status:'current',documentation_sources:['project/.aidd/ssot/modules/MOD-A/FEAT/FEAT-A.json']}),{operation:'surface',change:'CHG-A'});
  assert(stagedDocumentation(root,store,['project/src/api.mjs']).diagnostics.length);
  assert.equal(stagedDocumentation(root,store,['project/src/api.mjs','project/.aidd/ssot/modules/MOD-A/FEAT/FEAT-A.json']).diagnostics.length,0);
  put(record('CHG','CHG-B','MOD-A','overlap',{delivery_path:{surfaces:['SURF-A'],documentation:'update_now'}})); assert(stagedDocumentation(root,store,['project/src/api.mjs']).diagnostics.length);
});
test('both isolated post hooks handle Windows TRM paths and avoid transaction lock refresh',t => {
  const {root} = fixture(t); mkdirSync(join(root,'.ai/hooks'),{recursive:true}); mkdirSync(join(root,'.ai/tools'),{recursive:true});
  writeFileSync(join(root,'.ai/tools/aidd.mjs'),"process.exitCode=7;\n");
  for (const provider of ['codex','claude']) {
    const filename = `${provider}-post-check.mjs`; cpSync(resolve('.ai/hooks',filename),join(root,'.ai/hooks',filename));
    const run = () => spawnSync(process.execPath,[join(root,'.ai/hooks',filename)],{input:JSON.stringify({tool_input:{file_path:'project\\.aidd\\ssot\\modules\\MOD-A\\TRM\\TRM-A.json'}}),encoding:'utf8'});
    assert.match(run().stderr,/terminology/);
  }
  mkdirSync(join(root,'project/.aidd/work/write.lock'),{recursive:true});
  for (const provider of ['codex','claude']) { const r = spawnSync(process.execPath,[join(root,'.ai/hooks',`${provider}-post-check.mjs`)],{input:JSON.stringify({tool_input:{file_path:'project/.aidd/ssot/common/TRM/TRM-A.json'}}),encoding:'utf8'}); assert.equal(r.stderr,''); }
});
test('dependency fields propagate architecture impact to CHG/WRK without copying common definitions',() => {
  const records = developmentFixture({ui:false}), chg = records.find(r => r.type === 'CHG');
  chg.definition.gate_applicability.deployment = known(['DEP-SHARED']); records.push(record('DEP','DEP-SHARED',null,'shared deployment'));
  const impact = impactGraph(records,'DEP-SHARED'); assert(impact.candidates.some(c => c.id === 'CHG-A')); assert(impact.candidates.some(c => c.id === 'WRK-A'));
});
test('briefing preserves all question groups, recommends waiting group, includes related common questions',() => {
  const records = developmentFixture({ui:false});
  for (const [id,status,asked_at,priority,sequence] of [['DRQ-DRAFT','draft',null,1,1],['DRQ-A','awaiting_decision','2026-09-21T01:00:00Z',2,1],['DRQ-B','awaiting_decision','2026-09-21T01:00:00Z',2,2],['DRQ-C','awaiting_decision','2026-09-22T01:00:00Z',3,1]]) records.push(record('DRQ',id,null,id,{status,asked_at,priority,sequence,applies_to:['CHG-A'],question:id}));
  const view = {records,coverage:{scope_complete:true},diagnostics:[]}, result = briefing(view,{id:'CHG-A'});
  assert.equal(result.decision_summary.waiting_groups,2); assert.equal(result.decision_summary.counts.awaiting_decision,3); assert.deepEqual(result.recommended_questions.map(q => q.id),['DRQ-A','DRQ-B']); assert.equal(result.pending_decisions.length,4);
});
