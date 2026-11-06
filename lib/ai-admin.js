'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const express = require('express');

const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.jsonl');
const AUDIT_FILE = path.join(__dirname, '..', 'data', 'ai-admin-audit.jsonl');
const MAX_LIMIT = 100;

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireReadKey(req, res, next) {
  const expected = String(process.env.MR_AI_SHOP_API_KEY || '');
  if (expected.length < 32) {
    return res.status(503).json({
      error: 'mr_ai_api_not_configured',
      message: 'MR AI private shop API key has not been configured.',
    });
  }
  const supplied = String(req.get('authorization') || '').replace(/^Bearer\\s+/i, '');
  if (!safeEqual(supplied, expected)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  res.set('Cache-Control', 'no-store');
  return next();
}

function requireWriteKey(req, res, next) {
  const enabled = String(process.env.MR_AI_SHOP_WRITE_ENABLED || '').toLowerCase() === 'true';
  const expected = String(process.env.MR_AI_SHOP_WRITE_KEY || '');
  if (!enabled || expected.length < 32) {
    return res.status(403).json({
      error: 'shop_write_disabled',
      message: 'Shop catalog writes are disabled until the owner configures a separate write key and enables them.',
    });
  }
  const supplied = String(req.get('x-shop-write-key') || '');
  if (!safeEqual(supplied, expected)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (req.body?.ownerApproved !== true) {
    return res.status(403).json({
      error: 'owner_approval_required',
      message: 'A product change requires explicit owner approval.',
    });
  }
  return next();
}

async function readOrders() {
  let raw;
  try {
    raw = await fs.readFile(ORDERS_FILE, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }
  const rows = [];
  for (const line of raw.split(/\\r?\\n/)) {
    if (!line.trim()) continue;
    try {
      const order = JSON.parse(line);
      if (order && typeof order.id === 'string') rows.push(order);
    } catch {
      // Ignore a damaged line but never represent it as an order.
    }
  }
  return rows;
}

function publicOrder(order) {
  const customer = order.customer || {};
  return {
    id: order.id,
    createdAt: order.createdAt || null,
    status: String(order.status || 'unknown'),
    customer: {
      name: String(customer.name || ''),
      email: String(customer.email || ''),
      phone: String(customer.phone || ''),
      address: String(customer.address || ''),
      city: String(customer.city || ''),
      country: String(customer.country || ''),
    },
    items: (Array.isArray(order.items) ? order.items : []).map((item) => ({
      slug: String(item.slug || ''),
      name: String(item.name || ''),
      qty: Number(item.qty || 0),
      unitCents: Number(item.unitCents || 0),
      lineCents: Number(item.lineCents || 0),
    })),
    totals: {
      subtotalCents: Number(order.totals?.subtotalCents || 0),
      shippingCents: Number(order.totals?.shippingCents || 0),
      totalCents: Number(order.totals?.totalCents || 0),
    },
  };
}

function validateProductChanges(changes, product) {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    return 'changes must be an object';
  }
  const allowed = new Set([
    'name', 'nameSw', 'description', 'descriptionSw',
    'category', 'priceCents', 'personalizable', 'badge', 'active',
  ]);
  const keys = Object.keys(changes);
  if (!keys.length) return 'At least one product field is required';
  const unknown = keys.filter((key) => !allowed.has(key));
  if (unknown.length) return 'Unsupported product fields: ' + unknown.join(', ');
  if ('priceCents' in changes && (
    !Number.isSafeInteger(changes.priceCents) ||
    changes.priceCents < 1 ||
    changes.priceCents > 1000000000
  )) return 'priceCents must be a positive integer no greater than 1,000,000,000';
  if ('category' in changes && !product.categories.some((item) => item.id === changes.category)) {
    return 'Unknown product category';
  }
  for (const field of ['name', 'nameSw']) {
    if (field in changes && (typeof changes[field] !== 'string' || changes[field].trim().length < 2 || changes[field].length > 120)) {
      return field + ' must contain 2 to 120 characters';
    }
  }
  for (const field of ['description', 'descriptionSw']) {
    if (field in changes && (typeof changes[field] !== 'string' || changes[field].length > 5000)) {
      return field + ' must be text of at most 5,000 characters';
    }
  }
  if ('personalizable' in changes && typeof changes.personalizable !== 'boolean') {
    return 'personalizable must be boolean';
  }
  if ('active' in changes && typeof changes.active !== 'boolean') {
    return 'active must be boolean';
  }
  if ('badge' in changes && changes.badge !== null &&
    (typeof changes.badge !== 'string' || changes.badge.length > 40)) {
    return 'badge must be text of at most 40 characters or null';
  }
  return null;
}

function createAiAdminRouter({ catalog }) {
  const router = express.Router();
  router.use(requireReadKey);

  router.get('/health', (_req, res) => {
    res.json({
      status: 'connected',
      store: '343SHOP',
      apiVersion: 1,
      capabilities: [
        'read_overview',
        'read_products',
        'read_orders',
        'owner_approved_product_updates',
      ],
    });
  });

  router.get('/overview', async (_req, res) => {
    try {
      const [orders, products] = await Promise.all([readOrders(), Promise.resolve(catalog.listAll())]);
      const statusCounts = {};
      for (const order of orders) {
        const status = String(order.status || 'unknown');
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
      const pendingOrders = orders.filter((order) => String(order.status || '').toLowerCase() === 'pending_payment');
      const pendingValueCents = pendingOrders.reduce(
        (sum, order) => sum + Number(order.totals?.totalCents || 0), 0
      );
      res.json({
        status: 'completed',
        store: '343SHOP',
        currency: 'USD',
        generatedAt: new Date().toISOString(),
        products: {
          total: products.length,
          active: products.filter((item) => item.active !== false).length,
          inactive: products.filter((item) => item.active === false).length,
          own: products.filter((item) => item.type === 'own').length,
          partner: products.filter((item) => item.type === 'partner').length,
          categories: catalog.categories,
        },
        orders: {
          total: orders.length,
          byStatus: statusCounts,
          pendingPayment: pendingOrders.length,
          pendingOrderValueCents: pendingValueCents,
          pendingOrderValueIsRevenue: false,
          recent: orders.slice(-10).reverse().map(publicOrder),
        },
        limitations: [
          'Orders are recorded as pending_payment; no payment gateway is connected by this API.',
          'Pending order value is not verified revenue.',
          'No stock quantity is defined in the current catalog; made-to-order and partner products are tracked separately.',
        ],
      });
    } catch (error) {
      res.status(503).json({
        error: 'shop_storage_unavailable',
        message: '343SHOP could not read its local order store.',
      });
    }
  });

  router.get('/products', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    res.json({
      products: catalog.listAll({ category, q }),
      categories: catalog.categories,
      count: catalog.listAll({ category, q }).length,
    });
  });

  router.get('/orders', async (req, res) => {
    try {
      const limitRaw = Number.parseInt(String(req.query.limit || '50'), 10);
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(MAX_LIMIT, limitRaw)) : 50;
      const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';
      const orders = await readOrders();
      const filtered = status
        ? orders.filter((order) => String(order.status || '').toLowerCase() === status)
        : orders;
      res.json({
        orders: filtered.slice(-limit).reverse().map(publicOrder),
        count: filtered.length,
        returned: Math.min(filtered.length, limit),
      });
    } catch (error) {
      res.status(503).json({
        error: 'shop_storage_unavailable',
        message: '343SHOP could not read its local order store.',
      });
    }
  });

  router.put('/products/:slug', requireWriteKey, async (req, res) => {
    const before = catalog.listAll().find((item) => item.slug === req.params.slug);
    if (!before) return res.status(404).json({ error: 'product_not_found' });
    const validationError = validateProductChanges(req.body?.changes, catalog);
    if (validationError) return res.status(400).json({ error: 'invalid_product_change', message: validationError });
    try {
      const updated = catalog.update(req.params.slug, req.body.changes);
      const event = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        actor: 'MR AI',
        action: 'PRODUCT_UPDATED',
        slug: req.params.slug,
        before,
        after: updated,
      };
      await fs.appendFile(AUDIT_FILE, JSON.stringify(event) + '\\n', { encoding: 'utf8', mode: 0o600 });
      res.json({ status: 'updated', product: updated, auditId: event.id });
    } catch (error) {
      res.status(503).json({
        error: 'product_update_failed',
        message: 'Product update could not be persisted. No successful update is claimed.',
      });
    }
  });

  return router;
}

module.exports = createAiAdminRouter;
