-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 013 (Arena-Tagesgrenze zählt nur Siege).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000013a1', false), ('00000000-0000-0000-0000-0000000013a2', false);
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000013a1', 'Grenzgaenger'), ('00000000-0000-0000-0000-0000000013a2', 'Grenzgegner');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select '00000000-0000-0000-0000-0000000013a1', hero_id, 'code' from public.rpg_hero_catalog;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
-- Ein beendeter Kampf (Ersteller = Prüfkonto), dann die Belohnung rechnen; liefert, ob er gewertet wurde
create function pg_temp.kampf(p_sieg boolean) returns boolean language plpgsql as $$
declare m public.rpg_arena_matches; u uuid := '00000000-0000-0000-0000-0000000013a1'; r boolean;
begin
  insert into public.rpg_arena_matches (status, host_id, host_name, host_team, host_schnitt, guest_id, guest_name, guest_team, guest_schnitt, sieger, grund, ended_at)
    values ('beendet', u, 'Grenzgaenger', '[{"held":"schildwaechter","stufe":1},{"held":"trickser","stufe":1},{"held":"lichtbringer","stufe":1}]', 1.0,
      '00000000-0000-0000-0000-0000000013a2', 'Grenzgegner', '[{"held":"schildwaechter","stufe":1},{"held":"trickser","stufe":1},{"held":"lichtbringer","stufe":1}]', 1.0,
      case when p_sieg then 1 else 2 end, 'team', now()) returning * into m;
  perform public.rpg_arena_belohnen(m, u);
  select gewertet into r from public.rpg_arena_rewards where match_id = m.id and user_id = u; return r;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000013a1', false);

select pg_temp.ok((select bool_and(pg_temp.kampf(false)) from generate_series(1, 7)), 'Sieben Niederlagen: alle gewertet, keine verbraucht einen Platz');
select pg_temp.ok((public.rpg_arena_list()->>'heute')::int = 0 and (public.rpg_arena_list()->>'nur_siege')::boolean, 'Übersicht: 0 von 5, meldet nur_siege');
select pg_temp.ok((select bool_and(pg_temp.kampf(true)) from generate_series(1, 5)), 'Fünf Siege: alle gewertet');
select pg_temp.ok((public.rpg_arena_list()->>'heute')::int = 5, 'Übersicht: 5 von 5');
select pg_temp.ok(not pg_temp.kampf(true), 'Sechster Sieg: nicht mehr gewertet');
select pg_temp.ok(not pg_temp.kampf(false), 'Niederlage nach fünf Siegen: nicht mehr gewertet');
select pg_temp.ok((public.rpg_arena_list()->>'heute')::int = 5, 'Übersicht bleibt bei 5');
select pg_temp.ok((select coalesce(max(s), 0) <= 150 from (select sum(xp) s from public.rpg_xp_ledger where user_id = '00000000-0000-0000-0000-0000000013a1' and adventure = 'arena' group by hero_id) x), 'Weiterhin höchstens 150 Erfahrung je Held und Tag');
select pg_temp.ok((select bool_and(p.prosecdef) and count(*) = 2 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('rpg_arena_belohnen', 'rpg_arena_list'))
  and has_function_privilege('authenticated', 'public.rpg_arena_list()', 'execute') and not has_function_privilege('anon', 'public.rpg_arena_list()', 'execute')
  and not has_function_privilege('authenticated', 'public.rpg_arena_belohnen(public.rpg_arena_matches, uuid)', 'execute'), 'Rechte unverändert');
