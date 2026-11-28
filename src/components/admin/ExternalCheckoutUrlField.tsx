"use client";

import { useId } from "react";

interface ExternalCheckoutUrlFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExternalCheckoutUrlField({ value, onChange }: ExternalCheckoutUrlFieldProps) {
  const inputId = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-semibold text-cocoa-800 dark:text-stone-200">
        Link checkout seller (opsional)
      </label>
      <input
        id={inputId}
        type="url"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://platform-pembayaran.com/produk/…"
        pattern="https://.+"
        title="Gunakan tautan HTTPS dari platform checkout milikmu."
        className="w-full rounded-xl border border-caramel-300 bg-vanilla-50 px-4 py-2.5 text-sm text-cocoa-900 outline-none focus:border-caramel-600 dark:border-white/15 dark:bg-[#2C2421] dark:text-stone-100"
      />
      <p className="text-xs leading-relaxed text-cocoa-600 dark:text-stone-400">
        Pembayaran dan pengiriman produk digital tetap dikelola di platform seller. Catalove hanya membuka tautannya.
      </p>
    </div>
  );
}
