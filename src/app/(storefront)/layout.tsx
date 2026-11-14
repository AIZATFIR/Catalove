import React from "react";
import { StorefrontMotion } from "@/components/storefront/StorefrontMotion";
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { LiveCustomizerDock } from "@/components/storefront/LiveCustomizerDock";
import { LiveSocialProofToast } from "@/components/storefront/LiveSocialProofToast";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <StorefrontMotion>
        <div className="min-h-screen flex flex-col bg-[var(--storefront-background)] text-[var(--storefront-ink)] transition-colors duration-300">
          <AnnouncementBar />
          {children}
          <CartDrawer />
          <LiveCustomizerDock />
          <LiveSocialProofToast />
        </div>
      </StorefrontMotion>
    </CartProvider>
  );
}
