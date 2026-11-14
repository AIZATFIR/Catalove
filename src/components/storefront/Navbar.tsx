"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, Palette, ShoppingBag, Sliders, X } from "lucide-react";
import { Skiper24 } from "@/components/ui/skiper-ui/skiper24";
import { Skiper25 } from "@/components/ui/skiper-ui/skiper25";
import { Skiper26 } from "@/components/ui/skiper-ui/skiper26";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { saveBusinessSettings } from "@/lib/business-settings";
import { openOrderSchemeModal } from "@/components/storefront/PricingSection";
import { useCart } from "@/context/CartContext";

interface NavbarProps {
  onOpenQuiz?: () => void;
}

const links = [
  { href: "/#discovery-feed", label: "Katalog" },
  { href: "/#harga", label: "Harga & Skema" },
  { href: "/catalog", label: "Semua Sample" },
  { href: "/bio", label: "Bio" },
];

export function Navbar({ onOpenQuiz }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [editingBrand, setEditingBrand] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const settings = useBusinessSettings();
  const { totalItems, savedIds, openCart, openWishlist } = useCart();

  useEffect(() => {
    const handleCanvasState = (e: Event) => {
      const detail = (e as CustomEvent<{ active?: boolean }>).detail;
      if (typeof detail?.active === "boolean") {
        setIsCanvasMode(detail.active);
        if (!detail.active) setEditingBrand(false);
      }
    };
    window.addEventListener("catalove-canvas-state", handleCanvasState);
    return () => {
      window.removeEventListener("catalove-canvas-state", handleCanvasState);
    };
  }, []);

  const handleToggleCanvas = () => {
    if (pathname !== "/") {
      router.push("/?canvas=1");
      return;
    }
    window.dispatchEvent(new CustomEvent("catalove-toggle-canvas"));
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--storefront-line)] bg-[var(--storefront-background)] text-[var(--storefront-ink)] transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-8 lg:px-12">
        {/* Clean Brand Wordmark (Inline-editable in Canvas Mode) */}
        {isCanvasMode && editingBrand ? (
          <input
            type="text"
            autoFocus
            value={settings.store_name || "Catalove"}
            onChange={(e) =>
              saveBusinessSettings({
                ...settings,
                store_name: e.target.value,
              })
            }
            onBlur={() => setEditingBrand(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") setEditingBrand(false);
            }}
            aria-label="Edit nama brand"
            className="w-40 rounded-lg border border-dashed border-[var(--storefront-accent)] bg-white dark:bg-stone-900 px-2.5 py-1 font-serif text-xl font-semibold text-stone-900 dark:text-[#FAF4EE] focus:outline-none"
          />
        ) : isCanvasMode ? (
          <button
            type="button"
            onClick={() => setEditingBrand(true)}
            title="Klik untuk ganti nama brand"
            className="shrink-0 select-none rounded-lg border border-dashed border-[var(--storefront-accent)] px-2 py-0.5 text-left"
          >
            <span className="block font-serif text-[1.4rem] sm:text-[1.55rem] font-semibold leading-none tracking-[-.035em] text-[var(--storefront-ink)]">
              {settings.store_name || "Catalove"}
            </span>
          </button>
        ) : (
          <Link
            href="/"
            className="shrink-0 select-none"
            aria-label={settings.store_name || "Catalove"}
          >
            <span className="block font-serif text-[1.45rem] sm:text-[1.6rem] font-semibold leading-none tracking-[-.035em] text-[var(--storefront-ink)]">
              {settings.store_name || "Catalove"}
            </span>
          </Link>
        )}

        {/* Minimal Desktop Navigation */}
        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-6 text-[13px] font-medium text-[var(--storefront-ink)] md:flex"
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
              className="py-2 text-[13px] font-medium text-[var(--storefront-ink)] hover:text-[var(--storefront-accent)] cursor-pointer whitespace-nowrap"
            >
              Bantu Pilih
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleCanvas}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              isCanvasMode
                ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white shadow-sm"
                : "border-[var(--storefront-accent)] bg-[var(--color-surface-tint)] text-[var(--storefront-accent)]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Mode Kanvas</span>
          </button>
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

          <button
            type="button"
            onClick={() => openOrderSchemeModal()}
            className="touch-target inline-flex items-center justify-center rounded-full bg-[var(--storefront-accent)] px-4 py-2 text-xs font-bold tracking-wide text-white transition-opacity hover:opacity-90 whitespace-nowrap"
          >
            {settings.nav_cta_text || "Pesan Catalove"}
          </button>
        </div>

        {/* Mobile Quick Controls & Menu Button */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <Skiper24 />
          <Skiper26 />

          <button
            type="button"
            onClick={handleToggleCanvas}
            aria-label="Mode Kanvas"
            className={`md:hidden inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
              isCanvasMode
                ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white"
                : "border-[var(--storefront-accent)] bg-[var(--color-surface-tint)] text-[var(--storefront-accent)]"
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Kanvas</span>
          </button>

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
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openOrderSchemeModal();
              }}
              className="touch-target flex items-center text-left text-sm font-bold text-[#25D366] py-2.5"
            >
              Pesan Catalove
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
export default Navbar;
