import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { evaluate, prototypeInput } from '../../.ai/tools/lib/readiness.mjs';
import { record, definitionHash } from '../../.ai/tools/lib/record-contracts.mjs';
import { renderPrototype, prototypeErrors } from '../../.ai/tools/lib/prototype-renderer.mjs';
import { impactGraph } from '../../.ai/tools/lib/dependency-graph.mjs';
import { developmentFixture, approval } from './helpers/modular-fixture.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapV2 } from '../../.ai/tools/lib/owned-cli.mjs';
import { RecordStore } from '../../.ai/tools/lib/record-store.mjs';
import { transact } from '../../.ai/tools/lib/record-transaction.mjs';
import { applyImpact } from '../../.ai/tools/lib/dependency-graph.mjs';
import { recordPath } from '../../.ai/tools/lib/record-contracts.mjs';
import { runGate, readContext } from '../../.ai/tools/lib/lifecycle-operations.mjs';

test('work W1 ready while independent W2 design is incomplete; UI and API paths both work', () => {
  for (const ui of [true, false]) {
    const records = developmentFixture({ ui }), result = evaluate(records, 'WRK-A', 'development'); assert.equal(result.readiness, 'ready', JSON.stringify(result.blockers));
    records.push(record('WRK', 'WRK-B', 'MOD-A', 'Later work', { change: 'CHG-A', work_kind: 'product_feature', features: [] }));
    assert.equal(evaluate(records, 'WRK-A', 'development').readiness, 'ready'); assert.equal(evaluate(records, 'WRK-B', 'development').readiness, 'blocked');
  }
});
test('prototype is deterministic and its actual script validates input and changes states', () => {
  const records = developmentFixture(), screen = records.find(r => r.id === 'SCR-CANCEL'), input = prototypeInput(records, screen.id), output = renderPrototype(screen, input);
  assert.equal(output.html, renderPrototype(screen, input).html); assert.equal(prototypeErrors(screen).length, 0);
  const elements = Object.fromEntries(['state-title', 'state-message', 'scenario', 'error', 'prototype-form'].map(id => [id, { textContent: '', handlers: {}, addEventListener(name, f) { this.handlers[name] = f; } }]));
  let valid = false; elements['prototype-form'].checkValidity = () => valid; elements['prototype-form'].reportValidity = () => {};
  const buttons = ['cancel', 'confirm', 'back'].map(action => ({ dataset: { action }, handlers: {}, addEventListener(name, f) { this.handlers[name] = f; } }));
  const document = { getElementById: id => elements[id], querySelectorAll: () => buttons };
  vm.runInNewContext(output.html.match(/<script>([\s\S]*)<\/script>/)[1], { document });
  assert.equal(elements['state-title'].textContent, '주문 조회'); buttons[0].handlers.click(); assert.match(elements.error.textContent, /입력값/);
  valid = true; buttons[0].handlers.click(); assert.equal(elements['state-title'].textContent, '취소 확인'); buttons[1].handlers.click(); assert.equal(elements['state-title'].textContent, '환불 완료');
});
test('placeholder or changed screen requires a new design/prototype review', () => {
  const records = developmentFixture(), screen = records.find(r => r.type === 'SCR'); screen.definition.fields.value[0].label = '새 주문 번호';
  const result = evaluate(records, 'WRK-A', 'development'); assert(result.blockers.some(b => b.code === 'prototype_review_stale')); assert(result.blockers.some(b => b.code === 'prototype_artifact_review'));
  screen.definition.actions.value = []; assert(prototypeErrors(screen).length);
});
test('dependency outputs distinguish approved contract from implementation and integration', () => {
  const records = developmentFixture({ ui: false }), work = records.find(r => r.type === 'WRK');
  const contract = record('IFC', 'IFC-PAYMENT', 'MOD-B', 'Payment contract', { purpose: 'refund' }); records.push(contract); approval(records, 'design', [contract.id], 'CONTRACT');
  work.relations.push({ type: 'depends_on', target: contract.id, required_output: 'contract' }); assert.equal(evaluate(records, work.id, 'development').readiness, 'ready');
  work.relations.at(-1).required_output = 'implementation'; assert(evaluate(records, work.id, 'development').blockers.some(b => b.code === 'predecessor_output'));
});
test('typed incoming impact follows transitive paths, selectors and cycles, unknown is not no impact', () => {
  const data = record('DAT', 'DAT-ORDER', 'MOD-A', 'Order', { attributes: [{ key: 'amount', meaning: 'refund amount' }] });
  const feat = record('FEAT', 'FEAT-REFUND', 'MOD-A', 'Refund', {}, [{ type: 'uses_data', target: data.id, selector: 'amount' }]);
  const screen = record('SCR', 'SCR-REFUND', 'MOD-A', 'Refund UI', {}, [{ type: 'presents', target: feat.id }]);
  const work = record('WRK', 'WRK-REFUND', 'MOD-A', 'Work', {}, [{ type: 'implements', target: screen.id }]);
  data.relations.push({ type: 'part_of', target: work.id });
  const graph = impactGraph([data, feat, screen, work], data.id); assert.equal(graph.candidates.length, 3); assert.deepEqual(graph.candidates.find(c => c.id === work.id).paths[0], [data.id, feat.id, screen.id, work.id]); assert(graph.cycles.length);
  assert.equal(impactGraph([data, feat, screen, work], data.id, { selector: 'unrelated' }).candidates.length, 0);
  assert.equal(impactGraph([feat], data.id, { coverage: { project_complete: false } }).readiness, 'unknown');
});
test('stub integration and manual completed status do not make a release ready', () => {
  const records = developmentFixture({ ui: false }), work = records.find(r => r.type === 'WRK'); work.execution.status = 'completed';
  const rel = record('REL', 'REL-A', 'MOD-A', 'Release', { works: [work.id], environment: 'staging' }); records.push(rel);
  records.push(record('EVD', 'EVD-STUB', 'MOD-A', 'Stub', { subjects: [rel.id], kind: 'integration', result: 'passed', mode: 'stub', environment: 'staging', input_hash: definitionHash(rel), command: 'test', occurred_at: '2026-09-22', artifacts: ['test.log'] }));
  const result = evaluate(records, rel.id, 'release'); assert(result.blockers.some(b => b.code === 'integration_evidence_missing')); assert(result.blockers.some(b => b.code === 'work_execution_missing')); assert(result.blockers.some(b => b.code === 'gate_run_missing_or_stale'));
});

