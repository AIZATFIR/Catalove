-- Run against a disposable database after applying all Catalove migrations.
begin;

insert into auth.users (id, raw_app_meta_data)
values
  ('20000000-0000-4000-8000-000000000001', '{}'::jsonb),
  ('20000000-0000-4000-8000-000000000002', '{}'::jsonb),
  ('20000000-0000-4000-8000-000000000003', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.stores (id, slug, name, status)
values
  ('10000000-0000-4000-8000-000000000002', 'tenant-a-test', 'Tenant A Test', 'published'),
  ('10000000-0000-4000-8000-000000000003', 'tenant-b-test', 'Tenant B Test', 'published'),
  ('10000000-0000-4000-8000-000000000004', 'tenant-draft-test', 'Draft Test', 'draft');
insert into public.store_memberships (store_id, user_id, role)
values
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'owner'),
  ('10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'owner');

insert into public.products (id, store_id, name, slug, base_price, is_active)
values
  ('tenant-a-product', '10000000-0000-4000-8000-000000000002', 'Tenant A Product', 'same-slug', 1000, true),
  ('tenant-b-product', '10000000-0000-4000-8000-000000000003', 'Tenant B Product', 'same-slug', 2000, true),
  ('tenant-b-hidden-product', '10000000-0000-4000-8000-000000000003', 'Hidden B Product', 'hidden-product', 2000, false),
  ('tenant-draft-product', '10000000-0000-4000-8000-000000000004', 'Draft Product', 'draft-product', 3000, true);
insert into public.business_settings (id, store_id, store_name, seller_whatsapp)
values
  (true, '10000000-0000-4000-8000-000000000002', 'Tenant A Test', '628111111111'),
  (true, '10000000-0000-4000-8000-000000000003', 'Tenant B Test', '628222222222');
insert into public.order_requests (id, store_id, reference_code, customer_name, customer_whatsapp, requested_date, subtotal)
values
  ('order-tenant-a', '10000000-0000-4000-8000-000000000002', '#TEST-A', 'A Customer', '628111111111', current_date, 1000),
  ('order-tenant-b', '10000000-0000-4000-8000-000000000003', '#TEST-B', 'B Customer', '628222222222', current_date, 2000);
insert into public.product_availability (store_id, product_id, availability_date, status)
values ('10000000-0000-4000-8000-000000000002', 'tenant-a-product', current_date, 'sold_out');

do $$
begin
  begin
    perform public.submit_order_request_for_store(
      'tenant-a-test', 'tenant-b-product', null, 'A Customer', '628111111111',
      current_date, 'pickup', 1, null, null, null, 0, null
    );
    raise exception 'single-item order crossed storefront boundary';
  exception when others then
    if sqlerrm = 'single-item order crossed storefront boundary' then raise; end if;
    if sqlerrm <> 'Produk tidak tersedia di katalog ini' then raise; end if;
  end;

  begin
    perform public.submit_cart_order_for_store(
      'tenant-a-test', 'A Customer', '628111111111', 'pickup', null, null,
      '[{"productId":"tenant-a-product","quantity":1},{"productId":"tenant-b-product","quantity":1}]'::jsonb,
      null
    );
    raise exception 'cart order crossed storefront boundary';
  exception when others then
    if sqlerrm = 'cart order crossed storefront boundary' then raise; end if;
    if sqlerrm <> 'Produk tidak tersedia di katalog ini' then raise; end if;
  end;

  if has_function_privilege('anon', 'public.submit_order_request(text,text,text,text,date,text,integer,text,text,text,integer,text)', 'EXECUTE') then
    raise exception 'legacy single-item order RPC remains public';
  end if;
  if has_function_privilege('anon', 'public.submit_cart_order(text,text,text,text,text,jsonb,text)', 'EXECUTE') then
    raise exception 'legacy cart order RPC remains public';
  end if;
end;
$$;

-- A public order RPC may start with the legacy default, then the first item binds it to its tenant.
insert into public.order_requests (id, reference_code, customer_name, customer_whatsapp, requested_date, subtotal)
values ('order-trigger-test', '#TEST-BIND', 'B Customer', '628222222222', current_date, 2000);
insert into public.order_request_items (id, order_request_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, subtotal_snapshot)
values ('item-trigger-test', 'order-trigger-test', 'tenant-b-product', 'Tenant B Product', 2000, 1, 2000);
do $$
begin
  if (select store_id from public.order_requests where id = 'order-trigger-test') <> '10000000-0000-4000-8000-000000000003'::uuid then
    raise exception 'order store was not bound to its first product';
  end if;
  begin
    insert into public.order_request_items (id, order_request_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, subtotal_snapshot)
    values ('item-mixed-test', 'order-trigger-test', 'tenant-a-product', 'Tenant A Product', 1000, 1, 1000);
    raise exception 'mixed-store order unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'mixed-store order unexpectedly succeeded' then raise; end if;
    if sqlerrm <> 'Keranjang tidak boleh memuat produk dari toko berbeda' then raise; end if;
  end;
end;
$$;

grant select, insert, update, delete on storage.objects to authenticated;
grant usage on schema storage to authenticated;
alter table storage.objects enable row level security;
set local role anon;
do $$
begin
  if (select count(*) from public.products where id in ('tenant-a-product', 'tenant-b-product')) <> 2 then
    raise exception 'published public catalogs should be readable';
  end if;
  if exists (select 1 from public.products where id = 'tenant-draft-product') then
    raise exception 'draft store product leaked to anonymous visitor';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000003';
do $$
begin
  if (select count(*) from public.products where id in ('tenant-a-product', 'tenant-b-product')) <> 2 then
    raise exception 'authenticated public shopper cannot browse published catalogs';
  end if;
  if exists (select 1 from public.products where id = 'tenant-draft-product') then
    raise exception 'authenticated public shopper can see a draft store';
  end if;
end;
$$;

set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000001';
do $$
declare
  affected integer;
begin
  if (select count(*) from public.products where id = 'tenant-a-product') <> 1 then
    raise exception 'store owner cannot read own catalog';
  end if;
  if (select count(*) from public.products where id = 'tenant-b-product') <> 1 then
    raise exception 'published public product should remain visible';
  end if;
  if exists (select 1 from public.products where id = 'tenant-b-hidden-product') then
    raise exception 'store owner can read another tenant private product';
  end if;
  if exists (select 1 from public.order_requests where id = 'order-tenant-b') then
    raise exception 'store owner can read another tenant order';
  end if;
  if (select count(*) from public.business_settings where store_id = '10000000-0000-4000-8000-000000000003') <> 1 then
    raise exception 'public storefront settings should remain visible';
  end if;
  update public.products set name = 'tampered' where id = 'tenant-b-product';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'store owner changed another tenant product'; end if;
  update public.business_settings set store_name = 'tampered' where store_id = '10000000-0000-4000-8000-000000000003';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'store owner changed another tenant settings'; end if;
  begin
    insert into storage.objects (bucket_id, name) values ('catalove-product-images', 'stores/10000000-0000-4000-8000-000000000002/products/own.webp');
    raise exception 'direct authenticated upload unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set local role service_role;
do $$
declare
  reservation uuid;
  n integer;
begin
  for n in 1..50 loop
    reservation := public.reserve_store_image_upload(
      '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 100
    );
  end loop;
  begin
    perform public.reserve_store_image_upload(
      '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 100
    );
    raise exception 'image count quota unexpectedly allowed upload 51';
  exception when others then
    if sqlerrm = 'image count quota unexpectedly allowed upload 51' then raise; end if;
    if sqlerrm <> 'Penyimpanan foto katalog mencapai batas paket' then raise; end if;
  end;
end;
$$;

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000003';
do $$
declare result jsonb;
begin
  result := public.create_store_for_current_user('New Client', 'new-client');
  if result->>'status' <> 'draft' then raise exception 'new client store should start as draft'; end if;
  if not exists (
    select 1 from public.store_memberships m join public.stores s on s.id = m.store_id
    where m.user_id = auth.uid() and s.slug = 'new-client' and m.role = 'owner'
  ) then raise exception 'new client owner membership was not created'; end if;
  if not exists (
    select 1 from public.business_settings b join public.stores s on s.id = b.store_id where s.slug = 'new-client'
  ) then raise exception 'new client starter settings were not created'; end if;
  begin
    perform public.create_store_for_current_user('Second Client', 'second-client');
    raise exception 'account unexpectedly created a second free store';
  exception when others then
    if sqlerrm = 'account unexpectedly created a second free store' then raise; end if;
    if sqlerrm not like 'Satu akun dapat memiliki satu katalog gratis%' then raise; end if;
  end;
end;
$$;

rollback;
