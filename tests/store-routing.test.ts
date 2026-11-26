import assert from "node:assert/strict";
import { getStoreScopedStorageKey, getStoreSlugFromPath, getStorefrontNavigationLinks, getStorefrontPath, isTenantStorefrontPath } from "../src/lib/store-routing";
import { getAllowedStorefrontSections, getStorefrontSectionOrder } from "../src/lib/storefront-sections";

assert.equal(getStoreSlugFromPath("/"), "catalove");
assert.equal(getStoreSlugFromPath("/s/toko-kue/catalog"), "toko-kue");
assert.equal(getStoreSlugFromPath("/s/UPPERCASE/product/a"), "catalove");
assert.equal(getStoreSlugFromPath("/s/../admin"), "catalove");
assert.equal(getStorefrontPath("/catalog", "toko-kue"), "/s/toko-kue/catalog");
assert.equal(getStorefrontPath("/catalog", "catalove"), "/catalog");
assert.equal(isTenantStorefrontPath("/s/toko-kue"), true);
assert.equal(isTenantStorefrontPath("/s/catalove/catalog"), true);
assert.equal(isTenantStorefrontPath("/catalog"), false);
assert.equal(isTenantStorefrontPath("/"), false);
assert.deepEqual(
  getStorefrontNavigationLinks("/s/toko-kue"),
  [
    { href: "/#discovery-feed", label: "Katalog" },
    { href: "/catalog", label: "Semua Produk" },
    { href: "/bio", label: "Bio" },
  ],
  "merchant catalogs must not link their customers to Catalove package pricing"
);
const allSections = ["hero", "feed", "collection_index", "pricing"] as const;
const allSectionIds = new Set(allSections);
assert.deepEqual(
  getStorefrontSectionOrder("/s/toko-kue", ["hero", "pricing", "feed"], allSectionIds, ["hero", "pricing", "feed"]),
  ["hero", "feed"],
  "tenant catalogs must never inherit Catalove's platform pricing section"
);
assert.deepEqual(
  getStorefrontSectionOrder("/s/toko-kue", ["pricing"], allSectionIds, ["hero", "pricing", "feed"]),
  ["hero", "feed", "collection_index"],
  "tenant catalogs with no usable saved sections must fall back to product catalog sections"
);
assert.deepEqual(
  getAllowedStorefrontSections("/s/toko-kue", allSections.map((id) => ({ id }))).map((section) => section.id),
  ["hero", "feed", "collection_index"],
  "tenant canvas must not offer Catalove's platform pricing section"
);
assert.deepEqual(
  getAllowedStorefrontSections("/", allSections.map((id) => ({ id }))).map((section) => section.id),
  allSections,
  "Catalove's own homepage must retain its plan comparison section"
);
assert.equal(getStoreScopedStorageKey("cart", "tenant-a"), "cart:tenant-a");
assert.notEqual(getStoreScopedStorageKey("cart", "tenant-a"), getStoreScopedStorageKey("cart", "tenant-b"));

console.log("✅ Storefront tenant routing checks passed");
