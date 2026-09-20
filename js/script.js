/**
 * ═══════════════════════════════════════════════════════════
 * ROTEX EMPORIUM — js/script.js
 * Vanilla JS · Multi-Page · Persistent Cart · AI Concierge
 * Backend: Supabase (products + order logging)
 * Requires: js/config.js loaded first
 * Flynn Technologies © 2025
 * ═══════════════════════════════════════════════════════════
 */
'use strict';

/* ── CONFIG ──────────────────────────────────────────────── */
const CFG          = window.ROTEX_CONFIG;
const WA_NUMBER    = CFG.WA_NUMBER;
const CART_KEY     = CFG.CART_KEY;
const IS_CATALOGUE = document.body.classList.contains('page--catalogue');
const db = window.supabase
  ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY)
  : null;

/* ── DOM HELPERS ─────────────────────────────────────────── */
const $   = (id) => document.getElementById(id);
const kes = (n) => `KES ${Number(n).toLocaleString('en-KE')}`;
const escapeHTML = (str) => String(str ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
}[c]));
/* Only allow http(s) image URLs into src attributes */
const safeURL = (u) => /^https?:\/\//i.test(String(u || '')) ? escapeHTML(u) : '';

/* ── STATE ───────────────────────────────────────────────── */
const state = {
  cart: [],
  menuOpen: false, cartOpen: false, checkoutOpen: false, conciergeOpen: false,
};
const cartCount = () => state.cart.reduce((s, i) => s + i.qty, 0);
const cartTotal = () => state.cart.reduce((s, i) => s + i.price * i.qty, 0);

/* ── SCROLL LOCK — one place, so overlays never fight ───── */
const syncScrollLock = () => {
  const anyOpen = state.menuOpen || state.cartOpen || state.checkoutOpen;
  document.body.classList.toggle('no-scroll', anyOpen);
};

/* ── PRODUCT DATA (fetched from Supabase) ───────────────── */
let PRODUCTS = [];
let FETCH_FAILED = false;

const fetchProducts = async () => {
  FETCH_FAILED = false;
  if (!db) { console.error('Supabase client unavailable — check network/CDN.'); FETCH_FAILED = true; PRODUCTS = []; return; }

  const { data, error } = await db
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch products:', error);
    FETCH_FAILED = true;
    PRODUCTS = [];
    return;
  }

  PRODUCTS = (data || []).map(row => ({
    id:       String(row.id),
    name:     row.name,
    category: row.category,
    label:    CFG.CATEGORIES[row.category] || row.category,
    price:    Number(row.price),
    tag:      row.tag,
    sizes:    Array.isArray(row.sizes) ? row.sizes : [],
    img:      row.image_url,
  }));
};

/* ── CART PERSISTENCE ────────────────────────────────────── */
const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (e) {} };
const loadCart = () => {
  try {
    const d = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(d)) return;
    // Sanitise anything read back from storage
    state.cart = d
      .filter(i => i && i.id && i.size && Number.isFinite(+i.price) && Number.isFinite(+i.qty) && +i.qty > 0)
      .map(i => ({ id: String(i.id), name: String(i.name || ''), price: +i.price, size: String(i.size), img: String(i.img || ''), qty: Math.floor(+i.qty) }));
  } catch (e) {}
};

/* Re-price the cart from live catalogue data (catalogue page only).
   Drops items that were deactivated/deleted and corrects stale prices. */
const reconcileCart = () => {
  if (!PRODUCTS.length || FETCH_FAILED) return;
  const byId = new Map(PRODUCTS.map(p => [p.id, p]));
  let changed = false;
  state.cart = state.cart.filter(item => {
    const live = byId.get(item.id);
    if (!live) { changed = true; return false; }
    if (live.price !== item.price) { item.price = live.price; changed = true; }
    return true;
  });
  if (changed) { saveCart(); renderCart(); syncBadges(); toast('Your cart was updated to match current stock and prices.'); }
};

/* ── TOAST ───────────────────────────────────────────────── */
let _toastTimer;
const toast = (msg, type = '') => {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show${type ? ' toast--' + type : ''}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
};

