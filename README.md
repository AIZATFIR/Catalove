# Catalove

Catalove is a multi-tenant product catalog and storefront for small businesses. A merchant can publish a catalog, manage products and stock, and capture an order before opening a pre-filled WhatsApp message. There is no payment processing in the app.

The repo contains the tenant-aware application, database migrations, image quotas, store export, and Cloud Run build/deploy pipeline. A dedicated Catalove Supabase project has been created and verified empty; migrations, production secrets, billing/recovery setup, and the production app deployment are still pending. Do not use the current live Vercel demo for real client orders.

## Local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

With no valid Supabase configuration, the app uses demo data and browser-local settings. That mode is for UI development only: changes do not sync between devices, uploads are unavailable, and orders are not durable.

Run the automated suite and production build with:

```bash
npm test
npm run lint
npm run build
node scripts/smoke-standalone.mjs
```

Before changing the tenant migration, run its PostgreSQL integration checks with Docker available:

```bash
npm run test:tenant-db
```

## Production architecture

- Next.js standalone container on Google Cloud Run in Jakarta (`asia-southeast2`).
- One Catalove-owned Supabase Pro project for Postgres, Auth, and public product images; every merchant row is scoped by `store_id` and RLS.
- Free catalog limits are enforced in the database: 25 products, 50 images, 2 MiB per image, and 100 MiB total image storage.
- Orders include customer contact and fulfillment details. Keep them private; the merchant can manage its own orders. Public order lookup uses a high-entropy reference.
- Product photos are public by design. Never upload invoices, identity documents, or private customer photos.
- No third-party ads are injected into client storefronts. Free catalogs show Catalove attribution. Paid setup/branding prices are indicative starting points; agree billing cadence, scope, hosting, domain, and support via WhatsApp before accepting payment.

Do not use SofizCake's Supabase project, secrets, storage, or database for Catalove.

## Configure the production Supabase project

Use a dedicated Supabase **Pro** project owned by Catalove. Do not use Supabase Free for live orders: a free project may pause after one week of inactivity and has no automatic backups. Keep project access, billing alerts, and recovery contacts under Catalove control.

1. The dedicated project is `vrugrxcajlkhsvmnayfc` in Singapore. Confirm its billing tier and keep it under Catalove's owner account. Set the production site URL and redirect URLs for the final Catalove domain.
2. Create and verify the initial Catalove owner account in Supabase Auth.
3. In SQL Editor, apply the migrations in order:
   - `supabase/migrations/202610290001_catalove_core.sql`
   - `supabase/migrations/202611250001_catalog_image_limits.sql`
4. Grant the initial owner seller access **before** the tenant migration runs:

   ```sql
   insert into public.seller_users (user_id)
   select id from auth.users where email = 'owner@example.com'
   on conflict (user_id) do update set is_active = true;
   ```

5. Apply `supabase/migrations/202611260001_store_tenants.sql`. It creates the `catalove` tenant, backfills existing catalog data, and converts the initial seller to a store owner. Do not edit the seeded UUID or run this on a database containing another business.
6. Apply `supabase/migrations/202611260002_seed_catalove_demo_catalog.sql`. It adds labeled showcase products to Catalove's demo catalog; new client stores are not seeded with these products.
7. Verify `/api/health` returns `200` with `{ "status": "ok" }`, sign in at `/admin/login`, and verify the Catalove demo catalog and owner access. Test public catalog loading, image upload/deletion, an order round-trip, export, and cross-store access isolation before routing real visitors.

Keep `SUPABASE_SERVICE_ROLE_KEY` out of browser code and source control. Public `NEXT_PUBLIC_*` configuration is passed to the image build; the service-role key is stored in Secret Manager for runtime use.

## Deploy to Cloud Run

Read [Cloud Run deployment and recovery](docs/CLOUD-RUN-DEPLOYMENT.md) and set up the Catalove-owned Cloud project, Jakarta Artifact Registry, runtime service account, and Secret Manager permission. GitHub Actions checks lint, app tests, PostgreSQL migrations/isolation, production build, and standalone route/CSS smoke tests. `cloudbuild.yaml` runs app tests and the production build inside the container build, pushes the commit-tagged image, then deploys that exact image to Cloud Run.

For the first deploy, authenticate the Google Cloud CLI and set Cloud Build substitutions for the Supabase URL, anon key, and project ref, then run:

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_SUPABASE_URL='https://PROJECT.supabase.co',_SUPABASE_ANON_KEY='PUBLIC_ANON_KEY',_SUPABASE_PROJECT_REF='PROJECT_REF' .
```

After validating that deployment, configure a Cloud Build GitHub trigger on the protected production branch with the same public substitutions. Do not connect this repo to a Vercel production deployment for the hosted-client service model; the commercial review found its current terms unclear for third-party storefront hosting. Recheck provider terms before the first paid client.

## Client operations and launch gates

Review [commercial research](docs/COMMERCIAL-RESEARCH.md) and the [operations runbook](docs/COMMERCIAL-OPERATIONS.md) before onboarding clients. These cover plan caps, pricing honesty, media and order privacy, export/cancellation, backups, incidents, and ad placement.

Do not call the service production-ready until a dedicated Supabase project has the migrations applied, Cloud Run is deployed under Catalove billing, a restore has been practiced, the real order path works, and the owner has published support, retention, and client terms. The public privacy notice and provider list must match the infrastructure actually active in production.
