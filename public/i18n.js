'use strict';

const CART_KEY = 'shop343.cart.v2';
const LANG_KEY = 'shop343.lang.v1';
const MAX_QTY = 10;
const MAX_LINES = 20;
const FREE_SHIPPING_CENTS = 7500;

const DICT = {
  en: {
    navShop: 'Shop', navCart: 'Cart',
    announce: 'Free shipping over $75 · Serving Africa & the world',
    shipping: 'Shipping', returns: 'Returns', privacy: 'Privacy',
    footerNote: '343SHOP — gifts, books, logos & content for Africa and the world',
    heroTag: 'Africa · International',
    heroTitle: 'Create. Print. Share. Sell.',
    heroSub: 'Photos, logos, books, stories and custom gifts — designed for creators and families across Africa and beyond.',
    stat1: 'Products', stat2: 'Custom', stat3: 'Partners',
    all: 'All', search: 'Search products…', loading: 'Loading…',
    error: 'Something went wrong. Please try again.',
    notFound: 'This page does not exist.', back: '← Back to shop', backShop: 'Back to shop',
    noResults: 'No products match your search.',
    addToCart: 'Add to cart', added: 'Added to your cart.',
    cartFull: 'Your cart is full. Remove an item to add more.',
    personalize: 'Name, text or short brief (up to 40 characters)', qty: 'Quantity',
    buyAt: 'Buy on', partnerNote: 'Sold & shipped by {name}. You pay them directly — we connect you.',
    ownNote: 'Made for you. Ships in 3–5 days (digital items delivered by email).',
    badgeCustom: 'Custom', badgePartner: 'Partner',
    cartTitle: 'Your cart', cartEmpty: 'Your cart is empty.',
    subtotal: 'Subtotal', shippingLabel: 'Shipping', free: 'Free', total: 'Total',
    remove: 'Remove', checkout: 'Checkout', clearCart: 'Clear cart',
    freeLeft: 'Add {amt} more for free shipping', freeReached: 'You qualify for free shipping!',
    checkoutTitle: 'Checkout', placeOrder: 'Place order', sending: 'Sending…',
    orderDone: 'Thank you! Your order was received.', orderId: 'Order number',
    orderNext: 'Confirmation will be sent by email. Keep your order number.',
    invalid: 'Please check these fields:',
    f_name: 'Full name', f_email: 'Email', f_phone: 'Phone (optional)',
    f_address: 'Address', f_city: 'City', f_country: 'Country',
    feat1t: 'Custom made', feat1d: 'Photos, logos, books & more',
    feat2t: 'Africa ready', feat2d: 'Built for local & global buyers',
    feat3t: 'Trusted partners', feat3d: 'Amazon & Alibaba when needed',
    feat4t: 'Secure checkout', feat4d: 'Your data stays private',
    policy_shipping: 'Free shipping on orders over $75. Below that: $6.99. Custom items take 3–5 days. Partner items ship via Amazon or Alibaba. Digital items are delivered by email.',
    policy_returns: 'Damaged custom items are replaced free within 14 days. Personalized items cannot be returned unless defective. Partner purchases follow the seller’s policy.',
    policy_privacy: 'We collect only name, email and shipping address to complete your order. We never sell your information.',
  },
  sw: {
    navShop: 'Duka', navCart: 'Kikapu',
    announce: 'Usafirishaji wa bure zaidi ya $75 · Tunafikisha Afrika na dunia',
    shipping: 'Usafirishaji', returns: 'Marejesho', privacy: 'Faragha',
    footerNote: '343SHOP — zawadi, vitabu, logo na content kwa Afrika na dunia',
    heroTag: 'Afrika · Kimataifa',
    heroTitle: 'Tengeneza. Chapisha. Shiriki. Uza.',
    heroSub: 'Picha, logo, vitabu, hadithi na zawadi binafsi — kwa waundaji na familia Afrika nzima na duniani kote.',
    stat1: 'Bidhaa', stat2: 'Binafsi', stat3: 'Washirika',
    all: 'Zote', search: 'Tafuta bidhaa…', loading: 'Inapakia…',
    error: 'Kuna tatizo. Jaribu tena.',
    notFound: 'Ukurasa huu haupatikani.', back: '← Rudi dukani', backShop: 'Rudi dukani',
    noResults: 'Hakuna bidhaa zinazolingana na utafutaji wako.',
    addToCart: 'Ongeza kwenye kikapu', added: 'Imeongezwa kwenye kikapu.',
    cartFull: 'Kikapu kimejaa. Ondoa bidhaa ili kuongeza nyingine.',
    personalize: 'Jina, maandishi au maelezo mafupi (hadi herufi 40)', qty: 'Idadi',
    buyAt: 'Nunua kwenye', partnerNote: 'Inauzwa na kusafirishwa na {name}. Unalipa moja kwa moja — sisi tunaunganisha.',
    ownNote: 'Imetengenezwa kwa ajili yako. Inasafirishwa siku 3–5 (bidhaa za kidijitali hutumwa kwa barua pepe).',
    badgeCustom: 'Binafsi', badgePartner: 'Washirika',
    cartTitle: 'Kikapu chako', cartEmpty: 'Kikapu chako ni tupu.',
    subtotal: 'Jumla ndogo', shippingLabel: 'Usafirishaji', free: 'Bure', total: 'Jumla',
    remove: 'Ondoa', checkout: 'Endelea kulipa', clearCart: 'Futa kikapu',
    freeLeft: 'Ongeza {amt} upate usafirishaji wa bure', freeReached: 'Umepata usafirishaji wa bure!',
    checkoutTitle: 'Kulipa', placeOrder: 'Thibitisha oda', sending: 'Inatuma…',
    orderDone: 'Asante! Oda yako imepokelewa.', orderId: 'Namba ya oda',
    orderNext: 'Uthibitisho utatumwa kwa barua pepe. Hifadhi namba ya oda.',
    invalid: 'Tafadhali angalia sehemu hizi:',
    f_name: 'Jina kamili', f_email: 'Barua pepe', f_phone: 'Simu (hiari)',
    f_address: 'Anwani', f_city: 'Mji', f_country: 'Nchi',
    feat1t: 'Binafsi', feat1d: 'Picha, logo, vitabu na zaidi',
    feat2t: 'Afrika tayari', feat2d: 'Kwa wateja wa ndani na nje',
    feat3t: 'Washirika', feat3d: 'Amazon na Alibaba inapohitajika',
    feat4t: 'Salama', feat4d: 'Taarifa zako zinalindwa',
    policy_shipping: 'Usafirishaji wa bure kwa oda zaidi ya $75. Chini ya hapo: $6.99. Bidhaa binafsi siku 3–5. Bidhaa za washirika kupitia Amazon/Alibaba. Bidhaa za kidijitali hutumwa kwa barua pepe.',
    policy_returns: 'Bidhaa binafsi zenye kasoro tunazibadilisha bure ndani ya siku 14. Zilizobinafsishwa hazirudishwi isipokuwa zina kasoro. Bidhaa za washirika zinafuata sera ya muuzaji.',
    policy_privacy: 'Tunakusanya jina, barua pepe na anwani pekee ili kukamilisha oda. Hatuuzi taarifa zako.',
  },
};
window.DICT = DICT;
window.CART_KEY = CART_KEY;
window.LANG_KEY = LANG_KEY;
window.MAX_QTY = MAX_QTY;
window.MAX_LINES = MAX_LINES;
window.FREE_SHIPPING_CENTS = FREE_SHIPPING_CENTS;
