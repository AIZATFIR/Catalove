"use client";

import React from "react";
import Link from "next/link";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export const Footer: React.FC = () => {
  const settings = useBusinessSettings();
  const storeName = settings.store_name || "Catalove";
  const waUrl = `https://wa.me/${settings.seller_whatsapp || "6285946689168"}?text=${encodeURIComponent(
    "Halo, saya mau pesan Catalove untuk brand saya."
  )}`;

  return (
    <footer className="border-t border-[#DBD0C5]/40 bg-[#FCFAF6] py-10 text-[#55464B] sm:py-12 dark:border-white/10 dark:bg-[#1A1412] dark:text-[#E8DDD4] transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <span className="font-serif text-2xl font-semibold tracking-tight text-[#4D3040] dark:text-[#FAF4EE]">
            {storeName}
          </span>
          <p className="text-xs text-[#67575B] dark:text-[#D8CBC0]">
            Simple yet interesting catalog for your brand.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-6 text-xs font-semibold">
          <Link href="/catalog" className="hover:text-[var(--storefront-accent)] transition-colors">
            Katalog
          </Link>
          <Link href="/bio" className="hover:text-[var(--storefront-accent)] transition-colors">
            Bio
          </Link>
          <Link href="/contact" className="hover:text-[var(--storefront-accent)] transition-colors">
            Kontak
          </Link>
          <Link href="/privacy" className="hover:text-[var(--storefront-accent)] transition-colors">
            Privasi
          </Link>
          <Link href="/about" className="hover:text-[var(--storefront-accent)] transition-colors">
            Tentang
          </Link>
          <Link href="/admin/login" className="hover:text-[var(--storefront-accent)] transition-colors">
            Admin
          </Link>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[var(--storefront-accent)] px-4 py-2 text-white font-bold hover:opacity-90 transition-opacity"
          >
            WA +62 859-4668-9168
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
