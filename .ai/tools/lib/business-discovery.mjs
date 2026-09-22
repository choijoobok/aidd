// Portable business analysis contracts. No provider hooks import this module.
import { accessKeys, accessEdges, accessPolicyErrors, accessBindingErrors, checkAccessCoverage, isAccessPolicy } from './system-access.mjs';
export const DISCOVERY_FIELDS = {
  SYS: 'problem purpose outcomes boundary exclusions external_context',
  CAP: 'purpose outcomes business_objects',
  ACT: 'kind group goals responsibilities business_permissions access',
  UC: 'goal trigger preconditions postconditions main_flow alternatives exceptions access',
  BPR: 'purpose trigger outcomes steps transitions initial terminals',
};
export const DISCOVERY_TYPES = [...Object.keys(DISCOVERY_FIELDS), 'POL'];
export const DISCOVERY_GROUPS = { capabilities: 'CAP', actors: 'ACT', access_policies: 'POL', use_cases: 'UC', processes: 'BPR' };
const arr = x => Array.isArray(x) ? x : [];
const text = x => typeof x === 'string' && x.trim().length > 0;
const known = x => x?.status === 'known' && x.value !== undefined && x.value !== null && (typeof x.value !== 'string' || text(x.value)) && (typeof x.value !== 'object' || Object.keys(x.value).length > 0);
const na = x => x?.status === 'not_applicable' && text(x.reason);
export const discoveryIds = chg => {
  const d = chg?.definition?.scope?.discovery ?? {};
  return [...new Set([d.overview, ...Object.keys(DISCOVERY_GROUPS).flatMap(k => d[k]?.status === 'known' ? arr(d[k].value) : [])].filter(x => typeof x === 'string'))];
};
export function businessEdges(r) {
  if (r.type !== 'BPR') return accessEdges(r);
  return arr(r.definition.steps).filter(s => s && typeof s === 'object').flatMap(s => [
    ...(s.actor ? [{ type: 'performed_by', target: s.actor }] : []),
    ...(s.use_case ? [{ type: 'realizes', target: s.use_case, ...(s.use_case_step ? { selector: s.use_case_step } : {}) }] : []),
    ...(s.subprocess ? [{ type: 'depends_on', target: s.subprocess }] : []),
  ]);
}
export const businessKeys = r => (r?.type === 'ACT' ? arr(r.definition.goals).map(x => x?.key) : r?.type === 'BPR' ? arr(r.definition.steps).map(x => x?.key) : r?.type === 'UC' ? ['main_flow', 'alternatives', 'exceptions'].flatMap(k => arr(r.definition[k]?.value).map(s => s?.key)) : accessKeys(r)).filter(text);

