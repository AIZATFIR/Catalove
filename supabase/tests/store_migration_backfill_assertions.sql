do $$
declare
  demo_store constant uuid := '00000000-0000-4000-8000-000000000001';
begin
  if not exists (select 1 from public.stores where id = demo_store and slug = 'catalove' and status = 'published') then
    raise exception 'Catalove demo store was not created';
  end if;
  if not exists (select 1 from public.store_memberships where store_id = demo_store and user_id = '30000000-0000-4000-8000-000000000001') then
    raise exception 'existing seller was not migrated to store membership';
  end if;
  if not exists (select 1 from public.categories where id = 'legacy-category' and store_id = demo_store) then
    raise exception 'legacy category lost its tenant';
  end if;
  if not exists (select 1 from public.products where id = 'legacy-product' and store_id = demo_store and category_id = 'legacy-category') then
    raise exception 'legacy product or category relation was not preserved';
  end if;
  if not exists (select 1 from public.product_variants where id = 'legacy-variant' and store_id = demo_store) then
    raise exception 'legacy product variant was not backfilled';
  end if;
  if not exists (select 1 from public.product_images where id = 'legacy-image' and store_id = demo_store) then
    raise exception 'legacy image metadata was not backfilled';
  end if;
  if not exists (select 1 from public.product_availability where id = 'legacy-availability' and store_id = demo_store) then
    raise exception 'legacy availability was not backfilled';
  end if;
  if not exists (select 1 from public.business_settings where store_id = demo_store and id) then
    raise exception 'legacy settings row was not moved to the Catalove tenant key';
  end if;
  if not exists (select 1 from public.order_requests where id = 'legacy-order' and store_id = demo_store) then
    raise exception 'legacy order was not backfilled';
  end if;
  if not exists (select 1 from public.order_request_items where id = 'legacy-item' and store_id = demo_store) then
    raise exception 'legacy order item was not backfilled';
  end if;
end;
$$;
