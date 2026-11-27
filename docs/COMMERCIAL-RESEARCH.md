---
title: 'Commercial research: a safe first operating model for Catalove'
type: technical
topic: multi-tenant catalogs, hosting costs, free plans and ads
decision: 'Launch a capped free catalog on shared tenant-safe infrastructure; keep client pages ad-free.'
source: user request
status: researched; production setup remains external
created: 2026-11-25
updated: 2026-11-27
---

# Catalove commercial research

## Recommendation

Run Catalove as a small managed catalog platform: one Catalove-owned Supabase production project, shared tenant-scoped Postgres rows protected by RLS, store-scoped public media, and Next.js on Cloud Run in Jakarta. The repository now has the tenant migration, data export, upload quotas and tenant authorization checks. A shared database keeps early costs lower than provisioning one database per client; it also makes RLS and backup recovery critical controls.

Choose a **useful but capped Free** plan for acquisition: up to 25 products, 50 images, 2 MiB per image and 100 MiB total storage, WhatsApp contact/order flow, and visible Catalove attribution. Treat this as a costed acquisition expense. No “unlimited” or guaranteed uptime language. At current Supabase Pro pricing, expect a baseline of US$25/month before tax and overages for the shared production project. Do not use Supabase Free for live orders: projects pause after one week of inactivity and the plan has no automatic backups [1].

Do **not** place third-party ads in client product pages or checkout/WhatsApp flows. Attribution that can bring new clients is a better early return. If Catalove later owns a meaningful discovery audience, test clearly labeled, opt-in sponsored listings on Catalove-owned pages only. Publisher policy still applies to pages carrying ad code, including user-generated content [4]. Ads are uncertain revenue and must not fund baseline uptime or backups. Linktree's free ads after a visitor selects a link show one possible placement, not evidence that Catalove ads will cover infrastructure [5].

Use Cloud Run in `asia-southeast2` for the Next.js service and a dedicated Catalove Supabase project for Auth, database and image storage. Cloud Run supports Next.js deploys and has a Jakarta region; that region is Tier 2 pricing. Cloud Run's published free compute allowance is based on `us-central1` pricing, while external internet egress, image storage/delivery, Artifact Registry, and Supabase still have costs [2][3]. This can keep an early low-traffic app inexpensive, but is not a zero-cost or fixed-cost guarantee. Set alerts and observe actual cost per catalog.

Google Cloud's current terms allow GCP services to be integrated into customer applications that have material value independent of GCP, and prohibit selling/reselling the GCP services themselves [3]. Catalove provides the catalog product and customer workflow; Cloud Run hosts it. This appears to fit that model better than Vercel's current terms, which prohibit making the services available to third parties or using them for service-bureau purposes; Hobby use is also restricted to personal/non-commercial use [6]. A Vercel Pro subscription alone does not resolve that separate third-party/service-bureau clause. This is an interpretation of provider terms, not legal advice. Recheck the terms and get written provider confirmation if considering Vercel for hosted client catalogs. Keep GCP/Supabase accounts under Catalove's control.

## How client operations should work

1. Client signs up, verifies email, claims an available catalog URL, and gets a private draft catalog.
2. Client enters the WhatsApp number and at least one active product, previews the storefront, then publishes. Orders route to that store's records and its WhatsApp handoff.
3. Catalog data belongs to the client. Provide the store-scoped JSON export before cancellation; communicate which order data and media are deleted and when.
4. Catalove checks image/database usage, support load, failed requests, backup status, and cloud spend monthly. When a cap is reached, explain it and provide upgrade/export steps; never silently remove content.
5. If a store needs stronger isolation, custom domains, or a separate recovery boundary, scope and charge a dedicated project rather than making the shared free plan absorb that cost.

