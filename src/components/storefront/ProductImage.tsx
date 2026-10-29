"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImageProps {
  src?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/** Keeps catalog cards composed when a remote product photo is unavailable. */
export function ProductImage({ src, alt, sizes, priority, className = "" }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`product-art relative flex h-full w-full items-center justify-center overflow-hidden ${className}`} role="img" aria-label={`${alt} — ilustrasi sementara`}>
        <span className="product-art-orbit product-art-orbit-one" aria-hidden="true" />
        <span className="product-art-orbit product-art-orbit-two" aria-hidden="true" />
        <svg aria-hidden="true" viewBox="0 0 240 220" className="relative z-10 h-[72%] w-[72%] drop-shadow-[0_18px_18px_rgba(80,46,37,.16)]" fill="none">
          <ellipse cx="120" cy="178" rx="83" ry="17" fill="#4D3040" fillOpacity=".12" />
          <path d="M56 112h128l-10 51c-2 11-11 19-22 19H88c-11 0-20-8-22-19l-10-51Z" fill="#FFF9F0" stroke="#B8794A" strokeWidth="4" />
          <path d="M56 112c0-15 14-25 27-20 7-19 33-21 43-5 12-16 39-13 45 6 14-5 29 5 29 19H56Z" fill="#EAC1AD" stroke="#B8794A" strokeWidth="4" strokeLinejoin="round" />
          <path d="M75 131h90M79 151h82" stroke="#D99A77" strokeWidth="5" strokeLinecap="round" />
          <path d="M119 49c-10 13-5 23 1 29 8-10 10-19-1-29Z" fill="#B8794A" />
          <path d="M120 75v20" stroke="#B8794A" strokeWidth="4" strokeLinecap="round" />
          <path d="M94 91c5-8 13-8 18 0M132 91c5-8 13-8 18 0" stroke="#7894B4" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="absolute bottom-4 rounded-full border border-white/70 bg-white/60 px-3 py-1 text-[10px] font-medium tracking-wide text-[#4D3040]/70 backdrop-blur">Ilustrasi katalog</span>
      </div>
    );
  }

  if (src.startsWith("blob:") || src.startsWith("data:")) {
    return (
      // Temporary browser previews remain visible while the seller is editing a product.
      // Persistent production uploads need the configured storage driver.
      <img src={src} alt={alt} className={`absolute inset-0 h-full w-full object-cover ${className}`} />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
