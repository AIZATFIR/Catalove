# Catalove

Catalove is a multi-tenant product catalog and storefront for small businesses. A merchant can publish a catalog, manage products and stock, and capture an order before opening a pre-filled WhatsApp message. There is no payment processing in the app.

The repo contains the tenant-aware application, database migrations, image quotas, store export, and Cloud Run build/deploy pipeline. The dedicated Catalove Supabase project (`vrugrxcajlkhsvmnayfc`) is connected: all six migrations are applied and match the remote history, including the showcase art and optional seller-managed checkout link changes. The project has one published Free showcase store, six active sample products, and no memberships or order requests. It is still a preview setup: the project is on Free, no Catalove owner membership exists yet, no Cloud Run deployment or backup/restore drill is verified, and the current Vercel production URL is not serving this branch. Do not use it for real client orders.

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
- Products can link to a seller's HTTPS checkout page. Payment, digital-file delivery, refunds, and the external platform's privacy terms stay with the seller; Catalove does not process them.
- Product photos are public by design. Never upload invoices, identity documents, or private customer photos.
- No third-party ads are injected into client storefronts. Free catalogs show Catalove attribution. Paid setup/branding prices are indicative starting points; agree billing cadence, scope, hosting, domain, and support via WhatsApp before accepting payment.

Do not use SofizCake's Supabase project, secrets, storage, or database for Catalove.

## Configure the production Supabase project

Use the dedicated Catalove Supabase project only for preview/testing until its owner account, plan, backups, and recovery are verified. It is currently on Free and may pause after inactivity; it has no automatic backups. Keep project access and recovery under Catalove control.

1. The dedicated project is `vrugrxcajlkhsvmnayfc` in Singapore. Confirm the ref in the dashboard and keep the project under Catalove's owner account. Set the production site URL and redirect URLs for the final Catalove domain.
2. All six local migrations currently match the remote history. For future migrations, confirm the linked project ref, inspect the dry run, and use `--yes` only when the user has approved the exact pending set. The CLI may ask for the database password; enter it only in the terminal prompt:

   ```sh
   npx supabase login
   npx supabase link --project-ref vrugrxcajlkhsvmnayfc
   npx supabase db push --remote --dry-run
   ```

Review the linked project ref and pending migrations. If either does not match, stop and correct the link. Supabase CLI targets the local database by default, so keep `--remote` on both commands. Do not apply migration files in SQL Editor: direct SQL bypasses Supabase migration history and can leave future deploys out of sync.
3. Create and verify the Catalove owner account in Supabase Auth. The current project has zero `store_memberships`; no account can manage the seeded Catalove showcase store until a verified owner is granted membership.
4. After verifying the owner's email and the target store, grant that account `owner` membership using the Supabase project owner account. Keep the operation in a local, auditable terminal session; never send the owner email, password, or service-role key in chat.

   ```sql
   -- Replace the email only in your trusted terminal session after verification.
   insert into public.store_memberships (store_id, user_id, role)
   select s.id, u.id, 'owner'
   from public.stores s
   join auth.users u on u.email = 'owner@example.com'
   where s.slug = 'catalove' and u.email_confirmed_at is not null
   on conflict (store_id, user_id) do update set role = 'owner';
   ```

   Verify one row was added and the owner can sign in. The migration chain created the `catalove` tenant and seeded clearly labeled showcase products; new client stores are not seeded. Do not edit the seeded UUID or run this migration chain on a database containing another business.
5. The local preview currently returns `200` from `/api/health`, and public reads return the showcase catalog. This does not prove the Vercel production deployment or owner operations. Before routing real visitors, verify production `/api/health`, owner login, image upload/deletion, a test order round-trip, export, and cross-store isolation on the actual deployed URL.

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
