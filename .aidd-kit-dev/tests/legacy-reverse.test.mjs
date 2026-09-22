import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { legacyInventory } from '../../.ai/tools/lib/legacy-inventory.mjs';
import { legacyDraft, legacyApply } from '../../.ai/tools/lib/legacy-drafts.mjs';
import { bootstrapV2, runOwned } from '../../.ai/tools/lib/owned-cli.mjs';
import { RecordStore } from '../../.ai/tools/lib/record-store.mjs';
import { digest, record, recordPath, sha } from '../../.ai/tools/lib/record-contracts.mjs';
import { recover, transact } from '../../.ai/tools/lib/record-transaction.mjs';
import { evaluate, reviewInput } from '../../.ai/tools/lib/readiness.mjs';
import { checkIndex } from '../../.ai/tools/lib/record-index.mjs';
import { generateDocuments, checkDocuments } from '../../.ai/tools/lib/document-renderer.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'aidd-reverse-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'old-source'), docs = join(root, 'old-docs');
  mkdirSync(source); mkdirSync(docs);
  writeFileSync(join(source, 'routes.js'), '// PUBLIC GET /home\n// REQUIRED GET /orders\n// MIXED access\n// API POST /orders\n// BATCH daily summary\n');
  writeFileSync(join(docs, 'system.md'), '# Legacy system\nOrders require login.\n');
  bootstrapV2(root, { 'project-id': 'PRJ-REVERSE', name: 'Reverse fixture' });
  const store = new RecordStore(join(root, 'project'));
  const scope = { roots: [{ key: 'src', path: source, kind: 'source' }, { key: 'docs', path: docs, kind: 'document', revision: 'declared-v1' }] };
  const inventory = legacyInventory(scope), entry = inventory.entries.find(e => e.root === 'src');
  const anchor = { root: 'src', path: entry.path, sha256: entry.sha256, start_line: 1, end_line: 5, symbol: 'route declarations' };
  const obs = (key, value, status = 'observed', kind = 'other', anchors = [anchor]) => ({ key, value, status, kind, summary: key, method: 'fixture structured observation, not execution', anchors });
  const analysis = { namespace: 'shop', batch: 'first', title: '레거시 주문 분석', observations: [obs('purpose', '주문 처리', 'inferred'), obs('route', '/orders', 'observed', 'api')], candidates: [
    { key: 'orders', type: 'MOD', title: '주문', fields: { purpose: ['purpose'] } },
    ...['SYS','CAP','ACT','POL','UC','BPR','REQ','NFR','FEAT','SCR','DAT','NAV','IFC'].map(type => ({ key: type.toLowerCase(), type, owner: type === 'SYS' ? 'project' : { $ref: 'orders' }, title: `${type} 초안`, fields: {} })),
  ] };
  analysis.candidates.find(c => c.type === 'POL').fields.entry = ['route'];
  analysis.candidates.find(c => c.type === 'CAP').relations = [{ type: 'part_of', target: { $ref: 'sys' } }];
  analysis.candidates.find(c => c.type === 'REQ').relations = [{ type: 'derived_from', target: { $ref: 'uc' } }];
  return { root, source, docs, store, scope, inventory, analysis, obs, anchor };
}
const expectCode = (fn, code) => assert.throws(fn, e => e.code === code);

test('RE-AC-01 gitless roots: deterministic hashes, exclusions, unsupported, failure and original bytes', t => {
  const f = fixture(t), before = readFileSync(join(f.source, 'routes.js'));
  writeFileSync(join(f.docs, 'manual.pdf'), '%PDF not parsed');
  writeFileSync(join(f.docs, 'binary.txt'), Buffer.from([0, 1, 2]));
  writeFileSync(join(f.docs, 'legacy.txt'), Buffer.from([0xff, 0xfe]));
  mkdirSync(join(f.source, 'vendor')); writeFileSync(join(f.source, 'vendor', 'run.js'), 'throw Error("must not execute")');
  const scope = { ...f.scope, exclude: ['vendor'], roots: [...f.scope.roots, { key: 'missing', path: join(f.root, 'absent'), kind: 'artifact' }] };
  const a = legacyInventory(scope), b = legacyInventory(scope);
  assert.deepEqual(a, b); assert.equal(a.counts.text, 2); assert.equal(a.counts.unsupported, 3); assert.equal(a.counts.excluded, 1); assert.equal(a.counts.unreadable, 1);
  assert.equal(a.coverage.scope_complete, false); assert.equal(a.coverage.semantic_complete, false);
  assert.deepEqual(readFileSync(join(f.source, 'routes.js')), before);
  assert.equal(a.entries.find(e => e.path === 'routes.js').sha256, sha(before));
  assert.equal(storeSize(f.store), 0);
});
function storeSize(store) { return store.files().length; }

