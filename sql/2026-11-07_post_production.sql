-- already run live on 2026-11-07
-- Post-production: Files received / Problem / Problem fixed, and the default fill of the editing crew.
begin;

-- 1) new columns
alter table public.contents
  add column if not exists files_received_at timestamptz,
  add column if not exists files_received_by text,
  add column if not exists files_problem_at   timestamptz,
  add column if not exists files_problem_by   text,
  add column if not exists files_problem_note text;

-- 2) post-production rules: Received / Problem / Problem fixed + default fill of the editing crew
create or replace function public.contents_post_production_rules()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me public.team_members;
  mgr boolean;
  crew_admin boolean;
  is_editor boolean;
  is_deliverer boolean;
  reset_done boolean := false;
  label text;
  nt text;
  ed text;
  old_ed text;
  slot text;
  slots text[] := array['motion_graphics_designer','graphic_designer','colorist','audio_mixer'];
  cur text;
  prev text;
  filled boolean := false;
  stamp text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  if coalesce(current_setting('nw.bypass_guard', true), '') = '1' then
    return new;
  end if;

  label := coalesce(nullif(new.slug_name, ''), nullif(new.title, ''), 'Content');

  -- a Manager undid "Files delivered": received and problem marks go with it
  if old.files_delivered_at is not null and new.files_delivered_at is null then
    new.files_received_at := null;
    new.files_received_by := null;
    new.files_problem_at := null;
    new.files_problem_by := null;
    new.files_problem_note := null;
    reset_done := true;
  end if;

  if auth.uid() is not null and not reset_done then
    select * into me from public.my_member_row();
    if me.id is not null and coalesce(me.active, true) then
      mgr := me.role in ('owner', 'manager');
      crew_admin := mgr or coalesce(me.role_producer, false) or coalesce(me.role_production_manager, false);
      is_editor := coalesce(new.video_editor, '') <> '' and new.video_editor = me.full_name;
      is_deliverer := coalesce(new.files_delivered_by, '') <> '' and new.files_delivered_by = me.full_name;

      -- RECEIVED
      if new.files_received_at is distinct from old.files_received_at
         or new.files_received_by is distinct from old.files_received_by then
        if old.files_received_at is null and new.files_received_at is not null then
          if new.files_delivered_at is null then
            raise exception 'Files have not been delivered yet';
          end if;
          if new.files_problem_at is not null then
            raise exception 'A problem is open. Production must mark it fixed first';
          end if;
          if not (mgr or is_editor) then
            raise exception 'Only the Video Editor or a Manager can mark Files received';
          end if;
          new.files_received_at := now();
          new.files_received_by := me.full_name;
          new.audit_log := coalesce(new.audit_log, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
            'kind', 'change', 'field', 'Files', 'from', 'Delivered', 'to', 'Received',
            'actor', me.full_name, 'role', me.role, 'time', stamp, 'note', 'Files received by editing'));
        elsif old.files_received_at is not null and new.files_received_at is null then
          if not mgr then
            raise exception 'Only Managers and the Owner can undo Files received';
          end if;
          new.files_received_by := null;
        else
          raise exception 'Files received can be marked only once';
        end if;
      end if;

      -- PROBLEM raised / fixed
      if new.files_problem_at is distinct from old.files_problem_at
         or new.files_problem_by is distinct from old.files_problem_by
         or new.files_problem_note is distinct from old.files_problem_note then
        if old.files_problem_at is null and new.files_problem_at is not null then
          if new.files_delivered_at is null then
            raise exception 'Files have not been delivered yet';
          end if;
          if not (mgr or is_editor) then
            raise exception 'Only the Video Editor or a Manager can report a problem with the files';
          end if;
          nt := nullif(btrim(coalesce(new.files_problem_note, '')), '');
          if nt is null then
            raise exception 'Please write what the problem is';
          end if;
          new.files_problem_at := now();
          new.files_problem_by := me.full_name;
          new.files_problem_note := nt;
          new.files_received_at := null;
          new.files_received_by := null;
          new.audit_log := coalesce(new.audit_log, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
            'kind', 'change', 'field', 'Files', 'from', 'Delivered', 'to', 'Problem',
            'actor', me.full_name, 'role', me.role, 'time', stamp, 'note', nt));
          insert into notifications (organization_id, member_id, content_id, message)
          select tm.organization_id, tm.id, new.id::text,
                 label || ': problem with the delivered files (reported by ' || me.full_name || '): ' || left(nt, 200)
          from team_members tm
          where tm.organization_id = new.organization_id and tm.active
            and tm.id <> me.id
            and tm.full_name = any(array_remove(array[new.files_delivered_by, new.producer, new.production_manager], null));
        elsif old.files_problem_at is not null and new.files_problem_at is null then
          if not (crew_admin or is_deliverer
                  or coalesce(me.role_camera_operator, false) or coalesce(me.role_data_wrangler, false)) then
            raise exception 'Only Production (or a Manager) can mark the problem as fixed';
          end if;
          new.files_problem_by := null;
          new.files_problem_note := null;
          new.audit_log := coalesce(new.audit_log, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
            'kind', 'change', 'field', 'Files', 'from', 'Problem', 'to', 'Fixed',
            'actor', me.full_name, 'role', me.role, 'time', stamp, 'note', 'Problem marked fixed by Production'));
          insert into notifications (organization_id, member_id, content_id, message)
          select tm.organization_id, tm.id, new.id::text,
                 label || ': files problem marked fixed by ' || me.full_name
          from team_members tm
          where tm.organization_id = new.organization_id and tm.active
            and tm.id <> me.id
            and tm.full_name = new.video_editor;
        else
          raise exception 'A problem can only be reported or marked fixed';
        end if;
      end if;
    end if;
  end if;

  -- DEFAULT FILL of the editing crew (not for LIVE)
  ed := coalesce(new.video_editor, '');
  old_ed := coalesce(old.video_editor, '');
  if ed <> '' and ed <> old_ed and new.content_type is distinct from 'LIVE' then
    foreach slot in array slots loop
      cur := coalesce(to_jsonb(new) ->> slot, '');
      prev := coalesce(to_jsonb(old) ->> slot, '');
      if cur = prev and (cur = '' or (old_ed <> '' and cur = old_ed)) then
        new := jsonb_populate_record(new, jsonb_build_object(slot, ed));
        filled := true;
      end if;
    end loop;
    if filled then
      perform set_config('nw.post_fill', '1', true);
      if me.id is not null then
        new.audit_log := coalesce(new.audit_log, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
          'kind', 'change', 'field', 'Editing crew', 'from', old_ed, 'to', ed,
          'actor', me.full_name, 'role', me.role, 'time', stamp,
          'note', 'Empty editing slots filled with the Video Editor'));
      end if;
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists contents_post_production on public.contents;
create trigger contents_post_production
  before update on public.contents
  for each row execute function public.contents_post_production_rules();

-- 3) notification rule: no separate "assigned as ..." message for the slots filled by default
do $do$
declare
  def text;
  newdef text;
  pat text := 'and tm.full_name is distinct from actor_name;';
  cnt int;
begin
  select pg_get_functiondef('public.notify_content_update'::regproc) into def;
  cnt := (length(def) - length(replace(def, pat, ''))) / length(pat);
  if cnt <> 1 then
    raise exception 'notify_content_update: expected 1 match, found %, nothing changed', cnt;
  end if;
  newdef := replace(def, pat,
    E'and tm.full_name is distinct from actor_name\n'
    || E'    and not (coalesce(current_setting(''nw.post_fill'', true), '''') = ''1''\n'
    || E'             and a.role_label in (''Motion Graphics Designer'', ''Graphic Designer'', ''Colorist'', ''Audio Mixer'')\n'
    || E'             and a.cur = new.video_editor);');
  execute newdef;
end $do$;

commit;
