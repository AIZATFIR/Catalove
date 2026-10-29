"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProductImage } from "@/types/bakery";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const currentImage = images[selectedIndex] || images[0];

  if (!currentImage) {
    return (
      <div className="w-full aspect-square rounded-3xl bg-vanilla-200 border border-caramel-200 flex items-center justify-center text-cocoa-400">
        Foto tidak tersedia
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image Frame */}
      <div className="relative aspect-square sm:aspect-[4/3] w-full rounded-3xl overflow-hidden bg-white border border-caramel-200 shadow-card">
        <Image
          src={currentImage.storage_path}
          alt={currentImage.alt_text || productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 600px"
          className="object-cover transition-all duration-300"
        />
      </div>

      {/* Thumbnails row (if multiple images) */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`touch-target relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all shadow-sm ${
                selectedIndex === idx
                  ? "border-caramel-600 ring-2 ring-caramel-300 scale-95"
                  : "border-transparent opacity-75 hover:opacity-100"
              }`}
            >
              <Image
                src={img.storage_path}
                alt={img.alt_text || `${productName} foto ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
