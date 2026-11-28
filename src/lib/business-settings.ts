import { INITIAL_SETTINGS } from "@/lib/data/seed-catalog";
import type { BusinessSettings } from "@/types/bakery";
import { createDebouncedWriter } from "@/lib/debounced-writer";
import { DEFAULT_STORE_SLUG, getCurrentStoreSlug, getStoreScopedStorageKey, withStoreSlug } from "@/lib/store-routing";
import { DEFAULT_TENANT_SECTION_ORDER } from "@/lib/storefront-sections";

function getDefaultSettings(storeSlug: string): BusinessSettings {
  if (storeSlug === DEFAULT_STORE_SLUG) return INITIAL_SETTINGS;
  return {
    ...INITIAL_SETTINGS,
    store_name: "Toko",
    store_tagline: "Katalog resmi Toko.",
    seller_whatsapp: "",
    instagram_handle: "",
    tiktok_handle: "",
    nav_cta_text: "Hubungi Kami",
    hero_eyebrow: "Katalog Resmi",
    hero_title: "Produk Kami",
    hero_subtitle: "Jelajahi produk pilihan dan hubungi toko untuk memesan.",
    hero_primary_cta: "Hubungi via WhatsApp",
    hero_secondary_cta: "Lihat Produk",
    catalog_eyebrow: "Koleksi",
    catalog_title: "Produk Kami",
    footer_tagline: "Katalog resmi Toko.",
    theme_config: {
      ...INITIAL_SETTINGS.theme_config,
      section_order: DEFAULT_TENANT_SECTION_ORDER,
      canvas_draft_order: INITIAL_SETTINGS.theme_config.canvas_draft_order,
      hidden_sections: INITIAL_SETTINGS.theme_config.hidden_sections,
    },
  };
}

interface StoreSettingsState {
  inMemorySettings: BusinessSettings | null;
  localEditRevision: number;
  memoryOnlySettings: boolean;
  hasUnsyncedLocalSettings: boolean;
  writer?: ReturnType<typeof createDebouncedWriter<BusinessSettings>>;
}

const settingsByStore = new Map<string, StoreSettingsState>();
const fetchByStore = new Map<string, Promise<BusinessSettings>>();

function getStoreState(storeSlug: string): StoreSettingsState {
  let state = settingsByStore.get(storeSlug);
  if (!state) {
    state = {
      inMemorySettings: null,
      localEditRevision: 0,
      memoryOnlySettings: false,
      hasUnsyncedLocalSettings: false,
    };
    settingsByStore.set(storeSlug, state);
  }
  return state;
}

function getSettingsWriter(storeSlug: string, state: StoreSettingsState) {
  if (state.writer) return state.writer;
  state.writer = createDebouncedWriter<BusinessSettings>(
    async (settings) => {
      const response = await fetch(withStoreSlug("/api/settings", storeSlug), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        keepalive: true,
      });
      if (!response.ok) throw new Error(`Settings sync failed (${response.status})`);
      const currentState = getStoreState(storeSlug);
      if (JSON.stringify(settings) === JSON.stringify(currentState.inMemorySettings)) {
        currentState.hasUnsyncedLocalSettings = false;
      }
      if (typeof window !== "undefined" && getCurrentStoreSlug() === storeSlug) {
        window.dispatchEvent(new Event("catalove-settings-sync-ok"));
      }
    },
    400,
    () => {
      if (typeof window !== "undefined" && getCurrentStoreSlug() === storeSlug) {
        window.dispatchEvent(new Event("catalove-settings-sync-error"));
      }
    }
  );
  return state.writer;
}

function readStoredSettings(storeSlug: string): { available: boolean; value: string | null } {
  try {
    return {
      available: true,
      value: window.localStorage.getItem(getStoreScopedStorageKey("catalove-business-settings-v3", storeSlug)),
    };
  } catch {
    return { available: false, value: null };
  }
}

