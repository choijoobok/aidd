import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RecordStore } from '../../.ai/tools/lib/record-store.mjs';
import { record, definitionHash, contentHash, recordPath, sha } from '../../.ai/tools/lib/record-contracts.mjs';
import { putRecord, transact, recover } from '../../.ai/tools/lib/record-transaction.mjs';
import { checkIndex, rebuildIndex } from '../../.ai/tools/lib/record-index.mjs';
import { bootstrapV2 } from '../../.ai/tools/lib/owned-cli.mjs';

export function workspace(t) {
  const root = mkdtempSync(join(tmpdir(), 'aidd-v2-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  bootstrapV2(root, { 'project-id': 'PRJ-TEST', name: 'Test' }); const store = new RecordStore(join(root, 'project'));
  for (const name of ['A', 'B']) putRecord(store, record('MOD', `MOD-${name}`, `MOD-${name}`, name, { purpose: name }), { operation: `mod-${name}` });
  return { root, store };
}
test('definition and analysis projections do not confuse execution with meaning', () => {
  const r = record('FEAT-A', 'FEAT-A', 'MOD-A', 'Feature'); r.type = 'FEAT';
  const changed = structuredClone(r); changed.revision++; changed.execution.status = 'completed'; changed.lifecycle = 'active';
  assert.equal(definitionHash(r), definitionHash(changed)); changed.definition.main_flow = ['new detail'];
  assert.notEqual(definitionHash(r), definitionHash(changed)); assert.equal(contentHash(r, 'analysis'), contentHash(changed, 'analysis'));
  changed.title = 'new purpose'; assert.notEqual(contentHash(r, 'analysis'), contentHash(changed, 'analysis'));
  const data = record('DAT', 'DAT-A', 'MOD-A', 'Business data', { attributes: [{ key: 'amount', meaning: 'refund amount' }] }), before = contentHash(data, 'analysis');
  data.definition.attributes[0].meaning = 'additional charge'; assert.notEqual(contentHash(data, 'analysis'), before);
});
test('scoped reads isolate broken unrelated module; global validation does not', t => {
  const { store } = workspace(t); const p = join(store.ssot, 'modules/MOD-B/REQ/REQ-B.json'); mkdirSync(join(p, '..'), { recursive: true }); writeFileSync(p, '{broken');
  const a = store.readScope({ module: 'MOD-A' }); assert.equal(a.coverage.scope_complete, true); assert.equal(a.read_stats.bodies, 1);
  assert.equal(store.scanAll().coverage.scope_complete, false);
});
test('CAS, immutable snapshots and idempotent operation replay', t => {
  const { store } = workspace(t), r = store.readRecord('MOD-A').record, path = recordPath(r), expected = sha(readFileSync(join(store.ssot, path)));
  r.revision++; r.title = 'changed'; const update = { operation: 'edit', updates: [{ path, record: r, expected }] };
  transact(store, update); assert.equal(transact(store, update).replayed, true);
  assert.throws(() => transact(store, { ...update, operation: 'stale' }), /modules/);
  assert.throws(() => transact(store, { ...update, updates: [] }), /another request/);
  assert.equal(JSON.parse(readFileSync(join(store.base, `snapshots/records/MOD-A/${expected}.json`))).title, 'A');
});
test('crash recovery resumes partial multi-file operation and preserves later edits', t => {
  const { store } = workspace(t); const updates = ['MOD-A', 'MOD-B'].map(id => { const r = store.readRecord(id).record, path = recordPath(r), expected = sha(readFileSync(join(store.ssot, path))); r.revision++; r.title += ' revised'; return { path, expected, record: r }; });
  assert.throws(() => transact(store, { operation: 'crash', updates, fault: (phase, count) => { if (phase === 'write' && count === 1) throw Error('crash'); } }), /crash/);
  assert.equal(store.readScope({ module: 'MOD-A' }).coverage.scope_complete, false);
  recover(store, 'crash', 'resume'); assert.equal(store.readRecord('MOD-B').record.title, 'B revised');
  const next = updates.map(u => ({ ...u, expected: sha(readFileSync(join(store.ssot, u.path))), record: { ...u.record, revision: 3, title: 'again' } }));
  assert.throws(() => transact(store, { operation: 'crash2', updates: next, fault: (phase, n) => { if (phase === 'write' && n === 1) throw Error('crash'); } }));
  writeFileSync(join(store.ssot, next[0].path), JSON.stringify({ ...next[0].record, title: 'user later edit' }));
  assert.throws(() => recover(store, 'crash2', 'rollback'), /later edit preserved/);
});
test('index failure does not report canonical rollback; same stat edits detected', t => {
  const { store } = workspace(t), r = store.readRecord('MOD-A').record, path = recordPath(r), target = join(store.ssot, path), expected = sha(readFileSync(target)); r.revision++; r.title = 'Z';
  const result = transact(store, { operation: 'index-fail', updates: [{ path, expected, record: r }], fault: phase => { if (phase === 'index') throw Error('index unavailable'); } });
  assert.equal(result.state, 'committed'); assert.equal(result.index_state, 'stale'); assert.equal(checkIndex(store).current, false);
  const stat = statSync(target); writeFileSync(target, readFileSync(target, 'utf8').replace('"Z"', '"Y"')); utimesSync(target, stat.atime, stat.mtime);
  assert.equal(store.readRecord('MOD-A').record.title, 'Y'); assert.equal(checkIndex(store).current, false);
});

test('large type indexes are paged and scoped rebuild does not rewrite another owner', t => {
  const { store } = workspace(t), bIndex = join(store.base, 'index/owners/MOD-B/index.json'), b = readFileSync(bIndex);
  const updates = Array.from({ length: 130 }, (_, i) => { const r = record('OI', `OI-${i}`, 'MOD-A', `Question ${i}`, { applies_to: ['MOD-A'] }); return { path: recordPath(r), record: r, expected: null }; });
  transact(store, { operation: 'many', updates }); const page = JSON.parse(readFileSync(join(store.base, 'index/owners/MOD-A/OI.json'))); assert.equal(page.pages.length, 2);
  rebuildIndex(store, { module: 'MOD-A' }); assert.equal(checkIndex(store, { module: 'MOD-A' }).current, true); assert.deepEqual(readFileSync(bIndex), b);
});
