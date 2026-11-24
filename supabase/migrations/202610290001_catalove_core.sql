-- Catalove's isolated Supabase schema. Apply only to a new, dedicated Catalove project.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.seller_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_catalove_seller()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.seller_users
    where user_id = auth.uid() and is_active
  );
$$;
revoke all on function public.is_catalove_seller() from public;
grant execute on function public.is_catalove_seller() to anon, authenticated;

create table if not exists public.categories (
  id text primary key default 'cat-' || replace(gen_random_uuid()::text, '-', ''),
  name text not null,
  slug text not null unique,
  description text,
  icon_name text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key default 'prod-' || replace(gen_random_uuid()::text, '-', ''),
  category_id text references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  tagline text,
  description text not null default '',
  specs jsonb not null default '[]'::jsonb,
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

create table if not exists public.product_variants (
  id text primary key default 'var-' || replace(gen_random_uuid()::text, '-', ''),
  product_id text not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  sku text,
  is_default boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id text primary key default 'img-' || replace(gen_random_uuid()::text, '-', ''),
  product_id text not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_availability (
  id text primary key default 'avail-' || replace(gen_random_uuid()::text, '-', ''),
  product_id text not null references public.products(id) on delete cascade,
  availability_date date not null,
  status text not null default 'available' check (status in ('available', 'sold_out', 'closed')),
  quota integer check (quota is null or quota >= 0),
  updated_at timestamptz not null default now(),
  constraint uq_product_date unique (product_id, availability_date)
);

create table if not exists public.business_settings (
  id boolean primary key default true check (id = true),
  store_name text not null default 'Catalove Studio',
  store_tagline text default 'Universal Digital Catalog Engine',
  seller_whatsapp text not null default '6285946689168',
  kitchen_address text not null default '',
  currency_symbol text not null default 'Rp',
  default_lead_time_days integer not null default 1,
  business_timezone text not null default 'Asia/Jakarta',
  instagram_handle text not null default '',
  tiktok_handle text default '',
  content_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.order_requests (
  id text primary key default 'ord-' || replace(gen_random_uuid()::text, '-', ''),
  reference_code text not null unique,
  customer_name text not null,
  customer_whatsapp text not null,
  requested_date date not null,
  fulfillment_method text not null default 'pickup' check (fulfillment_method in ('pickup', 'delivery', 'shipping')),
  delivery_address text,
  customer_notes text,
  cake_inscription text,
  candle_count integer not null default 0 check (candle_count >= 0),
  greeting_card_message text,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'confirmed', 'completed', 'cancelled')),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_request_items (
  id text primary key default 'item-' || replace(gen_random_uuid()::text, '-', ''),
  order_request_id text not null references public.order_requests(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  product_variant_id text references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  unit_price_snapshot numeric(12, 2) not null check (unit_price_snapshot >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_snapshot numeric(12, 2) not null check (subtotal_snapshot >= 0),
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.seller_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_availability enable row level security;
alter table public.business_settings enable row level security;
alter table public.order_requests enable row level security;
alter table public.order_request_items enable row level security;

-- Restrict SQL table privileges first; RLS then grants only the intended rows.
revoke all on public.seller_users, public.categories, public.products,
  public.product_variants, public.product_images, public.product_availability,
  public.business_settings, public.order_requests, public.order_request_items
  from anon, authenticated;
grant select on public.categories, public.products, public.product_variants,
  public.product_images, public.product_availability, public.business_settings to anon, authenticated;
grant select, insert, update, delete on public.categories, public.products,
  public.product_variants, public.product_images, public.product_availability,
  public.business_settings to authenticated;
grant select, update on public.order_requests to authenticated;
grant select on public.order_request_items to authenticated;
grant select on public.seller_users to authenticated;

drop policy if exists "seller reads own membership" on public.seller_users;
create policy "seller reads own membership" on public.seller_users
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "public reads active categories" on public.categories;
create policy "public reads active categories" on public.categories
  for select to anon, authenticated using (is_active or public.is_catalove_seller());
drop policy if exists "seller manages categories" on public.categories;
create policy "seller manages categories" on public.categories
  for all to authenticated using (public.is_catalove_seller()) with check (public.is_catalove_seller());

drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products
  for select to anon, authenticated using (is_active or public.is_catalove_seller());
drop policy if exists "seller manages products" on public.products;
create policy "seller manages products" on public.products
  for all to authenticated using (public.is_catalove_seller()) with check (public.is_catalove_seller());

drop policy if exists "public reads variants for active products" on public.product_variants;
create policy "public reads variants for active products" on public.product_variants
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.is_active)
    or public.is_catalove_seller()
  );
drop policy if exists "seller manages variants" on public.product_variants;
create policy "seller manages variants" on public.product_variants
  for all to authenticated using (public.is_catalove_seller()) with check (public.is_catalove_seller());

drop policy if exists "public reads images for active products" on public.product_images;
create policy "public reads images for active products" on public.product_images
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.is_active)
    or public.is_catalove_seller()
  );
drop policy if exists "seller manages images" on public.product_images;
create policy "seller manages images" on public.product_images
  for all to authenticated using (public.is_catalove_seller()) with check (public.is_catalove_seller());

drop policy if exists "public reads availability for active products" on public.product_availability;
create policy "public reads availability for active products" on public.product_availability
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.is_active)
    or public.is_catalove_seller()
  );
