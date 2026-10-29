-- ==============================================================================
-- SofizCake RLS Fix: Allow Catalog & Product CRUD without permission errors
-- Run this in Supabase SQL Editor if you encounter "violates row-level security policy"
-- ==============================================================================

-- 1. Categories
drop policy if exists "public reads active categories" on public.categories;
drop policy if exists "seller manages categories" on public.categories;
drop policy if exists "allow all access to categories" on public.categories;
create policy "allow all access to categories" on public.categories
  for all to anon, authenticated using (true) with check (true);

-- 2. Products
drop policy if exists "public reads active products" on public.products;
drop policy if exists "seller manages products" on public.products;
drop policy if exists "allow all access to products" on public.products;
create policy "allow all access to products" on public.products
  for all to anon, authenticated using (true) with check (true);

-- 3. Product Variants
drop policy if exists "public reads variants for active products" on public.product_variants;
drop policy if exists "seller manages variants" on public.product_variants;
drop policy if exists "allow all access to variants" on public.product_variants;
create policy "allow all access to variants" on public.product_variants
  for all to anon, authenticated using (true) with check (true);

-- 4. Product Images
drop policy if exists "public reads images for active products" on public.product_images;
drop policy if exists "seller manages images" on public.product_images;
drop policy if exists "allow all access to images" on public.product_images;
create policy "allow all access to images" on public.product_images
  for all to anon, authenticated using (true) with check (true);

-- 5. Product Availability
drop policy if exists "public reads availability for active products" on public.product_availability;
drop policy if exists "seller manages availability" on public.product_availability;
drop policy if exists "allow all access to availability" on public.product_availability;
create policy "allow all access to availability" on public.product_availability
  for all to anon, authenticated using (true) with check (true);

-- 6. Business Settings
drop policy if exists "seller manages business settings" on public.business_settings;
drop policy if exists "public reads business settings" on public.business_settings;
drop policy if exists "allow all access to business settings" on public.business_settings;
create policy "allow all access to business settings" on public.business_settings
  for all to anon, authenticated using (true) with check (true);

-- Grant full table permissions to anon & authenticated
grant select, insert, update, delete on public.categories, public.products, public.product_variants,
  public.product_images, public.product_availability, public.business_settings to anon, authenticated;
