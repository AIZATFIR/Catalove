import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi dan Pengelolaan Data Catalove",
  description: "Cara Catalove mengelola data katalog, pesanan, dan preferensi pengunjung.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-3xl px-5 py-16 text-stone-800 dark:text-stone-100 sm:py-24">
      <Link href="/" className="text-sm font-semibold text-[var(--storefront-accent)]">← Kembali ke Catalove</Link>
      <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Privasi</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Kebijakan Privasi</h1>
      <p className="mt-4 text-sm text-stone-500">Terakhir diperbarui: 16 November 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-stone-700 dark:text-stone-300">
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Data yang digunakan</h2>
          <p>Jika kamu membuat pesanan, Catalove memproses nama, nomor WhatsApp, produk dan jumlah pesanan, tanggal, metode pemenuhan, serta alamat atau catatan yang kamu isi. Pengelola katalog juga dapat menyimpan informasi produk, foto, dan pengaturan brand.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Tujuan dan penyimpanan</h2>
          <p>Informasi pesanan digunakan untuk meneruskan dan mengelola pesanan dengan toko terkait. Catalove memakai penyimpanan browser untuk preferensi tampilan dan keranjang. Data katalog dan pesanan yang tersambung ke layanan online disimpan melalui Supabase; situs ini disajikan melalui Vercel.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Pengolah data pihak ketiga (subprosesor)</h2>
          <p>Saat kamu memilih WhatsApp, kamu berpindah ke layanan WhatsApp dan data yang kamu kirim tunduk pada kebijakan WhatsApp. Supabase menyediakan layanan database dan penyimpanan file, sedangkan Vercel menyediakan hosting. Penyedia tersebut memproses data untuk menjalankan layanan Catalove.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Pilihan dan permintaan</h2>
          <p>Kamu dapat menghubungi pengelola untuk memperbaiki atau meminta penghapusan data pesanan. Preferensi dan keranjang lokal dapat dihapus dengan membersihkan data situs pada browser. Catalove tidak meminta detail kartu pembayaran.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Hubungi kami</h2>
          <p>Untuk pertanyaan privasi atau permintaan terkait data, hubungi pengelola melalui halaman <Link className="font-semibold text-[var(--storefront-accent)] underline" href="/contact">Kontak</Link>.</p>
        </section>
      </div>
    </main>
  );
}
