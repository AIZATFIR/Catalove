import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk ke Catalove Studio untuk Kelola Katalog",
  description: "Portal pengelola Catalove untuk mengatur produk, pesanan, ketersediaan, dan tampilan katalog brand.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/login" },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
