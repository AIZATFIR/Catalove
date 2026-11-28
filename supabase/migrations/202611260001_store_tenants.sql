-- Convert Catalove's single-store data into an explicitly scoped shared database.
-- The initial store keeps every existing product, order and image reference intact.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$'),
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'suspended')),
  plan text not null default 'free' check (plan in ('free', 'business', 'enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.stores (id, slug, name, status)
values ('00000000-0000-4000-8000-000000000001', 'catalove', 'Catalove', 'published')
on conflict (slug) do update set id = excluded.id;

create table if not exists public.store_memberships (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'editor')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

insert into public.store_memberships (store_id, user_id, role)
select s.id, su.user_id, 'owner'
from public.seller_users su
cross join public.stores s
where s.slug = 'catalove' and su.is_active
on conflict (store_id, user_id) do nothing;
insert into public.store_memberships (store_id, user_id, role)
select s.id, u.id, 'owner'
from auth.users u
cross join public.stores s
where s.slug = 'catalove' and u.raw_app_meta_data->>'role' = 'seller'
on conflict (store_id, user_id) do nothing;

alter table public.categories
  add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.products
  add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.product_variants
  add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.product_images
  add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.product_availability
  add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.business_settings
  add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.order_requests
  add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.order_request_items
  add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);

-- Product and category slugs only need to be unique inside a storefront.
alter table public.categories drop constraint categories_slug_key;
alter table public.categories add constraint categories_store_slug_key unique (store_id, slug);
alter table public.products drop constraint products_slug_key;
alter table public.products add constraint products_store_slug_key unique (store_id, slug);

-- Replace the old singleton settings key with one settings row per store.
alter table public.business_settings drop constraint business_settings_pkey;
alter table public.business_settings add constraint business_settings_pkey primary key (store_id);

alter table public.categories add constraint categories_store_id_id_key unique (store_id, id);
alter table public.products add constraint products_store_id_id_key unique (store_id, id);
alter table public.product_variants add constraint product_variants_store_id_id_key unique (store_id, id);
alter table public.order_requests add constraint order_requests_store_id_id_key unique (store_id, id);
alter table public.product_variants add constraint product_variants_store_product_fkey
  foreign key (store_id, product_id) references public.products(store_id, id) on delete cascade;
alter table public.product_images add constraint product_images_store_product_fkey
  foreign key (store_id, product_id) references public.products(store_id, id) on delete cascade;
alter table public.product_availability add constraint product_availability_store_product_fkey
  foreign key (store_id, product_id) references public.products(store_id, id) on delete cascade;
alter table public.products add constraint products_store_category_fkey
  foreign key (store_id, category_id) references public.categories(store_id, id) on delete set null (category_id);
alter table public.order_request_items add constraint order_items_store_order_fkey
  foreign key (store_id, order_request_id) references public.order_requests(store_id, id) on delete cascade;
alter table public.order_request_items add constraint order_items_store_product_fkey
  foreign key (store_id, product_id) references public.products(store_id, id) on delete restrict;
alter table public.order_request_items add constraint order_items_store_variant_fkey
  foreign key (store_id, product_variant_id) references public.product_variants(store_id, id) on delete set null (product_variant_id);

create index categories_store_order_idx on public.categories(store_id, display_order);
create index products_store_order_idx on public.products(store_id, display_order);
create index orders_store_created_idx on public.order_requests(store_id, created_at desc);

create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.store_memberships m
    where m.store_id = p_store_id and m.user_id = auth.uid()
  );
$$;
revoke all on function public.is_store_member(uuid) from public;
grant execute on function public.is_store_member(uuid) to anon, authenticated;

