-- already run live on 2026-10-31
-- contents.publisher gets the same rule as the ten Production Crew fields:
-- Manager/Owner/Producer/Production Manager may change it; a member with role_publisher
-- may only put himself into an empty slot or remove himself.
begin;

do $do$
declare
  def text;
  newdef text;
begin
  select pg_get_functiondef('public.contents_production_rules'::regproc) into def;
  newdef := replace(def, '''voice_over_artist''];', '''voice_over_artist'',''publisher''];');
  if newdef = def then
    raise exception 'contents_production_rules: crew list pattern not found, nothing changed';
  end if;
  execute newdef;
end $do$;

commit;
