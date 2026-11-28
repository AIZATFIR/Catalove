# Catalove Hosted Catalog Platform Implementation Plan

> **For agentic workers:** Continue inline in the existing Catalove checkout; the user explicitly authorized implementation and asked not to touch SofizCake.

**Goal:** Make Catalove safe to host multiple real catalog owners on one low-cost stack, with clear pricing, reliable storage, and a measurable free tier.

**Architecture:** Use a shared Supabase project with a `stores` tenant boundary and explicit membership. Every catalog, setting, availability, media object, and order belongs to one store; public storefront lookups use a stable store slug, and authenticated admin access is scoped by a membership checked server-side and by RLS. Keep database, storage, and deploy cost caps visible; do not insert third-party ads into seller pages.

**Tech Stack:** Next.js App Router, Supabase Postgres/Auth/Storage, Google Cloud Run in Jakarta, Cloudflare R2 as a later image-storage adapter if measured egress justifies migration.

## Global Constraints

- Changes are limited to `/home/aizatfir/Project/Catalove`.
- Existing `catalove.vercel.app` demo data remains attached to the first Catalove store.
- Never trust a client-supplied tenant ID without resolving slug and checking membership.
- Never use a service-role query without an explicit tenant filter.
- Public checkout must bind product lookup, availability, order, and order items to one store in one database transaction.
- Media must be compressed, bounded, tenant-prefixed, replaceable, and deletable.
- Free pages carry unobtrusive Catalove attribution; no ads inserted into a seller's storefront/checkout.
- Business/Enterprise price copy remains “mulai” and negotiated over WhatsApp until the owner finalizes it.

## Implementation order

1. Add store/membership schema and backfill existing Catalove rows to a stable first store; add constraints and security-definer helpers.
2. Scope public product/category/settings/availability endpoints by slug; preserve the root demo as the first store.
3. Scope admin sessions, product/category/settings/availability mutations, image upload, and orders to the authenticated membership.
4. Scope checkout RPCs and order lookup by store; prove that identical slugs/product IDs cannot cross stores.
5. Add store creation and owner onboarding flows, slug validation, limits, and clear deletion/export behavior.
6. Add image replacement/deletion and storage usage accounting; keep image resizing and strict upload validation.
7. Set plan enforcement: free tier limits and attribution; paid tiers remove attribution/enable custom branding; publish only claims actually supported by the service.
8. Run migration checks, test suite, lint, production build, and a cross-tenant integration test against a disposable Supabase project before enabling multiple clients in production.

## Launch gates

- A second test tenant can publish and edit a catalog without seeing or changing tenant one.
- Anonymous visitors can read only active public catalog data for the slug they opened.
- Order RPC rejects mixed-store cart items and stores orders/items under exactly one store.
- Storage upload/delete cannot target another tenant's files.
- Existing Catalove demo still works after migration.
- Supabase persistence is confirmed in the production environment; current deployment reports `persisted=false`, so do not market it as production-backed until that changes.
- Cloud Run, Artifact Registry and Supabase are configured under Catalove-owned production accounts with billing alerts; deployment and restore have been verified.
- Cost, backup, retention, support response, and abuse policies are written in plain Indonesian before onboarding external sellers.
