import assert from "node:assert/strict";
import { shouldInitializeDemoCatalog, shouldUseLocalCatalogOverride } from "../src/lib/services/catalog-mode";

assert.equal(
  shouldUseLocalCatalogOverride(true, null),
  false,
  "a configured Catalove database should be the default source of truth"
);
assert.equal(
  shouldUseLocalCatalogOverride(true, "1"),
  true,
  "an explicit local override should keep edits on this browser"
);
assert.equal(
  shouldUseLocalCatalogOverride(false, null),
  true,
  "offline/demo mode should use the local catalog"
);
assert.equal(
  shouldInitializeDemoCatalog(null, 0),
  true,
  "the marketing demo should initialize its local sample catalog once"
);
assert.equal(
  shouldInitializeDemoCatalog(null, 3),
  false,
  "the marketing demo should preserve saved local products"
);
assert.equal(
  shouldInitializeDemoCatalog("1", 0),
  false,
  "the marketing demo should preserve an intentionally empty catalog after initialization"
);

console.log("✅ Catalog persistence mode tests passed!");
