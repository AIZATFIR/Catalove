-- Populate the Catalove-owned showcase catalog on a fresh dedicated project.
-- Existing merchant data is left intact; these are Catalove demo products only.
insert into public.categories (id, store_id, name, slug, display_order, is_active)
values
  ('cat-lifestyle-signature', '00000000-0000-4000-8000-000000000001', 'Signature', 'signature', 1, true),
  ('cat-lifestyle-apparel', '00000000-0000-4000-8000-000000000001', 'Apparel', 'apparel', 2, true),
  ('cat-lifestyle-objects', '00000000-0000-4000-8000-000000000001', 'Objects', 'objects', 3, true),
  ('cat-lifestyle-hampers', '00000000-0000-4000-8000-000000000001', 'Packaging', 'packaging', 4, true)
on conflict (id) do nothing;

insert into public.products (
  id, store_id, category_id, name, slug, tagline, description, specs, flavor_notes,
  base_price, compare_at_price, badge, is_active, is_featured, display_order,
  minimum_lead_time_days
)
values
  (
    'prod-gen-1', '00000000-0000-4000-8000-000000000001', 'cat-lifestyle-apparel',
    'Sample 01 — Apparel', 'sample-01-apparel', 'Contoh slot fashion & lookbook',
    'Slot foto default untuk produk fashion brand Anda. Foto, harga, dan varian bisa langsung diganti.',
    '[{"label":"Slot","value":"Apparel / Lookbook"},{"label":"Custom","value":"Foto, Harga & Varian"}]',
    '["Template Slot","Varian Ukuran"]', 249000, null, 'Sample', true, true, 1, 0
  ),
  (
    'prod-gen-2', '00000000-0000-4000-8000-000000000001', 'cat-lifestyle-objects',
    'Sample 02 — Object', 'sample-02-object', 'Contoh slot home & craft',
    'Contoh tampilan produk fisik minimalis dengan galeri detail dan varian warna.',
    '[{"label":"Slot","value":"Home & Craft"},{"label":"Order","value":"WhatsApp Direct"}]',
    '["Template Slot","Multi Foto"]', 185000, null, 'Sample', true, true, 2, 0
  ),
  (
    'prod-gen-3', '00000000-0000-4000-8000-000000000001', 'cat-lifestyle-signature',
    'Sample 03 — Fragrance', 'sample-03-fragrance', 'Contoh slot beauty & skincare',
    'Template halaman produk untuk parfum, skincare, atau beauty brand.',
    '[{"label":"Slot","value":"Beauty & Scent"},{"label":"Promo","value":"Coret Harga"}]',
    '["Template Slot","Clean Photo"]', 295000, 350000, 'Template', true, true, 3, 0
  ),
  (
    'prod-gen-4', '00000000-0000-4000-8000-000000000001', 'cat-lifestyle-apparel',
    'Sample 04 — Carry', 'sample-04-carry', 'Contoh slot tas & aksesoris',
    'Slot katalog untuk tas, dompet, atau aksesoris harian brand Anda.',
    '[{"label":"Slot","value":"Bags & Carry"},{"label":"Layout","value":"Masonry & Snap"}]',
    '["Template Slot","Bag & Gear"]', 320000, null, 'Sample', true, true, 4, 0
  ),
  (
    'prod-gen-5', '00000000-0000-4000-8000-000000000001', 'cat-lifestyle-signature',
    'Sample 05 — Footwear', 'sample-05-footwear', 'Contoh slot sepatu & fashion',
    'Preview kartu produk rasio vertikal yang cocok untuk lookbook sepatu dan apparel.',
    '[{"label":"Slot","value":"Footwear"},{"label":"Checkout","value":"Cart & WA"}]',
    '["Template Slot","Size Selector"]', 425000, null, 'Sample', true, false, 5, 0
  ),
  (
    'prod-gen-6', '00000000-0000-4000-8000-000000000001', 'cat-lifestyle-hampers',
    'Sample 06 — Custom Brand', 'sample-06-custom-brand', 'Contoh slot bundling & gift set',
    'Pesan website Catalove ini untuk brand Anda sendiri lengkap dengan domain, warna, dan katalog.',
    '[{"label":"Paket","value":"Catalove Web"},{"label":"Kontak","value":"+6285946689168"}]',
    '["Template Web","Siap Pakai"]', 499000, 699000, 'Template', true, true, 6, 1
  )
