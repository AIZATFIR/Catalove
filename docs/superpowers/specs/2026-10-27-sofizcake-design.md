# SofizCake System Architecture & Design Specification

- **Date:** 2026-10-27
- **Project:** SofizCake
- **Type:** Artisan Bakery Storefront + Mobile-First Seller Operations System
- **Status:** Approved for Implementation Planning

---

## 1. Executive Summary & Vision

SofizCake is a digital storefront and lightweight business management system for an artisan home-based cake business in Indonesia. It balances the warm sensory appeal of a boutique European-Indonesian bakery with the operational simplicity required by a non-technical seller managing daily orders on a smartphone.

The system is not a conventional impersonal cart/checkout system. It is a product discovery and structured order-request platform centered around WhatsApp confirmation, giving the seller full oversight over scheduling, stock quotas, and delivery logistics while eliminating repetitive questions.

---

## 2. Technical Stack & Architecture

### 2.1 Core Technologies
- **Framework:** Next.js 15+ (App Router) with React 19.
- **Language:** TypeScript with strict type checking.
- **Styling:** Tailwind CSS with a curated bakery color design system:
  - Vanilla Cream (`#FAF7F2`, `#F4EFE6`) — Warm editorial backgrounds.
  - Butter Yellow (`#F9E076`, `#F6CF46`) — Highlights and badges.
  - Warm Caramel (`#C88A42`, `#A46726`) — Warm brand accents and borders.
  - Deep Cocoa (`#2D231E`, `#4A3B32`) — Readable, high-contrast typography.
  - Soft Blueberry (`#3D4E70`, `#5B6E96`) — Distinctive secondary accent.
- **Animation & Transitions:** `motion` (`framer-motion`) for smooth card stagger reveals, mobile bottom sheets, and micro-interactions. Respects `prefers-reduced-motion`.
- **Validation:** Zod schemas shared across client and server.
- **Database & Storage:** Supabase PostgreSQL with Row Level Security (RLS) + Supabase Storage for high-res cake photos.
- **Service & Repository Pattern:**
  - `CakeService`: Catalog, variants, categories, images, reordering.
  - `AvailabilityService`: Product-specific lead time and date-by-date quotas.
  - `OrderService`: Order request creation, unique reference code generation (`#SC-YYMM-XXXX`), and status lifecycle.
  - **Dual Driver Architecture:** Direct Supabase integration with automatic fallback to an in-memory/JSON seeded local store during development or when Supabase keys are not yet configured.
- **AI Recommendation Service:** Server-side catalog-grounded assistant (`/api/ai/recommend`) with deterministic quiz matching fallback.

---

## 3. System Architecture & Directory Structure

```
/home/aizatfir/Project/SofizCake/
├── docs/
│   └── superpowers/specs/
│       └── 2026-10-27-sofizcake-design.md
├── public/
│   └── images/                     # Seeded bakery imagery & icons
├── src/
│   ├── app/
│   │   ├── (storefront)/           # Customer-facing layout
│   │   │   ├── page.tsx            # Homepage (Hero, signature cakes, story, AI entry)
│   │   │   ├── catalog/page.tsx    # Catalog with filters, search, sort
│   │   │   ├── product/[slug]/page.tsx # Product details, gallery, date & variant picker
│   │   │   ├── order/[reference]/page.tsx # Order confirmation & WhatsApp launch
│   │   │   └── layout.tsx
│   │   ├── (admin)/                # Protected seller admin layout
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx        # Seller dashboard (pending orders, quick availability)
│   │   │   │   ├── login/page.tsx  # Seller authentication
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx    # Product catalog management & reordering
│   │   │   │   │   ├── new/page.tsx # Bulk upload & draft creation wizard
│   │   │   │   │   └── [id]/page.tsx # Product & variant editor
│   │   │   │   ├── availability/page.tsx # Daily calendar availability manager
│   │   │   │   └── orders/page.tsx # Order request list & status tracker
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── ai/recommend/route.ts
│   │   │   ├── orders/route.ts
│   │   │   └── upload/route.ts
│   │   └── globals.css
│   ├── components/
│   │   ├── storefront/             # Hero, ProductCard, FilterBar, DatePicker, WhatsAppModal
│   │   ├── admin/                  # BulkUploader, OrderStatusBadge, AvailabilityToggle, MobileNav
│   │   ├── ai/                     # AssistantDrawer, RecommendationQuiz
│   │   └── ui/                     # Button, Input, Modal, Drawer, Toast, Badge
│   ├── lib/
│   │   ├── db/                     # Supabase client & SQL schema migrations
│   │   ├── services/               # CakeService, OrderService, AvailabilityService
│   │   ├── utils/                  # WhatsApp URL generator, date formatting (ID), currency formatting (IDR)
│   │   └── validators/             # Zod schemas for products, orders, availability
│   └── types/                      # TypeScript definitions (Product, Order, Availability, etc.)
```

