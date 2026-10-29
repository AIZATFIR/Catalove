"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import type { ThemeConfig } from "@/types/catalove";

const FONT_HEADING_MAP: Record<string, string> = {
  playfair: "var(--font-playfair), serif",
  cormorant: "var(--font-cormorant), serif",
  outfit: "var(--font-outfit), sans-serif",
  syne: "var(--font-syne), sans-serif",
  space_grotesk: "var(--font-space), monospace",
  inter: "var(--font-inter), sans-serif",
  jakarta: "var(--font-jakarta), sans-serif",
};

const FONT_BODY_MAP: Record<string, string> = {
  jakarta: "var(--font-jakarta), sans-serif",
  inter: "var(--font-inter), sans-serif",
  outfit: "var(--font-outfit), sans-serif",
};

const THEME_COLOR_MAP: Record<
  string,
  {
    light: { accent: string; glow: string; bg: string; surface: string; ink: string };
    dark: { accent: string; glow: string; bg: string; surface: string; ink: string };
  }
> = {
  noir_gold: {
    light: { accent: "#D97706", glow: "rgba(217, 119, 6, 0.35)", bg: "#FAF8F5", surface: "#F3EDE4", ink: "#1E1A16" },
    dark: { accent: "#F59E0B", glow: "rgba(245, 158, 11, 0.45)", bg: "#0C0F17", surface: "#151B28", ink: "#F8FAFC" },
  },
  warm_oat: {
    light: { accent: "#C27838", glow: "rgba(194, 120, 56, 0.35)", bg: "#FAF7F2", surface: "#F5EBDD", ink: "#29211D" },
    dark: { accent: "#D97706", glow: "rgba(217, 119, 6, 0.4)", bg: "#1C1816", surface: "#29221F", ink: "#F4EDE6" },
  },
  matcha_sage: {
    light: { accent: "#15803D", glow: "rgba(21, 128, 61, 0.35)", bg: "#F7FAF8", surface: "#EAF3ED", ink: "#142519" },
    dark: { accent: "#22C55E", glow: "rgba(34, 197, 94, 0.4)", bg: "#0F1A13", surface: "#16281D", ink: "#F0FDF4" },
  },
  rose_velvet: {
    light: { accent: "#BE185D", glow: "rgba(190, 24, 93, 0.35)", bg: "#FCF8FA", surface: "#F8ECF3", ink: "#2B1420" },
    dark: { accent: "#F43F5E", glow: "rgba(244, 63, 94, 0.4)", bg: "#1A0E15", surface: "#281521", ink: "#FFF1F2" },
  },
  minimal_slate: {
    light: { accent: "#0F172A", glow: "rgba(15, 23, 42, 0.25)", bg: "#FFFFFF", surface: "#F1F5F9", ink: "#0F172A" },
    dark: { accent: "#38BDF8", glow: "rgba(56, 189, 248, 0.4)", bg: "#090D16", surface: "#111827", ink: "#F8FAFC" },
  },
  sunset_terracotta: {
    light: { accent: "#EA580C", glow: "rgba(234, 88, 12, 0.35)", bg: "#FFFBF7", surface: "#FCEFE6", ink: "#2C170B" },
    dark: { accent: "#FB923C", glow: "rgba(251, 146, 60, 0.4)", bg: "#1A0F09", surface: "#2B1910", ink: "#FFF7ED" },
  },
  cyber_neo: {
    light: { accent: "#0284C7", glow: "rgba(2, 132, 199, 0.35)", bg: "#F8FAFC", surface: "#E0F2FE", ink: "#0B192C" },
    dark: { accent: "#06B6D4", glow: "rgba(6, 182, 212, 0.45)", bg: "#06090F", surface: "#0D1524", ink: "#ECFEFF" },
  },
};

function DynamicThemeBridge() {
  const settings = useBusinessSettings();
  const themeConfig: ThemeConfig = settings?.theme_config || {
    font_heading: "playfair",
    font_body: "jakarta",
    color_theme: "warm_oat",
    card_style: "modern_glass",
    hero_style: "split_dynamic",
    catalog_columns_desktop: 3,
    catalog_columns_mobile: 2,
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // Apply Dynamic Fonts
    const headingFont = FONT_HEADING_MAP[themeConfig.font_heading] || FONT_HEADING_MAP.playfair;
    const bodyFont = FONT_BODY_MAP[themeConfig.font_body] || FONT_BODY_MAP.jakarta;

    root.style.setProperty("--font-active-heading", headingFont);
    root.style.setProperty("--font-active-body", bodyFont);

    // Apply Dynamic Color Palette
    const palette = THEME_COLOR_MAP[themeConfig.color_theme] || THEME_COLOR_MAP.warm_oat;
    const isDark = root.classList.contains("dark");
    const activeColors = isDark ? palette.dark : palette.light;

    root.style.setProperty("--storefront-accent", activeColors.accent);
    root.style.setProperty("--color-accent-glow", activeColors.glow);
    root.style.setProperty("--storefront-background", activeColors.bg);
    root.style.setProperty("--storefront-surface", activeColors.surface);
    root.style.setProperty("--storefront-ink", activeColors.ink);

    // Observe dark class changes on root to keep dynamic theme synced
    const observer = new MutationObserver(() => {
      const darkNow = root.classList.contains("dark");
      const c = darkNow ? palette.dark : palette.light;
      root.style.setProperty("--storefront-accent", c.accent);
      root.style.setProperty("--color-accent-glow", c.glow);
      root.style.setProperty("--storefront-background", c.bg);
      root.style.setProperty("--storefront-surface", c.surface);
      root.style.setProperty("--storefront-ink", c.ink);
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [themeConfig]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <DynamicThemeBridge />
      {children}
    </NextThemeProvider>
  );
}
