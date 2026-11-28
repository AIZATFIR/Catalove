import type { CanvasSectionId, ThemeConfig } from "@/types/catalove";

export type CanvasSectionEdit = "add" | "remove" | "move-up" | "move-down";

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

export function addCanvasSectionToTheme(
  theme: ThemeConfig,
  id: CanvasSectionId,
  validIds: ReadonlySet<CanvasSectionId>,
  fallback: readonly CanvasSectionId[]
): ThemeConfig {
  const order = normalizeCanvasSections(
    theme.canvas_draft_order,
    validIds,
    fallback,
    theme.hidden_sections
  );
  return {
    ...theme,
    canvas_draft_order: addCanvasSection(order, id),
    hidden_sections: (theme.hidden_sections || []).filter(
      (sectionId) => sectionId !== id
    ),
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

export function updateCanvasSectionOrder(
  theme: ThemeConfig,
  action: CanvasSectionEdit,
  id: CanvasSectionId,
  validIds: ReadonlySet<CanvasSectionId>,
  fallback: readonly CanvasSectionId[]
): ThemeConfig {
  if (action === "add") {
    return addCanvasSectionToTheme(theme, id, validIds, fallback);
  }

  const order = normalizeCanvasSections(
    theme.canvas_draft_order,
    validIds,
    fallback,
    theme.hidden_sections
  );

  if (action === "remove") {
    return { ...theme, canvas_draft_order: removeCanvasSection(order, id) };
  }

  return {
    ...theme,
    canvas_draft_order: moveCanvasSection(
      order,
      id,
      action === "move-up" ? -1 : 1
    ),
  };
}

export function publishCanvasSectionOrder(
  theme: ThemeConfig,
  validIds: ReadonlySet<CanvasSectionId>,
  fallback: readonly CanvasSectionId[]
): ThemeConfig {
  return {
    ...theme,
    section_order: normalizeCanvasSections(
      theme.canvas_draft_order,
      validIds,
      fallback,
      theme.hidden_sections
    ),
    hidden_sections: [],
  };
}
