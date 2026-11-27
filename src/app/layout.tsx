import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const playfair = localFont({
  src: "./fonts/playfair-display-latin.woff2",
  weight: "400 900",
  variable: "--font-playfair",
  display: "swap",
});

const cormorant = localFont({
  src: "./fonts/cormorant-garamond-latin.woff2",
  weight: "300 700",
  variable: "--font-cormorant",
  display: "swap",
});

const outfit = localFont({
  src: "./fonts/outfit-latin.woff2",
  weight: "100 900",
  variable: "--font-outfit",
  display: "swap",
});

const syne = localFont({
  src: "./fonts/syne-latin.woff2",
  weight: "400 800",
  variable: "--font-syne",
  display: "swap",
});

const jakarta = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  weight: "200 800",
  variable: "--font-jakarta",
  display: "swap",
});

const space = localFont({
  src: "./fonts/space-grotesk-latin.woff2",
  weight: "300 700",
  variable: "--font-space",
  display: "swap",
});

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "100 900",
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
