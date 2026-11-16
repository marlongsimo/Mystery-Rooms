-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 019 (Arena: Rechner-Gegner nach etwa 30 Sekunden).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000019a1', false), ('00000000-0000-0000-0000-0000000019a2', false), ('00000000-0000-0000-0000-0000000019a3', false);
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000019a1', 'Rech_A'), ('00000000-0000-0000-0000-0000000019a2', 'Rech_B'), ('00000000-0000-0000-0000-0000000019a3', 'Rech_C');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select u.id, hero_id, 'code' from public.rpg_hero_catalog, (select id from auth.users where id::text like '00000000-0000-0000-0000-0000000019a%') u;
insert into public.rpg_arena_squads (user_id, team) select id, array['schildwaechter', 'trickser', 'lichtbringer'] from auth.users where id::text like '00000000-0000-0000-0000-0000000019a%';
-- A: Stufen 6, 1 und 10 (Durchschnitt 5,7)
insert into public.rpg_hero_progress (user_id, hero_id, xp) values ('00000000-0000-0000-0000-0000000019a1', 'schildwaechter', 1350), ('00000000-0000-0000-0000-0000000019a1', 'lichtbringer', 99999);
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000019a' || case p when 'A' then '1' when 'B' then '2' else '3' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
set role authenticated;

-- ---------- Suche: erst nach etwa 30 Sekunden kommt der Rechner-Gegner ----------
select pg_temp.als('A');
select public.rpg_arena_queue('normal') as a1 \gset
select public.rpg_arena_queue('normal') as a2 \gset
select pg_temp.ok(:'a1'::jsonb->>'status' = 'offen' and :'a2'::jsonb->>'status' = 'offen' and :'a2'::jsonb->'gast' = 'null'::jsonb, 'Suche beginnt: offen, noch kein Gegner');
reset role;
update public.rpg_arena_search_srv set seit = now() - interval '20 seconds' where match_id = (:'a1'::jsonb->>'id')::uuid;
set role authenticated;
select pg_temp.ok(public.rpg_arena_queue('normal')->>'status' = 'offen', 'Nach 20 Sekunden: weiter offen');
-- unterbrochene Suche (lange kein Lebenszeichen): Die Wartezeit beginnt neu
reset role;
update public.rpg_arena_search_srv set seit = now() - interval '5 minutes', seen_at = now() - interval '4 minutes' where match_id = (:'a1'::jsonb->>'id')::uuid;
set role authenticated;
select pg_temp.ok(public.rpg_arena_queue('normal')->>'status' = 'offen', 'War die Suche unterbrochen, beginnt die Wartezeit neu (kein Gegner sofort)');
reset role;
update public.rpg_arena_search_srv set seit = now() - interval '40 seconds' where match_id = (:'a1'::jsonb->>'id')::uuid;
set role authenticated;
select public.rpg_arena_queue('normal') as a3 \gset
select pg_temp.ok(:'a3'::jsonb->>'status' = 'bereit' and :'a3'::jsonb->>'id' = :'a1'::jsonb->>'id' and (:'a3'::jsonb->>'seite')::integer = 1, 'Nach 40 Sekunden: Der Kampf ist bereit, der Spieler ist Seite 1');
select pg_temp.ok(:'a3'::jsonb->'gast'->>'name' ~ '^[A-Za-z0-9_ÄÖÜäöüß]{3,20}$' and :'a3'::jsonb->'gast'->>'name' !~* 'bot|rechner|computer|ki_' and jsonb_array_length(:'a3'::jsonb->'gast'->'team') = 3,
  'Der Gegner hat einen Namen wie ein Benutzername (' || (:'a3'::jsonb->'gast'->>'name') || ') und drei Helden');
