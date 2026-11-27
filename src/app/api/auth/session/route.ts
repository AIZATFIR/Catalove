import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/services/server-auth";
import { getRequestedStoreSlug } from "@/lib/services/store-service";

export async function GET(request: NextRequest) {
  const seller = await verifyServerSession(getRequestedStoreSlug(request));
  return seller
    ? NextResponse.json({ authorized: true, storeSlug: seller.storeSlug }, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ authorized: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
}
