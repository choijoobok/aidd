import { digest, record, recordPath, definitionHash, recordErrors } from './record-contracts.mjs';
import { transactionStatus, replayOperation, transact } from './record-transaction.mjs';
import { StoreError } from './record-store.mjs';
import { buildLegacyRecords } from './legacy-drafts.mjs';
import { verifyInventory, requireInput } from './legacy-inventory.mjs';
import { completeView, legacyId, userDecision } from './legacy-review.mjs';
import { impactGraph } from './dependency-graph.mjs';
import { references, reviewInput } from './readiness.mjs';
import { semanticErrors } from './semantic-validation.mjs';

const business = new Set('MOD SYS CAP ACT POL UC BPR REQ NFR FEAT SCR DAT NAV IFC'.split(' '));
const eq=(a,b)=>a===undefined||b===undefined?a===b:digest(a)===digest(b);
export function generationBase(store,operation) {
  const journal=transactionStatus(store,operation);
  requireInput(journal.state==='committed','previous must be a committed generation operation');
  const images=journal.entries.filter(e=>e.after).map(e=>JSON.parse(Buffer.from(e.after,'base64')));
  const receipt=images.find(r=>r.definition.kind==='legacy_reconciliation');
  const records=receipt?images.filter(r=>r.definition.kind==='legacy_generation').map(r=>r.definition.generated):images;
  const ldp=records.filter(r=>r.type==='LDP'&&r.definition.kind==='reverse_engineering');
  requireInput(ldp.length===1&&records.length>1,'previous needs generated images, not a no-op journal');
  return {records,ldp:ldp[0],journal_digest:digest(journal)};
}
const flatten=r=>({title:r.title,relations:r.relations,...Object.fromEntries(Object.entries(r.definition).map(([k,v])=>[`definition.${k}`,v]))});
function assign(r,path,value) { const obj=path.startsWith('definition.')?r.definition:r,key=path.startsWith('definition.')?path.slice(11):path; if(value===undefined)delete obj[key];else obj[key]=structuredClone(value); }
function retainScope(current,proposed) {
  if(current.type!=='CHG')return proposed;
  const n=structuredClone(proposed),a=current.definition.scope??{},b=n.definition.scope??={};
  for(const key of ['requirements','candidates','governing'])b[key]=[...new Set([...(a[key]??[]),...(b[key]??[])])];
  for(const group of ['discovery','inventory']){
    b[group]??={};
    for(const [key,old]of Object.entries(a[group]??{})){
      const next=b[group][key];
      if(old?.status==='known'&&Array.isArray(old.value))b[group][key]={status:'known',value:[...new Set([...old.value,...(Array.isArray(next?.value)?next.value:[])])]};
      else if(key==='overview'&&!next)b[group][key]=old;
    }
  }
  return n;
}
export function threeWay(base,current,proposed) {
  if(!current)return {classification:base?'current_missing':'new',fields:[],merged:proposed??null};
  if(!proposed)return {classification:'unobserved',fields:[],merged:current};
  requireInput(eq(current.owner,proposed.owner),'owner change requires record-move; no implicit move');
  if(!base)return {classification:eq(current,proposed)?'unchanged':'collision',fields:[],merged:current};
  proposed=retainScope(current,proposed);
  const b=flatten(base),c=flatten(current),p=flatten(proposed),merged=structuredClone(current),fields=[];
  for(const path of [...new Set([...Object.keys(b),...Object.keys(c),...Object.keys(p)])].sort()){
    const classification=eq(c[path],p[path])?(eq(c[path],b[path])?'unchanged':'converged'):eq(c[path],b[path])?'source_only':eq(p[path],b[path])?'user_only':'conflict';
    if(classification==='source_only'||classification==='converged')assign(merged,path,p[path]);
    if(classification!=='unchanged')fields.push({path,classification,base:b[path]??null,current:c[path]??null,proposed:p[path]??null});
  }
  const classification=fields.some(f=>f.classification==='conflict')?'conflict':fields.some(f=>f.classification==='source_only')?'mergeable':fields.some(f=>f.classification==='user_only')?'user_only':fields.length?'converged':'unchanged';
  return {classification,fields,merged};
}
export function sourceDelta(baseRecords,inventory) {
  const old=baseRecords.filter(r=>r.definition.kind==='legacy_inventory').flatMap(r=>r.definition.entries), oldMap=new Map(old.map(e=>[`${e.root}/${e.path}`,e])), next=new Map(inventory.entries.map(e=>[`${e.root}/${e.path}`,e]));
  const changes=[];
  for(const key of [...new Set([...oldMap.keys(),...next.keys()])].sort()){
    const a=oldMap.get(key),b=next.get(key);if(eq(a,b))continue;
    changes.push({key,status:!a?'added':!b?'missing':b.status!=='text'?'unprocessed':'changed',before:a??null,after:b??null,possible_moves:!b&&a?.sha256?[...next].filter(([k,e])=>!oldMap.has(k)&&e.sha256===a.sha256).map(([k])=>k):[]});
  }
  return changes;
}
export function legacyReanalyze(store,analysis,inventory,previous) {
  verifyInventory(inventory);
  const base=generationBase(store,previous),built=buildLegacyRecords(analysis,inventory),v=completeView(store);
  requireInput(base.ldp.id===built.analysis_record,'namespace/batch must match the previous generation');
  const bm=new Map(base.records.map(r=>[r.id,r])),pm=new Map(built.records.map(r=>[r.id,r])),rows=[];
  for(const id of [...new Set([...bm.keys(),...pm.keys()])].sort()){
    const b=bm.get(id),c=v.byId.get(id),p=pm.get(id),diff=threeWay(b,c,p);
    rows.push({id,type:(p??c??b).type,base:b??null,current:c??null,proposed:p??null,...diff});
  }
  const source_changes=sourceDelta(base.records,inventory),roots_changed=!eq(base.ldp.definition.scope,inventory.scope);
  const plan={schema_version:1,kind:'legacy_reanalysis',previous,previous_digest:base.journal_digest,analysis,inventory,change:built.change,analysis_record:built.analysis_record,rows,source_changes,roots_changed,read_set:v.hashes,coverage:inventory.coverage,
    impacts:rows.filter(r=>business.has(r.type)&&!['unchanged','user_only','converged'].includes(r.classification)&&r.current).map(r=>impactGraph(v.records,r.id,{coverage:v.coverage}))};
  return {...plan,digest:digest(plan)};
}
export function legacyReconcile(store,input,operation,{fault}={}) {
  const intent={command:'legacy-reconcile',input},replay=replayOperation(store,operation,intent);if(replay)return replay;
  userDecision(input);
  const plan=input.plan,{digest:expected,...body}=plan??{};
  requireInput(plan?.kind==='legacy_reanalysis'&&expected===digest(body),'valid reanalysis plan required');
  const fresh=legacyReanalyze(store,plan.analysis,plan.inventory,plan.previous);
  if(fresh.digest!==plan.digest)throw new StoreError('legacy_reanalysis_stale','Sources, generation base or records changed; preview again.',3);
  const v=completeView(store),result=new Map(v.byId),updates=[],changed=[],baseImages=[];
  const choices=input.decisions??{};
  requireInput(Object.keys(choices).every(id=>plan.rows.some(r=>r.id===id)),'unknown decision target');
  for(const row of plan.rows){
    const needs=['new','mergeable','conflict','collision','current_missing','unobserved'].includes(row.classification),choice=choices[row.id];
    if(choice)requireInput(['current','proposed','merged'].includes(choice.choice)&&typeof choice.reason==='string'&&choice.reason.trim(),`invalid choice: ${row.id}`);
    if(needs)requireInput(choice&&['current','proposed','merged'].includes(choice.choice)&&typeof choice.reason==='string'&&choice.reason.trim(),`explicit choice/reason required: ${row.id}`);
    if(['unobserved','current_missing'].includes(row.classification))requireInput(choice.choice==='current',`missing records cannot be deleted or recreated: ${row.id}`);
    if(row.classification==='collision')requireInput(choice.choice==='current','unrelated ID collision must be preserved');
    if(choice?.choice==='merged')requireInput(!['conflict','collision','current_missing','unobserved'].includes(row.classification),'resolve conflicting record explicitly as current or proposed');
    let next=choice?.choice==='proposed'?row.proposed:choice?.choice==='merged'?row.merged:row.current;
    if(next){
      next=structuredClone(next);
      if(row.current){next=retainScope(row.current,next);next.owner=row.current.owner;next.lifecycle=row.current.lifecycle;next.execution=row.current.execution;next.extensions=row.current.extensions;next.revision=row.current.revision;}
      if(!row.current||!eq(row.current,next)){
        next.revision=row.current?row.current.revision+1:1;
        updates.push({path:recordPath(next),record:next,expected:row.current?v.hashes[recordPath(row.current)]:null});result.set(next.id,next);changed.push(next.id);
      }
    }
    // Advance the machine base even for an explicitly rejected proposal, keeping the user's value distinguishable.
    if((row.current||next||row.base)&&(row.proposed??row.base))baseImages.push(row.proposed??row.base);
  }
  const generatedIds=new Set(baseImages.map(r=>r.id));
  for(const id of changed){const r=result.get(id);if(r.owner.kind==='module')requireInput(result.get(r.owner.id)?.type==='MOD','missing module');for(const ref of [...references(r),...r.relations.map(e=>e.target)])requireInput(result.has(ref),`missing reference: ${ref}`);}
  const errors=semanticErrors([...result.values()]).filter(e=>changed.includes(e.id));requireInput(!errors.length,JSON.stringify(errors));
  const append=r=>{requireInput(!result.has(r.id),'generated record already exists');requireInput(!recordErrors(r).length&&Buffer.byteLength(JSON.stringify(r,null,2))<=32768,'split large reanalysis batch');updates.push({path:recordPath(r),record:r,expected:null});result.set(r.id,r);};
  for(const generated of baseImages)append(record('DOC',legacyId('DOC',operation,'generation',generated.id),generated.owner.id,`${generated.id} 자동 생성 기준`,{kind:'legacy_generation',subject:generated.id,generated}));
  const receipt=record('DOC',legacyId('DOC',operation,'receipt'),null,'레거시 재분석 채택 기록',{kind:'legacy_reconciliation',change:plan.change,analysis_record:plan.analysis_record,previous:plan.previous,source_digest:plan.inventory.digest,decisions:choices,reviewer:input.reviewer,occurred_at:input.occurred_at,decision_source:input.decision_source,changed},baseImages.map(r=>({type:'context',target:legacyId('DOC',operation,'generation',r.id)})));append(receipt);
  append(record('HIS',legacyId('HIS',operation,'reconciliation'),null,'레거시 재분석 사용자 채택 이력',{subject:plan.change,receipt:receipt.id,receipt_hash:definitionHash(receipt),changed,decided_by:input.reviewer,occurred_at:input.occurred_at,source:input.decision_source,reason:'명시적으로 선택한 세 버전 비교 결과 반영'},[{type:'context',target:receipt.id}]));
  const affected=[];
  for(const id of generatedIds){const before=v.byId.get(id),after=result.get(id);if(!before||!after||!business.has(after.type))continue;
    if(definitionHash(before)!==definitionHash(after)||reviewInput(v.records,[id],'requirement')!==reviewInput([...result.values()],[id],'requirement'))affected.push(id);
  }
  for(const id of [...new Set([...affected,...plan.rows.filter(r=>r.classification==='unobserved'&&business.has(r.type)&&r.current).map(r=>r.id)])]){
    const r=result.get(id);append(record('OI',legacyId('OI',operation,id),r.owner.id,`${r.title} 재분석 확인`,{kind:'legacy_review',status:'open',blocking:true,applies_to:[id,plan.change],question:'변경된 근거·정의 또는 새 분석에서 빠진 항목의 유지/보완을 확인하세요.'},[{type:'applies_to',target:id}]));
  }
  const impactRecords=[...result.values()];
  for(const id of affected){const r=result.get(id),graph=impactGraph(impactRecords,id,{coverage:v.coverage});append(record('IMP',legacyId('IMP',operation,id),r.owner.id,`${r.title} 재분석 영향`,{...graph,before_hash:definitionHash(v.byId.get(id)),applies_to:[id,...graph.candidates.map(c=>c.id)]}));}
  for(const u of updates)requireInput(Buffer.byteLength(JSON.stringify(u.record,null,2))<=32768,'split large reanalysis record');
  return {...transact(store,{operation,intent,updates,readSet:v.hashes,fault}),changed,affected,receipt:receipt.id};
}
