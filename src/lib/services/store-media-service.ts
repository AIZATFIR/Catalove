import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getManagedStoreImagePath } from "@/lib/store-media-path";

type ImageDeleteResult = "deleted" | "referenced" | "invalid" | "failed";

export async function deleteUnreferencedStoreImage(
  admin: SupabaseClient,
  publicUrl: string,
  projectUrl: string,
  storeId: string,
  userId: string
): Promise<ImageDeleteResult> {
  const storagePath = getManagedStoreImagePath(publicUrl, projectUrl, storeId, userId);
  if (!storagePath) return "invalid";

  const { data: references, error: referenceError } = await admin
    .from("product_images")
    .select("id")
    .eq("storage_path", publicUrl)
    .limit(1);
  if (referenceError) return "failed";
  if (references?.length) return "referenced";

  const { error } = await admin.storage.from("catalove-product-images").remove([storagePath]);
  return error ? "failed" : "deleted";
}
