# 343SHOP — Duka la Dalali la Kisasa

**Dalali wako wa kisasa.** Tunachagua zawadi binafsi + bidhaa bora kutoka washirika (Amazon, Alibaba) na kukuunganisha moja kwa moja.

- **Zawadi binafsi (Custom)** — vikombe, fulana, kava, mabango, mikufu, vitabu vya hadithi (Kiswahili)
- **Bidhaa za washirika (Partner / Dalali)** — gadgets na vitu vilivyochaguliwa; unanunua moja kwa moja kutoka Amazon au Alibaba
- Lugha mbili: **Kiswahili + English**
- Bei: **USD**

## Kuendesha

```bash
cp .env.example .env
npm install
npm start          # http://localhost:3000
```

## Muundo

| Faili / Folda | Maelezo |
|---------------|--------|
| `server.js` | API, rate limiting, security headers, `/go/:slug` redirect ya partner |
| `lib/catalog.js` | Inasoma `data/products.json`, inakataa data mbaya, inaruhusu partner domains tu |
| `data/products.json` | Katalogi — badilisha hapa kuongeza bidhaa |
| `public/` | Frontend ya kisasa (HTML/CSS/JS, hakuna framework) |
| `data/orders.jsonl` | Oda (inaweza kuhamishiwa database baadaye) |

## Kabla ya kuzindua (live)

1. Weka `SITE_URL` ya domain yako na HTTPS.
2. Unganisha malipo: Stripe Checkout au M-Pesa / Tigo Pesa. Oda inaanza `pending_payment`; badilisha kuwa `paid` tu baada ya webhook yenye signature.
3. Hamisha `orders.jsonl` kwenye database (PostgreSQL) na usimbe taarifa za wateja.
4. Weka `AMAZON_ASSOCIATE_TAG` yako na uthibitishe ASIN halisi kwenye `products.json`.
5. Ongeza picha halisi (`image` URL ya https) kwa kila bidhaa.

## Dhana ya “Dalali”

343SHOP inafanya kazi kama **dalali wa kisasa**:
- Unachagua na kuonyesha bidhaa bora
- Kwa bidhaa za partner → mteja anaenda moja kwa moja kwa muuzaji (Amazon/Alibaba) kupitia link yako ya affiliate
- Kwa bidhaa zako (custom) → unaweza kuchukua oda na kutengeneza/kusafirisha mwenyewe

---

© 2026 343SHOP
