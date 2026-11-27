import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getManagedStoreImagePath, isManagedAiImagePath } from "../src/lib/store-media-path";
import { deleteUnreferencedStoreImage } from "../src/lib/services/store-media-service";

const projectUrl = "https://catalove-test.supabase.co";
const storeId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";

assert.equal(
  getManagedStoreImagePath(`${projectUrl}/storage/v1/object/public/catalove-product-images/stores/${storeId}/products/photo.webp`, projectUrl, storeId, userId),
  `stores/${storeId}/products/photo.webp`
);
assert.equal(
  getManagedStoreImagePath(`${projectUrl}/storage/v1/object/public/catalove-product-images/users/${userId}/products/legacy.webp`, projectUrl, storeId, userId),
  `users/${userId}/products/legacy.webp`
);
assert.equal(getManagedStoreImagePath("https://evil.example/image.webp", projectUrl, storeId, userId), null);
assert.equal(getManagedStoreImagePath(`${projectUrl}/storage/v1/object/public/catalove-product-images/stores/other/products/photo.webp`, projectUrl, storeId, userId), null);
assert.equal(getManagedStoreImagePath(`${projectUrl}/storage/v1/object/public/catalove-product-images/stores/${storeId}/products/%2e%2e/private.webp`, projectUrl, storeId, userId), null);

assert.equal(isManagedAiImagePath(`stores/${storeId}/products/33333333-3333-4333-8333-333333333333.jpg`, storeId, userId), true);
assert.equal(isManagedAiImagePath(`stores/other/products/33333333-3333-4333-8333-333333333333.jpg`, storeId, userId), false);
assert.equal(isManagedAiImagePath("http://127.0.0.1:54321/admin", storeId, userId), false);

const aiRouteSource = readFileSync(join(process.cwd(), "src/app/api/ai/organize/route.ts"), "utf8");
assert.match(aiRouteSource, /\.download\(storagePath\)/, "AI organizer must load only validated tenant storage paths");
assert.doesNotMatch(aiRouteSource, /fetch\(\s*(?:imageUrl|targetUrl)/, "AI organizer must not fetch a request-controlled URL");

async function testStorageDeletion() {
let removedPath = "";
const unusedImageAdmin = {
  from: () => ({ select: () => ({ eq: () => ({ limit: async () => ({ data: [], error: null }) }) }) }),
  storage: { from: () => ({ remove: async (paths: string[]) => { removedPath = paths[0]; return { error: null }; } }) },
} as never;
assert.equal(
  await deleteUnreferencedStoreImage(unusedImageAdmin, `${projectUrl}/storage/v1/object/public/catalove-product-images/stores/${storeId}/products/unused.webp`, projectUrl, storeId, userId),
  "deleted"
);
assert.equal(removedPath, `stores/${storeId}/products/unused.webp`);

let referencedRemoveCalled = false;
const referencedImageAdmin = {
  from: () => ({ select: () => ({ eq: () => ({ limit: async () => ({ data: [{ id: "image-row" }], error: null }) }) }) }),
  storage: { from: () => ({ remove: async () => { referencedRemoveCalled = true; return { error: null }; } }) },
} as never;
assert.equal(
  await deleteUnreferencedStoreImage(referencedImageAdmin, `${projectUrl}/storage/v1/object/public/catalove-product-images/stores/${storeId}/products/in-use.webp`, projectUrl, storeId, userId),
  "referenced"
);
assert.equal(referencedRemoveCalled, false, "referenced product media must never be removed from storage");
}

testStorageDeletion().then(() => console.log("✅ Store image ownership path checks passed")).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
