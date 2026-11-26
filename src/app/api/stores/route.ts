import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, getServerSupabase } from "@/lib/supabase/server";
import { getRequestedStoreSlug, getStoreSlugFromRequest, resolveStoreBySlug } from "@/lib/services/store-service";
import { verifyServerSession } from "@/lib/services/server-auth";
import { StoreOnboardingSchema } from "@/lib/validators/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await verifyServerSession(getRequestedStoreSlug(request));
  const store = await resolveStoreBySlug(getStoreSlugFromRequest(request), Boolean(session));
  if (!store) return NextResponse.json({ error: "Katalog tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ store, isAdmin: Boolean(session) }, {
    headers: { "Cache-Control": session ? "no-store" : "public, max-age=60, stale-while-revalidate=300" },
  });
}

export async function POST(request: NextRequest) {
  const parsed = StoreOnboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data katalog tidak valid." }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Koneksi database belum tersedia." }, { status: 503 });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Silakan masuk untuk membuat katalog." }, { status: 401 });
  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: "Verifikasi alamat email sebelum membuat katalog." }, { status: 403 });
  }

  const { data, error } = await supabase.rpc("create_store_for_current_user", {
    p_store_name: parsed.data.name,
    p_store_slug: parsed.data.slug,
  });
  if (error || !data) {
    const message = error?.message || "Katalog belum berhasil dibuat.";
    const status = /sudah digunakan|satu katalog|satu akun/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ success: true, store: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const session = await verifyServerSession(getRequestedStoreSlug(request));
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.status !== "draft" && body?.status !== "published") {
    return NextResponse.json({ error: "Status katalog tidak valid." }, { status: 400 });
  }

  const admin = await getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "Koneksi database belum tersedia." }, { status: 503 });
  if (body.status === "published") {
    const [{ data: settings }, { count: productCount }] = await Promise.all([
      admin.from("business_settings").select("store_name,seller_whatsapp").eq("store_id", session.storeId).maybeSingle(),
      admin.from("products").select("id", { count: "exact", head: true }).eq("store_id", session.storeId).eq("is_active", true),
    ]);
    if (!settings?.store_name?.trim() || !/^\+?[0-9]{10,15}$/.test(settings.seller_whatsapp || "")) {
      return NextResponse.json({ error: "Isi nama toko dan nomor WhatsApp yang valid sebelum menerbitkan katalog." }, { status: 422 });
    }
    if (!productCount) return NextResponse.json({ error: "Tambahkan minimal satu produk aktif sebelum menerbitkan katalog." }, { status: 422 });
  }

  const { data, error } = await admin
    .from("stores")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", session.storeId)
    .select("id,slug,name,status,plan")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Status katalog tidak bisa diperbarui." }, { status: 500 });
  return NextResponse.json({ success: true, store: data }, { headers: { "Cache-Control": "no-store" } });
}
