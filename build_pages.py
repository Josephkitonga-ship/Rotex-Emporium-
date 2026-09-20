#!/usr/bin/env python3
"""
Generates the storefront HTML pages from shared partials so the header,
mobile menu, cart, checkout and concierge are IDENTICAL on every page.
Run:  python3 build_pages.py
"""
import os, datetime

YEAR = datetime.date.today().year
ROOT = os.path.dirname(os.path.abspath(__file__))

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com" />\n'
         '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n'
         '  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600'
         '&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />')

BAG = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
       'stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>'
       '<line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>')
CHAT = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
        'stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>')
HOME = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
        'stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
        '<polyline points="9 22 9 12 15 12 15 22"/></svg>')
COLL = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
        'stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/>'
        '<line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>')

# key -> (label, href).  Same links on desktop nav AND mobile menu.
NAV = [
    ('home',       'Maison',       'index.html#hero'),
    ('catalogue',  'Collections',  'catalogue.html'),
    ('size-guide', 'Size Guide',   'size-guide.html'),
    ('delivery',   'Delivery',     'delivery.html'),
]

def header(active, on_home):
    def href(key, h):
        # On the home page, in-page anchors are fine; elsewhere use full path
        return '#hero' if (key == 'home' and on_home) else h
    links = '\n        '.join(
        f'<a href="{href(k,h)}" class="nav-link{" nav-link--active" if k==active else ""}">{l}</a>'
        for k, l, h in NAV)
    return f'''<header class="site-header" id="siteHeader">
    <div class="header-inner">
      <button class="menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
        <span class="bar"></span><span class="bar"></span><span class="bar"></span>
      </button>
      <a href="index.html" class="logo" aria-label="Rotex Emporium home">
        <span class="logo-main">ROTEX</span>
        <span class="logo-sub">EMPORIUM</span>
      </a>
      <nav class="header-nav" aria-label="Primary">
        {links}
        <button class="nav-link nav-link-btn" id="headerSupportBtn" type="button">Help</button>
      </nav>
      <button class="header-cart-btn" id="headerCartBtn" aria-label="Open cart">
        {BAG}
        <span class="cart-badge" id="headerCartBadge" data-count="0">0</span>
      </button>
    </div>
  </header>'''

def mobile_menu(active, on_home):
    def href(key, h):
        return '#hero' if (key == 'home' and on_home) else h
    links = '\n        '.join(
        f'<a href="{href(k,h)}" class="mobile-menu-link{" mobile-menu-link--active" if k==active else ""}">{l}</a>'
        for k, l, h in NAV)
    return f'''<div class="mobile-menu-overlay" id="mobileMenuOverlay"></div>
  <aside class="mobile-menu" id="mobileMenu" aria-label="Site menu" aria-hidden="true">
    <div class="mobile-menu-header">
      <span class="logo-main">ROTEX</span>
      <button class="icon-btn" id="mobileMenuClose" aria-label="Close menu">✕</button>
    </div>
    <nav class="mobile-menu-nav" aria-label="Mobile">
      <p class="mobile-menu-group">Shop</p>
        {links}
      <p class="mobile-menu-group">Help</p>
      <button class="mobile-menu-link" id="mobileMenuReturnsBtn" type="button">Returns</button>
      <button class="mobile-menu-link" id="mobileMenuSupportBtn" type="button">Chat with the Concierge</button>
      <a class="mobile-menu-link" href="https://wa.me/254721696486?text=Hi%2C%20I%20need%20help%20with%20my%20Rotex%20order." target="_blank" rel="noopener noreferrer">WhatsApp us</a>
    </nav>
    <div class="mobile-menu-footer">Kimana Town, Kajiado South</div>
  </aside>'''

def footer(active):
    def cur(k): return ' class="nav-link--active"' if k == active else ''
    return f'''<footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="logo-main">ROTEX</span>
        <p class="footer-tagline">Ultra-Premium Fashion. Kimana Town, Kajiado South, Kenya.</p>
      </div>
      <div class="footer-links">
        <a href="index.html"{cur('home')}>Home</a>
        <a href="catalogue.html"{cur('catalogue')}>Shop All</a>
        <a href="delivery.html"{cur('delivery')}>Delivery Info</a>
        <a href="size-guide.html"{cur('size-guide')}>Size Guide</a>
        <button id="footerReturnsBtn" type="button">Returns</button>
        <button id="footerSupportBtn" type="button">Concierge</button>
        <a href="admin/admin.html" class="footer-admin-link">Staff Login</a>
      </div>
      <p class="footer-copy">© {YEAR} Rotex Emporium. All rights reserved.</p>
    </div>
  </footer>'''

def brand_strip():
    return '''<section class="brand-strip" aria-hidden="true">
    <p class="brand-quote">"Every piece is a<br /><em>considered choice.</em>"</p>
  </section>'''

