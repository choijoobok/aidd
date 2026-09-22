import { relative, resolve, isAbsolute } from 'node:path';
import { legacyInventory, requireInput } from './legacy-inventory.mjs';
import { completeView } from './legacy-review.mjs';
import { sourceDelta } from './legacy-reanalysis.mjs';
import { impactGraph } from './dependency-graph.mjs';

export function legacySourceCheck(store,change,{view}={}) {
  const v=view??completeView(store),chg=v.byId.get(change);requireInput(v.coverage.scope_complete,'complete source context required');requireInput(chg?.type==='CHG','CHG required');
  const ldp=chg.relations.map(e=>v.byId.get(e.target)).find(r=>r?.definition.kind==='reverse_engineering');requireInput(ldp,'reverse engineering LDP required');
  const inventory=legacyInventory(ldp.definition.scope),shards=ldp.relations.map(e=>v.byId.get(e.target)).filter(r=>r?.definition.kind==='legacy_inventory'),changes=sourceDelta(shards,inventory);
  const observations=v.records.filter(r=>r.definition.kind==='legacy_observation'&&r.relations.some(e=>e.target===ldp.id));
  const impacts=changes.map(c=>({...c,observations:observations.filter(o=>o.definition.analysis.anchors.some(a=>`${a.root}/${a.path}`===c.key)).map(o=>({id:o.id,...impactGraph(v.records,o.id,{coverage:v.coverage})}))}));
  const current=inventory.digest===ldp.definition.inventory_digest;
  return {change,analysis:ldp.id,current,changes:impacts,coverage:inventory.coverage,counts:inventory.counts,diagnostics:current?inventory.diagnostics:[...inventory.diagnostics,{code:'legacy_source_stale',message:'자료가 달라졌습니다. 근거와 관련 정본을 재분석하세요.'}],note:'파일 차이는 의미 변경 확정이 아니며 실제 실행 검증도 아닙니다.'};
}
export function legacyStagedScope(root,records,paths) {
  const rows=[],outside=[];
  for(const ldp of records.filter(r=>r.definition.kind==='reverse_engineering'))for(const source of ldp.definition.scope.roots){
    const rel=relative(resolve(root),resolve(source.path));
    if(rel.startsWith('..')||isAbsolute(rel)){outside.push({analysis:ldp.id,root:source.key,path:source.path});continue;}
    const prefix=rel.replaceAll('\\','/');
    for(const path of paths)if(!prefix||path.startsWith(`${prefix}/`))rows.push({source:path,analysis:ldp.id,root:source.key,relative:prefix?path.slice(prefix.length+1):path});
  }
  return {rows,outside};
}
