import assert from "node:assert";
import { OrderInputSchema } from "../src/lib/validators/order";
import { ProductInputSchema } from "../src/lib/validators/product";

console.log("Running validators.test.ts...");

// 1. Valid order input test
const validOrder = {
  productId: "prod-gen-1",
  variantId: "v-gen-1",
  quantity: 2,
  customerName: "Sarah Wijaya",
  customerWhatsapp: "081234567890",
  requestedDate: "2026-10-31",
  fulfillmentMethod: "pickup" as const,
  cakeInscription: "Happy Birthday Sarah!",
  candleCount: 2,
};
const parsedOrder = OrderInputSchema.safeParse(validOrder);
assert.strictEqual(parsedOrder.success, true, "Valid order should pass schema validation");

// 2. Invalid WhatsApp number test
const invalidPhoneOrder = {
  ...validOrder,
  customerWhatsapp: "12345abc",
};
const parsedInvalidPhone = OrderInputSchema.safeParse(invalidPhoneOrder);
assert.strictEqual(parsedInvalidPhone.success, false, "Invalid phone should fail");

// 3. Zero quantity test
const zeroQtyOrder = {
  ...validOrder,
  quantity: 0,
};
const parsedZeroQty = OrderInputSchema.safeParse(zeroQtyOrder);
assert.strictEqual(parsedZeroQty.success, false, "Zero quantity should fail");

// 4. Valid product input test
const validProduct = {
  name: "Matcha Basque Cheesecake",
  category_id: "cat-whole",
  description: "Authentic Kyoto Uji Matcha baked cheesecake with caramel crust.",
  flavor_notes: ["Kyoto Matcha", "Rich Cream Cheese"],
  base_price: 275000,
  minimum_lead_time_days: 2,
  is_active: true,
  is_featured: false,
  variants: [
    {
      name: "16cm",
      price: 275000,
      is_default: true,
      display_order: 1,
    },
  ],
  images: [
    {
      storage_path: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad",
      alt_text: "Matcha cake",
      is_primary: true,
      display_order: 1,
    },
  ],
};
const parsedProduct = ProductInputSchema.safeParse(validProduct);
assert.strictEqual(parsedProduct.success, true, "Valid product should pass validation");
assert.strictEqual(ProductInputSchema.safeParse({ ...validProduct, images: [{ storage_path: "javascript:alert(1)" }] }).success, false, "product images must use a safe web URL");
assert.strictEqual(ProductInputSchema.safeParse({ ...validProduct, images: Array.from({ length: 11 }, () => validProduct.images[0]) }).success, false, "product image count must match the supported limit");

console.log("✅ All validator tests passed!");
