import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const migrationDir = join(process.cwd(), "supabase/migrations");
const migrationFiles = readdirSync(migrationDir).filter((file) => file.endsWith(".sql")).sort();
assert.deepEqual(
  migrationFiles,
  ["202610290001_catalove_core.sql"],
  "a clean Catalove database runs only the Catalove-owned bootstrap migration"
);

const migration = readFileSync(join(migrationDir, migrationFiles[0]), "utf8");
const supabaseServer = readFileSync(join(process.cwd(), "src/lib/supabase/server.ts"), "utf8");
const uploadRoute = readFileSync(join(process.cwd(), "src/app/api/upload/route.ts"), "utf8");
const availabilityService = readFileSync(join(process.cwd(), "src/lib/services/availability-service.ts"), "utf8");
const orderService = readFileSync(join(process.cwd(), "src/lib/services/order-service.ts"), "utf8");
const cartDrawer = readFileSync(join(process.cwd(), "src/components/storefront/CartDrawer.tsx"), "utf8");
assert.match(migration, /create table if not exists public\.seller_users/i);
assert.match(migration, /create or replace function public\.is_catalove_seller/i);
assert.match(migration, /create or replace function public\.submit_order_request/i);
assert.match(migration, /create or replace function public\.submit_cart_order/i);
assert.match(migration, /create or replace function public\.get_product_availability/i);
assert.doesNotMatch(
  migration,
  /create policy[^;]+for all[^;]+using\s*\(true\)/i,
  "anonymous users must not receive unconditional table write policies"
);
assert.match(migration, /create policy[^;]+for select to anon/i);
assert.match(migration, /create policy[^;]+for all to authenticated/i);
assert.match(migration, /catalove-product-images/);
assert.doesNotMatch(migration, /sofizcake|cake-images/i);
assert.match(supabaseServer, /import "server-only"/);
assert.doesNotMatch(supabaseServer, /SUPABASE_SERVICE_ROLE_KEY\s*\|\|/);
assert.match(uploadRoute, /catalove-product-images/);
assert.doesNotMatch(uploadRoute, /cake-images/);
assert.match(availabilityService, /\.rpc\("get_product_availability"/);
assert.doesNotMatch(availabilityService, /\.from\("order_request_items"\)/);
assert.match(orderService, /\.rpc\("submit_cart_order"/);
assert.match(cartDrawer, /if \(orderRes\.error\)/);

console.log("✅ Catalove database isolation and policy checks passed!");
