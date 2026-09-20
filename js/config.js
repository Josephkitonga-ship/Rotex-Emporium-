/**
 * ═══════════════════════════════════════════════════════════
 * ROTEX EMPORIUM — js/config.js
 * Single source of truth for backend + business settings.
 * Loaded by BOTH the storefront (script.js) and admin (admin.js).
 *
 * EDIT THE `SHOP` BLOCK BELOW to change anything the site says about
 * the business. The homepage, delivery page and the Concierge all
 * read from it, so they can never disagree with each other.
 *
 * NOTE: The Supabase "publishable" key is designed to be public.
 * Real protection comes from Row Level Security policies
 * (see /docs/supabase-rls.sql).
 * ═══════════════════════════════════════════════════════════
 */
window.ROTEX_CONFIG = Object.freeze({
  SUPABASE_URL:      'https://ftrqsvdfjxhjkwzxuntg.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_BvwznwMV1Y68_ZAekTmdrQ_OIRKWM1n',
  WA_NUMBER:         '254721696486',
  CART_KEY:          'rotex_cart',
  CATEGORIES: Object.freeze({
    executive:  'Executive',
    statement:  'Statement',
    essentials: 'Essentials',
    finishing:  'Finishing',
  }),

  /* ── SHOP DETAILS ─────────────────────────────────────────
     Lines marked  ◄ CONFIRM  are my best guess from what you told me
     (and general Kenyan retail norms). Check each one is true for
     your shop before going live — the Concierge repeats them to
     customers as fact. */
  SHOP: Object.freeze({
    name:        'Rotex Emporium',
    town:        'Kimana Town',
    area:        'Kajiado South, Kajiado County',
    country:     'Kenya',
    // Street-level directions help walk-in customers find you. Add a landmark.
    landmark:    '',                                   // ◄ CONFIRM e.g. "Opposite Kimana Market, next to the petrol station"
    mapsQuery:   'Kimana Town, Kajiado County, Kenya', // used for the "Get directions" link
    phone:       '+254 721 696 486',                   // ◄ CONFIRM (matches WA_NUMBER)
    hours:       'Mon – Sat, 8:00 am – 7:00 pm',       // ◄ CONFIRM
    hoursNote:   'Sundays by appointment on WhatsApp.',// ◄ CONFIRM
    instagram:   '@rotexemporium',                     // ◄ CONFIRM (was in the old FAQ)

    // Delivery
    deliveryFreeArea:   'Kimana Town',                 // ◄ CONFIRM: your original site said "free in Nairobi"
    deliveryLocal:      'Kimana, Loitokitok, Emali, Amboseli and nearby areas: same or next day.', // ◄ CONFIRM
    deliveryNairobi:    '1–2 business days',           // ◄ CONFIRM — Nairobi is ~4-5 hrs by road from Kimana
    deliveryRest:       '2–4 business days via courier',
    deliveryFeeNote:    'Delivery fees depend on your location and are confirmed on WhatsApp before you pay.',

    // Returns
    returnDays:  7,                                    // ◄ CONFIRM
    // Payment
    payMpesa:    true,
    payCOD:      'Pay on delivery is available within Kimana and nearby areas.', // ◄ CONFIRM
    payBank:     false,                                // ◄ CONFIRM: set true only if you really take bank transfers
  }),
});
