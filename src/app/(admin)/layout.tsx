"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { Store, ExternalLink, Plus, ShoppingBag, Calendar, ListOrdered, Settings2, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { authService } from "@/lib/services/auth-service";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const settings = useBusinessSettings();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <div className="min-h-screen bg-vanilla-100 dark:bg-[#1A1412] dark:text-[#F2E7DC]">{children}</div>;
  }

  return (
    <div className="admin-editorial min-h-screen bg-vanilla-50 dark:bg-[#1A1412] dark:text-[#F2E7DC] flex flex-col pb-20 sm:pb-8">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-caramel-200/80 px-4 sm:px-6 py-3.5 dark:border-white/10 dark:bg-[#211B19]/95">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-caramel-600 flex items-center justify-center text-white">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-serif font-bold text-lg text-cocoa-950 dark:text-[#FAF4EE]">
                {settings.store_name || "Catalove Studio"}
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-3 ml-5 text-xs font-semibold text-cocoa-800 dark:text-[#E8DDD4]">
              <Link
                href="/admin/orders"
                className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/admin/orders")
                    ? "bg-caramel-100 text-caramel-900 dark:bg-amber-900/40 dark:text-amber-200"
                    : "text-cocoa-700 hover:bg-vanilla-100 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Pesanan</span>
              </Link>
              <Link
                href="/admin/products"
                className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  pathname === "/admin/products"
                    ? "bg-caramel-100 text-caramel-900 dark:bg-amber-900/40 dark:text-amber-200"
                    : "text-cocoa-700 hover:bg-vanilla-100 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Katalog Produk</span>
              </Link>
              <Link
                href="/admin/availability"
                className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/admin/availability")
                    ? "bg-caramel-100 text-caramel-900 dark:bg-amber-900/40 dark:text-amber-200"
                    : "text-cocoa-700 hover:bg-vanilla-100 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Jadwal Harian</span>
              </Link>
              <Link
                href="/admin/settings"
                className={`px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/admin/settings")
                    ? "border-b-2 border-caramel-700 text-caramel-900 dark:border-amber-400 dark:text-amber-200 font-bold"
                    : "text-cocoa-700 hover:text-caramel-700 dark:text-stone-300 dark:hover:text-amber-300"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Desain & Pengaturan</span>
              </Link>
            </nav>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/admin/products/new"
              className="touch-target inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-caramel-600 text-white hover:bg-caramel-700 text-xs font-semibold shadow-soft"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Produk Baru</span>
              <span className="sm:hidden">Tambah</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="touch-target inline-flex items-center gap-1 p-2 rounded-full text-cocoa-700 hover:bg-vanilla-100 text-xs font-semibold dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white"
              title="Lihat Website Publik"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden md:inline">Toko</span>
            </Link>

            <button
              onClick={async () => {
                await authService.logout();
                document.cookie = "admin_session=; path=/; max-age=0";
                window.location.href = "/admin/login";
              }}
              className="touch-target inline-flex items-center gap-1 p-2 rounded-full text-cocoa-700 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold dark:text-stone-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
              title="Keluar dari akun pengelola"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}
