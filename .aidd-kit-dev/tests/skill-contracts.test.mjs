import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { V2_COMMANDS } from '../../.ai/tools/lib/owned-cli.mjs';

test('all portable skill entry points link the same executable v2 contract',() => {
  const dirs = readdirSync('.ai/skills',{withFileTypes:true}).filter(e => e.isDirectory()); assert.equal(dirs.length,17);
  for (const e of dirs) { const source = readFileSync(`.ai/skills/${e.name}/SKILL.md`,'utf8'); assert(source.includes('../../../.ai/spec/specialty-integration.md'),e.name); assert(!source.includes('ssot/open-items.json')); assert(!source.includes('ssot/workboard.json')); for (const root of ['.ai','.agents','.claude']) assert(existsSync(join(root,'skills',e.name,'../../../.ai/spec/specialty-integration.md'))); }
});

test('project guidance only presents executable aidd.mjs commands', async () => {
  const previous = process.env.AIDD_LIBRARY_MODE;
  process.env.AIDD_LIBRARY_MODE = '1';
  let commands;
  try { ({ KNOWN_COMMANDS: commands } = await import('../../.ai/tools/aidd.mjs')); }
  finally { if (previous === undefined) delete process.env.AIDD_LIBRARY_MODE; else process.env.AIDD_LIBRARY_MODE = previous; }
  const available = new Set([...commands, ...V2_COMMANDS]);
  const files = ['.aidd-kit-dev/export/README.md', '.aidd-kit-dev/export/AGENTS.md'];
  const collect = root => { for (const entry of readdirSync(root, { withFileTypes: true })) { const path = join(root, entry.name); if (entry.isDirectory()) collect(path); else if (entry.isFile() && path.endsWith('.md')) files.push(path); } };
  collect('.ai/docs/guides'); collect('.ai/skills');
  const unknown = [];
  for (const path of files) for (const match of readFileSync(path, 'utf8').matchAll(/node\s+\.ai\/tools\/aidd\.mjs\s+([a-z][a-z0-9-]*)/g)) if (!available.has(match[1])) unknown.push(`${path}: ${match[1]}`);
  assert.deepEqual(unknown, []);
});
