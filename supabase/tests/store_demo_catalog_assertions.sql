do $$
declare
  demo_store constant uuid := '00000000-0000-4000-8000-000000000001';
begin
  if (select count(*) from public.products where store_id = demo_store and is_active) < 6 then
    raise exception 'The fresh Catalove showcase must contain six active sample products';
  end if;
  if (select count(*) from public.product_images i join public.products p on p.id = i.product_id and p.store_id = i.store_id where i.store_id = demo_store and p.is_active) < 6 then
    raise exception 'Every active showcase product must have a demo image';
  end if;
  if (select count(*) from public.product_variants v join public.products p on p.id = v.product_id and p.store_id = v.store_id where v.store_id = demo_store and p.is_active) < 6 then
    raise exception 'Every active showcase product must have at least one variant';
  end if;
end;
$$;

do $$
declare
  demo_store constant uuid := '00000000-0000-4000-8000-000000000001';
  test_product text;
begin
  insert into public.products (store_id, name, slug, base_price, external_checkout_url, is_active)
  values (demo_store, 'External checkout test', 'external-checkout-test', 1000, 'https://pay.example.test/item', false)
  returning id into test_product;

  if (select external_checkout_url from public.products where id = test_product) <> 'https://pay.example.test/item' then
    raise exception 'A valid HTTPS seller checkout URL must be stored';
  end if;
  delete from public.products where id = test_product;

  begin
    insert into public.products (store_id, name, slug, base_price, external_checkout_url, is_active)
    values (demo_store, 'Insecure checkout test', 'insecure-checkout-test', 1000, 'http://pay.example.test/item', false);
    raise exception 'The database must reject insecure checkout URLs';
  exception when check_violation then
    null;
  end;
end;
$$;

do $$
declare
  demo_store constant uuid := '00000000-0000-4000-8000-000000000001';
begin
  if (select count(*)
      from public.product_images image
      join public.products product on product.id = image.product_id and product.store_id = image.store_id
      where image.store_id = demo_store
        and product.slug = 'sample-03-fragrance'
        and image.storage_path in ('/demo-assets/fragrance-sample.svg', '/demo-assets/fragrance-detail.svg')) <> 2 then
    raise exception 'The showcase fragrance sample must use two original, unbranded illustrations';
  end if;
end;
$$;
