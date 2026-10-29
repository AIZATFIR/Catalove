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

  if (!url || !anonKey) return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  if (anonKey.length < 20) return false;

  return true;
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
    const msg = `[Supabase] Konfigurasi Supabase belum lengkap untuk operasi "${operation}". Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY telah diatur di Environment Variables${
      isProd ? " Vercel" : " (.env.local)"
    }.`;
    throw new Error(msg);
  }
  return env;
}
