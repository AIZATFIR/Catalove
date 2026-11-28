"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { OrderForm } from "@/components/storefront/OrderForm";
import { ProductCard } from "@/components/storefront/ProductCard";
import { cakeService } from "@/lib/services/cake-service";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils/formatters";
import type { Product } from "@/types/bakery";
import { ChevronRight, Clock, ShieldCheck, Heart, Tag, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { safeExternalCheckoutUrl } from "@/lib/utils/external-checkout";
import { ExternalCheckoutAction } from "@/components/storefront/ExternalCheckoutAction";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const settings = useBusinessSettings();
  const { toggleLike, isLiked, getLikeCount } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      if (!slug) {
        if (active) setLoading(false);
        return;
      }

      try {
        const found = await cakeService.getProductBySlug(slug);
        if (!active) return;

        setProduct(found);

        if (found) {
          const allProducts = await cakeService.getProducts({ includeInactive: false });
          if (!active) return;

          const sameCat = allProducts.filter(
            (p) => p.id !== found.id && p.is_active && p.category_id === found.category_id
          );
          const others = allProducts.filter(
            (p) => p.id !== found.id && p.is_active && p.category_id !== found.category_id
          );
          setRelatedProducts([...sameCat, ...others].slice(0, 3));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProduct();

    const handleUpdate = () => {
      void loadProduct();
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
  }, [slug]);

  const currencySymbol = settings.currency_symbol || "Rp";

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FCFAF6] dark:bg-[#1A1412]">
        <Navbar />
        <main id="main-content" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-6 aspect-square rounded-3xl bg-stone-200/70 dark:bg-white/5 animate-pulse" />
            <div className="lg:col-span-6 space-y-4">
              <div className="h-6 w-32 rounded-full bg-stone-200/70 dark:bg-white/5 animate-pulse" />
              <div className="h-10 w-3/4 rounded-xl bg-stone-200/70 dark:bg-white/5 animate-pulse" />
              <div className="h-24 w-full rounded-2xl bg-stone-200/70 dark:bg-white/5 animate-pulse" />
              <div className="h-64 w-full rounded-3xl bg-stone-200/70 dark:bg-white/5 animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FCFAF6] text-[#33262A] dark:bg-[#1A1412] dark:text-[#F2E7DC]">
        <Navbar />
        <main id="main-content" className="mx-auto w-full max-w-2xl flex-1 px-4 py-20 text-center space-y-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#B8794A]">
            404 — Produk Tidak Ditemukan
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#4D3040] dark:text-[#FAF4EE]">
            Produk tidak tersedia atau sudah berpindah etalase
          </h1>
          <p className="text-sm text-[#67575B] dark:text-[#C5B5A8]">
            Koleksi di {settings.store_name || "toko ini"} mungkin baru diperbarui atau Anda beralih preset usaha.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/catalog"
              className="touch-target inline-flex items-center gap-2 rounded-full bg-[var(--storefront-accent)] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-soft"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Lihat Semua Katalog</span>
            </Link>
            <Link
              href="/"
              className="touch-target inline-flex items-center gap-2 rounded-full border border-[#DBD0C5] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#4D3040] dark:border-white/15 dark:text-[#FAF4EE]"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isReady = product.minimum_lead_time_days === 0;
  const externalCheckoutUrl = safeExternalCheckoutUrl(product.external_checkout_url);
  const liked = isLiked(product.id);
  const likeCount = getLikeCount(product.id);
  const hasDiscount =
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.base_price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.base_price) /
          product.compare_at_price!) *
          100
      )
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#FCFAF6] text-[#33262A] dark:bg-[#1A1412] dark:text-[#F2E7DC] transition-colors">
      <Navbar />

      <main id="main-content" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-cocoa-500 dark:text-[#C5B5A8] mb-6">
          <Link href="/" className="hover:text-[var(--storefront-accent)]">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/catalog" className="hover:text-[var(--storefront-accent)]">
            Katalog
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-cocoa-900 dark:text-[#FAF4EE] truncate">
            {product.name}
          </span>
        </nav>

        {/* 2-Column Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          {/* Left Column: Gallery & Details */}
          <div className="lg:col-span-6 space-y-6">
            <ProductGallery images={product.images} productName={product.name} />

            {/* Story & Attributes */}
            <div className="space-y-4 border-y border-[#DBD0C5] dark:border-white/10 py-6">
              <h3 className="font-serif font-bold text-lg text-cocoa-950 dark:text-[#FAF4EE]">
                Karakter &amp; Spesifikasi Produk
              </h3>
              <p className="text-xs sm:text-sm text-cocoa-700 dark:text-[#D8CBC0] leading-relaxed">
                {product.description}
              </p>

              {/* Dynamic Specs Table (universal across all industries) */}
              {product.specs && product.specs.length > 0 && (
                <div className="rounded-2xl border border-[#DBD0C5]/70 dark:border-white/10 bg-white/60 dark:bg-white/5 overflow-hidden">
                  <dl className="divide-y divide-[#DBD0C5]/50 dark:divide-white/10 text-xs">
                    {product.specs.map((spec, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-3 gap-2 px-4 py-2.5"
                      >
                        <dt className="font-semibold text-[#8D624C] dark:text-[#D1A686]">
                          {spec.label}
                        </dt>
                        <dd className="col-span-2 text-cocoa-900 dark:text-[#FAF4EE] font-medium">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Tags / Notes Pills */}
              {product.flavor_notes && product.flavor_notes.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {product.flavor_notes.map((note, idx) => (
                    <span
                      key={idx}
                      className="rounded-full border border-[#DBD0C5] dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-1 text-xs font-medium text-cocoa-800 dark:text-[#E8DDD4]"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-caramel-100 dark:border-white/10 text-xs text-cocoa-700 dark:text-[#D8CBC0]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{settings.store_name || "Catalove"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--storefront-accent)] shrink-0" />
                  <span>{externalCheckoutUrl ? "Checkout dikelola seller" : "Direct WhatsApp"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Price, Wishlist, Lead Time & Order Form */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Category, Status & Custom Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                {product.category && (
                  <Badge variant="category" size="md">
                    {product.category.name}
                  </Badge>
                )}
                {externalCheckoutUrl ? (
                  <Badge variant="neutral" size="md">Checkout eksternal</Badge>
                ) : isReady ? (
                  <Badge variant="ready" size="md">
                    Ready Stock
                  </Badge>
                ) : (
                  <Badge variant="preorder" size="md">
                    Pre-Order H-{product.minimum_lead_time_days}
                  </Badge>
                )}
                {product.badge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    {product.badge}
                  </span>
                )}
                {hasDiscount && (
                  <span className="inline-flex items-center rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    Hemat {discountPercent}%
                  </span>
                )}
              </div>

              {/* Name & Wishlist Button Row */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cocoa-950 dark:text-[#FAF4EE] tracking-tight leading-tight">
                    {product.name}
                  </h1>
                  {product.tagline && (
                    <p className="mt-1.5 text-sm font-medium text-[#8D624C] dark:text-[#D1A686]">
                      {product.tagline}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleLike(product.id)}
                  className={`touch-target shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                    liked
                      ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-300"
                      : "border-[#DBD0C5] bg-white/80 text-cocoa-700 hover:border-rose-300 hover:text-rose-600 dark:border-white/15 dark:bg-white/5 dark:text-[#E8DDD4]"
                  }`}
                  aria-label={liked ? "Hapus dari favorit" : "Simpan ke favorit"}
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
                  <span className="tabular-nums">{likeCount}</span>
                </button>
              </div>

              {/* Quick Base Price / Promo Display */}
              <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
                <span className="text-xl font-bold text-[var(--storefront-accent)] tabular-nums">
                  Mulai {formatPrice(product.base_price, currencySymbol)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-stone-400 line-through tabular-nums">
                    {formatPrice(product.compare_at_price!, currencySymbol)}
                  </span>
                )}
              </div>

              {/* Lead-time Notice */}
              <div className="mt-3.5 flex items-center gap-2 border-l-2 border-[var(--storefront-accent)] bg-[#F5EFE8] dark:bg-white/5 px-4 py-3 text-xs font-medium text-cocoa-900 dark:text-[#E8DDD4] rounded-r-xl">
                <Clock className="w-4 h-4 text-[var(--storefront-accent)] shrink-0" />
                <span>
                  {externalCheckoutUrl
                    ? "Akses produk dan ketentuan pembelian tersedia di platform seller."
                    : isReady
                      ? "Tersedia untuk pengantaran atau pengambilan hari ini."
                      : `Produk memerlukan waktu persiapan minimal H-${product.minimum_lead_time_days} sebelum pengiriman.`}
                </span>
              </div>
            </div>

            {externalCheckoutUrl ? (
              <ExternalCheckoutAction
                checkoutUrl={externalCheckoutUrl}
                storeName={settings.store_name || "toko ini"}
                sellerWhatsApp={settings.seller_whatsapp}
              />
            ) : (
              <OrderForm product={product} />
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-[#DBD0C5] dark:border-white/10 pt-10">
            <h2 className="font-serif text-2xl font-bold text-cocoa-950 dark:text-[#FAF4EE] mb-6">
              Koleksi Terkait Lainnya
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((related, idx) => (
                <ProductCard key={related.id} product={related} index={idx} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