test('explicit selective reopen preserves other work and operating history', t => {
  const root = mkdtempSync(join(tmpdir(), 'aidd-impact-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  bootstrapV2(root, { 'project-id': 'PRJ-X', name: 'x' }); const store = new RecordStore(join(root, 'project')), records = developmentFixture({ ui: false });
  const other = record('WRK', 'WRK-OTHER', 'MOD-B', 'Unrelated', {}); other.execution.status = 'completed'; records.push(other, record('REL', 'REL-OLD', 'MOD-A', 'Historical release', { baseline: 'BSL-A' }));
  records.find(r => r.id === 'WRK-A').execution.status = 'completed';
  transact(store, { operation: 'seed', updates: records.map(r => ({ path: recordPath(r), record: r, expected: null })) });
  const graph = impactGraph(store.scanAll().records, 'REQ-CANCEL');
  const imp = record('IMP', 'IMP-A', 'MOD-A', 'Change impact', { ...graph, applies_to: ['REQ-CANCEL'], candidates: graph.candidates.map(c => ({ ...c, disposition: c.id === 'WRK-A' ? 'affected' : 'unaffected', reason: 'fixture explicit disposition', reopen: c.id === 'WRK-A' })) });
  applyImpact(store, imp, null, 'apply');
  assert.equal(store.readRecord('WRK-A').record.execution.status, 'planned'); assert.equal(store.readRecord('WRK-OTHER').record.execution.status, 'completed'); assert.equal(store.readRecord('REL-OLD').record.title, 'Historical release');
});

test('real scoped evidence and explicit required gates permit release without changing deployed baseline', t => {
  const root = mkdtempSync(join(tmpdir(), 'aidd-release-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  bootstrapV2(root, { 'project-id': 'PRJ-X', name: 'x' }); const store = new RecordStore(join(root, 'project')), records = developmentFixture({ ui: false });
  const work = records.find(r => r.id === 'WRK-A'); work.execution.status = 'completed';
  const rel = record('REL', 'REL-A', 'MOD-A', 'Candidate release', { works: ['WRK-A'], environment: 'staging' }); records.push(rel);
  for (const [id, kind] of [['WRK-A', 'implementation'], ['TC-CANCEL', 'test'], ['REL-A', 'integration']]) {
    const target = records.find(r => r.id === id);
    records.push(record('EVD', `EVD-${kind.toUpperCase()}`, 'MOD-A', 'Actual fixture execution', { subjects: [id], kind, result: 'passed', input_hash: definitionHash(target), command: 'fixture execution', occurred_at: '2026-09-22', artifacts: ['fixture.log'], environment: 'staging', mode: 'actual' }));
  }
  transact(store, { operation: 'seed', updates: records.map(r => ({ path: recordPath(r), record: r, expected: null })) });
  for (const [scope,gate] of [['CHG-A','RG-001'],['WRK-A','FG-001'],[rel.id,'RL-001']]) assert.equal(runGate(store, scope, gate, `RELEASE-${gate}`).evaluation.readiness, 'ready');
  const view = readContext(store, rel.id); assert.equal(evaluate(view.records, rel.id, 'release', view).readiness, 'ready');
  assert.equal(store.readRecord('MOD-A').record.execution.operating_release, undefined);
});
