import React from "react";
import { StorefrontMotion } from "@/components/storefront/StorefrontMotion";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { LiveCustomizerDock } from "@/components/storefront/LiveCustomizerDock";
import { OrderSchemeModal } from "@/components/storefront/PricingSection";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <StorefrontMotion>
        <div className="min-h-screen flex flex-col bg-[var(--storefront-background)] text-[var(--storefront-ink)] transition-colors duration-300">
          {children}
          <CartDrawer />
          <LiveCustomizerDock />
          <OrderSchemeModal />
        </div>
      </StorefrontMotion>
    </CartProvider>
  );
}
