// Product access analysis only. This does not authenticate AIDD users or implement product security.
const arr = x => Array.isArray(x) ? x : [];
const text = x => typeof x === 'string' && x.trim().length > 0;
const object = x => x && typeof x === 'object' && !Array.isArray(x);
const knownText = x => x?.status === 'known' && text(x.value);
const na = x => x?.status === 'not_applicable' && text(x.reason);
const detail = x => knownText(x) || na(x);
export const isAccessPolicy = r => r?.type === 'POL' && r.definition?.kind === 'system_access';
export const accessBindings = r => ['ACT', 'UC'].includes(r?.type) && r.definition?.access?.status === 'known' ? arr(r.definition.access.value) : [];
export const accessKeys = r => isAccessPolicy(r) ? arr(r.definition.rules).map(rule => rule?.key).filter(text) : [];
export const accessEdges = r => accessBindings(r).filter(b => object(b) && text(b.policy)).map(b => ({ type: 'depends_on', target: b.policy, ...(text(b.rule) ? { selector: b.rule } : {}) }));

export function accessPolicyErrors(r) {
  const errors = [], fail = reason => errors.push({ code: 'access_policy_detail', subject: r.id, reason }), d = r.definition;
  if (!isAccessPolicy(r)) { fail('접속 정책은 POL.kind=system_access여야 합니다.'); return errors; }
  if (r.lifecycle === 'retired') fail('폐기된 접속 정책입니다.');
  const fields = 'kind channel entry authentication authorization rules'.split(' ');
  for (const k of Object.keys(d)) if (!fields.includes(k)) fail(`지원하지 않는 접속 정책 필드: ${k}`);
  if (!['web', 'api', 'batch', 'other'].includes(d.channel) || !knownText(d.entry)) fail('channel과 확인된 접속 경로 entry가 필요합니다.');
  const auth = d.authentication?.status === 'known' && object(d.authentication.value) ? d.authentication.value : {};
  if (!['public', 'required', 'mixed'].includes(auth.mode)) fail('인증 모드는 public/required/mixed로 확인하세요.');
  for (const key of ['method', 'login_entry', 'session_end']) {
    if (!(auth.mode === 'public' ? detail(auth[key]) : knownText(auth[key]))) fail(`authentication.${key}: 인증 방식·진입·종료 동작을 확인하세요.`);
  }
  const authorization = d.authorization?.status === 'known' && object(d.authorization.value) ? d.authorization.value : {};
  for (const key of ['basis', 'check', 'enforcement', 'permission_lifecycle']) if (!detail(authorization[key])) fail(`authorization.${key}: 권한 기준·확인·강제·부여/변경/회수 방식을 확인하세요.`);
  const rules = arr(d.rules), keys = rules.map(rule => rule?.key);
  if (!rules.length || keys.some(k => !text(k)) || new Set(keys).size !== keys.length) fail('고유 key를 가진 접근 규칙이 필요합니다.');
  for (const rule of rules) {
    if (!object(rule)) { fail('접근 규칙은 객체여야 합니다.'); continue; }
    if (!['public', 'required'].includes(rule.authentication)) fail(`${rule.key}: 인증 필요 여부가 미정입니다.`);
    if (['public', 'required'].includes(auth.mode) && rule.authentication !== auth.mode) fail(`${rule.key}: 시스템 인증 모드와 규칙이 모순됩니다.`);
    for (const key of ['initial', 'after_auth', 'permissions', 'data_scope', 'unauthenticated', 'denied']) if (!detail(rule[key])) fail(`${rule.key}.${key}: 확인된 내용 또는 비적용 사유가 필요합니다.`);
    if (d.channel === 'web' && !knownText(rule.initial)) fail(`${rule.key}: 웹 최초 화면의 이름·목적이 필요합니다.`);
    if (rule.authentication === 'required' && (!knownText(rule.after_auth) || !knownText(rule.unauthenticated))) fail(`${rule.key}: 인증 후 목적지와 미인증 접근 결과가 필요합니다.`);
    if (knownText(rule.permissions)) {
      if (!knownText(rule.denied)) fail(`${rule.key}: 권한 부족 시 결과가 필요합니다.`);
      for (const key of ['basis', 'check', 'enforcement', 'permission_lifecycle']) if (!knownText(authorization[key])) fail(`${rule.key}: 권한 제한이 있으므로 authorization.${key}는 비적용일 수 없습니다.`);
    }
  }
  if (auth.mode === 'mixed' && !['public', 'required'].every(mode => rules.some(rule => rule?.authentication === mode))) fail('혼합형에는 공개 규칙과 인증 필요 규칙이 모두 필요합니다.');
  return errors;
}

export function accessBindingErrors(r, map) {
  if (!['ACT', 'UC'].includes(r.type)) return [];
  const errors = [], fail = reason => errors.push({ code: 'access_binding', subject: r.id, reason });
  if (na(r.definition.access)) return errors;
  const bindings = accessBindings(r), keys = bindings.map(b => `${b?.policy}#${b?.rule}`);
  if (!bindings.length || new Set(keys).size !== keys.length) fail('access에 정책/규칙 목록 또는 구체적인 비접속 사유를 기록하세요.');
  for (const b of bindings) {
    const policy = map.get(b?.policy);
    if (!object(b) || !isAccessPolicy(policy) || policy.lifecycle === 'retired' || !accessKeys(policy).includes(b.rule)) fail('현재 POL 접속 정책과 유효한 rule key를 참조하세요.');
  }
  if (r.type === 'UC') for (const edge of r.relations.filter(e => e.type === 'performed_by')) {
    const actorBindings = accessBindings(map.get(edge.target));
    if (!bindings.some(b => actorBindings.some(a => a?.policy === b?.policy && a?.rule === b?.rule))) fail(`${edge.target}: 유즈케이스에 적용할 역할 접근 규칙이 없습니다.`);
  }
  if (r.type === 'UC') for (const b of bindings) if (!r.relations.filter(e => e.type === 'performed_by').some(e => accessBindings(map.get(e.target)).some(a => a?.policy === b?.policy && a?.rule === b?.rule))) fail('유즈케이스의 접근 규칙이 수행 역할에 연결되지 않았습니다.');
  return errors;
}

export function checkAccessCoverage(selected, requirements, { add, trace }) {
  const policies = selected.filter(isAccessPolicy), bound = selected.flatMap(accessBindings);
  for (const policy of policies) {
    if (!bound.some(b => b?.policy === policy.id)) add('access_role_coverage', policy.id, '현재 분석 범위의 역할/UC에 정책을 연결하세요.');
    for (const rule of arr(policy.definition.rules)) {
      if (!text(rule?.key)) continue;
      // Shared policies can contain other modules' rules; only used rules need requirements in this cycle.
      if (!bound.some(b => b?.policy === policy.id && b?.rule === rule.key)) continue;
      if (trace && !requirements.some(req => req.relations.some(e => e.type === 'derived_from' && e.target === policy.id && e.selector === rule.key))) add('access_requirement_coverage', policy.id, `${rule.key}: 접속·인증·접근 동작을 REQ/NFR에 연결하세요.`);
    }
  }
}
