import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const accessHook = read("src/hooks/useStorefrontEditorAccess.ts");
const sessionRoute = read("src/app/api/auth/session/route.ts");
const navbar = read("src/components/storefront/Navbar.tsx");
const dock = read("src/components/storefront/LiveCustomizerDock.tsx");
const homepage = read("src/app/(storefront)/page.tsx");

assert.match(accessHook, /if \(!isTenantStorefrontPath\(pathname\)\)/);
assert.match(accessHook, /api\/auth\/session\?storeSlug=/);
assert.match(accessHook, /session\.storeSlug === storeSlug/);
assert.match(sessionRoute, /verifyServerSession\(getRequestedStoreSlug\(request\)\)/);
assert.match(navbar, /canEditStorefront &&/);
assert.match(dock, /if \(!canEditStorefront\) return null/);
assert.match(homepage, /requestedCanvasMode && canEditStorefront/);

console.log("✅ Merchant storefront editing controls require matching store membership");