create or replace function public.is_store_published(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (select 1 from public.stores s where s.id = p_store_id and s.status = 'published');
$$;
revoke all on function public.is_store_published(uuid) from public;
grant execute on function public.is_store_published(uuid) to anon, authenticated;

create or replace function public.is_store_admin(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.store_memberships m
    where m.store_id = p_store_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  );
$$;
revoke all on function public.is_store_admin(uuid) from public;
grant execute on function public.is_store_admin(uuid) to anon, authenticated;

create or replace function public.create_store_for_current_user(p_store_name text, p_store_slug text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  owner_id uuid := auth.uid();
  new_store public.stores%rowtype;
  normalized_slug text := lower(trim(coalesce(p_store_slug, '')));
  normalized_name text := trim(coalesce(p_store_name, ''));
begin
  if owner_id is null then raise exception 'Silakan masuk untuk membuat katalog'; end if;
  if not exists (
    select 1 from auth.users u
    where u.id = owner_id and u.email_confirmed_at is not null
  ) then
    raise exception 'Verifikasi alamat email sebelum membuat katalog';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
  if length(normalized_name) not between 2 and 60 then raise exception 'Nama toko harus 2–60 karakter'; end if;
  if normalized_slug !~ '^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$' then raise exception 'Alamat katalog tidak valid'; end if;
  if normalized_slug in ('admin', 'api', 's', 'catalog', 'product', 'order', 'about', 'bio', 'contact', 'privacy', 'terms', 'login', 'register') then
    raise exception 'Alamat katalog tidak tersedia';
  end if;

  select st.* into new_store
  from public.store_memberships m
  join public.stores st on st.id = m.store_id
  where m.user_id = owner_id and st.slug = normalized_slug;
  if found then
    return jsonb_build_object('id', new_store.id, 'slug', new_store.slug, 'status', new_store.status);
  end if;
  if exists (select 1 from public.store_memberships m where m.user_id = owner_id) then
    raise exception 'Satu akun dapat memiliki satu katalog gratis. Hubungi Catalove untuk kebutuhan lainnya';
  end if;
  if exists (select 1 from public.stores st where st.slug = normalized_slug) then
    raise exception 'Alamat katalog sudah digunakan';
  end if;

  insert into public.stores (slug, name, status, plan)
  values (normalized_slug, normalized_name, 'draft', 'free')
  returning * into new_store;
  insert into public.store_memberships (store_id, user_id, role)
  values (new_store.id, owner_id, 'owner');
  insert into public.business_settings (id, store_id, store_name, store_tagline, seller_whatsapp, content_config)
  values (
    true,
    new_store.id,
    normalized_name,
    'Katalog resmi ' || normalized_name,
    '',
    jsonb_build_object(
      'catalove_v3', true,
      'nav_brand_title', normalized_name,
      'nav_cta_text', 'Hubungi Kami',
      'hero_eyebrow', 'Katalog Resmi',
      'hero_title', normalized_name,
      'hero_subtitle', 'Jelajahi produk pilihan kami dan hubungi toko untuk memesan.',
      'hero_primary_cta', 'Hubungi via WhatsApp',
      'story_title', 'Dibuat dengan sepenuh hati',
      'footer_badge', 'Powered by Catalove'
    )
  );
  return jsonb_build_object('id', new_store.id, 'slug', new_store.slug, 'status', new_store.status);
end;
$$;
revoke all on function public.create_store_for_current_user(text, text) from public, anon;
grant execute on function public.create_store_for_current_user(text, text) to authenticated;

create or replace function public.enforce_store_catalog_quota()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  store_plan text;
  item_count bigint;
  item_limit integer;
begin
  if tg_op = 'UPDATE' then
    if old.store_id <> new.store_id then raise exception 'Data katalog tidak dapat dipindahkan ke toko lain'; end if;
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.store_id::text || ':' || tg_table_name, 0));

  select s.plan into store_plan from public.stores s where s.id = new.store_id;
  if store_plan is null then raise exception 'Toko tidak ditemukan'; end if;
  if tg_table_name = 'products' then
    item_limit := case store_plan when 'free' then 25 when 'business' then 100 else 500 end;
    select count(*) into item_count from public.products p where p.store_id = new.store_id;
    if item_count >= item_limit then raise exception 'Batas produk paket toko tercapai'; end if;
  elsif tg_table_name = 'product_images' then
    item_limit := case store_plan when 'free' then 50 when 'business' then 250 else 1000 end;
    select count(*) into item_count from public.product_images i where i.store_id = new.store_id;
    if item_count >= item_limit then raise exception 'Batas foto paket toko tercapai'; end if;
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_store_catalog_quota() from public;
create trigger enforce_store_product_quota
  before insert or update of store_id on public.products
  for each row execute function public.enforce_store_catalog_quota();
