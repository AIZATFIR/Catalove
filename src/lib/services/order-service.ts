import { OrderRequest, OrderStatus } from "@/types/bakery";
import { OrderInput } from "@/lib/validators/order";
import { cakeService } from "./cake-service";
import { availabilityService } from "./availability-service";
import { getTodayJakarta } from "@/lib/utils/formatters";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@supabase/supabase-js";

// In-memory orders store used ONLY when Supabase is not configured (local dev & testing)
let localOrdersStore: OrderRequest[] = [
  {
    id: "ord-sample-1",
    reference_code: "#SC-2610-1042",
    customer_name: "Nadya Putri",
    customer_whatsapp: "081298765432",
    requested_date: "2026-10-30",
    fulfillment_method: "pickup",
    cake_inscription: "Selamat Ulang Tahun Papa!",
    candle_count: 5,
    greeting_card_message: "Sehat selalu dan panjang umur, dari anak-anak tercinta.",
    status: "pending",
    subtotal: 245000,
    items: [
      {
        id: "item-sample-1",
        order_request_id: "ord-sample-1",
        product_id: "prod-basque-cheesecake",
        product_variant_id: "var-basque-16",
        product_name_snapshot: "Basque Burnt Cheesecake Caramel",
        variant_name_snapshot: "Diameter 16cm (4-6 Porsi)",
        unit_price_snapshot: 245000,
        quantity: 1,
        subtotal_snapshot: 245000,
      },
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];

function getDirectSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export class OrderService {
  generateReferenceCode(): string {
    const today = getTodayJakarta();
    const yy = today.substring(2, 4);
    const mm = today.substring(5, 7);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `#SC-${yy}${mm}-${random}`;
  }

  async createOrder(input: OrderInput): Promise<{ order?: OrderRequest; error?: string }> {
    if (!isSupabaseConfigured()) {
      // 1. Verify product exists
      const product = await cakeService.getProductById(input.productId);
      if (!product || !product.is_active) {
        return { error: "Produk yang dipilih tidak ditemukan atau sedang tidak aktif." };
      }

      // 2. Verify availability
      const avail = await availabilityService.checkAvailability(input.productId, input.requestedDate);
      if (!avail.isAvailable) {
        return { error: avail.reason || "Tanggal pemesanan tidak tersedia." };
      }

      // 3. Determine variant and price
      let selectedVariant = product.variants.find((v) => v.id === input.variantId);
      if (!selectedVariant) {
        selectedVariant = product.variants.find((v) => v.is_default) || product.variants[0];
      }
      const unitPrice = selectedVariant ? selectedVariant.price : product.base_price;
      const subtotal = unitPrice * input.quantity;

      // 4. Create Order in local memory
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
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      localOrdersStore.unshift(newOrder);
      return { order: newOrder };
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return { error: "Koneksi database tidak tersedia" };

      const customerPhone = (input.customerWhatsapp || (input as any).customerWhatsApp || "").trim();

      // Call database atomic RPC function which enforces lead times, quotas, advisory lock, and sequence
      const { data, error } = await supabase.rpc("submit_order_request", {
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

  async getOrderByReference(referenceCode: string): Promise<OrderRequest | null> {
    if (!isSupabaseConfigured()) {
      const ord = localOrdersStore.find((o) => o.reference_code === referenceCode);
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
        .maybeSingle();

      if (error || !data) {
        const local = localOrdersStore.find((o) => o.reference_code === referenceCode);
        return local || null;
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
      const local = localOrdersStore.find((o) => o.reference_code === referenceCode);
      return local || null;
    }
  }

  async listOrders(statusFilter?: OrderStatus): Promise<OrderRequest[]> {
    if (!isSupabaseConfigured()) {
      if (!statusFilter) return [...localOrdersStore];
      return localOrdersStore.filter((o) => o.status === statusFilter);
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

  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<OrderRequest | null> {
    if (!isSupabaseConfigured()) {
      const ord = localOrdersStore.find((o) => o.id === orderId);
      if (ord) {
        ord.status = newStatus;
        ord.updated_at = new Date().toISOString();
        return ord;
      }
      return null;
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
        .select(`
          *,
          items:order_request_items(*)
        `)
        .single();

      if (error || !data) return null;

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

  async getOrderStats(): Promise<{ pending: number; contacted: number; confirmed: number; completed: number }> {
    const orders = await this.listOrders();
    return {
      pending: orders.filter((o) => o.status === "pending").length,
      contacted: orders.filter((o) => o.status === "contacted").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      completed: orders.filter((o) => o.status === "completed").length,
    };
  }
}

export const orderService = new OrderService();
