export function shouldUseLocalCatalogOverride(
  supabaseConfigured: boolean,
  localMode: string | null
): boolean {
  return !supabaseConfigured || localMode === "1";
}

export function shouldInitializeDemoCatalog(
  initialized: string | null,
  savedProductCount: number
): boolean {
  return initialized !== "1" && savedProductCount === 0;
}
