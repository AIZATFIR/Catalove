import type { CanvasSectionId } from "@/types/catalove";

export function normalizeCanvasSections(
  order: readonly CanvasSectionId[] | undefined,
  validIds: ReadonlySet<CanvasSectionId>,
  fallback: readonly CanvasSectionId[],
  hidden: readonly CanvasSectionId[] = []
): CanvasSectionId[] {
  const hiddenIds = new Set(hidden);
  const normalized = [...new Set(order || [])].filter(
    (id) => validIds.has(id) && !hiddenIds.has(id)
  );
  return normalized.length > 0 ? normalized : [...fallback];
}

export function addCanvasSection(
  order: readonly CanvasSectionId[],
  id: CanvasSectionId
): CanvasSectionId[] {
  return order.includes(id) ? [...order] : [...order, id];
}

export function addCanvasSectionDraft(
  order: readonly CanvasSectionId[],
  hidden: readonly CanvasSectionId[],
  id: CanvasSectionId
): { order: CanvasSectionId[]; hidden: CanvasSectionId[] } {
  return {
    order: addCanvasSection(order, id),
    hidden: hidden.filter((sectionId) => sectionId !== id),
  };
}

export function removeCanvasSection(
  order: readonly CanvasSectionId[],
  id: CanvasSectionId
): CanvasSectionId[] {
  if (order.length <= 1 || !order.includes(id)) return [...order];
  return order.filter((item) => item !== id);
}

export function moveCanvasSection(
  order: readonly CanvasSectionId[],
  id: CanvasSectionId,
  direction: -1 | 1
): CanvasSectionId[] {
  const index = order.indexOf(id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return [...order];

  const next = [...order];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}
