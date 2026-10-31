-- already run live on 2026-10-29
-- Production rules: shoot columns, camera operator rules, production crew rules, files delivered rules.
begin;

-- 1) new columns
alter table public.contents
  add column if not exists shoot_started_at   timestamptz,
  add column if not exists shoot_finished_at  timestamptz,
  add column if not exists production_notes   text,
  add column if not exists files_delivered_at timestamptz,
  add column if not exists files_delivered_by text;

-- 2) patch existing functions (nothing changes if a pattern is not found)
do $do$
declare
  def text;
  newdef text;
begin
  -- guard: camera_operator moves to the new production rules
  select pg_get_functiondef('public.guard_contents_update'::regproc) into def;
  newdef := regexp_replace(def, '\s*or new\.camera_operator is distinct from old\.camera_operator', '');
  if newdef = def then raise exception 'guard_contents_update: camera_operator pattern not found, nothing changed'; end if;
  execute newdef;

  -- notify: a member rename must not create notifications
  select pg_get_functiondef('public.notify_content_update'::regproc) into def;
  newdef := regexp_replace(def,
    '(if new\.organization_id is null then\s*return new;\s*end if;)',
    E'\\1\n  if coalesce(current_setting(''nw.bypass_guard'', true), '''') = ''1'' then\n    return new;\n  end if;');
  if newdef = def then raise exception 'notify_content_update: pattern not found, nothing changed'; end if;
  execute newdef;
end $do$;

-- 3) production rules
create or replace function public.contents_production_rules()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me public.team_members;
  mgr boolean;
  crew_admin boolean;
  can_shoot boolean;
  start_shoot boolean;
  finish_shoot boolean;
  cam_auto boolean := false;
  crew_fields text[] := array['production_manager','producer','set_designer','camera_operator',
    'teleprompter_operator','light_designer','sound_recordist','data_wrangler','makeup_artist','voice_over_artist'];
  f text;
  o text;
  n text;
  allowed boolean;
  label text;
begin
  if auth.uid() is null or coalesce(current_setting('nw.bypass_guard', true), '') = '1' then
    return new;
  end if;
  select * into me from public.my_member_row();
  if me.id is null or coalesce(me.active, true) = false then
    return new;
  end if;

  mgr := me.role in ('owner', 'manager');
  crew_admin := mgr or coalesce(me.role_producer, false) or coalesce(me.role_production_manager, false);
  label := coalesce(nullif(new.slug_name, ''), nullif(new.title, ''), 'Content');
  start_shoot  := old.status = 'Ready for Shoot' and new.status = 'Shooting';
  finish_shoot := old.status = 'Shooting' and new.status = 'Assign Editor';
  can_shoot := crew_admin
               or coalesce(me.role_camera_operator, false)
               or (old.camera_operator is not null and old.camera_operator = me.full_name);

  -- Start / Finish Shoot
  if (start_shoot or finish_shoot) and not can_shoot then
    raise exception 'Only the Camera Operator, Producer, Production Manager or a Manager can start or finish a shoot';
  end if;
  if start_shoot then
    if coalesce(me.role_camera_operator, false)
       and coalesce(old.camera_operator, '') <> coalesce(me.full_name, '') then
      cam_auto := true;
      if coalesce(old.camera_operator, '') <> '' then
        insert into notifications (organization_id, member_id, content_id, message)
        select tm.organization_id, tm.id, new.id::text,
               label || ': ' || me.full_name || ' took over as Camera Operator from you'
        from team_members tm
        where tm.organization_id = new.organization_id and tm.active
          and tm.full_name = old.camera_operator and tm.id <> me.id;
      end if;
      new.camera_operator := me.full_name;
      new.audit_log := coalesce(new.audit_log, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'kind', 'change', 'field', 'Camera Operator',
        'from', coalesce(old.camera_operator, ''), 'to', me.full_name,
        'actor', me.full_name, 'role', me.role,
        'time', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'note', 'Auto-assigned on Start Shoot'));
    end if;
    new.shoot_started_at := now();
    new.shoot_finished_at := null;
  end if;
  if finish_shoot then
    new.shoot_finished_at := now();
  end if;

  -- shoot times edited by hand
  if not (start_shoot or finish_shoot)
     and (new.shoot_started_at is distinct from old.shoot_started_at
          or new.shoot_finished_at is distinct from old.shoot_finished_at)
     and not (crew_admin or coalesce(me.role_camera_operator, false)) then
    raise exception 'Only the Camera Operator, Producer, Production Manager or a Manager can change shoot times';
  end if;

  -- who may put whom into the Production Crew
  foreach f in array crew_fields loop
    continue when f = 'camera_operator' and cam_auto;
    o := coalesce(to_jsonb(old) ->> f, '');
    n := coalesce(to_jsonb(new) ->> f, '');
    if o <> n then
      allowed := crew_admin
        or (n = coalesce(me.full_name, '') and o = ''
            and coalesce((to_jsonb(me) ->> ('role_' || f))::boolean, false))
        or (o = coalesce(me.full_name, '') and n = '');
      if not allowed then
        raise exception 'You can only add or remove yourself in %. Ask the Producer or Production Manager to change others.',
          initcap(replace(f, '_', ' '));
      end if;
    end if;
  end loop;

  -- files delivered: tick once, only Managers undo
  if new.files_delivered_at is distinct from old.files_delivered_at
     or new.files_delivered_by is distinct from old.files_delivered_by then
    if old.files_delivered_at is null and new.files_delivered_at is not null then
      if not (crew_admin or coalesce(me.role_camera_operator, false) or coalesce(me.role_data_wrangler, false)) then
        raise exception 'Only the Camera Operator, Data Wrangler, Producer, Production Manager or a Manager can tick Files delivered';
      end if;
      new.files_delivered_at := now();
      new.files_delivered_by := me.full_name;
      insert into notifications (organization_id, member_id, content_id, message)
      select tm.organization_id, tm.id, new.id::text,
             label || ': files delivered (by ' || me.full_name || ')'
      from team_members tm
      where tm.organization_id = new.organization_id and tm.active
        and tm.full_name = new.video_editor and tm.id <> me.id;
    elsif old.files_delivered_at is not null and new.files_delivered_at is null then
      if not mgr then
        raise exception 'Only Managers and the Owner can undo Files delivered';
      end if;
      new.files_delivered_by := null;
    else
      raise exception 'Files delivered can be ticked only once';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists contents_guard_update_production on public.contents;
create trigger contents_guard_update_production
  before update on public.contents
  for each row execute function public.contents_production_rules();

commit;
