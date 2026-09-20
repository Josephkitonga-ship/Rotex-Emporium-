# Rotex Emporium

Static storefront (GitHub Pages) + Supabase backend. Orders are confirmed over WhatsApp.

## Folder structure

```
rotex/
├── index.html            ─┐
├── catalogue.html         │  STOREFRONT PAGES  (generated — see "Editing pages")
├── delivery.html          │
├── size-guide.html        │
├── 404.html              ─┘
├── css/
│   └── styles.css        Shared design tokens + all storefront styles
├── js/
│   ├── config.js         Supabase keys, WhatsApp number AND the SHOP block (address, hours, fees…)
│   ├── faq.js            Concierge brain: scored FAQ matching (delivery, returns, sizing, payment…)
│   └── script.js         Storefront logic: menu, cart, checkout, concierge UI, catalogue
├── admin/                ← EVERYTHING ADMIN LIVES HERE
│   ├── admin.html        Staff dashboard page
│   ├── admin.css         Admin-only styles (extends ../css/styles.css)
│   └── admin.js          Auth, product CRUD, order management
├── tests/
│   └── faq.test.js       Concierge routing tests:  node tests/faq.test.js
├── docs/
│   └── supabase-rls.sql  Database schema + security policies  ← RUN THIS
├── build_pages.py        Generates the 5 storefront pages + admin.html
└── README.md
```

Admin is fully separated: delete the `admin/` folder and the storefront still works.
Admin link is in the storefront footer as `admin/admin.html`.

## System flow

```
 CUSTOMER                                            STAFF
 ────────                                            ─────
 index.html ──► catalogue.html                       admin/admin.html
                    │                                     │  email + password
                    │ js/script.js                        ▼
                    ▼                               Supabase Auth
        Supabase  products  (active = true)               │
                    │                                     ▼
                    ▼                          ┌── Products tab ──┐
           tracks by category                  │ add/edit/delete/ │──► products table
                    │                          │ show-hide        │
        Add to Cart │ (name+price taken        └──────────────────┘
                    │  from DB, not the page)  ┌── Orders tab ────┐
                    ▼                          │ view + set status│◄── orders table
        cart (localStorage, re-priced           └──────────────────┘
              against live data on load)
                    │
        Checkout form (name, location, phone)
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
 opens WhatsApp tab       inserts row into `orders`
 (immediately, inside     (background — a failure never
  the click)               blocks the WhatsApp message)
```

## Editing pages

The header, mobile menu, cart, checkout, concierge and footer are identical on every page,
so they live in **one place** (`build_pages.py`) and the pages are generated from it.

```bash
python3 build_pages.py        # regenerates index, catalogue, delivery, size-guide, 404, admin
```

To change a nav link, the footer, or the copyright year: edit `build_pages.py`, run it, done.
The year updates automatically. **Do not hand-edit the generated `.html` files** — your
changes will be overwritten next build.

## Editing shop details (address, hours, delivery, returns…)

Open **`js/config.js`** and edit the `SHOP` block. The homepage, delivery page and the
Concierge all read from it, so they can never contradict each other. Lines marked
`◄ CONFIRM` are best guesses — check each is true for your shop, because the Concierge
repeats them to customers as fact.

Most worth filling in: **`landmark`** (e.g. "Opposite Kimana Market") — walk-in customers
in a small town find you by landmark, not by coordinates. It's blank now, and blank lines
simply don't appear on the site.

## Improving the Concierge

The Concierge answers from `js/faq.js`. It scores each topic by keyword matches (typos and
Swahili like *bei*, *wapi*, *lipa* are mapped), and when it isn't confident it says so and
offers a WhatsApp handoff instead of guessing.

When a customer asks something it gets wrong: add the question to `CASES` in
`tests/faq.test.js`, run `node tests/faq.test.js` to see it fail, add the missing keyword
to the right topic in `faq.js`, and re-run until everything passes.

## Setup checklist

1. **Supabase → SQL Editor:** run `docs/supabase-rls.sql`. Read the header first.
2. **Supabase → Authentication → Providers → Email:** turn **OFF** "Allow new users to sign up".
3. **Supabase → Authentication → Users:** create your admin account manually.
4. **`js/config.js`:** confirm the WhatsApp number, Supabase values, and every `◄ CONFIRM` line in `SHOP`.
5. **`404.html`:** if your site is NOT served at `/Rotex-Emporium-/`, change `REPO_BASE`
   (use `'/'` for a custom domain or `username.github.io` root site).
6. Push to GitHub Pages.

## Adding a product

`admin/admin.html` → sign in → **+ Add Product**. Images are pasted as URLs (not uploaded),
so host them somewhere first. New products appear on the storefront immediately.
