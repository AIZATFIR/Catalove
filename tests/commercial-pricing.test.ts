import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/storefront/PricingSection.tsx"), "utf8");
const hero = readFileSync(join(process.cwd(), "src/components/storefront/Hero.tsx"), "utf8");
const navbar = readFileSync(join(process.cwd(), "src/components/storefront/Navbar.tsx"), "utf8");
const faq = readFileSync(join(process.cwd(), "src/components/storefront/CustomCanvasSections.tsx"), "utf8");
const cart = readFileSync(join(process.cwd(), "src/components/storefront/CartDrawer.tsx"), "utf8");
const privacy = readFileSync(join(process.cwd(), "src/app/(storefront)/privacy/page.tsx"), "utf8");

assert.match(source, /tanpa iklan pihak ketiga di tokomu/i);
assert.match(source, /href="\/admin\/register"[\s\S]*?Coba gratis/);
assert.match(hero, /href="\/admin\/register"[\s\S]*?primaryCta/);
assert.match(navbar, /href="\/admin\/register"[\s\S]*?Buat katalog/);
assert.match(hero, /Katalog online yang terasa seperti brandmu\./);
assert.match(source, /Maksimal 25 produk dan 50 foto \(2 MiB per foto, total 100 MiB\)/);
assert.match(source, /Business/);
assert.match(source, /Enterprise/);
assert.match(source, /Harga mulai\. Periode tagihan dan scope final ditulis di penawaran/);
assert.match(source, /Hosting bersama Catalove belum termasuk harga mulai/);
assert.match(source, /Pilih Business atau Enterprise[\s\S]*?penawaran tertulis/);
assert.match(source, /Hosting dikelola Catalove; biaya bulanan server ditulis terpisah/);
assert.match(source, /Belum ada pembayaran atau tagihan otomatis di website/);
assert.match(source, /openCataloveWhatsApp\(selectedPlan\)/);
assert.doesNotMatch(source, /Paket gratis didukung iklan platform/i);
assert.doesNotMatch(source, /Harga final dibahas lewat WhatsApp/);
assert.match(faq, /Pelanggan tetap perlu menekan tombol Kirim di WhatsApp/);
assert.match(faq, /periode tagihan, hosting/);
assert.match(cart, /Checkout mencatat nama, nomor WhatsApp/);
assert.match(privacy, /Preview Catalove/);
assert.match(privacy, /Jangan masukkan alamat, nomor WhatsApp, atau catatan milik pembeli sungguhan/i);
assert.match(privacy, /paket Free/i);
assert.match(privacy, /Supabase/);
assert.match(privacy, /Cloud Run belum dikonfigurasi/);

console.log("✅ Commercial pricing copy matches the current free caps and WhatsApp quote policy");
