"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { buildCataloveInquiryWhatsAppUrl } from "@/lib/utils/catalove-whatsapp";
import { buildStoreContactWhatsAppUrl } from "@/lib/utils/store-whatsapp";
import { isTenantStorefrontPath } from "@/lib/store-routing";

export const Footer: React.FC = () => {
  const settings = useBusinessSettings();
  const pathname = usePathname() || "/";
  const isTenantStore = isTenantStorefrontPath(pathname);
  const storeName = settings.store_name || "Catalove";
  const waUrl = isTenantStore
    ? buildStoreContactWhatsAppUrl(settings.seller_whatsapp, storeName)
    : buildCataloveInquiryWhatsAppUrl(settings.seller_whatsapp);
  const footerLinks = isTenantStore
    ? [
        { href: "/catalog", label: "Katalog" },
        { href: "/bio", label: "Bio" },
        { href: "/privacy", label: "Privasi" },
      ]
    : [
        { href: "/catalog", label: "Katalog" },
        { href: "/bio", label: "Bio" },
        { href: "/contact", label: "Kontak" },
        { href: "/privacy", label: "Privasi" },
        { href: "/about", label: "Tentang" },
        { href: "/admin/login", label: "Admin" },
      ];

  return (
    <footer className="border-t border-[#DBD0C5]/40 bg-[#FCFAF6] py-10 text-[#55464B] sm:py-12 dark:border-white/10 dark:bg-[#1A1412] dark:text-[#E8DDD4] transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <span className="font-serif text-2xl font-semibold tracking-tight text-[#4D3040] dark:text-[#FAF4EE]">
            {storeName}
          </span>
          <p className="text-xs text-[#67575B] dark:text-[#D8CBC0]">
            {isTenantStore
              ? settings.store_tagline || `Katalog resmi ${storeName}.`
              : "Simple yet interesting catalog for your brand."}
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-6 text-xs font-semibold">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[var(--storefront-accent)] transition-colors">
              {link.label}
            </Link>
          ))}
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[var(--storefront-accent)] px-4 py-2 text-white font-bold hover:opacity-90 transition-opacity"
            >
              {isTenantStore ? `WhatsApp ${storeName}` : "Tanya paket Catalove"}
            </a>
          )}
        </nav>
      </div>
      <p className="mx-auto mt-6 max-w-[1600px] px-4 text-center text-[11px] text-[#85777A] sm:px-8 lg:px-12 dark:text-[#B9AAA2]">
        Powered by Catalove
      </p>
    </footer>
  );
};

export default Footer;
