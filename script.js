/**
 * ═══════════════════════════════════════════════════════════
 * ROTEX EMPORIUM — script.js
 * Vanilla JS · Multi-Page · Persistent Cart · AI Concierge
 * Backend: Supabase (products + order logging)
 * Flynn Technologies © 2025
 * ═══════════════════════════════════════════════════════════
 */
'use strict';

/* ── SUPABASE CONFIG ─────────────────────────────────────── */
const SUPABASE_URL      = 'https://ftrqsvdfjxhjkwzxuntg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BvwznwMV1Y68_ZAekTmdrQ_OIRKWM1n';
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/* ── CONFIG ──────────────────────────────────────────────── */
const WA_NUMBER     = '254721696486'; // Replace with live number
const CART_KEY      = 'rotex_cart';
const IS_CATALOGUE  = document.body.classList.contains('page--catalogue');

/* ── PRODUCT DATA (fetched from Supabase) ───────────────── */
let PRODUCTS = [];

const fetchProducts = async () => {
  if (!db) { console.error('Supabase client unavailable — check network/CDN.'); PRODUCTS = []; return; }
  const { data, error } = await db
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch products:', error);
    PRODUCTS = [];
    return;
  }

  // Map Supabase rows to the field names the rest of script.js expects
  const labelFor = (cat) => ({
    executive:  'Executive',
    statement:  'Statement',
    essentials: 'Essentials',
    finishing:  'Finishing',
  }[cat] || cat);

  PRODUCTS = (data || []).map(row => ({
    id:       row.id,
    name:     row.name,
    category: row.category,
    label:    labelFor(row.category),
    price:    row.price,
    tag:      row.tag,
    sizes:    row.sizes || [],
    img:      row.image_url,
  }));
};

/* ── CONCIERGE KNOWLEDGE BASE (pattern → response) ──────── */
const KB = [
  [['size','sizing','fit','measurements'],            'We carry XS–XXL in clothing, waist 28–36 in bottoms, EU 39–44 in footwear. Cut true-to-size — size up for a relaxed fit. 📏'],
  [['delivery','shipping','how long','arrive'],       'Nairobi: 1–2 business days. Rest of Kenya: 2–4 days via courier. Tracking is sent on dispatch. 🚚'],
  [['mpesa','payment','pay','cash','card'],           'We accept M-Pesa, cash on delivery (Nairobi only), and bank transfer. 💸'],
  [['return','refund','exchange','damaged','faulty'], 'Returns accepted within 7 days of delivery, original condition with tags. Exchanges are free. WhatsApp us to initiate. 🔄'],
  [['price','cost','discount','promo','sale'],        'Prices are fully inclusive. Follow @rotexemporium on Instagram for exclusive promotions. 🏷️'],
  [['authentic','genuine','quality','real'],          'Every piece is 100% authentic. No imitations, ever. ✅'],
  [['location','store','pickup','address'],           'We operate online with Kenya-wide delivery. Oloitokitok Kimana pickup can be arranged — just mention it at checkout. 📍'],
  [['hello','hi','hey','good morning','good evening'],'Welcome to Rotex Emporium. 👋 Ask me about sizing, delivery, payments, or our collections.'],
  [['thank','thanks','perfect','great','awesome'],    'Always a pleasure. 🤝 Tap "Hand off to Human" if you need more help.'],
];
const FALLBACKS = [
  'Great question! For the most precise answer, tap "Hand off to Human" — our team responds in minutes. 💬',
  'I\'d rather get you to the right person than guess. Use the WhatsApp button below. ⚡',
];
const findResponse = (input) => {
  const q = input.toLowerCase();
  const match = KB.find(([patterns]) => patterns.some(p => q.includes(p)));
  return match ? match[1] : FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
};

/* ── STATE ───────────────────────────────────────────────── */
const state = { cart: [], cartOpen: false, checkoutOpen: false, conciergeOpen: false };

