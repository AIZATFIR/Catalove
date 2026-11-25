---
title: 'Technical research: Catalove commercial operations and client safety'
type: technical
topic: Catalove commercial operations and client safety
decision: 'Choose an affordable, honest path to hosting real client catalogs without losing tenant data or hiding costs.'
source: user request
status: complete
preset: standard
validation: normal
verified_claims: 10
unverified_claims: 0
created: 2026-11-25
updated: 2026-11-25
---

# Catalove commercial operations and client safety

**Decision this research serves:** Choose an affordable, honest path to hosting real client catalogs without losing tenant data or hiding costs.

## Executive summary

Catalove should start as a small, managed catalog service with a clearly disclosed free tier, not an ad-funded marketplace. Keep one Catalove production database and move to tenant-scoped rows and RLS before onboarding unrelated businesses into that database. Supabase’s own guidance recommends a shared schema with a tenant ID on tenant-owned tables and database-enforced RLS; AWS guidance independently describes the pooled model and says PostgreSQL RLS is required to prevent cross-tenant access. The current Catalove schema is still a single-store model, so it is not safe to sell as a multi-client SaaS yet [1][7][10].

Use Supabase Free only for testing: projects may pause after seven days of low activity and have no automatic backups [2][8]. A live order-taking service needs a paid, monitored production database. The currently published Pro baseline is US$25/month, includes 100 GB storage and 250 GB cached egress; additional projects run their own database instances and increase cost [2]. Compress images before upload, enforce file limits at both API and bucket, and never silently replace remote storage with base64 data that bloats browser storage. Supabase Storage already provides quotas/access rules; Cloudflare R2 is a later option when egress becomes the cost driver (10 GB-month and request allowances; no egress charge) [3][4].

The current Vercel Hobby plan is expressly for personal, non-commercial use. A revenue-generating Catalove service needs Vercel Pro or another host whose plan permits commercial use [5]. Do not promise “free forever” until a usage budget and abuse controls exist. No paid ads in a client’s catalog: the client’s brand and conversion matter, while user-generated pages also create publisher-policy obligations [6]. If a free plan needs monetization, keep the Catalove mark visible; later test clearly labeled sponsored placements only in Catalove-owned discovery, with client opt-in and moderation. Linktree’s free ad experiment is placed after a visitor selects a link, but this is not evidence that ad revenue will cover Catalove’s costs [9].

**Critical caveat:** Catalove’s live production currently reports `persisted=false`; no dedicated production database is connected. The code remains single-store, so this research does not certify it for real client data.

## Findings

### Tenant and customer data

The current migration gives every seller access to the same global products, orders, and settings. That is acceptable only for one owner/store. Before multiple businesses share a database, introduce `stores`/tenants, store memberships, and a `store_id` on products, categories, settings, availability, orders, variants, and media metadata. Enforce isolation with RLS on every tenant table and storage path; never rely only on a UI filter or a caller-provided store ID [1][7]. A shared database is the economical default; separate Supabase projects are a premium isolation option, not the default for free clients, because each project has its own Postgres instance [2].

Operational order data contains customer names, WhatsApp numbers, delivery addresses, and notes. Collect only what is needed for an order, keep orders private, define a retention/export/deletion procedure, and never use client contact lists for advertising. Before taking live orders, publish plain-language ownership/support/contact and data-handling terms; obtain local professional advice for formal privacy/tax obligations.

### Database and hosting cost

Supabase Free currently includes 500 MB database, 1 GB file storage, 5 GB egress, two active projects, and pauses projects with low activity over a seven-day window; free projects do not include automated backups [2][8]. Pro starts at US$25/month, with a first project and compute credit included; separate projects add compute. Pro includes daily backups retained for seven days, 100 GB storage, and 250 GB cached egress in the displayed plan [2]. These figures are provider list prices, not a complete Catalove cost: Vercel, domains, taxes, payment/admin time, support, and image transformations still matter.

Vercel Hobby allows only personal/non-commercial use. Its generous free allowance does not make it a compliant production plan for a service sold to clients [5]. Use Pro for commercial Catalove or compare another commercial host before customer launch. Put alerts on Vercel/Supabase usage, keep spend caps where available, and review cost per client monthly.

### Images and media

For the first small cohort, Supabase Storage bundled with the production project is simpler than introducing a second vendor. Resize/compress client images to a reasonable catalog rendition, limit accepted raster MIME and bytes in the API, enforce a bucket-level maximum, and store only public product images in a public bucket. Do not put order/private documents there. Supabase Storage applies RLS policies to file operations, while public URL downloads bypass read-policy checks; a public bucket therefore means anyone with an image URL can read that image [3][7].

If media egress becomes a material bill, compare Cloudflare R2: current standard storage is US$0.015/GB-month, with the first 10 GB-month and request allowances free; internet egress has no charge. Requests, custom-domain/cache setup, image processing, and operator time are not free [4]. Do not migrate until actual metrics show the savings beat the added operational work.

