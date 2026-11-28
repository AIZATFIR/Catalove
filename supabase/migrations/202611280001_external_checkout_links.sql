-- Optional checkout links stay on seller-managed payment and delivery platforms.
alter table public.products
  add column external_checkout_url text;

alter table public.products
  add constraint products_external_checkout_https
  check (
    external_checkout_url is null
    or external_checkout_url ~* '^https://[^[:space:]]+$'
  );
