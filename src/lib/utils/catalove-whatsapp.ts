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
    "Mohon rincian scope, periode tagihan, biaya hosting/domain, dan proses mulai sebelum saya menyetujui. Terima kasih.",
  ].join("\n\n");

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