/* ── CART PERSISTENCE ────────────────────────────────────── */
const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch(e) {} };
const loadCart = () => { try { const d = JSON.parse(localStorage.getItem(CART_KEY)); if (Array.isArray(d)) state.cart = d; } catch(e) {} };

/* ── DOM HELPERS ─────────────────────────────────────────── */
const $  = (id) => document.getElementById(id);
const kes = (n) => `KES ${n.toLocaleString('en-KE')}`;
const cartCount = () => state.cart.reduce((s, i) => s + i.qty, 0);
const cartTotal = () => state.cart.reduce((s, i) => s + i.price * i.qty, 0);

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

/* ── PRODUCT CARD HTML ───────────────────────────────────── */
const cardHTML = (p, isTrack = false) => `
  <article class="product-card${isTrack ? ' product-card--track' : ''}" data-category="${p.category}" role="listitem">
    <div class="product-image-wrap">
      <img src="${p.img}" alt="${p.name}" loading="lazy" class="product-img" />
      ${p.tag ? `<div class="product-overlay"><span class="product-tag product-tag--${p.tag.toLowerCase()}">${p.tag}</span></div>` : ''}
    </div>
    <div class="product-info">
      <div class="product-meta">
        <h3 class="product-name">${p.name}</h3>
        <span class="product-category">${p.label}</span>
      </div>
      <p class="product-price">${kes(p.price)}</p>
      <div class="product-sizes">
        ${p.sizes.map((s, i) => `<button class="size-btn${i === 0 ? ' active' : ''}" data-size="${s}">${s}</button>`).join('')}
      </div>
      <button class="btn--add-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" aria-label="Add ${p.name} to cart">
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
    <li class="cart-item" data-id="${item.id}" data-size="${item.size}">
      <img class="cart-item-img" src="${item.img || ''}" alt="${item.name}" loading="lazy" />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-size">Size: ${item.size}</p>
        <p class="cart-item-price">${kes(item.price * item.qty)}</p>
      </div>
      <div class="cart-item-controls">
        <div class="qty-control">
          <button class="qty-btn" data-action="dec" data-id="${item.id}" data-size="${item.size}" aria-label="Decrease">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}" data-size="${item.size}" aria-label="Increase">+</button>
        </div>
        <button class="cart-item-remove" data-action="remove" data-id="${item.id}" data-size="${item.size}" aria-label="Remove">Remove</button>
      </div>
    </li>`).join('');

  list.querySelectorAll('[data-action]').forEach(el =>
    el.addEventListener('click', e => {
      const { action, id, size } = e.currentTarget.dataset;
      if (action === 'remove') { state.cart = state.cart.filter(i => !(i.id === id && i.size === size)); toast('Item removed.'); }
      else {
        const idx = state.cart.findIndex(i => i.id === id && i.size === size);
        if (idx > -1) { state.cart[idx].qty += action === 'inc' ? 1 : -1; if (state.cart[idx].qty <= 0) state.cart.splice(idx, 1); }
      }
      saveCart(); renderCart(); syncBadges();
    })
  );
};

