"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/storefront/Navbar";
import { Hero } from "@/components/storefront/Hero";
import { CakeScrollShowcase } from "@/components/storefront/CakeScrollShowcase";
import { CakeCircularCarousel } from "@/components/storefront/CakeCircularCarousel";
import { OrderSteps } from "@/components/storefront/OrderSteps";
import { BakeryStory } from "@/components/storefront/BakeryStory";
import { Footer } from "@/components/storefront/Footer";
import { RecommendationDrawer } from "@/components/ai/RecommendationDrawer";
import { StickyCard002 } from "@/components/ui/skiper-ui/skiper17";
import { Skiper8 } from "@/components/ui/skiper-ui/skiper8";
import { Product } from "@/types/bakery";
import { INITIAL_PRODUCTS } from "@/lib/data/seed-cakes";
import { cakeService } from "@/lib/services/cake-service";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export default function HomePage() {
  const settings = useBusinessSettings();
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(() => INITIAL_PRODUCTS.filter((product) => product.is_active));

  useEffect(() => {
    cakeService.getProducts({ includeInactive: false }).then((prods) => {
      if (prods && prods.length > 0) {
        setProducts(prods.filter((p) => p.is_active));
      }
    });
  }, []);

  const stickyCards = useMemo(() => {
    return products
      .filter((p) => p.is_active && p.images?.length > 0)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        image: p.images.find((img) => img.is_primary)?.storage_path || p.images[0]?.storage_path,
        title: p.name,
        subtitle: p.category?.name || "Koleksi Unggulan",
        price: p.base_price,
        slug: p.slug,
        leadTime: p.minimum_lead_time_days,
        alt: p.name,
      }));
  }, [products]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skiper8 Words Preloader Opening */}
      <Skiper8 products={products} />

      <Navbar onOpenQuiz={() => setIsQuizOpen(true)} />
      <main className="flex-1">
        <Hero products={products} onOpenQuiz={() => setIsQuizOpen(true)} />

        {/* Skiper17 Stacked Sticky Cards Section */}
        {stickyCards.length > 1 && (
          <section aria-labelledby="featured-cakes-title" className="border-b border-[#DBD0C5]/40 py-12 sm:py-16 dark:border-white/10">
            <div className="mx-auto max-w-3xl px-4 pb-6 sm:px-8 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#8D624C] dark:text-[#D1A686]">
                Karya Pilihan Hari Ini
              </p>
              <h2 id="featured-cakes-title" className="mt-2 font-serif text-3xl font-medium text-[#4D3040] dark:text-[#FAF4EE] sm:text-5xl">
                Koleksi Paling Dicari
              </h2>
              <p className="mt-2 text-sm text-[#67575B] dark:text-[#D8CBC0]">
                Gulir perlahan untuk melihat kreasi produk favorit pelanggan {settings.store_name || "Catalove"}.
              </p>
            </div>
            <StickyCard002 cards={stickyCards} />
          </section>
        )}

        <CakeScrollShowcase products={products} />
        <OrderSteps />

        {/* Showcase Section */}
        <section aria-labelledby="scroll-cakes-title" className="border-b border-[#DBD0C5]/40 py-12 sm:py-16 dark:border-white/10">
          <div className="mx-auto max-w-[1600px] px-4 pb-4 sm:px-8 lg:px-12">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#8D624C] dark:text-[#D1A686]">
                  {settings.showcase_eyebrow || "Koleksi Unggulan"}
                </p>
                <h2 id="scroll-cakes-title" className="mt-1 font-serif text-3xl font-medium text-[#4D3040] dark:text-[#FAF4EE] sm:text-5xl">
                  {settings.showcase_title || "Pilihan Terpopuler"}
                </h2>
                <p className="mt-2 text-sm text-[#67575B] dark:text-[#D8CBC0]">
                  {settings.showcase_desc || "Ketuk produk untuk melihat detail varian, harga, dan cara pemesanan."}
                </p>
              </div>
              <a
                href="/catalog"
                className="touch-target hidden items-center border-b border-[#4D3040]/50 text-sm font-medium text-[#4D3040] transition-colors hover:text-[#B8794A] dark:border-white/30 dark:text-[#FAF4EE] dark:hover:text-[#E8A572] sm:inline-flex"
              >
                {settings.showcase_link_text || "Semua Produk"}
              </a>
            </div>
          </div>
          <CakeCircularCarousel products={products} variant="gallery" />
        </section>

        <BakeryStory />
      </main>
      <Footer />

      {/* Interactive Recommendation Quiz Drawer */}
      <RecommendationDrawer
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        products={products}
      />
    </div>
  );
}
