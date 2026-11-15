"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Columns2,
  Eye,
  Flame,
  Heart,
  Info,
  LayoutGrid,
  MessageCircle,
  Share2,
  ShoppingBag,
  Smartphone,
  Tag,
  X,
  Zap,
  Check,
  Minus,
  Plus,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Category, Product, ProductVariant } from "@/types/catalove";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils/formatters";
import { buildQuickProductWhatsAppUrl } from "@/lib/utils/whatsapp";
import { ProductCard, type CanvasProductPatch } from "@/components/storefront/ProductCard";
import { ProductImage } from "@/components/storefront/ProductImage";
import { cakeService } from "@/lib/services/cake-service";
import type { ProductInput } from "@/lib/validators/product";

type ViewMode = "pinterest" | "tiktok" | "grid";
type QuickFilter = "all" | "popular" | "promo" | "ready" | "liked";

interface DiscoveryFeedProps {
  products: Product[];
  categories?: Category[];
  showCategoryPills?: boolean;
  defaultMode?: ViewMode;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
  isCanvasMode?: boolean;
}

export function DiscoveryFeed({
  products,
  categories = [],
  showCategoryPills = true,
  defaultMode,
  title,
  subtitle,
  hideHeader = false,
  isCanvasMode = false,
}: DiscoveryFeedProps) {
  const settings = useBusinessSettings();
  const { addItem, openCart, toggleLike, isLiked, getLikeCount, savedIds } = useCart();
  const [isAddingSample, setIsAddingSample] = useState(false);

  const handleAddSampleProduct = async () => {
    if (isAddingSample) return;
    setIsAddingSample(true);
    try {
      const sampleNumber = products.length + 1;
      await cakeService.createProduct({
        name: `Sample Produk #${sampleNumber}`,
        category_id:
          selectedCategoryId !== "all"
            ? selectedCategoryId
            : categories[0]?.id || undefined,
        badge: "Sample",
        description:
          "Template produk siap pakai — klik di Mode Kanvas untuk ubah foto, nama, dan harga.",
        flavor_notes: [],
        specs: [],
        base_price: 125000,
        minimum_lead_time_days: 1,
        is_active: true,
        is_featured: true,
        variants: [],
        images: [
          {
            storage_path:
              "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1000&q=80",
            alt_text: `Sample Produk #${sampleNumber}`,
            is_primary: true,
            display_order: 1,
          },
        ],
      });
    } finally {
      setIsAddingSample(false);
    }
  };

  const handleUpdateProduct = async (
    productId: string,
    updates: CanvasProductPatch
  ) => {
    const existing = products.find((item) => item.id === productId);
    if (!existing) return;

    const payload: Partial<ProductInput> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.base_price !== undefined) payload.base_price = updates.base_price;
    if (updates.badge !== undefined) payload.badge = updates.badge;

    if (updates.imageUrl) {
      const otherImages = (existing.images || [])
        .filter((img) => !img.is_primary)
        .slice(0, 4)
        .map((img, i) => ({
          storage_path: img.storage_path,
          alt_text: img.alt_text || updates.name || existing.name,
          is_primary: false,
          display_order: i + 2,
        }));
      payload.images = [
        {
          storage_path: updates.imageUrl,
          alt_text: updates.name || existing.name,
          is_primary: true,
          display_order: 1,
        },
        ...otherImages,
      ];
    }

    await cakeService.updateProduct(productId, payload);
  };

  const handleDeleteProduct = async (productId: string) => {
    await cakeService.deleteProduct(productId);
  };

  const handleMoveProduct = async (
    productId: string,
    direction: "left" | "right"
  ) => {
    const visibleIds = filteredProducts.map((p) => p.id);
    const currentIdx = visibleIds.indexOf(productId);
    const targetIdx = direction === "left" ? currentIdx - 1 : currentIdx + 1;
    if (currentIdx < 0 || targetIdx < 0 || targetIdx >= visibleIds.length) {
      return;
    }

    const reorderedVisible = [...visibleIds];
    [reorderedVisible[currentIdx], reorderedVisible[targetIdx]] = [
      reorderedVisible[targetIdx],
      reorderedVisible[currentIdx],
    ];

    const visibleSet = new Set(visibleIds);
    let visibleCursor = 0;
    const mergedOrder = products.map((p) =>
      visibleSet.has(p.id) ? reorderedVisible[visibleCursor++] : p.id
    );

    await cakeService.reorderProducts(mergedOrder);
  };

  const resolvedDefaultMode: ViewMode = useMemo(() => {
    if (defaultMode) return defaultMode;
    const layout = settings.catalog_layout || settings.theme_config?.catalog_layout;
    if (layout === "tiktok_feed") return "tiktok";
    if (layout === "grid_2" || layout === "grid_3" || layout === "grid_4") return "grid";
    return "pinterest";
  }, [defaultMode, settings.catalog_layout, settings.theme_config?.catalog_layout]);

  const [viewMode, setViewMode] = useState<ViewMode>(resolvedDefaultMode);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Sync default mode when admin changes setting
  useEffect(() => {
    if (!defaultMode) {
      setViewMode(resolvedDefaultMode);
    }
  }, [resolvedDefaultMode, defaultMode]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategoryId !== "all" && p.category_id !== selectedCategoryId) {
        return false;
      }
      if (quickFilter === "popular") {
        return p.is_featured || getLikeCount(p.id) >= 120;
      }
      if (quickFilter === "promo") {
        return Boolean(p.compare_at_price && p.compare_at_price > p.base_price);
      }
      if (quickFilter === "ready") {
        return (p.minimum_lead_time_days ?? 0) === 0;
      }
      if (quickFilter === "liked") {
        return savedIds.includes(p.id);
      }
      return true;
    });
  }, [products, selectedCategoryId, quickFilter, savedIds, getLikeCount]);

  const desktopCols = settings.theme_config?.catalog_columns_desktop || 3;
  const gridColsClass =
    desktopCols === 2
      ? "grid-cols-2 lg:grid-cols-2"
      : desktopCols === 4
      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

  return (
    <section id="discovery-feed" className="py-8 sm:py-12">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12 space-y-6">
        {/* Section Heading + View Mode Bar */}
        {!hideHeader && (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#4D3040] dark:text-[#FAF4EE]">
                {title || settings.catalog_title || "Sample"}
              </h2>
              {isCanvasMode && (
                <button
                  type="button"
                  onClick={handleAddSampleProduct}
                  disabled={isAddingSample}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--storefront-accent)] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-60 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isAddingSample ? "Menambahkan..." : "Tambah Produk Sample"}</span>
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="inline-flex items-center p-1 rounded-full bg-stone-200/70 dark:bg-white/10 backdrop-blur-md border border-stone-300/60 dark:border-white/10 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode("pinterest")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                  viewMode === "pinterest"
                    ? "bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                }`}
              >
                <Columns2 className="w-3.5 h-3.5 text-[var(--storefront-accent)]" />
                <span>Waterfall</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("tiktok")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                  viewMode === "tiktok"
                    ? "bg-stone-950 text-white dark:bg-[var(--storefront-accent)] shadow-sm"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Snap</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Mode Bar even when header is hidden */}
        {hideHeader && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="inline-flex items-center p-1 rounded-full bg-stone-200/70 dark:bg-white/10 backdrop-blur-md border border-stone-300/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setViewMode("pinterest")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === "pinterest"
                    ? "bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-300"
                }`}
              >
                <Columns2 className="w-3.5 h-3.5 text-[var(--storefront-accent)]" />
                <span>Waterfall</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("tiktok")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === "tiktok"
                    ? "bg-stone-950 text-white dark:bg-[var(--storefront-accent)] shadow-sm"
                    : "text-stone-600 dark:text-stone-300"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Snap</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-300"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: "all", label: "Semua", icon: LayoutGrid },
            { id: "popular", label: "Unggulan", icon: Flame },
            { id: "promo", label: "Promo", icon: Tag },
            { id: "ready", label: "Ready", icon: Zap },
            { id: "liked", label: "Tersimpan", icon: Heart },
          ].map((chip) => {
            const Icon = chip.icon;
            const active = quickFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setQuickFilter(chip.id as QuickFilter)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold border transition-all active:scale-95 ${
                  active
                    ? "bg-[var(--storefront-accent)] text-white border-[var(--storefront-accent)] shadow-sm"
                    : "bg-white/75 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:border-stone-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{chip.label}</span>
              </button>
            );
          })}

          {showCategoryPills &&
            categories.map((cat) => {
              const active = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setSelectedCategoryId((prev) => (prev === cat.id ? "all" : cat.id))
                  }
                  className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold border transition-all ${
                    active
                      ? "bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-950"
                      : "bg-transparent text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 dark:border-white/15 py-16 px-4 text-center space-y-3">
            <p className="font-serif text-xl font-medium">
              Kosong
            </p>
            <button
              type="button"
              onClick={() => {
                setQuickFilter("all");
                setSelectedCategoryId("all");
              }}
              className="rounded-full bg-[var(--storefront-accent)] px-5 py-2 text-xs font-bold text-white"
            >
              Reset
            </button>
          </div>
        ) : viewMode === "tiktok" ? (
          /* TIKTOK / REELS FULLSCREEN VERTICAL SNAP FEED */
          <TikTokVerticalFeed
            products={filteredProducts}
            onOpenQuickView={(p) => setQuickViewProduct(p)}
          />
        ) : viewMode === "pinterest" ? (
          /* PINTEREST STAGGERED MASONRY WATERFALL */
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-5">
            {filteredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                index={idx}
                masonryMode={true}
                onQuickView={(p) => setQuickViewProduct(p)}
                isCanvasMode={isCanvasMode}
                canMoveLeft={idx > 0}
                canMoveRight={idx < filteredProducts.length - 1}
                onMoveProduct={handleMoveProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            ))}
          </div>
        ) : (
          /* CLASSIC EDITORIAL GRID */
          <div className={`grid gap-4 sm:gap-6 ${gridColsClass}`}>
            {filteredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                index={idx}
                masonryMode={false}
                aspectRatioClass="aspect-[4/5]"
                onQuickView={(p) => setQuickViewProduct(p)}
                isCanvasMode={isCanvasMode}
                canMoveLeft={idx > 0}
                canMoveRight={idx < filteredProducts.length - 1}
                onMoveProduct={handleMoveProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Instant Quick-View / Quick-Shop Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onOpenCart={() => {
          setQuickViewProduct(null);
          openCart();
        }}
        onAddToBag={(prod, variant, qty) => {
          addItem(prod, variant, qty);
        }}
      />
    </section>
  );
}

/* ============================================================================
 * TIKTOK VERTICAL SNAP FEED COMPONENT
 * ========================================================================== */
function TikTokVerticalFeed({
  products,
  onOpenQuickView,
}: {
  products: Product[];
  onOpenQuickView: (product: Product) => void;
}) {
  const settings = useBusinessSettings();
  const { addItem, toggleLike, isLiked } = useCart();

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedVariantByProd, setSelectedVariantByProd] = useState<
    Record<string, ProductVariant>
  >({});
  const [activePhotoIndexByProd, setActivePhotoIndexByProd] = useState<
    Record<string, number>
  >({});
  const [burstProductId, setBurstProductId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currency = settings.currency_symbol || "Rp";
  const isInquiryMode = settings.workflow_mode === "inquiry_only";

  const scrollToSlide = (idx: number) => {
    const clamped = Math.max(0, Math.min(products.length - 1, idx));
    setActiveIndex(clamped);
    const container = scrollerRef.current;
    if (!container) return;
    const child = container.children[clamped] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleScroll = () => {
    const container = scrollerRef.current;
    if (!container) return;
    const height = container.clientHeight || 1;
    const idx = Math.round(container.scrollTop / height);
    if (idx >= 0 && idx < products.length && idx !== activeIndex) {
      setActiveIndex(idx);
    }
  };

  const activeProduct = products[activeIndex] || products[0];
  const activeVariant =
    selectedVariantByProd[activeProduct?.id] ||
    activeProduct?.variants?.find((v) => v.is_default) ||
    activeProduct?.variants?.[0];

  const handleDoubleTapSlide = (productId: string) => {
    if (!isLiked(productId)) {
      toggleLike(productId);
    }
    setBurstProductId(productId);
    setTimeout(() => {
      setBurstProductId((curr) => (curr === productId ? null : curr));
    }, 750);
  };

  const handleShare = (product: Product) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/product/${product.slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(product.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      {/* Main Vertical Reel Container */}
      <div className="lg:col-span-6 xl:col-span-5 lg:col-start-2 xl:col-start-3 relative mx-auto w-full max-w-[440px]">
        {/* Up / Down Reel Navigation Pills (Desktop + Accessible Touch) */}
        <div className="hidden sm:flex flex-col gap-2 absolute -left-14 top-1/2 -translate-y-1/2 z-20">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => scrollToSlide(activeIndex - 1)}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-stone-800 border border-stone-200 dark:border-white/15 shadow-md flex items-center justify-center hover:scale-105 disabled:opacity-30 transition-all"
            aria-label="Produk sebelumnya"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-bold text-center text-stone-500">
            {activeIndex + 1}/{products.length}
          </span>
          <button
            type="button"
            disabled={activeIndex >= products.length - 1}
            onClick={() => scrollToSlide(activeIndex + 1)}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-stone-800 border border-stone-200 dark:border-white/15 shadow-md flex items-center justify-center hover:scale-105 disabled:opacity-30 transition-all"
            aria-label="Produk berikutnya"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Snap Vertical Viewport */}
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="h-[78vh] max-h-[760px] w-full overflow-y-scroll snap-y snap-mandatory rounded-[2rem] bg-black shadow-2xl border border-stone-900/20 dark:border-white/15 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => {
            const images = product.images?.length ? product.images : [];
            const photoIdx = activePhotoIndexByProd[product.id] || 0;
            const currentImg = images[photoIdx] || images[0];
            const chosenVar =
              selectedVariantByProd[product.id] ||
              product.variants?.find((v) => v.is_default) ||
              product.variants?.[0];
            const price = chosenVar ? chosenVar.price : product.base_price;
            const liked = isLiked(product.id);
            const waQuickUrl = buildQuickProductWhatsAppUrl({
              storeName: settings.store_name || "Catalove",
              whatsappNumber: settings.seller_whatsapp || "6285946689168",
              productName: product.name,
              variantName: chosenVar?.name,
              price,
              currencySymbol: currency,
              isInquiry: isInquiryMode,
            });

            return (
              <div
                key={product.id}
                onDoubleClick={() => handleDoubleTapSlide(product.id)}
                className="relative h-[78vh] max-h-[760px] w-full snap-start snap-always overflow-hidden bg-stone-950 select-none"
              >
                {/* Full-bleed Photography */}
                <ProductImage
                  src={currentImg?.storage_path}
                  alt={currentImg?.alt_text || product.name}
                  sizes="(max-width: 768px) 100vw, 440px"
                  className="h-full w-full object-cover"
                />

                {/* Top Story Progress Bars (if product has 2+ images) */}
                {images.length > 1 && (
                  <div className="absolute top-3 inset-x-4 z-20 flex gap-1.5">
                    {images.map((im, i) => (
                      <button
                        key={im.id || i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndexByProd((prev) => ({
                            ...prev,
                            [product.id]: i,
                          }));
                        }}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i === photoIdx ? "bg-white" : "bg-white/35"
                        }`}
                        aria-label={`Foto ${i + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Left/Right Tap Zones to cycle multi-images */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndexByProd((prev) => ({
                          ...prev,
                          [product.id]: (photoIdx - 1 + images.length) % images.length,
                        }));
                      }}
                      className="absolute left-0 top-12 bottom-52 w-12 z-10 flex items-center justify-center opacity-0 hover:opacity-100 text-white/80"
                      aria-label="Foto sebelumnya"
                    >
                      <ChevronLeft className="w-6 h-6 drop-shadow" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndexByProd((prev) => ({
                          ...prev,
                          [product.id]: (photoIdx + 1) % images.length,
                        }));
                      }}
                      className="absolute right-14 top-12 bottom-52 w-12 z-10 flex items-center justify-center opacity-0 hover:opacity-100 text-white/80"
                      aria-label="Foto berikutnya"
                    >
                      <ChevronRight className="w-6 h-6 drop-shadow" />
                    </button>
                  </>
                )}

                {/* Top Badge */}
                <div className="absolute top-6 left-4 z-20 flex flex-wrap gap-1.5 items-center max-w-[75%]">
                  <span className="inline-flex items-center rounded-full bg-black/55 backdrop-blur-md border border-white/15 px-3 py-1 text-[10px] font-bold text-white">
                    {product.badge || "Sample"}
                  </span>
                </div>

                {/* Double-tap Floating Heart Burst */}
                <AnimatePresence>
                  {burstProductId === product.id && (
                    <motion.div
                      initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
                      animate={{ scale: 1.4, opacity: 1, rotate: 0 }}
                      exit={{ scale: 1.8, opacity: 0, y: -30 }}
                      transition={{ type: "spring", stiffness: 360, damping: 16 }}
                      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
                    >
                      <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_10px_30px_rgba(244,63,94,0.8)]" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Right-Side TikTok Floating Action Rail */}
                <div className="absolute right-3 bottom-36 z-20 flex flex-col items-center gap-4">
                  {/* Like / Heart */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nowLiked = toggleLike(product.id);
                      if (nowLiked) handleDoubleTapSlide(product.id);
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-transform active:scale-90 ${
                        liked
                          ? "bg-rose-500 border-rose-400 text-white"
                          : "bg-black/50 border-white/20 text-white"
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${liked ? "fill-white" : ""}`} />
                    </div>
                  </button>

                  {/* Specs / Preview */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenQuickView(product);
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/75 active:scale-90 transition-all">
                      <Info className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow">
                      Info
                    </span>
                  </button>

                  {/* Add to Cart */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem(product, chosenVar, 1);
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-11 h-11 rounded-full bg-[var(--storefront-accent)] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-90 transition-all">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow">
                      + Bag
                    </span>
                  </button>

                  {/* Share */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(product);
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/75 active:scale-90 transition-all">
                      {copiedId === product.id ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow">
                      {copiedId === product.id ? "Disalin" : "Share"}
                    </span>
                  </button>
                </div>

                {/* Bottom Gradient Product Info & Instant CTA */}
                <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-16 pb-5 px-4 pr-16 text-white space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    <span>@{settings.store_name?.replace(/\s+/g, "").toLowerCase() || "catalove"}</span>
                    {product.category?.name && (
                      <>
                        <span>•</span>
                        <span>{product.category.name}</span>
                      </>
                    )}
                  </div>

                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-semibold leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    {product.tagline && (
                      <p className="text-xs text-white/80 mt-0.5 line-clamp-1">
                        {product.tagline}
                      </p>
                    )}
                  </div>

                  {/* Interactive Variant Pills inside Reel */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {product.variants.map((v) => {
                        const selected = chosenVar?.id === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVariantByProd((prev) => ({
                                ...prev,
                                [product.id]: v,
                              }));
                            }}
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all ${
                              selected
                                ? "bg-white text-stone-950 border-white"
                                : "bg-white/10 text-white border-white/25 hover:bg-white/20"
                            }`}
                          >
                            {v.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Price + 1-Tap Order */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div>
                      <span className="text-lg font-extrabold text-white">
                        {formatPrice(price, currency)}
                      </span>
                      {product.compare_at_price && product.compare_at_price > price && (
                        <span className="ml-2 text-xs text-white/50 line-through">
                          {formatPrice(product.compare_at_price, currency)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={waQuickUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-lg hover:bg-[#20BD5A] transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Pesan WA</span>
                      </a>
                      <Link
                        href={`/product/${product.slug}`}
                        className="inline-flex items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3 py-2 text-xs font-bold text-white hover:bg-white/25"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Companion Panel: Interactive Queue & Active Reel Details */}
      <div className="hidden lg:block lg:col-span-5 xl:col-span-4 space-y-5">
        {activeProduct && (
          <div className="rounded-3xl border border-stone-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-md p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#4D3040] dark:text-white">
                {activeProduct.name}
              </h3>
              <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2">
                {activeProduct.description}
              </p>
            </div>

            {activeProduct.specs && activeProduct.specs.length > 0 && (
              <div className="rounded-2xl bg-stone-100/70 dark:bg-white/5 p-3.5 space-y-1.5">
                {activeProduct.specs.slice(0, 3).map((s, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-stone-500 dark:text-stone-400">{s.label}</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => addItem(activeProduct, activeVariant, 1)}
                className="flex-1 py-3 px-4 rounded-full bg-[var(--storefront-accent)] text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>+ Bag</span>
              </button>
              <Link
                href={`/product/${activeProduct.slug}`}
                className="py-3 px-5 rounded-full border border-stone-300 dark:border-white/20 text-xs font-bold hover:bg-stone-100 dark:hover:bg-white/10"
              >
                Detail →
              </Link>
            </div>
          </div>
        )}

        {/* Quick Queue Thumbnail Strip */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-4 gap-2">
            {products.map((p, idx) => {
              const thumb =
                p.images?.find((img) => img.is_primary)?.storage_path ||
                p.images?.[0]?.storage_path;
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => scrollToSlide(idx)}
                  className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                    isCurrent
                      ? "border-[var(--storefront-accent)] scale-[1.03] shadow-md"
                      : "border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <ProductImage
                    src={thumb}
                    alt={p.name}
                    sizes="120px"
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * INSTANT QUICK-VIEW / QUICK-SHOP MODAL (NO SCROLL LOSS)
 * ========================================================================== */
function QuickViewModal({
  product,
  onClose,
  onAddToBag,
  onOpenCart,
}: {
  product: Product | null;
  onClose: () => void;
  onAddToBag: (product: Product, variant: ProductVariant | undefined, qty: number) => void;
  onOpenCart: () => void;
}) {
  const settings = useBusinessSettings();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    if (!product) return;
    setSelectedVariant(
      product.variants?.find((v) => v.is_default) || product.variants?.[0]
    );
    setQuantity(1);
    setPhotoIdx(0);
  }, [product]);

  if (!product) return null;

  const currency = settings.currency_symbol || "Rp";
  const images = product.images || [];
  const activeImg = images[photoIdx] || images[0];
  const price = selectedVariant ? selectedVariant.price : product.base_price;
  const waUrl = buildQuickProductWhatsAppUrl({
    storeName: settings.store_name || "Catalove",
    whatsappNumber: settings.seller_whatsapp || "6285946689168",
    productName: product.name,
    variantName: selectedVariant?.name,
    price: price * quantity,
    currencySymbol: currency,
    isInquiry: settings.workflow_mode === "inquiry_only",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#FCFAF6] dark:bg-[#1E1815] text-stone-900 dark:text-stone-100 shadow-2xl border border-stone-200 dark:border-white/10 grid sm:grid-cols-2">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 dark:bg-stone-800/90 text-stone-700 dark:text-stone-200 shadow-md"
          aria-label="Tutup Quick View"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Image Column */}
        <div className="relative aspect-[4/5] sm:aspect-auto sm:h-full bg-stone-100 dark:bg-stone-900 overflow-hidden">
          <ProductImage
            src={activeImg?.storage_path}
            alt={activeImg?.alt_text || product.name}
            sizes="(max-width: 640px) 100vw, 400px"
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 inset-x-3 flex justify-center gap-1.5">
              {images.map((im, i) => (
                <button
                  key={im.id || i}
                  type="button"
                  onClick={() => setPhotoIdx(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === photoIdx ? "w-6 bg-white" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Details Column */}
        <div className="p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.category?.name && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--storefront-accent)]">
                  {product.category.name}
                </span>
              )}
              {product.badge && (
                <span className="rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-2.5 py-0.5 text-[10px] font-bold">
                  {product.badge}
                </span>
              )}
            </div>

            <h3 className="font-serif text-2xl font-bold leading-snug">
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-[var(--storefront-accent)]">
                {formatPrice(price, currency)}
              </span>
              {product.compare_at_price && product.compare_at_price > price && (
                <span className="text-xs text-stone-400 line-through">
                  {formatPrice(product.compare_at_price, currency)}
                </span>
              )}
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {product.description}
            </p>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Pilih Varian
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedVariant?.id === v.id
                          ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/15 text-[var(--storefront-accent)]"
                          : "border-stone-200 dark:border-white/15 text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Specs */}
            {product.specs && product.specs.length > 0 && (
              <div className="rounded-xl bg-stone-100/80 dark:bg-white/5 p-3 space-y-1">
                {product.specs.map((s, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="text-stone-500 dark:text-stone-400">{s.label}</span>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-3 border-t border-stone-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-stone-300 dark:border-white/15 px-2 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1"
                  aria-label="Kurangi"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-1"
                  aria-label="Tambah"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddToBag(product, selectedVariant, quantity);
                  onOpenCart();
                }}
                className="flex-1 py-2.5 px-4 rounded-full bg-[var(--storefront-accent)] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>+ Keranjang</span>
              </button>
            </div>

            <div className="flex gap-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-full bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#20BD5A]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Pesan WA</span>
              </a>
              <Link
                href={`/product/${product.slug}`}
                onClick={onClose}
                className="py-2.5 px-4 rounded-full border border-stone-300 dark:border-white/15 text-xs font-bold flex items-center gap-1 hover:bg-stone-100 dark:hover:bg-white/10"
              >
                <span>Detail Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
