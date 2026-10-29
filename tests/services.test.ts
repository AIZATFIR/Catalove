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
  const basque = await cakeService.getProductBySlug("basque-burnt-cheesecake-caramel");
  assert.ok(basque !== null, "Basque cheesecake should be found by slug");
  assert.strictEqual(basque?.name, "Basque Burnt Cheesecake Caramel");

  // 2. Test formatIDR
  assert.strictEqual(formatIDR(245000), "Rp 245.000");

  // 3. Test Availability checking
  const today = getTodayJakarta();
  // Basque requires H-2
  const invalidDate = today;
  const validFutureDate = addDays(today, 3);

  const checkPastOrToday = await availabilityService.checkAvailability("prod-basque-cheesecake", invalidDate);
  assert.strictEqual(checkPastOrToday.isAvailable, false, "Today should be invalid for H-2 product");

  const checkFuture = await availabilityService.checkAvailability("prod-basque-cheesecake", validFutureDate);
  assert.strictEqual(checkFuture.isAvailable, true, "Future date H-3 should be available");

  // Test date override (e.g. sold out)
  await availabilityService.setAvailability("prod-basque-cheesecake", validFutureDate, "sold_out");
  const checkOverridden = await availabilityService.checkAvailability("prod-basque-cheesecake", validFutureDate);
  assert.strictEqual(checkOverridden.isAvailable, false, "Overridden sold_out date should be unavailable");

  // Reset override
  await availabilityService.setAvailability("prod-basque-cheesecake", validFutureDate, "available");

  // 4. Test Order Creation
  const newOrderRes = await orderService.createOrder({
    productId: "prod-basque-cheesecake",
    quantity: 1,
    customerName: "Ahmad Dani",
    customerWhatsapp: "081234567890",
    requestedDate: validFutureDate,
    fulfillmentMethod: "pickup",
  });

  assert.ok(newOrderRes.order, "Order should be created successfully");
  assert.match(newOrderRes.order!.reference_code, /^#SC-\d{4}-\d{4}$/, "Reference code must follow #SC-YYMM-XXXX");
  assert.strictEqual(newOrderRes.order!.status, "pending");

  // 5. Test Order Status Update
  const updated = await orderService.updateOrderStatus(newOrderRes.order!.id, "confirmed");
  assert.strictEqual(updated?.status, "confirmed");

  // 6. Test Product CRUD (Create, Read, Update, Delete)
  const createdProduct = await cakeService.createProduct({
    name: "Matcha Chiffon Cake",
    description: "Chiffon cake lembut dengan bubuk matcha murni asal Uji, Kyoto.",
    base_price: 185000,
    minimum_lead_time_days: 1,
    is_active: true,
    is_featured: false,
    flavor_notes: ["Uji Matcha", "Light Chiffon"],
    variants: [
      { name: "Ukuran 18cm", price: 185000, is_default: true, display_order: 1 },
      { name: "Ukuran 22cm", price: 275000, is_default: false, display_order: 2 },
    ],
    images: [
      {
        storage_path: "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
        alt_text: "Matcha Chiffon Cake",
        is_primary: true,
        display_order: 1,
      },
    ],
  });

  assert.ok(createdProduct.id, "Product should have an id");
  assert.strictEqual(createdProduct.name, "Matcha Chiffon Cake");
  assert.strictEqual(createdProduct.variants.length, 2);

  // Update Product
  const updatedProduct = await cakeService.updateProduct(createdProduct.id, {
    name: "Matcha Chiffon Premium",
    base_price: 195000,
  });
  assert.strictEqual(updatedProduct?.name, "Matcha Chiffon Premium");
  assert.strictEqual(updatedProduct?.base_price, 195000);

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
