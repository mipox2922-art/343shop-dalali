'use strict';

const fs = require('fs');
const path = require('path');

const RAW = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'products.json'), 'utf8')
);

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

const products = RAW.products.map(validate).filter(Boolean);
const bySlug = new Map(products.map((p) => [p.slug, p]));

// Hakuna field za ndani zinazotoka nje (kama partnerUrl)
function publicView(p) {
  const { partnerUrl, ...rest } = p;
  return rest;
}

function list({ category, q } = {}) {
  const needle = q ? q.toLowerCase() : null;
  return products
    .filter((p) => !category || p.category === category)
    .filter((p) => !needle ||
      [p.name, p.nameSw, p.description, p.descriptionSw]
        .some((s) => s && s.toLowerCase().includes(needle)))
    .map(publicView);
}

function get(slug) {
  return bySlug.get(slug) ?? null;
}

// Inarudisha URL ya partner pekee, na kuongeza tag yako ya affiliate kwa Amazon.
function getPartner(slug) {
  const p = bySlug.get(slug);
  if (!p || p.type !== 'partner') return null;

  const url = new URL(p.partnerUrl);
  const tag = process.env.AMAZON_ASSOCIATE_TAG;
  if (url.hostname === 'www.amazon.com' && tag) url.searchParams.set('tag', tag);
  return { ...p, partnerUrl: url.toString() };
}

module.exports = {
  categories: RAW.categories,
  list,
  get,
  getPartner,
  publicView,
};
