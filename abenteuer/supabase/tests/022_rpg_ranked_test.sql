-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 022 (Arena: Ranked).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) select ('00000000-0000-0000-0000-0000000022a' || g)::uuid, false from generate_series(1, 5) g;
insert into public.rpg_profiles (user_id, handle, avatar_key) values ('00000000-0000-0000-0000-0000000022a1', 'Rk_Anna', 'trickser'), ('00000000-0000-0000-0000-0000000022a2', 'Rk_Ben', null),
  ('00000000-0000-0000-0000-0000000022a3', 'Rk_Cara', null), ('00000000-0000-0000-0000-0000000022a4', 'Rk_Dora', null), ('00000000-0000-0000-0000-0000000022a5', 'Rk_Chef', null);
insert into public.rpg_admins (user_id) values ('00000000-0000-0000-0000-0000000022a5');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select u.id, hero_id, 'code' from public.rpg_hero_catalog, (select id from auth.users where id::text like '00000000-0000-0000-0000-0000000022a%') u;
insert into public.rpg_arena_squads (user_id, team) select id, array['schildwaechter', 'trickser', 'lichtbringer'] from auth.users where id::text like '00000000-0000-0000-0000-0000000022a%';
-- Ben hat Helden auf Stufe 10 (Anna auf 1): In Ranked zählt die Stufe für die Zuteilung nicht
insert into public.rpg_hero_progress (user_id, hero_id, xp) select '00000000-0000-0000-0000-0000000022a2', h, 99999 from unnest(array['schildwaechter', 'trickser', 'lichtbringer']) h;
update public.rpg_arena_matches set status = 'abgebrochen' where status in ('offen', 'bereit', 'laeuft');
update public.rpg_arena_bot_settings set aktiv = true, wartezeit = 30, staerke_von = 1, staerke_bis = 1, stufe_von = -1, stufe_bis = 1, schnitt_max = 0.5;
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000022a' || case p when 'A' then '1' when 'B' then '2' when 'C' then '3' when 'D' then '4' else '5' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
create function pg_temp.altern(p uuid, sek integer) returns void language sql security definer as $$ update public.rpg_arena_search_srv set seit = now() - make_interval(secs => sek) where match_id = p; $$;
create function pg_temp.punkte(p text, n integer) returns void language sql security definer as $$
  insert into public.rpg_ranked_players (season_id, user_id, punkte, hoechst) select id, ('00000000-0000-0000-0000-0000000022a' || p)::uuid, n, n from public.rpg_ranked_seasons where status = 'laeuft'
    on conflict (season_id, user_id) do update set punkte = excluded.punkte, hoechst = greatest(public.rpg_ranked_players.hoechst, excluded.punkte); $$;
-- Kampf zu Ende spielen (wie die Edge Function): Sieger 1 oder 2
create function pg_temp.ende(p uuid, sieger integer) returns boolean language plpgsql security definer as $$
declare v_h uuid;
begin select host_id into v_h from public.rpg_arena_matches where id = p;
  perform public.rpg_arena_srv_save(p, v_h, 0, jsonb_build_object('ende', 'arena', 'runde', 5, 'arena', jsonb_build_object('sieger', sieger, 'grund', 'Das Team von X liegt am Boden.', 'punkte', jsonb_build_object('1', 10, '2', 5))), '[{"sicht1": {}, "sicht2": {}}]');
  return public.rpg_arena_srv_end(p, v_h); end $$;
grant execute on all functions in schema pg_temp to authenticated;
select pg_temp.ok((select count(*) = 1 and bool_and(name = 'Season 0' and status = 'laeuft' and ende - beginn = interval '42 days') from public.rpg_ranked_seasons), 'Season 0 ist angelegt: sechs Wochen');
select pg_temp.ok(public.rpg_ranked_rang(0) = 0 and public.rpg_ranked_rang(99) = 0 and public.rpg_ranked_rang(100) = 1 and public.rpg_ranked_rang(299) = 2 and public.rpg_ranked_rang(300) = 3 and public.rpg_ranked_rang(1400) = 14 and public.rpg_ranked_rang(9999) = 14,
  'Ränge: je 100 Punkte eine Stufe, 0 = Bronze III … 1400 und mehr = Meister I');
set role authenticated;

