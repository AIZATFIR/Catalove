-- SofizCake production core schema.
-- Apply only to the SofizCake Supabase project after reviewing the target project.

create table if not exists public.seller_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_sofizcake_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.seller_users
    where user_id = auth.uid() and is_active
  ) or exists (
    select 1 from auth.users
    where id = auth.uid() and (
      raw_app_meta_data->>'role' = 'seller'
      or raw_user_meta_data->>'role' = 'seller'
      or email like '%@sofizcake.com'
    )
  ) or (
    auth.uid() is not null and not exists (select 1 from public.seller_users)
  );
$$;

create or replace function public.handle_new_seller_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_app_meta_data->>'role' = 'seller'
     or new.raw_user_meta_data->>'role' = 'seller'
     or new.email like '%@sofizcake.com'
     or not exists (select 1 from public.seller_users) then
    insert into public.seller_users (user_id, is_active)
    values (new.id, true)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_seller_user();

grant execute on function public.is_sofizcake_seller() to anon, authenticated;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.categories (name, slug, description, display_order) values
  ('Signature Whole Cakes', 'whole-cakes', 'Kue utuh premium untuk ulang tahun dan perayaan keluarga.', 1),
  ('Korean Bento Cakes', 'bento-cakes', 'Kue mungil personal dengan dekorasi lembut.', 2),
  ('Dessert & Slice Boxes', 'slice-boxes', 'Potongan kue dan dessert box untuk camilan atau berbagi.', 3),
  ('Special Gift Hampers', 'hampers', 'Bingkisan manis untuk momen spesial.', 4)
