'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

process.env.MR_AI_SHOP_API_KEY = 'test-shop-read-key-'.padEnd(48, 'x');
process.env.MR_AI_SHOP_WRITE_ENABLED = 'false';
delete process.env.MR_AI_SHOP_WRITE_KEY;

const createAiAdminRouter = require('../lib/ai-admin');

const sampleCatalog = {
  categories: [{ id: 'photos', en: 'Photos', sw: 'Picha' }],
  listAll: () => [
    { slug: 'photo-print', name: 'Photo Print', type: 'own', priceCents: 1500, active: true },
    { slug: 'partner-lamp', name: 'Partner Lamp', type: 'partner', priceCents: 1800, active: true },
  ],
};

let server;
let baseUrl;

test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', createAiAdminRouter({ catalog: sampleCatalog }));
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});

test.after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function call(path, options = {}) {
  return fetch(baseUrl + path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(options.auth === false ? {} : { Authorization: 'Bearer ' + process.env.MR_AI_SHOP_API_KEY }),
    },
  });
}

test('private shop API rejects requests without the read key', async () => {
  const response = await call('/api/ai/health', { auth: false });
  assert.equal(response.status, 401);
});

test('private shop health reports the actual API capabilities', async () => {
  const response = await call('/api/ai/health');
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, 'connected');
  assert.ok(body.capabilities.includes('read_orders'));
});

test('product endpoint returns the catalog without partner destination URLs', async () => {
  const response = await call('/api/ai/products');
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.count, 2);
  assert.equal(body.products[1].partnerUrl, undefined);
});

test('product writes remain disabled without separate write authorization', async () => {
  const response = await call('/api/ai/products/photo-print', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerApproved: true, changes: { priceCents: 2500 } }),
  });
  assert.equal(response.status, 403);
});