/* ── BADGE SYNC ──────────────────────────────────────────── */
const syncBadges = () => {
  const n = cartCount();
  ['headerCartBadge','fabCartBadge','bottomNavBadge'].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.textContent = n;
    el.dataset.count = n > 0 ? n : '0';
  });
};

/* ── PRODUCT CARD HTML (all DB values escaped) ───────────── */
const cardHTML = (p, isTrack = false) => `
  <article class="product-card${isTrack ? ' product-card--track' : ''}" data-category="${escapeHTML(p.category)}" role="listitem">
    <div class="product-image-wrap">
      <img src="${safeURL(p.img)}" alt="${escapeHTML(p.name)}" loading="lazy" class="product-img" />
      ${p.tag ? `<div class="product-overlay"><span class="product-tag product-tag--${escapeHTML(String(p.tag).toLowerCase())}">${escapeHTML(p.tag)}</span></div>` : ''}
    </div>
    <div class="product-info">
      <div class="product-meta">
        <h3 class="product-name">${escapeHTML(p.name)}</h3>
        <span class="product-category">${escapeHTML(p.label)}</span>
      </div>
      <p class="product-price">${kes(p.price)}</p>
      <div class="product-sizes">
        ${p.sizes.map((s, i) => `<button class="size-btn${i === 0 ? ' active' : ''}" data-size="${escapeHTML(s)}">${escapeHTML(s)}</button>`).join('')}
      </div>
      <button class="btn--add-cart" data-id="${escapeHTML(p.id)}" aria-label="Add ${escapeHTML(p.name)} to cart">
        <span>Add to Cart</span>
      </button>
    </div>
  </article>`;

/* ── CART RENDER ─────────────────────────────────────────── */
const renderCart = () => {
  const empty = $('cartEmpty'), list = $('cartItemsList'), footer = $('cartFooter'), total = $('cartTotal');
  const isEmpty = state.cart.length === 0;
  if (empty)  empty.style.display  = isEmpty ? 'flex' : 'none';
  if (list)   list.style.display   = isEmpty ? 'none' : 'flex';
  if (footer) footer.style.display = isEmpty ? 'none' : 'flex';
  if (total)  total.textContent    = kes(cartTotal());
  if (!list)  return;

  list.innerHTML = state.cart.map(item => `
    <li class="cart-item">
      <img class="cart-item-img" src="${safeURL(item.img)}" alt="${escapeHTML(item.name)}" loading="lazy" />
      <div class="cart-item-info">
        <p class="cart-item-name">${escapeHTML(item.name)}</p>
        <p class="cart-item-size">Size: ${escapeHTML(item.size)}</p>
        <p class="cart-item-price">${kes(item.price * item.qty)}</p>
      </div>
      <div class="cart-item-controls">
        <div class="qty-control">
          <button class="qty-btn" data-action="dec" data-id="${escapeHTML(item.id)}" data-size="${escapeHTML(item.size)}" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${escapeHTML(item.id)}" data-size="${escapeHTML(item.size)}" aria-label="Increase quantity">+</button>
        </div>
        <button class="cart-item-remove" data-action="remove" data-id="${escapeHTML(item.id)}" data-size="${escapeHTML(item.size)}" aria-label="Remove ${escapeHTML(item.name)}">Remove</button>
      </div>
    </li>`).join('');
};

/* Cart item actions — ONE delegated listener (no re-binding on every render) */
const bindCartActions = () => {
  $('cartItemsList')?.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, id, size } = el.dataset;
    if (action === 'remove') {
      state.cart = state.cart.filter(i => !(i.id === id && i.size === size));
      toast('Item removed.');
    } else {
      const idx = state.cart.findIndex(i => i.id === id && i.size === size);
      if (idx > -1) {
        state.cart[idx].qty += action === 'inc' ? 1 : -1;
        if (state.cart[idx].qty <= 0) state.cart.splice(idx, 1);
      }
    }
    saveCart(); renderCart(); syncBadges();
  });
};

