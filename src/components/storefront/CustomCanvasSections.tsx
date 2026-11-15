"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { Product } from "@/types/bakery";
import type { CanvasSectionId, SectionCustomConfig } from "@/types/catalove";
import { ProductImage } from "@/components/storefront/ProductImage";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { saveBusinessSettings } from "@/lib/business-settings";
import { DEFAULT_THEME_CONFIG } from "@/lib/data/universal-presets";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils/formatters";
import { openOrderSchemeModal } from "@/components/storefront/PricingSection";

function useSectionConfig(sectionId: CanvasSectionId) {
  const settings = useBusinessSettings();
  const activeTheme = settings.theme_config || DEFAULT_THEME_CONFIG;
  const config: SectionCustomConfig =
    activeTheme.section_configs?.[sectionId] || {};

  const updateConfig = (patch: Partial<SectionCustomConfig>) => {
    saveBusinessSettings({
      ...settings,
      theme_config: {
        ...activeTheme,
        section_configs: {
          ...(activeTheme.section_configs || {}),
          [sectionId]: {
            ...(activeTheme.section_configs?.[sectionId] || {}),
            ...patch,
          },
        },
      },
    });
  };

  return { settings, config, updateConfig };
}

/* ============================================================================
 * 1. FEATURED PRODUCT SPLIT
 * ========================================================================== */
export function FeaturedSplitSection({
  products,
  isCanvasMode = false,
}: {
  products: Product[];
  isCanvasMode?: boolean;
}) {
  const { settings, config, updateConfig } = useSectionConfig("featured_split");
  const { addItem, openCart } = useCart();
  const currency = settings.currency_symbol || "Rp";

  const activeProducts = products.filter((p) => p.is_active);
  const selected =
    activeProducts.find((p) => p.id === config.featured_product_id) ||
    activeProducts[0];

  if (!selected) {
    return isCanvasMode ? (
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12 text-center text-sm opacity-70">
        Belum ada produk aktif untuk ditampilkan pada Sorotan Produk.
      </div>
    ) : null;
  }

  const image =
    selected.images?.find((img) => img.is_primary) || selected.images?.[0];
  const titleText = config.title ?? selected.name;
  const descText = config.subtitle ?? selected.description;
  const ctaText = config.cta_text ?? "Pesan Sekarang";

  return (
    <section aria-label={titleText}>
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12">
        <div className="lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--storefront-surface)]">
            <ProductImage
              src={image?.storage_path}
              alt={image?.alt_text || selected.name}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6 max-w-xl">
          {isCanvasMode && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70">
                Pilih Produk Sorotan
              </label>
              <select
                value={selected.id}
                onChange={(e) =>
                  updateConfig({ featured_product_id: e.target.value })
                }
                className="w-full rounded-lg border border-dashed border-[var(--storefront-accent)] bg-white/80 dark:bg-stone-900 px-3 py-2 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none"
              >
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatPrice(p.base_price, currency)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {isCanvasMode ? (
            <input
              type="text"
              value={titleText}
              onChange={(e) => updateConfig({ title: e.target.value })}
              aria-label="Edit judul sorotan produk"
              className="w-full rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-3 py-2 font-serif text-3xl sm:text-5xl font-medium leading-[1.14] text-[var(--storefront-ink)] focus:outline-none"
            />
          ) : (
            <h2 className="font-serif text-3xl sm:text-5xl font-medium leading-[1.14] tracking-tight text-[var(--storefront-ink)]">
              {titleText}
            </h2>
          )}

          {isCanvasMode ? (
            <textarea
              rows={3}
              value={descText}
              onChange={(e) => updateConfig({ subtitle: e.target.value })}
              aria-label="Edit deskripsi sorotan produk"
              className="w-full resize-none rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-3 py-2 text-sm sm:text-base leading-relaxed text-[var(--storefront-ink)] focus:outline-none"
            />
          ) : (
            <p className="text-sm sm:text-base leading-relaxed text-[var(--storefront-ink)] opacity-80">
              {descText}
            </p>
          )}

          <p className="font-serif text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--storefront-ink)]">
            {formatPrice(selected.base_price, currency)}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {isCanvasMode ? (
              <div className="inline-flex items-center rounded-full bg-[var(--storefront-accent)] px-6 py-2.5 text-white">
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => updateConfig({ cta_text: e.target.value })}
                  size={Math.max(8, ctaText.length + 1)}
                  aria-label="Edit teks tombol"
                  className="bg-transparent text-center text-sm font-bold text-white focus:outline-none"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const v =
                    selected.variants?.find((x) => x.is_default) ||
                    selected.variants?.[0];
                  addItem(selected, v, 1);
                  openCart();
                }}
                className="touch-target inline-flex items-center gap-2 rounded-full bg-[var(--storefront-accent)] px-7 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>{ctaText}</span>
              </button>
            )}

            <Link
              href={`/product/${selected.slug}`}
              className="touch-target inline-flex items-center rounded-full border border-[var(--storefront-line)] px-6 py-3.5 text-sm font-semibold text-[var(--storefront-ink)] hover:border-[var(--storefront-accent)] transition-colors"
            >
              Detail Produk
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 2. ARCHITECTURAL COLLECTION PRICE INDEX
 * ========================================================================== */