/* ── CART OPEN / CLOSE ───────────────────────────────────── */
const openCart  = () => { state.cartOpen = true;  $('cartDrawer')?.classList.add('open');    $('cartOverlay')?.classList.add('active');    $('cartDrawer')?.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden'; };
const closeCart = () => { state.cartOpen = false; $('cartDrawer')?.classList.remove('open'); $('cartOverlay')?.classList.remove('active'); $('cartDrawer')?.setAttribute('aria-hidden','true');  document.body.style.overflow = '';       };

/* ── CHECKOUT ────────────────────────────────────────────── */
const openCheckout = () => {
  const summary = $('checkoutOrderSummary');
  if (summary) summary.innerHTML = state.cart.map(i =>
    `<div class="checkout-summary-item"><span class="checkout-summary-name">${i.name} (${i.size}) × ${i.qty}</span><span class="checkout-summary-price">${kes(i.price * i.qty)}</span></div>`
  ).join('') + `<div class="checkout-summary-total"><span class="checkout-summary-total-label">Total</span><span class="checkout-summary-total-value">${kes(cartTotal())}</span></div>`;
  state.checkoutOpen = true;
  $('checkoutOverlay')?.classList.add('active');
  $('checkoutOverlay')?.setAttribute('aria-hidden','false');
  closeCart();
};
const closeCheckout = () => { state.checkoutOpen = false; $('checkoutOverlay')?.classList.remove('active'); $('checkoutOverlay')?.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };

/* ── ORDER LOGGING (Supabase) — never blocks WhatsApp send ─ */
const logOrderToSupabase = async ({ name, phone, loc, note }) => {
  if (!db) { console.error('Supabase client unavailable — order not logged, WhatsApp send continues.'); return; }
  try {
    const { error } = await db.from('orders').insert({
      customer_name: name,
      phone,
      location: loc,
      notes: note || null,
      items: state.cart,
      total: cartTotal(),
      status: 'new',
    });
    if (error) console.error('Order log failed:', error);
  } catch (e) {
    console.error('Order log failed:', e);
  }
};

/* ── WHATSAPP ORDER ──────────────────────────────────────── */
const sendOrder = async () => {
  const name = $('customerName')?.value.trim();
  const loc  = $('customerLocation')?.value.trim();
  const ph   = $('customerPhone')?.value.trim();
  const note = $('customerNotes')?.value.trim();
  if (!name || name.length < 2)              return toast('Please enter your full name.');
  if (!loc  || loc.length < 3)              return toast('Please enter your delivery location.');
  if (!ph   || !/^[0-9+\s\-(]{7,15}$/.test(ph)) return toast('Please enter a valid phone number.');
  if (!state.cart.length)                   return toast('Your cart is empty.');

  const btn = $('sendWhatsAppBtn');
  if (btn) btn.disabled = true;

  // Log to Supabase first, but never let a failure block the WhatsApp handoff
  await logOrderToSupabase({ name, phone: ph, loc, note });

  const lines = state.cart.map(i => `▸ ${i.name}\n   Size: ${i.size}  |  Qty: ${i.qty}  |  ${kes(i.price * i.qty)}`).join('\n');
  const msg = encodeURIComponent([
    '🛒 *NEW ORDER — ROTEX EMPORIUM*','─────────────────────','',
    '👤 *Customer Details*',`Name: ${name}`,`Phone: ${ph}`,`Delivery To: ${loc}`,'',
    '📦 *Order Summary*','─────────────────────', lines,
    '─────────────────────',`*TOTAL: ${kes(cartTotal())}*`,'',
    note ? `📝 *Notes:* ${note}` : null,'✅ Please confirm availability and delivery timeline.','','— Sent via Rotex Emporium',
  ].filter(Boolean).join('\n'));

  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank', 'noopener,noreferrer');
  closeCheckout();
  toast('Redirecting to WhatsApp 🎉', 'success');
  if (btn) btn.disabled = false;
  setTimeout(() => {
    state.cart = []; saveCart(); renderCart(); syncBadges();
    ['customerName','customerLocation','customerPhone','customerNotes'].forEach(id => { const el=$(id); if(el) el.value=''; });
  }, 500);
};

/* ── CONCIERGE ───────────────────────────────────────────── */
const appendBubble = (text, who) => {
  const body = $('conciergeBody');
  if (!body) return;
  const b = document.createElement('div');
  b.className = `chat-bubble chat-bubble--${who}`;
  b.textContent = text;
  body.appendChild(b);
  body.scrollTop = body.scrollHeight;
};

const typeThenReply = (text) => {
  const body = $('conciergeBody');
  if (!body) return;
  const t = document.createElement('div');
  t.className = 'chat-typing';
  t.innerHTML = '<span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>';
  body.appendChild(t);
  body.scrollTop = body.scrollHeight;
  setTimeout(() => { t.remove(); appendBubble(text, 'bot'); }, 800 + Math.random() * 500);
};

const sendConciergeMsg = (text) => {
  if (!text.trim()) return;
  appendBubble(text.trim(), 'user');
  const inp = $('conciergeInput');
  if (inp) inp.value = '';
  const qr = $('quickReplies');
  if (qr) qr.style.display = 'none';
  typeThenReply(findResponse(text));
};

const openConcierge  = () => {
  state.conciergeOpen = true;
  $('conciergeModal')?.classList.add('open');
  $('conciergeModal')?.setAttribute('aria-hidden','false');
  const body = $('conciergeBody');
  if (body && !body.children.length) appendBubble('Welcome to Rotex Emporium. 👋 Ask me about sizing, delivery, payments, or our collections.', 'bot');
  setTimeout(() => $('conciergeInput')?.focus(), 200);
};
const closeConcierge = () => { state.conciergeOpen = false; $('conciergeModal')?.classList.remove('open'); $('conciergeModal')?.setAttribute('aria-hidden','true'); };

/* ── CONCIERGE: OPEN WITH A TOPIC PRE-ASKED (e.g. Returns link) ── */
const openConciergeWithTopic = (topicText) => {
  openConcierge();
  const qr = $('quickReplies');
  if (qr) qr.style.display = 'none';
  const body = $('conciergeBody');
  // Avoid re-asking if this exact topic bubble is already the last message
  const already = body && body.lastElementChild && body.lastElementChild.textContent === topicText;
  if (!already) {
    setTimeout(() => { appendBubble(topicText, 'user'); typeThenReply(findResponse(topicText)); }, 250);
  }
};

/* ── CATALOGUE PAGE — TRACK BUILDER ─────────────────────── */
const buildTracks = () => {
  ['executive','statement','essentials','finishing'].forEach(cat => {
    const track = $(`track-${cat}`);
    if (!track) return;
    const items = PRODUCTS.filter(p => p.category === cat);
    track.innerHTML = items.length
      ? items.map(p => cardHTML(p, true)).join('')
      : `<p class="track-empty">No pieces available in this collection right now.</p>`;
    bindCards(track);
  });
};

/* ── CATALOGUE PAGE — CHIP NAV ───────────────────────────── */
const initChips = () => {
  const chips = document.querySelectorAll('.cat-chip');

  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => { c.classList.remove('cat-chip--active'); c.setAttribute('aria-pressed','false'); });
    chip.classList.add('cat-chip--active');
    chip.setAttribute('aria-pressed','true');
    chip.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
    const target = document.getElementById(chip.dataset.target);
    if (!target) return;
    const offset = 60 + (document.getElementById('categoryNavScroll')?.offsetHeight || 48) + 8;
    window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset, behavior:'smooth' });
  }));

  // Scroll-spy: highlight chip as sections enter view
  const sections = ['executive','statement','essentials','finishing'].map(id => $(`section-${id}`)).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      chips.forEach(c => {
        const active = c.dataset.target === entry.target.id;
        c.classList.toggle('cat-chip--active', active);
        c.setAttribute('aria-pressed', active ? 'true' : 'false');
        if (active) c.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
      });
    });
  }, { threshold: 0.25, rootMargin: '-80px 0px -60% 0px' });
  sections.forEach(s => spy.observe(s));
};

