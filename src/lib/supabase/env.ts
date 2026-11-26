/**
 * Supabase environment variable validation & access helpers.
 * Ensures secrets stay strictly server-side.
 */

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const expectedProjectRef = process.env.NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF;

  if (!url || !anonKey || !expectedProjectRef) return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  if (anonKey.length < 20) return false;

  try {
    const actualProjectRef = new URL(url).hostname.split(".")[0];
    return actualProjectRef === expectedProjectRef;
  } catch {
    return false;
  }
}

export function getSupabaseEnv(): SupabaseEnv | null {
  if (!isSupabaseConfigured()) return null;

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function assertSupabaseConfigured(operation: string): SupabaseEnv {
  const env = getSupabaseEnv();
  if (!env) {
    const isProd = process.env.NODE_ENV === "production";
    const msg = `[Supabase] Koneksi khusus Catalove belum lengkap atau project ref tidak cocok untuk operasi "${operation}". Atur NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, dan NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF ke project Catalove yang terpisah${
      isProd ? " di konfigurasi server produksi" : " di (.env.local)"
    }.`;
    throw new Error(msg);
  }
  return env;
}
