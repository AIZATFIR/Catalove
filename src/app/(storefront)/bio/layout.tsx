import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bio Katalog",
  description: "Halaman ringkas untuk memperkenalkan brand dan membagikan katalog Catalove.",
  alternates: { canonical: "/bio" },
};

export default function BioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
