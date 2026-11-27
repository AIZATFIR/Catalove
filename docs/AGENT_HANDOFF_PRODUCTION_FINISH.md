# Catalove production finish handoff

**Scope:** `/home/aizatfir/Project/Catalove` only. Never inspect or edit SofizCake's source, database, secrets, or deployments.

## Verified state — 27 November 2026

- Repository: `AIZATFIR/Catalove`, branch `catalove/hosted-catalog-platform`, head `222dd6f` at the time this note was updated.
- Pull request #1 is open. GitHub `verify` and Vercel deployment checks pass for this head. The branch preview [is deployed](https://catalove-git-catalove-hosted-ca-bd987b-zafirs-projects-5b3c6ef2.vercel.app) but Vercel Authentication returns `302` to unauthenticated requests. The public `catalove.vercel.app/api/health` route still returns `404`; do not treat the branch preview as the production deployment.
- Supabase project `vrugrxcajlkhsvmnayfc` is the dedicated Catalove project. Four local migrations match remote history. A current read-only query found one store, six active products, zero store memberships, and zero order requests. Public REST reads succeeded.
- The Supabase project is on Free. No automatic backups/restore drill or paid-plan readiness is verified. No owner membership has been added to the seeded `catalove` showcase store.
- Local `/api/health` returns 200 with the dedicated project configuration. Lint, the app test suite, PostgreSQL tenant isolation tests, production build, and standalone smoke checks pass on `222dd6f`. These are not evidence of a public production health check, an owner login, or a real order round-trip.
- Cloud Run is not deployed and its billing, runtime identity, Secret Manager, alerts, and recovery are not verified. No production release or PR merge has been authorized in this thread.
- The app handles product catalogs, stock/availability, order requests, and a user-confirmed WhatsApp handoff. It does not process payment or securely fulfill digital files. Business/Enterprise prices are indicative starting points discussed via WhatsApp; recurring cadence and hosting/domain costs are not final.

## Finish sequence

1. Keep working only in Catalove. Review the current diff and preserve the live branch history. Do not merge PR #1 or move traffic to production without explicit authorization.
2. Run the app suite, lint, production build, PostgreSQL tenant isolation checks, and standalone smoke tests. Inspect mobile and desktop rendering plus signup, owner authorization, editor, image upload, settings save, order, export, and tenant routing flows.
3. Complete the reviewed branch changes, push to the authorized branch, and confirm CI and its Vercel preview. The protected preview URL must be tested in an authenticated browser session before claiming visual or runtime readiness.
4. In the owner-controlled account, create and verify the Catalove operator account, bootstrap its membership in the seeded `catalove` store, then verify login and store-scoped administration. Do not request or print passwords, tokens, or service-role keys in chat.
5. Decide whether this is a private pilot or production managed service. Before real orders, select a database plan with an appropriate recovery path, configure owner recovery contacts and spend alerts, practice a restore, and test a full order round-trip against the deployed URL.
6. Configure a Catalove-owned commercial runtime, auth redirect URLs, production secrets, domain/TLS, monitoring, and rollback. Cloud Run is the documented production target but has not been created or deployed. Keep Vercel preview separate from the production release decision.
7. Finalize Indonesian business/PSE applicability, NIB/KBLI steps, client agreement, privacy/retention terms, support contact, incident owner, cancellation/export/deletion process, and provider disclosures. Recheck advice with the appropriate Indonesian authority or counsel; this handoff is not legal advice.
8. Use a named-client pilot only after the relevant gates above are evidenced. Keep the showcase clearly labeled and never promise payments, digital-file delivery, backup, uptime, custom domains, or a service SLA that has not been implemented and verified.

## Source of truth

- [README](../README.md): local setup, Supabase state, and deployment boundaries.
- [Cloud Run deployment and recovery](CLOUD-RUN-DEPLOYMENT.md): infrastructure checklist; it remains a target runbook, not proof of a live deployment.
- [Commercial operations](COMMERCIAL-OPERATIONS.md): pricing, onboarding, privacy, support and launch gates.
- [Client lifecycle and trust](CLIENT-LIFECYCLE-AND-TRUST.md) and [offboarding](CLIENT-OFFBOARDING.md): client promises, export, retention and exit handling.
- Current Git diff, remote migration history, actual deployment checks, and the dedicated Supabase project outrank older plans or README claims.
