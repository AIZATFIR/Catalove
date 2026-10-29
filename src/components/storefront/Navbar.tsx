"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import PlugConnectedIcon from "@/components/ui/plug-connected-icon";
import { Skiper24 } from "@/components/ui/skiper-ui/skiper24";
import { Skiper25 } from "@/components/ui/skiper-ui/skiper25";
import { Skiper26 } from "@/components/ui/skiper-ui/skiper26";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

interface NavbarProps {
  onOpenQuiz?: () => void;
}

const links = [
  { href: "/catalog", label: "Koleksi" },
  { href: "/#alur-pesan", label: "Alur Pesan" },
  { href: "/#cerita-kami", label: "Kisah Brand" },
];

export function Navbar({ onOpenQuiz }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const settings = useBusinessSettings();
  const whatsappUrl = `https://wa.me/${settings.seller_whatsapp}?text=${encodeURIComponent(
    `Halo ${settings.store_name || "Catalove"}, saya tertarik dengan koleksi produk Anda.`
  )}`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#DBD0C5]/50 bg-[#FCFAF6] dark:border-white/10 dark:bg-[#1A1412] transition-colors duration-300">
      <div className="mx-auto flex h-[5rem] max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-[5.5rem] sm:px-8 lg:px-12">
        {/* Brand Logo & Tagline */}
        <Link href="/" className="shrink-0 select-none" aria-label={`${settings.store_name || "Catalove"}, beranda`}>
          <span className="block font-serif text-[1.65rem] font-semibold leading-none tracking-[-.035em] text-[#4D3040] dark:text-[#FAF4EE]">
            {settings.store_name || "Catalove"}
          </span>
          {settings.store_tagline ? (
            <span className="mt-1 block text-[9px] font-medium uppercase tracking-[.22em] text-[#8D624C] dark:text-[#D1A686]">
              {settings.store_tagline}
            </span>
          ) : null}
        </Link>

        {/* Desktop Navigation Links - High Contrast Text */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-8 text-[13px] font-medium text-[#4D3040] md:flex dark:text-[#FAF4EE]">
          <Link href="/" className="py-3 transition-colors hover:text-[#B8794A] dark:hover:text-[#D6A77E]">
            Beranda
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 transition-colors hover:text-[#B8794A] dark:hover:text-[#D6A77E]"
            >
              {link.label}
            </Link>
          ))}
          {onOpenQuiz && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className="border-b border-[#B8794A]/60 py-2 text-sm font-medium text-[#4D3040] hover:text-[#B8794A] dark:text-[#FAF4EE] dark:hover:text-[#D6A77E] cursor-pointer"
            >
              Minta saran kue
            </button>
          )}
        </nav>

        {/* Controls: Palette Switcher, Music Player, Theme, CTA */}
        <div className="hidden items-center gap-3.5 lg:flex">
          <Skiper24 />
          <Skiper25 />
          <Skiper26 />
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center gap-2 border border-[#4D3040] bg-[#4D3040] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#392333] dark:border-[#D6A77E] dark:bg-[#D6A77E] dark:text-[#211B19] dark:hover:bg-[#E5BC96]"
          >
            <PlugConnectedIcon aria-hidden="true" focusable="false" size={16} />
            <span>{settings.nav_cta_text || "Hubungi Kami"}</span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Skiper24 />
          <Skiper26 />
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileMenuOpen}
            className="touch-target inline-flex items-center justify-center text-[#4D3040] hover:text-[#B8794A] dark:text-[#FAF4EE]"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[#DBD0C5] bg-[#FCFAF6] px-4 pb-5 md:hidden dark:border-white/10 dark:bg-[#1A1412]">
          <div className="flex items-center justify-between border-b border-[#DBD0C5] py-2.5 dark:border-white/10">
            <span className="text-xs font-semibold text-[#8D624C] dark:text-[#D1A686]">Musik</span>
            <Skiper25 />
          </div>
          <nav aria-label="Navigasi mobile" className="flex flex-col divide-y divide-[#DBD0C5] dark:divide-white/10 pt-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="touch-target flex items-center text-sm font-medium text-[#4D3040] dark:text-[#FAF4EE] py-2.5"
            >
              Beranda
            </Link>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="touch-target flex items-center text-sm font-medium text-[#4D3040] dark:text-[#FAF4EE] py-2.5"
              >
                {link.label}
              </Link>
            ))}
            {onOpenQuiz && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenQuiz();
                }}
                className="touch-target flex items-center text-left text-sm font-medium text-[#4D3040] dark:text-[#FAF4EE] py-2.5"
              >
                Minta saran kue
              </button>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target flex items-center gap-2 text-sm font-semibold text-[#4D3040] dark:text-[#D6A77E] py-2.5"
            >
              <PlugConnectedIcon aria-hidden="true" focusable="false" size={17} />
              <span>Tanya Mama di WhatsApp</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
