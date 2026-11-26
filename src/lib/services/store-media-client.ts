import { withStoreSlug } from "@/lib/store-routing";

export async function discardUnattachedStoreImage(storagePath: string): Promise<void> {
  const response = await fetch(withStoreSlug("/api/upload"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storage_path: storagePath }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Foto belum berhasil dihapus.");
}