create trigger enforce_store_product_image_quota
  before insert or update of store_id on public.product_images
  for each row execute function public.enforce_store_catalog_quota();

create table public.store_media_upload_reservations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 2097152),
  created_at timestamptz not null default now()
);
alter table public.store_media_upload_reservations enable row level security;
revoke all on public.store_media_upload_reservations from anon, authenticated;

create or replace function public.reserve_store_image_upload(
  p_store_id uuid,
  p_user_id uuid,
  p_byte_size bigint
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, storage
as $$
declare
  store_plan text;
  max_files integer;
  max_bytes bigint;
  stored_files bigint;
  stored_bytes bigint;
  reserved_files bigint;
  reserved_bytes bigint;
  reservation_id uuid;
begin
  if p_byte_size is null or p_byte_size < 1 or p_byte_size > 2097152 then
    raise exception 'Foto harus maksimal 2 MB';
  end if;
  if not exists (select 1 from public.store_memberships m where m.store_id = p_store_id and m.user_id = p_user_id) then
    raise exception 'Akses toko tidak valid';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_store_id::text, 0));
  delete from public.store_media_upload_reservations r
  where r.store_id = p_store_id and r.created_at < now() - interval '20 minutes';

  select s.plan into store_plan from public.stores s where s.id = p_store_id;
  if store_plan is null then raise exception 'Toko tidak ditemukan'; end if;
  max_files := case store_plan when 'free' then 50 when 'business' then 250 else 1000 end;
  max_bytes := case store_plan when 'free' then 104857600 when 'business' then 524288000 else 2147483648 end;

  select count(*), coalesce(sum(case when o.metadata->>'size' ~ '^[0-9]+$' then (o.metadata->>'size')::bigint else 0 end), 0)
  into stored_files, stored_bytes
  from storage.objects o
  where o.bucket_id = 'catalove-product-images'
    and (
      o.name like 'stores/' || p_store_id::text || '/products/%'
      or exists (
        select 1 from public.store_memberships m
        where m.store_id = p_store_id and o.name like 'users/' || m.user_id::text || '/products/%'
      )
    );
  select count(*), coalesce(sum(r.byte_size), 0)
  into reserved_files, reserved_bytes
  from public.store_media_upload_reservations r where r.store_id = p_store_id;
  if stored_files + reserved_files >= max_files or stored_bytes + reserved_bytes + p_byte_size > max_bytes then
    raise exception 'Penyimpanan foto katalog mencapai batas paket';
  end if;

  insert into public.store_media_upload_reservations (store_id, user_id, byte_size)
  values (p_store_id, p_user_id, p_byte_size)
  returning id into reservation_id;
  return reservation_id;
end;
$$;
revoke all on function public.reserve_store_image_upload(uuid, uuid, bigint) from public, anon, authenticated;
grant execute on function public.reserve_store_image_upload(uuid, uuid, bigint) to service_role;

create or replace function public.release_store_image_upload(p_reservation_id uuid, p_store_id uuid)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  delete from public.store_media_upload_reservations
  where id = p_reservation_id and store_id = p_store_id;
$$;
revoke all on function public.release_store_image_upload(uuid, uuid) from public, anon, authenticated;
grant execute on function public.release_store_image_upload(uuid, uuid) to service_role;

-- The existing public order RPCs accept product IDs. Derive the tenant from the
-- first product and reject any later item that belongs to a different store.
create or replace function public.bind_order_item_to_store()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  product_store_id uuid;
  order_store_id uuid;
  has_items boolean;
