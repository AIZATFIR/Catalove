"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, Sliders, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/bakery";
import type { BodyScaleOption, HeadingScaleOption } from "@/types/catalove";
import { CakeCircularCarousel } from "@/components/storefront/CakeCircularCarousel";
import { ProductImage } from "@/components/storefront/ProductImage";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { saveBusinessSettings } from "@/lib/business-settings";
import { openCataloveWhatsApp } from "@/components/storefront/PricingSection";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils/formatters";

interface HeroProps {
  products: Product[];
  onOpenQuiz?: () => void;
  isCanvasMode?: boolean;
  onToggleCanvasMode?: () => void;
}

const HEADING_SCALE_CLASSES: Record<HeadingScaleOption, string> = {
  sm: "text-3xl sm:text-4xl lg:text-5xl leading-[1.16] sm:leading-[1.14]",
  md: "text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.15] sm:leading-[1.12]",
  lg: "text-4xl sm:text-6xl lg:text-[4.25rem] leading-[1.15] sm:leading-[1.12]",
  xl: "text-5xl sm:text-7xl lg:text-[5rem] leading-[1.14] sm:leading-[1.1]",
};

const BODY_SCALE_CLASSES: Record<BodyScaleOption, string> = {
  sm: "text-sm sm:text-base leading-relaxed",
  md: "text-base sm:text-lg leading-relaxed",
  lg: "text-lg sm:text-xl leading-relaxed",
};

