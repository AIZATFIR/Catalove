# Catalove

Catalove is a customizable product catalog and storefront for small businesses. It is built with Next.js, React, TypeScript, and Tailwind CSS. WhatsApp checkout and the general sample catalog work in demo mode; shared catalog, orders, admin login, availability, and photo storage require a dedicated Catalove Supabase project.

## Local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Without Supabase values, the app uses the local demo catalog and browser storage. Those edits are local to that browser and are not shared between devices. Admin login and durable order storage are disabled in this mode.

Run the automated suite and production build with:

```bash
npm test
npm run lint -- --quiet
npm run build
```

## Dedicated Supabase setup

Use a **new Supabase project only for Catalove**. Do not reuse a project that contains another business's data.

1. Create a Supabase project and copy its project URL, anon key, project ref, and service role key.
2. Set these variables in `.env.local` for local work and in Vercel for **Production, Preview, and Development**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   NEXT_PUBLIC_CATALOVE_SUPABASE_PROJECT_REF=<project-ref>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```

   The URL host must match the explicit project ref. The service role key is server-only; never prefix it with `NEXT_PUBLIC_` or commit it.

3. In the new project's SQL Editor, apply `supabase/migrations/202610290001_catalove_core.sql`, then `supabase/migrations/202611250001_catalog_image_limits.sql`. This creates Catalove's tables, seller-only write policies, order submission function, and applies the product image bucket limits.
4. In Supabase Authentication, create the owner's email/password account. Then add that account as a seller from the SQL Editor (replace the example email):

   ```sql
   insert into public.seller_users (user_id)
   select id from auth.users where email = 'owner@example.com'
   on conflict (user_id) do update set is_active = true;
   ```

5. Redeploy Catalove after adding the Vercel variables, then sign in at `/admin/login`.

The migration is for an empty, dedicated Catalove project. Do not run it against a shared or existing business database. The database project ref check intentionally disables Supabase when the URL and Catalove ref do not match.

## Deploy

The GitHub repository is connected to Vercel. Push changes to `main` to create a deployment. A successful frontend deployment does not enable database features until the dedicated Supabase project and environment variables are configured.

## Commercial readiness and multiple clients

The current application and database schema are for one Catalove-owned store. Do not onboard multiple unrelated client stores into this schema yet: products, settings, availability, and orders are global rather than scoped to a store. A shared client service requires a tenant/store ID and database-enforced Row Level Security on every business-owned table, media path scoping, store-aware routing, and cross-tenant access tests.

The live site is a demo until `/api/settings` reports persisted data from a dedicated Catalove production Supabase project. Supabase Free is suitable for staging, but it may pause after inactivity and does not provide automatic backups. Vercel Hobby is for personal/non-commercial use; move Catalove to a commercial hosting plan before selling hosted catalogs. Current provider prices are in [docs/COMMERCIAL-RESEARCH.md](docs/COMMERCIAL-RESEARCH.md); client workflows are in [docs/COMMERCIAL-OPERATIONS.md](docs/COMMERCIAL-OPERATIONS.md).
