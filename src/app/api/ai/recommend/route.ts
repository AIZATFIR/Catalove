import { NextRequest, NextResponse } from "next/server";
import { recommendationEngine } from "@/lib/services/recommendation-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { occasion, flavor, size, urgency, query } = body;

    // Use deterministic catalog-grounded engine
    const recommendations = await recommendationEngine.matchCakes({
      occasion,
      flavor,
      size,
      urgency,
      query,
    });

    return NextResponse.json({
      success: true,
      recommendations,
      message:
        recommendations.length > 0
          ? "Berikut adalah pilihan kue paling pas dari dapur SofizCake."
          : "Silakan konsultasikan pesanan khusus langsung ke WhatsApp Mama SofizCake.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memproses rekomendasi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
