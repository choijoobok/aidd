import { closeSync, fstatSync, lstatSync, openSync, readSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { digest, sha } from './record-contracts.mjs';
import { StoreError } from './record-store.mjs';

export const requireInput = (condition, message) => { if (!condition) throw new StoreError('legacy_input', message, 2); };
export const keyValid = key => typeof key === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/.test(key);
export const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
export const relativeFile = path => typeof path === 'string' && path.length > 0 && !isAbsolute(path) && !path.includes('\\') && !path.includes(':') && path.split('/').every(s => s && s !== '.' && s !== '..');
const TEXT = new Set('.txt .md .mdx .json .jsonl .yaml .yml .xml .html .htm .css .scss .less .js .mjs .cjs .jsx .ts .tsx .vue .svelte .java .kt .cs .fs .go .rs .py .rb .php .sql .sh .ps1 .bat .cmd .c .h .cpp .hpp .properties .ini .toml .csv .graphql .gql .proto .conf'.split(' '));
export function noLinks(path) {
  let cursor = resolve(path);
  while (true) {
    if (lstatSync(cursor).isSymbolicLink()) throw new StoreError('source_link', path);
    const parent = dirname(cursor); if (parent === cursor) break; cursor = parent;
  }
  return realpathSync(path);
}
export function legacyInventory(input) {
  requireInput(object(input) && Array.isArray(input.roots) && input.roots.length > 0 && input.roots.length <= 20, '1..20 roots required');
  const max_entries = input.max_entries ?? 1000, max_bytes = input.max_bytes ?? 1048576, exclude = input.exclude ?? [];
  requireInput(Number.isInteger(max_entries) && max_entries >= 1 && max_entries <= 10000, 'max_entries: 1..10000');
  requireInput(Number.isInteger(max_bytes) && max_bytes >= 1 && max_bytes <= 16777216, 'max_bytes: 1..16777216');
  requireInput(Array.isArray(exclude) && exclude.every(relativeFile), 'exclude requires relative path prefixes, no glob');
  requireInput(exclude.every(p => !/[?*]/.test(p)), 'exclude does not support glob');
  const roots = input.roots.map(r => {
    requireInput(object(r) && keyValid(r.key) && typeof r.path === 'string' && isAbsolute(r.path) && ['source','document','artifact'].includes(r.kind), 'invalid root');
    requireInput(r.revision == null || typeof r.revision === 'string', 'revision must be a declared string');
    return { key: r.key, path: resolve(r.path), kind: r.kind, revision: r.revision ?? null };
  }).sort((a, b) => a.key.localeCompare(b.key, 'en'));
  requireInput(new Set(roots.map(r => r.key)).size === roots.length, 'duplicate root key');
  const entries = [], diagnostics = []; let visits = 0, limited = false;
  const add = e => entries.push(e);
  for (const root of roots) {
    if (limited) { add({ root: root.key, path: '.', status: 'limit', reason: 'entry_limit' }); continue; }
    try { noLinks(root.path); requireInput(lstatSync(root.path).isDirectory(), 'root must be a directory'); }
    catch (e) { add({ root: root.key, path: '.', status: e.code === 'source_link' ? 'link' : 'unreadable', reason: e.code ?? 'root_unreadable' }); continue; }
    function visit(dir, prefix = '', depth = 0) {
      if (depth > 64) { add({ root: root.key, path: prefix, status: 'limit', reason: 'depth_limit' }); return; }
      let items;
      try { items = readdirSync(dir).sort(); }
      catch (e) { add({ root: root.key, path: prefix || '.', status: 'unreadable', reason: e.code ?? 'read_failed' }); return; }
      for (const name of items) {
        const path = prefix ? `${prefix}/${name}` : name, full = join(dir, name), base = { root: root.key, path };
        if (++visits > max_entries) { add({ ...base, status: 'limit', reason: 'entry_limit' }); limited = true; return; }
        if (['.git','node_modules'].includes(name) || exclude.some(p => path === p || path.startsWith(`${p}/`))) { add({ ...base, status: 'excluded', reason: 'excluded_prefix' }); continue; }
        try {
          const stat = lstatSync(full);
          if (stat.isSymbolicLink()) { add({ ...base, status: 'link', reason: 'links_not_followed' }); continue; }
          if (stat.isDirectory()) { visit(full, path, depth + 1); if (limited) return; continue; }
          if (!stat.isFile()) { add({ ...base, status: 'unsupported', reason: 'not_regular_file' }); continue; }
          if (stat.size > max_bytes) { add({ ...base, bytes: stat.size, status: 'oversize', reason: 'byte_limit' }); continue; }
          noLinks(full);
          const fd = openSync(full, 'r'); let raw;
          try {
            const opened = fstatSync(fd);
            if (!opened.isFile() || opened.ino !== stat.ino) throw new StoreError('concurrent_source_change', full);
            const buffer = Buffer.alloc(Math.min(stat.size + 1, max_bytes + 1)); let length = 0, n;
            while (length < buffer.length && (n = readSync(fd, buffer, length, buffer.length - length, null))) length += n;
            raw = buffer.subarray(0, length);
          } finally { closeSync(fd); }
          const after = lstatSync(full);
          if (after.isSymbolicLink() || stat.size !== after.size || stat.mtimeMs !== after.mtimeMs || stat.ino !== after.ino || raw.length > max_bytes) { add({ ...base, status: 'unreadable', reason: 'concurrent_source_change' }); continue; }
          const file = { ...base, bytes: raw.length, sha256: sha(raw) };
          if (!TEXT.has(extname(name).toLowerCase()) || raw.includes(0)) { add({ ...file, status: 'unsupported', reason: 'no_text_extractor' }); continue; }
          let decoded;
          try { decoded = new TextDecoder('utf-8', { fatal: true }).decode(raw); }
          catch { add({ ...file, status: 'unsupported', reason: 'non_utf8' }); continue; }
          add({ ...file, status: 'text', lines: decoded.split(/\r?\n/).length, method: 'utf8_inventory' });
        } catch (e) { add({ ...base, status: 'unreadable', reason: e.code ?? 'read_failed' }); }
      }
    }
    visit(root.path);
  }
  entries.sort((a, b) => `${a.root}/${a.path}`.localeCompare(`${b.root}/${b.path}`, 'en'));
  const counts = Object.fromEntries(['text','unsupported','unreadable','excluded','link','oversize','limit'].map(s => [s, entries.filter(e => e.status === s).length]));
  for (const [status, count] of Object.entries(counts)) if (count && status !== 'text') diagnostics.push({ code: `legacy_${status}`, severity: 'warning', count });
  const result = { schema_version: 1, kind: 'legacy_inventory', scope: { roots, exclude: [...exclude].sort(), max_entries, max_bytes }, entries, counts, coverage: { scope_complete: !counts.unreadable && !counts.limit, semantic_complete: false }, diagnostics };
  return { ...result, digest: digest(result) };
}
export function verifyInventory(inventory) {
  requireInput(object(inventory) && inventory.kind === 'legacy_inventory', 'legacy inventory required');
  const { digest: expected, ...body } = inventory;
  requireInput(expected === digest(body), 'inventory digest mismatch');
  const fresh = legacyInventory(inventory.scope);
  if (fresh.digest !== expected) throw new StoreError('legacy_source_changed', 'Recollect sources and observations before applying.');
  return fresh;
}