drop policy if exists "seller manages availability" on public.product_availability;
create policy "seller manages availability" on public.product_availability
  for all to authenticated using (public.is_catalove_seller()) with check (public.is_catalove_seller());

drop policy if exists "public reads business settings" on public.business_settings;
create policy "public reads business settings" on public.business_settings
  for select to anon, authenticated using (true);
drop policy if exists "seller manages business settings" on public.business_settings;
create policy "seller manages business settings" on public.business_settings
  for all to authenticated using (public.is_catalove_seller()) with check (public.is_catalove_seller());

drop policy if exists "seller reads orders" on public.order_requests;
create policy "seller reads orders" on public.order_requests
  for select to authenticated using (public.is_catalove_seller());
drop policy if exists "seller updates orders" on public.order_requests;
create policy "seller updates orders" on public.order_requests
  for update to authenticated using (public.is_catalove_seller()) with check (public.is_catalove_seller());
drop policy if exists "seller reads order items" on public.order_request_items;
create policy "seller reads order items" on public.order_request_items
  for select to authenticated using (public.is_catalove_seller());

insert into public.business_settings (id)
values (true)
on conflict (id) do nothing;

-- Public order submission is a narrow RPC: prices and product names come from the database.
create or replace function public.submit_order_request(
  p_product_id text,
  p_variant_id text,
  p_customer_name text,
  p_customer_whatsapp text,
  p_requested_date date,
  p_fulfillment_method text,
  p_quantity integer,
  p_delivery_address text,
  p_customer_notes text,
  p_cake_inscription text,
  p_candle_count integer,
  p_greeting_card_message text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  product_row public.products%rowtype;
  variant_row public.product_variants%rowtype;
  availability_row public.product_availability%rowtype;
  jakarta_today date := (now() at time zone 'Asia/Jakarta')::date;
  selected_price numeric(12, 2);
  order_id text := 'ord-' || replace(gen_random_uuid()::text, '-', '');
  order_reference text := '#CA-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMM') || '-' || upper(replace(gen_random_uuid()::text, '-', ''));
  order_subtotal numeric(12, 2);
  existing_count integer;
  item_json jsonb;
  order_json jsonb;
