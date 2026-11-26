import { z } from "zod";

export const RESERVED_STORE_SLUGS = new Set([
  "admin", "api", "s", "catalog", "product", "order", "about", "bio", "contact",
  "privacy", "terms", "login", "register",
]);

export const StoreOnboardingSchema = z.object({
  name: z.string().trim().min(2, "Nama toko minimal 2 karakter").max(60, "Nama toko maksimal 60 karakter"),
  slug: z.string().trim().toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/, "Alamat katalog hanya boleh berisi huruf kecil, angka, dan tanda hubung")
    .refine((slug) => !RESERVED_STORE_SLUGS.has(slug), "Alamat katalog tidak tersedia"),
});

export type StoreOnboardingInput = z.infer<typeof StoreOnboardingSchema>;
