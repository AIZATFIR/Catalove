export function buildStoreContactWhatsAppUrl(
  phoneNumber: string | null | undefined,
  storeName: string
): string | null {
  const internationalNumber = normalizeWhatsAppNumber(phoneNumber);
  if (!internationalNumber) return null;

  const name = storeName.trim().slice(0, 80) || "toko ini";
  const message = `Halo ${name}, saya tertarik dengan produk di katalogmu. Bisa dibantu?`;
  return `https://wa.me/${internationalNumber}?text=${encodeURIComponent(message)}`;
}

export function normalizeWhatsAppNumber(phoneNumber: string | null | undefined): string | null {
  const digits = (phoneNumber || "").replace(/\D/g, "");
  const internationalNumber = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return internationalNumber.length >= 10 && internationalNumber.length <= 15
    ? internationalNumber
    : null;
}