SHARED_OVERLAYS = f'''<!-- ── SHARED: CART DRAWER ─────────────────────────────── -->
  <div class="cart-overlay" id="cartOverlay"></div>
  <aside class="cart-drawer" id="cartDrawer" role="dialog" aria-label="Shopping cart" aria-hidden="true">
    <div class="cart-drawer-header">
      <h2 class="cart-drawer-title">Your Cart</h2>
      <button class="icon-btn" id="cartCloseBtn" aria-label="Close cart">✕</button>
    </div>
    <div class="cart-body" id="cartBody">
      <div class="cart-empty" id="cartEmpty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <p class="cart-empty-text">Your cart is empty.</p>
        <p class="cart-empty-sub">Select a piece to begin.</p>
      </div>
      <ul class="cart-items-list" id="cartItemsList"></ul>
    </div>
    <div class="cart-footer" id="cartFooter">
      <div class="cart-totals">
        <span class="cart-total-label">Subtotal</span>
        <span class="cart-total-value" id="cartTotal">KES 0</span>
      </div>
      <button class="btn btn--primary btn--full" id="checkoutBtn">Checkout via WhatsApp</button>
    </div>
  </aside>

  <!-- ── SHARED: CHECKOUT ────────────────────────────────── -->
  <div class="checkout-overlay" id="checkoutOverlay" role="dialog" aria-label="Checkout" aria-hidden="true">
    <div class="checkout-modal">
      <div class="checkout-modal-header">
        <h2 class="checkout-modal-title">Complete Your Order</h2>
        <button class="icon-btn" id="checkoutCloseBtn" aria-label="Close checkout">✕</button>
      </div>
      <p class="checkout-modal-sub">Fill in your details. We'll send your order via WhatsApp.</p>
      <div class="checkout-order-summary" id="checkoutOrderSummary"></div>
      <div class="checkout-form">
        <div class="form-group">
          <label class="form-label" for="customerName">Full Name</label>
          <input class="form-input" type="text" id="customerName" placeholder="e.g. Amara Osei" autocomplete="name" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="customerLocation">Delivery Location</label>
          <input class="form-input" type="text" id="customerLocation" placeholder="e.g. Kimana Town, or your estate / town" autocomplete="street-address" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="customerPhone">Phone Number</label>
          <input class="form-input" type="tel" id="customerPhone" placeholder="e.g. 0712 345 678" autocomplete="tel" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="customerNotes">Notes <span class="form-optional">(optional)</span></label>
          <textarea class="form-input form-textarea" id="customerNotes" placeholder="Special requests..."></textarea>
        </div>
        <button class="btn btn--primary btn--full btn--whatsapp" id="sendWhatsAppBtn">Send Order on WhatsApp</button>
        <p class="checkout-disclaimer">You'll be redirected to WhatsApp to confirm. No payment is taken on this site.</p>
      </div>
    </div>
  </div>

  <!-- ── SHARED: CONCIERGE ───────────────────────────────── -->
  <div class="concierge-overlay" id="conciergeOverlay"></div>
  <div class="concierge-modal" id="conciergeModal" role="dialog" aria-label="Rotex Concierge" aria-hidden="true">
    <div class="concierge-header">
      <div class="concierge-avatar" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"/><path d="M12 14c-3.31 0-6 1.34-6 3v1h12v-1c0-1.66-2.69-3-6-3z"/></svg>
      </div>
      <div class="concierge-header-text">
        <p class="concierge-name">Rotex Concierge</p>
        <span class="concierge-status"><span class="status-dot"></span>Online now</span>
      </div>
      <button class="icon-btn" id="conciergeCloseBtn" aria-label="Close chat">✕</button>
    </div>
    <div class="concierge-body" id="conciergeBody" role="log" aria-live="polite"></div>
    <div class="concierge-input-row">
      <input class="concierge-input" type="text" id="conciergeInput" placeholder="Ask anything..." aria-label="Type your message" />
      <button class="concierge-send-btn" id="conciergeSendBtn" aria-label="Send">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
    <div class="concierge-handoff">
      <p class="handoff-text">Need a human?</p>
      <a href="https://wa.me/254721696486?text=Hi%2C%20I%20need%20help%20with%20my%20Rotex%20order." class="btn btn--ghost btn--sm" target="_blank" rel="noopener noreferrer">Hand off to Human</a>
    </div>
  </div>

  <!-- ── FABS ────────────────────────────────────────────── -->
  <div class="fab-group">
    <button class="fab fab--support" id="fabSupportBtn" aria-label="Open concierge chat">{CHAT}</button>
    <button class="fab fab--cart" id="fabCartBtn" aria-label="Open cart">
      {BAG}
      <span class="fab-badge" id="fabCartBadge" data-count="0">0</span>
    </button>
  </div>'''

