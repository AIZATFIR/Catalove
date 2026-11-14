"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Palette,
  X,
  ArrowRight,
  QrCode,
  Check,
  Loader2,
  LayoutGrid,
  Type,
  Layers,
} from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { saveBusinessSettings } from "@/lib/business-settings";
import {
  DEFAULT_THEME_CONFIG,
  INDUSTRY_PRESETS,
} from "@/lib/data/universal-presets";
import { cakeService } from "@/lib/services/cake-service";
import type {
  BusinessSettings,
  CatalogLayoutOption,
  ColorThemeOption,
  FontHeadingOption,
  IndustryPreset,
} from "@/types/catalove";

const PRESET_OPTIONS: { id: IndustryPreset; label: string }[] = [
  { id: "general", label: "Template" },
  { id: "fashion", label: "Fashion" },
  { id: "bakery", label: "Bakery" },
  { id: "florist", label: "Florist" },
  { id: "crafts", label: "Craft" },
  { id: "gadgets", label: "Gadget" },
  { id: "services", label: "Jasa" },
];

const SCROLL_MODES: { id: CatalogLayoutOption; label: string }[] = [
  { id: "pinterest_masonry", label: "Waterfall" },
  { id: "tiktok_feed", label: "Snap" },
  { id: "grid_3", label: "Grid" },
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
  const [isOpen, setIsOpen] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState<IndustryPreset | null>(null);

  const activeTheme = {
    ...DEFAULT_THEME_CONFIG,
    ...(settings.theme_config || {}),
  };

  const waUrl = `https://wa.me/${settings.seller_whatsapp || "6285946689168"}?text=${encodeURIComponent(
    "Halo, saya mau pesan Catalove untuk brand saya."
  )}`;

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
        },
      };
      saveBusinessSettings(merged);
      await cakeService.applyIndustryPresetCatalog(presetKey);
    } finally {
      setApplyingPreset(null);
    }
  };

  const handleUpdateScrollMode = (layout: CatalogLayoutOption) => {
    saveBusinessSettings({
      ...settings,
      catalog_layout: layout,
      theme_config: {
        ...activeTheme,
        catalog_layout: layout,
      },
    });
  };

  const handleUpdateColor = (color: ColorThemeOption) => {
    saveBusinessSettings({
      ...settings,
      theme_config: {
        ...activeTheme,
        color_theme: color,
      },
    });
  };

  const handleUpdateFont = (font: FontHeadingOption) => {
    saveBusinessSettings({
      ...settings,
      theme_config: {
        ...activeTheme,
        font_heading: font,
      },
    });
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="touch-target group inline-flex items-center gap-2 rounded-full border border-stone-200/80 dark:border-white/15 bg-white/90 dark:bg-stone-900/90 px-3.5 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 shadow-xl backdrop-blur-xl hover:scale-[1.03] active:scale-95 transition-all"
          aria-label="Tema"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--storefront-accent)] text-white shadow-sm">
            <Palette className="h-3.5 w-3.5" />
          </span>
          <span>Tema</span>
        </button>
      ) : (
        <aside
          aria-label="Kustomisasi Tema"
          className="w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-stone-200/90 dark:border-white/15 bg-white/95 dark:bg-[#1E1815]/95 p-4 text-stone-900 dark:text-stone-100 shadow-2xl backdrop-blur-2xl space-y-4 animate-slide-up max-h-[82vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-stone-200/70 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--storefront-accent)] text-white">
                <Palette className="h-3.5 w-3.5" />
              </span>
              <h2 className="font-serif text-sm font-bold leading-none">
                Tema
              </h2>
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

          {/* 1. Industry Presets */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <Layers className="h-3 w-3 text-[var(--storefront-accent)]" />
              <span>Preset</span>
            </div>
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
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-all ${
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

          {/* 2. Scroll Mode */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <LayoutGrid className="h-3 w-3 text-[var(--storefront-accent)]" />
              <span>Layout</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {SCROLL_MODES.map((mode) => {
                const active =
                  (settings.catalog_layout || activeTheme.catalog_layout) === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleUpdateScrollMode(mode.id)}
                    className={`rounded-xl px-2 py-2 text-[11px] font-bold border text-center transition-all ${
                      active
                        ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/15 text-[var(--storefront-accent)]"
                        : "border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Colors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <span>Warna</span>
              <span className="font-mono text-[9px] text-[var(--storefront-accent)]">
                {COLOR_SWATCHES.find((c) => c.id === activeTheme.color_theme)?.label ||
                  activeTheme.color_theme}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1.5 rounded-2xl bg-stone-100/80 dark:bg-white/5 p-2">
              {COLOR_SWATCHES.map((swatch) => {
                const active = activeTheme.color_theme === swatch.id;
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => handleUpdateColor(swatch.id)}
                    title={swatch.label}
                    aria-label={swatch.label}
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
                      active ? "border-stone-900 dark:border-white scale-110 shadow-md" : "border-white/70"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {active && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Heading Typography */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <Type className="h-3 w-3 text-[var(--storefront-accent)]" />
              <span>Font</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {HEADING_FONTS.map((font) => {
                const active = activeTheme.font_heading === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => handleUpdateFont(font.id)}
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

          {/* Footer Shortcuts */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-200/70 dark:border-white/10">
            <Link
              href="/bio"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-white/15 py-2.5 px-3 text-xs font-bold hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
            >
              <QrCode className="h-3.5 w-3.5 text-[var(--storefront-accent)]" />
              <span>Bio</span>
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--storefront-accent)] py-2.5 px-3 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-opacity"
            >
              <span>Pesan Catalove</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </aside>
      )}
    </div>
  );
}
