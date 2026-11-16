import { NextRequest, NextResponse } from "next/server";
import { OrderInputSchema } from "@/lib/validators/order";
import { orderService } from "@/lib/services/order-service";
import { verifyServerSession } from "@/lib/services/server-auth";

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

    const result = await orderService.createOrder(parseResult.data);

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
  // Enforce server-side seller authentication.
  const session = await verifyServerSession();

  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak. Silakan masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");

  const orders = await orderService.listOrders(status as any);
  return NextResponse.json({ orders });
}
