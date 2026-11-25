export const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_STORED_IMAGE_BYTES = 2 * 1024 * 1024;

const SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes) =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a,
  "image/webp": (bytes) =>
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50,
};

export type ImageUploadValidation =
  | { ok: true; extension: "jpg" | "png" | "webp" }
  | { ok: false; status: 400 | 413; error: string };

export function validateImageUpload(
  mimeType: string,
  size: number,
  bytes: Uint8Array
): ImageUploadValidation {
  if (size > MAX_STORED_IMAGE_BYTES) {
    return { ok: false, status: 413, error: "Foto hasil kompresi melebihi batas 2 MB." };
  }

  const signature = SIGNATURES[mimeType];
  if (!signature || !signature(bytes)) {
    return {
      ok: false,
      status: 400,
      error: "Format foto tidak valid. Gunakan JPEG, PNG, atau WebP.",
    };
  }

  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
  return { ok: true, extension: extension as "jpg" | "png" | "webp" };
}
