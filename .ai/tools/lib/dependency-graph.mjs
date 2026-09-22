import { digest, definitionHash, recordPath } from './record-contracts.mjs';
import { StoreError } from './record-store.mjs';
import { transact, replayOperation } from './record-transaction.mjs';
import { businessEdges } from './business-discovery.mjs';
import { references } from './readiness.mjs';

const edges = r => {
  const explicit = [...r.relations,...businessEdges(r)];
  if (['CHG','WRK','REL','ARC'].includes(r.type)) for (const target of references(r)) if (!explicit.some(e => e.target === target)) explicit.push({type:'depends_on',target});
  return explicit;
};

export const PROPAGATING = new Set('satisfies presents uses_data consumes uses_foundation implements verifies documents depends_on part_of derived_from performed_by realizes'.split(' '));
export function impactGraph(records, id, { selector, coverage = { project_complete: true } } = {}) {
  const map = new Map(records.map(r => [r.id, r])), incoming = new Map();
  for (const record of records) for (const rel of edges(record)) if (PROPAGATING.has(rel.type)) (incoming.get(rel.target) ?? incoming.set(rel.target, []).get(rel.target)).push({ id: record.id, ...rel });
  const queue = [{ id, selector, path: [id], reasons: [] }], visited = new Set(), candidates = new Map(), cycles = [];
  while (queue.length) {
    const current = queue.shift(), key = `${current.id}#${current.selector ?? '*'} `;
    if (visited.has(key)) continue; visited.add(key);
    for (const edge of incoming.get(current.id) ?? []) {
      if (current.selector && edge.selector && current.selector !== edge.selector) continue;
      const path = [...current.path, edge.id], reasons = [...current.reasons, { type: edge.type, selector: edge.selector ?? null, pinned_baseline: edge.pinned_baseline ?? null }];
      if (current.path.includes(edge.id)) { cycles.push(path); continue; }
      const item = candidates.get(edge.id) ?? { id: edge.id, paths: [], reasons: [], disposition: 'pending' };
      item.paths.push(path); item.reasons.push(reasons); candidates.set(edge.id, item);
      queue.push({ id: edge.id, path, reasons });
    }
  }
  const unresolved = records.flatMap(r => edges(r).filter(rel => PROPAGATING.has(rel.type) && !map.has(rel.target)).map(rel => ({ from: r.id, target: rel.target })));
  return { subject: id, before_hash: null, after_hash: map.has(id) ? definitionHash(map.get(id)) : null, graph_digest: digest(records.filter(r => !['IMP', 'RVW', 'GTR', 'HIS', 'EVD'].includes(r.type)).map(r => [r.id, definitionHash(r)]).sort()), candidates: [...candidates.values()], cycles, unresolved, coverage, readiness: !coverage.project_complete || unresolved.length || !map.has(id) ? 'unknown' : 'review_required' };
}
export function applyImpact(store, input, expected, operation) {
  const intent = { command: 'impact-apply', input, expected }, replay = replayOperation(store, operation, intent); if (replay) return replay;
  const view = store.scanAll(), d = input.definition;
  if (input.type !== 'IMP' || !d?.subject) throw new StoreError('impact_contract', 'IMP and subject required');
  const current = impactGraph(view.records, d.subject, { selector: d.selector, coverage: view.coverage });
  if (current.readiness === 'unknown' || current.graph_digest !== d.graph_digest || current.after_hash !== d.after_hash) throw new StoreError('impact_stale', 'fresh complete graph and subject hashes required');
  const classification = new Map((d.candidates ?? []).map(c => [c.id, c]));
  for (const candidate of current.candidates) {
    const c = classification.get(candidate.id);
    if (!c || !['affected', 'unaffected', 'pending'].includes(c.disposition) || (c.disposition !== 'pending' && !c.reason)) throw new StoreError('impact_classification', candidate.id);
  }
  const updates = [{ path: recordPath(input), record: input, expected }];
  for (const c of d.candidates) if (c.disposition === 'affected' && c.reopen === true) {
    const r = view.byId.get(c.id); if (!r || r.type !== 'WRK') throw new StoreError('impact_reopen', 'only explicitly selected WRK execution can reopen');
    const next = structuredClone(r); next.revision++; next.execution = { ...next.execution, status: 'planned', blocked_by: [input.id] };
    updates.push({ path: recordPath(next), record: next, expected: view.hashes[recordPath(r)] });
  }
  return transact(store, { operation, intent, updates, readSet: view.hashes });
}
