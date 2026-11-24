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
  metadataBase: new URL("https://catalove.vercel.app"),
  title: {
    default: "Catalove — Katalog Digital untuk Brand",
    template: "%s | Catalove",
  },
  description:
    "Bangun katalog digital untuk brand UMKM dengan tema yang bisa diatur, tampilan produk yang menarik, dan jalur pemesanan langsung ke WhatsApp.",
  alternates: { canonical: "/" },
  keywords: [
    "Catalove",
    "Digital Catalog",
    "Modern Storefront",
    "Awwwards Web",
    "WhatsApp Checkout",
    "Online Catalog",
  ],
  openGraph: {
    title: "Catalove — Katalog Digital untuk Brand",
    description: "Buat katalog digital yang menarik dan terhubung langsung ke WhatsApp.",
    type: "website",
    siteName: "Catalove",
    images: [{ url: "/og-catalove.svg", width: 1200, height: 630, alt: "Catalove — Katalog Digital untuk Brand" }],
  },
  icons: { icon: "/icon.svg" },
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-stone-950 focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:shadow-xl"
        >
          Lewati ke konten utama
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
