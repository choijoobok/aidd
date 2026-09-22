import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const run = (name, tool_input) => spawnSync(process.execPath, [fileURLToPath(new URL(`../../.ai/hooks/${name}.mjs`, import.meta.url))], { input: JSON.stringify({ tool_input }), encoding: 'utf8' });
test('both providers protect indexes/snapshots and do not exempt writes disguised as generator content', () => {
  for (const provider of ['codex', 'claude']) for (const target of ['project/.aidd/index/index.json', 'project/.aidd/snapshots/records/REQ-A/hash.json']) {
    assert.equal(run(`${provider}-protect-file`, { file_path: target, content: 'node .ai/tools/aidd.mjs generate' }).status, 2);
    assert.equal(run(`${provider}-protect-shell`, { command: `echo aidd.mjs generate > ${target}` }).status, 2);
    assert.equal(run(`${provider}-protect-shell`, { command: `Get-Content ${target}` }).status, 0);
  }
  const patch = '*** Begin Patch\n*** Update File: .ai/hooks/README.md\n@@\n+The index is project/.aidd/index/index.json\n*** End Patch';
  assert.equal(run('codex-protect-file', patch).status, 0);
  assert.equal(run('codex-protect-file', patch.replace('.ai/hooks/README.md', 'project/.aidd/index/index.json')).status, 2);
});
