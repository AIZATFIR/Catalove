import assert from "node:assert";
import { recommendationEngine } from "../src/lib/services/recommendation-engine";

async function runTests() {
  console.log("Running recommendation.test.ts...");

  // 1. Generic product text search
  const fragrance = await recommendationEngine.matchProducts({
    query: "fragrance",
  });

  assert.ok(fragrance.length > 0, "Should return recommendations");
  assert.strictEqual(
    fragrance[0].product.slug,
    "sample-03-fragrance",
    "A text query should rank the matching Catalove product first"
  );

  // 2. Ready stock (urgency: today) test
  const readyToday = await recommendationEngine.matchProducts({
    urgency: "today",
  });
  assert.ok(readyToday.length > 0, "Should return recommendations for today");
  assert.strictEqual(
    readyToday[0].product.minimum_lead_time_days,
    0,
    "Urgent recommendation must be a ready-to-prepare item"
  );

  // 3. Free text query matching
  const carryQuery = await recommendationEngine.matchProducts({
    query: "tas aksesoris",
  });
  assert.ok(
    carryQuery[0].product.slug === "sample-04-carry",
    "Query terms should rank the relevant product ahead of unrelated products"
  );

  console.log("✅ All recommendation engine tests passed!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
