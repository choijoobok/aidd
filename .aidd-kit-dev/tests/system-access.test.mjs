import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requirementFixture, developmentFixture, known, na } from './helpers/modular-fixture.mjs';
import { record, recordPath, definitionHash, contentHash } from '../../.ai/tools/lib/record-contracts.mjs';
import { evaluate, reviewInput, reviewValidity } from '../../.ai/tools/lib/readiness.mjs';
import { businessErrors } from '../../.ai/tools/lib/business-discovery.mjs';
import { impactGraph } from '../../.ai/tools/lib/dependency-graph.mjs';
import { bootstrapV2, runOwned } from '../../.ai/tools/lib/owned-cli.mjs';
import { RecordStore } from '../../.ai/tools/lib/record-store.mjs';
import { transact, putRecord } from '../../.ai/tools/lib/record-transaction.mjs';
import { baselineCreate, readContext } from '../../.ai/tools/lib/lifecycle-operations.mjs';
import { generateDocuments, checkDocuments, buildDelivery } from '../../.ai/tools/lib/document-renderer.mjs';

const policy = records => records.find(r => r.id === 'POL-CUSTOMER-ACCESS');
const codes = (records, stage = 'discovery') => evaluate(records, 'CHG-A', stage).blockers.map(b => b.code);
// These renewals are synthetic test decisions, never real product/user approvals.
function renew(records) {
  for (const r of records.filter(r => r.type === 'BSL')) for (const m of r.definition.members) m.content_hash = contentHash(records.find(x => x.id === m.id), m.projection);
  for (const r of records.filter(r => r.type === 'RVW')) {
    for (const s of r.definition.subjects) s.definition_hash = definitionHash(records.find(x => x.id === s.id));
    r.definition.input_digest = reviewInput(records, r.definition.subjects.map(s => s.id), r.definition.kind);
  }
  return records;
}
function publicRule(key = 'guest') {
  return { key, authentication: 'public', initial: known('공개 메인 화면'), after_auth: na('로그인 없음'), permissions: na('모든 방문자에게 같은 공개 조회 제공'), data_scope: known('공개 상품 정보만'), unauthenticated: na('인증 불필요'), denied: na('별도 역할 제한 없음') };
}
function seed(t, records = requirementFixture()) {
  const root = mkdtempSync(join(tmpdir(), 'aidd-access-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  bootstrapV2(root, { 'project-id': 'PRJ-ACCESS', name: '접속 정책 시험' });
  const store = new RecordStore(join(root, 'project'));
  transact(store, { operation: 'seed', updates: records.map(r => ({ path: recordPath(r), record: r, expected: null })) });
  return { root, store };
}

test('legacy generic permission text cannot pass without explicit access decisions', () => {
  const records = developmentFixture();
  assert.equal(evaluate(records, 'WRK-A', 'development').readiness, 'ready');
  for (const r of records.filter(r => ['ACT', 'UC'].includes(r.type))) delete r.definition.access;
  delete records.find(r => r.type === 'CHG').definition.scope.discovery.access_policies;
  for (const [id, stage] of [['CHG-A', 'discovery'], ['CHG-A', 'requirements'], ['WRK-A', 'development']]) {
    const out = evaluate(records, id, stage); assert.equal(out.readiness, 'blocked');
    assert(out.blockers.some(b => b.code === 'access_binding')); assert(out.blockers.some(b => b.code === 'discovery_inventory'));
  }
});

test('public service without any login is valid with explicit non-applicability', () => {
  const records = requirementFixture(), d = policy(records).definition;
  d.authentication = known({ mode: 'public', method: na('로그인 없음'), login_entry: na('로그인 없음'), session_end: na('인증 세션 없음') });
  d.authorization = known(Object.fromEntries(['basis', 'check', 'enforcement', 'permission_lifecycle'].map(k => [k, na('공개 정보 조회만 제공')])));
  d.rules = [publicRule('customer')];
  assert.equal(evaluate(renew(records), 'CHG-A').readiness, 'ready');
  d.authentication.value.method = { status: 'unknown' }; assert(codes(records).includes('access_policy_detail'));
});

test('mixed public home and authenticated functions share policy but retain distinct role rules', () => {
  const records = requirementFixture(), d = policy(records).definition;
  d.authentication.value.mode = 'mixed'; d.rules.push(publicRule());
  records.find(r => r.type === 'ACT').definition.access.value.push({ policy: policy(records).id, rule: 'guest' });
  records.find(r => r.type === 'REQ').relations.push({ type: 'derived_from', target: policy(records).id, selector: 'guest' });
  assert.equal(evaluate(renew(records), 'CHG-A').readiness, 'ready');
  d.rules = d.rules.filter(r => r.authentication === 'required'); assert(codes(records).includes('access_policy_detail'));
});

test('backoffice role, permission lifecycle, data scope and refusal are mandatory decisions', () => {
  const records = requirementFixture(), d = policy(records).definition;
  d.authorization.value.basis = known('운영자 역할 + 직접 부여 권한, 명시적 거부 우선');
  d.rules[0].permissions = known('할당된 고객관리 화면의 조회/수정'); d.rules[0].data_scope = known('담당 조직 고객만');
  assert.equal(evaluate(renew(records), 'CHG-A').readiness, 'ready');
  for (const field of ['basis', 'check', 'enforcement', 'permission_lifecycle']) {
    const copy = structuredClone(records); policy(copy).definition.authorization.value[field] = na('나중에 설계');
    assert(codes(copy).includes('access_policy_detail'), field);
  }
  for (const field of ['initial', 'after_auth', 'permissions', 'data_scope', 'unauthenticated', 'denied']) {
    const copy = structuredClone(records); delete policy(copy).definition.rules[0][field];
    assert(codes(copy).includes('access_policy_detail'), field);
  }
});

test('API and batch actors use explicit identity/entry outcomes without invented UI', () => {
  for (const channel of ['api', 'batch']) {
    const records = requirementFixture(), d = policy(records).definition;
    d.channel = channel; d.entry = known(channel === 'api' ? '외부 주문 API' : '예약 실행 진입점');
    d.authentication.value.login_entry = known('호출 자격 확인 입력');
    d.authentication.value.session_end = known('세션 없음, 매 요청 자격 확인 실패 시 요청 거부');
    d.rules[0].initial = na('화면 없는 연동'); d.rules[0].after_auth = known('허용된 요청/작업 실행');
    records.find(r => r.type === 'ACT').definition.kind = channel === 'api' ? 'external_system' : 'automation';
    assert.equal(evaluate(renew(records), 'CHG-A').readiness, 'ready');
  }
});

test('system processing cannot use an unexplained or manual-only access exemption', () => {
  const records = requirementFixture();
  for (const r of records.filter(r => ['ACT', 'UC'].includes(r.type))) r.definition.access = na('시스템에 접속하지 않는 수작업');
  assert(codes(records).includes('process_access'));
  const actor = records.find(r => r.type === 'ACT'); assert.deepEqual(businessErrors(actor, new Map(records.map(r => [r.id, r]))), []);
  actor.definition.access = { status: 'not_applicable' }; assert(codes(records).includes('access_binding'));
});

test('wrong role/rule, retired or unscoped policy and contradictory authentication are blocked', () => {
  const variants = [
    records => { records.find(r => r.type === 'UC').definition.access.value[0].rule = 'missing'; },
    records => { records.find(r => r.type === 'ACT').definition.access = na('시스템 접속 없음'); },
    records => { policy(records).lifecycle = 'retired'; },
    records => { records.find(r => r.type === 'CHG').definition.scope.discovery.access_policies = na('없음'); },
    records => { policy(records).definition.authentication.value.mode = 'public'; },
  ];
  for (const change of variants) { const records = requirementFixture(); change(records); assert(codes(records).some(c => c.startsWith('access_') || c === 'discovery_scope_dependency')); }
});

test('used access rule requires trace to requirements; shared unused rules do not force another module cycle', () => {
  const records = requirementFixture(), req = records.find(r => r.type === 'REQ');
  req.relations = req.relations.filter(r => r.target !== policy(records).id);
  renew(records); assert.equal(evaluate(records, 'CHG-A', 'discovery').readiness, 'ready');
  assert(codes(records, 'requirements').includes('access_requirement_coverage'));
  req.relations.push({ type: 'derived_from', target: policy(records).id, selector: 'customer' });
  policy(records).definition.rules.push({ ...structuredClone(policy(records).definition.rules[0]), key: 'other-module' });
  assert.equal(evaluate(renew(records), 'CHG-A').readiness, 'ready');
  req.relations.at(-1).selector = 'gone'; assert(codes(records, 'requirements').includes('requirement_origin_invalid'));
});

test('policy change invalidates dependent reviews and propagates to work/tests without rewriting history', () => {
  const records = developmentFixture(), history = JSON.stringify(records.filter(r => ['RVW', 'BSL'].includes(r.type)));
  policy(records).definition.authorization.value.check = known('역할과 조직을 매 요청 재확인');
  assert.equal(reviewValidity(records, 'intent', ['ACT-CUSTOMER'], { user: true }), 'stale');
  assert.equal(evaluate(records, 'WRK-A', 'development').readiness, 'blocked');
  const ids = impactGraph(records, policy(records).id).candidates.map(r => r.id);
  for (const id of ['ACT-CUSTOMER', 'UC-CANCEL', 'REQ-CANCEL', 'FEAT-CANCEL', 'SCR-CANCEL', 'TC-CANCEL', 'WRK-A']) assert(ids.includes(id), id);
  assert(!ids.includes('MOD-B')); assert.equal(JSON.stringify(records.filter(r => ['RVW', 'BSL'].includes(r.type))), history);
});

test('malformed access drafts block instead of crashing', () => {
  for (const value of [null, 'text', [], [null], [1], [{}]]) {
    const records = requirementFixture(); policy(records).definition.rules = value;
    assert(codes(records).includes('access_policy_detail'));
    records.find(r => r.type === 'UC').definition.access = known(value);
    assert(codes(records).includes('access_binding'));
  }
});

test('real storage, scoped reads, baseline, briefing and derived documents carry access policy', t => {
  const { root, store } = seed(t);
  const view = readContext(store, 'CHG-A'); assert(view.records.some(r => r.id === 'POL-CUSTOMER-ACCESS'));
  baselineCreate(store, { id: 'BSL-ACCESS', kind: 'requirements', scope_ref: 'CHG-A' }, 'access-baseline');
  assert.equal(store.at('POL-CUSTOMER-ACCESS', 'BSL-ACCESS').definition.kind, 'system_access');
  const draft = record('POL', 'POL-NEW-ACCESS', 'MOD-A', '신규 접속 정책', { kind: 'system_access' });
  assert.throws(() => putRecord(store, draft, { operation: 'no-change' }), /change/);
  putRecord(store, draft, { operation: 'access-draft', change: 'CHG-A' });
  assert(store.readRecord('CHG-A').record.definition.scope.discovery.access_policies.value.includes(draft.id));
  const status = runOwned(root, 'status', ['--module', 'MOD-A']).data;
  assert(status.discovery[0].blockers.some(b => b.code === 'access_policy_detail'));
  generateDocuments(store, { module: 'MOD-A' });
  const doc = readFileSync(join(store.project, 'docs/generated/common/POL/POL-CUSTOMER-ACCESS.md'), 'utf8');
  assert.match(doc, /로그인 화면/); assert.match(doc, /계정 활성화로 부여, 정지·회수 후 후속 요청 거부/);
  const uc = readFileSync(join(store.project, 'docs/generated/modules/MOD-A/UC/UC-CANCEL.md'), 'utf8');
  assert.match(uc, /common\/POL\/POL-CUSTOMER-ACCESS.md/);
  assert.equal(checkDocuments(store, { module: 'MOD-A' }).current, true);
  const profile = record('DLP', 'DLP-ACCESS', null, '정책 제출', { audience: 'internal', purpose: 'design', includes: ['design'], modules: ['MOD-A'] });
  putRecord(store, profile, { operation: 'delivery-profile' }); buildDelivery(store, profile.id, join(root, 'delivery'));
  assert.match(readFileSync(join(root, 'delivery/index.html'), 'utf8'), /계정 활성화로 부여, 정지·회수 후 후속 요청 거부/);
});