begin
  if coalesce(length(trim(p_customer_name)), 0) < 2 or length(trim(p_customer_name)) > 60 then
    raise exception 'Nama pelanggan tidak valid';
  end if;
  if coalesce(trim(p_customer_whatsapp), '') !~ '^([+]?[0-9]{10,15})$' then
    raise exception 'Nomor WhatsApp tidak valid';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 50 then
    raise exception 'Jumlah pesanan tidak valid';
  end if;
  if p_fulfillment_method is null or p_fulfillment_method not in ('pickup', 'delivery', 'shipping') then
    raise exception 'Metode pengiriman tidak valid';
  end if;
  if p_fulfillment_method <> 'pickup' and coalesce(length(trim(p_delivery_address)), 0) < 5 then
    raise exception 'Alamat pengiriman wajib diisi';
  end if;
  if length(coalesce(p_delivery_address, '')) > 250
    or length(coalesce(p_customer_notes, '')) > 300
    or length(coalesce(p_cake_inscription, '')) > 120
    or length(coalesce(p_greeting_card_message, '')) > 200
    or coalesce(p_candle_count, 0) not between 0 and 100 then
    raise exception 'Detail pesanan melebihi batas yang diizinkan';
  end if;
  if p_requested_date is null or p_requested_date < jakarta_today then
    raise exception 'Tanggal pesanan tidak valid';
  end if;

  select * into product_row from public.products
  where id = p_product_id and is_active;
  if not found then raise exception 'Produk tidak tersedia'; end if;

  selected_price := product_row.base_price;
  if p_variant_id is not null then
    select * into variant_row from public.product_variants
    where id = p_variant_id and product_id = p_product_id;
    if not found then raise exception 'Varian produk tidak valid'; end if;
    selected_price := variant_row.price;
  end if;
  if p_requested_date < jakarta_today + product_row.minimum_lead_time_days then
    raise exception 'Tanggal terlalu dekat dengan waktu persiapan produk';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_product_id), hashtext(p_requested_date::text));
  select * into availability_row from public.product_availability
  where product_id = p_product_id and availability_date = p_requested_date;
  if found then
    if availability_row.status <> 'available' then raise exception 'Produk tidak tersedia pada tanggal tersebut'; end if;
    if availability_row.quota is not null then
      select coalesce(sum(i.quantity), 0)::integer into existing_count
      from public.order_request_items i
      join public.order_requests o on o.id = i.order_request_id
      where i.product_id = p_product_id
        and o.requested_date = p_requested_date
        and o.status <> 'cancelled';
      if existing_count + p_quantity > availability_row.quota then
        raise exception 'Kuota produk pada tanggal tersebut sudah penuh';
      end if;
    end if;
  end if;

  order_subtotal := selected_price * p_quantity;
  insert into public.order_requests (
    id, reference_code, customer_name, customer_whatsapp, requested_date,
    fulfillment_method, delivery_address, customer_notes, cake_inscription,
    candle_count, greeting_card_message, subtotal
  ) values (
    order_id, order_reference, trim(p_customer_name), trim(p_customer_whatsapp), p_requested_date,
    p_fulfillment_method, nullif(trim(p_delivery_address), ''), nullif(trim(p_customer_notes), ''),
    nullif(trim(p_cake_inscription), ''), coalesce(p_candle_count, 0),
    nullif(trim(p_greeting_card_message), ''), order_subtotal
  );

  insert into public.order_request_items as inserted (
    order_request_id, product_id, product_variant_id, product_name_snapshot,
    variant_name_snapshot, unit_price_snapshot, quantity, subtotal_snapshot
  ) values (
    order_id, p_product_id, p_variant_id, product_row.name,
    case when p_variant_id is null then null else variant_row.name end,
    selected_price, p_quantity, order_subtotal
  ) returning to_jsonb(inserted) into item_json;

  select to_jsonb(o) || jsonb_build_object('items', jsonb_build_array(item_json))
  into order_json from public.order_requests o where o.id = order_id;
  return order_json;
end;
$$;
revoke all on function public.submit_order_request(text, text, text, text, date, text, integer, text, text, text, integer, text) from public;
grant execute on function public.submit_order_request(text, text, text, text, date, text, integer, text, text, text, integer, text) to anon, authenticated;

