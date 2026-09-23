import { existsSync, mkdirSync, readFileSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { FORMAT, record, recordPath } from './record-contracts.mjs';
import { RecordStore, StoreError } from './record-store.mjs';
import { atomicJson, checkIndex, rebuildIndex } from './record-index.mjs';
import { putRecord, moveRecord, transactionStatus, recover } from './record-transaction.mjs';
import { readContext, baselineCreate, reviewRecord, runGate } from './lifecycle-operations.mjs';
import { evaluate, reviewInput, prototypeInput } from './readiness.mjs';
import { definitionHash } from './record-contracts.mjs';
import { impactGraph, applyImpact } from './dependency-graph.mjs';
import { semanticErrors } from './semantic-validation.mjs';
import { briefing, briefingText } from './record-views.mjs';
import { generateDocuments, checkDocuments, buildDelivery } from './document-renderer.mjs';
import { SPECIAL_OPTIONS, REPEATED_OPTIONS, VARIADIC_OPTIONS, BOOLEAN_OPTIONS, runSpecialty } from './specialty-operations.mjs';
import { stagedDocumentation } from './source-documentation.mjs';
import { legacyInventory } from './legacy-inventory.mjs';
import { legacyDraft, legacyApply } from './legacy-drafts.mjs';
import { legacyReview, legacyReviewRequest, legacyReviewAnswer } from './legacy-review.mjs';
import { legacyReanalyze, legacyReconcile } from './legacy-reanalysis.mjs';
import { legacySourceCheck } from './legacy-source-check.mjs';
import { legacyAdoptionCheck, legacyAdopt } from './legacy-adoption.mjs';
import { COMMANDS as CLI_CONTRACT, missingOptions, missingMessage, commandHelp } from './cli-contract.mjs';

export function bootstrapV2(root, options) {
  const project = join(root, 'project'), store = new RecordStore(project);
  if (existsSync(project)) throw new StoreError('target_exists', project);
  if (!options['project-id'] || !options.name) throw new StoreError('usage', '--project-id and --name required', 2);
  if (existsSync(join(root, '.ai/templates/project-skeleton'))) cpSync(join(root, '.ai/templates/project-skeleton'), project, { recursive: true });
  mkdirSync(store.ssot, { recursive: true });
  atomicJson(join(store.ssot, 'project.json'), { schema_version: 2, storage_format: FORMAT, id: options['project-id'], name: options.name, mode: options.mode ?? 'greenfield', source_location: options['source-location'] ?? null });
  atomicJson(join(root, '.aidd-role.json'), { schema_version: 1, role: 'product-workspace', managed_by: 'AIDD Kit export/bootstrap', mutable_by_user: false });
  rebuildIndex(store); return { project, storage_format: FORMAT };
}
export const V2_COMMANDS = new Set('record-read record-list record-put record-move index-check index-rebuild transaction-status transaction-recover discovery-check requirement-check baseline-create review-record design-check gate-run impact-apply delivery-build legacy-inventory legacy-draft legacy-apply'.split(' '));
for(const command of ['legacy-review','legacy-review-request','legacy-review-answer','legacy-reanalyze','legacy-reconcile','legacy-source-check','legacy-adoption-check','legacy-adopt'])V2_COMMANDS.add(command);
function parse(args, command) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) throw new StoreError('usage', `unexpected ${args[i]}`, 2);
    const key = args[i].slice(2);
    const repeated = (command in SPECIAL_OPTIONS && REPEATED_OPTIONS.has(key) && !(key === 'module' && command.startsWith('init-module-'))) || (command === 'add-module' && key === 'dependency');
    if (key in out && !repeated) throw new StoreError('usage', `duplicate --${key}`, 2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
    if (VARIADIC_OPTIONS.has(key)) { out[key] = [value]; while (args[i+1] && !args[i+1].startsWith('--')) out[key].push(args[++i]); }
    else if (repeated) out[key] = [...(out[key] ?? []), value];
    else out[key] = value;
  }
  return out;
}
// 옵션 이름은 파싱 규칙과 함께 여기에 두고, 필수·대안·설명·예시는 cli-contract.mjs가 정본이다.
const OWNED_OPTION_SOURCE = {
  'legacy-adoption-check':'change module format', 'legacy-adopt':'input operation format',
  'legacy-inventory': 'input format', 'legacy-draft': 'input inventory format', 'legacy-apply': 'input operation format',
  'legacy-review':'change limit format','legacy-review-request':'input operation format','legacy-review-answer':'input operation format','legacy-reanalyze':'input inventory previous format','legacy-reconcile':'input operation format','legacy-source-check':'change format',
  ...Object.fromEntries(Object.entries(SPECIAL_OPTIONS).map(([key, value]) => [key, `${value} operation format occurred-at`])),
  'discovery-check': 'change format',
  status: 'level module change work id format', 'module-status': 'module status format', 'record-read': 'id at format', 'record-list': 'module owner type change format', validate: 'module change format',
  'record-put': 'input operation expected-hash create change format', 'record-move': 'id owner expected-hash operation format', 'index-check': 'module format', 'index-rebuild': 'module format',
  'transaction-status': 'operation format', 'transaction-recover': 'operation action format', 'add-module': 'id name purpose status operation dependency with-ui format', 'requirement-check': 'change format', 'design-check': 'change format',
  'development-check': 'work change format', 'release-check': 'release format', 'baseline-create': 'input operation format', 'review-record': 'input operation format', 'gate-run': 'scope gate operation format',
  impact: 'id selector before change format', 'impact-apply': 'input expected-hash operation format', generate: 'module change output format', 'terminology-refresh': 'module format', 'documentation-check': 'module change output staged format', 'delivery-build': 'profile output directory format',
};
const dedupe = text => [...new Set(text.split(' ').filter(Boolean))].join(' ');
export const OWNED_OPTIONS = Object.fromEntries(Object.entries(OWNED_OPTION_SOURCE).map(([command, text]) => [command, dedupe(text)]));
export function ownedCommandHelp(command, workspace) {
  const options = OWNED_OPTIONS[command];
  if (options === undefined) return null;
  return commandHelp(command, { optionKeys: options.split(' ').filter(Boolean), booleanOptions: BOOLEAN_OPTIONS, workspace });
}
// 검증기와 도움말이 같은 계약(cli-contract.mjs)을 읽는다. 명령별 인라인 필수 검사를 두지 않는다.
export function optionErrors(command, options) {
  const result = missingOptions(command, options);
  return result.missing.length || result.unmet.length ? missingMessage(command, result) : null;
}
function validateOptions(command, options) {
  const supported = OWNED_OPTIONS[command]?.split(' ');
  if (supported) for (const [key, value] of Object.entries(options)) {
    if (!supported.includes(key) && key !== 'evaluated-at') throw new StoreError('usage', `unsupported --${key} for ${command}`, 2);
    if ((value === true || (Array.isArray(value) && value.includes(true))) && !BOOLEAN_OPTIONS.has(key)) throw new StoreError('usage', `--${key} requires a value`, 2);
    if (BOOLEAN_OPTIONS.has(key) && value !== true) throw new StoreError('usage', `--${key} is a flag`, 2);
  }
  if (options.format && !['json', 'text'].includes(options.format)) throw new StoreError('usage', '--format must be json or text', 2);
  if (options.level && !['executive','detail','module'].includes(options.level)) throw new StoreError('usage','--level must be executive, detail or module',2);
  if (options.create && options['expected-hash']) throw new StoreError('usage', 'choose --create OR --expected-hash', 2);
  if (options.module && options.owner) throw new StoreError('usage', 'choose --module OR --owner', 2);
  if (!(command in CLI_CONTRACT)) throw new StoreError('unknown_command', `알 수 없는 명령: ${command}`, 2);
  const message = optionErrors(command, options);
  if (message) throw new StoreError('usage', message, 2);
}
// 제품 정본 형식: 'owned-records-v2' | 'legacy'(구형 전역 정본) | null(정본 없음)
export function workspaceFormat(root) {
  const format = new RecordStore(join(root, 'project')).format();
  return format === undefined ? 'legacy' : format;
}
export function shouldUseV2(root, command) {
  return V2_COMMANDS.has(command) || (new RecordStore(join(root, 'project')).format() === FORMAT && !['sync-ai', 'install-hooks', 'hook', 'project-init', 'project-init-status', 'project-reconcile-role'].includes(command));
}
export function runOwned(root, command, args) {
  const options = parse(args, command), store = new RecordStore(join(root, 'project'));
  validateOptions(command, options);
  store.requireV2(); let data;
  const scope = options.module ? { module: options.module } : options.owner ? { owner: options.owner } : {};
  if(command==='legacy-review')data=legacyReview(store,options.change,Number(options.limit??3));
  else if(command==='legacy-adoption-check')data=legacyAdoptionCheck(store,options.change,options.module);
  else if(command==='legacy-adopt')data=legacyAdopt(store,JSON.parse(readFileSync(options.input,'utf8')),options.operation);
  else if(command==='legacy-source-check')data=legacySourceCheck(store,options.change);
  else if(['legacy-review-request','legacy-review-answer','legacy-reconcile'].includes(command)){
    const input=JSON.parse(readFileSync(options.input,'utf8'));
    data=({'legacy-review-request':legacyReviewRequest,'legacy-review-answer':legacyReviewAnswer,'legacy-reconcile':legacyReconcile})[command](store,input,options.operation);
  } else if (['legacy-inventory','legacy-draft','legacy-apply','legacy-reanalyze'].includes(command)) {
    const input = JSON.parse(readFileSync(options.input, 'utf8'));
    if (command === 'legacy-inventory') data = legacyInventory(input);
    else if (command === 'legacy-draft'||command==='legacy-reanalyze') { const inventory = JSON.parse(readFileSync(options.inventory, 'utf8')); data = command==='legacy-draft'?legacyDraft(store, input, inventory.data ?? inventory):legacyReanalyze(store,input,inventory.data??inventory,options.previous); }
    else data = legacyApply(store, input.data ?? input, options.operation);
  } else if (['status', 'module-status'].includes(command)) {
    if (options.status) throw new StoreError('derived_status', 'module-status is read-only; record actual work and release evidence');
    const id = options.work ?? options.change ?? options.id, view = readContext(store, id, options.module);
    view.evaluated_at = options['evaluated-at'] ?? null;
    data = briefing(view, { module: options.module, id });
    if (options.format === 'text') data = { text: briefingText(data), coverage: view.coverage };
  } else if (command === 'generate' || command === 'terminology-refresh') data = generateDocuments(store, { module: options.module, change: options.change, output: options.output, evaluated_at: options['evaluated-at'] ?? null });
  else if (command === 'documentation-check') {
    data = checkDocuments(store, { module: options.module, change: options.change, output: options.output, evaluated_at: options['evaluated-at'] ?? null });
    if (options.staged) { const staged = stagedDocumentation(root, store); data.staged = staged; data.diagnostics = [...(data.diagnostics ?? []), ...staged.diagnostics]; }
  }
  else if (command === 'delivery-build') data = buildDelivery(store, options.profile, options.output ?? options.directory, options['evaluated-at'] ?? null);
  else if (['discovery-check', 'requirement-check', 'design-check', 'development-check', 'release-check'].includes(command)) {
    const id = options.work ?? options.release ?? options.change;
    const view = readContext(store, id);
    view.evaluated_at = options['evaluated-at'] ?? null;
    const stage = command === 'discovery-check' ? 'discovery' : command === 'development-check' ? 'development' : command === 'release-check' ? 'release' : 'requirements';
    if (stage === 'development' && !options.work) {
      const works = view.records.filter(r => r.type === 'WRK' && r.definition.change === id);
      data = { works: works.map(w => evaluate(view.records, w.id, stage, view)), coverage: view.coverage };
      data.readiness = !view.coverage.scope_complete ? 'unknown' : works.length && data.works.every(w => w.readiness === 'ready') ? 'ready' : 'blocked';
    } else data = evaluate(view.records, id, stage, view);
  } else if (command === 'impact') {
    const view = store.scanAll(); data = impactGraph(view.records, options.id, { selector: options.selector, coverage: view.coverage });
    if (options.before) data.before_hash = options.before.startsWith('BSL-') ? definitionHash(store.at(options.id, options.before)) : /^[a-f0-9]{64}$/.test(options.before) ? options.before : (() => { throw new StoreError('usage','--before requires BSL-ID or definition SHA256',2); })();
    if (options.change) { if (view.byId.get(options.change)?.type !== 'CHG') throw new StoreError('missing_scope',options.change); const selected = readContext(store,options.change); data.change = options.change; data.candidates = data.candidates.map(c => ({...c,in_change_context:selected.byId.has(c.id)})); }
  }
  else if (command === 'impact-apply') data = applyImpact(store, JSON.parse(readFileSync(options.input, 'utf8')), options['expected-hash'] ?? null, options.operation);
  else if (command === 'baseline-create') data = baselineCreate(store, JSON.parse(readFileSync(options.input, 'utf8')), options.operation);
  else if (command === 'review-record') data = reviewRecord(store, JSON.parse(readFileSync(options.input, 'utf8')), options.operation);
  else if (command === 'gate-run') data = runGate(store, options.scope, options.gate, options.operation, options['evaluated-at'] ?? null);
  else if (command === 'record-read') {
    data = options.at ? { record: store.at(options.id, options.at) } : store.readRecord(options.id);
    if (data.record && !options.at) {
      const context = store.readScope({ ids: [options.id] });
      data.definition_hash = definitionHash(data.record); data.blob_hash = data.hashes[recordPath(data.record)];
      const consistencySubjects = data.record.type === 'CHG' ? [data.record.id, ...(data.record.definition.scope?.requirements ?? [])] : [data.record.id];
      data.review_inputs = Object.fromEntries(['intent', 'business_flow', 'scope', 'requirement', 'consistency', 'design', 'prototype'].map(kind => [kind, { subjects: kind === 'consistency' ? consistencySubjects : [data.record.id], input_digest: kind === 'prototype' ? prototypeInput(context.records, data.record.id) : reviewInput(context.records, kind === 'consistency' ? consistencySubjects : [data.record.id], kind), coverage: context.coverage }]));
    }
  }
  else if (command === 'record-list' || command === 'validate') { data = options.change ? readContext(store, options.change) : store.readScope(scope); if (options.type) data.records = data.records.filter(r => r.type === options.type); if (command === 'validate') data.diagnostics.push(...semanticErrors(data.records)); }
  else if (command === 'record-put') {
    data = putRecord(store, JSON.parse(readFileSync(options.input, 'utf8')), { operation: options.operation, expected: options.create ? null : options['expected-hash'], change: options.change });
  } else if (command === 'record-move') data = moveRecord(store, options.id, options.owner, options['expected-hash'], options.operation);
  else if (command === 'index-check') data = checkIndex(store, { module: options.module });
  else if (command === 'index-rebuild') data = rebuildIndex(store, { module: options.module });
  else if (command === 'transaction-status') data = transactionStatus(store, options.operation);
  else if (command === 'transaction-recover') data = recover(store, options.operation, options.action);
  else if (command === 'add-module') {
    if (options.status && options.status !== 'planned') throw new StoreError('derived_status', 'module state is computed; cannot set done');
    const r = record('MOD', options.id, options.id, options.name, { purpose: options.purpose }, (options.dependency ?? []).map(target => ({type:'depends_on',target})));
    data = putRecord(store, r, { operation: options.operation ?? `add-${options.id}` });
    if (options['with-ui']) data.ui_next = '실제 화면이 확인되면 CHG와 SCR/NAV를 작성하세요. init-module-ui는 빈 전역 파일이나 가짜 화면을 만들지 않습니다.';
  } else if (command in SPECIAL_OPTIONS) data = runSpecialty(root, store, command, options);
  else if (command === 'migrate-module-specs') throw new StoreError('migration_required', 'owned-records-v2 정본은 이미 레코드별 파일이다. 구형 정본 전용 명령이며 v1→v2 자동 변환은 제공하지 않는다.');
  else throw new StoreError('unsupported_in_v2', `${command}: owned-records-v2 프로젝트에서는 사용하지 않는 명령이다. 구형 전역 파일 writer로 대신 저장하지 않는다. '--help'로 현재 사용 가능한 명령을 확인한다.`);
  return { schema_version: 2, command, scope, data, diagnostics: data?.diagnostics ?? [], coverage: data?.coverage ?? { scope_complete: true }, exitCode: data?.diagnostics?.some(d => d.severity !== 'warning') || (data?.readiness && data.readiness !== 'ready') || (data?.evaluation && data.evaluation.readiness !== 'ready') ? 1 : 0 };
}
