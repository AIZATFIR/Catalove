import { NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/services/server-auth";

export async function GET() {
  const seller = await verifyServerSession();
  return seller
    ? NextResponse.json({ authorized: true }, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ authorized: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
}
