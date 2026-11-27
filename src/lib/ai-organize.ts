export function resolveAiSuggestedCategoryId(
  suggestion: unknown,
  categories: Array<{ id: string; slug: string }>
): string | null {
  if (typeof suggestion !== "string") return null;
  return categories.find((category) => category.id === suggestion || category.slug === suggestion)?.id || null;
}
