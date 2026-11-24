import assert from "node:assert";
import { cakeService } from "../src/lib/services/cake-service";
import { availabilityService } from "../src/lib/services/availability-service";
import { orderService } from "../src/lib/services/order-service";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "../src/lib/utils/whatsapp";
import { addDays, getTodayJakarta } from "../src/lib/utils/formatters";

async function runE2E() {
  console.log("🚀 Starting End-to-End Catalove Integration Test...");

  // 1. Customer browses catalog
  const products = await cakeService.getProducts();
  assert.ok(products.length >= 5, "Catalog should have active products");
  const sample = products.find((p) => p.slug === "sample-01-apparel");
  assert.ok(sample, "Catalove sample product must exist in catalog");

  // 2. Customer selects a date
  const today = getTodayJakarta();
  const validEventDate = addDays(today, 4); // H-4 (valid for H-2)

  // 3. Customer submits order request
  const orderRes = await orderService.createOrder({
    productId: sample!.id,
    variantId: sample!.variants[0].id,
    quantity: 1,
    customerName: "Bunga Citra",
    customerWhatsapp: "081122334455",
    requestedDate: validEventDate,
    fulfillmentMethod: "delivery",
    deliveryAddress: "Jl. Senayan No. 10, Jakarta Selatan",
  });

  assert.ok(orderRes.order, "Order request must be created and persisted");
  const createdOrder = orderRes.order!;
  assert.match(createdOrder.reference_code, /^#CA-\d{4}-\d{4}$/, "Must have valid Catalove reference code");
  assert.strictEqual(createdOrder.status, "pending", "Initial state must be 'pending'");

  // 4. WhatsApp handoff URL verification
  const waUrl = buildWhatsAppUrl(createdOrder);
  assert.ok(waUrl.includes("wa.me"), "Must generate wa.me link");
  const waMsg = buildWhatsAppMessage(createdOrder);
  assert.ok(waMsg.includes(createdOrder.reference_code), "WhatsApp text must contain reference code");
  assert.ok(waMsg.includes("Bunga Citra"), "WhatsApp text must contain customer name");
  assert.ok(waMsg.includes(sample!.name), "WhatsApp text must contain product");

  // 5. Seller inspects order in Admin
  const adminPendingOrders = await orderService.listOrders("pending");
  const foundInAdmin = adminPendingOrders.find((o) => o.id === createdOrder.id);
  assert.ok(foundInAdmin, "Created order must appear in admin pending orders queue");

  // 6. Seller updates status: contacted -> confirmed
  const contactedOrder = await orderService.updateOrderStatus(createdOrder.id, "contacted");
  assert.strictEqual(contactedOrder?.status, "contacted");

  const confirmedOrder = await orderService.updateOrderStatus(createdOrder.id, "confirmed");
  assert.strictEqual(confirmedOrder?.status, "confirmed");

  // 7. Verify availability enforcement: closed date blocks new orders
  const closedDate = addDays(today, 5);
  await availabilityService.setAvailability(sample!.id, closedDate, "closed");

  const blockedOrderRes = await orderService.createOrder({
    productId: sample!.id,
    quantity: 1,
    customerName: "Rian",
    customerWhatsapp: "081233445566",
    requestedDate: closedDate,
    fulfillmentMethod: "pickup",
    candleCount: 0,
  });

  assert.ok(blockedOrderRes.error, "Order on closed date must be blocked");

  console.log("🎉 All End-to-End integration tests passed successfully!");
}

runE2E().catch((err) => {
  console.error("E2E Test failed:", err);
  process.exit(1);
});
