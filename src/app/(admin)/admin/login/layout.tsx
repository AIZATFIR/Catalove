import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk Studio",
  description: "Masuk ke studio pengelola Catalove.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/login" },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
