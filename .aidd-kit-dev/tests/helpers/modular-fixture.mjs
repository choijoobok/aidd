import { record, definitionHash, contentHash } from '../../../.ai/tools/lib/record-contracts.mjs';
import { REQUIREMENT_FIELDS, FEATURE_FIELDS, SCREEN_FIELDS, reviewInput, prototypeInput } from '../../../.ai/tools/lib/readiness.mjs';
import { renderPrototype } from '../../../.ai/tools/lib/prototype-renderer.mjs';
import { discoveryIds } from '../../../.ai/tools/lib/business-discovery.mjs';

export const known = value => ({ status: 'known', value });
export const na = reason => ({ status: 'not_applicable', reason });
export function businessFixture() {
  const records = [
    record('SYS', 'SYS-ORDERS', null, '주문 업무 시스템', { problem: known('취소와 환불의 불일치'), purpose: known('일관된 주문 관리'), outcomes: known(['중복 환불 0건']), boundary: known('고객 주문과 결제 연동'), exclusions: known(['배송 실행']), external_context: known(['결제사']) }),
    record('CAP', 'CAP-ORDERS', 'MOD-A', '주문 취소 관리', { purpose: known('취소와 환불 지원'), outcomes: known('일관된 취소 결과'), business_objects: known(['주문', '환불']) }, [{ type: 'part_of', target: 'SYS-ORDERS' }]),
    record('ACT', 'ACT-CUSTOMER', null, '구매 고객', { kind: 'human', group: known('주문한 고객'), goals: [{ key: 'cancel', goal: '구매 취소와 환불 받기' }], responsibilities: known('본인 주문 확인'), business_permissions: known('본인 주문 취소') }),
    record('UC', 'UC-CANCEL', 'MOD-A', '주문 취소', { goal: known('주문 취소와 환불 완료'), trigger: known('고객 취소 요청'), preconditions: known('결제된 주문'), postconditions: known('한 번만 환불됨'), main_flow: known([{ key: 'cancel', action: '취소를 요청한다', outcome: '취소 결과를 받는다' }]), alternatives: na('이 fixture는 최소 정상 경로만 사용'), exceptions: na('실패 조건은 요구 AC에서 별도 시험') }, [{ type: 'realizes', target: 'CAP-ORDERS' }, { type: 'performed_by', target: 'ACT-CUSTOMER', selector: 'cancel' }]),
    record('BPR', 'BPR-CANCEL', 'MOD-A', '취소 업무 흐름', { purpose: known('고객 취소 처리'), trigger: known('취소 요청'), outcomes: known('취소 완료'), initial: 'cancel', terminals: ['cancel'], steps: [{ key: 'cancel', title: '주문 취소', kind: 'system', actor: 'ACT-CUSTOMER', use_case: 'UC-CANCEL', use_case_step: 'cancel', outcome: '환불 확인', data_state: known('주문: 결제 → 취소') }], transitions: [] }),
  ];
  records.push(record('POL', 'POL-CUSTOMER-ACCESS', null, '고객 접속 정책', {
    kind: 'system_access', channel: 'web', entry: known('/orders — 주문 서비스 접속'),
    authentication: known({ mode: 'required', method: known('고객 계정으로 사용자 확인'), login_entry: known('로그인 화면'), session_end: known('로그아웃·인증 만료 시 로그인 화면, 재인증 후 이전 주문으로 복귀') }),
    authorization: known({ basis: known('고객 역할과 주문 소유자'), check: known('요청한 고객과 주문 소유자 일치 확인'), enforcement: known('화면 진입·기능 요청·직접 주소/API 호출에 같은 조건 적용'), permission_lifecycle: known('계정 활성화로 부여, 정지·회수 후 후속 요청 거부') }),
    rules: [{ key: 'customer', authentication: 'required', initial: known('로그인 화면 — 고객 확인'), after_auth: known('주문 메인 화면 또는 요청한 주문'), permissions: known('본인 주문 조회·취소'), data_scope: known('본인 소유 주문만'), unauthenticated: known('로그인 후 원래 요청으로 복귀'), denied: known('타인 주문 접근 거부, 메뉴 숨김만으로 허용하지 않음') }],
  }));
  for (const r of records.filter(r => ['ACT', 'UC'].includes(r.type))) r.definition.access = known([{ policy: 'POL-CUSTOMER-ACCESS', rule: 'customer' }]);
  return records;
}
export function approveBusiness(records) {
  for (const r of records.filter(r => ['SYS', 'CAP', 'ACT', 'UC', 'BPR'].includes(r.type) || r.type === 'POL' && r.definition.kind === 'system_access')) approval(records, ['SYS', 'CAP', 'ACT', 'POL'].includes(r.type) ? 'intent' : 'business_flow', [r.id], `BUSINESS-${r.id}`);
}
export function approval(records, kind, ids, name, user = true) {
  const subjects = ids.map(id => ({ id, definition_hash: definitionHash(records.find(r => r.id === id)) }));
  const rvw = record('RVW', `RVW-${name}`, records.find(r => r.id === ids[0]).owner.id, name, { kind, subjects, sequence: 1, input_digest: kind === 'prototype' ? prototypeInput(records, ids[0]) : reviewInput(records, ids, kind), coverage: ['individual', 'related_rules', 'end_to_end'], findings: [], unresolved_refs: [], method: 'fixture review of normal, cancellation and boundary behavior', reviewer: user ? 'fixture customer' : 'fixture AI', occurred_at: '2026-09-22T12:00:00Z', decision_source: { kind: user ? 'user' : 'analysis', reference: 'explicit fixture decision, not a real customer approval' }, per_subject_results: Object.fromEntries(ids.map(id => [id, 'accepted'])) });
  records.push(rvw); return rvw;
}
export function requirementFixture() {
  const records = [record('MOD', 'MOD-A', 'MOD-A', 'Orders'), record('MOD', 'MOD-B', 'MOD-B', 'Future module'), ...businessFixture()];
  const d = Object.fromEntries(REQUIREMENT_FIELDS.map(field => [field, known(`${field}: order cancellation`)]));
  d.acceptance_criteria = [{ key: 'AC-1', given: 'paid order', when: 'cancel', then: 'refund once', forbidden: 'double refund', verification_method: 'integration' }];
  d.applicability = { normal: known('refund'), negative: known('duplicate'), boundary: known('already shipped') };
  const req = record('REQ', 'REQ-CANCEL', 'MOD-A', 'Cancel order', d, [{ type: 'derived_from', target: 'BPR-CANCEL', selector: 'cancel' }]);
  req.relations.push({ type: 'derived_from', target: 'POL-CUSTOMER-ACCESS', selector: 'customer' });
  const feat = record('FEAT', 'FEAT-CANCEL', 'MOD-A', 'Cancellation', { purpose: known('Cancel an order'), analysis: { behavior: 'Refund exactly once' } }, [{ type: 'satisfies', target: req.id }]);
  const chg = record('CHG', 'CHG-A', 'MOD-A', 'Cancellation change', { purpose: 'support cancellation', modules: ['MOD-A'], scope: { requirements: [req.id], candidates: [feat.id], governing: [], excluded: [], deferred: [], inventory: { features: known([feat.id]), screens: na('API-only'), data: na('existing order contract'), navigation: na('API-only'), interfaces: na('existing API route') } }, requirements_baseline: 'BSL-A' });
  const baseline = record('BSL', 'BSL-A', 'MOD-A', 'Requirement baseline', { kind: 'requirements', scope_ref: chg.id, members: [req, feat].map(r => ({ id: r.id, projection: r.type === 'FEAT' ? 'analysis' : 'definition', content_hash: contentHash(r, r.type === 'FEAT' ? 'analysis' : 'definition'), blob_hash: 'a'.repeat(64) })) });
  records.push(req, feat, chg, baseline);
  chg.definition.scope.discovery = { overview: 'SYS-ORDERS', capabilities: known(['CAP-ORDERS']), actors: known(['ACT-CUSTOMER']), use_cases: known(['UC-CANCEL']), processes: known(['BPR-CANCEL']), dispositions: [] };
  chg.definition.scope.discovery.access_policies = known(['POL-CUSTOMER-ACCESS']);
  baseline.definition.members.push(...discoveryIds(chg).map(id => { const r = records.find(r => r.id === id); return { id, projection: 'definition', content_hash: contentHash(r), blob_hash: 'a'.repeat(64) }; }));
  approveBusiness(records);
  approval(records, 'scope', [chg.id], 'SCOPE'); approval(records, 'requirement', [req.id], 'REQ'); approval(records, 'consistency', [chg.id, req.id], 'CONSISTENCY', false);
  return records;
}

