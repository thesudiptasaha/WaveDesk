-- already run live on 2026-11-22 (Supabase SQL Editor). This file is the record only.
-- What it did: Photo Cards get their own content ID WAVECARD-YYYYMMDD_0001 (creation day Asia/Dhaka, own daily counter shared by all channels, counter key card:<org>; videos keep WAVECON-; trigger assign_content_uid picks the prefix by content_type; guard_contents_update protects both prefixes).

begin;

do $$
begin
  if exists (select 1 from public.contents where content_type = 'PHOTO CARD' and (content_uid is null or content_uid not like 'WAVECARD-%')) then
    raise exception 'A Photo Card with an old ID exists. Delete or rename it first; nothing was changed.';
  end if;
end $$;

create or replace function public.assign_content_uid()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  d date;
  n int;
  k text;
  pfx text;
begin
  if new.content_type = 'PHOTO CARD' then
    pfx := 'WAVECARD-';
  else
    pfx := 'WAVECON-';
  end if;
  if tg_op = 'INSERT' or new.content_uid is null or new.content_uid not like (pfx || '%') then
    d := (coalesce(new.created_at, now()) at time zone 'Asia/Dhaka')::date;
    k := case when pfx = 'WAVECARD-' then 'card:' else '' end || coalesce(new.organization_id::text, 'none');
    insert into public.content_uid_counters (org_key, day, last_n)
    values (k, d, 1)
    on conflict (org_key, day)
    do update set last_n = content_uid_counters.last_n + 1
    returning last_n into n;
    new.content_uid := pfx || to_char(d, 'YYYYMMDD') || '_' || lpad(n::text, 4, '0');
  end if;
  return new;
end;
$function$;

do $$
declare
  def text;
  newdef text;
begin
  select pg_get_functiondef('public.guard_contents_update'::regproc) into def;
  newdef := replace(def,
    'if old.content_uid like ''WAVECON-%'' and new.content_uid is distinct from old.content_uid then',
    'if (old.content_uid like ''WAVECON-%'' or old.content_uid like ''WAVECARD-%'') and new.content_uid is distinct from old.content_uid then');
  if newdef = def then
    raise exception 'guard_contents_update: the WAVECON check line was not found; nothing changed';
  end if;
  execute newdef;
end $$;

commit;

-- check (expect 1, 1, 0)
select 'assign_content_uid knows WAVECARD (expect 1)' as what, count(*)::text as result
  from pg_proc where pronamespace = 'public'::regnamespace and proname = 'assign_content_uid' and prosrc like '%WAVECARD-%'
union all
select 'guard_contents_update knows WAVECARD (expect 1)', count(*)::text
  from pg_proc where pronamespace = 'public'::regnamespace and proname = 'guard_contents_update' and prosrc like '%WAVECARD-%'
union all
select 'photo cards with an old ID (expect 0)', count(*)::text
  from public.contents where content_type = 'PHOTO CARD' and (content_uid is null or content_uid not like 'WAVECARD-%');

-- To undo (comments only, do NOT run):
--  1) recreate assign_content_uid() from sql/2026-10-29_wavecon_content_id.sql (the original WAVECON-only version)
--  2) re-run the replace in the guard step the other way round (WAVECON-only condition) on guard_contents_update
--  3) delete from public.content_uid_counters where org_key like 'card:%';
