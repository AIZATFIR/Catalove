"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Eye, Heart, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/types/bakery";
import { formatPrice } from "@/lib/utils/formatters";
import { ProductImage } from "@/components/storefront/ProductImage";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCart } from "@/context/CartContext";

// Organic Pinterest-style staggered aspect ratios
const MASONRY_RATIOS = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[9/12]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[3/4]",
];

interface ProductCardProps {
  product: Product;
  index?: number;
  aspectRatioClass?: string;
  onQuickView?: (product: Product) => void;
  masonryMode?: boolean;
}

export function ProductCard({
  product,
  index = 0,
  aspectRatioClass,
  onQuickView,
  masonryMode = true,
}: ProductCardProps) {
  const settings = useBusinessSettings();
  const { addItem, toggleLike, isLiked, getLikeCount } = useCart();

  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastTapRef = useRef<number>(0);

  const image = product.images?.find((item) => item.is_primary) ?? product.images?.[0];
  const leadTime = product.minimum_lead_time_days ?? 0;
  const currency = settings.currency_symbol || "Rp";
  const cardStyle = settings.theme_config?.card_style || "modern_glass";

  const liked = isLiked(product.id);
  const likeCount = getLikeCount(product.id);

  const badgeText =
    product.badge ||
    (leadTime === 0 ? "Ready Stock" : `Pre-Order H-${leadTime}`);

  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.base_price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.base_price) /
          product.compare_at_price!) *
          100
      )
    : 0;

  const chosenRatio =
    aspectRatioClass ||
    (masonryMode ? MASONRY_RATIOS[index % MASONRY_RATIOS.length] : "aspect-[4/5]");

  const cardContainerClasses: Record<string, string> = {
    modern_glass:
      "rounded-2xl p-2 bg-white/65 dark:bg-white/[0.04] backdrop-blur-md border border-stone-200/70 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300",
    clean_flat:
      "rounded-2xl p-1.5 bg-white dark:bg-[#241E1B] hover:shadow-lg transition-all duration-300",
    bordered_clay:
      "rounded-2xl p-2.5 bg-[#FAF6F0] dark:bg-[#221B18] border-2 border-stone-900/15 dark:border-white/20 shadow-[4px_4px_0px_rgba(0,0,0,0.08)] hover:shadow-[6px_6px_0px_var(--storefront-accent)] transition-all duration-300",
    minimal_mono:
      "rounded-none border-b border-stone-300 dark:border-white/15 pb-3 transition-all duration-300",
  };

  const frameRoundedClass = cardStyle === "minimal_mono" ? "rounded-lg" : "rounded-xl";

  const triggerHeartBurst = () => {
    if (!liked) {
      toggleLike(product.id);
    }
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 750);
  };

  const handleImagePointerDown = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      triggerHeartBurst();
    }
    lastTapRef.current = now;
  };

  return (
    <article
      className={`mb-4 sm:mb-6 break-inside-avoid group ${
        cardContainerClasses[cardStyle] || cardContainerClasses.modern_glass
      }`}
      data-gsap-reveal
    >
      {/* Product Image Frame with Attention Psychology Overlay */}
      <div
        onDoubleClick={(e) => {
          e.preventDefault();
          triggerHeartBurst();
        }}
        onTouchStart={handleImagePointerDown}
        className={`relative ${chosenRatio} overflow-hidden ${frameRoundedClass} bg-[#F0E8DE] dark:bg-[#2C2421] transition-all duration-500`}
      >
        <Link
          href={`/product/${product.slug}`}
          className="block w-full h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--storefront-accent)]"
          aria-label={`Lihat ${product.name}, mulai ${formatPrice(product.base_price, currency)}`}
        >
          <ProductImage
            src={image?.storage_path}
            alt={image?.alt_text || product.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
          />
        </Link>

        {/* Subtle bottom vignette for crisp legibility of floating buttons */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 via-black/15 to-transparent opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />

        {/* Double-tap Dopamine Heart Burst Animation */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
              animate={{ scale: 1.25, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.6, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            >
              <Heart className="w-16 h-16 text-rose-500 fill-rose-500 drop-shadow-[0_6px_24px_rgba(244,63,94,0.65)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-Left Scarcity / Value Badges */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          <span className="rounded-full border border-white/25 bg-black/65 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
            {badgeText}
          </span>
          {hasDiscount && (
            <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-white shadow-sm">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* Top-Right Social Proof Heart Pill */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const nowLiked = toggleLike(product.id);
            if (nowLiked) {
              setShowHeartBurst(true);
              setTimeout(() => setShowHeartBurst(false), 650);
            }
          }}
          aria-label={liked ? "Hapus dari disukai" : "Sukai produk ini"}
          className={`absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-md border transition-all active:scale-90 ${
            liked
              ? "bg-rose-500 text-white border-rose-400 shadow-md"
              : "bg-black/45 text-white border-white/20 hover:bg-black/70"
          }`}
        >
          <Heart className={`w-3 h-3 ${liked ? "fill-white" : ""}`} />
          <span>{likeCount}</span>
        </button>

        {/* Bottom Floating Quick Actions (Pinterest / TikTok Instant Hook) */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-10 flex items-center justify-between gap-2 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition-all duration-300">
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="flex items-center gap-1 rounded-full bg-white/95 dark:bg-stone-900/95 px-2.5 py-1.5 text-[10px] font-bold text-stone-900 dark:text-white shadow-md backdrop-blur-md hover:scale-105 transition-transform"
              aria-label="Quick View"
            >
              <Eye className="w-3 h-3" />
              <span className="hidden xs:inline sm:inline">Preview</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addItem(product, undefined, 1);
            }}
            className="ml-auto flex items-center gap-1 rounded-full bg-[var(--storefront-accent)] px-3 py-1.5 text-[10px] font-bold text-white shadow-md hover:opacity-95 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>+ Bag</span>
          </button>
        </div>
      </div>

      {/* Product Meta */}
      <Link href={`/product/${product.slug}`} className="block pt-2.5 px-1">
        <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] sm:text-[11px] font-medium text-[#806C71] dark:text-[#C5B5A8] line-clamp-1">
          {product.category?.name && (
            <span className="font-semibold text-[var(--storefront-accent)]">
              {product.category.name}
            </span>
          )}
          {product.tagline && <span>· {product.tagline}</span>}
        </div>

        <div className="mt-1 flex items-start justify-between gap-1.5">
          <h3 className="font-serif text-sm sm:text-base font-medium leading-snug text-[#4D3040] transition-colors group-hover:text-[var(--storefront-accent)] dark:text-[#FAF4EE] line-clamp-2">
            {product.name}
          </h3>
          <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8D624C] dark:text-[#D1A686] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 hidden sm:block" />
        </div>

        {/* Visual Tag Chips */}
        {product.flavor_notes && product.flavor_notes.length > 0 && (
          <div className="mt-1.5 hidden sm:flex flex-wrap gap-1">
            {product.flavor_notes.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-stone-100 dark:bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 dark:text-stone-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Price Bar */}
        <div className="mt-2 flex items-baseline gap-2 border-t border-[#DBD0C5]/40 pt-1.5 dark:border-white/10">
          <span className="text-xs sm:text-sm font-bold text-[#4D3040] dark:text-[#FAF4EE]">
            {formatPrice(product.base_price, currency)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] sm:text-xs text-stone-400 line-through">
              {formatPrice(product.compare_at_price!, currency)}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;
