# Catalove deployment on Google Cloud Run

This repository ships as a container for Catalove's hosted, multi-tenant catalog service. The app is designed to run in Jakarta (`asia-southeast2`) and use a dedicated Catalove Supabase project for Auth, Postgres and product-image storage. Keep the cloud account, Supabase project, billing alerts and recovery contacts owned by Catalove.

## Before the first deploy

1. Use a dedicated Catalove Supabase project in a region close to expected customers. The current project is Free; use it only for preview/testing because Free projects can pause after one week of inactivity and have no automatic backups. Upgrade and configure recovery before accepting real orders. Never use SofizCake's project or credentials.
2. Run `npm run test:tenant-db` locally with Docker available. Four migrations have been applied to the dedicated project and match remote history. Two migrations are pending explicit approval: showcase art and optional seller-managed checkout links. Run `npx supabase db push --remote --dry-run`, confirm the linked ref and exact pending files, then apply with `npx supabase db push --remote --yes` only after explicit approval. Keep `--remote` on both commands; Supabase CLI targets the local database by default. Do not apply migration files directly in SQL Editor; that bypasses migration history.
3. Create and verify the Catalove owner in Supabase Auth. The current project has zero `store_memberships`; grant the verified owner access to the showcase store using the controlled bootstrap procedure in the README, then verify a real admin login.
4. The migration chain created/configured the public `catalove-product-images` bucket with a 2 MiB per-object limit and JPEG, PNG and WebP MIME types. It seeded one published Free showcase store with sample products; current read-only checks found six active products, four active categories, ten image records, no memberships and no order requests. Merchant accounts remain separate. Product photos are public by design; private customer/order information must never go in this bucket.
5. Configure Supabase Auth site URL and redirect URLs for the production Catalove domain. Verify email delivery and recovery. Until this is verified on the actual domain, user onboarding is a preview flow.
6. Create a Secret Manager version for `SUPABASE_SERVICE_ROLE_KEY` and grant access only to the Cloud Run runtime service account. Keep the AI route disabled by default. If Catalove later enables photo suggestions, store `GEMINI_API_KEY` in a separate Secret Manager secret and set `GEMINI_API_PAID_TIER_CONFIRMED=true` only after verifying a paid Gemini API tier, provider data terms, client disclosure, and request budgets. Never pass keys as Docker build arguments or commit them.
7. Review the selected Supabase plan costs and set billing/usage alerts. Pro pricing starts at US$25/month before tax/overages. This shared project is the baseline database/storage cost for all free catalogs; separate projects multiply compute cost.

## Build and deploy

Install and authenticate the Google Cloud CLI, select a Catalove-owned billing project, then enable Cloud Run, Cloud Build and Artifact Registry APIs. Create the Jakarta Artifact Registry Docker repository named `catalove`, a dedicated runtime service account named `catalove-runtime`, and a Secret Manager secret named `CATALOVE_SUPABASE_SERVICE_ROLE_KEY`. Grant the Cloud Run runtime service account `roles/secretmanager.secretAccessor` on that secret. Grant the Cloud Build identity permission to push images, deploy Cloud Run, and act as the runtime service account (`roles/artifactregistry.writer`, `roles/run.admin`, and `roles/iam.serviceAccountUser` as appropriate to the project policy).

The checked-in [`cloudbuild.yaml`](../cloudbuild.yaml) builds an immutable image tagged by Cloud Build ID, runs the project test suite and Next.js production build inside the image build, pushes that image to Artifact Registry, then deploys the exact image to Cloud Run. It passes only the three public Supabase browser values during the build; the service-role key enters the running service from Secret Manager. Run once manually to validate the project:

```sh
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_SUPABASE_URL='https://PROJECT.supabase.co',_SUPABASE_ANON_KEY='PUBLIC_ANON_KEY',_SUPABASE_PROJECT_REF='PROJECT_REF' .
```

Configure the same substitutions on the Cloud Build GitHub trigger after the manual deployment works. Trigger deployments only from the protected production branch after tests pass. Do not enable AI by adding only a key: the route also requires `GEMINI_API_PAID_TIER_CONFIRMED=true`, after data terms, disclosure, and request budgets have been reviewed. Public `NEXT_PUBLIC_*` values are compiled into browser code and are not secrets; the service-role and AI keys must only come from Secret Manager at runtime.

## Release and recovery

- Run migrations before shifting traffic. Keep the last known-good Cloud Run revision and image tag so a bad app release can be rolled back without changing the database.
- Cloud Run's startup probe checks `/api/health`; the endpoint returns `200` only when the service-role connection can find the published Catalove tenant. It returns a generic `503` without exposing credentials or database error details.
- Confirm the store resolves at `/s/catalove`, public products load, a real order is persisted, and the owner can see/update only that store's orders.
- Keep the public privacy notice's processor list aligned with the providers actually active in production. Before routing traffic here, publish Google Cloud Run and Supabase as the production infrastructure providers and confirm the privacy contact and retention terms are current.
- Check logs for application errors and Supabase usage; set Google Cloud budget alerts. An instance ceiling limits concurrency/capacity but does **not** cap the bill. Network egress, image delivery, builds, and stored container images can still cost money.
- Supabase Pro daily backups are retained for seven days according to current plan details. Practice restoring a backup to a separate project before onboarding client data; never test recovery over the production database.
- Export each client's catalog before cancellation. Define order-retention and deletion timing in client terms, and delete that tenant's media after the retention period.
- Cloud Run's Jakarta region is Tier 2. Its free compute allowance is calculated using `us-central1` pricing; do not model the whole production stack as free. Supabase Pro remains a baseline fixed cost.

## Client model, free tier, ads

The database enforces current starter caps: 25 products, 50 product images, 2 MiB per image and 100 MiB total image storage per free catalog. These are abuse/cost controls, not a promise of uptime or unlimited support. Raise a limit only after measuring image egress, support time and shared database headroom.

Keep free catalogs genuinely useful with visible “Powered by Catalove” attribution. Do not inject third-party ads into client catalogs or the WhatsApp order path. That weakens merchant conversion and makes each user-generated storefront subject to publisher-policy compliance. If traffic later supports ads, test clearly labeled sponsorship only on Catalove-owned discovery pages, with opt-in and moderation; never count it as committed revenue before measured.

Business and Enterprise prices remain “mulai” prices discussed via WhatsApp. Agree on billing cadence, scope, ongoing hosting, domains, content updates and support before purchase. Do not market custom domains, analytics, team seats or removed attribution as available unless the feature is actually shipped.
