import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { OrderForm } from "@/components/storefront/OrderForm";
import { ProductCard } from "@/components/storefront/ProductCard";
import { cakeService } from "@/lib/services/cake-service";
import { ChevronRight, Clock, ShieldCheck, Heart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await cakeService.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Get related cakes in same category
  const allCakes = await cakeService.getProducts();
  const relatedCakes = allCakes
    .filter((p) => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 3);

  const isReady = product.minimum_lead_time_days === 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-cocoa-500 mb-6">
          <Link href="/" className="hover:text-caramel-700">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/catalog" className="hover:text-caramel-700">
            Katalog
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-cocoa-900 truncate">
            {product.name}
          </span>
        </nav>

        {/* 2-Column Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          {/* Left Column: Gallery & Details */}
          <div className="lg:col-span-6 space-y-6">
            <ProductGallery images={product.images} productName={product.name} />

            {/* Story & Attributes */}
            <div className="space-y-4 border-y border-[#DBD0C5] py-6">
              <h3 className="font-serif font-bold text-lg text-cocoa-950">
                Karakter & Spesifikasi Produk
              </h3>
              <p className="text-xs sm:text-sm text-cocoa-700 leading-relaxed">
                {product.description}
              </p>

              {/* Flavor / Spec Pills */}
              <div className="pt-2 flex flex-wrap gap-2">
                {product.flavor_notes?.map((note, idx) => (
                  <span
                    key={idx}
                    className="border-b border-[#DBD0C5] px-1 py-1 text-xs font-medium text-cocoa-800"
                  >
                    {note}
                  </span>
                ))}
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-caramel-100 text-xs text-cocoa-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kualitas Material Teruji</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Dibuat & Dikirim dengan Teliti</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Lead Time & Order Form */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Category & Status */}
              <div className="flex items-center gap-2.5 mb-2">
                {product.category && (
                  <Badge variant="category" size="md">
                    {product.category.name}
                  </Badge>
                )}
                {isReady ? (
                  <Badge variant="ready" size="md">
                    Ready Stock
                  </Badge>
                ) : (
                  <Badge variant="preorder" size="md">
                    Pre-Order H-{product.minimum_lead_time_days}
                  </Badge>
                )}
              </div>

              {/* Name */}
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cocoa-950 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Lead-time Notice */}
              <div className="mt-3.5 flex items-center gap-2 border-l-2 border-[#B8794A] bg-[#F5EFE8] px-4 py-3 text-xs font-medium text-cocoa-900">
                <Clock className="w-4 h-4 text-caramel-700" />
                <span>
                  {isReady
                    ? "Tersedia untuk pengantaran atau penjemputan hari ini."
                    : `Produk memerlukan waktu persiapan minimal H-${product.minimum_lead_time_days} sebelum pengiriman.`}
                </span>
              </div>
            </div>

            {/* Order Form Component */}
            <OrderForm product={product} />
          </div>
        </div>

        {/* Related Products Section */}
        {relatedCakes.length > 0 && (
          <div className="border-t border-[#DBD0C5] pt-10">
            <h2 className="font-serif text-2xl font-bold text-cocoa-950 mb-6">
              Koleksi Terkait Lainnya
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCakes.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
