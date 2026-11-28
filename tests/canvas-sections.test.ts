import assert from "node:assert/strict";
import {
  addCanvasSection,
  addCanvasSectionToTheme,
  moveCanvasSection,
  normalizeCanvasSections,
  removeCanvasSection,
  publishCanvasSectionOrder,
  updateCanvasSectionOrder,
} from "../src/lib/canvas-sections";
import type { CanvasSectionId } from "../src/types/catalove";
import { DEFAULT_THEME_CONFIG } from "../src/lib/data/universal-presets";

const valid = new Set<CanvasSectionId>(["hero", "feed", "pricing"]);

assert.deepEqual(
  normalizeCanvasSections(["hero", "feed", "feed", "unknown" as CanvasSectionId], valid, ["hero"]),
  ["hero", "feed"],
  "normalization removes unknown and duplicate IDs"
);
assert.deepEqual(
  normalizeCanvasSections([], valid, ["hero", "feed"]),
  ["hero", "feed"],
  "empty order uses its fallback"
);
assert.deepEqual(
  normalizeCanvasSections(["hero", "feed", "pricing"], valid, ["hero"], ["feed"]),
  ["hero", "pricing"],
  "hidden sections are excluded"
);
assert.deepEqual(addCanvasSection(["hero", "feed"], "feed"), ["hero", "feed"]);
assert.deepEqual(addCanvasSection(["hero"], "pricing"), ["hero", "pricing"]);
assert.deepEqual(
  addCanvasSectionToTheme(
    {
      ...DEFAULT_THEME_CONFIG,
      canvas_draft_order: ["hero", "pricing"],
      hidden_sections: ["feed", "showcase"],
      hero_align: "center",
    },
    "feed",
    valid,
    ["hero"]
  ),
  {
    ...DEFAULT_THEME_CONFIG,
    canvas_draft_order: ["hero", "pricing", "feed"],
    hidden_sections: ["showcase"],
    hero_align: "center",
  },
  "adding from the latest theme preserves its current order and other settings while unhiding the added section"
);
assert.deepEqual(removeCanvasSection(["hero", "feed"], "hero"), ["feed"]);
assert.deepEqual(removeCanvasSection(["hero"], "hero"), ["hero"]);
assert.deepEqual(moveCanvasSection(["hero", "feed", "pricing"], "pricing", -1), ["hero", "pricing", "feed"]);
assert.deepEqual(moveCanvasSection(["hero", "feed"], "hero", -1), ["hero", "feed"]);

const afterAddingFeed = updateCanvasSectionOrder(
  { ...DEFAULT_THEME_CONFIG, canvas_draft_order: ["hero"] },
  "add",
  "feed",
  valid,
  ["hero"]
);
const afterAddingPricing = updateCanvasSectionOrder(
  afterAddingFeed,
  "add",
  "pricing",
  valid,
  ["hero"]
);
assert.deepEqual(
  afterAddingPricing.canvas_draft_order,
  ["hero", "feed", "pricing"],
  "consecutive edits use the latest saved draft instead of replacing an earlier section"
);
assert.deepEqual(
  updateCanvasSectionOrder(afterAddingPricing, "remove", "feed", valid, ["hero"])
    .canvas_draft_order,
  ["hero", "pricing"],
  "removing a section preserves the latest remaining draft sections"
);
assert.deepEqual(
  updateCanvasSectionOrder(afterAddingPricing, "move-up", "pricing", valid, ["hero"])
    .canvas_draft_order,
  ["hero", "pricing", "feed"],
  "reordering operates on the latest draft section list"
);
assert.deepEqual(
  publishCanvasSectionOrder(afterAddingPricing, valid, ["hero"]),
  {
    ...afterAddingPricing,
    section_order: ["hero", "feed", "pricing"],
    hidden_sections: [],
  },
  "publishing applies the newest saved draft sections to the storefront order"
);

console.log("✅ All canvas section tests passed!");