reset role;
select pg_temp.ok((select count(distinct e->>'held') = 3 and bool_and(exists (select 1 from public.rpg_hero_catalog c where c.hero_id = e->>'held')) from jsonb_array_elements(:'a3'::jsonb->'gast'->'team') e), 'Drei verschiedene Helden aus dem Katalog');
set role authenticated;
select pg_temp.ok(abs((:'a3'::jsonb->'gast'->>'schnitt')::numeric - (:'a3'::jsonb->'host'->>'schnitt')::numeric) <= 1.0
  and (select bool_and(g.s between h.s - 1 and h.s) from (select (e->>'stufe')::integer s, row_number() over (order by (e->>'stufe')::integer) n from jsonb_array_elements(:'a3'::jsonb->'gast'->'team') e) g
       join (select (e->>'stufe')::integer s, row_number() over (order by (e->>'stufe')::integer) n from jsonb_array_elements(:'a3'::jsonb->'host'->'team') e) h using (n)),
  'Stufen wie beim Spieler: Durchschnitt ' || (:'a3'::jsonb->'gast'->>'schnitt') || ' gegen ' || (:'a3'::jsonb->'host'->>'schnitt') || ', je Held gleich oder eine Stufe darunter, nie darüber');
select pg_temp.ok(:'a3'::jsonb->>'karte' is not null and :'a3'::jsonb->>'begegnung' is not null and (:'a3'::jsonb->>'seed') is not null, 'Karte, Monster und Startwert sind gelost');
select pg_temp.ok(public.rpg_arena_get((:'a1'::jsonb->>'id')::uuid)->'gast'->>'name' = :'a3'::jsonb->'gast'->>'name' and public.rpg_arena_queue('normal')->>'id' = :'a1'::jsonb->>'id', 'Der Kampf lässt sich abrufen; die Suche führt zu ihm zurück');
select public.rpg_arena_fight((:'a1'::jsonb->>'id')::uuid, 0) as f1 \gset
select pg_temp.ok((:'f1'::jsonb->>'server')::boolean and :'f1'::jsonb->>'modus' = 'duell' and :'f1'::text !~* 'bot', 'Serverkampf im Modus Duell; die Sicht des Spielers nennt den Rechner-Gegner nicht');
select public.rpg_arena_looks((:'a1'::jsonb->>'id')::uuid) as l1 \gset
select pg_temp.ok(:'l1'::jsonb->'gast'->>'name' = :'a3'::jsonb->'gast'->>'name' and :'l1'::jsonb->'gast'->>'avatar' ~ '^[a-z]{5,20}$' and :'l1'::jsonb->'host'->>'name' = 'Rech_A',
  'Der Gegner hat ein Profilbild (' || (:'l1'::jsonb->'gast'->>'avatar') || ')' || coalesce(' und den Rahmen ' || (:'l1'::jsonb->'gast'->>'rahmen'), ''));
