-- STATUS: already run live in Supabase. This file is the record only.
-- Date: 2026-11-19
-- What it did: Adds updated_at column to public.contents with automatic touch trigger and index.
-- Note: Trigger name starts with "zz_" so it fires last (PostgreSQL triggers run alphabetically by name).
-- script_saved_at is still set only by trg_contents_script_saved_at.

alter table public.contents add column if not exists updated_at timestamptz not null default now();
create index if not exists contents_org_updated_at_idx on public.contents (organization_id, updated_at);
create or replace function public.touch_contents_updated_at() returns trigger language plpgsql as $fn$ begin new.updated_at := now(); return new; end; $fn$;
drop trigger if exists zz_contents_touch_updated_at on public.contents;
create trigger zz_contents_touch_updated_at before update on public.contents for each row execute function public.touch_contents_updated_at();

-- ROLLBACK:
-- drop trigger if exists zz_contents_touch_updated_at on public.contents;
-- drop function if exists public.touch_contents_updated_at();
-- drop index if exists public.contents_org_updated_at_idx;
-- alter table public.contents drop column if exists updated_at;
