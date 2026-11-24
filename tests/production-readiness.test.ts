import assert from "node:assert";
import { isSupabaseConfigured, assertSupabaseConfigured } from "../src/lib/supabase/env";
import { cakeService } from "../src/lib/services/cake-service";
import { availabilityService } from "../src/lib/services/availability-service";
import { orderService } from "../src/lib/services/order-service";
import { readBusinessSettings } from "../src/lib/business-settings";
import { getTodayJakarta, addDays } from "../src/lib/utils/formatters";
import { OrderInputSchema } from "../src/lib/validators/order";

async function runProductionReadinessTests() {
  console.log("🔍 Running production readiness & dual-driver tests...");

  // 1. Test Supabase Environment helper
  assert.strictEqual(typeof isSupabaseConfigured(), "boolean");
  if (!isSupabaseConfigured()) {
    assert.throws(
      () => assertSupabaseConfigured("test-op"),
      /Koneksi khusus Catalove belum lengkap/,
      "Should throw descriptive error when Supabase env is missing"
    );
  }

  // 2. Test Catalog Retrieval & Filtering
  const categories = await cakeService.getCategories();
  assert.ok(categories.length >= 4, "Should have all artisan categories");
  assert.ok(categories.some((c) => c.slug === "apparel"));

  const allProducts = await cakeService.getProducts({ includeInactive: true });
  assert.ok(allProducts.length >= 5, "Should have products in catalog");

  // 3. Test Lead Time Enforcement
  const today = getTodayJakarta();
  const pastDate = addDays(today, -1);
  const tooSoonDate = addDays(today, 1); // H-1 is invalid for H-2 product
  const validDate = addDays(today, 5);

  const testProduct = allProducts[0];
  const pastCheck = await availabilityService.checkAvailability(testProduct.id, pastDate);
  assert.strictEqual(pastCheck.isAvailable, false, "Past dates must be rejected");

  if (testProduct.minimum_lead_time_days >= 2) {
    const tooSooned = await availabilityService.checkAvailability(testProduct.id, tooSoonDate);
    assert.strictEqual(tooSooned.isAvailable, false, "Dates violating minimum lead time must be rejected");
  }

  // 4. Test Atomic Order Request creation with snapshot preservation
  const orderRes = await orderService.createOrder({
    productId: testProduct.id,
    variantId: testProduct.variants[0]?.id || null,
    quantity: 2,
    customerName: "Siti Rahma",
    customerWhatsapp: "081299887766",
    requestedDate: validDate,
    fulfillmentMethod: "delivery",
    deliveryAddress: "Jl. Tebet Raya No. 45, Jakarta Selatan",
    cakeInscription: "Dirgahayu",
    candleCount: 5,
  });

  assert.ok(orderRes.order, "Order should be created successfully");
  const ord = orderRes.order!;
  assert.match(ord.reference_code, /^#CA-\d{4}-\d{4}$/, "Must generate valid #CA-YYMM-XXXX reference");
  assert.strictEqual(ord.status, "pending");
  assert.strictEqual(ord.items.length, 1);
  assert.strictEqual(ord.items[0].quantity, 2);
  assert.strictEqual(ord.items[0].product_name_snapshot, testProduct.name);

  // 5. Test Lookup by reference code
  const lookedUp = await orderService.getOrderByReference(ord.reference_code);
  assert.ok(lookedUp, "Should be retrievable by reference code");
  assert.strictEqual(lookedUp!.id, ord.id);
  assert.strictEqual(lookedUp!.customer_name, "Siti Rahma");

  // 6. Test Zod Validator Schema
  const validPayload = {
    productId: testProduct.id,
    quantity: 1,
    customerName: "Budi",
    customerWhatsapp: "081234567890",
    requestedDate: validDate,
    fulfillmentMethod: "pickup" as const,
  };
  const parseOk = OrderInputSchema.safeParse(validPayload);
  assert.ok(parseOk.success, "Valid order input must pass Zod schema");

  const invalidPayload = {
    ...validPayload,
    customerWhatsapp: "not-a-number",
  };
  const parseFail = OrderInputSchema.safeParse(invalidPayload);
  assert.strictEqual(parseFail.success, false, "Invalid phone must fail Zod schema");

  // 7. Test Business Settings
  const settings = readBusinessSettings();
  assert.ok(settings.store_name.length > 0, "Store name should not be empty");
  assert.ok(settings.seller_whatsapp.length > 0, "Seller WhatsApp should be present");

  console.log("✅ All production readiness & dual-driver tests passed!");
}

runProductionReadinessTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
