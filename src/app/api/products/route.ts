import { NextRequest, NextResponse } from "next/server";
import { cakeService } from "@/lib/services/cake-service";
import { verifyServerSession } from "@/lib/services/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const includeInactive = searchParams.get("includeInactive") === "true";

    if (id) {
      const product = await cakeService.getProductById(id);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ success: true, product });
    }

    if (slug) {
      const product = await cakeService.getProductBySlug(slug);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ success: true, product });
    }

    const products = await cakeService.getProducts({ includeInactive });
    return NextResponse.json({ success: true, products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load products";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("admin_session")?.value;
    const isSeller = await verifyServerSession(cookieToken);
    if (!isSeller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Nama produk wajib diisi" }, { status: 400 });
    }

    const product = await cakeService.createProduct(body);
    return NextResponse.json({ success: true, product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create product";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("admin_session")?.value;
    const isSeller = await verifyServerSession(cookieToken);
    if (!isSeller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const id = searchParams.get("id") || body.id;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const updated = await cakeService.updateProduct(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update product";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("admin_session")?.value;
    const isSeller = await verifyServerSession(cookieToken);
    if (!isSeller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const result = await cakeService.deleteProduct(id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete product";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