/* ── MOBILE MENU (hamburger, top-left) ───────────────────── */
const openMenu = () => {
  if (state.cartOpen) closeCart();
  if (state.conciergeOpen) closeConcierge();
  state.menuOpen = true;
  $('mobileMenu')?.classList.add('open');
  $('mobileMenuOverlay')?.classList.add('active');
  $('mobileMenu')?.setAttribute('aria-hidden', 'false');
  $('menuToggle')?.setAttribute('aria-expanded', 'true');
  syncScrollLock();
  $('mobileMenuClose')?.focus();
};
const closeMenu = (returnFocus = true) => {
  if (!state.menuOpen) return;
  state.menuOpen = false;
  $('mobileMenu')?.classList.remove('open');
  $('mobileMenuOverlay')?.classList.remove('active');
  $('mobileMenu')?.setAttribute('aria-hidden', 'true');
  $('menuToggle')?.setAttribute('aria-expanded', 'false');
  syncScrollLock();
  if (returnFocus) $('menuToggle')?.focus();
};
const toggleMenu = () => (state.menuOpen ? closeMenu() : openMenu());

/* ── CART OPEN / CLOSE ───────────────────────────────────── */
const openCart = () => {
  if (state.menuOpen) closeMenu(false);
  state.cartOpen = true;
  $('cartDrawer')?.classList.add('open');
  $('cartOverlay')?.classList.add('active');
  $('cartDrawer')?.setAttribute('aria-hidden', 'false');
  syncScrollLock();
};
const closeCart = () => {
  state.cartOpen = false;
  $('cartDrawer')?.classList.remove('open');
  $('cartOverlay')?.classList.remove('active');
  $('cartDrawer')?.setAttribute('aria-hidden', 'true');
  syncScrollLock();
};

/* ── CHECKOUT ────────────────────────────────────────────── */
const openCheckout = () => {
  const summary = $('checkoutOrderSummary');
  if (summary) summary.innerHTML = state.cart.map(i =>
    `<div class="checkout-summary-item"><span class="checkout-summary-name">${escapeHTML(i.name)} (${escapeHTML(i.size)}) × ${i.qty}</span><span class="checkout-summary-price">${kes(i.price * i.qty)}</span></div>`
  ).join('') + `<div class="checkout-summary-total"><span class="checkout-summary-total-label">Total</span><span class="checkout-summary-total-value">${kes(cartTotal())}</span></div>`;
  closeCart();
  state.checkoutOpen = true;
  $('checkoutOverlay')?.classList.add('active');
  $('checkoutOverlay')?.setAttribute('aria-hidden', 'false');
  syncScrollLock();
  $('customerName')?.focus();
};
const closeCheckout = () => {
  state.checkoutOpen = false;
  $('checkoutOverlay')?.classList.remove('active');
  $('checkoutOverlay')?.setAttribute('aria-hidden', 'true');
  syncScrollLock();
};

/* ── ORDER LOGGING (Supabase) — background, never blocks WhatsApp ─ */
const logOrderToSupabase = async ({ name, phone, loc, note, items, total }) => {
  if (!db) { console.error('Supabase client unavailable — order not logged, WhatsApp send continues.'); return; }
  try {
    const { error } = await db.from('orders').insert({
      customer_name: name,
      phone,
      location: loc,
      notes: note || null,
      items,
      total,
      status: 'new',
    });
    if (error) console.error('Order log failed:', error);
  } catch (e) {
    console.error('Order log failed:', e);
  }
};