export function Hero({
  products,
  isCanvasMode = false,
  onToggleCanvasMode,
}: HeroProps) {
  const settings = useBusinessSettings();
  const router = useRouter();
  const { addItem } = useCart();
  const [showcaseIndex, setShowcaseIndex] = useState(0);

  const heroStyle = settings.theme_config?.hero_style || "split_dynamic";
  const isSplitReverse = heroStyle === "split_reverse";
  const headingScale: HeadingScaleOption =
    settings.theme_config?.heading_scale || "lg";
  const bodyScale: BodyScaleOption = settings.theme_config?.body_scale || "md";
  const heroAlign = settings.theme_config?.hero_align || "left";
  const isCentered = heroStyle === "minimal_center" ? heroAlign !== "left" : heroAlign === "center";
  const currency = settings.currency_symbol || "Rp";

  const title =
    settings.hero_title ?? "Simple yet interesting catalog for your brand.";
  const subtitle =
    settings.hero_subtitle ?? "Pesan Catalove mu untuk brand mu sendiri.";
  const primaryCta = settings.hero_primary_cta ?? "Pesan Catalove";
  const secondaryCta = settings.hero_secondary_cta ?? "Sample";

  const headingSizeClass =
    HEADING_SCALE_CLASSES[headingScale] || HEADING_SCALE_CLASSES.lg;
  const bodySizeClass =
    BODY_SCALE_CLASSES[bodyScale] || BODY_SCALE_CLASSES.md;

  const updateHeroField = (
    field:
      | "hero_title"
      | "hero_subtitle"
      | "hero_primary_cta"
      | "hero_secondary_cta",
    value: string
  ) => {
    saveBusinessSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleToggleCanvas = () => {
    if (onToggleCanvasMode) {
      onToggleCanvasMode();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("catalove-toggle-canvas"));
    }
  };

  const featuredProducts = products
    .filter((p) => p.is_active && p.images?.length > 0)
    .slice(0, 4);
  const currentShowcase =
    featuredProducts[showcaseIndex % Math.max(1, featuredProducts.length)];

  const scrollToDiscovery = () => {
    const el = document.getElementById("discovery-feed");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    router.push("/catalog");
  };

  const renderActionButtons = (centeredLayout: boolean) => (
    <div
      className={`flex w-full flex-wrap items-center gap-3 pt-2 ${
        centeredLayout ? "justify-center" : "justify-start"
      }`}
    >
      {isCanvasMode ? (
        <div className="inline-flex items-center rounded-full bg-[var(--storefront-accent)] px-5 py-2.5 text-white">
          <input
            type="text"
            value={primaryCta}
            onChange={(e) => updateHeroField("hero_primary_cta", e.target.value)}
            aria-label="Edit teks tombol utama Hero"
            size={Math.max(8, primaryCta.length + 1)}
            className="bg-transparent text-center text-sm font-bold text-white placeholder:text-white/70 focus:outline-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => openCataloveWhatsApp(settings.seller_whatsapp)}
          className="touch-target inline-flex items-center justify-center rounded-full bg-[var(--storefront-accent)] px-7 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          <span>{primaryCta || "Pesan Catalove"}</span>
        </button>
      )}

      <button
        type="button"
        onClick={handleToggleCanvas}
        className={`touch-target inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-sm font-semibold transition-colors ${
          isCanvasMode
            ? "border-[var(--storefront-accent)] bg-[var(--color-surface-tint)] text-[var(--storefront-accent)]"
            : "border-[var(--storefront-line)] text-[var(--storefront-ink)] hover:bg-[var(--storefront-surface)]"
        }`}
      >
        <Sliders aria-hidden="true" className="h-4 w-4" />
        <span>Mode Kanvas</span>
      </button>

      {isCanvasMode ? (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--storefront-line)] px-4 py-2.5 text-[var(--storefront-ink)]">
          <input
            type="text"
            value={secondaryCta}
            onChange={(e) =>
              updateHeroField("hero_secondary_cta", e.target.value)
            }
            aria-label="Edit teks tombol kedua Hero"
            size={Math.max(6, secondaryCta.length + 1)}
            className="bg-transparent text-center text-sm font-semibold focus:outline-none"
          />
          <ArrowDown aria-hidden="true" className="h-3.5 w-3.5 opacity-60" />
        </div>
      ) : (
        <button
          type="button"
          onClick={scrollToDiscovery}
          className="touch-target inline-flex items-center justify-center gap-2 rounded-full border border-[var(--storefront-line)] px-5 py-3.5 text-sm font-semibold text-[var(--storefront-ink)] hover:bg-[var(--storefront-surface)]"
        >
          <span>{secondaryCta || "Sample"}</span>
          <ArrowDown aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  /* MINIMAL CENTER HERO STYLE */
  if (heroStyle === "minimal_center") {
    const centerBlock = heroAlign !== "left";
    return (
      <section className="relative isolate border-b border-[var(--storefront-line)] py-16 sm:py-24 transition-colors">
        <div
          className={`mx-auto max-w-5xl px-4 sm:px-8 flex flex-col gap-6 ${
            centerBlock ? "items-center text-center" : "items-start text-left"
          }`}
        >
          {isCanvasMode ? (
            <textarea
              rows={2}
              value={title}
              onChange={(e) => updateHeroField("hero_title", e.target.value)}
              aria-label="Edit judul utama Hero"
              className={`w-full max-w-4xl resize-none rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-4 py-2 pb-3 font-serif font-medium tracking-tight text-[var(--storefront-ink)] focus:outline-none ${headingSizeClass} ${
                centerBlock ? "text-center" : "text-left"
              }`}
            />
          ) : (
            <h1
              data-gsap-title
              className={`max-w-4xl pb-1 font-serif font-medium tracking-tight text-[var(--storefront-ink)] ${headingSizeClass}`}
            >
              {title}
            </h1>
          )}

          {isCanvasMode ? (
            <input
              type="text"
              value={subtitle}
              onChange={(e) => updateHeroField("hero_subtitle", e.target.value)}
              aria-label="Edit subjudul Hero"
              className={`w-full max-w-2xl rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-4 py-2 text-[var(--storefront-ink)] focus:outline-none ${bodySizeClass} ${
                centerBlock ? "text-center" : "text-left"
              }`}
            />
          ) : (
            <p
              className={`max-w-2xl text-[var(--storefront-ink)] opacity-80 ${bodySizeClass}`}
            >
              {subtitle}
            </p>
          )}

          {renderActionButtons(centerBlock)}

          {featuredProducts.length > 0 && (
            <div className="w-full pt-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {featuredProducts.map((p) => {
                  const img =
                    p.images.find((i) => i.is_primary)?.storage_path ||
                    p.images[0]?.storage_path;
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      className="group block text-left space-y-2"
                    >
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[var(--storefront-surface)]">
                        <ProductImage
                          src={img}
                          alt={p.name}
                          sizes="280px"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-serif text-sm font-medium line-clamp-1 text-[var(--storefront-ink)]">
                          {p.name}
                        </p>
                        <p className="shrink-0 text-xs font-semibold tabular-nums text-[var(--storefront-ink)] opacity-80">
                          {formatPrice(p.base_price, currency)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="relative isolate border-b border-[var(--storefront-line)] py-12 sm:py-20 transition-colors">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:gap-14 lg:px-12">
        {/* Copy & CTA */}
        <div
          className={`relative z-10 order-2 flex flex-col gap-6 lg:col-span-6 lg:gap-7 ${
            isCentered ? "items-center text-center" : "items-start text-left"
          } ${isSplitReverse ? "lg:order-2" : "lg:order-1"}`}
        >
          <div className="space-y-4 w-full">
            {isCanvasMode ? (
              <textarea
                rows={3}
                value={title}
                onChange={(e) => updateHeroField("hero_title", e.target.value)}
                aria-label="Edit judul utama Hero"
                className={`w-full max-w-2xl resize-none rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/65 dark:bg-white/5 px-3.5 py-2 pb-3 font-serif font-medium tracking-[-0.02em] text-[var(--storefront-ink)] focus:outline-none ${headingSizeClass} ${
                  isCentered ? "text-center mx-auto" : "text-left"
                }`}
              />
            ) : (
              <h1
                data-gsap-title
                className={`max-w-2xl pb-1 font-serif font-medium tracking-[-0.02em] text-[var(--storefront-ink)] ${headingSizeClass} ${
                  isCentered ? "mx-auto" : ""
                }`}
              >
                {title}
              </h1>
            )}

            {isCanvasMode ? (
              <input
                type="text"
                value={subtitle}
                onChange={(e) => updateHeroField("hero_subtitle", e.target.value)}
                aria-label="Edit subjudul Hero"
                className={`w-full max-w-md rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/65 dark:bg-white/5 px-3 py-1.5 text-[var(--storefront-ink)] focus:outline-none ${bodySizeClass} ${
                  isCentered ? "text-center mx-auto" : "text-left"
                }`}
              />
            ) : (
              <p
                className={`max-w-md text-[var(--storefront-ink)] opacity-80 ${bodySizeClass} ${
                  isCentered ? "mx-auto" : ""
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>

          {renderActionButtons(isCentered)}
        </div>

        {/* Showcase Visual Area */}
        <div
          {...(!isCanvasMode ? { "data-gsap-reveal": true } : {})}
          className={`relative z-10 order-1 mx-auto w-full lg:col-span-6 ${
            isSplitReverse ? "lg:order-1 lg:pr-4" : "lg:order-2 lg:pl-4"
          }`}
        >
          {heroStyle === "bento_grid" && featuredProducts.length >= 2 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {featuredProducts.slice(0, 3).map((p, idx) => {
                const img =
                  p.images.find((i) => i.is_primary)?.storage_path ||
                  p.images[0]?.storage_path;
                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    className={`group relative overflow-hidden rounded-xl bg-[var(--storefront-surface)] ${
                      idx === 0
                        ? "row-span-2 aspect-[3/4] sm:aspect-auto"
                        : "aspect-[4/3]"
                    }`}
                  >
                    <ProductImage
                      src={img}
                      alt={p.name}
                      sizes="400px"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/55 px-3.5 py-2.5 text-white">
                      <p className="font-serif text-sm sm:text-base font-medium leading-snug line-clamp-1">
                        {p.name}
                      </p>
                      <p className="text-xs font-semibold tabular-nums text-white/85">
                        {formatPrice(p.base_price, currency)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : heroStyle === "rotating_showcase" && currentShowcase ? (
            <div className="space-y-3 max-w-md mx-auto">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[var(--storefront-surface)]">
                <ProductImage
                  src={
                    currentShowcase.images.find((i) => i.is_primary)?.storage_path ||
                    currentShowcase.images[0]?.storage_path
                  }
                  alt={currentShowcase.name}
                  sizes="480px"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-4 text-white flex items-end justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-xl font-medium leading-snug">
                      {currentShowcase.name}
                    </h3>
                    <p className="text-sm font-semibold tabular-nums text-white/90 mt-0.5">
                      {formatPrice(currentShowcase.base_price, currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem(currentShowcase, undefined, 1)}
                    className="shrink-0 rounded-full bg-[var(--storefront-accent)] p-3 text-white hover:opacity-95 transition-opacity"
                    aria-label="Bag"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {featuredProducts.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setShowcaseIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden transition-all ${
                      idx === showcaseIndex
                        ? "ring-2 ring-[var(--storefront-accent)]"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <ProductImage
                      src={p.images[0]?.storage_path}
                      alt={p.name}
                      sizes="100px"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <CakeCircularCarousel products={products} />
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;
