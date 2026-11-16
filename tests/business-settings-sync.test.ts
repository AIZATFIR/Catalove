import assert from "node:assert/strict";
import { createDebouncedWriter } from "../src/lib/debounced-writer";
import {
  fetchBusinessSettings,
  saveBusinessSettings,
} from "../src/lib/business-settings";
import { INITIAL_SETTINGS } from "../src/lib/data/seed-cakes";

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
  (globalThis as any).fetch = (input: string) => input === "/api/settings"
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

  console.log("✅ All business settings sync tests passed!");
}

void main();
