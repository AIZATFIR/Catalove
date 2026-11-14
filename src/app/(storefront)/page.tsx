"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
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
  DEFAULT_SECTION_ORDER,
  PricingSection,
  openOrderSchemeModal,
} from "@/components/storefront/PricingSection";
import { StickyCard002 } from "@/components/ui/skiper-ui/skiper17";
import { Skiper8 } from "@/components/ui/skiper-ui/skiper8";
import { Category, Product } from "@/types/bakery";
import type {
  CanvasSectionId,
  CardStyleOption,
  CatalogLayoutOption,
  HeroStyleOption,
} from "@/types/catalove";
import { DEFAULT_THEME_CONFIG } from "@/lib/data/universal-presets";
import { saveBusinessSettings } from "@/lib/business-settings";
import { cakeService } from "@/lib/services/cake-service";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

const SECTION_LABELS: Record<CanvasSectionId, string> = {
  hero: "Hero",
  feed: "Katalog Feed",
  pricing: "Harga & Skema",
  lookbook: "Lookbook Sticky",
  showcase: "Showcase Scroll",
  carousel: "Galeri Carousel",
  cta: "Banner CTA",
};

const HERO_MODELS: { id: HeroStyleOption; label: string }[] = [
  { id: "split_dynamic", label: "Split Kanan" },
  { id: "split_reverse", label: "Split Kiri" },
  { id: "minimal_center", label: "Center" },
  { id: "bento_grid", label: "Bento" },
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
  { id: "modern_glass", label: "Glass" },
  { id: "clean_flat", label: "Flat" },
  { id: "bordered_clay", label: "Clay" },
  { id: "minimal_mono", label: "Mono" },
];

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
        subtitle: p.category?.name || "Sample",
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

  const orderedSections: CanvasSectionId[] = useMemo(() => {
    const saved = activeTheme.section_order || [];
    const seen = new Set<CanvasSectionId>();
    const list: CanvasSectionId[] = [];
    for (const id of saved) {
      if (DEFAULT_SECTION_ORDER.includes(id) && !seen.has(id)) {
        seen.add(id);
        list.push(id);
      }
    }
    for (const id of DEFAULT_SECTION_ORDER) {
      if (!seen.has(id)) {
        seen.add(id);
        list.push(id);
      }
    }
    return list;
  }, [activeTheme.section_order]);

  const hiddenSections: CanvasSectionId[] = activeTheme.hidden_sections || [];

  const updateTheme = (patch: Partial<typeof activeTheme>) => {
    saveBusinessSettings({
      ...settings,
      theme_config: {
        ...activeTheme,
        ...patch,
      },
    });
  };

  const moveSection = (id: CanvasSectionId, direction: -1 | 1) => {
    const idx = orderedSections.indexOf(id);
    const nextIdx = idx + direction;
    if (idx === -1 || nextIdx < 0 || nextIdx >= orderedSections.length) return;
    const copy = [...orderedSections];
    const [item] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, item);
    updateTheme({ section_order: copy });
  };

  const reorderSectionToTarget = (
    fromId: CanvasSectionId,
    toId: CanvasSectionId
  ) => {
    if (fromId === toId) return;
    const copy = [...orderedSections];
    const fromIdx = copy.indexOf(fromId);
    const toIdx = copy.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    updateTheme({ section_order: copy });
  };

  const toggleHideSection = (id: CanvasSectionId) => {
    const exists = hiddenSections.includes(id);
    const nextHidden = exists
      ? hiddenSections.filter((s) => s !== id)
      : [...hiddenSections, id];
    updateTheme({ hidden_sections: nextHidden });
  };

  const resetCanvas = () => {
    saveBusinessSettings({
      ...settings,
      catalog_layout: "pinterest_masonry",
      theme_config: {
        ...activeTheme,
        hero_style: "split_dynamic",
        catalog_layout: "pinterest_masonry",
        catalog_columns_desktop: 3,
        card_style: "modern_glass",
        custom_colors: undefined,
        section_order: [...DEFAULT_SECTION_ORDER],
        hidden_sections: [],
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
        return <DiscoveryFeed products={products} categories={categories} />;
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
            <div className="py-10 text-center text-xs text-stone-500">
              Lookbook Sticky (perlu minimal 2 produk aktif)
            </div>
          ) : null;
        }
        return (
          <section
            aria-labelledby="featured-cakes-title"
            className="border-b border-[#DBD0C5]/40 py-10 sm:py-14 dark:border-white/10"
          >
            <div className="mx-auto max-w-3xl px-4 pb-5 sm:px-8 text-center">
              <h2
                id="featured-cakes-title"
                className="font-serif text-3xl font-medium text-[#4D3040] dark:text-[#FAF4EE] sm:text-5xl"
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
          <section
            aria-labelledby="scroll-cakes-title"
            className="border-b border-[#DBD0C5]/40 py-10 sm:py-14 dark:border-white/10"
          >
            <div className="mx-auto max-w-[1600px] px-4 pb-4 sm:px-8 lg:px-12">
              <div className="flex items-end justify-between gap-5">
                <h2
                  id="scroll-cakes-title"
                  className="font-serif text-3xl font-medium text-[#4D3040] dark:text-[#FAF4EE] sm:text-5xl"
                >
                  {settings.showcase_title || "Lookbook"}
                </h2>
                <Link
                  href="/catalog"
                  className="touch-target inline-flex items-center border-b border-[#4D3040]/50 text-sm font-medium text-[#4D3040] transition-colors hover:text-[var(--storefront-accent)] dark:border-white/30 dark:text-[#FAF4EE]"
                >
                  {settings.showcase_link_text || "Katalog"}
                </Link>
              </div>
            </div>
            <CakeCircularCarousel products={products} variant="gallery" />
          </section>
        );
      case "cta":
        return <BrandStory />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Skiper8 products={products} />

      <Navbar onOpenQuiz={() => setIsQuizOpen(true)} />

      {/* Top Canvas Mode Banner Bar */}
      {isCanvasMode && (
        <div className="sticky top-16 sm:top-[4.5rem] z-30 border-b border-[var(--storefront-accent)] bg-[var(--storefront-surface)] px-4 py-2.5 sm:px-8 shadow-sm">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--storefront-ink)]">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--storefront-accent)] animate-pulse" />
              <span>
                <strong>Mode Kanvas Aktif</strong> — Geser posisi section (↑/↓ atau drag), klik teks Hero untuk edit, ganti warna &amp; model di panel bawah.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={resetCanvas}
                className="inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-white/20 bg-white/80 dark:bg-stone-900 px-3 py-1 text-[11px] font-bold hover:border-[var(--storefront-accent)]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>+ Reset Kanvas</span>
              </button>
              <button
                type="button"
                onClick={() => openOrderSchemeModal()}
                className="rounded-full bg-[var(--storefront-accent)] px-3.5 py-1 text-[11px] font-bold text-white shadow-sm hover:opacity-95"
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
        {orderedSections.map((sectionId, idx) => {
          const isHidden = hiddenSections.includes(sectionId);
          if (!isCanvasMode && isHidden) return null;

          const content = renderSectionContent(sectionId);
          if (!content) return null;

          if (!isCanvasMode) {
            return <React.Fragment key={sectionId}>{content}</React.Fragment>;
          }

          const isDragOver = dragOverSection === sectionId;
          const stepNum = String(idx + 1).padStart(2, "0");

          return (
            <div
              key={sectionId}
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
              className={`relative mx-2 sm:mx-4 my-4 rounded-3xl border-2 border-dashed transition-all ${
                isDragOver
                  ? "border-[var(--storefront-accent)] bg-[var(--color-surface-tint)] scale-[0.995]"
                  : "border-[var(--storefront-accent)]"
              } ${isHidden ? "opacity-50" : ""}`}
            >
              {/* Floating Canvas Block Control Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-[var(--storefront-accent)] bg-[var(--storefront-surface)] px-3.5 py-2 rounded-t-[22px]">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onPointerDown={() => setDragReadySection(sectionId)}
                    onPointerUp={() => setDragReadySection(null)}
                    className="cursor-grab active:cursor-grabbing rounded-lg p-1 text-[var(--storefront-accent)] hover:bg-[var(--color-surface-tint)]"
                    title="Drag untuk pindah posisi"
                    aria-label={`Drag ${SECTION_LABELS[sectionId]}`}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>

                  <span className="rounded-full bg-[var(--storefront-accent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {stepNum} · {SECTION_LABELS[sectionId]}
                  </span>

                  {/* Position Up/Down Controls */}
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(sectionId, -1)}
                      className="inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 px-2.5 py-1 text-[10px] font-bold disabled:opacity-35 hover:border-[var(--storefront-accent)]"
                    >
                      <ArrowUp className="h-3 w-3" />
                      <span>Geser Atas</span>
                    </button>
                    <button
                      type="button"
                      disabled={idx === orderedSections.length - 1}
                      onClick={() => moveSection(sectionId, 1)}
                      className="inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 px-2.5 py-1 text-[10px] font-bold disabled:opacity-35 hover:border-[var(--storefront-accent)]"
                    >
                      <ArrowDown className="h-3 w-3" />
                      <span>Geser Bawah</span>
                    </button>
                  </div>
                </div>

                {/* Inline Model Switcher + Visibility Toggle */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {sectionId === "hero" && (
                    <div className="flex flex-wrap items-center gap-1 mr-1">
                      {HERO_MODELS.map((m) => {
                        const active = activeTheme.hero_style === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => updateTheme({ hero_style: m.id })}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all ${
                              active
                                ? "border-[var(--storefront-accent)] bg-stone-900 text-white dark:bg-white dark:text-stone-950"
                                : "border-stone-300 dark:border-white/20 bg-white/80 dark:bg-stone-800 hover:border-[var(--storefront-accent)]"
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {sectionId === "feed" && (
                    <div className="flex flex-wrap items-center gap-1 mr-1">
                      {FEED_MODELS.map((m) => {
                        const active = activeCatalogLayout === m.id;
                        return (
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
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all ${
                              active
                                ? "border-[var(--storefront-accent)] bg-stone-900 text-white dark:bg-white dark:text-stone-950"
                                : "border-stone-300 dark:border-white/20 bg-white/80 dark:bg-stone-800 hover:border-[var(--storefront-accent)]"
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                      <span className="mx-0.5 text-[10px] text-stone-400">|</span>
                      {CARD_MODELS.map((c) => {
                        const active = activeTheme.card_style === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => updateTheme({ card_style: c.id })}
                            className={`rounded-full px-2 py-1 text-[10px] font-bold border transition-all ${
                              active
                                ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white"
                                : "border-stone-300 dark:border-white/20 bg-white/80 dark:bg-stone-800 hover:border-[var(--storefront-accent)]"
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleHideSection(sectionId)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${
                      isHidden
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "border-stone-300 dark:border-white/20 bg-white dark:bg-stone-800 hover:border-rose-400"
                    }`}
                  >
                    {isHidden ? (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>Tampilkan</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>Sembunyikan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-b-[22px]">{content}</div>
            </div>
          );
        })}
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
