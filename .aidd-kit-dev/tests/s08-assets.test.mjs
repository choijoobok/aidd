import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const base = '.aidd-kit-dev/plans/modular-lifecycle';
const hash = s => createHash('sha256').update(s).digest('hex');
const walk = (dir,prefix='') => readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(join(dir,e.name),`${prefix}${e.name}/`) : [`${prefix}${e.name}`]);
test('S08 processing map covers each frozen S03 asset exactly once without rewriting approvals',() => {
  const inventory = JSON.parse(readFileSync(`${base}/design/assets.json`));
  const expected = inventory.shards.flatMap(s => JSON.parse(readFileSync(`${base}/design/${s.path}`)).files.map(f => f.path));
  const actual = inventory.shards.flatMap(s => JSON.parse(readFileSync(`${base}/integration/${s.path}`)).files);
  const s09 = JSON.parse(readFileSync(`${base}/integration/S09-disposition.json`));
  const pending = actual.filter(f => f.disposition === 'S09_remaining');
  const resolved = s09.rules.flatMap(rule => {
    if(!rule.source_manifest)return (rule.paths ?? []).map(path => ({ path, disposition: rule.disposition }));
    const files = JSON.parse(readFileSync(`${base}/integration/${rule.source_manifest}`)).files.filter(f => f.disposition === 'S09_remaining');
    assert.equal(files.length,rule.expected_count,rule.source_manifest); return files.map(f => ({ path: f.path, disposition: rule.disposition }));
  });
  assert.equal(expected.length,367); assert.equal(new Set(actual.map(f => f.path)).size,367); assert.deepEqual(actual.map(f => f.path).sort(),expected.sort());
  assert.equal(pending.length,s09.expected_pending_count); assert.equal(resolved.length,pending.length); assert.deepEqual(resolved.map(x=>x.path).sort(),pending.map(x=>x.path).sort());
  const disposition = new Map(resolved.map(item => [item.path,item.disposition]));
  for (const f of actual) { if(disposition.get(f.path)==='retired_removed')assert(!existsSync(f.path),f.path);else assert(existsSync(f.path),f.path); assert(['updated_or_regenerated','reviewed_retained','S09_remaining'].includes(f.disposition)); assert(f.verification); }
  for(const path of s09.additions)assert(existsSync(path),path);
  for (const [folder,expectedHash] of [['requirements','a2095880cbf056238fd6c7a8bc71829caf88c607ed6cb214006531959770fff3'],['design','a7a9ccfe3354b1e0cf46a47ff361eeda53dae4e158f4a79c748a9dc6383ae653']]) {
    const files = walk(`${base}/${folder}`).sort((a,b) => a.localeCompare(b));
    const digest = hash(files.map(p => `${p}\t${hash(readFileSync(`${base}/${folder}/${p}`))}\n`).join(''));
    assert.equal(digest,expectedHash,folder);
  }
});
test('all portable skill entry points link the same executable v2 contract',() => {
  const dirs = readdirSync('.ai/skills',{withFileTypes:true}).filter(e => e.isDirectory()); assert.equal(dirs.length,17);
  for (const e of dirs) { const source = readFileSync(`.ai/skills/${e.name}/SKILL.md`,'utf8'); assert(source.includes('../../../.ai/spec/specialty-integration.md'),e.name); assert(!source.includes('ssot/open-items.json')); assert(!source.includes('ssot/workboard.json')); for (const root of ['.ai','.agents','.claude']) assert(existsSync(join(root,'skills',e.name,'../../../.ai/spec/specialty-integration.md'))); }
});
