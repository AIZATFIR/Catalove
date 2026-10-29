# SofizCake MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a digital artisan bakery storefront and mobile-first seller operations system for SofizCake with catalog browsing, lead-time & availability date validation, WhatsApp order handoff with persistent references, grounded AI/quiz cake recommendations, and a smartphone-optimized seller dashboard with bulk photo uploads.

**Architecture:** Next.js 15+ App Router application with React 19, TypeScript, and Tailwind CSS. Employs a dual-driver Repository/Service pattern (`CakeService`, `AvailabilityService`, `OrderService`) that connects seamlessly to Supabase PostgreSQL/Auth/Storage while providing a self-contained seeded local storage layer for instant zero-friction local development and testing.

**Tech Stack:** Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Motion (framer-motion), Lucide React, Zod, Supabase JS.

## Global Constraints

- Primary storefront and admin interface language: Indonesian.
- Currency format: Indonesian Rupiah (`Rp X.XXX`).
- Timezone: `Asia/Jakarta`.
- Palette tokens: Vanilla Cream (`#FAF7F2`), Butter Yellow (`#F9E076`), Warm Caramel (`#C88A42`), Deep Cocoa (`#2D231E`), Soft Blueberry (`#3D4E70`).
- No public user registration; admin routes `/admin/*` protected.
- Orders must generate unique reference `#SC-YYMM-XXXX` and record in DB before WhatsApp handoff.
- AI recommendations must be strictly grounded in active catalog products with a 100% reliable deterministic fallback.

---

### Task 1: Next.js Project Scaffolding & Bakery Design System Tokens

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`
- Test: Build check (`npm run build`)

**Interfaces:**
- Produces: Base Next.js 15+ environment with Tailwind CSS bakery theme tokens and root layout.

- [ ] **Step 1: Initialize Next.js project structure and dependencies**
Create `package.json` with Next.js 15, React 19, Tailwind CSS, Lucide React, Motion, and Zod dependencies.

- [ ] **Step 2: Configure TypeScript, Tailwind, and PostCSS**
Configure `tailwind.config.ts` with custom colors:
  - `vanilla`: `{ 50: '#FDFBF7', 100: '#FAF7F2', 200: '#F4EFE6', 300: '#E8DFD1' }`
  - `butter`: `{ 100: '#FEF9E7', 300: '#FDF0B2', 500: '#F9E076', 600: '#F6CF46' }`
  - `caramel`: `{ 100: '#F7EFE6', 300: '#DFB98D', 500: '#C88A42', 700: '#A46726', 800: '#7E4C18' }`
  - `cocoa`: `{ 500: '#6B5446', 700: '#4A3B32', 900: '#2D231E' }`
  - `blueberry`: `{ 100: '#EBF0F7', 500: '#5B6E96', 700: '#3D4E70' }`

- [ ] **Step 3: Create global CSS and root layout**
Write `src/app/globals.css` with font imports, smooth scrolling, and custom utilities, and `src/app/layout.tsx` with metadata for SofizCake.

- [ ] **Step 4: Install dependencies and verify build**
Run: `npm install && npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**
```bash
git add package.json tsconfig.json tailwind.config.ts postcss.config.mjs next.config.ts src/app/globals.css src/app/layout.tsx
git commit -m "chore: scaffold Next.js app with bakery design system tokens"
```

---

### Task 2: Core Data Types, Zod Schemas & Realistic Seed Data

**Files:**
- Create: `src/types/bakery.ts`, `src/lib/validators/order.ts`, `src/lib/validators/product.ts`, `src/lib/data/seed-cakes.ts`
- Test: `tests/validators.test.ts`

**Interfaces:**
- Produces: `Category`, `Product`, `ProductVariant`, `ProductImage`, `ProductAvailability`, `OrderRequest`, `OrderRequestItem`, `OrderInputSchema`, `ProductInputSchema`, `INITIAL_CATEGORIES`, `INITIAL_PRODUCTS`, `INITIAL_SETTINGS`.

