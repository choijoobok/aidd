import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

test('all portable skill entry points link the same executable v2 contract',() => {
  const dirs = readdirSync('.ai/skills',{withFileTypes:true}).filter(e => e.isDirectory()); assert.equal(dirs.length,17);
  for (const e of dirs) { const source = readFileSync(`.ai/skills/${e.name}/SKILL.md`,'utf8'); assert(source.includes('../../../.ai/spec/specialty-integration.md'),e.name); assert(!source.includes('ssot/open-items.json')); assert(!source.includes('ssot/workboard.json')); for (const root of ['.ai','.agents','.claude']) assert(existsSync(join(root,'skills',e.name,'../../../.ai/spec/specialty-integration.md'))); }
});
