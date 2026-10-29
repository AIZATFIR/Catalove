import { OrderRequest } from "@/types/bakery";
import { formatIDR, formatDateIndonesian } from "./formatters";
import { INITIAL_SETTINGS } from "@/lib/data/seed-cakes";

export function buildWhatsAppMessage(
  order: OrderRequest,
  storeName: string = INITIAL_SETTINGS.store_name || "Catalove"
): string {
  const item = order.items?.[0];
  const variantText = item?.variant_name_snapshot ? `Varian: ${item.variant_name_snapshot}\n` : "";
  const notesText = order.cake_inscription
    ? `Catatan/Tulisan: "${order.cake_inscription}"${order.candle_count ? ` (${order.candle_count} lilin)` : ""}\n`
    : order.customer_notes
    ? `Catatan: ${order.customer_notes}\n`
    : "";

  const methodText =
    order.fulfillment_method === "pickup"
      ? "Ambil Sendiri di Dapur"
      : order.fulfillment_method === "shipping"
      ? "Ekspedisi / Pengiriman Luar Kota"
      : "Pengantaran Kurir";
  const addressText = order.delivery_address ? `Alamat: ${order.delivery_address}\n` : "";
  const dateText = order.requested_date ? `Tanggal yang diinginkan: ${formatDateIndonesian(order.requested_date)}\n` : "";

  if (order.items && order.items.length > 1) {
    const itemsList = order.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.product_name_snapshot}${
            it.variant_name_snapshot ? ` (${it.variant_name_snapshot})` : ""
          } × ${it.quantity} = ${formatIDR(it.subtotal_snapshot)}`
      )
      .join("\n");

    return `Halo ${storeName}, saya ingin mengajukan pesanan.

ID Permintaan: ${order.reference_code}
Nama: ${order.customer_name}

Daftar Pesanan:
${itemsList}

${dateText}Metode: ${methodText}
${addressText}${notesText}Estimasi subtotal: ${formatIDR(order.subtotal)}

Mohon konfirmasi ketersediaan dan detail pesanannya. Terima kasih.`;
  }

  return `Halo ${storeName}, saya ingin mengajukan pesanan.

ID Permintaan: ${order.reference_code}
Nama: ${order.customer_name}
Kue: ${item?.product_name_snapshot || "Produk Katalog"}
${variantText}Jumlah: ${item?.quantity || 1}
${dateText}Metode: ${methodText}
${addressText}${notesText}Estimasi subtotal: ${formatIDR(order.subtotal)}

Mohon konfirmasi ketersediaan dan detail pengambilannya. Terima kasih.`;
}

export function buildWhatsAppUrl(
  order: OrderRequest,
  phoneNumber: string = INITIAL_SETTINGS.seller_whatsapp,
  storeName: string = INITIAL_SETTINGS.store_name || "Catalove"
): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  const message = buildWhatsAppMessage(order, storeName);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
