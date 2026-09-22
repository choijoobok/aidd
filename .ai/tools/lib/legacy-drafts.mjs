import { DEFINITION_FIELDS, digest, record, recordErrors, recordPath, idValid } from './record-contracts.mjs';
import { StoreError } from './record-store.mjs';
import { replayOperation, transact } from './record-transaction.mjs';
import { references } from './readiness.mjs';
import { semanticErrors } from './semantic-validation.mjs';
import { keyValid, object, requireInput, relativeFile, verifyInventory } from './legacy-inventory.mjs';

const TYPES = new Set('MOD SYS CAP ACT POL UC BPR REQ NFR FEAT SCR DAT NAV IFC'.split(' '));
const RAW = { MOD: ['purpose','public_contracts','operating_baseline'], ACT: ['kind','goals'], BPR: ['steps','transitions','initial','terminals'], REQ: ['acceptance_criteria','applicability'], NFR: ['acceptance_criteria','applicability'], POL: ['channel','rules'], DAT: ['attributes'], NAV: ['entries'] };
const ARRAYS = new Set(['goals','steps','transitions','terminals','acceptance_criteria','rules','attributes','entries','public_contracts']);
const fieldsFor = type => (type === 'POL' ? 'channel entry authentication authorization rules' : type === 'IFC' ? 'purpose analysis protocol operations inputs outputs errors versioning' : DEFINITION_FIELDS[type]).split(' ');
const unknown = () => ({ status: 'unknown' });
const known = value => ({ status: 'known', value });
const stableId = (type, namespace, key) => `${type}-RE-${digest([namespace, key]).slice(0, 24).toUpperCase()}`;
const freshField = (type, field) => RAW[type]?.includes(field) ? field === 'applicability' ? {} : ARRAYS.has(field) ? [] : '' : unknown();
const relation = (type, target) => ({ type, target });
function assertFields(input, allowed, label) { requireInput(object(input) && Object.keys(input).every(k => allowed.includes(k)), `unsupported ${label} fields`); }
function resolveRefs(value, ids) {
  if (Array.isArray(value)) return value.map(v => resolveRefs(v, ids));
  if (!object(value)) return value;
  if ('$ref' in value) { requireInput(Object.keys(value).length === 1 && ids.has(value.$ref), `unknown candidate reference ${value.$ref}`); return ids.get(value.$ref); }
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveRefs(v, ids)]));
}
function validateAnalysis(analysis, inventory) {
  assertFields(analysis, ['namespace','batch','title','observations','candidates'], 'analysis');
  requireInput(keyValid(analysis.namespace) && keyValid(analysis.batch) && typeof analysis.title === 'string' && analysis.title.trim(), 'namespace/batch/title required');
  requireInput(Array.isArray(analysis.observations) && analysis.observations.length <= 300 && Array.isArray(analysis.candidates) && analysis.candidates.length > 0 && analysis.candidates.length <= 100, 'bounded observations (0..300) and candidates (1..100) required');
  const observations = new Map(), ids = new Map(), files = new Map(inventory.entries.map(e => [`${e.root}/${e.path}`, e]));
  for (const o of analysis.observations) {
    assertFields(o, ['key','kind','status','summary','method','anchors','value'], 'observation');
    requireInput(keyValid(o.key) && !observations.has(o.key), 'unique observation key required');
    requireInput(['ui_route','api','job','event','external_integration','data','document','other'].includes(o.kind) && ['observed','inferred','unknown'].includes(o.status), 'observation kind/status');
    requireInput(typeof o.summary === 'string' && o.summary.trim() && typeof o.method === 'string' && o.method.trim() && Array.isArray(o.anchors), 'observation summary/method/anchors required');
    requireInput(o.status === 'unknown' || o.anchors.length > 0, 'observed/inferred needs evidence anchors');
    for (const a of o.anchors) {
      assertFields(a, ['root','path','sha256','start_line','end_line','symbol','section'], 'anchor');
      const file = files.get(`${a.root}/${a.path}`);
      requireInput(relativeFile(a.path) && file?.status === 'text' && file.sha256 === a.sha256, 'anchor must identify collected UTF-8 source hash');
      requireInput(Number.isInteger(a.start_line) && Number.isInteger(a.end_line) && a.start_line >= 1 && a.end_line >= a.start_line && a.end_line <= file.lines, 'anchor line range');
      requireInput(['symbol','section'].every(k => a[k] === undefined || typeof a[k] === 'string'), 'anchor labels must be strings');
    }
    observations.set(o.key, o);
  }
  for (const c of analysis.candidates) {
    assertFields(c, ['key','type','owner','title','fields','relations'], 'candidate');
    requireInput(keyValid(c.key) && !ids.has(c.key) && TYPES.has(c.type) && typeof c.title === 'string' && c.title.trim() && object(c.fields), 'candidate key/type/title/fields');
    requireInput(Object.keys(c.fields).every(k => fieldsFor(c.type).includes(k)), `unsupported ${c.type} fields`);
    ids.set(c.key, stableId(c.type, analysis.namespace, `candidate:${c.key}`));
  }
  return { observations, ids };
}
export function buildLegacyRecords(analysis, inventory) {
  const { observations, ids } = validateAnalysis(analysis, inventory), ns = analysis.namespace;
  const ldpId = stableId('LDP', ns, `batch:${analysis.batch}`), changeId = stableId('CHG', ns, `batch:${analysis.batch}`), records = [], issues = [];
  const obsId = key => stableId('SURF', ns, `batch:${analysis.batch}:observation:${key}`);
  // SURF uses the existing analysis projection in requirement review digests.
  // Keep all observation meaning and anchors inside that projection.
  for (const o of observations.values()) records.push(record('SURF', obsId(o.key), null, o.summary, { kind: 'legacy_observation', analysis: o }, [relation('depends_on', ldpId)]));
  const inventoryIds = [];
  for (let i = 0; i < inventory.entries.length; i += 25) {
    const id = stableId('DOC', ns, `batch:${analysis.batch}:inventory:${i / 25}`); inventoryIds.push(id);
    records.push(record('DOC', id, null, `자료 목록 ${i / 25 + 1}`, { kind: 'legacy_inventory', entries: inventory.entries.slice(i, i + 25) }));
  }
  const candidateRecords = [];
  for (const c of analysis.candidates) {
    const id = ids.get(c.key), ownerValue = resolveRefs(c.owner, ids), owner = c.type === 'MOD' ? id : ownerValue === 'project' ? null : ownerValue;
    requireInput(c.type === 'MOD' || c.owner !== undefined && (owner === null || typeof owner === 'string' && /^MOD-[A-Z0-9-]+$/.test(owner)), 'candidate owner required');
    requireInput(c.type !== 'SYS' || owner === null, 'SYS is project-owned');
    const def = Object.fromEntries(fieldsFor(c.type).map(f => [f, freshField(c.type, f)]));
    if (c.type === 'POL') def.kind = 'system_access';
    const mapping = {}, unresolved = [];
    for (const field of fieldsFor(c.type)) {
      const keys = c.fields[field] ?? [];
      requireInput(Array.isArray(keys) && keys.every(k => observations.has(k)) && new Set(keys).size === keys.length, 'field maps to unique observation keys');
      const values = keys.map(k => observations.get(k)), withValue = values.filter(o => o.value !== undefined && o.value !== null);
      const status = new Set(withValue.map(o => digest(o.value))).size > 1 ? 'conflicting' : !values.length || withValue.length !== values.length || values.some(o => o.status === 'unknown') ? 'unknown' : values.some(o => o.status === 'inferred') ? 'inferred' : 'observed';
      mapping[field] = { status, observations: keys.map(obsId) };
      if (status === 'observed') {
        const value = resolveRefs(values[0].value, ids), raw = RAW[c.type]?.includes(field);
        const objectArray = (raw && ARRAYS.has(field) && !['terminals','public_contracts'].includes(field)) || (c.type === 'UC' && ['main_flow','alternatives','exceptions'].includes(field)) || (c.type === 'SCR' && ['fields','actions','view_states','transitions','prototype_scenarios'].includes(field));
        if (objectArray) requireInput(Array.isArray(value) && value.every(object), `${c.type}.${field} requires objects in an array`);
        else if (raw) requireInput(field === 'applicability' ? object(value) : ARRAYS.has(field) ? Array.isArray(value) && value.every(v => typeof v === 'string') : typeof value === 'string', `${c.type}.${field} shape`);
        def[field] = raw ? value : known(value);
      }
      else unresolved.push({ field, status });
    }
    const mappingId = stableId('DOC', ns, `batch:${analysis.batch}:mapping:${c.key}`);
    const rels = c.relations ?? [];
    requireInput(Array.isArray(rels), 'relations must be array');
    for (const rel of rels) assertFields(rel, ['type','target','selector'], 'relation');
    const r = record(c.type, id, owner, c.title, def, [...resolveRefs(rels, ids), relation('depends_on', mappingId)]);
    requireInput(recordErrors(r).length === 0, `invalid candidate record ${c.key}`);
    records.push(record('DOC', mappingId, owner, `${c.title} — 근거 대응`, { kind: 'legacy_mapping', subject: id, analysis: ldpId, fields: mapping, decision: 'unreviewed', interpretation: 'as_is_candidate_not_target_requirement' }, [...new Set(Object.values(mapping).flatMap(m => m.observations))].map(x => relation('depends_on', x)).concat(relation('depends_on', ldpId))));
    const oiId = stableId('OI', ns, `batch:${analysis.batch}:review:${c.key}`);
    records.push(record('OI', oiId, owner, `${c.title} — 사용자 검토 필요`, { status: 'open', blocking: true, question: '현행 관측과 의도한 요구를 구분하고 부족한 내용을 확인하세요.', applies_to: [id, changeId], unresolved_fields: unresolved }, [relation('applies_to', id), relation('applies_to', changeId)]));
    candidateRecords.push(r); issues.push({ subject: id, open_item: oiId, review: 'unreviewed', fields: unresolved });
  }
  records.push(...candidateRecords);
  const byType = type => candidateRecords.filter(r => r.type === type).map(r => r.id);
  requireInput(byType('SYS').length <= 1, 'one SYS per batch');
  const modules = [...new Set(candidateRecords.filter(r => r.owner.kind === 'module').map(r => r.owner.id))].sort();
  const listing = type => byType(type).length ? known(byType(type)) : unknown();
  records.push(record('CHG', changeId, modules.length === 1 ? modules[0] : null, analysis.title, {
    purpose: '레거시 자료 기반 정본 초안·사용자 검토', delivery_path: 'legacy_documentation', modules,
    scope: { requirements: [...byType('REQ'), ...byType('NFR')], candidates: ['FEAT','SCR','DAT','NAV','IFC'].flatMap(byType), governing: [],
      discovery: { overview: byType('SYS')[0] ?? null, capabilities: listing('CAP'), actors: listing('ACT'), access_policies: listing('POL'), use_cases: listing('UC'), processes: listing('BPR') },
      inventory: Object.fromEntries(Object.entries({ features:'FEAT', screens:'SCR', data:'DAT', navigation:'NAV', interfaces:'IFC' }).map(([k, t]) => [k, listing(t)])) },
  }, [relation('depends_on', ldpId)]));
  const counts = { candidates: candidateRecords.length, observations: observations.size, ...Object.fromEntries(['observed','inferred','unknown'].map(s => [s, [...observations.values()].filter(o => o.status === s).length])), conflicting_fields: issues.flatMap(i => i.fields).filter(f => f.status === 'conflicting').length, unreviewed: candidateRecords.length };
  records.push(record('LDP', ldpId, null, analysis.title, { kind: 'reverse_engineering', namespace: ns, batch: analysis.batch, scope: inventory.scope, inventory_digest: inventory.digest, source_counts: inventory.counts, coverage: inventory.coverage, counts, source_semantics: 'as_is_unreviewed', runtime_verification: 'not_run' }, inventoryIds.map(id => relation('depends_on', id))));
  for (const r of records) requireInput(!recordErrors(r).length && Buffer.byteLength(JSON.stringify(r, null, 2)) <= 32768, `record invalid/too large; split analysis: ${r.id}`);
  requireInput(new Set(records.map(r => r.id)).size === records.length, 'generated ID collision');
  return { records: records.sort((a, b) => a.id.localeCompare(b.id, 'en')), change: changeId, analysis_record: ldpId, ids: Object.fromEntries(ids), issues, counts };
}
function compareStore(store, built) {
  const view = store.scanAll();
  if (!view.coverage.scope_complete) throw new StoreError('legacy_store_incomplete', 'Repair malformed records or prepared transactions first.');
  const all = new Map([...view.byId, ...built.records.map(r => [r.id, r])]), creates = [], unchanged = [];
  for (const r of built.records) {
    const previous = view.byId.get(r.id);
    if (previous && digest(previous) !== digest(r)) throw new StoreError('legacy_existing_conflict', `Existing record preserved: ${r.id}`);
    (previous ? unchanged : creates).push(r.id);
    if (r.owner.kind === 'module' && all.get(r.owner.id)?.type !== 'MOD') throw new StoreError('missing_owner', r.owner.id);
    for (const id of [...references(r), ...r.relations.map(rel => rel.target)]) if (!idValid(id) || !all.has(id)) throw new StoreError('missing_reference', id);
  }
  const generated = new Set(built.records.map(r => r.id)), errors = semanticErrors([...all.values()]).filter(e => generated.has(e.id));
  requireInput(errors.length === 0, `invalid draft links/shape: ${JSON.stringify(errors)}`);
  const visited = new Set(), queue = [...generated], read_set = {};
  while (queue.length) {
    const id = queue.shift(); if (visited.has(id)) continue; visited.add(id);
    const r = all.get(id); if (!r) throw new StoreError('missing_reference', id);
    if (view.byId.has(id)) read_set[recordPath(r)] = view.hashes[recordPath(r)];
    queue.push(...references(r), ...r.relations.map(rel => rel.target));
    if (r.owner.kind === 'module') queue.push(r.owner.id);
  }
  return { read_set, creates, unchanged };
}
export function legacyDraft(store, analysis, inventory) {
  verifyInventory(inventory);
  const built = buildLegacyRecords(analysis, inventory), expected = compareStore(store, built);
  const plan = { schema_version: 1, kind: 'legacy_draft', analysis, inventory, ...built, expected, diagnostics: inventory.diagnostics, coverage: inventory.coverage };
  return { ...plan, digest: digest(plan) };
}
export function legacyApply(store, plan, operation, { fault } = {}) {
  requireInput(object(plan) && plan.kind === 'legacy_draft', 'legacy draft required');
  const { digest: expectedDigest, ...body } = plan;
  requireInput(expectedDigest === digest(body), 'plan digest mismatch');
  const intent = { command: 'legacy-apply', plan_digest: expectedDigest }, replay = replayOperation(store, operation, intent);
  if (replay) return { ...replay, source_validation: 'historical_replay' };
  verifyInventory(plan.inventory);
  const built = buildLegacyRecords(plan.analysis, plan.inventory);
  requireInput(digest(built.records) === digest(plan.records) && built.change === plan.change, 'plan records differ from analysis');
  const current = compareStore(store, built);
  // Existing read-set values are deliberately retained from preview for CAS.
  requireInput(object(plan.expected?.read_set) && Array.isArray(plan.expected?.creates) && Array.isArray(plan.expected?.unchanged), 'plan expected state required');
  for (const id of current.unchanged) if (!plan.expected.unchanged.includes(id)) throw new StoreError('write_conflict', `record appeared after preview: ${id}`, 3);
  for (const id of current.creates) if (!plan.expected.creates.includes(id)) throw new StoreError('write_conflict', `record disappeared after preview: ${id}`, 3);
  return transact(store, { operation, intent, readSet: { ...current.read_set, ...plan.expected.read_set }, updates: built.records.filter(r => current.creates.includes(r.id)).map(r => ({ path: recordPath(r), record: r, expected: null })), fault });
}
