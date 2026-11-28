import { NextRequest, NextResponse } from "next/server";
import { getRequestedStoreSlug } from "@/lib/services/store-service";
import { verifyServerSession } from "@/lib/services/server-auth";
import { getAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await verifyServerSession(getRequestedStoreSlug(request));
  if (!session) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });

  const admin = await getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "Koneksi database belum tersedia." }, { status: 503 });

  const [store, settings, categories, products, variants, images, availability, orders, orderItems] = await Promise.all([
    admin.from("stores").select("id,slug,name,plan,status,created_at").eq("id", session.storeId).maybeSingle(),
    admin.from("business_settings").select("*").eq("store_id", session.storeId).maybeSingle(),
    admin.from("categories").select("*").eq("store_id", session.storeId),
    admin.from("products").select("*").eq("store_id", session.storeId),
    admin.from("product_variants").select("*").eq("store_id", session.storeId),
    admin.from("product_images").select("*").eq("store_id", session.storeId),
    admin.from("product_availability").select("*").eq("store_id", session.storeId),
    admin.from("order_requests").select("*").eq("store_id", session.storeId),
    admin.from("order_request_items").select("*").eq("store_id", session.storeId),
  ]);

  const results = [store, settings, categories, products, variants, images, availability, orders, orderItems];
  const failed = results.find((result) => result.error);
  if (failed?.error || !store.data) {
    console.error("Catalove store export failed", failed?.error?.code || "store missing");
    return NextResponse.json({ error: "Data katalog belum berhasil diekspor. Coba lagi nanti." }, { status: 500 });
  }

  const filename = `catalove-${store.data.slug}-export.json`;
  return new NextResponse(JSON.stringify({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    store: store.data,
    settings: settings.data,
    categories: categories.data,
    products: products.data,
    variants: variants.data,
    images: images.data,
    availability: availability.data,
    orders: orders.data,
    orderItems: orderItems.data,
    mediaNote: "Foto tidak disertakan sebagai file. Kolom gambar berisi URL/path referensi yang dapat dipindahkan terpisah.",
  }, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
