"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Navbar } from "@/components/storefront/Navbar";
import { Hero } from "@/components/storefront/Hero";
import { CakeScrollShowcase } from "@/components/storefront/CakeScrollShowcase";
import { CakeCircularCarousel } from "@/components/storefront/CakeCircularCarousel";
import { BrandStory } from "@/components/storefront/BrandStory";
import { Footer } from "@/components/storefront/Footer";
import { RecommendationDrawer } from "@/components/ai/RecommendationDrawer";
import { DiscoveryFeed } from "@/components/storefront/DiscoveryFeed";
import {
  CollectionIndexSection,
  FaqMinimalSection,
  FeaturedSplitSection,
  StatementBannerSection,
} from "@/components/storefront/CustomCanvasSections";
import {
  ALL_CANVAS_SECTIONS,
  DEFAULT_SECTION_ORDER,
  PricingSection,
  openOrderSchemeModal,
} from "@/components/storefront/PricingSection";
import { StickyCard002 } from "@/components/ui/skiper-ui/skiper17";
import { Skiper8 } from "@/components/ui/skiper-ui/skiper8";
import { Category, Product } from "@/types/bakery";
import type {
  BodyScaleOption,
  CanvasSectionId,
  CardStyleOption,
  CatalogLayoutOption,
  FontBodyOption,
  FontHeadingOption,
  HeadingScaleOption,
  HeroStyleOption,
  SectionCustomConfig,
  SectionSpacingOption,
  SectionToneOption,
} from "@/types/catalove";
import { DEFAULT_THEME_CONFIG } from "@/lib/data/universal-presets";
import { saveBusinessSettings } from "@/lib/business-settings";
import { cakeService } from "@/lib/services/cake-service";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

const SECTION_TITLE_MAP: Record<CanvasSectionId, string> = ALL_CANVAS_SECTIONS.reduce(
  (acc, item) => {
    acc[item.id] = item.title;
    return acc;
  },
  {} as Record<CanvasSectionId, string>
);

const VALID_SECTION_IDS = new Set<CanvasSectionId>(
  ALL_CANVAS_SECTIONS.map((s) => s.id)
);

const HERO_MODELS: { id: HeroStyleOption; label: string }[] = [
  { id: "split_dynamic", label: "Split Kanan" },
  { id: "split_reverse", label: "Split Kiri" },
  { id: "minimal_center", label: "Center" },
  { id: "bento_grid", label: "Bento" },
  { id: "rotating_showcase", label: "Showcase" },
];

