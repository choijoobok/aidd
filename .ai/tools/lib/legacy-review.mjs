import { record, recordPath, definitionHash, digest } from './record-contracts.mjs';
import { StoreError } from './record-store.mjs';
import { replayOperation, transact } from './record-transaction.mjs';
import { applicable, evaluate, reviewInput, reviewValidity, REQUIREMENT_FIELDS, FEATURE_FIELDS, SCREEN_FIELDS } from './readiness.mjs';
import { businessErrors, discoveryIds } from './business-discovery.mjs';
import { requireInput } from './legacy-inventory.mjs';

export const legacyId = (type, ...parts) => `${type}-RE-${digest(parts).slice(0, 24).toUpperCase()}`;
const stages = [ ['MOD','SYS','CAP'], ['ACT','POL'], ['UC','BPR'], ['REQ','NFR'], ['FEAT','SCR','DAT','NAV','IFC'] ];
const labels = ['시스템·핵심 업무','역할·접속 정책','유즈케이스·프로세스','요구·인수 기준','상세 설계'];
const kindOf = type => ['MOD','SYS','CAP','ACT','POL'].includes(type) ? 'intent' : ['UC','BPR'].includes(type) ? 'business_flow' : ['REQ','NFR'].includes(type) ? 'requirement' : 'design';
export const live = r => !['completed','cancelled'].includes(r.execution?.status);
export function userDecision(input) {
  requireInput(input.decision_source?.kind === 'user' && typeof input.decision_source.reference === 'string' && input.decision_source.reference.trim() && typeof input.reviewer === 'string' && input.reviewer.trim() && typeof input.occurred_at === 'string' && Number.isFinite(Date.parse(input.occurred_at)), 'actual user decision reference/reviewer/occurred_at required');
}
export function completeView(store) {
  const v = store.scanAll(); if (!v.coverage.scope_complete) throw new StoreError('legacy_store_incomplete', 'Complete readable records required.'); return v;
}
export function detailErrors(r, map) {
  if (['SYS','CAP','ACT','POL','UC','BPR'].includes(r.type)) return businessErrors(r, map);
  const errors = [], fail = field => errors.push({ code: 'legacy_detail', subject: r.id, reason: `${field}: 상세 보완 필요` });
  if (r.type === 'MOD') { if (typeof r.definition.purpose !== 'string' || !r.definition.purpose.trim()) fail('purpose'); return errors; }
  const required = ['REQ','NFR'].includes(r.type) ? REQUIREMENT_FIELDS : r.type === 'FEAT' ? FEATURE_FIELDS : r.type === 'SCR' ? SCREEN_FIELDS : ['purpose','analysis'];
  for (const field of required) if (!applicable(r.definition[field])) fail(field);
  if (['REQ','NFR'].includes(r.type)) {
    const ac = r.definition.acceptance_criteria;
    if (!Array.isArray(ac) || !ac.length || ac.some(a => !a || !['key','given','when','then','forbidden','verification_method'].every(k => typeof a[k] === 'string' && a[k].trim()))) fail('acceptance_criteria');
    for (const k of ['normal','negative','boundary']) if (!applicable(r.definition.applicability?.[k])) fail(`applicability.${k}`);
    if (r.type === 'NFR' && !applicable(r.definition.measurement)) fail('measurement');
  }
  if (r.type === 'DAT' && !r.definition.attributes?.length) fail('attributes');
  if (r.type === 'NAV' && !r.definition.entries?.length) fail('entries');
  return errors;
}
export function legacyReviewModel(records, change, { limit = 3, coverage = { scope_complete: true } } = {}) {
  requireInput(Number.isInteger(limit) && limit >= 1 && limit <= 3, 'limit: 1..3');
  const map = new Map(records.map(r => [r.id,r])), chg = map.get(change);
  requireInput(chg?.type === 'CHG', 'legacy review requires CHG');
  const analysis = chg.relations.map(r => map.get(r.target)).find(r => r?.definition.kind === 'reverse_engineering');
  requireInput(analysis, 'CHG must reference reverse_engineering LDP');
  const ids = new Set([...(chg.definition.modules ?? []), ...discoveryIds(chg), ...(chg.definition.scope?.requirements ?? []), ...(chg.definition.scope?.candidates ?? [])]);
  const items = [...ids].map(id => map.get(id)).filter(Boolean).filter(r => stages.some(s => s.includes(r.type))).map(r => {
    const kind = kindOf(r.type), mapping = records.find(m => m.definition.kind === 'legacy_mapping' && m.definition.subject === r.id && m.definition.analysis === analysis.id);
    const sources = mapping?.relations.map(e => map.get(e.target)).filter(x => x?.definition.kind === 'legacy_observation').map(x => ({ id:x.id, ...x.definition.analysis })) ?? [];
    const validity = reviewValidity(records, kind, [r.id], { user: true });
    const details = detailErrors(r,map), stage = stages.findIndex(s => s.includes(r.type));
    const open = records.filter(o => o.type === 'OI' && live(o) && o.definition.applies_to?.includes(r.id) && (o.id.startsWith('OI-RE-') || o.definition.kind === 'legacy_review'));
    return { id:r.id, type:r.type, title:r.title, stage, kind, definition:r.definition, definition_hash:definitionHash(r), input_digest:reviewInput(records,[r.id],kind), review:validity, detail_errors:details, complete:validity === 'current' && details.length === 0 && open.length === 0, sources, original_mapping:mapping?.definition.fields ?? {}, open_items:open.map(o => o.id) };
  }).sort((a,b) => a.stage - b.stage || a.id.localeCompare(b.id));
  const d = chg.definition.scope?.discovery ?? {};
  const missing = stages.map(() => []);
  if (!d.overview || !map.has(d.overview)) missing[0].push('SYS');
  for (const [group, type, stage] of [['capabilities','CAP',0],['actors','ACT',1],['access_policies','POL',1],['use_cases','UC',2],['processes','BPR',2]]) if (!applicable(d[group])) missing[stage].push(type);
  if (!chg.definition.scope?.requirements?.length) missing[3].push('REQ/NFR');
  const phases = stages.map((types,index) => ({ index, title:labels[index], total:items.filter(i => i.stage===index).length, pending:items.filter(i => i.stage===index && !i.complete).length, missing:missing[index] }));
  const next = phases.find(p => p.pending || p.missing.length)?.index ?? null;
  const selected = next === null ? [] : items.filter(i => i.stage===next && !i.complete).slice(0,limit);
  const packet = { schema_version:1, kind:'legacy_review_packet', change, analysis:analysis.id, limit, stage:next, items:selected };
  const gate=evaluate(records,change,'requirements',{coverage});
  return { change, analysis:analysis.id, phases, items, counts:{ total:items.length, current:items.filter(i=>i.complete).length, stale:items.filter(i=>i.review==='stale').length, pending:items.filter(i=>!i.complete).length }, next_stage:next, coverage, requirement_readiness:gate.readiness, coverage_gaps:gate.blockers.filter(b=>/coverage|inventory|source|trace|scope/.test(b.code)), packet:{ ...packet, digest:digest(packet) }, note:'검토 순서 안내이며 설계/개발 게이트와 실제 실행 검증을 대체하지 않습니다.' };
}
export function legacyReview(store, change, limit = 3) { const v = completeView(store); return legacyReviewModel(v.records, change, { limit, coverage:v.coverage }); }
export function legacyReviewRequest(store, input, operation) {
  const intent = { command:'legacy-review-request', input }, replay = replayOperation(store,operation,intent); if(replay) return replay;
  requireInput(input.packet?.kind==='legacy_review_packet' && Number.isFinite(Date.parse(input.asked_at)), 'packet and asked_at required');
  const view = completeView(store), p = input.packet, fresh = legacyReviewModel(view.records,p.change,{limit:p.limit}).packet;
  requireInput(digest(p)===digest(fresh) && p.items.length>0, 'review packet stale or empty');
  const updates = [], requests = [];
  for (const [index,item] of p.items.entries()) {
    const r = view.byId.get(item.id), prior = view.records.find(q => q.type==='DRQ' && live(q) && q.definition.kind==='legacy_review' && q.definition.change===p.change && q.definition.subject===item.id && q.definition.presented?.definition_hash===item.definition_hash && q.definition.presented?.input_digest===item.input_digest);
    if(prior) { requests.push(prior.id); continue; }
    const oiIds = [...item.open_items];
    if (!oiIds.length) {
      const oi = record('OI',legacyId('OI',operation,item.id),r.owner.id,`${r.title} 검토`,{kind:'legacy_review',status:'open',blocking:true,applies_to:[item.id,p.change],question:'현재 정의와 남은 항목을 검토하세요.'},[{type:'applies_to',target:item.id}]);
      updates.push({path:recordPath(oi),record:oi,expected:null}); oiIds.push(oi.id);
    }
    const q = record('DRQ',legacyId('DRQ',operation,item.id),r.owner.id,`${r.title} 사용자 검토`,{kind:'legacy_review',change:p.change,subject:item.id,status:'awaiting_decision',blocking:true,priority:1,asked_at:input.asked_at,sequence:index+1,applies_to:[item.id],question:'현행 관측과 목표 요구를 구분하여 수용/보완/보류/거절을 결정해 주세요.',options:['accepted','changes_requested','deferred','rejected'],recommendation:'미정·충돌은 보완하고 실제 수용한 내용만 승인',impact_if_unanswered:'해당 단계 검토 미완료로 유지',presented:{definition_hash:item.definition_hash,input_digest:item.input_digest,kind:item.kind,stage:item.stage},open_items:oiIds},oiIds.map(target=>({type:'context',target})));
    updates.push({path:recordPath(q),record:q,expected:null}); requests.push(q.id);
  }
  return {...transact(store,{operation,intent,updates,readSet:view.hashes}),requests};
}
export function legacyReviewAnswer(store,input,operation) {
  const intent={command:'legacy-review-answer',input},replay=replayOperation(store,operation,intent);if(replay)return replay;
  userDecision(input);
  requireInput(Array.isArray(input.answers)&&input.answers.length>0&&input.answers.length<=3&&new Set(input.answers.map(a=>a.request)).size===input.answers.length,'1..3 unique answers required');
  const v=completeView(store), updates=new Map(), results=[], put=(r,expected=null)=>updates.set(r.id,{path:recordPath(r),record:r,expected});
  requireInput(new Set(input.answers.map(a=>v.byId.get(a.request)?.definition.subject)).size===input.answers.length,'answer each subject once per operation');
  for(const a of input.answers) {
    const q=v.byId.get(a.request), d=q?.definition, r=v.byId.get(d?.subject);
    requireInput(q?.type==='DRQ'&&d.kind==='legacy_review'&&live(q)&&r&&['accepted','changes_requested','deferred','rejected'].includes(a.result)&&typeof a.note==='string'&&a.note.trim(),'live legacy request/result/note required');
    const p=d.presented, current=p.definition_hash===definitionHash(r)&&p.input_digest===reviewInput(v.records,[r.id],p.kind);
    const board=legacyReviewModel(v.records,d.change), order=board.next_stage===null||p.stage<=board.next_stage;
    const details=detailErrors(r,v.byId), canClose=current&&order&&a.result==='accepted'&&!details.length;
    const seq=1+Math.max(0,...v.records.filter(x=>x.type==='RVW'&&x.definition.kind===p.kind&&x.definition.subjects?.some(s=>s.id===r.id)).map(x=>x.definition.sequence??1));
    const rvw=record('RVW',legacyId('RVW',operation,q.id),r.owner.id,`${r.title} 사용자 판단`,{kind:p.kind,subjects:[{id:r.id,definition_hash:p.definition_hash}],input_digest:p.input_digest,sequence:seq,coverage:[],findings:order?[]:[{status:'open',reason:'선행 단계 재검토 필요'}],unresolved_refs:[],method:a.note,reviewer:input.reviewer,occurred_at:input.occurred_at,decision_source:input.decision_source,per_subject_results:{[r.id]:a.result}});
    const his=record('HIS',legacyId('HIS',operation,q.id),r.owner.id,rvw.title,{review:rvw.id,request:q.id,subject:r.id,result:a.result,current_at_recording:current&&order,reason:a.note,decided_by:input.reviewer,occurred_at:input.occurred_at,source:input.decision_source});put(rvw);put(his);
    if(current&&order){
      const next=structuredClone(q);next.revision++;next.definition.status=a.result==='deferred'?'deferred':a.result==='accepted'&&!canClose?'awaiting_decision':'resolved';
      next.definition.resolution=rvw.id;next.definition.decided_by=input.reviewer;next.definition.resolved_at=input.occurred_at;
      if(next.definition.status==='resolved')next.execution={...next.execution,status:'completed',results:[rvw.id]};put(next,v.hashes[recordPath(q)]);
      if(canClose)for(const id of d.open_items??[]){const oi=v.byId.get(id);if(oi?.type!=='OI'||!oi.definition.applies_to?.includes(r.id)||!live(oi))continue;const n=structuredClone(oi);n.revision++;n.definition.status='closed';n.definition.resolution=rvw.id;n.execution={...n.execution,status:'completed',results:[rvw.id]};put(n,v.hashes[recordPath(oi)]);}
    }
    results.push({request:q.id,subject:r.id,result:a.result,current:current&&order,closed:canClose,detail_errors:details});
  }
  return {...transact(store,{operation,intent,updates:[...updates.values()],readSet:v.hashes}),results};
}
