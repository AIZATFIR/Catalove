"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  LayoutGrid,
  Loader2,
  Palette,
  QrCode,
  RotateCcw,
  Sliders,
  Type,
  X,
} from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { saveBusinessSettings } from "@/lib/business-settings";
import {
  DEFAULT_THEME_CONFIG,
  INDUSTRY_PRESETS,
} from "@/lib/data/universal-presets";
import { cakeService } from "@/lib/services/cake-service";
import { THEME_COLOR_MAP } from "@/components/theme/ThemeProvider";
import {
  DEFAULT_SECTION_ORDER,
  openOrderSchemeModal,
} from "@/components/storefront/PricingSection";
import type {
  BusinessSettings,
  CanvasSectionId,
  CardStyleOption,
  CatalogLayoutOption,
  ColorThemeOption,
  CustomColorPalette,
  FontHeadingOption,
  HeroStyleOption,
  IndustryPreset,
} from "@/types/catalove";

type DockTab = "posisi" | "warna" | "model" | "brand";

const SECTION_LABELS: Record<CanvasSectionId, string> = {
  hero: "Hero",
  feed: "Katalog Feed",
  pricing: "Harga & Skema",
  lookbook: "Lookbook Sticky",
  showcase: "Showcase Scroll",
  carousel: "Galeri Carousel",
  cta: "Banner CTA",
};

const HERO_STYLES: { id: HeroStyleOption; label: string }[] = [
  { id: "split_dynamic", label: "Split Kanan" },
  { id: "split_reverse", label: "Split Kiri" },
  { id: "minimal_center", label: "Center" },
  { id: "bento_grid", label: "Bento" },
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
  { id: "modern_glass", label: "Glass" },
  { id: "clean_flat", label: "Flat" },
  { id: "bordered_clay", label: "Clay" },
  { id: "minimal_mono", label: "Mono" },
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

  const activeTheme = useMemo(
    () => ({
      ...DEFAULT_THEME_CONFIG,
      ...(settings.theme_config || {}),
    }),
    [settings.theme_config]
  );

  const sectionOrder: CanvasSectionId[] = useMemo(() => {
    const saved = activeTheme.section_order || [];
    const seen = new Set<CanvasSectionId>();
    const out: CanvasSectionId[] = [];
    for (const id of saved) {
      if (DEFAULT_SECTION_ORDER.includes(id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    for (const id of DEFAULT_SECTION_ORDER) {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    return out;
  }, [activeTheme.section_order]);

  const hiddenSections: CanvasSectionId[] = activeTheme.hidden_sections || [];

  const presetBasePalette =
    (THEME_COLOR_MAP[activeTheme.color_theme] || THEME_COLOR_MAP.warm_oat).light;

  const currentCustomColors: CustomColorPalette = {
    enabled: Boolean(activeTheme.custom_colors?.enabled),
    accent: activeTheme.custom_colors?.accent || presetBasePalette.accent,
    bg: activeTheme.custom_colors?.bg || presetBasePalette.bg,
    surface: activeTheme.custom_colors?.surface || presetBasePalette.surface,
    ink: activeTheme.custom_colors?.ink || presetBasePalette.ink,
  };

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
    const idx = sectionOrder.indexOf(id);
    const nextIdx = idx + direction;
    if (idx === -1 || nextIdx < 0 || nextIdx >= sectionOrder.length) return;
    const copy = [...sectionOrder];
    const [item] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, item);
    updateTheme({ section_order: copy });
  };

  const handleToggleVisibility = (id: CanvasSectionId) => {
    const exists = hiddenSections.includes(id);
    const nextHidden = exists
      ? hiddenSections.filter((s) => s !== id)
      : [...hiddenSections, id];
    updateTheme({ hidden_sections: nextHidden });
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
    updateTheme({
      color_theme: color,
      custom_colors: undefined,
    });
  };

  const handleUpdateCustomColor = (
    field: "accent" | "bg" | "surface" | "ink",
    hex: string
  ) => {
    updateTheme({
      custom_colors: {
        ...currentCustomColors,
        enabled: true,
        [field]: hex,
      },
    });
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
            aria-label="Toggle Mode Kanvas"
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

          {/* 4 Studio Tabs */}
          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-stone-100 dark:bg-white/5 p-1">
            {(
              [
                { id: "posisi", label: "Posisi" },
                { id: "warna", label: "Warna" },
                { id: "model", label: "Model" },
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

          {/* TAB 1: POSISI */}
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

              {/* Section Order & Visibility */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Urutan &amp; Posisi Section
                </p>
                <div className="space-y-1.5">
                  {sectionOrder.map((secId, idx) => {
                    const isHidden = hiddenSections.includes(secId);
                    return (
                      <div
                        key={secId}
                        className={`flex items-center justify-between gap-2 rounded-xl border border-stone-200 dark:border-white/10 px-3 py-1.5 text-xs ${
                          isHidden
                            ? "opacity-50 bg-stone-100/60 dark:bg-white/[0.02]"
                            : "bg-stone-50/70 dark:bg-white/5"
                        }`}
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
                            onClick={() => handleToggleVisibility(secId)}
                            aria-label={
                              isHidden
                                ? `Tampilkan ${SECTION_LABELS[secId]}`
                                : `Sembunyikan ${SECTION_LABELS[secId]}`
                            }
                            className="rounded-lg p-1 border border-stone-200 dark:border-white/15 hover:border-[var(--storefront-accent)]"
                          >
                            {isHidden ? (
                              <EyeOff className="h-3 w-3 text-rose-500" />
                            ) : (
                              <Eye className="h-3 w-3 text-emerald-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hero Positioning & Model */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Posisi &amp; Model Hero
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {HERO_STYLES.map((hero) => {
                    const active = activeTheme.hero_style === hero.id;
                    return (
                      <button
                        key={hero.id}
                        type="button"
                        onClick={() => updateTheme({ hero_style: hero.id })}
                        className={`rounded-xl px-2.5 py-2 text-[11px] font-bold border text-center transition-all ${
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
                      onClick={() => updateTheme({ custom_colors: undefined })}
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
                          <p className="font-mono text-[9px] text-stone-500 uppercase">
                            {hexVal}
                          </p>
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
              onClick={() => openOrderSchemeModal()}
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
