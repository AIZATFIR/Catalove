export function shouldUseLocalCatalogOverride(
  supabaseConfigured: boolean,
  localMode: string | null
): boolean {
  return !supabaseConfigured || localMode === "1";
}
