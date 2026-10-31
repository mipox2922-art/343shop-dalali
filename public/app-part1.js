'use strict';

const DICT = window.DICT;
const CART_KEY = window.CART_KEY;
const LANG_KEY = window.LANG_KEY;
const MAX_QTY = window.MAX_QTY;
const MAX_LINES = window.MAX_LINES;
const FREE_SHIPPING_CENTS = window.FREE_SHIPPING_CENTS;


let lang = localStorage.getItem(LANG_KEY) || (navigator.language?.startsWith('sw') ? 'sw' : 'en');
let categories = [];
let activeCategory = '';
let searchTerm = '';

const app = document.getElementById('app');
const t = (key) => DICT[lang][key] ?? DICT.en[key] ?? key;
const money = (cents) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nameOf = (p) => (lang === 'sw' && p.nameSw ? p.nameSw : p.name);
const descOf = (p) => (lang === 'sw' && p.descriptionSw ? p.descriptionSw : p.description);
const categoryLabel = (id) => {
  const c = categories.find((x) => x.id === id);
  return c ? (lang === 'sw' ? c.sw : c.en) : id;
};

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* private mode */ }
  updateCartCount();
}

function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (!el) return;
  const count = loadCart().reduce((sum, i) => sum + i.qty, 0);
  el.textContent = String(count);
}

async function api(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `http_${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

function visual(p, withBadge = false) {
  const isPartner = p.type === 'partner';
  const badge = withBadge
    ? `<span class="type-badge ${isPartner ? 'partner' : 'custom'}">${esc(t(isPartner ? 'badgePartner' : 'badgeCustom'))}</span>`
    : '';
  if (p.image) {
    return `<div class="visual">${badge}<img src="${esc(p.image)}" alt="${esc(nameOf(p))}" loading="lazy"></div>`;
  }
  const hue = [...p.slug].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const initials = nameOf(p).split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<div class="visual" style="background:linear-gradient(145deg,hsl(${hue} 40% 92%),hsl(${hue} 30% 85%))">${badge}<span>${esc(initials)}</span></div>`;
}

