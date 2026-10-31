
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
      <div class="empty-state">
        <h2>${esc(t('cartTitle'))}</h2>
        <p>${esc(t('cartEmpty'))}</p>
        <a class="btn accent" href="#/" style="margin-top:16px">${esc(t('backShop'))}</a>
      </div>`;
    return;
  }

  app.innerHTML = `<h1 style="font-weight:800;letter-spacing:-0.03em;margin-bottom:8px">${esc(t('cartTitle'))}</h1><div id="cartBody"><p class="muted">${esc(t('loading'))}</p></div>`;

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
            <button type="button" class="btn danger" data-rm="${i}" style="margin:0;padding:6px 10px;font-size:12px">${esc(t('remove'))}</button>
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
      <a class="btn accent block" href="#/checkout">${esc(t('checkout'))}</a>
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
    <h1 style="font-weight:800;letter-spacing:-0.03em;margin-bottom:20px">${esc(t('checkoutTitle'))}</h1>
    <form id="checkoutForm" class="form-grid">
      ${['name', 'email', 'phone', 'address', 'city', 'country'].map((k) => `
        <label class="field">${esc(t('f_' + k))}
          <input name="${k}" type="${k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}" autocomplete="${autoComplete(k)}" ${k !== 'phone' ? 'required' : ''}>
        </label>`).join('')}
      <p id="formMsg" class="small" role="status"></p>
      <button class="btn accent block" id="placeBtn" type="submit">${esc(t('placeOrder'))}</button>
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
        <div class="empty-state">
          <h2>${esc(t('orderDone'))}</h2>
          <p>${esc(t('orderId'))}: <strong>${esc(order.orderId)}</strong></p>
          <p class="muted">${esc(t('orderNext'))}</p>
          <a class="btn accent" href="#/" style="margin-top:16px">${esc(t('backShop'))}</a>
        </div>`;
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
  app.innerHTML = `<a class="back" href="#/">${esc(t('back'))}</a><h1 style="font-weight:800;margin-bottom:12px">${esc(t(key))}</h1><p style="max-width:560px;line-height:1.65;color:var(--muted)">${esc(text)}</p>`;
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
