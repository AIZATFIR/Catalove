"use client";

import React, { useState, useEffect } from "react";
import { Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { addDays, formatDateIndonesian, getTodayJakarta, isDateBefore } from "@/lib/utils/formatters";
import { availabilityService } from "@/lib/services/availability-service";

interface FulfillmentDatePickerProps {
  productId: string;
  leadTimeDays: number;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const FulfillmentDatePicker: React.FC<FulfillmentDatePickerProps> = ({
  productId,
  leadTimeDays,
  selectedDate,
  onChangeDate,
  onValidationChange,
}) => {
  const today = getTodayJakarta();
  const minDate = addDays(today, leadTimeDays);

  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Set default date to minDate on load if not set
  useEffect(() => {
    if (!selectedDate || isDateBefore(selectedDate, minDate)) {
      onChangeDate(minDate);
    }
  }, [minDate, selectedDate, onChangeDate]);

  // Check date availability when date changes
  useEffect(() => {
    if (!selectedDate) return;

    let mounted = true;
    setIsChecking(true);

    availabilityService.checkAvailability(productId, selectedDate).then((res) => {
      if (!mounted) return;
      setIsChecking(false);
      setIsAvailable(res.isAvailable);
      setStatusMessage(res.reason || (res.isAvailable ? "Tersedia untuk tanggal ini" : "Tanggal tidak tersedia"));
      if (onValidationChange) {
        onValidationChange(res.isAvailable);
      }
    });

    return () => {
      mounted = false;
    };
  }, [productId, selectedDate, onValidationChange]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-cocoa-800">
          Tanggal Diinginkan <span className="text-rose-500">*</span>
        </label>
        <span className="text-[11px] font-semibold text-caramel-700">
          {leadTimeDays === 0
            ? "Ready Stock (Bisa Hari Ini)"
            : `Minimal Pemesanan H-${leadTimeDays}`}
        </span>
      </div>

      <div className="relative">
        <Calendar className="w-5 h-5 text-cocoa-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="date"
          min={minDate}
          value={selectedDate}
          onChange={(e) => onChangeDate(e.target.value)}
          className="touch-target w-full pl-11 pr-4 py-3 rounded-2xl bg-vanilla-50 border border-caramel-300 text-sm font-semibold text-cocoa-900 focus:outline-none focus:border-caramel-600 focus:ring-1 focus:ring-caramel-500 shadow-sm transition-all"
        />
      </div>

      {/* Date Preview & Availability Badge */}
      {selectedDate && (
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-cocoa-600 font-medium">
            {formatDateIndonesian(selectedDate)}
          </span>

          <div className="flex items-center gap-1.5 font-semibold">
            {isChecking ? (
              <span className="text-cocoa-400">Memeriksa ketersediaan...</span>
            ) : isAvailable ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Kouta Tersedia</span>
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{statusMessage}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
