import assert from "node:assert/strict";
import {
  addCanvasSection,
  addCanvasSectionDraft,
  moveCanvasSection,
  normalizeCanvasSections,
  removeCanvasSection,
} from "../src/lib/canvas-sections";
import type { CanvasSectionId } from "../src/types/catalove";

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
  addCanvasSectionDraft(["hero"], ["feed", "pricing"], "feed"),
  { order: ["hero", "feed"], hidden: ["pricing"] },
  "adding a hidden section puts it in the draft and unhides only that section"
);
assert.deepEqual(removeCanvasSection(["hero", "feed"], "hero"), ["feed"]);
assert.deepEqual(removeCanvasSection(["hero"], "hero"), ["hero"]);
assert.deepEqual(moveCanvasSection(["hero", "feed", "pricing"], "pricing", -1), ["hero", "pricing", "feed"]);
assert.deepEqual(moveCanvasSection(["hero", "feed"], "hero", -1), ["hero", "feed"]);

console.log("✅ All canvas section tests passed!");
