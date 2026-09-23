import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { record, recordPath, sha } from '../../.ai/tools/lib/record-contracts.mjs';
import { putRecord } from '../../.ai/tools/lib/record-transaction.mjs';
import { RecordStore } from '../../.ai/tools/lib/record-store.mjs';
import { bootstrapV2 } from '../../.ai/tools/lib/owned-cli.mjs';

test('real public CLI bootstraps v2, rejects unsupported options, and never falls back to a legacy writer', t => {
  const root = mkdtempSync(join(tmpdir(), 'aidd-cli-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, '.ai'), { recursive: true }); cpSync(resolve('.ai/tools'), join(root, '.ai/tools'), { recursive: true }); cpSync(resolve('.ai/templates'), join(root, '.ai/templates'), { recursive: true }); cpSync(resolve('.ai/manifests'), join(root, '.ai/manifests'), { recursive: true });
  writeFileSync(join(root, '.aidd-role.json'), JSON.stringify({ role: 'kit-template' }));
  const run = args => spawnSync(process.execPath, [join(root, '.ai/tools/aidd.mjs'), ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, AIDD_LIBRARY_MODE: '0' } });
  for (const args of [[], ['--help'], ['record-put', '--help']]) {
    const help = run(args); assert.equal(help.status, 0, help.stderr); assert.match(help.stdout, /사용법:/);
  }
  let result = run(['project-bootstrap', '--project-id', 'PRJ-CLI', '--name', 'CLI test']); assert.equal(result.status, 0, result.stderr);
  result = run(['record-history', '--id', 'HIS-X']); assert.equal(result.status, 2); assert.match(result.stderr, /--occurred-at/);
  result = run(['add-module', '--id', 'MOD-A', '--name', 'A', '--purpose', 'First module']); assert.equal(result.status, 0, result.stderr);
  result = run(['record-read', '--id', 'MOD-A', '--format', 'json']); assert.equal(result.status, 0, result.stderr); assert.match(JSON.parse(result.stdout).data.definition_hash, /^[a-f0-9]{64}$/);
  result = run(['status', '--module', 'MOD-A', '--format', 'text']); assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, /planned/);
  assert.equal(run(['module-status', '--module', 'MOD-A', '--status', 'done']).status, 1);
  assert.equal(run(['status', '--invented', 'yes']).status, 2);
  result = run(['generate', '--module', 'MOD-A']); assert.equal(result.status, 0, result.stderr);
  result = run(['documentation-check', '--module', 'MOD-A']); assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(readFileSync(join(root, 'project/.aidd/ssot/project.json'))).storage_format, 'owned-records-v2');
});

test('two actual Node writers cannot silently overwrite the same expected revision', async t => {
  const root = mkdtempSync(join(tmpdir(), 'aidd-race-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  bootstrapV2(root, { 'project-id': 'PRJ-RACE', name: 'race' }); const store = new RecordStore(join(root, 'project'));
  const mod = record('MOD', 'MOD-A', 'MOD-A', 'original'); putRecord(store, mod, { operation: 'seed' });
  const expected = sha(readFileSync(join(store.ssot, recordPath(mod)))), storeURL = pathToFileURL(resolve('.ai/tools/lib/record-store.mjs')).href, writerURL = pathToFileURL(resolve('.ai/tools/lib/record-transaction.mjs')).href;
  const code = `import {RecordStore} from ${JSON.stringify(storeURL)};import {putRecord} from ${JSON.stringify(writerURL)};const s=new RecordStore(process.argv[1]);const r=s.readRecord('MOD-A').record;r.revision=2;r.title=process.argv[3];try{putRecord(s,r,{operation:process.argv[3],expected:process.argv[2]});}catch(e){process.stderr.write(e.code);process.exitCode=e.exitCode??1;}`;
  const run = name => new Promise(resolveResult => { const child = spawn(process.execPath, ['--input-type=module', '-e', code, store.project, expected, name]); let error = ''; child.stderr.on('data', d => error += d); child.on('error', e => resolveResult({ status: null, error: e.message })); child.on('exit', status => resolveResult({ status, error })); });
  const results = await Promise.all([run('writer-a'), run('writer-b')]); assert.deepEqual(results.map(r => r.status).sort(), [0, 3], JSON.stringify(results)); assert.equal(store.readRecord('MOD-A').record.revision, 2);
});

test('public record-put retries preserve one revision and one operation', t => {
  const root = mkdtempSync(join(tmpdir(), 'aidd-retry-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  bootstrapV2(root, { 'project-id': 'PRJ-RETRY', name: 'retry' }); const store = new RecordStore(join(root, 'project')), mod = record('MOD', 'MOD-A', 'MOD-A', 'A');
  putRecord(store, mod, { operation: 'create' }); assert.equal(putRecord(store, mod, { operation: 'create' }).replayed, true);
  const chg = record('CHG', 'CHG-A', 'MOD-A', 'Cycle', { scope: { requirements: [] } }); putRecord(store, chg, { operation: 'change' });
  const req = record('REQ', 'REQ-A', 'MOD-A', 'Draft'); putRecord(store, req, { operation: 'req', change: 'CHG-A' });
  const revision = store.readRecord('CHG-A').record.revision; assert.equal(putRecord(store, req, { operation: 'req', change: 'CHG-A' }).replayed, true); assert.equal(store.readRecord('CHG-A').record.revision, revision);
});