---

## 4. Data Models & Database Schema

### 4.1 `categories`
- `id`: UUID (Primary Key)
- `name`: TEXT NOT NULL (e.g., "Signature Whole Cakes", "Bento Mini Cakes", "Dessert Boxes", "Hampers")
- `slug`: TEXT UNIQUE NOT NULL
- `display_order`: INTEGER DEFAULT 0
- `is_active`: BOOLEAN DEFAULT true
- `created_at`: TIMESTAMPTZ DEFAULT now()

### 4.2 `products`
- `id`: UUID (Primary Key)
- `category_id`: UUID REFERENCES categories(id) ON DELETE RESTRICT
- `name`: TEXT NOT NULL
- `slug`: TEXT UNIQUE NOT NULL
- `description`: TEXT NOT NULL
- `flavor_notes`: TEXT[] (e.g. `["Creamy Cheese", "Caramelized Crust", "Vanilla"]`)
- `base_price`: NUMERIC(12, 2) NOT NULL
- `is_active`: BOOLEAN DEFAULT true
- `is_featured`: BOOLEAN DEFAULT false
- `display_order`: INTEGER DEFAULT 0
- `minimum_lead_time_days`: INTEGER DEFAULT 2
- `created_at`: TIMESTAMPTZ DEFAULT now()
- `updated_at`: TIMESTAMPTZ DEFAULT now()

### 4.3 `product_variants`
- `id`: UUID (Primary Key)
- `product_id`: UUID REFERENCES products(id) ON DELETE CASCADE
- `name`: TEXT NOT NULL (e.g. "Diameter 16cm (4-6 Porsi)", "Diameter 20cm (8-10 Porsi)")
- `price`: NUMERIC(12, 2) NOT NULL
- `is_default`: BOOLEAN DEFAULT false
- `display_order`: INTEGER DEFAULT 0

### 4.4 `product_images`
- `id`: UUID (Primary Key)
- `product_id`: UUID REFERENCES products(id) ON DELETE CASCADE (Nullable during draft session)
- `draft_session_id`: TEXT NULL
- `storage_path`: TEXT NOT NULL
- `alt_text`: TEXT
- `display_order`: INTEGER DEFAULT 0
- `is_primary`: BOOLEAN DEFAULT false
- `created_at`: TIMESTAMPTZ DEFAULT now()

### 4.5 `product_availability`
- `id`: UUID (Primary Key)
- `product_id`: UUID REFERENCES products(id) ON DELETE CASCADE
- `availability_date`: DATE NOT NULL (YYYY-MM-DD in Asia/Jakarta)
- `status`: TEXT NOT NULL CHECK (status IN ('available', 'sold_out', 'closed'))
- `quota`: INTEGER NULL (Daily limit, NULL = unlimited within daily production cap)
- `updated_at`: TIMESTAMPTZ DEFAULT now()
- UNIQUE constraint on `(product_id, availability_date)`

### 4.6 `order_requests`
- `id`: UUID (Primary Key)
- `reference_code`: TEXT UNIQUE NOT NULL (Format: `#SC-YYMM-XXXX`)
- `customer_name`: TEXT NOT NULL
- `customer_whatsapp`: TEXT NOT NULL
- `requested_date`: DATE NOT NULL
- `fulfillment_method`: TEXT NOT NULL CHECK (fulfillment_method IN ('pickup', 'delivery'))
- `delivery_address`: TEXT NULL
- `customer_notes`: TEXT NULL (e.g., custom message on cake, candle count, greeting card text)
- `status`: TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'completed', 'cancelled'))
- `subtotal`: NUMERIC(12, 2) NOT NULL
- `created_at`: TIMESTAMPTZ DEFAULT now()
- `updated_at`: TIMESTAMPTZ DEFAULT now()