export function businessErrors(r, map) {
  const errors = [], d = r.definition, fail = (code, reason) => errors.push({ code, subject: r.id, reason });
  if (!DISCOVERY_TYPES.includes(r.type)) return errors;
  if (r.type === 'POL') return accessPolicyErrors(r);
  errors.push(...accessBindingErrors(r, map));
  const collections = r.type === 'ACT' ? [d.goals] : r.type === 'UC' ? ['main_flow', 'alternatives', 'exceptions'].map(k => d[k]?.value) : r.type === 'BPR' ? [d.steps, d.transitions] : [];
  if (collections.some(xs => Array.isArray(xs) && xs.some(x => !x || typeof x !== 'object' || Array.isArray(x)))) { fail('discovery_shape', '목표·단계·전이는 구조화된 객체여야 합니다.'); return errors; }
  if (r.lifecycle === 'retired') fail('discovery_retired', '폐기된 업무 정의는 현재 분석 근거가 아닙니다.');
  if (r.type === 'SYS' && r.owner.kind !== 'project') fail('system_owner', '시스템 개요는 공통 소유로 관리하고 모듈에서 참조하세요.');
  const raw = { ACT: ['kind', 'goals'], BPR: ['steps', 'transitions', 'initial', 'terminals'] }[r.type] ?? [];
  const optional = { SYS: ['exclusions', 'external_context'], CAP: ['business_objects'], ACT: ['business_permissions', 'access'], UC: ['alternatives', 'exceptions', 'access'], BPR: [] }[r.type];
  for (const field of DISCOVERY_FIELDS[r.type].split(' ').filter(f => !raw.includes(f))) if (!(known(d[field]) || optional.includes(field) && na(d[field]))) fail('discovery_detail', `${field}: 확인된 내용 또는 허용된 비적용 사유가 필요합니다.`);
  if (r.type === 'ACT') {
    if (!['human', 'external_system', 'automation'].includes(d.kind)) fail('actor_kind', 'human/external_system/automation 업무 주체를 구별하세요.');
    if (!arr(d.goals).length || d.goals.some(g => !text(g.key) || !text(g.goal)) || new Set(d.goals.map(g => g.key)).size !== d.goals.length) fail('actor_goals', '역할 목표에는 고유 key와 goal이 필요합니다.');
  }
  if (r.type === 'CAP' && !r.relations.some(e => e.type === 'part_of' && map.get(e.target)?.type === 'SYS')) fail('capability_context', '핵심 업무를 SYS에 part_of로 연결하세요.');
  if (r.type === 'UC') {
    for (const field of ['main_flow', 'alternatives', 'exceptions']) {
      const steps = arr(d[field]?.value);
      if (d[field]?.status === 'known' && (!steps.length || steps.some(s => !text(s.key) || !text(s.action) || !text(s.outcome)))) fail('use_case_flow', `${field}: key/action/outcome이 필요합니다.`);
    }
    const keys = businessKeys(r);
    if (new Set(keys).size !== keys.length) fail('use_case_step_duplicate', 'UC 전체 흐름의 key는 고유해야 합니다.');
    if (!r.relations.some(e => e.type === 'realizes' && map.get(e.target)?.type === 'CAP')) fail('use_case_capability', 'UC를 핵심 업무 CAP에 realizes로 연결하세요.');
    if (!r.relations.some(e => e.type === 'performed_by' && map.get(e.target)?.type === 'ACT' && businessKeys(map.get(e.target)).includes(e.selector))) fail('use_case_actor', 'UC를 ACT의 목표 key에 performed_by로 연결하세요.');
    for (const e of r.relations) if (e.type === 'performed_by' && (map.get(e.target)?.type !== 'ACT' || !businessKeys(map.get(e.target)).includes(e.selector)) || e.type === 'realizes' && map.get(e.target)?.type !== 'CAP') fail('use_case_relation_type', `${e.type}: ${e.target} 관계의 유형/목표를 확인하세요.`);
  }
  if (r.type === 'BPR') {
    const steps = arr(d.steps), keys = new Set(steps.map(s => s.key)), transitions = arr(d.transitions), terminals = arr(d.terminals);
    if (!Array.isArray(d.transitions)) fail('process_transitions_missing', '전이가 없으면 빈 transitions 배열로 명시하세요.');
    if (!steps.length || steps.some(s => !text(s.key)) || keys.size !== steps.length) fail('process_steps', '고유한 단계 key가 필요합니다.');
    if (!keys.has(d.initial) || !terminals.length || terminals.some(k => !keys.has(k))) fail('process_endpoints', '존재하는 시작·종료 단계가 필요합니다.');
    for (const s of steps) {
      if (!text(s.title) || !text(s.outcome) || !['system', 'manual', 'external', 'subprocess'].includes(s.kind) || !(known(s.data_state) || na(s.data_state))) fail('process_step_detail', `${s.key}: 제목·종류·결과·데이터/상태 변화를 확인하세요.`);
      if (map.get(s.actor)?.type !== 'ACT') fail('process_actor', `${s.key}: 업무 주체 ACT가 필요합니다.`);
      if (s.kind === 'system' && (map.get(s.use_case)?.type !== 'UC' || !businessKeys(map.get(s.use_case)).includes(s.use_case_step))) fail('process_use_case', `${s.key}: UC와 해당 흐름 key가 필요합니다.`);
      if (s.kind === 'system' && map.get(s.use_case)?.definition.access?.status !== 'known') fail('process_access', `${s.key}: 시스템 처리 UC에는 접근 정책 연결이 필요합니다.`);
      if (s.use_case && (map.get(s.use_case)?.type !== 'UC' || !businessKeys(map.get(s.use_case)).includes(s.use_case_step))) fail('process_use_case', `${s.key}: 참조한 UC/흐름을 찾을 수 없습니다.`);
      if (s.kind === 'subprocess' && (map.get(s.subprocess)?.type !== 'BPR' || s.subprocess === r.id)) fail('process_subprocess', `${s.key}: 별도 BPR 정본을 참조하세요.`);
    }
    for (const edge of transitions) if (!keys.has(edge.from) || !keys.has(edge.to) || !text(edge.condition) || !['normal', 'alternative', 'exception', 'parallel'].includes(edge.kind)) fail('process_transition', '전이에는 존재하는 from/to, 조건과 normal/alternative/exception/parallel 종류가 필요합니다.');
    // Loops are legitimate; require all nodes reachable and an exit path, not a DAG.
    const reach = (starts, reverse) => { const seen = new Set(starts), queue = [...starts]; while (queue.length) { const k = queue.shift(); for (const e of transitions) if ((reverse ? e.to : e.from) === k) { const next = reverse ? e.from : e.to; if (!seen.has(next)) { seen.add(next); queue.push(next); } } } return seen; };
    const reachable = reach([d.initial], false), exiting = reach(terminals, true);
    for (const s of steps) if (!reachable.has(s.key) || !exiting.has(s.key)) fail('process_disconnected', `${s.key}: 시작에서 도달하고 종료로 이어지는 흐름이 필요합니다.`);
    for (const k of terminals) if (transitions.some(e => e.from === k)) fail('process_terminal_outgoing', `${k}: 종료 단계에 후속 전이가 있습니다.`);
    const visit = (id, path) => { if (path.has(id)) return true; const next = new Set([...path, id]); return arr(map.get(id)?.definition.steps).some(s => s?.subprocess && visit(s.subprocess, next)); };
    if (visit(r.id, new Set())) fail('process_recursive_subprocess', '하위 프로세스가 서로를 무한 포함합니다. 반복은 단계 전이로 표현하세요.');
  }
  return errors;
}

