# SofizCake: Production Finish Handoff

**For:** Antigravity or the next implementation agent  
**Goal:** Finish the existing SofizCake app so Mama can manage a durable cake catalog from her phone and customers can submit order requests that persist.  
**Live site:** https://sofizcake.vercel.app/  
**Repo:** `/home/aizatfir/Project/SofizCake`  
**Branch:** `feat/sofizcake-mvp`  
**Baseline commit:** `98117ebe64c1c5d459a56632aae19aea1d8596ac`

## Keep the current work

The working tree contains uncommitted UI changes requested by the user. Preserve them. Inspect `git status` and the diff before editing, and do not reset, checkout, or overwrite those files. The changes cover the dark theme, storefront header/music control, full-page SVG motion, carousel and scroll-expand behavior, GSAP scroll tuning, and bulk-entry presentation. There is also an untracked `_bmad/` directory created while preparing this handoff; decide whether to keep or ignore it before committing.

The latest UI changes may not be deployed yet. Check the actual Vercel deployment before saying they are live.

## Current implementation state

The repo already has Next.js 15, React 19, TypeScript, Tailwind, seeded cake data, storefront/catalog/product/order-request pages, seller pages, a deterministic cake recommendation flow, and UI components from the earlier design work.

The business-critical backend is still a demo:

- `src/lib/services/cake-service.ts`, `order-service.ts`, and `availability-service.ts` keep data in process memory. Vercel restarts and separate instances do not share writes.
- `src/lib/business-settings.ts` stores seller settings in that browser's local storage only.
- `/admin/products/bulk` and `/admin/products/new` create temporary `blob:` preview URLs. Those URLs are not durable photo storage. The bulk page says database/storage are not connected.
- A first database/Storage migration is drafted at `supabase/migrations/202610280001_production_core.sql`. It has not been applied or connected to the app yet. There is no Supabase client or configured app environment in the repo.
- `src/lib/services/auth-service.ts` contains demo credentials and aliases. The login writes a client-controlled cookie. Admin pages and `/api/orders` `GET` do not enforce server-side authorization.
- `/api/ai/recommend` uses deterministic matching only. No Gemini photo organizer exists.
- Demo orders in `order-service.ts` must not appear as real customer requests in production.

Read `docs/superpowers/specs/2026-10-27-sofizcake-design.md` and `docs/superpowers/plans/2026-10-27-sofizcake-mvp.md` before changing architecture. Reuse the existing `Product`, `Category`, `ProductVariant`, `ProductImage`, `OrderRequest`, availability, and `BusinessSettings` models instead of creating a parallel app.

## Supabase connection

The user supplied project ref `yiucsieqiyjqpfrreunt`. Supabase MCP OAuth was completed in Codex and its configured endpoint is scoped to this project with database, storage, docs, and development feature groups. Check `codex mcp list` and confirm the MCP tools are available in your session before using them. Antigravity may not inherit Codex's MCP login; if it cannot see the server, use migration files and ask the project owner to run them rather than requesting a personal access token in chat.

The user revoked the Supabase personal access token that was pasted into chat. Do not reuse it or ask for another token. A Gemini API key was also pasted earlier; if it remains active, ask the user to rotate it and set the replacement as a server-side Vercel environment variable. Never put either credential in source, SQL, screenshots, this document, or client code.

## Required outcome

### 1. Durable data and access control

- Add Supabase SSR/browser clients and environment validation. Keep secrets server-side; never expose a service-role key to the browser.
- Add versioned SQL migrations for categories, products, product variants, product images, per-product availability, order requests/items, and business settings, following the existing specification.
- Add constraints and indexes, including a unique order reference. Validate product, variant, price, lead time, and availability from the database when creating an order. Enforce quota safely if the UI offers a quota.
- Add RLS: public visitors can read active catalog data and submit only a validated order request; only authenticated seller accounts can modify catalog, availability, order status, and settings. Protect every admin page and API route on the server.
- Replace the demo password/cookie flow with Supabase Auth. Do not seed fake orders into the live database.
- Persist catalog, order lifecycle, availability, and branding/contact settings through the existing service boundaries. A local seed fallback may remain for local development; production writes must fail clearly if Supabase is misconfigured.

