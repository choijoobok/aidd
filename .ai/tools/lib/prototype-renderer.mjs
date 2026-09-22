import { digest, sha, definitionHash } from './record-contracts.mjs';

export const PROTOTYPE_RENDERER = 'owned-prototype-2.0';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const unwrap = x => x?.status === 'known' ? x.value : x?.status === 'not_applicable' ? [] : x;
export function prototypeModel(screen) {
  return Object.fromEntries(['fields', 'actions', 'view_states', 'transitions', 'prototype_scenarios'].map(key => [key, unwrap(screen.definition[key]) ?? []]));
}
export function prototypeErrors(screen) {
  const m = prototypeModel(screen), errors = [];
  for (const key of ['fields', 'actions', 'view_states', 'prototype_scenarios']) if (!Array.isArray(m[key]) || !m[key].length) errors.push(`missing ${key}`);
  if (errors.length) return errors;
  for (const key of Object.keys(m)) if (!Array.isArray(m[key])) errors.push(`${key} must be an array`);
  if (errors.length) return errors;
  for (const key of ['fields', 'actions', 'view_states', 'prototype_scenarios']) {
    const keys = m[key].map(x => x.key); if (keys.some(k => typeof k !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(k)) || new Set(keys).size !== keys.length) errors.push(`${key} stable keys`);
  }
  const states = new Set(m.view_states.map(x => x.key)), actions = new Set(m.actions.map(x => x.key));
  for (const f of m.fields) if (!f.label || !['text', 'number', 'email', 'date', 'checkbox', 'select', 'textarea'].includes(f.type)) errors.push(`field ${f.key} label/type`);
  for (const a of m.actions) if (!a.label) errors.push(`action ${a.key} label`);
  for (const tr of m.transitions) if (!states.has(tr.from) || !states.has(tr.to) || !actions.has(tr.action)) errors.push('invalid transition');
  for (const scenario of m.prototype_scenarios) {
    if (!scenario.title || !states.has(scenario.initial) || !states.has(scenario.expected) || !Array.isArray(scenario.steps) || !scenario.steps.length) { errors.push(`scenario ${scenario.key} incomplete`); continue; }
    let state = scenario.initial;
    for (const step of scenario.steps) { const tr = m.transitions.find(t => t.from === state && t.action === step.action); if (!tr) { errors.push(`scenario ${scenario.key} unreachable`); break; } state = tr.to; }
    if (state !== scenario.expected) errors.push(`scenario ${scenario.key} expected state mismatch`);
  }
  return errors;
}
export function renderPrototype(screen, input_digest) {
  const errors = prototypeErrors(screen); if (errors.length) return { errors, html: null, output_hash: null };
  const m = prototypeModel(screen), e = escapeHtml;
  const fields = m.fields.map(f => `<label for="${e(f.key)}">${e(f.label)}${f.required ? ' *' : ''}</label>${f.type === 'select' ? `<select id="${e(f.key)}" name="${e(f.key)}" ${f.required ? 'required' : ''}>${(f.options ?? []).map(o => `<option>${e(o)}</option>`).join('')}</select>` : f.type === 'textarea' ? `<textarea id="${e(f.key)}" name="${e(f.key)}" ${f.required ? 'required' : ''}></textarea>` : `<input id="${e(f.key)}" name="${e(f.key)}" type="${e(f.type)}" ${f.required ? 'required' : ''} value="${e(f.example ?? '')}">`}`).join('\n');
  const model = JSON.stringify(m).replaceAll('<', '\\u003c');
  const html = `<!doctype html>
<html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(screen.title)} — prototype</title>
<style>body{font:16px system-ui;margin:0;background:#f4f6f8;color:#15202b}main{max-width:900px;margin:2rem auto;padding:2rem;background:white;border-radius:12px}header{border-bottom:1px solid #ccd;padding-bottom:1rem}label{display:block;margin-top:1rem}input,select,textarea{box-sizing:border-box;padding:.7rem;max-width:100%;font:inherit}button{font:inherit;padding:.6rem 1rem;margin:.8rem .4rem .8rem 0;cursor:pointer}button:focus,input:focus,select:focus{outline:3px solid #1669bb}aside{background:#edf3fc;padding:1rem}.notice{color:#5d3b00}#error{color:#a00}@media(max-width:600px){main{margin:0;padding:1rem}input,select,textarea{width:100%}}</style>
<main><header><p class="notice">PROTOTYPE — 실제 제품 화면/실행 증거가 아닙니다.</p><h1>${e(screen.title)}</h1><small>${e(screen.id)} · definition ${definitionHash(screen)} · ${PROTOTYPE_RENDERER}<br>입력 ${input_digest}</small></header>
<p>${e(unwrap(screen.definition.purpose))}</p><label for="scenario">검토 시나리오</label><select id="scenario">${m.prototype_scenarios.map(s => `<option value="${e(s.key)}">${e(s.title)}</option>`).join('')}</select>
<aside><h2 id="state-title"></h2><p id="state-message" aria-live="polite"></p></aside><form id="prototype-form">${fields}<p id="error" role="alert"></p><div>${m.actions.map(a => `<button type="button" data-action="${e(a.key)}">${e(a.label)}</button>`).join('')}</div></form>
<details><summary>검토 시나리오와 기대 결과</summary><ul>${m.prototype_scenarios.map(s => `<li>${e(s.title)}: ${e(s.initial)} → ${e(s.steps.map(x => x.action).join(' → '))} → ${e(s.expected)}</li>`).join('')}</ul></details></main>
<script>const model=${model};let state=model.prototype_scenarios[0].initial;function render(){const s=model.view_states.find(x=>x.key===state);document.getElementById('state-title').textContent=s.title||s.key;document.getElementById('state-message').textContent=s.message||'';document.querySelectorAll('[data-action]').forEach(b=>b.disabled=!model.transitions.some(t=>t.from===state&&t.action===b.dataset.action));}document.getElementById('scenario').addEventListener('change',e=>{state=model.prototype_scenarios.find(s=>s.key===e.target.value).initial;document.getElementById('error').textContent='';render();});document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{const t=model.transitions.find(t=>t.from===state&&t.action===b.dataset.action);if(!t)return;const form=document.getElementById('prototype-form');if(t.validate&&!form.checkValidity()){document.getElementById('error').textContent=t.error_message||'입력값을 확인하세요.';form.reportValidity();return;}state=t.to;document.getElementById('error').textContent='';render();}));render();</script></html>
`;
  return { errors: [], html, output_hash: sha(html), model_digest: digest(m), input_digest };
}
