import assert from "node:assert/strict";
import {
  MAX_STORED_IMAGE_BYTES,
  validateImageUpload,
} from "../src/lib/image-upload-validation";

const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

assert.deepEqual(validateImageUpload("image/jpeg", jpg.length, jpg), { ok: true, extension: "jpg" });
assert.deepEqual(validateImageUpload("image/png", png.length, png), { ok: true, extension: "png" });
assert.deepEqual(validateImageUpload("image/webp", webp.length, webp), { ok: true, extension: "webp" });

const mimeSpoof = validateImageUpload("image/png", jpg.length, jpg);
assert.equal(mimeSpoof.ok, false);
if (!mimeSpoof.ok) assert.equal(mimeSpoof.status, 400);

const unsupportedType = validateImageUpload("image/svg+xml", 4, new Uint8Array([0x3c, 0x73, 0x76, 0x67]));
assert.equal(unsupportedType.ok, false);
if (!unsupportedType.ok) assert.equal(unsupportedType.status, 400);

const boundary = validateImageUpload("image/jpeg", MAX_STORED_IMAGE_BYTES, jpg);
assert.equal(boundary.ok, true);
const oversized = validateImageUpload("image/jpeg", MAX_STORED_IMAGE_BYTES + 1, jpg);
assert.equal(oversized.ok, false);
if (!oversized.ok) assert.equal(oversized.status, 413);

console.log("✅ Image upload signature and size checks passed!");