/* ── WHATSAPP ORDER ──────────────────────────────────────── */
let _sending = false;
const sendOrder = () => {
  if (_sending) return;
  const name = $('customerName')?.value.trim();
  const loc  = $('customerLocation')?.value.trim();
  const ph   = $('customerPhone')?.value.trim();
  const note = $('customerNotes')?.value.trim();
  if (!name || name.length < 2)                  return toast('Please enter your full name.');
  if (!loc  || loc.length < 3)                   return toast('Please enter your delivery location.');
  if (!ph   || !/^[0-9+\s\-()]{7,15}$/.test(ph)) return toast('Please enter a valid phone number.');
  if (!state.cart.length)                        return toast('Your cart is empty.');

  _sending = true;

  // Snapshot the order BEFORE clearing anything
  const items = state.cart.map(i => ({ ...i }));
  const total = cartTotal();

  const lines = items.map(i => `▸ ${i.name}\n   Size: ${i.size}  |  Qty: ${i.qty}  |  ${kes(i.price * i.qty)}`).join('\n');
  const msg = encodeURIComponent([
    '🛒 *NEW ORDER — ROTEX EMPORIUM*','─────────────────────','',
    '👤 *Customer Details*',`Name: ${name}`,`Phone: ${ph}`,`Delivery To: ${loc}`,'',
    '📦 *Order Summary*','─────────────────────', lines,
    '─────────────────────',`*TOTAL: ${kes(total)}*`,'',
    note ? `📝 *Notes:* ${note}` : null,'✅ Please confirm availability and delivery timeline.','','— Sent via Rotex Emporium',
  ].filter(Boolean).join('\n'));

  // 1) Open WhatsApp SYNCHRONOUSLY, inside the click. Browsers (esp. iOS Safari) only treat a new
  //    tab as user-initiated if nothing was awaited first — awaiting the DB call before this
  //    would get the tab blocked. (window.open + 'noopener' returns null, so use an anchor.)
  const a = document.createElement('a');
  a.href = `https://wa.me/${WA_NUMBER}?text=${msg}`;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();

  // 2) Log to Supabase in the background — a slow or failed insert never blocks or loses the order
  logOrderToSupabase({ name, phone: ph, loc, note, items, total });

  // 3) Clear cart immediately so a double-tap can't create a duplicate order
  state.cart = []; saveCart(); renderCart(); syncBadges();
  ['customerName','customerLocation','customerPhone','customerNotes'].forEach(id => { const el = $(id); if (el) el.value = ''; });
  closeCheckout();
  toast('Redirecting to WhatsApp 🎉', 'success');
  _sending = false;
};

/* ── CONCIERGE ───────────────────────────────────────────── */
const FAQ = window.RotexFAQ;

/* Render a small subset of formatting safely: **bold**, line breaks, and • bullets.
   Text is escaped FIRST, so nothing from an answer can inject HTML. */
const formatAnswer = (text) => escapeHTML(text)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // https links → tappable. Runs on ALREADY-ESCAPED text, so it cannot introduce markup.
  // (&amp; is kept as-is inside href — browsers decode it correctly.)
  .replace(/(https:\/\/[^\s<]+)/g, (u) => `<a class="chat-link" href="${u}" target="_blank" rel="noopener noreferrer">${u.includes('google.com/maps') ? 'Open in Google Maps' : 'Open link'}</a>`)
  // Kenyan numbers like +254 721 696 486 → tap-to-call
  .replace(/(\+254(?:\s?\d{3}){3})/g, (n) => `<a class="chat-link" href="tel:${n.replace(/\s/g, '')}">${n}</a>`)
  .replace(/\n/g, '<br>');

const appendBubble = (text, who) => {
  const body = $('conciergeBody');
  if (!body) return null;
  const b = document.createElement('div');
  b.className = `chat-bubble chat-bubble--${who}`;
  if (who === 'bot') b.innerHTML = formatAnswer(text); else b.textContent = text;
  body.appendChild(b);
  body.scrollTop = body.scrollHeight;
  return b;
};

/* Tap-to-ask chips that live INSIDE the conversation, under the latest answer */
const clearChips = () => document.querySelectorAll('.chat-chips').forEach(n => n.remove());
const appendChips = (ids, { handoff = false } = {}) => {
  const body = $('conciergeBody');
  if (!body) return;
  clearChips();
  const row = document.createElement('div');
  row.className = 'chat-chips';
  (ids || []).map(FAQ.chip).filter(Boolean).forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chat-chip';
    btn.textContent = c.label;
    btn.addEventListener('click', () => sendConciergeMsg(c.label));
    row.appendChild(btn);
  });
  if (handoff) {
    const a = document.createElement('a');
    a.className = 'chat-chip chat-chip--wa';
    a.href = FAQ.waLink('Hi Rotex, I have a question.');
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = 'Chat with the team on WhatsApp';
    row.appendChild(a);
  }
  if (row.children.length) { body.appendChild(row); body.scrollTop = body.scrollHeight; }
};

