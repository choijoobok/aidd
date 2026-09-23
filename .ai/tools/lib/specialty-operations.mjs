// Product specialty commands share the v2 transaction contract, never a runtime hook.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { record, recordPath, definitionHash, digest } from './record-contracts.mjs';
import { StoreError, safePath } from './record-store.mjs';
import { transact, replayOperation } from './record-transaction.mjs';
import { readContext } from './lifecycle-operations.mjs';
import { actualEvidence, POLICIES } from './readiness.mjs';
import { generateDocuments, buildDelivery } from './document-renderer.mjs';
import { impactGraph } from './dependency-graph.mjs';
import { requiredFor } from './cli-contract.mjs';

const list = x => x === undefined ? [] : Array.isArray(x) ? x : [x];
const need = (o, ...keys) => { const missing = keys.filter(key => !String(o[key] ?? '').trim()); if (missing.length) throw new StoreError('usage', `${missing.map(key => `--${key}`).join(', ')} required`, 2); };
const choose = (value, choices) => { if (!choices.includes(value)) throw new StoreError('usage', `expected ${choices.join('|')}, got ${value}`, 2); };
export const SPECIAL_OPTIONS = {
  'add-assumption': 'id statement rationale due-gate link module', 'resolve-assumption': 'id resolution status',
  'record-history': 'id type subject decided-by decision reason occurred-at change previous impact source-ref supersedes',
  'integration-status': '', 'record-merge': '', 'assess-merge': 'merge modules notes additional-testing',
  'add-merge-recheck': 'merge type title module test blocking', 'complete-merge-recheck': 'merge recheck performed-by result evidence',
  'evaluation-prompt': 'scenario', 'evaluation-status': '', 'record-evaluation': 'scenario platform status evidence scores summary critical-violation',
  'init-module-surfaces': 'module', 'init-module-ui': 'module', 'workload-coverage': 'change', 'document-impact': 'path',
  'delivery-glossary': 'profile directory',
};
const termOptions = 'action id term key concept-type category definition scope origin visibility audience alias example related-term distinguish-from distinction decision-rule confusion-reason clear-aliases clear-examples clear-related-terms clear-distinctions module requirement architecture data api screen test document';
SPECIAL_OPTIONS['term-review'] = termOptions;
SPECIAL_OPTIONS['term-apply'] = `${termOptions} history decided-by summary affected source-ref`;
export const REPEATED_OPTIONS = new Set('link module subject impact source-ref test evidence critical-violation path audience alias example related-term requirement architecture data api screen document affected dependency'.split(' '));
export const VARIADIC_OPTIONS = new Set(['scores', 'modules']);
export const BOOLEAN_OPTIONS = new Set('blocking clear-aliases clear-examples clear-related-terms clear-distinctions with-ui create staged'.split(' '));
const READONLY = new Set(['term-review', 'integration-status', 'evaluation-prompt', 'evaluation-status', 'document-impact', 'workload-coverage', 'delivery-glossary', 'init-module-ui', 'init-module-surfaces']);
export function gitRead(root, args, optional = false) {
  const run = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  if (run.error || run.status !== 0) { if (optional && !run.error) return null; throw new StoreError('git_read_failed', run.error?.message ?? run.stderr); }
  return run.stdout.trim();
}
function get(view, id, type) {
  const r = view.byId.get(id); if (!r || (type && r.type !== type)) throw new StoreError('missing_reference', `${type ?? 'record'} ${id}`); return r;
}
function nextId(view, type) { let n = 1; while (view.byId.has(`${type}-${String(n).padStart(3, '0')}`)) n++; return `${type}-${String(n).padStart(3, '0')}`; }
function ownerFor(view, ids) { const owners = new Set(ids.map(id => get(view, id).owner.id ?? 'project')); return owners.size === 1 && !owners.has('project') ? [...owners][0] : undefined; }
function termProposal(root, view, o) {
  choose(o.action, ['add', 'change', 'remove']);
  const common = JSON.parse(readFileSync(safePath(root, '.ai/manifests/terminology.json'), 'utf8')).terms ?? [];
  const norm = x => String(x ?? '').trim().toLowerCase();
  if (common.some(t => t.id === o.id || (o.key && norm(t.key) === norm(o.key)) || [t.term,...(t.aliases ?? [])].some(w => [o.term,...list(o.alias)].filter(Boolean).some(x => norm(w) === norm(x))))) throw new StoreError('common_term', '공통 용어를 프로젝트에서 재정의하지 않습니다.');
  const before = view.byId.get(o.id);
  if (o.action === 'add' ? !!before : before?.type !== 'TRM') throw new StoreError('term_action', o.id);
  if (o.action === 'add') need(o, 'term', 'key', 'concept-type', 'category', 'definition', 'scope');
  const after = before ? structuredClone(before) : record('TRM', o.id, ownerFor(view, list(o.module)), o.term);
  if (before) after.revision++;
  if (o.action === 'remove') after.lifecycle = 'retired';
  else {
    after.lifecycle = 'active'; if (o.term) after.title = o.term;
    for (const k of ['key', 'category', 'definition', 'scope', 'origin', 'visibility']) if (o[k] !== undefined) after.definition[k] = o[k];
    if (o['concept-type']) after.definition.concept_type = o['concept-type'];
    choose(after.definition.concept_type,['business','product','technical','external']);
    if (after.definition.concept_type === 'external' && !after.definition.origin) throw new StoreError('term_origin','external term requires --origin');
    after.definition.visibility ??= 'internal'; choose(after.definition.visibility, ['internal', 'customer']);
    for (const [option, key, clear] of [['alias','aliases','clear-aliases'], ['example','examples','clear-examples'], ['related-term','related_terms','clear-related-terms'], ['audience','audience',null]]) {
      if (o[clear]) after.definition[key] = []; else if (o[option] !== undefined) after.definition[key] = [...new Set(list(o[option]))];
    }
    after.definition.audience ??= ['project_team'];
    if (o['clear-distinctions']) after.definition.distinctions = [];
    if (o['distinguish-from']) {
      need(o, 'distinction', 'decision-rule');
      if (!view.byId.has(o['distinguish-from']) && !common.some(t => t.id === o['distinguish-from'])) throw new StoreError('missing_reference', o['distinguish-from']);
      after.definition.distinctions = [...(after.definition.distinctions ?? []).filter(d => d.term !== o['distinguish-from']), { term: o['distinguish-from'], difference: o.distinction, decision_rule: o['decision-rule'], reason: o['confusion-reason'] ?? null }];
    } else if (o.distinction || o['decision-rule'] || o['confusion-reason']) throw new StoreError('usage', '--distinguish-from required', 2);
    for (const id of after.definition.related_terms ?? []) if (!view.byId.has(id) && !common.some(t => t.id === id)) throw new StoreError('missing_reference', id);
    after.definition.impacts ??= {};
    for (const k of ['module','requirement','architecture','data','api','screen','test','document']) if (o[k] !== undefined) after.definition.impacts[k] = list(o[k]);
    after.relations = [...new Set(Object.values(after.definition.impacts).flat().filter(id => view.byId.has(id)))].map(target => ({ type: 'context', target }));
  }
  const conflicts = view.records.filter(r => r.type === 'TRM' && r.id !== o.id && r.lifecycle !== 'retired' && (norm(r.definition.key) === norm(after.definition.key) || [r.title,...(r.definition.aliases ?? [])].some(w => [after.title,...(after.definition.aliases ?? [])].some(x => norm(w) === norm(x)))));
  if (o.action !== 'remove' && conflicts.length) throw new StoreError('term_conflict', conflicts.map(r => r.id).join(','));
  const uses = view.records.filter(r => r.id !== o.id && !['TCH','HIS'].includes(r.type) && JSON.stringify(r).includes(o.id)).map(r => r.id);
  return { before: before ?? null, after, usages: uses, impact: before ? impactGraph(view.records, o.id, { coverage: view.coverage }) : null };
}
export function runSpecialty(root, store, command, o) {
  const intent = { command, options: o }, operation = o.operation;
  need(o, ...requiredFor(command)); // 필수 옵션은 cli-contract.mjs가 정본이다. 조건부 요구만 아래에 남긴다.
  if (!READONLY.has(command)) { const replay = replayOperation(store, operation, intent); if (replay) return replay; }
  const view = store.scanAll();
  if (!view.coverage.scope_complete) throw new StoreError('incomplete_scope', '전문 명령의 조회 범위가 불완전합니다.');
  const updates = [], now = o['occurred-at'] ?? new Date().toISOString();
  const save = r => { const p = recordPath(r); updates.push({ path: p, record: r, expected: view.hashes[p] ?? null }); return r; };
  const edit = (id, type) => { const r = structuredClone(get(view, id, type)); r.revision++; return r; };
  let data = {};
  if (command.startsWith('term-')) {
    data = termProposal(root, view, o); if (command === 'term-review') return data;
    const old = data.before, next = data.after;
    if (old) {
      const oldWords = [old.title, old.definition.key, ...(old.definition.aliases ?? [])].filter(Boolean);
      const currentWords = next.lifecycle === 'retired' ? [] : [next.title,next.definition.key,...(next.definition.aliases ?? [])];
      const removed = oldWords.filter(w => !currentWords.includes(w));
      const residual = view.records.filter(r => r.id !== o.id && r.lifecycle !== 'retired' && !['RVW','GTR','EVD','HIS','TCH','BSL','EVR'].includes(r.type) && (next.lifecycle === 'retired' ? JSON.stringify(r).includes(o.id) : removed.some(w => JSON.stringify(r).includes(w)))).map(r => r.id);
      const scan = dir => { if (!existsSync(safePath(root,dir))) return; for (const e of readdirSync(safePath(root,dir),{withFileTypes:true})) { const p = `${dir}/${e.name}`; if (e.isSymbolicLink()) continue; if (e.isDirectory()) scan(p); else if (/\.(?:[cm]?[jt]sx?|json|md|html|css|sql|py|java|cs|go|rs|yaml|yml)$/.test(p)) { const body = readFileSync(safePath(root,p),'utf8'); if (removed.some(w => body.includes(w))) residual.push(p); } } };
      scan('project/src'); if (residual.length) throw new StoreError('term_residual_usage',residual.join(', '));
    }
    save(data.after);
    save(record('TCH', o.history, data.after.owner.id, o.summary, { term: o.id, action: o.action, before: data.before, after: data.after, affected: list(o.affected), decided_by: o['decided-by'], occurred_at: now, summary: o.summary, source_refs: list(o['source-ref']) }, [{ type: 'context', target: o.id }]));
  } else if (command === 'record-history') {
    choose(o.type, ['analysis','design','terminology','source','scope','status','operation','decision']);
    if (!/^HIS-\d{8}-\d{3,}$/.test(o.id) || !Number.isFinite(Date.parse(now)) || new Date(now).toISOString() !== now || o.id.slice(4,12) !== now.slice(0,10).replaceAll('-','')) throw new StoreError('history_date', 'HIS-YYYYMMDD-### and matching UTC ISO occurred-at required');
    if (o.change) get(view, o.change, 'CHG'); if (o.supersedes) get(view, o.supersedes, 'HIS');
    const subjects = list(o.subject); save(record('HIS', o.id, ownerFor(view, subjects), o.decision, { type: o.type, subjects, decided_by: o['decided-by'], decision: o.decision, reason: o.reason, occurred_at: now, change: o.change ?? null, previous: o.previous ?? null, impacts: list(o.impact), source_refs: list(o['source-ref']) }, [...subjects.map(target => ({ type: 'context', target })), ...(o.supersedes ? [{ type: 'supersedes', target: o.supersedes }] : [])]));
  } else if (command === 'add-assumption') {
    choose(o['due-gate'], Object.keys(POLICIES));
    const applies = [...list(o.module), ...list(o.link)]; for (const id of applies) get(view, id);
    save(record('ASM', o.id, ownerFor(view, applies), o.statement, { statement: o.statement, rationale: o.rationale, due_gate: o['due-gate'], applies_to: applies.length ? applies : ['project'] }));
  } else if (command === 'resolve-assumption') {
    choose(o.status, ['confirmed', 'invalidated']); const r = edit(o.id, 'ASM');
    r.definition.resolution = o.resolution; r.definition.resolution_status = o.status; r.execution = { status: 'completed', completed_at: now }; save(r);
    save(record('HIS', `HIS-${operation.toUpperCase()}`, r.owner.id, o.resolution, { subjects: [r.id], resolution: o.status, reason: o.resolution, occurred_at: now, before: get(view, r.id) }));
    if (o.status === 'invalidated') save(record('OI',`OI-${operation.toUpperCase()}`,r.owner.id,'무효 가정의 후속 영향 처리',{ applies_to:r.definition.applies_to, blocking:true, question:o.resolution, assumption:r.id }));
  } else if (command === 'integration-status') return { branch: gitRead(root, ['branch','--show-current'], true), worktree: gitRead(root, ['status','--short'], true), divergence: gitRead(root, ['rev-list','--left-right','--count','HEAD...@{upstream}'], true), pending: view.records.filter(r => ['MRG','MRC'].includes(r.type) && !['completed','cancelled'].includes(r.execution.status)) };
  else if (command === 'record-merge') {
    const head = gitRead(root, ['rev-parse','HEAD'], true); if (!head) return { recorded: false, reason: 'No Git HEAD' };
    const parents = gitRead(root, ['rev-list','--parents','-n','1','HEAD']).split(/\s+/).slice(1);
    if (parents.length < 2) return { recorded: false, reason: 'HEAD is not a merge commit (including squash); no fabricated merge' };
    const existing = view.records.find(r => r.type === 'MRG' && r.definition.commit === head); if (existing) return { recorded: false, existing: existing.id };
    save(record('MRG', nextId(view, 'MRG'), null, `Merge ${head.slice(0,12)}`, { commit: head, parents, changed_files: gitRead(root, ['diff','--name-only',`${parents[0]}..${head}`]).split(/\r?\n/).filter(Boolean), applies_to: ['project'], assessment: 'pending' }));
  } else if (command === 'assess-merge') {
    const r = edit(o.merge,'MRG'), modules = list(o.modules); for (const id of modules) get(view,id,'MOD');
    Object.assign(r.definition, { applies_to: modules, affected_modules: modules, conflict_resolution_notes: o.notes, additional_testing: o['additional-testing'], assessment: 'assessed' }); r.execution.status = 'completed'; save(r);
  } else if (command === 'add-merge-recheck') {
    choose(o.type,['review','test']); const merge = get(view,o.merge,'MRG'); if (merge.definition.assessment !== 'assessed') throw new StoreError('merge_assessment_required',o.merge);
    const modules = list(o.module), tests = list(o.test); for (const id of modules) get(view,id,'MOD'); for (const id of tests) get(view,id,'TC');
    save(record('MRC',nextId(view,'MRC'),ownerFor(view,modules),o.title,{ merge:o.merge, type:o.type, applies_to:modules.length ? modules : merge.definition.applies_to.length ? merge.definition.applies_to : ['project'], tests, blocking:!!o.blocking },[{type:'context',target:o.merge}]));
  } else if (command === 'complete-merge-recheck') {
    choose(o.result,['passed','failed']); get(view,o.merge,'MRG'); const r = edit(o.recheck,'MRC'); if (r.definition.merge !== o.merge) throw new StoreError('merge_mismatch',o.recheck);
    const evidence = list(o.evidence).map(id => get(view,id,'EVD'));
    if (r.definition.type === 'test' && (!r.definition.tests?.length || !r.definition.tests.every(id => evidence.some(e => e.definition.subjects?.includes(id) && e.definition.kind === 'test' && e.definition.result === o.result && e.definition.input_hash === definitionHash(get(view,id,'TC')) && e.definition.command && e.definition.occurred_at && e.definition.artifacts?.length)))) throw new StoreError('recheck_evidence','current executed TC evidence matching the result required');
    Object.assign(r.definition,{performed_by:o['performed-by'],result:o.result}); r.execution = { status:o.result === 'passed' ? 'completed':'blocked', completed_at:now,evidence:list(o.evidence) }; save(r);
  } else if (command === 'evaluation-prompt') {
    const r = get(view,o.scenario,'EVS'); return { scenario:r, fixture:readFileSync(safePath(root,r.definition.fixture),'utf8'), input_hash:definitionHash(r) };
  } else if (command === 'record-evaluation') {
    choose(o.platform,['codex','claude']); choose(o.status,['passed','failed']); const s = get(view,o.scenario,'EVS'), scores = list(o.scores).map(Number), violations = list(o['critical-violation']);
    if (!scores.length || scores.length !== s.definition.rubric?.length || scores.some(x => !Number.isInteger(x) || x < 0 || x > 2) || (o.status === 'passed' && violations.length)) throw new StoreError('evaluation_scores','rubric scores 0..2 and no critical violations for passed');
    const evds = list(o.evidence).map(id => get(view,id,'EVD')); if (!evds.some(e => e.definition.subjects?.includes(s.id) && e.definition.input_hash === definitionHash(s) && e.definition.kind === 'provider_evaluation' && e.definition.result === o.status && e.definition.mode === 'actual' && e.definition.environment === o.platform && e.definition.command && e.definition.occurred_at && e.definition.artifacts?.length)) throw new StoreError('evaluation_evidence','actual matching provider evidence required; fixture simulation is not a provider run');
    save(record('EVR',nextId(view,'EVR'),s.owner.id,o.summary,{scenario:s.id,platform:o.platform,status:o.status,input_hash:definitionHash(s),scores,critical_violations:violations,evidence:list(o.evidence),occurred_at:now},[{type:'context',target:s.id}]));
  } else if (command === 'evaluation-status') return { evaluations:view.records.filter(r => r.type === 'EVS').flatMap(s => ['codex','claude'].map(platform => { const runs = view.records.filter(r => r.type === 'EVR' && r.definition.scenario === s.id && r.definition.platform === platform).sort((a,b) => b.definition.occurred_at.localeCompare(a.definition.occurred_at) || b.id.localeCompare(a.id)); const last = runs[0]; return {scenario:s.id,platform,run:last?.id ?? null,status:!last ? 'not_run' : last.definition.input_hash !== definitionHash(s) ? 'stale' : last.definition.status}; })) };
  else if (command.startsWith('init-module-')) { get(view,o.module,'MOD'); return { module:o.module, initialized:false, reason:'v2에는 빈 전역 UI/표면 파일이 필요하지 않습니다. 실제 업무가 확인되면 CHG 아래 SCR/NAV/SURF를 record-put으로 작성하세요. 승인이나 가짜 화면을 생성하지 않습니다.', records:view.records.filter(r => r.owner.id === o.module && (command.endsWith('ui') ? ['SCR','NAV'].includes(r.type) : r.type === 'SURF')).map(r => r.id) }; }
  else if (command === 'delivery-glossary') { const p = get(view,o.profile,'DLP'); if (!p.definition.includes?.includes('glossary') || p.definition.includes.length !== 1) throw new StoreError('glossary_profile','dedicated DLP with includes:[glossary] required; otherwise delivery-build'); return buildDelivery(store,o.profile,o.directory); }
  else if (command === 'workload-coverage') {
    const c = get(view,o.change,'CHG'), work = view.records.filter(r => r.type === 'WRK' && r.definition.change === c.id), ids = [...(c.definition.scope.requirements ?? []),...(c.definition.scope.candidates ?? [])];
    return { coverage:view.coverage, items:ids.map(id => ({id,works:work.filter(w => [...(w.definition.requirements ?? []),...(w.definition.features ?? []),...(w.definition.screens ?? []),...w.relations.map(x => x.target)].includes(id) || (w.definition.features ?? []).some(f => get(view,f).relations.some(x => x.target === id))).map(w => w.id)})), dependencies:work.flatMap(w => w.relations.filter(x => x.type === 'depends_on').map(x => ({work:w.id,...x}))) };
  } else if (command === 'document-impact') {
    const paths = list(o.path).length ? list(o.path) : (gitRead(root,['diff','--name-only'],true) ?? '').split(/\r?\n/).filter(Boolean), ids = new Set();
    for (const path of paths) { const normalized = path.replaceAll('\\','/'); for (const r of view.records) if (normalized.endsWith(recordPath(r))) ids.add(r.id); try { const body = readFileSync(safePath(root,normalized),'utf8'); for (const r of view.records) if (body.includes(r.id)) ids.add(r.id); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
    return { paths, candidates:[...ids].map(id => impactGraph(view.records,id,{coverage:view.coverage})), semantic_decision:'not_made', coverage:view.coverage };
  } else throw new StoreError('unsupported_specialty',command);
  const transaction = transact(store,{operation,intent,updates,readSet:view.hashes});
  if (command === 'term-apply' || command === 'record-history') {
    try { data.generated = generateDocuments(store); } catch (e) { return { transaction, diagnostics:[{code:'derived_refresh_failed',message:e.message, canonical_committed:true}] }; }
  }
  return { ...data, ids:updates.map(u => u.record.id), transaction };
}
