'use strict';

const CART_KEY = 'shop343.cart.v1';
const LANG_KEY = 'shop343.lang.v1';
const MAX_QTY = 10;
const MAX_LINES = 20;
const FREE_SHIPPING_CENTS = 7500;

const DICT = {
  en: {
    navShop: 'Shop', navCart: 'Cart', announce: 'Free shipping on orders over $75 · Curated for you',
    shipping: 'Shipping', returns: 'Returns', privacy: 'Privacy',
    footerNote: 'Your modern broker — personal gifts + trusted partners',
    heroTag: 'Modern Dalali Shop',
    heroTitle: 'Your modern broker for gifts & gear',
    heroSub: 'Personalized custom gifts + carefully chosen products from Amazon & Alibaba. We curate, you buy with confidence.',
    all: 'All', search: 'Search products…', loading: 'Loading…',
    error: 'Something went wrong. Please try again.',
    notFound: 'This page does not exist.', back: '← Back to shop', backShop: 'Back to shop',
    noResults: 'No products match your search.',
    addToCart: 'Add to cart', added: 'Added to your cart.',
    cartFull: 'Your cart is full. Remove an item to add more.',
    personalize: 'Name or short message (up to 40 characters)', qty: 'Quantity',
    buyAt: 'Buy on', partnerNote: 'Sold & shipped by {name}. You pay them directly — we just connect you.',
    ownNote: 'Made to order for you. Ships in 3–5 days.',
    badgeCustom: 'Custom', badgePartner: 'Partner',
    cartTitle: 'Your cart', cartEmpty: 'Your cart is empty.',
    subtotal: 'Subtotal', shippingLabel: 'Shipping', free: 'Free', total: 'Total',
    remove: 'Remove', checkout: 'Checkout', clearCart: 'Clear cart',
    freeLeft: 'Add {amt} more for free shipping', freeReached: 'You qualify for free shipping!',
    checkoutTitle: 'Checkout', placeOrder: 'Place order', sending: 'Sending…',
    orderDone: 'Thank you! Your order was received.', orderId: 'Order number',
    orderNext: 'Payment confirmation will be sent by email. Keep your order number.',
    invalid: 'Please check these fields:',
    f_name: 'Full name', f_email: 'Email', f_phone: 'Phone (optional)',
    f_address: 'Address', f_city: 'City', f_country: 'Country',
    policy_shipping: 'Free shipping on orders over $75. Orders below that pay $6.99. Made-to-order items take 3–5 days before they ship. Partner items are shipped by Amazon or Alibaba.',
    policy_returns: 'Damaged custom items are replaced free within 14 days. Personalized items cannot be returned unless defective. Partner purchases follow the seller’s return policy.',
    policy_privacy: 'We collect only your name, email and shipping address to complete your order. We never sell your information.',
  },
  sw: {
    navShop: 'Duka', navCart: 'Kikapu', announce: 'Usafirishaji wa bure kwa oda zaidi ya $75 · Tumechagua kwa ajili yako',
    shipping: 'Usafirishaji', returns: 'Marejesho', privacy: 'Faragha',
    footerNote: 'Dalali wako wa kisasa — zawadi binafsi + washirika wa kuaminika',
    heroTag: 'Duka la Dalali la Kisasa',
    heroTitle: 'Dalali wako wa kisasa wa zawadi na vifaa',
    heroSub: 'Zawadi binafsi + bidhaa zilizochaguliwa kutoka Amazon na Alibaba. Tunachagua, wewe unanunua kwa uhakika.',
    all: 'Zote', search: 'Tafuta bidhaa…', loading: 'Inapakia…',
    error: 'Kuna tatizo. Jaribu tena.',
    notFound: 'Ukurasa huu haupatikani.', back: '← Rudi dukani', backShop: 'Rudi dukani',
    noResults: 'Hakuna bidhaa zinazolingana na utafutaji wako.',
    addToCart: 'Ongeza kwenye kikapu', added: 'Imeongezwa kwenye kikapu.',
    cartFull: 'Kikapu kimejaa. Ondoa bidhaa ili kuongeza nyingine.',
    personalize: 'Jina au ujumbe mfupi (hadi herufi 40)', qty: 'Idadi',
    buyAt: 'Nunua kwenye', partnerNote: 'Inauzwa na kusafirishwa na {name}. Unalipa moja kwa moja kwao — sisi tunaunganisha tu.',
    ownNote: 'Imetengenezwa kwa oda yako. Inasafirishwa ndani ya siku 3–5.',
    badgeCustom: 'Binafsi', badgePartner: 'Washirika',
    cartTitle: 'Kikapu chako', cartEmpty: 'Kikapu chako ni tupu.',
    subtotal: 'Jumla ndogo', shippingLabel: 'Usafirishaji', free: 'Bure', total: 'Jumla',
    remove: 'Ondoa', checkout: 'Endelea kulipa', clearCart: 'Futa kikapu',
    freeLeft: 'Ongeza {amt} upate usafirishaji wa bure', freeReached: 'Umepata usafirishaji wa bure!',
    checkoutTitle: 'Kulipa', placeOrder: 'Thibitisha oda', sending: 'Inatuma…',
    orderDone: 'Asante! Oda yako imepokelewa.', orderId: 'Namba ya oda',
    orderNext: 'Uthibitisho wa malipo utatumwa kwa barua pepe. Hifadhi namba ya oda.',
    invalid: 'Tafadhali angalia sehemu hizi:',
    f_name: 'Jina kamili', f_email: 'Barua pepe', f_phone: 'Simu (hiari)',
    f_address: 'Anwani', f_city: 'Mji', f_country: 'Nchi',
    policy_shipping: 'Usafirishaji wa bure kwa oda zaidi ya $75. Oda chini ya hapo inatozwa $6.99. Bidhaa za oda maalum huchukua siku 3–5. Bidhaa za washirika zinasafirishwa na Amazon au Alibaba.',
    policy_returns: 'Bidhaa binafsi zenye kasoro tunazibadilisha bure ndani ya siku 14. Bidhaa zilizobinafsishwa hazirudishwi isipokuwa zina kasoro. Bidhaa za washirika zinafuata sera ya muuzaji.',
    policy_privacy: 'Tunakusanya jina, barua pepe na anwani ya usafirishaji pekee ili kukamilisha oda yako. Hatuuzi taarifa zako.',
  },
};

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
  const count = loadCart().reduce((sum, i) => sum + i.qty, 0);
  document.getElementById('cartCount').textContent = String(count);
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
  return `<div class="visual" style="background:hsl(${hue} 55% 90%)">${badge}<span>${esc(initials)}</span></div>`;
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
    </section>
    <div class="toolbar">
      <input id="search" type="search" placeholder="${esc(t('search'))}" value="${esc(searchTerm)}" maxlength="80">
      <div class="chips" id="chips"></div>
    </div>
    <div class="grid" id="grid"><p class="muted">${esc(t('loading'))}</p></div>`;

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
      : `<p class="muted">${esc(t('noResults'))}</p>`;
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
          <span class="cat">${esc(categoryLabel(p.category))}</span>
          <h1>${esc(nameOf(p))}</h1>
          <p class="price big">${money(p.priceCents)}</p>
          <p>${esc(descOf(p))}</p>
          ${isPartner ? partnerBlock(p) : ownBlock(p)}
        </div>
      </article>`;
    if (!isPartner) wireOwnBlock(p);
  } catch {
    app.innerHTML = `<p>${esc(t('notFound'))}</p><a href="#/">${esc(t('back'))}</a>`;
  }
}

