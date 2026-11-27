import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/services/server-auth";
import { getRequestedStoreSlug } from "@/lib/services/store-service";
import { isManagedAiImagePath } from "@/lib/store-media-path";
import { getAdminSupabase } from "@/lib/supabase/server";
import { MAX_STORED_IMAGE_BYTES, validateImageUpload } from "@/lib/image-upload-validation";
import { resolveAiSuggestedCategoryId } from "@/lib/ai-organize";

export async function POST(req: NextRequest) {
  // Verify seller session with Supabase Auth.
  const session = await verifyServerSession(getRequestedStoreSlug(req));

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
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 4096) {
      return NextResponse.json({ error: "Permintaan foto terlalu besar." }, { status: 413 });
    }

    const body = await req.json().catch(() => null);
    const storagePath = typeof body?.storagePath === "string" ? body.storagePath : "";
    if (!isManagedAiImagePath(storagePath, session.storeId, session.id)) {
      return NextResponse.json(
        { error: "Untuk saran AI, unggah foto ke katalog ini terlebih dahulu. Tautan foto eksternal tetap bisa dipakai tanpa AI." },
        { status: 400 }
      );
    }

    const admin = await getAdminSupabase();
    if (!admin) {
      return NextResponse.json({ available: false, message: "Penyimpanan foto belum siap. Saran AI bisa dicoba lagi nanti." }, { status: 503 });
    }
    const { data: image, error: downloadError } = await admin.storage
      .from("catalove-product-images")
      .download(storagePath);
    if (downloadError || !image) {
      return NextResponse.json({ error: "Foto katalog tidak ditemukan." }, { status: 404 });
    }

    const imageBytes = new Uint8Array(await image.arrayBuffer());
    if (imageBytes.byteLength > MAX_STORED_IMAGE_BYTES) {
      return NextResponse.json({ error: "Ukuran foto untuk saran AI maksimal 2 MB." }, { status: 413 });
    }
    const validation = validateImageUpload(image.type, imageBytes.byteLength, imageBytes);
    if (!validation.ok) {
      return NextResponse.json({ error: "Format foto katalog tidak didukung AI." }, { status: 415 });
    }

    const { data: storeCategories } = await admin
      .from("categories")
      .select("id,slug,name")
      .eq("store_id", session.storeId)
      .eq("is_active", true)
      .limit(100);
    const categories = (storeCategories || []).filter(
      (category): category is { id: string; slug: string; name: string } =>
        typeof category.id === "string" && typeof category.slug === "string" && typeof category.name === "string"
    );
    const categoryOptions = categories.map(({ id, slug, name }) => ({ id, slug, name }));

    // Call Gemini Multimodal API
    // System instruction: suggest highlight tags/variants, draft description, and category for any UMKM product. Never set name or price.
    const prompt = `Anda adalah asisten copywriter & kurator katalog UMKM profesional di platform Catalove (mendukung berbagai bisnis: Fashion, Kuliner/Bakery, Florist, Kerajinan/Craft, Gadget/Gear, Jasa, hingga Lifestyle).
Lihat foto produk ini dan berikan saran untuk pemilik toko:
1. flavor_notes: array berisi 2-4 tag keunggulan, varian, material, atau catatan rasa dalam bahasa Indonesia (contoh: ["Katun Combed 24s", "Jahitan Rapi", "Unisex"] atau ["Cokelat Belgia", "Tanpa Pengawet", "Best Seller"]).
2. suggested_category: pilih tepat satu ID dari daftar kategori toko ini: ${JSON.stringify(categoryOptions)}. Jika tidak ada yang cocok, gunakan null. Jangan membuat ID baru.
3. draft_description: deskripsi elegan, informatif, dan persuasif sebanyak 1-2 kalimat dalam bahasa Indonesia.

PENTING: JANGAN tentukan nama produk atau harga. Nama dan harga wajib diisi sendiri oleh pemilik toko secara manual.

Balas HANYA dalam format JSON valid:
{
  "flavor_notes": ["..."],
  "suggested_category": null,
  "draft_description": "..."
}`;

    const inlineData = {
      mimeType: image.type,
      data: Buffer.from(imageBytes).toString("base64"),
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

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
          responseMimeType: "application/json",
          maxOutputTokens: 512,
          temperature: 0.3,
        },
      }),
      signal: AbortSignal.timeout(20_000),
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
        flavor_notes: Array.isArray(parsed.flavor_notes)
          ? parsed.flavor_notes
              .filter((note: unknown): note is string => typeof note === "string")
              .slice(0, 4)
              .map((note: string) => note.trim().slice(0, 60))
              .filter(Boolean)
          : [],
        suggested_category: resolveAiSuggestedCategoryId(parsed.suggested_category, categoryOptions),
        draft_description: typeof parsed.draft_description === "string" ? parsed.draft_description.trim().slice(0, 500) : "",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({
      available: false,
      message: "Terjadi kendala saat memproses saran AI. Anda dapat melanjutkan pengisian manual.",
    });
  }
}
