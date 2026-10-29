"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "./env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Returns a singleton browser Supabase client.
 * Returns null if Supabase is not configured (in local mock/demo mode).
 */
export function getBrowserSupabase() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}
