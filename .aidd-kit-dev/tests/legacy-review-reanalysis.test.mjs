import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,renameSync,cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { bootstrapV2,runOwned } from '../../.ai/tools/lib/owned-cli.mjs';
import { RecordStore } from '../../.ai/tools/lib/record-store.mjs';
import { record,recordPath,definitionHash,digest } from '../../.ai/tools/lib/record-contracts.mjs';
import { transact,recover } from '../../.ai/tools/lib/record-transaction.mjs';
import { legacyInventory } from '../../.ai/tools/lib/legacy-inventory.mjs';
import { legacyDraft,legacyApply } from '../../.ai/tools/lib/legacy-drafts.mjs';
import { legacyReview,legacyReviewRequest,legacyReviewAnswer } from '../../.ai/tools/lib/legacy-review.mjs';
import { legacyReanalyze,legacyReconcile,generationBase } from '../../.ai/tools/lib/legacy-reanalysis.mjs';
import { legacySourceCheck } from '../../.ai/tools/lib/legacy-source-check.mjs';
import { stagedDocumentation } from '../../.ai/tools/lib/source-documentation.mjs';
import { generateDocuments,checkDocuments } from '../../.ai/tools/lib/document-renderer.mjs';
import { reviewValidity,evaluate } from '../../.ai/tools/lib/readiness.mjs';
import { briefing } from '../../.ai/tools/lib/record-views.mjs';
import { impactGraph } from '../../.ai/tools/lib/dependency-graph.mjs';

