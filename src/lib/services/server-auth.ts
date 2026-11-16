import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAdminSupabase, getServerSupabase } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string;
  role: "owner" | "admin";
}

const DEFAULT_ADMIN_EMAIL = "owner@catalove.id";

export async function isSellerUser(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const admin = await getAdminSupabase();
    if (!admin) return false;

    // Check seller_users table
    const { data, error } = await admin
      .from("seller_users")
      .select("user_id, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && data) return true;

    // Only trusted server-managed metadata can add a seller account.
    const { data: userRecord } = await admin.auth.admin.getUserById(userId);
    return userRecord?.user?.app_metadata?.role === "seller";
  } catch {
    return false;
  }
}

export async function verifyServerSession(): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const serverSupabase = await getServerSupabase();
    if (!serverSupabase) return null;

    const { data: { user }, error } = await serverSupabase.auth.getUser();
    if (error || !user) return null;

    const isSeller = await isSellerUser(user.id);
    if (!isSeller) return null;

    return {
      id: user.id,
      email: user.email || DEFAULT_ADMIN_EMAIL,
      role: "owner",
    };
  } catch {
    return null;
  }
}
