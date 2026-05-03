// ── Config ──────────────────────────────────────────────────────────────────
const ARTICLES_DIR = '../articles/';
const MANIFEST     = ARTICLES_DIR + 'manifest.json';

// ── State ────────────────────────────────────────────────────────────────────
let allArticles    = [];
let currentFilter  = '';

// ── Difficulty styling ───────────────────────────────────────────────────────
const DIFFICULTY_STYLE = {
  'iniciante':    { dot: '#27ae60', label: 'Iniciante' },
  'intermediário':{ dot: '#e67e22', label: 'Intermediário' },
  'avançado':     { dot: '#c0392b', label: 'Avançado' },
};

function difficultyBadge(level) {
  const d = DIFFICULTY_STYLE[level?.toLowerCase()] || { dot: '#6b6457', label: level || '—' };
  return `<span class="inline-flex items-center gap-1.5 text-xs font-mono" style="color:${d.dot}">
    <span class="w-1.5 h-1.5 rounded-full inline-block" style="background:${d.dot}"></span>
    ${d.label}
  </span>`;
}

// ── Frontmatter parser ───────────────────────────────────────────────────────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const metaRaw = match[1];
  const body    = match[2];
  const meta    = {};

  for (const line of metaRaw.split('\n')) {
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const key   = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim().replace(/^['"]|['"]$/g, '');
    meta[key] = value;
  }

  return { meta, body };
}

// ── Date formatting ──────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}
const PAGE_SIZE = 6;
let currentPage = 1;
let currentSearch = '';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function articleHash(filename) {
  return `#article=${encodeURIComponent(filename)}`;
}

function getArticleFromHash() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const params = new URLSearchParams(hash);
  return params.get('article');
}

function getFilteredArticles() {
  const query = normalizeText(currentSearch);
  return allArticles.filter(article => {
    const meta = article.meta;
    if (currentFilter && meta.difficulty?.toLowerCase() !== currentFilter) return false;
    if (!query) return true;

    const haystack = [meta.title, meta.author, meta.tags, meta.description, meta.excerpt]
      .filter(Boolean)
      .join(' ');

    return normalizeText(haystack).includes(query);
  });
}

function updatePaginationSummary(total, visible) {
  const summary = document.getElementById('pagination-summary');
  if (!summary) return;
  summary.textContent = total
    ? `Mostrando ${visible} de ${total} artigos`
    : 'Nenhum artigo corresponde à busca.';
}

function updatePaginationControls(totalPages) {
  const controls = document.getElementById('pagination-controls');
  const prev     = document.getElementById('prev-page');
  const next     = document.getElementById('next-page');
  const info     = document.getElementById('page-info');

  if (!controls || !prev || !next || !info) return;
  if (totalPages <= 1) {
    controls.classList.add('hidden');
    return;
  }

  controls.classList.remove('hidden');
  prev.disabled = currentPage <= 1;
  next.disabled = currentPage >= totalPages;
  info.textContent = `Página ${currentPage} de ${totalPages}`;
}

function setMetaTag(name, content, attr = 'name') {
  const selector = `meta[${attr}="${name}"]`;
  const tag = document.querySelector(selector);
  if (tag) tag.setAttribute('content', content);
}
// ── Fetch article list from manifest ────────────────────────────────────────
async function fetchManifest() {
  const res  = await fetch(MANIFEST);
  if (!res.ok) throw new Error('manifest not found');
  const data = await res.json();
  return Array.isArray(data) ? data : data.articles;
}

// ── Fetch + parse a single .md file ─────────────────────────────────────────
async function fetchArticle(filename) {
  const res = await fetch(ARTICLES_DIR + filename);
  if (!res.ok) throw new Error(`Could not load ${filename}`);
  const raw = await res.text();
  const { meta, body } = parseFrontmatter(raw);
  return { filename, meta, body };
}

// ── Build card HTML ──────────────────────────────────────────────────────────
function buildCard(article, delay) {
  const { meta, filename } = article;
  const delayClass = delay <= 3 ? `fade-up-delay-${delay}` : '';

  return `
  <article class="article-card fade-up ${delayClass} py-7 cursor-pointer group"
           onclick="openArticle('${filename}')">
    <div class="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
      <div class="flex-1 min-w-0">
        <h2 class="font-display font-semibold text-xl sm:text-2xl text-ink group-hover:text-accent transition-colors leading-snug mb-2">
          ${meta.title || filename}
        </h2>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
          ${difficultyBadge(meta.difficulty)}
          ${meta.author ? `<span class="text-xs font-mono text-muted">${meta.author}</span>` : ''}
          ${meta.date   ? `<span class="text-xs font-mono text-muted">${formatDate(meta.date)}</span>` : ''}
        </div>
        ${meta.tags ? `
        <div class="mt-3 flex flex-wrap gap-1.5">
          ${meta.tags.split(',').map(t => `<span class="text-xs font-mono px-2 py-0.5 rounded bg-rule text-muted">${t.trim()}</span>`).join('')}
        </div>` : ''}
      </div>
      <div class="hidden sm:flex items-center self-center text-muted group-hover:text-ink transition-colors shrink-0 mt-1">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  </article>`;
}

