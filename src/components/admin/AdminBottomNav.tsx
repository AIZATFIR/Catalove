"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, CalendarDays, PlusCircle, Settings2 } from "lucide-react";
import { orderService } from "@/lib/services/order-service";
import { MotionIcon } from "@/components/ui/MotionIcon";

export const AdminBottomNav: React.FC = () => {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    orderService.getOrderStats().then((stats) => {
      setPendingCount(stats.pending);
    });
  }, [pathname]);

  const navItems = [
    {
      label: "Beranda",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      label: "Pesanan",
      href: "/admin/orders",
      icon: ShoppingBag,
      active: pathname.startsWith("/admin/orders"),
      badge: pendingCount,
    },
    {
      label: "Tambah",
      href: "/admin/products/new",
      icon: PlusCircle,
      active: pathname === "/admin/products/new",
      highlight: true,
    },
    {
      label: "Katalog",
      href: "/admin/products",
      icon: Package,
      active: pathname === "/admin/products",
    },
    {
      label: "Jadwal",
      href: "/admin/availability",
      icon: CalendarDays,
      active: pathname.startsWith("/admin/availability"),
    },
    {
      label: "Desain",
      href: "/admin/settings",
      icon: Settings2,
      active: pathname.startsWith("/admin/settings"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-caramel-200/80 px-2 py-1.5 shadow-floating sm:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`touch-target relative flex flex-col items-center justify-center px-3 py-1 text-[11px] font-semibold transition-all ${
                item.active
                  ? "text-caramel-700"
                  : "text-cocoa-500 hover:text-cocoa-900"
              }`}
            >
              {item.highlight ? (
                <MotionIcon icon={Icon} size={20} className="text-current" />
              ) : (
                <div className="relative">
                  <MotionIcon icon={Icon} size={20} className="text-current" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              )}
              <span className={`mt-0.5 ${item.highlight ? "font-bold text-caramel-700" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
