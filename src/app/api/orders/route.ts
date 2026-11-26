import { NextRequest, NextResponse } from "next/server";
import { OrderInputSchema } from "@/lib/validators/order";
import { orderService } from "@/lib/services/order-service";
import { verifyServerSession } from "@/lib/services/server-auth";
import { getRequestedStoreSlug, getStoreSlugFromRequest, resolveStoreBySlug } from "@/lib/services/store-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = OrderInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validasi formulir gagal",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await orderService.createOrder(parseResult.data, getStoreSlugFromRequest(req));

    if (result.error || !result.order) {
      return NextResponse.json(
        { error: result.error || "Gagal mencatat pesanan" },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: result.order,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (reference) {
    const store = await resolveStoreBySlug(getStoreSlugFromRequest(req));
    if (!store) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    const order = await orderService.getOrderByReference(reference, store.id);
    if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ order }, { headers: { "Cache-Control": "private, no-store" } });
  }

  // Enforce server-side seller authentication.
  const session = await verifyServerSession(getRequestedStoreSlug(req));

  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak. Silakan masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");

  const allowedStatuses = new Set(["pending", "contacted", "confirmed", "completed", "cancelled"]);
  const orders = await orderService.listOrders(
    status && allowedStatuses.has(status) ? status as any : undefined,
    session.storeId
  );
  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  const session = await verifyServerSession(getRequestedStoreSlug(req));
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orderId = req.nextUrl.searchParams.get("orderId");
  const body = await req.json();
  const allowedStatuses = new Set(["pending", "contacted", "confirmed", "completed", "cancelled"]);
  if (!orderId || !allowedStatuses.has(body.status)) {
    return NextResponse.json({ error: "Status pesanan tidak valid." }, { status: 400 });
  }
  const order = await orderService.updateOrderStatus(orderId, body.status, session.storeId);
  return order
    ? NextResponse.json({ success: true, order })
    : NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
}
