-- already run live on 2026-10-29
-- 2026-10-29  New roles: Production Manager, Set Designer, Makeup Artist, Data Wrangler
begin;

alter table public.team_members
  add column if not exists role_production_manager boolean not null default false,
  add column if not exists role_set_designer       boolean not null default false,
  add column if not exists role_makeup_artist      boolean not null default false,
  add column if not exists role_data_wrangler      boolean not null default false;

alter table public.contents
  add column if not exists production_manager text,
  add column if not exists set_designer       text,
  add column if not exists makeup_artist      text,
  add column if not exists data_wrangler      text;

do $do$
declare
  def text;
  newdef text;
  extra text;
begin
  -- 1) guard_team_members: members cannot change their own new ticks
  select pg_get_functiondef('public.guard_team_members'::regproc) into def;
  newdef := replace(def, 'new.role_publisher',
    'new.role_publisher, new.role_production_manager, new.role_set_designer, new.role_makeup_artist, new.role_data_wrangler');
  newdef := replace(newdef, 'old.role_publisher',
    'old.role_publisher, old.role_production_manager, old.role_set_designer, old.role_makeup_artist, old.role_data_wrangler');
  if newdef = def then raise exception 'guard_team_members: pattern not found, nothing changed'; end if;
  execute newdef;

  -- 2) cascade_member_rename: new columns follow a name change
  select pg_get_functiondef('public.cascade_member_rename'::regproc) into def;
  extra := E',\n      production_manager = case when production_manager = old.full_name then new.full_name else production_manager end'
        || E',\n      set_designer = case when set_designer = old.full_name then new.full_name else set_designer end'
        || E',\n      makeup_artist = case when makeup_artist = old.full_name then new.full_name else makeup_artist end'
        || E',\n      data_wrangler = case when data_wrangler = old.full_name then new.full_name else data_wrangler end';
  newdef := regexp_replace(def,
    '(live_audio_mixer\s*=\s*case when live_audio_mixer\s*=\s*old\.full_name then new\.full_name else live_audio_mixer\s*end)',
    '\1' || extra);
  if newdef = def then raise exception 'cascade_member_rename: SET pattern not found, nothing changed'; end if;
  def := newdef;
  newdef := regexp_replace(def, 'live_audio_mixer\);',
    'live_audio_mixer, production_manager, set_designer, makeup_artist, data_wrangler);');
  if newdef = def then raise exception 'cascade_member_rename: WHERE pattern not found, nothing changed'; end if;
  execute newdef;

  -- 3) notify_content_update: credited list + "You were assigned as ..."
  select pg_get_functiondef('public.notify_content_update'::regproc) into def;
  newdef := replace(def, 'new.audio_mixer, new.live_video_switcher, new.live_audio_mixer',
    'new.audio_mixer, new.live_video_switcher, new.live_audio_mixer, new.production_manager, new.set_designer, new.makeup_artist, new.data_wrangler');
  if newdef = def then raise exception 'notify_content_update: credited pattern not found'; end if;
  def := newdef;
  newdef := replace(def, '(''Live Audio Mixer'', new.live_audio_mixer, old.live_audio_mixer)',
    '(''Live Audio Mixer'', new.live_audio_mixer, old.live_audio_mixer),'
    || E'\n         (''Production Manager'', new.production_manager, old.production_manager),'
    || E'\n         (''Set Designer'', new.set_designer, old.set_designer),'
    || E'\n         (''Makeup Artist'', new.makeup_artist, old.makeup_artist),'
    || E'\n         (''Data Wrangler'', new.data_wrangler, old.data_wrangler)');
  if newdef = def then raise exception 'notify_content_update: values pattern not found'; end if;
  execute newdef;

  -- 4) notify_content_insert: "You were assigned as ..."
  select pg_get_functiondef('public.notify_content_insert'::regproc) into def;
  newdef := replace(def, '(''Live Audio Mixer'', new.live_audio_mixer)',
    '(''Live Audio Mixer'', new.live_audio_mixer),'
    || E'\n         (''Production Manager'', new.production_manager),'
    || E'\n         (''Set Designer'', new.set_designer),'
    || E'\n         (''Makeup Artist'', new.makeup_artist),'
    || E'\n         (''Data Wrangler'', new.data_wrangler)');
  if newdef = def then raise exception 'notify_content_insert: pattern not found'; end if;
  execute newdef;
end $do$;

commit;