const typeThenReply = (question) => {
  const body = $('conciergeBody');
  if (!body) return;
  const res = FAQ.answer(question);
  const t = document.createElement('div');
  t.className = 'chat-typing';
  t.innerHTML = '<span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>';
  body.appendChild(t);
  body.scrollTop = body.scrollHeight;
  // Longer answers "take longer to type" — feels natural, and still capped
  const delay = Math.min(1200, 500 + res.text.length * 1.2);
  setTimeout(() => {
    t.remove();
    appendBubble(res.text, 'bot');
    appendChips(res.next, { handoff: !res.confident });
  }, delay);
};

const sendConciergeMsg = (text) => {
  const q = String(text || '').trim();
  if (!q) return;
  clearChips();
  appendBubble(q, 'user');
  const inp = $('conciergeInput');
  if (inp) inp.value = '';
  typeThenReply(q);
};

const greetIfEmpty = () => {
  const body = $('conciergeBody');
  if (!body || body.children.length) return;
  const g = FAQ.answer('hello');
  appendBubble(g.text, 'bot');
  appendChips(FAQ.STARTERS);
};

const openConcierge = () => {
  if (state.menuOpen) closeMenu(false);
  state.conciergeOpen = true;
  $('conciergeModal')?.classList.add('open');
  $('conciergeModal')?.setAttribute('aria-hidden', 'false');
  greetIfEmpty();
  setTimeout(() => $('conciergeInput')?.focus(), 200);
};
const closeConcierge = () => {
  state.conciergeOpen = false;
  $('conciergeModal')?.classList.remove('open');
  $('conciergeModal')?.setAttribute('aria-hidden', 'true');
};

/* Open with a topic pre-asked (e.g. footer Returns link) */
const openConciergeWithTopic = (topicText) => {
  openConcierge();
  const body = $('conciergeBody');
  const already = body && [...body.querySelectorAll('.chat-bubble--user')].pop()?.textContent === topicText;
  if (!already) setTimeout(() => sendConciergeMsg(topicText), 250);
};

/* ── CATALOGUE PAGE — TRACK BUILDER ─────────────────────── */
const CATS = ['executive', 'statement', 'essentials', 'finishing'];

const showTrackSkeletons = () => {
  CATS.forEach(cat => {
    const track = $(`track-${cat}`);
    if (track) track.innerHTML = '<div class="track-skeleton" aria-hidden="true"></div>'.repeat(4);
  });
};

const buildTracks = () => {
  CATS.forEach(cat => {
    const track = $(`track-${cat}`);
    if (!track) return;

    if (FETCH_FAILED) {
      track.innerHTML = `<div class="track-error" role="alert">
        <p>We couldn't load this collection. Check your connection and try again.</p>
        <button class="btn btn--ghost btn--sm" data-action="retry-products">Try again</button>
      </div>`;
      return;
    }

    const items = PRODUCTS.filter(p => p.category === cat);
    track.innerHTML = items.length
      ? items.map(p => cardHTML(p, true)).join('')
      : `<p class="track-empty">No pieces available in this collection right now.</p>`;
    bindCards(track);
  });

  // Live piece count instead of a hardcoded number
  const stat = $('statPieces');
  if (stat) stat.textContent = FETCH_FAILED ? '—' : String(PRODUCTS.length);
};

const loadCatalogue = async () => {
  showTrackSkeletons();
  await fetchProducts();
  buildTracks();
  reconcileCart();
  initTrackArrows();
};

/* ── CATALOGUE PAGE — CHIP NAV ───────────────────────────── */
const scrollOffset = () => 60 + (document.getElementById('categoryNavScroll')?.offsetHeight || 48) + 8;

const setActiveChip = (targetId) => {
  document.querySelectorAll('.cat-chip').forEach(c => {
    const active = c.dataset.target === targetId;
    c.classList.toggle('cat-chip--active', active);
    c.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
};

const initChips = () => {
  const chips = document.querySelectorAll('.cat-chip');
  chips.forEach(chip => chip.addEventListener('click', () => {
    setActiveChip(chip.dataset.target);
    chip.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
    const target = document.getElementById(chip.dataset.target);
    if (!target) return;
    window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - scrollOffset(), behavior:'smooth' });
  }));

  const sections = CATS.map(id => $(`section-${id}`)).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      setActiveChip(entry.target.id);
      document.querySelector('.cat-chip--active')?.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
    });
  }, { threshold: 0.25, rootMargin: '-80px 0px -60% 0px' });
  sections.forEach(s => spy.observe(s));
};

