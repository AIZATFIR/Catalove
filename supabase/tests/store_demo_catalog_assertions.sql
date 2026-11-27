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
