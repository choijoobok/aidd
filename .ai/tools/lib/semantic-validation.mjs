import { actualEvidence, evaluate } from './readiness.mjs';
import { businessEdges, businessKeys } from './business-discovery.mjs';
export function semanticErrors(records) {
  const errors = [], map = new Map(records.map(r => [r.id, r]));
  const fail = (r, code, message) => errors.push({ id: r.id, code, message });
  for (const r of records) {
    for (const rel of [...r.relations, ...businessEdges(r)]) {
      const target = map.get(rel.target); if (!target) { fail(r, 'missing_reference', rel.target); continue; }
      if (rel.selector) {
        const keys = [...businessKeys(target), ...[...(target.definition.attributes ?? []), ...(target.definition.acceptance_criteria ?? [])].map(x => x.key)];
        if (!keys.includes(rel.selector)) fail(r, 'missing_selector', `${rel.target}#${rel.selector}`);
      }
    }
    if (r.type === 'DAT') {
      const attributes = r.definition.attributes ?? [], keys = attributes.map(a => a.key);
      if (new Set(keys).size !== keys.length || attributes.some(a => !a.key || !a.meaning)) fail(r, 'data_attributes', 'stable unique keys and meaning required');
    }
    if (r.type === 'NAV') {
      const entries = r.definition.entries ?? [], keys = new Map(entries.map(e => [e.key, e]));
      for (const entry of entries) {
        if (map.get(entry.screen_ref)?.type !== 'SCR') fail(r, 'navigation_screen', entry.key);
        const seen = new Set([entry.key]); let p = entry.parent_key;
        while (p) { if (seen.has(p) || !keys.has(p)) { fail(r, 'navigation_parent', entry.key); break; } seen.add(p); p = keys.get(p).parent_key; }
      }
    }
    if (r.type === 'WRK' && r.execution?.status === 'completed') {
      if (evaluate(records, r.id, 'development').readiness !== 'ready' || !actualEvidence(records, r, 'implementation')) fail(r, 'unsupported_completion', 'current design and actual implementation evidence required');
    }
    if (r.type === 'MOD' && r.execution?.status === 'completed') fail(r, 'derived_module_state', 'modules have active cycles/operating releases, not a manually completed flag');
    if (r.type === 'CHG' && r.execution?.status === 'completed') {
      const works = records.filter(w => w.type === 'WRK' && w.definition.change === r.id);
      if (!works.length || works.some(w => w.execution?.status !== 'completed' || !actualEvidence(records, w, 'implementation'))) fail(r, 'unsupported_completion', 'all scoped work and actual evidence required');
    }
  }
  return errors;
}
