import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { StoreOnboardingSchema } from "../src/lib/validators/store";

assert.equal(StoreOnboardingSchema.safeParse({ name: "Kedai Bunga", slug: "kedai-bunga" }).success, true);
assert.equal(StoreOnboardingSchema.safeParse({ name: "X", slug: "x" }).success, false);
assert.equal(StoreOnboardingSchema.safeParse({ name: "Kedai", slug: "admin" }).success, false);
assert.equal(StoreOnboardingSchema.safeParse({ name: "Kedai", slug: "Kedai Bunga" }).success, false);
assert.equal(StoreOnboardingSchema.safeParse({ name: "Kedai", slug: "kedaibunga-" }).success, false);

const dashboard = readFileSync(join(process.cwd(), "src/app/(admin)/admin/page.tsx"), "utf8");
const exportRoute = readFileSync(join(process.cwd(), "src/app/api/stores/export/route.ts"), "utf8");
const tenantMigration = readFileSync(join(process.cwd(), "supabase/migrations/202611260001_store_tenants.sql"), "utf8");
const createStoreFunction = tenantMigration.match(/create or replace function public\.create_store_for_current_user[\s\S]*?\$\$;/i)?.[0] || "";
assert.match(dashboard, /withStoreSlug\("\/api\/stores"\)/, "admin dashboard loads the current tenant status");
assert.match(dashboard, /method:\s*"PATCH"[\s\S]*status/, "store owner can publish or pause the catalog");
assert.match(dashboard, /getStorefrontPath\("\/",\s*store\.slug\)/, "store preview points to the tenant URL");
assert.match(dashboard, /api\/stores\/export/, "store owner can download an export");
assert.match(exportRoute, /verifyServerSession/);
assert.match(exportRoute, /\.eq\("store_id",\s*session\.storeId\)/, "every exported dataset is scoped to the authenticated tenant");
assert.match(exportRoute, /Cache-Control.*private, no-store/i, "sensitive order exports are never cacheable");
assert.match(createStoreFunction, /pg_advisory_xact_lock\(hashtextextended\(owner_id::text,\s*0\)\)/i, "parallel signups for one account cannot bypass the one-free-store limit");

console.log("✅ Store onboarding validation checks passed");
