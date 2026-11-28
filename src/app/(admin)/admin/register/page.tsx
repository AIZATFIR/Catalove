"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authService } from "@/lib/services/auth-service";

function makeSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export default function RegisterStorePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await authService.register({ name, slug, email, password });
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Katalog belum berhasil dibuat.");
      return;
    }
    if (result.confirmationRequired) {
      setConfirmationSent(true);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center gap-5 p-4 bg-vanilla-100 dark:bg-[#1A1412]">
      <section className="w-full max-w-lg rounded-3xl bg-white border border-caramel-200/80 shadow-card p-6 sm:p-9 space-y-6 dark:border-white/10 dark:bg-[#211B19]">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-butter-500 border border-butter-600 flex items-center justify-center text-cocoa-900 mx-auto shadow-soft">
            <Store className="w-7 h-7 text-caramel-800" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-950 dark:text-white">Mulai katalog tokomu</h1>
          <p className="text-sm text-cocoa-600 dark:text-stone-300">Buat satu katalog Free hingga 25 produk dan 50 foto (100 MiB). Ini masih preview: isi dengan data contoh dulu dan jangan gunakan untuk menerima order penting sebelum layanan server produksi dan pemulihan data siap.</p>
        </div>

        {confirmationSent ? (
          <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
            Akun sudah dibuat. Buka tautan verifikasi yang dikirim ke emailmu, lalu masuk untuk melanjutkan pengaturan katalog.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="store-name" className="text-xs font-bold uppercase tracking-wider text-cocoa-800 dark:text-stone-200">Nama toko atau brand</label>
              <input id="store-name" value={name} onChange={(event) => {
                setName(event.target.value);
                if (!slugEdited) setSlug(makeSlug(event.target.value));
              }} required minLength={2} maxLength={60} autoComplete="organization" className="w-full rounded-2xl border border-caramel-300 bg-vanilla-50 px-4 py-3 text-sm text-cocoa-900 focus:outline-none focus:border-caramel-600 dark:bg-stone-900 dark:border-white/10 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="store-slug" className="text-xs font-bold uppercase tracking-wider text-cocoa-800 dark:text-stone-200">Alamat katalog</label>
              <div className="flex items-center rounded-2xl border border-caramel-300 bg-vanilla-50 px-4 dark:bg-stone-900 dark:border-white/10">
                <span className="text-sm text-cocoa-500">Alamat: /s/</span>
                <input id="store-slug" value={slug} onChange={(event) => {
                  setSlugEdited(true);
                  setSlug(makeSlug(event.target.value));
                }} required minLength={1} maxLength={50} autoCapitalize="none" autoComplete="off" className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-cocoa-900 focus:outline-none dark:text-white" />
              </div>
              <p className="text-[11px] text-cocoa-500 dark:text-stone-400">Pakai huruf kecil, angka, atau tanda hubung. Alamat katalog tidak bisa diganti setelah dibuat.</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="store-email" className="text-xs font-bold uppercase tracking-wider text-cocoa-800 dark:text-stone-200">Email pengelola</label>
              <input id="store-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="w-full rounded-2xl border border-caramel-300 bg-vanilla-50 px-4 py-3 text-sm text-cocoa-900 focus:outline-none focus:border-caramel-600 dark:bg-stone-900 dark:border-white/10 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="store-password" className="text-xs font-bold uppercase tracking-wider text-cocoa-800 dark:text-stone-200">Kata sandi</label>
              <input id="store-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={10} autoComplete="new-password" className="w-full rounded-2xl border border-caramel-300 bg-vanilla-50 px-4 py-3 text-sm text-cocoa-900 focus:outline-none focus:border-caramel-600 dark:bg-stone-900 dark:border-white/10 dark:text-white" />
              <p className="text-[11px] text-cocoa-500 dark:text-stone-400">Minimal 10 karakter. Kami akan meminta verifikasi email sebelum katalog dibuat.</p>
            </div>
            <p className="text-[11px] leading-relaxed text-cocoa-500 dark:text-stone-400">
              Akun Free tidak dikenakan tagihan otomatis. Belum ada pembayaran langsung di website. Untuk paket berbayar, kami kirim penawaran tertulis termasuk biaya server/domain dan periode tagihannya; pengerjaan hanya dimulai setelah kamu menyetujuinya. Baca <Link href="/privacy" className="font-semibold underline underline-offset-2">Kebijakan Privasi</Link>.
            </p>
            {error && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
            <Button type="submit" isLoading={loading} className="w-full py-3.5 gap-2 text-sm shadow-warm">
              Buat akun dan katalog <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-cocoa-500 dark:text-stone-400">
          Sudah punya akun? <Link href="/admin/login" className="font-semibold text-caramel-800 underline underline-offset-4 dark:text-amber-200">Masuk</Link>
        </p>
      </section>
      <Link href="/" className="text-xs font-semibold text-caramel-800 underline underline-offset-4 dark:text-amber-200">Kembali ke Catalove</Link>
    </main>
  );
}
