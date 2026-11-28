import { FulfillmentMethod, OrderRequest } from "@/types/bakery";
import { formatPrice, formatDateIndonesian } from "./formatters";
import { INITIAL_SETTINGS } from "@/lib/data/universal-presets";
import { normalizeWhatsAppNumber } from "@/lib/utils/store-whatsapp";

function formatFulfillmentLabel(method: FulfillmentMethod): string {
  switch (method) {
    case "pickup":
      return "Ambil di Toko (Pickup)";
    case "shipping":
      return "Ekspedisi (Shipping)";
    case "delivery":
    default:
      return "Kurir Instan (Delivery)";
  }
}

export function buildWhatsAppMessage(
  order: OrderRequest,
  storeName: string = INITIAL_SETTINGS.store_name || "Catalove",
  currencySymbol: string = INITIAL_SETTINGS.currency_symbol || "Rp"
): string {
  const item = order.items?.[0];
  const variantText = item?.variant_name_snapshot ? `Varian: ${item.variant_name_snapshot}\n` : "";
  const notesText = order.cake_inscription
    ? `Catatan Personal: "${order.cake_inscription}"${
        order.candle_count ? ` (${order.candle_count} lilin)` : ""
      }\n`
    : order.customer_notes
    ? `Catatan: ${order.customer_notes}\n`
    : "";

  const methodText = formatFulfillmentLabel(order.fulfillment_method);
  const addressText = order.delivery_address ? `Alamat: ${order.delivery_address}\n` : "";
  const dateText = order.requested_date
    ? `Tanggal diinginkan: ${formatDateIndonesian(order.requested_date)}\n`
    : "";

  if (order.items && order.items.length > 1) {
    const itemsList = order.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.product_name_snapshot}${
            it.variant_name_snapshot ? ` (${it.variant_name_snapshot})` : ""
          } × ${it.quantity} = ${formatPrice(it.subtotal_snapshot, currencySymbol)}`
      )
      .join("\n");

    return `Halo ${storeName}, saya ingin mengajukan pesanan.

ID Permintaan: ${order.reference_code}
Nama: ${order.customer_name}

Daftar Pesanan:
${itemsList}

${dateText}Metode: ${methodText}
${addressText}${notesText}Estimasi subtotal: ${formatPrice(order.subtotal, currencySymbol)}

Mohon konfirmasi ketersediaan dan detail pesanannya. Terima kasih.`;
  }

  return `Halo ${storeName}, saya ingin mengajukan pesanan.

ID Permintaan: ${order.reference_code}
Nama: ${order.customer_name}
Produk: ${item?.product_name_snapshot || "Produk Katalog"}
${variantText}Jumlah: ${item?.quantity || 1}
${dateText}Metode: ${methodText}
${addressText}${notesText}Estimasi subtotal: ${formatPrice(order.subtotal, currencySymbol)}

Mohon konfirmasi ketersediaan dan detail pesanannya. Terima kasih.`;
}

export function buildWhatsAppUrl(
  order: OrderRequest,
  phoneNumber: string = INITIAL_SETTINGS.seller_whatsapp,
  storeName: string = INITIAL_SETTINGS.store_name || "Catalove",
  currencySymbol: string = INITIAL_SETTINGS.currency_symbol || "Rp"
): string | null {
  const cleanPhone = normalizeWhatsAppNumber(phoneNumber);
  if (!cleanPhone) return null;
  const message = buildWhatsAppMessage(order, storeName, currencySymbol);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface CartWhatsAppPayload {
  storeName: string;
  whatsappNumber: string;
  currencySymbol?: string;
  referenceCode?: string;
  customerName: string;
  customerPhone: string;
  deliveryType: FulfillmentMethod;
  deliveryAddress?: string;
  notes?: string;
  items: {
    name: string;
    variantName?: string;
    quantity: number;
    subtotal: number;
  }[];
  totalAmount: number;
}

export function generateCartWhatsAppUrl(payload: CartWhatsAppPayload): string | null {
  const symbol = payload.currencySymbol || "Rp";
  const cleanPhone = normalizeWhatsAppNumber(payload.whatsappNumber);
  if (!cleanPhone) return null;
  const itemsText = payload.items
    .map(
      (it, idx) =>
        `${idx + 1}. ${it.name}${it.variantName ? ` (${it.variantName})` : ""} × ${it.quantity} = ${formatPrice(
          it.subtotal,
          symbol
        )}`
    )
    .join("\n");

  const refLine = payload.referenceCode ? `ID Pesanan: ${payload.referenceCode}\n` : "";
  const addressLine = payload.deliveryAddress ? `Alamat: ${payload.deliveryAddress}\n` : "";
  const notesLine = payload.notes ? `Catatan: ${payload.notes}\n` : "";

  const message = `Halo ${payload.storeName}, saya ingin checkout keranjang belanja saya:

${refLine}Nama: ${payload.customerName}
WhatsApp: ${payload.customerPhone}

Item Pesanan:
${itemsText}

Metode: ${formatFulfillmentLabel(payload.deliveryType)}
${addressLine}${notesLine}Total Estimasi: ${formatPrice(payload.totalAmount, symbol)}

Mohon konfirmasi total akhir dan info pembayarannya. Terima kasih!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildQuickProductWhatsAppUrl(params: {
  storeName: string;
  whatsappNumber: string;
  productName: string;
  variantName?: string;
  price: number;
  currencySymbol?: string;
  isInquiry?: boolean;
}): string | null {
  const cleanPhone = normalizeWhatsAppNumber(params.whatsappNumber);
  if (!cleanPhone) return null;
  const formatted = formatPrice(params.price, params.currencySymbol || "Rp");
  const variantLine = params.variantName ? ` (Varian: ${params.variantName})` : "";
  const message = params.isInquiry
    ? `Halo ${params.storeName}, saya tertarik berkonsultasi mengenai layanan/produk "${params.productName}"${variantLine} (estimasi ${formatted}). Boleh info detail dan slot yang tersedia?`
    : `Halo ${params.storeName}, saya ingin memesan:\nProduk: ${params.productName}${variantLine}\nHarga: ${formatted}\nApakah masih tersedia?`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
