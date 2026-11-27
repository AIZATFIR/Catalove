# Catalove: operating the first client catalogs

This runbook is for the first managed-service stage. Tenant routing, `store_id` on client records, Row Level Security (RLS), storage quotas, onboarding and cross-store isolation checks are implemented in code. All six migrations are applied and match remote history, including the original showcase art and seller-managed HTTPS checkout links. Production remains **not ready for real customer data**: the project is Free, has no owner membership or order history yet, and backup/restore, Cloud Run, legal terms, and a real deployed transaction path are not verified. A seller UI filter alone does not isolate client data.

## Recommended service shape

| Tier | What the client receives | Honest limits / revenue |
|---|---|---|
| Free starter | One hosted catalog, WhatsApp inquiry/order flow, optional links to seller-managed checkout, Catalove attribution, up to 25 products and 50 photos / 100 MiB | Free as customer acquisition within enforced caps; do not promise unlimited use or uptime guarantees. |
| Business — mulai Rp299rb | Guided setup and customization scoped via WhatsApp | Display as an indicative starting price; confirm billing cadence, scope, hosting/domain renewal and support before purchase. |
| Enterprise — mulai Rp799rb | Custom branding and setup scoped with the client | Quote through WhatsApp with written scope, delivery date, revisions, and ongoing infrastructure cost. |

Do not sell “unlimited” storage, products, traffic, support, or custom work. Keep free useful but capped. A free catalog should export to a common format and have an understandable cancellation path. The owner needs a cost dashboard and a support-time record before deciding final limits.

## Client onboarding and release

1. **Intake:** confirm the business contact and preferred WhatsApp; collect store name, products, prices, variants, stock/availability, lead times, fulfillment options, and social links.
2. **Content rights:** client confirms they own or may use the photos, logo, and copy. Record the confirmation. Do not copy other catalogs' imagery.
3. **Build:** create from an industry preset. Resize images, add useful alt text, and ask the client to review names, prices, availability, ordering, and mobile layout.
4. **Approval:** send preview URL. Obtain explicit approval of prices and order/contact details before making it public.
5. **Handover:** show how to change stock, hide a product, respond to WhatsApp orders, and request support. State the support contact and expected response window in writing.
6. **Monthly operations:** review database and image usage, backups, failed uploads, error logs, and time spent supporting each client. Alert before a client reaches a cap; offer an upgrade or export instead of silently deleting data.
7. **Exit:** follow the [manual offboarding runbook](CLIENT-OFFBOARDING.md): verify the owner, export catalog and order data, agree retention, suspend public access, remove media, delete tenant rows, and verify completion. Keep a deletion record without retaining customer order details.

## Production and data rules

- Current intended production host is Cloud Run Jakarta; it is not deployed. A Vercel PR preview exists, but the preview is access-protected and the current public production URL does not serve this branch. Review the chosen host's current commercial terms and project billing before the first paid customer.
- Use a paid Supabase production project for real orders. The Free project can pause after a week of low activity and lacks automatic backups. Keep the project owner account under Catalove control and enable spend/usage alerts.
- The dedicated Catalove Supabase project is currently Free. All six migrations are applied, including the unbranded-art and external-checkout migrations. It contains one published showcase store with six active sample products and no owner memberships or order requests. The Auth project exists, but no owner membership has been bootstrapped. Cloud Run project/deployment and billing setup are not verified. Treat the current app as a preview until those services and a real order or external checkout journey are configured and verified.
- Never reuse SofizCake’s Supabase project, credentials, buckets, or database. Catalove secrets remain server-side and separate.
- Keep customer orders private. They include phone numbers and may include addresses/notes. Limit access, collect only what fulfillment needs, do not use order contacts for ads, and agree on retention and deletion with the client.
- Seller-managed checkout links open on the seller's platform. The seller must own the destination and handle its terms, price, payment, digital delivery, privacy, refunds, and customer support; Catalove does not verify payment or fulfillment.
- Product photos are intentionally public in the current bucket. Never place invoices, identity documents, or private customer photos in that bucket.
- Upload errors must remain visible. Never label browser-only or base64 content as a hosted image.
- Before onboarding store #2 into a shared project, prove with separate test accounts that one tenant cannot read, change, export, or delete another tenant’s catalog, settings, media, or orders.

## Free plan and ads

Do not place third-party ads in the client’s product pages, cart, or WhatsApp handoff. It competes with the merchant’s conversion, damages brand trust, and adds ad-policy responsibilities for user-generated pages. Keep “Powered by Catalove” as the free-tier attribution instead. After Catalove has meaningful discovery traffic, test clearly labeled sponsored cards only on a Catalove-owned discovery feed; make sponsorship opt-in for featured clients and moderate listings. Treat ad revenue as optional upside, never as the budget supporting uptime or backups. Exact implemented quotas and deploy steps live in [Cloud Run deployment](CLOUD-RUN-DEPLOYMENT.md).

## Cost model to check monthly

Current provider list prices are recorded in [research report](COMMERCIAL-RESEARCH.md); recheck them before setting or renewing customer prices.

Track these separately:

- Cloud Run compute/networking and Artifact Registry image retention.
- Database compute, storage, egress, backup tier, and project count (Supabase).
- Image storage, delivery, transforms, and requests (Supabase Storage first; compare Cloudflare R2 only with measured data).
- Custom domains and email/notification providers.
- Human setup/support time and client-specific customization.

Use one shared database only after multi-tenant controls are complete. One Supabase project per free client is not a sustainable default because projects carry separate database compute. If a client needs stronger isolation, price a dedicated project and backups as part of a premium plan.

## Launch gates

- [ ] Catalove has a named operational owner and dedicated cloud project; Cloud Run deployment and billing alerts are active.
- [x] Dedicated Catalove Supabase project exists and four applied migrations match remote history.
- [ ] Review and explicitly approve the fifth demo-art migration before applying it.
- [ ] Owner login and membership are verified; choose an appropriate paid plan, configure cost alerts, and practice backup/restore before any real orders.
- [x] Tenant schema, route-to-store mapping, RLS on tenant-owned tables, and tenant-scoped media quotas are implemented in the migration.
- [x] Cross-tenant database checks and tenant-scoped API tests for catalog, settings, orders, uploads, export, and admin actions.
- [ ] Client terms and privacy notice: plan caps, recurring fees, support scope, data ownership/export, cancellation/deletion, photo/content rights, actual providers, retention, and incident contact. Confirm PSE/NIB/KBLI applicability with the applicable Indonesian authorities or counsel before commercial launch.
- [ ] Client terms identify merchant/Catalove responsibilities, data retention/deletion periods, approved service providers, support contact, and incident escalation; public privacy text must match active production providers.
- [ ] Until self-service cancellation is shipped, assign one Catalove operator to use the manual [offboarding runbook](CLIENT-OFFBOARDING.md) for every client exit.
- [ ] Document the data-incident response path, assign an owner, and confirm it can meet the applicable notification deadline.
- [ ] Incident contact and basic recovery steps documented and practiced.