function route() {
  window.scrollTo(0, 0);
  const [top, arg] = location.hash.replace(/^#\/?/, '').split('/');
  if (top === 'product' && arg) return renderProduct(decodeURIComponent(arg));
  if (top === 'cart') return renderCart();
  if (top === 'checkout') return renderCheckout();
  if (top === 'policy' && arg) return renderPolicy(arg);
  return renderHome();
}

function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <div class="hero-tag">${esc(t('heroTag'))}</div>
      <h1>${esc(t('heroTitle'))}</h1>
      <p>${esc(t('heroSub'))}</p>
      <div class="hero-stats">
        <div class="hero-stat"><strong>13+</strong><span>${esc(t('stat1'))}</span></div>
        <div class="hero-stat"><strong>100%</strong><span>${esc(t('stat2'))}</span></div>
        <div class="hero-stat"><strong>2</strong><span>${esc(t('stat3'))}</span></div>
      </div>
    </section>
    <div class="toolbar">
      <input id="search" type="search" placeholder="${esc(t('search'))}" value="${esc(searchTerm)}" maxlength="80">
      <div class="chips" id="chips"></div>
    </div>
    <div class="grid" id="grid"><p class="muted">${esc(t('loading'))}</p></div>
    <div class="features">
      <div class="feature"><div class="feature-icon">✦</div><strong>${esc(t('feat1t'))}</strong><span>${esc(t('feat1d'))}</span></div>
      <div class="feature"><div class="feature-icon">🌍</div><strong>${esc(t('feat2t'))}</strong><span>${esc(t('feat2d'))}</span></div>
      <div class="feature"><div class="feature-icon">↗</div><strong>${esc(t('feat3t'))}</strong><span>${esc(t('feat3d'))}</span></div>
      <div class="feature"><div class="feature-icon">🔒</div><strong>${esc(t('feat4t'))}</strong><span>${esc(t('feat4d'))}</span></div>
    </div>`;

  let timer;
  document.getElementById('search').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchTerm = e.target.value.trim();
      loadGrid();
    }, 250);
  });

  document.getElementById('chips').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    drawChips();
    loadGrid();
  });

  drawChips();
  loadGrid();
}

function drawChips() {
  const chips = document.getElementById('chips');
  if (!chips) return;
  const all = { id: '', en: 'All', sw: 'Zote' };
  chips.innerHTML = [all, ...categories]
    .map((c) => `<button type="button" class="chip${activeCategory === c.id ? ' on' : ''}" data-cat="${esc(c.id)}">${esc(lang === 'sw' ? c.sw : c.en)}</button>`)
    .join('');
}

async function loadGrid() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  const qs = new URLSearchParams();
  if (activeCategory) qs.set('category', activeCategory);
  if (searchTerm) qs.set('q', searchTerm);
  try {
    const { products } = await api(`/api/products?${qs}`);
    grid.innerHTML = products.length
      ? products.map(card).join('')
      : `<div class="empty-state"><h2>${esc(t('noResults'))}</h2></div>`;
  } catch {
    grid.innerHTML = `<p class="error">${esc(t('error'))}</p>`;
  }
}

function card(p) {
  const extra = p.badge ? ` · ${esc(p.badge)}` : '';
  return `
    <a class="card" href="#/product/${esc(p.slug)}">
      ${visual(p, true)}
      <div class="card-body">
        <span class="cat">${esc(categoryLabel(p.category))}${extra}</span>
        <h3>${esc(nameOf(p))}</h3>
        <p class="price">${money(p.priceCents)}</p>
      </div>
    </a>`;
}

async function renderProduct(slug) {
  app.innerHTML = `<p class="muted">${esc(t('loading'))}</p>`;
  try {
    const { product: p } = await api(`/api/products/${encodeURIComponent(slug)}`);
    const isPartner = p.type === 'partner';
    app.innerHTML = `
      <a class="back" href="#/">${esc(t('back'))}</a>
      <article class="product">
        <div class="product-visual">${visual(p, true)}</div>
        <div>
          <span class="cat">${esc(categoryLabel(p.category))}${p.badge ? ' · ' + esc(p.badge) : ''}</span>
          <h1 style="font-size:clamp(1.5rem,3vw,2rem);font-weight:800;letter-spacing:-0.03em;margin:8px 0">${esc(nameOf(p))}</h1>
          <p class="price big">${money(p.priceCents)}</p>
          <p style="color:var(--muted);line-height:1.6">${esc(descOf(p))}</p>
          ${isPartner ? partnerBlock(p) : ownBlock(p)}
        </div>
      </article>`;
    if (!isPartner) wireOwnBlock(p);
  } catch {
    app.innerHTML = `<div class="empty-state"><h2>${esc(t('notFound'))}</h2><a class="btn" href="#/">${esc(t('back'))}</a></div>`;
  }
}

function partnerBlock(p) {
  return `
    <a class="btn partner block" href="/go/${esc(p.slug)}" target="_blank" rel="sponsored nofollow noopener">
      ${esc(t('buyAt'))} ${esc(p.partnerName)} →
    </a>
    <div class="partner-box">${esc(t('partnerNote').replace('{name}', p.partnerName))}</div>`;
}

function ownBlock(p) {
  return `
    ${p.personalizable ? `
      <label class="field">${esc(t('personalize'))}
        <input id="pers" type="text" maxlength="40" autocomplete="off" placeholder="…">
      </label>` : ''}
    <label class="field qty-field">${esc(t('qty'))}
      <input id="qty" type="number" min="1" max="${MAX_QTY}" value="1">
    </label>
    <button class="btn accent block" id="addBtn" type="button">${esc(t('addToCart'))}</button>
    <p id="msg" class="small" role="status"></p>
    <div class="custom-box">${esc(t('ownNote'))}</div>`;
}
