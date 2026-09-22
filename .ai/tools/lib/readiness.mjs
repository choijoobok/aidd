import { contentHash, definitionHash, digest, DEFINITION_TYPES } from './record-contracts.mjs';
import { prototypeErrors, renderPrototype, PROTOTYPE_RENDERER } from './prototype-renderer.mjs';
import { checkDiscovery, discoveryIds, businessEdges } from './business-discovery.mjs';

export const EVALUATOR_VERSION = 'owned-readiness-2.3-system-access';
export const REQUIREMENT_FIELDS = 'source priority actors value statement scope triggers preconditions outcomes rules prohibited_outcomes exceptions boundaries data_needs touchpoints quality_constraints'.split(' ');
export const FEATURE_FIELDS = 'purpose actors preconditions postconditions main_flow alternatives rules inputs outputs exceptions data_access interfaces applicable_quality acceptance_mapping'.split(' ');
export const SCREEN_FIELDS = 'purpose entry exit fields actions view_states transitions validation accessibility applicable_permissions prototype_scenarios'.split(' ');
export const POLICIES = { 'BG-001': 'discovery', 'RG-001': 'requirements', 'DG-001': 'deployment', 'FG-001': 'development', 'TG-002': 'foundation', 'TG-001': 'technology', 'RL-001': 'release' };
const nonempty = x => x !== undefined && x !== null && (typeof x !== 'string' || x.trim() !== '') && (!Array.isArray(x) || x.length > 0);
export function applicable(value) {
  if (!value || typeof value !== 'object' || !['known', 'unknown', 'not_applicable'].includes(value.status)) return false;
  return value.status === 'known' ? nonempty(value.value) : value.status === 'not_applicable' && typeof value.reason === 'string' && value.reason.trim().length > 0;
}
export const valueOf = x => x?.status === 'known' ? x.value : x;
export function references(r) {
  const d = r.definition, refs = [...r.relations, ...businessEdges(r)].filter(x => x.type !== 'context' && x.type !== 'supersedes').map(x => x.target);
  refs.push(...discoveryIds(r));
  for (const key of ['change', 'requirements_baseline', 'design_baseline', 'baseline', 'scope_ref', 'foundation']) if (typeof d[key] === 'string') refs.push(d[key]);
  for (const key of ['requirements', 'features', 'screens', 'data', 'interfaces', 'works', 'changes', 'governing', 'foundations']) for (const id of Array.isArray(d[key]) ? d[key] : []) if (typeof id === 'string') refs.push(id);
  for (const key of ['requirements', 'governing', 'candidates']) refs.push(...(d.scope?.[key] ?? []));
  for (const a of Object.values(d.gate_applicability ?? {})) if (a?.status === 'known' && Array.isArray(a.value)) refs.push(...a.value);
  if (Array.isArray(d.decision_refs?.value)) refs.push(...d.decision_refs.value);
  return [...new Set(refs)];
}
export function closure(records, ids) {
  const map = new Map(records.map(r => [r.id, r])), seen = new Set(), missing = new Set(), queue = [...ids];
  while (queue.length) { const id = queue.shift(); if (seen.has(id)) continue; seen.add(id); const r = map.get(id); if (!r) missing.add(id); else queue.push(...references(r)); }
  return { ids: seen, records: [...seen].map(id => map.get(id)).filter(Boolean), missing: [...missing] };
}
export function reviewInput(records, subjects, kind) {
  const input = closure(records, subjects).records.filter(r => !['RVW', 'GTR', 'EVD', 'HIS'].includes(r.type));
  return digest({ evaluator: EVALUATOR_VERSION, kind, inputs: input.map(r => [r.id, contentHash(r, ['scope', 'requirement', 'consistency'].includes(kind) && ['FEAT', 'SCR', 'DAT', 'NAV', 'IFC', 'SURF'].includes(r.type) ? 'analysis' : 'definition')]).sort() });
}
export function reviewValidity(records, kind, ids, { user = false, coverage, inputDigest } = {}) {
  const map = new Map(records.map(r => [r.id, r]));
  const reviews = records.filter(r => r.type === 'RVW' && r.definition.kind === kind && ids.every(id => r.definition.subjects?.some(s => s.id === id)));
  const ordered = reviews.sort((a, b) => (b.definition.sequence ?? 1) - (a.definition.sequence ?? 1) || b.id.localeCompare(a.id));
  if (ordered.length > 1 && (ordered[0].definition.sequence ?? 1) === (ordered[1].definition.sequence ?? 1)) return 'unknown';
  let stale = false;
  for (const rvw of ordered) {
    const d = rvw.definition;
    if (user && d.decision_source?.kind !== 'user') continue;
    if (coverage && !coverage.every(c => d.coverage?.includes(c))) continue;
    if (!d.method || !d.reviewer || !d.occurred_at || !d.decision_source?.reference || !Array.isArray(d.findings) || !Array.isArray(d.unresolved_refs)) continue;
    if (d.subjects.some(s => !map.has(s.id) || definitionHash(map.get(s.id)) !== s.definition_hash) || d.input_digest !== (inputDigest ?? reviewInput(records, d.subjects.map(s => s.id), kind))) { stale = true; continue; }
    if (d.unresolved_refs.length || d.findings.some(f => f.status !== 'resolved' && f.status !== 'accepted')) return 'rejected';
    return ids.every(id => d.per_subject_results?.[id] === 'accepted') ? 'current' : 'rejected';
  }
  if (['scope', 'requirement', 'consistency', 'design', 'intent', 'business_flow'].includes(kind)) for (const reuse of records.filter(r => r.type === 'RVW' && r.definition.kind === 'equivalence')) {
    const d = reuse.definition, eq = d.equivalence, previous = map.get(eq?.previous_review)?.definition;
    if (!eq?.reason || previous?.kind !== kind || previous.input_digest !== eq.previous_input_digest || !ids.every(id => previous.per_subject_results?.[id] === 'accepted' && d.per_subject_results?.[id] === 'accepted')) continue;
    if (d.decision_source?.kind !== 'user' || !d.decision_source.reference || !d.method || !d.reviewer || !d.occurred_at || d.unresolved_refs?.length || !Array.isArray(d.findings) || d.findings.some(f => !['resolved', 'accepted'].includes(f.status))) continue;
    if (user && previous.decision_source?.kind !== 'user') continue;
    if (coverage && !coverage.every(c => previous.coverage?.includes(c) && d.coverage?.includes(c))) continue;
    if (!ids.every(id => d.subjects?.some(s => s.id === id && map.has(id) && s.definition_hash === definitionHash(map.get(id))))) continue;
    if (d.input_digest !== reviewInput(records, d.subjects.map(s => s.id), 'equivalence') || eq.current_input_digest !== reviewInput(records, previous.subjects.map(s => s.id), kind)) continue;
    if (!previous.subjects.every(s => eq.subject_hashes_before?.some(b => b.id === s.id && b.definition_hash === s.definition_hash))) continue;
    return 'current';
  }
  return stale ? 'stale' : 'missing';
}
export function baselineValidity(records, baseline, kind, required) {
  if (!baseline || baseline.type !== 'BSL' || baseline.definition.kind !== kind) return 'missing';
  const map = new Map(records.map(r => [r.id, r])), members = baseline.definition.members ?? [];
  if (!required.every(id => members.some(m => m.id === id))) return 'missing';
  for (const member of members) {
    const r = map.get(member.id); if (!r) return 'unknown';
    const projection = kind === 'requirements' && ['FEAT', 'SCR', 'DAT', 'NAV', 'IFC', 'SURF'].includes(r.type) ? 'analysis' : 'definition';
    if (member.projection !== projection || contentHash(r, projection) !== member.content_hash) return 'stale';
  }
  return 'current';
}
export function evaluate(records, id, stage = 'requirements', { coverage = { scope_complete: true, project_complete: true }, evaluated_at = null, diagnostics = [], recording = false } = {}) {
  const map = new Map(records.map(r => [r.id, r])), target = map.get(id), blockers = [], unknowns = [];
  const add = (code, subject, reason, path = [subject]) => blockers.push({ code, subject, reason, path });
  const input = closure(records, [id]);
  const relevant = new Set(input.ids);
  const relevantTests = records.filter(r => r.type === 'TC' && r.relations.some(rel => rel.type === 'verifies' && relevant.has(rel.target)));
  for (const tc of relevantTests) relevant.add(tc.id);
  const relatedModules = new Set(input.records.filter(r => r.owner.kind === 'module').map(r => r.owner.id));
  for (const m of relatedModules) relevant.add(m);
  if (!target) add('missing_target', id, '대상 정본을 찾을 수 없습니다.');
  if (!coverage.scope_complete) unknowns.push({ code: 'incomplete_scope', subject: id, reason: '정본 조회 범위가 불완전합니다.' });
  for (const missing of input.missing) unknowns.push({ code: 'missing_dependency', subject: missing });
  for (const r of input.records) if (Object.keys(r.extensions ?? {}).length) unknowns.push({ code: 'unvalidated_extension', subject: r.id });
  for (const diagnostic of diagnostics.filter(d => d.severity !== 'warning')) unknowns.push(diagnostic);
  for (const r of records.filter(r => ['OI', 'DRQ', 'RSK', 'MRC', 'MRG', 'ASM', 'IMP', 'EXC'].includes(r.type) && !['completed', 'cancelled'].includes(r.execution?.status))) {
    if (r.type === 'MRC' && r.definition.blocking === false) continue;
    if (r.type === 'ASM' && !['development','release',POLICIES[r.definition.due_gate]].includes(stage)) continue;
    const applies = r.definition.applies_to ?? r.definition.subjects ?? [];
    if (!applies.length) { if (r.owner.kind === 'project' || relatedModules.has(r.owner.id)) unknowns.push({ code: 'unclassified_open_item', subject: r.id }); }
    else if (applies.includes('project') || applies.some(x => relevant.has(typeof x === 'string' ? x : x.id))) {
      if (r.type === 'EXC') continue;
      if (r.type === 'IMP' && r.definition.candidates?.every(c => c.disposition === 'unaffected' && c.reason)) continue;
      add('open_item', r.id, '관련 미결/질문/영향 판정을 해결해야 합니다.');
    }
  }
  const checkReview = (kind, subjects, options = {}) => { const v = reviewValidity(records, kind, subjects, options); if (v !== 'current') add(`${kind}_review_${v}`, subjects.join(','), '현재 입력에 대한 검토가 필요합니다.'); };
  for (const r of records.filter(r => r.type === 'MRG' && r.definition.assessment === 'assessed' && r.definition.additional_testing === 'required')) {
    if (r.definition.applies_to?.some(s => s === 'project' || relevant.has(s)) && !records.some(m => m.type === 'MRC' && m.definition.merge === r.id && m.definition.type === 'test' && m.definition.blocking)) add('merge_recheck_missing',r.id,'필수 추가 테스트 MRC를 연결하세요.');
  }
  function architecture(chg, kind) {
    if (chg?.type !== 'CHG') { add('change_required', id, 'CHG를 지정하세요.'); return; }
    const a = chg.definition.gate_applicability?.[kind];
    if (!applicable(a)) { add(`${kind}_applicability`, chg.id, '적용 대상 ID 또는 비적용 사유를 사용자 범위 검토에 포함하세요.'); return; }
    checkReview('scope', [chg.id], { user:true });
    if (a.status === 'not_applicable') return;
    const fields = kind === 'deployment' ? ['location','dbms','instances','workload','slo','recovery','state','operating_constraints'] : ['choices','alternatives','tradeoffs','compatibility','decision_refs'];
    if (!Array.isArray(a.value) || !a.value.length) { add(`${kind}_records`,chg.id,'DEP/ARC 대상 목록이 필요합니다.'); return; }
    for (const targetId of a.value) {
      const r = map.get(targetId); if (r?.type !== (kind === 'deployment' ? 'DEP':'ARC')) { add(`${kind}_records`,targetId,'대상 정본 유형이 일치하지 않습니다.'); continue; }
      for (const field of fields) if (!applicable(r.definition[field])) add(`${kind}_detail`,targetId,field);
      if (kind === 'technology') {
        const decisions = valueOf(r.definition.decision_refs);
        if (!Array.isArray(decisions) || !decisions.length || decisions.some(ref => map.get(ref)?.type !== 'ADR')) add('technology_decisions',targetId,'실제 기술 선택 ADR을 연결하세요.');
      }
      checkReview('design',[targetId]);
    }
  }
  function foundation(work) {
    if (work?.type !== 'WRK') { add('work_required',id,'WRK를 지정하세요.'); return; }
    if (!applicable(work.definition.foundation_applicability)) add('foundation_applicability',work.id,'기반 적용성');
    if (work.definition.foundation_applicability?.status === 'known' && !work.definition.foundations?.length) add('foundation_missing',work.id,'적용하는 기반 BSL을 연결하세요.');
    for (const baselineId of work.definition.foundations ?? []) {
      const b = map.get(baselineId), members = b?.definition.members?.map(m => m.id) ?? [];
      if (!members.length || baselineValidity(records,b,'foundation',members) !== 'current') add('foundation_stale',baselineId,'현재 기반 기준선');
      const standards = members.map(m => map.get(m));
      if (!standards.some(r => r?.type === 'STD') || !standards.some(r => r?.type === 'GPH')) add('foundation_contract',baselineId,'기반 표준 STD와 실행 가능한 대표 경로 GPH가 필요합니다.');
      for (const r of standards.filter(r => ['STD','GPH'].includes(r?.type))) for (const key of ['test','observability','deploy','rollback']) if (!applicable(r.definition[key])) add('foundation_detail',r.id,key);
      checkReview('design',[baselineId]);
    }
  }
  function requirements(chg) {
    if (!chg || chg.type !== 'CHG') { add('change_required', id, 'CHG 연결이 필요합니다.'); return; }
    const scope = chg.definition.scope ?? {}, required = scope.requirements ?? [], candidates = scope.candidates ?? [], governing = scope.governing ?? [];
    checkDiscovery(records, chg, { add, checkReview, trace: true });
    if (!required.length) add('empty_scope', chg.id, '빈 모듈/주기는 완료하거나 설계에 진입할 수 없습니다.');
    for (const key of ['excluded', 'deferred']) for (const item of scope[key] ?? []) if (!item.id || !item.reason) add('scope_disposition_reason', chg.id, key);
    checkReview('scope', [chg.id], { user: true });
    const owned = new Set([...(chg.definition.modules ?? []), ...(chg.owner.kind === 'module' ? [chg.owner.id] : [])]);
    const assigned = new Set(records.filter(r => r.type === 'CHG').flatMap(c => [...discoveryIds(c), ...(c.definition.scope?.requirements ?? []), ...(c.definition.scope?.candidates ?? []), ...(c.definition.scope?.excluded ?? []).map(x => x.id), ...(c.definition.scope?.deferred ?? []).map(x => x.id)]));
    for (const r of records) if ((DEFINITION_TYPES.has(r.type) || r.type === 'POL' && r.definition.kind === 'system_access') && owned.has(r.owner.id) && !assigned.has(r.id) && r.lifecycle !== 'retired') add('unassigned_record', r.id, '현재/미래 주기에 포함하거나 제외 사유를 분류하세요.');
    for (const reqId of required) {
      const req = map.get(reqId); if (!req || !['REQ', 'NFR'].includes(req.type)) { add('requirement_missing', reqId, '요구 정본이 없습니다.'); continue; }
      for (const field of REQUIREMENT_FIELDS) if (!applicable(req.definition[field])) add('requirement_detail', reqId, field);
      const acs = req.definition.acceptance_criteria;
      if (!Array.isArray(acs) || !acs.length) add('acceptance_criteria', reqId, '관찰 가능한 인수 기준이 필요합니다.');
      else { const keys = new Set(); for (const ac of acs) { if (!ac.key || keys.has(ac.key) || !['given', 'when', 'then', 'forbidden', 'verification_method'].every(k => nonempty(ac[k]))) add('acceptance_criterion_detail', reqId, ac.key ?? 'missing key'); keys.add(ac.key); } }
      for (const mode of ['normal', 'negative', 'boundary']) if (!applicable(req.definition.applicability?.[mode])) add('acceptance_coverage', reqId, mode);
      if (req.type === 'NFR' && !applicable(req.definition.measurement)) add('nfr_measurement', reqId, '측정 환경·방법·판정 기준');
      checkReview('requirement', [reqId], { user: true });
    }
    for (const key of ['features', 'screens', 'data', 'navigation', 'interfaces']) if (!applicable(scope.inventory?.[key])) add('analysis_inventory', chg.id, key);
    for (const c of candidates) { const r = map.get(c); if (!r || !r.relations.some(rel => ['satisfies', 'presents', 'uses_data', 'context'].includes(rel.type))) add('candidate_trace', c, '분석 후보와 원인 요구/기능의 연결이 필요합니다.'); }
    checkReview('consistency', [chg.id, ...required], { coverage: ['individual', 'related_rules', 'end_to_end'] });
    const b = map.get(chg.definition.requirements_baseline);
    const state = baselineValidity(records, b, 'requirements', [...discoveryIds(chg), ...required, ...candidates, ...governing]);
    if (state !== 'current') add(`requirements_baseline_${state}`, chg.id, '현재 전체 요구와 분석 목록의 기준선을 고정하세요.');
    for (const other of records.filter(r => r.type === 'CHG' && r.id !== chg.id && !['completed', 'cancelled'].includes(r.execution?.status))) {
      const overlap = [...required, ...candidates].filter(x => [...(other.definition.scope?.requirements ?? []), ...(other.definition.scope?.candidates ?? [])].includes(x));
      if (overlap.length && !chg.definition.coordinated_changes?.includes(other.id)) add('active_change_overlap', chg.id, `${other.id}: ${overlap.join(', ')}`);
    }
  }
  function development(work) {
    if (!work || work.type !== 'WRK') { add('work_required', id, '작업 단위 WRK를 지정하세요.'); return; }
    requirements(map.get(work.definition.change));
    if (work.definition.work_kind !== 'product_feature') {
      if (!['foundation', 'investigation', 'documentation', 'refactor'].includes(work.definition.work_kind)) add('work_kind', work.id, '작업 유형을 분류하세요.');
      if (!nonempty(work.definition.completion_criteria)) add('completion_criteria', work.id, '실행 완료 기준');
      return;
    }
    const feats = work.definition.features ?? [], screens = work.definition.screens ?? [];
    architecture(map.get(work.definition.change),'deployment'); architecture(map.get(work.definition.change),'technology'); foundation(work);
    if (!feats.length) add('feature_missing', work.id, '구현할 FEAT가 필요합니다.');
    for (const featureId of feats) {
      const feature = map.get(featureId); if (!feature) { add('feature_missing', featureId, '기능 정본'); continue; }
      for (const field of FEATURE_FIELDS) if (!applicable(feature.definition[field])) add('feature_detail', featureId, field);
      if (!feature.relations.some(r => r.type === 'satisfies')) add('feature_trace', featureId, '요구/AC 연결');
      checkReview('design', [featureId]);
      for (const scr of records.filter(r => r.type === 'SCR' && r.relations.some(rel => rel.type === 'presents' && rel.target === featureId))) if (!screens.includes(scr.id)) add('screen_coverage', scr.id, '기능에 연결된 화면이 작업에서 누락되었습니다.');
    }
    for (const screenId of screens) {
      const scr = map.get(screenId); if (!scr) { add('screen_missing', screenId, '화면 정본'); continue; }
      for (const field of SCREEN_FIELDS) if (!applicable(scr.definition[field])) add('screen_detail', screenId, field);
      checkReview('design', [screenId]); checkReview('prototype', [screenId], { user: true, inputDigest: prototypeInput(records, screenId) });
      for (const reason of prototypeErrors(scr)) add('prototype_contract', screenId, reason);
      const rendered = renderPrototype(scr, prototypeInput(records, screenId));
      const reviewed = records.some(r => r.type === 'RVW' && r.definition.kind === 'prototype' && r.definition.subjects?.some(s => s.id === screenId && s.definition_hash === definitionHash(scr)) && r.definition.input_digest === prototypeInput(records, screenId) && r.definition.per_subject_results?.[screenId] === 'accepted' && r.definition.decision_source?.kind === 'user' && r.definition.artifact?.output_hash === rendered.output_hash && r.definition.artifact?.viewports?.length && valueOf(scr.definition.view_states)?.every(s => r.definition.artifact?.states?.includes(s.key)));
      if (!reviewed || !rendered.output_hash) add('prototype_artifact_review', screenId, '현재 생성 결과 해시와 실제 검토한 상태/뷰포트가 필요합니다.');
      for (const field of ['fields', 'actions', 'view_states', 'prototype_scenarios']) if (!Array.isArray(valueOf(scr.definition[field])) || !valueOf(scr.definition[field]).length) add('prototype_placeholder', screenId, field);
    }
    if (!screens.length && !applicable(work.definition.ui_applicability)) add('ui_applicability', work.id, '비UI 사유와 인터페이스를 명시하세요.');
    if (!applicable(work.definition.foundation_applicability)) add('foundation_applicability', work.id, '기반 적용성');
    if (work.definition.foundation_applicability?.status === 'known' && !work.definition.foundations?.length) add('foundation_missing', work.id, '적용하는 공통 기반 BSL을 연결하세요.');
    for (const baselineId of work.definition.foundations ?? []) { const b = map.get(baselineId); if (baselineValidity(records, b, 'foundation', b?.definition.members?.map(m => m.id) ?? []) !== 'current') add('foundation_stale', baselineId, '공통 기반 기준선'); checkReview('design', [baselineId]); }
    const reqs = new Set(feats.flatMap(f => map.get(f)?.relations.filter(r => r.type === 'satisfies').map(r => r.target) ?? []));
    for (const reqId of reqs) for (const ac of map.get(reqId)?.definition.acceptance_criteria ?? []) {
      const plans = records.filter(r => r.type === 'TC' && r.relations.some(rel => rel.type === 'verifies' && rel.target === reqId && rel.selector === ac.key));
      if (!plans.some(tc => ['steps', 'inputs', 'expected', 'forbidden', 'method'].every(k => nonempty(tc.definition[k])))) add('test_plan_missing', reqId, ac.key);
    }
    for (const rel of work.relations.filter(r => r.type === 'depends_on')) {
      const dep = map.get(rel.target), output = rel.required_output;
      if (output === 'contract') checkReview('design', [rel.target]);
      else if (['implementation', 'integration'].includes(output)) {
        if (!dep || dep.execution?.status !== 'completed' || !actualEvidence(records, dep, output)) add('predecessor_output', rel.target, output);
      } else add('dependency_output_unknown', rel.target, 'contract/implementation/integration을 지정하세요.');
    }
  }
  if (target && stage === 'discovery') {
    if (target.type !== 'CHG') add('change_required', id, 'CHG 연결이 필요합니다.');
    else { checkReview('scope', [target.id], { user: true }); checkDiscovery(records, target, { add, checkReview }); }
  }
  if (target && stage === 'requirements') requirements(target);
  if (target && stage === 'development') development(target);
  if (target && ['deployment','technology'].includes(stage)) { architecture(target,'deployment'); if (stage === 'technology') architecture(target,'technology'); }
  if (target && stage === 'foundation') { architecture(map.get(target.definition.change),'deployment'); architecture(map.get(target.definition.change),'technology'); foundation(target); }
  if (target && stage === 'release') {
    if (target.type !== 'REL' || !(target.definition.works ?? []).length) add('release_scope', id, '실제 전달할 작업과 환경이 필요합니다.');
    for (const w of target.definition.works ?? []) {
      const work = map.get(w); development(work);
      const chg = map.get(work?.definition.change);
      const gateScopes = [['RG-001',chg?.id],['FG-001',w]];
      for (const [gate,key] of [['DG-001','deployment'],['TG-001','technology']]) if (chg?.definition.gate_applicability?.[key]?.status === 'known') gateScopes.push([gate,chg.id]);
      if (work?.definition.foundation_applicability?.status === 'known') gateScopes.push(['TG-002',w]);
      for (const [gate,scope] of gateScopes) {
        const expected = evaluate(records,scope,POLICIES[gate],{coverage,evaluated_at,diagnostics,recording:true});
        const runs = records.filter(r => r.type === 'GTR' && r.definition.scope_ref === scope && r.definition.gate === gate).sort((a,b) => b.definition.attempt-a.definition.attempt);
        if (!runs.length || runs[0].definition.input_digest !== expected.input_digest || runs[0].definition.result !== 'passed' || (runs[1] && runs[1].definition.attempt === runs[0].definition.attempt)) add('gate_run_missing_or_stale',scope,gate);
      }
      if (work?.execution?.status !== 'completed' || !actualEvidence(records, work, 'implementation')) add('work_execution_missing', w, '구현/실행 증거');
      const reqs = new Set((work?.definition.features ?? []).flatMap(f => map.get(f)?.relations.filter(r => r.type === 'satisfies').map(r => r.target) ?? []));
      for (const req of reqs) for (const ac of map.get(req)?.definition.acceptance_criteria ?? []) {
        const tests = records.filter(r => r.type === 'TC' && r.relations.some(rel => rel.type === 'verifies' && rel.target === req && rel.selector === ac.key));
        if (!tests.some(tc => actualEvidence(records, tc, 'test'))) add('acceptance_execution_missing', req, ac.key);
      }
    }
    if (!target.definition.environment || !actualEvidence(records, target, 'integration')) add('integration_evidence_missing', id, 'stub가 아닌 실제 조합·환경별 통합 증거');
    for (const r of input.records) if (r.lifecycle === 'retired' && ['IFC', 'STD', 'BSL'].includes(r.type)) add('provider_contract_retired', r.id, '역사적 운영 기록은 보존하지만 폐기된 공급 계약으로 새 릴리스할 수 없습니다.');
  }
  const gateInputs = [...input.records, ...relevantTests].filter(r => !['GTR', 'RVW', 'HIS'].includes(r.type)).map(r => [r.id, definitionHash(r), r.execution ?? {}]);
  const reviewInputs = records.filter(r => r.type === 'RVW' && r.definition.subjects?.some(s => relevant.has(s.id))).map(r => [r.id, definitionHash(r)]);
  const evidenceInputs = records.filter(r => r.type === 'EVD' && r.definition.subjects?.some(s => relevant.has(s))).map(r => [r.id, definitionHash(r)]);
  const exceptionRecords = records.filter(r => r.type === 'EXC' && r.definition.applies_to?.some(s => s === 'project' || relevant.has(s)) && !['completed', 'cancelled'].includes(r.execution?.status));
  const waived = [], capable = new Set(['predecessor_output', 'foundation_stale', 'provider_contract_retired']);
  for (const exception of exceptionRecords) {
    const d = exception.definition, policy = map.get(d.policy);
    if (!evaluated_at || !Number.isFinite(Date.parse(evaluated_at))) { unknowns.push({ code: 'exception_evaluation_time_required', subject: exception.id, reason: '예외가 있는 판정에는 명시적인 evaluated_at이 필요합니다.' }); continue; }
    if (!d.reason || !d.compensating_controls?.length || !d.decision_source?.reference || d.decision_source.kind !== 'user' || !d.expires_at || Date.parse(d.expires_at) <= Date.parse(evaluated_at) || !Number.isFinite(Date.parse(d.expires_at))) { add('exception_invalid_or_expired', exception.id, '현재 유효한 사용자 결정·만료·보완 통제가 필요합니다.'); continue; }
    if (!Array.isArray(d.criteria) || !d.criteria.length || !d.criteria.every(code => capable.has(code) && policy?.definition.exception_criteria?.includes(code))) { add('exception_nonwaivable', exception.id, '이 기준은 명시적 정책으로 면제할 수 없습니다. 요구 사용자 수용은 면제하지 않습니다.'); continue; }
    if (!d.applies_to.filter(s => s !== 'project').every(s => map.has(s) && d.input_hashes?.[s] === definitionHash(map.get(s)))) { add('exception_stale', exception.id, '예외 대상 입력이 달라졌습니다.'); continue; }
    for (let i = blockers.length - 1; i >= 0; i--) if (d.criteria.includes(blockers[i].code) && (d.applies_to.includes('project') || d.applies_to.includes(blockers[i].subject) || d.applies_to.includes(id))) waived.push({ exception: exception.id, ...blockers.splice(i, 1)[0] });
  }
  const input_digest = digest({ version: EVALUATOR_VERSION, stage, gateInputs: gateInputs.sort(), reviews: reviewInputs.sort(), evidence: evidenceInputs.sort(), exceptions: exceptionRecords.map(r => [r.id, definitionHash(r), definitionHash(map.get(r.definition.policy) ?? { id: 'missing', type: 'POL', owner: {}, title: '', definition: {}, relations: [] })]), evaluation_time: exceptionRecords.length ? evaluated_at : null });
  const requiredGates = Object.entries(POLICIES).filter(([,s]) => s === stage).map(([gate]) => gate);
  for (const gate of recording ? [] : requiredGates) {
    const runs = records.filter(r => r.type === 'GTR' && r.definition.scope_ref === id && r.definition.gate === gate).sort((a, b) => b.definition.attempt - a.definition.attempt);
    if (runs.length > 1 && runs[0].definition.attempt === runs[1].definition.attempt) unknowns.push({ code: 'ambiguous_gate_attempt', subject: id, gate });
    if (runs.length && runs[0].definition.input_digest === input_digest && runs[0].definition.result !== 'passed') add('latest_gate_failed', runs[0].id, '최신 실패를 과거 통과로 대체할 수 없습니다.');
    if (stage === 'release' && (!runs.length || runs[0].definition.input_digest !== input_digest)) add('gate_run_missing_or_stale', id, gate);
  }
  const unique = list => [...new Map(list.map(x => [digest(x), x])).values()];
  return { scope: { kind: stage, id }, input_digest, readiness: unknowns.length ? 'unknown' : blockers.length ? 'blocked' : 'ready', validity: blockers.some(b => b.code.includes('stale')) ? 'stale' : unknowns.length ? 'unknown' : blockers.length ? 'missing' : 'current', blockers: unique(blockers), unknowns: unique(unknowns), waived, next_actions: unique([...blockers, ...unknowns]).map(b => ({ subject: b.subject, action: b.reason ?? b.code, code: b.code })), coverage, evaluated_at };
}
export function actualEvidence(records, target, kind) {
  return records.some(r => r.type === 'EVD' && r.definition.subjects?.includes(target.id) && r.definition.kind === kind && r.definition.result === 'passed' && r.definition.input_hash === definitionHash(target) && r.definition.command && r.definition.occurred_at && r.definition.artifacts?.length && (kind !== 'integration' || (r.definition.environment === target.definition.environment && r.definition.mode === 'actual')));
}
export { PROTOTYPE_RENDERER };
export const prototypeInput = (records, id) => digest({ renderer: PROTOTYPE_RENDERER, inputs: reviewInput(records, [id], 'prototype') });
