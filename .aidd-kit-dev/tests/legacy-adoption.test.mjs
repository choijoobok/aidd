import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,cpSync } from 'node:fs';
import { join,resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { developmentFixture,approval,approveBusiness,known } from './helpers/modular-fixture.mjs';
import { bootstrapV2,runOwned } from '../../.ai/tools/lib/owned-cli.mjs';
import { RecordStore } from '../../.ai/tools/lib/record-store.mjs';
import { record,recordPath,definitionHash,contentHash } from '../../.ai/tools/lib/record-contracts.mjs';
import { transact,recover } from '../../.ai/tools/lib/record-transaction.mjs';
import { legacyInventory } from '../../.ai/tools/lib/legacy-inventory.mjs';
import { legacyAdoptionCheck,legacyAdoptionModel,legacyAdopt } from '../../.ai/tools/lib/legacy-adoption.mjs';
import { evaluate } from '../../.ai/tools/lib/readiness.mjs';
import { briefing } from '../../.ai/tools/lib/record-views.mjs';
import { generateDocuments,checkDocuments } from '../../.ai/tools/lib/document-renderer.mjs';
const user={reviewer:'synthetic customer',occurred_at:'2026-09-23T02:00:00Z',decision_source:{kind:'user',reference:'fixture only, not actual customer approval'}};
function fixture(t,{ui=false}={}){
  const root=mkdtempSync(join(tmpdir(),'aidd-adopt-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
  const source=join(root,'legacy');mkdirSync(source);writeFileSync(join(source,'app.txt'),'Cancellation source fixture\n');
  const inventory=legacyInventory({roots:[{key:'source',path:source,kind:'source'}]});
  bootstrapV2(root,{'project-id':'PRJ-ADOPT',name:'Adoption fixture'});const store=new RecordStore(join(root,'project'));
  const records=developmentFixture({ui}).filter(r=>r.type!=='RVW'),get=id=>records.find(r=>r.id===id),chg=get('CHG-A');
  get('MOD-A').definition.purpose='주문 관리';get('MOD-B').definition.purpose='독립 운영';
  get('FEAT-CANCEL').definition.analysis=known('Cancel once');
  records.push(record('LDP','LDP-LEGACY',null,'자료 조사',{kind:'reverse_engineering',scope:inventory.scope,inventory_digest:inventory.digest,coverage:inventory.coverage,source_counts:inventory.counts}));
  chg.relations.push({type:'depends_on',target:'LDP-LEGACY'});
  chg.definition.delivery_path='legacy_documentation';
  get('BSL-A').definition.members.forEach(m=>m.content_hash=contentHash(get(m.id),m.projection));
  const plan=record('DOC','DOC-VALIDATION','MOD-A','현행/목표와 검증 계획',{kind:'legacy_validation_plan',change:'CHG-A',module:'MOD-A',environment:'isolated fixture',coverage_notes:'모든 선언 텍스트 확인; 실제 제품이 아닌 fixture',tests:['TC-CANCEL'],scenarios:{normal:{tests:['TC-CANCEL']},exception:{tests:['TC-CANCEL']},data_boundary:{tests:['TC-CANCEL']}},differences:[...chg.definition.scope.requirements,...chg.definition.scope.candidates].map(subject=>({subject,disposition:'retain',reason:'fixture 현행 유지'})),existing_ui:ui?[{screen:'SCR-CANCEL',reason:'현행 화면 유지',reference:'synthetic screen review'}]:[]},[{type:'context',target:'CHG-A'},...['TC-CANCEL',...(ui?['SCR-CANCEL']:[])].map(target=>({type:'depends_on',target}))]);records.push(plan);
  approveBusiness(records);approval(records,'intent',['MOD-A'],'MOD');approval(records,'scope',['CHG-A'],'SCOPE');approval(records,'requirement',['REQ-CANCEL'],'REQ');approval(records,'consistency',['CHG-A','REQ-CANCEL'],'CONSISTENCY',false);approval(records,'design',['FEAT-CANCEL'],'FEATURE');if(ui)approval(records,'design',['SCR-CANCEL'],'SCREEN');approval(records,'design',[plan.id],'PLAN');
  records.push(record('CHG','CHG-B','MOD-B','다른 모듈의 미래 초안',{modules:['MOD-B'],purpose:'미확정 업무',scope:{requirements:[],candidates:[]}}));
  records.push(record('REL','REL-OLD','MOD-B','기존 운영 이력',{works:[],changes:[],environment:'production'}));get('REL-OLD').execution.status='completed';
  transact(store,{operation:'fixture',updates:records.map(r=>({path:recordPath(r),record:r,expected:null}))});
  return {root,source,store,records};
}
const check=f=>legacyAdoptionCheck(f.store,'CHG-A','MOD-A');
const input=f=>({...user,change:'CHG-A',module:'MOD-A',document_digest:check(f).document_digest});
function edit(f,id,fn){const v=f.store.readRecord(id),r=structuredClone(v.record);r.revision++;fn(r);transact(f.store,{operation:`edit-${id}-${r.revision}`,updates:[{path:recordPath(r),record:r,expected:v.hashes[recordPath(r)]}]});}
function evidence(f,id,result='passed',extra={}){const b=check(f).test_bindings[0];const r=record('EVD',id,'MOD-A','synthetic execution',{subjects:[b.test],kind:'test',result,input_hash:b.input_hash,mode:'actual',command:'fixture-only test run',occurred_at:'2026-09-23T03:00:00Z',artifacts:['synthetic-run-log'],environment:b.environment,code_revision:b.code_revision,...extra});r.extensions.legacy_validation={plan:b.plan,input_digest:b.input_digest};transact(f.store,{operation:id,updates:[{path:recordPath(r),record:r,expected:null}]});return r;}

test('RE-AC-12 module document adoption ignores independent future drafts and preserves operating history',t=>{
  const f=fixture(t),m=check(f);assert.equal(m.documentation.readiness,'ready',JSON.stringify(m.documentation.blockers));assert.equal(m.runtime.status,'not_run');
  const before=new Map(f.store.scanAll().records.map(r=>[r.id,JSON.stringify(r)])),i=input(f);legacyAdopt(f.store,i,'adopt');
  for(const[id,bytes]of before)assert.equal(JSON.stringify(f.store.readRecord(id).record),bytes,id);
  assert.equal(check(f).adoption.status,'current');assert.equal(legacyAdopt(f.store,i,'adopt').replayed,true);
  assert.deepEqual(f.store.scanAll().records.filter(r=>!before.has(r.id)).map(r=>r.type).sort(),['DOC','HIS']);
});
test('RE-AC-13 source observation/adoption cannot fabricate runtime, gates or prototype approval',t=>{
  const f=fixture(t,{ui:true}),m=check(f);assert.equal(m.documentation.readiness,'ready',JSON.stringify(m.documentation.blockers));legacyAdopt(f.store,input(f),'ui-adopt');
  const rows=f.store.scanAll().records;assert.equal(check(f).runtime.status,'not_run');assert(!rows.some(r=>['EVD','GTR'].includes(r.type)||r.type==='RVW'&&r.definition.kind==='prototype'));
  const development=evaluate(rows,'WRK-A','development');assert.notEqual(development.readiness,'ready');assert(development.blockers.some(b=>b.code.includes('prototype')));
});
test('RE-AC-14 current actual results are separate from document adoption; latest failure wins',t=>{
  const f=fixture(t);legacyAdopt(f.store,input(f),'adopt');evidence(f,'EVD-PASS');assert.equal(check(f).runtime.status,'passed');assert.equal(check(f).adoption.status,'current');
  evidence(f,'EVD-FAIL','failed',{occurred_at:'2026-09-23T04:00:00Z'});assert.equal(check(f).runtime.status,'failed');assert.equal(check(f).adoption.status,'current');
  assert.equal(f.store.readRecord('WRK-A').record.execution.status,undefined);
});
test('RE-AC-14 fixture/stub and ambiguous evidence cannot pass, source/requirement drift is stale',t=>{
  const f=fixture(t);evidence(f,'EVD-STUB','passed',{mode:'stub'});assert.equal(check(f).runtime.status,'invalid');
  evidence(f,'EVD-ACTUAL','passed',{occurred_at:'2026-09-23T04:00:00Z'});assert.equal(check(f).runtime.status,'passed');
  edit(f,'REQ-CANCEL',r=>r.definition.statement=known('changed acceptance intent'));assert.equal(check(f).runtime.status,'stale');assert.equal(check(f).documentation.readiness,'blocked');
  evidence(f,'EVD-TIE','passed',{occurred_at:'2026-09-23T04:00:00Z'});assert.equal(check(f).runtime.tests[0].status,'ambiguous');
});
test('RE-AC-15 adopted definitions feed normal subsequent change/work without gate waiver',t=>{
  const f=fixture(t);legacyAdopt(f.store,input(f),'adopt');const before=f.store.readRecord('REL-OLD').record;
  edit(f,'WRK-A',r=>r.definition.change='CHG-NEW');
  const chg=record('CHG','CHG-NEW','MOD-A','후속 개선',{modules:['MOD-A'],purpose:'기능 개선',scope:{requirements:['REQ-CANCEL'],candidates:['FEAT-CANCEL'],governing:[]}});
  transact(f.store,{operation:'new-change',updates:[{path:recordPath(chg),record:chg,expected:null}]});
  assert.notEqual(evaluate(f.store.scanAll().records,'WRK-A','development').readiness,'ready');assert.deepEqual(f.store.readRecord('REL-OLD').record,before);
});
test('RE-AC-16 module briefing and generated status agree without scanning source',t=>{
  const f=fixture(t),v=f.store.scanAll(),m=legacyAdoptionModel(v.records,'CHG-A','MOD-A',{coverage:v.coverage});
  assert.deepEqual(briefing(v,{module:'MOD-A'}).legacy_adoptions[0],m);assert.equal(m.source_check.checked,false);
  generateDocuments(f.store);assert.equal(checkDocuments(f.store).diagnostics.length,0);
  writeFileSync(join(f.source,'app.txt'),'changed source\n');assert.equal(check(f).documentation.readiness,'blocked');assert.equal(check(f).source_check.current,false);
});
test('adopt rejects missing user decision, stale preview and source changes without writes',t=>{
  const f=fixture(t),i=input(f),before=f.store.scanAll().records.length;
  assert.throws(()=>legacyAdopt(f.store,{...i,decision_source:{kind:'analysis',reference:'no user'}},'bad'));
  edit(f,'DOC-VALIDATION',r=>r.definition.coverage_notes='Changed scope judgment');assert.throws(()=>legacyAdopt(f.store,i,'stale'));
  assert.equal(f.store.scanAll().records.length,before);writeFileSync(join(f.source,'app.txt'),'new bytes\n');assert.throws(()=>legacyAdopt(f.store,i,'source'));
});
test('plans require current review, scenario/AC coverage, UI reuse and target delta work links',t=>{
  const f=fixture(t,{ui:true});edit(f,'DOC-VALIDATION',r=>{r.definition.tests=[];r.definition.scenarios={};r.definition.existing_ui=[];r.definition.differences[0].disposition='fix';});
  const codes=check(f).documentation.blockers.map(b=>b.code);for(const c of ['plan_review','test_scope','acceptance_plan','scenario_plan','existing_ui_review','difference_work'])assert(codes.includes(c),c);
});
test('common policy changes invalidate adoption while preserving immutable adoption history',t=>{
  const f=fixture(t);legacyAdopt(f.store,input(f),'adopt');const old=f.store.scanAll().records.filter(r=>r.definition.kind==='legacy_adoption'||r.type==='HIS');
  edit(f,'POL-CUSTOMER-ACCESS',r=>r.definition.entry=known('changed entry policy'));assert.equal(check(f).adoption.status,'stale');
  for(const r of old)assert.deepEqual(f.store.readRecord(r.id).record,r);
});
test('multi-module CHG cannot silently adopt a subset',t=>{
  const f=fixture(t);edit(f,'CHG-A',r=>r.definition.modules.push('MOD-B'));assert(check(f).documentation.blockers.some(b=>b.code==='module_scope'));
});
test('interrupted adoption uses explicit recovery and preserves existing canonical data',t=>{
  const f=fixture(t),i=input(f);assert.throws(()=>legacyAdopt(f.store,i,'interrupt',{fault:(point,n)=>{if(point==='write'&&n===1)throw Error('interrupt');}}));
  const result=recover(f.store,'interrupt','resume');assert.equal(result.state,'committed');assert.equal(check(f).adoption.status,'current');
});
test('public adoption CLI validates required options and produces read-only readiness',t=>{
  const f=fixture(t);cpSync(resolve('.ai'),join(f.root,'.ai'),{recursive:true});
  const r=spawnSync(process.execPath,[join(f.root,'.ai/tools/aidd.mjs'),'legacy-adoption-check','--change','CHG-A','--module','MOD-A'],{cwd:f.root,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr+r.stdout);assert.equal(JSON.parse(r.stdout).data.documentation.readiness,'ready');
  assert.throws(()=>runOwned(f.root,'legacy-adoption-check',['--change','CHG-A']));
});

test('live source changes stale actual tests while saved-document briefing remains explicitly unchecked',t=>{
  const f=fixture(t);evidence(f,'EVD-PASS');assert.equal(check(f).runtime.status,'passed');writeFileSync(join(f.source,'app.txt'),'changed source\n');
  assert.equal(check(f).runtime.status,'stale');assert.equal(check(f).source_check.current,false);
  const saved=briefing(f.store.scanAll(),{module:'MOD-A'}).legacy_adoptions[0];assert.equal(saved.runtime.status,'passed');assert.equal(saved.source_check.checked,false);
});
test('broken independent module file does not prevent selected module adoption',t=>{
  const f=fixture(t),dir=join(f.store.ssot,'modules/MOD-B/REQ');mkdirSync(dir,{recursive:true});writeFileSync(join(dir,'REQ-BROKEN.json'),'{invalid');
  assert.equal(check(f).documentation.readiness,'ready');legacyAdopt(f.store,input(f),'independent');assert.equal(check(f).adoption.status,'current');
});
test('duplicate plans and malformed plan shapes block without crashing briefing',t=>{
  const f=fixture(t);edit(f,'DOC-VALIDATION',r=>{r.definition.tests={bad:true};r.definition.differences=null;r.definition.existing_ui=1;});assert.equal(check(f).documentation.readiness,'blocked');
  const second=structuredClone(f.store.readRecord('DOC-VALIDATION').record);second.id='DOC-SECOND';second.revision=1;transact(f.store,{operation:'duplicate',updates:[{path:recordPath(second),record:second,expected:null}]});
  assert(check(f).documentation.blockers.some(b=>b.code==='validation_plan'));assert.equal(briefing(f.store.scanAll()).legacy_adoptions.length,1);
});
