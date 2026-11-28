const BUCKET_PREFIX = "/storage/v1/object/public/catalove-product-images/";

export function getManagedStoreImagePath(
  publicUrl: string,
  projectUrl: string,
  storeId: string,
  userId: string
): string | null {
  try {
    const url = new URL(publicUrl);
    if (url.origin !== new URL(projectUrl).origin || !url.pathname.startsWith(BUCKET_PREFIX)) return null;
    const encodedPath = url.pathname.slice(BUCKET_PREFIX.length);
    const segments = encodedPath.split("/").map((segment) => decodeURIComponent(segment));
    if (segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\"))) return null;
    const path = segments.join("/");
    if (!path.startsWith(`stores/${storeId}/products/`) && !path.startsWith(`users/${userId}/products/`)) return null;
    return path;
  } catch {
    return null;
  }
}

export function isManagedAiImagePath(path: string, storeId: string, userId: string): boolean {
  const match = /^(stores|users)\/([a-z0-9-]+)\/products\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(?:jpg|png|webp)$/i.exec(path);
  return Boolean(match && ((match[1] === "stores" && match[2] === storeId) || (match[1] === "users" && match[2] === userId)));
}
