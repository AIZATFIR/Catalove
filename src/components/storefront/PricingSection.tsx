"use client";

import React, { useEffect, useState } from "react";
import { Check, MessageCircle, X } from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { saveBusinessSettings } from "@/lib/business-settings";
import { DEFAULT_THEME_CONFIG } from "@/lib/data/universal-presets";
import type { CanvasSectionId } from "@/types/catalove";

export type CatalovePlanId = "mandiri" | "terima_jadi";

export const DEFAULT_SECTION_ORDER: CanvasSectionId[] = ["hero"];

export const ALL_CANVAS_SECTIONS: {
  id: CanvasSectionId;
  title: string;
  desc: string;
}[] = [
  { id: "hero", title: "Hero Utama", desc: "Banner pembuka, tipografi & tombol aksi" },
  { id: "feed", title: "Katalog Produk", desc: "Grid/Waterfall/Snap + editor kartu produk" },
  { id: "featured_split", title: "Sorotan Produk", desc: "Foto besar 1 produk + cerita & pesan cepat" },
  { id: "collection_index", title: "Daftar Menu & Harga", desc: "Indeks tipografi nama & harga bersih" },
  { id: "statement_banner", title: "Banner Pernyataan", desc: "Teks besar penegas konsep brand" },
  { id: "lookbook", title: "Lookbook Koleksi", desc: "Kartu visual bertumpuk interaktif" },
  { id: "showcase", title: "Showcase Scroll", desc: "Foto penuh melebar saat di-scroll" },
  { id: "carousel", title: "Galeri Carousel", desc: "Carousel putar koleksi produk" },
  { id: "faq_minimal", title: "Tanya Jawab (FAQ)", desc: "2 kolom pertanyaan & jawaban ringkas" },
  { id: "pricing", title: "Paket & Skema", desc: "Mandiri Rp 299rb & Terima Jadi Rp 799rb" },
  { id: "cta", title: "Ajakan Pesan", desc: "Banner split + tautan langsung ke WA" },
];

const PRODUCT_CATEGORIES = [
  "Fashion & Apparel",
  "F&B / Bakery",
  "Craft & Florist",
  "Gadget / Aksesoris",
  "Jasa / Lainnya",
];

const PLAN_DETAILS: Record<
  CatalovePlanId,
  {
    name: string;
    shortLabel: string;
    price: string;
    priceLabel: string;
    badge: string;
    tagline: string;
    features: string[];
  }
> = {
  mandiri: {
    name: "Mandiri (Self-Setup)",
    shortLabel: "Mandiri (Rp 299.000)",
    price: "Rp 299rb",
    priceLabel: "/ sekali bayar",
    badge: "Hemat · Setup Sendiri",
    tagline: "Bebas kreasi sendiri lewat Mode Kanvas & Studio Admin.",
    features: [
      "Mode Kanvas penuh (geser posisi section, ganti model & layout)",
      "Kustom palet warna bebas (preset & warna hex brand sendiri)",
      "Dashboard Studio (input produk, foto, harga & varian mandiri)",
      "Mode Waterfall, Snap Feed, Grid, Lookbook & halaman Bio QR",
      "Order pelanggan langsung masuk ke WhatsApp brandmu",
    ],
  },
  terima_jadi: {
    name: "Terima Jadi (Full Custom Setup)",
    shortLabel: "Terima Jadi - Full Setup (Rp 799.000)",
    price: "Rp 799rb",
    priceLabel: "/ sekali bayar",
    badge: "Rekomendasi · Terima Beres",
    tagline:
      "Kami setup dari nol dan sesuaikan penuh dengan identitas brandmu.",
    features: [
      "Semua fitur Paket Mandiri & akses penuh Mode Kanvas",
      "Input & kurasi katalog awal oleh spesialis katalog kami",
      "Custom warna palet, tipografi & posisi layout sesuai brandingmu",
      "Bantuan setup domain brand (.com / .id) sampai siap pakai",
      "Pendampingan & revisi via WhatsApp sampai siap jualan",
    ],
  },
};

export function openOrderSchemeModal(plan: CatalovePlanId = "terima_jadi") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("catalove-open-order-modal", { detail: { plan } })
  );
}

interface PricingSectionProps {
  isCanvasMode?: boolean;
  onEnableCanvasMode?: () => void;
}

