import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GET as getHealth } from "../src/app/api/health/route";

const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
const previous = new Map(keys.map((key) => [key, process.env[key]]));
for (const key of keys) delete process.env[key];

async function main() {
  let responseBody = "";
  const mockSupabase = createServer((request, response) => {
    if (!request.url?.startsWith("/rest/v1/stores?") || request.headers.apikey !== "health-check-test-key") {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ message: "not found" }));
      return;
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify([{ id: "00000000-0000-4000-8000-000000000001" }]));
  });
  try {
    for (const key of keys) delete process.env[key];
    const response = await getHealth();
    assert.equal(response.status, 503, "the service must not report ready without Supabase credentials");
    assert.equal(response.headers.get("cache-control"), "no-store");
    responseBody = JSON.stringify(await response.json());
    assert.deepEqual(JSON.parse(responseBody), { status: "unavailable" });

    await new Promise<void>((resolve) => mockSupabase.listen(0, "127.0.0.1", resolve));
    const address = mockSupabase.address();
    assert.ok(address && typeof address !== "string");
    process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${address.port}`;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "health-check-anon-key-not-a-secret";
    process.env.NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF = "127";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "health-check-test-key";

    const readyResponse = await getHealth();
    assert.equal(readyResponse.status, 200, "a reachable database with the published Catalove tenant is ready");
    assert.equal(readyResponse.headers.get("cache-control"), "no-store");
    assert.deepEqual(await readyResponse.json(), { status: "ok" });
  } finally {
    mockSupabase.close();
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  const routeSource = readFileSync(join(process.cwd(), "src/app/api/health/route.ts"), "utf8");
  assert.match(routeSource, /\.from\("stores"\)[\s\S]*?\.eq\("slug",\s*"catalove"\)/);
  assert.doesNotMatch(responseBody, /service.role|api[_-]?key|secret|supabase|database/i);

  console.log("✅ Health endpoint fails closed and does not disclose configuration");
}

void main();
