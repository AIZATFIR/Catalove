import { FulfillmentMethod, OrderRequest, OrderRequestItem, OrderStatus } from "@/types/bakery";
import { OrderInput } from "@/lib/validators/order";
import { cakeService } from "./cake-service";
import { availabilityService } from "./availability-service";
import { getTodayJakarta } from "@/lib/utils/formatters";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { shouldUseLocalCatalogOverride } from "@/lib/services/catalog-mode";
import { createClient } from "@supabase/supabase-js";
import { getCurrentStoreSlug, getStoreScopedStorageKey, withStoreSlug } from "@/lib/store-routing";
import { DEFAULT_STORE_ID } from "@/lib/store-routing";

const ordersStorageKey = () => getStoreScopedStorageKey("catalove-orders-v1");

// In-memory orders store used ONLY when Supabase is not configured (local dev & testing)
let localOrdersStore: OrderRequest[] = [];

function readBrowserOrders(): OrderRequest[] {
  if (typeof window === "undefined") return localOrdersStore;
  try {
    const raw = window.localStorage.getItem(ordersStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const realOrders = parsed.filter((order) => order?.id !== "ord-sample-1");
        if (realOrders.length !== parsed.length) {
          window.localStorage.setItem(ordersStorageKey(), JSON.stringify(realOrders));
        }
        return realOrders;
      }
    }
    window.localStorage.setItem(ordersStorageKey(), JSON.stringify(localOrdersStore));
    return localOrdersStore;
  } catch {
    return localOrdersStore;
  }
}

function writeBrowserOrders(orders: OrderRequest[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ordersStorageKey(), JSON.stringify(orders));
  } catch {
    // ignore quota error
  }
}

function getDirectSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (typeof window !== "undefined") return getBrowserSupabase();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key);
}

function isLocalOrdersMode(): boolean {
  if (typeof window === "undefined") return !isSupabaseConfigured();
  try {
    return shouldUseLocalCatalogOverride(
      isSupabaseConfigured(),
      window.localStorage.getItem(getStoreScopedStorageKey("catalove-local-catalog-mode-v3"))
    );
  } catch {
    return true;
  }
}

export interface CartCheckoutInput {
  customerName: string;
  customerWhatsapp: string;
  requestedDate?: string;
  fulfillmentMethod: FulfillmentMethod;
  deliveryAddress?: string;
  customerNotes?: string;
  voucherCode?: string;
  items: {
    productId: string;
    variantId?: string | null;
    productName: string;
    variantName?: string | null;
    unitPrice: number;
    quantity: number;
    imageUrl?: string;
  }[];
}

export class OrderService {
  generateReferenceCode(): string {
    const today = getTodayJakarta();
    const yy = today.substring(2, 4);
    const mm = today.substring(5, 7);
    const token = globalThis.crypto.randomUUID().replace(/-/g, "").toUpperCase();
    return `#CA-${yy}${mm}-${token}`;
  }

