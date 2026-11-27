# Catalove: Production Finish Handoff

**Scope:** This handoff applies only to `/home/aizatfir/Project/Catalove`. Do not inspect or edit sibling projects, including SofizCake. Keep Catalove's database, storage, credentials, and deployment separate.

## Current state

- Repository: `AIZATFIR/Catalove`; active implementation branch: `catalove/hosted-catalog-platform`.
- Pull request: [#1](https://github.com/AIZATFIR/Catalove/pull/1). Check the live PR state before acting; the branch can change after this note is written.
- The production app is not approved for real client data or orders. A green build or Vercel preview is not proof of production persistence.
- The owner created a dedicated Catalove Supabase project (`vrugrxcajlkhsvmnayfc`). The migration chain, Auth owner membership, production secrets, Cloud Run deployment, backup/restore, and live transaction checks still need to be completed in the owner's secure accounts.
- The local demo is for presentation and UI work. Browser-local edits do not sync between devices; uploads and durable order records require the production backend.

## Source of truth

Read these current files before changing launch behavior:

1. [`README.md`](../README.md) for local setup, migration order, and deployment boundaries.
2. [`CLOUD-RUN-DEPLOYMENT.md`](CLOUD-RUN-DEPLOYMENT.md) for infrastructure and recovery steps.
3. [`COMMERCIAL-OPERATIONS.md`](COMMERCIAL-OPERATIONS.md) for onboarding, privacy, support, and launch gates.
4. [`CLIENT-LIFECYCLE-AND-TRUST.md`](CLIENT-LIFECYCLE-AND-TRUST.md) and [`CLIENT-OFFBOARDING.md`](CLIENT-OFFBOARDING.md) for promises and data exit handling.
5. The current PR diff and working tree before editing; preserve changes already in progress.

Historical files in this repository may describe older product or deployment states. Do not treat them as live implementation instructions without checking the current Catalove code and these source-of-truth documents.

## Finish sequence

1. Complete the dedicated Catalove Supabase setup from the README. Do not request passwords, API keys, service-role keys, or access tokens in chat; use `supabase login` in the owner's terminal.
2. Verify the linked ref is `vrugrxcajlkhsvmnayfc`, inspect `supabase db push --dry-run`, and apply migrations through `supabase db push` so migration history stays synchronized. Then verify tables, RLS, Storage bucket limits, seeded showcase catalog, and the initial owner membership.
3. Configure production runtime secrets through Catalove-owned Secret Manager and deploy the container to Catalove-owned Cloud Run. Keep service-role and AI keys server-only. Do not deploy the hosted-client service to Vercel production while the commercial hosting review remains unresolved.
4. Verify `/api/health`, owner sign-in/recovery, create/edit/publish, mobile image upload and deletion, stock/availability updates, order persistence and WhatsApp handoff, export, and tenant isolation using separate accounts.
5. Configure cost alerts, backups, and recovery contacts; practice restore and offboarding. Finalize client terms, retention, incident owner, support contact, and provider disclosures.
6. Deploy real traffic only after every launch gate in the operations runbook is evidenced. Keep the public demo clearly labeled until then.

## Safe claims

Call Catalove a **demo** until the production flow above is verified. Call it a **private pilot** only after the data, access, support, recovery, and client-approval gates are in place for named merchants. Do not promise durable orders, cross-device editing, uptime, backups, custom domains, or third-party AI processing unless the deployed configuration and written client terms support that exact claim.
