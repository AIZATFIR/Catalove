import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./env";

/**
 * Creates a server-side Supabase client reading and writing HTTP cookies.
 * Returns null if Supabase is not configured.
 */
export async function getServerSupabase() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Can be ignored if called from a Server Component that cannot set cookies
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // Can be ignored if called from a Server Component
          }
        },
      },
    }
  );
}

/**
 * Server-only client with service_role key for trusted backend operations
 * (e.g. storage bucket setup, privileged admin queries).
 * NEVER expose this or call this from client components.
 */
export async function getAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isSupabaseConfigured() || !serviceKey) {
    return null;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    }
  );
}
