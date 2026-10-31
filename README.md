# 343SHOP

**343SHOP** — duka la kisasa la zawadi, picha, logo, vitabu, hadithi na content.  
Tunauza **Afrika** na **kimataifa** (USD).

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
- `data/products.json` — bidhaa (badilisha hapa)
- `public/` — frontend ya kisasa (HTML/CSS/JS)

## Kabla ya live

1. Weka `SITE_URL` + HTTPS  
2. Unganisha malipo (Stripe / M-Pesa)  
3. Weka `AMAZON_ASSOCIATE_TAG`  
4. Ongeza picha halisi kwenye `products.json`  

© 2026 343SHOP · Africa & International