def bottom_nav(active, on_home):
    def item(key, label, icon, href):
        cls = ' active' if key == active else ''
        return (f'<a href="{href}" class="bottom-nav-item{cls}" aria-label="{label}">'
                f'{icon}<span>{label}</span></a>')
    home_href = '#hero' if on_home else 'index.html'
    return f'''<nav class="bottom-nav" id="bottomNav" aria-label="Mobile navigation">
    {item('home','Home',HOME,home_href)}
    {item('catalogue','Collections',COLL,'catalogue.html')}
    <button class="bottom-nav-item" id="bottomNavCartBtn" aria-label="Cart">
      {BAG}
      <span class="bottom-nav-badge" id="bottomNavBadge" data-count="0">0</span>
      <span>Cart</span>
    </button>
    <button class="bottom-nav-item" id="bottomNavSupportBtn" aria-label="Concierge">
      {CHAT}
      <span>Concierge</span>
    </button>
  </nav>

  <div class="toast" id="toast" role="status" aria-live="polite" aria-atomic="true"></div>'''

SCRIPTS = '''<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  <script src="js/config.js"></script>
  <script src="js/faq.js"></script>
  <script src="js/script.js"></script>'''

def page(title, desc, active, body_main, body_class='', on_home=False, robots=''):
    bc = f' class="{body_class}"' if body_class else ''
    rb = f'\n  <meta name="robots" content="{robots}" />' if robots else ''
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="description" content="{desc}" />{rb}
  <meta name="theme-color" content="#0D0D0D" />
  <title>{title}</title>
  {FONTS}
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body{bc}>

  {header(active, on_home)}

  {mobile_menu(active, on_home)}

{body_main}

  {brand_strip()}

  {footer(active)}

  {SHARED_OVERLAYS}

  {bottom_nav(active, on_home)}

  {SCRIPTS}
</body>
</html>
'''

def write(name, content):
    path = os.path.join(ROOT, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('  wrote', name)

# ───────────────────────── PAGE BODIES ─────────────────────────
def cat_section(num, key, eyebrow, title, desc):
    arrow = lambda d, pts: (f'<button class="track-arrow track-arrow--{d}" data-track="track-{key}" aria-label="Scroll {"left" if d=="prev" else "right"}">'
                            f'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="{pts}"/></svg></button>')
    return f'''    <section class="pillar-section" id="section-{key}" aria-labelledby="title-{key}">
      <div class="pillar-header">
        <div class="pillar-header-left">
          <span class="pillar-num" aria-hidden="true">{num}</span>
          <div>
            <p class="eyebrow crimson">{eyebrow}</p>
            <h2 class="section-title" id="title-{key}">{title}</h2>
          </div>
        </div>
        <p class="pillar-desc">{desc}</p>
      </div>
      <div class="product-track-wrap">
        <div class="product-track" id="track-{key}" role="list" aria-label="{key.capitalize()} products"></div>
        {arrow('prev','15 18 9 12 15 6')}
        {arrow('next','9 18 15 12 9 6')}
      </div>
    </section>
