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
      <p className="mt-4 text-sm text-stone-500">Terakhir diperbarui: 26 November 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-stone-700 dark:text-stone-300">
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Data yang digunakan</h2>
          <p>Jika kamu membuat pesanan, Catalove memproses nama, nomor WhatsApp, produk dan jumlah pesanan, tanggal, metode pemenuhan, serta alamat atau catatan yang kamu isi. Pengelola katalog juga dapat menyimpan informasi produk, foto, dan pengaturan brand.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Pengelolaan data pesanan</h2>
          <p>Pengelola katalog menerima detail pesanan untuk menghubungi pembeli dan menyiapkan pesanan. Data tersebut tersimpan di sistem Catalove agar pengelola dapat melihat dan menindaklanjuti order. Personel Catalove dapat mengaksesnya seperlunya untuk menjalankan layanan, dukungan, dan keamanan. Data pesanan tidak digunakan untuk iklan Catalove.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Penyedia layanan</h2>
          <p>Data katalog dan pesanan tersimpan melalui Supabase; Google Cloud Run menyajikan aplikasi. Saat kamu membuka tautan WhatsApp, kamu berpindah ke layanan WhatsApp. Jika kamu mengirim pesan di sana, data pesan tunduk pada kebijakan WhatsApp.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Penyimpanan dan permintaan data</h2>
          <p>Data pesanan disimpan selama diperlukan toko untuk menindaklanjuti pesanan dan memenuhi kewajibannya. Hubungi pengelola toko melalui nomor WhatsApp di katalog untuk meminta akses, koreksi, atau penghapusan data pesanan. Untuk masalah akun atau layanan Catalove, gunakan halaman <Link className="font-semibold text-[var(--storefront-accent)] underline" href="/contact">Kontak</Link>. Preferensi dan keranjang lokal dapat dihapus dengan membersihkan data situs pada browser.</p>
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
