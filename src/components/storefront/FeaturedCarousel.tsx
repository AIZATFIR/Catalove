"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { Product } from "@/types/bakery";
import { formatIDR } from "@/lib/utils/formatters";
import { ProductImage } from "@/components/storefront/ProductImage";

interface FeaturedCarouselProps {
  products: Product[];
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ products }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateEdges = () => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      setEdges({
        atStart: container.scrollLeft <= 1,
        atEnd: maxScroll <= 1 || container.scrollLeft >= maxScroll - 1,
      });
    };

    updateEdges();
    container.addEventListener("scroll", updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(container);

    return () => {
      container.removeEventListener("scroll", updateEdges);
      observer.disconnect();
    };
  }, [products.length]);

  if (products.length === 0) return null;

  const scrollByPage = (direction: -1 | 1) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    container.scrollBy({
      left: container.clientWidth * 0.8 * direction,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <section
      className="relative overflow-hidden border-y border-[#DBD0C5] bg-[#FCFAF6] py-12 sm:py-16"
      aria-labelledby="featured-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Header with Title and Desktop Controls */}
          <div className="mb-7 flex flex-col justify-between gap-4 sm:mb-9 md:flex-row md:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#9B674F]">
              <span className="h-px w-6 bg-[#B8794A]" />
              <span>Pilihan unggulan</span>
            </div>
            <h2
              id="featured-title"
              className="font-serif text-3xl font-medium tracking-tight text-[#4D3040] sm:text-4xl"
            >
              Produk pilihan
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#67575B] sm:text-base">
              Jelajahi produk pilihan dan detailnya.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              href="/catalog"
              className="touch-target mr-1 inline-flex items-center gap-1 px-2 text-sm font-semibold text-[#4D3040] hover:text-[#B8794A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa-900"
            >
              <span>Lihat Semua</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => scrollByPage(-1)}
              type="button"
              aria-label="Kue sebelumnya"
              aria-controls="featured-products"
              disabled={edges.atStart}
              className="touch-target inline-flex items-center justify-center border border-[#DBD0C5] text-[#4D3040] transition-colors hover:border-[#4D3040] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa-900 disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none"
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollByPage(1)}
              type="button"
              aria-label="Kue berikutnya"
              aria-controls="featured-products"
              disabled={edges.atEnd}
              className="touch-target inline-flex items-center justify-center border border-[#DBD0C5] text-[#4D3040] transition-colors hover:border-[#4D3040] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa-900 disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none"
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container (Touch-Friendly Swipe) */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          id="featured-products"
          role="region"
          aria-label="Kue unggulan"
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-5 pt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa-900 sm:mx-0 sm:gap-6 sm:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => {
            const primaryImage =
              product.images.find((img) => img.is_primary) || product.images[0];
            return (
              <article
                key={product.id}
                className="w-[82%] shrink-0 snap-start sm:w-[320px] lg:w-[350px]"
              >
                <div className="group flex h-full flex-col border-b border-[#DBD0C5] bg-transparent pb-4 transition-colors duration-300 motion-reduce:transition-none">
                  {/* Image Container */}
                  <Link
                    href={`/product/${product.slug}`}
                    className="relative block aspect-[4/3] w-full overflow-hidden bg-[#EADBD3]"
                  >
                    <ProductImage
                      src={primaryImage?.storage_path}
                      alt={primaryImage?.alt_text || product.name}
                      sizes="(max-width: 640px) 82vw, 350px"
                      className="transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                    />

                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                      <span className="bg-[#FCFAF6]/95 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#4D3040]">
                        {product.minimum_lead_time_days > 0
                          ? `Lead time H-${product.minimum_lead_time_days}`
                          : "Lead time 0 hari"}
                      </span>
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                    <div>
                      {/* Flavor Notes */}
                      {product.flavor_notes.length > 0 && (
                        <div className="mb-2.5 flex flex-wrap gap-x-2 text-xs text-[#806C71]">
                          {product.flavor_notes.slice(0, 2).map((note, idx) => (
                            <span
                              key={idx}
                              className="font-medium"
                            >
                              {note}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Product Name */}
                      <Link
                        href={`/product/${product.slug}`}
                        className="line-clamp-2 font-serif text-xl font-semibold text-[#4D3040] transition-colors group-hover:text-[#B8794A]"
                      >
                        {product.name}
                      </Link>

                      {/* Short Description */}
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#67575B]">
                        {product.description}
                      </p>
                    </div>

                    {/* Price and CTA */}
                    <div className="mt-5 flex items-center justify-between border-t border-[#4D3040]/10 pt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#806C71]">
                          Mulai dari
                        </span>
                        <span className="mt-0.5 text-base font-bold text-[#4D3040]">
                          {formatIDR(product.base_price)}
                        </span>
                      </div>

                      <Link
                        href={`/product/${product.slug}`}
                        className="touch-target inline-flex items-center justify-center border border-[#4D3040] px-5 py-2 text-xs font-semibold text-[#4D3040] transition-colors hover:bg-[#4D3040] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa-900 motion-reduce:transition-none"
                      >
                        <span>Lihat kue</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