test('RE-AC-02 links including root ancestors are not followed and bounds remain explicit', t => {
  const f = fixture(t), outside = join(f.root, 'outside'); mkdirSync(outside); writeFileSync(join(outside, 'execute.js'), 'throw Error("do not execute")');
  symlinkSync(outside, join(f.source, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  const inv = legacyInventory(f.scope);
  assert(inv.entries.some(e => e.path === 'linked' && e.status === 'link'));
  assert(!inv.entries.some(e => e.path.includes('execute')));
  const roots = [{ key: 'linkroot', path: join(f.source, 'linked'), kind: 'source' }];
  assert.equal(legacyInventory({ roots }).counts.link, 1);
  assert(legacyInventory({ ...f.scope, max_entries: 1 }).counts.limit > 0);
  assert(legacyInventory({ ...f.scope, max_bytes: 1 }).counts.oversize > 0);
  expectCode(() => legacyInventory({ roots, exclude: ['../outside'] }), 'legacy_input');
});

test('RE-AC-03 observed public/required/mixed/API/batch remain draft and inferred auth remains unknown', t => {
  const f = fixture(t);
  for (const [mode, channel, kind] of [['public','web','ui_route'],['required','api','api'],['mixed','web','ui_route'],['required','batch','job']]) {
    const key = `${mode}-${channel}`;
    f.analysis.observations.push(f.obs(`${key}-auth`, { mode }, 'observed', kind), f.obs(`${key}-channel`, channel));
    f.analysis.candidates.push({ key, type: 'POL', owner: { $ref: 'orders' }, title: key, fields: { authentication: [`${key}-auth`], channel: [`${key}-channel`] } });
  }
  f.analysis.observations.push(f.obs('auth-guess', { mode: 'public' }, 'inferred'));
  f.analysis.candidates.find(c => c.key === 'pol').fields.authentication = ['auth-guess'];
  const plan = legacyDraft(f.store, f.analysis, f.inventory);
  for (const key of ['public-web','required-api','mixed-web','required-batch']) {
    const r = plan.records.find(r => r.id === plan.ids[key]); assert.equal(r.definition.authentication.status, 'known'); assert.equal(r.lifecycle, 'draft');
  }
  assert.deepEqual(plan.records.find(r => r.id === plan.ids.pol).definition.authentication, { status: 'unknown' });
  assert(plan.issues.find(i => i.subject === plan.ids.pol).fields.some(f => f.field === 'authentication' && f.status === 'inferred'));
});

test('RE-AC-04 disagreement preserves source and document values and opens a blocking question', t => {
  const f = fixture(t), doc = f.inventory.entries.find(e => e.root === 'docs');
  f.analysis.observations.push(f.obs('src-auth', { mode: 'public' }), f.obs('doc-auth', { mode: 'required' }, 'observed', 'document', [{ root: 'docs', path: doc.path, sha256: doc.sha256, start_line: 2, end_line: 2, section: 'Legacy system' }]));
  f.analysis.candidates.find(c => c.key === 'pol').fields.authentication = ['src-auth','doc-auth'];
  const p = legacyDraft(f.store, f.analysis, f.inventory);
  assert.equal(p.counts.conflicting_fields, 1);
  assert.deepEqual(p.records.find(r => r.id === p.ids.pol).definition.authentication, { status: 'unknown' });
  for (const key of ['src-auth','doc-auth']) assert(p.records.some(r => r.type === 'SURF' && r.definition.analysis.key === key && r.definition.analysis.anchors.length));
  assert(p.issues.some(i => i.subject === p.ids.pol && i.fields.some(x => x.status === 'conflicting')));
  assert.equal(storeSize(f.store), 0);
});

test('RE-AC-05 stable IDs, no duplicate apply, operation replay, indexes and reference integrity', t => {
  const f = fixture(t), p = legacyDraft(f.store, f.analysis, f.inventory);
  assert.deepEqual(legacyDraft(f.store, f.analysis, f.inventory), p);
  const committed = legacyApply(f.store, p, 'first'); assert.equal(committed.state, 'committed');
  assert.equal(legacyApply(f.store, p, 'first').replayed, true);
  const next = legacyDraft(f.store, f.analysis, f.inventory); assert.deepEqual(next.ids, p.ids); assert.equal(next.expected.creates.length, 0);
  assert.equal(legacyApply(f.store, next, 'again').entries.length, 0);
  assert.equal(storeSize(f.store), p.records.length); assert.equal(f.store.scanAll().coverage.scope_complete, true);
  assert.equal(checkIndex(f.store).diagnostics.length, 0);
  assert.equal(runOwned(f.root, 'validate', []).exitCode, 0);
});

test('RE-AC-05 user edits, stale source, preview CAS and operation reuse are fail-closed', t => {
  const f = fixture(t), p = legacyDraft(f.store, f.analysis, f.inventory);
  writeFileSync(join(f.source, 'routes.js'), '// changed\n');
  expectCode(() => legacyApply(f.store, p, 'stale'), 'legacy_source_changed'); assert.equal(storeSize(f.store), 0);
  writeFileSync(join(f.source, 'routes.js'), '// PUBLIC GET /home\n// REQUIRED GET /orders\n// MIXED access\n// API POST /orders\n// BATCH daily summary\n');
  legacyApply(f.store, p, 'first');
  const next = legacyDraft(f.store, f.analysis, f.inventory), r = next.records.find(r => r.type === 'REQ'), path = join(f.store.ssot, recordPath(r));
  const edited = { ...r, title: '사용자가 수정한 요구', revision: 2 }; writeFileSync(path, JSON.stringify(edited));
  expectCode(() => legacyApply(f.store, next, 'edited'), 'legacy_existing_conflict');
  expectCode(() => legacyDraft(f.store, f.analysis, f.inventory), 'legacy_existing_conflict');
  assert.equal(JSON.parse(readFileSync(path)).title, edited.title);
  expectCode(() => legacyApply(f.store, next, 'first'), 'operation_conflict');
  assert.equal(legacyApply(f.store, p, 'first').source_validation, 'historical_replay');
});

test('RE-AC-05 prepared failure requires explicit recovery and preserves later edits', t => {
  const f = fixture(t), p = legacyDraft(f.store, f.analysis, f.inventory);
  assert.throws(() => legacyApply(f.store, p, 'failed', { fault: (point, n) => { if (point === 'write' && n === 1) throw Error('injected interruption'); } }));
  expectCode(() => legacyApply(f.store, p, 'failed'), 'recovery_required');
  assert.equal(recover(f.store, 'failed', 'rollback').state, 'rolled_back'); assert.equal(storeSize(f.store), 0);
  assert.throws(() => legacyApply(f.store, p, 'partial', { fault: (point, n) => { if (point === 'write' && n === 1) throw Error('interrupt'); } }));
  const written = join(f.store.ssot, f.store.files()[0]); writeFileSync(written, '{"user":"keep"}');
  expectCode(() => recover(f.store, 'partial', 'rollback'), 'recovery_conflict'); assert.equal(readFileSync(written, 'utf8'), '{"user":"keep"}');
});

test('RE-AC-06 unreviewed skeleton cannot become ready; normal documents are reproducible', t => {
  const f = fixture(t), p = legacyDraft(f.store, f.analysis, f.inventory);
  legacyApply(f.store, p, 'seed');
  for (const stage of ['discovery','requirements']) {
    const out = evaluate(f.store.scanAll().records, p.change, stage); assert.notEqual(out.readiness, 'ready'); assert(out.blockers.some(b => b.code === 'open_item'));
  }
  assert(!p.records.some(r => ['RVW','BSL','EVD','REL','GTR'].includes(r.type)));
  assert(p.records.every(r => r.lifecycle === 'draft' && Object.keys(r.execution).length === 0));
  assert.equal(generateDocuments(f.store).lifecycle_readiness, 'blocked'); assert.equal(checkDocuments(f.store).diagnostics.length, 0);
});

test('evidence validation rejects missing hash, out-of-range anchors and invented completion types', t => {
  const f = fixture(t);
  for (const mutate of [a => a.observations[0].anchors[0].sha256 = 'bad', a => a.observations[0].anchors[0].end_line = 900, a => a.observations[0].anchors = [], a => a.candidates[0].type = 'RVW', a => a.candidates[1].execution = { status: 'completed' }, a => a.candidates.push(a.candidates[0]), a => a.candidates[1].owner = 'MOD-MISSING', a => a.candidates[0].fields.unknown = []]) {
    const a = structuredClone(f.analysis); mutate(a); assert.throws(() => legacyDraft(f.store, a, f.inventory));
  }
  const a = structuredClone(f.analysis); a.observations.push(f.obs('bad-array', [null])); a.candidates.find(c => c.type === 'DAT').fields.attributes = ['bad-array'];
  expectCode(() => legacyDraft(f.store, a, f.inventory), 'legacy_input'); assert.equal(storeSize(f.store), 0);
});

test('bounded inventory shards and candidate files preserve small-file navigation', t => {
  const f = fixture(t);
  for (let i = 0; i < 55; i++) writeFileSync(join(f.docs, `${i}.md`), `# ${i}`);
  const inv = legacyInventory(f.scope), p = legacyDraft(f.store, f.analysis, inv), shards = p.records.filter(r => r.definition.kind === 'legacy_inventory');
  assert.equal(shards.length, 3); assert(shards.every(r => r.definition.entries.length <= 25));
  const a = structuredClone(f.analysis); a.observations[0].summary = 'x'.repeat(40000);
  expectCode(() => legacyDraft(f.store, a, inv), 'legacy_input');
});

test('existing modules can own drafts without updates and snapshot CAS protects existing reads', t => {
  const f = fixture(t), mod = record('MOD', 'MOD-EXISTING', 'MOD-EXISTING', '운영 모듈', { purpose: '운영 유지' });
  transact(f.store, { operation: 'existing', updates: [{ path: recordPath(mod), record: mod, expected: null }] });
  f.analysis.candidates = f.analysis.candidates.filter(c => c.type !== 'MOD').map(c => ({ ...c, owner: c.type === 'SYS' ? 'project' : mod.id }));
  const p = legacyDraft(f.store, f.analysis, f.inventory), file = join(f.store.ssot, recordPath(mod));
  writeFileSync(file, JSON.stringify({ ...mod, title: '운영 모듈 변경', revision: 2 }));
  expectCode(() => legacyApply(f.store, p, 'cas'), 'write_conflict'); assert.equal(storeSize(f.store), 1);
  const next = legacyDraft(f.store, f.analysis, f.inventory), before = readFileSync(file); legacyApply(f.store, next, 'apply'); assert.deepEqual(readFileSync(file), before);
});

test('CLI contracts accept data envelopes and reject typo flags; forged plan writes are refused', t => {
  const f = fixture(t), scopePath = join(f.root, 'scope.json'), invPath = join(f.root, 'inventory.json'), input = join(f.root, 'analysis.json'), planPath = join(f.root, 'plan.json');
  writeFileSync(scopePath, JSON.stringify(f.scope)); writeFileSync(input, JSON.stringify(f.analysis));
  const inv = runOwned(f.root, 'legacy-inventory', ['--input', scopePath]); writeFileSync(invPath, JSON.stringify(inv));
  const plan = runOwned(f.root, 'legacy-draft', ['--input', input, '--inventory', invPath]); writeFileSync(planPath, JSON.stringify(plan));
  expectCode(() => runOwned(f.root, 'legacy-draft', ['--input', input]), 'usage');
  expectCode(() => runOwned(f.root, 'legacy-inventory', ['--input', scopePath, '--execute']), 'usage');
  const forged = structuredClone(plan.data); forged.records[0].title = 'tampered'; delete forged.digest; forged.digest = digest(forged);
  expectCode(() => legacyApply(f.store, forged, 'forged'), 'legacy_input'); assert.equal(storeSize(f.store), 0);
  assert.equal(runOwned(f.root, 'legacy-apply', ['--input', planPath, '--operation', 'cli']).data.state, 'committed');
  cpSync(resolve('.ai/tools'), join(f.root, '.ai/tools'), { recursive: true });
  for (const args of [['legacy-inventory','--input',scopePath], ['legacy-draft','--input',input,'--inventory',invPath], ['legacy-apply','--input',planPath,'--operation','cli']]) {
    const result = spawnSync(process.execPath, [join(f.root, '.ai/tools/aidd.mjs'), ...args], { cwd: f.root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, env: { ...process.env, AIDD_LIBRARY_MODE: '0' } });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    const output = JSON.parse(result.stdout); assert.equal(output.command, args[0]);
    if (args[0] === 'legacy-apply') assert.equal(output.data.replayed, true);
  }
  assert(!existsSync(join(f.source, 'project')));
});

test('observation changes affect review input and inventory shards are reachable from the change', t => {
  const f = fixture(t), p = legacyDraft(f.store, f.analysis, f.inventory);
  const before = reviewInput(p.records, [p.change], 'requirement');
  p.records.find(r => r.type === 'SURF' && r.definition.analysis.key === 'route').definition.analysis.value = '/changed';
  assert.notEqual(reviewInput(p.records, [p.change], 'requirement'), before);
  const original = legacyDraft(f.store, f.analysis, f.inventory); legacyApply(f.store, original, 'read');
  const context = f.store.readScope({ ids: [original.change] });
  assert(context.records.some(r => r.definition.kind === 'legacy_inventory'));
});

test('unrelated existing module changes do not invalidate the preview CAS', t => {
  const f = fixture(t), mod = record('MOD', 'MOD-OTHER', 'MOD-OTHER', '독립 모듈', { purpose: '다른 업무' });
  transact(f.store, { operation: 'other', updates: [{ path: recordPath(mod), record: mod, expected: null }] });
  const p = legacyDraft(f.store, f.analysis, f.inventory), path = join(f.store.ssot, recordPath(mod));
  writeFileSync(path, JSON.stringify({ ...mod, revision: 2, title: '다른 모듈 진행' }));
  assert.equal(legacyApply(f.store, p, 'scoped').state, 'committed');
  assert.equal(JSON.parse(readFileSync(path)).revision, 2);
});
