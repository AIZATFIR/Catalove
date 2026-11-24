import assert from "node:assert/strict";
import {
  addCanvasSection,
  addCanvasSectionToTheme,
  moveCanvasSection,
  normalizeCanvasSections,
  removeCanvasSection,
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

console.log("✅ All canvas section tests passed!");
