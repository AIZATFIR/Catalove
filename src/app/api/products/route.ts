import { NextRequest, NextResponse } from "next/server";
import { cakeService } from "@/lib/services/cake-service";
import { verifyServerSession } from "@/lib/services/server-auth";
import { getRequestedStoreSlug, getStoreSlugFromRequest, resolveStoreBySlug } from "@/lib/services/store-service";
import { getAdminSupabase } from "@/lib/supabase/server";
import { deleteUnreferencedStoreImage } from "@/lib/services/store-media-service";
import { ProductInputSchema } from "@/lib/validators/product";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const storeSlug = getStoreSlugFromRequest(req);
    const sellerSession = includeInactive || id || slug ? await verifyServerSession(storeSlug) : null;

    if (includeInactive && !sellerSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const store = await resolveStoreBySlug(storeSlug, Boolean(sellerSession));
    if (!store) return NextResponse.json({ error: "Katalog tidak ditemukan." }, { status: 404 });

    if (id) {
      const product = await cakeService.getProductById(id, store.id);
      if (!product || (!product.is_active && !sellerSession)) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, product });
    }

    if (slug) {
      const product = await cakeService.getProductBySlug(slug, store.id);
      if (!product || (!product.is_active && !sellerSession)) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, product });
    }

    const products = await cakeService.getProducts({
      includeInactive,
      categoryId: searchParams.get("categoryId") || undefined,
      search: searchParams.get("search") || undefined,
      readyOnly: searchParams.get("readyOnly") === "true",
      sort: searchParams.get("sort") || undefined,
    }, store.id);
    return NextResponse.json({ success: true, products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load products";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyServerSession(getRequestedStoreSlug(req));
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = ProductInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data produk tidak valid." }, { status: 400 });

    const product = await cakeService.createProduct(parsed.data, session.storeId);
    return NextResponse.json({ success: true, product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create product";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifyServerSession(getRequestedStoreSlug(req));
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => null);
    const parsed = ProductInputSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data produk tidak valid." }, { status: 400 });
    const updates = parsed.data;
    const id = searchParams.get("id") || (typeof body?.id === "string" ? body.id : undefined);

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const admin = await getAdminSupabase();
    const { data: oldImages } = admin && Array.isArray(updates.images)
      ? await admin.from("product_images").select("storage_path").eq("store_id", session.storeId).eq("product_id", id)
      : { data: [] };

    const updated = await cakeService.updateProduct(id, updates, session.storeId);
    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (admin && Array.isArray(updates.images)) {
      const retainedUrls = new Set(updated.images?.map((image) => image.storage_path) || []);
      for (const image of oldImages || []) {
        if (typeof image.storage_path !== "string" || retainedUrls.has(image.storage_path)) continue;
        const result = await deleteUnreferencedStoreImage(
          admin,
          image.storage_path,
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          session.storeId,
          session.id
        );
        if (result === "failed") console.error("Catalove replaced image cleanup failed");
      }
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update product";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyServerSession(getRequestedStoreSlug(req));
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const admin = await getAdminSupabase();
    const { data: oldImages } = admin
      ? await admin.from("product_images").select("storage_path").eq("store_id", session.storeId).eq("product_id", id)
      : { data: [] };
    const result = await cakeService.deleteProduct(id, session.storeId);
    if (result.success && !result.softDeleted && admin) {
      for (const image of oldImages || []) {
        if (typeof image.storage_path !== "string") continue;
        const deleted = await deleteUnreferencedStoreImage(
          admin,
          image.storage_path,
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          session.storeId,
          session.id
        );
        if (deleted === "failed") console.error("Catalove deleted product image cleanup failed");
      }
    }
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete product";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await verifyServerSession(getRequestedStoreSlug(req));
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!Array.isArray(body.productIds) || body.productIds.length > 500 || body.productIds.some((id: unknown) => typeof id !== "string")) {
    return NextResponse.json({ error: "Urutan produk tidak valid." }, { status: 400 });
  }
  await cakeService.reorderProducts(body.productIds, session.storeId);
  return NextResponse.json({ success: true });
}
