# Catalove client lifecycle and trust promises

This is the operating contract Catalove should follow for its first managed catalogs. It describes the product as it exists today and marks work that must be completed before public production onboarding. Do not claim a control is live until the operator has verified it in the deployed environment.

## What the client buys

Catalove provides a hosted product catalog and simple store management. The merchant controls product details, availability, images, branding, and customer contact/order handling. Visitors browse the public catalog and submit an order request or continue to WhatsApp. Catalove does not process card payments, guarantee product availability, arrange delivery, or act as the seller of record. The merchant confirms the final price, stock, delivery, cancellation, and payment directly with the customer.

Business and Enterprise amounts shown as “mulai” are estimates, not a complete offer. Before payment, give the client a written quote that states setup scope, monthly/annual recurring fees, hosting/domain responsibility, included revisions, support hours/response target, taxes if applicable, and cancellation/export terms. Do not promise custom branding, a domain, backups, uptime, or unlimited usage unless that item is active and included in the signed quote.

## Lifecycle

1. **Qualify and quote.** Confirm business identity and a reachable owner. Explain plans and hard quotas, who handles orders, which features are included, recurring infrastructure costs, and what is custom work. Record a written acceptance before billing or collecting production data.
2. **Collect the minimum.** Request only catalog copy, prices, stock/lead-time information, contact channels, and media needed to publish. Client confirms they own or are licensed to use all logos, photos, and text. Do not ask for customer lists or payment credentials.
3. **Build privately.** Create a draft tenant, add the owner account, configure the correct tenant URL, and import only approved catalog data. Use optimized product images; the public image bucket must not contain invoices, identity documents, customer addresses, or private files.
4. **Review and approve.** Give the owner a preview. They confirm names, prices, variants, stock/PO messaging, WhatsApp number, image rights, mobile display, and order wording. Keep approval evidence. Publish only after the owner approves.
5. **Handover.** Demonstrate login, product editing, stock/availability changes, order review, WhatsApp follow-up, export, password recovery, and support contact. Make clear that Catalove forwards order requests; the merchant must confirm the order and fulfill it.
6. **Operate transparently.** Monitor usage, failed uploads, database health, costs, and support time. Warn before a limit is reached. Never silently delete or downgrade client content. Communicate incidents, impact, workaround, and next update through the contact agreed in the quote.
7. **Renew or exit.** Give the owner a machine-readable export and agreed media handoff. Verify their identity, agree retention/legal holds, suspend public access, remove media and tenant data after the stated retention period, and record completion without retaining unnecessary customer details. Follow [offboarding runbook](CLIENT-OFFBOARDING.md).

## Data and security promises

- Every catalog and its orders belong to a tenant (`store_id`). Database policies and API checks must enforce the tenant boundary; a hidden UI control is not access control.
- A shared project is acceptable only after tests show one tenant cannot read, modify, export, upload to, or delete another tenant's data. Re-run these checks before changing tenant-related database policies.
- The merchant is expected to decide purposes for customer order details; Catalove processes those details to provide catalog/order functions. Catalove separately handles merchant account data for access, security, and support. Confirm the legal roles for each data flow in the client agreement and privacy notice before launch. Collect only what fulfillment needs and agree on retention/deletion in client terms. Do not use order contact details for ads or unrelated marketing.
- Public product images are public by design. Use a separate private channel for sensitive documents; preferably do not collect them at all.
- The Supabase service-role key and AI provider key are server-only. Restrict access to the smallest runtime identity, rotate after suspected exposure, and never put them in browser bundles, screenshots, chat, or Git.
- AI photo suggestions send a merchant-selected product photo and category names to Google Gemini. The route requires both `GEMINI_API_KEY` and `GEMINI_API_PAID_TIER_CONFIRMED=true`; keep it disabled until the privacy notice explains the transfer, the client has approved it, the paid tier/data terms are verified, and request budgets are configured. Google's current pricing page says Free-tier content may be used to improve products while Paid-tier content is not; recheck before enabling. [Gemini API pricing and data use](https://ai.google.dev/gemini-api/docs/pricing).
- Keep Catalove and SofizCake infrastructure, accounts, credentials, storage, and customer data separate.
- Maintain an owner account with MFA, a second recovery contact, billing/usage alerts, backup retention appropriate to the plan, and a tested restore procedure. A dashboard showing “healthy” is not proof that backup restore works.
- Publish a privacy notice that names the actual service providers, order data collected, purpose, retention, contact for access/deletion, and incident contact. Do not publish a privacy statement that promises controls or vendors not currently configured.

## What must be true before client #1

1. Four migrations are applied to Catalove Supabase ref `vrugrxcajlkhsvmnayfc` and match remote history. A fifth migration that replaces two seeded showcase image URLs is pending explicit approval; verify remote history before relying on it. Recheck that evidence before future schema changes. The current project contains the showcase store and sample products, but zero owner memberships and zero order requests.
2. Decide and record database plan/billing ownership. The project is currently Free and has no verified backup/restore drill. Do not accept real orders until a recovery plan, cost alerts, and production data ownership are in place.
3. Configure the production host, private server secrets, email auth redirect URLs, storage bucket policies, domain, and TLS. Cloud Run remains the documented target but is not deployed. Verify environment points to project ref `vrugrxcajlkhsvmnayfc`; never reuse SofizCake credentials. The current Vercel PR preview is access-protected and the public production URL is not verified.
4. Test a complete journey against the actual deployed URL: merchant sign-in and recovery, create/edit/publish catalog, phone-sized visitor browsing, image upload/delete, stock/PO update, order request, WhatsApp handoff, export, and owner-only access. Local health and successful public REST reads do not prove a production order journey.
5. Prove cross-tenant isolation for catalog, settings, orders, media, uploads, and export with separate owner accounts.
6. Complete client terms, privacy notice, support contact/response target, retention schedule, incident response owner, and cancellation/deletion workflow. Practice a database restore and one client offboarding.
7. Use a pilot agreement and written quote. Do not call the service enterprise-ready or promise an SLA until monitoring, on-call coverage, recovery targets, and contractual terms support that promise.

## Honest launch labels

- **Demo:** sample data only; no real client/customer data. Local/demo mode may be browser-only and is not durable.
- **Private pilot:** named merchants, explicit limits, manual onboarding/support, and verified deployment/database controls. State that service is early access and set expectations directly.
- **Production managed service:** all client #1 gates above are checked, costs and recovery are owned, and terms/privacy/support reflect the actual service.

Do not describe Catalove as ready for unrestricted self-service or B2B procurement until it has operational evidence for tenant isolation, access recovery, incident handling, data export/deletion, backup restore, billing, and support commitments.
