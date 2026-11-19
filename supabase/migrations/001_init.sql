-- VibeCart Production Database Schema, RLS, Search RPC & Realtime
-- Run via `supabase db push` or Supabase SQL Editor

create extension if not exists pg_trgm;

-- 1. Categories
create table if not exists categories (
  id serial primary key,
  slug text unique not null,
  name text not null
);

-- 2. Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  category_id int references categories(id) on delete set null,
  brand text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  mrp numeric(10, 2),
  rating numeric(2, 1) default 4.5,
  rating_count int default 0,
  stock int default 0 check (stock >= 0),
  image_url text,
  model_url text,
  model_preset text not null default 'earbuds',
  deal_label text,
  specs jsonb not null default '{}'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  search tsvector,
  created_at timestamptz not null default now()
);

create or replace function products_update_search()
returns trigger
language plpgsql
as $$
begin
  new.search := to_tsvector(
    'simple',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.brand, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '')
  );
  return new;
end;
$$;

drop trigger if exists trg_products_search on products;
create trigger trg_products_search
  before insert or update of title, brand, description, tags
  on products
  for each row
  execute function products_update_search();

create index if not exists products_search_idx on products using gin (search);
create index if not exists products_title_trgm_idx on products using gin (title gin_trgm_ops);
create index if not exists products_price_idx on products (price);

-- 3. User Profiles
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  preferred_lang text not null default 'en-IN',
  created_at timestamptz not null default now()
);

-- 4. Delivery Addresses
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  phone text not null,
  line1 text not null,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. Carts & Cart Items
create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  status text not null default 'active' check (status in ('active', 'converted')),
  created_at timestamptz not null default now()
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity int not null check (quantity > 0 and quantity <= 10),
  variant_name text not null default 'Standard',
  created_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_name)
);

-- 6. Orders, Order Items & Realtime Order Events
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null default ('VC-' || floor(1000 + random() * 9000)::text),
  user_id uuid not null references auth.users on delete cascade,
  address jsonb not null,
  subtotal numeric(10, 2) not null,
  shipping numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  status text not null default 'created'
    check (status in ('created', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_slug text,
  title text not null,
  price numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  variant_name text not null default 'Standard',
  image_url text
);

create table if not exists order_events (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

-- 7. Returns
create table if not exists returns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  item_title text not null,
  reason text not null,
  status text not null default 'approved' check (status in ('requested', 'approved', 'picked_up', 'refunded')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
alter table categories enable row level security;
drop policy if exists "categories readable by all" on categories;
create policy "categories readable by all" on categories for select using (true);

alter table products enable row level security;
drop policy if exists "products readable by all" on products;
create policy "products readable by all" on products for select using (true);

alter table profiles enable row level security;
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table addresses enable row level security;
drop policy if exists "own addresses" on addresses;
create policy "own addresses" on addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table carts enable row level security;
drop policy if exists "own cart" on carts;
create policy "own cart" on carts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table cart_items enable row level security;
drop policy if exists "own cart items" on cart_items;
create policy "own cart items" on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()));

alter table orders enable row level security;
drop policy if exists "own orders read" on orders;
create policy "own orders read" on orders for select
  using (auth.uid() = user_id);
drop policy if exists "own orders insert" on orders;
create policy "own orders insert" on orders for insert
  with check (auth.uid() = user_id);

alter table order_items enable row level security;
drop policy if exists "own order items read" on order_items;
create policy "own order items read" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
drop policy if exists "own order items insert" on order_items;
create policy "own order items insert" on order_items for insert
  with check (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

alter table order_events enable row level security;
drop policy if exists "own order events read" on order_events;
create policy "own order events read" on order_events for select
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
drop policy if exists "own order events insert" on order_events;
create policy "own order events insert" on order_events for insert
  with check (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

alter table returns enable row level security;
drop policy if exists "own returns" on returns;
create policy "own returns" on returns for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- Search RPC (Postgres Full-Text + pg_trgm Fuzzy Match)
-- ============================================================================
create or replace function search_products(
  q text default null,
  max_price numeric default null,
  min_price numeric default null,
  cat text default null,
  lim int default 24
)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  category_slug text,
  category_name text,
  brand text,
  price numeric,
  mrp numeric,
  rating numeric,
  rating_count int,
  stock int,
  image_url text,
  model_url text,
  model_preset text,
  deal_label text,
  specs jsonb,
  variants jsonb,
  tags text[]
)
language sql stable as $$
  select
    p.id,
    p.slug,
    p.title,
    p.description,
    coalesce(c.slug, 'audio') as category_slug,
    coalesce(c.name, 'Audio') as category_name,
    p.brand,
    p.price,
    p.mrp,
    p.rating,
    p.rating_count,
    p.stock,
    p.image_url,
    p.model_url,
    p.model_preset,
    p.deal_label,
    p.specs,
    p.variants,
    p.tags
  from products p
  left join categories c on c.id = p.category_id
  where (
    q is null
    or btrim(q) = ''
    or p.search @@ plainto_tsquery('simple', q)
    or p.title % q
    or p.title ilike '%' || q || '%'
    or exists (select 1 from unnest(p.tags) t where t ilike '%' || q || '%')
  )
    and (max_price is null or p.price <= max_price)
    and (min_price is null or p.price >= min_price)
    and (cat is null or cat = 'all' or c.slug = cat)
  order by
    (
      case
        when q is null or btrim(q) = '' then 0
        else ts_rank(p.search, plainto_tsquery('simple', q)) + similarity(p.title, q)
      end
    ) desc,
    p.rating desc
  limit lim;
$$;

-- Enable Supabase Realtime for live order tracking stepper
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'order_events'
  ) then
    alter publication supabase_realtime add table order_events;
  end if;
end $$;
