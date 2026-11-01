-- already run live on 2026-11-01
-- External people (no login) in team_members
begin;

do $$
begin
  if exists (
    select 1 from team_members
    group by organization_id, lower(btrim(full_name))
    having count(*) > 1
  ) then
    raise exception 'Two team members already share the same full name. Give them different names first, then run this again.';
  end if;
end $$;

alter table team_members add column if not exists member_type text not null default 'staff';
alter table team_members add column if not exists external_note text;
alter table team_members drop constraint if exists team_members_member_type_check;
alter table team_members add constraint team_members_member_type_check check (member_type in ('staff','external'));
alter table team_members alter column email drop not null;

alter table team_members drop constraint if exists team_members_external_rules;
alter table team_members add constraint team_members_external_rules check (
  member_type <> 'external' or (
    auth_user_id is null and email is null and role = 'general'
    and nickname is not null
    and phone ~ '^\+[1-9][0-9]{7,14}$'
    and not (can_write_edit_scripts or can_approve_scripts or can_edit_content_details or can_change_channel
             or can_reschedule_content or can_assign_video_editor or can_assign_presenter or can_review_videos)
  )
);

create unique index if not exists team_members_name_unique on team_members (organization_id, lower(btrim(full_name)));

create or replace function public.can_manage_externals()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from team_members
    where auth_user_id = auth.uid() and active
      and (role in ('owner','manager') or role_producer or role_production_manager)
  );
$$;
revoke all on function public.can_manage_externals() from public;
grant execute on function public.can_manage_externals() to authenticated;

drop policy if exists "team_members_insert_external" on team_members;
create policy "team_members_insert_external" on team_members for insert to authenticated
  with check (
    organization_id = my_org_id()
    and member_type = 'external'
    and role = 'general'
    and can_manage_externals()
  );

-- Teach the update guard about external people: the single line
--   if me.role = 'owner' and coalesce(me.active, true) then
-- in guard_team_members() gets this block placed right before it (done live with a pg_get_functiondef + replace patch):
--
--   -- external people (no login): Owner, Managers, Producers and Production Managers may edit them
--   if old.member_type = 'external' then
--     if not public.can_manage_externals() then
--       raise exception 'Only the Owner, Managers, Producers and Production Managers can change external people';
--     end if;
--     if new.member_type is distinct from 'external' or new.role is distinct from 'general'
--        or new.auth_user_id is not null or new.email is not null
--        or new.user_id is distinct from old.user_id then
--       raise exception 'External people cannot be given a login or access permissions';
--     end if;
--     return new;
--   end if;
--   if new.member_type is distinct from old.member_type then
--     raise exception 'A member type cannot be changed';
--   end if;

commit;
