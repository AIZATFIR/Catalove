"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Menu, Palette, ShoppingBag, X } from "lucide-react";
import PlugConnectedIcon from "@/components/ui/plug-connected-icon";
import { Skiper24 } from "@/components/ui/skiper-ui/skiper24";
import { Skiper25 } from "@/components/ui/skiper-ui/skiper25";
import { Skiper26 } from "@/components/ui/skiper-ui/skiper26";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCart } from "@/context/CartContext";

interface NavbarProps {
  onOpenQuiz?: () => void;
}

const links = [
  { href: "/catalog", label: "Koleksi" },
  { href: "/#discovery-feed", label: "Explore Feed" },
  { href: "/bio", label: "Bio-Link" },
  { href: "/#alur-pesan", label: "Alur Pesan" },
  { href: "/#cerita-kami", label: "Kisah Brand" },
];

export function Navbar({ onOpenQuiz }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const settings = useBusinessSettings();
  const { totalItems, savedIds, openCart, openWishlist } = useCart();

  const whatsappUrl = `https://wa.me/${settings.seller_whatsapp}?text=${encodeURIComponent(
    `Halo ${settings.store_name || "Catalove"}, saya tertarik dengan koleksi produk Anda.`
  )}`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#DBD0C5]/50 bg-[#FCFAF6]/90 backdrop-blur-md dark:border-white/10 dark:bg-[#1A1412]/90 transition-colors duration-300">
      <div className="mx-auto flex h-[4.75rem] max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-[5.25rem] sm:px-8 lg:px-12">
        {/* Brand Logo & Tagline */}
        <Link
          href="/"
          className="shrink-0 select-none"
          aria-label={`${settings.store_name || "Catalove"}, beranda`}
        >
          <span className="block font-serif text-[1.55rem] sm:text-[1.65rem] font-semibold leading-none tracking-[-.035em] text-[#4D3040] dark:text-[#FAF4EE]">
            {settings.store_name || "Catalove"}
          </span>
          {settings.store_tagline ? (
            <span className="mt-1 hidden sm:block text-[9px] font-medium uppercase tracking-[.22em] text-[#8D624C] dark:text-[#D1A686]">
              {settings.store_tagline}
            </span>
          ) : null}
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-6 xl:gap-8 text-[13px] font-medium text-[#4D3040] md:flex dark:text-[#FAF4EE]"
        >
          <Link
            href="/"
            className="py-3 transition-colors hover:text-[var(--storefront-accent)]"
          >
            Beranda
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 transition-colors hover:text-[var(--storefront-accent)] whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          {onOpenQuiz && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className="border-b border-[#B8794A]/60 py-1.5 text-sm font-medium text-[#4D3040] hover:text-[var(--storefront-accent)] dark:text-[#FAF4EE] cursor-pointer whitespace-nowrap"
            >
              Asisten Pintar
            </button>
          )}
        </nav>

        {/* Controls: Palette, Music, Theme, Wishlist, Cart, Admin & WA CTA */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <Skiper24 />
          <Skiper25 />
          <Skiper26 />

          {/* Wishlist Trigger */}
          <button
            type="button"
            onClick={openWishlist}
            className="relative p-2 rounded-full border border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
            aria-label={`Koleksi Disukai (${savedIds.length})`}
            title="Koleksi Disukai"
          >
            <Heart className={`w-4 h-4 ${savedIds.length > 0 ? "text-rose-500 fill-rose-500" : ""}`} />
            {savedIds.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {savedIds.length}
              </span>
            )}
          </button>

          {/* Shopping Bag Trigger */}
          <button
            type="button"
            onClick={openCart}
            className="relative p-2 rounded-full border border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
            aria-label={`Keranjang Belanja (${totalItems})`}
            title="Keranjang Belanja"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-[var(--storefront-accent)] text-white text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          {/* Quick Customizer Studio Link for UMKM Owners */}
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-300/80 dark:border-white/15 px-3 py-2 text-[11px] font-bold text-stone-700 dark:text-stone-200 hover:border-[var(--storefront-accent)] hover:text-[var(--storefront-accent)] transition-colors whitespace-nowrap"
            title="Kustomisasi Web Usaha Anda"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Studio Web</span>
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center gap-2 rounded-full border border-[#4D3040] bg-[#4D3040] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#392333] dark:border-[#D6A77E] dark:bg-[#D6A77E] dark:text-[#211B19] dark:hover:bg-[#E5BC96] whitespace-nowrap"
          >
            <PlugConnectedIcon aria-hidden="true" focusable="false" size={15} />
            <span>{settings.nav_cta_text || "Chat Admin"}</span>
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
            aria-label="Produk disukai"
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
            aria-label="Keranjang"
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
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
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
              Musik Latar
            </span>
            <Skiper25 />
          </div>
          <nav
            aria-label="Navigasi mobile"
            className="flex flex-col divide-y divide-[#DBD0C5] dark:divide-white/10 pt-1"
          >
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
                Asisten Pintar (Cari Produk Pas)
              </button>
            )}
            <Link
              href="/admin/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="touch-target flex items-center gap-2 text-sm font-semibold text-[var(--storefront-accent)] py-2.5"
            >
              <Palette className="w-4 h-4" />
              <span>Kustomisasi Web (Studio Admin)</span>
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target flex items-center gap-2 text-sm font-semibold text-[#4D3040] dark:text-[#D6A77E] py-2.5"
            >
              <PlugConnectedIcon aria-hidden="true" focusable="false" size={17} />
              <span>Chat Admin di WhatsApp</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
