import React from "react";
import { StorefrontMotion } from "@/components/storefront/StorefrontMotion";
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorefrontMotion>
      <div className="min-h-screen flex flex-col bg-[#FCFAF6] text-[#33262A] dark:bg-[#1A1412] dark:text-[#F2E7DC] transition-colors duration-300">
        <AnnouncementBar />
        {children}
      </div>
    </StorefrontMotion>
  );
}