on conflict (slug) do nothing;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null default '',
  flavor_notes text[] not null default '{}',
  base_price numeric(12,2) not null check (base_price >= 1000),
  is_active boolean not null default false,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  minimum_lead_time_days integer not null default 2 check (minimum_lead_time_days between 0 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null check (price >= 1000),
  is_default boolean not null default false,
  display_order integer not null default 0
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists product_images_one_primary_per_product
  on public.product_images(product_id) where is_primary;

create table if not exists public.product_availability (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  availability_date date not null,
  status text not null check (status in ('available', 'sold_out', 'closed')),
  quota integer check (quota is null or quota >= 0),
  updated_at timestamptz not null default now(),
  unique (product_id, availability_date)
);

create table if not exists public.order_requests (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  customer_name text not null,
  customer_whatsapp text not null,
  requested_date date not null,
  fulfillment_method text not null check (fulfillment_method in ('pickup', 'delivery')),
  delivery_address text,
  customer_notes text,
  cake_inscription text,
  candle_count integer not null default 0 check (candle_count between 0 and 100),
  greeting_card_message text,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'confirmed', 'completed', 'cancelled')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_requests_status_created_idx
  on public.order_requests(status, created_at desc);
create index if not exists order_requests_requested_date_idx
  on public.order_requests(requested_date);

create table if not exists public.order_request_items (
  id uuid primary key default gen_random_uuid(),
  order_request_id uuid not null references public.order_requests(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  unit_price_snapshot numeric(12,2) not null check (unit_price_snapshot >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_snapshot numeric(12,2) not null check (subtotal_snapshot >= 0)
);

create table if not exists public.business_settings (
  id boolean primary key default true check (id),
  seller_whatsapp text not null default '',
  store_name text not null default 'SofizCake',
  kitchen_address text not null default '',
  default_lead_time_days integer not null default 2 check (default_lead_time_days between 0 and 30),
  business_timezone text not null default 'Asia/Jakarta',
  instagram_handle text not null default '',
  store_tagline text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.order_reference_counters (
  period text primary key,
  last_value integer not null check (last_value between 1000 and 9999)
);

create or replace function public.submit_order_request(
  p_product_id uuid,
  p_variant_id uuid,
  p_customer_name text,
  p_customer_whatsapp text,
  p_requested_date date,
  p_fulfillment_method text,
  p_quantity integer,
  p_delivery_address text default null,
  p_customer_notes text default null,
  p_cake_inscription text default null,
  p_candle_count integer default 0,
  p_greeting_card_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_availability public.product_availability%rowtype;
  v_order_id uuid;
  v_ref_period text;
  v_ref_number integer;
  v_reference text;
  v_price numeric(12,2);
  v_total numeric(12,2);
  v_name_snapshot text;
  v_variant_snapshot text;
  v_order public.order_requests%rowtype;
begin
  if nullif(trim(p_customer_name), '') is null or nullif(trim(p_customer_whatsapp), '') is null then
    raise exception 'Nama dan WhatsApp wajib diisi';
  end if;
  if p_quantity < 1 or p_quantity > 50 then raise exception 'Jumlah tidak valid'; end if;
  if p_candle_count < 0 or p_candle_count > 100 then raise exception 'Jumlah lilin tidak valid'; end if;
  if p_fulfillment_method not in ('pickup', 'delivery') then raise exception 'Metode pengambilan tidak valid'; end if;
  if p_fulfillment_method = 'delivery' and nullif(trim(p_delivery_address), '') is null then
    raise exception 'Alamat pengantaran wajib diisi';
  end if;

  select * into v_product from public.products where id = p_product_id and is_active;
  if not found then raise exception 'Produk tidak tersedia'; end if;
  if p_variant_id is not null then
    select * into v_variant from public.product_variants where id = p_variant_id and product_id = p_product_id;
    if not found then raise exception 'Varian tidak tersedia'; end if;
    v_price := v_variant.price;
    v_variant_snapshot := v_variant.name;
  else
    v_price := v_product.base_price;
    v_variant_snapshot := null;
  end if;
  v_name_snapshot := v_product.name;

  if p_requested_date < ((now() at time zone 'Asia/Jakarta')::date + v_product.minimum_lead_time_days) then
    raise exception 'Tanggal tidak memenuhi waktu persiapan minimum';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_product_id::text || p_requested_date::text));
  select * into v_availability from public.product_availability
    where product_id = p_product_id and availability_date = p_requested_date;
  if found and v_availability.status in ('sold_out', 'closed') then
    raise exception 'Tanggal pemesanan tidak tersedia';
  end if;
  if found and v_availability.quota is not null then
    if (select coalesce(sum(i.quantity), 0) from public.order_request_items i
        join public.order_requests o on o.id = i.order_request_id
        where i.product_id = p_product_id and o.requested_date = p_requested_date
          and o.status <> 'cancelled') + p_quantity > v_availability.quota then
      raise exception 'Kuota produksi untuk tanggal ini sudah penuh';
    end if;
  end if;

  v_total := v_price * p_quantity;
  v_ref_period := to_char(now() at time zone 'Asia/Jakarta', 'YYMM');
  insert into public.order_reference_counters(period, last_value)
    values (v_ref_period, 1000)
    on conflict (period) do update set last_value = public.order_reference_counters.last_value + 1
    returning last_value into v_ref_number;
  if v_ref_number > 9999 then raise exception 'Kuota nomor referensi bulan ini penuh'; end if;
  v_reference := '#SC-' || v_ref_period || '-' || v_ref_number::text;

  insert into public.order_requests (
    reference_code, customer_name, customer_whatsapp, requested_date, fulfillment_method,
    delivery_address, customer_notes, cake_inscription, candle_count, greeting_card_message, subtotal
  ) values (
    v_reference, trim(p_customer_name), trim(p_customer_whatsapp), p_requested_date,
    p_fulfillment_method, nullif(trim(p_delivery_address), ''), nullif(trim(p_customer_notes), ''),
    nullif(trim(p_cake_inscription), ''), p_candle_count,
    nullif(trim(p_greeting_card_message), ''), v_total
  ) returning id into v_order_id;

  insert into public.order_request_items (
    order_request_id, product_id, product_variant_id, product_name_snapshot,
    variant_name_snapshot, unit_price_snapshot, quantity, subtotal_snapshot
  ) values (
    v_order_id, p_product_id, p_variant_id, v_name_snapshot,
    v_variant_snapshot, v_price, p_quantity, v_total
  );

  select * into v_order from public.order_requests where id = v_order_id;
  return to_jsonb(v_order) || jsonb_build_object('items', jsonb_build_array(
    jsonb_build_object(
      'id', (select id from public.order_request_items where order_request_id = v_order_id),
      'order_request_id', v_order_id,
      'product_id', p_product_id,
      'product_variant_id', p_variant_id,
      'product_name_snapshot', v_name_snapshot,
      'variant_name_snapshot', v_variant_snapshot,
      'unit_price_snapshot', v_price,
      'quantity', p_quantity,
      'subtotal_snapshot', v_total
    )
  ));
end;
$$;

revoke all on function public.submit_order_request(uuid, uuid, text, text, date, text, integer, text, text, text, integer, text) from public;
grant execute on function public.submit_order_request(uuid, uuid, text, text, date, text, integer, text, text, text, integer, text) to anon, authenticated;

alter table public.seller_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_availability enable row level security;
alter table public.order_requests enable row level security;
alter table public.order_request_items enable row level security;
alter table public.business_settings enable row level security;
alter table public.order_reference_counters enable row level security;

drop policy if exists "seller reads seller list" on public.seller_users;
create policy "seller reads seller list" on public.seller_users for select to authenticated using (public.is_sofizcake_seller());

drop policy if exists "public reads active categories" on public.categories;
drop policy if exists "seller manages categories" on public.categories;
drop policy if exists "allow all access to categories" on public.categories;
create policy "allow all access to categories" on public.categories for all to anon, authenticated using (true) with check (true);

drop policy if exists "public reads active products" on public.products;
drop policy if exists "seller manages products" on public.products;
drop policy if exists "allow all access to products" on public.products;
create policy "allow all access to products" on public.products for all to anon, authenticated using (true) with check (true);

drop policy if exists "public reads variants for active products" on public.product_variants;
drop policy if exists "seller manages variants" on public.product_variants;
drop policy if exists "allow all access to variants" on public.product_variants;
create policy "allow all access to variants" on public.product_variants for all to anon, authenticated using (true) with check (true);

drop policy if exists "public reads images for active products" on public.product_images;
drop policy if exists "seller manages images" on public.product_images;
drop policy if exists "allow all access to images" on public.product_images;
create policy "allow all access to images" on public.product_images for all to anon, authenticated using (true) with check (true);

drop policy if exists "public reads availability for active products" on public.product_availability;
drop policy if exists "seller manages availability" on public.product_availability;
drop policy if exists "allow all access to availability" on public.product_availability;
create policy "allow all access to availability" on public.product_availability for all to anon, authenticated using (true) with check (true);

drop policy if exists "seller manages business settings" on public.business_settings;
drop policy if exists "public reads business settings" on public.business_settings;
drop policy if exists "allow all access to business settings" on public.business_settings;
create policy "allow all access to business settings" on public.business_settings for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on public.categories, public.products, public.product_variants,
  public.product_images, public.product_availability, public.business_settings to anon, authenticated;
grant select, update on public.order_requests to authenticated;
grant select on public.order_request_items, public.seller_users to authenticated;
revoke all on public.order_reference_counters from anon, authenticated;
revoke insert, delete on public.order_requests from anon, authenticated;
revoke insert, update, delete on public.order_request_items from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cake-images', 'cake-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public reads cake images" on storage.objects;
create policy "public reads cake images" on storage.objects for select to anon, authenticated
  using (bucket_id = 'cake-images');
drop policy if exists "seller uploads cake images" on storage.objects;
create policy "seller uploads cake images" on storage.objects for insert to authenticated
  with check (bucket_id = 'cake-images' and public.is_sofizcake_seller());
drop policy if exists "seller updates cake images" on storage.objects;
create policy "seller updates cake images" on storage.objects for update to authenticated
  using (bucket_id = 'cake-images' and public.is_sofizcake_seller())
  with check (bucket_id = 'cake-images' and public.is_sofizcake_seller());
drop policy if exists "seller deletes cake images" on storage.objects;
create policy "seller deletes cake images" on storage.objects for delete to authenticated
  using (bucket_id = 'cake-images' and public.is_sofizcake_seller());
