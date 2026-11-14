"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ScrollExpand from "@/components/react-bits/ScrollExpand";
import type { Product } from "@/types/bakery";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export function CakeScrollShowcase({ products }: { products: Product[] }) {
  const settings = useBusinessSettings();
  const photos = useMemo(() => products
    .filter((product) => product.is_active)
    .flatMap((product) => product.images.filter((image) => image.storage_path).map((image) => ({ product, image }))), [products]);
  const [featured, setFeatured] = useState(photos[0] ?? null);

  useEffect(() => {
    if (photos.length) setFeatured(photos[Math.floor(Math.random() * photos.length)]);
  }, [photos]);

  if (!featured) return null;

  return (
    <section aria-label="Perbesar foto produk saat menggulir">
      <ScrollExpand
        src={featured.image.storage_path}
        alt={featured.image.alt_text || featured.product.name}
        title={featured.product.name}
        scrollHint="Gulir untuk melihat lebih dekat"
        startWidth={76}
        startHeight={72}
        startRadius={18}
        endRadius={0}
        mediaZoom={1.12}
        scrollDistance={0.7}
        startOffset={0.5}
        holdDistance={0.42}
        smoothing={0.08}
        overlayScrim={0.46}
        useWindowScroll
        className="catalove-product-expand"
        style={{ height: "100svh", minHeight: "520px" }}
      >
        <div className="max-w-2xl text-white">
          <p className="text-xs font-medium uppercase tracking-[.2em] text-white/75">
            {settings.scroll_showcase_eyebrow || `Koleksi ${settings.store_name || "Catalove"}`}
          </p>
          <h2 className="mt-3 font-serif text-4xl font-medium leading-tight sm:text-6xl">{featured.product.name}</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
            {settings.scroll_showcase_desc || "Pilih varian favorit Anda dan ajukan pemesanan dengan konfirmasi instan via WhatsApp."}
          </p>
          <Link
            href={`/product/${featured.product.slug}`}
            className="mt-7 inline-flex min-h-11 items-center border border-white/75 px-6 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[#4D3040] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {settings.scroll_showcase_button || "Lihat Detail Produk"}
          </Link>
        </div>
      </ScrollExpand>
    </section>
  );
}

export default CakeScrollShowcase;
