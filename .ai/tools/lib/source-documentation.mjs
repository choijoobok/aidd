import { gitRead } from './specialty-operations.mjs';
import { legacyStagedScope, legacySourceCheck } from './legacy-source-check.mjs';
// Pattern matching is descriptive only: it neither discovers files nor follows links.
const match = (path, pattern) => new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g,'\\$&').replaceAll('**','§').replaceAll('*','[^/]*').replaceAll('§','.*')}$`).test(path);
export function stagedDocumentation(root, store, suppliedPaths) {
  const staged = suppliedPaths ?? gitRead(root,['diff','--cached','--name-only','--diff-filter=ACMRD']).split(/\r?\n/).filter(Boolean);
  const view = store.scanAll(), diagnostics = [...view.diagnostics], rows = [];
  const active = r => !['completed','cancelled'].includes(r.execution.status);
  const actionable = id => { const r = view.byId.get(id); return r?.type === 'WRK' && r.definition.work_kind === 'documentation' && active(r) && r.definition.target_docs?.length && (r.definition.due_milestone || r.definition.due_release); };
  const fail = (source, reason) => diagnostics.push({code:'staged_documentation',source,message:reason});
  const legacy=legacyStagedScope(root,view.records,staged),checked=new Map();
  for(const row of legacy.rows){
    const change=view.records.find(r=>r.type==='CHG'&&r.relations.some(e=>e.target===row.analysis));
    if(!change){fail(row.source,'레거시 분석 CHG가 없습니다.');continue;}
    if(!checked.has(change.id))checked.set(change.id,legacySourceCheck(store,change.id));
    const check=checked.get(change.id);rows.push({...row,change:change.id,current:check.current});
    if(!check.current)fail(row.source,'선언된 레거시 루트의 출처가 달라졌습니다. legacy-source-check와 재분석이 필요합니다.');
    // Source hashes describe the working tree, so a divergent Git index cannot pass.
    if(suppliedPaths)diagnostics.push({code:'legacy_staged_index_unverified',severity:'warning',source:row.source,message:'제공된 경로 목록 시험이며 실제 Git index 비교는 수행하지 않았습니다.'});
    else if(gitRead(root,['diff','--name-only','--',row.source]))fail(row.source,'Git index와 작업 트리의 내용이 다릅니다. 같은 출처 개정으로 검토하세요.');
  }
  if(legacy.outside.length)diagnostics.push({code:'legacy_external_roots_not_staged',severity:'warning',roots:legacy.outside,message:'저장소 밖 루트는 legacy-source-check로 별도 확인하세요.'});
  for (const source of staged.filter(p => p.startsWith('project/src/') && p !== 'project/src/README.md'&&!legacy.rows.some(r=>r.source===p))) {
    const surfaces = view.records.filter(r => r.type === 'SURF' && r.lifecycle !== 'retired' && r.definition.source_patterns?.some(p => match(source,p)));
    if (!surfaces.length) {
      const plan = view.records.find(r => r.type === 'LDP' && active(r) && r.definition.source_roots?.some(p => source.startsWith(`${p.replace(/\/$/,'')}/`)) && r.definition.work_items?.length && r.definition.work_items.every(actionable));
      if (!plan) fail(source,'SURF 또는 실행 가능한 문서 현행화 LDP가 없습니다.');
      rows.push({source,plan:plan?.id ?? null}); continue;
    }
    for (const surface of surfaces) {
      const changes = view.records.filter(r => r.type === 'CHG' && active(r) && r.definition.delivery_path?.surfaces?.includes(surface.id));
      if (changes.length !== 1) { fail(source,`${surface.id}: 정확히 하나의 진행 중 CHG가 필요합니다.`); continue; }
      const delivery = changes[0].definition.delivery_path, d = surface.definition;
      if (d.documentation_status === 'undocumented' && delivery.documentation === 'deferred') {
        if (!delivery.documentation_work?.length || !delivery.documentation_work.every(actionable)) fail(source,`${surface.id}: 후속 문서 작업·기한·대상이 필요합니다.`);
      } else if (!['current','stale','undocumented'].includes(d.documentation_status) || !['update_now','create_now'].includes(delivery.documentation) || !d.documentation_sources?.some(p => staged.some(s => match(s,p)))) fail(source,`${surface.id}: 현재 문서 정본의 staged 변경이 필요합니다.`);
      rows.push({source,surface:surface.id,change:changes[0].id});
    }
  }
  return {rows,diagnostics,coverage:{...view.coverage,legacy_index_checked:!suppliedPaths,external_roots_checked:false,external_roots:legacy.outside.length}};
}