begin
  select p.store_id into product_store_id from public.products p where p.id = new.product_id;
  if product_store_id is null then raise exception 'Produk tidak tersedia'; end if;
  if not public.is_store_published(product_store_id) and not public.is_store_member(product_store_id) then
    raise exception 'Produk tidak tersedia';
  end if;

  select o.store_id into order_store_id from public.order_requests o where o.id = new.order_request_id;
  if order_store_id is null then raise exception 'Pesanan tidak ditemukan'; end if;

  select exists (
    select 1 from public.order_request_items i where i.order_request_id = new.order_request_id
  ) into has_items;
  if has_items and order_store_id <> product_store_id then
    raise exception 'Keranjang tidak boleh memuat produk dari toko berbeda';
  end if;

  if not has_items then
    update public.order_requests set store_id = product_store_id where id = new.order_request_id;
  end if;
  new.store_id := product_store_id;
  return new;
end;
$$;
revoke all on function public.bind_order_item_to_store() from public;
create trigger bind_order_item_to_store_before_insert
  before insert on public.order_request_items
  for each row execute function public.bind_order_item_to_store();

-- The legacy order functions infer a tenant from product IDs. Keep them internal,
-- then expose wrappers that require the storefront slug and verify every item.
revoke all on function public.submit_order_request(text, text, text, text, date, text, integer, text, text, text, integer, text)
  from public, anon, authenticated;
revoke all on function public.submit_cart_order(text, text, text, text, text, jsonb, text)
  from public, anon, authenticated;

create or replace function public.submit_order_request_for_store(
  p_store_slug text,
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
  target_store_id uuid;
begin
  select s.id into target_store_id from public.stores s
  where s.slug = p_store_slug and s.status = 'published';
  if target_store_id is null or not exists (
    select 1 from public.products p
    where p.id = p_product_id and p.store_id = target_store_id and p.is_active
  ) then
    raise exception 'Produk tidak tersedia di katalog ini';
  end if;

  return public.submit_order_request(
    p_product_id, p_variant_id, p_customer_name, p_customer_whatsapp,
    p_requested_date, p_fulfillment_method, p_quantity, p_delivery_address,
    p_customer_notes, p_cake_inscription, p_candle_count, p_greeting_card_message
  );
end;
$$;
revoke all on function public.submit_order_request_for_store(text, text, text, text, text, date, text, integer, text, text, text, integer, text)
  from public;
grant execute on function public.submit_order_request_for_store(text, text, text, text, text, date, text, integer, text, text, text, integer, text)
  to anon, authenticated;

create or replace function public.submit_cart_order_for_store(
  p_store_slug text,
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
  target_store_id uuid;
  invalid_product_count bigint;
  max_lead_days integer;
  requested_order_date date;
  current_product_id text;
begin
  select s.id into target_store_id from public.stores s
  where s.slug = p_store_slug and s.status = 'published';
  if target_store_id is null then raise exception 'Katalog tidak tersedia'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception 'Daftar produk tidak valid';
  end if;

  select count(*) into invalid_product_count
  from jsonb_array_elements(p_items) as entries(item)
  left join public.products p
    on p.id = entries.item->>'productId' and p.store_id = target_store_id and p.is_active
  where p.id is null;
  if invalid_product_count > 0 then raise exception 'Produk tidak tersedia di katalog ini'; end if;

  select coalesce(max(p.minimum_lead_time_days), 0) into max_lead_days
  from jsonb_array_elements(p_items) as entries(item)
  join public.products p on p.id = entries.item->>'productId' and p.store_id = target_store_id;
  requested_order_date := (now() at time zone 'Asia/Jakarta')::date + max_lead_days;

  -- Match the legacy RPC's availability locks, but take them in a stable order
  -- so simultaneous carts with reversed item order cannot deadlock each other.
  for current_product_id in
    select distinct entries.item->>'productId'
    from jsonb_array_elements(p_items) as entries(item)
    order by 1
  loop
    perform pg_advisory_xact_lock(hashtext(current_product_id), hashtext(requested_order_date::text));
  end loop;

  return public.submit_cart_order(
    p_customer_name, p_customer_whatsapp, p_fulfillment_method,
    p_delivery_address, p_customer_notes, p_items, p_voucher_code
  );
end;
$$;
revoke all on function public.submit_cart_order_for_store(text, text, text, text, text, text, jsonb, text)
  from public;
grant execute on function public.submit_cart_order_for_store(text, text, text, text, text, text, jsonb, text)
  to anon, authenticated;

alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_availability enable row level security;
alter table public.business_settings enable row level security;
alter table public.order_requests enable row level security;
alter table public.order_request_items enable row level security;

revoke all on public.stores, public.store_memberships from anon, authenticated;
grant select on public.stores to anon, authenticated;
grant select on public.store_memberships to authenticated;

drop policy if exists "seller reads own membership" on public.seller_users;
drop policy if exists "public reads active categories" on public.categories;
drop policy if exists "seller manages categories" on public.categories;
drop policy if exists "public reads active products" on public.products;
drop policy if exists "seller manages products" on public.products;
drop policy if exists "public reads variants for active products" on public.product_variants;
drop policy if exists "seller manages variants" on public.product_variants;
drop policy if exists "public reads images for active products" on public.product_images;
drop policy if exists "seller manages images" on public.product_images;
drop policy if exists "public reads availability for active products" on public.product_availability;
drop policy if exists "seller manages availability" on public.product_availability;
drop policy if exists "public reads business settings" on public.business_settings;
drop policy if exists "seller manages business settings" on public.business_settings;
drop policy if exists "seller reads orders" on public.order_requests;
drop policy if exists "seller updates orders" on public.order_requests;
drop policy if exists "seller reads order items" on public.order_request_items;

create policy "public reads published stores" on public.stores
  for select to anon, authenticated using (status = 'published');
create policy "members read own stores" on public.stores
  for select to authenticated using (public.is_store_member(id));
create policy "seller reads own store memberships" on public.store_memberships
  for select to authenticated using (user_id = auth.uid());

create policy "public reads active categories in published stores" on public.categories
  for select to anon, authenticated using (is_active and public.is_store_published(store_id));
create policy "store members manage categories" on public.categories
  for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "public reads active products in published stores" on public.products
  for select to anon, authenticated using (is_active and public.is_store_published(store_id));
create policy "store members manage products" on public.products
  for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "public reads variants for active products in published stores" on public.product_variants
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_variants.product_id and p.store_id = product_variants.store_id and p.is_active and public.is_store_published(product_variants.store_id))
  );