/* ── CATALOGUE PAGE — TRACK ARROWS ──────────────────────── */
let _arrowsBound = false;
const initTrackArrows = () => {
  const updateArrows = (track, wrap) => {
    wrap.querySelector('.track-arrow--prev')?.classList.toggle('hidden', track.scrollLeft <= 8);
    wrap.querySelector('.track-arrow--next')?.classList.toggle('hidden', track.scrollLeft + track.clientWidth >= track.scrollWidth - 8);
  };

  document.querySelectorAll('.product-track').forEach(track => {
    const wrap = track.closest('.product-track-wrap');
    if (!wrap) return;
    if (!track.dataset.arrowBound) {
      track.dataset.arrowBound = '1';
      track.addEventListener('scroll', () => updateArrows(track, wrap), { passive:true });
    }
    setTimeout(() => updateArrows(track, wrap), 100);
  });

  if (_arrowsBound) return;
  _arrowsBound = true;
  document.querySelectorAll('.track-arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      const track = $(btn.dataset.track);
      if (!track) return;
      const w = track.querySelector('.product-card--track')?.offsetWidth || 280;
      track.scrollBy({ left: (btn.classList.contains('track-arrow--prev') ? -1 : 1) * (w + 16), behavior:'smooth' });
    });
  });
};

/* ── CATALOGUE PAGE — URL PARAM SCROLL ──────────────────── */
const handleURLParam = () => {
  const cat = new URLSearchParams(location.search).get('category');
  if (!cat || !CATS.includes(cat)) return;
  const target = $(`section-${cat}`);
  if (!target) return;
  setTimeout(() => {
    window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - scrollOffset(), behavior:'smooth' });
    setActiveChip(`section-${cat}`);
  }, 400);
};

/* ── PRODUCT CARD EVENT BINDING ──────────────────────────── */
const bindCards = (container) => {
  container.querySelectorAll('.size-btn').forEach(btn =>
    btn.addEventListener('click', e => {
      const card = e.currentTarget.closest('.product-card');
      card?.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    })
  );

  container.querySelectorAll('.btn--add-cart').forEach(btn =>
    btn.addEventListener('click', e => {
      const b    = e.currentTarget;
      // Name / price / image come from the fetched catalogue, NOT from DOM attributes
      const prod = PRODUCTS.find(p => p.id === b.dataset.id);
      if (!prod) return toast('This piece is no longer available.');
      const size = b.closest('.product-card')?.querySelector('.size-btn.active')?.dataset.size;
      if (!size) return toast('Please select a size first.');

      const img = (prod.img || '').replace('w=600', 'w=120');
      const idx = state.cart.findIndex(i => i.id === prod.id && i.size === size);
      idx > -1
        ? state.cart[idx].qty++
        : state.cart.push({ id: prod.id, name: prod.name, price: prod.price, size, img, qty: 1 });
      saveCart(); renderCart(); syncBadges();
      toast(`${prod.name} added to cart! 🛍️`, 'success');
      const span = b.querySelector('span');
      if (span) { b.classList.add('added'); span.textContent = 'Added!'; setTimeout(() => { span.textContent = 'Add to Cart'; b.classList.remove('added'); }, 1400); }
    })
  );
};

/* ── STICKY HEADER ───────────────────────────────────────── */
const handleScroll = () => $('siteHeader')?.classList.toggle('scrolled', scrollY > 40);