- [ ] **Step 1: Write the failing unit tests for schemas and validators**
Test order input validation (valid Indonesian phone number, future date, quantity > 0, required fields).

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx tests/validators.test.ts`
Expected: FAIL (files missing).

- [ ] **Step 3: Define TypeScript interfaces and Zod schemas**
Create `src/types/bakery.ts` with complete types and `src/lib/validators/order.ts` with Zod validation.

- [ ] **Step 4: Create rich artisan bakery seed data**
Populate `src/lib/data/seed-cakes.ts` with realistic Indonesian cakes:
  - Basque Burnt Cheesecake Caramel (Whole Cake, H-2)
  - Belgian Dark Chocolate Ganache (Whole Cake, H-2)
  - Korean Aesthetic Bento Cake (Bento, H-1)
  - Lotus Biscoff Cream Cheese Slice Box (Slice Box, H-0 Ready Stock)
  - Signature Eid & Celebration Hamper (Hampers, H-3)
  Include high-res Unsplash bakery imagery, flavor tags, prices, and variant options.

- [ ] **Step 5: Run tests and commit**
Run: `npx tsx tests/validators.test.ts`
Expected: PASS
```bash
git add src/types/ src/lib/validators/ src/lib/data/ tests/validators.test.ts
git commit -m "feat: add bakery types, zod validators, and initial seed catalog"
```

---

### Task 3: Dual-Driver Repository Layer (CakeService, AvailabilityService, OrderService)

**Files:**
- Create: `src/lib/services/cake-service.ts`, `src/lib/services/availability-service.ts`, `src/lib/services/order-service.ts`, `src/lib/utils/formatters.ts`
- Test: `tests/services.test.ts`

**Interfaces:**
- Produces:
  - `cakeService.getAllProducts(filters)`
  - `cakeService.getProductBySlug(slug)`
  - `cakeService.createProduct(data)`
  - `cakeService.updateProduct(id, data)`
  - `cakeService.reorderProducts(orderedIds)`
  - `availabilityService.checkAvailability(productId, dateStr)`
  - `availabilityService.setAvailability(productId, dateStr, status, quota)`
  - `orderService.createOrder(input)`
  - `orderService.getOrder(referenceCode)`
  - `orderService.listOrders(statusFilter)`
  - `orderService.updateStatus(id, newStatus)`
  - `formatIDR(amount)`, `formatDateIndonesian(date)`

- [ ] **Step 1: Write unit tests for services**
Test:
  - Order reference generation format matches `#SC-YYMM-XXXX`
  - Availability check properly enforces lead-time (e.g. today + 1 day fails for H-2 product)
  - In-memory state persistence works across operations

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx tests/services.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement services and utility formatters**
Implement `cake-service.ts`, `availability-service.ts`, `order-service.ts`, and `formatters.ts` with complete CRUD, lead-time date calculation in `Asia/Jakarta`, and dual-driver capability.

- [ ] **Step 4: Run tests and verify PASS**
Run: `npx tsx tests/services.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/services/ src/lib/utils/ tests/services.test.ts
git commit -m "feat: implement dual-driver service layer for cakes, availability, and orders"
```

---

### Task 4: Storefront Layout, Navbar & Bakery Homepage

**Files:**
- Create: `src/app/(storefront)/layout.tsx`, `src/app/(storefront)/page.tsx`, `src/components/storefront/Navbar.tsx`, `src/components/storefront/Hero.tsx`, `src/components/storefront/FeaturedCakes.tsx`, `src/components/storefront/OrderSteps.tsx`, `src/components/storefront/Footer.tsx`
- Test: Verification via local dev server and component rendering

**Interfaces:**
- Consumes: `cakeService.getAllProducts()`, `Navbar`, `Hero`, `FeaturedCakes`, `OrderSteps`, `Footer`.
- Produces: Customer storefront root page (`/`).

- [ ] **Step 1: Build responsive Navbar and Footer**
Create `Navbar.tsx` with logo, catalog link, WhatsApp contact button, and "Bantu Pilih" quiz trigger. Create `Footer.tsx` with kitchen address, operational hours, and social/contact links.

- [ ] **Step 2: Build Hero section with brand storytelling**
Create `Hero.tsx` with warm vanilla editorial styling, sensory headlines, trust badges ("100% Pure Butter & Dairy"), and primary CTAs.

- [ ] **Step 3: Build Featured Signature Cakes section**
Create `FeaturedCakes.tsx` presenting highlighted artisan cakes with flavor tags, lead-time badges, and direct links to product detail pages.

- [ ] **Step 4: Build Order Steps ("3 Langkah Mudah Memesan")**
Create `OrderSteps.tsx` explaining the WhatsApp-centered ordering process clearly to customers.

- [ ] **Step 5: Assemble Homepage and verify responsiveness**
Assemble `src/app/(storefront)/page.tsx` and run build/preview. Verify zero horizontal overflow on mobile viewports.

- [ ] **Step 6: Commit**
```bash
git add src/app/\(storefront\)/ src/components/storefront/
git commit -m "feat: implement customer storefront layout, navbar, and editorial homepage"
```

---

### Task 5: Catalog Page (`/catalog`) with Category Filtering, Search & Sorting

