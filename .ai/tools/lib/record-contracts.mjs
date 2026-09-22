import { createHash } from 'node:crypto';
import { DISCOVERY_FIELDS } from './business-discovery.mjs';

export const FORMAT = 'owned-records-v2';
export const TYPES = 'MOD CHG WRK REQ NFR OUT UC FEAT SCR DAT NAV RVW BSL IMP OI DRQ HIS ADR TCH TC EVD GTR REL EXC MLS IFC DPN SURF LDP STD UXB UIP CMP GPH RUN MAN DLP MRG MRC TRM ASM RSK EVS POL ARC ENV DEP DOC SYS CAP ACT BPR EVR'.split(' ');
export const IMMUTABLE = new Set(['RVW', 'BSL', 'HIS', 'EVD', 'GTR', 'TCH', 'EVR']);
export const DEFINITION_TYPES = new Set('REQ NFR OUT UC FEAT SCR DAT NAV IFC STD UXB UIP CMP SURF SYS CAP ACT BPR'.split(' '));
export const RELATIONS = new Set('satisfies presents uses_data consumes uses_foundation implements verifies documents depends_on part_of context supersedes applies_to derived_from performed_by realizes'.split(' '));
export const DEFINITION_FIELDS = {
  ...DISCOVERY_FIELDS,
  MOD: 'purpose public_contracts operating_baseline',
  CHG: 'change_class delivery_path purpose modules scope base_baselines applicable_policies validation_plan rollback requirements_baseline design_baseline coordinated_changes gate_applicability',
  REQ: 'source priority actors value statement scope triggers preconditions outcomes rules prohibited_outcomes exceptions boundaries data_needs touchpoints quality_constraints acceptance_criteria applicability measurement',
  NFR: 'source priority actors value statement scope triggers preconditions outcomes rules prohibited_outcomes exceptions boundaries data_needs touchpoints quality_constraints acceptance_criteria applicability measurement',
  FEAT: 'purpose analysis actors preconditions postconditions main_flow alternatives rules inputs outputs exceptions data_access interfaces applicable_quality acceptance_mapping business_rule_sources',
  SCR: 'purpose analysis entry exit fields actions view_states transitions validation accessibility applicable_permissions prototype_scenarios',
  DAT: 'purpose analysis business_definition identity attributes ownership_rules',
  NAV: 'purpose analysis audience entries entry_routes',
  WRK: 'change work_kind purpose requirements features screens interfaces foundations foundation_applicability ui_applicability completion_criteria environment target_docs due_milestone due_release',
  RVW: 'kind subjects input_digest sequence coverage findings unresolved_refs method reviewer occurred_at per_subject_results decision_source artifact equivalence',
  BSL: 'kind scope_ref members inputs created_at',
  IMP: 'subject selector before_hash after_hash graph_digest candidates cycles unresolved coverage readiness applies_to',
  GTR: 'gate scope_ref attempt input_digest result blockers unknowns',
  EVD: 'subjects kind result input_hash command occurred_at artifacts environment mode commit screen file sha256 alt code_revision',
  TC: 'steps inputs expected forbidden method environment',
  REL: 'works changes environment baseline combination delivery',
  DLP: 'audience purpose includes excludes modules release format',
  MAN: 'audience preconditions steps expected error_recovery support screenshots',
  TRM: 'meaning definition visibility audience aliases distinctions examples category origin key concept_type scope related_terms impacts',
};
export const sha = value => createHash('sha256').update(value).digest('hex');
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export const digest = value => sha(canonical(value));
export const idValid = id => typeof id === 'string' && /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/.test(id);
export function definition(record) {
  return { id: record.id, type: record.type, owner: record.owner, title: record.title, retired: record.lifecycle === 'retired', definition: record.definition, relations: record.relations, extensions: record.extensions ?? {} };
}
export const definitionHash = record => digest(definition(record));
export function analysis(record) {
  const d = record.definition;
  return { id: record.id, type: record.type, owner: record.owner, title: record.title, retired: record.lifecycle === 'retired', purpose: d.purpose ?? d.business_definition ?? null, analysis: d.analysis ?? null, data_contract: record.type === 'DAT' ? { identity: d.identity ?? null, attributes: d.attributes ?? [], ownership_rules: d.ownership_rules ?? null } : null, navigation: record.type === 'NAV' ? { audience: d.audience ?? null, entries: d.entries ?? [], entry_routes: d.entry_routes ?? [] } : null, relations: record.relations.filter(r => ['satisfies', 'presents', 'uses_data', 'consumes', 'part_of'].includes(r.type)), extensions: record.extensions ?? {} };
}
export const contentHash = (record, projection = 'definition') => digest(projection === 'analysis' ? analysis(record) : definition(record));
export function recordErrors(r) {
  const errors = [], fail = message => errors.push({ code: 'record_contract', id: r?.id, message });
  if (!r || typeof r !== 'object' || Array.isArray(r)) return [{ code: 'record_contract', message: 'record must be an object' }];
  if (r.schema_version !== 2 || !TYPES.includes(r.type) || !idValid(r.id) || !r.id.startsWith(`${r.type}-`)) fail('schema_version/type/id mismatch');
  if (!r.owner || !['project', 'module'].includes(r.owner.kind) || (r.owner.kind === 'module' && !/^MOD-[A-Z0-9-]+$/.test(r.owner.id ?? ''))) fail('invalid owner');
  if (r.type === 'MOD' && (r.owner?.kind !== 'module' || r.owner.id !== r.id)) fail('MOD must own itself');
  if (!Number.isInteger(r.revision) || r.revision < 1 || typeof r.title !== 'string' || !r.title.trim() || !['draft', 'in_review', 'active', 'retired'].includes(r.lifecycle)) fail('invalid revision/title/lifecycle');
  for (const key of ['definition', 'execution', 'extensions']) if ((key === 'definition' || r[key] !== undefined) && (!r[key] || typeof r[key] !== 'object' || Array.isArray(r[key]))) fail(`${key} must be an object`);
  if (!Array.isArray(r.relations)) fail('relations must be an array');
  else for (const rel of r.relations) if (!RELATIONS.has(rel.type) || !idValid(rel.target) || (rel.selector !== undefined && typeof rel.selector !== 'string')) fail('invalid typed relation');
  const keys = new Set(['schema_version', 'id', 'type', 'owner', 'revision', 'title', 'lifecycle', 'definition', 'relations', 'execution', 'extensions']);
  for (const k of Object.keys(r)) if (!keys.has(k)) fail(`unknown envelope field ${k}; use extensions`);
  const executionFields = new Set(['status', 'evidence', 'results', 'started_at', 'completed_at', 'blocked_by', 'attempt', 'result', 'input_digest', 'operating_release']);
  for (const k of Object.keys(r.execution ?? {})) if (!executionFields.has(k)) fail(`unknown execution field ${k}; semantics belong in definition`);
  if (DEFINITION_FIELDS[r.type] && r.definition) for (const key of Object.keys(r.definition)) if (!DEFINITION_FIELDS[r.type].split(' ').includes(key)) fail(`unknown ${r.type} definition field ${key}; use extensions`);
  if (r.execution?.status && !['planned', 'in_progress', 'blocked', 'completed', 'cancelled'].includes(r.execution.status)) fail('invalid execution status');
  return errors;
}
export function recordPath(r) {
  if (recordErrors(r).length) throw new Error('invalid record');
  if (r.type === 'MOD') return `modules/${r.id}/module.json`;
  return `${r.owner.kind === 'project' ? 'common' : `modules/${r.owner.id}`}/${r.type}/${r.id}.json`;
}
export function record(type, id, owner, title, definition = {}, relations = []) {
  return { schema_version: 2, id, type, owner: typeof owner === 'string' ? { kind: 'module', id: owner } : { kind: 'project' }, revision: 1, title, lifecycle: 'draft', definition, relations, execution: {}, extensions: {} };
}
