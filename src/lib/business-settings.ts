import { INITIAL_SETTINGS } from "@/lib/data/seed-cakes";
import type { BusinessSettings } from "@/types/bakery";
import { createDebouncedWriter } from "@/lib/debounced-writer";

const STORAGE_KEY = "catalove-business-settings-v3";

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
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...INITIAL_SETTINGS, ...JSON.parse(saved) } : INITIAL_SETTINGS;
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveBusinessSettings(settings: BusinessSettings) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event("catalove-settings-change"));
    } catch {
      // ignore localStorage errors
    }

    // Local changes stay immediate; remote snapshots are debounced and serialized.
    settingsWriter.schedule(settings);
  }
}

export async function flushBusinessSettings(): Promise<void> {
  await settingsWriter.flush();
}

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  if (typeof window === "undefined") return INITIAL_SETTINGS;
  const localSnapshot = window.localStorage.getItem(STORAGE_KEY);
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      if (data?.settings) {
        // Preserve edits made while this initial request was in flight.
        if (window.localStorage.getItem(STORAGE_KEY) !== localSnapshot) {
          return readBusinessSettings();
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.settings));
        window.dispatchEvent(new Event("catalove-settings-change"));
        return data.settings as BusinessSettings;
      }
    }
  } catch {
    // fallback to localStorage
  }
  return readBusinessSettings();
}
