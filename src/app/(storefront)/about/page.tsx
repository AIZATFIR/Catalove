import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tentang Catalove",
  description: "Kenali Catalove, alat sederhana untuk membuat dan mengelola katalog digital brand.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-16 text-stone-800 dark:text-stone-100 sm:py-24">
      <Link href="/" className="text-sm font-semibold text-[var(--storefront-accent)]">← Kembali ke Catalove</Link>
      <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Tentang</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Katalog digital yang mudah diurus.</h1>
      <div className="mt-8 space-y-5 text-base leading-8 text-stone-600 dark:text-stone-300">
        <p>Catalove membantu pemilik usaha menampilkan produk dalam katalog yang nyaman dilihat dan mudah dibagikan. Setiap katalog bisa menyesuaikan warna, susunan konten, dan cara pelanggan menghubungi brand.</p>
        <p>Pengunjung dapat menjelajahi koleksi, menyimpan pilihan, lalu meneruskan pesanan ke WhatsApp. Pengelola dapat memperbarui produk dan tampilan lewat studio katalog.</p>
        <p>Catalove terus dikembangkan sebagai alat katalog yang praktis untuk usaha dengan berbagai ukuran.</p>
      </div>
      <Link href="/contact" className="mt-8 inline-flex rounded-full bg-[var(--storefront-accent)] px-5 py-3 text-sm font-bold text-white">Hubungi Catalove</Link>
    </main>
  );
}
