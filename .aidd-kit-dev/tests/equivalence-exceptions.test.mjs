import test from 'node:test';
import assert from 'node:assert/strict';
import { record, definitionHash } from '../../.ai/tools/lib/record-contracts.mjs';
import { evaluate, reviewInput, reviewValidity } from '../../.ai/tools/lib/readiness.mjs';
import { developmentFixture, approval } from './helpers/modular-fixture.mjs';

test('explicit current user equivalence can reuse a prior design review, not a mere typo label', () => {
  const records = developmentFixture({ ui: false }), feature = records.find(r => r.type === 'FEAT'), old = records.find(r => r.id === 'RVW-FEATURE-DESIGN');
  feature.definition.main_flow.value[0] = 'Load order';
  assert.equal(reviewValidity(records, 'design', [feature.id]), 'stale');
  const eq = approval(records, 'equivalence', [feature.id], 'EQUIVALENCE');
  eq.definition.equivalence = { previous_review: old.id, previous_input_digest: old.definition.input_digest, current_input_digest: reviewInput(records, [feature.id], 'design'), subject_hashes_before: old.definition.subjects, reason: 'Customer confirmed capitalisation only; behavior and dependencies unchanged' };
  assert.equal(reviewValidity(records, 'design', [feature.id]), 'current');
  eq.definition.decision_source.kind = 'analysis'; assert.equal(reviewValidity(records, 'design', [feature.id]), 'stale');
});

test('exceptions need explicit policy, current hashes, controls and evaluation time; mandatory user acceptance is nonwaivable', () => {
  const records = developmentFixture({ ui: false }), work = records.find(r => r.type === 'WRK');
  const dep = record('IFC', 'IFC-DEP', 'MOD-B', 'Provider', {}); records.push(dep); work.relations.push({ type: 'depends_on', target: dep.id, required_output: 'implementation' });
  const policy = record('POL', 'POL-EXCEPTION', null, 'Permitted scope', { exception_criteria: ['predecessor_output'] });
  const exception = record('EXC', 'EXC-TEMP', 'MOD-A', 'Temporary substitute', { applies_to: [work.id], criteria: ['predecessor_output'], policy: policy.id, reason: 'Prepare implementation against accepted substitute; actual release still needs integration', compensating_controls: ['Run actual integration before release'], decision_source: { kind: 'user', reference: 'fixture explicit acceptance' }, expires_at: '2026-10-01T00:00:00Z', input_hashes: { [work.id]: definitionHash(work) } }); records.push(policy, exception);
  assert.equal(evaluate(records, work.id, 'development').readiness, 'unknown');
  const valid = evaluate(records, work.id, 'development', { evaluated_at: '2026-09-22T00:00:00Z' }); assert(valid.waived.some(w => w.code === 'predecessor_output')); assert.equal(valid.readiness, 'ready');
  assert(evaluate(records, work.id, 'development', { evaluated_at: '2026-10-02T00:00:00Z' }).blockers.some(b => b.code === 'exception_invalid_or_expired'));
  exception.definition.criteria = ['requirement_review_missing']; policy.definition.exception_criteria.push('requirement_review_missing'); assert(evaluate(records, work.id, 'development', { evaluated_at: '2026-09-22T00:00:00Z' }).blockers.some(b => b.code === 'exception_nonwaivable'));
});
