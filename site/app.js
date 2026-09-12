/* 27thu · 高考提分技巧速查
 * 零依赖单页：数据来自 /data/index.json，正文来自 /tech/<file>.md。
 * markdown / 公式的抽取与渲染交给 /md.js（window.GKSMD），这里只负责编排与交互。
 */
(() => {
  'use strict';

  const REPO = 'kuangketongxue/gaokao-shortcuts';
  const el = (id) => document.getElementById(id);
  const MD = window.GKSMD;
  const escapeHtml = (s) => (MD ? MD.escapeHtml(s) : String(s));

  const ui = {
    list: el('view-list'),
    detail: el('view-detail'),
    grid: el('grid'),
    empty: el('empty'),
    meta: el('list-meta'),
    search: el('search'),
    filters: el('filters'),
    doc: el('doc'),
    rawLink: el('raw-link'),
    editLink: el('edit-link'),
    back: el('back'),
  };

  let DATA = { items: [] };
  const state = { q: '', status: 'all' };

  /* ── 列表 ─────────────────────────────────────────────── */

  function matches(item) {
    if (state.status !== 'all' && item.status !== state.status) return false;
    const q = state.q.trim().toLowerCase();
    if (!q) return true;
    return [item.number, item.name, item.summary, item.verifiedIn, item.statusLabel]
      .join(' ')
      .toLowerCase()
      .includes(q);
  }

  function card(item) {
    return `
      <a class="card" href="#/t/${encodeURIComponent(item.slug)}">
        <div class="card-top">
          <span class="card-no">${escapeHtml(item.number)}</span>
          <span class="card-name">${escapeHtml(item.name)}</span>
          <span class="pill ${escapeHtml(item.status)}">${item.statusDot} ${escapeHtml(item.statusLabel)}</span>
        </div>
        <p class="card-summary">${escapeHtml(item.summary)}</p>
        <div class="card-foot">
          <span>验证场景：${escapeHtml(item.verifiedIn)}</span>
        </div>
      </a>`;
  }

  function renderList() {
    const shown = DATA.items.filter(matches);
    ui.grid.innerHTML = shown.map(card).join('');
    ui.empty.hidden = shown.length > 0;
    ui.meta.textContent =
      shown.length === DATA.items.length
        ? `共 ${DATA.items.length} 条技巧`
        : `匹配 ${shown.length} / ${DATA.items.length} 条技巧`;
  }

  function renderFilters() {
    const order = [
      ['all', '全部'],
      ['real', '🟢 真题验证'],
      ['mock', '🟡 模拟考验证'],
      ['unverified', '⚪ 未验证'],
    ];
    ui.filters.innerHTML = order
      .map(([key, label]) => {
        const n =
          key === 'all' ? DATA.items.length : DATA.items.filter((i) => i.status === key).length;
        return `<button class="chip" type="button" data-status="${key}" aria-pressed="${state.status === key}">${label}<span class="n">${n}</span></button>`;
      })
      .join('');
  }

  /* ── 详情 ─────────────────────────────────────────────── */

  async function showDetail(slug) {
    switchView('detail');
    ui.doc.className = 'doc loading';
    ui.doc.textContent = '加载中…';

    const item = DATA.items.find((i) => i.slug === slug);
    if (!item) {
      ui.doc.className = 'doc';
      ui.doc.innerHTML =
        '<h1>找不到这条技巧</h1><p class="muted">它可能已被重命名或删除。返回列表看看吧。</p>';
      return;
    }

    const file = encodeURIComponent(item.file);
    const rawUrl = `https://raw.githubusercontent.com/${REPO}/main/tech/${file}`;
    ui.rawLink.href = rawUrl;
    ui.editLink.href = `https://github.com/${REPO}/edit/main/tech/${file}`;
    document.title = `${item.number} ${item.name} · 高考提分技巧速查`;

    try {
      const res = await fetch(`/tech/${file}`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const md = await res.text();
      ui.doc.className = 'doc';
      ui.doc.innerHTML = MD ? MD.renderMarkdown(md) : md;
      if (MD) MD.typesetMath(ui.doc);
    } catch (e) {
      ui.doc.className = 'doc';
      ui.doc.innerHTML =
        `<h1>正文加载失败</h1><p class="muted">${escapeHtml(String(e.message || e))}</p>` +
        `<p><a href="${rawUrl}" target="_blank" rel="noopener">直接看 .md 原文 →</a></p>`;
    }
  }

  function switchView(name) {
    const isDetail = name === 'detail';
    ui.detail.hidden = !isDetail;
    ui.list.hidden = isDetail;
    if (!isDetail) document.title = '高考提分技巧速查 · 27THU';
  }

  /* ── 路由 ─────────────────────────────────────────────── */

  function route() {
    const m = (location.hash || '#/').match(/^#\/t\/(.+)$/);
    if (m) {
      showDetail(decodeURIComponent(m[1]));
    } else {
      switchView('list');
      renderList();
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ── 主题 ─────────────────────────────────────────────── */

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#101216' : '#2f5bd7');
  }

  function initTheme() {
    const saved = localStorage.getItem('gks-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
    el('theme-toggle')?.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('gks-theme', next);
    });
  }

  /* ── 事件绑定 ─────────────────────────────────────────── */

  ui.search.addEventListener('input', () => {
    state.q = ui.search.value;
    renderList();
  });

  ui.filters.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-status]');
    if (!btn) return;
    state.status = btn.dataset.status;
    renderFilters();
    renderList();
  });

  ui.back.addEventListener('click', () => {
    location.hash = '#/';
  });

  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
    if (e.key === '/' && !typing) {
      e.preventDefault();
      location.hash = '#/';
      ui.search.focus();
    } else if (e.key === '/' && typing) {
      return;
    } else if (e.key === 'Escape' && typing) {
      ui.search.blur();
    }
  });

  window.addEventListener('hashchange', route);

  /* ── 启动 ─────────────────────────────────────────────── */

  (async function boot() {
    initTheme();
    if (!MD) console.warn('[27thu] md.js 未加载，正文将按纯文本展示');

    try {
      const res = await fetch('/data/index.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      DATA = await res.json();
    } catch (e) {
      ui.grid.innerHTML = '';
      ui.meta.textContent = '';
      ui.empty.hidden = false;
      ui.empty.innerHTML =
        '<p>索引加载失败。</p><p class="muted">' +
        escapeHtml(String(e.message || e)) +
        ' —— 构建产物可能是空的，跑一下 <code>npm run index</code>。</p>';
      return;
    }

    renderFilters();
    renderList();
    route();
  })();
})();
