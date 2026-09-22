import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { record, recordPath, contentHash, definitionHash } from '../../.ai/tools/lib/record-contracts.mjs';
import { evaluate, reviewInput, reviewValidity } from '../../.ai/tools/lib/readiness.mjs';
import { businessErrors, discoveryIds } from '../../.ai/tools/lib/business-discovery.mjs';
import { impactGraph } from '../../.ai/tools/lib/dependency-graph.mjs';
import { semanticErrors } from '../../.ai/tools/lib/semantic-validation.mjs';
import { baselineCreate, readContext, reviewRecord } from '../../.ai/tools/lib/lifecycle-operations.mjs';
import { bootstrapV2, runOwned } from '../../.ai/tools/lib/owned-cli.mjs';
import { RecordStore } from '../../.ai/tools/lib/record-store.mjs';
import { transact, putRecord } from '../../.ai/tools/lib/record-transaction.mjs';
import { generateDocuments, checkDocuments, buildDelivery } from '../../.ai/tools/lib/document-renderer.mjs';
import { renderProcess } from '../../.ai/tools/lib/process-renderer.mjs';
import { requirementFixture, developmentFixture, known, na, approval, approveBusiness } from './helpers/modular-fixture.mjs';

function renew(records) {
  records = records.filter(r => r.type !== 'RVW');
  const chg = records.find(r => r.id === 'CHG-A'), scope = chg.definition.scope;
  records.find(r => r.id === 'BSL-A').definition.members = [...discoveryIds(chg), ...scope.requirements, ...scope.candidates, ...scope.governing].map(id => { const r = records.find(r => r.id === id), projection = ['FEAT', 'SCR'].includes(r.type) ? 'analysis' : 'definition'; return { id, projection, content_hash: contentHash(r, projection), blob_hash: 'a'.repeat(64) }; });
  approveBusiness(records); approval(records, 'scope', ['CHG-A'], 'SCOPE');
  for (const id of scope.requirements) approval(records, 'requirement', [id], id);
  approval(records, 'consistency', ['CHG-A', ...scope.requirements], 'CONSISTENCY', false);
  return records;
}
function seed(t, records = requirementFixture()) {
  const root = mkdtempSync(join(tmpdir(), 'aidd-business-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  bootstrapV2(root, { 'project-id': 'PRJ-X', name: '업무 분석 시험' }); const store = new RecordStore(join(root, 'project'));
  transact(store, { operation: 'seed', updates: records.map(r => ({ path: recordPath(r), record: r, expected: null })) });
  return { root, store };
}
const codes = (records, stage = 'requirements') => evaluate(records, 'CHG-A', stage).blockers.map(b => b.code);

test('complete business analysis permits discovery and requirements; previous detailed REQ alone does not', () => {
  const records = requirementFixture();
  assert.equal(evaluate(records, 'CHG-A', 'discovery').readiness, 'ready');
  assert.equal(evaluate(records, 'CHG-A').readiness, 'ready');
  delete records.find(r => r.id === 'CHG-A').definition.scope.discovery;
  assert(codes(records).includes('system_overview_missing'));
  assert(codes(records).includes('discovery_inventory'));
});
test('draft requirements may follow accepted business flow, but design requires traced coverage', () => {
  const records = requirementFixture(), req = records.find(r => r.type === 'REQ'); req.relations = [];
  const renewed = renew(records);
  assert.equal(evaluate(renewed, 'CHG-A', 'discovery').readiness, 'ready');
  assert(codes(renewed).includes('requirement_origin')); assert(codes(renewed).includes('process_requirement_coverage'));
});
test('new actor goals, capabilities and alternate UC branches must be covered or reasoned out', () => {
  const records = requirementFixture(); records.find(r => r.type === 'ACT').definition.goals.push({ key: 'history', goal: '이력 확인' });
  records.find(r => r.type === 'UC').definition.alternatives = known([{ key: 'reject', action: '배송 완료 취소 요청', outcome: '취소 거절' }]);
  const out = codes(records); assert(out.includes('actor_goal_coverage')); assert(out.includes('use_case_requirement_coverage'));
  records.find(r => r.id === 'CHG-A').definition.scope.discovery.dispositions = [{ id: 'ACT-CUSTOMER', selector: 'history', disposition: 'deferred', reason: '다음 모듈 주기에서 제공' }, { id: 'UC-CANCEL', selector: 'reject', disposition: 'excluded', reason: '현재 범위는 결제 직후 취소' }];
  assert.equal(evaluate(renew(records), 'CHG-A').readiness, 'ready');
});
test('user partial/rejected flow review is not replaced by an older accepted result', () => {
  const records = requirementFixture(), rvw = approval(records, 'business_flow', ['UC-CANCEL', 'BPR-CANCEL'], 'PARTIAL');
  rvw.definition.sequence = 2; rvw.definition.per_subject_results['BPR-CANCEL'] = 'changes_requested';
  assert.equal(reviewValidity(records, 'business_flow', ['UC-CANCEL'], { user: true }), 'current');
  assert.equal(reviewValidity(records, 'business_flow', ['BPR-CANCEL'], { user: true }), 'rejected');
  assert(codes(records).includes('business_flow_review_rejected'));
});
test('upstream business edits invalidate dependent approval and propagate to work, not unrelated module', () => {
  const records = developmentFixture(), before = JSON.stringify(records.filter(r => ['BSL', 'RVW'].includes(r.type)));
  records.find(r => r.id === 'ACT-CUSTOMER').definition.responsibilities = known('추가 본인 확인');
  const result = evaluate(records, 'WRK-A', 'development'); assert.equal(result.readiness, 'blocked');
  assert(result.blockers.some(b => b.code === 'business_flow_review_stale'));
  const affected = impactGraph(records, 'ACT-CUSTOMER').candidates.map(c => c.id);
  for (const id of ['UC-CANCEL', 'BPR-CANCEL', 'REQ-CANCEL', 'FEAT-CANCEL', 'SCR-CANCEL', 'WRK-A', 'TC-CANCEL']) assert(affected.includes(id), id);
  assert(!affected.includes('MOD-B')); assert.equal(JSON.stringify(records.filter(r => ['BSL', 'RVW'].includes(r.type))), before);
});
test('process validates paths, actors, referenced UC steps, loops and data state without requiring a DAG', () => {
  const records = requirementFixture(), p = records.find(r => r.type === 'BPR'), map = new Map(records.map(r => [r.id, r]));
  p.definition.steps.push({ key: 'support', title: '고객 확인', kind: 'manual', actor: 'ACT-CUSTOMER', outcome: '확인 완료', data_state: na('수기 확인') });
  p.definition.terminals = ['support']; p.definition.transitions = [{ from: 'cancel', to: 'cancel', kind: 'alternative', condition: '재확인 필요' }, { from: 'cancel', to: 'support', kind: 'normal', condition: '처리 완료' }];
  assert.deepEqual(businessErrors(p, map), []);
  p.definition.steps[0].use_case_step = 'gone'; assert(businessErrors(p, map).some(e => e.code === 'process_use_case'));
  assert(semanticErrors(records).some(e => e.code === 'missing_selector'));
  p.definition.transitions = []; assert(businessErrors(p, map).some(e => e.code === 'process_disconnected'));
});
test('quality requirements can originate in system constraints without artificial actors or UC', () => {
  let records = requirementFixture().filter(r => !['CAP', 'ACT', 'UC', 'BPR', 'POL'].includes(r.type));
  const req = records.find(r => r.type === 'REQ'); req.definition.measurement = known('백업 복원 30분 이내'); req.type = 'NFR'; req.id = 'NFR-RECOVERY';
  req.relations = [{ type: 'derived_from', target: 'SYS-ORDERS' }];
  const scope = records.find(r => r.type === 'CHG').definition.scope;
  scope.requirements = [req.id]; records.find(r => r.type === 'FEAT').relations = [{ type: 'satisfies', target: req.id }];
  scope.discovery = { overview: 'SYS-ORDERS', ...Object.fromEntries(['capabilities', 'actors', 'access_policies', 'use_cases', 'processes'].map(k => [k, na('공통 복구 품질 변경으로 업무 흐름을 추가하지 않음')])) };
  records = renew(records); assert.equal(evaluate(records, 'CHG-A').readiness, 'ready');
  scope.discovery.actors = { status: 'not_applicable' }; assert(codes(records).includes('discovery_inventory'));
});
test('actual storage/CLI includes common business definitions in baselines and exposes review inputs', t => {
  const { store, root } = seed(t);
  assert.equal(runOwned(root, 'discovery-check', ['--change', 'CHG-A']).data.readiness, 'ready');
  assert(runOwned(root, 'record-read', ['--id', 'UC-CANCEL']).data.review_inputs.business_flow.input_digest);
  baselineCreate(store, { id: 'BSL-NEW', kind: 'requirements', scope_ref: 'CHG-A' }, 'new-baseline');
  const b = store.readRecord('BSL-NEW').record;
  for (const id of ['SYS-ORDERS', 'ACT-CUSTOMER', 'UC-CANCEL', 'BPR-CANCEL']) { assert(b.definition.members.some(m => m.id === id)); assert.equal(store.at(id, 'BSL-NEW').id, id); }
});
test('record-put adds draft business definitions to discovery, never silently to feature candidates', t => {
  const { store } = seed(t), act = record('ACT', 'ACT-NEW', null, '신규 역할', {});
  putRecord(store, act, { operation: 'new-actor', change: 'CHG-A' });
  const chg = store.readRecord('CHG-A').record;
  assert(chg.definition.scope.discovery.actors.value.includes(act.id)); assert(!chg.definition.scope.candidates.includes(act.id));
  assert(codes(store.scanAll().records).includes('discovery_detail'));
});
test('new module reuses common reviewed SYS/ACT without reopening an unrelated existing module', t => {
  const a = requirementFixture();
  const b = JSON.parse(JSON.stringify(requirementFixture()).replaceAll('MOD-A', 'MOD-C').replaceAll('CHG-A', 'CHG-C').replaceAll('BSL-A', 'BSL-C').replaceAll('CAP-ORDERS', 'CAP-C').replaceAll('UC-CANCEL', 'UC-C').replaceAll('BPR-CANCEL', 'BPR-C').replaceAll('REQ-CANCEL', 'REQ-C').replaceAll('FEAT-CANCEL', 'FEAT-C'));
  const merged = [...a, ...b.filter(r => !a.some(x => x.id === r.id) && r.type !== 'RVW')];
  const chg = merged.find(r => r.id === 'CHG-C');
  merged.find(r => r.id === 'BSL-C').definition.members = [...discoveryIds(chg), ...chg.definition.scope.requirements, ...chg.definition.scope.candidates].map(id => { const r = merged.find(r => r.id === id), projection = r.type === 'FEAT' ? 'analysis' : 'definition'; return { id, projection, content_hash: contentHash(r, projection), blob_hash: 'a'.repeat(64) }; });
  for (const id of ['CAP-C', 'UC-C', 'BPR-C']) approval(merged, id === 'CAP-C' ? 'intent' : 'business_flow', [id], `C-${id}`);
  approval(merged, 'scope', ['CHG-C'], 'C-SCOPE'); approval(merged, 'requirement', ['REQ-C'], 'C-REQ'); approval(merged, 'consistency', ['CHG-C', 'REQ-C'], 'C-CONSISTENCY', false);
  const { store } = seed(t, merged), view = readContext(store, 'CHG-C');
  assert.equal(evaluate(view.records, 'CHG-C', 'requirements', view).readiness, 'ready');
  assert.equal(evaluate(merged, 'CHG-A').readiness, 'ready');
});
test('process diagram, scoped briefing and common overview are reproducible and protected outputs', t => {
  const { store, root } = seed(t), output = join(store.project, 'docs/generated');
  generateDocuments(store, { module: 'MOD-A' });
  const svg = join(output, 'modules/MOD-A/BPR/BPR-CANCEL.svg'); assert(existsSync(svg));
  assert.match(readFileSync(svg, 'utf8'), /주문 취소/);
  assert.match(readFileSync(join(output, 'site/index.html'), 'utf8'), /취소와 환불의 불일치/);
  assert(existsSync(join(output, 'common/SYS/SYS-ORDERS.md')));
  assert.deepEqual(JSON.parse(readFileSync(join(output, 'modules/MOD-A/status.json'))).discovery, runOwned(root, 'status', ['--module', 'MOD-A']).data.discovery);
  assert.equal(checkDocuments(store, { module: 'MOD-A' }).current, true);
  writeFileSync(svg, 'manual diagram'); assert.throws(() => generateDocuments(store, { module: 'MOD-A' }), /BPR-CANCEL/);
  assert.equal(readFileSync(svg, 'utf8'), 'manual diagram');
});
test('SVG is deterministic and treats user labels as text, not markup', () => {
  const p = requirementFixture().find(r => r.type === 'BPR'); p.title = '<script>not code</script>';
  assert.equal(renderProcess(p), renderProcess(p)); assert(!renderProcess(p).includes('<script>'));
  assert.match(renderProcess(p), /&lt;script&gt;/);
});
test('grouped review transaction can include common and module subjects and stays current', t => {
  const { store } = seed(t), records = store.scanAll().records;
  const r = approval(records, 'intent', ['SYS-ORDERS', 'CAP-ORDERS', 'ACT-CUSTOMER'], 'GROUPED'); r.definition.sequence = 2;
  assert.equal(reviewRecord(store, r, 'grouped-review').review_current, true);
  assert.equal(reviewValidity(store.scanAll().records, 'intent', ['CAP-ORDERS'], { user: true }), 'current');
});
test('business design delivery includes shared context and an offline process image', t => {
  const { store, root } = seed(t), profile = record('DLP', 'DLP-BUSINESS', null, '업무 분석 제출', { audience: 'internal', purpose: 'design', includes: ['design'], modules: ['MOD-A'] });
  putRecord(store, profile, { operation: 'profile' }); buildDelivery(store, profile.id, join(root, 'delivery'));
  const html = readFileSync(join(root, 'delivery/index.html'), 'utf8');
  assert.match(html, /주문 업무 시스템/); assert.match(html, /구매 고객/); assert.match(html, /data:image\/svg\+xml;base64,/);
});
test('malformed discovery drafts block readiness instead of crashing it', () => {
  const records = requirementFixture(); records.find(r => r.type === 'ACT').definition.goals = [null]; records.find(r => r.type === 'BPR').definition.steps = [null];
  assert(codes(records).includes('discovery_shape'));
});
test('wrong relation types, missing transitions and recursive subprocesses cannot pass', () => {
  const records = requirementFixture(), uc = records.find(r => r.type === 'UC'), p = records.find(r => r.type === 'BPR'), map = new Map(records.map(r => [r.id, r]));
  uc.relations.push({ type: 'realizes', target: 'SYS-ORDERS' });
  assert(codes(records).includes('use_case_relation_type'));
  delete p.definition.transitions; assert(businessErrors(p, map).some(e => e.code === 'process_transitions_missing'));
  p.definition.steps.push({ key: 'nested', kind: 'subprocess', subprocess: p.id }); assert(businessErrors(p, map).some(e => e.code === 'process_recursive_subprocess'));
});
test('a new scoped capability cannot disappear behind existing approved UC coverage', () => {
  const records = requirementFixture(), cap = record('CAP', 'CAP-NEW', 'MOD-A', '배송 상태 조회', { purpose: known('배송 조회'), outcomes: known('진행 상태 확인'), business_objects: known('배송') }, [{ type: 'part_of', target: 'SYS-ORDERS' }]);
  records.push(cap); records.find(r => r.type === 'CHG').definition.scope.discovery.capabilities.value.push(cap.id);
  assert(codes(renew(records)).includes('capability_coverage'));
});
test('shared cross-module process documents keep identical links across scoped generation', t => {
  const records = requirementFixture(), process = records.find(r => r.type === 'BPR'); process.owner = { kind: 'project' };
  const { store } = seed(t, records), output = join(store.project, 'docs/generated');
  generateDocuments(store, { module: 'MOD-A' });
  const path = join(output, 'common/BPR/BPR-CANCEL.md'), before = readFileSync(path, 'utf8');
  assert.match(before, /modules\/MOD-A\/UC\/UC-CANCEL.md/);
  generateDocuments(store, { module: 'MOD-B' }); assert.equal(readFileSync(path, 'utf8'), before);
  assert.match(readFileSync(join(output, 'common/index.html'), 'utf8'), /BPR\/BPR-CANCEL.svg/);
});
