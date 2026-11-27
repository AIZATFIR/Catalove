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

export const THEME_COLOR_MAP: Record<
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
    light: { accent: "#B45309", glow: "rgba(180, 83, 9, 0.22)", bg: "#FAF7F2", surface: "#F5EBDD", ink: "#29211D" },
    dark: { accent: "#B45309", glow: "rgba(180, 83, 9, 0.28)", bg: "#1C1816", surface: "#29221F", ink: "#F4EDE6" },
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

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return `rgba(194, 120, 56, ${alpha})`;
  }
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
    root.style.setProperty("--font-serif", headingFont);
    root.style.setProperty("--font-active-body", bodyFont);
    root.style.setProperty("--font-sans", bodyFont);

    // Dynamic Typography Scale CSS Variables
    const headingScales: Record<string, string> = {
      sm: "0.82",
      md: "1",
      lg: "1.14",
      xl: "1.28",
    };
    const bodyScales: Record<string, string> = {
      sm: "0.94",
      md: "1",
      lg: "1.08",
    };
    root.style.setProperty(
      "--heading-scale",
      headingScales[themeConfig.heading_scale || "lg"] || "1.14"
    );
    root.style.setProperty(
      "--body-scale",
      bodyScales[themeConfig.body_scale || "md"] || "1"
    );

    // Apply Dynamic Color Palette (custom hex overrides or curated presets)
    const palette = THEME_COLOR_MAP[themeConfig.color_theme] || THEME_COLOR_MAP.warm_oat;
    const custom = themeConfig.custom_colors;

    const applyColors = (darkNow: boolean) => {
      const c =
        custom?.enabled && custom.accent
          ? {
              accent: custom.accent,
              glow: hexToRgba(custom.accent, 0.35),
              bg: custom.bg || palette.light.bg,
              surface: custom.surface || palette.light.surface,
              ink: custom.ink || palette.light.ink,
            }
          : darkNow
            ? palette.dark
            : palette.light;

      root.style.setProperty("--storefront-accent", c.accent);
      root.style.setProperty("--color-accent", c.accent);
      root.style.setProperty("--color-orange", c.accent);
      root.style.setProperty("--color-accent-glow", c.glow);
      root.style.setProperty("--color-orange-glow", c.glow);
      root.style.setProperty("--color-surface-tint", hexToRgba(c.accent, 0.12));
      root.style.setProperty("--storefront-background", c.bg);
      root.style.setProperty("--background", c.bg);
      root.style.setProperty("--storefront-surface", c.surface);
      root.style.setProperty("--storefront-ink", c.ink);
      root.style.setProperty("--foreground", c.ink);
      root.style.setProperty("--storefront-muted", hexToRgba(c.ink, 0.72));
      root.style.setProperty("--storefront-line", hexToRgba(c.ink, 0.16));
    };

    applyColors(root.classList.contains("dark"));

    // Observe dark class changes on root to keep dynamic theme synced
    const observer = new MutationObserver(() => {
      applyColors(root.classList.contains("dark"));
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [themeConfig]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <DynamicThemeBridge />
      {children}
    </NextThemeProvider>
  );
}
