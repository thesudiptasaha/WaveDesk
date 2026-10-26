-- 2026-10-26: contents.script_saved_at: time the script text was last saved.
-- STATUS: already run live in Supabase. This file is the record only.
-- Shown as the "written date" on the script paper header in the drawer.
-- Set only by the database trigger; the app never writes it.
-- ROLLBACK:
--   drop trigger if exists trg_contents_script_saved_at on public.contents;
--   drop function if exists public.set_script_saved_at();
--   alter table public.contents drop column script_saved_at;

alter table public.contents add column if not exists script_saved_at timestamptz;
comment on column public.contents.script_saved_at is 'Time the script text was last saved (set by trigger when script changes).';

-- Existing scripts: use the content created date (there is no updated_at column).
update public.contents
   set script_saved_at = created_at
 where coalesce(script, '') <> '' and script_saved_at is null;
-- (done before the trigger exists, so the trigger cannot undo it)

create or replace function public.set_script_saved_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(new.script, '') <> '' then
      new.script_saved_at := now();
    end if;
  elsif new.script is distinct from old.script then
    new.script_saved_at := case when coalesce(new.script, '') <> '' then now() else null end;
  else
    new.script_saved_at := old.script_saved_at;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_contents_script_saved_at on public.contents;
create trigger trg_contents_script_saved_at
before insert or update on public.contents
for each row execute function public.set_script_saved_at();
