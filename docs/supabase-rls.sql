-- ═══════════════════════════════════════════════════════════════
-- ROTEX EMPORIUM — Supabase schema + Row Level Security
-- Paste into: Supabase Dashboard → SQL Editor → New query → Run
--
-- WHY THIS MATTERS
-- The publishable key in js/config.js is PUBLIC (anyone can read it
-- from the page source). It cannot be hidden. The ONLY thing that
-- stops a stranger from deleting your products or reading customer
-- phone numbers is Row Level Security. Without it, the database is
-- effectively open.
--
-- After running this, ALSO do (Dashboard → Authentication):
--   • Providers → Email → turn OFF "Allow new users to sign up"
--   • Create your admin user manually (Users → Add user)
-- Otherwise anyone could sign up and count as an "authenticated" admin.
-- ═══════════════════════════════════════════════════════════════

-- ── TABLES (safe to re-run) ─────────────────────────────────────
create extension if not exists "pgcrypto";

create table if not exists public.products (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null check (char_length(name) between 1 and 120),
  category   text        not null check (category in ('executive','statement','essentials','finishing')),
  price      numeric     not null check (price >= 0),
  sizes      text[]      not null default '{}',
  tag        text        check (tag in ('New','Exclusive')),
  image_url  text        not null check (image_url ~* '^https?://'),
  active     boolean     not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  customer_name text        not null check (char_length(customer_name) between 2 and 120),
  phone         text        not null check (char_length(phone) between 7 and 20),
  location      text        not null check (char_length(location) between 3 and 200),
  notes         text        check (char_length(notes) <= 1000),
  items         jsonb       not null,
  total         numeric     not null check (total >= 0),
  status        text        not null default 'new' check (status in ('new','confirmed','delivered'))
);

-- ── TURN RLS ON (deny-by-default) ───────────────────────────────
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- Clean re-runs
drop policy if exists "public reads active products"   on public.products;
drop policy if exists "admin reads all products"       on public.products;
drop policy if exists "admin inserts products"         on public.products;
drop policy if exists "admin updates products"         on public.products;
drop policy if exists "admin deletes products"         on public.products;
drop policy if exists "public places orders"           on public.orders;
drop policy if exists "admin reads orders"             on public.orders;
drop policy if exists "admin updates orders"           on public.orders;

-- ── PRODUCTS ────────────────────────────────────────────────────
-- Shoppers (anon): can see ONLY active products. Hidden ones stay hidden.
create policy "public reads active products" on public.products
  for select to anon using (active = true);

-- Admin (signed in): full control
create policy "admin reads all products" on public.products
  for select to authenticated using (true);
create policy "admin inserts products" on public.products
  for insert to authenticated with check (true);
create policy "admin updates products" on public.products
  for update to authenticated using (true) with check (true);
create policy "admin deletes products" on public.products
  for delete to authenticated using (true);

-- ── ORDERS ──────────────────────────────────────────────────────
-- Shoppers: can PLACE an order (insert) but can never read, edit or list orders.
-- New orders must start as 'new' so nobody can insert a fake "delivered" order.
create policy "public places orders" on public.orders
  for insert to anon with check (status = 'new');

-- Admin: read and update status. No delete policy = orders can't be deleted from the app.
create policy "admin reads orders" on public.orders
  for select to authenticated using (true);
create policy "admin updates orders" on public.orders
  for update to authenticated using (true) with check (true);

-- ── VERIFY (run these after; each should behave as commented) ───
-- As anon, these must return rows / succeed:
--   select count(*) from products;                      -- active products only
-- As anon, these must FAIL or return 0 rows:
--   select * from orders;                               -- 0 rows (cannot read orders)
--   delete from products;                               -- 0 rows affected
--   update products set price = 1;                      -- 0 rows affected
