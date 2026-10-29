"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/utils/formatters";

export interface Skiper17CardData {
  id: number | string;
  image: string;
  title: string;
  subtitle?: string;
  price?: number;
  slug?: string;
  leadTime?: number;
  alt?: string;
}

export interface StickyCard002Props {
  cards: Skiper17CardData[];
  className?: string;
  containerClassName?: string;
  imageClassName?: string;
}

export function StickyCard002({
  cards,
  className,
  containerClassName,
  imageClassName,
}: StickyCard002Props) {
  const container = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const imageElements = imageRefs.current.slice(0, cards.length);
      if (imageElements.length < 2 || imageElements.some((image) => !image)) return;

      gsap.set(imageElements[0], { yPercent: 0, scale: 1, rotation: 0 });
      imageElements.slice(1).forEach((image) => {
        if (image) gsap.set(image, { yPercent: 100, scale: 1, rotation: 0 });
      });

      const frame = container.current?.querySelector<HTMLElement>("[data-sticky-frame]");
      if (!container.current || !frame) return;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: () => `+=${window.innerHeight * (imageElements.length - 1)}`,
          pin: frame,
          scrub: 0.7,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
      });

      for (let index = 0; index < imageElements.length - 1; index++) {
        const currentImage = imageElements[index];
        const nextImage = imageElements[index + 1];
        if (!currentImage || !nextImage) continue;

        timeline.to(currentImage, { scale: 0.88, rotation: 2, duration: 1, ease: "none" }, index);
        timeline.to(nextImage, { yPercent: 0, duration: 1, ease: "none" }, index);
      }

      const resizeObserver = new ResizeObserver(() => ScrollTrigger.refresh());
      resizeObserver.observe(container.current);

      return () => {
        resizeObserver.disconnect();
        timeline.kill();
      };
    });

    return () => media.revert();
  }, { dependencies: [cards.length], scope: container, revertOnUpdate: true });

  if (!cards.length) return null;

  return (
    <div
      ref={container}
      className={cn("skiper17-scroll-region relative w-full", className)}
      style={{ height: `${Math.max(cards.length, 1) * 100}svh` }}
    >
      <div data-sticky-frame className="skiper17-pin-frame relative flex h-svh w-full items-center justify-center overflow-hidden p-3 sm:p-6">
        <div
          className={cn(
            "skiper17-card-stack relative h-[78svh] w-full max-w-5xl overflow-hidden rounded-2xl sm:rounded-[2.25rem] border border-[#DBD0C5]/50 bg-[#F5EBDD] shadow-[0_28px_90px_-36px_rgba(77,48,64,.35)] dark:border-white/10 dark:bg-[#2C2421]",
            containerClassName,
          )}
        >
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={cn("skiper17-card absolute inset-0 overflow-hidden", imageClassName)}
              ref={(element) => {
                imageRefs.current[index] = element;
              }}
              aria-hidden="true"
            >
              <Image
                src={card.image}
                alt={card.alt || card.title}
                fill
                sizes="(max-width: 768px) 100vw, 85vw"
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-6 pb-8 pt-28 sm:px-12 sm:pb-12">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div className="max-w-xl">
                    {card.subtitle && (
                      <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#E8A572] mb-1.5 drop-shadow-sm">
                        {card.subtitle}
                      </p>
                    )}
                    <h3 className="font-serif text-2xl font-medium text-white sm:text-4xl drop-shadow-md">
                      {card.title}
                    </h3>
                    {card.price ? (
                      <p className="mt-2 text-sm font-semibold text-white/90">
                        Mulai {formatIDR(card.price)} {card.leadTime !== undefined ? `· ${card.leadTime === 0 ? "Ready" : `H-${card.leadTime}`}` : ""}
                      </p>
                    ) : null}
                  </div>
                  {card.slug && (
                    <Link
                      href={`/product/${card.slug}`}
                      className="touch-target inline-flex items-center gap-2 border border-white/80 bg-white/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#4D3040] dark:hover:bg-[#FAF4EE] dark:hover:text-[#211B19]"
                    >
                      <span>Lihat Kue</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ul className="sr-only" aria-label="Pilihan kue unggulan">
        {cards.map((card) => <li key={card.id}>{card.title}</li>)}
      </ul>
    </div>
  );
}

export const Skiper17 = StickyCard002;

