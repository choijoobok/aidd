import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, reviewValidity, reviewInput } from '../../.ai/tools/lib/readiness.mjs';
import { record, definitionHash } from '../../.ai/tools/lib/record-contracts.mjs';
import { requirementFixture, approval } from './helpers/modular-fixture.mjs';

test('complete scoped requirements allow design; draft storage is not approval', () => {
  const records = requirementFixture(), result = evaluate(records, 'CHG-A');
  assert.equal(result.readiness, 'ready', JSON.stringify(result.blockers));
  records.find(r => r.id === 'REQ-CANCEL').definition.exceptions = { status: 'unknown' };
  const changed = evaluate(records, 'CHG-A'); assert.equal(changed.readiness, 'blocked');
  assert(changed.blockers.some(b => b.code === 'requirement_review_stale')); assert(changed.blockers.some(b => b.code === 'requirements_baseline_stale'));
});
test('module B future work does not block A, related and unclassified decisions do', () => {
  const records = requirementFixture(); records.push(record('OI', 'OI-B', 'MOD-B', 'Future question', { applies_to: ['MOD-B'] }));
  assert.equal(evaluate(records, 'CHG-A').readiness, 'ready');
  records.push(record('DRQ', 'DRQ-A', null, 'Common question scoped to A', { applies_to: ['REQ-CANCEL'] }));
  assert(evaluate(records, 'CHG-A').blockers.some(b => b.subject === 'DRQ-A'));
  records.at(-1).definition.applies_to = []; assert.equal(evaluate(records, 'CHG-A').readiness, 'unknown');
});
test('scope shrink, unassigned definitions and competing changes cannot silently pass', () => {
  const records = requirementFixture(); records.find(r => r.id === 'CHG-A').definition.scope.requirements = [];
  const result = evaluate(records, 'CHG-A'); assert(result.blockers.some(b => b.code === 'empty_scope')); assert(result.blockers.some(b => b.code === 'unassigned_record'));
  const other = requirementFixture(); other.push(record('CHG', 'CHG-OVERLAP', 'MOD-A', 'Other active cycle', { scope: { requirements: ['REQ-CANCEL'] } }));
  assert(evaluate(other, 'CHG-A').blockers.some(b => b.code === 'active_change_overlap'));
});
test('partial responses are not full approval and latest rejection overrides older acceptance', () => {
  const records = requirementFixture(); const r = approval(records, 'requirement', ['REQ-CANCEL'], 'NEW'); r.definition.sequence = 2; r.definition.per_subject_results['REQ-CANCEL'] = 'changes_requested';
  assert.equal(reviewValidity(records, 'requirement', ['REQ-CANCEL'], { user: true }), 'rejected');
  r.definition.subjects[0].definition_hash = 'b'.repeat(64); records.find(x => x.id === 'REQ-CANCEL').title = 'Changed title';
  assert.equal(reviewValidity(records, 'requirement', ['REQ-CANCEL'], { user: true }), 'stale');
});
test('detailed design can evolve without invalidating analysis baseline; new purpose cannot', () => {
  const records = requirementFixture(), feat = records.find(r => r.id === 'FEAT-CANCEL');
  feat.definition.main_flow = { status: 'known', value: ['check order', 'refund', 'confirm'] };
  assert.equal(evaluate(records, 'CHG-A').readiness, 'ready');
  feat.definition.analysis.behavior = 'Also cancel supplier contract'; assert.equal(evaluate(records, 'CHG-A').readiness, 'blocked');
});
test('readiness is pure and old passed gates cannot override a later failed attempt', () => {
  const records = requirementFixture(), before = JSON.stringify(records), first = evaluate(records, 'CHG-A');
  assert.deepEqual(first, evaluate(records, 'CHG-A')); assert.equal(JSON.stringify(records), before);
  for (const [attempt, result] of [[1, 'passed'], [2, 'failed']]) records.push(record('GTR', `GTR-${attempt}`, 'MOD-A', 'gate', { scope_ref: 'CHG-A', gate: 'RG-001', attempt, result, input_digest: first.input_digest }));
  assert(evaluate(records, 'CHG-A').blockers.some(b => b.code === 'latest_gate_failed'));
});
