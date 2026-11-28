import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { orderService } from "@/lib/services/order-service";
import { resolveStoreBySlug } from "@/lib/services/store-service";
import { getAdminSupabase } from "@/lib/supabase/server";
import { formatIDR, formatDateIndonesian } from "@/lib/utils/formatters";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import {
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  ChevronLeft,
} from "lucide-react";

export const metadata = {
  robots: { index: false, follow: false },
};

interface OrderPageProps {
  params: Promise<{
    reference: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const { reference } = await params;
  const decodedRef = decodeURIComponent(reference);
  const storeSlug = (await headers()).get("x-catalove-store-slug") || "catalove";
  const store = await resolveStoreBySlug(storeSlug);
  if (!store) notFound();
  const order = await orderService.getOrderByReference(decodedRef, store.id);

  if (!order) {
    notFound();
  }

  const item = order.items[0];
  const admin = await getAdminSupabase();
  const { data: storeSettings } = admin
    ? await admin
        .from("business_settings")
        .select("store_name,seller_whatsapp,currency_symbol")
        .eq("store_id", store.id)
        .maybeSingle()
    : { data: null };
  const waUrl = buildWhatsAppUrl(
    order,
    storeSettings?.seller_whatsapp ?? "",
    storeSettings?.store_name || store.name,
    storeSettings?.currency_symbol || "Rp"
  );

  const statusConfig = {
    pending: {
      label: "Menunggu konfirmasi toko",
      desc: "Permintaan tersimpan. Kirim detail pesanan ke WhatsApp toko untuk konfirmasi akhir.",
      color: "bg-amber-100 text-amber-900 border-amber-300",
      icon: Clock,
    },
    contacted: {
      label: "Sedang Berkomunikasi",
      desc: "Anda dan pengelola toko terhubung melalui WhatsApp untuk membahas pesanan.",
      color: "bg-blue-100 text-blue-900 border-blue-300",
      icon: MessageCircle,
    },
    confirmed: {
      label: "Pesanan Dikonfirmasi",
      desc: "Pesanan telah disetujui dan jadwal persiapan sudah ditentukan.",
      color: "bg-emerald-100 text-emerald-900 border-emerald-300",
      icon: CheckCircle2,
    },
    completed: {
      label: "Pesanan Selesai",
      desc: "Kue telah selesai dibuat dan diserahkan / diantar dengan baik.",
      color: "bg-cocoa-100 text-cocoa-900 border-cocoa-300",
      icon: CheckCircle2,
    },
    cancelled: {
      label: "Pesanan Dibatalkan",
      desc: "Pesanan ini dibatalkan atau tidak dapat diproses.",
      color: "bg-rose-100 text-rose-900 border-rose-300",
      icon: AlertCircle,
    },
  }[order.status] || {
    label: order.status,
    desc: "",
    color: "bg-vanilla-200 text-cocoa-800 border-vanilla-300",
    icon: Clock,
  };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main id="main-content" className="flex-1 py-10 sm:py-16 max-w-3xl mx-auto px-4 sm:px-6 w-full">
        {/* Back Link */}
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cocoa-600 hover:text-caramel-700 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Kue</span>
        </Link>

        <div className="rounded-3xl bg-white border border-caramel-200/80 shadow-card p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-caramel-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-caramel-700">
                Status Pesanan
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-950 mt-0.5">
                Rincian Pesanan
              </h1>
              <span className="font-mono text-sm font-bold text-cocoa-600 mt-1 block">
                {order.reference_code}
              </span>
            </div>

            {/* Status Pill */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wide self-start sm:self-auto ${statusConfig.color}`}
            >
              <StatusIcon className="w-4 h-4" />
              <span>{statusConfig.label}</span>
            </div>
          </div>

          {/* Status Explanation Banner */}
          <div className="p-4 rounded-2xl bg-vanilla-100/80 border border-caramel-200/60 text-xs sm:text-sm text-cocoa-800 leading-relaxed">
            {statusConfig.desc}
          </div>

          {/* Item Details */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-base text-cocoa-900 border-b border-caramel-100 pb-2">
              Item yang Dipesan
            </h3>

            <div className="flex items-start justify-between py-2 text-sm">
              <div>
                <span className="font-bold text-cocoa-950 block">
                  {item?.product_name_snapshot}
                </span>
                {item?.variant_name_snapshot && (
                  <span className="text-xs text-cocoa-600 block mt-0.5">
                    {item.variant_name_snapshot}
                  </span>
                )}
                <span className="text-xs text-caramel-700 font-semibold block mt-1">
                  Jumlah: {item?.quantity || 1} loyang
                </span>
              </div>
              <span className="font-bold text-cocoa-900">
                {formatIDR(order.subtotal)}
              </span>
            </div>
          </div>

          {/* Delivery & Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-caramel-100 text-xs">
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-caramel-700">
                Fulfillment & Tanggal
              </h4>
              <div className="space-y-1.5 text-cocoa-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-caramel-600" />
                  <span className="font-semibold">
                    {formatDateIndonesian(order.requested_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {order.fulfillment_method === "pickup" ? (
                    <MapPin className="w-4 h-4 text-caramel-600" />
                  ) : (
                    <Truck className="w-4 h-4 text-caramel-600" />
                  )}
                  <span>
                    {order.fulfillment_method === "pickup"
                      ? "Ambil Sendiri di Dapur"
                      : "Pengantaran Kurir"}
                  </span>
                </div>
                {order.delivery_address && (
                  <p className="text-cocoa-500 pl-6">
                    {order.delivery_address}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-caramel-700">
                Personalisasi Kue
              </h4>
              <div className="space-y-1.5 text-cocoa-700">
                <p>
                  <span className="font-medium text-cocoa-500">Tulisan: </span>
                  <span className="italic font-semibold text-cocoa-900">
                    {order.cake_inscription ? `“${order.cake_inscription}”` : "Tidak ada"}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-cocoa-500">Jumlah Lilin: </span>
                  <span className="font-semibold text-cocoa-900">
                    {order.candle_count || 0} batang
                  </span>
                </p>
                {order.customer_notes && (
                  <p>
                    <span className="font-medium text-cocoa-500">Catatan: </span>
                    <span>{order.customer_notes}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* WhatsApp Action */}
          <div className="pt-6 border-t border-caramel-100 space-y-3">
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target w-full flex items-center justify-center gap-2.5 py-4 rounded-full bg-[#25D366] text-white hover:bg-[#20BD5A] font-bold text-sm shadow-warm transition-all duration-200 active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Hubungi toko di WhatsApp</span>
              </a>
            ) : (
              <p className="text-xs text-center text-amber-700">Nomor WhatsApp toko belum tersedia. Gunakan kode pesanan saat menghubungi toko.</p>
            )}

            <p className="text-[11px] text-center text-cocoa-500">
              Pertanyaan seputar penyesuaian jadwal atau pembayaran dapat disampaikan langsung melalui WhatsApp toko.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
