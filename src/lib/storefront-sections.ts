import type { CanvasSectionId } from "@/types/catalove";
import { normalizeCanvasSections } from "@/lib/canvas-sections";
import { isTenantStorefrontPath } from "@/lib/store-routing";

export const DEFAULT_TENANT_SECTION_ORDER: CanvasSectionId[] = [
  "hero",
  "feed",
  "collection_index",
];

export function getAllowedStorefrontSections<T extends { id: CanvasSectionId }>(
  pathname: string,
  sections: readonly T[]
): T[] {
  return isTenantStorefrontPath(pathname)
    ? sections.filter((section) => section.id !== "pricing")
    : [...sections];
}

export function getStorefrontSectionOrder(
  pathname: string,
  saved: readonly CanvasSectionId[] | undefined,
  validIds: ReadonlySet<CanvasSectionId>,
  fallback: readonly CanvasSectionId[],
  hidden: readonly CanvasSectionId[] = []
): CanvasSectionId[] {
  const tenant = isTenantStorefrontPath(pathname);
  const allowedIds = tenant
    ? new Set([...validIds].filter((id) => id !== "pricing"))
    : validIds;
  const safeFallback = (tenant ? DEFAULT_TENANT_SECTION_ORDER : fallback).filter(
    (id) => allowedIds.has(id)
  );
  return normalizeCanvasSections(saved, allowedIds, safeFallback, hidden);
}
