-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 024 (Rang des Gegners in der Aufstellung).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) select ('00000000-0000-0000-0000-0000000024a' || g)::uuid, false from generate_series(1, 3) g;
insert into public.rpg_profiles (user_id, handle, avatar_key) values ('00000000-0000-0000-0000-0000000024a1', 'Gg_Anna', null), ('00000000-0000-0000-0000-0000000024a2', 'Gg_Ben', null), ('00000000-0000-0000-0000-0000000024a3', 'Gg_Cara', null);
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select u.id, hero_id, 'code' from public.rpg_hero_catalog, (select id from auth.users where id::text like '00000000-0000-0000-0000-0000000024a%') u;
insert into public.rpg_arena_squads (user_id, team) select id, array['schildwaechter', 'trickser', 'lichtbringer'] from auth.users where id::text like '00000000-0000-0000-0000-0000000024a%';
update public.rpg_arena_matches set status = 'abgebrochen' where status in ('offen', 'bereit', 'laeuft');
update public.rpg_arena_bot_settings set aktiv = true, wartezeit = 30, staerke_von = 1, staerke_bis = 1, stufe_von = -1, stufe_bis = 1, schnitt_max = 0.5;
insert into public.rpg_ranked_seasons (name, beginn, ende) select 'Season T', now(), now() + interval '42 days' where public.rpg_ranked_saison() is null;
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000024a' || case p when 'A' then '1' when 'B' then '2' else '3' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
create function pg_temp.altern(p uuid, sek integer) returns void language sql security definer as $$ update public.rpg_arena_search_srv set seit = now() - make_interval(secs => sek) where match_id = p; $$;
create function pg_temp.schluss() returns void language sql security definer as $$ update public.rpg_arena_matches set status = 'abgebrochen' where status in ('offen', 'bereit', 'laeuft'); $$;
create function pg_temp.punkte(p text, n integer) returns void language sql security definer as $$
  insert into public.rpg_ranked_players (season_id, user_id, punkte, hoechst) select (public.rpg_ranked_saison()).id, ('00000000-0000-0000-0000-0000000024a' || p)::uuid, n, n
    on conflict (season_id, user_id) do update set punkte = excluded.punkte, hoechst = greatest(public.rpg_ranked_players.hoechst, excluded.punkte); $$;
grant execute on all functions in schema pg_temp to authenticated;
select pg_temp.punkte('1', 230); select pg_temp.punkte('2', 250);
set role authenticated;
-- Ranked: der Rang, mit dem beide in den Kampf gehen
select pg_temp.als('A'); select public.rpg_ranked_queue() as a1 \gset
select pg_temp.als('B'); select public.rpg_ranked_queue() as b1 \gset
select pg_temp.ok(:'b1'::jsonb->>'status' = 'bereit' and :'b1'::jsonb->>'id' = :'a1'::jsonb->>'id', 'Anna und Ben (beide Bronze I) stehen sich in Ranked gegenüber');
select pg_temp.ok(public.rpg_ranked_gegenueber((:'a1'::jsonb->>'id')::uuid) = '{"da": true, "ranked": true, "host": 2, "gast": 2}'::jsonb, 'Ben sieht: beide Rang 2 (Bronze I) – nur der Rang, keine Punkte');
select pg_temp.punkte('1', 900);
select pg_temp.als('A');
select pg_temp.ok(public.rpg_ranked_gegenueber((:'a1'::jsonb->>'id')::uuid) @> '{"host": 2, "gast": 2}'::jsonb, 'In Ranked gilt der Rang beim Kampfbeginn, auch wenn sich die Punkte danach ändern');
select pg_temp.als('C');
select pg_temp.fehler('select public.rpg_ranked_gegenueber(''' || (:'a1'::jsonb->>'id') || ''')', 'gibt es nicht', 'Ein Unbeteiligter erfährt nichts');
select pg_temp.fehler('select public.rpg_ranked_gegenueber(''00000000-0000-0000-0000-000000000000'')', 'gibt es nicht', 'Unbekannter Kampf');
-- Normal: der aktuelle Rang der Saison
select pg_temp.schluss();
select pg_temp.als('A'); select public.rpg_arena_queue('normal') as n1 \gset
select pg_temp.als('C'); select public.rpg_arena_queue('normal') as n2 \gset
select pg_temp.ok(:'n2'::jsonb->>'status' = 'bereit' and :'n2'::jsonb->>'id' = :'n1'::jsonb->>'id', 'Anna und Cara stehen sich in Normal gegenüber');
select pg_temp.ok(public.rpg_ranked_gegenueber((:'n1'::jsonb->>'id')::uuid) = '{"da": true, "ranked": false, "host": 9, "gast": 0}'::jsonb, 'Normal: Anna Rang 9 (Platin III), Cara ohne Ranked-Kampf Rang 0 (Bronze III)');
-- Rechner-Gegner: derselbe Rang wie der Spieler
select pg_temp.schluss();
select pg_temp.als('A'); select public.rpg_arena_queue('normal') as r1 \gset
select pg_temp.altern((:'r1'::jsonb->>'id')::uuid, 45);
select public.rpg_arena_queue('normal') as r2 \gset
select pg_temp.ok(:'r2'::jsonb->>'status' = 'bereit', 'Nach der Wartezeit tritt ein Rechner-Gegner an');
select pg_temp.ok(public.rpg_ranked_gegenueber((:'r1'::jsonb->>'id')::uuid) = '{"da": true, "ranked": false, "host": 9, "gast": 9}'::jsonb, 'Der Rechner-Gegner steht im selben Rang wie der Spieler');
select pg_temp.schluss();
reset role;
select pg_temp.ok(not has_function_privilege('anon', 'public.rpg_ranked_gegenueber(uuid)', 'execute') and has_function_privilege('authenticated', 'public.rpg_ranked_gegenueber(uuid)', 'execute'), 'Rechte: nur angemeldete Nutzer');
