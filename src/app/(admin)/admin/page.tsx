"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Plus,
  ArrowRight,
  Package,
  Palette,
  Sparkles,
} from "lucide-react";
import { orderService } from "@/lib/services/order-service";
import { cakeService } from "@/lib/services/cake-service";
import { OrderRequest } from "@/types/bakery";
import { formatDateIndonesian } from "@/lib/utils/formatters";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export default function AdminDashboardPage() {
  const settings = useBusinessSettings();
  const [stats, setStats] = useState({ pending: 0, contacted: 0, confirmed: 0, completed: 0 });
  const [pendingOrders, setPendingOrders] = useState<OrderRequest[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [isTomorrowOpen, setIsTomorrowOpen] = useState(true);

  const loadData = () => {
    orderService.getOrderStats().then(setStats);
    orderService.listOrders("pending").then((orders) => {
      setPendingOrders(orders.slice(0, 5));
    });
    cakeService.getProducts({ includeInactive: true }).then((prods) => {
      setProductCount(prods.length);
    });
  };

  useEffect(() => {
    loadData();
    window.addEventListener("catalove-catalog-updated", loadData);
    return () => window.removeEventListener("catalove-catalog-updated", loadData);
  }, []);

  const handleQuickConfirm = async (orderId: string) => {
    await orderService.updateOrderStatus(orderId, "confirmed");
    loadData();
  };

  const storeName = settings.store_name || "Catalove";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-butter-100 via-vanilla-100 to-white border border-caramel-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:from-[#261F1C] dark:via-[#211B19] dark:to-[#1A1412] dark:border-white/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-caramel-700 dark:text-[#D1A686]">
            Halo Pengelola {storeName}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-950 dark:text-[#FAF4EE] mt-0.5">
            Ringkasan Toko &amp; Operasional
          </h1>
          <p className="text-xs text-cocoa-600 dark:text-[#D8CBC0] mt-1">
            Pantau permintaan pesanan baru, kelola katalog produk, dan atur desain storefront {storeName}.
          </p>
        </div>

        {/* Quick Tomorrow Availability Toggle */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#2A221F] border border-caramel-200 dark:border-white/10 shadow-sm flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-caramel-600 dark:text-[#D1A686]" />
            <span className="text-xs font-semibold text-cocoa-900 dark:text-[#FAF4EE]">
              Penerimaan Besok:
            </span>
          </div>
          <button
            onClick={() => setIsTomorrowOpen(!isTomorrowOpen)}
            className={`touch-target px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              isTomorrowOpen
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
            }`}
          >
            {isTomorrowOpen ? "Buka (Menerima)" : "Tutup Sementara"}
          </button>
        </div>
      </div>

      {/* Featured Shortcut: Studio Kustomisasi & Preset Usaha */}
      <Link
        href="/admin/settings"
        className="block p-5 sm:p-6 rounded-3xl bg-stone-950 text-white dark:bg-[#2A221F] border border-stone-800 dark:border-white/15 shadow-card hover:shadow-xl hover:-translate-y-0.5 transition-all group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--storefront-accent)] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                <Sparkles className="w-3 h-3" />
                <span>Studio No-Code Catalove</span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white mt-0.5">
                Studio Kustomisasi &amp; Preset Usaha
              </h2>
              <p className="text-xs text-stone-300 mt-1">
                Ganti preset industri (Fashion, Bakery, Craft, Florist, Jasa, dll.), ubah font, palet warna, tata letak Pinterest/TikTok Feed, dan teks storefront tanpa koding.
              </p>
            </div>
          </div>
          <span className="touch-target self-start sm:self-center shrink-0 inline-flex items-center gap-2 rounded-full bg-white text-stone-950 px-4 py-2 text-xs font-bold group-hover:bg-amber-300 transition-colors">
            <span>Buka Studio Web</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {/* Quick Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Link
          href="/admin/orders?tab=pending"
          className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 hover:border-amber-400 transition-all shadow-sm dark:bg-amber-950/30 dark:border-amber-800/50"
        >
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-1">
            <span className="text-xs font-bold">Perlu Dikonfirmasi</span>
            <Clock className="w-4 h-4" />
          </div>
          <span className="font-serif text-3xl font-bold text-amber-950 dark:text-amber-100">
            {stats.pending}
          </span>
          <span className="text-[10px] text-amber-700 dark:text-amber-300/80 block mt-0.5">
            Permintaan pesanan baru
          </span>
        </Link>

        <Link
          href="/admin/orders?tab=contacted"
          className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 hover:border-blue-400 transition-all shadow-sm dark:bg-blue-950/30 dark:border-blue-800/50"
        >
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 mb-1">
            <span className="text-xs font-bold">Sedang Chat WA</span>
            <MessageCircle className="w-4 h-4" />
          </div>
          <span className="font-serif text-3xl font-bold text-blue-950 dark:text-blue-100">
            {stats.contacted}
          </span>
          <span className="text-[10px] text-blue-700 dark:text-blue-300/80 block mt-0.5">
            Menunggu kesepakatan
          </span>
        </Link>

        <Link
          href="/admin/orders?tab=confirmed"
          className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 hover:border-emerald-400 transition-all shadow-sm dark:bg-emerald-950/30 dark:border-emerald-800/50"
        >
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-1">
            <span className="text-xs font-bold">Siap Diproses</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="font-serif text-3xl font-bold text-emerald-950 dark:text-emerald-100">
            {stats.confirmed}
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300/80 block mt-0.5">
            Pesanan terkonfirmasi
          </span>
        </Link>

        <Link
          href="/admin/products"
          className="p-4 rounded-2xl bg-white border border-caramel-200 hover:border-caramel-400 transition-all shadow-sm dark:bg-[#211B19] dark:border-white/10"
        >
          <div className="flex items-center justify-between text-cocoa-700 dark:text-[#E8DDD4] mb-1">
            <span className="text-xs font-bold">Total Katalog</span>
            <Package className="w-4 h-4 text-caramel-600 dark:text-[#D1A686]" />
          </div>
          <span className="font-serif text-3xl font-bold text-cocoa-950 dark:text-[#FAF4EE]">
            {productCount}
          </span>
          <span className="text-[10px] text-cocoa-500 dark:text-[#C5B5A8] block mt-0.5">
            Total produk terdaftar
          </span>
        </Link>
      </div>

      {/* Urgent Action Queue: Permintaan Pesanan Menunggu Respon */}
      <div className="rounded-3xl bg-white dark:bg-[#211B19] border border-caramel-200/80 dark:border-white/10 shadow-soft p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-caramel-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="font-serif font-bold text-lg text-cocoa-950 dark:text-[#FAF4EE]">
              Antrian Pesanan Baru ({pendingOrders.length})
            </h2>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-caramel-700 hover:text-caramel-900 dark:text-[#D1A686] flex items-center gap-1"
          >
            <span>Lihat Semua Pesanan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingOrders.length > 0 ? (
          <div className="space-y-3">
            {pendingOrders.map((order) => {
              const item = order.items[0];
              const extraCount = order.items.length > 1 ? order.items.length - 1 : 0;
              const waChatUrl = buildWhatsAppUrl(order, order.customer_whatsapp);

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-vanilla-50/70 dark:bg-white/5 border border-caramel-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-caramel-300 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-caramel-800 bg-butter-200/60 dark:bg-amber-900/50 dark:text-amber-200 px-2 py-0.5 rounded-md">
                        {order.reference_code}
                      </span>
                      <span className="font-bold text-sm text-cocoa-900 dark:text-[#FAF4EE]">
                        {order.customer_name}
                      </span>
                      <span className="text-xs text-cocoa-500 dark:text-[#C5B5A8]">
                        ({order.customer_whatsapp})
                      </span>
                    </div>

                    <p className="text-xs text-cocoa-700 dark:text-[#D8CBC0]">
                      <span className="font-semibold">{item?.product_name_snapshot}</span>
                      {item?.variant_name_snapshot && ` • ${item.variant_name_snapshot}`}
                      {extraCount > 0 && ` (+${extraCount} item lainnya)`}
                      {" "}• Tanggal: <span className="font-semibold">{formatDateIndonesian(order.requested_date)}</span>
                    </p>

                    {order.cake_inscription && (
                      <p className="text-[11px] text-cocoa-600 dark:text-[#C5B5A8] italic">
                        Catatan: “{order.cake_inscription}”
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <a
                      href={waChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="touch-target inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#25D366] text-white hover:bg-[#20BD5A] text-xs font-bold shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat WA</span>
                    </a>

                    <button
                      onClick={() => handleQuickConfirm(order.id)}
                      className="touch-target inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Konfirmasi</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-cocoa-500 dark:text-[#C5B5A8]">
            Tidak ada pesanan yang tertunda. Semua pesanan sudah ditinjau!
          </div>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/products/new"
          className="p-5 rounded-3xl bg-white dark:bg-[#211B19] border border-caramel-200/80 dark:border-white/10 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all flex items-center gap-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-butter-500 flex items-center justify-center text-cocoa-900 group-hover:scale-105 transition-transform">
            <Plus className="w-6 h-6 text-caramel-800" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-cocoa-950 dark:text-[#FAF4EE]">
              Upload Foto &amp; Tambah Produk
            </h3>
            <p className="text-xs text-cocoa-500 dark:text-[#C5B5A8] mt-0.5">
              Pilih beberapa foto dari galeri HP
            </p>
          </div>
        </Link>

        <Link
          href="/admin/availability"
          className="p-5 rounded-3xl bg-white dark:bg-[#211B19] border border-caramel-200/80 dark:border-white/10 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all flex items-center gap-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-butter-100 border border-butter-300 flex items-center justify-center text-caramel-700 group-hover:scale-105 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-cocoa-950 dark:text-[#FAF4EE]">
              Jadwal &amp; Kuota Harian
            </h3>
            <p className="text-xs text-cocoa-500 dark:text-[#C5B5A8] mt-0.5">
              Tutup tanggal atau atur kuota pesanan harian
            </p>
          </div>
        </Link>

        <Link
          href="/admin/products"
          className="p-5 rounded-3xl bg-white dark:bg-[#211B19] border border-caramel-200/80 dark:border-white/10 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all flex items-center gap-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-vanilla-200 flex items-center justify-center text-cocoa-700 group-hover:scale-105 transition-transform">
            <Package className="w-6 h-6 text-caramel-700" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-cocoa-950 dark:text-[#FAF4EE]">
              Urutan &amp; Status Produk
            </h3>
            <p className="text-xs text-cocoa-500 dark:text-[#C5B5A8] mt-0.5">
              Atur posisi tampil di etalase web
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
