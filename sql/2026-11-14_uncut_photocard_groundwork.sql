-- already run live on 2026-11-14 (Supabase SQL Editor). This file is the record.
-- Why: database groundwork for the new content types UNCUT and PHOTO CARD and the new role Multimedia Journalist. The app side comes later (N149).
-- What it did: new columns role_multimedia_journalist (team_members), multimedia_journalist and shoot_location (contents); content type check now allows UNCUT and PHOTO CARD;
--   bookings role_field check allows multimedia_journalist; the functions guard_team_members, cascade_member_rename, notify_content_insert, notify_content_update, create_booking
--   know the new credit column; contents_production_rules gives the Multimedia Journalist the production-admin powers on an UNCUT only (edit shoot times by hand,
--   add/remove production crew names, tick Files delivered); guard_contents_update has the Uncut workflow (Draft -> Assign Editor by the reporter or a Manager; Assign Editor -> Editing,
--   also when the reporter puts himself as Video Editor). Every patch checks that its pattern is found exactly once, otherwise the whole block rolls back.
-- Check result after running: 6 rows (3 new columns + 3 patched functions that contain role_multimedia_journalist).
begin;

alter table public.team_members
  add column if not exists role_multimedia_journalist boolean not null default false;
alter table public.contents
  add column if not exists multimedia_journalist text,
  add column if not exists shoot_location text;

alter table public.contents drop constraint contents_content_type_valid;
alter table public.contents add constraint contents_content_type_valid
  check (content_type = any (array['EXPLAINER','LIVE','RECORDED LIVE','SOT','PACKAGE','SHOW','UNCUT','PHOTO CARD']));

alter table public.bookings drop constraint bookings_role_field_check;
alter table public.bookings add constraint bookings_role_field_check
  check (role_field = any (array['concept_creator','writer','production_manager','producer','presenter_name',
    'set_designer','camera_operator','teleprompter_operator','light_designer','sound_recordist','data_wrangler',
    'makeup_artist','voice_over_artist','video_editor','motion_graphics_designer','graphic_designer','colorist',
    'audio_mixer','publisher','live_video_switcher','live_audio_mixer','multimedia_journalist']));

create or replace function pg_temp.rep(src text, pat text, repl text) returns text
language plpgsql as $f$
declare n int;
begin
  n := (length(src) - length(replace(src, pat, ''))) / length(pat);
  if n <> 1 then raise exception 'Pattern found % times (need exactly 1): %', n, pat; end if;
  return replace(src, pat, repl);
end $f$;

do $do$
declare def text;
begin
  select pg_get_functiondef('public.guard_team_members'::regproc) into def;
  def := pg_temp.rep(def, 'new.role_data_wrangler)', 'new.role_data_wrangler, new.role_multimedia_journalist)');
  def := pg_temp.rep(def, 'old.role_data_wrangler)', 'old.role_data_wrangler, old.role_multimedia_journalist)');
  execute def;

  select pg_get_functiondef('public.cascade_member_rename'::regproc) into def;
  def := pg_temp.rep(def,
    'data_wrangler = case when data_wrangler = old.full_name then new.full_name else data_wrangler end',
    'data_wrangler = case when data_wrangler = old.full_name then new.full_name else data_wrangler end,' || chr(10)
    || '      multimedia_journalist = case when multimedia_journalist = old.full_name then new.full_name else multimedia_journalist end');
  def := pg_temp.rep(def, 'makeup_artist, data_wrangler);', 'makeup_artist, data_wrangler, multimedia_journalist);');
  execute def;

  select pg_get_functiondef('public.notify_content_insert'::regproc) into def;
  def := pg_temp.rep(def, '(''Data Wrangler'', new.data_wrangler)',
    '(''Data Wrangler'', new.data_wrangler),' || chr(10) || '         (''Multimedia Journalist'', new.multimedia_journalist)');
  execute def;

  select pg_get_functiondef('public.notify_content_update'::regproc) into def;
  def := pg_temp.rep(def, 'new.makeup_artist, new.data_wrangler', 'new.makeup_artist, new.data_wrangler, new.multimedia_journalist');
  def := pg_temp.rep(def, '(''Data Wrangler'', new.data_wrangler, old.data_wrangler)',
    '(''Data Wrangler'', new.data_wrangler, old.data_wrangler),' || chr(10)
    || '         (''Multimedia Journalist'', new.multimedia_journalist, old.multimedia_journalist)');
  execute def;

  select pg_get_functiondef('public.create_booking'::regproc) into def;
  def := pg_temp.rep(def, '''live_video_switcher'',''live_audio_mixer'']', '''live_video_switcher'',''live_audio_mixer'',''multimedia_journalist'']');
  execute def;

  select pg_get_functiondef('public.contents_production_rules'::regproc) into def;
  def := pg_temp.rep(def,
    'crew_admin := mgr or coalesce(me.role_producer, false) or coalesce(me.role_production_manager, false);',
    'crew_admin := mgr or coalesce(me.role_producer, false) or coalesce(me.role_production_manager, false)' || chr(10)
    || '                or (new.content_type = ''UNCUT'' and coalesce(me.role_multimedia_journalist, false));');
  execute def;

  select pg_get_functiondef('public.guard_contents_update'::regproc) into def;
  def := pg_temp.rep(def, 'and not public.perm_of(me, ''can_assign_video_editor'') then',
    'and not public.perm_of(me, ''can_assign_video_editor'')' || chr(10)
    || '     and not (new.content_type = ''UNCUT'' and coalesce(me.role_multimedia_journalist, false) and new.video_editor = me.full_name) then');
  def := pg_temp.rep(def, 'when old.status = ''Draft'' and new.status = ''Script Submitted''',
    'when old.status = ''Draft'' and new.status = ''Assign Editor'' and old.content_type = ''UNCUT''' || chr(10)
    || '        then mgr or coalesce(me.role_multimedia_journalist, false)' || chr(10)
    || '      when old.status = ''Draft'' and new.status = ''Script Submitted''');
  def := pg_temp.rep(def, 'then public.perm_of(me, ''can_assign_video_editor'') and btrim(coalesce(new.video_editor, '''')) <> ''''',
    'then (public.perm_of(me, ''can_assign_video_editor'') or (old.content_type = ''UNCUT'' and coalesce(me.role_multimedia_journalist, false) and new.video_editor = me.full_name)) and btrim(coalesce(new.video_editor, '''')) <> ''''');
  execute def;
end $do$;

commit;

select 'column' as kind, column_name as name
from information_schema.columns
where table_schema = 'public'
  and column_name in ('role_multimedia_journalist', 'multimedia_journalist', 'shoot_location')
union all
select 'patched function', proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and prosrc like '%role_multimedia_journalist%';
