-- already run live on 2026-11-14 (Supabase SQL Editor). This file is the record.
-- Why: a new Access tick "Manage Sponsors" (can_manage_sponsors). Only the Owner, Managers and people with the tick may add, edit and delete sponsor ads (content_ads).
--   Producers no longer have this right just because they are Producers.
-- What it did: new column team_members.can_manage_sponsors; back-fill: every active non-external member with role_producer got the tick (5 people) so nothing changed for them;
--   new function i_can_manage_sponsors(); the three write policies of content_ads now use it; guard_team_members stops members from ticking it on themselves;
--   the constraint team_members_external_rules also forbids the tick for external people.
-- Check result after running: 7 rows (1 column, the count of ticked people = 5, 3 policies, 1 constraint, 1 patched function).
begin;

alter table public.team_members
  add column if not exists can_manage_sponsors boolean not null default false;

update public.team_members
   set can_manage_sponsors = true
 where role_producer is true
   and active is not false
   and member_type is distinct from 'external'
   and can_manage_sponsors = false;

create or replace function public.i_can_manage_sponsors()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from team_members
    where auth_user_id = auth.uid() and active
      and (role in ('owner', 'manager') or can_manage_sponsors)
  );
$$;
revoke all on function public.i_can_manage_sponsors() from public;
grant execute on function public.i_can_manage_sponsors() to authenticated;

drop policy if exists "content_ads_insert" on content_ads;
drop policy if exists "content_ads_update" on content_ads;
drop policy if exists "content_ads_delete" on content_ads;

create policy "content_ads_insert" on content_ads for insert to authenticated
  with check (
    organization_id = my_org_id() and i_can_manage_sponsors()
    and exists (select 1 from contents c where c.id = content_id and c.organization_id = organization_id)
    and exists (select 1 from advertisers a where a.id = advertiser_id and a.organization_id = organization_id)
  );
create policy "content_ads_update" on content_ads for update to authenticated
  using (organization_id = my_org_id() and i_can_manage_sponsors())
  with check (
    organization_id = my_org_id() and i_can_manage_sponsors()
    and exists (select 1 from contents c where c.id = content_id and c.organization_id = organization_id)
    and exists (select 1 from advertisers a where a.id = advertiser_id and a.organization_id = organization_id)
  );
create policy "content_ads_delete" on content_ads for delete to authenticated
  using (organization_id = my_org_id() and i_can_manage_sponsors());

create or replace function pg_temp.rep(src text, pat text, repl text) returns text
language plpgsql as $f$
declare n int;
begin
  n := (length(src) - length(replace(src, pat, ''))) / length(pat);
  if n <> 1 then raise exception 'Pattern found % times (need exactly 1): %', n, pat; end if;
  return replace(src, pat, repl);
end $f$;

do $do$
declare def text; d text;
begin
  select pg_get_functiondef('public.guard_team_members'::regproc) into def;
  def := pg_temp.rep(def, 'new.can_review_videos,', 'new.can_review_videos, new.can_manage_sponsors,');
  def := pg_temp.rep(def, 'old.can_review_videos,', 'old.can_review_videos, old.can_manage_sponsors,');
  execute def;

  select pg_get_constraintdef(oid) into d from pg_constraint
   where conname = 'team_members_external_rules' and conrelid = 'public.team_members'::regclass;
  d := pg_temp.rep(d, 'OR can_review_videos)', 'OR can_review_videos OR can_manage_sponsors)');
  execute 'alter table public.team_members drop constraint team_members_external_rules';
  execute 'alter table public.team_members add constraint team_members_external_rules ' || d;
end $do$;

commit;

select 'column' as kind, column_name as name from information_schema.columns
 where table_schema = 'public' and table_name = 'team_members' and column_name = 'can_manage_sponsors'
union all
select 'people with the tick', count(*)::text from public.team_members where can_manage_sponsors
union all
select 'policy', policyname from pg_policies
 where tablename = 'content_ads' and (coalesce(qual, '') like '%i_can_manage_sponsors%' or coalesce(with_check, '') like '%i_can_manage_sponsors%')
union all
select 'constraint', conname from pg_constraint
 where conname = 'team_members_external_rules' and pg_get_constraintdef(oid) like '%can_manage_sponsors%'
union all
select 'function patched', proname from pg_proc
 where pronamespace = 'public'::regnamespace and proname = 'guard_team_members' and prosrc like '%can_manage_sponsors%';
