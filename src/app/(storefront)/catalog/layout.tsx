import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Katalog Produk",
  description: "Jelajahi koleksi produk, cari berdasarkan kategori, dan temukan pilihan yang cocok.",
  alternates: { canonical: "/catalog" },
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
