import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAdminSupabase, getServerSupabase } from "@/lib/supabase/server";
import { isSellerUser, verifyServerSession } from "@/lib/services/server-auth";

export async function POST(req: NextRequest) {
  // 1. Verify seller authorization
  const serverSupabase = await getServerSupabase();
  let isAuthorized = false;

  if (serverSupabase) {
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (user) {
      isAuthorized = await isSellerUser(user.id);
    }
  } else {
    // Local demo dev fallback
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

    // 2. Upload to Supabase Storage if configured
    if (isSupabaseConfigured()) {
      const admin = await getAdminSupabase();
      if (!admin) {
        return NextResponse.json({ error: "Koneksi Supabase Storage gagal." }, { status: 500 });
      }

      // Ensure bucket exists or insert
      const { error: uploadError } = await admin.storage
        .from("cake-images")
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Gagal mengunggah foto ke storage: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Public URL
      const { data: publicUrlData } = admin.storage
        .from("cake-images")
        .getPublicUrl(storagePath);

      return NextResponse.json({
        success: true,
        storage_path: storagePath,
        url: publicUrlData.publicUrl,
      });
    }

    // 3. Fallback for local dev when Supabase keys are not set
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      storage_path: `local-${safeName}`,
      url: dataUrl,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah foto.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
