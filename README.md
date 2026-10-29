# Catalove ✦ Universal Modern Catalog & Storefront Engine

> **Catalove** is an award-winning, universal modern catalog and storefront engine designed for any business—lifestyle, fashion, artisan bakery, florist, handmade crafts, tech gear, and creative services.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Google Fonts typography engine, and an offline-first dual-driver architecture with Supabase.

---

## ✨ Key Features

1. **Award-Winning Visual Aesthetics & Dynamic Theming**
   - Curated typography combinations: *Playfair Display*, *Cormorant Garamond*, *Syne*, *Space Grotesk*, *Outfit*, *Plus Jakarta Sans*, and *Inter*.
   - Dynamic real-time CSS theme bridge with 7 curated color palettes (*Warm Oat*, *Noir Gold*, *Rose Velvet*, *Sunset Terracotta*, *Cyber Neo*, *Forest Sage*, *Minimal Slate*).
   - Glassmorphic navigation, animated marquee ticker, and fluid micro-animations.

2. **1-Click Industry Presets**
   - **General Lifestyle Store**: High-end retail, essentials, and gift curation.
   - **Boutique & Streetwear Apparel**: Editorial lookbook, size/spec selections, cart workflow.
   - **Artisan Bakery & Cake Studio**: Pre-order H-1/H-2 calendar, lead time, custom inscriptions.
   - **Florist Atelier**: Greeting cards, delivery calendar, premium flower arrangements.
   - **Handmade Crafts & Ceramics**: Maker story, material badges, artisan showcase.
   - **Tech Gear & Desk Setup**: Bento grid, technical specifications, responsive 4-column layout.
   - **Creative Services & Studio**: Portfolio showcase with WhatsApp consultation inquiries.

3. **Universal Flexible Workflows**
   - `whatsapp_direct`: Instant 1-click order formatting sent cleanly to seller WhatsApp.
   - `preorder_calendar`: Lead-time calculation and blackout dates calendar picker.
   - `cart_checkout`: Multi-item shopping bag with variant options.
   - `inquiry_only`: Consultation quote requests for custom or high-value items.

4. **Interactive Storefront Grid Density**
   - Real-time 2-column, 3-column, and 4-column layout toggle on desktop and 1-column / 2-column on mobile.

5. **Resilient Dual-Driver Architecture**
   - Works immediately out-of-the-box in offline/mock mode with zero configuration needed.
   - Connects to Supabase seamlessly when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are supplied.

6. **Comprehensive Admin Studio (`/admin/settings`)**
   - 6-tab studio: 1-Click Industry Presets, Workflow Engine, Typography & Color Theming, Marquee Ticker, Store Identity, and Section Copy.
   - Full Product CRUD with image uploads, variants, and badges at `/admin/products`.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd Catalove
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your variables:
```env
# Optional: Supabase Connection (Leave blank for mock mode)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Secret Passphrase
ADMIN_ACCESS_KEY=catalove_secure_admin_2026

# Public App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your storefront.
Open [http://localhost:3000/admin](http://localhost:3000/admin) to manage products and store settings.

### 4. Run Test Suite
```bash
npm test
```
All unit and integration tests validate validators, services, WhatsApp messaging, and recommendation engines.

---

## 🗄️ Database Setup (Supabase)

To connect an independent Supabase project:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the SQL script located at:
   ```
   supabase/migrations/202610290001_catalove_core.sql
   ```
4. Copy the Project URL and API Keys into your `.env.local` or Vercel Environment Variables.

---

## 🚢 Deploy to Vercel

### Option A: Via GitHub Integration
1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/catalove.git
   git branch -M main
   git push -u origin main
   ```
2. Import the repository in [vercel.com/new](https://vercel.com/new).
3. Set the Environment Variables (`ADMIN_ACCESS_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, etc.).
4. Click **Deploy**.

### Option B: Via Vercel CLI
```bash
npx vercel
```
Follow the CLI prompts to link to your Vercel team and deploy.

---

## 📄 License
MIT © 2026 Catalove Studio.
