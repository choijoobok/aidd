import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { digest, recordPath } from './record-contracts.mjs';
import { summary, safePath } from './record-store.mjs';

const PAGE_SIZE = 128;

export function atomicJson(path, value) {
  mkdirSync(dirname(path), { recursive: true }); const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`); renameSync(tmp, path);
}
export function indexData(store, { module } = {}) {
  const view = module ? store.readScope({ module, dependencies: false }) : store.scanAll(), owners = {};
  for (const r of view.records) {
    const key = r.owner.kind === 'project' ? 'project' : r.owner.id;
    (owners[key] ??= []).push(summary(r, view.hashes[recordPath(r)]));
  }
  return { schema_version: 2, snapshot_token: view.snapshot_token, coverage: view.coverage, diagnostics: view.diagnostics, owners };
}
export function rebuildIndex(store, { module } = {}) {
  const data = indexData(store, { module }), root = join(store.base, 'index');
  for (const [owner, records] of Object.entries(data.owners)) {
    const types = [...new Set(records.map(r => r.type))].sort();
    for (const type of types) {
      const rows = records.filter(r => r.type === type), dir = join(root, `owners/${owner}`);
      if (rows.length <= PAGE_SIZE) atomicJson(join(dir, `${type}.json`), { records: rows });
      else {
        const pages = []; for (let i = 0; i < rows.length; i += PAGE_SIZE) { const page = `${type}-${String(i / PAGE_SIZE + 1).padStart(4, '0')}.json`; pages.push(page); atomicJson(join(dir, page), { records: rows.slice(i, i + PAGE_SIZE) }); }
        atomicJson(join(dir, `${type}.json`), { pages, count: rows.length });
      }
    }
    atomicJson(join(root, `owners/${owner}/index.json`), { owner, types, records: records.map(r => r.id) });
  }
  if (module) return { ...data, owners: [module], scope: module };
  const index = { ...data, owners: Object.keys(data.owners).sort() };
  atomicJson(join(root, 'index.json'), index);
  writeFileSync(join(root, 'README.md'), `# Derived record index\n\nDo not edit. Rebuild with index-rebuild.\n\n${index.owners.map(o => `- [${o}](owners/${o}/index.json)`).join('\n')}\n`);
  return index;
}
export function checkIndex(store, { module } = {}) {
  const current = indexData(store, { module }), path = join(store.base, module ? `index/owners/${module}/index.json` : 'index/index.json');
  const diagnostics = [...current.diagnostics];
  if (!existsSync(path)) diagnostics.push({ code: 'index_missing' });
  else try {
    const saved = JSON.parse(readFileSync(path, 'utf8'));
    if (!module && (saved.snapshot_token !== current.snapshot_token || digest(saved.owners) !== digest(Object.keys(current.owners).sort()))) diagnostics.push({ code: 'index_stale' });
    if (module && digest(saved.records?.sort()) !== digest((current.owners[module] ?? []).map(r => r.id).sort())) diagnostics.push({ code: 'index_stale', module });
    for (const [owner, records] of Object.entries(current.owners)) for (const type of new Set(records.map(r => r.type))) {
      const dir = join(store.base, `index/owners/${owner}`), part = JSON.parse(readFileSync(join(dir, `${type}.json`), 'utf8'));
      const rows = part.pages ? part.pages.flatMap(page => JSON.parse(readFileSync(safePath(dir, page), 'utf8')).records) : part.records;
      if (digest(rows) !== digest(records.filter(r => r.type === type))) diagnostics.push({ code: 'index_stale', owner, type });
    }
  } catch (error) { diagnostics.push({ code: 'index_unreadable', message: error.message }); }
  return { diagnostics, coverage: current.coverage, current: diagnostics.length === 0 };
}
