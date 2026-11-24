import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, ArrowUpRight } from "lucide-react";
import { buildCataloveInquiryWhatsAppUrl } from "@/lib/utils/catalove-whatsapp";

export const metadata: Metadata = {
  title: "Kontak Catalove: Bantuan dan Konsultasi Katalog",
  description: "Hubungi tim Catalove untuk bantuan mengatur katalog digital, bertanya tentang paket Business dan Enterprise, atau mengajukan permintaan privasi.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-16 text-stone-800 dark:text-stone-100">
      <Link href="/" className="text-sm font-semibold text-[var(--storefront-accent)]">← Kembali ke Catalove</Link>
      <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Bantuan</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Ada yang bisa kami bantu?</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-stone-600 dark:text-stone-300">
        Tanya soal paket gratis, Business, atau Enterprise; bantuan mengatur katalog; dan kebutuhan branding atau opsi domain. Harga Business dan Enterprise ditampilkan sebagai harga mulai, lalu dibahas sesuai kebutuhan. Pesanmu akan dibuka di WhatsApp agar bisa langsung dibahas. Kenali <Link href="/about" className="font-semibold text-[var(--storefront-accent)] underline">cara kerja Catalove</Link>, atau baca <Link href="/privacy" className="font-semibold text-[var(--storefront-accent)] underline">Kebijakan Privasi</Link> untuk permintaan terkait data.
      </p>
      <a
        href={buildCataloveInquiryWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--storefront-accent)] px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
      >
        <MessageCircle className="h-4 w-4" />
        Hubungi lewat WhatsApp
        <ArrowUpRight className="h-4 w-4" />
      </a>
    </main>
  );
}
