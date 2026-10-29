-- ==============================================================================
-- CATALOVE: Universal E-Commerce & Catalog Engine Core Migration
-- Version: 1.0.0
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- 1. CATEGORIES TABLE
create table if not exists public.categories (
  id text primary key default concat('cat-', substr(md5(random()::text), 1, 8)),
  name text not null,
  slug text not null unique,
  description text,
  icon_name text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key default concat('prod-', substr(md5(random()::text), 1, 8)),
  category_id text references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  tagline text,
  description text not null default '',
  specs jsonb default '[]'::jsonb,
  flavor_notes jsonb not null default '[]'::jsonb,
  base_price numeric(12, 2) not null check (base_price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price >= 0),
  badge text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  minimum_lead_time_days integer not null default 0 check (minimum_lead_time_days >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. PRODUCT VARIANTS TABLE
create table if not exists public.product_variants (
  id text primary key default concat('var-', substr(md5(random()::text), 1, 8)),
  product_id text not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  sku text,
  is_default boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 4. PRODUCT IMAGES TABLE
create table if not exists public.product_images (
  id text primary key default concat('img-', substr(md5(random()::text), 1, 8)),
  product_id text not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. PRODUCT AVAILABILITY / PREORDER QUOTA
create table if not exists public.product_availability (
  id text primary key default concat('avail-', substr(md5(random()::text), 1, 8)),
  product_id text not null references public.products(id) on delete cascade,
  availability_date date not null,
  status text not null default 'available' check (status in ('available', 'sold_out', 'closed')),
  quota integer,
  updated_at timestamptz not null default now(),
  constraint uq_product_date unique (product_id, availability_date)
);

-- 6. BUSINESS SETTINGS TABLE
create table if not exists public.business_settings (
  id boolean primary key default true check (id = true),
  store_name text not null default 'Catalove Studio',
  store_tagline text default 'Universal Digital Catalog Engine',
  seller_whatsapp text not null default '6281234567890',
  kitchen_address text not null default 'Jakarta, Indonesia',
  currency_symbol text not null default 'Rp',
  default_lead_time_days integer not null default 1,
  business_timezone text not null default 'Asia/Jakarta',
  instagram_handle text not null default '@catalove.studio',
  tiktok_handle text default '@catalovestudio',
  content_config jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 7. ORDER REQUESTS TABLE
create table if not exists public.order_requests (
  id text primary key default concat('ord-', substr(md5(random()::text), 1, 8)),
  reference_code text not null unique,
  customer_name text not null,
  customer_whatsapp text not null,
  requested_date date,
  fulfillment_method text not null default 'pickup' check (fulfillment_method in ('pickup', 'delivery', 'shipping')),
  delivery_address text,
  customer_notes text,
  cake_inscription text,
  candle_count integer default 0,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'confirmed', 'completed', 'cancelled')),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. ORDER REQUEST ITEMS
create table if not exists public.order_request_items (
  id text primary key default concat('item-', substr(md5(random()::text), 1, 8)),
  order_request_id text not null references public.order_requests(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  product_variant_id text references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  unit_price_snapshot numeric(12, 2) not null,
  quantity integer not null check (quantity > 0),
  subtotal_snapshot numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_availability enable row level security;
alter table public.business_settings enable row level security;
alter table public.order_requests enable row level security;
alter table public.order_request_items enable row level security;

-- Permissive catalog access
drop policy if exists "Catalog read access" on public.categories;
create policy "Catalog read access" on public.categories for select using (true);
drop policy if exists "Catalog write access" on public.categories;
create policy "Catalog write access" on public.categories for all using (true) with check (true);

drop policy if exists "Products read access" on public.products;
create policy "Products read access" on public.products for select using (true);
drop policy if exists "Products write access" on public.products;
create policy "Products write access" on public.products for all using (true) with check (true);

drop policy if exists "Variants read access" on public.product_variants;
create policy "Variants read access" on public.product_variants for select using (true);
drop policy if exists "Variants write access" on public.product_variants;
create policy "Variants write access" on public.product_variants for all using (true) with check (true);

drop policy if exists "Images read access" on public.product_images;
create policy "Images read access" on public.product_images for select using (true);
drop policy if exists "Images write access" on public.product_images;
create policy "Images write access" on public.product_images for all using (true) with check (true);

drop policy if exists "Availability read access" on public.product_availability;
create policy "Availability read access" on public.product_availability for select using (true);
drop policy if exists "Availability write access" on public.product_availability;
create policy "Availability write access" on public.product_availability for all using (true) with check (true);

drop policy if exists "Settings read access" on public.business_settings;
create policy "Settings read access" on public.business_settings for select using (true);
drop policy if exists "Settings write access" on public.business_settings;
create policy "Settings write access" on public.business_settings for all using (true) with check (true);

drop policy if exists "Orders read access" on public.order_requests;
create policy "Orders read access" on public.order_requests for select using (true);
drop policy if exists "Orders write access" on public.order_requests;
create policy "Orders write access" on public.order_requests for all using (true) with check (true);

drop policy if exists "Order items read access" on public.order_request_items;
create policy "Order items read access" on public.order_request_items for select using (true);
drop policy if exists "Order items write access" on public.order_request_items;
create policy "Order items write access" on public.order_request_items for all using (true) with check (true);

-- Insert Default Settings
insert into public.business_settings (id, store_name, store_tagline, seller_whatsapp, kitchen_address)
values (true, 'Catalove Studio', 'Universal Digital Catalog Engine', '6281234567890', 'Jakarta, Indonesia')
on conflict (id) do nothing;