export function PricingSection({
  isCanvasMode = false,
  onEnableCanvasMode,
}: PricingSectionProps) {
  const settings = useBusinessSettings();
  const pricingCfg = settings.theme_config?.section_configs?.pricing;
  const headingText = pricingCfg?.title ?? "Pilih cara bangun katalog brandmu.";
  const subtitleText =
    pricingCfg?.subtitle ??
    "Coba susun sendiri di Mode Kanvas, atau serahkan setup penuh ke tim kami.";

  const updatePricingConfig = (field: "title" | "subtitle", value: string) => {
    const activeTheme = settings.theme_config || DEFAULT_THEME_CONFIG;
    saveBusinessSettings({
      ...settings,
      theme_config: {
        ...activeTheme,
        section_configs: {
          ...(activeTheme.section_configs || {}),
          pricing: {
            ...(activeTheme.section_configs?.pricing || {}),
            [field]: value,
          },
        },
      },
    });
  };

  const handleStartCanvas = () => {
    if (onEnableCanvasMode) {
      onEnableCanvasMode();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("catalove-toggle-canvas", { detail: { open: true } })
      );
    }
    if (typeof window !== "undefined" && !isCanvasMode) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section id="harga" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12 space-y-10">
        <div className="max-w-2xl space-y-3">
          {isCanvasMode ? (
            <input
              type="text"
              value={headingText}
              onChange={(e) => updatePricingConfig("title", e.target.value)}
              aria-label="Edit judul paket harga"
              className="w-full rounded-lg border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-3 py-1.5 font-serif text-3xl sm:text-5xl font-medium leading-[1.12] tracking-tight text-[var(--storefront-ink)] focus:outline-none"
            />
          ) : (
            <h2
              id="pricing-heading"
              className="font-serif text-3xl sm:text-5xl font-medium leading-[1.12] tracking-tight text-[var(--storefront-ink)]"
            >
              {headingText}
            </h2>
          )}

          {isCanvasMode ? (
            <input
              type="text"
              value={subtitleText}
              onChange={(e) => updatePricingConfig("subtitle", e.target.value)}
              aria-label="Edit subjudul paket harga"
              className="w-full rounded-lg border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-3 py-1.5 text-sm sm:text-base text-[var(--storefront-ink)] focus:outline-none"
            />
          ) : (
            <p className="text-sm sm:text-base text-[var(--storefront-ink)] opacity-75">
              {subtitleText}
            </p>
          )}
        </div>

        {/* 2-Column Architectural Plan Comparison */}
        <div className="grid gap-8 lg:grid-cols-2 items-stretch">
          {/* Paket 1: Mandiri */}
          <div className="flex flex-col justify-between rounded-xl bg-[var(--storefront-surface)] p-6 sm:p-10">
            <div className="space-y-6">
              <div className="space-y-2 border-b border-[var(--storefront-line)] pb-6">
                <p className="text-xs font-semibold text-[var(--storefront-accent)]">
                  Setup Sendiri · Hemat
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--storefront-ink)]">
                  {PLAN_DETAILS.mandiri.name}
                </h3>
                <div className="flex items-baseline gap-2 pt-2">
                  <span className="font-serif text-4xl sm:text-5xl font-semibold tabular-nums text-[var(--storefront-ink)]">
                    {PLAN_DETAILS.mandiri.price}
                  </span>
                  <span className="text-xs text-[var(--storefront-ink)] opacity-70">
                    {PLAN_DETAILS.mandiri.priceLabel}
                  </span>
                </div>
                <p className="text-sm text-[var(--storefront-ink)] opacity-75 pt-1">
                  {PLAN_DETAILS.mandiri.tagline}
                </p>
              </div>

              <ul className="space-y-3">
                {PLAN_DETAILS.mandiri.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2.5 text-sm text-[var(--storefront-ink)] opacity-90"
                  >
                    <Check className="h-4 w-4 shrink-0 text-[var(--storefront-accent)] mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-8">
              <button
                type="button"
                onClick={() => openOrderSchemeModal("mandiri")}
                className="flex-1 touch-target rounded-full bg-stone-900 dark:bg-white px-6 py-3.5 text-sm font-bold text-white dark:text-stone-950 hover:opacity-90 transition-opacity"
              >
                Pilih Mandiri
              </button>
              <button
                type="button"
                onClick={handleStartCanvas}
                className="touch-target rounded-full border border-[var(--storefront-line)] px-5 py-3.5 text-sm font-semibold text-[var(--storefront-ink)] hover:border-[var(--storefront-accent)] transition-colors"
              >
                Coba Kanvas
              </button>
            </div>
          </div>

          {/* Paket 2: Terima Jadi */}
          <div className="flex flex-col justify-between rounded-xl border-2 border-[var(--storefront-accent)] bg-[var(--storefront-background)] p-6 sm:p-10">
            <div className="space-y-6">
              <div className="space-y-2 border-b border-[var(--storefront-line)] pb-6">
                <p className="text-xs font-semibold text-[var(--storefront-accent)]">
                  Terima Beres · Full Custom
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--storefront-ink)]">
                  {PLAN_DETAILS.terima_jadi.name}
                </h3>
                <div className="flex items-baseline gap-2 pt-2">
                  <span className="font-serif text-4xl sm:text-5xl font-semibold tabular-nums text-[var(--storefront-ink)]">
                    {PLAN_DETAILS.terima_jadi.price}
                  </span>
                  <span className="text-xs text-[var(--storefront-ink)] opacity-70">
                    {PLAN_DETAILS.terima_jadi.priceLabel}
                  </span>
                </div>
                <p className="text-sm text-[var(--storefront-ink)] opacity-75 pt-1">
                  {PLAN_DETAILS.terima_jadi.tagline}
                </p>
              </div>

              <ul className="space-y-3">
                {PLAN_DETAILS.terima_jadi.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2.5 text-sm text-[var(--storefront-ink)] opacity-90"
                  >
                    <Check className="h-4 w-4 shrink-0 text-[var(--storefront-accent)] mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => openOrderSchemeModal("terima_jadi")}
                className="w-full touch-target rounded-full bg-[var(--storefront-accent)] px-6 py-3.5 text-sm font-bold text-white hover:opacity-95 transition-opacity"
              >
                Pesan Terima Jadi
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * ORDER CONFIGURATOR MODAL (Scheme + Live Canvas Snapshot -> WhatsApp)
 * ========================================================================== */
export function OrderSchemeModal() {
  const settings = useBusinessSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CatalovePlanId>("terima_jadi");
  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ plan?: CatalovePlanId }>).detail;
      if (detail?.plan === "mandiri" || detail?.plan === "terima_jadi") {
        setSelectedPlan(detail.plan);
      }
      if (
        !brandName &&
        settings.store_name &&
        settings.store_name !== "Catalove" &&
        settings.store_name !== "Catalove Studio"
      ) {
        setBrandName(settings.store_name);
      }
      setIsOpen(true);
    };

    window.addEventListener("catalove-open-order-modal", handleOpen);
    return () => {
      window.removeEventListener("catalove-open-order-modal", handleOpen);
    };
  }, [brandName, settings.store_name]);

  if (!isOpen) return null;

  const theme = {
    ...DEFAULT_THEME_CONFIG,
    ...(settings.theme_config || {}),
  };

  const activeColorLabel = theme.custom_colors?.enabled
    ? `Custom (${theme.custom_colors.accent} · Bg ${theme.custom_colors.bg})`
    : theme.color_theme;

  const catalogModel =
    settings.catalog_layout || theme.catalog_layout || "pinterest_masonry";
  const heroModel = theme.hero_style || "split_dynamic";
  const sectionOrder =
    theme.section_order && theme.section_order.length > 0
      ? theme.section_order
      : DEFAULT_SECTION_ORDER;
  const hiddenSections = theme.hidden_sections || [];

  const targetWa =
    (settings.seller_whatsapp || "6285946689168").replace(/[^0-9]/g, "") ||
    "6285946689168";

  const handleSubmitWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenPlan = PLAN_DETAILS[selectedPlan];
    const resolvedBrand = brandName.trim() || settings.store_name || "Belum diisi";

    const lines = [
      `Halo Catalove, saya mau pesan *${chosenPlan.shortLabel}*.`,
      "",
      `*Detail Brand*`,
      `- Nama Brand: ${resolvedBrand}`,
      `- Kategori Produk: ${category}`,
      "",
      `*Konfigurasi Kanvas Pilihan*`,
      `- Warna / Palet: ${activeColorLabel}`,
      `- Font Heading: ${theme.font_heading}`,
      `- Model Hero & Katalog: ${heroModel} · ${catalogModel} (Card: ${theme.card_style})`,
      `- Urutan Section: ${sectionOrder.join(" -> ")}`,
    ];

    if (hiddenSections.length > 0) {
      lines.push(`- Section Disembunyikan: ${hiddenSections.join(", ")}`);
    }

    if (notes.trim()) {
      lines.push("", `*Catatan / Request Branding*`, notes.trim());
    }

    const url = `https://wa.me/${targetWa}?text=${encodeURIComponent(
      lines.join("\n")
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-white/15 bg-[#FCFAF6] dark:bg-[#1E1815] text-stone-900 dark:text-stone-100 p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-stone-200/80 dark:border-white/10 pb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--storefront-accent)]">
              Konfigurasi Pesanan
            </p>
            <h3
              id="order-modal-title"
              className="font-serif text-2xl font-semibold mt-0.5"
            >
              Pesan Catalove
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-stone-500 hover:bg-stone-200/60 dark:hover:bg-white/10"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmitWhatsApp} className="space-y-4">
          {/* Plan Switcher */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Pilih Paket
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(["mandiri", "terima_jadi"] as CatalovePlanId[]).map((planId) => {
                const info = PLAN_DETAILS[planId];
                const active = selectedPlan === planId;
                return (
                  <button
                    key={planId}
                    type="button"
                    onClick={() => setSelectedPlan(planId)}
                    className={`rounded-2xl border p-3.5 text-left transition-all ${
                      active
                        ? "border-[var(--storefront-accent)] bg-[var(--color-surface-tint)] ring-1 ring-[var(--storefront-accent)]"
                        : "border-stone-200 dark:border-white/15 bg-white dark:bg-white/[0.03] hover:border-stone-400"
                    }`}
                  >
                    <p className="text-xs font-bold">{info.name}</p>
                    <p className="font-serif text-lg font-bold text-[var(--storefront-accent)] mt-0.5">
                      {info.price}{" "}
                      <span className="font-sans text-[10px] font-normal text-stone-500">
                        sekali bayar
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="order-brand-name"
                className="text-xs font-semibold text-stone-700 dark:text-stone-300"
              >
                Nama Brand
              </label>
              <input
                id="order-brand-name"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Contoh: Kopi Senja / Atelier Luna"
                className="w-full rounded-xl border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-900 px-3.5 py-2.5 text-sm focus:border-[var(--storefront-accent)] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="order-brand-category"
                className="text-xs font-semibold text-stone-700 dark:text-stone-300"
              >
                Kategori Produk
              </label>
              <select
                id="order-brand-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-900 px-3.5 py-2.5 text-sm focus:border-[var(--storefront-accent)] focus:outline-none"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label
              htmlFor="order-brand-notes"
              className="text-xs font-semibold text-stone-700 dark:text-stone-300"
            >
              Catatan / Request Branding
            </label>
            <textarea
              id="order-brand-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Warna sage green, estimasi 25 produk awal, ingin pakai domain .com"
              className="w-full rounded-xl border border-stone-300 dark:border-white/20 bg-white dark:bg-stone-900 px-3.5 py-2 text-sm focus:border-[var(--storefront-accent)] focus:outline-none"
            />
          </div>

          {/* Live Canvas Snapshot Box */}
          <div className="rounded-2xl border border-stone-200 dark:border-white/10 bg-stone-100/80 dark:bg-white/[0.04] p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--storefront-accent)]">
                Snapshot Kanvas Aktif
              </span>
              {theme.custom_colors?.enabled && (
                <div className="flex items-center gap-1">
                  {[
                    theme.custom_colors.accent,
                    theme.custom_colors.bg,
                    theme.custom_colors.surface,
                    theme.custom_colors.ink,
                  ].map((hex, i) => (
                    <span
                      key={i}
                      className="h-3.5 w-3.5 rounded-full border border-black/15"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1 text-stone-600 dark:text-stone-300">
              <p>
                <strong className="text-stone-900 dark:text-white">Warna:</strong>{" "}
                {activeColorLabel}
              </p>
              <p>
                <strong className="text-stone-900 dark:text-white">Font:</strong>{" "}
                {theme.font_heading}
              </p>
              <p>
                <strong className="text-stone-900 dark:text-white">
                  Hero &amp; Katalog:
                </strong>{" "}
                {heroModel} · {catalogModel}
              </p>
              <p className="break-words">
                <strong className="text-stone-900 dark:text-white">
                  Urutan Section:
                </strong>{" "}
                {sectionOrder.join(" → ")}
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full touch-target inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20BD5A] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Lanjut ke WhatsApp +62 859-4668-9168</span>
          </button>
        </form>
      </div>
    </div>
  );
}
