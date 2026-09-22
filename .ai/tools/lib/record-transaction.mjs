import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DEFINITION_TYPES, IMMUTABLE, digest, recordErrors, recordPath, sha } from './record-contracts.mjs';
import { StoreError, safePath } from './record-store.mjs';
import { atomicJson, rebuildIndex } from './record-index.mjs';
import { semanticErrors } from './semantic-validation.mjs';

const bytes = path => existsSync(path) ? readFileSync(path) : null;
const hash = path => { const b = bytes(path); return b === null ? null : sha(b); };
function flushed(path, value) {
  mkdirSync(dirname(path), { recursive: true }); const fd = openSync(path, 'w');
  try { writeFileSync(fd, value); fsyncSync(fd); } finally { closeSync(fd); }
}
function journalPath(store, operation) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(operation ?? '')) throw new StoreError('usage', 'safe --operation is required', 2);
  return join(store.base, 'work/transactions', operation, 'journal.json');
}
function lock(store, recover = false) {
  const path = join(store.base, 'work/write.lock'); mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path) && recover) {
    const owner = JSON.parse(readFileSync(join(path, 'owner.json'), 'utf8'));
    let alive = true; try { process.kill(owner.pid, 0); } catch (e) { alive = e.code === 'EPERM'; }
    if (!alive) { rmSync(join(path, 'owner.json')); rmdirSync(path); }
  }
  try { mkdirSync(path); } catch { throw new StoreError('write_conflict', 'writer lock active; explicit recovery required for abandoned lock', 3); }
  writeFileSync(join(path, 'owner.json'), JSON.stringify({ pid: process.pid }));
  return () => { rmSync(join(path, 'owner.json')); rmdirSync(path); };
}
export function transactionStatus(store, operation) {
  const path = journalPath(store, operation); return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { operation, state: 'missing' };
}
export function replayOperation(store, operation, intent) {
  const path = journalPath(store, operation);
  if (!existsSync(path)) return null;
  const prior = transactionStatus(store, operation);
  if (prior.request_hash !== digest(intent)) throw new StoreError('operation_conflict', 'operation ID already used for another request', 3);
  if (prior.state !== 'committed') throw new StoreError('recovery_required', `${operation}: ${prior.state}`, 3);
  return { ...prior, replayed: true };
}
export function transact(store, { operation, updates, readSet = {}, snapshot = [], fault, intent } = {}) {
  store.requireV2(); const path = journalPath(store, operation);
  const request_hash = digest(intent ?? { updates, readSet, snapshot });
  if (existsSync(path)) {
    const prior = transactionStatus(store, operation);
    if (prior.request_hash !== request_hash) throw new StoreError('operation_conflict', 'operation ID already used for another request', 3);
    if (prior.state === 'committed') return { ...prior, replayed: true };
    throw new StoreError('recovery_required', `${operation}: ${prior.state}`, 3);
  }
  const unlock = lock(store);
  try {
    if (store.pending().length) throw new StoreError('recovery_required', 'recover prepared transaction before writing', 3);
    for (const [p, expected] of Object.entries(readSet)) if (hash(safePath(store.ssot, p)) !== expected) throw new StoreError('write_conflict', p, 3);
    const touched = new Set(), entries = [];
    const remainingIds = new Set(store.files().filter(p => !updates.some(u => u.path === p)).map(p => p.endsWith('/module.json') ? p.split('/').at(-2) : p.split('/').at(-1).slice(0, -5)).map(id => id.toUpperCase()));
    for (const u of updates.filter(u => u.record)) { const id = u.record.id.toUpperCase(); if (remainingIds.has(id)) throw new StoreError('duplicate_id', id); remainingIds.add(id); }
    for (const update of updates) {
      const target = safePath(store.ssot, update.path);
      if (touched.has(update.path)) throw new StoreError('duplicate_write', update.path);
      touched.add(update.path);
      const before = bytes(target), before_hash = before === null ? null : sha(before);
      if (update.expected !== before_hash) throw new StoreError('write_conflict', update.path, 3);
      if (update.record) {
        const errors = recordErrors(update.record);
        if (errors.length || recordPath(update.record) !== update.path) throw new StoreError('record_contract', JSON.stringify(errors));
        if (before && IMMUTABLE.has(update.record.type)) throw new StoreError('immutable_record', update.record.id);
        if (before) {
          const previous = JSON.parse(before);
          if (update.record.id !== previous.id || update.record.type !== previous.type || update.record.revision !== previous.revision + 1) throw new StoreError('revision_conflict', update.record.id, 3);
        }
      }
      const after = update.record ? Buffer.from(`${JSON.stringify(update.record, null, 2)}\n`) : null;
      entries.push({ path: update.path, before_hash, after_hash: after === null ? null : sha(after), before: before?.toString('base64') ?? null, after: after?.toString('base64') ?? null });
    }
    // Keep every previous/current baseline byte image, not only current semantic values.
    for (const entry of entries) for (const [image, h] of [[entry.before, entry.before_hash], [entry.after, entry.after_hash]]) if (image) {
      const r = JSON.parse(Buffer.from(image, 'base64'));
      const snap = safePath(store.base, `snapshots/records/${r.id}/${h}.json`);
      if (!existsSync(snap)) flushed(snap, Buffer.from(image, 'base64'));
    }
    for (const p of snapshot) {
      const raw = readFileSync(safePath(store.ssot, p)), r = JSON.parse(raw), snap = safePath(store.base, `snapshots/records/${r.id}/${sha(raw)}.json`);
      if (!existsSync(snap)) flushed(snap, raw);
    }
    const journal = { schema_version: 2, operation, request_hash, state: 'prepared', entries };
    flushed(path, `${JSON.stringify(journal, null, 2)}\n`);
    fault?.('prepared', 0);
    for (let i = 0; i < entries.length; i++) { install(store, entries[i], 'after'); fault?.('write', i + 1); }
    journal.state = 'committed'; atomicJson(path, journal);
    try { fault?.('index', 0); const index = rebuildIndex(store); journal.index_state = index.coverage.scope_complete ? 'current' : 'stale'; } catch (error) { journal.index_state = 'stale'; journal.index_error = error.message; }
    atomicJson(path, journal); return journal;
  } finally { unlock(); }
}
function install(store, entry, direction) {
  const target = safePath(store.ssot, entry.path), value = entry[direction];
  if (value === null) { if (existsSync(target)) rmSync(target); }
  else { const temp = `${target}.transaction.tmp`; flushed(temp, Buffer.from(value, 'base64')); renameSync(temp, target); }
}
export function recover(store, operation, action) {
  if (!['resume', 'rollback'].includes(action)) throw new StoreError('usage', 'action must be resume or rollback', 2);
  const unlock = lock(store, true);
  try {
    const j = transactionStatus(store, operation);
    if (j.state !== 'prepared') throw new StoreError('recovery_state', j.state, 3);
    for (const e of j.entries) if (![e.before_hash, e.after_hash].includes(hash(safePath(store.ssot, e.path)))) throw new StoreError('recovery_conflict', `later edit preserved: ${e.path}`, 3);
    for (const e of action === 'resume' ? j.entries : [...j.entries].reverse()) install(store, e, action === 'resume' ? 'after' : 'before');
    j.state = action === 'resume' ? 'committed' : 'rolled_back'; atomicJson(journalPath(store, operation), j);
    rebuildIndex(store); return j;
  } finally { unlock(); }
}
export function putRecord(store, r, { operation, expected = null, change, fault } = {}) {
  const intent = { command: 'record-put', record: r, expected, change: change ?? null }, replay = replayOperation(store, operation, intent); if (replay) return replay;
  const view = store.scanAll();
  // Unrelated malformed modules do not prevent a targeted writer. Duplicate IDs do.
  if (view.diagnostics.some(d => d.code === 'duplicate_id')) throw new StoreError('duplicate_id', r.id);
  const previous = view.byId.get(r.id);
  if (r.execution?.status === 'completed') {
    const errors = semanticErrors([...view.records.filter(x => x.id !== r.id), r]).filter(e => e.id === r.id);
    if (errors.length) throw new StoreError('unsupported_completion', JSON.stringify(errors));
  }
  if (previous && recordPath(previous) !== recordPath(r)) throw new StoreError('move_required', r.id);
  if (r.owner.kind === 'module' && r.type !== 'MOD' && !view.byId.has(r.owner.id)) throw new StoreError('missing_owner', r.owner.id);
  for (const rel of r.relations) if (!view.byId.has(rel.target) && rel.target !== r.id) throw new StoreError('missing_reference', rel.target);
  const updates = [{ path: recordPath(r), record: r, expected }];
  if (DEFINITION_TYPES.has(r.type) || r.type === 'POL' && r.definition.kind === 'system_access') {
    const chg = view.byId.get(change);
    if (!chg || chg.type !== 'CHG') throw new StoreError('change_required', 'definition writes require --change');
    const next = structuredClone(chg); next.revision++;
    next.definition.scope ??= {};
    const discoveryGroup = r.type === 'POL' && r.definition.kind === 'system_access' ? 'access_policies' : { SYS: 'overview', CAP: 'capabilities', ACT: 'actors', UC: 'use_cases', BPR: 'processes' }[r.type];
    if (discoveryGroup) {
      const d = next.definition.scope.discovery ??= {};
      if (discoveryGroup === 'overview') {
        if (d.overview && d.overview !== r.id) throw new StoreError('overview_conflict', '기존 SYS 참조를 명시적으로 재검토하세요.');
        d.overview = r.id;
      } else d[discoveryGroup] = { status: 'known', value: [...new Set([...(Array.isArray(d[discoveryGroup]?.value) ? d[discoveryGroup].value : []), r.id])] };
    } else {
      const key = ['REQ', 'NFR'].includes(r.type) ? 'requirements' : 'candidates';
      next.definition.scope[key] = [...new Set([...(next.definition.scope[key] ?? []), r.id])];
    }
    updates.push({ path: recordPath(next), record: next, expected: view.hashes[recordPath(chg)] });
  }
  return transact(store, { operation, updates, fault, intent });
}
export function moveRecord(store, id, owner, expected, operation) {
  const intent = { command: 'record-move', id, owner, expected }, replay = replayOperation(store, operation, intent); if (replay) return replay;
  const view = store.scanAll(), previous = view.byId.get(id);
  if (!previous || IMMUTABLE.has(previous.type) || previous.type === 'MOD') throw new StoreError('move_not_allowed', id);
  if (owner !== 'project' && !view.byId.has(owner)) throw new StoreError('missing_owner', owner);
  const next = structuredClone(previous); next.owner = owner === 'project' ? { kind: 'project' } : { kind: 'module', id: owner }; next.revision++;
  return transact(store, { operation, intent, updates: [{ path: recordPath(previous), expected, record: null }, { path: recordPath(next), expected: null, record: next }] });
}