// ── Render card list ─────────────────────────────────────────────────────────
function renderCards(articles, page = 1) {
  const grid     = document.getElementById('cards-grid');
  const empty    = document.getElementById('empty-state');
  const controls = document.getElementById('pagination-controls');

  const total      = articles.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  currentPage = Math.min(Math.max(page, 1), totalPages);

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = articles.slice(start, start + PAGE_SIZE);

  if (!total) {
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
    if (controls) controls.classList.add('hidden');
    updatePaginationSummary(total, 0);
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = pageItems.map((a, i) => buildCard(a, start + i + 1)).join('');
  grid.classList.remove('hidden');

  updatePaginationSummary(total, pageItems.length);
  updatePaginationControls(totalPages);
}

function applyFilters() {
  const filtered = getFilteredArticles();
  renderCards(filtered, currentPage);
}

window.searchArticles = function(value) {
  currentSearch = value || '';
  currentPage = 1;
  applyFilters();
};

window.changePage = function(page) {
  renderCards(getFilteredArticles(), page);
};

// ── Filter ───────────────────────────────────────────────────────────────────
window.filterDifficulty = function(level) {
  currentFilter = level;
  currentPage = 1;

  // Update button styles
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const isActive = btn.dataset.filter === level;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('bg-ink', isActive);
    btn.classList.toggle('text-paper', isActive);
    btn.classList.toggle('border-ink', isActive);
  });

  applyFilters();
};

// ── Open single article ──────────────────────────────────────────────────────
window.openArticle = async function(filename, updateHash = true) {
  // Find cached article
  let article = allArticles.find(a => a.filename === filename);

  // Show article view
  document.getElementById('list-view').classList.add('hidden');
  document.getElementById('article-view').classList.remove('hidden');
  document.getElementById('back-btn').style.display = 'flex';
  document.getElementById('article-count').textContent = '';
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (!article) {
    document.getElementById('article-body').innerHTML = '<p class="text-muted font-mono text-sm">Publicação não encontrada.</p>';
    return;
  }

  const { meta, body } = article;

  // Meta header
  document.getElementById('article-meta').innerHTML = `
    <div class="fade-up">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 text-sm">
        ${difficultyBadge(meta.difficulty)}
        ${meta.date ? `<span class="font-mono text-xs text-muted">${formatDate(meta.date)}</span>` : ''}
      </div>
      <h1 class="font-display font-bold text-3xl sm:text-4xl leading-tight text-ink mb-4">${meta.title || filename}</h1>
      ${meta.author ? `
      <div class="flex items-center gap-3 pt-5 border-t border-rule">
        <div class="w-8 h-8 rounded-full bg-rule flex items-center justify-center shrink-0">
          <span class="font-mono text-xs text-muted font-bold">${meta.author.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <span class="text-sm text-muted">${meta.author}</span><br>
          <span class="text-xs text-muted"><a href="${meta.social}" target="_blank">${meta.social}</a></span>
        </div>
      </div>` : ''}
      ${meta.tags ? `
      <div class="mt-4 flex flex-wrap gap-1.5">
        ${meta.tags.split(',').map(t => `<span class="text-xs font-mono px-2 py-0.5 rounded bg-rule text-muted">${t.trim()}</span>`).join('')}
      </div>` : ''}
    </div>
    <hr class="border-rule my-8" />
  `;

  // Render markdown body
  marked.setOptions({ gfm: true, breaks: false });
  document.getElementById('article-body').innerHTML = marked.parse(body);

  // Update page title
  document.title = `${meta.title || filename} — Saúde Digital para Devs`;
  setMetaTag('description', meta.description || meta.excerpt || `Leitura sobre ${meta.title || filename} na Saúde Digital para Devs.`);
  setMetaTag('og:title', `${meta.title || filename} — Saúde Digital para Devs`, 'property');
  setMetaTag('og:description', meta.description || `Artigo sobre ${meta.title || filename} na Saúde Digital para Devs.`, 'property');
  setMetaTag('og:url', window.location.href, 'property');
  const hash = articleHash(filename);
  if (window.location.hash !== hash) {
    window.history.replaceState(null, '', hash);
  }
};

// ── Return to list ────────────────────────────────────────────────────────────
window.showList = function() {
  document.getElementById('article-view').classList.add('hidden');
  document.getElementById('list-view').classList.remove('hidden');
  document.getElementById('back-btn').style.display = 'none';
  document.getElementById('article-count').textContent = `${allArticles.length} publica${allArticles.length !== 1 ? 'ções' : 'ção'}`;
  document.title = 'Saúde Digital para Devs — Publicações Técnicas';
  setMetaTag('description', 'Conteúdo técnico sobre Saúde Digital, interoperabilidade e desenvolvimento de sistemas assistenciais para desenvolvedores.');
  setMetaTag('og:title', 'Saúde Digital para Devs — Publicações Técnicas', 'property');
  setMetaTag('og:description', 'Publicações técnicas sobre Saúde Digital para desenvolvedores, com foco em interoperabilidade e sistemas assistenciais.', 'property');
  setMetaTag('og:url', window.location.href.split('#')[0], 'property');
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  window.scrollTo({ top: 0, behavior: 'instant' });
};

// ── Boot ──────────────────────────────────────────────────────────────────────
(async function init() {
  try {
    const filenames = await fetchManifest();

    // Fetch all articles in parallel
    const results = await Promise.allSettled(filenames.map(fetchArticle));

    allArticles = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => {
        // Sort by date descending
        const da = a.meta.date || '0000';
        const db = b.meta.date || '0000';
        return db.localeCompare(da);
      });

    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('article-count').textContent = `${allArticles.length} publica${allArticles.length !== 1 ? 'ções' : 'ção'}`;

    // Set first filter button style
    document.querySelector('.filter-btn[data-filter=""]').classList.add('bg-ink', 'text-paper', 'border-ink');

    renderCards(allArticles);

    const initialArticle = getArticleFromHash();
    if (initialArticle) {
      openArticle(initialArticle, false);
    } else {
      showList();
    }

    window.addEventListener('hashchange', () => {
      const articleFromHash = getArticleFromHash();
      if (articleFromHash) {
        openArticle(articleFromHash, false);
      } else {
        showList();
      }
    });

  } catch (err) {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('error-state').classList.remove('hidden');
    console.error('Saúde Digital para Devs init error:', err);
  }
})();