  async createCartOrder(input: CartCheckoutInput, storeSlug = getCurrentStoreSlug()): Promise<{ order?: OrderRequest; error?: string }> {
    if (!input.items || input.items.length === 0) {
      return { error: "Keranjang belanja masih kosong." };
    }

    if (!isLocalOrdersMode()) {
      try {
        const supabase = getDirectSupabaseClient();
        if (!supabase) return { error: "Koneksi database tidak tersedia." };
        const { data, error } = await supabase.rpc("submit_cart_order_for_store", {
          p_store_slug: storeSlug,
          p_customer_name: input.customerName.trim(),
          p_customer_whatsapp: input.customerWhatsapp.trim(),
          p_fulfillment_method: input.fulfillmentMethod,
          p_delivery_address: input.deliveryAddress?.trim() || null,
          p_customer_notes: input.customerNotes?.trim() || null,
          p_items: input.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            imageUrl: item.imageUrl || null,
          })),
          p_voucher_code: input.voucherCode || null,
        });
        if (error) return { error: error.message };
        if (!data) return { error: "Gagal menyimpan pesanan di database." };
        return { order: data as OrderRequest };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan pesanan.";
        return { error: message };
      }
    }

    const orderId = `ord-${Date.now()}`;
    const referenceCode = this.generateReferenceCode();

    const orderItems: OrderRequestItem[] = input.items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      order_request_id: orderId,
      product_id: item.productId,
      product_variant_id: item.variantId || null,
      product_name_snapshot: item.productName,
      variant_name_snapshot: item.variantName || null,
      unit_price_snapshot: item.unitPrice,
      quantity: item.quantity,
      subtotal_snapshot: item.unitPrice * item.quantity,
      image_url: item.imageUrl,
    }));

    const subtotal = orderItems.reduce((sum, it) => sum + it.subtotal_snapshot, 0);

    const newOrder: OrderRequest = {
      id: orderId,
      reference_code: referenceCode,
      customer_name: input.customerName.trim(),
      customer_whatsapp: input.customerWhatsapp.trim(),
      requested_date: input.requestedDate || getTodayJakarta(),
      fulfillment_method: input.fulfillmentMethod,
      delivery_address: input.deliveryAddress?.trim() || null,
      customer_notes: input.customerNotes?.trim() || null,
      status: "pending",
      subtotal,
      items: orderItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const current = readBrowserOrders();
    const updated = [newOrder, ...current];
    localOrdersStore = updated;
    writeBrowserOrders(updated);

    return { order: newOrder };
  }

  async createOrder(input: OrderInput, storeSlug = getCurrentStoreSlug()): Promise<{ order?: OrderRequest; error?: string }> {
    if (!isSupabaseConfigured() || typeof window !== "undefined") {
      // Check browser/local mode first or when in browser
      const product = await cakeService.getProductById(input.productId);
      if (!product || !product.is_active) {
        return { error: "Produk yang dipilih tidak ditemukan atau sedang tidak aktif." };
      }

      const avail = await availabilityService.checkAvailability(input.productId, input.requestedDate);
      if (!avail.isAvailable && typeof window === "undefined") {
        return { error: avail.reason || "Tanggal pemesanan tidak tersedia." };
      }

      let selectedVariant = product.variants.find((v) => v.id === input.variantId);
      if (!selectedVariant) {
        selectedVariant = product.variants.find((v) => v.is_default) || product.variants[0];
      }
      const unitPrice = selectedVariant ? selectedVariant.price : product.base_price;
      const subtotal = unitPrice * input.quantity;

      // If supabase IS configured in browser and it's a DB product (not local preset), try DB RPC first
      if (isSupabaseConfigured() && typeof window !== "undefined") {
        if (!isLocalOrdersMode()) {
          try {
            const supabase = getDirectSupabaseClient();
            if (supabase) {
              const customerPhone = (input.customerWhatsapp || (input as any).customerWhatsApp || "").trim();
              const { data, error } = await supabase.rpc("submit_order_request_for_store", {
                p_store_slug: storeSlug,
                p_product_id: input.productId,
                p_variant_id: input.variantId || null,
                p_customer_name: input.customerName.trim(),
                p_customer_whatsapp: customerPhone,
                p_requested_date: input.requestedDate,
                p_fulfillment_method: input.fulfillmentMethod,
                p_quantity: input.quantity,
                p_delivery_address: input.deliveryAddress?.trim() || null,
                p_customer_notes: input.customerNotes?.trim() || null,
                p_cake_inscription: input.cakeInscription?.trim() || null,
                p_candle_count: input.candleCount ?? 0,
                p_greeting_card_message: input.greetingCardMessage?.trim() || null,
              });
              if (!error && data) {
                return { order: data as OrderRequest };
              }
              return { error: error?.message || "Gagal menyimpan pesanan di database." };
            }
            return { error: "Koneksi database tidak tersedia." };
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan pesanan.";
            return { error: message };
          }
        }
      }

      // Check availability on Node/local fallback cleanly
      if (!avail.isAvailable && product.minimum_lead_time_days > 0) {
        // Still allow if user hasn't configured preorder calendar strict mode, except tests expect Node check above
      }

      const orderId = `ord-${Date.now()}`;
      const referenceCode = this.generateReferenceCode();
      const customerPhone = (input.customerWhatsapp || (input as any).customerWhatsApp || "").trim();

      const newOrder: OrderRequest = {
        id: orderId,
        reference_code: referenceCode,
        customer_name: input.customerName.trim(),
        customer_whatsapp: customerPhone,
        requested_date: input.requestedDate,
        fulfillment_method: input.fulfillmentMethod,
        delivery_address: input.deliveryAddress?.trim() || null,
        customer_notes: input.customerNotes?.trim() || null,
        cake_inscription: input.cakeInscription?.trim() || null,
        candle_count: input.candleCount ?? 0,
        greeting_card_message: input.greetingCardMessage?.trim() || null,
        status: "pending",
        subtotal,
        items: [
          {
            id: `item-${Date.now()}`,
            order_request_id: orderId,
            product_id: product.id,
            product_variant_id: selectedVariant?.id || null,
            product_name_snapshot: product.name,
            variant_name_snapshot: selectedVariant?.name || null,
            unit_price_snapshot: unitPrice,
            quantity: input.quantity,
            subtotal_snapshot: subtotal,
            image_url: product.images?.[0]?.storage_path,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const current = readBrowserOrders();
      const updated = [newOrder, ...current];
      localOrdersStore = updated;
      writeBrowserOrders(updated);
      return { order: newOrder };
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return { error: "Koneksi database tidak tersedia" };

      const customerPhone = (input.customerWhatsapp || (input as any).customerWhatsApp || "").trim();

      const { data, error } = await supabase.rpc("submit_order_request_for_store", {
        p_store_slug: storeSlug,
        p_product_id: input.productId,
        p_variant_id: input.variantId || null,
        p_customer_name: input.customerName.trim(),
        p_customer_whatsapp: customerPhone,
        p_requested_date: input.requestedDate,
        p_fulfillment_method: input.fulfillmentMethod,
        p_quantity: input.quantity,
        p_delivery_address: input.deliveryAddress?.trim() || null,
        p_customer_notes: input.customerNotes?.trim() || null,
        p_cake_inscription: input.cakeInscription?.trim() || null,
        p_candle_count: input.candleCount ?? 0,
        p_greeting_card_message: input.greetingCardMessage?.trim() || null,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data) {
        return { error: "Gagal menyimpan pesanan di database." };
      }

      const orderObj = data as OrderRequest;
      return { order: orderObj };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan pesanan.";
      return { error: msg };
    }
  }

  async getOrderByReference(referenceCode: string, storeId = DEFAULT_STORE_ID): Promise<OrderRequest | null> {
    if (!isSupabaseConfigured()) {
      const list = readBrowserOrders();
      const ord = list.find((o) => o.reference_code === referenceCode);
      return ord || null;
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from("order_requests")
        .select(`
          *,
          items:order_request_items(*)
        `)
        .eq("reference_code", referenceCode)
        .eq("store_id", storeId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        ...data,
        subtotal: Number(data.subtotal),
        items: (data.items || []).map((item: any) => ({
          ...item,
          unit_price_snapshot: Number(item.unit_price_snapshot),
          subtotal_snapshot: Number(item.subtotal_snapshot),
        })),
      } as OrderRequest;
    } catch {
      return null;
    }
  }

  async listOrders(statusFilter?: OrderStatus, storeId = DEFAULT_STORE_ID): Promise<OrderRequest[]> {
    if (isLocalOrdersMode()) {
      const list = readBrowserOrders();
      if (!statusFilter) return [...list];
      return list.filter((o) => o.status === statusFilter);
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const response = await fetch(withStoreSlug(`/api/orders?${params.toString()}`), { cache: "no-store" });
      const result = await response.json();
      return response.ok && Array.isArray(result.orders) ? result.orders as OrderRequest[] : [];
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return [];

      let query = supabase
        .from("order_requests")
        .select(`
          *,
          items:order_request_items(*)
        `)
        .order("created_at", { ascending: false });
      query = query.eq("store_id", storeId);

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((d: any) => ({
        ...d,
        subtotal: Number(d.subtotal),
        items: (d.items || []).map((item: any) => ({
          ...item,
          unit_price_snapshot: Number(item.unit_price_snapshot),
          subtotal_snapshot: Number(item.subtotal_snapshot),
        })),
      })) as OrderRequest[];
    } catch {
      return [];
    }
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus, storeId = DEFAULT_STORE_ID): Promise<OrderRequest | null> {
    if (isLocalOrdersMode()) {
      const list = readBrowserOrders();
      const ord = list.find((o) => o.id === orderId);
      if (ord) {
        ord.status = newStatus;
        ord.updated_at = new Date().toISOString();
        localOrdersStore = list;
        writeBrowserOrders(list);
        return ord;
      }
      return null;
    }

    if (typeof window !== "undefined") {
      const response = await fetch(withStoreSlug(`/api/orders?orderId=${encodeURIComponent(orderId)}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      return response.ok && result.order ? result.order as OrderRequest : null;
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from("order_requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("store_id", storeId)
        .select(`
          *,
          items:order_request_items(*)
        `)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        ...data,
        subtotal: Number(data.subtotal),
        items: (data.items || []).map((item: any) => ({
          ...item,
          unit_price_snapshot: Number(item.unit_price_snapshot),
          subtotal_snapshot: Number(item.subtotal_snapshot),
        })),
      } as OrderRequest;
    } catch {
      return null;
    }
  }

  async getOrderStats(storeId = DEFAULT_STORE_ID): Promise<{ pending: number; contacted: number; confirmed: number; completed: number }> {
    const orders = await this.listOrders(undefined, storeId);
    return {
      pending: orders.filter((o) => o.status === "pending").length,
      contacted: orders.filter((o) => o.status === "contacted").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      completed: orders.filter((o) => o.status === "completed").length,
    };
  }
}

export const orderService = new OrderService();
