-- already run live on 2026-11-01
-- Sponsors / advertisers, phase 1: tables advertisers and content_ads with row level security
begin;

create or replace function public.i_am_producer()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from team_members
    where auth_user_id = auth.uid() and active and role_producer
  );
$$;
revoke all on function public.i_am_producer() from public;
grant execute on function public.i_am_producer() to authenticated;

create table if not exists advertisers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  logo_url text,
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists advertisers_org_name_uq on advertisers (organization_id, lower(name));

create table if not exists content_ads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  content_id bigint not null references contents(id) on delete cascade,
  advertiser_id uuid not null references advertisers(id) on delete restrict,
  ad_type text not null check (ad_type in ('spoken','intro_clip','outro_clip','logo_dog','l_shape','caption','other')),
  instruction text,
  file_note text,
  status text not null default 'agreed' check (status in ('agreed','added','aired')),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_ads_org_content_idx on content_ads (organization_id, content_id);
create index if not exists content_ads_advertiser_idx on content_ads (advertiser_id);

create or replace function public.content_ads_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists content_ads_touch_trg on content_ads;
create trigger content_ads_touch_trg before update on content_ads
  for each row execute function public.content_ads_touch();

alter table advertisers enable row level security;
alter table content_ads enable row level security;

drop policy if exists "advertisers_select" on advertisers;
drop policy if exists "advertisers_insert" on advertisers;
drop policy if exists "advertisers_update" on advertisers;
drop policy if exists "advertisers_delete" on advertisers;
drop policy if exists "content_ads_select" on content_ads;
drop policy if exists "content_ads_insert" on content_ads;
drop policy if exists "content_ads_update" on content_ads;
drop policy if exists "content_ads_delete" on content_ads;

create policy "advertisers_select" on advertisers for select to authenticated
  using (organization_id = my_org_id() and i_am_active());
create policy "advertisers_insert" on advertisers for insert to authenticated
  with check (organization_id = my_org_id() and is_manager());
create policy "advertisers_update" on advertisers for update to authenticated
  using (organization_id = my_org_id() and is_manager())
  with check (organization_id = my_org_id() and is_manager());
create policy "advertisers_delete" on advertisers for delete to authenticated
  using (organization_id = my_org_id() and is_manager());

create policy "content_ads_select" on content_ads for select to authenticated
  using (organization_id = my_org_id() and i_am_active());
create policy "content_ads_insert" on content_ads for insert to authenticated
  with check (
    organization_id = my_org_id() and (is_manager() or i_am_producer())
    and exists (select 1 from contents c where c.id = content_id and c.organization_id = organization_id)
    and exists (select 1 from advertisers a where a.id = advertiser_id and a.organization_id = organization_id)
  );
create policy "content_ads_update" on content_ads for update to authenticated
  using (organization_id = my_org_id() and (is_manager() or i_am_producer()))
  with check (
    organization_id = my_org_id() and (is_manager() or i_am_producer())
    and exists (select 1 from contents c where c.id = content_id and c.organization_id = organization_id)
    and exists (select 1 from advertisers a where a.id = advertiser_id and a.organization_id = organization_id)
  );
create policy "content_ads_delete" on content_ads for delete to authenticated
  using (organization_id = my_org_id() and (is_manager() or i_am_producer()));

commit;
