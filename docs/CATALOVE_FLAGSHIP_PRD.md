# Catalove v2.0 — Flagship Universal UMKM Catalog & Storefront Engine
## Product Requirements Document (PRD) & System Architecture Blueprint

**Version:** 2.0.0 (Flagship UMKM Edition)  
**Target Repository:** `/home/aizatfir/Project/Catalove`  
**Positioning:** *Simple as Linktree. Eye-Catching like Awwwards. Scroll-Addictive like TikTok & Pinterest. Built 100% for UMKM.*

---

## 1. Executive Summary & Product Positioning

Most UMKM (SMEs & independent brands) face an impossible choice online:
- **Marketplace / Social Bios (Linktree, Biolink)**: Fast to set up, but flat, forgettable, lacks real cart/variant selection, and forces buyers to bounce back and forth to ask prices in chat.
- **Traditional E-Commerce Builders (Shopify, WooCommerce, custom code)**: Bloated, intimidating for non-technical owners, slow, and expensive to customize visually.

**Catalove v2.0** solves both by delivering an **instant, zero-code flagship storefront & catalog platform** that combines:
1. **3-Second Visual Identity Setup**: Switch business category presets (Bakery, Fashion, Florist, Handmade Crafts, Tech Gear, Creative Services, General Store), sample catalogs, typography pairings, and curated color palettes in a single tap.
2. **Scroll-Addictive Attention Psychology**: Built-in TikTok Vertical Snap Reels and Pinterest Waterfall Masonry discovery feeds engineered to keep visitors exploring longer and converting faster.
3. **1-Tap Link-in-Bio & Offline QR Card (`/bio`)**: Turns every storefront into a social bio hub + printable QR standee for packaging, pop-up booths, and WhatsApp broadcasts.
4. **Conversion-Optimized Cart & WhatsApp Checkout**: Free priority reward progress bar, promo voucher system, and structured WhatsApp order summaries with zero login barriers for buyers.
5. **Offline-First + Cloud-Ready Dual Driver**: Works immediately via `localStorage` out of the box and upgrades seamlessly with Supabase Auth + PostgreSQL + Storage.

---

## 2. Core Architecture & 5 Flagship Pillars

### Pillar 1: Live Visual Customizer Dock (`LiveCustomizerDock`) & Full Admin Studio (`/admin/settings`)
- **Live Storefront Dock (`src/components/storefront/LiveCustomizerDock.tsx`)**: Floating bottom-left pill (`"✨ Kustomisasi Live"`) letting UMKM owners or prospective merchants preview and save changes *directly on top of their live storefront* without context-switching:
  - 7 Industry Presets with 1-click **Theme + Sample Products** (`applyIndustryPresetCatalog`)
  - Default Scroll Mode switcher (`pinterest_masonry`, `tiktok_feed`, `grid_3`)
  - 7 Curated Color Palettes (`warm_oat`, `noir_gold`, `matcha_sage`, `rose_velvet`, `minimal_slate`, `sunset_terracotta`, `cyber_neo`)
  - 7 Typography Pairings (`playfair`, `cormorant`, `syne`, `space_grotesk`, `outfit`, `jakarta`, `inter`)
  - Direct shortcuts to `/bio` (*Bio-Link & QR*) and `/admin/settings` (*Studio Penuh*).
- **Dynamic CSS Variable Bridge (`src/components/theme/ThemeProvider.tsx`)**: Binds `--font-active-heading`, `--font-serif`, `--font-active-body`, `--font-sans`, `--storefront-accent`, `--storefront-background`, `--storefront-surface`, and `--storefront-ink` consistently across Tailwind utilities (`font-serif`, `font-sans`), HTML/body elements, and dark/light themes.
- **Full Admin Studio (`src/app/(admin)/admin/settings/page.tsx`)**: Multi-tab editor with JSON Export/Import backup, Reset Default, dual-action Presets, Marquee Ticker settings, Brand Story & Pillars editor, Workflow Mode selector (`whatsapp_direct`, `preorder_calendar`, `cart_checkout`, `inquiry_only`), and Layout configuration.

### Pillar 2: Attention-Psychology Discovery Engine (`DiscoveryFeed`)
- **Location**: `src/components/storefront/DiscoveryFeed.tsx`, mounted on `/` and `/catalog`.
- **TikTok Vertical Snap Feed**:
  - Snap-scrolling full-height mobile-style viewport (`9:16` / portrait card frame) with keyboard & arrow pill controls.
  - Multi-photo Instagram/TikTok story progress bars & double-tap heart burst animation.
  - Floating right-rail engagement actions (Like counter, Share link copy, Quick-View, Direct Add-to-Bag / Inquiry).
