// ── State ──────────────────────────────────────────────────────────────────────
let CONFIG = {};
let PAGES  = []; // flat list: { title, path, author, sectionTitle }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function $(id) { return document.getElementById(id); }

function currentHash() {
  const h = location.hash;
  return h.startsWith('#/') ? h.slice(2) : '';
}

function flattenPages(summary) {
  return (summary.sections || []).flatMap(s =>
    (s.pages || []).map(p => ({ ...p, sectionTitle: s.title }))
  );
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function initTheme(themeConfig = {}) {
  const saved  = localStorage.getItem('dd-theme');
  const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(saved || system);

  if (themeConfig.primaryColor) {
    document.documentElement.style.setProperty('--primary', themeConfig.primaryColor);
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('dd-theme', theme);

  const btn = $('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';

  const hlLink = $('hljs-theme');
  if (hlLink) {
    hlLink.href = theme === 'dark'
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
  }
}

function toggleTheme() {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

// ── Config ────────────────────────────────────────────────────────────────────

function applyConfig(cfg) {
  const nameEl = $('site-name');
  if (nameEl) nameEl.textContent = cfg.name || 'Docs';
  document.title = cfg.name || 'Docs';

  const nav = $('header-links');
  if (nav && cfg.links?.length) {
    nav.innerHTML = cfg.links.map(l =>
      `<a href="${escHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escHtml(l.label)}</a>`
    ).join('');
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────

function buildNav(summary) {
  const tree = $('nav-tree');
  if (!tree) return;

  tree.innerHTML = (summary.sections || []).map(section => `
    <div class="nav-section">
      <div class="nav-section-title">${escHtml(section.title)}</div>
      ${(section.pages || []).map(page => `
        <a class="nav-link" href="#/${escHtml(page.path)}" data-path="${escHtml(page.path)}">
          ${escHtml(page.title)}
        </a>
      `).join('')}
    </div>
  `).join('');

  tree.addEventListener('click', e => {
    if (e.target.closest('.nav-link')) closeMobileMenu();
  });
}

function setActiveLink(path) {
  document.querySelectorAll('.nav-link').forEach(el =>
    el.classList.toggle('active', el.dataset.path === path)
  );
}

// ── Search ────────────────────────────────────────────────────────────────────

function initSearch() {
  $('search-input')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.nav-section').forEach(section => {
      let visible = 0;
      section.querySelectorAll('.nav-link').forEach(link => {
        const show = !q || link.textContent.toLowerCase().includes(q);
        link.classList.toggle('hidden', !show);
        if (show) visible++;
      });
      section.classList.toggle('empty', visible === 0);
    });
  });
}

// ── Mobile menu ───────────────────────────────────────────────────────────────

function initMobileMenu() {
  $('menu-toggle')?.addEventListener('click', () => {
    const open = $('sidebar').classList.toggle('open');
    $('overlay').classList.toggle('visible', open);
  });
  $('overlay')?.addEventListener('click', closeMobileMenu);
}

function closeMobileMenu() {
  $('sidebar')?.classList.remove('open');
  $('overlay')?.classList.remove('visible');
}

// ── Markdown setup ────────────────────────────────────────────────────────────

function setupMarked() {
  const renderer = new marked.Renderer();

  renderer.link = ({ href, title, text }) => {
    const ext = /^https?:\/\//.test(href);
    const attrs = ext ? ' target="_blank" rel="noopener noreferrer"' : '';
    const t = title ? ` title="${escHtml(title)}"` : '';
    return `<a href="${href}"${t}${attrs}>${text}</a>`;
  };

  marked.use({ renderer, gfm: true, breaks: false });
}

// ── TOC + scroll spy ──────────────────────────────────────────────────────────

let tocController = null;

function buildTOC(article) {
  const tocEl    = $('toc');
  const tocSidebar = $('toc-sidebar');
  if (!tocEl || !tocSidebar) return;

  tocController?.abort();
  tocController = new AbortController();
  const { signal } = tocController;

  const headings = [...article.querySelectorAll('h2, h3')];

  if (headings.length < 2) {
    tocSidebar.hidden = true;
    tocEl.innerHTML = '';
    return;
  }

  tocSidebar.hidden = false;

  tocEl.innerHTML = `
    <p class="toc-title">Nesta página</p>
    <ul class="toc-list">
      ${headings.map(h => `<li>
        <a class="toc-link toc-${h.tagName.toLowerCase()}" data-id="${escHtml(h.id)}">
          ${escHtml(h.childNodes[0]?.textContent?.trim() || '')}
        </a>
      </li>`).join('')}
    </ul>`;

  tocEl.addEventListener('click', e => {
    const link = e.target.closest('.toc-link');
    if (!link) return;
    document.getElementById(link.dataset.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, { signal });

  function setActiveTOC(id) {
    tocEl.querySelectorAll('.toc-link').forEach(el =>
      el.classList.toggle('active', el.dataset.id === id)
    );
  }

  function onScroll() {
    let active = headings[0].id;
    for (const h of headings) {
      if (h.getBoundingClientRect().top <= 100) active = h.id;
    }
    setActiveTOC(active);
  }

  window.addEventListener('scroll', onScroll, { passive: true, signal });
  onScroll();
}

// ── Routing ───────────────────────────────────────────────────────────────────

async function navigate(path) {
  if (!path) return;

  const article = $('article');
  if (!article) return;
  article.innerHTML = '<div class="state-loading">Loading…</div>';

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.status);
    const md = await res.text();

    article.innerHTML = marked.parse(md);
    article.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
    addHeadingAnchors(article);
    addCopyButtons(article);
    buildTOC(article);

    const page = PAGES.find(p => p.path === path);
    document.title = page ? `${page.title} | ${CONFIG.name || 'Docs'}` : CONFIG.name || 'Docs';
    renderFooter(path, page || null);
    setActiveLink(path);

    // Scroll content area to top
    const main = $('main');
    if (main) main.scrollTop = 0;
    window.scrollTo(0, 0);
  } catch {
    article.innerHTML = `
      <div class="state-error">
        <strong>Page not found</strong>
        <p>Could not load <code>${escHtml(path)}</code></p>
      </div>`;
    $('page-footer').innerHTML = '';
  }
}

function addHeadingAnchors(container) {
  container.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
    if (!h.id) {
      h.id = h.textContent.trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
    }
    const a = document.createElement('a');
    a.className = 'heading-anchor';
    a.href = `#${h.id}`;
    a.textContent = '#';
    a.setAttribute('aria-hidden', 'true');
    h.appendChild(a);
  });
}

