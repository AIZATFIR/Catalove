"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Clock, Sparkles } from "lucide-react";
import PlugConnectedIcon from "@/components/ui/plug-connected-icon";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export const Footer: React.FC = () => {
  const settings = useBusinessSettings();
  const storeName = settings.store_name || "Catalove";
  const storeAddress = settings.store_address || settings.kitchen_address || "Jakarta, Indonesia";

  return (
    <footer className="border-t border-[#DBD0C5]/40 bg-[#FCFAF6] py-14 text-[#55464B] sm:py-16 dark:border-white/10 dark:bg-[#1A1412] dark:text-[#E8DDD4] transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-12 border-b border-[#DBD0C5]/40 pb-12 md:grid-cols-12 dark:border-white/10">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-3xl font-semibold tracking-tight text-[#4D3040] dark:text-[#FAF4EE]">
                {storeName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--storefront-accent)]/10 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-[var(--storefront-accent)]">
                <Sparkles className="h-2.5 w-2.5" />
                {settings.footer_badge || "Verified Store"}
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[#67575B] dark:text-[#D8CBC0]">
              {settings.footer_desc ||
                "Katalog digital modern dengan kurasi produk berkualitas tinggi, didukung alur pemesanan efisien dan konfirmasi instan via WhatsApp."}
            </p>
            <div className="flex items-center gap-5 pt-3">
              <a
                href={`https://wa.me/${settings.seller_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target inline-flex items-center gap-2 border-b border-[#B8794A]/60 text-sm font-semibold text-[#4D3040] transition-colors hover:text-[#B8794A] dark:text-[#FAF4EE] dark:hover:text-[#E8A572]"
                aria-label={`Hubungi WhatsApp ${storeName}`}
              >
                <PlugConnectedIcon size={18} className="cursor-pointer" aria-hidden="true" focusable="false" />
                <span>WhatsApp Seller</span>
              </a>
              {settings.instagram_handle && (
                <a
                  href={`https://instagram.com/${settings.instagram_handle.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-target inline-flex items-center gap-2 border-b border-[#B8794A]/60 text-sm font-semibold text-[#4D3040] transition-colors hover:text-[#B8794A] dark:text-[#FAF4EE] dark:hover:text-[#E8A572]"
                  aria-label={`Instagram ${storeName}`}
                >
                  <span>{settings.instagram_handle}</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-[#8D624C] dark:text-[#D1A686]">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2.5 text-sm text-[#55464B] dark:text-[#D8CBC0]">
              <li>
                <Link href="/" className="hover:text-[#4D3040] dark:hover:text-[#FAF4EE] transition-colors font-medium">
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog"
                  className="hover:text-[#4D3040] dark:hover:text-[#FAF4EE] transition-colors font-medium"
                >
                  Koleksi Lengkap
                </Link>
              </li>
              <li>
                <Link
                  href="/bio"
                  className="hover:text-[#4D3040] dark:hover:text-[#FAF4EE] transition-colors font-medium"
                >
                  Bio-Link & QR Toko
                </Link>
              </li>
              <li>
                <a
                  href="#alur-pesan"
                  className="hover:text-[#4D3040] dark:hover:text-[#FAF4EE] transition-colors font-medium"
                >
                  Alur Pemesanan
                </a>
              </li>
              <li>
                <a
                  href="#cerita-kami"
                  className="hover:text-[#4D3040] dark:hover:text-[#FAF4EE] transition-colors font-medium"
                >
                  Kisah Brand
                </a>
              </li>
            </ul>
          </div>

          {/* Location & Hours */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-[#8D624C] dark:text-[#D1A686]">
              Lokasi Studio & Layanan
            </h4>
            <div className="space-y-3 text-sm text-[#55464B] dark:text-[#D8CBC0]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#8D624C] dark:text-[#D1A686] shrink-0 mt-1" />
                <span>{storeAddress}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#8D624C] dark:text-[#D1A686] shrink-0 mt-1" />
                <div>
                  <p>Layanan Chat: 08.00 – 21.00 WIB</p>
                  <p className="text-xs text-[#806C71] dark:text-stone-400 mt-0.5">
                    Katalog online dapat diakses 24/7
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-start justify-between gap-4 pt-6 text-xs text-[#806C71] dark:text-[#C5B5A8] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {storeName}. Powered by Catalove Engine.</p>
          <div className="flex items-center gap-6">
            <span>Indonesia</span>
            <Link
              href="/admin/login"
              className="text-[#67575B] hover:text-[#4D3040] dark:text-stone-400 dark:hover:text-white transition-colors font-medium"
            >
              Portal Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
