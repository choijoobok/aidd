import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapV2, runOwned } from '../../.ai/tools/lib/owned-cli.mjs';
import { RecordStore } from '../../.ai/tools/lib/record-store.mjs';
import { record, recordPath, definitionHash } from '../../.ai/tools/lib/record-contracts.mjs';
import { transact } from '../../.ai/tools/lib/record-transaction.mjs';
import { baselineCreate, reviewRecord, readContext, runGate } from '../../.ai/tools/lib/lifecycle-operations.mjs';
import { reviewInput, evaluate } from '../../.ai/tools/lib/readiness.mjs';
import { requirementFixture, approval } from './helpers/modular-fixture.mjs';

test('actual baseline snapshots and review transactions close only current answered items', t => {
  const root = mkdtempSync(join(tmpdir(), 'aidd-cycle-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  bootstrapV2(root, { 'project-id': 'PRJ-X', name: 'x' }); const store = new RecordStore(join(root, 'project'));
  const records = requirementFixture().filter(r => !['BSL', 'RVW'].includes(r.type)); delete records.find(r => r.id === 'CHG-A').definition.requirements_baseline;
  records.push(record('OI', 'OI-A', 'MOD-A', 'Question', { applies_to: ['REQ-CANCEL'] }), record('DRQ', 'DRQ-A', 'MOD-A', 'Question', { applies_to: ['REQ-CANCEL'] }));
  transact(store, { operation: 'seed', updates: records.map(r => ({ path: recordPath(r), record: r, expected: null })) });
  baselineCreate(store, { id: 'BSL-REAL', kind: 'requirements', scope_ref: 'CHG-A' }, 'baseline');
  assert.equal(store.at('REQ-CANCEL', 'BSL-REAL').title, 'Cancel order');
  const current = readContext(store, 'CHG-A').records;
  const rvw = approval(current, 'requirement', ['REQ-CANCEL'], 'ACTUAL');
  const result = reviewRecord(store, { record: rvw, resolve: ['OI-A', 'DRQ-A'] }, 'answer');
  assert.equal(result.review_current, true); assert.equal(store.readRecord('OI-A').record.execution.status, 'completed'); assert.equal(store.readRecord('DRQ-A').record.execution.status, 'completed');
  assert.equal(store.readRecord('HIS-ACTUAL').record.definition.current_at_recording, true);
  const stale = structuredClone(rvw); stale.id = 'RVW-LATE'; stale.definition.sequence = 2; stale.definition.subjects[0].definition_hash = '0'.repeat(64);
  assert.equal(reviewRecord(store, { record: stale }, 'late').review_current, false);
  assert.equal(store.readRecord('HIS-LATE').record.definition.current_at_recording, false);
  const view = readContext(store, 'CHG-A');
  for (const subject of view.records.filter(r => ['SYS', 'CAP', 'ACT', 'UC', 'BPR', 'POL'].includes(r.type))) {
    const r = approval(view.records, ['SYS', 'CAP', 'ACT', 'POL'].includes(subject.type) ? 'intent' : 'business_flow', [subject.id], `REAL-${subject.id}`);
    reviewRecord(store, r, `real-${subject.id}`);
  }
  for (const [kind, ids, name] of [['scope', ['CHG-A'], 'SCOPE-REAL'], ['consistency', ['CHG-A', 'REQ-CANCEL'], 'CONSISTENCY-REAL']]) {
    const r = approval(view.records, kind, ids, name, kind === 'scope'); reviewRecord(store, r, name);
  }
  assert.equal(runOwned(root, 'design-check', ['--change', 'CHG-A']).data.readiness, 'ready');
  assert.equal(runGate(store, 'CHG-A', 'RG-001', 'GATE-REAL').evaluation.readiness, 'ready');
  const before = readFileSync(join(store.ssot, 'modules/MOD-A/CHG/CHG-A.json'));
  runOwned(root, 'design-check', ['--change', 'CHG-A']); assert.deepEqual(readFileSync(join(store.ssot, 'modules/MOD-A/CHG/CHG-A.json')), before);
});
