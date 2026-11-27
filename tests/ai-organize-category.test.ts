import assert from "node:assert/strict";
import { resolveAiSuggestedCategoryId } from "../src/lib/ai-organize";

const categories = [
  { id: "cat-signature", slug: "signature" },
  { id: "cat-apparel", slug: "apparel" },
];

assert.equal(resolveAiSuggestedCategoryId("cat-apparel", categories), "cat-apparel");
assert.equal(resolveAiSuggestedCategoryId("apparel", categories), "cat-apparel");
assert.equal(resolveAiSuggestedCategoryId("not-a-store-category", categories), null);
assert.equal(resolveAiSuggestedCategoryId({ id: "cat-apparel" }, categories), null);

console.log("✅ AI category suggestions resolve only to this store's categories");
