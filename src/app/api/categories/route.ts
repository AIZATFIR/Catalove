import { NextRequest, NextResponse } from "next/server";
import { cakeService } from "@/lib/services/cake-service";
import { verifyServerSession } from "@/lib/services/server-auth";
import { getRequestedStoreSlug, getStoreSlugFromRequest, resolveStoreBySlug } from "@/lib/services/store-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyServerSession(getRequestedStoreSlug(req));
    const store = await resolveStoreBySlug(getStoreSlugFromRequest(req), Boolean(session));
    if (!store) return NextResponse.json({ error: "Katalog tidak ditemukan." }, { status: 404 });
    const categories = await cakeService.getCategories(store.id);
    return NextResponse.json({ success: true, categories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load categories";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyServerSession(getRequestedStoreSlug(req));
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const category = await cakeService.createCategory({
      name: body.name.trim(),
      slug: body.slug,
      description: body.description,
    }, session.storeId);

    return NextResponse.json({ success: true, category });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create category";
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
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const success = await cakeService.deleteCategory(id, session.storeId);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete category";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