on conflict (id) do nothing;

insert into public.product_variants (id, store_id, product_id, name, price, is_default, display_order)
values
  ('v-gen-1', '00000000-0000-4000-8000-000000000001', 'prod-gen-1', 'M', 249000, true, 1),
  ('v-gen-2', '00000000-0000-4000-8000-000000000001', 'prod-gen-1', 'L', 249000, false, 2),
  ('v-gen-3', '00000000-0000-4000-8000-000000000001', 'prod-gen-2', 'Matte', 185000, true, 1),
  ('v-gen-4', '00000000-0000-4000-8000-000000000001', 'prod-gen-2', 'Sand', 185000, false, 2),
  ('v-gen-5', '00000000-0000-4000-8000-000000000001', 'prod-gen-3', '50 ml', 295000, true, 1),
  ('v-gen-6', '00000000-0000-4000-8000-000000000001', 'prod-gen-3', '100 ml', 450000, false, 2),
  ('v-gen-7', '00000000-0000-4000-8000-000000000001', 'prod-gen-4', 'Natural', 320000, true, 1),
  ('v-gen-8', '00000000-0000-4000-8000-000000000001', 'prod-gen-4', 'Black', 335000, false, 2),
  ('v-gen-9', '00000000-0000-4000-8000-000000000001', 'prod-gen-5', '41', 425000, true, 1),
  ('v-gen-10', '00000000-0000-4000-8000-000000000001', 'prod-gen-5', '42', 425000, false, 2),
  ('v-gen-11', '00000000-0000-4000-8000-000000000001', 'prod-gen-6', 'Starter Web', 499000, true, 1),
  ('v-gen-12', '00000000-0000-4000-8000-000000000001', 'prod-gen-6', 'Full Custom', 899000, false, 2)
on conflict (id) do nothing;

insert into public.product_images (id, store_id, product_id, storage_path, alt_text, display_order, is_primary)
values
  ('img-gen-1a', '00000000-0000-4000-8000-000000000001', 'prod-gen-1', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1000&q=80', 'Sample 01 Apparel', 1, true),
  ('img-gen-1b', '00000000-0000-4000-8000-000000000001', 'prod-gen-1', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80', 'Sample 01 Apparel Lookbook', 2, false),
  ('img-gen-2a', '00000000-0000-4000-8000-000000000001', 'prod-gen-2', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80', 'Sample 02 Object', 1, true),
  ('img-gen-2b', '00000000-0000-4000-8000-000000000001', 'prod-gen-2', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80', 'Sample 02 Object Detail', 2, false),
  ('img-gen-3a', '00000000-0000-4000-8000-000000000001', 'prod-gen-3', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1000&q=80', 'Sample 03 Fragrance', 1, true),
  ('img-gen-3b', '00000000-0000-4000-8000-000000000001', 'prod-gen-3', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1000&q=80', 'Sample 03 Bottle', 2, false),
  ('img-gen-4a', '00000000-0000-4000-8000-000000000001', 'prod-gen-4', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80', 'Sample 04 Carry', 1, true),
  ('img-gen-4b', '00000000-0000-4000-8000-000000000001', 'prod-gen-4', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=80', 'Sample 04 Carry Detail', 2, false),
  ('img-gen-5a', '00000000-0000-4000-8000-000000000001', 'prod-gen-5', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=80', 'Sample 05 Footwear', 1, true),
  ('img-gen-6a', '00000000-0000-4000-8000-000000000001', 'prod-gen-6', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80', 'Sample 06 Custom Brand Packaging', 1, true)
on conflict (id) do nothing;
