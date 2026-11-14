"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/storefront/Navbar";
import { Hero } from "@/components/storefront/Hero";
import { CakeScrollShowcase } from "@/components/storefront/CakeScrollShowcase";
import { CakeCircularCarousel } from "@/components/storefront/CakeCircularCarousel";
import { BrandStory } from "@/components/storefront/BrandStory";
import { Footer } from "@/components/storefront/Footer";
import { RecommendationDrawer } from "@/components/ai/RecommendationDrawer";
import { DiscoveryFeed } from "@/components/storefront/DiscoveryFeed";
import { StickyCard002 } from "@/components/ui/skiper-ui/skiper17";
import { Skiper8 } from "@/components/ui/skiper-ui/skiper8";
import { Category, Product } from "@/types/bakery";
import { cakeService } from "@/lib/services/cake-service";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export default function HomePage() {
  const settings = useBusinessSettings();
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

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
        image: p.images.find((img) => img.is_primary)?.storage_path || p.images[0]?.storage_path,
        title: p.name,
        subtitle: p.category?.name || "Sample",
        price: p.base_price,
        slug: p.slug,
        leadTime: p.minimum_lead_time_days,
        alt: p.name,
      }));
  }, [products]);

  return (
    <div className="flex flex-col min-h-screen">
      <Skiper8 products={products} />

      <Navbar onOpenQuiz={() => setIsQuizOpen(true)} />
      <main className="flex-1">
        <Hero products={products} onOpenQuiz={() => setIsQuizOpen(true)} />

        {/* Interactive Discovery Feed */}
        <DiscoveryFeed products={products} categories={categories} />

        {/* Sticky Cards Lookbook */}
        {stickyCards.length > 1 && (
          <section aria-labelledby="featured-cakes-title" className="border-b border-[#DBD0C5]/40 py-10 sm:py-14 dark:border-white/10">
            <div className="mx-auto max-w-3xl px-4 pb-5 sm:px-8 text-center">
              <h2 id="featured-cakes-title" className="font-serif text-3xl font-medium text-[#4D3040] dark:text-[#FAF4EE] sm:text-5xl">
                Lookbook
              </h2>
            </div>
            <StickyCard002 cards={stickyCards} />
          </section>
        )}

        <CakeScrollShowcase products={products} />

        {/* Showcase Carousel */}
        <section aria-labelledby="scroll-cakes-title" className="border-b border-[#DBD0C5]/40 py-10 sm:py-14 dark:border-white/10">
          <div className="mx-auto max-w-[1600px] px-4 pb-4 sm:px-8 lg:px-12">
            <div className="flex items-end justify-between gap-5">
              <h2 id="scroll-cakes-title" className="font-serif text-3xl font-medium text-[#4D3040] dark:text-[#FAF4EE] sm:text-5xl">
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

        <BrandStory />
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
