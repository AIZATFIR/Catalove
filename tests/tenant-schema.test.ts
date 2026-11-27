import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migrationFiles = readdirSync(join(root, "supabase/migrations")).filter((file) => file.endsWith(".sql")).sort();
assert.deepEqual(migrationFiles, [
  "202610290001_catalove_core.sql",
  "202611250001_catalog_image_limits.sql",
  "202611260001_store_tenants.sql",
  "202611260002_seed_catalove_demo_catalog.sql",
  "202611270001_unbranded_demo_fragrance.sql",
  "202611280001_external_checkout_links.sql",
]);
const migration = readFileSync(join(root, "supabase/migrations/202611260001_store_tenants.sql"), "utf8");
const demoMigration = readFileSync(join(root, "supabase/migrations/202611260002_seed_catalove_demo_catalog.sql"), "utf8");
const externalCheckoutMigration = readFileSync(join(root, "supabase/migrations/202611280001_external_checkout_links.sql"), "utf8");
const uploadRoute = readFileSync(join(root, "src/app/api/upload/route.ts"), "utf8");
const settingsRoute = readFileSync(join(root, "src/app/api/settings/route.ts"), "utf8");
const productRoute = readFileSync(join(root, "src/app/api/products/route.ts"), "utf8");

assert.match(migration, /create table if not exists public\.stores/i);
assert.match(migration, /insert into public\.stores[\s\S]*'catalove'/i, "the current catalog is backfilled into a stable first tenant");
assert.match(migration, /create table if not exists public\.store_memberships/i);
assert.match(migration, /create or replace function public\.is_store_member\(p_store_id uuid\)/i);
assert.match(migration, /create or replace function public\.bind_order_item_to_store\(\)/i);
assert.match(migration, /keranjang tidak boleh memuat produk dari toko berbeda/i);
for (const table of ["categories", "products", "product_variants", "product_images", "product_availability", "business_settings", "order_requests", "order_request_items"]) {
  assert.match(migration, new RegExp(`alter table public\\.${table}[\\s\\S]*?store_id uuid`, "i"), `${table} must be tenant-owned`);
}
assert.match(migration, /unique\s*\(store_id,\s*slug\)/i, "catalog slugs are unique per tenant, not globally");
assert.match(migration, /primary key\s*\(store_id\)/i, "business settings permit one row per store");
assert.match(migration, /create policy[\s\S]*is_store_member\(store_id\)/i, "seller access is membership-scoped");
assert.match(migration, /public reads active products in published stores[\s\S]*for select to anon, authenticated/i, "signed-in shoppers can still browse public catalogs");
assert.match(migration, /o\.name like 'stores\/' \|\| p_store_id::text \|\| '\/products\/%'/i, "storage usage is counted in store namespaces");
assert.match(migration, /create or replace function public\.reserve_store_image_upload/i, "image quota reservations are serialized per store");
assert.match(migration, /pg_advisory_xact_lock\(hashtextextended\(p_store_id::text, 0\)\)/i, "parallel uploads cannot overbook the storage quota");
assert.match(migration, /pg_advisory_xact_lock\(hashtextextended\(new\.store_id::text \|\| ':' \|\| tg_table_name, 0\)\)/i, "parallel catalog inserts cannot exceed product or image count caps");
assert.match(migration, /grant execute on function public\.reserve_store_image_upload\(uuid, uuid, bigint\) to service_role/i);
assert.match(migration, /grant execute on function public\.release_store_image_upload\(uuid, uuid\) to service_role/i);
assert.doesNotMatch(migration, /create policy[^;]*on storage\.objects[\s\S]*?for (?:insert|update|delete|all) to authenticated/i, "authenticated clients cannot bypass server-enforced storage quotas");
assert.match(uploadRoute, /reserve_store_image_upload/);
assert.match(settingsRoute, /store\.plan === "free" \? "Powered by Catalove"/);
assert.match(uploadRoute, /release_store_image_upload/);
assert.match(uploadRoute, /session\.storeId[\s\S]*?session\.id[\s\S]*?bytes\.byteLength/);
assert.match(uploadRoute, /export async function DELETE/);
assert.match(productRoute, /ProductInputSchema\.safeParse/);
assert.match(productRoute, /deleteUnreferencedStoreImage/);
assert.match(externalCheckoutMigration, /add column external_checkout_url text/i);
assert.match(externalCheckoutMigration, /external_checkout_url ~\* '\^https:\/\//i);
assert.doesNotMatch(migration, /for all to authenticated using \(public\.is_catalove_seller\(\)\)/i, "legacy global seller policy must not survive");
assert.match(migration, /for select to authenticated using \(public\.is_store_admin\(store_id\)\)/i, "order data is limited to store admins");
assert.match(demoMigration, /Sample 01 — Apparel/);
assert.match(demoMigration, /on conflict \(id\) do nothing/i, "demo seeding preserves existing merchant records");
assert.match(demoMigration, /images\.unsplash\.com/);

console.log("✅ Catalove tenant schema checks passed");