- **Pinterest Staggered Waterfall Masonry**:
  - Responsive multi-column staggered masonry preserving scroll momentum.
  - Floating save/heart pill, badge overlay, discount indicator (`compare_at_price`), and Instant Quick-View Modal so users inspect variants without losing scroll position.
- **Psychology Filter Chips**: Instant filters for *Semua*, *Paling Populer*, *Sedang Promo*, *Siap Kirim Hari Ini*, *Disukai*, and dynamic categories.

### Pillar 3: Link-in-Bio Super-Card (`/bio`) & QR Store Card
- **Location**: `src/app/(storefront)/bio/page.tsx`, accessible from Navbar & Footer.
- Designed specifically for Instagram Bio, TikTok Bio, WhatsApp Business Catalog links, and offline table/packaging QR stickers:
  - Verified Store Badge, Store Monogram Avatar, Location, and Live Operational Status indicator (`🟢 Buka · Respon Cepat WhatsApp`).
  - Stacked high-contrast CTA links (*Chat WhatsApp Admin*, *Jelajahi Feed TikTok & Pinterest*, *Katalog Lengkap & Pencarian*, *Instagram Official*).
  - **Embedded Mini-Catalog Spotlight**: 2-column instant shoppable cards with Wishlist heart toggle and 1-tap *"+ Keranjang"*.
  - **QR Code & Share Modal**: Generates a crisp scannable store QR code, 1-click Copy Store Link, and 1-click Share via WhatsApp.

### Pillar 4: Conversion Psychology Cart (`CartDrawer`) & Live Social Proof (`LiveSocialProofToast`)
- **CartDrawer Upgrades (`src/components/storefront/CartDrawer.tsx`)**:
  - **Priority Reward Progress Bar**: Visual threshold tracker toward `Rp 250.000` motivating slightly higher basket size (*"Tambah Rp X lagi untuk Prioritas Proses & Kemasan Eksklusif Gratis!"*).
  - **Interactive Voucher Engine**: Instant code validation & 1-click selectable promo pills:
    - `UMKMBERKAH` → Diskon 10%
    - `CATALOVE20` → Diskon 20%
    - `HEMAT15` → Potongan Rp 15.000
  - Displays itemized Subtotal, Discount line, Final Total, and forwards the discounted total & applied voucher details into the structured WhatsApp order message (`generateCartWhatsAppUrl`).
- **Live Social Proof Micro-Toast (`src/components/storefront/LiveSocialProofToast.tsx`)**:
  - Floating bottom-right notification cycling subtly every 24 seconds (first appearance after 5s) across active catalog items to create organic social proof (*"🔥 16 orang sedang melihat ..."*, *"💖 ... baru saja disukai pengunjung"*, *"⚡ Stok ... siap dipesan via WhatsApp"*), clickable directly to `/product/[slug]` and dismissible for the session.

### Pillar 5: Zero-Friction Auth & Dual-Driver Persistence (`localStorage` + Supabase)
- **Zero-Friction Admin Access (`src/middleware.ts`, `src/lib/services/auth-service.ts`, `src/app/(admin)/admin/login/page.tsx`)**:
  - Evaluates the `admin_session` demo/owner cookie before Supabase checks so owners can enter `/admin` cleanly with a 1-click **"⚡ Masuk Instan ke Studio (Mode Demo / Owner)"** button (`owner@catalove.id`) even when Supabase environment variables are configured, while preserving full Supabase Auth login when using real credentials.
- **Offline-First Resilience**: Products, categories, business settings, orders, cart items, and liked items all operate smoothly via `localStorage` fallback alongside Supabase PostgreSQL & Storage.

---

## 3. Target User Flows

1. **UMKM Onboarding (< 60 Seconds)**:
   Open `/` → Click **"✨ Kustomisasi Live"** pill → Choose Industry Preset (e.g., *Fashion*, *Florist*, *Gadgets*) → Pick Color Palette & Heading Font → Click **"Studio Penuh →"** to customize WA number, logo text, story photo, and products.
2. **Social Media Buyer Discovery (TikTok/Instagram Bio → Order)**:
   Tap `/bio` from IG/TikTok bio → Browse Spotlight items or jump to `/#discovery-feed` → Switch between Pinterest Waterfall & TikTok Snap Feed → Double-tap to save, Quick-View variant, **+ Keranjang** → Apply `UMKMBERKAH` voucher → Hit **Checkout Sekarang via WhatsApp**.
3. **Offline Event / Booth Visitor**:
   Scan QR from `/bio` QR Modal printed on UMKM booth standee → Opens live mobile storefront/bio instantly without app installs.

