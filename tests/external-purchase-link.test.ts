import assert from "node:assert/strict";
import { ProductInputSchema } from "../src/lib/validators/product";

const baseProduct = {
  name: "Panduan Membuat Roti",
  description: "Panduan digital untuk belajar membuat roti rumahan.",
  base_price: 50000,
  minimum_lead_time_days: 0,
  external_checkout_url: "https://pay.example.test/product/roti",
};

const withExternalCheckout = ProductInputSchema.parse(baseProduct);
assert.equal(
  withExternalCheckout.external_checkout_url,
  "https://pay.example.test/product/roti",
  "the product schema must preserve a seller-managed checkout URL",
);
assert.equal(
  ProductInputSchema.parse({ ...baseProduct, external_checkout_url: "https://pay.example.test/a b" }).external_checkout_url,
  "https://pay.example.test/a%20b",
  "the URL must be normalized before it is saved",
);

assert.throws(
  () => ProductInputSchema.parse({ ...baseProduct, external_checkout_url: "javascript:alert(1)" }),
  "external checkout must reject executable URL schemes",
);
assert.throws(
  () => ProductInputSchema.parse({ ...baseProduct, external_checkout_url: "http://pay.example.test" }),
  "external checkout must require HTTPS",
);
assert.throws(
  () => ProductInputSchema.parse({ ...baseProduct, external_checkout_url: "https://buyer:secret@pay.example.test/item" }),
  "external checkout URLs must not embed credentials",
);
assert.equal(
  ProductInputSchema.parse({ ...baseProduct, external_checkout_url: "  " }).external_checkout_url,
  null,
  "an empty checkout link must clear an existing destination",
);

console.log("✅ Product checkout links are retained only for secure HTTPS destinations");

void (async () => {
  const utility = await import("../src/lib/utils/external-checkout").catch(() => null);
  assert.ok(utility, "a shared safe URL parser must protect database-sourced links at render time");
  assert.equal(
    utility.safeExternalCheckoutUrl(" https://pay.example.test/product/roti "),
    "https://pay.example.test/product/roti",
  );
  assert.equal(utility.safeExternalCheckoutUrl("javascript:alert(1)"), null);
  assert.equal(utility.safeExternalCheckoutUrl("https://user:pass@pay.example.test"), null);
})();
