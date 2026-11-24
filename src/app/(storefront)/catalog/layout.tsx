import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Katalog Produk: Jelajahi dan Cari Koleksi Brand",
  description: "Temukan produk dari berbagai koleksi, cari berdasarkan nama atau kategori, lalu lanjutkan pilihanmu langsung ke katalog dan WhatsApp brand.",
  alternates: { canonical: "/catalog" },
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
