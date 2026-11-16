import assert from "node:assert/strict";
import { normalizeHexColor } from "../src/lib/theme-colors";

assert.equal(normalizeHexColor("#aBcD12"), "#ABCD12");
assert.equal(normalizeHexColor("#abc"), null);
assert.equal(normalizeHexColor("red"), null);
assert.equal(normalizeHexColor(" #123456 "), "#123456");

console.log("✅ All theme color tests passed!");
