import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/storefront/PricingSection.tsx"), "utf8");
const faq = readFileSync(join(process.cwd(), "src/components/storefront/CustomCanvasSections.tsx"), "utf8");
const cart = readFileSync(join(process.cwd(), "src/components/storefront/CartDrawer.tsx"), "utf8");
const privacy = readFileSync(join(process.cwd(), "src/app/(storefront)/privacy/page.tsx"), "utf8");

assert.match(source, /tanpa iklan pihak ketiga di tokomu/i);
assert.match(source, /Maksimal 25 produk dan 50 foto \(2 MiB per foto, total 100 MiB\)/);
assert.match(source, /Business/);
assert.match(source, /Enterprise/);
assert.match(source, /Harga mulai; scope, biaya rutin, dan hosting dibahas via WhatsApp/);
assert.doesNotMatch(source, /Paket gratis didukung iklan platform/i);
assert.doesNotMatch(source, /Harga final dibahas lewat WhatsApp/);
assert.match(faq, /Pelanggan tetap perlu menekan tombol Kirim di WhatsApp/);
assert.match(faq, /periode tagihan, hosting/);
assert.match(cart, /Checkout mencatat nama, nomor WhatsApp/);
assert.match(privacy, /Mode demo/);
assert.match(privacy, /jangan masukkan data pesanan atau pelanggan sungguhan/i);
assert.match(privacy, /Target infrastruktur produksi/);
assert.match(privacy, /Supabase/);
assert.match(privacy, /Google Cloud Run/);

console.log("✅ Commercial pricing copy matches the current free caps and WhatsApp quote policy");