**Files:**
- Create: `src/app/(storefront)/catalog/page.tsx`, `src/components/storefront/ProductCard.tsx`, `src/components/storefront/CatalogFilters.tsx`
- Test: Verification of filtering, search queries, and empty states

**Interfaces:**
- Consumes: `cakeService.getAllProducts()`, `Category`, `Product`.
- Produces: Interactive catalog view with instant filtering.

- [ ] **Step 1: Create reusable ProductCard component**
Display product image, category pill, flavor notes, price formatted in IDR, ready-stock vs pre-order badge, and hover interactions.

- [ ] **Step 2: Create CatalogFilters component**
Category tabs (Semua, Whole Cake, Bento, Slice Box, Hampers), search bar, and availability filter (Semua, Ready Stock, Pre-Order).

- [ ] **Step 3: Build Catalog Page with URL state and sorting**
Implement `src/app/(storefront)/catalog/page.tsx` supporting search query parameters and sorting (Rekomendasi, Harga Terendah, Harga Tertinggi, Lead Time Tercepat).

- [ ] **Step 4: Add sensory empty state**
Provide clear guidance when no cakes match a search, including a direct WhatsApp custom cake inquiry button.

- [ ] **Step 5: Commit**
```bash
git add src/app/\(storefront\)/catalog/ src/components/storefront/ProductCard.tsx src/components/storefront/CatalogFilters.tsx
git commit -m "feat: implement catalog page with real-time category filtering and search"
```

---

### Task 6: Product Detail Page (`/product/[slug]`) & Date/Lead-Time Validation

**Files:**
- Create: `src/app/(storefront)/product/[slug]/page.tsx`, `src/components/storefront/ProductGallery.tsx`, `src/components/storefront/OrderForm.tsx`, `src/components/storefront/FulfillmentDatePicker.tsx`
- Test: Lead-time restriction and variant price calculations

**Interfaces:**
- Consumes: `cakeService.getProductBySlug()`, `availabilityService.checkAvailability()`.
- Produces: Interactive product detail and ordering interface.

- [ ] **Step 1: Build ProductGallery component**
High-res image presentation with thumbnail preview switcher and zoom view.

- [ ] **Step 2: Build FulfillmentDatePicker component**
Calculates valid selectable dates starting from `Today + product.minimum_lead_time_days`. Queries daily availability overrides to flag sold-out or closed dates with alternative date recommendations.

- [ ] **Step 3: Build OrderForm component**
Variant selector (updating price dynamically), quantity stepper, fulfillment method (Ambil Sendiri vs Kurir), cake inscription message input, candle count, and greeting card text.

- [ ] **Step 4: Assemble Product Detail Page**
Assemble `src/app/(storefront)/product/[slug]/page.tsx` with dynamic metadata, breadcrumbs, and validation feedback.

- [ ] **Step 5: Commit**
```bash
git add src/app/\(storefront\)/product/ src/components/storefront/ProductGallery.tsx src/components/storefront/OrderForm.tsx src/components/storefront/FulfillmentDatePicker.tsx
git commit -m "feat: implement product detail page with dynamic variant pricing and lead-time date picker"
```

---

### Task 7: Order Request Persistence & WhatsApp Handoff Flow

**Files:**
- Create: `src/app/api/orders/route.ts`, `src/app/(storefront)/order/[reference]/page.tsx`, `src/components/storefront/WhatsAppConfirmationModal.tsx`, `src/lib/utils/whatsapp.ts`
- Test: `tests/whatsapp-url.test.ts`

**Interfaces:**
- Consumes: `orderService.createOrder()`, `buildWhatsAppUrl(order)`.
- Produces: API endpoint, persistent order record, WhatsApp redirect with prefilled message.

- [ ] **Step 1: Write test for WhatsApp message encoding**
Verify the generated WhatsApp text contains exact PRD fields (ID Permintaan, Nama, Kue, Varian, Jumlah, Tanggal, Metode, Catatan, Subtotal, and disclaimer).

- [ ] **Step 2: Implement WhatsApp URL builder**
Write `src/lib/utils/whatsapp.ts` constructing properly encoded `https://wa.me/<phone>?text=...` URLs.

- [ ] **Step 3: Create Server Action / API route for order submission**
Validate inputs with Zod, verify requested date against availability rules, create order in DB with status `pending`, and return generated `#SC-YYMM-XXXX` reference.

- [ ] **Step 4: Create Order Confirmation Page & Modal**
Display receipt summary, reference code, reminder that WhatsApp confirmation is required, primary "Lanjut ke WhatsApp" button, and secondary "Salin Pesan" fallback button.

