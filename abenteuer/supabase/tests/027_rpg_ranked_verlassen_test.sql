-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 027 (verlassener Kampf gegen den Rechner-Gegner).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) select ('00000000-0000-0000-0000-0000000027a' || g)::uuid, false from generate_series(1, 2) g;
insert into public.rpg_profiles (user_id, handle, avatar_key) values ('00000000-0000-0000-0000-0000000027a1', 'Vl_Anna', null), ('00000000-0000-0000-0000-0000000027a2', 'Vl_Ben', null);
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select u.id, hero_id, 'code' from public.rpg_hero_catalog, (select id from auth.users where id::text like '00000000-0000-0000-0000-0000000027a%') u;
insert into public.rpg_arena_squads (user_id, team) select id, array['schildwaechter', 'trickser', 'lichtbringer'] from auth.users where id::text like '00000000-0000-0000-0000-0000000027a%';
update public.rpg_arena_matches set status = 'abgebrochen' where status in ('offen', 'bereit', 'laeuft');
update public.rpg_arena_bot_settings set aktiv = true, wartezeit = 30, staerke_von = 1, staerke_bis = 1, stufe_von = -1, stufe_bis = 1, schnitt_max = 0.5;
insert into public.rpg_ranked_seasons (name, beginn, ende) select 'Season T', now(), now() + interval '42 days' where public.rpg_ranked_saison() is null;
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000027a' || case p when 'A' then '1' else '2' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.altern(p uuid, sek integer) returns void language sql security definer as $$ update public.rpg_arena_search_srv set seit = now() - make_interval(secs => sek) where match_id = p; $$;
create function pg_temp.schluss() returns void language sql security definer as $$ update public.rpg_arena_matches set status = 'abgebrochen' where status in ('offen', 'bereit', 'laeuft'); $$;
create function pg_temp.punkte(p text, n integer) returns void language sql security definer as $$
  insert into public.rpg_ranked_players (season_id, user_id, punkte, hoechst) select (public.rpg_ranked_saison()).id, ('00000000-0000-0000-0000-0000000027a' || p)::uuid, n, n
    on conflict (season_id, user_id) do update set punkte = excluded.punkte, hoechst = greatest(public.rpg_ranked_players.hoechst, excluded.punkte); $$;
-- Kampf beginnen (wie die Edge Function: erster gespeicherter Stand) und die Zeit seit dem letzten Schritt zurückstellen
create function pg_temp.beginnen(p uuid) returns boolean language plpgsql security definer as $$
declare v_h uuid; begin select host_id into v_h from public.rpg_arena_matches where id = p;
  return public.rpg_arena_srv_save(p, v_h, 0, '{"runde": 1, "arena": {}}'::jsonb, '[{"sicht1": {}, "sicht2": {}}]'::jsonb); end $$;
create function pg_temp.still(p uuid, minuten integer) returns void language sql security definer as $$ update public.rpg_arena_fights set updated_at = now() - make_interval(mins => minuten) where match_id = p; $$;
create function pg_temp.kampf(p uuid) returns public.rpg_arena_matches language sql security definer as $$ select m from public.rpg_arena_matches m where id = p; $$;
grant execute on all functions in schema pg_temp to authenticated;
select pg_temp.punkte('1', 130); select pg_temp.punkte('2', 130);
set role authenticated;

-- ---------- Rechner-Gegner, Kampf läuft ----------
select pg_temp.als('A'); select public.rpg_ranked_queue() as a1 \gset
select pg_temp.altern((:'a1'::jsonb->>'id')::uuid, 45);
select public.rpg_ranked_queue() as a2 \gset
select pg_temp.ok(:'a2'::jsonb->>'status' = 'bereit', 'Anna bekommt in Ranked einen Rechner-Gegner');
select pg_temp.still((:'a1'::jsonb->>'id')::uuid, 30);
select pg_temp.ok((public.rpg_ranked_status()->'ich'->>'punkte')::int = 130 and (pg_temp.kampf((:'a1'::jsonb->>'id')::uuid)).status = 'bereit', 'Vor dem Start gilt die Regel nicht: Ein Kampf, der noch nicht begonnen hat, bleibt unberührt');
select pg_temp.ok(pg_temp.beginnen((:'a1'::jsonb->>'id')::uuid) and (pg_temp.kampf((:'a1'::jsonb->>'id')::uuid)).status = 'laeuft', 'Der Kampf beginnt');
select pg_temp.still((:'a1'::jsonb->>'id')::uuid, 4);
select pg_temp.ok((public.rpg_ranked_status()->'ich'->>'punkte')::int = 130 and (pg_temp.kampf((:'a1'::jsonb->>'id')::uuid)).status = 'laeuft', 'Vier Minuten ohne Schritt: Der Kampf läuft weiter');
select pg_temp.still((:'a1'::jsonb->>'id')::uuid, 6);
select public.rpg_ranked_status() as s1 \gset
select pg_temp.ok((pg_temp.kampf((:'a1'::jsonb->>'id')::uuid)).status = 'beendet' and (pg_temp.kampf((:'a1'::jsonb->>'id')::uuid)).sieger = 2 and (pg_temp.kampf((:'a1'::jsonb->>'id')::uuid)).grund = 'aufgabe',
  'Sechs Minuten ohne Schritt: Der Kampf gilt als aufgegeben, Sieger ist der Rechner-Gegner');
select pg_temp.ok((:'s1'::jsonb->'ich'->>'punkte')::int = 115 and (:'s1'::jsonb->'ich'->>'niederlagen')::int = 1, 'In Ranked kostet das die übliche Niederlage: 130 → 115 Punkte');
select pg_temp.ok(public.rpg_ranked_result((:'a1'::jsonb->>'id')::uuid) @> '{"gewertet": true, "delta": -15}'::jsonb and not (public.rpg_arena_get((:'a1'::jsonb->>'id')::uuid)->'belohnung'->>'gewertet')::boolean,
  'Ergebnis: −15 Punkte; für die Aufgabe gibt es wie bisher keine Erfahrung und keine Seelensplitter');
select pg_temp.ok((public.rpg_ranked_status()->'ich'->>'punkte')::int = 115, 'Ein zweiter Aufruf wertet nicht noch einmal');
select pg_temp.ok(public.rpg_ranked_queue()->>'status' = 'offen', 'Danach kann Anna wieder suchen');

-- ---------- gegen einen Menschen: unverändert ----------
select pg_temp.schluss();
select pg_temp.als('A'); select public.rpg_ranked_queue() as m1 \gset
select pg_temp.als('B'); select public.rpg_ranked_queue() as m2 \gset
select pg_temp.ok(:'m2'::jsonb->>'status' = 'bereit' and :'m2'::jsonb->>'id' = :'m1'::jsonb->>'id' and pg_temp.beginnen((:'m1'::jsonb->>'id')::uuid), 'Anna gegen Ben: der Kampf beginnt');
select pg_temp.still((:'m1'::jsonb->>'id')::uuid, 30);
select pg_temp.ok((public.rpg_ranked_status()->'ich'->>'punkte')::int = 130 and (pg_temp.kampf((:'m1'::jsonb->>'id')::uuid)).status = 'laeuft', 'Gegen einen Menschen greift die Regel nicht (dort hält das Gerät des Gegners den Kampf in Gang)');
select pg_temp.schluss();
reset role;
select pg_temp.ok(not has_function_privilege('authenticated', 'public.rpg_ranked_nachholen(uuid)', 'execute') and not has_function_privilege('anon', 'public.rpg_ranked_nachholen(uuid)', 'execute'), 'Rechte unverändert: Die Funktion ist nicht direkt aufrufbar');
