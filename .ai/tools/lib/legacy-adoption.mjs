import { record, recordPath, definitionHash, digest } from './record-contracts.mjs';
import { evaluate, closure, reviewValidity } from './readiness.mjs';
import { readContext } from './lifecycle-operations.mjs';
import { legacyReviewModel, legacyId, userDecision } from './legacy-review.mjs';
import { legacySourceCheck } from './legacy-source-check.mjs';
import { requireInput } from './legacy-inventory.mjs';
import { replayOperation, transact } from './record-transaction.mjs';

const text = x => typeof x === 'string' && x.trim().length > 0;
const list = x => Array.isArray(x) ? x : [];
const nonempty = x => text(x) || Array.isArray(x) && x.length > 0;
const active = r => r.lifecycle !== 'retired';
const VERSION = 'legacy-adoption-1';

export function legacyAdoptionModel(records, change, module, { coverage = { scope_complete:true }, source = null } = {}) {
  const map = new Map(records.map(r=>[r.id,r])), chg = map.get(change), blockers=[];
  requireInput(chg?.type==='CHG','CHG required');
  const add=(code,subject,reason)=>blockers.push({code,subject,reason});
  const board=legacyReviewModel(records,change,{coverage}), analysis=map.get(board.analysis);
  if(map.get(module)?.type!=='MOD'||chg.owner.id!==module||chg.definition.modules?.length!==1||chg.definition.modules[0]!==module) add('module_scope',change,'독립 채택은 한 모듈의 CHG 전체 범위입니다.');
  for(const i of board.items)if(map.get(i.id).owner.kind==='module'&&map.get(i.id).owner.id!==module) add('foreign_candidate',i.id,'공통 참조와 다른 모듈 후보의 부분 채택을 구분하세요.');
  if(!coverage.scope_complete) add('incomplete_scope',change,'정본 조회가 불완전합니다.');
  if(!analysis.definition.coverage?.scope_complete) add('source_coverage',analysis.id,'분석 자료 범위가 불완전합니다.');
  if(board.next_stage!==null) add('legacy_review_pending',change,'순차 사용자 검토/상세 보완이 남았습니다.');
  const requirements=evaluate(records,change,'requirements',{coverage});
  if(requirements.readiness!=='ready') blockers.push(...requirements.blockers,...requirements.unknowns);
  const plans=records.filter(r=>r.type==='DOC'&&active(r)&&r.definition.kind==='legacy_validation_plan'&&r.definition.change===change&&r.definition.module===module);
  if(plans.length!==1) add('validation_plan',change,'현재 검증·현행/목표 차이 계획 한 개가 필요합니다.');
  const plan=plans.length===1?plans[0]:null,d=plan?.definition??{},tests=list(d.tests),reqs=list(chg.definition.scope?.requirements),candidates=list(chg.definition.scope?.candidates);
  if(plan){
    if(plan.owner.id!==module||!text(d.environment)||!text(d.coverage_notes)) add('plan_detail',plan.id,'모듈 소유·환경·자료 coverage 판단이 필요합니다.');
    if(reviewValidity(records,'design',[plan.id],{user:true})!=='current') add('plan_review',plan.id,'현재 사용자 검증/차이 계획 검토가 필요합니다.');
    if(!tests.length||new Set(tests).size!==tests.length) add('test_scope',plan.id,'중복 없는 TC 목록이 필요합니다.');
    for(const id of tests){
      const tc=map.get(id);
      if(tc?.type!=='TC'||!active(tc)||!['steps','inputs','expected','forbidden','method'].every(k=>nonempty(tc.definition[k]))) add('test_detail',id,'상세 TC가 필요합니다.');
      if(!plan.relations.some(r=>r.type==='depends_on'&&r.target===id)) add('plan_trace',id,'계획의 depends_on으로 TC를 연결하세요.');
      if(!tc?.relations.some(r=>r.type==='verifies'&&reqs.includes(r.target)&&list(map.get(r.target)?.definition.acceptance_criteria).some(ac=>ac.key===r.selector))) add('test_trace',id,'범위 내 REQ/AC 연결이 필요합니다.');
    }
    for(const id of reqs)for(const ac of list(map.get(id)?.definition.acceptance_criteria))if(!tests.some(t=>map.get(t)?.relations.some(r=>r.type==='verifies'&&r.target===id&&r.selector===ac.key))) add('acceptance_plan',id,ac.key);
    for(const key of ['normal','exception','data_boundary']){
      const s=d.scenarios?.[key];
      if(!(list(s?.tests).length&&s.tests.every(t=>tests.includes(t)))&&!(key!=='normal'&&text(s?.not_applicable))) add('scenario_plan',plan.id,key);
    }
    const subjects=[...reqs,...candidates],diffs=list(d.differences);
    if(diffs.length!==subjects.length||new Set(diffs.map(x=>x.subject)).size!==diffs.length) add('difference_scope',plan.id,'요구/설계 후보별 현행·목표 판단을 한 번씩 기록하세요.');
    for(const id of subjects){
      const row=diffs.find(x=>x.subject===id);
      if(!row||!['retain','fix','improve','retire'].includes(row.disposition)||!text(row.reason)){add('difference_decision',id,'유지/수정/개선/폐기와 사유가 필요합니다.');continue;}
      if(row.disposition!=='retain'){
        const work=map.get(row.work),follow=map.get(work?.definition.change);
        if(work?.type!=='WRK'||follow?.type!=='CHG'||!active(work)||!work.relations.some(r=>r.target===id&&['implements','depends_on'].includes(r.type))||!plan.relations.some(r=>r.target===work.id&&r.type==='depends_on')) add('difference_work',id,'대상에 연결된 실제 후속 WRK/CHG가 필요합니다.');
      }
    }
    const screens=candidates.filter(id=>map.get(id)?.type==='SCR'),ui=list(d.existing_ui);
    if(ui.length!==screens.length||new Set(ui.map(x=>x.screen)).size!==ui.length) add('existing_ui_scope',plan.id,'기존 화면별 재사용 판단이 필요합니다.');
    for(const id of screens){const row=ui.find(x=>x.screen===id);if(!row||!text(row.reason)||!text(row.reference)||reviewValidity(records,'design',[id],{user:true})!=='current'||!plan.relations.some(r=>r.type==='depends_on'&&r.target===id)) add('existing_ui_review',id,'실제 화면 확인 근거·재사용 사유·현재 사용자 검토가 필요합니다.');}
  }
  const relevant=closure(records,[change,module,...(plan?[plan.id]:[])]),ids=new Set(relevant.ids);
  const document_digest=digest({version:VERSION,change,module,definitions:relevant.records.filter(r=>!['RVW','EVD','GTR','HIS'].includes(r.type)).map(r=>[r.id,definitionHash(r)]).sort(),reviews:records.filter(r=>r.type==='RVW'&&r.definition.subjects?.some(s=>ids.has(s.id))).map(r=>[r.id,definitionHash(r)]).sort()});
  const bindings=tests.filter(id=>map.get(id)?.type==='TC').map(id=>{
    const tc=map.get(id),requirements=tc.relations.filter(r=>r.type==='verifies').map(r=>[r.target,r.selector??null,map.has(r.target)?definitionHash(map.get(r.target)):null]);
    return {test:id,plan:plan.id,input_digest:digest({plan:definitionHash(plan),test:definitionHash(tc),requirements,inventory:analysis.definition.inventory_digest}),input_hash:definitionHash(tc),code_revision:analysis.definition.inventory_digest,environment:d.environment};
  });
  const results=bindings.map(binding=>{
    const ev=records.filter(r=>r.type==='EVD'&&r.definition.kind==='test'&&r.definition.subjects?.includes(binding.test)).sort((a,b)=>Date.parse(b.definition.occurred_at)-Date.parse(a.definition.occurred_at));
    if(!ev.length)return {...binding,status:'not_run',evidence:null};
    if(ev.some(r=>!Number.isFinite(Date.parse(r.definition.occurred_at))))return {...binding,status:'invalid',evidence:null};
    const e=ev[0],x=e.definition,link=e.extensions?.legacy_validation;
    const valid=x.mode==='actual'&&text(x.command)&&list(x.artifacts).length>0&&['passed','failed'].includes(x.result);
    const current=(!source||source.current&&source.coverage.scope_complete)&&x.input_hash===binding.input_hash&&x.code_revision===binding.code_revision&&x.environment===binding.environment&&link?.plan===binding.plan&&link.input_digest===binding.input_digest;
    const status=ev[1]&&Date.parse(ev[1].definition.occurred_at)===Date.parse(x.occurred_at)?'ambiguous':!valid?'invalid':!current?'stale':x.result;
    return {...binding,status,evidence:e.id};
  });
  const counts=Object.fromEntries(['not_run','passed','failed','stale','invalid','ambiguous'].map(k=>[k,results.filter(r=>r.status===k).length]));
  const runtime_status=!results.length||counts.not_run===results.length?'not_run':counts.failed?'failed':counts.invalid||counts.ambiguous?'invalid':counts.stale?'stale':counts.not_run?'partial':'passed';
  const adoptions=records.filter(r=>r.type==='DOC'&&r.definition.kind==='legacy_adoption'&&r.definition.change===change&&r.definition.module===module).sort((a,b)=>b.definition.sequence-a.definition.sequence);
  const latest=adoptions[0];
  const sourceBlocked=source&&(!source.current||!source.coverage.scope_complete);
  const unique=[...new Map(blockers.map(b=>[digest(b),b])).values()];
  if(sourceBlocked)unique.push({code:'source_stale_or_incomplete',subject:analysis.id,reason:'현재 자료를 재분석하세요.'});
  return {change,module,analysis:analysis.id,plan:plan?.id??null,document_digest,documentation:{readiness:unique.length?'blocked':'ready',blockers:unique},source_check:source?{checked:true,current:source.current,coverage:source.coverage}:{checked:false,note:'저장된 자료 기준. 채택 전 source-check 필요'},runtime:{status:runtime_status,counts,tests:results},test_bindings:bindings,adoption:{status:!latest?'not_adopted':adoptions[1]?.definition.sequence===latest.definition.sequence?'ambiguous':latest.definition.document_digest===document_digest&&!unique.length?'current':'stale',record:latest?.id??null},next_action:unique.length?'차단 항목 보완·영향 검토':!latest?'현재 문서 관리 범위를 사용자와 채택':'신규 변경은 정상 CHG/WRK·설계/목업·검증 흐름으로 진행',note:'문서 준비/채택은 실제 테스트·운영·릴리스 완료가 아닙니다.'};
}