function readBusinessSettingsFor(storeSlug: string): BusinessSettings {
  const defaults = getDefaultSettings(storeSlug);
  if (typeof window === "undefined") return defaults;
  const state = getStoreState(storeSlug);
  const stored = readStoredSettings(storeSlug);
  if (!stored.available || state.memoryOnlySettings || state.hasUnsyncedLocalSettings) {
    return state.inMemorySettings ? { ...defaults, ...state.inMemorySettings } : defaults;
  }
  if (!stored.value) {
    state.inMemorySettings = null;
    return defaults;
  }
  try {
    const parsed = { ...defaults, ...JSON.parse(stored.value) };
    state.inMemorySettings = parsed;
    return parsed;
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function readBusinessSettings(storeSlug?: string): BusinessSettings {
  return readBusinessSettingsFor(storeSlug || getCurrentStoreSlug());
}

export function saveBusinessSettings(settings: BusinessSettings) {
  if (typeof window === "undefined") return;
  const storeSlug = getCurrentStoreSlug();
  const state = getStoreState(storeSlug);
  state.inMemorySettings = { ...getDefaultSettings(storeSlug), ...settings };
  state.hasUnsyncedLocalSettings = true;
  state.localEditRevision += 1;
  try {
    window.localStorage.setItem(
      getStoreScopedStorageKey("catalove-business-settings-v3", storeSlug),
      JSON.stringify(settings)
    );
    state.memoryOnlySettings = false;
  } catch {
    state.memoryOnlySettings = true;
  }
  window.dispatchEvent(new Event("catalove-settings-change"));

  // Each tenant gets its own serialized writer and captures its store slug.
  getSettingsWriter(storeSlug, state).schedule(settings);
}

export async function flushBusinessSettings(): Promise<void> {
  if (typeof window === "undefined") return;
  await getStoreState(getCurrentStoreSlug()).writer?.flush();
}

async function fetchBusinessSettingsFor(storeSlug: string): Promise<BusinessSettings> {
  if (typeof window === "undefined") return INITIAL_SETTINGS;
  const state = getStoreState(storeSlug);
  const startRevision = state.localEditRevision;
  const localSnapshot = readStoredSettings(storeSlug);
  try {
    const res = await fetch(withStoreSlug("/api/settings", storeSlug), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data?.settings) {
        if (data.persisted === false) return readBusinessSettingsFor(storeSlug);

        const latestSnapshot = readStoredSettings(storeSlug);
        if (
          state.localEditRevision !== startRevision ||
          state.hasUnsyncedLocalSettings ||
          latestSnapshot.available !== localSnapshot.available ||
          latestSnapshot.value !== localSnapshot.value
        ) {
          return readBusinessSettingsFor(storeSlug);
        }
        const settings = { ...getDefaultSettings(storeSlug), ...data.settings };
        state.inMemorySettings = settings;
        try {
          window.localStorage.setItem(
            getStoreScopedStorageKey("catalove-business-settings-v3", storeSlug),
            JSON.stringify(data.settings)
          );
          state.memoryOnlySettings = false;
        } catch {
          state.memoryOnlySettings = true;
        }
        if (getCurrentStoreSlug() === storeSlug) {
          window.dispatchEvent(new Event("catalove-settings-change"));
        }
        return settings;
      }
    }
  } catch {
    // Fall back to this store's local copy when the network is unavailable.
  }
  return readBusinessSettingsFor(storeSlug);
}

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  if (typeof window === "undefined") return INITIAL_SETTINGS;
  const storeSlug = getCurrentStoreSlug();
  const existing = fetchByStore.get(storeSlug);
  if (existing) return existing;

  const pending = fetchBusinessSettingsFor(storeSlug);
  fetchByStore.set(storeSlug, pending);
  try {
    return await pending;
  } finally {
    if (fetchByStore.get(storeSlug) === pending) fetchByStore.delete(storeSlug);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    for (const state of settingsByStore.values()) void state.writer?.flush();
  });
}