export function checkDiscovery(records, chg, { add, checkReview, trace = false }) {
  const map = new Map(records.map(r => [r.id, r])), scope = chg?.definition?.scope ?? {}, d = scope.discovery ?? {}, ids = discoveryIds(chg), selected = ids.map(id => map.get(id)).filter(Boolean);
  if (map.get(d.overview)?.type !== 'SYS') add('system_overview_missing', chg.id, 'scope.discovery.overview에 SYS 정본을 연결하세요.');
  for (const [key, type] of Object.entries(DISCOVERY_GROUPS)) {
    const value = d[key];
    if (!(na(value) || known(value) && Array.isArray(value.value) && value.value.every(id => map.get(id)?.type === type))) add('discovery_inventory', chg.id, `${key}: 명시적 ${type} 목록 또는 비적용 사유가 필요합니다.`);
  }
  const dispositions = arr(d.dispositions), disposed = (id, selector) => dispositions.some(x => x.id === id && x.selector === selector && ['excluded', 'deferred'].includes(x.disposition) && text(x.reason));
  for (const x of dispositions) if (!ids.includes(x.id) || !['excluded', 'deferred'].includes(x.disposition) || !text(x.reason) || x.selector && !businessKeys(map.get(x.id)).includes(x.selector)) add('discovery_disposition', chg.id, '제외·보류 대상과 사유/단계 key를 확인하세요.');
  const ucs = selected.filter(r => r.type === 'UC'), processes = selected.filter(r => r.type === 'BPR');
  for (const r of selected) {
    for (const error of businessErrors(r, map)) add(error.code, error.subject, error.reason);
    checkReview(['SYS', 'CAP', 'ACT', 'POL'].includes(r.type) ? 'intent' : 'business_flow', [r.id], { user: true });
    for (const e of [...r.relations.filter(e => !['context', 'supersedes'].includes(e.type)), ...businessEdges(r)]) {
      const target = map.get(e.target);
      if (!target || (DISCOVERY_TYPES.includes(target.type) && target.type !== 'POL' || isAccessPolicy(target)) && !ids.includes(e.target)) add('discovery_scope_dependency', r.id, `${e.target}: 선행 업무 정의를 이번 분석 범위에 명시하세요.`);
      if (e.selector && !businessKeys(target).includes(e.selector)) add('discovery_selector', r.id, `${e.target}#${e.selector}`);
    }
    if (r.type === 'CAP' && !disposed(r.id) && !ucs.some(uc => uc.relations.some(e => e.type === 'realizes' && e.target === r.id))) add('capability_coverage', r.id, '핵심 업무의 유즈케이스 또는 명시적 제외/보류가 필요합니다.');
    if (r.type === 'ACT') for (const key of businessKeys(r)) if (!disposed(r.id, key) && !ucs.some(uc => uc.relations.some(e => e.type === 'performed_by' && e.target === r.id && e.selector === key))) add('actor_goal_coverage', r.id, key);
    if (r.type === 'UC' && !disposed(r.id) && !processes.some(p => arr(p.definition.steps).some(s => s?.use_case === r.id))) add('use_case_process_coverage', r.id, '유즈케이스가 전체 업무 흐름에서 수행되는 위치를 연결하세요.');
  }
  // Validate types and selectors even for direct evaluator callers that bypass validate.
  for (const reqId of trace ? scope.requirements ?? [] : []) {
    const req = map.get(reqId); if (!req) continue;
    const sources = req.relations.filter(e => e.type === 'derived_from');
    if (!sources.length) add('requirement_origin', reqId, 'UC/프로세스 단계 또는 SYS·정책·외부 계약 등 발굴 근거를 derived_from으로 연결하세요.');
    for (const e of sources) {
      const target = map.get(e.target), business = ['UC', 'BPR'].includes(target?.type) || isAccessPolicy(target);
      if (!target || !['SYS', 'CAP', 'ACT', 'UC', 'BPR', 'POL', 'IFC', 'STD', 'ADR', 'OUT'].includes(target.type) || target.lifecycle === 'retired' || !(ids.includes(e.target) || (scope.governing ?? []).includes(e.target)) || business && !businessKeys(target).includes(e.selector)) add('requirement_origin_invalid', reqId, `${e.target}: 현재 분석/공통 근거와 유효한 단계 selector를 지정하세요.`);
    }
  }
  checkAccessCoverage(selected, (scope.requirements ?? []).map(id => map.get(id)).filter(Boolean), { add, trace });
  if (!trace) return;
  const reqs = (scope.requirements ?? []).map(id => map.get(id)).filter(Boolean);
  const traced = (id, selector) => reqs.some(req => req.relations.some(e => e.type === 'derived_from' && e.target === id && e.selector === selector));
  for (const uc of ucs) for (const key of businessKeys(uc)) if (!disposed(uc.id) && !disposed(uc.id, key) && !traced(uc.id, key) && !processes.some(p => arr(p.definition.steps).some(s => s?.use_case === uc.id && s.use_case_step === key && traced(p.id, s.key)))) add('use_case_requirement_coverage', uc.id, `${key}: 정상·대안·예외 흐름을 요구에 연결하거나 이유를 남기세요.`);
  for (const p of processes) for (const s of arr(p.definition.steps).filter(s => s?.kind === 'system')) if (!disposed(p.id) && !disposed(p.id, s.key) && !traced(p.id, s.key) && !traced(s.use_case, s.use_case_step)) add('process_requirement_coverage', p.id, `${s.key}: 시스템 처리 단계의 요구가 누락되었습니다.`);
}