export function legacyAdoptionCheck(store,change,module){
  const view=readContext(store,change,module),source=legacySourceCheck(store,change,{view});
  return legacyAdoptionModel(view.records,change,module,{coverage:view.coverage,source});
}
export function legacyAdopt(store,input,operation,{fault}={}){
  const intent={command:'legacy-adopt',input},replay=replayOperation(store,operation,intent);if(replay)return replay;
  userDecision(input);
  const view=readContext(store,input.change,input.module),source=legacySourceCheck(store,input.change,{view});
  const model=legacyAdoptionModel(view.records,input.change,input.module,{coverage:view.coverage,source});
  requireInput(model.documentation.readiness==='ready'&&input.document_digest===model.document_digest,'current ready adoption preview required');
  const prior=view.records.filter(r=>r.type==='DOC'&&r.definition.kind==='legacy_adoption'&&r.definition.change===input.change&&r.definition.module===input.module);
  const doc=record('DOC',legacyId('DOC',operation,'adoption'),input.module,'레거시 정본 관리 채택',{kind:'legacy_adoption',change:input.change,module:input.module,plan:model.plan,document_digest:model.document_digest,sequence:1+Math.max(0,...prior.map(r=>r.definition.sequence)),runtime_at_adoption:model.runtime.status,reviewer:input.reviewer,occurred_at:input.occurred_at,decision_source:input.decision_source},[input.change,model.plan].map(target=>({type:'context',target})));
  const his=record('HIS',legacyId('HIS',operation,'adoption'),input.module,doc.title,{subject:doc.id,definition_hash:definitionHash(doc),reason:'문서 관리만 채택; 실제 실행/릴리스와 구분',decided_by:input.reviewer,occurred_at:input.occurred_at,source:input.decision_source});
  return transact(store,{operation,intent,updates:[doc,his].map(r=>({path:recordPath(r),record:r,expected:null})),readSet:view.hashes,fault});
}
