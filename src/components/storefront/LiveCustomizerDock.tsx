"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  LayoutGrid,
  Loader2,
  Palette,
  Plus,
  QrCode,
  RotateCcw,
  Sliders,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { readBusinessSettings, saveBusinessSettings } from "@/lib/business-settings";
import {
  addCanvasSectionDraft,
  moveCanvasSection,
  normalizeCanvasSections,
  removeCanvasSection,
} from "@/lib/canvas-sections";
import {
  DEFAULT_THEME_CONFIG,
  INDUSTRY_PRESETS,
} from "@/lib/data/universal-presets";
import { cakeService } from "@/lib/services/cake-service";
import { normalizeHexColor } from "@/lib/theme-colors";
import { THEME_COLOR_MAP } from "@/components/theme/ThemeProvider";
import {
  ALL_CANVAS_SECTIONS,
  DEFAULT_CANVAS_ORDER,
  DEFAULT_SHOWCASE_ORDER,
  openCataloveWhatsApp,
} from "@/components/storefront/PricingSection";
import type {
  BodyScaleOption,
  BusinessSettings,
  CanvasSectionId,
  CardStyleOption,
  CatalogLayoutOption,
  ColorThemeOption,
  CustomColorPalette,
  FontBodyOption,
  FontHeadingOption,
  HeadingScaleOption,
  HeroStyleOption,
  IndustryPreset,
} from "@/types/catalove";

type DockTab = "posisi" | "warna" | "model" | "brand";

const VALID_SECTION_IDS = new Set<CanvasSectionId>(
  ALL_CANVAS_SECTIONS.map((s) => s.id)
);

const SECTION_LABELS: Record<CanvasSectionId, string> =
  ALL_CANVAS_SECTIONS.reduce((acc, item) => {
    acc[item.id] = item.title;
    return acc;
  }, {} as Record<CanvasSectionId, string>);

const HERO_STYLES: { id: HeroStyleOption; label: string }[] = [
  { id: "split_dynamic", label: "Split Kanan" },
  { id: "split_reverse", label: "Split Kiri" },
  { id: "minimal_center", label: "Center" },
  { id: "bento_grid", label: "Bento" },
  { id: "rotating_showcase", label: "Showcase" },
];

const SCROLL_MODES: {
  id: CatalogLayoutOption;
  label: string;
  cols?: 2 | 3 | 4;
}[] = [
  { id: "pinterest_masonry", label: "Waterfall" },
  { id: "tiktok_feed", label: "Snap" },
  { id: "grid_2", label: "Grid 2", cols: 2 },
  { id: "grid_3", label: "Grid 3", cols: 3 },
  { id: "grid_4", label: "Grid 4", cols: 4 },
];

const CARD_STYLES: { id: CardStyleOption; label: string }[] = [
  { id: "clean_flat", label: "Flat" },
  { id: "minimal_mono", label: "Mono" },
  { id: "modern_glass", label: "Surface" },
  { id: "bordered_clay", label: "Border" },
];

const BODY_FONTS: { id: FontBodyOption; label: string }[] = [
  { id: "jakarta", label: "Jakarta" },
  { id: "inter", label: "Inter" },
  { id: "outfit", label: "Outfit" },
];

const HEADING_SCALES: { id: HeadingScaleOption; label: string }[] = [
  { id: "sm", label: "S" },
  { id: "md", label: "M" },
  { id: "lg", label: "L" },
  { id: "xl", label: "XL" },
];

const BODY_SCALES: { id: BodyScaleOption; label: string }[] = [
  { id: "sm", label: "S" },
  { id: "md", label: "M" },
  { id: "lg", label: "L" },
];

const PRESET_OPTIONS: { id: IndustryPreset; label: string }[] = [
  { id: "general", label: "Template" },
  { id: "fashion", label: "Fashion" },
  { id: "bakery", label: "Bakery" },
  { id: "florist", label: "Florist" },
  { id: "crafts", label: "Craft" },
  { id: "gadgets", label: "Gadget" },
  { id: "services", label: "Jasa" },
];

