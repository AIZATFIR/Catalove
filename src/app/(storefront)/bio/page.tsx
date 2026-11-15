"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  Heart,
  LayoutGrid,
  MapPin,
  MessageCircle,
  QrCode,
  Share2,
  ShoppingBag,
  Sliders,
  X,
} from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCart } from "@/context/CartContext";
import { cakeService } from "@/lib/services/cake-service";
import { formatPrice } from "@/lib/utils/formatters";
import { ProductImage } from "@/components/storefront/ProductImage";
import { openOrderSchemeModal } from "@/components/storefront/PricingSection";
import type { Product } from "@/types/catalove";

export default function BioLinkPage() {
  const settings = useBusinessSettings();
  const { addItem, openCart, toggleLike, isLiked } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storeUrl, setStoreUrl] = useState("https://catalove.vercel.app/bio");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoreUrl(window.location.origin);
    }

    let active = true;
    const loadCatalog = () => {
      cakeService
        .getProducts({ includeInactive: false })
        .then((list) => {
          if (!active) return;
          setProducts((list || []).filter((p) => p.is_active));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    loadCatalog();
    window.addEventListener("catalove-catalog-updated", loadCatalog);
    window.addEventListener("storage", loadCatalog);
    return () => {
      active = false;
      window.removeEventListener("catalove-catalog-updated", loadCatalog);
      window.removeEventListener("storage", loadCatalog);
    };
  }, []);

  const storeName = settings.store_name || "Catalove";
  const storeTagline =
    settings.store_tagline || "Simple yet interesting catalog for your brand.";
  const storeAddress =
    settings.store_address || settings.kitchen_address || "Indonesia";
  const currency = settings.currency_symbol || "Rp";
  const cleanWa = (settings.seller_whatsapp || "6285946689168").replace(/[^0-9]/g, "");
  const isDefaultWa = cleanWa === "6285946689168";
  const whatsappUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    isDefaultWa
      ? "Halo, saya mau pesan Catalove untuk brand saya."
      : `Halo ${storeName}, saya ingin bertanya.`
  )}`;

  const initials = storeName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");

  const spotlightProducts = products.slice(0, 4);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    storeUrl
  )}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard?.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const shareToWhatsAppUrl = `https://wa.me/?text=${encodeURIComponent(
    `Cek katalog digital ${storeName}: ${storeUrl}`
  )}`;

  return (
    <main className="min-h-screen py-6 px-4 pb-24">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="touch-target inline-flex items-center gap-1.5 rounded-full border border-stone-300/80 dark:border-white/15 bg-white/75 dark:bg-white/5 px-3.5 py-2 text-xs font-semibold hover:border-[var(--storefront-accent)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Beranda</span>
          </Link>

          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="touch-target inline-flex items-center gap-1.5 rounded-full bg-[var(--storefront-accent)] px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Bagikan</span>
          </button>
        </div>

        {/* Digital Business Profile Header */}
        <section className="rounded-3xl border border-stone-200/80 dark:border-white/15 bg-white/80 dark:bg-white/5 p-6 text-center shadow-lg backdrop-blur-md space-y-3">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--storefront-accent)] text-white font-serif text-2xl font-bold shadow-lg ring-4 ring-[var(--storefront-accent)]/20">
            <span>{initials || "C"}</span>
            <span
              className="absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-stone-900 p-1 shadow-sm"
              title="Catalove"
            >
              <BadgeCheck className="h-5 w-5 text-sky-500" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center rounded-full bg-[var(--storefront-accent)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--storefront-accent)]">
              <span>{settings.footer_badge || "Catalove"}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              {storeName}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-sm mx-auto">
              {storeTagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 px-3 py-1 text-stone-600 dark:text-stone-300">
              <MapPin className="h-3 w-3 text-[var(--storefront-accent)]" />
              <span>{storeAddress}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Online</span>
            </span>
          </div>
        </section>

        {/* Primary Bio Action Links */}
        <section aria-label="Tautan Utama" className="space-y-2.5">
          <button
            type="button"
            onClick={() => openOrderSchemeModal()}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[var(--storefront-accent)] px-4 py-3.5 text-left text-white shadow-md hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Pilih Paket &amp; Pesan Catalove</p>
                <p className="text-[11px] text-white/85">Mandiri atau Terima Jadi</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 opacity-85" />
          </button>

          <Link
            href="/?canvas=1"
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--storefront-line)] bg-[var(--storefront-surface)] px-4 py-3.5 shadow-sm hover:border-[var(--storefront-accent)] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-tint)] text-[var(--storefront-accent)]">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Coba Mode Kanvas</p>
                <p className="text-[11px] opacity-65">Geser blok &amp; ubah warna langsung</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 opacity-60" />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-2xl bg-[#25D366] px-4 py-3.5 text-white shadow-md hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold leading-none">Pesan Catalove</p>
                <p className="text-[11px] text-white/90 mt-1">
                  +62 859-4668-9168
                </p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0" />
          </a>

          <Link
            href="/#discovery-feed"
            className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 dark:border-white/15 bg-white/85 dark:bg-white/5 px-4 py-3.5 shadow-sm hover:border-[var(--storefront-accent)] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--storefront-accent)]/15 text-[var(--storefront-accent)]">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold leading-none">
                  Feed
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Waterfall & Snap
                </p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-stone-400" />
          </Link>

          <Link
            href="/catalog"
            className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 dark:border-white/15 bg-white/85 dark:bg-white/5 px-4 py-3.5 shadow-sm hover:border-[var(--storefront-accent)] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900/10 dark:bg-white/10">
                <LayoutGrid className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold leading-none">
                  Katalog
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Semua sample
                </p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-stone-400" />
          </Link>

          {settings.instagram_handle ? (
            <a
              href={`https://instagram.com/${settings.instagram_handle.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 dark:border-white/15 bg-white/85 dark:bg-white/5 px-4 py-3.5 shadow-sm hover:border-[var(--storefront-accent)] active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold leading-none">Instagram Official</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    {settings.instagram_handle}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-stone-400" />
            </a>
          ) : null}
        </section>

        {/* Interactive Mini-Catalog Spotlight */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold">Sample</h2>
            <Link
              href="/catalog"
              className="text-xs font-bold underline decoration-[var(--storefront-accent)] underline-offset-4"
            >
              Semua
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((skeleton) => (
                <div
                  key={skeleton}
                  className="aspect-[3/4] rounded-2xl bg-stone-200/70 dark:bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {spotlightProducts.map((product) => {
                const img =
                  product.images?.find((i) => i.is_primary)?.storage_path ||
                  product.images?.[0]?.storage_path;
                const liked = isLiked(product.id);
                return (
                  <div
                    key={product.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 dark:border-white/15 bg-white/90 dark:bg-white/5 shadow-sm"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 dark:bg-stone-900">
                      <Link href={`/product/${product.slug}`} className="block h-full w-full">
                        <ProductImage
                          src={img}
                          alt={product.name}
                          sizes="240px"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>
                      {product.badge && (
                        <span className="absolute left-2 top-2 rounded-full bg-[var(--storefront-accent)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                          {product.badge}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleLike(product.id)}
                        aria-label={`Sukai ${product.name}`}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-stone-900/80 shadow-md backdrop-blur-sm transition-transform active:scale-90"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            liked
                              ? "fill-rose-500 text-rose-500"
                              : "text-stone-700 dark:text-stone-200"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-3 space-y-2.5">
                      <div>
                        <Link
                          href={`/product/${product.slug}`}
                          className="font-serif text-sm font-bold leading-snug line-clamp-2 hover:text-[var(--storefront-accent)]"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs font-bold text-[var(--storefront-accent)]">
                          {formatPrice(product.base_price, currency)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const defaultVariant =
                            product.variants?.find((v) => v.is_default) ||
                            product.variants?.[0];
                          addItem(product, defaultVariant, 1);
                          openCart();
                        }}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-stone-900 dark:bg-[var(--storefront-accent)] py-2 text-[11px] font-bold text-white hover:opacity-95 transition-opacity"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>+ Bag</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* QR Code & Share Store Modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setQrOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-stone-200 dark:border-white/15 bg-white dark:bg-[#1E1815] p-6 text-center text-stone-900 dark:text-stone-100 shadow-2xl space-y-4 animate-slide-up">
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-white/10"
              aria-label="Tutup modal QR"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold mt-1">{storeName}</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Scan QR untuk membuka katalog
              </p>
            </div>

            <div className="mx-auto inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white p-3 shadow-inner">
              <img
                src={qrImageUrl}
                alt={`QR Code Katalog ${storeName}`}
                width={220}
                height={220}
                className="h-52 w-52 rounded-lg"
              />
            </div>

            <div className="rounded-xl bg-stone-100 dark:bg-white/5 px-3 py-2 text-[11px] font-mono text-stone-600 dark:text-stone-300 truncate">
              {storeUrl}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => void handleCopyUrl()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-white/15 py-2.5 text-xs font-bold hover:bg-stone-100 dark:hover:bg-white/10"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
              <a
                href={shareToWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-xs font-bold text-white hover:opacity-95"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

