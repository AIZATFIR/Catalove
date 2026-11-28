import assert from "node:assert";
import { buildWhatsAppMessage, buildWhatsAppUrl, buildQuickProductWhatsAppUrl, generateCartWhatsAppUrl } from "../src/lib/utils/whatsapp";
import { buildCataloveInquiryWhatsAppUrl } from "../src/lib/utils/catalove-whatsapp";
import { buildStoreContactWhatsAppUrl } from "../src/lib/utils/store-whatsapp";
import { OrderRequest } from "../src/types/bakery";

console.log("Running whatsapp-url.test.ts...");

const mockOrder: OrderRequest = {
  id: "ord-test-1",
  reference_code: "#CA-2610-0123456789abcdef0123456789abcdef",
  customer_name: "Sarah Wijaya",
  customer_whatsapp: "081234567890",
  requested_date: "2026-10-31",
  fulfillment_method: "pickup",
  cake_inscription: "Happy 25th Birthday Sarah",
  candle_count: 2,
  status: "pending",
  subtotal: 245000,
  items: [
    {
      id: "item-1",
      order_request_id: "ord-test-1",
      product_id: "prod-gen-1",
      product_name_snapshot: "Sample 01 — Apparel",
      variant_name_snapshot: "M",
      unit_price_snapshot: 245000,
      quantity: 1,
      subtotal_snapshot: 245000,
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const message = buildWhatsAppMessage(mockOrder);
assert.ok(message.includes(`ID Permintaan: ${mockOrder.reference_code}`), "Message must contain ID Permintaan");
assert.ok(message.includes("Nama: Sarah Wijaya"), "Message must contain customer name");
assert.ok(message.includes("Produk: Sample 01 — Apparel"), "Message must contain product name");
assert.ok(message.includes("Varian: M"), "Message must contain variant");
assert.ok(message.includes("Estimasi subtotal: Rp 245.000"), "Message must contain subtotal");
assert.ok(message.includes("Mohon konfirmasi"), "Message must contain confirmation request");

const url = buildWhatsAppUrl(mockOrder, "6281234567890");
assert.ok(url?.startsWith("https://wa.me/6281234567890?text="), "URL must format with wa.me and phone");
assert.equal(buildWhatsAppUrl(mockOrder, "", "Toko Klien"), null, "missing merchant phone must not use Catalove's phone");
assert.equal(buildQuickProductWhatsAppUrl({ storeName: "Toko Klien", whatsappNumber: "", productName: "Produk", price: 1 }), null);
assert.equal(generateCartWhatsAppUrl({ storeName: "Toko Klien", whatsappNumber: "", customerName: "A", customerPhone: "08123456789", deliveryType: "pickup", items: [], totalAmount: 0 }), null);

const genericInquiry = buildCataloveInquiryWhatsAppUrl("+62 859-4668-9168");
assert.ok(genericInquiry.startsWith("https://wa.me/6285946689168?text="), "Inquiry URL must use the configured phone digits");
assert.ok(decodeURIComponent(genericInquiry.split("?text=")[1]).includes("paket"), "Generic inquiry must ask about Catalove packages");
assert.ok(decodeURIComponent(genericInquiry.split("?text=")[1]).includes("server bersama yang dibayar ke Catalove"), "Inquiry must ask for the shared hosting fee paid to Catalove");
assert.ok(decodeURIComponent(genericInquiry.split("?text=")[1]).includes("domain khusus"), "Inquiry must ask for custom domain cost");
assert.ok(decodeURIComponent(genericInquiry.split("?text=")[1]).includes("periode tagihan"), "Generic inquiry must ask for billing cadence");
assert.ok(decodeURIComponent(genericInquiry.split("?text=")[1]).includes("belum menyetujui biaya"), "Inquiry must not imply the buyer has agreed to charges");

const businessInquiry = buildCataloveInquiryWhatsAppUrl("628111222333", "business");
assert.ok(decodeURIComponent(businessInquiry.split("?text=")[1]).includes("Business"), "Business inquiry must name the selected package");
assert.ok(decodeURIComponent(businessInquiry.split("?text=")[1]).includes("Rp299rb"), "Business inquiry must include its starting price");

const storeContact = buildStoreContactWhatsAppUrl("+62 812-3456-7890", "Toko Bunga Melati");
assert.ok(storeContact?.startsWith("https://wa.me/6281234567890?text="), "Store contact must use the merchant's own WhatsApp number");
assert.ok(decodeURIComponent(storeContact!.split("?text=")[1]).includes("Toko Bunga Melati"), "Store contact message must identify the merchant");
assert.equal(buildStoreContactWhatsAppUrl("", "Toko Bunga Melati"), null, "Missing merchant contact must not fall back to Catalove's WhatsApp");
assert.equal(buildStoreContactWhatsAppUrl("123", "Toko Bunga Melati"), null, "Invalid merchant number must not create a broken WhatsApp link");
assert.ok(buildStoreContactWhatsAppUrl("0812-3456-7890", "Toko Bunga Melati")?.startsWith("https://wa.me/6281234567890?text="), "Indonesian local phone numbers must be normalized to country code 62");

const enterpriseInquiry = buildCataloveInquiryWhatsAppUrl("628111222333", "enterprise");
assert.ok(decodeURIComponent(enterpriseInquiry.split("?text=")[1]).includes("Enterprise"), "Enterprise inquiry must name the selected package");
assert.ok(decodeURIComponent(enterpriseInquiry.split("?text=")[1]).includes("Rp799rb"), "Enterprise inquiry must include its starting price");

console.log("✅ All WhatsApp URL tests passed!");
