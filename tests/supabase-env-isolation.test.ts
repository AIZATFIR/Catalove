import assert from "node:assert/strict";
import { isSupabaseConfigured } from "../src/lib/supabase/env";

const previous = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  projectRef: process.env.NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF,
};

try {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://shared-ref.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "x".repeat(32);
  delete process.env.NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF;
  assert.equal(
    isSupabaseConfigured(),
    false,
    "Supabase stays disabled until Catalove has an explicitly selected project"
  );

  process.env.NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF = "catalove-ref";
  assert.equal(
    isSupabaseConfigured(),
    false,
    "A project URL that does not match the Catalove project ref is rejected"
  );

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://catalove-ref.supabase.co";
  process.env.NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF = "catalove-ref";
  assert.equal(
    isSupabaseConfigured(),
    true,
    "The explicitly selected Catalove project can enable Supabase"
  );

  console.log("✅ Catalove Supabase project isolation tests passed!");
} finally {
  if (previous.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
  if (previous.anonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previous.anonKey;
  if (previous.projectRef === undefined) delete process.env.NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF;
  else process.env.NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF = previous.projectRef;
}