create or replace function public.submit_cart_order(
  p_customer_name text,
  p_customer_whatsapp text,
  p_fulfillment_method text,
  p_delivery_address text,
  p_customer_notes text,
  p_items jsonb,
  p_voucher_code text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  item jsonb;
  product_row public.products%rowtype;
  variant_row public.product_variants%rowtype;
  availability_row public.product_availability%rowtype;
  normalized_items jsonb := '[]'::jsonb;
  current_product_id text;
  variant_id text;
  item_quantity integer;
  item_price numeric(12, 2);
  item_subtotal numeric(12, 2);
  gross_total numeric(12, 2) := 0;
  order_subtotal numeric(12, 2);
  voucher_code text := upper(trim(coalesce(p_voucher_code, '')));
  max_lead_days integer := 0;
  jakarta_today date := (now() at time zone 'Asia/Jakarta')::date;
  requested_order_date date;
  order_id text := 'ord-' || replace(gen_random_uuid()::text, '-', '');
  order_reference text := '#CA-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMM') || '-' || upper(replace(gen_random_uuid()::text, '-', ''));
  order_items_json jsonb := '[]'::jsonb;
  order_json jsonb;
  existing_count integer;
  cart_quantity integer;
  discount_amount numeric(12, 2) := 0;
begin
  if coalesce(length(trim(p_customer_name)), 0) < 2 or length(trim(p_customer_name)) > 60 then
    raise exception 'Nama pelanggan tidak valid';
  end if;
  if coalesce(trim(p_customer_whatsapp), '') !~ '^([+]?[0-9]{10,15})$' then
    raise exception 'Nomor WhatsApp tidak valid';
  end if;
  if p_fulfillment_method is null or p_fulfillment_method not in ('pickup', 'delivery', 'shipping') then
    raise exception 'Metode pengiriman tidak valid';
  end if;
  if p_fulfillment_method <> 'pickup' and coalesce(length(trim(p_delivery_address)), 0) < 5 then
    raise exception 'Alamat pengiriman wajib diisi';
  end if;
  if length(coalesce(p_delivery_address, '')) > 250 or length(coalesce(p_customer_notes, '')) > 300 then
    raise exception 'Detail pesanan melebihi batas yang diizinkan';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception 'Daftar produk tidak valid';
  end if;
  if voucher_code not in ('', 'UMKMBERKAH', 'CATALOVE20', 'HEMAT15', 'HEMAT10', 'DISKON20') then
    raise exception 'Kode voucher tidak valid';
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    current_product_id := item->>'productId';
    variant_id := nullif(item->>'variantId', '');
    item_quantity := (item->>'quantity')::integer;
    if item_quantity is null or item_quantity < 1 or item_quantity > 50 then raise exception 'Jumlah produk tidak valid'; end if;

    select * into product_row from public.products p where p.id = current_product_id and p.is_active;
    if not found then raise exception 'Produk tidak tersedia'; end if;
    item_price := product_row.base_price;
    if variant_id is not null then
      select * into variant_row from public.product_variants
      where product_variants.id = variant_id and product_variants.product_id = current_product_id;
      if not found then raise exception 'Varian produk tidak valid'; end if;
      item_price := variant_row.price;
    end if;
    max_lead_days := greatest(max_lead_days, product_row.minimum_lead_time_days);
    item_subtotal := item_price * item_quantity;
    gross_total := gross_total + item_subtotal;
    normalized_items := normalized_items || jsonb_build_array(jsonb_build_object(
      'product_id', product_row.id,
      'product_name', product_row.name,
      'variant_id', variant_row.id,
      'variant_name', case when variant_id is null then null else variant_row.name end,
      'image_url', nullif(item->>'imageUrl', ''),
      'unit_price', item_price,
      'quantity', item_quantity,
      'subtotal', item_subtotal
    ));
    variant_row := null;
  end loop;

  requested_order_date := jakarta_today + max_lead_days;
  for item in select value from jsonb_array_elements(normalized_items)
  loop
    current_product_id := item->>'product_id';
    item_quantity := (item->>'quantity')::integer;
    perform pg_advisory_xact_lock(hashtext(current_product_id), hashtext(requested_order_date::text));
    select * into availability_row from public.product_availability
    where product_availability.product_id = current_product_id
      and availability_date = requested_order_date;
    if found then
      if availability_row.status <> 'available' then raise exception 'Produk tidak tersedia pada tanggal pemesanan'; end if;
      if availability_row.quota is not null then
        select coalesce(sum(i.quantity), 0)::integer into existing_count
        from public.order_request_items i
        join public.order_requests o on o.id = i.order_request_id
        where i.product_id = current_product_id and o.requested_date = requested_order_date and o.status <> 'cancelled';
        select coalesce(sum((value->>'quantity')::integer), 0)::integer into cart_quantity
        from jsonb_array_elements(normalized_items)
        where value->>'product_id' = current_product_id;
        if existing_count + cart_quantity > availability_row.quota then
          raise exception 'Kuota produk pada tanggal pemesanan sudah penuh';
        end if;
      end if;
    end if;
  end loop;

  if voucher_code in ('UMKMBERKAH', 'HEMAT10') then
    discount_amount := round(gross_total * 0.10);
  elsif voucher_code in ('CATALOVE20', 'DISKON20') then
    discount_amount := round(gross_total * 0.20);
  elsif voucher_code = 'HEMAT15' then
    discount_amount := least(gross_total, 15000);
  end if;
  order_subtotal := greatest(0, gross_total - discount_amount);

  insert into public.order_requests (
    id, reference_code, customer_name, customer_whatsapp, requested_date,
    fulfillment_method, delivery_address, customer_notes, subtotal
  ) values (
    order_id, order_reference, trim(p_customer_name), trim(p_customer_whatsapp), requested_order_date,
    p_fulfillment_method, nullif(trim(p_delivery_address), ''), nullif(trim(p_customer_notes), ''), order_subtotal
  );

  for item in select value from jsonb_array_elements(normalized_items)
  loop
    insert into public.order_request_items as inserted (
      order_request_id, product_id, product_variant_id, product_name_snapshot,
      variant_name_snapshot, unit_price_snapshot, quantity, subtotal_snapshot, image_url
    ) values (
      order_id, item->>'product_id', nullif(item->>'variant_id', ''), item->>'product_name',
      item->>'variant_name', (item->>'unit_price')::numeric, (item->>'quantity')::integer,
      (item->>'subtotal')::numeric, item->>'image_url'
    ) returning to_jsonb(inserted) into item;
    order_items_json := order_items_json || jsonb_build_array(item);
  end loop;

  select to_jsonb(o) || jsonb_build_object('items', order_items_json)
  into order_json from public.order_requests o where o.id = order_id;
  return order_json;
