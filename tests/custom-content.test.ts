import assert from "node:assert/strict";
import {
  appendCustomContentBlock,
  isSafeCustomContentUrl,
  sanitizeMarqueeAnnouncement,
  moveCustomContentBlock,
  publishedCustomContentBlocks,
  removeCustomContentBlock,
  replaceCustomContentBlock,
} from "../src/lib/custom-content";
import type { CustomContentBlock } from "../src/types/catalove";

const text: CustomContentBlock = { id: "text-1", type: "text", title: "Judul", text: "Isi" };
const button: CustomContentBlock = { id: "button-1", type: "button", label: "Lihat", url: "/catalog" };
const image: CustomContentBlock = { id: "image-1", type: "image", image_url: "https://images.example.com/item.jpg", alt: "Produk" };

assert.deepEqual(appendCustomContentBlock([text], button), [text, button]);
assert.deepEqual(replaceCustomContentBlock([text, button], { ...text, text: "Baru" })[0], { ...text, text: "Baru" });
assert.deepEqual(moveCustomContentBlock([text, button, image], "image-1", -1).map((item) => item.id), ["text-1", "image-1", "button-1"]);
assert.deepEqual(removeCustomContentBlock([text, button], "text-1"), [button]);
assert.equal(isSafeCustomContentUrl("https://catalove.example/"), true);
assert.equal(isSafeCustomContentUrl("/catalog"), true);
assert.equal(isSafeCustomContentUrl("javascript:alert(1)"), false);
assert.equal(isSafeCustomContentUrl("//evil.example"), false);
assert.deepEqual(
  sanitizeMarqueeAnnouncement({ enabled: true, text: "Promo", badge: "BARU", link: "javascript:alert(1)" }),
  { enabled: true, text: "Promo", badge: "BARU", link: "" }
);
assert.deepEqual(
  sanitizeMarqueeAnnouncement({ enabled: true, text: "Promo", link: "/catalog" }),
  { enabled: true, text: "Promo", badge: "", link: "/catalog" }
);
assert.deepEqual(publishedCustomContentBlocks([text, { ...image, image_url: "javascript:alert(1)" }, { ...button, label: "", url: "/catalog" }]), [text]);

console.log("✅ All custom content tests passed!");
