import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/services/server-auth";

export async function POST(req: NextRequest) {
  // Verify seller session with Supabase Auth.
  const session = await verifyServerSession();

  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak. Silakan masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  // 2. Check server-only GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      available: false,
      message: "AI Organizer belum aktif (GEMINI_API_KEY belum diatur). Anda dapat mengisi detail produk secara manual.",
    });
  }

  try {
    const body = await req.json();
    const { imageUrl, photoUrl } = body;
    const targetUrl = imageUrl || photoUrl;

    if (!targetUrl) {
      return NextResponse.json(
        { available: true, error: "Tautan foto diperlukan untuk analisis AI." },
        { status: 400 }
      );
    }

    // Call Gemini Multimodal API
    // System instruction: suggest highlight tags/variants, draft description, and category for any UMKM product. Never set name or price.
    const prompt = `Anda adalah asisten copywriter & kurator katalog UMKM profesional di platform Catalove (mendukung berbagai bisnis: Fashion, Kuliner/Bakery, Florist, Kerajinan/Craft, Gadget/Gear, Jasa, hingga Lifestyle).
Lihat foto produk ini dan berikan saran untuk pemilik toko:
1. flavor_notes: array berisi 2-4 tag keunggulan, varian, material, atau catatan rasa dalam bahasa Indonesia (contoh: ["Katun Combed 24s", "Jahitan Rapi", "Unisex"] atau ["Cokelat Belgia", "Tanpa Pengawet", "Best Seller"]).
2. suggested_category: pilih salah satu slug kategori yang paling relevan: "best-seller", "new-arrivals", "bundling-hemat", "koleksi-khusus", "whole-cakes", "hampers".
3. draft_description: deskripsi elegan, informatif, dan persuasif sebanyak 1-2 kalimat dalam bahasa Indonesia.

PENTING: JANGAN tentukan nama produk atau harga. Nama dan harga wajib diisi sendiri oleh pemilik toko secara manual.

Balas HANYA dalam format JSON valid:
{
  "flavor_notes": ["..."],
  "suggested_category": "best-seller",
  "draft_description": "..."
}`;

    // Fetch image bytes to base64 if needed, or pass url
    let inlineData: { mimeType: string; data: string } | null = null;

    if (targetUrl.startsWith("data:")) {
      const match = targetUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        inlineData = { mimeType: match[1], data: match[2] };
      }
    } else if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
      const imgRes = await fetch(targetUrl);
      if (imgRes.ok) {
        const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
        const buffer = await imgRes.arrayBuffer();
        inlineData = {
          mimeType,
          data: Buffer.from(buffer).toString("base64"),
        };
      }
    }

    if (!inlineData) {
      return NextResponse.json({
        available: true,
        message: "Foto belum dapat dianalisis secara otomatis. Anda dapat mengisi detail tag dan deskripsi secara manual.",
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: inlineData.mimeType,
                  data: inlineData.data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.3,
        },
      }),
    });

    if (!geminiRes.ok) {
      return NextResponse.json({
        available: false,
        message: "Layanan saran AI sedang tidak dapat dijangkau. Anda dapat mengisi detail produk secara manual.",
      });
    }

    const geminiData = await geminiRes.json();
    const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return NextResponse.json({
        available: false,
        message: "AI belum dapat menghasilkan saran untuk foto ini.",
      });
    }

    const parsed = JSON.parse(candidateText);

    return NextResponse.json({
      available: true,
      suggestions: {
        flavor_notes: Array.isArray(parsed.flavor_notes) ? parsed.flavor_notes : [],
        suggested_category: parsed.suggested_category || "best-seller",
        draft_description: parsed.draft_description || "",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({
      available: false,
      message: "Terjadi kendala saat memproses saran AI. Anda dapat melanjutkan pengisian manual.",
    });
  }
}
