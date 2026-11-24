import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tentang Catalove: Katalog Digital untuk UMKM",
  description: "Kenali cara Catalove membantu usaha kecil menyusun katalog produk, mengatur tampilan brand, dan mengarahkan pembeli ke WhatsApp.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-3xl px-5 py-16 text-stone-800 dark:text-stone-100 sm:py-24">
      <Link href="/" className="text-sm font-semibold text-[var(--storefront-accent)]">← Kembali ke Catalove</Link>
      <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Tentang</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Katalog digital yang mudah diurus.</h1>
      <div className="mt-8 space-y-5 text-base leading-8 text-stone-600 dark:text-stone-300">
        <p>Catalove membantu pemilik usaha menampilkan produk dalam katalog yang nyaman dilihat dan mudah dibagikan. Setiap katalog bisa menyesuaikan warna, susunan konten, dan cara pelanggan menghubungi brand. Pemilik usaha dapat mengatur tampilan melalui Canvas Studio, lalu melihat hasilnya langsung di halaman toko.</p>
        <p>Pengunjung dapat menjelajahi koleksi, mencari produk berdasarkan kategori, menyimpan pilihan, dan menambahkan item ke tas sebelum meneruskan pesanan ke WhatsApp. Pengelola katalog bisa mengatur variasi tampilan seperti grid, waterfall, dan snap feed agar pilihan produk lebih mudah dijelajahi di ponsel.</p>
        <p>Selain halaman utama, setiap brand memiliki halaman bio untuk mengumpulkan tautan penting dan membagikan katalog lewat QR. Lihat <Link href="/catalog" className="font-semibold text-[var(--storefront-accent)] underline">contoh katalog</Link> atau <Link href="/bio" className="font-semibold text-[var(--storefront-accent)] underline">contoh halaman bio</Link> untuk melihat alur pengunjung.</p>
        <p>Catalove dirancang untuk membantu usaha kecil mulai dengan sederhana, tanpa perlu membangun situs dari nol. Detail paket, pengelolaan katalog, dan pertanyaan lainnya bisa dibahas lewat halaman <Link href="/contact" className="font-semibold text-[var(--storefront-accent)] underline">kontak</Link>.</p>
      </div>
      <Link href="/contact" className="mt-8 inline-flex rounded-full bg-[var(--storefront-accent)] px-5 py-3 text-sm font-bold text-white">Hubungi Catalove</Link>
    </main>
  );
}
