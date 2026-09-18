/* file://에서도 동작하는 단일 HTML 사이트 탐색기 */
(() => {
  const root = document.documentElement;
  const pages = [...document.querySelectorAll('[data-page]')];
  const links = [...document.querySelectorAll('[data-page-link]')];
  const filter = document.querySelector('[data-tree-filter]');
  const currentPath = document.querySelector('[data-current-path]');

  function resolvedTheme() { return root.dataset.theme === 'light' ? 'light' : 'dark'; }

  async function renderMermaid() {
    const nodes = [...document.querySelectorAll('.mermaid[data-mermaid-source]')];
    if (!nodes.length) return;
    for (const node of nodes) {
      try { node.textContent = decodeURIComponent(node.dataset.mermaidSource); } catch { /* 원문 유지 */ }
      node.removeAttribute('data-processed');
      node.classList.remove('mermaid-error');
    }
    if (!window.mermaid) {
      nodes.forEach((node) => node.classList.add('mermaid-error'));
      return;
    }
    try {
      window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: resolvedTheme() === 'dark' ? 'dark' : 'default' });
      await window.mermaid.run({ nodes, suppressErrors: false });
    } catch (error) {
      console.error('Mermaid 렌더링 실패', error);
      nodes.filter((node) => !node.querySelector('svg')).forEach((node) => node.classList.add('mermaid-error'));
    }
  }

  function syncThemeControls() {
    const dark = resolvedTheme() === 'dark';
    document.querySelectorAll('.theme-icon-dark').forEach((icon) => { icon.hidden = !dark; });
    document.querySelectorAll('.theme-icon-light').forEach((icon) => { icon.hidden = dark; });
    document.querySelector('[data-theme-toggle]')?.setAttribute('aria-label', dark ? '라이트 테마로 전환' : '다크 테마로 전환');
    document.querySelectorAll('[data-mockup-body]').forEach((host) => { host.dataset.theme = resolvedTheme(); });
  }
  function theme(value, rerender = true) {
    root.dataset.theme = value;
    try { localStorage.setItem('delivery-theme', value); } catch { /* file:// 저장소 제한 */ }
    syncThemeControls();
    return rerender ? renderMermaid() : Promise.resolve();
  }
  let savedTheme = matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark';
  try {
    const stored = localStorage.getItem('delivery-theme');
    if (stored === 'light' || stored === 'dark') savedTheme = stored;
  } catch { /* 무시 */ }
  theme(savedTheme, false);
  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    window.DELIVERY_READY = theme(resolvedTheme() === 'dark' ? 'light' : 'dark');
  });

  function injectMockups(scope = document) {
    const registry = window.DELIVERY_MOCKUPS || {};
    const holders = [scope.matches?.('[data-mockup]') ? scope : null, ...scope.querySelectorAll('[data-mockup]')].filter(Boolean);
    holders.forEach((holder) => {
      const item = registry[holder.dataset.mockup];
      const body = holder.querySelector('[data-mockup-body]');
      if (!item || !body || body.shadowRoot) return;
      body.dataset.theme = resolvedTheme();
      const shadow = body.attachShadow({ mode: 'open' });
      const isolatedStyle = (item.style || '').replace(/:root/g, ':host')
        .replace(/(^|[}\s,])body(?=\s*[{,.#[:])/gm, '$1.mockup-root');
      shadow.innerHTML = `<style>:host{display:block;color-scheme:light dark}${isolatedStyle}</style><div class="mockup-root">${item.html}</div>`;
      shadow.addEventListener('click', (event) => {
        const anchor = event.target.closest?.('[data-note]');
        if (!anchor) return;
        const note = shadow.getElementById(`note-${anchor.dataset.note}`);
        if (note) { event.preventDefault(); note.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      });
    });
    syncThemeControls();
  }

  function activateDocumentTab(button, focus = false) {
    const tabs = button.closest('[data-document-tabs]');
    if (!tabs) return;
    const key = button.dataset.documentTab;
    tabs.querySelectorAll('[data-document-tab]').forEach((item) => {
      const selected = item === button;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    tabs.querySelectorAll('[data-document-panel]').forEach((panel) => { panel.hidden = panel.dataset.documentPanel !== key; });
    if (focus) button.focus();
  }
  document.querySelectorAll('[data-document-tab]').forEach((button) => {
    button.addEventListener('click', () => activateDocumentTab(button));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const buttons = [...button.closest('[role="tablist"]').querySelectorAll('[data-document-tab]')];
      const current = buttons.indexOf(button);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault();
      activateDocumentTab(buttons[next], true);
    });
  });

  function show(id, updateHash = true) {
    const current = pages.find((page) => page.id === id);
    if (!current) return false;
    pages.forEach((page) => { page.hidden = page.id !== id; });
    links.forEach((link) => {
      const active = link.dataset.pageLink === id;
      link.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
        if (currentPath) {
          currentPath.textContent = link.dataset.pagePath || link.textContent.trim();
          currentPath.title = currentPath.textContent;
        }
      } else link.removeAttribute('aria-current');
    });
    if (updateHash) history.replaceState(null, '', `#${id}`);
    document.querySelector('.main-wrap')?.scrollTo(0, 0);
    injectMockups(current);
    return true;
  }
  function closeSidebar() {
    document.querySelector('#sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-backdrop')?.classList.remove('open');
    const button = document.querySelector('[data-menu-toggle]');
    button?.setAttribute('aria-expanded', 'false');
    button?.setAttribute('aria-label', '목차 열기');
  }
  links.forEach((link) => link.addEventListener('click', () => { show(link.dataset.pageLink); closeSidebar(); }));
  if (!show(location.hash.slice(1), false) && pages[0]) show(pages[0].id, false);
  addEventListener('hashchange', () => show(location.hash.slice(1), false));

  document.querySelectorAll('[data-tree-group]').forEach((button) => {
    button.addEventListener('click', () => {
      const collapsed = button.closest('li')?.classList.toggle('collapsed') ?? false;
      button.setAttribute('aria-expanded', String(!collapsed));
    });
  });
  document.querySelector('[data-menu-toggle]')?.addEventListener('click', () => {
    const open = document.querySelector('#sidebar')?.classList.toggle('open') ?? false;
    document.querySelector('.sidebar-backdrop')?.classList.toggle('open', open);
    const button = document.querySelector('[data-menu-toggle]');
    button?.setAttribute('aria-expanded', String(open));
    button?.setAttribute('aria-label', open ? '목차 닫기' : '목차 열기');
  });
  document.querySelector('.sidebar-backdrop')?.addEventListener('click', closeSidebar);

  filter?.addEventListener('input', () => {
    const query = filter.value.trim().toLocaleLowerCase();
    links.forEach((link) => {
      const page = document.getElementById(link.dataset.pageLink);
      const hit = !query || `${link.textContent} ${page?.textContent || ''}`.toLocaleLowerCase().includes(query);
      link.closest('li')?.classList.toggle('filtered', !hit);
    });
    [...document.querySelectorAll('.tree-branch')].reverse().forEach((group) => {
      const visible = [...group.querySelectorAll('[data-page-link]')].some((link) => !link.closest('li')?.classList.contains('filtered'));
      group.classList.toggle('filtered', !visible);
    });
  });

  const settings = { width: 'standard', font: 'system', size: '100' };
  try { Object.assign(settings, JSON.parse(localStorage.getItem('delivery-ui') || '{}')); } catch { /* 무시 */ }
  const controls = {
    width: document.querySelector('[data-ui-width]'), font: document.querySelector('[data-ui-font]'), size: document.querySelector('[data-ui-size]'),
  };
  function applySettings() {
    if (!['standard', 'full'].includes(settings.width)) settings.width = 'standard';
    if (!['system', 'gothic', 'serif', 'mono'].includes(settings.font)) settings.font = 'system';
    if (!['90', '100', '110', '120', '130', '140', '150'].includes(settings.size)) settings.size = '100';
    root.dataset.contentWidth = settings.width;
    root.dataset.uiFont = settings.font;
    root.style.setProperty('--ui-scale', String(Number(settings.size) / 100));
    for (const [key, control] of Object.entries(controls)) if (control) control.value = settings[key];
    try { localStorage.setItem('delivery-ui', JSON.stringify(settings)); } catch { /* 무시 */ }
  }
  for (const [key, control] of Object.entries(controls)) control?.addEventListener('change', () => { settings[key] = control.value; applySettings(); });
  applySettings();

  const settingsButton = document.querySelector('[data-ui-settings-toggle]');
  const settingsPanel = document.querySelector('[data-ui-settings-panel]');
  settingsButton?.addEventListener('click', () => {
    const open = settingsPanel?.hasAttribute('hidden');
    settingsPanel?.toggleAttribute('hidden', !open);
    settingsButton.setAttribute('aria-expanded', String(open));
  });
  document.querySelector('[data-ui-reset]')?.addEventListener('click', () => {
    Object.assign(settings, { width: 'standard', font: 'system', size: '100' }); applySettings();
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest?.('.ui-settings')) {
      settingsPanel?.setAttribute('hidden', ''); settingsButton?.setAttribute('aria-expanded', 'false');
    }
  });

  document.querySelector('[data-print-page]')?.addEventListener('click', () => window.print());
  window.DELIVERY_READY = renderMermaid();
})();