function partnerBlock(p) {
  return `
    <a class="btn partner" href="/go/${esc(p.slug)}" target="_blank" rel="sponsored nofollow noopener">
      ${esc(t('buyAt'))} ${esc(p.partnerName)} →
    </a>
    <div class="partner-box">${esc(t('partnerNote').replace('{name}', p.partnerName))}</div>`;
}

function ownBlock(p) {
  return `
    ${p.personalizable ? `
      <label class="field">${esc(t('personalize'))}
        <input id="pers" type="text" maxlength="40" autocomplete="off">
      </label>` : ''}
    <label class="field qty-field">${esc(t('qty'))}
      <input id="qty" type="number" min="1" max="${MAX_QTY}" value="1">
    </label>
    <button class="btn accent" id="addBtn" type="button">${esc(t('addToCart'))}</button>
    <p id="msg" class="small" role="status"></p>
    <div class="custom-box">${esc(t('ownNote'))}</div>`;
}

function wireOwnBlock(p) {
  document.getElementById('addBtn').addEventListener('click', () => {
    const msg = document.getElementById('msg');
    const qtyInput = document.getElementById('qty');
    const qty = Math.min(MAX_QTY, Math.max(1, parseInt(qtyInput.value, 10) || 1));
    qtyInput.value = qty;

    const persInput = document.getElementById('pers');
    const personalization = persInput
      ? persInput.value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40)
      : '';

    const cart = loadCart();
    const existing = cart.find((i) => i.slug === p.slug && (i.personalization || '') === personalization);

    if (existing) {
      existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    } else {
      if (cart.length >= MAX_LINES) {
        msg.className = 'small error';
        msg.textContent = t('cartFull');
        return;
      }
      cart.push({ slug: p.slug, qty, personalization });
    }

    saveCart(cart);
    msg.className = 'small ok';
    msg.textContent = t('added');
  });
}

