export type CatalovePlan = "business" | "enterprise";

const STARTING_PRICES: Record<CatalovePlan, string> = {
  business: "Rp299rb",
  enterprise: "Rp799rb",
};

export function buildCataloveInquiryWhatsAppUrl(
  phoneNumber = "6285946689168",
  plan?: CatalovePlan
): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "") || "6285946689168";
  const packageLine = plan
    ? `Saya tertarik dengan paket ${plan === "business" ? "Business" : "Enterprise"} (mulai ${STARTING_PRICES[plan]}).`
    : "Saya ingin tahu pilihan paket katalog Catalove.";
  const message = [
    "Halo Catalove,",
    packageLine,
    "Sebelum mulai, mohon kirim penawaran tertulis yang merinci pekerjaan, harga dan periode tagihan, biaya bulanan layanan server bersama yang dibayar ke Catalove, biaya serta perpanjangan domain khusus (jika dipilih), batas layanan, timeline, revisi, dukungan, dan cara berhenti atau ekspor data.",
    "Pesan ini hanya permintaan informasi. Saya belum menyetujui biaya atau memesan layanan.",
  ].join("\n\n");

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
