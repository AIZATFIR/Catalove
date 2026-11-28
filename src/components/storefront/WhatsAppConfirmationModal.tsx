"use client";

import React, { useState } from "react";
import { CheckCircle2, Copy, Check, X, ShieldAlert } from "lucide-react";
import { OrderRequest } from "@/types/bakery";
import { formatPrice, formatDateIndonesian } from "@/lib/utils/formatters";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import PlugConnectedIcon from "@/components/ui/plug-connected-icon";

interface WhatsAppConfirmationModalProps {
  order: OrderRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppConfirmationModal: React.FC<WhatsAppConfirmationModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const settings = useBusinessSettings();
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !order) return null;

  const storeName = settings.store_name || "Toko";
  const sellerWa = settings.seller_whatsapp;
  const currency = settings.currency_symbol || "Rp";

  const item = order.items[0];
  const waUrl = buildWhatsAppUrl(order, sellerWa, storeName, currency);
  const waMessage = buildWhatsAppMessage(order, storeName, currency);

  const handleCopy = () => {
    navigator.clipboard.writeText(waMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-cocoa-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#1E1815] border border-caramel-200/80 dark:border-white/10 shadow-2xl p-6 sm:p-8 z-10 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="touch-target absolute right-4 top-4 text-cocoa-400 hover:text-cocoa-700 dark:hover:text-white p-2 rounded-full"
          aria-label="Tutup dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center pb-5 border-b border-caramel-100 dark:border-white/10">
          <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 mx-auto mb-3 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-caramel-700 dark:text-amber-300">
            Permintaan Diterima Sistem
          </span>
          <h3 className="font-serif text-2xl font-bold text-cocoa-950 dark:text-white mt-1">
            Pesanan Berhasil Tercatat
          </h3>
          <div className="inline-block mt-2 px-3 py-1 rounded-full bg-vanilla-200 dark:bg-white/10 text-cocoa-900 dark:text-stone-100 font-mono text-xs font-bold border border-caramel-200 dark:border-white/10">
            ID: {order.reference_code}
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="py-4 space-y-2.5 text-xs text-cocoa-800 dark:text-stone-200">
          <div className="flex justify-between py-1 border-b border-vanilla-200 dark:border-white/10">
            <span className="text-cocoa-500 dark:text-stone-400">Pemesan:</span>
            <span className="font-semibold text-cocoa-900 dark:text-white">
              {order.customer_name} ({order.customer_whatsapp})
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-vanilla-200 dark:border-white/10">
            <span className="text-cocoa-500 dark:text-stone-400">Produk & Varian:</span>
            <span className="font-semibold text-cocoa-900 dark:text-white text-right">
              {item?.product_name_snapshot}
              {item?.variant_name_snapshot && (
                <span className="block text-[11px] font-normal text-cocoa-600 dark:text-stone-400">
                  {item.variant_name_snapshot} (x{item.quantity})
                </span>
              )}
            </span>
          </div>
          {order.requested_date && (
            <div className="flex justify-between py-1 border-b border-vanilla-200 dark:border-white/10">
              <span className="text-cocoa-500 dark:text-stone-400">Tanggal Pengiriman:</span>
              <span className="font-semibold text-cocoa-900 dark:text-white">
                {formatDateIndonesian(order.requested_date)}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1 border-b border-vanilla-200 dark:border-white/10">
            <span className="text-cocoa-500 dark:text-stone-400">Metode:</span>
            <span className="font-semibold text-cocoa-900 dark:text-white">
              {order.fulfillment_method === "pickup"
                ? "Ambil di Toko / Studio"
                : order.fulfillment_method === "shipping"
                ? "Ekspedisi Reguler"
                : "Pengantaran Kurir"}
            </span>
          </div>
          {(order.cake_inscription || order.customer_notes) && (
            <div className="flex justify-between py-1 border-b border-vanilla-200 dark:border-white/10">
              <span className="text-cocoa-500 dark:text-stone-400">Catatan Khusus:</span>
              <span className="font-semibold text-cocoa-900 dark:text-white italic">
                “{order.cake_inscription || order.customer_notes}”
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 text-sm font-bold text-cocoa-950 dark:text-white">
            <span>Estimasi Total:</span>
            <span className="text-[var(--storefront-accent)]">
              {formatPrice(order.subtotal, currency)}
            </span>
          </div>
        </div>

        {/* Clear Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-700/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 mb-6">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">Penting:</span> Pesanan belum final. Klik tombol di bawah untuk mengirim detail ke WhatsApp <span className="font-semibold">{storeName}</span> guna konfirmasi ketersediaan dan pembayaran.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-3">
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full bg-[#25D366] text-white hover:bg-[#20BD5A] font-bold text-sm shadow-warm transition-all duration-200 active:scale-[0.98]"
            >
              <PlugConnectedIcon
                size={20}
                color="white"
                strokeWidth={2}
                className="cursor-pointer"
                aria-hidden="true"
                focusable="false"
              />
              <span>Lanjut ke WhatsApp (Kirim Pesanan)</span>
            </a>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300">Nomor WhatsApp toko belum tersedia. Simpan kode referensi untuk konfirmasi ke toko.</p>
          )}

          <button
            onClick={handleCopy}
            type="button"
            className="touch-target w-full flex items-center justify-center gap-2 py-3 rounded-full bg-vanilla-100 hover:bg-vanilla-200 dark:bg-white/5 dark:hover:bg-white/10 border border-caramel-300 dark:border-white/15 text-cocoa-800 dark:text-stone-200 text-xs font-semibold transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-300">
                  Teks Pesanan Berhasil Disalin!
                </span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cocoa-600 dark:text-stone-400" />
                <span>Salin Pesan Manual (Jika WhatsApp Tidak Terbuka)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