const COLOR_SWATCHES: {
  id: ColorThemeOption;
  label: string;
  hex: string;
}[] = [
  { id: "warm_oat", label: "Oat", hex: "#C27838" },
  { id: "noir_gold", label: "Noir", hex: "#D97706" },
  { id: "matcha_sage", label: "Matcha", hex: "#15803D" },
  { id: "rose_velvet", label: "Rose", hex: "#BE185D" },
  { id: "minimal_slate", label: "Slate", hex: "#0F172A" },
  { id: "sunset_terracotta", label: "Terra", hex: "#EA580C" },
  { id: "cyber_neo", label: "Neo", hex: "#0284C7" },
];

const HEADING_FONTS: { id: FontHeadingOption; label: string }[] = [
  { id: "playfair", label: "Playfair" },
  { id: "cormorant", label: "Cormorant" },
  { id: "syne", label: "Syne" },
  { id: "space_grotesk", label: "Space" },
  { id: "outfit", label: "Outfit" },
  { id: "jakarta", label: "Jakarta" },
  { id: "inter", label: "Inter" },
];

export function LiveCustomizerDock() {
  const settings = useBusinessSettings();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DockTab>("posisi");
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState<IndustryPreset | null>(
    null
  );
  const [colorDrafts, setColorDrafts] = useState<Record<string, string>>({});
  const [settingsSyncError, setSettingsSyncError] = useState(false);

  useEffect(() => {
    const handleCanvasState = (e: Event) => {
      const detail = (e as CustomEvent<{ active?: boolean }>).detail;
      if (typeof detail?.active === "boolean") {
        setIsCanvasMode(detail.active);
      }
    };
    window.addEventListener("catalove-canvas-state", handleCanvasState);
    return () => {
      window.removeEventListener("catalove-canvas-state", handleCanvasState);
    };
  }, []);

  useEffect(() => {
    const handleSyncError = () => setSettingsSyncError(true);
    const handleSyncSuccess = () => setSettingsSyncError(false);
    window.addEventListener("catalove-settings-sync-error", handleSyncError);
    window.addEventListener("catalove-settings-sync-ok", handleSyncSuccess);
    return () => {
      window.removeEventListener("catalove-settings-sync-error", handleSyncError);
      window.removeEventListener("catalove-settings-sync-ok", handleSyncSuccess);
    };
  }, []);

  const activeTheme = useMemo(
    () => ({
      ...DEFAULT_THEME_CONFIG,
      ...(settings.theme_config || {}),
    }),
    [settings.theme_config]
  );

  const orderField = "canvas_draft_order" as const;

  const sectionOrder: CanvasSectionId[] = useMemo(() => {
    const saved = activeTheme.canvas_draft_order;
    const fallback = DEFAULT_CANVAS_ORDER;
    return normalizeCanvasSections(
      saved,
      VALID_SECTION_IDS,
      fallback,
      activeTheme.hidden_sections
    );
  }, [activeTheme.canvas_draft_order, activeTheme.hidden_sections]);

  const availableToAdd = useMemo(
    () => ALL_CANVAS_SECTIONS.filter((sec) => !sectionOrder.includes(sec.id)),
    [sectionOrder]
  );

  const presetBasePalette =
    (THEME_COLOR_MAP[activeTheme.color_theme] || THEME_COLOR_MAP.warm_oat).light;

  const currentCustomColors: CustomColorPalette = {
    enabled: Boolean(activeTheme.custom_colors?.enabled),
    accent: activeTheme.custom_colors?.accent || presetBasePalette.accent,
    bg: activeTheme.custom_colors?.bg || presetBasePalette.bg,
    surface: activeTheme.custom_colors?.surface || presetBasePalette.surface,
    ink: activeTheme.custom_colors?.ink || presetBasePalette.ink,
  };

  if (pathname === "/privacy" || pathname === "/contact") return null;

  const handleToggleCanvas = () => {
    if (pathname !== "/") {
      router.push("/?canvas=1");
      return;
    }
    window.dispatchEvent(new CustomEvent("catalove-toggle-canvas"));
  };

  const updateTheme = (patch: Partial<typeof activeTheme>) => {
    saveBusinessSettings({
      ...settings,
      theme_config: {
        ...activeTheme,
        ...patch,
      },
    });
  };

  const handleMoveSection = (id: CanvasSectionId, direction: -1 | 1) => {
    updateTheme({ [orderField]: moveCanvasSection(sectionOrder, id, direction) });
  };

  const handleAddSection = (id: CanvasSectionId) => {
    // Read the latest draft at click time so rapid section edits never build
    // from an older React render and silently replace a more recent change.
    const latest = readBusinessSettings();
    const theme = { ...DEFAULT_THEME_CONFIG, ...(latest.theme_config || {}) };
    const order = normalizeCanvasSections(
      theme.canvas_draft_order,
      VALID_SECTION_IDS,
      DEFAULT_CANVAS_ORDER,
      theme.hidden_sections
    );
    const draft = addCanvasSectionDraft(order, theme.hidden_sections || [], id);
    saveBusinessSettings({
      ...latest,
      theme_config: {
        ...theme,
        [orderField]: draft.order,
        hidden_sections: draft.hidden,
      },
    });
  };

  const handleRemoveSection = (id: CanvasSectionId) => {
    if (sectionOrder.length <= 1) return;
    updateTheme({ [orderField]: removeCanvasSection(sectionOrder, id) });
  };

  const handleLoadShowcaseSections = () => {
    updateTheme({
      [orderField]: normalizeCanvasSections(
        DEFAULT_SHOWCASE_ORDER,
        VALID_SECTION_IDS,
        DEFAULT_CANVAS_ORDER
      ),
      hidden_sections: [],
    });
  };

  const handleApplyPreset = async (presetKey: IndustryPreset) => {
    setApplyingPreset(presetKey);
    try {
      const bundle = INDUSTRY_PRESETS[presetKey] || INDUSTRY_PRESETS.general;
      const merged: BusinessSettings = {
        ...settings,
        ...bundle.settings,
        seller_whatsapp: settings.seller_whatsapp || "6285946689168",
        industry_preset: presetKey,
        theme_config: {
          ...DEFAULT_THEME_CONFIG,
          ...(bundle.settings.theme_config || {}),
          section_order: activeTheme.section_order,
            canvas_draft_order: activeTheme.canvas_draft_order,
          hidden_sections: activeTheme.hidden_sections,
        },
      };
      saveBusinessSettings(merged);
      await cakeService.applyIndustryPresetCatalog(presetKey);
    } finally {
      setApplyingPreset(null);
    }
  };

  const handleUpdateScrollMode = (
    layout: CatalogLayoutOption,
    cols?: 2 | 3 | 4
  ) => {
    saveBusinessSettings({
      ...settings,
      catalog_layout: layout,
      theme_config: {
        ...activeTheme,
        catalog_layout: layout,
        ...(cols ? { catalog_columns_desktop: cols } : {}),
      },
    });
  };

  const handleUpdateColorSwatch = (color: ColorThemeOption) => {
    setColorDrafts({});
    updateTheme({
      color_theme: color,
      custom_colors: undefined,
    });
  };

  const handleUpdateCustomColor = (
    field: "accent" | "bg" | "surface" | "ink",
    hex: string
  ) => {
    const normalized = normalizeHexColor(hex);
    if (!normalized) return;
    updateTheme({
      custom_colors: {
        ...currentCustomColors,
        enabled: true,
        [field]: normalized,
      },
    });
    setColorDrafts((current) => ({ ...current, [field]: normalized }));
  };

  const handleColorDraftChange = (
    field: "accent" | "bg" | "surface" | "ink",
    value: string
  ) => {
    setColorDrafts((current) => ({ ...current, [field]: value }));
    const normalized = normalizeHexColor(value);
    if (normalized) handleUpdateCustomColor(field, normalized);
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {!isOpen ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="touch-target group inline-flex items-center gap-2 rounded-full border border-stone-200/80 dark:border-white/15 bg-white/95 dark:bg-stone-900/95 px-3.5 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 shadow-xl backdrop-blur-xl hover:scale-[1.03] active:scale-95 transition-all"
            aria-label="Kanvas & Tema"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--storefront-accent)] text-white shadow-sm">
              <Palette className="h-3.5 w-3.5" />
            </span>
            <span>Kanvas &amp; Tema</span>
          </button>

          <button
            type="button"
            onClick={handleToggleCanvas}
            className={`touch-target inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold shadow-xl backdrop-blur-xl transition-all ${
              isCanvasMode
                ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white"
                : "border-stone-200/80 dark:border-white/15 bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 hover:border-[var(--storefront-accent)]"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Mode Kanvas: {isCanvasMode ? "ON" : "OFF"}</span>
          </button>
        </div>
      ) : (
        <aside
          aria-label="Canvas Studio Dock"
          className="w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-stone-200/90 dark:border-white/15 bg-white/95 dark:bg-[#1E1815]/95 p-4 text-stone-900 dark:text-stone-100 shadow-2xl backdrop-blur-2xl space-y-3.5 animate-slide-up max-h-[84vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200/70 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--storefront-accent)] text-white">
                <Palette className="h-3.5 w-3.5" />
              </span>
              <div>
                <h2 className="font-serif text-sm font-bold leading-none">
                  Canvas Studio
                </h2>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Atur posisi, warna &amp; model katalog
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {settingsSyncError && (
            <p role="status" className="rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
              Perubahan tersimpan di perangkat ini, tetapi belum tersinkron ke server. Periksa koneksi atau akses admin, lalu ubah lagi untuk mencoba sinkronisasi.
            </p>
          )}

          {/* 4 Studio Tabs */}
          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-stone-100 dark:bg-white/5 p-1">
            {(
              [
                { id: "posisi", label: "Section" },
                { id: "warna", label: "Warna" },
                { id: "model", label: "Tipografi" },
                { id: "brand", label: "Brand" },
              ] as { id: DockTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl py-1.5 text-[11px] font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-sm"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: SECTION & POSISI */}
          {activeTab === "posisi" && (
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={handleToggleCanvas}
                className={`w-full flex items-center justify-between rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                  isCanvasMode
                    ? "border-[var(--storefront-accent)] bg-[var(--color-surface-tint)] text-[var(--storefront-accent)]"
                    : "border-stone-200 dark:border-white/15 bg-stone-50 dark:bg-white/5"
                }`}
              >
                <span>Mode Kanvas (Edit Langsung di Web)</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    isCanvasMode
                      ? "bg-[var(--storefront-accent)] text-white"
                      : "bg-stone-300 dark:bg-white/20 text-stone-700 dark:text-stone-200"
                  }`}
                >
                  {isCanvasMode ? "AKTIF" : "NONAKTIF"}
                </span>
              </button>

              {/* Active Sections */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <span>Section Draft ({sectionOrder.length})</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadShowcaseSections}
                      className="text-[10px] font-semibold text-[var(--storefront-accent)] hover:underline normal-case"
                    >
                      Preset lengkap
                    </button>
                    {sectionOrder.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateTheme({
                            [orderField]: ["hero"],
                            hidden_sections: [],
                          })
                        }
                        className="text-[10px] font-semibold text-rose-500 hover:underline normal-case"
                      >
                        Hero saja
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {sectionOrder.map((secId, idx) => (
                    <div
                      key={secId}
                      className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50/70 dark:bg-white/5 px-3 py-1.5 text-xs"
                    >
                      <span className="font-semibold truncate">
                        {idx + 1}. {SECTION_LABELS[secId]}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(secId, -1)}
                          aria-label={`Geser atas ${SECTION_LABELS[secId]}`}
                          className="rounded-lg p-1 border border-stone-200 dark:border-white/15 disabled:opacity-30 hover:border-[var(--storefront-accent)]"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sectionOrder.length - 1}
                          onClick={() => handleMoveSection(secId, 1)}
                          aria-label={`Geser bawah ${SECTION_LABELS[secId]}`}
                          className="rounded-lg p-1 border border-stone-200 dark:border-white/15 disabled:opacity-30 hover:border-[var(--storefront-accent)]"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={sectionOrder.length <= 1}
                          onClick={() => handleRemoveSection(secId)}
                          aria-label={`Hapus ${SECTION_LABELS[secId]}`}
                          className="rounded-lg p-1 border border-stone-200 dark:border-white/15 text-rose-500 disabled:opacity-30 hover:border-rose-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Section Pills */}
              {availableToAdd.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    + Tambah Section Baru
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableToAdd.map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => handleAddSection(sec.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--storefront-accent)] bg-white/80 dark:bg-stone-900 px-2.5 py-1 text-[10px] font-bold text-[var(--storefront-accent)] hover:bg-[var(--color-surface-tint)] transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{sec.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hero Positioning & Model */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Model Hero
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {HERO_STYLES.map((hero) => {
                    const active = activeTheme.hero_style === hero.id;
                    return (
                      <button
                        key={hero.id}
                        type="button"
                        onClick={() => updateTheme({ hero_style: hero.id })}
                        className={`rounded-xl px-2 py-1.5 text-[10px] font-bold border text-center transition-all ${
                          active
                            ? "border-[var(--storefront-accent)] bg-[var(--color-surface-tint)] text-[var(--storefront-accent)]"
                            : "border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5"
                        }`}
                      >
                        {hero.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WARNA */}
          {activeTab === "warna" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <span>Palet Preset</span>
                  <span className="font-mono text-[9px] text-[var(--storefront-accent)]">
                    {activeTheme.custom_colors?.enabled
                      ? "Custom Hex"
                      : COLOR_SWATCHES.find(
                          (c) => c.id === activeTheme.color_theme
                        )?.label || activeTheme.color_theme}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5 rounded-2xl bg-stone-100/80 dark:bg-white/5 p-2">
                  {COLOR_SWATCHES.map((swatch) => {
                    const active =
                      !activeTheme.custom_colors?.enabled &&
                      activeTheme.color_theme === swatch.id;
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => handleUpdateColorSwatch(swatch.id)}
                        title={swatch.label}
                        aria-label={swatch.label}
                        className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
                          active
                            ? "border-stone-900 dark:border-white scale-110 shadow-md"
                            : "border-white/70"
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {active && (
                          <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Brand Palette Builder */}
              <div className="space-y-2.5 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-stone-50/70 dark:bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                    Kustom Warna Sendiri
                  </span>
                  {activeTheme.custom_colors?.enabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setColorDrafts({});
                        updateTheme({ custom_colors: undefined });
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--storefront-accent)] hover:underline"
                    >
                      <RotateCcw className="h-2.5 w-2.5" />
                      <span>Reset ke Palet Preset</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { key: "accent", label: "Warna Utama" },
                      { key: "bg", label: "Warna Latar" },
                      { key: "surface", label: "Warna Kartu" },
                      { key: "ink", label: "Warna Teks" },
                    ] as {
                      key: "accent" | "bg" | "surface" | "ink";
                      label: string;
                    }[]
                  ).map((item) => {
                    const hexVal = currentCustomColors[item.key];
                    return (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-stone-900 p-2 cursor-pointer"
                      >
                        <input
                          type="color"
                          value={hexVal}
                          onChange={(e) =>
                            handleUpdateCustomColor(item.key, e.target.value)
                          }
                          className="h-6 w-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold truncate">
                            {item.label}
                          </p>
                          <input
                            type="text"
                            value={colorDrafts[item.key] ?? hexVal}
                            onChange={(e) => handleColorDraftChange(item.key, e.target.value)}
                            onBlur={() => setColorDrafts((current) => ({ ...current, [item.key]: currentCustomColors[item.key] }))}
                            aria-label={`${item.label} dalam hex`}
                            maxLength={7}
                            spellCheck={false}
                            className="w-[5.5rem] bg-transparent font-mono text-[10px] uppercase text-stone-500 outline-none focus:text-stone-900 dark:focus:text-white"
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MODEL */}
          {activeTab === "model" && (
            <div className="space-y-3.5">
              {/* Catalog Layout Mode */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <LayoutGrid className="h-3 w-3 text-[var(--storefront-accent)]" />
                  <span>Model Katalog</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SCROLL_MODES.map((mode) => {
                    const active =
                      (settings.catalog_layout || activeTheme.catalog_layout) ===
                      mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleUpdateScrollMode(mode.id, mode.cols)}
                        className={`rounded-xl px-2.5 py-1.5 text-[11px] font-bold border transition-all ${
                          active
                            ? "border-[var(--storefront-accent)] bg-[var(--color-surface-tint)] text-[var(--storefront-accent)]"
                            : "border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5"
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Style */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Model Kartu Produk
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {CARD_STYLES.map((card) => {
                    const active = activeTheme.card_style === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => updateTheme({ card_style: card.id })}
                        className={`rounded-xl px-2 py-1.5 text-[11px] font-bold border text-center transition-all ${
                          active
                            ? "border-[var(--storefront-accent)] bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                            : "border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5"
                        }`}
                      >
                        {card.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Heading */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <Type className="h-3 w-3 text-[var(--storefront-accent)]" />
                  <span>Font Heading</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HEADING_FONTS.map((font) => {
                    const active = activeTheme.font_heading === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => updateTheme({ font_heading: font.id })}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all ${
                          active
                            ? "border-[var(--storefront-accent)] bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                            : "border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5"
                        }`}
                      >
                        {font.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Body & Typography Scale + Align */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Font Teks
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {BODY_FONTS.map((font) => {
                      const active = activeTheme.font_body === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => updateTheme({ font_body: font.id })}
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition-all ${
                            active
                              ? "border-[var(--storefront-accent)] bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                              : "border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5"
                          }`}
                        >
                          {font.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Rata Hero
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {(
                      [
                        { id: "left", label: "Kiri" },
                        { id: "center", label: "Tengah" },
                      ] as const
                    ).map((al) => {
                      const active = (activeTheme.hero_align || "left") === al.id;
                      return (
                        <button
                          key={al.id}
                          type="button"
                          onClick={() => updateTheme({ hero_align: al.id })}
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition-all ${
                            active
                              ? "border-[var(--storefront-accent)] bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                              : "border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5"
                          }`}
                        >
                          {al.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Ukuran Judul
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {HEADING_SCALES.map((sc) => {
                      const active =
                        (activeTheme.heading_scale || "lg") === sc.id;
                      return (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => updateTheme({ heading_scale: sc.id })}
                          className={`rounded-lg py-1 text-[10px] font-bold border text-center transition-all ${
                            active
                              ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white"
                              : "border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5"
                          }`}
                        >
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Ukuran Teks
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {BODY_SCALES.map((sc) => {
                      const active = (activeTheme.body_scale || "md") === sc.id;
                      return (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => updateTheme({ body_scale: sc.id })}
                          className={`rounded-lg py-1 text-[10px] font-bold border text-center transition-all ${
                            active
                              ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white"
                              : "border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5"
                          }`}
                        >
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sample Presets */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Sample Industri
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_OPTIONS.map((preset) => {
                    const active = settings.industry_preset === preset.id;
                    const loading = applyingPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={applyingPreset !== null}
                        onClick={() => void handleApplyPreset(preset.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold border transition-all ${
                          active
                            ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white shadow-sm"
                            : "border-stone-200 dark:border-white/15 bg-stone-50 dark:bg-white/5 hover:border-stone-400"
                        }`}
                      >
                        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRAND */}
          {activeTab === "brand" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Nama Brand
                </label>
                <input
                  type="text"
                  value={settings.store_name || ""}
                  onChange={(e) =>
                    saveBusinessSettings({
                      ...settings,
                      store_name: e.target.value,
                    })
                  }
                  placeholder="Catalove"
                  className="w-full rounded-xl border border-stone-200 dark:border-white/15 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-xs font-semibold focus:border-[var(--storefront-accent)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Tagline Hero
                </label>
                <textarea
                  rows={2}
                  value={settings.hero_title || ""}
                  onChange={(e) =>
                    saveBusinessSettings({
                      ...settings,
                      hero_title: e.target.value,
                    })
                  }
                  placeholder="Simple yet interesting catalog for your brand."
                  className="w-full rounded-xl border border-stone-200 dark:border-white/15 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-xs font-medium focus:border-[var(--storefront-accent)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Subjudul Hero
                </label>
                <input
                  type="text"
                  value={settings.hero_subtitle || ""}
                  onChange={(e) =>
                    saveBusinessSettings({
                      ...settings,
                      hero_subtitle: e.target.value,
                    })
                  }
                  placeholder="Pesan Catalove mu untuk brand mu sendiri."
                  className="w-full rounded-xl border border-stone-200 dark:border-white/15 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-xs focus:border-[var(--storefront-accent)] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Footer Shortcuts */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-200/70 dark:border-white/10">
            <Link
              href="/bio"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-white/15 py-2.5 px-3 text-xs font-bold hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
            >
              <QrCode className="h-3.5 w-3.5 text-[var(--storefront-accent)]" />
              <span>Bio</span>
            </Link>
            <button
              type="button"
              onClick={() => openCataloveWhatsApp(settings.seller_whatsapp)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--storefront-accent)] py-2.5 px-3 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-opacity"
            >
              <span>Pesan Desain Ini</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