export function developmentFixture({ ui = true } = {}) {
  const records = requirementFixture().filter(r => r.type !== 'RVW'), feature = records.find(r => r.type === 'FEAT'), chg = records.find(r => r.type === 'CHG');
  chg.definition.gate_applicability = { deployment:na('isolated behavior fixture, no deployment change'), technology:na('isolated behavior fixture, no technology choice') };
  for (const field of FEATURE_FIELDS) feature.definition[field] ??= known(field === 'main_flow' ? ['load order', 'cancel', 'refund once'] : `${field}: cancellation contract`);
  feature.definition.acceptance_mapping = known([{ requirement: 'REQ-CANCEL', criterion: 'AC-1' }]);
  const work = record('WRK', 'WRK-A', 'MOD-A', 'Cancellation implementation', { change: 'CHG-A', work_kind: 'product_feature', features: [feature.id], screens: ui ? ['SCR-CANCEL'] : [], ui_applicability: ui ? known('screen') : na('API-only contract'), foundation_applicability: na('isolated fixture, no shared product foundation'), completion_criteria: ['AC-1 passes'] }, [{ type: 'implements', target: feature.id }]);
  records.push(work, record('TC', 'TC-CANCEL', 'MOD-A', 'Refund once', { steps: ['cancel twice'], inputs: ['paid order'], expected: 'one refund', forbidden: 'two refunds', method: 'integration' }, [{ type: 'verifies', target: 'REQ-CANCEL', selector: 'AC-1' }]));
  if (ui) {
    const def = Object.fromEntries(SCREEN_FIELDS.map(f => [f, known(`${f}: cancellation`)]));
    Object.assign(def, { purpose: known('주문 취소 및 환불'), fields: known([{ key: 'order', label: '주문 번호', type: 'text', required: true, example: 'ORDER-100' }, { key: 'reason', label: '취소 사유', type: 'select', options: ['단순 변심', '중복 주문'] }]), actions: known([{ key: 'cancel', label: '주문 취소' }, { key: 'confirm', label: '환불 확정' }, { key: 'back', label: '돌아가기' }]), view_states: known([{ key: 'ready', title: '주문 조회', message: '주문 번호를 확인하세요.' }, { key: 'confirm', title: '취소 확인', message: '환불을 진행할까요?' }, { key: 'done', title: '환불 완료', message: '한 번만 환불 처리되었습니다.' }]), transitions: known([{ from: 'ready', action: 'cancel', to: 'confirm', validate: true }, { from: 'confirm', action: 'confirm', to: 'done' }, { from: 'confirm', action: 'back', to: 'ready' }]), prototype_scenarios: known([{ key: 'refund', title: '주문 취소와 환불', initial: 'ready', steps: [{ action: 'cancel' }, { action: 'confirm' }], expected: 'done' }, { key: 'return', title: '취소 철회', initial: 'ready', steps: [{ action: 'cancel' }, { action: 'back' }], expected: 'ready' }]) });
    const screen = record('SCR', 'SCR-CANCEL', 'MOD-A', '주문 취소', def, [{ type: 'presents', target: feature.id }]); records.push(screen); chg.definition.scope.candidates.push(screen.id); chg.definition.scope.inventory.screens = known([screen.id]);
  }
  const b = records.find(r => r.type === 'BSL');
  b.definition.members = [...discoveryIds(chg), ...chg.definition.scope.requirements, ...chg.definition.scope.candidates].map(id => { const r = records.find(r => r.id === id), projection = ['FEAT', 'SCR'].includes(r.type) ? 'analysis' : 'definition'; return { id, projection, content_hash: contentHash(r, projection), blob_hash: 'a'.repeat(64) }; });
  approveBusiness(records);
  approval(records, 'scope', ['CHG-A'], 'SCOPE'); approval(records, 'requirement', ['REQ-CANCEL'], 'REQ'); approval(records, 'consistency', ['CHG-A', 'REQ-CANCEL'], 'CONSISTENCY', false);
  approval(records, 'design', [feature.id], 'FEATURE-DESIGN');
  if (ui) {
    approval(records, 'design', ['SCR-CANCEL'], 'SCREEN-DESIGN');
    const review = approval(records, 'prototype', ['SCR-CANCEL'], 'PROTOTYPE');
    review.definition.artifact = { output_hash: renderPrototype(records.find(r => r.id === 'SCR-CANCEL'), prototypeInput(records, 'SCR-CANCEL')).output_hash, states: ['ready', 'confirm', 'done'], viewports: ['desktop', 'mobile'] };
  }
  return records;
}