'''

INDEX_MAIN = '''  <section class="hero" id="hero" aria-label="Rotex Emporium">
    <div class="hero-bg" aria-hidden="true">
      <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&q=85&auto=format&fit=crop" alt="" loading="eager" fetchpriority="high" />
      <div class="hero-overlay"></div>
    </div>

    <div class="hero-inner">
      <!-- BRAND FIRST: the wordmark sits at the top of the hero, where the eye lands -->
      <div class="hero-brand">
        <p class="hero-est"><span class="hero-est-rule" aria-hidden="true"></span>Kimana Town &middot; Kajiado South<span class="hero-est-rule" aria-hidden="true"></span></p>
        <h1 class="hero-wordmark" aria-label="Rotex Emporium">
          <span class="hero-wordmark-main">ROTEX</span>
          <span class="hero-wordmark-sub">EMPORIUM</span>
        </h1>
        <p class="hero-tagline">Dressed for <em>distinction.</em></p>
      </div>

      <div class="hero-body">
        <p class="hero-sub">Curated luxury fashion, brought to Kimana and delivered across Kenya. Sharp tailoring, statement pieces, premium essentials and the finishing touches that complete a look.</p>
        <div class="hero-ctas">
          <a href="catalogue.html" class="btn btn--primary">Explore the Collection</a>
          <a href="#visit"         class="btn btn--ghost">Visit the Shop</a>
        </div>
      </div>

      <!-- SHOP FACTS: who / where / when / how, visible without scrolling -->
      <ul class="hero-facts" aria-label="Shop information">
        <li class="hero-fact">
          <span class="hero-fact-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
          <span class="hero-fact-text"><strong>Find us</strong><span data-shop="town-area">Kimana Town, Kajiado South</span></span>
        </li>
        <li class="hero-fact">
          <span class="hero-fact-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          <span class="hero-fact-text"><strong>Open</strong><span data-shop="hours">Mon &ndash; Sat, 8am &ndash; 7pm</span></span>
        </li>
        <li class="hero-fact">
          <span class="hero-fact-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h13v13H3z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="17.5" cy="18.5" r="1.5"/></svg></span>
          <span class="hero-fact-text"><strong>Delivery</strong><span>Kimana &amp; all of Kenya</span></span>
        </li>
        <li class="hero-fact">
          <span class="hero-fact-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></span>
          <span class="hero-fact-text"><strong>Pay</strong><span>M-Pesa &amp; on delivery</span></span>
        </li>
      </ul>
    </div>

    <div class="hero-scroll-hint" aria-hidden="true">
      <span>Scroll</span>
      <div class="scroll-line"></div>
    </div>
  </section>

  <div class="marquee-strip" aria-hidden="true">
    <div class="marquee-track">
      <span>FREE DELIVERY IN NAIROBI</span><span class="dot">◆</span>
      <span>PAY ON DELIVERY AVAILABLE</span><span class="dot">◆</span>
      <span>AUTHENTIC LUXURY PIECES</span><span class="dot">◆</span>
      <span>MPESA ACCEPTED</span><span class="dot">◆</span>
      <span>NEW SEASON ARRIVALS</span><span class="dot">◆</span>
      <span>FREE DELIVERY IN NAIROBI</span><span class="dot">◆</span>
      <span>PAY ON DELIVERY AVAILABLE</span><span class="dot">◆</span>
      <span>AUTHENTIC LUXURY PIECES</span><span class="dot">◆</span>
      <span>MPESA ACCEPTED</span><span class="dot">◆</span>
      <span>NEW SEASON ARRIVALS</span><span class="dot">◆</span>
    </div>
  </div>

  <section class="categories-section" id="categories" aria-label="Shop by Category">
    <div class="categories-header">
      <p class="eyebrow crimson">The Four Pillars</p>
      <h2 class="section-title">Shop by Collection</h2>
    </div>
    <div class="categories-grid">

      <a href="catalogue.html?category=executive" class="category-card" aria-label="Executive and Smart-Casual">
        <div class="card-image">
          <img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&auto=format&fit=crop" alt="Executive and Smart-Casual" loading="lazy" />
          <div class="card-overlay"></div>
        </div>
        <div class="card-content">
          <p class="card-num">01</p>
          <h3 class="card-title">Executive &amp; Smart-Casual</h3>
          <p class="card-sub">Sharp blazers, tailored trousers, versatile button-downs</p>
          <span class="card-cta">Browse →</span>
        </div>
      </a>

      <a href="catalogue.html?category=statement" class="category-card" aria-label="Signature Statement Pieces">
        <div class="card-image">
          <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80&auto=format&fit=crop" alt="Statement Pieces" loading="lazy" />
          <div class="card-overlay"></div>
        </div>
        <div class="card-content">
          <p class="card-num">02</p>
          <h3 class="card-title">Signature Statement Pieces</h3>
          <p class="card-sub">Distinctive outerwear, unique jackets, high-fashion dresses</p>
          <span class="card-cta">Browse →</span>
        </div>
      </a>

      <a href="catalogue.html?category=essentials" class="category-card" aria-label="Premium Essentials">
        <div class="card-image">
          <img src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80&auto=format&fit=crop" alt="Premium Essentials" loading="lazy" />
          <div class="card-overlay"></div>
        </div>
        <div class="card-content">
          <p class="card-num">03</p>
          <h3 class="card-title">Premium Essentials</h3>
          <p class="card-sub">Heavy-ounce tees, immaculate denim, luxury matching sets</p>
          <span class="card-cta">Browse →</span>
        </div>
      </a>

      <a href="catalogue.html?category=finishing" class="category-card" aria-label="Finishing Touches">
        <div class="card-image">
          <img src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80&auto=format&fit=crop" alt="Finishing Touches" loading="lazy" />
          <div class="card-overlay"></div>
        </div>
        <div class="card-content">
          <p class="card-num">04</p>
          <h3 class="card-title">Finishing Touches</h3>
          <p class="card-sub">Curated footwear, premium belts, artisanal bags</p>
          <span class="card-cta">Browse →</span>
        </div>
      </a>

    </div>
  </section>

  <!-- ── VISIT THE SHOP ─────────────────────────────────────── -->
  <section class="visit-section" id="visit" aria-labelledby="visit-title">
    <div class="visit-inner">
      <div class="visit-head">
        <p class="eyebrow crimson">The Shop</p>
        <h2 class="section-title" id="visit-title">Visit Rotex</h2>
        <p class="visit-lede">Try pieces on, collect your order, or just come and see the collection in person. We're in the heart of Kimana Town.</p>
        <div class="visit-ctas">
          <a class="btn btn--primary" id="visitDirections" href="https://www.google.com/maps/search/?api=1&amp;query=Kimana%20Town%2C%20Kajiado%20County%2C%20Kenya" target="_blank" rel="noopener noreferrer">Get directions</a>
          <a class="btn btn--whatsapp" id="visitWhatsApp" href="https://wa.me/254721696486?text=Hi%20Rotex%2C%20I%27d%20like%20to%20visit%20the%20shop." target="_blank" rel="noopener noreferrer">Message us</a>
        </div>
      </div>

      <dl class="visit-grid">
        <div class="visit-card">
          <dt><span class="visit-card-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>Address</dt>
          <dd><span data-shop="town">Kimana Town</span><br><span data-shop="area">Kajiado South, Kajiado County</span><br><span data-shop="landmark"></span></dd>
        </div>
        <div class="visit-card">
          <dt><span class="visit-card-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>Opening hours</dt>
          <dd><span data-shop="hours">Mon &ndash; Sat, 8:00 am &ndash; 7:00 pm</span><br><span data-shop="hoursNote"></span></dd>
        </div>
        <div class="visit-card">
          <dt><span class="visit-card-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>Call or WhatsApp</dt>
          <dd><a id="visitPhone" href="tel:+254721696486"><span data-shop="phone">+254 721 696 486</span></a><br><span class="visit-muted">Replies fastest on WhatsApp</span></dd>
        </div>
        <div class="visit-card">
          <dt><span class="visit-card-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h13v13H3z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="17.5" cy="18.5" r="1.5"/></svg></span>Delivery</dt>
          <dd>Free within <span data-shop="deliveryFreeArea">Kimana Town</span>.<br>Rest of Kenya by courier &mdash; <a href="delivery.html">see delivery info</a>.</dd>
        </div>
      </dl>

      <ul class="visit-promise" aria-label="Our promise">
        <li><strong>Curated, not crowded.</strong> Every piece is chosen and checked before it's listed.</li>
        <li><strong>Easy returns.</strong> <span data-shop="returnDays">7</span> days, unworn with tags. Exchanges are free.</li>
        <li><strong>Talk to a person.</strong> Sizing, styling, availability &mdash; ask on WhatsApp or the Concierge.</li>
      </ul>
    </div>
  </section>'''

CATALOGUE_MAIN = '''  <section class="cat-hero" aria-label="Catalogue Introduction">
    <div class="cat-hero-bg" aria-hidden="true">
      <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80&auto=format&fit=crop" alt="" loading="eager" fetchpriority="high" />
      <div class="cat-hero-overlay"></div>
    </div>
    <div class="cat-hero-content">
      <p class="eyebrow gold">The Current Edit</p>
      <h1 class="cat-hero-title">
        <span class="cat-hero-title-main">THE</span>
        <span class="cat-hero-title-sub">Collection</span>
      </h1>
      <p class="cat-hero-desc">Four curated pillars of luxury, from our shop in Kimana to your door. Scroll to explore.</p>
    </div>
    <div class="cat-hero-stats" aria-label="Collection statistics">
      <div class="cat-stat"><span class="cat-stat-num" id="statPieces">—</span><span class="cat-stat-label">Pieces</span></div>
      <div class="cat-stat-divider" aria-hidden="true"></div>
      <div class="cat-stat"><span class="cat-stat-num">4</span><span class="cat-stat-label">Pillars</span></div>
      <div class="cat-stat-divider" aria-hidden="true"></div>
      <div class="cat-stat"><span class="cat-stat-num">100%</span><span class="cat-stat-label">Authentic</span></div>
    </div>
  </section>

  <nav class="cat-nav" id="categoryNavScroll" aria-label="Jump to collection">
    <div class="cat-nav-track">
      <button class="cat-chip cat-chip--active" data-target="section-executive" aria-pressed="true"><span class="chip-dot" aria-hidden="true"></span>Executive</button>
      <button class="cat-chip" data-target="section-statement" aria-pressed="false"><span class="chip-dot" aria-hidden="true"></span>Statement</button>
      <button class="cat-chip" data-target="section-essentials" aria-pressed="false"><span class="chip-dot" aria-hidden="true"></span>Essentials</button>
      <button class="cat-chip" data-target="section-finishing" aria-pressed="false"><span class="chip-dot" aria-hidden="true"></span>Finishing</button>
    </div>
  </nav>

  <main class="catalogue-main" aria-label="Product Catalogue">
