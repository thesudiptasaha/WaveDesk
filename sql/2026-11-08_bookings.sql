-- already run live on 2026-11-08 (Supabase SQL Editor). This file is the record.
-- External crew invites: bookings table + 4 functions.
-- Rules: no direct writes from the app (only the functions write); signed-in org members can read bookings (RLS);
-- create_booking / revoke_booking only for signed-in Owner, Managers, Producers, Production Managers (can_manage_externals);
-- get_booking_by_token / answer_booking are open to anon (the public /b/<token> page) and return nothing unless the secret code matches.
-- The secret code is never stored, only its sha256 hash. The link works until 23:59 (Asia/Dhaka) of the booking date.
-- The script (and content_uid) is returned only for presenter_name and voice_over_artist bookings.
-- ROLLBACK (manual): drop function public.answer_booking(text, text); drop function public.get_booking_by_token(text);
--   drop function public.revoke_booking(uuid); drop function public.create_booking(bigint, uuid, text, timestamptz, text, text);
--   drop table public.bookings;

begin;

-- 1. Table (no direct writes from the app; only the functions below write)
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_id bigint references public.contents(id) on delete cascade,
  member_id uuid not null references public.team_members(id) on delete restrict,
  role_field text not null,
  starts_at timestamptz not null,
  place text,
  note text,
  token_hash text not null,
  expires_at timestamptz not null,
  status text not null default 'sent',
  answered_at timestamptz,
  invited_by uuid not null references public.team_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_status_check check (status in ('sent','confirmed','declined','revoked','superseded')),
  constraint bookings_role_field_check check (role_field in (
    'concept_creator','writer','production_manager','producer','presenter_name','set_designer',
    'camera_operator','teleprompter_operator','light_designer','sound_recordist','data_wrangler',
    'makeup_artist','voice_over_artist','video_editor','motion_graphics_designer','graphic_designer',
    'colorist','audio_mixer','publisher','live_video_switcher','live_audio_mixer')),
  constraint bookings_place_len check (place is null or char_length(place) <= 300),
  constraint bookings_note_len check (note is null or char_length(note) <= 2000)
);
create unique index bookings_token_hash_key on public.bookings (token_hash);
create index bookings_content_idx on public.bookings (content_id);
create index bookings_member_idx on public.bookings (member_id);

alter table public.bookings enable row level security;
revoke all on public.bookings from anon, authenticated;
grant select on public.bookings to authenticated;
create policy bookings_select_org on public.bookings
  for select to authenticated
  using (organization_id = public.my_org_id());

do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception when duplicate_object then null;
end $$;

