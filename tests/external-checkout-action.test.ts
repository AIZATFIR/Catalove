import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

void (async () => {
  const checkoutActionModule = await import("../src/components/storefront/ExternalCheckoutAction").catch(() => null);
  assert.ok(checkoutActionModule, "product pages need a reusable seller-managed checkout action");

  const html = renderToStaticMarkup(createElement(checkoutActionModule.ExternalCheckoutAction, {
    checkoutUrl: "https://pay.example.test/product/roti",
    storeName: "Roti Pagi",
    sellerWhatsApp: "081234567890",
  }));

  assert.match(html, /href="https:\/\/pay\.example\.test\/product\/roti"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer external"/);
  assert.match(html, /Checkout dibuka di.*pay\.example\.test/);
  assert.match(html, /Catalove tidak menerima pembayaran/);
  assert.match(html, /Tanya seller via WhatsApp/);

  const unsafeHtml = renderToStaticMarkup(createElement(checkoutActionModule.ExternalCheckoutAction, {
    checkoutUrl: "javascript:alert(1)",
    storeName: "Roti Pagi",
    sellerWhatsApp: null,
  }));
  assert.doesNotMatch(unsafeHtml, /javascript:/);
  assert.doesNotMatch(unsafeHtml, /Lanjut ke checkout seller/);
  console.log("✅ Seller checkout action renders safe links and clear responsibility copy");
})();
