import { z } from "zod";

export const OrderInputSchema = z.object({
  productId: z.string().min(1, "Produk harus dipilih"),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1, "Jumlah minimal 1 porsi").max(50, "Jumlah maksimal 50 per pesanan"),
  customerName: z.string().trim().min(2, "Nama minimal 2 karakter").max(60, "Nama maksimal 60 karakter"),
  customerWhatsapp: z
    .string()
    .trim()
    .regex(/^(\+62|62|08)[0-9]{8,13}$/, "Nomor WhatsApp tidak valid (contoh: 08123456789 atau 628123456789)"),
  requestedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  fulfillmentMethod: z.enum(["pickup", "delivery", "shipping"]),
  deliveryAddress: z.string().max(250).optional().nullable(),
  cakeInscription: z.string().max(120, "Catatan personal maksimal 120 karakter").optional().nullable(),
  candleCount: z.number().int().min(0).max(100).optional().default(0),
  greetingCardMessage: z.string().max(200, "Pesan kartu ucapan maksimal 200 karakter").optional().nullable(),
  customerNotes: z.string().max(300, "Catatan maksimal 300 karakter").optional().nullable(),
});

export type OrderInput = z.infer<typeof OrderInputSchema>;
