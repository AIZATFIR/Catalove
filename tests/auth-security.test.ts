import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { AuthService } from "../src/lib/services/auth-service";
import { isSellerUser, verifyServerSession } from "../src/lib/services/server-auth";
import { GET as getProducts } from "../src/app/api/products/route";
import { GET as getSellerSession } from "../src/app/api/auth/session/route";
import { getSafeAdminRedirectPath } from "../src/lib/utils/safe-admin-redirect";

const middlewareSource = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");
assert.match(middlewareSource, /from\("store_memberships"\)[\s\S]*?\.limit\(1\)[\s\S]*?membershipError\s*\|\|\s*!membership/);
const loginPageSource = readFileSync(join(process.cwd(), "src/app/(admin)/admin/login/page.tsx"), "utf8");
assert.match(loginPageSource, /getSafeAdminRedirectPath\(searchParams\.get\("next"\)\)/);
assert.equal(getSafeAdminRedirectPath("/admin/products?tab=active#list"), "/admin/products?tab=active#list");
for (const target of ["https://attacker.example", "//attacker.example", "/admin/..//attacker.example", "/admin/login", "/admin/register", "javascript:alert(1)", "/\\attacker.example"]) {
  assert.equal(getSafeAdminRedirectPath(target), "/admin", `unsafe login redirect ${target} must be rejected`);
}

async function main() {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const verifyWithLegacyCookie = verifyServerSession as unknown as (
      cookie: string
    ) => Promise<unknown>;
    assert.equal(
      await verifyWithLegacyCookie("demo_seller_session_valid"),
      null,
      "the former static owner cookie must not authorize a seller session"
    );
    assert.equal(await isSellerUser("attacker"), false, "missing auth configuration must fail closed");
    assert.equal((await getSellerSession()).status, 401, "the session endpoint must reject unauthenticated users");

    const privateProducts = await getProducts(
      new NextRequest("http://localhost/api/products?includeInactive=true")
    );
    assert.equal(privateProducts.status, 401, "inactive catalog data must require a seller session");

    const auth = new AuthService();
    for (const password of ["catalove2026", "sofizcake2026", "admin", "123456"]) {
      const result = await auth.login(password, "attacker@example.com");
      assert.equal(result.success, false, `demo password ${password} must not grant admin access`);
    }

    console.log("✅ Static demo credentials are rejected");
  } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  }
}

void main();
