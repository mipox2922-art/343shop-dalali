# 343SHOP

**343SHOP** — duka la kisasa la zawadi, picha, logo, vitabu, hadithi na content.  
Tunauza **Afrika** na **kimataifa** (USD).

Founded by **moog343 LMT** · Mr AI · Chuga Stani

## Unachouza

| Aina | Mfano |
|------|--------|
| **Picha & Printi** | Custom photo print, canvas wall art |
| **Logo & Branding** | Logo design pack, full brand kit |
| **Vitabu** | Storybooks (Kiswahili), author paperback |
| **Hadithi & Content** | Custom story eBook, social content pack |
| **Zawadi binafsi** | Vikombe, fulana, kava za simu |
| **Washirika** | Gadgets kutoka Amazon / Alibaba |

## Kuendesha

```bash
cp .env.example .env
npm install
npm start          # http://localhost:3000
```

## Muundo

- `server.js` — API, security, partner redirects
- `lib/catalog.js` — katalogi + validation
- `data/products.json` — bidhaa
- `public/` — frontend (logo, UI, app)

© 2026 343SHOP · Africa & International


## MR AI private shop operations API

343SHOP exposes a private, owner-controlled operations API under `/api/ai`. It is not part of the public storefront API.

Configure these environment variables on the shop runtime:

- `MR_AI_SHOP_API_KEY`: a unique random secret of at least 32 characters, used by MR AI for read access.
- `MR_AI_SHOP_WRITE_ENABLED=false`: keep product writes disabled until the owner explicitly enables the separate write path.
- `MR_AI_SHOP_WRITE_KEY`: a second unique secret of at least 32 characters; required only if the owner later enables product edits.

The private API supports `GET /api/ai/health`, `GET /api/ai/overview`, `GET /api/ai/products`, and `GET /api/ai/orders`. Product changes use `PUT /api/ai/products/:slug` and require the separate write key, `MR_AI_SHOP_WRITE_ENABLED=true`, and an explicit `ownerApproved: true` flag. The API never changes order payment status and never claims pending orders are paid revenue.

The current catalogue is made-to-order plus partner listings; it has no stock quantity field. Order records are currently stored as local JSONL, so the runtime must provide durable writable storage for reliable order history. Do not describe this storage as durable on an ephemeral serverless filesystem.
