-- already run live on 2026-10-29
-- 2026-10-29  Notifications only for people connected to the content
begin;

create or replace function public.notify_content_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  actor_name text;
  actor_display text;
  label text;
  n int;
  credited text[];
begin
  if new.organization_id is null then
    return new;
  end if;
  label := coalesce(nullif(new.slug_name, ''), nullif(new.title, ''), 'Content');
  begin
    n := jsonb_array_length(new.audit_log);
    if n > 0 then
      actor_name := new.audit_log -> (n - 1) ->> 'actor';
    end if;
  exception when others then
    actor_name := null;
  end;

  if actor_name is not null then
    select nullif(tm.nickname, '') into actor_display
    from team_members tm
    where tm.organization_id = new.organization_id
      and tm.full_name = actor_name
    limit 1;
  end if;
  actor_display := coalesce(actor_display, actor_name);

  credited := array_remove(array[
    new.writer, new.presenter_name, new.video_editor, new.camera_operator,
    new.concept_creator, new.producer, new.publisher,
    new.motion_graphics_designer, new.graphic_designer, new.voice_over_artist,
    new.colorist, new.light_designer, new.sound_recordist, new.teleprompter_operator,
    new.audio_mixer, new.live_video_switcher, new.live_audio_mixer
  ], null);

  if new.status is distinct from old.status then
    insert into notifications (organization_id, member_id, content_id, message)
    select tm.organization_id, tm.id, new.id::text,
           coalesce(actor_display, 'Someone') || ' moved ' || label
             || ' from ' || coalesce(old.status, 'New') || ' to ' || new.status
    from team_members tm
    where tm.organization_id = new.organization_id
      and tm.active
      and tm.full_name is distinct from actor_name
      and (
        tm.full_name = any(credited)
        or (tm.role in ('owner', 'manager')
            and new.status in ('Script Submitted', 'Video Review', 'Ready to Publish'))
        or (tm.can_approve_scripts and new.status = 'Script Submitted')
        or (tm.can_review_videos and new.status = 'Video Review')
      );
  end if;

  insert into notifications (organization_id, member_id, content_id, message)
  select tm.organization_id, tm.id, new.id::text,
         'You were assigned as ' || a.role_label || ' on ' || label
  from (values
         ('Research & Script Writer', new.writer, old.writer),
         ('Presenter', new.presenter_name, old.presenter_name),
         ('Video Editor', new.video_editor, old.video_editor),
         ('Camera Operator', new.camera_operator, old.camera_operator),
         ('Concept Creator', new.concept_creator, old.concept_creator),
         ('Producer', new.producer, old.producer),
         ('Publisher', new.publisher, old.publisher),
         ('Motion Graphics Designer', new.motion_graphics_designer, old.motion_graphics_designer),
         ('Graphic Designer', new.graphic_designer, old.graphic_designer),
         ('Voice Over Artist', new.voice_over_artist, old.voice_over_artist),
         ('Colorist', new.colorist, old.colorist),
         ('Light Designer', new.light_designer, old.light_designer),
         ('Sound Recordist', new.sound_recordist, old.sound_recordist),
         ('Teleprompter Operator', new.teleprompter_operator, old.teleprompter_operator),
         ('Audio Mixer', new.audio_mixer, old.audio_mixer),
         ('Live Video Switcher', new.live_video_switcher, old.live_video_switcher),
         ('Live Audio Mixer', new.live_audio_mixer, old.live_audio_mixer)
       ) as a(role_label, cur, prev)
  join team_members tm
    on tm.organization_id = new.organization_id
   and tm.active
   and tm.full_name = a.cur
  where a.cur is not null
    and a.cur is distinct from a.prev
    and tm.full_name is distinct from actor_name;

  return new;
end;
$function$;

create or replace function public.notify_content_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  actor_name text;
  label text;
  n int;
begin
  if new.organization_id is null then
    return new;
  end if;
  label := coalesce(nullif(new.slug_name, ''), nullif(new.title, ''), 'Content');
  begin
    n := jsonb_array_length(new.audit_log);
    if n > 0 then
      actor_name := new.audit_log -> (n - 1) ->> 'actor';
    end if;
  exception when others then
    actor_name := null;
  end;

  insert into notifications (organization_id, member_id, content_id, message)
  select tm.organization_id, tm.id, new.id::text,
         'You were assigned as ' || a.role_label || ' on ' || label
  from (values
         ('Research & Script Writer', new.writer),
         ('Presenter', new.presenter_name),
         ('Video Editor', new.video_editor),
         ('Camera Operator', new.camera_operator),
         ('Concept Creator', new.concept_creator),
         ('Producer', new.producer),
         ('Publisher', new.publisher),
         ('Motion Graphics Designer', new.motion_graphics_designer),
         ('Graphic Designer', new.graphic_designer),
         ('Voice Over Artist', new.voice_over_artist),
         ('Colorist', new.colorist),
         ('Light Designer', new.light_designer),
         ('Sound Recordist', new.sound_recordist),
         ('Teleprompter Operator', new.teleprompter_operator),
         ('Audio Mixer', new.audio_mixer),
         ('Live Video Switcher', new.live_video_switcher),
         ('Live Audio Mixer', new.live_audio_mixer)
       ) as a(role_label, person)
  join team_members tm
    on tm.organization_id = new.organization_id
   and tm.active
   and tm.full_name = a.person
  where a.person is not null
    and tm.full_name is distinct from actor_name;

  return new;
end;
$function$;

commit;
