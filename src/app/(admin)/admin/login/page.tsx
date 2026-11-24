"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Lock, ArrowRight, Mail } from "lucide-react";
import { authService } from "@/lib/services/auth-service";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const settings = useBusinessSettings();
  const nextUrl = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("owner@catalove.id");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const storeName = settings.store_name || "Catalove Studio";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await authService.login(password, email);
    setIsLoading(false);

    if (res.success) {
      router.push(nextUrl);
      router.refresh();
    } else {
      setError(res.error || "Gagal masuk. Periksa email atau kata sandi.");
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl bg-white border border-caramel-200/80 shadow-card p-6 sm:p-8 space-y-6 animate-slide-up dark:border-white/10 dark:bg-[#211B19]">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-butter-500 border border-butter-600 flex items-center justify-center text-cocoa-900 mx-auto shadow-soft">
          <Store className="w-7 h-7 text-caramel-800" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-950 dark:text-white">
          {storeName}
        </h2>
        <p className="text-xs text-cocoa-600 dark:text-stone-300">
          Masuk untuk mengelola produk, tampilan brand, jadwal, dan pesanan toko Anda.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 text-center font-medium">
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="admin-email" className="block text-xs font-bold uppercase tracking-wider text-cocoa-800 dark:text-stone-200">
            Email Pengelola
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-cocoa-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@catalove.id"
              required
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-vanilla-50 border border-caramel-300 text-sm text-cocoa-900 focus:outline-none focus:border-caramel-600 dark:bg-stone-900 dark:border-white/10 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-password" className="block text-xs font-bold uppercase tracking-wider text-cocoa-800 dark:text-stone-200">
            Kata Sandi
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-cocoa-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi..."
              required
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-vanilla-50 border border-caramel-300 text-sm text-cocoa-900 focus:outline-none focus:border-caramel-600 dark:bg-stone-900 dark:border-white/10 dark:text-white"
            />
          </div>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full py-3.5 gap-2 text-sm shadow-warm"
        >
          <span>Masuk ke Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <p className="text-[11px] text-center text-cocoa-400 dark:text-stone-400">
        Portal pengelola terproteksi untuk {storeName} • Catalove Studio Engine.
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="sr-only">Masuk ke Studio Catalove</h1>
      <React.Suspense fallback={<div className="text-sm text-cocoa-600">Memuat formulir...</div>}>
        <LoginForm />
      </React.Suspense>
      <Link href="/" className="text-xs font-semibold text-caramel-800 underline underline-offset-4 dark:text-amber-200">
        Kembali ke halaman utama Catalove
      </Link>
    </main>
  );
}