/* ── SHARED EVENT BINDINGS ───────────────────────────────── */
const bindSharedEvents = () => {
  // Hamburger + mobile menu
  $('menuToggle')?.addEventListener('click', toggleMenu);
  $('mobileMenuClose')?.addEventListener('click', () => closeMenu());
  $('mobileMenuOverlay')?.addEventListener('click', () => closeMenu());
  // Any real link inside the drawer closes it; in-page anchors close then scroll natively
  $('mobileMenu')?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu(false)));
  // Buttons in the drawer that open the concierge / returns
  $('mobileMenuSupportBtn')?.addEventListener('click', () => { closeMenu(false); openConcierge(); });
  $('mobileMenuReturnsBtn')?.addEventListener('click', () => { closeMenu(false); openConciergeWithTopic('What is your return policy?'); });
  // Desktop breakpoint: make sure the drawer never stays open
  window.matchMedia('(min-width:768px)').addEventListener('change', e => { if (e.matches) closeMenu(false); });

  // Cart open/close
  ['headerCartBtn','fabCartBtn','bottomNavCartBtn'].forEach(id => $(id)?.addEventListener('click', openCart));
  $('cartCloseBtn')?.addEventListener('click', closeCart);
  $('cartOverlay')?.addEventListener('click', closeCart);
  bindCartActions();

  // Checkout
  $('checkoutBtn')?.addEventListener('click', () => state.cart.length ? openCheckout() : toast('Your cart is empty!'));
  $('checkoutCloseBtn')?.addEventListener('click', closeCheckout);
  $('checkoutOverlay')?.addEventListener('click', e => e.target === $('checkoutOverlay') && closeCheckout());
  $('sendWhatsAppBtn')?.addEventListener('click', sendOrder);

  // Concierge (header Help, footer Concierge, FAB, bottom nav, page CTAs)
  ['fabSupportBtn','bottomNavSupportBtn','headerSupportBtn','footerSupportBtn','deliveryConciergeBtn','sizeConciergeBtn'].forEach(id =>
    $(id)?.addEventListener('click', e => { e.preventDefault(); state.conciergeOpen ? closeConcierge() : openConcierge(); })
  );
  $('conciergeCloseBtn')?.addEventListener('click', closeConcierge);
  $('conciergeOverlay')?.addEventListener('click', closeConcierge);
  $('conciergeSendBtn')?.addEventListener('click', () => sendConciergeMsg($('conciergeInput')?.value || ''));
  $('conciergeInput')?.addEventListener('keydown', e => e.key === 'Enter' && (e.preventDefault(), sendConciergeMsg($('conciergeInput').value)));

  // Returns footer link — opens concierge with the returns policy pre-asked
  $('footerReturnsBtn')?.addEventListener('click', e => { e.preventDefault(); openConciergeWithTopic('What is your return policy?'); });

  // Retry button rendered by the catalogue error state (delegated)
  document.addEventListener('click', e => {
    if (e.target.closest('[data-action="retry-products"]')) loadCatalogue();
  });

  // Keyboard escape — closes the top-most layer first
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (state.checkoutOpen)         closeCheckout();
    else if (state.cartOpen)        closeCart();
    else if (state.menuOpen)        closeMenu();
    else if (state.conciergeOpen)   closeConcierge();
  });

  window.addEventListener('scroll', handleScroll, { passive:true });
};

/* ── SHOP DETAILS → PAGE ─────────────────────────────────────
   Any element with data-shop="key" is filled from ROTEX_CONFIG.SHOP, so the homepage,
   delivery page and Concierge always say the same thing. Empty values hide their line. */
const hydrateShop = () => {
  const S = CFG.SHOP || {};
  const computed = { 'town-area': [S.town, S.area && S.area.split(',')[0]].filter(Boolean).join(', ') };
  document.querySelectorAll('[data-shop]').forEach(el => {
    const key = el.dataset.shop;
    const val = computed[key] ?? S[key];
    if (val === undefined || val === null || val === '') {
      // Hide a now-empty optional line (and a trailing <br> before it)
      if (el.previousElementSibling?.tagName === 'BR') el.previousElementSibling.remove();
      el.remove();
    } else {
      el.textContent = String(val);
    }
  });
  // Directions + contact links
  const dir = $('visitDirections');
  if (dir && S.mapsQuery) dir.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(S.mapsQuery)}`;
  const tel = $('visitPhone');
  if (tel && S.phone) tel.href = `tel:${String(S.phone).replace(/[^\d+]/g, '')}`;
};

/* ── INIT ────────────────────────────────────────────────── */
const init = async () => {
  loadCart();
  renderCart();
  syncBadges();
  handleScroll();
  hydrateShop();
  bindSharedEvents();

  if (IS_CATALOGUE) {
    initChips();
    await loadCatalogue();
    handleURLParam();
  }
};

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
