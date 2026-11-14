"use client";

import React from "react";
import Image from "next/image";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";

export function BrandStory() {
  const settings = useBusinessSettings();

  const eyebrow = settings.story_eyebrow || "Kisah Brand";
  const title = settings.story_title || "Dibuat dengan dedikasi dan cita rasa tinggi.";
  const p1 =
    settings.story_p1 ||
    "Catalove hadir untuk memberikan pengalaman berbelanja katalog yang anggun, modern, dan tanpa batasan. Setiap produk dirancang dengan perhatian mendalam pada detail material dan kepuasan Anda.";
  const p2 =
    settings.story_p2 ||
    "Dari studio kreasi kami langsung ke tangan Anda. Anda dapat memilih varian, mencantumkan catatan personal, dan mengonfirmasi pemesanan dengan mudah.";

  const feat1Title = settings.feature_1_title || "Material Pilihan";
  const feat1Desc = settings.feature_1_desc || "Hanya menggunakan bahan baku dan komponen berkualitas tinggi.";
  const feat2Title = settings.feature_2_title || "Personalisasi Eksklusif";
  const feat2Desc = settings.feature_2_desc || "Tersedia opsi ukuran, warna, dan catatan khusus pada setiap pesanan.";
  const feat3Title = settings.feature_3_title || "Respon Cepat";
  const feat3Desc = settings.feature_3_desc || "Tim kami siap melayani pesanan Anda secara personal di WhatsApp.";

  return (
    <section id="cerita-kami" className="border-b border-[#DBD0C5]/40 py-16 sm:py-24 dark:border-white/10 transition-colors">
      <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-4 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12">
        {/* Visual Showcase */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#EFE5D9] shadow-xl dark:bg-[#2C2421]" data-gsap-reveal>
          <Image
            src={
              settings.story_image_url ||
              "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85"
            }
            alt="Studio kreasi dan showcase"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-amber-300" />
              {settings.store_name || "Catalove Atelier"}
            </span>
            <p className="mt-2 text-sm text-white/90">
              {settings.store_tagline || "Curated with relentless pursuit of craftsmanship."}
            </p>
          </div>
        </div>

        {/* Narrative & Value Propositions */}
        <div className="max-w-xl py-2 lg:py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#8D624C] dark:text-[#D1A686]">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium leading-[1.05] tracking-[-.025em] text-[#4D3040] dark:text-[#FAF4EE] sm:text-5xl">
            {title}
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-7 text-[#55464B] dark:text-[#D8CBC0] sm:text-base">
            <p>{p1}</p>
            <p>{p2}</p>
          </div>

          {/* 3 Pillars Bento */}
          <div className="mt-10 grid gap-4 border-t border-[#DBD0C5]/40 pt-6 dark:border-white/10 sm:grid-cols-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[var(--storefront-accent)]">
                <ShieldCheck className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#4D3040] dark:text-[#FAF4EE]">
                  {feat1Title}
                </h3>
              </div>
              <p className="text-xs leading-5 text-[#67575B] dark:text-[#D8CBC0]">
                {feat1Desc}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[var(--storefront-accent)]">
                <Sparkles className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#4D3040] dark:text-[#FAF4EE]">
                  {feat2Title}
                </h3>
              </div>
              <p className="text-xs leading-5 text-[#67575B] dark:text-[#D8CBC0]">
                {feat2Desc}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[var(--storefront-accent)]">
                <HeartHandshake className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#4D3040] dark:text-[#FAF4EE]">
                  {feat3Title}
                </h3>
              </div>
              <p className="text-xs leading-5 text-[#67575B] dark:text-[#D8CBC0]">
                {feat3Desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
