"use client";

import React from "react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export function OrderSteps() {
  const settings = useBusinessSettings();

  const steps = [
    {
      number: "01",
      title: settings.step_1_title || settings.order_step_1_title || "Pilih Produk & Varian",
      description:
        settings.step_1_desc ||
        settings.order_step_1_desc ||
        "Eksplor katalog, tentukan ukuran atau varian yang paling sesuai kebutuhan Anda.",
    },
    {
      number: "02",
      title: settings.step_2_title || settings.order_step_2_title || "Tambahkan Detail Pesanan",
      description:
        settings.step_2_desc ||
        settings.order_step_2_desc ||
        "Masukkan nama penerima, alamat pengiriman, atau catatan personal untuk pesanan.",
    },
    {
      number: "03",
      title: settings.step_3_title || settings.order_step_3_title || "Konfirmasi via WhatsApp",
      description:
        settings.step_3_desc ||
        settings.order_step_3_desc ||
        "Ringkasan pesanan otomatis terformat rapi dan dikirim ke WhatsApp seller untuk konfirmasi cepat.",
    },
  ];

  return (
    <section id="alur-pesan" className="border-b border-[#DBD0C5]/40 py-16 sm:py-24 dark:border-white/10 transition-colors">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12">
        <div className="mb-10 grid gap-4 border-b border-[#DBD0C5]/40 pb-6 sm:mb-12 sm:grid-cols-2 sm:items-end dark:border-white/10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#8D624C] dark:text-[#D1A686]">
              {settings.steps_eyebrow || settings.order_steps_eyebrow || "Alur Pemesanan"}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium tracking-[-.025em] text-[#4D3040] dark:text-[#FAF4EE] sm:text-5xl">
              {settings.steps_title || settings.order_steps_title || "Tiga Langkah Mudah Berbelanja"}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#55464B] dark:text-[#D8CBC0] sm:justify-self-end">
            {settings.steps_desc ||
              settings.order_steps_desc ||
              "Tanpa perlu registrasi akun yang rumit, pilih produk favorit Anda dan konfirmasi langsung ke penjual."}
          </p>
        </div>

        <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
          {steps.map((step) => (
            <li key={step.number} className="border-t border-[#B8794A] pt-4" data-gsap-reveal>
              <span className="text-xs font-semibold tabular-nums text-[#9A765F] dark:text-[#D1A686]">
                {step.number}
              </span>
              <h3 className="mt-5 font-serif text-2xl font-medium text-[#4D3040] dark:text-[#FAF4EE]">
                {step.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#55464B] dark:text-[#D8CBC0]">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default OrderSteps;