-- ---------- gleicher Rang ----------
select pg_temp.als('A');
select public.rpg_ranked_queue() as a1 \gset
select pg_temp.ok(:'a1'::jsonb->>'status' = 'offen', 'Anna sucht: offen');
select pg_temp.als('B');
select public.rpg_ranked_queue() as b1 \gset
select pg_temp.ok(:'b1'::jsonb->>'status' = 'bereit' and :'b1'::jsonb->>'id' = :'a1'::jsonb->>'id' and (:'b1'::jsonb->'gast'->>'schnitt')::numeric = 10 and (:'b1'::jsonb->'host'->>'schnitt')::numeric = 1,
  'Ben (gleicher Rang, Helden Stufe 10 gegen Stufe 1) wird zugeteilt: In Ranked zählt nur der Rang');
select pg_temp.ok(public.rpg_arena_fight((:'a1'::jsonb->>'id')::uuid, 0)->>'modus' = 'duell', 'Gespielt wird ein Duell, als Serverkampf');
select pg_temp.ok(public.rpg_ranked_result((:'a1'::jsonb->>'id')::uuid) @> '{"ranked": true, "gewertet": false, "vor": 0}'::jsonb, 'Vor dem Ende: noch nicht gewertet');
select pg_temp.ok(pg_temp.ende((:'a1'::jsonb->>'id')::uuid, 1), 'Kampf gespielt: Anna gewinnt');
select public.rpg_ranked_result((:'a1'::jsonb->>'id')::uuid) as rb \gset
select pg_temp.ok(:'rb'::jsonb @> '{"gewertet": true, "vor": 0, "delta": -15, "nach": 0, "rang_vor": 0, "rang_nach": 0}'::jsonb, 'Ben verliert 15 Punkte – unter 0 fällt niemand');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_ranked_result((:'a1'::jsonb->>'id')::uuid) @> '{"gewertet": true, "vor": 0, "delta": 25, "nach": 25, "weit": false}'::jsonb, 'Anna gewinnt 25 Punkte');
select pg_temp.ok((public.rpg_arena_get((:'a1'::jsonb->>'id')::uuid)->'belohnung'->>'gewertet')::boolean, 'Der gewöhnliche Lohn des Kampfs (Erfahrung, Seelensplitter) wird wie in Normal gebucht');
select pg_temp.als('C');
select pg_temp.fehler('select public.rpg_ranked_result(''' || (:'a1'::jsonb->>'id') || ''')', 'gibt es nicht', 'Ein Unbeteiligter erfährt nichts über den Kampf');

-- ---------- ein Rang Unterschied: erst nach 25 Sekunden ----------
select pg_temp.punkte('3', 120); select pg_temp.punkte('4', 500);
select pg_temp.als('A');
select public.rpg_ranked_queue() as a2 \gset
select pg_temp.als('C');
select public.rpg_ranked_queue() as c1 \gset
select pg_temp.ok(:'c1'::jsonb->>'status' = 'offen' and :'c1'::jsonb->>'id' <> :'a2'::jsonb->>'id', 'Cara (ein Rang höher) wird in den ersten Sekunden nicht zugeteilt');
select pg_temp.als('D');
select public.rpg_ranked_queue() as d1 \gset
select pg_temp.altern((:'a2'::jsonb->>'id')::uuid, 120);
select pg_temp.ok(public.rpg_ranked_queue()->>'status' = 'offen', 'Dora (fünf Ränge höher) wird nie zugeteilt, auch wenn Anna lange wartet');
select public.rpg_arena_cancel((:'d1'::jsonb->>'id')::uuid) \gset d_
select pg_temp.altern((:'a2'::jsonb->>'id')::uuid, 28);
select pg_temp.als('C');
select public.rpg_ranked_queue() as c2 \gset
select pg_temp.ok(:'c2'::jsonb->>'status' = 'bereit' and :'c2'::jsonb->>'id' = :'a2'::jsonb->>'id', 'Nach 25 Sekunden: Cara (Bronze II) trifft auf Anna (Bronze III)');
select pg_temp.ok(pg_temp.ende((:'a2'::jsonb->>'id')::uuid, 1), 'Anna (die Niedrigere) gewinnt');
select pg_temp.ok(public.rpg_ranked_result((:'a2'::jsonb->>'id')::uuid) @> '{"vor": 120, "delta": -25, "nach": 95, "rang_vor": 1, "rang_nach": 0, "weit": true}'::jsonb, 'Die Höhere verliert 25 – und steigt von Bronze II auf Bronze III ab');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_ranked_result((:'a2'::jsonb->>'id')::uuid) @> '{"vor": 25, "delta": 35, "nach": 60}'::jsonb, 'Die Niedrigere gewinnt 35');
-- umgekehrt: die Höhere gewinnt
select pg_temp.punkte('3', 150);
select public.rpg_ranked_queue() as a3 \gset
select pg_temp.altern((:'a3'::jsonb->>'id')::uuid, 28);
select pg_temp.als('C');
select public.rpg_ranked_queue() as c3 \gset
select pg_temp.ok(pg_temp.ende((:'a3'::jsonb->>'id')::uuid, 2), 'Diesmal gewinnt Cara (die Höhere)');
select pg_temp.ok(public.rpg_ranked_result((:'a3'::jsonb->>'id')::uuid) @> '{"vor": 150, "delta": 15, "nach": 165}'::jsonb, 'Die Höhere gewinnt 15');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_ranked_result((:'a3'::jsonb->>'id')::uuid) @> '{"vor": 60, "delta": -5, "nach": 55}'::jsonb, 'Die Niedrigere verliert 5');

-- ---------- Rechner-Gegner im selben Rang, stärker mit dem Rang ----------
select pg_temp.punkte('4', 1250);
select pg_temp.als('D');
select public.rpg_ranked_queue() as d2 \gset
select pg_temp.altern((:'d2'::jsonb->>'id')::uuid, 20);
select pg_temp.ok(public.rpg_ranked_queue()->>'status' = 'offen', 'Vor der Wartezeit: kein Rechner-Gegner');
select pg_temp.altern((:'d2'::jsonb->>'id')::uuid, 60);
select public.rpg_ranked_queue() as d3 \gset
select pg_temp.ok(:'d3'::jsonb->>'status' = 'bereit' and :'d3'::jsonb->'gast'->>'name' is not null, 'Nach der Wartezeit: ein Rechner-Gegner (' || (:'d3'::jsonb->'gast'->>'name') || ')');
reset role;
select pg_temp.ok((select ranked and modus = 'duell' and (bot->>'staerke')::numeric = 0.94 from public.rpg_arena_fights where match_id = (:'d2'::jsonb->>'id')::uuid)
  and (select host_vor = 1250 and guest_vor = 1250 and not weit from public.rpg_ranked_matches where match_id = (:'d2'::jsonb->>'id')::uuid), 'Er steht im selben Rang (Meister III) und spielt mit Stärke 0,94 – in Bronze III wären es 0,60');
set role authenticated;
select pg_temp.ok(pg_temp.ende((:'d2'::jsonb->>'id')::uuid, 2), 'Dora verliert gegen ihn');
select pg_temp.ok(public.rpg_ranked_result((:'d2'::jsonb->>'id')::uuid) @> '{"vor": 1250, "delta": -15, "nach": 1235}'::jsonb, 'Gewertet wie gegen einen Menschen im selben Rang: −15');
-- Aufgabe: gewertet wird beim nächsten Blick auf die Übersicht
select public.rpg_ranked_queue() as d4 \gset
select pg_temp.altern((:'d4'::jsonb->>'id')::uuid, 60);
select public.rpg_ranked_queue() as d5 \gset
reset role; select public.rpg_arena_srv_save((:'d4'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000022a4', 0, '{"runde": 1, "arena": {}}', '[{"sicht1": {}, "sicht2": {}}]') \gset s_
set role authenticated;
select pg_temp.ok(public.rpg_arena_cancel((:'d4'::jsonb->>'id')::uuid)->>'status' = 'beendet', 'Dora gibt auf');

-- ---------- Übersicht ----------
select public.rpg_ranked_status() as st \gset
select pg_temp.ok((:'st'::jsonb->'ich'->>'punkte')::integer = 1220 and (:'st'::jsonb->'ich'->>'rang')::integer = 12 and (:'st'::jsonb->'ich'->>'hoechst')::integer = 1250 and (:'st'::jsonb->'ich'->>'platz')::integer = 1
  and (:'st'::jsonb->'ich'->>'niederlagen')::integer = 2, 'Übersicht: Die Aufgabe ist gewertet (1235 → 1220), Platz 1, Höchststand 1250');
select pg_temp.ok((:'st'::jsonb->'saison'->>'name') = 'Season 0' and (:'st'::jsonb->'saison'->>'laeuft')::boolean and jsonb_array_length(:'st'::jsonb->'rangliste') = 4
  and :'st'::jsonb->'rangliste'->0->>'name' = 'Rk_Dora' and (:'st'::jsonb->'rangliste'->0->>'ich')::boolean and :'st'::jsonb->'rangliste'->1->>'name' = 'Rk_Cara'
  and (select bool_and(not (z ? 'user_id')) from jsonb_array_elements(:'st'::jsonb->'rangliste') z), 'Rangliste: nach Punkten, mit Name, Bild, Rahmen und Rang – ohne Kennungen der Konten');
select pg_temp.ok(jsonb_array_length(:'st'::jsonb->'chronik') = 2 and (:'st'::jsonb->'chronik'->0->>'delta')::integer = -15 and :'st'::jsonb->'chronik'->0->>'grund' = 'aufgabe' and :'st'::jsonb->'chronik'->0->>'gegner' is not null, 'Chronik: die eigenen letzten Kämpfe mit Gegner, Ausgang und Punkten');
select pg_temp.als('A');
select pg_temp.ok(jsonb_array_length(public.rpg_ranked_status()->'chronik') = 3 and (public.rpg_ranked_status()->'ich'->>'platz')::integer = 3, 'Anna sieht ihre drei Kämpfe und ihren Platz');

-- ---------- Saisonende ----------
select pg_temp.fehler('select public.rpg_admin_ranked_end()', 'Nur Admins', 'Ein Spieler kann die Saison nicht beenden');
select pg_temp.als('X');
select pg_temp.ok((public.rpg_admin_ranked()->0->>'spieler')::integer = 4 and (public.rpg_admin_ranked()->0->>'gegen_bot')::integer = 2, 'Admin sieht die Saison: Spieler, Kämpfe, davon gegen den Rechner-Gegner');
select pg_temp.fehler('select public.rpg_admin_ranked_start(''Season 1'', 42)', 'läuft noch', 'Eine neue Saison beginnt erst, wenn die laufende beendet ist');
select public.rpg_admin_ranked_end() as e1 \gset
select pg_temp.ok((:'e1'::jsonb->>'belohnt')::integer = 4 and (:'e1'::jsonb->>'seelensplitter')::integer = 1200 + 150 + 150 + 150, 'Saison beendet: vier Konten belohnt (Meister 1200, dreimal Bronze 150)');
reset role;
select pg_temp.ok((select count(*) = 2 from public.rpg_cosmetic_owned where user_id = '00000000-0000-0000-0000-0000000022a4' and item_id in ('w_s0_meister', 'r_s0_meister'))
  and (select count(*) = 2 from public.rpg_cosmetic_owned where user_id = '00000000-0000-0000-0000-0000000022a3' and item_id in ('w_s0_bronze', 'r_s0_bronze'))
  and not exists (select 1 from public.rpg_cosmetic_owned where user_id = '00000000-0000-0000-0000-0000000022a5' and item_id like '%s0%'), 'Würfel und Rahmen nach dem höchsten erreichten Rang (Dora: Meister, obwohl sie zuletzt Punkte verlor); wer nicht gespielt hat, bekommt nichts');
set role authenticated;
select pg_temp.fehler('select public.rpg_admin_ranked_end()', 'läuft keine', 'Zweimal beenden geht nicht (keine doppelte Belohnung)');
select pg_temp.als('A');
select pg_temp.fehler('select public.rpg_ranked_queue()', 'keine Ranked-Saison', 'Ohne laufende Saison keine Ranked-Suche');
select pg_temp.ok(not (public.rpg_ranked_status()->'saison'->>'laeuft')::boolean and jsonb_array_length(public.rpg_ranked_status()->'rangliste') = 4, 'Die Rangliste der beendeten Saison bleibt sichtbar');
select pg_temp.ok((select count(*) = 1 from jsonb_array_elements(public.rpg_cosmetics()->'katalog') k where k->>'id' = 'w_s0_bronze') or public.rpg_cosmetics()->'besitz' ? 'w_s0_bronze', 'Die Belohnung erscheint in der eigenen Ausstattung');
select pg_temp.fehler('select public.rpg_cosmetic_buy(''w_s0_meister'')', 'führt der Händler nicht', 'Rang-Stücke sind nicht käuflich');
select pg_temp.als('X');
select pg_temp.ok(public.rpg_admin_ranked_start('Season 1', 42)->>'name' = 'Season 1', 'Die nächste Saison beginnt');
select pg_temp.als('A');
select pg_temp.ok((public.rpg_ranked_status()->'ich'->>'punkte')::integer = 0 and public.rpg_ranked_status()->'saison'->>'name' = 'Season 1', 'In der neuen Saison beginnen alle wieder bei 0');
reset role;
select pg_temp.ok(not has_function_privilege('authenticated', 'public.rpg_ranked_werten(uuid)', 'execute') and not has_function_privilege('anon', 'public.rpg_ranked_status()', 'execute') and has_function_privilege('authenticated', 'public.rpg_ranked_queue()', 'execute'), 'Rechte: Wertung nur intern, Suche und Übersicht nur für angemeldete Nutzer');
