# How to sell Catalove honestly

Last reviewed: 28 November 2026

## What the website offers today

- **Free preview:** account and capped catalog editor for exploring the product. It has no automatic charge. Until production hosting, backups, owner recovery, and a complete live order journey are verified, tell users to use sample data and not rely on it for important customer orders.
- **Business — mulai Rp299rb:** guided catalog setup/customization. This is an indicative starting price; billing period and final scope are not set by the website.
- **Enterprise — mulai Rp799rb:** deeper branding and catalog curation. This is also an indicative starting price, not a complete quote.
- **No in-app purchase:** the WhatsApp button opens a draft inquiry. It does not send automatically, accept a contract, charge a card, or confirm an order.
- **No hidden hosting promise:** neither starting price includes hosting or a domain. Before paid work, the written quote must specify setup price, whether it is one-time or recurring, server/storage/domain charges and renewals, who pays each provider, scope, delivery date, revisions, support, cancellation, and export.

## Buyer journey

1. Visitor tries the free preview or chooses Business/Enterprise.
2. The selected paid plan opens WhatsApp with a prefilled inquiry. The buyer can edit the message before sending.
3. Catalove asks for requirements and sends a written quote. Do not ask for production catalog data yet.
4. The buyer accepts the quote and payment terms in writing. Only then may Catalove collect approved content and begin paid setup.
5. Create a private draft and share a preview. The buyer verifies prices, stock, WhatsApp, image rights, mobile display, and order flow.
6. Publish only after the buyer approves and the hosting arrangement, backups, access recovery, and order journey are production-ready.
7. Handover includes owner login, editing products/stock, reviewing requests, export, support contact, and cancellation route.

Never treat a WhatsApp draft or a verbal “looks good” as payment, approval to publish, or acceptance of recurring charges.
Use the [quote template](CATALOVE-QUOTE-TEMPLATE.md) for every paid offer; remove placeholders and verify each cost and promise before sending it.

## Server decision for first pilots

Use **one Catalove-managed shared production stack** for the first small cohort, with tenant isolation and one agreed recurring hosting/operations line in each paid quote. Catalove pays the provider bill; clients do not need cloud accounts. State the monthly amount, service limits and support/recovery scope before acceptance. Quote a custom domain and its renewal separately if requested. Do not create one database project per free client: that multiplies fixed compute. Keep the customer’s catalog and order data tenant-scoped and exportable.

The current public Vercel project is appropriate as a marketing/demo surface only. Vercel’s current Terms prohibit using its Services for a third-party service bureau or making the Services available to third parties. Do not use it to host client catalogs unless Vercel confirms in writing that the Catalove arrangement is allowed. The planned client-catalog host is Cloud Run in Jakarta (`asia-southeast2`) with the dedicated Catalove Supabase project; Cloud Run and production recovery are not yet operationally verified. This hosting choice is an operating recommendation, not a legal opinion. Recheck provider terms before launch.

## Costs and who carries them

- The dedicated Catalove Supabase project is currently on **Free** and is preview-only. Free projects may pause after a week of inactivity and have no automatic backups.
- Supabase currently lists **Pro from US$25/month** for the first project, before taxes/overages; it includes daily backups retained for seven days. Extra usage, additional projects, and add-ons can increase this.
- Cloud Run is usage-based. Jakarta pricing, internet egress, image delivery, build storage, domain registration/renewal, and support time can add costs. The Google Cloud calculator and actual usage data are needed before giving an IDR monthly estimate.
- **Catalove owns the shared production bill** and must pay providers on time. Recover a transparent recurring hosting/operations fee from paid clients only after measuring the stack and writing the exact amount in each quote. Free preview is a deliberate, capped acquisition cost; do not assume ad revenue will fund uptime or backups.
- No client owes an infrastructure cost unless it is stated in the quote and accepted first. Do not promise “free forever,” unlimited photos/traffic, guaranteed uptime, or backup service beyond what the active plan provides.

## Gates before accepting real client orders

1. Move client-catalog serving off Vercel unless there is written permission; launch the Cloud Run service on Catalove-owned billing.
2. Upgrade Catalove Supabase to an appropriate production plan, configure usage/budget alerts, and test a restore to a separate project.
3. Create and verify the Catalove owner membership; test signup, email verification, password recovery, tenant access, catalog edits, upload/delete, stock updates, order persistence, WhatsApp handoff, and export at the public domain.
4. Verify cross-tenant isolation with two separate owner accounts.
5. Publish current provider, privacy, retention, support, incident, and cancellation terms. Confirm applicable Indonesian business/PSE obligations with qualified help.
6. Only then change the public Free copy from “preview” to a live service offer.

## Research basis

- [Supabase pricing](https://supabase.com/pricing) and [Supabase database-only project cost](https://supabase.com/kb/faqs/platform/database-only-cost), checked 28 November 2026.
- [Cloud Run pricing](https://cloud.google.com/run/pricing) and [Cloud Run locations](https://docs.cloud.google.com/run/docs/locations), checked 28 November 2026.
- [Vercel Terms of Service](https://vercel.com/legal/terms), updated 19 October 2026, checked 28 November 2026.
- Related internal runbooks: [commercial research](COMMERCIAL-RESEARCH.md), [client lifecycle and trust](CLIENT-LIFECYCLE-AND-TRUST.md), and [Cloud Run deployment](CLOUD-RUN-DEPLOYMENT.md).
