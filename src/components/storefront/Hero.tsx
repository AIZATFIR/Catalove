"use client";

import Link from "next/link";
import { ArrowRight, HeartHandshake, MessageCircle } from "lucide-react";
import type { Product } from "@/types/bakery";
import { CakeCircularCarousel } from "@/components/storefront/CakeCircularCarousel";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

interface HeroProps {
  products: Product[];
  onOpenQuiz?: () => void;
}

export function Hero({ products, onOpenQuiz }: HeroProps) {
  const settings = useBusinessSettings();

  const eyebrow = settings.hero_eyebrow ?? (settings.store_name || "Catalove");
  const title = settings.hero_title ?? "Desain Berkelas. Karya Nyata. Pesan Tanpa Ribet.";
  const subtitle = settings.hero_subtitle ?? "Koleksi produk terkurasi untuk melengkapi gaya dan kebutuhan harian Anda. Pesan langsung dengan konfirmasi instan via WhatsApp.";
  const badge1 = settings.hero_badge_1 ?? "Kualitas Premium Teruji";
  const badge2 = settings.hero_badge_2 ?? "Chat WhatsApp Otomatis";
  const badge3 = settings.hero_badge_3 ?? "Pengiriman Cepat & Aman";

  return (
    <section className="relative isolate overflow-hidden border-b border-[#DBD0C5]/40 py-12 sm:py-16 transition-colors dark:border-white/10">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:gap-14 lg:px-12">
        {/* Left Copy & CTA */}
        <div className="relative z-10 order-2 flex flex-col items-start gap-6 lg:order-1 lg:col-span-6 lg:gap-8">
          {eyebrow && (
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.22em] text-[#8D624C] dark:text-[#D1A686]">
              <span aria-hidden="true" className="h-px w-8 bg-[#B8794A]" />
              {eyebrow}
            </p>
          )}

          <div className="space-y-4">
            <h1
              data-gsap-title
              className="max-w-2xl font-serif text-[3.25rem] font-medium leading-[.98] tracking-[-.025em] text-[#4D3040] dark:text-[#FAF4EE] sm:text-7xl lg:text-[5.25rem]"
            >
              {title}
            </h1>
            <p className="max-w-lg text-base leading-7 text-[#55464B] dark:text-[#D8CBC0] sm:text-lg sm:leading-8">
              {subtitle}
            </p>
          </div>

          {/* Action Buttons - Clean Crisp Editorial Style */}
          <div className="flex w-full flex-col gap-4 pt-1 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/catalog"
              className="touch-target inline-flex items-center justify-center gap-2 border border-[#4D3040] bg-[#4D3040] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#392333] dark:border-[#D6A77E] dark:bg-[#D6A77E] dark:text-[#211B19] dark:hover:bg-[#E5BC96]"
            >
              <span>{settings.hero_primary_cta || "Jelajahi Koleksi"}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>

            {onOpenQuiz && (
              <button
                onClick={onOpenQuiz}
                type="button"
                className="touch-target inline-flex items-center justify-center gap-2 border-b border-[#4D3040]/50 px-3 py-3 text-sm font-semibold text-[#4D3040] transition-colors hover:text-[#B8794A] dark:border-white/30 dark:text-[#FAF4EE] dark:hover:text-[#E8A572] cursor-pointer"
              >
                <span>{settings.hero_secondary_cta || "Tanya Rekomendasi"}</span>
              </button>
            )}
          </div>

          {/* Clean Inline Highlights (NO boxy rounded pills) */}
          <ul className="grid w-full grid-cols-1 gap-3 border-t border-[#4D3040]/15 pt-5 text-xs font-medium text-[#55464B] dark:border-white/10 dark:text-[#D8CBC0] sm:grid-cols-3 sm:text-sm">
            <li className="flex items-center gap-2">
              <HeartHandshake aria-hidden="true" className="h-4 w-4 shrink-0 text-[#B8794A] dark:text-[#D1A686]" />
              <span>{badge1}</span>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-[#B8794A] dark:text-[#D1A686]" />
              <span>{badge2}</span>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#7894B4]" />
              <span>{badge3}</span>
            </li>
          </ul>
        </div>

        {/* Right 3D Carousel Showcase */}
        <div data-gsap-reveal className="relative z-10 order-1 mx-auto w-full lg:order-2 lg:col-span-6 lg:pl-4">
          <CakeCircularCarousel products={products} />
        </div>
      </div>
    </section>
  );
}

export default Hero;
