-- ============================================================
-- 2026-10-25  Teleprompter Operator: new credit for each content + new Role tick
-- STATUS: run in the Supabase SQL Editor BEFORE the app code is pushed. This file is the record.
-- 1) team_members.role_teleprompter_operator (Role tick, default false; decides who appears in the list)
-- 2) contents.teleprompter_operator (text, optional; holds a member's full name)
-- 3) guard_team_members: members cannot change their own new tick (same rule as the other ticks)
-- 4) cascade_member_rename: when a member's name changes, the new column follows
-- ============================================================

begin;

alter table public.team_members add column if not exists role_teleprompter_operator boolean not null default false;
alter table public.contents     add column if not exists teleprompter_operator      text;

-- 3. guard_team_members (self-edit check now includes the new tick)
create or replace function public.guard_team_members()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me public.team_members;
  is_self boolean;
begin
  if auth.uid() is null then
    return new;  -- SQL Editor / server tools
  end if;
  select * into me from public.my_member_row();
  if new.organization_id is distinct from old.organization_id then
    raise exception 'A member cannot be moved to another organization';
  end if;
  if me.id is null or me.organization_id is distinct from old.organization_id then
    raise exception 'Not allowed';
  end if;
  is_self := (old.auth_user_id = auth.uid())
    or (old.auth_user_id is null and old.email is not null
        and lower(old.email) = lower(coalesce(auth.jwt() ->> 'email', '')));

  if me.role = 'owner' and coalesce(me.active, true) then
    return new;
  end if;

  if me.role = 'manager' and coalesce(me.active, true) and old.role = 'general' then
    if new.role is distinct from old.role then
      raise exception 'Only the Owner can change roles';
    end if;
    return new;
  end if;

  if is_self then
    if (new.role, new.active, new.email, new.user_id, new.employee_id,
        new.can_write_edit_scripts, new.can_approve_scripts, new.can_edit_content_details,
        new.can_change_channel, new.can_reschedule_content, new.can_assign_video_editor,
        new.can_assign_presenter, new.can_review_videos,
        new.role_research_script_writer, new.role_concept_creator, new.role_producer,
        new.role_presenter, new.role_camera_operator, new.role_light_designer,
        new.role_sound_recordist, new.role_teleprompter_operator, new.role_voice_over_artist, new.role_video_editor,
        new.role_motion_graphics_designer, new.role_graphic_designer, new.role_colorist,
        new.role_audio_mixer, new.role_live_video_switcher, new.role_live_audio_mixer,
        new.role_publisher)
       is distinct from
       (old.role, old.active, old.email, old.user_id, old.employee_id,
        old.can_write_edit_scripts, old.can_approve_scripts, old.can_edit_content_details,
        old.can_change_channel, old.can_reschedule_content, old.can_assign_video_editor,
        old.can_assign_presenter, old.can_review_videos,
        old.role_research_script_writer, old.role_concept_creator, old.role_producer,
        old.role_presenter, old.role_camera_operator, old.role_light_designer,
        old.role_sound_recordist, old.role_teleprompter_operator, old.role_voice_over_artist, old.role_video_editor,
        old.role_motion_graphics_designer, old.role_graphic_designer, old.role_colorist,
        old.role_audio_mixer, old.role_live_video_switcher, old.role_live_audio_mixer,
        old.role_publisher) then
      raise exception 'You can only change your own name, nickname, designation, photo and phone numbers';
    end if;
    if new.auth_user_id is distinct from old.auth_user_id
       and not (old.auth_user_id is null and new.auth_user_id = auth.uid()) then
      raise exception 'Login link cannot be changed';
    end if;
    return new;
  end if;

  raise exception 'Not allowed';
end;
$function$;

-- 4. cascade_member_rename (new column follows a name change)
create or replace function public.cascade_member_rename()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.full_name is distinct from old.full_name and old.full_name is not null then
    perform set_config('nw.bypass_guard', '1', true);
    update public.contents set
      writer                   = case when writer                   = old.full_name then new.full_name else writer                   end,
      presenter_name           = case when presenter_name           = old.full_name then new.full_name else presenter_name           end,
      video_editor             = case when video_editor             = old.full_name then new.full_name else video_editor             end,
      camera_operator          = case when camera_operator          = old.full_name then new.full_name else camera_operator          end,
      published_by             = case when published_by             = old.full_name then new.full_name else published_by             end,
      concept_creator          = case when concept_creator          = old.full_name then new.full_name else concept_creator          end,
      producer                 = case when producer                 = old.full_name then new.full_name else producer                 end,
      publisher                = case when publisher                = old.full_name then new.full_name else publisher                end,
      motion_graphics_designer = case when motion_graphics_designer = old.full_name then new.full_name else motion_graphics_designer end,
      graphic_designer         = case when graphic_designer         = old.full_name then new.full_name else graphic_designer         end,
      voice_over_artist        = case when voice_over_artist        = old.full_name then new.full_name else voice_over_artist        end,
      colorist                 = case when colorist                 = old.full_name then new.full_name else colorist                 end,
      light_designer           = case when light_designer           = old.full_name then new.full_name else light_designer           end,
      sound_recordist          = case when sound_recordist          = old.full_name then new.full_name else sound_recordist          end,
      teleprompter_operator    = case when teleprompter_operator    = old.full_name then new.full_name else teleprompter_operator    end,
      audio_mixer              = case when audio_mixer              = old.full_name then new.full_name else audio_mixer              end,
      live_video_switcher      = case when live_video_switcher      = old.full_name then new.full_name else live_video_switcher      end,
      live_audio_mixer         = case when live_audio_mixer         = old.full_name then new.full_name else live_audio_mixer         end
    where organization_id = new.organization_id
      and old.full_name in (writer, presenter_name, video_editor, camera_operator, published_by,
                            concept_creator, producer, publisher, motion_graphics_designer,
                            graphic_designer, voice_over_artist, colorist, light_designer,
                            sound_recordist, teleprompter_operator, audio_mixer, live_video_switcher, live_audio_mixer);
    perform set_config('nw.bypass_guard', '', true);
  end if;
  return null;
end;
$function$;

commit;

-- Check (run after): both lines must say true
select
  exists (select 1 from information_schema.columns where table_name='team_members' and column_name='role_teleprompter_operator') as role_tick_exists,
  exists (select 1 from information_schema.columns where table_name='contents' and column_name='teleprompter_operator') as content_column_exists;

-- ROLLBACK (only if needed): drop the two columns and re-run sections 5 and 7 of sql/2026-10-22_roles_access_rename.sql.
