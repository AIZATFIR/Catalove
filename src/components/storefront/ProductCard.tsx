"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/types/bakery";
import { formatIDR } from "@/lib/utils/formatters";
import { ProductImage } from "@/components/storefront/ProductImage";

const imageRatios = ["aspect-[4/5]", "aspect-[3/4]", "aspect-[4/5]"];

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const image = product.images?.find((item) => item.is_primary) ?? product.images?.[0];
  const leadTime = product.minimum_lead_time_days ?? 0;

  // Determine Badge
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

  return (
    <article className="mb-4 sm:mb-8 break-inside-avoid group" data-gsap-reveal>
      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--storefront-accent)]"
        aria-label={`Lihat ${product.name}, mulai ${formatIDR(product.base_price)}`}
      >
        {/* Product Image Frame */}
        <div
          className={`relative ${
            imageRatios[index % imageRatios.length]
          } overflow-hidden rounded-xl bg-[#F0E8DE] dark:bg-[#2C2421] transition-all duration-500`}
        >
          <ProductImage
            src={image?.storage_path}
            alt={image?.alt_text || product.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
          />

          {/* Badge */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 items-start">
            <span className="rounded-full border border-black/10 bg-white/90 px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-900 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-stone-900/90 dark:text-stone-100">
              {badgeText}
            </span>
            {hasDiscount && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-sm">
                -{discountPct}%
              </span>
            )}
          </div>
        </div>

        {/* Product Meta */}
        <div className="pt-2 sm:pt-3">
          <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] sm:text-xs font-medium text-[#806C71] dark:text-[#C5B5A8] line-clamp-1">
            {product.category?.name && <span>{product.category.name}</span>}
            {product.tagline && <span>· {product.tagline}</span>}
          </div>

          <div className="mt-1 flex items-start justify-between gap-1 sm:gap-3">
            <h2 className="font-serif text-sm sm:text-lg font-medium leading-snug text-[#4D3040] transition-colors group-hover:text-[var(--storefront-accent)] dark:text-[#FAF4EE] line-clamp-2">
              {product.name}
            </h2>
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#8D624C] dark:text-[#D1A686] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 hidden sm:block" />
          </div>

          {product.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#67575B] dark:text-[#D8CBC0] hidden sm:block">
              {product.description}
            </p>
          )}

          {/* Price Bar */}
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2 border-t border-[#DBD0C5]/40 pt-1.5 sm:pt-2 dark:border-white/10">
            <span className="text-xs sm:text-sm font-semibold text-[#4D3040] dark:text-[#FAF4EE]">
              {formatIDR(product.base_price)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                {formatIDR(product.compare_at_price!)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;
