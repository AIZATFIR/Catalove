import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migration = readFileSync(join(root, "supabase/migrations/202611260001_store_tenants.sql"), "utf8");
const service = readFileSync(join(root, "src/lib/services/order-service.ts"), "utf8");
const orderRoute = readFileSync(join(root, "src/app/api/orders/route.ts"), "utf8");
const sqlIsolationTest = readFileSync(join(root, "supabase/tests/store_isolation.sql"), "utf8");
const cartOrderWrapper = migration.match(/create or replace function public\.submit_cart_order_for_store[\s\S]*?\$\$;/i)?.[0] || "";

assert.match(migration, /create or replace function public\.submit_order_request_for_store\(/i);
assert.match(migration, /create or replace function public\.submit_cart_order_for_store\(/i);
assert.match(migration, /revoke all on function public\.submit_order_request\(/i);
assert.match(migration, /revoke all on function public\.submit_cart_order\(/i);
assert.match(service, /\.rpc\("submit_order_request_for_store"/);
assert.match(service, /\.rpc\("submit_cart_order_for_store"/);
assert.equal([...service.matchAll(/p_store_slug:\s*storeSlug/g)].length, 3);
assert.match(orderRoute, /orderService\.createOrder\(parseResult\.data, getStoreSlugFromRequest\(req\)\)/);
assert.match(sqlIsolationTest, /submit_order_request_for_store\(\s*'tenant-a-test'/);
assert.match(sqlIsolationTest, /submit_cart_order_for_store\(\s*'tenant-a-test'/);
assert.match(cartOrderWrapper, /select distinct[\s\S]*order by 1/i, "cart requests acquire product quota locks in a consistent order");
assert.match(cartOrderWrapper, /pg_advisory_xact_lock\(hashtext\(current_product_id\),\s*hashtext\(requested_order_date::text\)\)/i);

console.log("✅ Public checkout RPCs require and validate the active store");
