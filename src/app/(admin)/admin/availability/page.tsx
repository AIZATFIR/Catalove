"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cakeService } from "@/lib/services/cake-service";
import { availabilityService } from "@/lib/services/availability-service";
import { Product, AvailabilityStatus } from "@/types/bakery";
import { getTodayJakarta, addDays, formatDateIndonesian } from "@/lib/utils/formatters";

export default function AdminAvailabilityPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const today = getTodayJakarta();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [statuses, setStatuses] = useState<Record<string, AvailabilityStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Generate 14 selectable date pills for easy mobile horizontal swipe
  const next14Days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  const loadData = async () => {
    const list = await cakeService.getProducts({ includeInactive: false });
    setProducts(list);

    // Load statuses for selected date
    const initialStatuses: Record<string, AvailabilityStatus> = {};
    for (const p of list) {
      const res = await availabilityService.checkAvailability(p.id, selectedDate);
      initialStatuses[p.id] = res.isAvailable ? "available" : "sold_out";
    }
    setStatuses(initialStatuses);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleToggle = async (productId: string, newStatus: AvailabilityStatus) => {
    setStatuses((prev) => ({ ...prev, [productId]: newStatus }));
    await availabilityService.setAvailability(productId, selectedDate, newStatus);
    showToast("Status ketersediaan berhasil diperbarui");
  };

  const handleCopyWeekend = async () => {
    setIsSaving(true);
    // Copy settings to next 3 days
    const targetDates = [addDays(selectedDate, 1), addDays(selectedDate, 2)];
    await availabilityService.copyAvailability(selectedDate, targetDates);
    setIsSaving(false);
    showToast(`Pengaturan berhasil disalin ke 2 hari ke depan`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-caramel-700">
            Jadwal Operasional
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-950 mt-0.5">
            Kouta & Ketersediaan Harian
          </h1>
          <p className="text-xs text-cocoa-600 mt-1">
            Pilih tanggal di bawah untuk mengatur kue yang dapat dipesan pada hari tersebut.
          </p>
        </div>

        <button
          onClick={handleCopyWeekend}
          disabled={isSaving}
          className="touch-target inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-butter-100 hover:bg-butter-200 text-cocoa-900 border border-butter-300 text-xs font-semibold shadow-sm self-start sm:self-auto active:scale-95 transition-all"
        >
          <Copy className="w-3.5 h-3.5 text-caramel-700" />
          <span>Salin ke 2 Hari ke Depan</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Date Selector Pills (Horizontal swipe on phone) */}
      <div className="rounded-3xl bg-white border border-caramel-200/80 shadow-soft p-4 sm:p-5">
        <label className="text-xs font-bold uppercase tracking-wider text-cocoa-900 block mb-3">
          Pilih Tanggal Acara:
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
          {next14Days.map((dateStr, idx) => {
            const isSelected = selectedDate === dateStr;
            const [y, m, d] = dateStr.split("-");
            const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
            const dayName = new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(dateObj);
            const isToday = dateStr === today;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`touch-target shrink-0 flex flex-col items-center justify-center w-16 py-2.5 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? "bg-caramel-600 text-white border-caramel-700 shadow-md scale-105"
                    : "bg-vanilla-50 text-cocoa-800 border-caramel-200 hover:bg-vanilla-100"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {isToday ? "Hari Ini" : dayName}
                </span>
                <span className="text-base font-bold mt-0.5">{Number(d)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Availability Toggle for Selected Date */}
      <div className="rounded-3xl bg-white border border-caramel-200/80 shadow-soft p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-caramel-100 pb-3">
          <div>
            <h2 className="font-serif font-bold text-lg text-cocoa-950">
              Ketersediaan untuk {formatDateIndonesian(selectedDate)}
            </h2>
            <p className="text-xs text-cocoa-500">
              Ubah status kue bila kuota porsi pada tanggal ini telah habis atau dapur libur.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {products.map((product) => {
            const currentStatus = statuses[product.id] || "available";

            return (
              <div
                key={product.id}
                className="p-4 rounded-2xl bg-vanilla-50/70 border border-caramel-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-sm text-cocoa-900">
                    {product.name}
                  </h4>
                  <p className="text-xs text-cocoa-500 mt-0.5">
                    Lead time: {product.minimum_lead_time_days === 0 ? "Ready Stock" : `H-${product.minimum_lead_time_days}`}
                  </p>
                </div>

                {/* 3-State Toggle Pill */}
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-white border border-caramel-200 text-xs font-semibold self-start sm:self-auto">
                  <button
                    onClick={() => handleToggle(product.id, "available")}
                    className={`px-3 py-1.5 rounded-full transition-all ${
                      currentStatus === "available"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-cocoa-600 hover:text-cocoa-900"
                    }`}
                  >
                    Tersedia
                  </button>
                  <button
                    onClick={() => handleToggle(product.id, "sold_out")}
                    className={`px-3 py-1.5 rounded-full transition-all ${
                      currentStatus === "sold_out"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-cocoa-600 hover:text-cocoa-900"
                    }`}
                  >
                    Habis (Penuh)
                  </button>
                  <button
                    onClick={() => handleToggle(product.id, "closed")}
                    className={`px-3 py-1.5 rounded-full transition-all ${
                      currentStatus === "closed"
                        ? "bg-gray-700 text-white shadow-sm"
                        : "text-cocoa-600 hover:text-cocoa-900"
                    }`}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
