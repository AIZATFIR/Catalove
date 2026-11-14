import { z } from "zod";

export const ProductVariantInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama varian wajib diisi"),
  price: z.number().min(0, "Harga varian tidak boleh negatif"),
  is_default: z.boolean().default(false),
  display_order: z.number().int().default(0),
});

export const ProductSpecInputSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

export const ProductInputSchema = z.object({
  name: z.string().trim().min(3, "Nama produk minimal 3 karakter"),
  category_id: z.string().optional().nullable().or(z.literal("")),
  tagline: z.string().trim().optional().nullable().or(z.literal("")),
  badge: z.string().trim().optional().nullable().or(z.literal("")),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter"),
  flavor_notes: z.array(z.string()).default([]),
  specs: z.array(ProductSpecInputSchema).optional().default([]),
  base_price: z.number().min(1000, "Harga minimal Rp 1.000"),
  compare_at_price: z.number().min(0).optional().nullable(),
  minimum_lead_time_days: z.number().int().min(0).max(30),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  variants: z.array(ProductVariantInputSchema).default([]),
  images: z
    .array(
      z.object({
        storage_path: z.string().url("URL gambar tidak valid"),
        alt_text: z.string().default("Foto produk"),
        is_primary: z.boolean().default(false),
        display_order: z.number().int().default(0),
      })
    )
    .default([]),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;
