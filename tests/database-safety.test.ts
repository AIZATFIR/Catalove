import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const migrationDir = join(process.cwd(), "supabase/migrations");
const migrationFiles = readdirSync(migrationDir).filter((file) => file.endsWith(".sql")).sort();
assert.deepEqual(
  migrationFiles,
  [
    "202610290001_catalove_core.sql",
    "202611250001_catalog_image_limits.sql",
    "202611260001_store_tenants.sql",
    "202611260002_seed_catalove_demo_catalog.sql",
  ],
  "a clean Catalove database runs only Catalove-owned migrations"
);

const migration = readFileSync(join(migrationDir, migrationFiles[0]), "utf8");
const dockerfile = readFileSync(join(process.cwd(), "Dockerfile"), "utf8");
const cloudBuild = readFileSync(join(process.cwd(), "cloudbuild.yaml"), "utf8");
const supabaseServer = readFileSync(join(process.cwd(), "src/lib/supabase/server.ts"), "utf8");
const uploadRoute = readFileSync(join(process.cwd(), "src/app/api/upload/route.ts"), "utf8");
const imageLimitsMigration = readFileSync(join(migrationDir, "202611250001_catalog_image_limits.sql"), "utf8");
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
assert.match(dockerfile, /env -u NEXT_PUBLIC_SUPABASE_URL[\s\S]*?npm test/, "tests must not use build-time Supabase credentials");
assert.match(dockerfile, /NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF="\$NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF"[\s\\]*npm run build/);
assert.match(cloudBuild, /--update-env-vars=NEXT_PUBLIC_SUPABASE_URL=\$\{_SUPABASE_URL\}[^\n]+NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF=\$\{_SUPABASE_PROJECT_REF\}/);
assert.match(cloudBuild, /--startup-probe=httpGet\.path=\/api\/health,httpGet\.port=8080/);
assert.match(supabaseServer, /import "server-only"/);
assert.doesNotMatch(supabaseServer, /SUPABASE_SERVICE_ROLE_KEY\s*\|\|/);
assert.match(uploadRoute, /catalove-product-images/);
assert.match(uploadRoute, /validateImageUpload/);
assert.match(uploadRoute, /stores\/\$\{session\.storeId\}\/products/);
assert.doesNotMatch(uploadRoute, /local-base64-fallback|dataUrl|data:image\/|mode:\s*"local"/i);
assert.match(uploadRoute, /status: 503/);
assert.match(uploadRoute, /status: 502/);
assert.match(uploadRoute, /success: true[\s\S]*mode: "supabase-storage"/);
assert.match(imageLimitsMigration, /file_size_limit\s*=\s*2097152/i);
assert.doesNotMatch(uploadRoute, /cake-images/);
assert.match(availabilityService, /\.rpc\("get_product_availability"/);
assert.doesNotMatch(availabilityService, /\.from\("order_request_items"\)/);
assert.match(orderService, /\.rpc\("submit_cart_order_for_store"/);
assert.match(cartDrawer, /if \(orderRes\.error\)/);

console.log("✅ Catalove database isolation and policy checks passed!");
