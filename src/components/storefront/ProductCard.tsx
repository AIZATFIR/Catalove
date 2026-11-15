"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Heart,
  Image as ImageIcon,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/types/bakery";
import { formatPrice } from "@/lib/utils/formatters";
import { ProductImage } from "@/components/storefront/ProductImage";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCart } from "@/context/CartContext";

const QUICK_SAMPLE_PHOTOS = [
  {
    label: "Apparel",
    url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1000&q=80",
  },
  {
    label: "Kopi",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80",
  },
  {
    label: "Parfum",
    url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1000&q=80",
  },
  {
    label: "Tas Kanvas",
    url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80",
  },
  {
    label: "Sneakers",
    url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=80",
  },
  {
    label: "Gift Box",
    url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80",
  },
];

const MASONRY_RATIOS = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[9/12]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[3/4]",
];

export interface CanvasProductPatch {
  name?: string;
  base_price?: number;
  badge?: string;
  imageUrl?: string;
}

interface ProductCardProps {
  product: Product;
  index?: number;
  aspectRatioClass?: string;
  onQuickView?: (product: Product) => void;
  masonryMode?: boolean;
  isCanvasMode?: boolean;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  onMoveProduct?: (productId: string, direction: "left" | "right") => void;
  onUpdateProduct?: (productId: string, updates: CanvasProductPatch) => void;
  onDeleteProduct?: (productId: string) => void;
}