- [ ] **Step 5: Run tests and commit**
Run: `npx tsx tests/whatsapp-url.test.ts`
Expected: PASS
```bash
git add src/app/api/orders/ src/app/\(storefront\)/order/ src/components/storefront/WhatsAppConfirmationModal.tsx src/lib/utils/whatsapp.ts tests/whatsapp-url.test.ts
git commit -m "feat: implement persistent order submission and WhatsApp continuation handoff"
```

---

### Task 8: AI Cake Assistant & Deterministic Quiz Drawer ("Bantu Pilih Kue")

**Files:**
- Create: `src/app/api/ai/recommend/route.ts`, `src/lib/services/recommendation-engine.ts`, `src/components/ai/RecommendationDrawer.tsx`, `src/components/ai/QuizStepWizard.tsx`
- Test: `tests/recommendation.test.ts`

**Interfaces:**
- Consumes: `cakeService.getAllProducts()`, `recommendationEngine.matchCakes(criteria)`.
- Produces: Grounded AI recommendation API and interactive discovery drawer.

- [ ] **Step 1: Write unit test for deterministic recommendation matching**
Verify recommendation engine scores and returns valid active catalog products matching occasion, flavor, and size without hallucinating.

- [ ] **Step 2: Implement deterministic recommendation engine**
Write `src/lib/services/recommendation-engine.ts` with weighted scoring across flavor notes, occasion, servings, and lead-time constraints.

- [ ] **Step 3: Implement server API route with AI model grounding**
Write `src/app/api/ai/recommend/route.ts` with system prompt strictly constraining outputs to provided catalog products, falling back to deterministic matching if API key is not configured.

- [ ] **Step 4: Build interactive RecommendationDrawer & QuizStepWizard**
4-step visual questionnaire (Acara, Rasa, Porsi, Kapan Dibutuhkan) with real-time cake match cards and direct "Pesan Kue Ini" navigation.

- [ ] **Step 5: Run tests and commit**
Run: `npx tsx tests/recommendation.test.ts`
Expected: PASS
```bash
git add src/app/api/ai/ src/lib/services/recommendation-engine.ts src/components/ai/ tests/recommendation.test.ts
git commit -m "feat: implement catalog-grounded AI recommendation API and interactive quiz drawer"
```

---

### Task 9: Seller Admin Authentication & Mobile-First Dashboard

**Files:**
- Create: `src/app/(admin)/layout.tsx`, `src/app/(admin)/admin/page.tsx`, `src/app/(admin)/admin/login/page.tsx`, `src/components/admin/AdminBottomNav.tsx`, `src/components/admin/DashboardStats.tsx`, `src/components/admin/PendingOrdersQueue.tsx`, `src/lib/services/auth-service.ts`
- Test: Protected route redirect and login authentication flow

**Interfaces:**
- Consumes: `authService.login()`, `orderService.listOrders('pending')`.
- Produces: Protected mobile-first seller operations dashboard (`/admin`).

- [ ] **Step 1: Implement authentication service and session check**
Write `src/lib/services/auth-service.ts` with cookie-based session tracking and 1-tap demo seller login for local testing.

- [ ] **Step 2: Build mobile bottom navigation bar**
Create `AdminBottomNav.tsx` with icons for Pesanan (with pending count badge), Kue, Jadwal, and Pengaturan.

- [ ] **Step 3: Build Home Dashboard landing**
Create `src/app/(admin)/admin/page.tsx` featuring:
  - Quick stat pills: Permintaan Baru, Pesanan Hari Ini, Status Produksi Besok.
  - Quick availability toggle for tomorrow.
  - Urgent pending orders queue with 1-tap WhatsApp chat button.
  - Big prominent "+ Tambah Kue" floating/top action button.

- [ ] **Step 4: Build Admin Login screen**
Create `src/app/(admin)/admin/login/page.tsx` with clean bakery styling, password input, and demo login shortcut.

- [ ] **Step 5: Commit**
```bash
git add src/app/\(admin\)/ src/components/admin/ src/lib/services/auth-service.ts
git commit -m "feat: implement seller authentication and mobile-first dashboard landing"
```

---

### Task 10: High-Priority Seller Bulk Image Uploader & Product Drafts

**Files:**
- Create: `src/app/(admin)/admin/products/new/page.tsx`, `src/components/admin/BulkImageUploader.tsx`, `src/components/admin/ProductDraftForm.tsx`
- Test: Multi-image preview, primary photo selection, and draft creation

**Interfaces:**
- Consumes: `cakeService.createProduct()`.
- Produces: Smartphone-friendly bulk photo upload and draft creation wizard.