async function renderCart() {
  const cart = loadCart();
  if (!cart.length) {
    app.innerHTML = `
      <h1>${esc(t('cartTitle'))}</h1>
      <p class="muted">${esc(t('cartEmpty'))}</p>
      <a class="btn" href="#/">${esc(t('backShop'))}</a>`;
    return;
  }

  app.innerHTML = `<h1>${esc(t('cartTitle'))}</h1><div id="cartBody"><p class="muted">${esc(t('loading'))}</p></div>`;

  try {
    const quote = await api('/api/cart/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart }),
    });
    drawCart(quote, cart);
  } catch (e) {
    const body = document.getElementById('cartBody');
    body.innerHTML = `
      <p class="error">${esc(e.data?.message || t('error'))}</p>
      <button class="btn danger" id="clearBtn" type="button">${esc(t('clearCart'))}</button>`;
    document.getElementById('clearBtn').addEventListener('click', () => {
      saveCart([]);
      renderCart();
    });
  }
}

function drawCart(quote, cart) {
  const body = document.getElementById('cartBody');
  const progress = Math.min(100, (quote.subtotalCents / FREE_SHIPPING_CENTS) * 100);
  const freeMsg = quote.shippingCents === 0
    ? t('freeReached')
    : t('freeLeft').replace('{amt}', money(FREE_SHIPPING_CENTS - quote.subtotalCents));

  body.innerHTML = `
    ${quote.lines.map((line, i) => `
      <div class="line">
        <div>
          <strong>${esc(lang === 'sw' && line.nameSw ? line.nameSw : line.name)}</strong>
          <div class="meta">${line.personalization ? esc(line.personalization) + ' · ' : ''}${money(line.unitCents)} × ${line.qty}</div>
          <div class="qty-controls">
            <button type="button" class="ghost" data-dec="${i}">−</button>
            <span>${line.qty}</span>
            <button type="button" class="ghost" data-inc="${i}">+</button>
            <button type="button" class="btn danger" data-rm="${i}" style="margin:0;padding:6px 10px;font-size:13px">${esc(t('remove'))}</button>
          </div>
        </div>
        <div class="price">${money(line.lineCents)}</div>
      </div>`).join('')}
    <div class="summary">
      <div class="row"><span>${esc(t('subtotal'))}</span><span>${money(quote.subtotalCents)}</span></div>
      <div class="row"><span>${esc(t('shippingLabel'))}</span><span>${quote.shippingCents ? money(quote.shippingCents) : esc(t('free'))}</span></div>
      <p class="small muted">${esc(freeMsg)}</p>
      <div class="bar"><span style="width:${progress}%"></span></div>
      <div class="row total"><span>${esc(t('total'))}</span><span>${money(quote.totalCents)}</span></div>
      <a class="btn accent" href="#/checkout">${esc(t('checkout'))}</a>
    </div>`;

  body.addEventListener('click', (e) => {
    const dec = e.target.closest('[data-dec]');
    const inc = e.target.closest('[data-inc]');
    const rm = e.target.closest('[data-rm]');
    const c = loadCart();
    if (dec) {
      const i = +dec.dataset.dec;
      if (c[i].qty > 1) c[i].qty--;
      else c.splice(i, 1);
      saveCart(c);
      renderCart();
    } else if (inc) {
      const i = +inc.dataset.inc;
      c[i].qty = Math.min(MAX_QTY, c[i].qty + 1);
      saveCart(c);
      renderCart();
    } else if (rm) {
      c.splice(+rm.dataset.rm, 1);
      saveCart(c);
      renderCart();
    }
  });
}

