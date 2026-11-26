import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

function unavailable() {
  return NextResponse.json(
    { status: "unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return unavailable();

  try {
    const admin = await getAdminSupabase();
    if (!admin) return unavailable();

    const { data, error } = await admin
      .from("stores")
      .select("id")
      .eq("slug", "catalove")
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) return unavailable();

    return NextResponse.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return unavailable();
  }
}