const decision={reviewer:'fixture user',occurred_at:'2026-09-23T01:00:00Z',decision_source:{kind:'user',reference:'synthetic acceptance, not a real user approval'}};
function fixture(t){
  const root=mkdtempSync(join(tmpdir(),'aidd-reanalysis-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
  const source=join(root,'legacy-app');mkdirSync(source);writeFileSync(join(source,'app.txt'),'System and order contract\nInitial implementation\n');
  bootstrapV2(root,{'project-id':'PRJ-LEGACY',name:'Legacy review fixture'});const store=new RecordStore(join(root,'project'));
  const scope={roots:[{key:'app',path:source,kind:'source'}]},inv=legacyInventory(scope),f=inv.entries[0];
  const anchor={root:'app',path:f.path,sha256:f.sha256,start_line:1,end_line:2};
  const observations=[],add=(key,value)=>{observations.push({key,value,status:'observed',kind:'document',summary:key,method:'synthetic fixture observation',anchors:[anchor]});return[key];};
  const analysis={namespace:'review-shop',batch:'orders',title:'주문 분석',observations,candidates:[
    {key:'mod',type:'MOD',title:'주문 모듈',fields:{purpose:add('module-purpose','주문 관리')}},
    {key:'sys',type:'SYS',owner:'project',title:'주문 시스템',fields:Object.fromEntries('problem purpose outcomes boundary exclusions external_context'.split(' ').map(k=>[k,add(`sys-${k}`,`시스템 ${k}`)]))},
    {key:'cap',type:'CAP',owner:{$ref:'mod'},title:'주문 업무',fields:Object.fromEntries('purpose outcomes business_objects'.split(' ').map(k=>[k,add(`cap-${k}`,`업무 ${k}`)])),relations:[{type:'part_of',target:{$ref:'sys'}}]},
    {key:'act',type:'ACT',owner:{$ref:'mod'},title:'역할 초안',fields:{}},
    {key:'req',type:'REQ',owner:{$ref:'mod'},title:'주문 요구',fields:{statement:add('statement','base statement')},relations:[{type:'derived_from',target:{$ref:'cap'}}]},
    {key:'feat',type:'FEAT',owner:{$ref:'mod'},title:'주문 기능',fields:{},relations:[{type:'satisfies',target:{$ref:'req'}}]},
  ]};
  const plan=legacyDraft(store,analysis,inv);legacyApply(store,plan,'initial');return {root,source,store,scope,analysis,plan};
}
function edit(f,id,fn){const v=f.store.readRecord(id),r=structuredClone(v.record);fn(r);r.revision++;transact(f.store,{operation:`edit-${id}-${r.revision}`,updates:[{path:recordPath(r),record:r,expected:v.hashes[recordPath(r)]}]});}
function fresh(f,mutate=a=>a){const a=structuredClone(f.analysis);mutate(a);const inv=legacyInventory(f.scope);for(const o of a.observations)for(const anchor of o.anchors){const e=inv.entries.find(e=>e.root===anchor.root&&e.path===anchor.path);if(e)anchor.sha256=e.sha256;}return {a,inv};}
function choose(plan,overrides={}){return {...decision,plan,decisions:Object.fromEntries(plan.rows.filter(r=>['new','mergeable','conflict','collision','current_missing','unobserved'].includes(r.classification)).map(r=>[r.id,{choice:['conflict','collision','current_missing','unobserved'].includes(r.classification)?'current':'merged',reason:'fixture explicit selection',...overrides[r.id]}]))};}
const code=(fn,c)=>assert.throws(fn,e=>e.code===c);

test('RE-AC-07 sequential packets, partial answers, deferred items and duplicate requests',t=>{
  const f=fixture(t),board=legacyReview(f.store,f.plan.change);assert.equal(board.next_stage,0);assert.equal(board.packet.items.length,3);
  const q=legacyReviewRequest(f.store,{packet:board.packet,asked_at:decision.occurred_at},'ask');
  const duplicate=legacyReviewRequest(f.store,{packet:board.packet,asked_at:decision.occurred_at},'ask-again');assert.deepEqual(duplicate.requests,q.requests);assert.equal(duplicate.entries.length,0);
  const out=legacyReviewAnswer(f.store,{...decision,answers:[{request:q.requests[0],result:'accepted',note:'현행 목적 유지'},{request:q.requests[1],result:'deferred',note:'담당자 확인 후 검토'}]},'answer');
  assert.equal(out.results[0].closed,true);assert.equal(out.results[1].closed,false);
  assert.equal(f.store.readRecord(q.requests[1]).record.definition.status,'deferred');assert.equal(f.store.readRecord(q.requests[2]).record.definition.status,'awaiting_decision');
  assert.equal(legacyReview(f.store,f.plan.change).next_stage,0);
  assert.equal(legacyReviewAnswer(f.store,{...decision,answers:[{request:q.requests[0],result:'accepted',note:'현행 목적 유지'},{request:q.requests[1],result:'deferred',note:'담당자 확인 후 검토'}]},'answer').replayed,true);
});

test('RE-AC-07 stale answers keep history but cannot close questions or approve changed input',t=>{
  const f=fixture(t),q=legacyReviewRequest(f.store,{packet:legacyReview(f.store,f.plan.change).packet,asked_at:decision.occurred_at},'ask');
  const request=q.requests.find(id=>f.store.readRecord(id).record.definition.subject===f.plan.ids.sys);
  edit(f,f.plan.ids.sys,r=>r.definition.purpose={status:'known',value:'새 목적'});
  const answer=legacyReviewAnswer(f.store,{...decision,answers:[{request,result:'accepted',note:'이전 설명 수용'}]},'late');
  assert.equal(answer.results[0].current,false);assert.equal(f.store.readRecord(request).record.definition.status,'awaiting_decision');
  assert.equal(reviewValidity(f.store.scanAll().records,'intent',[f.plan.ids.sys],{user:true}),'stale');
  assert(f.store.scanAll().records.some(r=>r.type==='HIS'&&r.definition.current_at_recording===false));
});

test('accepting an incomplete role cannot close its OI or skip to requirements',t=>{
  const f=fixture(t);let q=legacyReviewRequest(f.store,{packet:legacyReview(f.store,f.plan.change).packet,asked_at:decision.occurred_at},'first');
  legacyReviewAnswer(f.store,{...decision,answers:q.requests.map(request=>({request,result:'accepted',note:'상세와 업무 의미 수용'}))},'first-answer');
  const board=legacyReview(f.store,f.plan.change);assert.equal(board.next_stage,1);assert(board.phases[1].missing.includes('POL'));
  q=legacyReviewRequest(f.store,{packet:board.packet,asked_at:decision.occurred_at},'roles');
  const out=legacyReviewAnswer(f.store,{...decision,answers:q.requests.map(request=>({request,result:'accepted',note:'역할 이름만 확인'}))},'role-answer');
  assert.equal(out.results[0].closed,false);assert(out.results[0].detail_errors.length>0);assert.equal(legacyReview(f.store,f.plan.change).next_stage,1);
  assert.notEqual(evaluate(f.store.scanAll().records,f.plan.change).readiness,'ready');
});

test('RE-AC-09 three-way nonoverlap preserves edits; conflict requires an explicit choice',t=>{
  const f=fixture(t);edit(f,f.plan.ids.req,r=>r.title='사용자 명칭');
  let {a,inv}=fresh(f,a=>a.observations.find(o=>o.key==='statement').value='new source statement');
  let p=legacyReanalyze(f.store,a,inv,'initial'),row=p.rows.find(r=>r.id===f.plan.ids.req);
  assert.equal(row.classification,'mergeable');assert.equal(row.merged.title,'사용자 명칭');assert.equal(row.merged.definition.statement.value,'new source statement');
  edit(f,f.plan.ids.req,r=>r.definition.statement={status:'known',value:'사용자 업무 규칙'});
  p=legacyReanalyze(f.store,a,inv,'initial');row=p.rows.find(r=>r.id===f.plan.ids.req);assert.equal(row.classification,'conflict');
  const before=readFileSync(join(f.store.ssot,recordPath(f.store.readRecord(row.id).record)));
  code(()=>legacyReconcile(f.store,choose(p,{[row.id]:{choice:'merged'}}),'bad'),'legacy_input');
  assert.deepEqual(readFileSync(join(f.store.ssot,recordPath(f.store.readRecord(row.id).record))),before);
  const out=legacyReconcile(f.store,choose(p),'keep');assert.equal(out.state,'committed');assert.equal(f.store.readRecord(row.id).record.definition.statement.value,'사용자 업무 규칙');
  assert.equal(generationBase(f.store,'keep').records.find(r=>r.id===row.id).definition.statement.value,'new source statement');
  const next=legacyReanalyze(f.store,a,inv,'keep');assert.equal(next.rows.find(r=>r.id===row.id).classification,'user_only');
});

test('RE-AC-08 applied change creates traceable impact/review, keeps independent work and historical reviews',t=>{
  const f=fixture(t),other=record('MOD','MOD-INDEPENDENT','MOD-INDEPENDENT','독립 운영',{purpose:'유지'}),work=record('WRK','WRK-LEGACY',f.plan.ids.mod,'기존 진행 작업',{change:f.plan.change,features:[f.plan.ids.feat]});work.execution.status='in_progress';
  transact(f.store,{operation:'other',updates:[other,work].map(r=>({path:recordPath(r),record:r,expected:null}))});
  const q=legacyReviewRequest(f.store,{packet:legacyReview(f.store,f.plan.change).packet,asked_at:decision.occurred_at},'ask');legacyReviewAnswer(f.store,{...decision,answers:q.requests.map(request=>({request,result:'accepted',note:'fixture current review'}))},'answered');
  const history=f.store.scanAll().records.filter(r=>['HIS','RVW'].includes(r.type)).map(r=>[r.id,definitionHash(r)]);
  const {a,inv}=fresh(f,a=>a.observations.find(o=>o.key==='statement').value='new contract'),p=legacyReanalyze(f.store,a,inv,'initial');
  const out=legacyReconcile(f.store,choose(p),'apply');assert(out.affected.includes(f.plan.ids.req));
  assert.equal(f.store.readRecord('WRK-LEGACY').record.execution.status,'in_progress');assert.deepEqual(f.store.readRecord(other.id).record,other);
  for(const [id,h]of history)assert.equal(definitionHash(f.store.readRecord(id).record),h);
  const imp=f.store.scanAll().records.find(r=>r.type==='IMP'&&r.definition.subject===f.plan.ids.req);assert(imp.definition.candidates.some(c=>c.id==='WRK-LEGACY'&&c.disposition==='pending'));
  assert.equal(imp.definition.graph_digest,impactGraph(f.store.scanAll().records,f.plan.ids.req).graph_digest);
});

test('RE-AC-10 removed candidates and partial inventories never delete or silently shrink the change',t=>{
  const f=fixture(t),{a,inv}=fresh(f,a=>{a.candidates=a.candidates.filter(c=>c.type!=='FEAT');});
  const p=legacyReanalyze(f.store,a,inv,'initial');assert.equal(p.rows.find(r=>r.id===f.plan.ids.feat).classification,'unobserved');
  code(()=>legacyReconcile(f.store,choose(p,{[f.plan.ids.feat]:{choice:'proposed'}}),'remove'),'legacy_input');
  legacyReconcile(f.store,choose(p),'preserve');assert(f.store.readRecord(f.plan.ids.feat).record);assert(f.store.readRecord(f.plan.change).record.definition.scope.candidates.includes(f.plan.ids.feat));
  const empty=structuredClone(f.analysis);empty.observations=[];for(const c of empty.candidates)c.fields={};
  const partial=legacyInventory({...f.scope,max_bytes:1});const next=legacyReanalyze(f.store,empty,partial,'preserve');assert(next.source_changes.some(c=>c.status==='unprocessed'));assert.equal(f.store.readRecord(f.plan.ids.feat).record.lifecycle,'draft');
});

test('RE-AC-10 rename/hash/revision changes are distinct observations, never automatic identity decisions',t=>{
  const f=fixture(t);renameSync(join(f.source,'app.txt'),join(f.source,'renamed.txt'));
  const {a,inv}=fresh(f,a=>{for(const o of a.observations)for(const anchor of o.anchors)anchor.path='renamed.txt';});
  const p=legacyReanalyze(f.store,a,inv,'initial');const missing=p.source_changes.find(c=>c.status==='missing');assert.deepEqual(missing.possible_moves,['app/renamed.txt']);
  assert(p.rows.some(r=>r.classification==='mergeable'));assert.equal(p.analysis_record,f.plan.analysis_record);
  const revised=legacyInventory({roots:f.scope.roots.map(r=>({...r,revision:'declared-new'}))});assert.equal(legacyReanalyze(f.store,a,revised,'initial').roots_changed,true);
});

test('stale plan, source drift and incomplete transactions preserve current records',t=>{
  const f=fixture(t),{a,inv}=fresh(f,a=>a.observations.find(o=>o.key==='statement').value='update');let p=legacyReanalyze(f.store,a,inv,'initial');
  edit(f,f.plan.ids.req,r=>r.title='concurrent edit');code(()=>legacyReconcile(f.store,choose(p),'stale'),'legacy_reanalysis_stale');
  p=legacyReanalyze(f.store,a,inv,'initial');const selected=choose(p);
  assert.throws(()=>legacyReconcile(f.store,selected,'interrupt',{fault:(point,n)=>{if(point==='write'&&n===1)throw Error('interrupt');}}));
  code(()=>legacyReconcile(f.store,selected,'interrupt'),'recovery_required');recover(f.store,'interrupt','rollback');
  assert.equal(f.store.readRecord(f.plan.ids.req).record.title,'concurrent edit');
  writeFileSync(join(f.source,'app.txt'),'changed source\n');code(()=>legacyReconcile(f.store,selected,'source-stale'),'legacy_source_changed');
});

test('RE-AC-11 declared roots outside project/src and independent external roots are explicit',t=>{
  const f=fixture(t);assert.equal(legacySourceCheck(f.store,f.plan.change).current,true);
  writeFileSync(join(f.source,'app.txt'),'changed source\n');const check=legacySourceCheck(f.store,f.plan.change);assert.equal(check.current,false);assert(check.changes[0].observations.some(o=>o.candidates.length));
  const staged=stagedDocumentation(f.root,f.store,['legacy-app/app.txt','unrelated/file.txt']);assert(staged.rows.some(r=>r.analysis===f.plan.analysis_record));assert(!staged.rows.some(r=>r.source==='unrelated/file.txt'));assert(staged.diagnostics.some(d=>d.code==='staged_documentation'));
  const ext=mkdtempSync(join(tmpdir(),'aidd-external-'));t.after(()=>rmSync(ext,{recursive:true,force:true}));
  edit(f,f.plan.analysis_record,r=>r.definition.scope.roots.push({key:'external',path:ext,kind:'source',revision:null}));
  assert(stagedDocumentation(f.root,f.store,[]).diagnostics.some(d=>d.code==='legacy_external_roots_not_staged'));
});

test('RE-AC-16 briefings and derived documents share the same review model',t=>{
  const f=fixture(t),model=legacyReview(f.store,f.plan.change),status=briefing(f.store.scanAll(),{id:f.plan.change});assert.deepEqual(status.legacy_reviews[0].counts,model.counts);
  generateDocuments(f.store);assert.equal(checkDocuments(f.store).diagnostics.length,0);
  const file=join(f.store.project,'docs/generated/modules',f.plan.ids.mod,'status.json'),generated=JSON.parse(readFileSync(file));assert.deepEqual(generated.legacy_reviews[0].phases,model.phases);
});

test('field merge applies source changes while preserving user text and generated base, with replay',t=>{
  const f=fixture(t);edit(f,f.plan.ids.req,r=>r.title='사용자 제목');
  const {a,inv}=fresh(f,a=>a.observations.find(o=>o.key==='statement').value='new source rule'),p=legacyReanalyze(f.store,a,inv,'initial'),input=choose(p);
  legacyReconcile(f.store,input,'merge');assert.equal(legacyReconcile(f.store,input,'merge').replayed,true);
  const r=f.store.readRecord(f.plan.ids.req).record;assert.equal(r.title,'사용자 제목');assert.equal(r.definition.statement.value,'new source rule');
  assert.equal(generationBase(f.store,'merge').records.find(r=>r.id===f.plan.ids.req).title,'주문 요구');
  generateDocuments(f.store);assert.equal(checkDocuments(f.store).diagnostics.length,0);
});

test('one stale answer in a group does not prevent recording another current response',t=>{
  const f=fixture(t),q=legacyReviewRequest(f.store,{packet:legacyReview(f.store,f.plan.change).packet,asked_at:decision.occurred_at},'mixed-ask');
  edit(f,f.plan.ids.sys,r=>r.title='새 제시본');
  const ids=q.requests.filter(id=>[f.plan.ids.mod,f.plan.ids.sys].includes(f.store.readRecord(id).record.definition.subject));
  const out=legacyReviewAnswer(f.store,{...decision,answers:ids.map(request=>({request,result:'accepted',note:'fixture partial response'}))},'mixed-answer');
  assert.equal(out.results.find(r=>r.subject===f.plan.ids.mod).closed,true);assert.equal(out.results.find(r=>r.subject===f.plan.ids.sys).current,false);
});

test('actual staged check rejects working-tree/index divergence in a declared legacy root',t=>{
  const f=fixture(t),git=args=>{const p=spawnSync('git',args,{cwd:f.root,encoding:'utf8',windowsHide:true});assert.equal(p.status,0,p.stderr||p.error?.message);};
  git(['init','--quiet']);git(['add','legacy-app/app.txt']);
  assert(!stagedDocumentation(f.root,f.store).diagnostics.some(d=>d.code==='staged_documentation'));
  writeFileSync(join(f.source,'app.txt'),'different unstaged content\n');
  const {a,inv}=fresh(f),p=legacyReanalyze(f.store,a,inv,'initial');legacyReconcile(f.store,choose(p),'source-refresh');
  const out=stagedDocumentation(f.root,f.store);assert(out.diagnostics.some(d=>d.message.includes('Git index')));
});

test('new public CLI routes are callable and reject malformed invocation',t=>{
  const f=fixture(t);cpSync(resolve('.ai/tools'),join(f.root,'.ai/tools'),{recursive:true});
  for(const args of [['legacy-review','--change',f.plan.change],['legacy-source-check','--change',f.plan.change]]){
    const p=spawnSync(process.execPath,[join(f.root,'.ai/tools/aidd.mjs'),...args],{cwd:f.root,encoding:'utf8',maxBuffer:4*1024*1024,env:{...process.env,AIDD_LIBRARY_MODE:'0'}});assert.equal(p.status,0,p.stderr||p.error?.message);assert.equal(JSON.parse(p.stdout).command,args[0]);
  }
  code(()=>runOwned(f.root,'legacy-review',['--change',f.plan.change,'--limit','4']),'legacy_input');
  code(()=>runOwned(f.root,'legacy-reanalyze',['--input','missing']),'usage');
  code(()=>legacyReviewAnswer(f.store,{...decision,decision_source:{kind:'ai',reference:'guess'},answers:[]},'no-user'),'legacy_input');
});
