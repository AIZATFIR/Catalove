"use client";

import React from "react";
import Image from "next/image";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { openOrderSchemeModal } from "@/components/storefront/PricingSection";

export function BrandStory() {
  const settings = useBusinessSettings();

  const feat1Title = settings.feature_1_title || "Simple UI";
  const feat1Desc = settings.feature_1_desc || "Fokus visual produk.";
  const feat2Title = settings.feature_2_title || "Custom Brand";
  const feat2Desc = settings.feature_2_desc || "Warna & font brandmu.";
  const feat3Title = settings.feature_3_title || "Direct WA";
  const feat3Desc = settings.feature_3_desc || "Order langsung masuk.";

  return (
    <section
      id="cerita-kami"
      className="border-b border-[#DBD0C5]/40 py-14 sm:py-20 dark:border-white/10 transition-colors"
    >
      <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12">
        {/* Visual Preview */}
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#EFE5D9] shadow-xl dark:bg-[#2C2421]"
          data-gsap-reveal
        >
          <Image
            src={
              settings.story_image_url ||
              "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85"
            }
            alt="Catalove Brand Preview"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* Acquisition CTA */}
        <div className="max-w-xl space-y-6">
          <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#8D624C] dark:text-[#D1A686]">
            {settings.story_eyebrow || "Catalove"}
          </p>
          <h2 className="font-serif text-3xl font-medium leading-[1.08] tracking-[-.025em] text-[#4D3040] dark:text-[#FAF4EE] sm:text-5xl">
            {settings.story_title || "Pesan Catalove mu untuk brand mu sendiri."}
          </h2>
          {settings.story_p1 && (
            <p className="text-sm sm:text-base text-[#55464B] dark:text-[#D8CBC0]">
              {settings.story_p1}
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={() => openOrderSchemeModal()}
              className="touch-target inline-flex items-center justify-center rounded-full bg-[var(--storefront-accent)] px-7 py-3.5 text-sm font-bold text-white shadow-md hover:opacity-90 transition-opacity"
            >
              Pesan Catalove
            </button>
          </div>

          <div className="grid gap-4 border-t border-[#DBD0C5]/40 pt-6 dark:border-white/10 sm:grid-cols-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4D3040] dark:text-[#FAF4EE]">
                {feat1Title}
              </h3>
              <p className="mt-1 text-xs text-[#67575B] dark:text-[#D8CBC0]">
                {feat1Desc}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4D3040] dark:text-[#FAF4EE]">
                {feat2Title}
              </h3>
              <p className="mt-1 text-xs text-[#67575B] dark:text-[#D8CBC0]">
                {feat2Desc}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4D3040] dark:text-[#FAF4EE]">
                {feat3Title}
              </h3>
              <p className="mt-1 text-xs text-[#67575B] dark:text-[#D8CBC0]">
                {feat3Desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default BrandStory;
