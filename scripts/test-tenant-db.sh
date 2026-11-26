#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
container_name="catalove-db-test-$$"
container_password="catalove-test-only"
temp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$temp_dir"
  docker rm --force "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run --detach --rm \
  --name "$container_name" \
  --env "POSTGRES_PASSWORD=$container_password" \
  --publish 127.0.0.1::5432 \
  postgres:17-alpine >/dev/null

ready=false
for attempt in $(seq 1 60); do
  if docker exec "$container_name" pg_isready -U postgres >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  docker logs "$container_name"
  echo "PostgreSQL test container did not become ready." >&2
  exit 1
fi
sleep 1

docker exec -i "$container_name" psql -U postgres -v ON_ERROR_STOP=1 <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema extensions;
create schema auth;
create table auth.users (id uuid primary key, raw_app_meta_data jsonb not null default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create schema storage;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table storage.objects (
  bucket_id text not null references storage.buckets(id),
  name text not null,
  metadata jsonb not null default '{}'::jsonb,
  primary key (bucket_id, name)
);
grant usage on schema public, auth, storage, extensions to anon, authenticated, service_role;
grant select on auth.users to anon, authenticated, service_role;
grant all on storage.buckets, storage.objects to anon, authenticated, service_role;
SQL

{
  cat "$repo_root/supabase/migrations/202610290001_catalove_core.sql"
  cat "$repo_root/supabase/migrations/202611250001_catalog_image_limits.sql"
  cat "$repo_root/supabase/tests/store_migration_seed.sql"
  cat "$repo_root/supabase/migrations/202611260001_store_tenants.sql"
  cat "$repo_root/supabase/migrations/202611260002_seed_catalove_demo_catalog.sql"
  cat "$repo_root/supabase/tests/store_migration_backfill_assertions.sql"
  cat "$repo_root/supabase/tests/store_demo_catalog_assertions.sql"
  cat "$repo_root/supabase/tests/store_isolation.sql"
} | docker exec -i "$container_name" psql -U postgres -v ON_ERROR_STOP=1

concurrent_user_id="40000000-0000-4000-8000-000000000001"
docker exec "$container_name" psql -U postgres -v ON_ERROR_STOP=1 -c \
  "insert into auth.users (id, raw_app_meta_data) values ('$concurrent_user_id', '{}'::jsonb)"

# Hold the same per-user lock before racing two independent signup connections.
docker exec "$container_name" psql -U postgres -v ON_ERROR_STOP=1 -c \
  "begin; select pg_advisory_xact_lock(hashtextextended('$concurrent_user_id', 0)); select pg_sleep(2); commit" \
  >/dev/null &
locker_pid=$!

lock_ready=false
for attempt in $(seq 1 30); do
  active_locks="$(docker exec "$container_name" psql -U postgres -Atc \
    "select count(*) from pg_locks where locktype = 'advisory' and granted and pid <> pg_backend_pid()")"
  if [[ "$active_locks" == 1 ]]; then
    lock_ready=true
    break
  fi
  sleep 0.1
done
if [[ "$lock_ready" != true ]]; then
  echo "Could not establish the test signup lock." >&2
  exit 1
fi

docker exec "$container_name" psql -U postgres -v ON_ERROR_STOP=1 -Atc \
  "set request.jwt.claim.sub = '$concurrent_user_id'; select public.create_store_for_current_user('Concurrent A', 'concurrent-a')" \
  >"$temp_dir/signup-a.log" 2>&1 &
signup_a_pid=$!
docker exec "$container_name" psql -U postgres -v ON_ERROR_STOP=1 -Atc \
  "set request.jwt.claim.sub = '$concurrent_user_id'; select public.create_store_for_current_user('Concurrent B', 'concurrent-b')" \
  >"$temp_dir/signup-b.log" 2>&1 &
signup_b_pid=$!

wait "$locker_pid"
signup_a_status=0
signup_b_status=0
wait "$signup_a_pid" || signup_a_status=$?
wait "$signup_b_pid" || signup_b_status=$?

if [[ "$signup_a_status" -eq "$signup_b_status" ]]; then
  cat "$temp_dir/signup-a.log" "$temp_dir/signup-b.log"
  echo "Concurrent signup must create exactly one catalog." >&2
  exit 1
fi
if ! rg -q "Satu akun dapat memiliki satu katalog gratis" "$temp_dir/signup-a.log" "$temp_dir/signup-b.log"; then
  cat "$temp_dir/signup-a.log" "$temp_dir/signup-b.log"
  echo "The losing concurrent signup did not receive the one-store limit." >&2
  exit 1
fi

echo "✅ Catalove migrations, demo catalog, legacy backfill, RLS, quotas, tenant order checks, and concurrent signup guard passed."
