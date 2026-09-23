import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { assembleProduct, distributionErrors, validateExportTree } from '../tools/kit.mjs';

const kit = resolve('.aidd-kit-dev/tools/kit.mjs');
const cleanup = (t, root) => t.after(() => rmSync(root, { recursive: true, force: true }));

test('exported CI checks templates without running product generation and runs portable tests once', () => {
  const workflow = readFileSync('.aidd-kit-dev/export/.github/workflows/aidd.yml', 'utf8');
  assert.match(workflow, /if: steps\.workspace\.outputs\.role == 'product-workspace'/);
  assert.match(workflow, /test ! -e project\/\.aidd\/ssot\/project\.json/);
  assert.equal((workflow.match(/node --test \.ai\/tests\/\*\.test\.mjs/g) ?? []).length, 1);
});

test('S09 distribution fixture covers v2 new-project flow and directory/ZIP parity', async () => {
  assert.deepEqual(await distributionErrors(), []);
});

test('new-project validation rejects legacy and mixed SSOT instead of accepting a compatibility fallback', async t => {
  const root = mkdtempSync(join(tmpdir(), 'aidd-s09-format-')); cleanup(t, root);
  const stage = join(root, 'product'); mkdirSync(stage);
  await assembleProduct(stage, { project_id: 'PRJ-S09', name: 'S09 format', mode: 'greenfield', source_location: '' });
  const projectPath = join(stage, 'project/.aidd/ssot/project.json');
  const project = JSON.parse(readFileSync(projectPath, 'utf8'));
  project.schema_version = 1; delete project.storage_format;
  writeFileSync(projectPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
  writeFileSync(join(stage, 'project/.aidd/ssot/terminology.json'), '{"schema_version":1,"terms":[]}\n', 'utf8');
  const errors = validateExportTree(stage, true);
  assert.ok(errors.some(error => error.includes('must use owned-records-v2')), errors.join('\n'));
  assert.ok(errors.some(error => error.includes('mixes legacy root records: terminology.json')), errors.join('\n'));
});

test('export and new-project refuse existing outputs without modifying them', t => {
  const root = mkdtempSync(join(tmpdir(), 'aidd-s09-overwrite-')); cleanup(t, root);
  for (const [command, extra] of [
    ['export', []],
    ['new-project', ['--project-id', 'PRJ-S09', '--name', 'S09 overwrite']]
  ]) {
    const target = join(root, command); mkdirSync(target); const sentinel = join(target, 'keep.txt'); writeFileSync(sentinel, 'keep\n', 'utf8');
    const result = spawnSync(process.execPath, [kit, command, '--directory', target, ...extra], { encoding: 'utf8' });
    assert.equal(result.status, 2, result.stderr || result.stdout);
    assert.match(result.stderr, /refusing to overwrite/);
    assert.equal(readFileSync(sentinel, 'utf8'), 'keep\n');
    assert.equal(existsSync(join(target, '.ai')), false);
  }
});
