"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, ArrowUpRight } from "lucide-react";
import { cakeService } from "@/lib/services/cake-service";
import type { Product } from "@/types/catalove";

export function LiveSocialProofToast() {
  const [products, setProducts] = useState<Product[]>([]);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () => {
      cakeService
        .getProducts({ includeInactive: false })
        .then((list) => {
          if (!active) return;
          setProducts((list || []).filter((p) => p.is_active));
        })
        .catch(() => {
          // ignore
        });
    };

    load();
    window.addEventListener("catalove-catalog-updated", load);
    return () => {
      active = false;
      window.removeEventListener("catalove-catalog-updated", load);
    };
  }, []);

  useEffect(() => {
    if (dismissed || products.length === 0) return;

    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 5000);

    const cycleTimer = setInterval(() => {
      setVisible(true);
      setTick((prev) => prev + 1);
    }, 24000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(cycleTimer);
    };
  }, [dismissed, products.length]);

  if (dismissed || !visible || products.length === 0) {
    return null;
  }

  const product = products[tick % products.length];
  if (!product) return null;

  const viewerCount = 12 + ((tick * 5 + product.name.length) % 19);
  const thumb =
    product.images?.find((img) => img.is_primary)?.storage_path ||
    product.images?.[0]?.storage_path;

  const cueMessages = [
    `🔥 ${viewerCount} orang sedang melihat ${product.name}`,
    `💖 ${product.name} baru saja disukai pengunjung`,
    `⚡ Stok ${product.name} siap dipesan via WhatsApp`,
  ];
  const message = cueMessages[tick % cueMessages.length];

  return (
    <div className="fixed bottom-4 right-4 z-30 max-w-xs w-[calc(100vw-2rem)] sm:w-auto animate-slide-up">
      <div className="relative flex items-center gap-3 rounded-2xl border border-stone-200/90 dark:border-white/15 bg-white/90 dark:bg-[#1E1815]/95 p-2.5 pr-8 text-stone-900 dark:text-stone-100 shadow-2xl backdrop-blur-xl">
        <Link
          href={`/product/${product.slug}`}
          className="flex items-center gap-2.5 min-w-0 group"
        >
          {thumb && (
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-white/10">
              <img
                src={thumb}
                alt={product.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-[var(--storefront-accent)] transition-colors">
              {message}
            </p>
            <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-stone-500 dark:text-stone-400">
              Lihat detail <ArrowUpRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setDismissed(true);
          }}
          className="absolute right-2 top-2 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Tutup notifikasi aktivitas"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

