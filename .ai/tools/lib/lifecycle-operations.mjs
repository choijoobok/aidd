import { record, recordPath, contentHash, definitionHash, digest } from './record-contracts.mjs';
import { StoreError } from './record-store.mjs';
import { transact, replayOperation } from './record-transaction.mjs';
import { evaluate, reviewInput, prototypeInput, references, POLICIES } from './readiness.mjs';
import { discoveryIds } from './business-discovery.mjs';

export function readContext(store, id, module) {
  const target = id ? store.readRecord(id) : null;
  const owner = module ?? target?.record?.owner.id;
  if (!owner && !id) return store.scanAll();
  const local = owner ? store.readScope({ module: owner }) : store.readScope({ ids: [id] });
  const common = store.readScope({ owner: 'project', dependencies: false });
  const map = new Map([...local.records, ...common.records].map(r => [r.id, r]));
  // Inspect supporting record kinds of actual foreign dependencies, not unrelated foreign definitions.
  const reads = [local, common], foreign = new Set(local.records.filter(r => r.owner.kind === 'module' && r.owner.id !== owner).map(r => r.owner.id));
  const ids = store.files().filter(p => [...foreign].some(m => p.startsWith(`modules/${m}/`)) && /\/(RVW|TC|EVD|GTR|OI|DRQ|IMP|MRG|MRC|ASM|RSK)\//.test(p)).map(p => p.split('/').at(-1).slice(0, -5));
  if (ids.length) {
    const supports = store.readScope({ ids, dependencies: false }); reads.push(supports);
    const relevant = new Set(local.records.map(r => r.id));
    for (const r of supports.records) {
      const subjects = [...(r.definition.subjects ?? []).map(s => typeof s === 'string' ? s : s.id), ...(r.definition.applies_to ?? []), r.definition.scope_ref, ...r.relations.map(x => x.target)].filter(Boolean);
      if (!subjects.length || subjects.includes('project') || subjects.some(s => relevant.has(s))) map.set(r.id, r);
    }
  }
  const diagnostics = reads.flatMap(r => r.diagnostics), hashes = Object.assign({}, ...reads.map(r => r.hashes));
  return { records: [...map.values()], byId: map, hashes, diagnostics, coverage: { scope_complete: reads.every(r => r.coverage.scope_complete), project_complete: false }, snapshot_token: digest(hashes), read_stats: { bodies: Object.keys(hashes).length } };
}
export function baselineCreate(store, input, operation) {
  const intent = { command: 'baseline-create', input }, replay = replayOperation(store, operation, intent); if (replay) return replay;
  const view = readContext(store, input.scope_ref), target = view.byId.get(input.scope_ref);
  if (!target) throw new StoreError('missing_scope', input.scope_ref);
  if (!['requirements', 'design', 'release', 'foundation'].includes(input.kind)) throw new StoreError('baseline_kind', 'Unknown baseline kind');
  const scope = target.definition.scope ?? {};
  const ids = input.kind === 'requirements' ? [...discoveryIds(target), ...(scope.requirements ?? []), ...(scope.candidates ?? []), ...(scope.governing ?? [])] : input.members;
  if (!Array.isArray(ids) || !ids.length || !view.coverage.scope_complete) throw new StoreError('incomplete_baseline', 'nonempty, fully readable members required');
  const members = [...new Set(ids)].map(id => {
    const r = view.byId.get(id); if (!r) throw new StoreError('missing_member', id);
    const projection = input.kind === 'requirements' && ['FEAT', 'SCR', 'DAT', 'NAV', 'IFC', 'SURF'].includes(r.type) ? 'analysis' : 'definition';
    return { id, projection, content_hash: contentHash(r, projection), blob_hash: view.hashes[recordPath(r)] };
  });
  const b = record('BSL', input.id, target.owner.id, input.title ?? `${input.kind} baseline`, { kind: input.kind, scope_ref: input.scope_ref, members, inputs: input.inputs ?? [], created_at: input.created_at ?? new Date().toISOString() });
  const updates = [{ path: recordPath(b), record: b, expected: null }];
  if (input.kind === 'requirements') {
    const next = structuredClone(target); next.revision++; next.definition.requirements_baseline = b.id;
    updates.push({ path: recordPath(next), record: next, expected: view.hashes[recordPath(target)] });
  }
  return transact(store, { operation, intent, updates, readSet: view.hashes, snapshot: members.map(m => recordPath(view.byId.get(m.id))) });
}
export function reviewRecord(store, input, operation) {
  const intent = { command: 'review-record', input }, replay = replayOperation(store, operation, intent); if (replay) return replay;
  const rvw = input.record ?? input, subjects = rvw.definition?.subjects ?? [];
  if (rvw.type !== 'RVW' || !subjects.length) throw new StoreError('review_contract', 'RVW with explicit reviewed subjects required');
  const views = subjects.map(s => readContext(store, s.id));
  const byId = new Map(views.flatMap(v => v.records).map(r => [r.id, r]));
  const view = { records: [...byId.values()], byId, hashes: Object.assign({}, ...views.map(v => v.hashes)) }, d = rvw.definition;
  if (views.some(v => !v.coverage.scope_complete)) throw new StoreError('review_scope_incomplete', '검토 대상 전체 범위를 읽을 수 없습니다.');
  if (!Number.isInteger(d.sequence) || d.sequence < 1) throw new StoreError('review_contract', 'positive sequence required');
  const earlier = view.records.filter(r => r.type === 'RVW' && r.definition.kind === d.kind && r.definition.subjects?.some(s => subjects.some(x => x.id === s.id)));
  if (earlier.some(r => (r.definition.sequence ?? 1) >= d.sequence)) throw new StoreError('review_sequence', 'sequence must follow earlier overlapping reviews');
  if (!d.decision_source?.reference || !d.method || !d.reviewer || !d.occurred_at || !d.input_digest || !d.per_subject_results || !Array.isArray(d.findings) || !Array.isArray(d.unresolved_refs)) throw new StoreError('review_contract', 'review provenance, input, findings and per-subject results required');
  for (const s of subjects) if (!/^[a-f0-9]{64}$/.test(s.definition_hash ?? '') || !['accepted', 'changes_requested', 'deferred', 'rejected'].includes(d.per_subject_results[s.id])) throw new StoreError('review_contract', s.id);
  const isCurrent = subjects.every(s => view.byId.has(s.id) && definitionHash(view.byId.get(s.id)) === s.definition_hash) && d.input_digest === (d.kind === 'prototype' ? prototypeInput(view.records, subjects[0].id) : reviewInput(view.records, subjects.map(s => s.id), d.kind));
  const updates = [{ path: recordPath(rvw), record: rvw, expected: null }];
  const history = record('HIS', `HIS-${rvw.id.slice(4)}`, rvw.owner.id, rvw.title, { review: rvw.id, subjects, results: d.per_subject_results, current_at_recording: isCurrent, reason: d.method, decided_by: d.reviewer, occurred_at: d.occurred_at, source: d.decision_source });
  updates.push({ path: recordPath(history), record: history, expected: null });
  for (const id of input.resolve ?? []) {
    const item = view.byId.get(id);
    if (!item || !['OI', 'DRQ'].includes(item.type)) throw new StoreError('decision_target', id);
    const applies = item.definition.applies_to ?? [];
    // Partial response only closes explicitly answered, current subjects. Stale replies remain history.
    if (!isCurrent || !applies.length || !applies.every(subject => d.per_subject_results[subject] === 'accepted')) continue;
    const next = structuredClone(item); next.revision++; next.execution = { ...next.execution, status: 'completed', results: [rvw.id] };
    next.definition.status = item.type === 'DRQ' ? 'resolved' : 'closed';
    next.definition.resolution = rvw.id; next.definition.decided_by = d.reviewer; next.definition.resolved_at = d.occurred_at;
    updates.push({ path: recordPath(next), record: next, expected: view.hashes[recordPath(item)] });
  }
  return { ...transact(store, { operation, intent, updates, readSet: view.hashes }), review_current: isCurrent };
}
export function runGate(store, id, gate, operation, evaluated_at = null) {
  const intent = { command: 'gate-run', id, gate, evaluated_at }, replay = replayOperation(store, operation, intent); if (replay) return replay;
  const stage = POLICIES[gate]; if (!stage) throw new StoreError('unknown_gate', gate);
  const view = readContext(store, id), target = view.byId.get(id);
  const expected = ['development','foundation'].includes(stage) ? 'WRK' : stage === 'release' ? 'REL' : 'CHG';
  if (target?.type !== expected) throw new StoreError('gate_scope', `${gate} requires ${expected}, got ${target?.type ?? 'missing'}`);
  const evaluation = evaluate(view.records, id, stage, { ...view, evaluated_at, recording: true });
  const previous = view.records.filter(r => r.type === 'GTR' && r.definition.scope_ref === id && r.definition.gate === gate).sort((a, b) => b.definition.attempt - a.definition.attempt)[0];
  const gtr = record('GTR', `GTR-${operation.toUpperCase()}`, target?.owner.id, `${gate}: ${id}`, { gate, scope_ref: id, attempt: (previous?.definition.attempt ?? 0) + 1, input_digest: evaluation.input_digest, result: evaluation.readiness === 'ready' ? 'passed' : 'blocked', blockers: evaluation.blockers, unknowns: evaluation.unknowns }, previous ? [{ type: 'supersedes', target: previous.id }] : []);
  return { evaluation, transaction: transact(store, { operation, intent, updates: [{ path: recordPath(gtr), record: gtr, expected: null }], readSet: view.hashes }) };
}
