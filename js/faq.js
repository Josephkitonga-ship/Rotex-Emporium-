/**
 * ═══════════════════════════════════════════════════════════
 * ROTEX EMPORIUM — js/faq.js
 * Concierge brain. Pure functions, no DOM — so it can be tested alone.
 *
 * How it works
 *   1. The customer's message is normalised (lowercase, punctuation stripped,
 *      common Swahili/Sheng and typo variants mapped to plain English).
 *   2. Every topic is SCORED: each keyword hit adds points, phrases score higher
 *      than single words, and word-boundary matching stops "hi" matching "shipping".
 *   3. The best topic wins if it clears a confidence threshold; otherwise we
 *      offer the closest topics as tap-to-ask suggestions and a WhatsApp handoff
 *      instead of guessing.
 *
 * All facts come from ROTEX_CONFIG.SHOP — edit them in js/config.js.
 * ═══════════════════════════════════════════════════════════
 */
(function (root) {
  'use strict';

  const CFG  = root.ROTEX_CONFIG || {};
  const S    = CFG.SHOP || {};
  const WA   = CFG.WA_NUMBER || '';

  const waLink = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;

  /* Words customers actually type → the plain words the topics use.
     Includes common Kenyan English / Swahili so "bei", "pesa", "kuja" work. */
  const SYNONYMS = {
    'wat':'what','wht':'what','wen':'when','hw':'how','abt':'about','pls':'please','plz':'please','u':'you','ur':'your',
    'deliverry':'delivery','delivary':'delivery','devlivery':'delivery','delievery':'delivery','shiping':'shipping',
    'refun':'refund','retun':'return','returns':'return','exhange':'exchange','sizes':'size','sizing':'size',
    'mpesa':'mpesa','m-pesa':'mpesa','lipa':'pay','pesa':'pay','bei':'price','gharama':'price','ngapi':'price',
    'wapi':'where','uko':'where','mko':'where','nipe':'give','nataka':'want','nunua':'buy','leta':'deliver',
    'salio':'balance','habari':'hello','mambo':'hello','sasa':'hello','jambo':'hello','shukran':'thanks','asante':'thanks',
    'saa':'hours','fungua':'open','funga':'close','nguo':'clothes','viatu':'shoes','mkanda':'belt','shati':'shirt','suruali':'trousers',
    'kimana':'kimana','loitokitok':'loitokitok','oloitokitok':'loitokitok','kitengela':'kitengela',
  };

  const normalise = (raw) => {
    const cleaned = String(raw || '')
      .toLowerCase()
      .replace(/[’']/g, '')                       // don't → dont
      .replace(/[^a-z0-9\s\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.split(' ').map(w => SYNONYMS[w] || w).join(' ');
  };

  /* A keyword matches on a word boundary (so "hi" ≠ "shipping").
     Multi-word phrases match as a substring. A trailing * means "starts with". */
  const hit = (text, kw) => {
    if (kw.includes(' ')) return text.includes(kw);
    if (kw.endsWith('*')) return new RegExp(`\\b${kw.slice(0, -1)}`).test(text);
    // allow simple plurals: card→cards, discount→discounts, box→boxes
    return new RegExp(`\\b${kw}(?:s|es)?\\b`).test(text);
  };

  /* ── ANSWER HELPERS (built from config, so nothing is hardcoded twice) ── */
  const money = () => S.deliveryFeeNote || 'Delivery fees depend on your location and are confirmed on WhatsApp before you pay.';
  const mapsUrl = () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(S.mapsQuery || (S.town + ', ' + S.area))}`;
  const shopLine = () => `${S.town}, ${S.area}`;

  const payMethods = () => {
    const m = [];
    if (S.payMpesa) m.push('M-Pesa');
    if (S.payCOD)   m.push('pay on delivery (local)');
    if (S.payBank)  m.push('bank transfer');
    return m.length ? m.join(', ') : 'M-Pesa';
  };

  /* ── TOPICS ──────────────────────────────────────────────
     kw   : keywords/phrases that vote for this topic
     w    : weight (default 1). Phrases get +1 automatically.
     a    : answer (string or function → string)
     next : follow-up chip labels that ARE other topic ids' `ask` text
     ask  : the canonical question for the chip button                   */
  const TOPICS = [
    {
      id: 'greeting', w: 1.0,
      kw: ['hello','hi','hey','hallo','good morning','good afternoon','good evening','hola','start','help','menu','anyone there','are you there'],
      ask: 'What can you help with?',
      a: () => `Welcome to ${S.name}! 👋 I can help with delivery, returns, sizing, payment, our shop in ${S.town}, and more. Tap a topic below or just type your question.`,
      next: ['delivery','returns','sizing','payment','location'],
    },
    {
      id: 'delivery', w: 1.3,
      kw: ['delivery','deliver','shipping','ship','courier','dispatch','arrive','arrival','how long','how many days will','how many days for delivery','when will my','when will it','when will i','when will the order','receive','send to','do you deliver','do you ship','nationwide','countrywide','upcountry','rider','send it','how soon','same day','next day','tracking','track','my order','where is my'],
      ask: 'How does delivery work?',
      a: () => [
        `🚚 **Delivery**`,
        `• ${S.deliveryLocal}`,
        `• Nairobi: ${S.deliveryNairobi}.`,
        `• Rest of Kenya: ${S.deliveryRest}. Tracking details are sent when your order is dispatched.`,
        `${money()}`,
        `Every order is confirmed and tracked on WhatsApp.`,
      ].join('\n'),
      next: ['deliveryfee','payment','location'],
    },
    {
      id: 'deliveryfee', w: 1.4,
      kw: ['delivery fee','delivery cost','delivery charge','shipping fee','shipping cost','shipping charge','how much is delivery','how much for delivery','free delivery','delivery price','is delivery free','delivery charges','transport','fare','cost to deliver','cost of delivery'],
      ask: 'How much is delivery?',
      a: () => [
        `💰 **Delivery fees**`,
        `• Free delivery within ${S.deliveryFreeArea}.`,
        `• Elsewhere, the fee depends on your location. ${money()}`,
        `Tell us where you are on WhatsApp and we'll quote you straight away.`,
      ].join('\n'),
      next: ['delivery','payment'],
    },
    {
      id: 'returns', w: 1.3,
      kw: ['return','return policy','days to return','how many days to return','how many days do i have','return period','refund policy','refund','exchange','swap','send back','money back','damaged','faulty','defect','defective','wrong item','wrong size','doesnt fit','does not fit','too small','too big','not happy','dont like','change it','replace','replacement','warranty','cancel','cancel order','cancel my order','cancel an order','cancellation','want to cancel','wrong colour','wrong color','different item','not as described','torn','stain'],
      ask: 'What is your return policy?',
      a: () => [
        `🔄 **Returns & exchanges**`,
        `• You have ${S.returnDays} days from delivery to return an item.`,
        `• It must be unworn, unwashed and have its tags attached.`,
        `• Wrong size? Exchanges for another size are free (subject to stock).`,
        `• Item damaged or not what you ordered? Message us on WhatsApp with a photo and we'll make it right.`,
        `To start a return, tap “Hand off to Human” below with your order details.`,
      ].join('\n'),
      next: ['sizing','contact'],
    },
    {
      id: 'sizing', w: 1.3,
      kw: ['size','fit','measure','measurement','measurements','chest','waist','hip','hips','inseam','small','medium','large','xl','xxl','xs','true to size','runs small','runs large','what size','which size','size chart','size guide','sizing','shoe size','eu 4','uk size','us size','foot length','tailored','slim fit','relaxed fit','length','height','tall','plus size','big size'],
      ask: 'How do I pick my size?',
      a: () => [
        `📏 **Sizing**`,
        `Everything is cut true-to-size. If you're between sizes, size up for a relaxed fit.`,
        `• Clothing: XS – XXL`,
        `• Trousers & denim: waist 28 – 36 in`,
        `• Footwear: EU 39 – 44`,
        `Full measurement charts are on our Size Guide page (Menu → Size Guide). Not sure? Send us your chest/waist/hip on WhatsApp and we'll recommend a size.`,
      ].join('\n'),
      next: ['returns','contact'],
    },
    {
      id: 'payment', w: 1.3,
      kw: ['pay','payment','mpesa','till','paybill','buy goods','cash','card','visa','mastercard','bank','transfer','cash on delivery','cod','pay on delivery','pay later','deposit','installment','instalment','lipa na mpesa','how do i pay','how to pay','payment method','payment options','airtel money','equity','kcb','credit'],
      ask: 'How can I pay?',
      a: () => [
        `💳 **Payment**`,
        `We accept: ${payMethods()}.`,
        S.payCOD ? `• ${S.payCOD}` : '',
        `• Nothing is charged on this website. When you tap “Send Order on WhatsApp”, we confirm availability and delivery, then share payment details on WhatsApp.`,
        `Never pay anyone claiming to be us on any other number.`,
      ].filter(Boolean).join('\n'),
      next: ['delivery','ordering'],
    },
    {
      id: 'ordering', w: 1.2,
      kw: ['how to order','how do i order','place an order','make an order','order','buy','purchase','checkout','add to cart','cart','how does it work','how does ordering work','process','steps','confirm order','order status','ordered','placed'],
      ask: 'How do I place an order?',
      a: () => [
        `🛍️ **How to order**`,
        `1. Browse Collections and pick a size on the piece you like.`,
        `2. Tap “Add to Cart”, then open your cart.`,
        `3. Tap “Checkout via WhatsApp” and fill in your name, location and phone.`,
        `4. Your order opens in WhatsApp — send it. We confirm stock, delivery and payment right there.`,
      ].join('\n'),
      next: ['payment','delivery'],
    },
    {
      id: 'location', w: 1.4,
      kw: ['where','where are you','where is the shop','where is your shop','where is rotex','location','located','address','shop','store','visit','visit you','physical','physical store','walk in','pickup','pick up','collect','collection','come to','directions','direct','map','find you','how do i get','kimana','loitokitok','kajiado','amboseli','which town','your shop','your store','branch','branches','outlet'],
      ask: 'Where is your shop?',
      a: () => [
        `📍 **Visit ${S.name}**`,
        `${shopLine()}, ${S.country}.`,
        S.landmark ? `Landmark: ${S.landmark}.` : '',
        `🕒 ${S.hours}. ${S.hoursNote || ''}`.trim(),
        `You can try pieces on and collect orders in person.`,
        `🗺️ Directions: ${mapsUrl()}`,
        `Lost on the way? Message us on WhatsApp and we'll guide you in.`,
      ].filter(Boolean).join('\n'),
      next: ['hours','delivery','contact'],
    },
    {
      id: 'hours', w: 1.3,
      kw: ['hours','open','opening','opening hours','closing','close','closed','what time','till what time','open today','open sunday','open on sunday','open saturday','weekend','sunday','working hours','business hours','when do you open','when do you close'],
      ask: 'What are your opening hours?',
      a: () => `🕒 **Opening hours**\n${S.hours}. ${S.hoursNote || ''}\nWe're at ${shopLine()}. You can always reach us on WhatsApp outside these hours and we'll reply as soon as we're open.`.trim(),
      next: ['location','contact'],
    },
    {
      id: 'contact', w: 1.3,
      kw: ['contact','phone','call','number','whatsapp','instagram','insta','ig','facebook','tiktok','social media','social','email','reach','speak to','talk to','human','person','agent','staff','manager','owner','customer care','customer service','support','complaint','complain','feedback','helpline'],
      ask: 'How do I contact you?',
      a: () => [
        `📞 **Get in touch**`,
        `• WhatsApp / call: ${S.phone}`,
        S.instagram ? `• Instagram: ${S.instagram}` : '',
        `• In person: ${shopLine()} — ${S.hours}`,
        `Tap “Hand off to Human” below to open WhatsApp directly.`,
      ].filter(Boolean).join('\n'),
      next: ['location','hours'],
    },
    {
      id: 'authenticity', w: 1.2,
      kw: ['authentic','genuine','original','real','fake','counterfeit','imitation','copy','quality','good quality','legit','legitimate','trust','trusted','scam','safe','safe to buy','reliable','brand new','new or used','second hand','used','mtumba','thrift','material','fabric','cotton','leather'],
      ask: 'Are your products authentic?',
      a: () => `✅ **Authenticity**\nEvery piece is carefully selected and checked before it's listed. If anything isn't what you expected, our ${S.returnDays}-day return policy protects you. Not sure about a specific item's fabric or condition? Ask us on WhatsApp and we'll send more photos.`,
      next: ['returns','contact'],
    },
    {
      id: 'care', w: 1.2,
      kw: ['care','wash','washing','iron','ironing','dry clean','dry cleaning','shrink','shrinks','fade','stain','clean','cleaning','how to wash','laundry','maintain','maintenance','last long','durable'],
      ask: 'How do I care for my clothes?',
      a: () => `🧺 **Care tips**\n• Check the garment's care label first.\n• Wash dark colours and denim inside-out in cold water to keep the colour.\n• Blazers and structured pieces: dry-clean or spot-clean; steam rather than press.\n• Leather shoes and belts: wipe with a soft cloth and condition occasionally.\nNeed advice on a specific piece? Ask us on WhatsApp.`,
      next: ['returns','sizing'],
    },
    {
      id: 'price', w: 1.2,
      kw: ['price','prices','cost','how much','expensive','cheap','cheaper','discount','offer','offers','promo','promotion','sale','bargain','negotiate','last price','best price','wholesale','bulk','reseller','resell','affordable','budget','coupon'],
      ask: 'Do you have discounts?',
      a: () => `🏷️ **Prices & offers**\nPrices are shown on every product in KES. ${S.instagram ? `Follow ${S.instagram} on Instagram for new arrivals and offers.` : ''}\nBuying several pieces or ordering in bulk? Message us on WhatsApp and we'll see what we can do.`.trim(),
      next: ['payment','delivery'],
    },
    {
      id: 'stock', w: 1.2,
      kw: ['in stock','available','availability','out of stock','sold out','restock','re stock','when will you restock','back in stock','when will you get more','new arrivals','new arrival','new stock','when will you get','coming soon','pre order','preorder','reserve','hold','hold for me','other colours','other colors','other sizes','more sizes','in blue','in black','in white','in red','in green','in brown','in grey','in gray','in navy','in beige','another colour','another color','this in','in a different','different colour','different color','colour','color','colours','colors'],
      ask: 'Is this item in stock?',
      a: () => `📦 **Availability**\nEverything shown on the site is available. Sizes that are sold out won't appear on the piece. If something you want isn't listed, message us on WhatsApp — we can tell you what's coming in, and reserve pieces for you.`,
      next: ['contact','ordering'],
    },
    {
      id: 'thanks', w: 1.0,
      kw: ['thanks','thank you','thankyou','perfect','great','awesome','nice','cool','ok thanks','okay thanks','appreciate','got it','sawa','bye','goodbye','see you'],
      ask: 'Thank you!',
      a: () => `You're most welcome! 🤝 If you need anything else, I'm right here — or tap “Hand off to Human” to chat with the team on WhatsApp.`,
      next: [],
    },
  ];

  const BY_ID = Object.fromEntries(TOPICS.map(t => [t.id, t]));

  /* ── SCORING ─────────────────────────────────────────────── */
  const score = (text, topic) => {
    let s = 0;
    for (const kw of topic.kw) {
      if (hit(text, kw)) s += (kw.includes(' ') ? 2 : 1) * (topic.w || 1);
    }
    return s;
  };

  const THRESHOLD = 1.0;   // below this we don't guess

  /**
   * answer(text) → { id, text, next[], confident }
   *  - confident:false means "I'm not sure" → UI shows suggestions + human handoff
   */
  const answer = (raw) => {
    const text = normalise(raw);
    if (!text) return { id: 'empty', text: 'Type a question and I\'ll do my best to help. 🙂', next: ['delivery','returns','sizing','payment'], confident: true };

    const ranked = TOPICS
      .map(t => ({ t, s: score(text, t) }))
      .filter(r => r.s > 0)
      .sort((a, b) => b.s - a.s);

    // Very short greeting-only messages shouldn't be out-voted by stray words
    const best = ranked[0];

    if (best && best.s >= THRESHOLD) {
      // If the runner-up is nearly as strong, append its answer's headline so a two-part question isn't half-answered
      const second = ranked[1];
      let body = typeof best.t.a === 'function' ? best.t.a() : best.t.a;
      let extra = null;
      if (second && second.s >= THRESHOLD && second.s >= best.s * 0.85 && second.t.id !== 'greeting' && second.t.id !== 'thanks' && best.t.id !== 'greeting') {
        extra = second.t.id;
      }
      const next = extra ? [extra, ...best.t.next.filter(n => n !== extra)] : best.t.next;
      return { id: best.t.id, text: body, next: next.slice(0, 4), confident: true };
    }

    // Not confident → offer the nearest topics instead of a generic brush-off
    const near = ranked.slice(0, 3).map(r => r.t.id).filter(id => id !== 'greeting' && id !== 'thanks');
    const suggestions = near.length ? near : ['delivery','returns','sizing','payment'];
    return {
      id: 'unknown',
      text: `I'm not sure I understood that one. 🤔 Did you mean one of these? Or tap “Hand off to Human” and the team will help you on WhatsApp.`,
      next: suggestions.slice(0, 4),
      confident: false,
    };
  };

  /** Chip label + the question it sends, for a topic id */
  const chip = (id) => BY_ID[id] ? { id, label: BY_ID[id].ask } : null;

  /** Default chips shown when the chat first opens */
  const STARTERS = ['delivery','returns','sizing','payment','location','ordering'];

  root.RotexFAQ = { answer, chip, normalise, STARTERS, TOPICS, waLink };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.RotexFAQ;
})(typeof window !== 'undefined' ? window : globalThis);
