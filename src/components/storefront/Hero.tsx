"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowDown, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/bakery";
import { CakeCircularCarousel } from "@/components/storefront/CakeCircularCarousel";
import { ProductImage } from "@/components/storefront/ProductImage";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils/formatters";

interface HeroProps {
  products: Product[];
  onOpenQuiz?: () => void;
}

export function Hero({ products }: HeroProps) {
  const settings = useBusinessSettings();
  const { addItem } = useCart();
  const [showcaseIndex, setShowcaseIndex] = useState(0);

  const heroStyle = settings.theme_config?.hero_style || "split_dynamic";
  const currency = settings.currency_symbol || "Rp";

  const eyebrow = settings.hero_eyebrow ?? "Template Website";
  const title =
    settings.hero_title ?? "Simple yet interesting catalog for your brand.";
  const subtitle =
    settings.hero_subtitle ?? "Pesan Catalove mu untuk brand mu sendiri.";
  const badge1 = settings.hero_badge_1 ?? "Template Web";
  const badge2 = settings.hero_badge_2 ?? "Siap Pakai";
  const badge3 = settings.hero_badge_3 ?? "Order WA";

  const directOrderWaUrl = `https://wa.me/${settings.seller_whatsapp || "6285946689168"}?text=${encodeURIComponent(
    "Halo, saya mau pesan Catalove untuk brand saya."
  )}`;

  const featuredProducts = products
    .filter((p) => p.is_active && p.images?.length > 0)
    .slice(0, 4);
  const currentShowcase =
    featuredProducts[showcaseIndex % Math.max(1, featuredProducts.length)];

  const scrollToDiscovery = () => {
    const el = document.getElementById("discovery-feed");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  /* MINIMAL CENTER HERO STYLE */
  if (heroStyle === "minimal_center") {
    return (
      <section className="relative isolate overflow-hidden border-b border-[#DBD0C5]/40 py-14 sm:py-20 transition-colors dark:border-white/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 text-center flex flex-col items-center gap-6">
          {eyebrow && (
            <p className="rounded-full border border-[var(--storefront-accent)]/30 bg-[var(--storefront-accent)]/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--storefront-accent)]">
              {eyebrow}
            </p>
          )}

          <h1
            data-gsap-title
            className="font-serif text-4xl sm:text-6xl lg:text-7xl font-medium leading-[1.02] tracking-tight text-[#4D3040] dark:text-[#FAF4EE]"
          >
            {title}
          </h1>

          <p className="max-w-xl text-base sm:text-lg leading-relaxed text-[#55464B] dark:text-[#D8CBC0]">
            {subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={directOrderWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target inline-flex items-center justify-center gap-2 rounded-full bg-[var(--storefront-accent)] px-7 py-3.5 text-sm font-bold text-white shadow-lg hover:opacity-95 transition-all"
            >
              <span>{settings.hero_primary_cta || "Pesan Catalove"}</span>
            </a>
            <button
              type="button"
              onClick={scrollToDiscovery}
              className="touch-target inline-flex items-center justify-center gap-2 rounded-full border border-[#4D3040]/30 dark:border-white/25 px-7 py-3.5 text-sm font-semibold hover:bg-stone-100 dark:hover:bg-white/10"
            >
              <span>{settings.hero_secondary_cta || "Sample"}</span>
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          {featuredProducts.length > 0 && (
            <div className="w-full pt-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {featuredProducts.map((p) => {
                  const img =
                    p.images.find((i) => i.is_primary)?.storage_path ||
                    p.images[0]?.storage_path;
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-800 shadow-sm hover:shadow-xl transition-all"
                    >
                      <ProductImage
                        src={img}
                        alt={p.name}
                        sizes="280px"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-left text-white">
                        <p className="text-xs font-bold line-clamp-1">{p.name}</p>
                        <p className="text-[11px] text-amber-300 font-semibold">
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
    <section className="relative isolate overflow-hidden border-b border-[#DBD0C5]/40 py-10 sm:py-16 transition-colors dark:border-white/10">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12">
        {/* Left Copy & CTA */}
        <div className="relative z-10 order-2 flex flex-col items-start gap-6 lg:order-1 lg:col-span-6 lg:gap-7">
          {eyebrow && (
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.22em] text-[#8D624C] dark:text-[#D1A686]">
              <span aria-hidden="true" className="h-px w-8 bg-[var(--storefront-accent)]" />
              {eyebrow}
            </p>
          )}

          <div className="space-y-4">
            <h1
              data-gsap-title
              className="max-w-2xl font-serif text-[2.6rem] sm:text-6xl lg:text-[4.25rem] font-medium leading-[1.03] tracking-[-.025em] text-[#4D3040] dark:text-[#FAF4EE]"
            >
              {title}
            </h1>
            <p className="max-w-md text-base leading-7 text-[#55464B] dark:text-[#D8CBC0] sm:text-lg">
              {subtitle}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full flex-wrap items-center gap-3 pt-1">
            <a
              href={directOrderWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target inline-flex items-center justify-center rounded-full bg-[var(--storefront-accent)] px-7 py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
            >
              <span>{settings.hero_primary_cta || "Pesan Catalove"}</span>
            </a>

            <button
              type="button"
              onClick={scrollToDiscovery}
              className="touch-target inline-flex items-center justify-center gap-2 rounded-full border border-[#4D3040]/30 dark:border-white/20 px-6 py-3.5 text-sm font-semibold hover:bg-stone-100 dark:hover:bg-white/10"
            >
              <span>{settings.hero_secondary_cta || "Sample"}</span>
              <ArrowDown aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {/* Minimal 2-Word Highlights */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#4D3040]/15 pt-5 text-xs font-semibold uppercase tracking-wider text-[#55464B] dark:border-white/10 dark:text-[#D8CBC0]">
            <span>{badge1}</span>
            <span>·</span>
            <span>{badge2}</span>
            <span>·</span>
            <span>{badge3}</span>
          </div>
        </div>

        {/* Right Showcase Visual Area */}
        <div
          data-gsap-reveal
          className="relative z-10 order-1 mx-auto w-full lg:order-2 lg:col-span-6 lg:pl-4"
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
                    className={`group relative overflow-hidden rounded-3xl bg-stone-200 dark:bg-stone-900 shadow-lg ${
                      idx === 0 ? "row-span-2 aspect-[3/4] sm:aspect-auto" : "aspect-[4/3]"
                    }`}
                  >
                    <ProductImage
                      src={img}
                      alt={p.name}
                      sizes="400px"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3.5 text-white">
                      {p.badge && (
                        <span className="inline-block rounded-full bg-[var(--storefront-accent)] px-2 py-0.5 text-[9px] font-bold uppercase mb-1">
                          {p.badge}
                        </span>
                      )}
                      <p className="font-serif text-sm sm:text-base font-semibold leading-snug line-clamp-1">
                        {p.name}
                      </p>
                      <p className="text-xs font-bold text-amber-300 mt-0.5">
                        {formatPrice(p.base_price, currency)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : heroStyle === "rotating_showcase" && currentShowcase ? (
            <div className="space-y-3 max-w-md mx-auto">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-stone-200/60 dark:border-white/10">
                <ProductImage
                  src={
                    currentShowcase.images.find((i) => i.is_primary)?.storage_path ||
                    currentShowcase.images[0]?.storage_path
                  }
                  alt={currentShowcase.name}
                  sizes="480px"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-5 text-white flex items-end justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      {currentShowcase.badge || "Sample"}
                    </span>
                    <h3 className="font-serif text-xl font-bold leading-snug">
                      {currentShowcase.name}
                    </h3>
                    <p className="text-sm font-bold text-white/90 mt-0.5">
                      {formatPrice(currentShowcase.base_price, currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem(currentShowcase, undefined, 1)}
                    className="shrink-0 rounded-full bg-[var(--storefront-accent)] p-3 text-white shadow-lg hover:scale-105 transition-transform"
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
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      idx === showcaseIndex
                        ? "border-[var(--storefront-accent)] scale-105"
                        : "border-transparent opacity-60 hover:opacity-100"
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
