-- already run live on 2026-10-29
-- 2026-10-29  Content ID WAVECON-YYYYMMDD_XXXX (creation day, Asia/Dhaka, 4 digits)
begin;

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
begin
  if tg_op = 'INSERT' or new.content_uid is null or new.content_uid not like 'WAVECON-%' then
    d := (coalesce(new.created_at, now()) at time zone 'Asia/Dhaka')::date;
    k := coalesce(new.organization_id::text, 'none');
    insert into public.content_uid_counters (org_key, day, last_n)
    values (k, d, 1)
    on conflict (org_key, day)
    do update set last_n = content_uid_counters.last_n + 1
    returning last_n into n;
    new.content_uid := 'WAVECON-' || to_char(d, 'YYYYMMDD') || '_' || lpad(n::text, 4, '0');
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
  newdef := replace(def, 'old.content_uid like ''CON-%''', 'old.content_uid like ''WAVECON-%''');
  if newdef = def then
    raise exception 'guard_contents_update: the CON- check was not found; nothing changed';
  end if;
  execute newdef;
end $$;

alter table public.contents disable trigger contents_assign_uid;
alter table public.contents disable trigger contents_notify_update;

with ranked as (
  select id,
         (coalesce(created_at, now()) at time zone 'Asia/Dhaka')::date as d,
         row_number() over (
           partition by coalesce(organization_id::text, 'none'),
                        (coalesce(created_at, now()) at time zone 'Asia/Dhaka')::date
           order by created_at, id
         ) as n
  from public.contents
)
update public.contents c
set content_uid = 'WAVECON-' || to_char(r.d, 'YYYYMMDD') || '_' || lpad(r.n::text, 4, '0')
from ranked r
where r.id = c.id;

alter table public.contents enable trigger contents_assign_uid;
alter table public.contents enable trigger contents_notify_update;

delete from public.content_uid_counters;
insert into public.content_uid_counters (org_key, day, last_n)
select coalesce(organization_id::text, 'none'),
       (coalesce(created_at, now()) at time zone 'Asia/Dhaka')::date,
       count(*)
from public.contents
group by 1, 2;

do $$
declare
  total int; bad int; dups int;
begin
  select count(*) into total from public.contents;
  select count(*) into bad from public.contents where content_uid is null or content_uid !~ '^WAVECON-[0-9]{8}_[0-9]{4}$';
  select count(*) into dups from (select content_uid from public.contents group by 1 having count(*) > 1) x;
  if bad > 0 or dups > 0 then
    raise exception 'Check failed: bad=%, duplicates=%', bad, dups;
  end if;
  raise notice 'OK: % contents renamed', total;
end $$;

commit;