function addCopyButtons(container) {
  container.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      try {
        await navigator.clipboard.writeText(code?.textContent ?? '');
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      } catch { /* clipboard unavailable */ }
    });
    pre.appendChild(btn);
  });
}

// ── Page footer ───────────────────────────────────────────────────────────────

function renderFooter(path, page) {
  const footer = $('page-footer');
  if (!footer) return;

  const idx  = PAGES.findIndex(p => p.path === path);
  const prev = PAGES[idx - 1];
  const next = PAGES[idx + 1];

  const author = page?.author;
  const avatarInner = author?.avatar
    ? `<img src="${escHtml(author.avatar)}" alt="${escHtml(author.name || '')}">`
    : `<span>${escHtml((author?.name?.[0] || '?').toUpperCase())}</span>`;

  const authorHtml = author?.name ? `
    <div class="author-info">
      <div class="author-avatar">${avatarInner}</div>
      <div class="author-meta">
        ${author.url
          ? `<a class="author-name" href="${escHtml(author.url)}" target="_blank" rel="noopener noreferrer">${escHtml(author.name)}</a>`
          : `<span class="author-name">${escHtml(author.name)}</span>`
        }
        <span class="author-label">Author</span>
      </div>
    </div>` : '<span></span>';

  const chevLeft  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg>`;
  const chevRight = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,18 15,12 9,6"/></svg>`;

  footer.innerHTML = `
    <div class="page-footer">
      ${authorHtml}
      <div class="prev-next">
        ${prev ? `<a class="prev-link" href="#/${prev.path}">${chevLeft}<span>${escHtml(prev.title)}</span></a>` : ''}
        ${next ? `<a class="next-link" href="#/${next.path}"><span>${escHtml(next.title)}</span>${chevRight}</a>` : ''}
      </div>
    </div>`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  try {
    CONFIG = await fetchJSON('config.json');
  } catch {
    CONFIG = { name: 'Docs' };
  }

  let summary;
  try {
    summary = await fetchJSON('content/summary.json');
  } catch {
    $('article').innerHTML = `
      <div class="state-error">
        <strong>Could not load navigation</strong>
        <p>Make sure <code>content/summary.json</code> exists and is valid JSON.</p>
      </div>`;
    applyConfig(CONFIG);
    return;
  }

  PAGES = flattenPages(summary);

  setupMarked();
  initTheme(CONFIG.theme || {});
  applyConfig(CONFIG);
  buildNav(summary);
  initSearch();
  initMobileMenu();

  $('theme-toggle')?.addEventListener('click', toggleTheme);

  window.addEventListener('hashchange', () => {
    const path = currentHash();
    if (!path) return; // heading anchor click — let the browser scroll, don't re-navigate
    navigate(path);
  });

  // Initial page
  const initPath = currentHash() || CONFIG.defaultPage || PAGES[0]?.path;
  await navigate(initPath);
}

document.addEventListener('DOMContentLoaded', init);