### 4.7 `order_request_items`
- `id`: UUID (Primary Key)
- `order_request_id`: UUID REFERENCES order_requests(id) ON DELETE CASCADE
- `product_id`: UUID REFERENCES products(id) ON DELETE RESTRICT
- `product_variant_id`: UUID REFERENCES product_variants(id) ON DELETE SET NULL
- `product_name_snapshot`: TEXT NOT NULL
- `variant_name_snapshot`: TEXT NULL
- `unit_price_snapshot`: NUMERIC(12, 2) NOT NULL
- `quantity`: INTEGER NOT NULL CHECK (quantity > 0)
- `subtotal_snapshot`: NUMERIC(12, 2) NOT NULL

### 4.8 `business_settings`
- Key-value configuration:
  - `seller_whatsapp`: `+6281234567890`
  - `store_name`: `SofizCake`
  - `kitchen_address`: `Jl. Danau Toba No. 12, Jakarta Selatan`
  - `default_lead_time_days`: `2`
  - `business_timezone`: `Asia/Jakarta`

---

## 5. Customer Storefront & Ordering Workflow

### 5.1 Storefront Pages
- **Homepage (`/`):**
  - Hero with artisan bakery storytelling, sensory typography, and primary CTAs ("Jelajahi Katalog", "Bantu Pilih Kue").
  - Signature Cakes carousel / Bento grid showcasing top cakes.
  - "3 Langkah Mudah Memesan" workflow guide.
  - Trust signals: Real butter, no preservatives, made fresh to order.
- **Catalog (`/catalog`):**
  - Instant category filtering (Whole Cake, Bento, Slice Box, Hampers).
  - Search by name, flavor tags, and description.
  - Availability toggle ("Ready Stock" vs "Pre-Order").
  - Sort by Price, Lead Time, and Recommendation.
- **Product Detail (`/product/[slug]`):**
  - Multi-image gallery with high-res thumbnails and zoom preview.
  - Variant selection (updating price in real time).
  - Minimum lead time indicator banner.
  - Date Picker: blocks past dates and dates violating lead time; checks daily availability status.
  - Customization inputs: Tulisan di atas kue, jumlah lilin, dan kartu ucapan.
  - Order request trigger button.

### 5.2 Order Submission & WhatsApp Handoff
1. The customer reviews their order summary and clicks "Ajukan Pesanan".
2. The server validates:
   - Requested date >= Today + Product minimum lead time.
   - Date is not marked 'closed' or 'sold_out' in `product_availability`.
   - Customer name & WhatsApp format are valid.
3. The server generates a unique reference code `#SC-YYMM-XXXX` and inserts a new `order_requests` record with status `pending`.
4. The client presents an order confirmation modal / screen with:
   - Request ID `#SC-YYMM-XXXX`.
   - Clear notice that final confirmation occurs via WhatsApp.
   - A single prominent action: **"Lanjut ke WhatsApp (Kirim Pesanan)"**.
5. The button launches WhatsApp with the prefilled message:
   ```
   Halo Mama SofizCake, saya ingin mengajukan pesanan.

   ID Permintaan: [ID]
   Nama: [Nama Pelanggan]
   Kue: [Nama Kue]
   Varian: [Varian jika ada]
   Jumlah: [Jumlah]
   Tanggal yang diinginkan: [Tanggal]
   Metode: [Ambil Sendiri / Pengantaran Kurir]
   Catatan/Tulisan: [Catatan]
   Estimasi subtotal: [Subtotal]

   Mohon konfirmasi apakah pesanan ini bisa dibuat dan bagaimana pengambilannya. Terima kasih.
   ```
6. A fallback button is provided ("Salin Pesan Manual") in case the WhatsApp protocol handler is blocked.

---

