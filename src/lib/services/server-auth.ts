import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAdminSupabase, getServerSupabase } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string;
  role: "owner" | "admin";
  storeId: string;
  storeSlug: string;
}

const DEFAULT_ADMIN_EMAIL = "owner@catalove.id";

export async function isSellerUser(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const admin = await getAdminSupabase();
    if (!admin) return false;

    const { data, error } = await admin
      .from("store_memberships")
      .select("user_id")
      .eq("user_id", userId)
      .limit(1);
    return !error && Boolean(data?.length);
  } catch {
    return false;
  }
}

export async function verifyServerSession(storeSlug?: string): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const serverSupabase = await getServerSupabase();
    if (!serverSupabase) return null;

    const { data: { user }, error } = await serverSupabase.auth.getUser();
    if (error || !user) return null;

    const admin = await getAdminSupabase();
    if (!admin) return null;
    const { data: candidateMembership, error: candidateError } = await admin
      .from("store_memberships")
      .select("store_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (candidateError || !candidateMembership?.length) return null;
    let selectedMembership: { store_id: string; role: string } | undefined = candidateMembership[0];
    if (storeSlug) {
      const { data: requestedStore } = await admin.from("stores").select("id").eq("slug", storeSlug).maybeSingle();
      selectedMembership = requestedStore
        ? candidateMembership.find((candidate) => candidate.store_id === requestedStore.id)
        : undefined;
    }
    if (!selectedMembership) return null;
    const { data: store, error: storeError } = await admin
      .from("stores")
      .select("id, slug")
      .eq("id", selectedMembership.store_id)
      .maybeSingle();
    if (storeError || !store || selectedMembership.role === "editor") return null;

    return {
      id: user.id,
      email: user.email || DEFAULT_ADMIN_EMAIL,
      role: selectedMembership.role === "admin" ? "admin" : "owner",
      storeId: store.id,
      storeSlug: store.slug,
    };
  } catch {
    return null;
  }
}
