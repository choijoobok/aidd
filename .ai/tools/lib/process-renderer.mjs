import { escapeHtml as e } from './prototype-renderer.mjs';

// Deterministic, offline SVG. Array order controls layout only; arrows are the BPR transitions.
export function renderProcess(record) {
  const d = record.definition, steps = Array.isArray(d.steps) ? d.steps.filter(s => s && typeof s === 'object') : [], edges = Array.isArray(d.transitions) ? d.transitions.filter(s => s && typeof s === 'object') : [];
  const positions = new Map(steps.map((s, i) => [s.key, 90 + i * 160])), width = 840 + edges.length * 20, height = Math.max(220, steps.length * 160 + 100);
  const text = (value, x, y) => {
    const chunks = String(value ?? '').replace(/[\r\n]/g, ' ').match(/.{1,32}/gu) ?? [''];
    if (chunks.length > 2) { chunks.length = 2; chunks[1] = `${chunks[1].slice(0, 29)}…`; }
    return `<text x="${x}" y="${y}">${chunks.map((line, i) => `<tspan x="${x}" dy="${i ? 19 : 0}">${e(line)}</tspan>`).join('')}</text>`;
  };
  const nodes = steps.map(s => `<g><title>${e(JSON.stringify(s))}</title><rect x="60" y="${positions.get(s.key)}" width="490" height="125" rx="12" fill="${d.terminals?.includes(s.key) ? '#e4f4e8' : '#eef4ff'}" stroke="#28537e"/>${text(`${s.key} · ${s.title}`, 76, positions.get(s.key) + 25)}${text(`${s.kind} · ${s.actor ?? '주체 미정'}${s.key === d.initial ? ' · 시작' : ''}`, 76, positions.get(s.key) + 72)}${text(s.use_case ? `${s.use_case} / ${s.use_case_step ?? '?'}` : s.subprocess ?? '', 76, positions.get(s.key) + 108)}</g>`).join('');
  const arrows = edges.map((edge, i) => {
    if (!positions.has(edge.from) || !positions.has(edge.to)) return '';
    const y1 = positions.get(edge.from) + 42, y2 = positions.get(edge.to) + 92, x = 590 + i * 20;
    return `<g><title>${e(`${edge.from} → ${edge.to}: ${edge.kind} / ${edge.condition}`)}</title><path d="M550 ${y1} H${x} V${y2} H552" fill="none" stroke="#536985" marker-end="url(#arrow)"/><text x="555" y="${y1 - 8}">${i + 1}</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${e(record.title)} 업무 흐름도"><title>${e(record.title)}</title><desc>구조화된 BPR의 단계와 전이에서 생성. 전이 번호와 상세 조건은 함께 제공되는 명세를 참조하세요.</desc><style>text{font:15px system-ui;fill:#17344f}</style><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#536985"/></marker></defs><rect width="100%" height="100%" fill="white"/>${text(record.title, 60, 35)}${nodes}${arrows}</svg>\n`;
}
