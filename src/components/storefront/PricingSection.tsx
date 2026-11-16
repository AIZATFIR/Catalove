"use client";

import React from "react";
import { Check } from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { readBusinessSettings, saveBusinessSettings } from "@/lib/business-settings";
import { DEFAULT_THEME_CONFIG } from "@/lib/data/universal-presets";
import type { CanvasSectionId } from "@/types/catalove";
import { buildCataloveInquiryWhatsAppUrl, type CatalovePlan } from "@/lib/utils/catalove-whatsapp";

export type CatalovePlanId = CatalovePlan;

export const DEFAULT_CANVAS_ORDER: CanvasSectionId[] = ["hero"];

export const DEFAULT_SHOWCASE_ORDER: CanvasSectionId[] = [
  "hero",
  "statement_banner",
  "feed",
  "lookbook",
  "showcase",
  "carousel",
  "process_steps",
  "pricing",
  "faq_minimal",
  "cta",
];

export const DEFAULT_SECTION_ORDER: CanvasSectionId[] = DEFAULT_SHOWCASE_ORDER;

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
  { id: "process_steps", title: "Alur Pesan", desc: "Langkah order 01-03 yang ringkas & jelas" },
  { id: "feature_comparison", title: "Daftar Keunggulan", desc: "Checklist nilai tambah brand tanpa kartu berlebih" },
  { id: "sponsor_slot", title: "Slot Sponsor & Link", desc: "Banner promo, link eksternal, atau slot iklan native" },
  { id: "faq_minimal", title: "Tanya Jawab (FAQ)", desc: "2 kolom pertanyaan & jawaban ringkas" },
  { id: "pricing", title: "Paket & Skema", desc: "Gratis, Business, dan Enterprise" },
  { id: "cta", title: "Ajakan Pesan", desc: "Banner split + tautan langsung ke WA" },
  { id: "custom_content", title: "Konten Kustom", desc: "Tambah blok teks, foto, dan tombol brand" },
];

const PLAN_DETAILS: Record<
  CatalovePlanId,
  {
    name: string;
    price: string;
    priceLabel: string;
    tagline: string;
    features: string[];
  }
> = {
  business: {
    name: "Business",
    price: "Rp 299rb",
    priceLabel: "Harga final dibahas lewat WhatsApp.",
    tagline: "Katalog mandiri dengan kontrol lebih untuk bisnismu.",
    features: [
      "Mode Kanvas penuh (geser posisi section, ganti model & layout)",
      "Kustom palet warna bebas (preset & warna hex brand sendiri)",
      "Dashboard Studio (input produk, foto, harga & varian mandiri)",
      "Mode Waterfall, Snap Feed, Grid, Lookbook & halaman Bio QR",
      "Order pelanggan langsung masuk ke WhatsApp brandmu",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "Rp 799rb",
    priceLabel: "Harga menyesuaikan kebutuhan brand.",
    tagline: "Pendampingan dan branding yang disesuaikan dengan kebutuhan brand.",
    features: [
      "Semua fitur Business dan akses penuh Mode Kanvas",
      "Input & kurasi katalog awal oleh spesialis katalog kami",
      "Custom warna palet, tipografi & posisi layout sesuai brandingmu",
      "Konsultasi opsi domain dan kebutuhan hosting",
      "Pendampingan & revisi via WhatsApp sampai siap jualan",
    ],
  },
};

export function openCataloveWhatsApp(
  phoneNumber = readBusinessSettings().seller_whatsapp,
  plan?: CatalovePlan
) {
  if (typeof window === "undefined") return;
  const url = buildCataloveInquiryWhatsAppUrl(phoneNumber, plan);
  window.open(url, "_blank", "noopener,noreferrer");
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
  const subtitleText = pricingCfg?.subtitle ??
    "Mulai gratis untuk mencoba. Pilih Business atau konsultasikan kebutuhan branding dan biaya hosting lewat WhatsApp.";

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

        <div className="grid gap-5 md:grid-cols-3 items-stretch">
          <article className="flex flex-col justify-between rounded-xl bg-[var(--storefront-surface)] p-6 sm:p-8">
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[var(--storefront-accent)]">Mulai tanpa biaya</p>
              <h3 className="font-serif text-2xl font-medium text-[var(--storefront-ink)]">Gratis</h3>
              <p className="text-sm text-[var(--storefront-ink)] opacity-75">Buat katalog sederhana dan bagikan ke pelanggan. Paket gratis didukung iklan platform.</p>
              <ul className="space-y-3 text-sm text-[var(--storefront-ink)] opacity-90">
                {["Buat halaman katalog", "Kelola produk dan foto", "Terima pertanyaan melalui WhatsApp"].map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--storefront-accent)]" /><span>{feature}</span></li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 pt-8">
              <button type="button" onClick={handleStartCanvas} className="touch-target rounded-full border border-[var(--storefront-line)] px-5 py-3.5 text-sm font-semibold text-[var(--storefront-ink)] hover:border-[var(--storefront-accent)] transition-colors">Coba Mode Kanvas</button>
              <button type="button" onClick={() => openCataloveWhatsApp(settings.seller_whatsapp)} className="touch-target text-sm font-semibold text-[var(--storefront-accent)] hover:underline">Tanya cara mulai</button>
            </div>
          </article>

          {(["business", "enterprise"] as CatalovePlanId[]).map((plan) => {
            const details = PLAN_DETAILS[plan];
            return (
              <article key={plan} className={`flex flex-col justify-between rounded-xl p-6 sm:p-8 ${plan === "enterprise" ? "border-2 border-[var(--storefront-accent)] bg-[var(--storefront-background)]" : "bg-[var(--storefront-surface)]"}`}>
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-[var(--storefront-accent)]">{plan === "business" ? "Untuk bisnis yang berkembang" : "Branding dan pendampingan khusus"}</p>
                  <h3 className="font-serif text-2xl font-medium text-[var(--storefront-ink)]">{details.name}</h3>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-serif text-4xl font-semibold tabular-nums text-[var(--storefront-ink)]">Mulai {details.price}</span>
                  </div>
                  <p className="text-sm text-[var(--storefront-ink)] opacity-75">{details.tagline} {details.priceLabel}.</p>
                  <ul className="space-y-3 text-sm text-[var(--storefront-ink)] opacity-90">
                    {details.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--storefront-accent)]" /><span>{feature}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="pt-8">
                  <button type="button" onClick={() => openCataloveWhatsApp(settings.seller_whatsapp, plan)} className="w-full touch-target rounded-full bg-[var(--storefront-accent)] px-6 py-3.5 text-sm font-bold text-white hover:opacity-95 transition-opacity">
                    Tanya paket {details.name}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