### Free plan, pricing, and ads

Recommendation (commercial judgment, not a sourced market price): retain a genuinely usable free catalog with Catalove attribution, capped product count and upload storage, and WhatsApp inquiry/order links. Charge for removing Catalove attribution, more products/media, custom domain, analytics, team access, and hands-on setup. Keep prior accepted “Mulai Rp299rb / Rp799rb; bahas via WhatsApp” as indicative one-time Business/Enterprise setup, and disclose recurring hosting/domain charges separately once chosen. No “unlimited” claim. Provide export and cancellation steps so clients can leave with their catalog data.

Ads should not appear between a buyer and the merchant’s products or checkout. Google requires all pages carrying its code—including user-generated content—to comply with publisher policies, and reserves the ability to restrict or suspend monetization [6]. Linktree’s current Free tier experiments with ads after link selection; that shows the placement can be separated from the creator’s primary page, not that it will fund Catalove reliably [9]. Consider sponsored placement only on Catalove’s own discovery surfaces after meaningful visitor volume, clearly labeled, opt-in, and moderated. Until then, free is a customer-acquisition cost with explicit caps; paid tiers subsidize it.

## Recommended client operations

1. Create a store record and one owner membership; verify contact email/WhatsApp and business identity manually at launch.
2. Start from an industry template; client supplies product names, prices, availability, photos they have rights to use, fulfillment rules, and contact details.
3. Preview on mobile and desktop; client confirms prices, dates, WhatsApp, and image rights before publishing.
4. Use tenant-scoped database and storage access before onboarding client two. Test that account A cannot list, edit, export, or delete account B’s data.
5. Agree on who maintains stock, how quickly Catalove responds to an outage, where orders go, and what happens at cancellation. Export data and remove access on exit.
6. Review usage, failed uploads, backups, error logs, and per-client support time monthly. Raise tier limits or pause new uploads before exceeding the budget.

## Implementation order

1. Stop the current upload route from returning base64 as if a hosted upload succeeded; validate image signatures and size; compress in the browser before upload.
2. Keep one production Supabase project for Catalove, with automated backups/alerts, before any real orders. The present deployment is demo-only until configured.
3. Design and implement tenant schema + RLS + store routing as a dedicated migration/feature; migrate the sample catalog into an explicit Catalove demo store, then prove cross-tenant denial.
4. Set commercial hosting before revenue (Vercel Pro or a commercial alternative); publish free/paid limits and support/exit policy.
5. Consider R2 or sponsored discovery only after measuring usage and traffic.

## Sources

| Ref | Claim supported | Publisher | Publication date | Accessed | Confidence |
|---|---|---|---|---|---|
| [1] | Shared-schema tenant IDs with RLS is a common Supabase SaaS isolation pattern | [Supabase Knowledge Base](https://supabase.com/kb/faqs/database/multi-tenant-isolation) | Undated | 2026-11-25 | High |
| [2] | Supabase Free/Pro prices, quotas, pausing and backups | [Supabase Pricing](https://supabase.com/pricing) | Current page | 2026-11-25 | High |
| [3] | Storage RLS and public bucket semantics | [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) | Undated | 2026-11-25 | High |
| [4] | R2 storage/request rates and free egress | [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/) | Updated 2026-10-30 | 2026-11-25 | High |
| [5] | Vercel Hobby only for personal/non-commercial use | [Vercel Terms of Service](https://vercel.com/legal/terms) | Current terms | 2026-11-25 | High |
| [6] | Publisher policies apply to all site content, including user-generated content | [Google Publisher Policies](https://support.google.com/adsense/answer/10008391?hl=en) | Current help page | 2026-11-25 | High |
| [7] | Database RLS must enforce the access model; browser query filters alone are insufficient | [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Undated | 2026-11-25 | High |
| [8] | Supabase Free projects pause after low activity over a week | [Supabase Free Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing) | Updated 2026-09-22 | 2026-11-25 | High |
| [9] | Linktree Free ads may appear after a visitor selects a link | [Linktree Help](https://linktr.ee/help/articles/12875121-ads-on-free-linktrees-beta) | Updated 2026-10-09 | 2026-11-25 | Medium |
| [10] | In a pooled PostgreSQL SaaS model, RLS is required for tenant isolation | [AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/) | Undated | 2026-11-25 | High |

## Open questions for the next business decision

- What recurring hosting price can the client accept, and who owns the domain?
- Which commercial Vercel team will own Catalove production, or should hosting move before launch?
- What free-tier limits should be tested with real clients (products, image storage, and support response)?
- Do clients require custom domains or should launch begin with `*.catalove` subdomains?

## Staleness

Using freshness windows of pricing 3 months, architecture 24 months, terms 3 months, platform policy 6 months, and competitive features 3 months, no claim is stale as of 2026-11-25. Earliest scheduled recheck is 2027-01-01 (R2 price and Linktree feature); recheck hosting and storage prices before publishing a package price.