/* ── CATALOGUE PAGE — TRACK ARROWS ──────────────────────── */
const initTrackArrows = () => {
  const updateArrows = (track, wrap) => {
    wrap.querySelector('.track-arrow--prev')?.classList.toggle('hidden', track.scrollLeft <= 8);
    wrap.querySelector('.track-arrow--next')?.classList.toggle('hidden', track.scrollLeft + track.clientWidth >= track.scrollWidth - 8);
  };

  document.querySelectorAll('.product-track').forEach(track => {
    const wrap = track.closest('.product-track-wrap');
    if (!wrap) return;
    track.addEventListener('scroll', () => updateArrows(track, wrap), { passive:true });
    setTimeout(() => updateArrows(track, wrap), 100);
  });

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
  if (!cat) return;
  const target = $(`section-${cat}`);
  if (!target) return;
  // Wait for layout, then scroll
  setTimeout(() => {
    const offset = 60 + (document.getElementById('categoryNavScroll')?.offsetHeight || 48) + 8;
    window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset, behavior:'smooth' });
    // Sync chip active state
    document.querySelectorAll('.cat-chip').forEach(c => {
      const active = c.dataset.target === `section-${cat}`;
      c.classList.toggle('cat-chip--active', active);
      c.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
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
      const b     = e.currentTarget;
      const id    = b.dataset.id;
      const name  = b.dataset.name;
      const price = +b.dataset.price;
      const size  = b.closest('.product-card')?.querySelector('.size-btn.active')?.dataset.size;
      const img   = b.closest('.product-card')?.querySelector('.product-img')?.src.replace('w=600','w=120') || '';
      if (!size) return toast('Please select a size first.');

      const idx = state.cart.findIndex(i => i.id === id && i.size === size);
      idx > -1 ? state.cart[idx].qty++ : state.cart.push({ id, name, price, size, img, qty:1 });
      saveCart(); renderCart(); syncBadges();
      toast(`${name} added to cart! 🛍️`, 'success');
      const span = b.querySelector('span');
      if (span) { b.classList.add('added'); span.textContent = 'Added!'; setTimeout(() => { span.textContent = 'Add to Cart'; b.classList.remove('added'); }, 1400); }
    })
  );
};

