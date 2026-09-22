import { existsSync, readdirSync, readFileSync, lstatSync, realpathSync } from 'node:fs';
import { join, resolve, relative, dirname, isAbsolute } from 'node:path';
import { FORMAT, sha, digest, definitionHash, recordErrors, recordPath } from './record-contracts.mjs';
import { references } from './readiness.mjs';

export class StoreError extends Error {
  constructor(code, message, exitCode = 1) { super(message); this.code = code; this.exitCode = exitCode; }
}
export function safePath(base, part) {
  const root = resolve(base), target = resolve(root, part), rel = relative(root, target);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new StoreError('unsafe_path', part);
  let cursor = target;
  while (!existsSync(cursor) && cursor !== root) cursor = dirname(cursor);
  if (existsSync(cursor)) {
    const actual = relative(realpathSync(root), realpathSync(cursor));
    if (actual.startsWith('..') || isAbsolute(actual)) throw new StoreError('unsafe_path', part);
  }
  return target;
}
export function walk(base, prefix = '') {
  if (!existsSync(base)) return [];
  const result = [];
  for (const item of readdirSync(base, { withFileTypes: true })) {
    const path = join(base, item.name), name = `${prefix}${item.name}`;
    if (lstatSync(path).isSymbolicLink()) throw new StoreError('unsafe_path', `symbolic link: ${path}`);
    if (item.isDirectory()) result.push(...walk(path, `${name}/`));
    else if (item.isFile()) result.push(name);
  }
  return result.sort();
}
export class RecordStore {
  constructor(project) { this.project = resolve(project); this.base = join(this.project, '.aidd'); this.ssot = join(this.base, 'ssot'); }
  format() { try { return JSON.parse(readFileSync(join(this.ssot, 'project.json'), 'utf8')).storage_format; } catch { return null; } }
  requireV2() { if (this.format() !== FORMAT) throw new StoreError('migration_required', 'Explicit v2 workspace required; v1 migration is not an automatic Kit upgrade.'); }
  files() { this.requireV2(); return walk(this.ssot).filter(p => p !== 'project.json' && p.endsWith('.json')); }
  pending() {
    const dir = join(this.base, 'work/transactions');
    return walk(dir).filter(p => p.endsWith('/journal.json')).map(p => JSON.parse(readFileSync(join(dir, p), 'utf8'))).filter(j => j.state === 'prepared');
  }
  readScope({ module, owner, ids, dependencies = true, strict = true } = {}) {
    const paths = this.files(), records = [], diagnostics = [], byId = new Map(), loaded = new Set(), bytes = new Map();
    const metadata = new Map();
    for (const path of paths) {
      const parts = path.split('/');
      const id = parts.at(-1) === 'module.json' ? parts.at(-2) : parts.at(-1).slice(0, -5);
      if (metadata.has(id.toUpperCase())) diagnostics.push({ code: 'duplicate_id', id });
      metadata.set(id.toUpperCase(), path);
    }
    const selected = ids ? ids.map(id => metadata.get(id.toUpperCase()) ?? { missing: id }) : paths.filter(p => module ? p.startsWith(`modules/${module}/`) : owner === 'project' ? p.startsWith('common/') : true);
    if (module && !metadata.has(module.toUpperCase())) selected.push({ missing: module });
    const queue = [...selected];
    while (queue.length) {
      const path = queue.shift();
      if (path?.missing) { diagnostics.push({ code: 'missing_reference', id: path.missing }); continue; }
      if (loaded.has(path)) continue;
      loaded.add(path);
      try {
        const raw = readFileSync(safePath(this.ssot, path)); bytes.set(path, sha(raw));
        const r = JSON.parse(raw.toString('utf8')), errors = recordErrors(r);
        diagnostics.push(...errors.map(e => ({ ...e, path })));
        if (errors.length) continue;
        if (recordPath(r) !== path) diagnostics.push({ code: 'path_mismatch', id: r.id, path });
        records.push(r); byId.set(r.id, r);
        if (raw.length > 32768 || raw.toString().split('\n').length > 400) diagnostics.push({ code: 'split_warning', severity: 'warning', id: r.id, path });
        if (dependencies) {
          const targets = [...references(r), ...(r.owner.kind === 'module' && r.type !== 'MOD' ? [r.owner.id] : [])];
          for (const target of targets) queue.push(metadata.get(target.toUpperCase()) ?? { missing: target });
        }
      } catch (error) { diagnostics.push({ code: 'unreadable_record', path, message: error.message }); }
    }
    for (const journal of this.pending()) if (journal.entries.some(e => loaded.has(e.path))) diagnostics.push({ code: 'recovery_required', operation: journal.operation });
    if (strict) for (const [path, hash] of bytes) if (!existsSync(join(this.ssot, path)) || sha(readFileSync(join(this.ssot, path))) !== hash) diagnostics.push({ code: 'concurrent_read', path });
    const complete = !diagnostics.some(d => d.severity !== 'warning');
    return { records, byId, diagnostics, coverage: { scope_complete: complete, project_complete: !module && !owner && !ids && complete }, snapshot_token: digest([...bytes].sort()), read_stats: { enumerated: paths.length, bodies: loaded.size }, hashes: Object.fromEntries(bytes) };
  }
  scanAll() { return this.readScope(); }
  readRecord(id) { const result = this.readScope({ ids: [id], dependencies: false }); return { ...result, record: result.byId.get(id) }; }
  at(id, baseline) {
    const b = this.readRecord(baseline).record, member = b?.definition?.members?.find(m => m.id === id);
    if (!member || !/^[a-f0-9]{64}$/.test(member.blob_hash)) throw new StoreError('snapshot_missing', `${baseline}: ${id}`);
    const raw = readFileSync(safePath(this.base, `snapshots/records/${id}/${member.blob_hash}.json`));
    if (sha(raw) !== member.blob_hash) throw new StoreError('snapshot_corrupt', id);
    return JSON.parse(raw.toString('utf8'));
  }
}
export function summary(r, blob_hash) { return { id: r.id, type: r.type, owner: r.owner, title: r.title, path: recordPath(r), blob_hash, definition_hash: definitionHash(r), relations: r.relations }; }