''' + cat_section('01','executive','Executive &amp; Smart-Casual','Tailored Precision','Sharp blazers, tailored trousers, and versatile button-downs that move from boardroom to evening with ease.') \
    + cat_section('02','statement','Signature Statement Pieces','The Hero Tier','Distinctive outerwear, structured jackets, and high-fashion dresses designed to command a room.') \
    + cat_section('03','essentials','Premium Essentials','The Foundation',"Heavy-ounce cotton tees, raw selvedge denim, and luxury matching sets — the considered wardrobe's core.") \
    + cat_section('04','finishing','Finishing Touches','Complete the Look','Burnished leather loafers, full-grain belts, and artisanal totes — the final 20% that makes the outfit unforgettable.') \
    + '  </main>'

def card_svg(path):
    return (f'<div class="info-card-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" '
            f'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">{path}</svg></div>')

DELIVERY_MAIN = f'''  <section class="info-hero">
    <div class="info-hero-content">
      <p class="eyebrow gold">Getting Your Order to You</p>
      <h1 class="info-hero-title">Delivery Info</h1>
      <p class="info-hero-desc">Shipped from our shop in Kimana Town, Kajiado South &mdash; to your door anywhere in Kenya, confirmed and tracked on WhatsApp.</p>
    </div>
  </section>

  <main class="info-main">
    <div class="info-grid">
      <article class="info-card">
        {card_svg('<path d="M3 3h13v13H3z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="17.5" cy="18.5" r="1.5"/>')}
        <h3 class="info-card-title">Kimana &amp; nearby</h3>
        <p class="info-card-body">Kimana, Loitokitok, Emali, Amboseli and surrounding areas: same-day or next-day delivery. Free within Kimana Town.</p>
      </article>
      <article class="info-card">
        {card_svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>')}
        <h3 class="info-card-title">Nairobi</h3>
        <p class="info-card-body">1&ndash;2 business days by courier. Tracking details are sent on WhatsApp when your order is dispatched.</p>
      </article>
      <article class="info-card">
        {card_svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>')}
        <h3 class="info-card-title">Rest of Kenya</h3>
        <p class="info-card-body">2&ndash;4 business days via courier partner, to any town with courier service.</p>
      </article>
      <article class="info-card">
        {card_svg('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>')}
        <h3 class="info-card-title">Delivery cost</h3>
        <p class="info-card-body">Free within Kimana Town. Elsewhere the fee depends on your location &mdash; we quote you on WhatsApp <em>before</em> you pay, so there are no surprises.</p>
      </article>
      <article class="info-card">
        {card_svg('<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>')}
        <h3 class="info-card-title">Payment</h3>
        <p class="info-card-body">M-Pesa, or pay on delivery within Kimana and nearby areas. Nothing is charged on this website.</p>
      </article>
      <article class="info-card">
        {card_svg('<path d="M20 6 9 17l-5-5"/>')}
        <h3 class="info-card-title">Order tracking</h3>
        <p class="info-card-body">Every order is confirmed and tracked on WhatsApp &mdash; the same chat you check out with is where you get updates.</p>
      </article>
    </div>

    <div class="info-note">
      <p>Prefer to collect? Come to the shop in Kimana Town during opening hours &mdash; tell us at checkout and we'll have it ready. Questions about a delivery? Ask the concierge or message us directly.</p>
      <div class="info-note-ctas">
        <button class="btn btn--ghost" id="deliveryConciergeBtn">Ask the Concierge</button>
        <a href="https://wa.me/254721696486?text=Hi%2C%20I%20have%20a%20question%20about%20delivery." class="btn btn--whatsapp" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
      </div>
    </div>
  </main>'''

def size_table(title, heads, rows):
    th = ''.join(f'<th>{h}</th>' for h in heads)
    tr = '\n          '.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
    return f'''    <div class="size-table-wrap">
      <h2 class="size-table-title">{title}</h2>
      <table class="size-table">
        <thead><tr>{th}</tr></thead>
        <tbody>
          {tr}
        </tbody>
      </table>
    </div>
'''

SIZE_MAIN = '''  <section class="info-hero">
    <div class="info-hero-content">
      <p class="eyebrow gold">Fit With Confidence</p>
      <h1 class="info-hero-title">Size Guide</h1>
      <p class="info-hero-desc">Every piece is cut true-to-size. Use the charts below, or size up for a relaxed fit.</p>
    </div>
  </section>

  <main class="info-main">
''' + size_table('Clothing — Tops, Blazers, Dresses', ['Size','Chest / Bust (cm)','Waist (cm)','Hip (cm)'],
    [['XS','82–86','64–68','88–92'],['S','87–91','69–73','93–97'],['M','92–97','74–79','98–103'],
     ['L','98–104','80–86','104–110'],['XL','105–112','87–94','111–118'],['XXL','113–120','95–102','119–126']]) \
  + size_table('Trousers &amp; Denim', ['Waist (in)','Waist (cm)','Inseam (cm)'],
    [['28','71','78'],['30','76','79'],['32','81','80'],['34','86','81'],['36','91','82']]) \
  + size_table('Footwear', ['EU','UK','US','Foot Length (cm)'],
    [['39','6','7','24.5'],['40','6.5','7.5','25.1'],['41','7.5','8.5','25.8'],
     ['42','8','9','26.4'],['43','9','10','27.1'],['44','9.5','10.5','27.8']]) \
  + '''
    <div class="info-note">
      <p>Between sizes, or unsure how a specific piece fits? Ask the concierge for guidance before you order.</p>
      <div class="info-note-ctas">
        <button class="btn btn--ghost" id="sizeConciergeBtn">Ask the Concierge</button>
        <a href="catalogue.html" class="btn btn--primary">Browse the Collection</a>
      </div>
    </div>
  </main>'''

# 404 is special: it can be served from ANY depth, so it uses root-relative-safe absolute-ish paths via <base>.
NOTFOUND = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="robots" content="noindex" />
  <meta name="theme-color" content="#0D0D0D" />
  <title>Page Not Found — Rotex Emporium</title>
  {FONTS}
  <!-- GitHub Pages serves this file for ANY missing URL at ANY depth, so relative
       paths would break. Set REPO_BASE to your site's root (project sites: '/Rotex-Emporium-/'; user/custom domain: '/'). -->
  <script>
    (function () {{
      var REPO_BASE = '/Rotex-Emporium-/';
      var base = document.createElement('base');
      base.href = location.pathname.indexOf(REPO_BASE) === 0 ? REPO_BASE : '/';
      document.head.insertBefore(base, document.head.firstChild);
    }})();
  </script>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <header class="site-header scrolled" id="siteHeader">
    <div class="header-inner">
      <a href="index.html" class="logo" aria-label="Rotex Emporium home">
        <span class="logo-main">ROTEX</span>
        <span class="logo-sub">EMPORIUM</span>
      </a>
      <nav class="header-nav" aria-label="Primary">
        <a href="index.html#hero" class="nav-link">Maison</a>
        <a href="catalogue.html" class="nav-link">Collections</a>
        <a href="size-guide.html" class="nav-link">Size Guide</a>
        <a href="delivery.html" class="nav-link">Delivery</a>
      </nav>
      <a href="catalogue.html" class="btn btn--ghost btn--sm">Shop</a>
    </div>
  </header>

  <main class="notfound-main">
    <p class="eyebrow crimson">Error 404</p>
    <h1 class="notfound-title">Page Not Found</h1>
    <p class="notfound-desc">The page you're looking for doesn't exist, may have moved, or the link is outdated.</p>
    <div class="notfound-ctas">
      <a href="index.html" class="btn btn--primary">Back to Home</a>
      <a href="catalogue.html" class="btn btn--ghost">Browse the Collection</a>
    </div>
  </main>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="logo-main">ROTEX</span>
        <p class="footer-tagline">Ultra-Premium Fashion. Kimana Town, Kajiado South, Kenya.</p>
      </div>
      <div class="footer-links">
        <a href="catalogue.html">Shop All</a>
        <a href="delivery.html">Delivery Info</a>
        <a href="size-guide.html">Size Guide</a>
        <a href="index.html">Home</a>
      </div>
      <p class="footer-copy">© {YEAR} Rotex Emporium. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>
'''

# ───────────────────────── ADMIN PAGE ─────────────────────────
ADMIN = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="theme-color" content="#0D0D0D" />
  <title>Admin — Rotex Emporium</title>
  ''' + FONTS + '''
  <link rel="stylesheet" href="../css/styles.css" />
  <link rel="stylesheet" href="admin.css" />
</head>
<body class="admin-body">

  <!-- ── LOGIN SCREEN ───────────────────────────────────────── -->
  <div class="admin-login-screen" id="loginScreen">
    <form class="admin-login-card" id="loginForm">
      <div class="admin-login-logo">
        <span class="logo-main">ROTEX</span>
        <span class="logo-sub">Admin</span>
      </div>
      <div class="form-group">
        <label class="form-label" for="loginEmail">Email</label>
        <input class="form-input" type="email" id="loginEmail" autocomplete="username" required />
      </div>
      <div class="form-group">
        <label class="form-label" for="loginPassword">Password</label>
        <input class="form-input" type="password" id="loginPassword" autocomplete="current-password" required />
      </div>
      <button class="btn btn--primary btn--full" type="submit" id="loginBtn">Sign In</button>
      <p class="admin-login-error" id="loginError" role="alert"></p>
      <a href="../index.html" class="admin-login-back">← Back to Storefront</a>
    </form>
  </div>

  <!-- ── ADMIN APP (hidden until authenticated) ─────────────── -->
  <div class="admin-app" id="adminApp" hidden>

    <header class="admin-header">
      <div class="admin-header-inner">
        <a href="../index.html" class="logo" aria-label="Rotex Emporium storefront">
          <span class="logo-main">ROTEX</span>
          <span class="logo-sub">Admin</span>
        </a>
        <nav class="admin-tabs" aria-label="Admin sections">
          <button class="admin-tab admin-tab--active" data-tab="products">Products</button>
          <button class="admin-tab" data-tab="orders">Orders</button>
        </nav>
        <div class="admin-header-actions">
          <a href="../index.html" class="btn btn--ghost btn--sm">View Storefront</a>
          <button class="btn btn--ghost btn--sm" id="logoutBtn">Sign Out</button>
        </div>
      </div>
    </header>

    <main class="admin-main">

      <!-- ── PRODUCTS TAB ────────────────────────────────────── -->
      <section class="admin-panel admin-panel--active" id="panel-products" aria-label="Products">
        <div class="admin-panel-header">
          <h1 class="admin-panel-title">Products</h1>
          <button class="btn btn--primary btn--sm" id="newProductBtn">+ Add Product</button>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table" id="productsTable">
            <thead>
              <tr>
                <th>Image</th><th>Name</th><th>Category</th><th>Price</th>
                <th>Sizes</th><th>Tag</th><th>Active</th><th></th>
              </tr>
            </thead>
            <tbody id="productsTableBody">
              <tr><td colspan="8" class="admin-table-empty">Loading products…</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── ORDERS TAB ──────────────────────────────────────── -->
      <section class="admin-panel" id="panel-orders" aria-label="Orders">
        <div class="admin-panel-header">
          <h1 class="admin-panel-title">Orders</h1>
          <button class="btn btn--ghost btn--sm" id="refreshOrdersBtn">Refresh</button>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table" id="ordersTable">
            <thead>
              <tr>
                <th>Date</th><th>Customer</th><th>Phone</th><th>Location</th>
                <th>Items</th><th>Total</th><th>Status</th>
              </tr>
            </thead>
            <tbody id="ordersTableBody">
              <tr><td colspan="7" class="admin-table-empty">Loading orders…</td></tr>
            </tbody>
          </table>
        </div>
      </section>

    </main>
  </div>

  <!-- ── PRODUCT EDIT MODAL ─────────────────────────────────── -->
  <div class="checkout-overlay" id="productModalOverlay" role="dialog" aria-label="Edit product" aria-hidden="true">
    <div class="checkout-modal">
      <div class="checkout-modal-header">
        <h2 class="checkout-modal-title" id="productModalTitle">Add Product</h2>
        <button class="icon-btn" id="productModalCloseBtn" aria-label="Close">✕</button>
      </div>
      <form class="checkout-form" id="productForm">
        <input type="hidden" id="productId" />
        <div class="form-group">
          <label class="form-label" for="productName">Name</label>
          <input class="form-input" type="text" id="productName" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="productCategory">Category</label>
          <select class="form-input" id="productCategory" required>
            <option value="executive">Executive &amp; Smart-Casual</option>
            <option value="statement">Statement Pieces</option>
            <option value="essentials">Premium Essentials</option>
            <option value="finishing">Finishing Touches</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="productPrice">Price (KES)</label>
          <input class="form-input" type="number" id="productPrice" min="0" step="1" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="productSizes">Sizes <span class="form-optional">(comma-separated, e.g. S, M, L, XL)</span></label>
          <input class="form-input" type="text" id="productSizes" placeholder="S, M, L, XL" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="productTag">Tag <span class="form-optional">(optional)</span></label>
          <select class="form-input" id="productTag">
            <option value="">None</option>
            <option value="New">New</option>
            <option value="Exclusive">Exclusive</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="productImage">Image URL</label>
          <input class="form-input" type="url" id="productImage" placeholder="https://..." required />
        </div>
        <div class="form-group form-group--row">
          <label class="admin-checkbox-label">
            <input type="checkbox" id="productActive" checked />
            <span>Active (visible on storefront)</span>
          </label>
        </div>
        <button class="btn btn--primary btn--full" type="submit" id="productSaveBtn">Save Product</button>
        <p class="admin-form-error" id="productFormError" role="alert"></p>
      </form>
    </div>
  </div>

  <div class="toast" id="toast" role="status" aria-live="polite" aria-atomic="true"></div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  <script src="../js/config.js"></script>
  <script src="admin.js"></script>
</body>
</html>
'''

if __name__ == '__main__':
    print('Building pages …')
    write('index.html',      page('Rotex Emporium — Luxury Fashion, Kimana Town', "Rotex Emporium — Ultra-Premium Luxury Fashion. Kimana Town, Kajiado South. Delivered across Kenya.", 'home', INDEX_MAIN, body_class='page--home', on_home=True))
    write('catalogue.html',  page('Catalogue — Rotex Emporium', 'Rotex Emporium — Browse our four luxury pillars. Shop Executive, Statement, Essentials, and Finishing Touches.', 'catalogue', CATALOGUE_MAIN, body_class='page--catalogue'))
    write('delivery.html',   page('Delivery Info — Rotex Emporium', 'Rotex Emporium — Delivery areas, timelines, and costs across Kenya.', 'delivery', DELIVERY_MAIN))
    write('size-guide.html', page('Size Guide — Rotex Emporium', 'Rotex Emporium — Size guide for clothing, denim, and footwear.', 'size-guide', SIZE_MAIN))
    write('404.html',        NOTFOUND)
    write('admin/admin.html', ADMIN)
    print('Done.')