async function renderCheckout() {
  const cart = loadCart();
  if (!cart.length) return renderCart();

  app.innerHTML = `
    <a class="back" href="#/cart">${esc(t('back'))}</a>
    <h1>${esc(t('checkoutTitle'))}</h1>
    <form id="checkoutForm" class="form-grid">
      ${['name', 'email', 'phone', 'address', 'city', 'country'].map((k) => `
        <label class="field">${esc(t('f_' + k))}
          <input name="${k}" type="${k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}" autocomplete="${autoComplete(k)}" ${k !== 'phone' ? 'required' : ''}>
        </label>`).join('')}
      <p id="formMsg" class="small" role="status"></p>
      <button class="btn accent" id="placeBtn" type="submit">${esc(t('placeOrder'))}</button>
    </form>`;

  document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('placeBtn');
    const msg = document.getElementById('formMsg');
    const customer = Object.fromEntries(new FormData(e.target).entries());

    btn.disabled = true;
    btn.textContent = t('sending');
    msg.textContent = '';

    try {
      const order = await api('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, customer }),
      });
      saveCart([]);
      app.innerHTML = `
        <h1>${esc(t('orderDone'))}</h1>
        <p>${esc(t('orderId'))}: <strong>${esc(order.orderId)}</strong></p>
        <p class="muted">${esc(t('orderNext'))}</p>
        <a class="btn" href="#/">${esc(t('backShop'))}</a>`;
    } catch (err) {
      const fields = (err.data?.fields || []).map((k) => t('f_' + k)).join(', ');
      msg.className = 'small error';
      msg.textContent = fields ? `${t('invalid')} ${fields}` : (err.data?.message || t('error'));
      btn.disabled = false;
      btn.textContent = t('placeOrder');
    }
  });
}

function autoComplete(key) {
  return {
    name: 'name', email: 'email', phone: 'tel',
    address: 'street-address', city: 'address-level2', country: 'country-name',
  }[key] || 'off';
}

function renderPolicy(key) {
  const text = DICT[lang][`policy_${key}`];
  if (!text) return renderHome();
  app.innerHTML = `<a class="back" href="#/">${esc(t('back'))}</a><h1>${esc(t(key))}</h1><p>${esc(text)}</p>`;
}

function applyStaticText() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.getElementById('langToggle').textContent = lang === 'sw' ? 'EN' : 'SW';
}

(async function boot() {
  document.getElementById('langToggle').addEventListener('click', () => {
    lang = lang === 'sw' ? 'en' : 'sw';
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
    applyStaticText();
    route();
  });

  applyStaticText();
  try {
    categories = (await api('/api/categories')).categories;
  } catch {
    categories = [];
  }
  updateCartCount();
  window.addEventListener('hashchange', route);
  route();
})();