### 2. Mama's phone-first photo and product workflow

- Make one clear bulk workflow the default: select many photos from a phone gallery, preview them, group photos by cake, set a cover and order, and retry failed uploads.
- Upload image bytes to Supabase Storage. Store stable storage paths and metadata in `product_images`; never save `blob:` preview URLs as product data.
- Let Mama enter and edit product name, category, price, lead time, description, and variants manually. Support multiple photos for one cake, drafts, publish, and adding photos to an existing cake.
- Keep upload progress and useful error messages visible on mobile; after refresh or on another device, saved products and photos must still appear.
- Optional Gemini organizer may suggest photo grouping, flavor/category tags, or draft descriptions. It must use real uploaded images, show suggestions for review, and must never invent or set name or price. Keep manual upload usable when Gemini is unset or unavailable. Use a server-only `GEMINI_API_KEY` environment variable.

### 3. Finish existing seller operations and storefront wiring

- Make product list/reordering/active state use persisted data.
- Make availability calendar and seller branding settings persist across devices.
- Keep order-request confirmation explicit: WhatsApp handoff means the request is sent; the order is not confirmed until Mama confirms in chat.
- Keep public catalog, homepage carousels, product pages, recommendations, and photo galleries reading from the same active database catalog.

## Implementation order

1. Inspect existing diffs and types. Confirm which Supabase MCP tools are available and inspect the target project's current schema before applying anything. Review the draft migration for compatibility with the existing project before applying it.
2. Complete migrations, RLS policies, and the product-image bucket. Apply them to the scoped project and verify the resulting tables/policies/bucket.
3. Replace demo admin auth with server-verified Supabase Auth. Secure admin routes and APIs before enabling writes.
4. Add durable repositories for catalog, images, availability, orders, and settings. Preserve local seeded development behavior without allowing production memory-only writes.
5. Complete the phone bulk-photo flow and optional Gemini suggestions, then connect the existing seller product/list/settings screens.
6. Configure Vercel environment variables through the user's dashboard or an authorized secure environment. Do not request secret values in chat.
7. Run the existing test suite and production build. Use Playwright at mobile and desktop sizes to verify seller login, multiple photo upload, reload persistence, public catalog display, order submission, and unauthenticated admin/API denial.
8. Review the final diff, deploy to Vercel, verify the production URL, and report any setup step that only the owner can complete.

## Acceptance criteria

- A seller can choose multiple photos from a phone, group them into several cakes, manually enter names and prices, upload, save drafts, and publish without losing data on refresh.
- A second browser/device sees the same published product details and permanent images.
- Public pages show active products only; inactive/draft products stay private.
- An unauthenticated visitor cannot access seller pages, order lists, catalog mutations, or settings mutations.
- A customer order request and each item snapshot persist in Supabase, get a unique reference, and appear in the seller's order manager. The UI says Mama still needs to confirm it in WhatsApp.
- Seller availability and branding settings persist across devices.
- Gemini suggestions never alter manually controlled name or price, and manual operation works without the Gemini key.
- Production build and relevant tests pass; mobile Playwright checks show no blocking layout or upload errors.
- Vercel production reflects the verified commit and uses environment variables set outside source control.

## Ready-to-send instruction for the next agent

> Continue SofizCake from `/home/aizatfir/Project/SofizCake` on `feat/sofizcake-mvp`. Read `docs/AGENT_HANDOFF_PRODUCTION_FINISH.md`, the current diff, and the existing design spec/implementation plan first. Preserve the uncommitted UI work. Finish the Supabase-backed production flows in the listed order: secure seller auth/RLS, durable catalog and orders/settings/availability, permanent multi-photo mobile upload, optional review-only Gemini photo organization, then verify with tests/build/Playwright and deploy to the existing Vercel app. Supabase project ref is `yiucsieqiyjqpfrreunt`; use the scoped OAuth MCP if available. The previously pasted Supabase PAT has been revoked; never ask for or log credentials. Ask the owner only for setup actions that require their secure dashboard, such as adding rotated API keys to Vercel or creating the initial seller auth account.