Orders contain personal data. Based on this product flow, the merchant chooses how to fulfill an order, while Catalove operates the software and has limited operational access; Catalove may separately decide purposes for account/security data. This is an operational inference, not a legal classification. Map each data flow and have the owner review applicable controller/processor roles, approved subprocessors, retention, deletion, rights-request handling, and incident response before onboarding. Indonesia's PDP Law requires processors to work under controller instructions and provides a written personal-data-failure notification deadline of 3×24 hours to data subjects and the institution; obtain qualified local advice on applicability and notification procedures [8].

## Pricing honesty

Keep the accepted “Business mulai Rp299rb / Enterprise mulai Rp799rb; bahas via WhatsApp” as indicative starting prices; billing cadence is not finalized. Agree on scope, recurring infrastructure, domain renewal, content maintenance and support separately before acceptance. Do not market custom domains, analytics, team seats, branded removal, or guaranteed response times until implemented and costed.

## Current launch gate

The dedicated Catalove Supabase project (`vrugrxcajlkhsvmnayfc`) is connected and its four migrations match remote history. Read-only checks found one published Free showcase store, six active products, four active categories, ten product images, zero memberships, and zero order requests. The project remains on Free; owner bootstrap, backup/restore, Cloud Run, production billing, and a real deployed order round-trip are unverified. The PR preview is Vercel-hosted and access-protected; the current public production URL did not serve this branch. Do not collect real client orders until the host/plan terms, recovery controls, owner access, production auth/storage, order journey, and client terms/privacy/contact/retention are confirmed. The Komdigi PSE FAQ describes private electronic system registration through OSS and lists NIB, relevant business licensing, and KBLI as prerequisites for the domestic path; confirm Catalove's exact applicability and category before commercial launch [9]. See [Cloud Run deployment and recovery](CLOUD-RUN-DEPLOYMENT.md) and [operations runbook](COMMERCIAL-OPERATIONS.md).

## Sources

| Ref | Claim | Source |
|---|---|---|
| [1] | Supabase Free/Pro price, quotas, pause behavior and backups | [Supabase pricing](https://supabase.com/pricing), accessed 2026-11-26 |
| [2] | Cloud Run pricing/free allowance, request billing and Jakarta Tier 2 price | [Cloud Run pricing](https://cloud.google.com/run/pricing), accessed 2026-11-26 |
| [3] | Next.js deployment, Jakarta region and app integration terms | [Next.js on Cloud Run](https://docs.cloud.google.com/run/docs/quickstarts/frameworks/deploy-nextjs-service), [Cloud Run locations](https://docs.cloud.google.com/run/docs/locations), [Google Cloud terms](https://cloud.google.com/terms), accessed 2026-11-26 |
| [4] | Publisher policies apply to pages carrying publisher code, including user-generated content | [Google Publisher Policies](https://support.google.com/adsense/answer/10008391?hl=en), accessed 2026-11-26 |
| [5] | Linktree Free ad placement behavior (not revenue viability) | [Linktree Help](https://linktr.ee/help/articles/12875121-ads-on-free-linktrees-beta), accessed 2026-11-26 |
| [6] | Vercel Hobby restriction and third-party/service-bureau language | [Vercel Terms](https://vercel.com/legal/terms), updated 2026-10-19, accessed 2026-11-26 |
| [7] | Tenant ID/RLS shared database guidance | [Supabase multi-tenant isolation](https://supabase.com/kb/faqs/database/multi-tenant-isolation), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), accessed 2026-11-26 |
| [8] | Processor instructions and personal-data breach notifications (PDP Law Articles 46 and 51) | [Law No. 27 of 2022](https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang%2Bnomor%2B27%2Btahun%2B2022), accessed 2026-11-26 |
| [9] | PSE Lingkup Privat registration criteria and OSS prerequisites | [Komdigi PSE FAQ](https://pse.komdigi.go.id/pertanyaan-umum), [registration criteria](https://pse.komdigi.go.id/panduan/kriteria-pendaftaran-pse-lingkup-privat), accessed 2026-11-27 |

Recheck hosting/storage terms and pricing before publishing package prices, then at least quarterly.
