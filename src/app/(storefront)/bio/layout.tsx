import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bio Link Katalog Digital untuk Brand UMKM",
  description: "Bagikan satu halaman bio berisi identitas brand, tautan WhatsApp, sorotan produk, QR code, dan jalan pintas menuju katalog digital.",
  alternates: { canonical: "/bio" },
};

export default function BioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
