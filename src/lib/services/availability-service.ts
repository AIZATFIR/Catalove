import { AvailabilityStatus, ProductAvailability } from "@/types/bakery";
import { cakeService } from "./cake-service";
import { addDays, getTodayJakarta, isDateBefore } from "@/lib/utils/formatters";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { createClient } from "@supabase/supabase-js";

// In-memory fallback map: `${productId}_${dateStr}`
const availabilityOverrides = new Map<string, ProductAvailability>();

function getDirectSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (typeof window !== "undefined") return getBrowserSupabase();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key);
}

export class AvailabilityService {
  async checkAvailability(
    productId: string,
    requestedDateStr: string
  ): Promise<{
    isAvailable: boolean;
    reason?: string;
    earliestValidDate: string;
  }> {
    const product = await cakeService.getProductById(productId);
    const today = getTodayJakarta();

    if (!product) {
      return {
        isAvailable: false,
        reason: "Produk tidak ditemukan.",
        earliestValidDate: today,
      };
    }

    const earliestValidDate = addDays(today, product.minimum_lead_time_days);

    // 1. Check if date is in the past or violates lead time
    if (isDateBefore(requestedDateStr, earliestValidDate)) {
      return {
        isAvailable: false,
        reason: `Kue ini membutuhkan waktu pembuatan minimal H-${product.minimum_lead_time_days}. Tanggal tercepat yang dapat dipilih adalah ${earliestValidDate}.`,
        earliestValidDate,
      };
    }

    if (!isSupabaseConfigured()) {
      // In-memory check
      const key = `${productId}_${requestedDateStr}`;
      const override = availabilityOverrides.get(key);

      if (override) {
        if (override.status === "sold_out") {
          return {
            isAvailable: false,
            reason: "Kuota produk pada tanggal yang dipilih sudah penuh.",
            earliestValidDate,
          };
        }
        if (override.status === "closed") {
          return {
            isAvailable: false,
            reason: "Toko tidak menerima pesanan pada tanggal ini.",
            earliestValidDate,
          };
        }
      }

      return { isAvailable: true, earliestValidDate };
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) {
        return {
          isAvailable: false,
          reason: "Koneksi ketersediaan sedang bermasalah. Coba lagi sebentar.",
          earliestValidDate,
        };
      }

      const { data, error } = await supabase.rpc("get_product_availability", {
        p_product_id: productId,
        p_requested_date: requestedDateStr,
      });

      const record = Array.isArray(data) ? data[0] : data;
      if (!error && record) {
        if (record.status === "sold_out") {
          return {
            isAvailable: false,
            reason: "Kuota produk pada tanggal yang dipilih sudah penuh.",
            earliestValidDate,
          };
        }
        if (record.status === "closed") {
          return {
            isAvailable: false,
            reason: "Toko tidak menerima pesanan pada tanggal ini.",
            earliestValidDate,
          };
        }
        if (record.quota !== null && record.quota !== undefined) {
          if ((record.ordered_quantity || 0) >= record.quota) {
            return {
              isAvailable: false,
              reason: "Kuota produksi untuk tanggal ini sudah penuh.",
              earliestValidDate,
            };
          }
        }
      }

      if (error) {
        return {
          isAvailable: false,
          reason: "Ketersediaan belum dapat diperiksa. Coba lagi sebentar.",
          earliestValidDate,
        };
      }
      return { isAvailable: true, earliestValidDate };
    } catch {
      return {
        isAvailable: false,
        reason: "Ketersediaan belum dapat diperiksa. Coba lagi sebentar.",
        earliestValidDate,
      };
    }
  }

  async setAvailability(
    productId: string,
    dateStr: string,
    status: AvailabilityStatus,
    quota?: number | null
  ): Promise<ProductAvailability> {
    const record: ProductAvailability = {
      id: `avail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: productId,
      availability_date: dateStr,
      status,
      quota,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const key = `${productId}_${dateStr}`;
      availabilityOverrides.set(key, record);
      return record;
    }

    const supabase = getDirectSupabaseClient();
    if (!supabase) return record;

    const { data, error } = await supabase
      .from("product_availability")
      .upsert(
        {
          product_id: productId,
          availability_date: dateStr,
          status,
          quota: quota === undefined ? null : quota,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "product_id,availability_date" }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ProductAvailability;
  }

  async getMonthAvailability(
    productId: string,
    yearMonth: string // e.g. "2026-10"
  ): Promise<Record<string, AvailabilityStatus>> {
    if (!isSupabaseConfigured()) {
      const result: Record<string, AvailabilityStatus> = {};
      for (const [key, val] of availabilityOverrides.entries()) {
        if (key.startsWith(`${productId}_${yearMonth}`)) {
          result[val.availability_date] = val.status;
        }
      }
      return result;
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return {};

      const startDate = `${yearMonth}-01`;
      const endDate = `${yearMonth}-31`;

      const { data, error } = await supabase
        .from("product_availability")
        .select("availability_date, status")
        .eq("product_id", productId)
        .gte("availability_date", startDate)
        .lte("availability_date", endDate);

      if (error || !data) return {};

      const map: Record<string, AvailabilityStatus> = {};
      data.forEach((row: any) => {
        map[row.availability_date] = row.status as AvailabilityStatus;
      });
      return map;
    } catch {
      return {};
    }
  }

  async copyAvailability(
    fromDateStr: string,
    targetDateStrs: string[]
  ): Promise<boolean> {
    const products = await cakeService.getProducts({ includeInactive: true });

    if (!isSupabaseConfigured()) {
      for (const prod of products) {
        const sourceKey = `${prod.id}_${fromDateStr}`;
        const sourceRecord = availabilityOverrides.get(sourceKey);
        if (sourceRecord) {
          for (const targetDate of targetDateStrs) {
            await this.setAvailability(
              prod.id,
              targetDate,
              sourceRecord.status,
              sourceRecord.quota
            );
          }
        }
      }
      return true;
    }

    const supabase = getDirectSupabaseClient();
    if (!supabase) return false;

    // Fetch all availability records for source date
    const { data: sourceRecords } = await supabase
      .from("product_availability")
      .select("*")
      .eq("availability_date", fromDateStr);

    if (!sourceRecords || sourceRecords.length === 0) return true;

    const rowsToInsert: any[] = [];
    for (const src of sourceRecords) {
      for (const targetDate of targetDateStrs) {
        rowsToInsert.push({
          product_id: src.product_id,
          availability_date: targetDate,
          status: src.status,
          quota: src.quota,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (rowsToInsert.length > 0) {
      await supabase
        .from("product_availability")
        .upsert(rowsToInsert, { onConflict: "product_id,availability_date" });
    }

    return true;
  }
}

export const availabilityService = new AvailabilityService();
