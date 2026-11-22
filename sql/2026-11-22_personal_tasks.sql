-- N164: personal tasks, Home "Today's work" panel, phase 1
-- SQL run live on 22 Nov 2026. Checks: tables_with_rls=2, policies=7, triggers=3, cleanup_fn=1.
-- New tables only. Nothing existing is changed.

create table if not exists public.personal_tasks (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null,
  member_id        uuid not null references public.team_members(id) on delete cascade,
  title            text not null,
  note             text,
  due_date         date,
  due_time         time,
  content_id       text,
  status           text not null default 'open',
  done_at          timestamptz,
  repeat_kind      text not null default 'none',
  repeat_weekdays  smallint[],
  repeat_month_day smallint,
  skip_friday      boolean not null default false,
  stopped          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint pt_title_len   check (char_length(btrim(title)) between 1 and 200),
  constraint pt_note_len    check (note is null or char_length(note) <= 1000),
  constraint pt_content_len check (content_id is null or char_length(content_id) <= 60),
  constraint pt_status      check (status in ('open','done')),
  constraint pt_repeat_kind check (repeat_kind in ('none','daily','weekly','monthly')),
  constraint pt_time_needs_date check (due_time is null or due_date is not null),
  constraint pt_month_day   check (repeat_month_day is null or repeat_month_day between 1 and 31),
  constraint pt_weekdays    check (repeat_weekdays is null or repeat_weekdays <@ array[0,1,2,3,4,5,6]::smallint[]),
  constraint pt_repeat_shape check (
    (repeat_kind = 'none'    and repeat_weekdays is null and repeat_month_day is null and skip_friday = false)
 or (repeat_kind = 'daily'   and repeat_weekdays is null and repeat_month_day is null)
 or (repeat_kind = 'weekly'  and repeat_weekdays is not null and cardinality(repeat_weekdays) >= 1 and repeat_month_day is null)
 or (repeat_kind = 'monthly' and repeat_month_day is not null and repeat_weekdays is null)
  ),
  constraint pt_repeat_needs_start check (repeat_kind = 'none' or due_date is not null),
  constraint pt_repeat_stays_open  check (repeat_kind = 'none' or status = 'open')
);

create index if not exists personal_tasks_member_idx on public.personal_tasks (member_id, status);

create table if not exists public.personal_task_done (
  task_id    uuid not null references public.personal_tasks(id) on delete cascade,
  done_on    date not null,
  member_id  uuid not null,
  created_at timestamptz not null default now(),
  primary key (task_id, done_on)
);

create index if not exists personal_task_done_member_idx on public.personal_task_done (member_id, done_on);

-- Triggers

create or replace function public.personal_tasks_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  if not coalesce(public.i_am_active(), false) then
    raise exception 'Not allowed';
  end if;
  new.member_id := public.my_member_id();
  new.organization_id := public.my_org_id();
  if new.member_id is null or new.organization_id is null then
    raise exception 'Not allowed';
  end if;
  select count(*) into cnt from public.personal_tasks where member_id = new.member_id;
  if cnt >= 200 then
    raise exception 'Task limit reached (200). Finish or delete old tasks first.';
  end if;
  new.done_at := case when new.status = 'done' then now() else null end;
  new.created_at := now();
  new.updated_at := now();
  return new;
end $$;

create or replace function public.personal_tasks_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.id := old.id;
  new.member_id := old.member_id;
  new.organization_id := old.organization_id;
  new.created_at := old.created_at;
  if new.status = 'done' and old.status <> 'done' then
    new.done_at := now();
  elsif new.status = 'open' then
    new.done_at := null;
  else
    new.done_at := old.done_at;
  end if;
  new.updated_at := now();
  return new;
end $$;

create or replace function public.personal_task_done_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.member_id := public.my_member_id();
  if new.member_id is null then
    raise exception 'Not allowed';
  end if;
  new.created_at := now();
  return new;
end $$;

drop trigger if exists personal_tasks_bi on public.personal_tasks;
create trigger personal_tasks_bi before insert on public.personal_tasks
  for each row execute function public.personal_tasks_before_insert();

drop trigger if exists personal_tasks_bu on public.personal_tasks;
create trigger personal_tasks_bu before update on public.personal_tasks
  for each row execute function public.personal_tasks_before_update();

drop trigger if exists personal_task_done_bi on public.personal_task_done;
create trigger personal_task_done_bi before insert on public.personal_task_done
  for each row execute function public.personal_task_done_before_insert();

-- Row level security: only the owner, nobody else (not even managers)

alter table public.personal_tasks enable row level security;
alter table public.personal_task_done enable row level security;

drop policy if exists pt_select on public.personal_tasks;
drop policy if exists pt_insert on public.personal_tasks;
drop policy if exists pt_update on public.personal_tasks;
drop policy if exists pt_delete on public.personal_tasks;
create policy pt_select on public.personal_tasks for select to authenticated
  using (member_id = public.my_member_id());
create policy pt_insert on public.personal_tasks for insert to authenticated
  with check (member_id = public.my_member_id() and organization_id = public.my_org_id());
create policy pt_update on public.personal_tasks for update to authenticated
  using (member_id = public.my_member_id())
  with check (member_id = public.my_member_id());
create policy pt_delete on public.personal_tasks for delete to authenticated
  using (member_id = public.my_member_id());

drop policy if exists ptd_select on public.personal_task_done;
drop policy if exists ptd_insert on public.personal_task_done;
drop policy if exists ptd_delete on public.personal_task_done;
create policy ptd_select on public.personal_task_done for select to authenticated
  using (member_id = public.my_member_id());
create policy ptd_insert on public.personal_task_done for insert to authenticated
  with check (
    member_id = public.my_member_id()
    and exists (select 1 from public.personal_tasks t
                where t.id = task_id and t.member_id = public.my_member_id())
  );
create policy ptd_delete on public.personal_task_done for delete to authenticated
  using (member_id = public.my_member_id());

revoke all on public.personal_tasks from anon;
revoke all on public.personal_task_done from anon;
grant select, insert, update, delete on public.personal_tasks to authenticated;
grant select, insert, delete on public.personal_task_done to authenticated;

-- History cleanup: called by the app when the panel opens.
-- Done one-time tasks and stopped repeating tasks: 30 days. Repeat ticks: 45 days.

create or replace function public.cleanup_my_task_history()
returns void language sql security definer set search_path = public as $$
  delete from public.personal_task_done
   where member_id = public.my_member_id()
     and done_on < ((now() at time zone 'Asia/Dhaka')::date - 45);
  delete from public.personal_tasks
   where member_id = public.my_member_id()
     and ((status = 'done' and done_at < now() - interval '30 days')
       or (stopped and updated_at < now() - interval '30 days'));
$$;

revoke all on function public.cleanup_my_task_history() from public, anon;
grant execute on function public.cleanup_my_task_history() to authenticated;
