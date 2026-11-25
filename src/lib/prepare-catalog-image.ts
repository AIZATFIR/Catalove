import { MAX_SOURCE_IMAGE_BYTES, MAX_STORED_IMAGE_BYTES } from "@/lib/image-upload-validation";

const MAX_EDGE = 1600;
const MAX_PIXELS = 40_000_000;

export async function prepareCatalogImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Pilih file foto JPEG, PNG, atau WebP.");
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("Ukuran foto mentah maksimal 10 MB.");
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    if (bitmap.width * bitmap.height > MAX_PIXELS) {
      throw new Error("Resolusi foto terlalu besar. Pilih foto dengan resolusi lebih kecil.");
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Browser ini belum bisa memproses foto. Coba browser terbaru.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let outputType: "image/webp" | "image/jpeg" = "image/webp";
    let blob = await canvasBlob(canvas, outputType, 0.82);
    // Some browsers silently return PNG when WebP encoding is unsupported.
    // Keep the filename and Content-Type aligned with the actual encoded bytes.
    if (blob.type !== "image/webp") {
      outputType = "image/jpeg";
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "source-over";
      blob = await canvasBlob(canvas, outputType, 0.82);
    }
    if (blob.size > MAX_STORED_IMAGE_BYTES) {
      blob = await canvasBlob(canvas, outputType, 0.68);
    }
    if (blob.size > MAX_STORED_IMAGE_BYTES) {
      throw new Error("Foto masih lebih dari 2 MB setelah kompresi. Pilih foto lain.");
    }

    const extension = outputType === "image/jpeg" ? "jpg" : "webp";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "foto"}.${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Foto tidak bisa dibaca. Coba simpan ulang sebagai JPEG atau WebP.");
  } finally {
    bitmap?.close();
  }
}

function canvasBlob(canvas: HTMLCanvasElement, type: "image/webp" | "image/jpeg", quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Gagal mengompres foto.")),
      type,
      quality
    );
  });
}
