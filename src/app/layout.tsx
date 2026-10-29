import type { Metadata } from "next";
import {
  Playfair_Display,
  Cormorant_Garamond,
  Outfit,
  Syne,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  Inter,
} from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Catalove — Universal Modern Catalog & Storefront Engine",
  description:
    "Universal catalog and digital storefront engine with award-winning design aesthetics, customizable workflows, and instant WhatsApp ordering for any business.",
  keywords: [
    "Catalove",
    "Digital Catalog",
    "Modern Storefront",
    "Awwwards Web",
    "WhatsApp Checkout",
    "Online Catalog",
  ],
  openGraph: {
    title: "Catalove — Universal Modern Catalog & Storefront Engine",
    description:
      "Transform any business into an award-winning digital storefront in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`
        ${playfair.variable}
        ${cormorant.variable}
        ${outfit.variable}
        ${syne.variable}
        ${jakarta.variable}
        ${space.variable}
        ${inter.variable}
      `}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="antialiased selection:bg-amber-200 selection:text-amber-950">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