## 6. Mobile-First Seller Operations Dashboard

### 6.1 Authentication & Role Security
- Protected `/admin` routes via Next.js Middleware and Supabase Auth.
- Session cookie verification on all Server Actions.
- Single-tap demo login in local development mode.

### 6.2 Mobile Bottom Navigation
- 📋 **Pesanan:** Badge with count of unreviewed `pending` requests.
- 🎂 **Kue:** Product list, stock status, and reordering.
- 📅 **Jadwal:** Daily availability calendar.
- ⚙️ **Pengaturan:** Store settings and WhatsApp number.

### 6.3 Bulk Image Upload & Product Drafts
- High-priority feature designed for smartphones:
  1. Seller taps `+ Tambah Kue`.
  2. Selects multiple cake photos (1–10 images) from camera roll.
  3. Previews thumbnails with upload progress.
  4. One-tap to designate a photo as **Foto Utama (Primary)**.
  5. Easy reorder controls (Move Left, Move Right, Drag).
  6. Fill in product details:
     - Nama Kue, Kategori, Harga Dasar, Lead Time (H-1, H-2, H-3), Deskripsi, Varian.
  7. Choice to "Simpan Draf" or "Langsung Terbitkan" (Publish).

### 6.4 Daily Availability Management
- 30-day lightweight calendar view.
- Tap any date to view all active products and toggle individual availability (`Tersedia`, `Habis`, `Tutup Pesanan`).
- "Salin Pengaturan ke Hari Lain" (1-tap replicate settings across selected dates or weekends).

### 6.5 Order Request Lifecycle Management
- Status pipeline: `pending` (Menunggu Review) → `contacted` (Sudah Dihubungi) → `confirmed` (Dikonfirmasi) → `completed` (Selesai) / `cancelled` (Dibatalkan).
- One-tap "Chat Pelanggan di WhatsApp" button opening direct chat with customer's phone number.
- Full snapshot audit: preserves historical prices and variant names even if the catalog is modified later.

---

## 7. AI Recommendation Engine & Fallback Strategy

### 7.1 Interactive Assistant: "Bantu Pilih Kue"
- Drawer / Modal available on the homepage and catalog page.
- **Guided Step-by-Step Quiz:**
  - Occasion: Ulang Tahun, Anniversary, Kumpul Keluarga, Camilan Pribadi.
  - Flavor: Keju, Cokelat Kaya, Buah Segar, Biscoff/Karamel, Vanilla Lembut.
  - Size / Servings: Personal / Bento (1-2 porsi), Sedang (4-6 porsi), Besar (8-10 porsi), Hampers.
  - Urgency: Butuh Hari Ini / Besok (Ready Stock) vs Pre-Order.
- **Conversational Natural Language Input:** Allows freeform queries in Indonesian.

### 7.2 Catalog Grounding & Guardrails
- Queries live active products from `CakeService`.
- System prompt instructs model to act as SofizCake bakery culinary advisor.
- Strict anti-hallucination rules: only recommend products that exist in the provided JSON catalog.
- Response validated via Zod schema (`{ recommendations: [{ productId, reason, highlightBadge }], explanation: string }`).

### 7.3 Deterministic Fallback Engine
- When AI provider keys are missing or provider encounters errors/rate limits:
  - Deterministic tag-matching engine instantly scores products based on quiz inputs.
  - Returns top 2-3 matched products with matching badges and direct links to product pages.
  - Zero degraded experience for the customer.

---

## 8. Non-Functional Requirements & Security

1. **Responsiveness:** Mobile-first layout tested across standard viewport widths (375px, 414px, 768px, 1280px). Zero horizontal scrolling.
2. **Performance & Core Web Vitals:** Next.js `<Image>` optimization with modern WebP/AVIF formats and responsive sizes.
3. **Accessibility:** Semantic HTML5 elements (`main`, `nav`, `article`, `header`), visible focus indicators, high contrast text on vanilla surfaces, and screen-reader accessible forms.
4. **Idempotency & Resilience:** Server Action deduplication prevents accidental double-submission of order requests.
5. **Data Protection:** Customer phone numbers are only accessible to authenticated seller sessions.
