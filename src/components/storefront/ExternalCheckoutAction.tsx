import React from "react";
import { ExternalLink, MessageCircle } from "lucide-react";
import { safeExternalCheckoutUrl } from "@/lib/utils/external-checkout";
import { buildStoreContactWhatsAppUrl } from "@/lib/utils/store-whatsapp";

interface ExternalCheckoutActionProps {
  checkoutUrl: string | null | undefined;
  storeName: string;
  sellerWhatsApp?: string | null;
}

export function ExternalCheckoutAction({ checkoutUrl, storeName, sellerWhatsApp }: ExternalCheckoutActionProps) {
  const safeCheckoutUrl = safeExternalCheckoutUrl(checkoutUrl);
  if (!safeCheckoutUrl) return null;

  const whatsappUrl = buildStoreContactWhatsAppUrl(sellerWhatsApp, storeName);
  const checkoutHost = new URL(safeCheckoutUrl).hostname;

  return (
    <section className="space-y-3 rounded-2xl border border-[#DBD0C5] bg-white/70 p-5 dark:border-white/10 dark:bg-white/5" aria-label="Checkout produk">
      <a
        href={safeCheckoutUrl}
        target="_blank"
        rel="noopener noreferrer external"
        className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--storefront-accent)] px-5 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--storefront-accent)]"
      >
        Lanjut ke checkout seller
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
      <p className="text-center text-[11px] text-cocoa-600 dark:text-stone-400">
        Checkout dibuka di <span className="font-semibold text-cocoa-800 dark:text-stone-200">{checkoutHost}</span>
      </p>
      <p className="text-xs leading-relaxed text-cocoa-600 dark:text-stone-400">
        Kamu akan membuka platform seller. Cek harga akhir dan varian di sana; pembayaran, akses file, kebijakan privasi, dan bantuan transaksi dikelola seller. Catalove tidak menerima pembayaran.
      </p>
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="touch-target inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-cocoa-800 underline decoration-caramel-400 underline-offset-4 hover:text-[var(--storefront-accent)] dark:text-stone-200"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Tanya seller via WhatsApp
        </a>
      )}
    </section>
  );
}
