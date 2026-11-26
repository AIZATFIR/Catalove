import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const orderPage = readFileSync(join(root, "src/app/(storefront)/order/[reference]/page.tsx"), "utf8");
const orderRoute = readFileSync(join(root, "src/app/api/orders/route.ts"), "utf8");
const orderService = readFileSync(join(root, "src/lib/services/order-service.ts"), "utf8");

assert.match(orderPage, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
assert.match(orderRoute, /NextResponse\.json\(\{ order \},\s*\{\s*headers:\s*\{\s*"Cache-Control":\s*"private, no-store"/);
assert.match(orderService, /\.eq\("reference_code",\s*referenceCode\)[\s\S]*?\.eq\("store_id",\s*storeId\)/);

console.log("✅ Customer order references remain private, uncached, and store-scoped");
