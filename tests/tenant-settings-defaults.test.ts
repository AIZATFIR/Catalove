import assert from "node:assert/strict";
import { getTenantTextSettingFallback } from "../src/lib/tenant-settings-defaults";

assert.equal(getTenantTextSettingFallback("hero_title", "Toko Kue Murni"), "Toko Kue Murni");
assert.equal(getTenantTextSettingFallback("nav_cta_text", "Toko Kue Murni"), "Hubungi Kami");
assert.equal(getTenantTextSettingFallback("catalog_title", "Toko Kue Murni"), "Produk Kami");
assert.equal(getTenantTextSettingFallback("story_p1", "Toko Kue Murni")?.includes("Catalove"), false);
assert.equal(getTenantTextSettingFallback("footer_tagline", "Toko Kue Murni"), "Katalog resmi Toko Kue Murni.");
assert.equal(getTenantTextSettingFallback("unknown_setting", "Toko Kue Murni"), undefined);

console.log("✅ Tenant storefront defaults use merchant copy instead of Catalove marketing copy");
