import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi dan Pengelolaan Data Catalove",
  description: "Pelajari data yang diproses Catalove untuk katalog dan pesanan, cara penyimpanannya, penyedia layanan yang digunakan, serta cara mengajukan permintaan privasi.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-3xl px-5 py-16 text-stone-800 dark:text-stone-100 sm:py-24">
      <Link href="/" className="text-sm font-semibold text-[var(--storefront-accent)]">← Kembali ke Catalove</Link>
      <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Privasi</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Kebijakan Privasi</h1>
      <p className="mt-4 text-sm text-stone-500">Terakhir diperbarui: 27 November 2026</p>

      <aside className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
        <h2 className="font-bold">Mode demo Catalove</h2>
        <p className="mt-1">Versi ini masih demo, bukan layanan untuk pesanan sungguhan. Jangan masukkan data pesanan atau pelanggan sungguhan. Katalog contoh dan perubahan lokal dapat hilang dan tidak tersinkron ke perangkat lain. Informasi penyedia dan retensi data akan disesuaikan dengan infrastruktur aktif sebelum pilot klien dimulai.</p>
      </aside>

      <div className="mt-10 space-y-8 text-sm leading-7 text-stone-700 dark:text-stone-300">
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Data yang digunakan</h2>
          <p>Jika fitur pesanan sudah diaktifkan untuk katalog produksi, data yang diminta dapat mencakup nama, nomor WhatsApp, produk dan jumlah pesanan, tanggal, metode pemenuhan, serta alamat atau catatan yang kamu isi. Pengelola katalog juga dapat menyimpan informasi produk, foto, dan pengaturan brand.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Pengelolaan data pesanan</h2>
          <p>Dalam layanan produksi, pengelola katalog menerima detail pesanan untuk menghubungi pembeli dan menyiapkan pesanan. Personel Catalove dapat mengakses data seperlunya untuk menjalankan layanan, dukungan, dan keamanan. Data pesanan tidak digunakan untuk iklan Catalove. Demo saat ini tidak boleh dipakai untuk mengirim pesanan sungguhan.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Penyedia layanan</h2>
          <p>Target infrastruktur produksi Catalove adalah Supabase untuk data katalog dan pesanan, serta Google Cloud Run untuk menyajikan aplikasi. Keduanya belum menjadi infrastruktur aktif untuk demo ini. Sebelum pilot dimulai, halaman ini akan diperbarui dengan penyedia yang benar-benar aktif. Saat kamu membuka tautan WhatsApp, kamu berpindah ke layanan WhatsApp; pesan yang kamu kirim di sana tunduk pada kebijakan WhatsApp.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Penyimpanan dan permintaan data</h2>
          <p>Jangka waktu penyimpanan data produksi akan ditetapkan dan dijelaskan sebelum pilot klien dimulai. Untuk permintaan akses, koreksi, atau penghapusan data pesanan produksi, hubungi pengelola toko melalui nomor WhatsApp di katalog. Untuk masalah akun atau layanan Catalove, gunakan halaman <Link className="font-semibold text-[var(--storefront-accent)] underline" href="/contact">Kontak</Link>. Preferensi dan keranjang demo tersimpan di browser dan dapat dihapus dengan membersihkan data situs.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Pembayaran</h2>
          <p>Catalove tidak meminta detail kartu pembayaran. Pembayaran pesanan diatur langsung oleh masing-masing toko.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Hubungi kami</h2>
          <p>Untuk pertanyaan privasi atau permintaan terkait data, hubungi pengelola melalui halaman <Link className="font-semibold text-[var(--storefront-accent)] underline" href="/contact">Kontak</Link>.</p>
        </section>
      </div>
    </main>
  );
}