export function ProductCard({
  product,
  index = 0,
  aspectRatioClass,
  onQuickView,
  masonryMode = true,
  isCanvasMode = false,
  canMoveLeft = false,
  canMoveRight = false,
  onMoveProduct,
  onUpdateProduct,
  onDeleteProduct,
}: ProductCardProps) {
  const settings = useBusinessSettings();
  const { addItem, toggleLike, isLiked } = useCart();

  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const lastTapRef = useRef<number>(0);

  const image = product.images?.find((item) => item.is_primary) ?? product.images?.[0];

  const [draftName, setDraftName] = useState(product.name);
  const [draftPrice, setDraftPrice] = useState(String(product.base_price));
  const [draftBadge, setDraftBadge] = useState(product.badge || "");
  const [draftPhotoUrl, setDraftPhotoUrl] = useState(image?.storage_path || "");

  useEffect(() => {
    setDraftName(product.name);
    setDraftPrice(String(product.base_price));
    setDraftBadge(product.badge || "");
    setDraftPhotoUrl(image?.storage_path || "");
  }, [product.name, product.base_price, product.badge, image?.storage_path]);

  useEffect(() => {
    if (!isCanvasMode) {
      setShowPhotoPicker(false);
    }
  }, [isCanvasMode]);
  const currency = settings.currency_symbol || "Rp";
  const cardStyle = settings.theme_config?.card_style || "clean_flat";
  const isFlushCard = cardStyle === "modern_glass" || cardStyle === "bordered_clay";

  const liked = isLiked(product.id);
  const rawBadge = (product.badge || "").trim();
  const badgeText = rawBadge && rawBadge.toLowerCase() !== "sample" ? rawBadge : "";

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
    clean_flat: "transition-colors",
    minimal_mono:
      "rounded-none border-b border-[var(--storefront-line)] pb-3 transition-colors",
    modern_glass:
      "rounded-xl overflow-hidden bg-[var(--storefront-surface)] transition-colors",
    bordered_clay:
      "rounded-xl overflow-hidden border border-[var(--storefront-line)] bg-[var(--storefront-background)] transition-colors",
  };

  const frameRoundedClass =
    cardStyle === "clean_flat" ? "rounded-lg" : "rounded-none";

  const triggerHeartBurst = () => {
    if (!liked) {
      toggleLike(product.id);
    }
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 700);
  };

  const handleImagePointerDown = () => {
    if (isCanvasMode) return;
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      triggerHeartBurst();
    }
    lastTapRef.current = now;
  };

  const commitName = () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setDraftName(product.name);
      return;
    }
    if (trimmed !== product.name) {
      onUpdateProduct?.(product.id, { name: trimmed });
    }
  };

  const commitPrice = () => {
    const numeric = Number(draftPrice.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(numeric) || draftPrice.trim() === "") {
      setDraftPrice(String(product.base_price));
      return;
    }
    if (numeric !== product.base_price) {
      onUpdateProduct?.(product.id, { base_price: numeric });
    }
  };

  const commitBadge = () => {
    const trimmed = draftBadge.trim();
    if (trimmed !== (product.badge || "")) {
      onUpdateProduct?.(product.id, { badge: trimmed });
    }
  };

  const commitPhotoUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;
    onUpdateProduct?.(product.id, { imageUrl: trimmed });
    setDraftPhotoUrl(trimmed);
    setShowPhotoPicker(false);
  };

  return (
    <article
      className={`mb-4 sm:mb-6 break-inside-avoid group ${
        cardContainerClasses[cardStyle] || cardContainerClasses.modern_glass
      } ${isCanvasMode ? "ring-1 ring-[var(--storefront-accent)]" : ""}`}
      {...(!isCanvasMode ? { "data-gsap-reveal": "" } : {})}
    >
      {isCanvasMode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mb-2 flex items-center justify-between gap-1 rounded-xl bg-stone-900 px-1.5 py-1 text-[10px] font-bold text-white shadow-sm"
        >
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={!canMoveLeft}
              onClick={() => onMoveProduct?.(product.id, "left")}
              aria-label="Geser kiri"
              className="rounded-lg p-1 hover:bg-white/15 disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              disabled={!canMoveRight}
              onClick={() => onMoveProduct?.(product.id, "right")}
              aria-label="Geser kanan"
              className="rounded-lg p-1 hover:bg-white/15 disabled:opacity-30 transition-colors"
            >
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowPhotoPicker((prev) => !prev)}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 transition-colors ${
                showPhotoPicker ? "bg-[var(--storefront-accent)] text-white" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              <ImageIcon className="h-3 w-3" />
              <span>Foto</span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteProduct?.(product.id)}
              aria-label="Hapus produk"
              className="rounded-lg p-1 text-rose-300 hover:bg-rose-500/25 hover:text-rose-200 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div
        onDoubleClick={(e) => {
          if (isCanvasMode) return;
          e.preventDefault();
          triggerHeartBurst();
        }}
        onTouchStart={handleImagePointerDown}
        className={`relative ${chosenRatio} overflow-hidden ${frameRoundedClass} bg-[#F0E8DE] dark:bg-[#2C2421] transition-all duration-500`}
      >
        {isCanvasMode ? (
          <button
            type="button"
            onClick={() => setShowPhotoPicker((prev) => !prev)}
            className="block w-full h-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--storefront-accent)]"
            aria-label={`Ubah foto ${product.name}`}
          >
            <ProductImage
              key={image?.storage_path || "fallback"}
              src={image?.storage_path}
              alt={image?.alt_text || product.name}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          </button>
        ) : (
          <Link
            href={`/product/${product.slug}`}
            className="block w-full h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--storefront-accent)]"
            aria-label={product.name}
          >
            <ProductImage
              key={image?.storage_path || "fallback"}
              src={image?.storage_path}
              alt={image?.alt_text || product.name}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
            />
          </Link>
        )}

        {isCanvasMode && showPhotoPicker && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 z-30 flex flex-col justify-between bg-stone-950/90 p-2.5 text-white backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-200">
                Pilih Foto
              </span>
              <button
                type="button"
                onClick={() => setShowPhotoPicker(false)}
                aria-label="Tutup pemilih foto"
                className="rounded-full bg-white/10 p-1 hover:bg-white/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 my-auto">
              {QUICK_SAMPLE_PHOTOS.map((preset) => {
                const isSelected = image?.storage_path === preset.url;
                return (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => commitPhotoUrl(preset.url)}
                    className={`group/thumb relative overflow-hidden rounded-lg border transition-all ${
                      isSelected
                        ? "border-[var(--storefront-accent)] ring-1 ring-[var(--storefront-accent)]"
                        : "border-white/15 hover:border-white/50"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="h-11 w-full object-cover"
                    />
                    <span className="block truncate bg-black/75 px-1 py-0.5 text-[9px] font-semibold">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 pt-1">
              <input
                type="url"
                value={draftPhotoUrl}
                onChange={(e) => setDraftPhotoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitPhotoUrl(draftPhotoUrl);
                  }
                }}
                placeholder="https://url-foto..."
                className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[10px] text-white placeholder:text-stone-400 focus:border-[var(--storefront-accent)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => commitPhotoUrl(draftPhotoUrl)}
                className="shrink-0 rounded-lg bg-[var(--storefront-accent)] px-2 py-1 text-[10px] font-bold text-white hover:opacity-90"
              >
                Pakai
              </button>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 via-black/15 to-transparent opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />

        {/* Double-tap Heart Burst */}
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

        {/* Top-Left Minimal Badge (only for intentional custom labels or discounts) */}
        {(badgeText || hasDiscount) && (
          <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
            {badgeText && (
              <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                {badgeText}
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                -{discountPct}%
              </span>
            )}
          </div>
        )}

        {/* Top-Right Icon-Only Like */}
        {!isCanvasMode && (
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
            aria-label={liked ? "Hapus suka" : "Sukai"}
            className={`absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md border transition-all active:scale-90 ${
              liked
                ? "bg-rose-500 text-white border-rose-400 shadow-md"
                : "bg-black/45 text-white border-white/20 hover:bg-black/70"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-white" : ""}`} />
          </button>
        )}

        {/* Bottom Floating Quick Actions */}
        {!isCanvasMode && (
          <div className="absolute inset-x-2.5 bottom-2.5 z-10 flex items-center justify-between gap-2 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition-all duration-300">
            {onQuickView && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView(product);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-white shadow-md backdrop-blur-md hover:scale-105 transition-transform"
                aria-label="Preview"
              >
                <Eye className="w-3.5 h-3.5" />
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
        )}
      </div>

      {/* Inline Canvas Editor vs Normal Meta Link */}
      {isCanvasMode ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`${isFlushCard ? "px-3 pb-3 pt-2.5" : "pt-2.5"} space-y-1.5`}
        >
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={draftBadge}
              onChange={(e) => setDraftBadge(e.target.value)}
              onBlur={commitBadge}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              aria-label="Badge produk"
              placeholder="Label (mis. Best)"
              className="w-24 rounded-lg border border-stone-200 dark:border-white/15 bg-white dark:bg-stone-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200 focus:border-[var(--storefront-accent)] focus:outline-none"
            />
            <div className="flex flex-1 items-center rounded-lg border border-stone-200 dark:border-white/15 bg-white dark:bg-stone-900 px-2 py-1 focus-within:border-[var(--storefront-accent)]">
              <span className="mr-1 text-[10px] font-bold text-stone-400">{currency}</span>
              <input
                type="text"
                inputMode="numeric"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
                onBlur={commitPrice}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                aria-label="Harga produk"
                className="w-full min-w-0 bg-transparent text-xs font-bold text-[var(--storefront-ink)] focus:outline-none"
              />
            </div>
          </div>

          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            aria-label="Nama produk"
            placeholder="Nama produk..."
            className="w-full rounded-lg border border-stone-200 dark:border-white/15 bg-white dark:bg-stone-900 px-2.5 py-1.5 font-serif text-sm font-medium text-[var(--storefront-ink)] focus:border-[var(--storefront-accent)] focus:outline-none"
          />
        </div>
      ) : (
        <Link
          href={`/product/${product.slug}`}
          className={`block ${isFlushCard ? "px-3 pb-3 pt-2.5" : "pt-2.5"}`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-serif text-sm sm:text-base font-medium leading-snug text-[var(--storefront-ink)] transition-colors group-hover:text-[var(--storefront-accent)] line-clamp-1">
              {product.name}
            </h3>
            <span className="shrink-0 text-xs sm:text-sm font-semibold tabular-nums text-[var(--storefront-ink)]">
              {formatPrice(product.base_price, currency)}
            </span>
          </div>
          {hasDiscount && (
            <p className="text-right text-[10px] text-stone-400 line-through">
              {formatPrice(product.compare_at_price!, currency)}
            </p>
          )}
        </Link>
      )}
    </article>
  );
}

export default ProductCard;
