"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  Filter,
} from "lucide-react";
import { orderService } from "@/lib/services/order-service";
import { OrderRequest, OrderStatus } from "@/types/bakery";
import { formatIDR, formatDateIndonesian } from "@/lib/utils/formatters";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as OrderStatus | "all") || "all";

  const [activeTab, setActiveTab] = useState<OrderStatus | "all">(initialTab);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [toastMessage, setToastMessage] = useState("");

  const loadOrders = async () => {
    const list = await orderService.listOrders(activeTab === "all" ? undefined : activeTab);
    setOrders(list);
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await orderService.updateOrderStatus(orderId, newStatus);
    loadOrders();
    setToastMessage(`Status pesanan berhasil diperbarui ke ${newStatus}`);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const tabs = [
    { id: "all", label: "Semua" },
    { id: "pending", label: "Menunggu Review" },
    { id: "contacted", label: "Dihubungi" },
    { id: "confirmed", label: "Dikonfirmasi" },
    { id: "completed", label: "Selesai" },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-caramel-700">
          Manajemen Pesanan
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-950 mt-0.5">
          Daftar Permintaan Pesanan
        </h1>
        <p className="text-xs text-cocoa-600 mt-1">
          Tinjau pesanan masuk, chat langsung ke nomor WhatsApp pelanggan, dan ubah status pembuatan kue.
        </p>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Tabs (Horizontal scroll on phone) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`touch-target shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-sm ${
              activeTab === tab.id
                ? "bg-caramel-600 text-white"
                : "bg-white text-cocoa-800 border border-caramel-200/80 hover:bg-caramel-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => {
            const item = order.items[0];
            const waChatUrl = buildWhatsAppUrl(order, order.customer_whatsapp);

            const statusBadgeColors = {
              pending: "bg-amber-100 text-amber-900 border-amber-300",
              contacted: "bg-blue-100 text-blue-900 border-blue-300",
              confirmed: "bg-emerald-100 text-emerald-900 border-emerald-300",
              completed: "bg-gray-100 text-gray-800 border-gray-300",
              cancelled: "bg-rose-100 text-rose-800 border-rose-300",
            }[order.status];

            return (
              <div
                key={order.id}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-caramel-200/80 shadow-soft space-y-4 hover:border-caramel-300 transition-all"
              >
                {/* Top Row: Ref ID, Status & Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-caramel-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-caramel-800 bg-butter-100 border border-butter-300 px-2.5 py-0.5 rounded-lg">
                      {order.reference_code}
                    </span>
                    <span className="font-bold text-sm text-cocoa-950">
                      {order.customer_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${statusBadgeColors}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Main Content: Item, Date, Customization */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs text-cocoa-700">
                  <div className="md:col-span-7 space-y-1.5">
                    <div className="font-serif font-bold text-base text-cocoa-900">
                      {item?.product_name_snapshot}
                    </div>
                    {item?.variant_name_snapshot && (
                      <p className="text-cocoa-600">
                        Varian: {item.variant_name_snapshot} (x{item.quantity})
                      </p>
                    )}
                    {order.cake_inscription && (
                      <p className="text-caramel-800 italic bg-vanilla-100 p-2 rounded-xl">
                        Tulisan kue: “{order.cake_inscription}”
                        {order.candle_count ? ` (${order.candle_count} lilin)` : ""}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-5 space-y-1.5 border-t md:border-t-0 md:border-l border-caramel-100 pt-3 md:pt-0 md:pl-4">
                    <div className="flex items-center gap-1.5 font-semibold text-cocoa-900">
                      <Clock className="w-3.5 h-3.5 text-caramel-600" />
                      <span>{formatDateIndonesian(order.requested_date)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-cocoa-600">
                      {order.fulfillment_method === "pickup" ? (
                        <MapPin className="w-3.5 h-3.5 text-caramel-600" />
                      ) : (
                        <Truck className="w-3.5 h-3.5 text-caramel-600" />
                      )}
                      <span>
                        {order.fulfillment_method === "pickup"
                          ? "Ambil Sendiri di Dapur"
                          : `Pengantaran: ${order.delivery_address || "-"}`}
                      </span>
                    </div>

                    <div className="font-bold text-sm text-caramel-800 pt-1">
                      Total: {formatIDR(order.subtotal)}
                    </div>
                  </div>
                </div>

                {/* Action Row: WhatsApp & Status Stepper */}
                <div className="pt-3 border-t border-caramel-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <a
                    href={waChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="touch-target inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white hover:bg-[#20BD5A] text-xs font-bold shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat WhatsApp Pelanggan</span>
                  </a>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs font-semibold text-cocoa-600">
                      Ubah Status:
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value as OrderStatus)
                      }
                      className="px-3 py-1.5 rounded-xl bg-vanilla-100 border border-caramel-300 text-xs font-bold text-cocoa-900 focus:outline-none focus:border-caramel-600 cursor-pointer"
                    >
                      <option value="pending">Menunggu Review</option>
                      <option value="contacted">Sudah Dihubungi</option>
                      <option value="confirmed">Dikonfirmasi (Siap Buat)</option>
                      <option value="completed">Selesai</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center rounded-3xl bg-white border border-caramel-200/80 shadow-soft text-xs text-cocoa-500">
            Tidak ada pesanan pada kategori ini.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-cocoa-500">
          Memuat pesanan...
        </div>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  );
}