- [ ] **Step 1: Build BulkImageUploader component**
Multi-file picker supporting 1-10 photos from mobile camera roll. Grid preview with progress indicator, "Set as Primary" star button, Move Left/Right reorder buttons, and delete button.

- [ ] **Step 2: Build ProductDraftForm component**
Two modes:
  - Mode 1: Buat Kue Baru (Name, Category, Base Price, Lead Time in days, Description, Variants).
  - Mode 2: Tambah ke Produk Ada (Append photos to existing catalog cake).

- [ ] **Step 3: Implement Draft and Publish actions**
Buttons to "Simpan Draf" or "Terbitkan Sekarang" updating `cakeService`.

- [ ] **Step 4: Verify mobile file picker and image ordering**
Test image selection, primary flag toggling, and successful draft persistence.

- [ ] **Step 5: Commit**
```bash
git add src/app/\(admin\)/admin/products/new/ src/components/admin/BulkImageUploader.tsx src/components/admin/ProductDraftForm.tsx
git commit -m "feat: implement mobile-first bulk image uploader and product draft wizard"
```

---

### Task 11: Seller Catalog Manager & Daily Availability Calendar

**Files:**
- Create: `src/app/(admin)/admin/products/page.tsx`, `src/app/(admin)/admin/products/[id]/page.tsx`, `src/app/(admin)/admin/availability/page.tsx`, `src/components/admin/ProductListTable.tsx`, `src/components/admin/AvailabilityCalendar.tsx`
- Test: Product reordering and availability override persistence

**Interfaces:**
- Consumes: `cakeService.reorderProducts()`, `availabilityService.setAvailability()`.
- Produces: Catalog arrangement tool and date-specific availability manager.

- [ ] **Step 1: Build ProductListTable with mobile sorting**
List active and draft products with thumbnail, price, category, active toggle, and mobile Move Up/Down buttons for display order.

- [ ] **Step 2: Build Product Editor (`/admin/products/[id]`)**
Full editing form for title, price, category, lead time, variants, and attached image gallery.

- [ ] **Step 3: Build AvailabilityCalendar component**
30-day mobile calendar view. Tap any day to inspect products and toggle status (`Tersedia`, `Habis`, `Tutup Pesanan`). Includes "Salin Pengaturan ke Besok / Akhir Pekan" button.

- [ ] **Step 4: Verify catalog reordering reflects on public storefront**
Ensure that changing display order in `/admin/products` immediately changes order in `/catalog`.

- [ ] **Step 5: Commit**
```bash
git add src/app/\(admin\)/admin/products/ src/app/\(admin\)/admin/availability/ src/components/admin/
git commit -m "feat: implement seller catalog manager with mobile reordering and daily availability calendar"
```

---

### Task 12: Seller Order Request Lifecycle Manager & End-to-End Verification

**Files:**
- Create: `src/app/(admin)/admin/orders/page.tsx`, `src/components/admin/OrderListCard.tsx`, `src/components/admin/OrderStatusSelector.tsx`
- Test: Full End-to-End order workflow test (`tests/e2e-order-flow.test.ts`)

**Interfaces:**
- Consumes: `orderService.listOrders()`, `orderService.updateStatus()`.
- Produces: Complete order management interface and end-to-end verified bakery system.

- [ ] **Step 1: Build OrderListCard and OrderStatusSelector components**
Card showing Reference Code, Customer Name, WhatsApp link, Requested Date, Subtotal, Items snapshot, and status transition selector (`pending` → `contacted` → `confirmed` → `completed` / `cancelled`).

- [ ] **Step 2: Build Orders Management Page (`/admin/orders`)**
Tabs for `Semua`, `Menunggu Review (Pending)`, `Dihubungi (Contacted)`, `Dikonfirmasi (Confirmed)`, `Selesai (Completed)`.

- [ ] **Step 3: Write and run End-to-End workflow integration test**
Test:
  1. Customer creates order request for Basque Burnt Cheesecake on valid future date.
  2. Order is saved with unique reference `#SC-YYMM-XXXX`.
  3. WhatsApp link generated with exact prefilled template.
  4. Order appears in Admin Dashboard with `pending` status.
  5. Seller updates status to `contacted` then `confirmed`.
  6. Date availability blocks invalid dates.

- [ ] **Step 4: Execute production build and run test**
Run: `npx tsx tests/e2e-order-flow.test.ts && npm run build`
Expected: ALL PASS with zero lint/build errors.

- [ ] **Step 5: Commit**
```bash
git add src/app/\(admin\)/admin/orders/ src/components/admin/ tests/e2e-order-flow.test.ts
git commit -m "feat: implement seller order lifecycle manager and verify end-to-end flow"
```