/* ── STICKY HEADER ───────────────────────────────────────── */
const handleScroll = () => $('siteHeader')?.classList.toggle('scrolled', scrollY > 40);

/* ── SHARED EVENT BINDINGS ───────────────────────────────── */
const bindSharedEvents = () => {
  // Cart open/close
  ['headerCartBtn','fabCartBtn','bottomNavCartBtn'].forEach(id => $(id)?.addEventListener('click', openCart));
  $('cartCloseBtn')?.addEventListener('click', closeCart);
  $('cartOverlay')?.addEventListener('click', closeCart);

  // Checkout
  $('checkoutBtn')?.addEventListener('click', () => state.cart.length ? openCheckout() : toast('Your cart is empty!'));
  $('checkoutCloseBtn')?.addEventListener('click', closeCheckout);
  $('checkoutOverlay')?.addEventListener('click', e => e.target === $('checkoutOverlay') && closeCheckout());
  $('sendWhatsAppBtn')?.addEventListener('click', sendOrder);

  // Concierge
  ['fabSupportBtn','bottomNavSupportBtn','headerSupportBtn','footerSupportBtn'].forEach(id =>
    $(id)?.addEventListener('click', e => { e.preventDefault(); state.conciergeOpen ? closeConcierge() : openConcierge(); })
  );
  $('conciergeCloseBtn')?.addEventListener('click', closeConcierge);
  $('conciergeOverlay')?.addEventListener('click', closeConcierge);
  $('conciergeSendBtn')?.addEventListener('click', () => sendConciergeMsg($('conciergeInput')?.value || ''));
  $('conciergeInput')?.addEventListener('keydown', e => e.key === 'Enter' && (e.preventDefault(), sendConciergeMsg($('conciergeInput').value)));
  document.querySelectorAll('.quick-reply-btn').forEach(b => b.addEventListener('click', () => sendConciergeMsg(b.dataset.reply)));

  // Returns footer link — opens concierge with the returns policy already asked
  $('footerReturnsBtn')?.addEventListener('click', e => { e.preventDefault(); openConciergeWithTopic('What is your return policy?'); });

  // Keyboard escape
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (state.checkoutOpen)  closeCheckout();
    else if (state.cartOpen) closeCart();
    else if (state.conciergeOpen) closeConcierge();
  });

  window.addEventListener('scroll', handleScroll, { passive:true });
};

/* ── INIT ────────────────────────────────────────────────── */
const init = async () => {
  loadCart();
  renderCart();
  syncBadges();
  handleScroll();
  bindSharedEvents();

  if (IS_CATALOGUE) {
    await fetchProducts();
    buildTracks();
    initChips();
    initTrackArrows();
    handleURLParam();
  }
};

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
