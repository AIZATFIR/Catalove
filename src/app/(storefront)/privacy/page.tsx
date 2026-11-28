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
      <p className="mt-4 text-sm text-stone-500">Terakhir diperbarui: 28 November 2026</p>

      <aside className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
        <h2 className="font-bold">Preview Catalove</h2>
        <p className="mt-1">Catalove masih preview dan belum untuk pesanan atau data pelanggan sungguhan. Jika kamu mendaftar dan menyimpan katalog, data akun serta katalog dikirim ke project Supabase khusus Catalove pada paket Free; project dapat dipause setelah tidak aktif dan tidak memiliki backup otomatis. Mode demo lokal dapat menyimpan sebagian perubahan hanya di browser ini. Jangan masukkan alamat, nomor WhatsApp, atau catatan milik pembeli sungguhan.</p>
      </aside>

      <div className="mt-10 space-y-8 text-sm leading-7 text-stone-700 dark:text-stone-300">
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Data yang digunakan</h2>
          <p>Pendaftaran pengelola menggunakan alamat email, kata sandi yang diproses oleh Supabase Auth, nama brand, dan alamat katalog. Pengelola juga dapat menyimpan nama produk, harga, variasi, stok, foto, nomor WhatsApp toko, dan pengaturan tampilan. Foto produk di katalog bersifat publik. Formulir permintaan order dapat meminta nama, nomor WhatsApp, produk dan jumlah, tanggal, metode pemenuhan, alamat, serta catatan. Jangan gunakan form order demo untuk pembeli sungguhan.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Pengelolaan data pesanan</h2>
          <p>Permintaan order pada layanan terhubung dapat disimpan di database sebelum pembeli memilih untuk membuka dan mengirim pesan WhatsApp. Pengelola toko bertanggung jawab atas kebenaran produk, harga, ketersediaan, konfirmasi, pembayaran, dan pemenuhan. Catalove mengoperasikan perangkat lunak dan dapat mengakses data seperlunya untuk keamanan dan dukungan; peran hukum setiap pihak harus dituangkan dalam ketentuan layanan sebelum pilot. Data kontak order tidak digunakan untuk iklan Catalove.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Penyedia layanan</h2>
          <p>Situs publik dan preview saat ini di-host di Vercel; Supabase digunakan untuk autentikasi, database, dan foto katalog. Layanan produksi katalog klien di Cloud Run belum dikonfigurasi dan belum dibuka. Supabase Free tidak menyediakan backup otomatis dan dapat dipause setelah periode tidak aktif. Saat membuka tautan WhatsApp, kamu berpindah ke layanan WhatsApp dan tunduk pada kebijakan layanan tersebut. Penyedia aktif dan lokasi pemrosesan harus diperbarui sebelum layanan klien diluncurkan.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Saran AI dari foto</h2>
          <p>Jika fitur ini diaktifkan, foto produk yang dipilih dan nama kategori toko dikirim ke Google Gemini hanya setelah pengelola menekan tombol saran AI. Data pesanan dan pembeli tidak dikirim. Jangan gunakan foto pelanggan atau dokumen sensitif. Kebijakan Google membedakan penggunaan API Free dan Paid: konten pada Free dapat digunakan untuk peningkatan produk, sedangkan Paid menyatakan konten tidak digunakan untuk itu. Catalove menjaga fitur ini nonaktif sampai paket Paid, ketentuan data, dan anggaran penggunaan diverifikasi. <a className="font-semibold text-[var(--storefront-accent)] underline" href="https://ai.google.dev/gemini-api/docs/pricing">Lihat ketentuan penggunaan data Gemini</a>.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Penyimpanan dan permintaan data</h2>
          <p>Jadwal retensi dan penghapusan data layanan klien belum ditetapkan; karena itu, jangan kirim data pembeli sungguhan lewat preview. Untuk akses, koreksi, atau penghapusan akun/data preview, hubungi Catalove lewat halaman <Link className="font-semibold text-[var(--storefront-accent)] underline" href="/contact">Kontak</Link>. Untuk data order toko, hubungi pengelola toko. Preferensi dan katalog demo tersimpan di browser dan dapat dihapus dengan membersihkan data situs.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Pembayaran</h2>
          <p>Belum ada checkout atau pembayaran paket Catalove di website. Tanya paket lewat WhatsApp; kami harus mengirim rincian harga, periode tagihan, dan biaya server/domain secara tertulis sebelum pengerjaan atau pembayaran. Catalove tidak meminta detail kartu. Pembayaran pesanan pelanggan diatur langsung oleh masing-masing toko.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900 dark:text-white">Hubungi kami</h2>
          <p>Untuk pertanyaan privasi atau permintaan terkait data, hubungi pengelola melalui halaman <Link className="font-semibold text-[var(--storefront-accent)] underline" href="/contact">Kontak</Link>.</p>
        </section>
      </div>
    </main>
  );
}
