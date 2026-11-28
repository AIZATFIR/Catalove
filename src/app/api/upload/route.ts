import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAdminSupabase } from "@/lib/supabase/server";
import { verifyServerSession } from "@/lib/services/server-auth";
import { MAX_SOURCE_IMAGE_BYTES, validateImageUpload } from "@/lib/image-upload-validation";
import { getRequestedStoreSlug } from "@/lib/services/store-service";
import { deleteUnreferencedStoreImage } from "@/lib/services/store-media-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await verifyServerSession(getRequestedStoreSlug(req));
  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak. Silakan masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Penyimpanan foto belum dikonfigurasi. Foto tidak disimpan sebagai data lokal." },
      { status: 503 }
    );
  }

  let admin: Awaited<ReturnType<typeof getAdminSupabase>>;
  try {
    admin = await getAdminSupabase();
  } catch {
    admin = null;
  }
  if (!admin) {
    return NextResponse.json(
      { error: "Penyimpanan foto belum siap. Periksa konfigurasi server Catalove." },
      { status: 503 }
    );
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_SOURCE_IMAGE_BYTES + 256 * 1024) {
    return NextResponse.json({ error: "Ukuran foto mentah maksimal 10 MB." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Data foto tidak bisa dibaca. Coba unggah ulang." }, { status: 400 });
  }

  try {
    const entry = formData.get("file");
    if (!(entry instanceof File)) {
      return NextResponse.json({ error: "File foto tidak ditemukan." }, { status: 400 });
    }
    if (entry.size > MAX_SOURCE_IMAGE_BYTES) {
      return NextResponse.json({ error: "Ukuran foto mentah maksimal 10 MB." }, { status: 413 });
    }

    const bytes = new Uint8Array(await entry.arrayBuffer());
    const validation = validateImageUpload(entry.type, entry.size, bytes);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { data: reservationId, error: reservationError } = await admin.rpc("reserve_store_image_upload", {
      p_store_id: session.storeId,
      p_user_id: session.id,
      p_byte_size: bytes.byteLength,
    });
    if (reservationError || !reservationId) {
      const quotaReached = /batas paket|maksimal 2 MB/i.test(reservationError?.message || "");
      console.error("Catalove image quota reservation failed", reservationError?.code || "no reservation");
      return NextResponse.json(
        { error: quotaReached ? "Batas penyimpanan foto katalog tercapai. Hapus foto lama atau hubungi Catalove." : "Batas penyimpanan belum siap. Coba lagi nanti." },
        { status: quotaReached ? 413 : 503 }
      );
    }

    const storagePath = `stores/${session.storeId}/products/${randomUUID()}.${validation.extension}`;
    let uploadFailed = false;
    let publicUrl = "";
    try {
      const { error } = await admin.storage
        .from("catalove-product-images")
        .upload(storagePath, bytes, {
          contentType: entry.type,
          upsert: false,
          cacheControl: "31536000",
        });
      uploadFailed = Boolean(error);
      if (!uploadFailed) {
        publicUrl = admin.storage.from("catalove-product-images").getPublicUrl(storagePath).data.publicUrl;
      }
    } catch {
      uploadFailed = true;
    } finally {
      try {
        const { error } = await admin.rpc("release_store_image_upload", {
          p_reservation_id: reservationId,
          p_store_id: session.storeId,
        });
        if (error) console.error("Catalove image quota reservation cleanup failed", error.code);
      } catch {
        console.error("Catalove image quota reservation cleanup failed");
      }
    }

    if (uploadFailed) {
      console.error("Catalove product image upload failed");
      return NextResponse.json(
        { error: "Foto belum berhasil tersimpan. Coba lagi beberapa saat." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      storage_path: storagePath,
      url: publicUrl,
      mode: "supabase-storage",
    });
  } catch {
    return NextResponse.json(
      { error: "Foto tidak bisa diproses. Pastikan file gambar valid lalu coba lagi." },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifyServerSession(getRequestedStoreSlug(req));
  if (!session) return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Penyimpanan foto belum dikonfigurasi." }, { status: 503 });

  const body = await req.json().catch(() => null);
  if (typeof body?.storage_path !== "string" || body.storage_path.length > 2048) {
    return NextResponse.json({ error: "Alamat foto tidak valid." }, { status: 400 });
  }

  const admin = await getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "Penyimpanan foto belum siap." }, { status: 503 });
  const result = await deleteUnreferencedStoreImage(
    admin,
    body.storage_path,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    session.storeId,
    session.id
  );
  if (result === "invalid") return NextResponse.json({ error: "Foto itu bukan milik katalog ini." }, { status: 403 });
  if (result === "referenced") return NextResponse.json({ error: "Foto masih dipakai produk. Simpan perubahan produk lebih dulu." }, { status: 409 });
  if (result === "failed") return NextResponse.json({ error: "Foto belum berhasil dihapus dari penyimpanan." }, { status: 502 });
  return NextResponse.json({ success: true });
}
