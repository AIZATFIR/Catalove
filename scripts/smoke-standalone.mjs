import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 3179;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["scripts/start-standalone.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    SUPABASE_SERVICE_ROLE_KEY: "",
    NEXT_PUBLIC_SUPABASE_URL: "https://catalove-ci.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "ci-placeholder-anon-key-not-a-secret",
    NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF: "catalove-ci",
  },
  stdio: "ignore",
});

try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Standalone server exited early (${server.exitCode})`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Wait for the standalone process to bind its port.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.equal(ready, true, "standalone server must become ready");

  for (const route of ["/", "/catalog", "/admin/login", "/privacy", "/contact"]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, `${route} must render successfully`);
    const html = await response.text();
    if (route === "/") {
      const cssPath = html.match(/(?:href|content)="([^\"]*\/_next\/static\/css\/[^\"]+\.css[^\"]*)"/)?.[1];
      assert.ok(cssPath, "homepage must reference a production CSS asset");
      const cssResponse = await fetch(new URL(cssPath, baseUrl));
      assert.equal(cssResponse.status, 200, "standalone server must serve production CSS assets");
      assert.match(cssResponse.headers.get("content-type") || "", /text\/css/i);
    }
  }

  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 503, "the service must fail readiness without a runtime service key");
  assert.deepEqual(await health.json(), { status: "unavailable" });

  console.log("✅ Standalone storefront, admin, privacy, contact, CSS, and health smoke checks passed");
} finally {
  server.kill("SIGTERM");
}
