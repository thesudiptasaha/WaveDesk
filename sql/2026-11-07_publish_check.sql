-- already run live on 2026-11-07
-- "Did it go out?": a Publisher can ask for a Manager decision; the assigned Publisher may reschedule his own content.
begin;

-- 1) new columns: "a Manager must decide" request
alter table public.contents
  add column if not exists publish_help_at   timestamptz,
  add column if not exists publish_help_by   text,
  add column if not exists publish_help_note text;

-- 2) rules for the request
create or replace function public.contents_publish_check_rules()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me public.team_members;
  mgr boolean;
  label text;
  nt text;
  stamp text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  if coalesce(current_setting('nw.bypass_guard', true), '') = '1' then
    return new;
  end if;

  -- the request clears itself when a Manager decides (status or publish time changes)
  if old.publish_help_at is not null
     and (new.status is distinct from old.status
          or new.scheduled_publish_time is distinct from old.scheduled_publish_time) then
    new.publish_help_at := null;
    new.publish_help_by := null;
    new.publish_help_note := null;
    return new;
  end if;

  if new.publish_help_at is distinct from old.publish_help_at
     or new.publish_help_by is distinct from old.publish_help_by
     or new.publish_help_note is distinct from old.publish_help_note then
    if auth.uid() is null then
      return new;
    end if;
    select * into me from public.my_member_row();
    if me.id is null or coalesce(me.active, true) = false then
      raise exception 'Not allowed';
    end if;
    mgr := me.role in ('owner', 'manager');

    if old.publish_help_at is null and new.publish_help_at is not null then
      if new.status is distinct from old.status then
        raise exception 'A Manager decision cannot be requested together with a status change';
      end if;
      if new.status not in ('Scheduled', 'Ready to Publish')
         or new.scheduled_publish_time is null
         or now() < new.scheduled_publish_time + interval '10 minutes' then
        raise exception 'A Manager decision can be requested only 10 minutes after the publish time has passed';
      end if;
      if not (mgr or (coalesce(old.publisher, '') <> '' and old.publisher = me.full_name)) then
        raise exception 'Only the assigned Publisher or a Manager can ask for a Manager decision';
      end if;
      nt := nullif(btrim(coalesce(new.publish_help_note, '')), '');
      if nt is null then
        raise exception 'Please write why it did not go out';
      end if;
      label := coalesce(nullif(new.slug_name, ''), nullif(new.title, ''), 'Content');
      new.publish_help_at := now();
      new.publish_help_by := me.full_name;
      new.publish_help_note := nt;
      new.audit_log := coalesce(new.audit_log, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'kind', 'change', 'field', 'Publish check', 'from', 'Did it go out?', 'to', 'Manager decision requested',
        'actor', me.full_name, 'role', me.role, 'time', stamp, 'note', nt));
      insert into notifications (organization_id, member_id, content_id, message)
      select tm.organization_id, tm.id, new.id::text,
             label || ': did not go out. ' || me.full_name || ' asks for a Manager decision: ' || left(nt, 200)
      from team_members tm
      where tm.organization_id = new.organization_id and tm.active
        and tm.role in ('owner', 'manager')
        and tm.id <> me.id;
    else
      raise exception 'A Manager decision can only be requested; it clears when a Manager decides';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists contents_publish_check on public.contents;
create trigger contents_publish_check
  before update on public.contents
  for each row execute function public.contents_publish_check_rules();

-- 3) reschedule right: the assigned Publisher may change the publish time of his own content
do $do$
declare
  def text;
  newdef text;
  pat text := 'and not public.perm_of(me, ''can_reschedule_content'') then';
  cnt int;
begin
  select pg_get_functiondef('public.guard_contents_update'::regproc) into def;
  cnt := (length(def) - length(replace(def, pat, ''))) / length(pat);
  if cnt <> 1 then
    raise exception 'guard_contents_update: expected 1 match, found %, nothing changed', cnt;
  end if;
  newdef := replace(def, pat,
    'and not (public.perm_of(me, ''can_reschedule_content'') or (coalesce(me.role_publisher, false) and coalesce(old.publisher, '''') <> '''' and old.publisher = me.full_name)) then');
  execute newdef;
end $do$;

commit;