export function CollectionIndexSection({
  products,
  isCanvasMode = false,
}: {
  products: Product[];
  isCanvasMode?: boolean;
}) {
  const { settings, config, updateConfig } =
    useSectionConfig("collection_index");
  const { addItem, openCart } = useCart();
  const currency = settings.currency_symbol || "Rp";

  const activeProducts = products.filter((p) => p.is_active).slice(0, 12);
  const titleText = config.title ?? "Daftar Produk & Harga";
  const subtitleText =
    config.subtitle ?? "Pilih langsung item favorit untuk melihat detail atau pesan.";

  return (
    <section aria-label={titleText}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12 space-y-8">
        <div className="max-w-2xl space-y-2">
          {isCanvasMode ? (
            <input
              type="text"
              value={titleText}
              onChange={(e) => updateConfig({ title: e.target.value })}
              aria-label="Edit judul daftar produk"
              className="w-full rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-3 py-1.5 font-serif text-3xl sm:text-5xl font-medium text-[var(--storefront-ink)] focus:outline-none"
            />
          ) : (
            <h2 className="font-serif text-3xl sm:text-5xl font-medium leading-[1.14] tracking-tight text-[var(--storefront-ink)]">
              {titleText}
            </h2>
          )}

          {isCanvasMode ? (
            <input
              type="text"
              value={subtitleText}
              onChange={(e) => updateConfig({ subtitle: e.target.value })}
              aria-label="Edit subjudul daftar produk"
              className="w-full rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-3 py-1.5 text-sm sm:text-base text-[var(--storefront-ink)] focus:outline-none"
            />
          ) : (
            subtitleText && (
              <p className="text-sm sm:text-base text-[var(--storefront-ink)] opacity-75">
                {subtitleText}
              </p>
            )
          )}
        </div>

        <dl className="divide-y divide-[var(--storefront-line)] border-y border-[var(--storefront-line)]">
          {activeProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-6 py-4"
            >
              <dt className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 min-w-0">
                <Link
                  href={`/product/${product.slug}`}
                  className="font-serif text-lg sm:text-xl font-medium text-[var(--storefront-ink)] hover:text-[var(--storefront-accent)] transition-colors truncate"
                >
                  {product.name}
                </Link>
                {product.category?.name && (
                  <span className="text-xs text-[var(--storefront-ink)] opacity-60 shrink-0">
                    {product.category.name}
                  </span>
                )}
              </dt>

              <dd className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                <span className="font-serif text-base sm:text-lg font-semibold tabular-nums text-[var(--storefront-ink)]">
                  {formatPrice(product.base_price, currency)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const v =
                      product.variants?.find((x) => x.is_default) ||
                      product.variants?.[0];
                    addItem(product, v, 1);
                    openCart();
                  }}
                  className="text-xs font-bold text-[var(--storefront-accent)] hover:underline"
                >
                  + Bag
                </button>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ============================================================================
 * 3. BOLD STATEMENT BANNER
 * ========================================================================== */
export function StatementBannerSection({
  isCanvasMode = false,
}: {
  isCanvasMode?: boolean;
}) {
  const { config, updateConfig } = useSectionConfig("statement_banner");
  const titleText =
    config.title ??
    "Desain katalog bersih yang membuat pelanggan langsung paham dan percaya.";
  const subtitleText =
    config.subtitle ??
    "Sesuaikan warna, font, dan struktur halaman tanpa perlu coding.";
  const ctaText = config.cta_text ?? "Pesan Catalove";

  return (
    <section aria-label="Pernyataan Brand">
      <div className="mx-auto max-w-4xl px-4 sm:px-8 text-center space-y-6">
        {isCanvasMode ? (
          <textarea
            rows={2}
            value={titleText}
            onChange={(e) => updateConfig({ title: e.target.value })}
            aria-label="Edit teks pernyataan"
            className="w-full resize-none rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-4 py-3 text-center font-serif text-3xl sm:text-5xl font-medium leading-[1.15] text-[var(--storefront-ink)] focus:outline-none"
          />
        ) : (
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-[3.5rem] font-medium leading-[1.15] tracking-tight text-[var(--storefront-ink)]">
            {titleText}
          </h2>
        )}

        {isCanvasMode ? (
          <input
            type="text"
            value={subtitleText}
            onChange={(e) => updateConfig({ subtitle: e.target.value })}
            aria-label="Edit subjudul pernyataan"
            className="w-full max-w-2xl mx-auto rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-3 py-2 text-center text-sm sm:text-base text-[var(--storefront-ink)] focus:outline-none"
          />
        ) : (
          subtitleText && (
            <p className="mx-auto max-w-2xl text-sm sm:text-lg text-[var(--storefront-ink)] opacity-80">
              {subtitleText}
            </p>
          )
        )}

        <div className="pt-2">
          {isCanvasMode ? (
            <div className="inline-flex items-center rounded-full bg-[var(--storefront-accent)] px-6 py-2.5 text-white">
              <input
                type="text"
                value={ctaText}
                onChange={(e) => updateConfig({ cta_text: e.target.value })}
                size={Math.max(8, ctaText.length + 1)}
                aria-label="Edit teks tombol pernyataan"
                className="bg-transparent text-center text-sm font-bold text-white focus:outline-none"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openOrderSchemeModal()}
              className="touch-target inline-flex items-center justify-center rounded-full bg-[var(--storefront-accent)] px-8 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              {ctaText}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 4. MINIMAL ASYMMETRIC FAQ
 * ========================================================================== */
const DEFAULT_FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Apakah warna, font, dan urutan section bisa diubah sendiri?",
    a: "Bisa. Aktifkan Mode Kanvas untuk menggeser section, memilih font dan ukuran huruf, hingga mengganti foto serta harga langsung.",
  },
  {
    q: "Apa beda Paket Mandiri dan Terima Jadi?",
    a: "Paket Mandiri (Rp 299rb) memberi kamu kendali setup sendiri lewat Kanvas & Admin Studio. Paket Terima Jadi (Rp 799rb) kami siapkan dari nol sesuai brandingmu.",
  },
  {
    q: "Apakah order pelanggan langsung masuk ke WhatsApp saya?",
    a: "Ya, setiap checkout keranjang atau tombol pesan cepat otomatis terformat rapi dan masuk langsung ke nomor WhatsApp brandmu.",
  },
];

export function FaqMinimalSection({
  isCanvasMode = false,
}: {
  isCanvasMode?: boolean;
}) {
  const { config, updateConfig } = useSectionConfig("faq_minimal");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const titleText = config.title ?? "Pertanyaan Umum";
  const subtitleText =
    config.subtitle ?? "Jawaban ringkas sebelum mulai pakai Catalove.";
  const items =
    config.faq_items && config.faq_items.length > 0
      ? config.faq_items
      : DEFAULT_FAQ_ITEMS;

  const updateItem = (idx: number, field: "q" | "a", value: string) => {
    const next = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    updateConfig({ faq_items: next });
  };

  const addItem = () => {
    updateConfig({
      faq_items: [
        ...items,
        { q: "Pertanyaan baru...", a: "Tulis jawaban di sini." },
      ],
    });
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    updateConfig({ faq_items: items.filter((_, i) => i !== idx) });
  };

  return (
    <section aria-label={titleText}>
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12">
        <div className="lg:col-span-5 space-y-3">
          {isCanvasMode ? (
            <input
              type="text"
              value={titleText}
              onChange={(e) => updateConfig({ title: e.target.value })}
              aria-label="Edit judul FAQ"
              className="w-full rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-3 py-1.5 font-serif text-3xl sm:text-4xl font-medium text-[var(--storefront-ink)] focus:outline-none"
            />
          ) : (
            <h2 className="font-serif text-3xl sm:text-4xl font-medium leading-[1.15] tracking-tight text-[var(--storefront-ink)]">
              {titleText}
            </h2>
          )}

          {isCanvasMode ? (
            <input
              type="text"
              value={subtitleText}
              onChange={(e) => updateConfig({ subtitle: e.target.value })}
              aria-label="Edit subjudul FAQ"
              className="w-full rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-3 py-1.5 text-sm text-[var(--storefront-ink)] focus:outline-none"
            />
          ) : (
            <p className="text-sm sm:text-base text-[var(--storefront-ink)] opacity-75">
              {subtitleText}
            </p>
          )}
        </div>

        <div className="lg:col-span-7 space-y-4">
          <dl className="divide-y divide-[var(--storefront-line)] border-y border-[var(--storefront-line)]">
            {items.map((item, idx) => (
              <div key={idx} className="py-4">
                {isCanvasMode ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.q}
                        onChange={(e) => updateItem(idx, "q", e.target.value)}
                        aria-label={`Pertanyaan ${idx + 1}`}
                        className="flex-1 rounded-lg border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-2.5 py-1.5 font-serif text-base font-medium text-[var(--storefront-ink)] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={items.length <= 1}
                        onClick={() => removeItem(idx)}
                        aria-label="Hapus pertanyaan"
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={item.a}
                      onChange={(e) => updateItem(idx, "a", e.target.value)}
                      aria-label={`Jawaban ${idx + 1}`}
                      className="w-full resize-none rounded-lg border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-2.5 py-1.5 text-sm text-[var(--storefront-ink)] focus:outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <dt>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenIndex(openIndex === idx ? null : idx)
                        }
                        aria-expanded={openIndex === idx}
                        className="flex w-full items-center justify-between gap-4 text-left font-serif text-lg font-medium text-[var(--storefront-ink)] hover:text-[var(--storefront-accent)] transition-colors"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            openIndex === idx ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </dt>
                    {openIndex === idx && (
                      <dd className="pt-2.5 text-sm leading-relaxed text-[var(--storefront-ink)] opacity-80">
                        {item.a}
                      </dd>
                    )}
                  </>
                )}
              </div>
            ))}
          </dl>

          {isCanvasMode && (
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--storefront-accent)] px-4 py-2 text-xs font-bold text-[var(--storefront-accent)] hover:bg-[var(--color-surface-tint)]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Pertanyaan</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

