-- Apply after the core/image migrations and before store_tenants to prove backfill.
insert into auth.users (id, raw_app_meta_data)
values ('30000000-0000-4000-8000-000000000001', '{"role":"seller"}'::jsonb);
insert into public.seller_users (user_id, is_active)
values ('30000000-0000-4000-8000-000000000001', true);
insert into public.categories (id, name, slug) values ('legacy-category', 'Legacy', 'legacy');
insert into public.products (id, category_id, name, slug, base_price)
values ('legacy-product', 'legacy-category', 'Legacy Product', 'legacy-product', 15000);
insert into public.product_variants (id, product_id, name, price)
values ('legacy-variant', 'legacy-product', 'Regular', 15000);
insert into public.product_images (id, product_id, storage_path, alt_text)
values ('legacy-image', 'legacy-product', 'users/old-owner/products/legacy.webp', 'Legacy image');
insert into public.product_availability (id, product_id, availability_date, status)
values ('legacy-availability', 'legacy-product', current_date, 'available');
insert into public.order_requests (
  id, reference_code, customer_name, customer_whatsapp, requested_date, subtotal
) values (
  'legacy-order', '#LEGACY-TEST', 'Legacy Customer', '6281234567890', current_date, 15000
);
insert into public.order_request_items (
  id, order_request_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, subtotal_snapshot
) values (
  'legacy-item', 'legacy-order', 'legacy-product', 'Legacy Product', 15000, 1, 15000
);
