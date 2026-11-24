import { INITIAL_SETTINGS } from "@/lib/data/seed-catalog";
import type { BusinessSettings } from "@/types/bakery";
import { createDebouncedWriter } from "@/lib/debounced-writer";

const STORAGE_KEY = "catalove-business-settings-v3";
let inMemorySettings: BusinessSettings | null = null;
let localEditRevision = 0;
let memoryOnlySettings = false;
let hasUnsyncedLocalSettings = false;

function readStoredSettings(): { available: boolean; value: string | null } {
  try {
    return { available: true, value: window.localStorage.getItem(STORAGE_KEY) };
  } catch {
    return { available: false, value: null };
  }
}

const settingsWriter = createDebouncedWriter<BusinessSettings>(
  async (settings) => {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
      keepalive: true,
    });
    if (!response.ok) throw new Error(`Settings sync failed (${response.status})`);
    if (typeof window !== "undefined") {
      if (JSON.stringify(settings) === JSON.stringify(inMemorySettings)) {
        hasUnsyncedLocalSettings = false;
      }
      window.dispatchEvent(new Event("catalove-settings-sync-ok"));
    }
  },
  400,
  () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("catalove-settings-sync-error"));
    }
  }
);

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => void settingsWriter.flush());
}

export function readBusinessSettings(): BusinessSettings {
  if (typeof window === "undefined") return INITIAL_SETTINGS;
  const stored = readStoredSettings();
  if (!stored.available || memoryOnlySettings || hasUnsyncedLocalSettings) {
    return inMemorySettings ? { ...INITIAL_SETTINGS, ...inMemorySettings } : INITIAL_SETTINGS;
  }
  if (!stored.value) {
    inMemorySettings = null;
    return INITIAL_SETTINGS;
  }
  try {
    const parsed = { ...INITIAL_SETTINGS, ...JSON.parse(stored.value) };
    inMemorySettings = parsed;
    return parsed;
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveBusinessSettings(settings: BusinessSettings) {
  if (typeof window !== "undefined") {
    inMemorySettings = { ...INITIAL_SETTINGS, ...settings };
    hasUnsyncedLocalSettings = true;
    localEditRevision += 1;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      memoryOnlySettings = false;
    } catch {
      memoryOnlySettings = true;
    }
    window.dispatchEvent(new Event("catalove-settings-change"));

    // Local changes stay immediate; remote snapshots are debounced and serialized.
    settingsWriter.schedule(settings);
  }
}

export async function flushBusinessSettings(): Promise<void> {
  await settingsWriter.flush();
}

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  if (typeof window === "undefined") return INITIAL_SETTINGS;
  const startRevision = localEditRevision;
  const localSnapshot = readStoredSettings();
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      if (data?.settings) {
        if (data.persisted === false) return readBusinessSettings();

        // Preserve edits made while this initial request was in flight.
        const latestSnapshot = readStoredSettings();
        if (
          localEditRevision !== startRevision ||
          hasUnsyncedLocalSettings ||
          latestSnapshot.available !== localSnapshot.available ||
          latestSnapshot.value !== localSnapshot.value
        ) {
          return readBusinessSettings();
        }
        const settings = { ...INITIAL_SETTINGS, ...data.settings };
        inMemorySettings = settings;
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.settings));
          memoryOnlySettings = false;
        } catch {
          // Keep the fetched settings available for this browser session.
          memoryOnlySettings = true;
        }
        window.dispatchEvent(new Event("catalove-settings-change"));
        return settings;
      }
    }
  } catch {
    // fallback to localStorage
  }
  return readBusinessSettings();
}
