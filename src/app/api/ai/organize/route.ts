import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { isSellerUser, verifyServerSession } from "@/lib/services/server-auth";

export async function POST(req: NextRequest) {
  // 1. Verify seller session
  const serverSupabase = await getServerSupabase();
  let isAuthorized = false;

  if (serverSupabase) {
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (user) {
      isAuthorized = await isSellerUser(user.id);
    }
  } else {
    const authHeader = req.cookies.get("admin_session")?.value;
    const session = await verifyServerSession(authHeader);
    if (session) isAuthorized = true;
  }

  if (!isAuthorized) {
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
      message: "AI Organizer belum aktif (GEMINI_API_KEY belum diatur). Mama dapat mengisi detail produk secara manual.",
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
    // System instruction: suggest flavors, draft description, and category. Never set name or price.
    const prompt = `Anda adalah asisten kuliner SofizCake (bakery artisan rumahan di Indonesia). 
Lihat foto kue ini dan berikan saran untuk pengelola toko:
1. flavor_notes: array berisi 2-4 catatan rasa dalam bahasa Indonesia (contoh: ["Cokelat Belgia", "Krim Vanila", "Stroberi Segar"]).
2. suggested_category: pilih salah satu dari: "whole-cakes", "bento-cakes", "slice-boxes", "hampers".
3. draft_description: deskripsi hangat dan menggugah selera sebanyak 1-2 kalimat dalam bahasa Indonesia.

PENTING: JANGAN tentukan nama kue atau harga. Nama dan harga wajib diisi sendiri oleh pemilik toko secara manual.

Balas HANYA dalam format JSON valid:
{
  "flavor_notes": ["..."],
  "suggested_category": "whole-cakes",
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
        message: "Foto belum dapat dianalisis secara otomatis. Mama dapat mengisi detail rasa dan deskripsi secara manual.",
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
        message: "Layanan saran AI sedang tidak dapat dijangkau. Mama dapat mengisi detail produk secara manual.",
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
        suggested_category: parsed.suggested_category || "whole-cakes",
        draft_description: parsed.draft_description || "",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({
      available: false,
      message: "Terjadi kendala saat memproses saran AI. Mama dapat melanjutkan pengisian manual.",
    });
  }
}
