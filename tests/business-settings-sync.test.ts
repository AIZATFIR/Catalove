import assert from "node:assert/strict";
import { createDebouncedWriter } from "../src/lib/debounced-writer";
import {
  flushBusinessSettings,
  fetchBusinessSettings,
  readBusinessSettings,
  saveBusinessSettings,
} from "../src/lib/business-settings";
import { INITIAL_SETTINGS } from "../src/lib/data/seed-catalog";

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const written: number[] = [];
  const writer = createDebouncedWriter<number>(async (value) => {
    written.push(value);
  }, 5);
  writer.schedule(1);
  writer.schedule(2);
  writer.schedule(3);
  await pause(20);
  assert.deepEqual(written, [3], "debounce keeps only the latest rapid edit");

  const ordered: number[] = [];
  let releaseFirst!: () => void;
  const firstWrite = new Promise<void>((resolve) => { releaseFirst = resolve; });
  const serialized = createDebouncedWriter<number>(async (value) => {
    ordered.push(value);
    if (value === 1) await firstWrite;
  }, 5);
  serialized.schedule(1);
  const flushingFirst = serialized.flush();
  await Promise.resolve();
  serialized.schedule(2);
  const flushingLatest = serialized.flush();
  releaseFirst();
  await Promise.all([flushingFirst, flushingLatest]);
  assert.deepEqual(ordered, [1, 2], "writes are serialized and newer snapshots finish last");

  let failures = 0;
  const resilient = createDebouncedWriter<number>(async () => {
    throw new Error("offline");
  }, 5, () => { failures += 1; });
  resilient.schedule(1);
  await resilient.flush();
  assert.equal(failures, 1, "remote failures are reported without losing local edits");

  const values = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
    dispatchEvent: () => true,
    addEventListener: () => undefined,
  };
  let releaseSettings!: (response: { ok: boolean; json: () => Promise<unknown> }) => void;
  (globalThis as any).fetch = (input: string) => input.startsWith("/api/settings")
    ? new Promise((resolve) => { releaseSettings = resolve; })
    : Promise.resolve({ ok: true });
  const loading = fetchBusinessSettings();
  const localEdit = {
    ...INITIAL_SETTINGS,
    hero_title: "Edit lokal terbaru",
  };
  saveBusinessSettings(localEdit);
  releaseSettings({
    ok: true,
    json: async () => ({ settings: { ...INITIAL_SETTINGS, hero_title: "Data server lama" } }),
  });
  const result = await loading;
  assert.equal(result.hero_title, "Edit lokal terbaru", "late server fetch cannot overwrite a local edit");
  await pause(420);
  releaseSettings({ ok: true, json: async () => ({ settings: localEdit }) });
  await flushBusinessSettings();

  (globalThis as any).fetch = async () => ({
    ok: true,
    json: async () => ({ settings: INITIAL_SETTINGS, persisted: false }),
  });
  const offlineSettings = await fetchBusinessSettings();
  assert.equal(
    offlineSettings.hero_title,
    "Edit lokal terbaru",
    "an offline demo response cannot overwrite the saved local draft"
  );

  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => undefined,
  };
  (globalThis as any).fetch = async () => ({
    ok: true,
    json: async () => ({ settings: { ...INITIAL_SETTINGS, hero_title: "Data server lama" } }),
  });
  const withoutStorage = await fetchBusinessSettings();
  assert.equal(
    withoutStorage.hero_title,
    "Data server lama",
    "settings can load when browser storage is unavailable"
  );
  const sessionEdit = { ...INITIAL_SETTINGS, hero_title: "Edit dalam sesi" };
  saveBusinessSettings(sessionEdit);
  assert.equal(
    readBusinessSettings().hero_title,
    "Edit dalam sesi",
    "session fallback keeps the latest edit when browser storage is unavailable"
  );
  await fetchBusinessSettings();
  assert.equal(
    readBusinessSettings().hero_title,
    "Edit dalam sesi",
    "a later stale server snapshot cannot overwrite an unsynced session edit"
  );

  const tenantValues = new Map<string, string>();
  const tenantWrites: Array<{ url: string; body: string }> = [];
  const location = { pathname: "/s/isolation-a", origin: "https://catalove.test" };
  const browserGlobals = globalThis as unknown as {
    window: {
      location: typeof location;
      localStorage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };
      dispatchEvent: (event: Event) => boolean;
      addEventListener: (type: string, listener: () => void) => void;
    };
    fetch: (input: string, init?: RequestInit) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
  };
  browserGlobals.window = {
    location,
    localStorage: {
      getItem: (key: string) => tenantValues.get(key) ?? null,
      setItem: (key: string, value: string) => tenantValues.set(key, value),
    },
    dispatchEvent: () => true,
    addEventListener: () => undefined,
  };
  browserGlobals.fetch = async (input: string, init?: RequestInit) => {
    if (init?.method === "POST") tenantWrites.push({ url: input, body: String(init.body) });
    return { ok: true, json: async () => ({}) };
  };
  assert.equal(readBusinessSettings().seller_whatsapp, "", "a tenant without contact setup must never inherit Catalove's WhatsApp number");
  assert.equal(readBusinessSettings().nav_cta_text, "Hubungi Kami", "a new tenant must start with merchant-facing copy");
  saveBusinessSettings({ ...INITIAL_SETTINGS, hero_title: "Tenant A" });
  location.pathname = "/s/isolation-b";
  saveBusinessSettings({ ...INITIAL_SETTINGS, hero_title: "Tenant B" });
  await pause(450);
  const isolationWrites = tenantWrites.filter(({ url }) => /storeSlug=isolation-[ab]/.test(url));
  assert.equal(isolationWrites.length, 2, "each tenant's pending settings save must survive navigation to another store");
  assert.match(isolationWrites[0].url, /storeSlug=isolation-a/);
  assert.match(isolationWrites[1].url, /storeSlug=isolation-b/);
  assert.equal(JSON.parse(isolationWrites[0].body).hero_title, "Tenant A");
  assert.equal(JSON.parse(isolationWrites[1].body).hero_title, "Tenant B");

  console.log("✅ All business settings sync tests passed!");
}

void main();