select pg_temp.fehler('select public.rpg_arena_bot(''' || (:'a1'::jsonb->>'id') || ''', ''normal'')', 'permission denied', 'Die innere Funktion ist nicht direkt aufrufbar');
select pg_temp.als('B');
select pg_temp.fehler('select public.rpg_arena_get(''' || (:'a1'::jsonb->>'id') || ''')', 'gibt es nicht', 'Ein Unbeteiligter sieht den Kampf nicht');
reset role;
select pg_temp.ok((select guest_id is null and status = 'bereit' from public.rpg_arena_matches where id = (:'a1'::jsonb->>'id')::uuid) and (select bot is not null from public.rpg_arena_fights where match_id = (:'a1'::jsonb->>'id')::uuid)
  and not exists (select 1 from public.rpg_arena_search_srv where match_id = (:'a1'::jsonb->>'id')::uuid), 'In der Datenbank: kein Konto am Kampf, Serverkampf als Rechner-Gegner vermerkt, Suche beendet');
select pg_temp.ok((select count(*) from auth.users) = (select count(*) from auth.users where id is not null) and not exists (select 1 from public.rpg_profiles where handle = :'a3'::jsonb->'gast'->>'name'), 'Es wurde kein Konto und kein Profil angelegt');

-- ---------- Edge Function: laden, speichern, beenden ----------
select public.rpg_arena_srv_load((:'a1'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000019a1') as s1 \gset
select pg_temp.ok((:'s1'::jsonb->>'seite')::integer = 1 and (:'s1'::jsonb->'match'->>'bot')::boolean and :'s1'::jsonb->'match'->>'modus' = 'duell' and jsonb_array_length(:'s1'::jsonb->'match'->'guest_team') = 3, 'Die Edge Function erfährt: Team 2 spielt der Server');
select pg_temp.ok(public.rpg_arena_srv_load((:'a1'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000019a2') is null and public.rpg_arena_srv_load((:'a1'::jsonb->>'id')::uuid, null) is null, 'Für ein fremdes Konto und für „kein Konto“ gibt die Datenbank den Kampf nicht heraus');
select pg_temp.ok(public.rpg_arena_srv_save((:'a1'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000019a1', 0, '{"ende": "arena", "runde": 4, "arena": {"sieger": 1, "grund": "Das Team von X liegt am Boden.", "punkte": {"1": 15, "2": 5}}}', '[{"sicht1": {}, "sicht2": {}}]'), 'Stand speichern');
select pg_temp.ok(public.rpg_arena_srv_end((:'a1'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000019a1'), 'Kampf beenden: kein Fehler, obwohl der Gegner kein Konto hat');
select pg_temp.ok((select status = 'beendet' and sieger = 1 from public.rpg_arena_matches where id = (:'a1'::jsonb->>'id')::uuid)
  and (select sieg and gewertet and waehrung = 25 from public.rpg_arena_rewards where match_id = (:'a1'::jsonb->>'id')::uuid and user_id = '00000000-0000-0000-0000-0000000019a1')
  and (select count(*) = 1 from public.rpg_arena_rewards where match_id = (:'a1'::jsonb->>'id')::uuid), 'Der Sieg wird für den Spieler gewöhnlich gewertet (25 Seelensplitter); für den Gegner wird nichts gebucht');

-- ---------- Arcade, Aufgeben, Mensch geht vor ----------
set role authenticated;
select pg_temp.als('A');
select public.rpg_arena_queue('arcade') as c1 \gset
reset role; update public.rpg_arena_search_srv set seit = now() - interval '40 seconds' where match_id = (:'c1'::jsonb->>'id')::uuid; set role authenticated;
select public.rpg_arena_queue('arcade') as c2 \gset
select pg_temp.ok(:'c2'::jsonb->>'status' = 'bereit' and public.rpg_arena_fight((:'c1'::jsonb->>'id')::uuid, 0)->>'modus' in ('arena', 'koenig', 'horde'), 'Arcade: Rechner-Gegner mit ausgelostem Modus');
reset role;
select pg_temp.ok(public.rpg_arena_srv_save((:'c1'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000019a1', 0, '{"runde": 1, "arena": {}}', '[{"sicht1": {}, "sicht2": {}}]'), 'Kampf läuft');
set role authenticated;
select pg_temp.ok(public.rpg_arena_cancel((:'c1'::jsonb->>'id')::uuid)->>'status' = 'beendet', 'Aufgeben gegen den Rechner-Gegner: kein Fehler, Kampf beendet');
select pg_temp.ok((public.rpg_arena_get((:'c1'::jsonb->>'id')::uuid)->>'sieger')::integer = 2 and public.rpg_arena_get((:'c1'::jsonb->>'id')::uuid)->'belohnung'->>'gewertet' = 'false', '… Niederlage ohne Belohnung, wie gegen einen Menschen');
-- Ein Mensch in der Warteschlange geht vor – auch wenn die eigene Suche schon lange läuft
select pg_temp.als('B');
select public.rpg_arena_queue('normal') as b1 \gset
reset role; update public.rpg_arena_search_srv set seit = now() - interval '40 seconds' where match_id = (:'b1'::jsonb->>'id')::uuid; update public.rpg_arena_matches set created_at = now() - interval '1 second' where id = (:'b1'::jsonb->>'id')::uuid; set role authenticated;
select pg_temp.als('C');
select public.rpg_arena_queue('normal') as d1 \gset
select pg_temp.ok(:'d1'::jsonb->>'id' = :'b1'::jsonb->>'id' and :'d1'::jsonb->'host'->>'name' = 'Rech_B' and :'d1'::jsonb->'gast'->>'name' = 'Rech_C', 'Sucht gleichzeitig ein Mensch, treffen die beiden Menschen aufeinander');
reset role;
select pg_temp.ok(not (public.rpg_arena_srv_load((:'b1'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000019a2')->'match'->>'bot')::boolean and (select bot is null from public.rpg_arena_fights where match_id = (:'b1'::jsonb->>'id')::uuid), '… und dieser Kampf ist kein Rechner-Kampf');
update public.rpg_arena_matches set status = 'abgebrochen' where id = (:'b1'::jsonb->>'id')::uuid;

-- ---------- Viele Gegner: Namen, Stufen, Helden ----------
create temp table pg_temp_namen (name text, ok boolean);
do $$
declare v_id uuid; v_j jsonb; i integer;
begin
  for i in 1..60 loop
    insert into public.rpg_arena_matches (status, host_id, host_name, host_team, host_schnitt)
      values ('offen', '00000000-0000-0000-0000-0000000019a3', 'Rech_C', jsonb_build_array(jsonb_build_object('held', 'trickser', 'stufe', 1 + i % 10), jsonb_build_object('held', 'berserker', 'stufe', 1 + (i * 3) % 10), jsonb_build_object('held', 'gelehrter', 'stufe', 10)), 5) returning id into v_id;
    update public.rpg_arena_matches set host_schnitt = public.rpg_arena_schnitt(host_team) where id = v_id;
    v_j := public.rpg_arena_bot(v_id, case when i % 2 = 0 then 'normal' else 'arcade' end);
    insert into pg_temp_namen values (v_j->'gast'->>'name', v_j is not null and (v_j->'gast'->>'schnitt')::numeric between (v_j->'host'->>'schnitt')::numeric - 1.0 and (v_j->'host'->>'schnitt')::numeric
      and (select count(distinct e->>'held') = 3 and bool_and((e->>'stufe')::integer between 1 and 10) from jsonb_array_elements(v_j->'gast'->'team') e));
    update public.rpg_arena_matches set status = 'abgebrochen' where id = v_id;
  end loop;
end $$;
select pg_temp.ok((select bool_and(ok) and bool_and(name ~ '^[A-Za-z0-9_ÄÖÜäöüß]{3,20}$') and bool_and(name !~* 'bot') from pg_temp_namen), '60 weitere Gegner: gültige Namen, drei verschiedene Helden, Stufen 1 bis 10, Durchschnitt im erlaubten Bereich');
select pg_temp.ok((select count(distinct name) >= 40 from pg_temp_namen), 'Die Namen wechseln (' || (select count(distinct name) from pg_temp_namen) || ' verschiedene unter 60; z. B. ' || (select string_agg(name, ', ') from (select name from pg_temp_namen limit 8) t) || ')');
select pg_temp.ok(has_function_privilege('authenticated', 'public.rpg_arena_queue(text)', 'execute') and not has_function_privilege('anon', 'public.rpg_arena_queue(text)', 'execute')
  and not has_function_privilege('authenticated', 'public.rpg_arena_bot(uuid, text)', 'execute') and not has_function_privilege('authenticated', 'public.rpg_arena_srv_load(uuid, uuid)', 'execute'), 'Rechte: Suche nur für angemeldete Nutzer, die inneren Funktionen für niemanden von außen');
