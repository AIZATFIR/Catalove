import assert from "node:assert";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "../src/lib/utils/whatsapp";
import { buildCataloveInquiryWhatsAppUrl } from "../src/lib/utils/catalove-whatsapp";
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
assert.ok(url.startsWith("https://wa.me/6281234567890?text="), "URL must format with wa.me and phone");

const genericInquiry = buildCataloveInquiryWhatsAppUrl("+62 859-4668-9168");
assert.ok(genericInquiry.startsWith("https://wa.me/6285946689168?text="), "Inquiry URL must use the configured phone digits");
assert.ok(decodeURIComponent(genericInquiry.split("?text=")[1]).includes("paket"), "Generic inquiry must ask about Catalove packages");
assert.ok(decodeURIComponent(genericInquiry.split("?text=")[1]).includes("hosting/domain"), "Generic inquiry must ask for hosting and domain details");

const businessInquiry = buildCataloveInquiryWhatsAppUrl("628111222333", "business");
assert.ok(decodeURIComponent(businessInquiry.split("?text=")[1]).includes("Business"), "Business inquiry must name the selected package");
assert.ok(decodeURIComponent(businessInquiry.split("?text=")[1]).includes("Rp299rb"), "Business inquiry must include its starting price");

const enterpriseInquiry = buildCataloveInquiryWhatsAppUrl("628111222333", "enterprise");
assert.ok(decodeURIComponent(enterpriseInquiry.split("?text=")[1]).includes("Enterprise"), "Enterprise inquiry must name the selected package");
assert.ok(decodeURIComponent(enterpriseInquiry.split("?text=")[1]).includes("Rp799rb"), "Enterprise inquiry must include its starting price");

console.log("✅ All WhatsApp URL tests passed!");
