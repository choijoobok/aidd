import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, posix } from 'node:path';
import { sha, digest, definitionHash } from './record-contracts.mjs';
import { safePath, StoreError, walk } from './record-store.mjs';
import { atomicJson } from './record-index.mjs';
import { readContext } from './lifecycle-operations.mjs';
import { briefing, briefingText } from './record-views.mjs';
import { prototypeInput, actualEvidence, evaluate, closure } from './readiness.mjs';
import { renderPrototype, escapeHtml, unwrap } from './prototype-renderer.mjs';
import { renderProcess } from './process-renderer.mjs';
import { businessEdges } from './business-discovery.mjs';

const NOTICE = '<!-- Generated from owned-records-v2. Do not edit. -->\n\n';
const outputPath = r => r.owner.kind === 'module' ? `modules/${r.owner.id}/${r.type}/${r.id}.md` : `common/${r.type}/${r.id}.md`;
function format(value) {
  if (value?.status === 'not_applicable') return `비적용 — ${value.reason}`;
  if (value?.status === 'unknown') return '미정 — 상세화 필요';
  if (value?.status === 'known') return format(value.value);
  if (Array.isArray(value)) return value.map(v => `- ${typeof v === 'object' ? Object.entries(v).map(([k, x]) => `${k}: ${format(x)}`).join(' · ') : String(v)}`).join('\n');
  if (value && typeof value === 'object') return Object.entries(value).map(([k, v]) => `- ${k}: ${format(v)}`).join('\n');
  return String(value ?? '미정');
}
export function recordMarkdown(r, map) {
  const path = outputPath(r), refs = [...r.relations, ...businessEdges(r)].map(rel => { const target = map.get(rel.target); return `- ${rel.type}: ${target ? `[${rel.target}](${posix.relative(posix.dirname(path), outputPath(target))})` : rel.target}${rel.selector ? `#${rel.selector}` : ''}`; }).join('\n');
  const flow = r.type === 'BPR' ? `\n## 업무 흐름도\n\n![${r.title}](${r.id}.svg)\n\n${(r.definition.transitions ?? []).map((t, i) => `${i + 1}. ${t.from} → ${t.to} · ${t.kind}: ${t.condition}`).join('\n')}\n` : '';
  return `${NOTICE}# ${r.title}\n\n- ID: ${r.id}\n- 정본 소유: ${r.owner.id ?? 'project'}\n- 정의 해시: ${definitionHash(r)}\n- 정의: ${r.lifecycle} / 실행: ${r.execution?.status ?? 'not_run'}\n\n${Object.entries(r.definition).map(([key, value]) => `## ${key}\n\n${format(value)}\n`).join('\n')}\n## 연결\n\n${refs || '연결 없음'}\n${flow}`;
}
export function offlineSite(title, pages, { home = './index.html', introduction = '' } = {}) {
  const e = escapeHtml;
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title><style>body{font:16px system-ui;margin:0;color:#172331;background:#f6f8fb}header{padding:1rem;background:#173e61;color:white;position:sticky;top:0}header a{color:white}nav{position:fixed;width:240px;max-height:75vh;overflow:auto;padding:1rem}main{margin-left:280px;max-width:1000px;padding:1rem}article{background:white;padding:1.5rem;margin-bottom:1rem;overflow-wrap:anywhere}pre{white-space:pre-wrap;font:inherit}button,input{font:inherit;margin:.3rem;padding:.4rem}body.dark{background:#15191f;color:#eef}body.dark article{background:#252b34}img{max-width:100%}@media(max-width:700px){nav{position:static;width:auto}main{margin:0}}@media print{nav,header button,header input{display:none}main{margin:0}article{break-inside:avoid}}</style><header><a href="${e(home)}">${e(title)}</a><input id="search" type="search" aria-label="제목과 본문 검색" placeholder="문서 검색"><button id="print">인쇄</button><button id="theme">테마</button><button id="font">글자 확대</button></header><nav aria-label="문서 목차">${pages.map((p, i) => `<p><a href="#page-${i}">${e(p.title)}</a></p>`).join('')}</nav><main><h1>${e(title)}</h1><p>${e(introduction)}</p>${pages.map((p, i) => `<article id="page-${i}"><h2>${e(p.title)}</h2><pre>${e(p.content)}</pre>${p.image ? `<img src="${e(p.image)}" alt="${e(p.image_alt ?? p.title)}">` : ''}</article>`).join('')}</main><script>document.getElementById('search').addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('article').forEach(a=>a.hidden=!a.textContent.toLowerCase().includes(q));});document.getElementById('print').onclick=()=>window.print();document.getElementById('theme').onclick=()=>document.body.classList.toggle('dark');let large=false;document.getElementById('font').onclick=()=>{large=!large;document.body.style.fontSize=large?'20px':'16px';};</script></html>\n`;
}
function manualPage(r, records, { release = false } = {}) {
  const d = r.definition;
  if (!d.audience || !d.preconditions || !d.steps?.length || !d.expected || !d.error_recovery) throw new StoreError('manual_incomplete', r.id);
  const screenshots = records.filter(e => e.type === 'EVD' && e.definition.kind === 'screenshot' && e.definition.subjects?.includes(r.id) && e.definition.mode === 'actual' && e.definition.commit && e.definition.environment && e.definition.screen && e.definition.input_hash === definitionHash(r));
  if (release && !screenshots.length) throw new StoreError('actual_screenshot_required', r.id);
  return { title: r.title, content: `${screenshots.length ? '실제 화면 증거 연결됨' : '설계 검토본 — 실제 구현 화면이 아닙니다.'}\n\n사전 조건\n${format(d.preconditions)}\n\n사용 절차\n${format(d.steps)}\n\n예상 결과\n${format(d.expected)}\n\n오류 복구\n${format(d.error_recovery)}\n\n지원\n${format(d.support)}`, screenshot: screenshots[0] };
}
function navigationDocuments(store) {
  const modules = store.files().filter(p => p.endsWith('/module.json')).map(p => JSON.parse(readFileSync(safePath(store.ssot, p), 'utf8'))).sort((a, b) => a.id.localeCompare(b.id));
  const project = JSON.parse(readFileSync(join(store.ssot, 'project.json'), 'utf8')), outputs = new Map();
  const common = store.readScope({ owner: 'project', dependencies: false }).records;
  const systems = common.filter(r => r.type === 'SYS' && r.lifecycle !== 'retired');
  outputs.set('common/index.md', `${NOTICE}# 공통 업무 정의\n\n${common.map(r => `- [${r.type} · ${r.title}](${posix.relative('common', outputPath(r))})`).join('\n')}\n`);
  outputs.set('index.md', `${NOTICE}# ${project.name}\n\n${modules.map(m => `- [${m.title}](modules/${m.id}/index.md)`).join('\n')}\n`);
  outputs.set('site/index.html', offlineSite(project.name, systems.length ? systems.map(r => ({ title: r.title, content: Object.entries(r.definition).map(([k,v]) => `${k}\n${format(v)}`).join('\n\n') })) : [{ title: '시스템 이해부터 시작하세요', content: 'SYS 시스템 개요 → CAP 핵심 업무 → ACT 업무 역할 → UC 유즈케이스 ↔ BPR 업무 흐름 → REQ/NFR. 기존 공통 정의가 있으면 참조하고 새 모듈의 분석 주기를 시작하세요.' }]).replace('</main>', `<section><h2>문서 사이트</h2><p><a href="../common/index.html">공통 업무 정의</a></p>${modules.map(m => `<p><a href="../modules/${m.id}/index.html">${escapeHtml(m.title)} 설계·검증</a> · <a href="../manuals/${m.id}/index.html">사용자 가이드</a></p>`).join('')}</section></main>`));
  return outputs;
}
function outputOwner(path) {
  if (['index.md', 'site/index.html', 'common/index.md', 'common/index.html'].includes(path)) return 'project-navigation';
  if (/^common\/[^/]+\/[^/]+\.(md|svg)$/.test(path)) return `common-${path.split('/')[2].replace(/\.(md|svg)$/, '')}`;
  return path.match(/^(?:modules|manuals)\/(MOD-[A-Z0-9-]+)\//)?.[1] ?? path.match(/^ui\/modules\/(MOD-[A-Z0-9-]+)\//)?.[1] ?? 'project';
}
export function renderDocuments(store, { module, change, evaluated_at = null } = {}) {
  const view = module || change ? readContext(store, change, module) : store.scanAll();
  view.evaluated_at = evaluated_at;
  if (!view.coverage.scope_complete) throw new StoreError('generation_input', JSON.stringify(view.diagnostics));
  const map = view.byId, selectedModule = module ?? (change ? map.get(change)?.owner.id : null);
  // Link shared documents deterministically without parsing unrelated module bodies.
  const linkMap = new Map(map);
  for (const path of store.files()) {
    const parts = path.split('/'), id = parts.at(-1) === 'module.json' ? parts.at(-2) : parts.at(-1).slice(0, -5);
    if (!linkMap.has(id)) linkMap.set(id, { id, type: parts.at(-1) === 'module.json' ? 'MOD' : parts.at(-2), owner: parts[0] === 'common' ? { kind: 'project' } : { kind: 'module', id: parts[1] } });
  }
  const selected = view.records.filter(r => !selectedModule || r.owner.id === selectedModule || r.owner.kind === 'project'), outputs = new Map();
  const scopeKey = selectedModule ?? 'project';
  const model = briefing(view, { module: selectedModule });
  const base = selectedModule ? `modules/${selectedModule}/` : '';
  outputs.set(`${base}status.json`, `${JSON.stringify(model, null, 2)}\n`); outputs.set(`${base}status.md`, NOTICE + briefingText(model));
  for (const r of selected) {
    outputs.set(outputPath(r), recordMarkdown(r, linkMap));
    if (r.type === 'BPR') outputs.set(outputPath(r).replace(/\.md$/, '.svg'), renderProcess(r));
    if (r.type === 'SCR') {
      const ui = `ui/modules/${r.owner.id}/${r.id}/`, rendered = renderPrototype(r, prototypeInput(view.records, r.id));
      outputs.set(`${ui}specification.md`, recordMarkdown(r, linkMap));
      if (rendered.html) outputs.set(`${ui}mockup.html`, rendered.html);
      outputs.set(`${ui}prototype.json`, `${JSON.stringify({ ...rendered, html: undefined }, null, 2)}\n`);
    }
    if (r.type === 'MAN') {
      const page = manualPage(r, view.records);
      outputs.set(`manuals/${r.owner.id ?? 'common'}/${r.id}.md`, NOTICE + `# ${page.title}\n\n${page.content}\n`);
    }
  }
  const owners = [...new Set(selected.filter(r => r.owner.kind === 'module').map(r => r.owner.id))].sort();
  const commonPages = selected.filter(r => r.owner.kind === 'project').map(r => ({ title: `${r.type} · ${r.title}`, content: recordMarkdown(r, linkMap) }));
  outputs.set('common/index.html', offlineSite('공통 업무 정의', commonPages, { home: '../site/index.html' }).replace('</main>', `${selected.filter(r => r.owner.kind === 'project' && r.type === 'BPR').map(r => `<section><h2>${escapeHtml(r.title)} 흐름도</h2><img src="BPR/${r.id}.svg" alt="${escapeHtml(r.title)} 업무 흐름도"></section>`).join('')}</main>`));
  for (const owner of owners) {
    const items = selected.filter(r => r.owner.id === owner), indexPath = `modules/${owner}/index.md`;
    outputs.set(indexPath, `${NOTICE}# ${map.get(owner)?.title ?? owner}\n\n${items.map(r => `- [${r.type} · ${r.title}](${posix.relative(posix.dirname(indexPath), outputPath(r))})`).join('\n')}\n`);
    const pages = items.map(r => ({ title: `${r.type} · ${r.title}`, content: recordMarkdown(r, linkMap) }));
    outputs.set(`modules/${owner}/index.html`, offlineSite(map.get(owner)?.title ?? owner, pages, { home: '../../site/index.html' }).replace('</main>', `${items.filter(r => r.type === 'BPR').map(r => `<section><h2>${escapeHtml(r.title)} 흐름도</h2><img src="BPR/${r.id}.svg" alt="${escapeHtml(r.title)} 업무 흐름도"></section>`).join('')}</main>`));
    const manuals = items.filter(r => r.type === 'MAN').map(r => manualPage(r, view.records));
    outputs.set(`manuals/${owner}/index.html`, offlineSite(`${map.get(owner)?.title ?? owner} 사용자 가이드`, manuals, { home: '../../site/index.html' }));
  }
  if (!selectedModule) for (const owner of owners) for (const [p, content] of renderDocuments(store, { module: owner, evaluated_at }).outputs) outputs.set(p, content);
  for (const [p, content] of navigationDocuments(store)) outputs.set(p, content);
  return { outputs, view, scopeKey, model };
}
export function generateDocuments(store, options = {}) {
  const result = renderDocuments(store, options), root = resolve(options.output ?? join(store.project, 'docs/generated'));
  if (root === store.base || root.startsWith(`${store.base}/`) || root.startsWith(`${store.base}\\`)) throw new StoreError('output_boundary', 'generated documents cannot own canonical storage');
  if (!existsSync(root)) mkdirSync(root, { recursive: true });
  const groups = new Map();
  for (const [p, content] of result.outputs) { const owner = outputOwner(p); if (!groups.has(owner)) groups.set(owner, new Map()); groups.get(owner).set(p, content); }
  const prepared = [...groups].map(([scopeKey, outputs]) => prepareOutput(root, { ...result, scopeKey, outputs }));
  for (const [p, hash] of Object.entries(result.view.hashes)) if (sha(readFileSync(safePath(store.ssot, p))) !== hash) throw new StoreError('generation_input_changed', p, 3);
  for (const p of prepared) p.write();
  return { scope: result.scopeKey, count: result.outputs.size, output: root, manifests: prepared.map(p => p.manifest), coverage: result.view.coverage, lifecycle_readiness: !result.model.evaluations.length ? 'not_applicable' : result.model.evaluations.every(e => e.readiness === 'ready') ? 'ready' : 'blocked' };
}
function prepareOutput(root, result) {
  const manifests = join(root, 'manifests'), manifestPath = join(manifests, `${result.scopeKey}.json`);
  const old = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { files: {} };
  // Validate all old/new targets before any mutation. Never overwrite unowned or edited output.
  for (const [p, hash] of Object.entries(old.files)) {
    const path = safePath(root, p); if (existsSync(path) && sha(readFileSync(path)) !== hash) throw new StoreError('generated_edit_conflict', p, 3);
  }
  const otherOwners = new Map();
  for (const p of walk(manifests).filter(p => p.endsWith('.json') && p !== `${result.scopeKey}.json`)) {
    const m = JSON.parse(readFileSync(join(manifests, p), 'utf8')); for (const [file, hash] of Object.entries(m.files ?? {})) otherOwners.set(file, { manifest: p, hash });
  }
  for (const [p, content] of result.outputs) {
    const path = safePath(root, p);
    if (!old.files[p] && existsSync(path) && sha(readFileSync(path)) !== sha(content)) throw new StoreError(otherOwners.has(p) ? 'output_owner_conflict' : 'unowned_output', p, 3);
  }
  const manifest = { schema_version: 2, scope: result.scopeKey, input_digest: digest([...result.outputs].map(([p, c]) => [p, sha(c)])), files: Object.fromEntries([...result.outputs].map(([p, c]) => [p, sha(c)])) };
  return { manifest, write() {
    for (const p of Object.keys(old.files)) if (!result.outputs.has(p) && !otherOwners.has(p)) rmSync(safePath(root, p), { force: true });
    for (const [p, content] of result.outputs) { const path = safePath(root, p); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content, 'utf8'); }
    atomicJson(manifestPath, manifest);
  } };
}
export function checkDocuments(store, options = {}) {
  const result = renderDocuments(store, options), root = resolve(options.output ?? join(store.project, 'docs/generated')), errors = [];
  for (const owner of new Set([...result.outputs.keys()].map(outputOwner))) {
    const manifestPath = join(root, 'manifests', `${owner}.json`), saved = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
    if (!saved) errors.push({ code: 'output_manifest_missing', owner });
    else {
      if (digest(Object.keys(saved.files).sort()) !== digest([...result.outputs.keys()].filter(p => outputOwner(p) === owner).sort())) errors.push({ code: 'output_inventory_mismatch', owner });
      for (const [p, content] of result.outputs) if (outputOwner(p) === owner && saved.files[p] !== sha(content)) errors.push({ code: 'output_manifest_stale', path: p });
    }
  }
  for (const [p, content] of result.outputs) if (!existsSync(safePath(root, p)) || readFileSync(safePath(root, p), 'utf8') !== content) errors.push({ code: 'generated_drift', path: p });
  return { diagnostics: errors, coverage: result.view.coverage, current: errors.length === 0, compared_files: result.outputs.size };
}
export function buildDelivery(store, profileId, output, evaluated_at = null) {
  const view = store.scanAll(), profile = view.byId.get(profileId), d = profile?.definition;
  view.evaluated_at = evaluated_at;
  if (profile?.type !== 'DLP' || !view.coverage.scope_complete || !Array.isArray(d.includes) || !['internal', 'end_user'].includes(d.audience)) throw new StoreError('delivery_profile', profileId);
  if (!output || existsSync(resolve(output))) throw new StoreError('target_exists', 'explicit missing output directory required');
  const selected = view.records.filter(r => !d.modules?.length || d.modules.includes(r.owner.id));
  if (d.purpose === 'release') {
    const status = evaluate(view.records, d.release, 'release', view); if (status.readiness !== 'ready') throw new StoreError('delivery_release_blocked', JSON.stringify(status.blockers));
  }
  const pages = [];
  if (d.includes.includes('user')) for (const r of selected.filter(r => r.type === 'MAN')) pages.push(manualPage(r, view.records, { release: d.purpose === 'release' }));
  if (d.includes.includes('operations')) for (const r of selected.filter(r => r.type === 'RUN')) pages.push({ title: r.title, content: format(r.definition) });
  if (d.includes.includes('design')) {
    if (d.audience === 'end_user') throw new StoreError('delivery_boundary', 'internal design records are not end-user material');
    const design = closure(view.records, selected.map(r => r.id)).records;
    for (const r of design.filter(r => ['SYS', 'CAP', 'ACT', 'UC', 'BPR', 'REQ', 'NFR', 'FEAT', 'SCR', 'DAT', 'NAV', 'IFC'].includes(r.type) || r.type === 'POL' && r.definition.kind === 'system_access')) pages.push({ title: r.title, content: recordMarkdown(r, view.byId), ...(r.type === 'BPR' ? { image: `data:image/svg+xml;base64,${Buffer.from(renderProcess(r)).toString('base64')}`, image_alt: `${r.title} 업무 흐름도` } : {}) });
  }
  if (d.includes.includes('glossary')) for (const r of selected.filter(r => r.type === 'TRM' && r.lifecycle === 'active' && (d.audience !== 'end_user' || (r.definition.visibility === 'customer' && r.definition.audience?.includes('end_user'))))) pages.push({ title: r.title, content: format(r.definition.meaning ?? r.definition.definition) });
  for (const page of pages.filter(p => p.screenshot)) {
    const image = page.screenshot.definition;
    if (!image.file || !image.sha256 || !/\.(png|jpg|jpeg)$/i.test(image.file)) throw new StoreError('screenshot_artifact', 'verified PNG/JPEG path and SHA256 required');
    const raw = readFileSync(safePath(store.project, image.file));
    if (sha(raw) !== image.sha256) throw new StoreError('screenshot_artifact', 'screenshot bytes changed');
    page.image = `data:image/${/\.png$/i.test(image.file) ? 'png' : 'jpeg'};base64,${raw.toString('base64')}`;
    page.image_alt = image.alt ?? page.title;
  }
  if (!pages.length) throw new StoreError('empty_delivery', profileId);
  if (d.audience === 'end_user' && pages.some(p => /\b(?:SYS|CAP|ACT|POL|UC|BPR|REQ|CHG|WRK|SCR|FEAT|RVW|BSL|IMP|EVD|KIT)-[A-Z0-9-]+\b|project\/\.aidd|\.ai\//.test(p.content))) throw new StoreError('delivery_boundary', 'internal IDs or paths in end-user content');
  const root = resolve(output); mkdirSync(root, { recursive: true });
  const content = offlineSite(profile.title, pages); writeFileSync(join(root, 'index.html'), content);
  const manifest = { schema_version: 2, audience: d.audience, purpose: d.purpose ?? 'design', input_digest: view.snapshot_token, files: { 'index.html': sha(content) }, actual_screens: pages.filter(p => p.screenshot).length };
  atomicJson(join(root, 'manifest.json'), manifest); return { output: root, manifest };
}
