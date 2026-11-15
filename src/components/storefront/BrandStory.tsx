"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { saveBusinessSettings } from "@/lib/business-settings";
import { DEFAULT_THEME_CONFIG } from "@/lib/data/universal-presets";
import { openOrderSchemeModal } from "@/components/storefront/PricingSection";

interface BrandStoryProps {
  isCanvasMode?: boolean;
}

export function BrandStory({ isCanvasMode = false }: BrandStoryProps) {
  const settings = useBusinessSettings();
  const [editingImage, setEditingImage] = useState(false);

  const ctaConfig = settings.theme_config?.section_configs?.cta;
  const titleText =
    ctaConfig?.title ??
    settings.story_title ??
    "Pesan Catalove mu untuk brand mu sendiri.";
  const bodyText =
    ctaConfig?.subtitle ??
    settings.story_p1 ??
    "Simple yet interesting catalog for your brand.";
  const buttonText = ctaConfig?.cta_text ?? "Pesan Catalove";
  const imageUrl =
    ctaConfig?.image_url ||
    settings.story_image_url ||
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85";

  const updateCtaField = (
    field: "title" | "subtitle" | "cta_text" | "image_url",
    value: string
  ) => {
    const activeTheme = settings.theme_config || DEFAULT_THEME_CONFIG;
    saveBusinessSettings({
      ...settings,
      ...(field === "title" ? { story_title: value } : {}),
      ...(field === "subtitle" ? { story_p1: value } : {}),
      ...(field === "image_url" ? { story_image_url: value } : {}),
      theme_config: {
        ...activeTheme,
        section_configs: {
          ...(activeTheme.section_configs || {}),
          cta: {
            ...(activeTheme.section_configs?.cta || {}),
            [field]: value,
          },
        },
      },
    });
  };

  return (
    <section id="cerita-kami">
      <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12">
        {/* Visual Preview */}
        <div className="space-y-2.5">
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--storefront-surface)]"
            {...(!isCanvasMode ? { "data-gsap-reveal": true } : {})}
          >
            <Image
              src={imageUrl}
              alt="Catalove Brand Preview"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            {isCanvasMode && (
              <button
                type="button"
                onClick={() => setEditingImage((prev) => !prev)}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-stone-950/85 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-900"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Ganti Foto</span>
              </button>
            )}
          </div>
          {isCanvasMode && editingImage && (
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => updateCtaField("image_url", e.target.value)}
              placeholder="https://url-foto..."
              aria-label="URL foto CTA"
              className="w-full rounded-lg border border-dashed border-[var(--storefront-accent)] bg-white/75 dark:bg-stone-900 px-3 py-2 text-xs text-[var(--storefront-ink)] focus:outline-none"
            />
          )}
        </div>

        {/* Acquisition CTA */}
        <div className="max-w-xl space-y-6">
          {isCanvasMode ? (
            <textarea
              rows={2}
              value={titleText}
              onChange={(e) => updateCtaField("title", e.target.value)}
              aria-label="Edit judul banner CTA"
              className="w-full resize-none rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-3 py-2 font-serif text-3xl font-medium leading-[1.14] tracking-tight text-[var(--storefront-ink)] sm:text-5xl focus:outline-none"
            />
          ) : (
            <h2 className="font-serif text-3xl font-medium leading-[1.14] tracking-tight text-[var(--storefront-ink)] sm:text-5xl">
              {titleText}
            </h2>
          )}

          {isCanvasMode ? (
            <input
              type="text"
              value={bodyText}
              onChange={(e) => updateCtaField("subtitle", e.target.value)}
              aria-label="Edit subjudul CTA"
              className="w-full rounded-xl border border-dashed border-[var(--storefront-accent)] bg-white/60 dark:bg-white/5 px-3 py-2 text-sm sm:text-base text-[var(--storefront-ink)] focus:outline-none"
            />
          ) : (
            bodyText && (
              <p className="text-sm sm:text-base text-[var(--storefront-ink)] opacity-80">
                {bodyText}
              </p>
            )
          )}

          <div>
            {isCanvasMode ? (
              <div className="inline-flex items-center rounded-full bg-[var(--storefront-accent)] px-6 py-2.5 text-white">
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => updateCtaField("cta_text", e.target.value)}
                  aria-label="Edit teks tombol CTA"
                  size={Math.max(8, buttonText.length + 1)}
                  className="bg-transparent text-center text-sm font-bold text-white focus:outline-none"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openOrderSchemeModal()}
                className="touch-target inline-flex items-center justify-center rounded-full bg-[var(--storefront-accent)] px-7 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                {buttonText || "Pesan Catalove"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrandStory;
