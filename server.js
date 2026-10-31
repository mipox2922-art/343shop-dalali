'use strict';

const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const catalog = require('./lib/catalog');

const PORT = Number(process.env.PORT) || 3000;
const FREE_SHIPPING_CENTS = 7500; // $75
const SHIPPING_CENTS = 699;       // $6.99
const MAX_CART_LINES = 20;
const MAX_QTY = 10;
const MAX_PERSONALIZATION = 40;
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.jsonl');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  })
);

app.use(express.json({ limit: '50kb' }));

app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    index: 'index.html',
  })
);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: 'too_many_orders', message: 'Umefanya oda nyingi. Subiri kidogo.' },
});

function clean(s, max) {
  return String(s ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function priceCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'empty_cart', message: 'Kikapu ni tupu.' };
  }
  if (items.length > MAX_CART_LINES) {
    return { error: 'cart_full', message: 'Kikapu kimejaa.' };
  }

  const lines = [];
  let subtotalCents = 0;

  for (const raw of items) {
    const slug = clean(raw?.slug, 80);
    const product = catalog.get(slug);
    if (!product || product.type !== 'own') {
      return { error: 'invalid_item', message: `Bidhaa "${slug}" haipatikani au si ya duka.` };
    }
    const qty = Math.min(MAX_QTY, Math.max(1, parseInt(raw?.qty, 10) || 1));
    const personalization = clean(raw?.personalization, MAX_PERSONALIZATION);
    if (product.personalizable && !personalization) {
      // optional personalization allowed empty
    }
    const lineTotal = product.priceCents * qty;
    subtotalCents += lineTotal;
    lines.push({
      slug: product.slug,
      name: product.name,
      nameSw: product.nameSw,
      qty,
      personalization,
      unitCents: product.priceCents,
      lineCents: lineTotal,
    });
  }

  const shippingCents = subtotalCents >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_CENTS;
  return {
    lines,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };
}

function validateCustomer(c) {
  const fields = [];
  if (c.name.length < 2) fields.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) fields.push('email');
  if (c.phone && !/^\+?[0-9 ()-]{7,20}$/.test(c.phone)) fields.push('phone');
  if (c.address.length < 5) fields.push('address');
  if (c.city.length < 2) fields.push('city');
  if (c.country.length < 2) fields.push('country');
  return fields;
}

// ---------- API ----------

app.get('/api/categories', (_req, res) => {
  res.json({ categories: catalog.categories });
});

app.get('/api/products', (req, res) => {
  const category = typeof req.query.category === 'string' ? clean(req.query.category, 40) : undefined;
  const q = typeof req.query.q === 'string' ? clean(req.query.q, 80) : undefined;
  res.json({ products: catalog.list({ category, q }) });
});

app.get('/api/products/:slug', (req, res) => {
  const product = catalog.get(req.params.slug);
  if (!product) return res.status(404).json({ error: 'not_found', message: 'Bidhaa haipo.' });
  res.json({ product: catalog.publicView(product) });
});

app.post('/api/cart/quote', (req, res) => {
  const result = priceCart(req.body?.items);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

app.post('/api/orders', orderLimiter, async (req, res) => {
  const quote = priceCart(req.body?.items);
  if (quote.error) return res.status(400).json(quote);

  const c = req.body?.customer ?? {};
  const customer = {
    name: clean(c.name, 80),
    email: clean(c.email, 254).toLowerCase(),
    phone: clean(c.phone, 20),
    address: clean(c.address, 200),
    city: clean(c.city, 80),
    country: clean(c.country, 60),
  };

  const invalid = validateCustomer(customer);
  if (invalid.length) {
    return res.status(400).json({ error: 'invalid_customer', message: 'Angalia taarifa zako.', fields: invalid });
  }

  const order = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'pending_payment',
    customer,
    items: quote.lines,
    totals: {
      subtotalCents: quote.subtotalCents,
      shippingCents: quote.shippingCents,
      totalCents: quote.totalCents,
    },
  };

  try {
    await fs.mkdir(path.dirname(ORDERS_FILE), { recursive: true });
    await fs.appendFile(ORDERS_FILE, JSON.stringify(order) + '\n', { mode: 0o600 });
  } catch (err) {
    console.error('order_write_failed', err.code || err.message);
    return res.status(500).json({ error: 'server_error', message: 'Imeshindikana kuhifadhi oda. Jaribu tena.' });
  }

  res.status(201).json({ orderId: order.id, status: order.status, totals: order.totals });
});

// Redirect ya partner pekee. URL inatoka kwenye catalog, si kwenye query ya mtumiaji.
app.get('/go/:slug', (req, res) => {
  const product = catalog.getPartner(req.params.slug);
  res.set('Cache-Control', 'no-store');
  if (!product) return res.redirect(302, '/#/');
  console.info('partner_click', { slug: product.slug, partner: product.partnerName, ts: new Date().toISOString() });
  res.redirect(302, product.partnerUrl);
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));

// Error handler wa mwisho
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'bad_json', message: 'Ombi si sahihi.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'too_large', message: 'Ombi ni kubwa mno.' });
  }
  console.error(err);
  res.status(500).json({ error: 'server_error', message: 'Kuna tatizo upande wa seva.' });
});

app.listen(PORT, () => {
  console.log(`343SHOP (Duka la Dalali) inaendesha: http://localhost:${PORT}`);
});