end;
$$;
revoke all on function public.submit_cart_order(text, text, text, text, text, jsonb, text) from public;
grant execute on function public.submit_cart_order(text, text, text, text, text, jsonb, text) to anon, authenticated;

create or replace function public.get_product_availability(
  p_product_id text,
  p_requested_date date
)
returns table(status text, quota integer, ordered_quantity integer)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    coalesce(a.status, 'available'),
    a.quota,
    coalesce((
      select sum(i.quantity)::integer
      from public.order_request_items i
      join public.order_requests o on o.id = i.order_request_id
      where i.product_id = p_product_id
        and o.requested_date = p_requested_date
        and o.status <> 'cancelled'
    ), 0)
  from public.products p
  left join public.product_availability a
    on a.product_id = p.id and a.availability_date = p_requested_date
  where p.id = p_product_id and p.is_active;
$$;
revoke all on function public.get_product_availability(text, date) from public;
grant execute on function public.get_product_availability(text, date) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalove-product-images', 'catalove-product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists "public reads Catalove product images" on storage.objects;
create policy "public reads Catalove product images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'catalove-product-images');
drop policy if exists "seller uploads Catalove product images" on storage.objects;
create policy "seller uploads Catalove product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'catalove-product-images' and public.is_catalove_seller());
drop policy if exists "seller updates Catalove product images" on storage.objects;
create policy "seller updates Catalove product images" on storage.objects
  for update to authenticated using (bucket_id = 'catalove-product-images' and public.is_catalove_seller())
  with check (bucket_id = 'catalove-product-images' and public.is_catalove_seller());
drop policy if exists "seller deletes Catalove product images" on storage.objects;
create policy "seller deletes Catalove product images" on storage.objects
  for delete to authenticated using (bucket_id = 'catalove-product-images' and public.is_catalove_seller());
