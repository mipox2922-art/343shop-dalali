'use strict';

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'products.json');
let RAW = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const CATEGORY_IDS = new Set(RAW.categories.map((c) => c.id));
// Domains pekee ambazo partner links zinaruhusiwa. Hii inazuia open redirect.
const ALLOWED_PARTNER_HOSTS = new Set(['www.amazon.com', 'www.alibaba.com']);
const SLUG_RE = /^[a-z0-9-]{3,80}$/;

function validate(p) {
  const problems = [];
  if (!SLUG_RE.test(p.slug)) problems.push('slug');
  if (!p.name) problems.push('name');
  if (!CATEGORY_IDS.has(p.category)) problems.push('category');
  if (!Number.isInteger(p.priceCents) || p.priceCents <= 0) problems.push('priceCents');
  if (p.active !== undefined && typeof p.active !== 'boolean') problems.push('active');

  if (p.type === 'partner') {
    let url = null;
    try { url = new URL(p.partnerUrl); } catch { url = null; }
    if (!url || url.protocol !== 'https:' || !ALLOWED_PARTNER_HOSTS.has(url.hostname)) {
      problems.push('partnerUrl');
    }
  } else if (p.type !== 'own') {
    problems.push('type');
  }

  if (problems.length) {
    console.warn(`catalog: skipping "${p.slug}" (invalid: ${problems.join(', ')})`);
    return null;
  }
  return p;
}

let products = [];
let bySlug = new Map();

function rebuildIndex() {
  products = RAW.products.map(validate).filter(Boolean);
  bySlug = new Map(products.map((p) => [p.slug, p]));
}
rebuildIndex();

// Hakuna field za ndani zinazotoka nje (kama partnerUrl)
function publicView(p) {
  const { partnerUrl, ...rest } = p;
  return rest;
}

function listAll({ category, q } = {}) {
  const needle = q ? q.toLowerCase() : null;
  return products
    .filter((p) => !category || p.category === category)
    .filter((p) => !needle ||
      [p.name, p.nameSw, p.description, p.descriptionSw]
        .some((s) => s && s.toLowerCase().includes(needle)))
    .map(publicView);
}

function list({ category, q } = {}) {
  return listAll({ category, q }).filter((p) => p.active !== false);
}

function get(slug) {
  const product = bySlug.get(slug) ?? null;
  return product && product.active !== false ? product : null;
}

// Persist owner-approved catalog edits atomically. Partner URLs/type are deliberately
// not editable through this API: affiliate destinations remain controlled by source code.
function update(slug, changes) {
  const index = RAW.products.findIndex((p) => p.slug === slug);
  if (index < 0) throw new Error('Product not found.');

  const next = JSON.parse(JSON.stringify(RAW));
  next.products[index] = { ...next.products[index], ...changes };
  if (!validate(next.products[index])) throw new Error('Product update failed catalog validation.');

  const temporaryPath = DATA_PATH + '.tmp-' + process.pid + '-' + Date.now();
  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(next, null, 2) + '\\n', { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temporaryPath, DATA_PATH);
  } catch (error) {
    try { fs.unlinkSync(temporaryPath); } catch { /* best-effort cleanup */ }
    throw error;
  }

  RAW = next;
  rebuildIndex();
  return publicView(bySlug.get(slug));
}

// Inarudisha URL ya partner pekee, na kuongeza tag yako ya affiliate kwa Amazon.
function getPartner(slug) {
  const p = get(slug);
  if (!p || p.type !== 'partner') return null;

  const url = new URL(p.partnerUrl);
  const tag = process.env.AMAZON_ASSOCIATE_TAG;
  if (url.hostname === 'www.amazon.com' && tag) url.searchParams.set('tag', tag);
  return { ...p, partnerUrl: url.toString() };
}

module.exports = {
  categories: RAW.categories,
  list,
  listAll,
  get,
  getPartner,
  update,
  publicView,
};