create policy "store members manage variants" on public.product_variants
  for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "public reads images for active products in published stores" on public.product_images
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_images.product_id and p.store_id = product_images.store_id and p.is_active and public.is_store_published(product_images.store_id))
  );
create policy "store members manage images" on public.product_images
  for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "public reads availability for active products in published stores" on public.product_availability
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_availability.product_id and p.store_id = product_availability.store_id and p.is_active and public.is_store_published(product_availability.store_id))
  );
create policy "store members manage availability" on public.product_availability
  for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "public reads settings for published stores" on public.business_settings
  for select to anon, authenticated using (public.is_store_published(store_id));
create policy "store members manage settings" on public.business_settings
  for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "store members read orders" on public.order_requests
  for select to authenticated using (public.is_store_admin(store_id));
create policy "store members update orders" on public.order_requests
  for update to authenticated using (public.is_store_admin(store_id)) with check (public.is_store_admin(store_id));
create policy "store members read order items" on public.order_request_items
  for select to authenticated using (public.is_store_admin(store_id));

drop policy if exists "seller uploads Catalove product images" on storage.objects;
drop policy if exists "seller updates Catalove product images" on storage.objects;
drop policy if exists "seller deletes Catalove product images" on storage.objects;

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
      join public.order_requests o on o.store_id = i.store_id and o.id = i.order_request_id
      where i.store_id = p.store_id
        and i.product_id = p_product_id
        and o.requested_date = p_requested_date
        and o.status <> 'cancelled'
    ), 0)
  from public.products p
  left join public.product_availability a
    on a.store_id = p.store_id and a.product_id = p.id and a.availability_date = p_requested_date
  where p.id = p_product_id
    and p.is_active
    and (public.is_store_published(p.store_id) or public.is_store_member(p.store_id));
$$;
revoke all on function public.get_product_availability(text, date) from public;
grant execute on function public.get_product_availability(text, date) to anon, authenticated;
