"use client";

import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function AnnouncementBar() {
  const settings = useBusinessSettings();
  const marquee = settings.marquee_announcement;

  if (!marquee || !marquee.enabled || !marquee.text.trim()) {
    return null;
  }

  const content = (
    <div className="flex items-center gap-6 whitespace-nowrap text-xs md:text-sm font-medium tracking-wide">
      {marquee.badge && (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
          <Sparkles className="h-2.5 w-2.5" />
          {marquee.badge}
        </span>
      )}
      <span>{marquee.text}</span>
      {marquee.link && <ArrowRight className="h-3 w-3 opacity-75 inline" />}
    </div>
  );

  return (
    <aside aria-label="Pengumuman Toko" className="relative z-50 overflow-hidden bg-[var(--storefront-accent)] text-white py-2 shadow-sm">
      {marquee.link ? (
        <Link href={marquee.link} className="block group">
          <div className="flex w-max animate-marquee space-x-12 px-4 hover:[animation-play-state:paused]">
            {content}
            {content}
            {content}
            {content}
          </div>
        </Link>
      ) : (
        <div className="flex w-max animate-marquee space-x-12 px-4 hover:[animation-play-state:paused]">
          {content}
          {content}
          {content}
          {content}
        </div>
      )}
    </aside>
  );
}
