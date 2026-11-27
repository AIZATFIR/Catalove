import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveAiSuggestedCategoryId } from "../src/lib/ai-organize";
import { isGeminiAiEnabled } from "../src/lib/ai-feature-gate";

const categories = [
  { id: "cat-signature", slug: "signature" },
  { id: "cat-apparel", slug: "apparel" },
];

assert.equal(resolveAiSuggestedCategoryId("cat-apparel", categories), "cat-apparel");
assert.equal(resolveAiSuggestedCategoryId("apparel", categories), "cat-apparel");
assert.equal(resolveAiSuggestedCategoryId("not-a-store-category", categories), null);
assert.equal(resolveAiSuggestedCategoryId({ id: "cat-apparel" }, categories), null);

assert.equal(isGeminiAiEnabled(undefined, "true"), false);
assert.equal(isGeminiAiEnabled("test-key", "false"), false);
assert.equal(isGeminiAiEnabled("test-key", undefined), false);
assert.equal(isGeminiAiEnabled("test-key", " true "), true);

const aiRoute = readFileSync(join(process.cwd(), "src/app/api/ai/organize/route.ts"), "utf8");
assert.match(aiRoute, /isGeminiAiEnabled\(apiKey,\s*process\.env\.GEMINI_API_PAID_TIER_CONFIRMED\)/);

console.log("✅ AI photo suggestions require an API key and paid-tier confirmation");
