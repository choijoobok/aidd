import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapV2, runOwned } from '../../.ai/tools/lib/owned-cli.mjs';
import { RecordStore, walk } from '../../.ai/tools/lib/record-store.mjs';
import { record, recordPath, sha } from '../../.ai/tools/lib/record-contracts.mjs';
import { transact } from '../../.ai/tools/lib/record-transaction.mjs';
import { generateDocuments, checkDocuments, buildDelivery } from '../../.ai/tools/lib/document-renderer.mjs';
import { developmentFixture } from './helpers/modular-fixture.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'aidd-docs-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  bootstrapV2(root, { 'project-id': 'PRJ-X', name: '주문 관리' }); const store = new RecordStore(join(root, 'project')), records = developmentFixture();
  records.push(record('MAN', 'MAN-CANCEL', 'MOD-A', '주문 취소 방법', { audience: 'end_user', preconditions: '결제한 주문이 있습니다.', steps: ['주문 번호를 입력합니다.', '취소를 누르고 환불을 확인합니다.'], expected: '한 번만 환불됩니다.', error_recovery: '이미 취소한 주문이면 내역을 확인합니다.', support: '고객 지원' }, [{ type: 'documents', target: 'SCR-CANCEL' }]));
  records.push(record('DLP', 'DLP-USER', null, '사용자 가이드', { audience: 'end_user', purpose: 'design', includes: ['user', 'glossary'], modules: ['MOD-A'] }));
  records.push(record('TRM', 'TRM-PUBLIC', 'MOD-A', '환불', { meaning: '결제 금액을 돌려주는 처리', visibility: 'customer', audience: ['end_user'] })); records.at(-1).lifecycle = 'active';
  records.push(record('TRM', 'TRM-INTERNAL', 'MOD-A', 'Internal gate', { meaning: 'secret internal description', visibility: 'internal', audience: ['internal'] })); records.at(-1).lifecycle = 'active';
  transact(store, { operation: 'seed', updates: records.map(r => ({ path: recordPath(r), record: r, expected: null })) });
  return { root, store, output: join(store.project, 'docs/generated') };
}
test('status and generated module status share exact evaluator output; regeneration compares all files', t => {
  const { root, store, output } = fixture(t); generateDocuments(store);
  const status = runOwned(root, 'status', ['--module', 'MOD-A']).data;
  assert.deepEqual(JSON.parse(readFileSync(join(output, 'modules/MOD-A/status.json'), 'utf8')), status);
  assert.equal(checkDocuments(store).current, true);
  const hashes = Object.fromEntries(walk(output).map(p => [p, sha(readFileSync(join(output, p)))]));
  generateDocuments(store); assert.deepEqual(Object.fromEntries(walk(output).map(p => [p, sha(readFileSync(join(output, p)))])), hashes);
  assert(existsSync(join(output, 'ui/modules/MOD-A/SCR-CANCEL/mockup.html')));
});
test('module generation preserves unrelated module and user files, and detects manual generated edits', t => {
  const { store, output } = fixture(t); generateDocuments(store);
  const b = readFileSync(join(output, 'modules/MOD-B/index.html'));
  writeFileSync(join(output, 'user-notes.txt'), 'keep');
  const path = join(store.ssot, 'modules/MOD-B/REQ/REQ-BROKEN.json'); mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, '{broken');
  generateDocuments(store, { module: 'MOD-A' }); assert.deepEqual(readFileSync(join(output, 'modules/MOD-B/index.html')), b); assert.equal(readFileSync(join(output, 'user-notes.txt'), 'utf8'), 'keep');
  const generated = join(output, 'modules/MOD-A/FEAT/FEAT-CANCEL.md'); writeFileSync(generated, 'manual edit');
  assert.equal(checkDocuments(store, { module: 'MOD-A' }).current, false); assert.throws(() => generateDocuments(store, { module: 'MOD-A' }), /FEAT-CANCEL/); assert.equal(readFileSync(generated, 'utf8'), 'manual edit');
});
test('offline user delivery is scope-filtered and hides internal IDs and glossary entries', t => {
  const { store, root } = fixture(t), output = join(root, 'delivery'); buildDelivery(store, 'DLP-USER', output);
  const html = readFileSync(join(output, 'index.html'), 'utf8'); assert.match(html, /주문 취소 방법/); assert.match(html, /환불/); assert(!html.includes('secret internal')); assert(!html.includes('MAN-CANCEL')); assert(!/https?:\/\//.test(html)); assert.match(html, /실제 구현 화면이 아닙니다/);
  assert.throws(() => buildDelivery(store, 'DLP-USER', output), /explicit missing/);
});
test('deleted generated files and tampered output inventories are reported, not silently accepted', t => {
  const { store, output } = fixture(t); generateDocuments(store);
  rmSync(join(output, 'modules/MOD-A/FEAT/FEAT-CANCEL.md'));
  assert(checkDocuments(store).diagnostics.some(d => d.code === 'generated_drift'));
  const path = join(output, 'manifests/MOD-A.json'), manifest = JSON.parse(readFileSync(path)); manifest.files['invented.md'] = 'a'; writeFileSync(path, JSON.stringify(manifest));
  assert(checkDocuments(store).diagnostics.some(d => d.code === 'output_inventory_mismatch'));
});