-- 2. Create an invite (returns the secret code once; only its hash is stored)
create or replace function public.create_booking(
  p_content_id bigint, p_member_id uuid, p_role_field text,
  p_starts_at timestamptz, p_place text, p_note text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  roles constant text[] := array[
    'concept_creator','writer','production_manager','producer','presenter_name','set_designer',
    'camera_operator','teleprompter_operator','light_designer','sound_recordist','data_wrangler',
    'makeup_artist','voice_over_artist','video_editor','motion_graphics_designer','graphic_designer',
    'colorist','audio_mixer','publisher','live_video_switcher','live_audio_mixer'];
  me public.team_members;
  c public.contents;
  m public.team_members;
  credited text;
  tok text;
  expiry timestamptz;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into me from public.my_member_row();
  if me.id is null or me.active is not true then raise exception 'Not allowed'; end if;
  if not public.can_manage_externals() then
    raise exception 'Only the Owner, Managers, Producers and Production Managers can invite people';
  end if;
  if p_role_field is null or p_role_field <> all (roles) then raise exception 'Unknown role'; end if;
  select * into c from public.contents where id = p_content_id;
  if c.id is null or c.organization_id is distinct from me.organization_id then
    raise exception 'Content not found';
  end if;
  select * into m from public.team_members where id = p_member_id;
  if m.id is null or m.organization_id is distinct from me.organization_id then
    raise exception 'Person not found';
  end if;
  if m.member_type <> 'external' or m.active is not true then
    raise exception 'Only active external people can be invited this way';
  end if;
  credited := to_jsonb(c) ->> p_role_field;
  if lower(btrim(coalesce(credited, ''))) <> lower(btrim(m.full_name)) then
    raise exception 'Assign this person to the role on the content first';
  end if;
  if p_starts_at is null then raise exception 'Date and time are required'; end if;
  -- the link works until 23:59 (Asia/Dhaka) of the booking date
  expiry := (((p_starts_at at time zone 'Asia/Dhaka')::date + 1)::timestamp at time zone 'Asia/Dhaka')
            - interval '1 minute';
  if expiry <= now() then raise exception 'The booking date is in the past'; end if;

  update public.bookings
     set status = 'superseded', updated_at = now()
   where content_id = p_content_id and member_id = p_member_id and role_field = p_role_field
     and status in ('sent','confirmed','declined');

  tok := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.bookings
    (organization_id, content_id, member_id, role_field, starts_at, place, note,
     token_hash, expires_at, status, invited_by)
  values
    (me.organization_id, p_content_id, p_member_id, p_role_field, p_starts_at,
     nullif(btrim(p_place), ''), nullif(btrim(p_note), ''),
     encode(sha256(convert_to(tok, 'UTF8')), 'hex'), expiry, 'sent', me.id);
  return tok;
end;
$function$;

-- 3. Revoke an invite
create or replace function public.revoke_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  me public.team_members;
  b public.bookings;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into me from public.my_member_row();
  if me.id is null or me.active is not true then raise exception 'Not allowed'; end if;
  if not public.can_manage_externals() then
    raise exception 'Only the Owner, Managers, Producers and Production Managers can cancel invites';
  end if;
  select * into b from public.bookings where id = p_booking_id;
  if b.id is null or b.organization_id is distinct from me.organization_id then
    raise exception 'Booking not found';
  end if;
  if b.status not in ('sent','confirmed','declined') then
    raise exception 'This booking is already closed';
  end if;
  update public.bookings set status = 'revoked', updated_at = now() where id = b.id;
end;
$function$;

-- 4. Public page: read a booking by its secret code (no login)
create or replace function public.get_booking_by_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  b public.bookings;
  c public.contents;
  m public.team_members;
  inv public.team_members;
  show_script boolean;
begin
  if p_token is null or char_length(p_token) < 32 or char_length(p_token) > 200 then
    return jsonb_build_object('state', 'invalid');
  end if;
  select * into b from public.bookings
   where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  if b.id is null then return jsonb_build_object('state', 'invalid'); end if;
  if b.status = 'revoked' then return jsonb_build_object('state', 'revoked'); end if;
  if b.status = 'superseded' then return jsonb_build_object('state', 'replaced'); end if;
  if b.expires_at <= now() then return jsonb_build_object('state', 'expired'); end if;

  select * into c from public.contents where id = b.content_id;
  select * into m from public.team_members where id = b.member_id;
  select * into inv from public.team_members where id = b.invited_by;
  show_script := b.role_field in ('presenter_name', 'voice_over_artist');

  return jsonb_build_object(
    'state', 'ok',
    'status', b.status,
    'role_field', b.role_field,
    'starts_at', b.starts_at,
    'place', b.place,
    'note', b.note,
    'expires_at', b.expires_at,
    'person_name', coalesce(nullif(m.nickname, ''), m.full_name),
    'invited_by_name', coalesce(nullif(inv.nickname, ''), inv.full_name),
    'invited_by_phone', inv.phone,
    'channel', c.channel,
    'show_script', show_script,
    'content_uid', case when show_script then c.content_uid end,
    'script', case when show_script then c.script end
  );
end;
$function$;

-- 5. Public page: answer (no login). Can be changed until the link expires.
create or replace function public.answer_booking(p_token text, p_answer text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  b public.bookings;
  m public.team_members;
  c public.contents;
  role_label text;
  msg text;
begin
  if p_answer is null or p_answer not in ('confirmed', 'declined') then
    raise exception 'Invalid answer';
  end if;
  if p_token is null or char_length(p_token) < 32 or char_length(p_token) > 200 then
    return jsonb_build_object('state', 'invalid');
  end if;
  select * into b from public.bookings
   where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
   for update;
  if b.id is null then return jsonb_build_object('state', 'invalid'); end if;
  if b.status = 'revoked' then return jsonb_build_object('state', 'revoked'); end if;
  if b.status = 'superseded' then return jsonb_build_object('state', 'replaced'); end if;
  if b.expires_at <= now() then return jsonb_build_object('state', 'expired'); end if;
  if b.status = p_answer then
    return jsonb_build_object('state', 'ok', 'status', b.status);
  end if;

  update public.bookings
     set status = p_answer, answered_at = now(), updated_at = now()
   where id = b.id;

  select * into m from public.team_members where id = b.member_id;
  select * into c from public.contents where id = b.content_id;
  role_label := case b.role_field
    when 'presenter_name' then 'Presenter'
    when 'writer' then 'Research & Script Writer'
    else initcap(replace(b.role_field, '_', ' '))
  end;
  msg := coalesce(nullif(m.nickname, ''), m.full_name)
         || case when p_answer = 'confirmed' then ' can come' else ' cannot come' end
         || ' as ' || role_label
         || ' on ' || coalesce(c.slug_name, 'a booking')
         || ' (' || to_char(b.starts_at at time zone 'Asia/Dhaka', 'DD Mon HH12:MI AM') || ')';

  insert into public.notifications (organization_id, member_id, content_id, message)
  values (b.organization_id, b.invited_by, b.content_id::text, msg);

  return jsonb_build_object('state', 'ok', 'status', p_answer);
end;
$function$;

-- 6. Who may call what
revoke all on function public.create_booking(bigint, uuid, text, timestamptz, text, text) from public, anon, authenticated;
revoke all on function public.revoke_booking(uuid) from public, anon, authenticated;
revoke all on function public.get_booking_by_token(text) from public, anon, authenticated;
revoke all on function public.answer_booking(text, text) from public, anon, authenticated;

grant execute on function public.create_booking(bigint, uuid, text, timestamptz, text, text) to authenticated;
grant execute on function public.revoke_booking(uuid) to authenticated;
grant execute on function public.get_booking_by_token(text) to anon, authenticated;
grant execute on function public.answer_booking(text, text) to anon, authenticated;

commit;