import "server-only";
import { getAdminSupabase } from "@/lib/supabase/server";
import { DEFAULT_STORE_ID, DEFAULT_STORE_SLUG } from "@/lib/store-routing";

export { DEFAULT_STORE_ID, DEFAULT_STORE_SLUG };

export interface StoreRecord {
  id: string;
  slug: string;
  name: string;
  status: "draft" | "published" | "suspended";
  plan: "free" | "business" | "enterprise";
}

export async function resolveStoreBySlug(slug = DEFAULT_STORE_SLUG, includeUnpublished = false): Promise<StoreRecord | null> {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(slug)) return null;
  const supabase = await getAdminSupabase();
  if (!supabase) return null;
  let query = supabase
    .from("stores")
    .select("id, slug, name, status, plan")
    .eq("slug", slug);
  if (!includeUnpublished) query = query.eq("status", "published");
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data as StoreRecord;
}

export function getStoreSlugFromRequest(request: Request): string {
  const url = new URL(request.url);
  const slug = (url.searchParams.get("storeSlug") || request.headers.get("x-catalove-store-slug"))?.trim().toLowerCase();
  return slug || DEFAULT_STORE_SLUG;
}

export function getRequestedStoreSlug(request: Request): string | undefined {
  const slug = (new URL(request.url).searchParams.get("storeSlug") || request.headers.get("x-catalove-store-slug"))?.trim();
  return slug || undefined;
}