const FEED_MODELS: {
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

const CARD_MODELS: { id: CardStyleOption; label: string }[] = [
  { id: "clean_flat", label: "Flat" },
  { id: "minimal_mono", label: "Mono" },
  { id: "modern_glass", label: "Surface" },
  { id: "bordered_clay", label: "Border" },
];

const HEADING_FONT_OPTIONS: { id: FontHeadingOption; label: string }[] = [
  { id: "playfair", label: "Playfair" },
  { id: "cormorant", label: "Cormorant" },
  { id: "syne", label: "Syne" },
  { id: "space_grotesk", label: "Space" },
  { id: "outfit", label: "Outfit" },
  { id: "jakarta", label: "Jakarta" },
  { id: "inter", label: "Inter" },
];

const BODY_FONT_OPTIONS: { id: FontBodyOption; label: string }[] = [
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

const TONE_OPTIONS: { id: SectionToneOption; label: string }[] = [
  { id: "default", label: "Latar" },
  { id: "surface", label: "Surface" },
  { id: "accent", label: "Aksen" },
  { id: "ink", label: "Gelap" },
];

const SPACING_OPTIONS: { id: SectionSpacingOption; label: string }[] = [
  { id: "compact", label: "Rapat" },
  { id: "normal", label: "Normal" },
  { id: "spacious", label: "Lega" },
];

const TONE_WRAPPER_CLASS: Record<SectionToneOption, string> = {
  default: "bg-[var(--storefront-background)] text-[var(--storefront-ink)]",
  surface: "bg-[var(--storefront-surface)] text-[var(--storefront-ink)]",
  accent: "bg-[var(--storefront-accent)] text-white",
  ink: "bg-stone-950 text-stone-50 dark:bg-black dark:text-stone-50",
};

const TONE_CSS_OVERRIDES: Record<SectionToneOption, React.CSSProperties | undefined> = {
  default: undefined,
  surface: undefined,
  accent: {
    "--storefront-ink": "#FFFFFF",
    "--storefront-line": "rgba(255, 255, 255, 0.28)",
  } as React.CSSProperties,
  ink: {
    "--storefront-ink": "#FAF8F5",
    "--storefront-line": "rgba(255, 255, 255, 0.22)",
  } as React.CSSProperties,
};

const SPACING_WRAPPER_CLASS: Record<SectionSpacingOption, string> = {
  compact: "py-8 sm:py-12",
  normal: "py-14 sm:py-20",
  spacious: "py-20 sm:py-28",
};

export default function HomePage() {
  const settings = useBusinessSettings();
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [draggedSection, setDraggedSection] = useState<CanvasSectionId | null>(
    null
  );
  const [dragReadySection, setDragReadySection] =
    useState<CanvasSectionId | null>(null);
  const [dragOverSection, setDragOverSection] =
    useState<CanvasSectionId | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("canvas") === "1") {
        setIsCanvasMode(true);
      }
    }

    const handleToggleCanvas = (e: Event) => {
      const detail = (e as CustomEvent<{ open?: boolean }>).detail;
      if (typeof detail?.open === "boolean") {
        setIsCanvasMode(detail.open);
      } else {
        setIsCanvasMode((prev) => !prev);
      }
    };

    window.addEventListener("catalove-toggle-canvas", handleToggleCanvas);
    return () => {
      window.removeEventListener("catalove-toggle-canvas", handleToggleCanvas);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("catalove-canvas-state", {
        detail: { active: isCanvasMode },
      })
    );
  }, [isCanvasMode]);

  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      const [prods, cats] = await Promise.all([
        cakeService.getProducts({ includeInactive: false }),
        cakeService.getCategories(),
      ]);
      if (!active) return;
      if (prods) {
        setProducts(prods.filter((p) => p.is_active));
      }
      if (cats) {
        setCategories(cats);
      }
    };

    loadCatalog();

    const handleCatalogUpdate = () => {
      loadCatalog();
    };

    window.addEventListener("catalove-catalog-updated", handleCatalogUpdate);
    window.addEventListener("catalove-settings-change", handleCatalogUpdate);
    window.addEventListener("storage", handleCatalogUpdate);

    return () => {
      active = false;
      window.removeEventListener("catalove-catalog-updated", handleCatalogUpdate);
      window.removeEventListener("catalove-settings-change", handleCatalogUpdate);
      window.removeEventListener("storage", handleCatalogUpdate);
    };
  }, []);

  const stickyCards = useMemo(() => {
    return products
      .filter((p) => p.is_active && p.images?.length > 0)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        image:
          p.images.find((img) => img.is_primary)?.storage_path ||
          p.images[0]?.storage_path,
        title: p.name,
        subtitle: p.category?.name || "",
        price: p.base_price,
        slug: p.slug,
        leadTime: p.minimum_lead_time_days,
        alt: p.name,
      }));
  }, [products]);

  const activeTheme = useMemo(
    () => ({
      ...DEFAULT_THEME_CONFIG,
      ...(settings.theme_config || {}),
    }),
    [settings.theme_config]
  );

  // Additive Canvas model: starts with Hero only unless user adds sections
  const activeSections: CanvasSectionId[] = useMemo(() => {
    const saved = activeTheme.section_order;
    const base = saved && saved.length > 0 ? saved : DEFAULT_SECTION_ORDER;
    const hidden = new Set(activeTheme.hidden_sections || []);
    const list: CanvasSectionId[] = [];
    for (const id of base) {
      if (VALID_SECTION_IDS.has(id) && !list.includes(id) && !hidden.has(id)) {
        list.push(id);
      }
    }
    return list.length > 0 ? list : ["hero"];
  }, [activeTheme.section_order, activeTheme.hidden_sections]);

  const updateTheme = (patch: Partial<typeof activeTheme>) => {
    saveBusinessSettings({
      ...settings,
      theme_config: {
        ...activeTheme,
        ...patch,
      },
    });
  };

  const updateSectionMeta = (
    id: CanvasSectionId,
    patch: Partial<SectionCustomConfig>
  ) => {
    const currentConfigs = activeTheme.section_configs || {};
    updateTheme({
      section_configs: {
        ...currentConfigs,
        [id]: {
          ...(currentConfigs[id] || {}),
          ...patch,
        },
      },
    });
  };

  const addSection = (id: CanvasSectionId, insertAfterIndex?: number) => {
    const currentHidden = activeTheme.hidden_sections || [];
    const nextHidden = currentHidden.filter((h) => h !== id);

    if (activeSections.includes(id)) {
      updateTheme({ hidden_sections: nextHidden });
      return;
    }

    const nextOrder = [...activeSections];
    if (
      typeof insertAfterIndex === "number" &&
      insertAfterIndex >= 0 &&
      insertAfterIndex < nextOrder.length
    ) {
      nextOrder.splice(insertAfterIndex + 1, 0, id);
    } else {
      nextOrder.push(id);
    }

    updateTheme({
      section_order: nextOrder,
      hidden_sections: nextHidden,
    });
  };

  const removeSection = (id: CanvasSectionId) => {
    if (activeSections.length <= 1) return;
    const nextOrder = activeSections.filter((item) => item !== id);
    updateTheme({
      section_order: nextOrder.length > 0 ? nextOrder : ["hero"],
    });
  };

  const moveSection = (id: CanvasSectionId, direction: -1 | 1) => {
    const idx = activeSections.indexOf(id);
    const nextIdx = idx + direction;
    if (idx === -1 || nextIdx < 0 || nextIdx >= activeSections.length) return;
    const copy = [...activeSections];
    const [item] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, item);
    updateTheme({ section_order: copy });
  };

  const reorderSectionToTarget = (
    fromId: CanvasSectionId,
    toId: CanvasSectionId
  ) => {
    if (fromId === toId) return;
    const copy = [...activeSections];
    const fromIdx = copy.indexOf(fromId);
    const toIdx = copy.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    updateTheme({ section_order: copy });
  };

  const loadFullPresetSections = () => {
    updateTheme({
      section_order: [
        "hero",
        "feed",
        "featured_split",
        "collection_index",
        "statement_banner",
        "faq_minimal",
        "pricing",
        "cta",
      ],
      hidden_sections: [],
    });
  };

  const resetCanvasToHeroOnly = () => {
    saveBusinessSettings({
      ...settings,
      catalog_layout: "pinterest_masonry",
      theme_config: {
        ...activeTheme,
        font_heading: "playfair",
        font_body: "jakarta",
        heading_scale: "lg",
        body_scale: "md",
        hero_align: "left",
        hero_style: "split_dynamic",
        catalog_layout: "pinterest_masonry",
        catalog_columns_desktop: 3,
        card_style: "clean_flat",
        custom_colors: undefined,
        section_order: ["hero"],
        hidden_sections: [],
        section_configs: {},
      },
    });
  };

  const activeCatalogLayout =
    settings.catalog_layout || activeTheme.catalog_layout || "pinterest_masonry";

  const renderSectionContent = (id: CanvasSectionId) => {
    switch (id) {
      case "hero":
        return (
          <Hero
            products={products}
            onOpenQuiz={() => setIsQuizOpen(true)}
            isCanvasMode={isCanvasMode}
            onToggleCanvasMode={() => setIsCanvasMode((v) => !v)}
          />
        );
      case "feed":
        return (
          <DiscoveryFeed
            products={products}
            categories={categories}
            isCanvasMode={isCanvasMode}
          />
        );
      case "featured_split":
        return (
          <FeaturedSplitSection
            products={products}
            isCanvasMode={isCanvasMode}
          />
        );
      case "collection_index":
        return (
          <CollectionIndexSection
            products={products}
            isCanvasMode={isCanvasMode}
          />
        );
      case "statement_banner":
        return <StatementBannerSection isCanvasMode={isCanvasMode} />;
      case "pricing":
        return (
          <PricingSection
            isCanvasMode={isCanvasMode}
            onEnableCanvasMode={() => setIsCanvasMode(true)}
          />
        );
      case "lookbook":
        if (stickyCards.length <= 1) {
          return isCanvasMode ? (
            <div className="py-10 text-center text-xs opacity-70">
              Lookbook Sticky (perlu minimal 2 produk aktif)
            </div>
          ) : null;
        }
        return (
          <section aria-labelledby="featured-cakes-title">
            <div className="mx-auto max-w-3xl px-4 pb-5 sm:px-8 text-center">
              <h2
                id="featured-cakes-title"
                className="font-serif text-3xl font-medium text-[var(--storefront-ink)] sm:text-5xl"
              >
                Lookbook
              </h2>
            </div>
            <StickyCard002 cards={stickyCards} />
          </section>
        );
      case "showcase":
        return <CakeScrollShowcase products={products} />;
      case "carousel":
        return (
          <section aria-labelledby="scroll-cakes-title">
            <div className="mx-auto max-w-[1600px] px-4 pb-4 sm:px-8 lg:px-12">
              <div className="flex items-end justify-between gap-5">
                <h2
                  id="scroll-cakes-title"
                  className="font-serif text-3xl font-medium text-[var(--storefront-ink)] sm:text-5xl"
                >
                  {settings.showcase_title || "Lookbook"}
                </h2>
                <Link
                  href="/catalog"
                  className="touch-target inline-flex items-center border-b border-[var(--storefront-line)] text-sm font-medium text-[var(--storefront-ink)] transition-colors hover:text-[var(--storefront-accent)]"
                >
                  {settings.showcase_link_text || "Katalog"}
                </Link>
              </div>
            </div>
            <CakeCircularCarousel products={products} variant="gallery" />
          </section>
        );
      case "faq_minimal":
        return <FaqMinimalSection isCanvasMode={isCanvasMode} />;
      case "cta":
        return <BrandStory isCanvasMode={isCanvasMode} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Skiper8 products={products} />

      <Navbar onOpenQuiz={() => setIsQuizOpen(true)} />

      {/* Top Canvas Mode Banner Bar */}
      {isCanvasMode && (
        <div className="sticky top-16 sm:top-[4.5rem] z-30 border-b border-[var(--storefront-accent)] bg-[var(--storefront-surface)] px-4 py-2.5 sm:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--storefront-ink)]">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--storefront-accent)] animate-pulse" />
              <span>
                <strong>Mode Kanvas</strong> ({activeSections.length} section aktif) — Edit teks langsung di layar, ubah font &amp; ukuran, lalu tambah section di bawah.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={resetCanvasToHeroOnly}
                className="inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-white/20 bg-white/80 dark:bg-stone-900 px-3 py-1 text-[11px] font-bold hover:border-[var(--storefront-accent)]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset ke Hero Saja</span>
              </button>
              <button
                type="button"
                onClick={() => openOrderSchemeModal()}
                className="rounded-full bg-[var(--storefront-accent)] px-3.5 py-1 text-[11px] font-bold text-white hover:opacity-95"
              >
                Pilih Paket &amp; Pesan
              </button>
              <button
                type="button"
                onClick={() => setIsCanvasMode(false)}
                className="rounded-full bg-stone-900 dark:bg-white px-3.5 py-1 text-[11px] font-bold text-white dark:text-stone-950"
              >
                Selesai Edit
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeSections.map((sectionId, idx) => {
          const content = renderSectionContent(sectionId);
          if (!content) return null;

          const secCfg = activeTheme.section_configs?.[sectionId];
          const tone: SectionToneOption = secCfg?.tone || "default";
          const spacing: SectionSpacingOption = secCfg?.spacing || "normal";
          const managesOwnPadding = sectionId === "hero" || sectionId === "showcase";

          const toneClass = TONE_WRAPPER_CLASS[tone];
          const toneStyle = TONE_CSS_OVERRIDES[tone];
          const spacingClass = managesOwnPadding ? "" : SPACING_WRAPPER_CLASS[spacing];

          if (!isCanvasMode) {
            return (
              <div
                key={sectionId}
                style={toneStyle}
                className={`${toneClass} ${spacingClass} transition-colors`}
              >
                {content}
              </div>
            );
          }

          const isDragOver = dragOverSection === sectionId;
          const stepNum = String(idx + 1).padStart(2, "0");

          return (
            <div
              key={sectionId}
              id={`canvas-section-${sectionId}`}
              draggable={dragReadySection === sectionId}
              onDragStart={(e) => {
                setDraggedSection(sectionId);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", sectionId);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedSection && draggedSection !== sectionId) {
                  setDragOverSection(sectionId);
                }
              }}
              onDragLeave={() => {
                if (dragOverSection === sectionId) setDragOverSection(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedSection) {
                  reorderSectionToTarget(draggedSection, sectionId);
                }
                setDraggedSection(null);
                setDragReadySection(null);
                setDragOverSection(null);
              }}
              onDragEnd={() => {
                setDraggedSection(null);
                setDragReadySection(null);
                setDragOverSection(null);
              }}
              className={`border-b border-[var(--storefront-line)] transition-all ${
                isDragOver ? "ring-2 ring-[var(--storefront-accent)]" : ""
              }`}
            >
              {/* Slim Full-Width Canvas Control Header */}
              <div className="bg-[var(--storefront-surface)] border-y border-[var(--storefront-accent)] px-4 sm:px-8 py-2">
                <div className="mx-auto max-w-[1600px] flex flex-wrap items-center justify-between gap-2">
                  {/* Position + Section Title */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onPointerDown={() => setDragReadySection(sectionId)}
                      onPointerUp={() => setDragReadySection(null)}
                      className="cursor-grab active:cursor-grabbing rounded p-1 text-[var(--storefront-accent)] hover:bg-[var(--color-surface-tint)]"
                      title="Drag untuk pindah posisi"
                      aria-label={`Drag ${SECTION_TITLE_MAP[sectionId]}`}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>

                    <span className="rounded-full bg-[var(--storefront-accent)] px-2.5 py-0.5 text-[10px] font-bold text-white">
                      {stepNum} · {SECTION_TITLE_MAP[sectionId]}
                    </span>

                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSection(sectionId, -1)}
                        aria-label={`Naikkan ${SECTION_TITLE_MAP[sectionId]}`}
                        className="rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 p-1 disabled:opacity-35 hover:border-[var(--storefront-accent)]"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === activeSections.length - 1}
                        onClick={() => moveSection(sectionId, 1)}
                        aria-label={`Turunkan ${SECTION_TITLE_MAP[sectionId]}`}
                        className="rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 p-1 disabled:opacity-35 hover:border-[var(--storefront-accent)]"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Per-Section Style & Tone Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {sectionId === "hero" && (
                      <>
                        <select
                          aria-label="Pilih Font Heading"
                          value={activeTheme.font_heading}
                          onChange={(e) =>
                            updateTheme({
                              font_heading: e.target.value as FontHeadingOption,
                            })
                          }
                          className="rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 px-2.5 py-1 text-[10px] font-bold focus:outline-none"
                        >
                          {HEADING_FONT_OPTIONS.map((f) => (
                            <option key={f.id} value={f.id}>
                              Heading: {f.label}
                            </option>
                          ))}
                        </select>

                        <select
                          aria-label="Pilih Font Body"
                          value={activeTheme.font_body}
                          onChange={(e) =>
                            updateTheme({
                              font_body: e.target.value as FontBodyOption,
                            })
                          }
                          className="rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 px-2.5 py-1 text-[10px] font-bold focus:outline-none"
                        >
                          {BODY_FONT_OPTIONS.map((f) => (
                            <option key={f.id} value={f.id}>
                              Teks: {f.label}
                            </option>
                          ))}
                        </select>

                        <div className="inline-flex items-center rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 p-0.5">
                          <span className="px-1.5 text-[9px] font-semibold opacity-60">
                            Judul
                          </span>
                          {HEADING_SCALES.map((sc) => (
                            <button
                              key={sc.id}
                              type="button"
                              onClick={() => updateTheme({ heading_scale: sc.id })}
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                (activeTheme.heading_scale || "lg") === sc.id
                                  ? "bg-[var(--storefront-accent)] text-white"
                                  : "hover:opacity-75"
                              }`}
                            >
                              {sc.label}
                            </button>
                          ))}
                        </div>

                        <div className="inline-flex items-center rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 p-0.5">
                          <span className="px-1.5 text-[9px] font-semibold opacity-60">
                            Teks
                          </span>
                          {BODY_SCALES.map((sc) => (
                            <button
                              key={sc.id}
                              type="button"
                              onClick={() => updateTheme({ body_scale: sc.id })}
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                (activeTheme.body_scale || "md") === sc.id
                                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                                  : "hover:opacity-75"
                              }`}
                            >
                              {sc.label}
                            </button>
                          ))}
                        </div>

                        <div className="inline-flex items-center rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 p-0.5">
                          {(["left", "center"] as const).map((al) => (
                            <button
                              key={al}
                              type="button"
                              onClick={() => updateTheme({ hero_align: al })}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                (activeTheme.hero_align || "left") === al
                                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                                  : "hover:opacity-75"
                              }`}
                            >
                              {al === "left" ? "Kiri" : "Tengah"}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          {HERO_MODELS.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => updateTheme({ hero_style: m.id })}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                activeTheme.hero_style === m.id
                                  ? "border-[var(--storefront-accent)] bg-stone-900 text-white dark:bg-white dark:text-stone-950"
                                  : "border-stone-300 dark:border-white/20 bg-white/80 dark:bg-stone-800"
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {sectionId === "feed" && (
                      <div className="flex flex-wrap items-center gap-1">
                        {FEED_MODELS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              saveBusinessSettings({
                                ...settings,
                                catalog_layout: m.id,
                                theme_config: {
                                  ...activeTheme,
                                  catalog_layout: m.id,
                                  ...(m.cols
                                    ? { catalog_columns_desktop: m.cols }
                                    : {}),
                                },
                              });
                            }}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              activeCatalogLayout === m.id
                                ? "border-[var(--storefront-accent)] bg-stone-900 text-white dark:bg-white dark:text-stone-950"
                                : "border-stone-300 dark:border-white/20 bg-white/80 dark:bg-stone-800"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                        <span className="mx-0.5 text-[10px] opacity-40">|</span>
                        {CARD_MODELS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => updateTheme({ card_style: c.id })}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              activeTheme.card_style === c.id
                                ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white"
                                : "border-stone-300 dark:border-white/20 bg-white/80 dark:bg-stone-800"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Universal Section Tone Picker */}
                    <div className="inline-flex items-center rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 p-0.5">
                      {TONE_OPTIONS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            updateSectionMeta(sectionId, { tone: t.id })
                          }
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            tone === t.id
                              ? "bg-[var(--storefront-accent)] text-white"
                              : "hover:opacity-75"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Section Vertical Spacing Picker */}
                    {!managesOwnPadding && (
                      <div className="inline-flex items-center rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 p-0.5">
                        {SPACING_OPTIONS.map((sp) => (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() =>
                              updateSectionMeta(sectionId, { spacing: sp.id })
                            }
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              spacing === sp.id
                                ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                                : "hover:opacity-75"
                            }`}
                          >
                            {sp.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Remove Section from Canvas */}
                    <button
                      type="button"
                      disabled={activeSections.length <= 1}
                      onClick={() => removeSection(sectionId)}
                      className="inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 px-2.5 py-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:border-rose-400 disabled:opacity-35"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={toneStyle}
                className={`${toneClass} ${spacingClass} transition-colors`}
              >
                {content}
              </div>
            </div>
          );
        })}

        {/* Additive Section Picker Tray (Canvas Mode Only) */}
        {isCanvasMode && (
          <section
            aria-label="Tambah Section Baru"
            className="border-t border-[var(--storefront-line)] bg-[var(--storefront-surface)] py-12 sm:py-16"
          >
            <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12 space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--storefront-ink)]">
                    Tambah Section ke Halaman
                  </h2>
                  <p className="text-sm text-[var(--storefront-ink)] opacity-75">
                    Mulai dari Hero saja, lalu tambahkan blok sesuai kebutuhan brandmu.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={loadFullPresetSections}
                    className="rounded-full border border-[var(--storefront-line)] bg-[var(--storefront-background)] px-4 py-2 text-xs font-bold text-[var(--storefront-ink)] hover:border-[var(--storefront-accent)]"
                  >
                    Tampilkan Preset Lengkap (8 Blok)
                  </button>
                  <button
                    type="button"
                    onClick={resetCanvasToHeroOnly}
                    className="rounded-full border border-[var(--storefront-line)] bg-[var(--storefront-background)] px-4 py-2 text-xs font-bold text-[var(--storefront-ink)] hover:border-rose-400"
                  >
                    Kosongkan ke Hero Saja
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_CANVAS_SECTIONS.map((item) => {
                  const isActive = activeSections.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                        isActive
                          ? "border-[var(--storefront-accent)] bg-[var(--storefront-background)]"
                          : "border-[var(--storefront-line)] bg-[var(--storefront-background)]"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-serif text-base font-medium text-[var(--storefront-ink)]">
                          {item.title}
                        </p>
                        <p className="text-xs text-[var(--storefront-ink)] opacity-70 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(
                              `canvas-section-${item.id}`
                            );
                            el?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-tint)] px-3 py-1.5 text-xs font-bold text-[var(--storefront-accent)]"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Aktif</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addSection(item.id)}
                          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--storefront-accent)] px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-95 transition-opacity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Tambah</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />

      <RecommendationDrawer
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        products={products}
      />
    </div>
  );
}
