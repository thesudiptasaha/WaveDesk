-- already run live on 2026-11-08 (Supabase SQL Editor). This file is the record.
-- Why: since commit d19b7d5 (7 Nov 2026) Owners and Managers appear in a role's list only when they hold that role's tick.
-- Their ticks had never been set (before, they were added to lists automatically), so their names vanished from the Presenter, Writer, Voice Over ... lists.
-- What it did: for every active Owner/Manager, set to true the role_... tick of each role they were already credited in on any content
-- (matched by full_name, case-insensitive, same organization). Only false -> true. Nothing was ever set to false.
-- Result: exactly 21 ticks were added (the block raises an exception and changes nothing if the count is not 21).
-- Re-running is harmless but it would raise the exception (count would be 0), because nothing is left to add.
-- The team_members guard trigger does not block it because auth.uid() is null in the SQL Editor.

begin;

do $$
declare
  rec record;
  n int := 0;
begin
  for rec in
    with credits as (
      select organization_id, concept_creator   as person, 'role_concept_creator'          as role_key from contents
      union all select organization_id, writer,                   'role_research_script_writer'  from contents
      union all select organization_id, production_manager,       'role_production_manager'      from contents
      union all select organization_id, producer,                 'role_producer'                from contents
      union all select organization_id, presenter_name,           'role_presenter'               from contents
      union all select organization_id, set_designer,             'role_set_designer'            from contents
      union all select organization_id, camera_operator,          'role_camera_operator'         from contents
      union all select organization_id, teleprompter_operator,    'role_teleprompter_operator'   from contents
      union all select organization_id, light_designer,           'role_light_designer'          from contents
      union all select organization_id, sound_recordist,          'role_sound_recordist'         from contents
      union all select organization_id, data_wrangler,            'role_data_wrangler'           from contents
      union all select organization_id, makeup_artist,            'role_makeup_artist'           from contents
      union all select organization_id, voice_over_artist,        'role_voice_over_artist'       from contents
      union all select organization_id, video_editor,             'role_video_editor'            from contents
      union all select organization_id, motion_graphics_designer, 'role_motion_graphics_designer' from contents
      union all select organization_id, graphic_designer,         'role_graphic_designer'        from contents
      union all select organization_id, colorist,                 'role_colorist'                from contents
      union all select organization_id, audio_mixer,              'role_audio_mixer'             from contents
      union all select organization_id, publisher,                'role_publisher'               from contents
      union all select organization_id, live_video_switcher,      'role_live_video_switcher'     from contents
      union all select organization_id, live_audio_mixer,         'role_live_audio_mixer'        from contents
    ),
    used as (
      select distinct organization_id, lower(btrim(person)) as pname, role_key
      from credits
      where person is not null and btrim(person) <> ''
    )
    select t.id, u.role_key
    from team_members t
    join used u
      on u.organization_id = t.organization_id
     and u.pname = lower(btrim(t.full_name))
    where t.role in ('owner', 'manager')
      and t.active is not false
      and coalesce((to_jsonb(t) ->> u.role_key)::boolean, false) = false
  loop
    execute format('update public.team_members set %I = true where id = $1', rec.role_key)
      using rec.id;
    n := n + 1;
  end loop;

  if n <> 21 then
    raise exception 'Expected 21 ticks to add, got %. Nothing was changed.', n;
  end if;
end $$;

commit;

-- ROLLBACK: there is no automatic rollback. A tick can be removed by hand in Team > the member > Roles.
