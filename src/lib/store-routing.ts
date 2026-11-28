export const DEFAULT_STORE_SLUG = "catalove";
export const DEFAULT_STORE_ID = "00000000-0000-4000-8000-000000000001";

export function isTenantStorefrontPath(pathname: string): boolean {
  return /^\/s\/[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?(?:\/|$)/.test(pathname);
}

const CATALOVE_NAVIGATION_LINKS = [
  { href: "/#discovery-feed", label: "Katalog" },
  { href: "/#harga", label: "Harga & Skema" },
  { href: "/catalog", label: "Semua Sample" },
  { href: "/bio", label: "Bio" },
];

const TENANT_NAVIGATION_LINKS = [
  { href: "/#discovery-feed", label: "Katalog" },
  { href: "/catalog", label: "Semua Produk" },
  { href: "/bio", label: "Bio" },
];

export function getStorefrontNavigationLinks(pathname: string) {
  return isTenantStorefrontPath(pathname)
    ? TENANT_NAVIGATION_LINKS
    : CATALOVE_NAVIGATION_LINKS;
}

export function getStoreSlugFromPath(pathname: string): string {
  const [, prefix, rawSlug] = pathname.split("/");
  if (prefix !== "s" || !rawSlug) return DEFAULT_STORE_SLUG;
  return /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(rawSlug) ? rawSlug : DEFAULT_STORE_SLUG;
}

export function getStorefrontPath(path: string, storeSlug: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  const normalizedSlug = storeSlug.toLowerCase();
  if (normalizedSlug === DEFAULT_STORE_SLUG) return path;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(normalizedSlug)) return "/";
  return `/s/${normalizedSlug}${path === "/" ? "" : path}`;
}

export function getCurrentStoreSlug(): string {
  if (typeof window === "undefined") return DEFAULT_STORE_SLUG;
  const pathname = window.location?.pathname || "/";
  const fromPath = getStoreSlugFromPath(pathname);
  if (fromPath !== DEFAULT_STORE_SLUG || !pathname.startsWith("/admin")) return fromPath;
  try {
    return window.localStorage.getItem("catalove-admin-store-slug") || DEFAULT_STORE_SLUG;
  } catch {
    return DEFAULT_STORE_SLUG;
  }
}

export function getStoreScopedStorageKey(prefix: string, storeSlug = getCurrentStoreSlug()): string {
  return `${prefix}:${storeSlug}`;
}

export function withStoreSlug(path: string, storeSlug = getCurrentStoreSlug()): string {
  if (typeof window === "undefined") return path;
  const url = new URL(path, window.location?.origin || "http://localhost");
  url.searchParams.set("storeSlug", storeSlug);
  return `${url.pathname}${url.search}${url.hash}`;
}
