"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Menu, Palette, ShoppingBag, X } from "lucide-react";
import { Skiper24 } from "@/components/ui/skiper-ui/skiper24";
import { Skiper25 } from "@/components/ui/skiper-ui/skiper25";
import { Skiper26 } from "@/components/ui/skiper-ui/skiper26";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCart } from "@/context/CartContext";

interface NavbarProps {
  onOpenQuiz?: () => void;
}

const links = [
  { href: "/catalog", label: "Katalog" },
  { href: "/#discovery-feed", label: "Feed" },
  { href: "/bio", label: "Bio" },
  { href: "/admin/settings", label: "Studio" },
];

export function Navbar({ onOpenQuiz }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const settings = useBusinessSettings();
  const { totalItems, savedIds, openCart, openWishlist } = useCart();

  const whatsappUrl = `https://wa.me/${settings.seller_whatsapp || "6285946689168"}?text=${encodeURIComponent(
    "Halo, saya mau pesan Catalove untuk brand saya."
  )}`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#DBD0C5]/50 bg-[#FCFAF6]/90 backdrop-blur-md dark:border-white/10 dark:bg-[#1A1412]/90 transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-8 lg:px-12">
        {/* Clean Brand Wordmark */}
        <Link
          href="/"
          className="shrink-0 select-none"
          aria-label={settings.store_name || "Catalove"}
        >
          <span className="block font-serif text-[1.45rem] sm:text-[1.6rem] font-semibold leading-none tracking-[-.035em] text-[#4D3040] dark:text-[#FAF4EE]">
            {settings.store_name || "Catalove"}
          </span>
        </Link>

        {/* Minimal Desktop Navigation */}
        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-7 text-[13px] font-medium text-[#4D3040] md:flex dark:text-[#FAF4EE]"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-2 transition-colors hover:text-[var(--storefront-accent)] whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          {onOpenQuiz && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className="py-2 text-[13px] font-medium text-[#4D3040] hover:text-[var(--storefront-accent)] dark:text-[#FAF4EE] cursor-pointer whitespace-nowrap"
            >
              Bantu Pilih
            </button>
          )}
        </nav>

        {/* Controls */}
        <div className="hidden items-center gap-2 lg:flex">
          <Skiper24 />
          <Skiper25 />
          <Skiper26 />

          <button
            type="button"
            onClick={openWishlist}
            className="relative p-2 rounded-full border border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
            aria-label={`Tersimpan (${savedIds.length})`}
          >
            <Heart className={`w-4 h-4 ${savedIds.length > 0 ? "text-rose-500 fill-rose-500" : ""}`} />
            {savedIds.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {savedIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openCart}
            className="relative p-2 rounded-full border border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
            aria-label={`Bag (${totalItems})`}
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-[var(--storefront-accent)] text-white text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center justify-center rounded-full bg-[var(--storefront-accent)] px-4 py-2 text-xs font-bold tracking-wide text-white transition-opacity hover:opacity-90 whitespace-nowrap"
          >
            {settings.nav_cta_text || "Pesan Catalove"}
          </a>
        </div>

        {/* Mobile Quick Controls & Menu Button */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <Skiper24 />
          <Skiper26 />

          <button
            type="button"
            onClick={openWishlist}
            className="relative touch-target inline-flex items-center justify-center p-2"
            aria-label="Tersimpan"
          >
            <Heart className={`w-5 h-5 ${savedIds.length > 0 ? "text-rose-500 fill-rose-500" : ""}`} />
            {savedIds.length > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {savedIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openCart}
            className="relative touch-target inline-flex items-center justify-center p-2"
            aria-label="Bag"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-[var(--storefront-accent)] text-white text-[9px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
            aria-label={mobileMenuOpen ? "Tutup" : "Menu"}
            aria-expanded={mobileMenuOpen}
            className="touch-target inline-flex items-center justify-center text-[#4D3040] hover:text-[var(--storefront-accent)] dark:text-[#FAF4EE] md:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[#DBD0C5] bg-[#FCFAF6] px-4 pb-5 md:hidden dark:border-white/10 dark:bg-[#1A1412]">
          <div className="flex items-center justify-between border-b border-[#DBD0C5] py-2.5 dark:border-white/10">
            <span className="text-xs font-semibold text-[#8D624C] dark:text-[#D1A686]">
              Audio
            </span>
            <Skiper25 />
          </div>
          <nav
            aria-label="Navigasi mobile"
            className="flex flex-col divide-y divide-[#DBD0C5] dark:divide-white/10 pt-1"
          >
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
                Bantu Pilih
              </button>
            )}
            <Link
              href="/admin/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="touch-target flex items-center gap-2 text-sm font-semibold text-[var(--storefront-accent)] py-2.5"
            >
              <Palette className="w-4 h-4" />
              <span>Studio</span>
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target flex items-center text-sm font-bold text-[#25D366] py-2.5"
            >
              Pesan Catalove
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
export default Navbar;
