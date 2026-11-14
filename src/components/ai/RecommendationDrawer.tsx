"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  SlidersHorizontal,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { Product } from "@/types/bakery";
import { formatPrice } from "@/lib/utils/formatters";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCart } from "@/context/CartContext";

interface RecommendationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const RecommendationDrawer: React.FC<RecommendationDrawerProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const settings = useBusinessSettings();
  const { addItem } = useCart();

  const [step, setStep] = useState<number>(1);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("all");
  const [budgetRange, setBudgetRange] = useState<"all" | "low" | "mid" | "high">("all");
  const [tagPref, setTagPref] = useState<string>("all");

  const currency = settings.currency_symbol || "Rp";

  // Extract unique categories & tags from live store products
  const dynamicCategories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.category?.id && p.category?.name) {
        map.set(p.category.id, p.category.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const dynamicTags = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      (p.flavor_notes || []).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [products]);

  const priceThresholds = useMemo(() => {
    if (products.length === 0) return { p33: 150000, p66: 350000 };
    const sorted = [...products].map((p) => p.base_price).sort((a, b) => a - b);
    const p33 = sorted[Math.floor(sorted.length * 0.33)] || sorted[0];
    const p66 = sorted[Math.floor(sorted.length * 0.66)] || sorted[sorted.length - 1];
    return { p33, p66 };
  }, [products]);

  const matches = useMemo(() => {
    return products
      .map((p) => {
        let score = p.is_featured ? 1 : 0;

        if (selectedCategoryName !== "all" && p.category?.id === selectedCategoryName) {
          score += 4;
        }
        if (budgetRange === "low" && p.base_price <= priceThresholds.p33) score += 3;
        if (
          budgetRange === "mid" &&
          p.base_price > priceThresholds.p33 &&
          p.base_price <= priceThresholds.p66
        )
          score += 3;
        if (budgetRange === "high" && p.base_price >= priceThresholds.p66) score += 3;

        if (tagPref === "ready" && (p.minimum_lead_time_days ?? 0) === 0) score += 4;
        if (
          tagPref !== "all" &&
          tagPref !== "ready" &&
          (p.flavor_notes || []).some((t) => t.toLowerCase() === tagPref.toLowerCase())
        ) {
          score += 4;
        }

        return { product: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.product);
  }, [products, selectedCategoryName, budgetRange, tagPref, priceThresholds]);

  if (!isOpen) return null;

  const resetQuiz = () => {
    setStep(1);
    setSelectedCategoryName("all");
    setBudgetRange("all");
    setTagPref("all");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-lg bg-[#FCFAF6] dark:bg-[#1E1815] text-stone-900 dark:text-stone-100 h-full shadow-2xl flex flex-col z-10 border-l border-stone-200 dark:border-white/10 animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--storefront-accent)]/15 flex items-center justify-center text-[var(--storefront-accent)]">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg leading-none">
                Bantu Pilih
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                {settings.store_name || "Catalove"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="touch-target inline-flex items-center justify-center p-2 rounded-full hover:bg-stone-200/60 dark:hover:bg-white/10"
            aria-label="Tutup asisten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-[var(--storefront-accent)] uppercase tracking-wider">
                Langkah 1 dari 3
              </span>
              <h3 className="font-serif text-2xl font-bold">
                Kategori apa yang sedang Anda cari?
              </h3>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryName(cat.id);
                      setStep(2);
                    }}
                    className="touch-target w-full p-4 rounded-2xl text-left bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 hover:border-[var(--storefront-accent)] transition-all flex items-center justify-between group shadow-sm"
                  >
                    <span className="font-bold text-sm">{cat.name}</span>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[var(--storefront-accent)] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSelectedCategoryName("all");
                    setStep(2);
                  }}
                  className="touch-target w-full p-4 rounded-2xl text-left bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 hover:border-[var(--storefront-accent)] transition-all flex items-center justify-between group shadow-sm"
                >
                  <div>
                    <div className="font-bold text-sm">Semua Kategori / Tunjukkan yang Terbaik</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Eksplor seluruh koleksi terlaris toko
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[var(--storefront-accent)] group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-[var(--storefront-accent)] uppercase tracking-wider">
                Langkah 2 dari 3
              </span>
              <h3 className="font-serif text-2xl font-bold">
                Perkiraan rentang budget Anda?
              </h3>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  {
                    id: "low",
                    label: "Hemat & Ekonomis",
                    desc: `Kisaran hingga ${formatPrice(priceThresholds.p33, currency)}`,
                  },
                  {
                    id: "mid",
                    label: "Menengah / Best Value",
                    desc: `${formatPrice(priceThresholds.p33, currency)} – ${formatPrice(
                      priceThresholds.p66,
                      currency
                    )}`,
                  },
                  {
                    id: "high",
                    label: "Premium & Eksklusif",
                    desc: `Mulai ${formatPrice(priceThresholds.p66, currency)} ke atas`,
                  },
                  {
                    id: "all",
                    label: "Bebas (Sesuai Kualitas Terbaik)",
                    desc: "Tampilkan semua opsi harga",
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setBudgetRange(opt.id as any);
                      setStep(3);
                    }}
                    className="touch-target w-full p-4 rounded-2xl text-left bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 hover:border-[var(--storefront-accent)] transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div>
                      <div className="font-bold text-sm">{opt.label}</div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {opt.desc}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[var(--storefront-accent)] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-[var(--storefront-accent)] uppercase tracking-wider">
                Langkah Terakhir
              </span>
              <h3 className="font-serif text-2xl font-bold">
                Prioritas atau gaya yang disukai?
              </h3>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setTagPref("ready");
                    setStep(4);
                  }}
                  className="touch-target w-full p-4 rounded-2xl text-left bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 hover:border-[var(--storefront-accent)] transition-all flex items-center justify-between group shadow-sm"
                >
                  <div>
                    <div className="font-bold text-sm">Siap Kirim Hari Ini (Ready Stock)</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Produk tanpa waktu tunggu pre-order
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[var(--storefront-accent)]" />
                </button>

                {dynamicTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setTagPref(tag);
                      setStep(4);
                    }}
                    className="touch-target w-full p-4 rounded-2xl text-left bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 hover:border-[var(--storefront-accent)] transition-all flex items-center justify-between group shadow-sm"
                  >
                    <span className="font-bold text-sm">Fokus: #{tag}</span>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[var(--storefront-accent)]" />
                  </button>
                ))}

                <button
                  onClick={() => {
                    setTagPref("all");
                    setStep(4);
                  }}
                  className="touch-target w-full p-4 rounded-2xl text-left bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 hover:border-[var(--storefront-accent)] transition-all flex items-center justify-between group shadow-sm"
                >
                  <span className="font-bold text-sm">Tampilkan Rekomendasi Terbaik</span>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[var(--storefront-accent)]" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Kurasi Ditemukan</span>
                  </span>
                  <h3 className="font-serif text-2xl font-bold mt-1">
                    Paling Cocok Untuk Anda
                  </h3>
                </div>
                <button
                  onClick={resetQuiz}
                  className="touch-target text-xs text-stone-500 hover:text-[var(--storefront-accent)] flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ulangi</span>
                </button>
              </div>

              <div className="space-y-4">
                {matches.map((product) => {
                  const img = product.images?.find((i) => i.is_primary) || product.images?.[0];
                  return (
                    <div
                      key={product.id}
                      className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-stone-200/80 dark:border-white/10 shadow-sm flex gap-4 items-center"
                    >
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-stone-200">
                        {img && (
                          <Image
                            src={img.storage_path}
                            alt={product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-[var(--storefront-accent)] uppercase tracking-wider">
                          {product.badge ||
                            (product.minimum_lead_time_days === 0
                              ? "Ready Stock"
                              : `Pre-Order H-${product.minimum_lead_time_days}`)}
                        </div>
                        <h4 className="font-serif font-bold text-sm truncate mt-0.5">
                          {product.name}
                        </h4>
                        <p className="text-xs font-bold mt-1">
                          {formatPrice(product.base_price, currency)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => addItem(product, undefined, 1)}
                          className="p-2.5 rounded-full bg-[var(--storefront-accent)] text-white hover:opacity-90"
                          aria-label={`Tambah ${product.name} ke keranjang`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/product/${product.slug}`}
                          onClick={onClose}
                          className="p-2.5 rounded-full border border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/10"
                          aria-label={`Lihat ${product.name}`}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-[var(--storefront-accent)]/10 border border-[var(--storefront-accent)]/25 text-xs leading-relaxed">
                <span className="font-bold">Tips Belanja:</span> Anda dapat mencantumkan catatan khusus atau bertanya langsung via WhatsApp sebelum mengonfirmasi pesanan.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
