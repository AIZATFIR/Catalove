import assert from "node:assert";
import { recommendationEngine } from "../src/lib/services/recommendation-engine";

async function runTests() {
  console.log("Running recommendation.test.ts...");

  // 1. Cheese + Birthday recommendation test
  const cheeseUltah = await recommendationEngine.matchCakes({
    flavor: "cheese",
    occasion: "birthday",
  });

  assert.ok(cheeseUltah.length > 0, "Should return recommendations");
  assert.strictEqual(
    cheeseUltah[0].product.slug,
    "basque-burnt-cheesecake-caramel",
    "Top recommendation for cheese + birthday should be Basque Burnt Cheesecake"
  );

  // 2. Ready stock (urgency: today) test
  const readyToday = await recommendationEngine.matchCakes({
    urgency: "today",
  });
  assert.ok(readyToday.length > 0, "Should return recommendations for today");
  assert.strictEqual(
    readyToday[0].product.minimum_lead_time_days,
    0,
    "Urgent recommendation must be a ready stock item (H-0)"
  );

  // 3. Free text query matching
  const chocolateQuery = await recommendationEngine.matchCakes({
    query: "cokelat legit",
  });
  assert.ok(
    chocolateQuery.some((item) => item.product.slug.includes("chocolate")),
    "Query with 'cokelat' must match chocolate cake"
  );

  console.log("✅ All recommendation engine tests passed!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
