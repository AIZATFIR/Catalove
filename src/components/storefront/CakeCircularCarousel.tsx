"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import CircularCarousel from "@/components/react-bits/CircularCarousel";
import type { Product } from "@/types/bakery";

type CarouselCakePhoto = {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  productSlug: string;
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function CakeCircularCarousel({ products, variant = "hero" }: { products: Product[]; variant?: "hero" | "gallery" }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const photos = useMemo<CarouselCakePhoto[]>(() => products
    .filter((product) => product.is_active)
    .flatMap((product) => product.images
      .filter((image) => Boolean(image.storage_path))
      .map((image) => ({
        src: image.storage_path,
        alt: image.alt_text || product.name,
        title: product.name,
        subtitle: product.category?.name || "Dari koleksi SofizCake",
        productSlug: product.slug,
      }))), [products]);
  const [orderedPhotos, setOrderedPhotos] = useState(photos);

  useEffect(() => {
    setOrderedPhotos(shuffle(photos));
  }, [photos]);

  if (!orderedPhotos.length) return null;

  return (
    <div className={`sofiz-circular-stage ${variant === "gallery" ? "sofiz-circular-stage--gallery" : ""}`} aria-label="Foto koleksi kue SofizCake">
      <CircularCarousel
        items={orderedPhotos}
        ariaLabel="Jelajahi foto semua kue SofizCake"
        preset="panorama"
        intro="assemble"
        cardWidth={320}
        aspectRatio={0.75}
        speed={3}
        captions
        gap={7}
        tilt={3}
        curve={0.5}
        perspective={1800}
        autoplay="drift"
        interval={3}
        direction="left"
        momentum={0.7}
        snap
        pauseOnHover
        focusOnClick
        draggable
        parallax={0.22}
        stretch={0.35}
        fadeColor="transparent"
        depthFade={0.12}
        innerShade={0.08}
        cornerRadius={24}
        onItemClick={(item) => { if (item.productSlug) router.push(`/product/${item.productSlug}`); }}
      />
      <p className="sofiz-circular-hint" aria-hidden="true">Geser untuk melihat koleksi · ketuk foto untuk detail</p>
    </div>
  );
}
