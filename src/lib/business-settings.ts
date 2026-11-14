import { INITIAL_SETTINGS } from "@/lib/data/seed-cakes";
import type { BusinessSettings } from "@/types/bakery";

const STORAGE_KEY = "catalove-business-settings-v3";

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

    // Persist to database asynchronously
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }).catch(() => {
      // background sync silently falls back to local
    });
  }
}

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  if (typeof window === "undefined") return INITIAL_SETTINGS;
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      if (data?.settings) {
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
