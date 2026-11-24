"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, RotateCcw } from "lucide-react";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { DiscoveryFeed } from "@/components/storefront/DiscoveryFeed";
import { CatalogFilters } from "@/components/storefront/CatalogFilters";
import { CakeCircularCarousel } from "@/components/storefront/CakeCircularCarousel";
import { RecommendationDrawer } from "@/components/ai/RecommendationDrawer";
import { cakeService } from "@/lib/services/cake-service";
import type { Category, Product } from "@/types/bakery";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

const PAGE_SIZE = 24;

export default function CatalogPage() {
  const settings = useBusinessSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      try {
        const [cats, prods] = await Promise.all([
          cakeService.getCategories(),
          cakeService.getProducts({ includeInactive: false }),
        ]);
        if (!active) return;
        setCategories(cats || []);
        setProductsList(prods || []);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadCatalog();

    const handleUpdate = () => {
      void loadCatalog();
    };

    window.addEventListener("catalove-catalog-updated", handleUpdate);
    window.addEventListener("catalove-settings-change", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      active = false;
      window.removeEventListener("catalove-catalog-updated", handleUpdate);
      window.removeEventListener("catalove-settings-change", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const products = productsList
      .filter((product) => {
        if (!product.is_active) return false;
        if (selectedCategory !== "all" && product.category_id !== selectedCategory)
          return false;
        if (availabilityFilter === "ready" && product.minimum_lead_time_days > 0)
          return false;
        if (availabilityFilter === "preorder" && product.minimum_lead_time_days === 0)
          return false;
        const query = searchQuery.trim().toLowerCase();
        return (
          !query ||
          [
            product.name,
            product.description,
            product.tagline || "",
            ...(product.flavor_notes || []),
          ].some((value) => value.toLowerCase().includes(query))
        );
      })
      .map((product) => ({
        ...product,
        category:
          categories.find((category) => category.id === product.category_id) ||
          product.category,
      }));

    if (sortBy === "price-asc") products.sort((a, b) => a.base_price - b.base_price);
    else if (sortBy === "price-desc") products.sort((a, b) => b.base_price - a.base_price);
    else if (sortBy === "lead-time")
      products.sort((a, b) => a.minimum_lead_time_days - b.minimum_lead_time_days);
    else products.sort((a, b) => a.display_order - b.display_order);
    return products;
  }, [productsList, categories, selectedCategory, searchQuery, availabilityFilter, sortBy]);

  const catalogTitle = settings.catalog_title || "Katalog";

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-[#33262A] dark:bg-[#1A1412] dark:text-[#F2E7DC] transition-colors">
      <Navbar onOpenQuiz={() => setIsQuizOpen(true)} />

      {/* Featured circular carousel */}
      <section className="border-b border-[#DBD0C5]/40 dark:border-white/10 overflow-hidden">
        <CakeCircularCarousel products={productsList} />
      </section>

      <main id="main-content" className="mx-auto max-w-[1600px] px-4 py-8 sm:px-8 sm:py-12 lg:px-12">
        {/* Page Header */}
        <div className="mb-8 border-b border-[#DBD0C5]/40 pb-6 dark:border-white/10">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#4D3040] dark:text-[#FAF4EE] sm:text-5xl">
            {catalogTitle}
          </h1>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <CatalogFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            availabilityFilter={availabilityFilter}
            onAvailabilityChange={setAvailabilityFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalResults={filteredProducts.length}
          />
        </div>

        {/* Results Count */}
        <div className="mb-5 flex items-baseline justify-between text-xs text-[#806C71] dark:text-[#C5B5A8]">
          <p>{filteredProducts.length} produk ditampilkan</p>
          <p>Pilih tampilan Pinterest, TikTok Feed, atau Grid di bawah</p>
        </div>

        {/* Products Discovery Feed */}
        {isLoading && productsList.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-[4/5] rounded-3xl bg-stone-200/70 dark:bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <DiscoveryFeed
              products={filteredProducts.slice(0, visibleCount)}
              categories={categories}
              showCategoryPills={false}
              hideHeader={true}
            />
            {visibleCount < filteredProducts.length && (
              <div className="border-t border-[#DBD0C5]/40 py-8 text-center dark:border-white/10 mt-8">
                <button
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="touch-target border border-[#4D3040] px-6 py-3 text-sm font-semibold text-[#4D3040] transition-colors hover:bg-[#4D3040] hover:text-white dark:border-[#D6A77E] dark:text-[#FAF4EE] dark:hover:bg-[#D6A77E] dark:hover:text-[#211B19]"
                >
                  Muat lebih banyak produk
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="border-y border-[#DBD0C5]/40 py-16 text-center dark:border-white/10">
            <h2 className="font-serif text-2xl font-medium text-[#4D3040] dark:text-[#FAF4EE]">
              Tidak ada produk yang cocok.
            </h2>
            <p className="mt-2 text-sm text-[#67575B] dark:text-[#D8CBC0]">
              Coba ubah kata kunci pencarian atau reset filter.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-5">
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                  setAvailabilityFilter("all");
                  setSortBy("default");
                }}
                className="touch-target inline-flex items-center gap-2 border-b border-[#B8794A]/60 text-sm font-semibold text-[#4D3040] dark:text-[#FAF4EE]"
              >
                <RotateCcw size={16} aria-hidden="true" /> Reset filter
              </button>
              <a
                href={`https://wa.me/${settings.seller_whatsapp}?text=${encodeURIComponent(
                  `Halo ${settings.store_name || "Catalove"}, saya ingin bertanya seputar produk yang tersedia.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target inline-flex items-center gap-2 border-b border-[#B8794A]/60 text-sm font-semibold text-[#4D3040] dark:text-[#FAF4EE]"
              >
                <MessageCircle size={16} aria-hidden="true" /> Tanya Seller di WhatsApp
              </a>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <RecommendationDrawer
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        products={productsList}
      />
    </div>
  );
}
