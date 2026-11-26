import { z } from "zod";

export const ProductVariantInputSchema = z.object({
  id: z.string().max(100).optional(),
  name: z.string().min(1, "Nama varian wajib diisi").max(100),
  price: z.number().finite().min(0, "Harga varian tidak boleh negatif").max(999999999999),
  is_default: z.boolean().default(false),
  display_order: z.number().int().default(0),
});

export const ProductSpecInputSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(500),
});

const ProductImageUrlSchema = z.string().max(2048).url().refine((value) => {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, "URL foto harus menggunakan HTTP atau HTTPS.");

export const ProductInputSchema = z.object({
  name: z.string().trim().min(3, "Nama produk minimal 3 karakter").max(100),
  category_id: z.string().max(100).optional().nullable().or(z.literal("")),
  tagline: z.string().trim().max(160).optional().nullable().or(z.literal("")),
  badge: z.string().trim().max(40).optional().nullable().or(z.literal("")),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(4000),
  flavor_notes: z.array(z.string().max(80)).max(30).default([]),
  specs: z.array(ProductSpecInputSchema).max(50).optional().default([]),
  base_price: z.number().finite().min(1000, "Harga minimal Rp 1.000").max(999999999999),
  compare_at_price: z.number().finite().min(0).max(999999999999).optional().nullable(),
  minimum_lead_time_days: z.number().int().min(0).max(30),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  variants: z.array(ProductVariantInputSchema).max(30).default([]),
  images: z
    .array(
      z.object({
        storage_path: ProductImageUrlSchema,
        alt_text: z.string().max(200).default("Foto produk"),
        is_primary: z.boolean().default(false),
        display_order: z.number().int().default(0),
      })
    )
    .max(10)
    .default([]),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;
