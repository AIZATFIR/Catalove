# Catalove: operating the first client catalogs

This runbook is for the current managed-service stage. Catalove’s current database is **single-store**. Do not onboard a second unrelated business into the same database until tenant routing, `store_id` on every tenant-owned record, Row Level Security (RLS), storage scoping, and cross-store isolation checks are implemented. A seller UI filter alone does not isolate client data.

## Recommended service shape

| Tier | What the client receives | Honest limits / revenue |
|---|---|---|
| Free starter | One usable hosted catalog, WhatsApp inquiry/order link, a Catalove attribution mark, a small product and photo allowance | Free as customer acquisition. Set actual caps after measuring client support and storage; do not promise unlimited use or uptime guarantees. |
| Business — mulai Rp299rb | Guided setup, more catalog content, expanded customization, attribution removal where available | Show this as a starting setup price only; hosting/domain renewal must be priced separately and disclosed before purchase. Existing prices are not a finalized recurring plan. |
| Enterprise — mulai Rp799rb | More brand controls and priority setup; custom work scoped separately | Quote via WhatsApp with written scope, delivery date, revisions, and recurring infrastructure cost stated separately. |

Do not sell “unlimited” storage, products, traffic, support, or custom work. Keep free useful but capped. A free catalog should export to a common format and have an understandable cancellation path. The owner needs a cost dashboard and a support-time record before deciding final limits.

## Client onboarding and release

1. **Intake:** confirm the business contact and preferred WhatsApp; collect store name, products, prices, variants, stock/availability, lead times, fulfillment options, and social links.
2. **Content rights:** client confirms they own or may use the photos, logo, and copy. Record the confirmation. Do not copy other catalogs' imagery.
3. **Build:** create from an industry preset. Resize images, add useful alt text, and ask the client to review names, prices, availability, ordering, and mobile layout.
4. **Approval:** send preview URL. Obtain explicit approval of prices and order/contact details before making it public.
5. **Handover:** show how to change stock, hide a product, respond to WhatsApp orders, and request support. State the support contact and expected response window in writing.
6. **Monthly operations:** review database and image usage, backups, failed uploads, error logs, and time spent supporting each client. Alert before a client reaches a cap; offer an upgrade or export instead of silently deleting data.
7. **Exit:** provide product/catalog export, disable credentials, then delete the tenant’s data and uploaded media after the agreed retention period. Keep proof of completion without retaining customer order details unnecessarily.

## Production and data rules

- Use a paid commercial hosting plan before Catalove accepts revenue. Vercel Hobby terms limit use to personal/non-commercial projects. Reassess the host if its cost no longer fits the model.
- Use a paid Supabase production project for real orders. The Free project can pause after a week of low activity and lacks automatic backups. Keep the project owner account under Catalove control and enable spend/usage alerts.
- The current live site has no connected Catalove production database (`persisted=false`). Treat it as a demo until a dedicated project is configured and database readiness is rechecked.
- Never reuse SofizCake’s Supabase project, credentials, buckets, or database. Catalove secrets remain server-side and separate.
- Keep customer orders private. They include phone numbers and may include addresses/notes. Limit access, collect only what fulfillment needs, do not use order contacts for ads, and agree on retention and deletion with the client.
- Product photos are intentionally public in the current bucket. Never place invoices, identity documents, or private customer photos in that bucket.
- Upload errors must remain visible. Never label browser-only or base64 content as a hosted image.
- Before onboarding store #2 into a shared project, prove with separate test accounts that one tenant cannot read, change, export, or delete another tenant’s catalog, settings, media, or orders.

## Free plan and ads

Do not place third-party ads in the client’s product pages, cart, or WhatsApp handoff. It competes with the merchant’s conversion, damages brand trust, and adds ad-policy responsibilities for user-generated pages. Keep “Powered by Catalove” as the free-tier attribution instead. After Catalove has meaningful discovery traffic, test clearly labeled sponsored cards only on a Catalove-owned discovery feed; make sponsorship opt-in for featured clients and moderate listings. Treat ad revenue as optional upside, never as the budget supporting uptime or backups.

## Cost model to check monthly

Current provider list prices are recorded in [research report](COMMERCIAL-RESEARCH.md); recheck them before setting or renewing customer prices.

Track these separately:

- Hosting plan and overage (Vercel or replacement).
- Database compute, storage, egress, backup tier, and project count (Supabase).
- Image storage, delivery, transforms, and requests (Supabase Storage first; compare Cloudflare R2 only with measured data).
- Custom domains and email/notification providers.
- Human setup/support time and client-specific customization.

Use one shared database only after multi-tenant controls are complete. One Supabase project per free client is not a sustainable default because projects carry separate database compute. If a client needs stronger isolation, price a dedicated project and backups as part of a premium plan.

## Launch gates

- [ ] Catalove-controlled paid commercial hosting and a named operational owner.
- [ ] Dedicated Catalove production Supabase project, migrations applied, owner login, backup/restore procedure, and cost alerts.
- [ ] Tenant schema, route-to-store mapping, RLS on every tenant-owned table, and tenant-scoped media policies.
- [ ] Cross-tenant automated checks for catalog, settings, orders, uploads, exports, and admin actions.
- [ ] Client terms: plan caps, recurring fees, support scope, data ownership/export, cancellation/deletion, and photo/content rights.
- [ ] Incident contact and basic recovery steps documented and practiced.
