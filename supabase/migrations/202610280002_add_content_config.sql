-- Add content_config jsonb column to business_settings for fully customizable storefront texts
alter table public.business_settings add column if not exists content_config jsonb not null default '{}'::jsonb;
