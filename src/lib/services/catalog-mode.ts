export function shouldUseLocalCatalogOverride(
  supabaseConfigured: boolean,
  localMode: string | null
): boolean {
  return !supabaseConfigured || localMode === "1";
}

export function shouldInitializeDemoCatalog(localMode: string | null): boolean {
  return localMode !== "1";
}
