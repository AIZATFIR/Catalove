import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAdminSupabase } from "@/lib/supabase/server";
import { verifyServerSession } from "@/lib/services/server-auth";

export async function POST(req: NextRequest) {
  // Verify seller authorization with Supabase Auth.
  const session = await verifyServerSession();

  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak. Silakan masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File foto tidak ditemukan." }, { status: 400 });
    }

    // Validate mime type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format foto tidak didukung. Harap unggah JPEG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran foto melebihi batas 10MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const storagePath = `products/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeName}`;

    // 2. Upload to Supabase Storage if configured, with resilient base64 fallback if bucket isn't provisioned yet
    if (isSupabaseConfigured()) {
      try {
        const admin = await getAdminSupabase();
        if (admin) {
          const { error: uploadError } = await admin.storage
            .from("cake-images")
            .upload(storagePath, buffer, {
              contentType: file.type,
              upsert: false,
            });

          if (!uploadError) {
            const { data: publicUrlData } = admin.storage
              .from("cake-images")
              .getPublicUrl(storagePath);

            return NextResponse.json({
              success: true,
              storage_path: storagePath,
              url: publicUrlData.publicUrl,
              mode: "supabase-storage",
            });
          }
        }
      } catch {
        // Fall through cleanly to local base64 fallback so UMKM studio uploads never get stuck
      }
    }

    // 3. Local base64 dataUrl fallback when Supabase is unconfigured or storage bucket is absent
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      storage_path: `local-${safeName}`,
      url: dataUrl,
      mode: "local-base64-fallback",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah foto.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
