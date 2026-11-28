import assert from "node:assert";
import { cakeService } from "../src/lib/services/cake-service";
import { availabilityService } from "../src/lib/services/availability-service";
import { orderService } from "../src/lib/services/order-service";
import { formatIDR, getTodayJakarta, addDays } from "../src/lib/utils/formatters";

async function runTests() {
  console.log("Running services.test.ts...");

  // 1. Test getProducts
  const products = await cakeService.getProducts();
  assert.ok(products.length >= 5, "Should have seeded products");
  const sample = await cakeService.getProductBySlug("sample-01-apparel");
  assert.ok(sample !== null, "Catalove demo product should be found by slug");
  assert.strictEqual(sample?.name, "Sample 01 — Apparel");

  // 2. Test formatIDR
  assert.strictEqual(formatIDR(245000), "Rp 245.000");

  // 3. Test Availability checking
  const today = getTodayJakarta();
  const invalidDate = addDays(today, -1);
  const validFutureDate = addDays(today, 3);

  const checkPast = await availabilityService.checkAvailability(sample!.id, invalidDate);
  assert.strictEqual(checkPast.isAvailable, false, "Past dates should be rejected");

  const checkFuture = await availabilityService.checkAvailability(sample!.id, validFutureDate);
  assert.strictEqual(checkFuture.isAvailable, true, "Future date H-3 should be available");

  // Test date override (e.g. sold out)
  await availabilityService.setAvailability(sample!.id, validFutureDate, "sold_out");
  const checkOverridden = await availabilityService.checkAvailability(sample!.id, validFutureDate);
  assert.strictEqual(checkOverridden.isAvailable, false, "Overridden sold_out date should be unavailable");

  // Reset override
  await availabilityService.setAvailability(sample!.id, validFutureDate, "available");

  // 4. Test Order Creation
  const newOrderRes = await orderService.createOrder({
    productId: sample!.id,
    quantity: 1,
    customerName: "Ahmad Dani",
    customerWhatsapp: "081234567890",
    requestedDate: validFutureDate,
    fulfillmentMethod: "pickup",
    candleCount: 0,
  });

  assert.ok(newOrderRes.order, "Order should be created successfully");
  assert.match(newOrderRes.order!.reference_code, /^#CA-\d{4}-[A-F0-9]{32}$/i, "Reference codes must be unguessable tokens");
  assert.strictEqual(newOrderRes.order!.status, "pending");

  // 5. Test Order Status Update
  const updated = await orderService.updateOrderStatus(newOrderRes.order!.id, "confirmed");
  assert.strictEqual(updated?.status, "confirmed");

  // 6. Test Product CRUD (Create, Read, Update, Delete)
  const createdProduct = await cakeService.createProduct({
    name: "Studio Tote Bag",
    category_id: "cat-lifestyle-apparel",
    description: "Tas kanvas untuk aktivitas sehari-hari.",
    base_price: 185000,
    external_checkout_url: "https://checkout.example.test/tote",
    minimum_lead_time_days: 1,
    is_active: true,
    is_featured: false,
    flavor_notes: ["Kanvas tebal", "Muatan luas"],
    specs: [],
    variants: [
      { name: "Ukuran 18cm", price: 185000, is_default: true, display_order: 1 },
      { name: "Ukuran 22cm", price: 275000, is_default: false, display_order: 2 },
    ],
    images: [
      {
        storage_path: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
        alt_text: "Studio Tote Bag",
        is_primary: true,
        display_order: 1,
      },
    ],
  });

  assert.ok(createdProduct.id, "Product should have an id");
  assert.strictEqual(createdProduct.name, "Studio Tote Bag");
  assert.strictEqual(createdProduct.variants.length, 2);
  assert.strictEqual(createdProduct.external_checkout_url, "https://checkout.example.test/tote");

  // Update Product
  const updatedProduct = await cakeService.updateProduct(createdProduct.id, {
    name: "Studio Tote Bag Premium",
    base_price: 195000,
  });
  assert.strictEqual(updatedProduct?.name, "Studio Tote Bag Premium");
  assert.strictEqual(updatedProduct?.base_price, 195000);
  assert.strictEqual(updatedProduct?.external_checkout_url, "https://checkout.example.test/tote");

  const clearedCheckout = await cakeService.updateProduct(createdProduct.id, { external_checkout_url: null });
  assert.strictEqual(clearedCheckout?.external_checkout_url, undefined, "seller can remove an external checkout destination");

  // Delete Product
  const deleteRes = await cakeService.deleteProduct(createdProduct.id);
  assert.strictEqual(deleteRes.success, true);
  const deletedCheck = await cakeService.getProductById(createdProduct.id);
  assert.strictEqual(deletedCheck, null, "Deleted product should no longer be found");

  console.log("✅ All service tests passed (including full Product CRUD)!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
