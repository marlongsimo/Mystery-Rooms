-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 008 (Arena und Währung).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-0000000008a1', false),  -- A: Ersteller, alle Helden, Torvald auf Stufe 6
  ('00000000-0000-0000-0000-0000000008a2', false),  -- B: Gegner, alle Helden auf Stufe 1
  ('00000000-0000-0000-0000-0000000008a3', false),  -- C: Dritter mit Konto
  ('00000000-0000-0000-0000-0000000008a4', true);   -- G: Gast
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000008a1', 'Arenaheld'), ('00000000-0000-0000-0000-0000000008a2', 'Gegnerin'), ('00000000-0000-0000-0000-0000000008a3', 'Dritter');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select u, hero_id, 'code' from public.rpg_hero_catalog, (values ('00000000-0000-0000-0000-0000000008a1'::uuid), ('00000000-0000-0000-0000-0000000008a2'::uuid)) v(u);
insert into public.rpg_hero_collection (user_id, hero_id, quelle) values ('00000000-0000-0000-0000-0000000008a3', 'trickser', 'start');
insert into public.rpg_hero_progress (user_id, hero_id, xp) values ('00000000-0000-0000-0000-0000000008a1', 'schildwaechter', 1350);
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', case p when 'A' then '00000000-0000-0000-0000-0000000008a1' when 'B' then '00000000-0000-0000-0000-0000000008a2'
  when 'C' then '00000000-0000-0000-0000-0000000008a3' when 'G' then '00000000-0000-0000-0000-0000000008a4' else '' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;

-- ---------- Rechenregeln ----------
select pg_temp.ok(public.rpg_arena_xp(8, 8, true) = 25 and public.rpg_arena_xp(8, 1, true) = 95 and public.rpg_arena_xp(8, 10, true) = 15 and public.rpg_arena_xp(8, 8, false) = 8 and public.rpg_arena_xp(8, 1, false) = 32
  and public.rpg_arena_xp(10, 1, true) = 100 and public.rpg_arena_xp(1, 9, true) = 5 and public.rpg_arena_xp(5, 10, true) = 5, 'XP: 25 auf der Kampfstufe, +10 je Stufe darunter (höchstens 100), −5 je Stufe darüber (mindestens 5), Niederlage ein Drittel');

set role authenticated;
select pg_temp.als('A');
select pg_temp.fehler('select * from public.rpg_arena_matches', 'permission denied', 'Kämpfe sind nicht direkt lesbar');
select pg_temp.fehler('update public.rpg_wallet set betrag = 9999', 'permission denied', 'Währung ist nicht direkt schreibbar');
select pg_temp.fehler('select public.rpg_arena_create(array[''schildwaechter'', ''trickser''])', 'genau drei', 'Aufstellung braucht genau drei Helden');
select pg_temp.fehler('select public.rpg_arena_create(array[''schildwaechter'', ''trickser'', ''trickser''])', 'genau drei', 'Kein Held doppelt im eigenen Team');
select public.rpg_arena_create(array['schildwaechter', 'trickser', 'lichtbringer']) as m1 \gset
select pg_temp.ok((:'m1'::jsonb->'host'->>'schnitt')::numeric = 2.7 and :'m1'::jsonb->>'status' = 'offen' and (:'m1'::jsonb->'host'->'team'->0->>'stufe')::int = 6, 'Erstellt: Stufen 6, 1, 1 → Schnitt 2,7');
select (:'m1'::jsonb->>'id') as id1 \gset
select pg_temp.ok(jsonb_array_length(public.rpg_arena_list()->'offen') = 0 and public.rpg_arena_list()->'mein'->>'id' = :'id1', 'Eigener Kampf steht unter „mein“, nicht in der offenen Liste');

select pg_temp.als('C');
select pg_temp.ok(jsonb_array_length(public.rpg_arena_list()->'offen') = 1 and public.rpg_arena_list()->'offen'->0->>'name' = 'Arenaheld' and (public.rpg_arena_list()->'offen'->0->>'schnitt')::numeric = 2.7
  and not (public.rpg_arena_list()->'offen'->0 ? 'team') and not (public.rpg_arena_list()::text ~ 'schildwaechter'), 'Andere sehen nur Namen und Durchschnittsstufe, nicht die Helden');
select pg_temp.fehler(format('select public.rpg_arena_get(%L)', :'id1'), 'gibt es nicht', 'Unbeteiligte können die Aufstellung nicht abfragen');
select pg_temp.fehler(format('select public.rpg_arena_join(%L, array[''trickser'', ''berserker'', ''duellant''])', :'id1'), 'nicht alle zu deiner Sammlung', 'Beitritt nur mit eigenen Helden');
select pg_temp.als('G');
select pg_temp.ok(public.rpg_arena_list() = '{"konto": false}'::jsonb, 'Gäste haben keine Arena');

select pg_temp.als('B');
select pg_temp.fehler(format('select public.rpg_arena_join(%L, array[''trickser'', ''berserker'', ''duellant''])', :'id1'), 'zu weit', 'Schnitt 1,0 gegen 2,7: außerhalb der Spanne');
reset role; insert into public.rpg_hero_progress (user_id, hero_id, xp) values ('00000000-0000-0000-0000-0000000008a2', 'berserker', 600), ('00000000-0000-0000-0000-0000000008a2', 'duellant', 100); set role authenticated;
select public.rpg_arena_join(:'id1', array['trickser', 'berserker', 'duellant']) as j1 \gset
select pg_temp.ok(:'j1'::jsonb->>'status' = 'bereit' and (:'j1'::jsonb->>'seite')::int = 2 and (:'j1'::jsonb->'gast'->>'schnitt')::numeric = 2.3 and :'j1'::jsonb->'host'->'team'->0->>'held' = 'schildwaechter'
  and :'j1'::jsonb->>'karte' is not null and :'j1'::jsonb->>'begegnung' is not null and (:'j1'::jsonb->>'kampfstufe')::int = 3, 'Beitritt: Schnitt 2,3 passt; beide Aufstellungen sichtbar, Karte und Monster gelost, Kampfstufe 3');
select pg_temp.als('C');
select pg_temp.fehler(format('select public.rpg_arena_join(%L, array[''trickser'', ''trickser'', ''trickser''])', :'id1'), 'genau drei|gibt es nicht mehr', 'Ein vergebener Kampf ist nicht mehr beitretbar');
select pg_temp.ok(jsonb_array_length(public.rpg_arena_list()->'offen') = 0, 'Vergebener Kampf verschwindet aus der Übersicht');

select pg_temp.als('B');
select pg_temp.fehler(format('select public.rpg_arena_room(%L, ''ABCD'')', :'id1'), 'gibt es nicht', 'Nur der Ersteller startet den Kampf');
select pg_temp.fehler(format('select public.rpg_arena_report(%L, 2, ''team'')', :'id1'), 'läuft nicht', 'Vor dem Start gibt es kein Ergebnis');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_arena_room(:'id1', 'ABCD')->>'status' = 'laeuft', 'Ersteller hinterlegt die Verbindung: Kampf läuft');
select pg_temp.ok(public.rpg_arena_get(:'id1')->'gast'->'team'->1->>'held' = 'berserker' and (public.rpg_arena_get(:'id1')->'gast'->'team'->1->>'stufe')::int = 4, 'Ersteller sieht die Aufstellung des Gegners mit Stufen');
-- Ergebnis: erst wenn beide dasselbe melden, und nicht in den ersten zwei Minuten
reset role; update public.rpg_arena_matches set started_at = now() - interval '10 minutes' where id = :'id1'; set role authenticated;
select pg_temp.ok(public.rpg_arena_report(:'id1', 1, 'team', '{"1": 15, "2": 5}'::jsonb, 7)->>'status' = 'laeuft', 'Eine Meldung allein beendet den Kampf nicht');
select pg_temp.als('B');
select public.rpg_arena_report(:'id1', 1, 'team', '{"1": 15, "2": 5}'::jsonb, 7) as r1 \gset
select pg_temp.ok(:'r1'::jsonb->>'status' = 'beendet' and (:'r1'::jsonb->>'sieger')::int = 1 and not (:'r1'::jsonb->'belohnung'->>'sieg')::boolean and (:'r1'::jsonb->'belohnung'->>'waehrung')::int = 0, 'Beide melden Sieg für den Ersteller: beendet; die Verliererin bekommt keine Währung');
select pg_temp.ok((select (h->>'xp')::int from jsonb_array_elements(:'r1'::jsonb->'belohnung'->'xp') h where h->>'held' = 'trickser') = 15
  and (select (h->>'xp')::int from jsonb_array_elements(:'r1'::jsonb->'belohnung'->'xp') h where h->>'held' = 'berserker') = 7, 'Niederlage auf Kampfstufe 3: Stufe-1-Heldin 15 XP, Stufe-4-Held 7 XP');
select pg_temp.als('A');
select public.rpg_arena_get(:'id1') as g1 \gset
select pg_temp.ok((:'g1'::jsonb->'belohnung'->>'sieg')::boolean and (:'g1'::jsonb->'belohnung'->>'waehrung')::int = 25 and (public.rpg_my_wallet()->>'waehrung')::int = 25 and (public.rpg_arena_list()->>'waehrung')::int = 25 and (public.rpg_arena_list()->>'heute')::int = 1, 'Sieger: 25 Währung, ein gewerteter Kampf heute');
select pg_temp.ok((select (h->>'xp')::int from jsonb_array_elements(:'g1'::jsonb->'belohnung'->'xp') h where h->>'held' = 'trickser') = 45
  and (select (h->>'xp')::int from jsonb_array_elements(:'g1'::jsonb->'belohnung'->'xp') h where h->>'held' = 'schildwaechter') = 10
  and (public.rpg_hero_levels()->'xp'->>'trickser')::int = 45, 'Sieg auf Kampfstufe 3: Stufe-1-Heldin 45 XP, Stufe-6-Held 10 XP; im Fortschritt gebucht');
select pg_temp.ok(public.rpg_arena_report(:'id1', 2, 'team')->>'status' = 'beendet' and (public.rpg_my_wallet()->>'waehrung')::int = 25, 'Nachträgliche Meldung ändert nichts mehr');

-- ---------- Widerspruch, Aufgabe, Obergrenze ----------
select public.rpg_arena_create(array['schildwaechter', 'trickser', 'lichtbringer'])->>'id' as id2 \gset
select pg_temp.als('B'); select public.rpg_arena_join(:'id2', array['trickser', 'berserker', 'duellant']);
select pg_temp.als('A'); select public.rpg_arena_room(:'id2', 'EFGH');
reset role; update public.rpg_arena_matches set started_at = now() - interval '10 minutes' where id = :'id2'; set role authenticated;
select public.rpg_arena_report(:'id2', 1, 'punkte');
select pg_temp.als('B');
select pg_temp.ok(public.rpg_arena_report(:'id2', 2, 'punkte')->>'status' = 'abgebrochen' and (public.rpg_my_wallet()->>'waehrung')::int = 0, 'Widersprüchliche Meldungen: ohne Wertung beendet');

select pg_temp.als('A'); select public.rpg_arena_create(array['schildwaechter', 'trickser', 'lichtbringer'])->>'id' as id3 \gset
select pg_temp.als('B'); select public.rpg_arena_join(:'id3', array['trickser', 'berserker', 'duellant']);
select pg_temp.als('A'); select public.rpg_arena_room(:'id3', 'IJKL');
select pg_temp.als('B');
select public.rpg_arena_cancel(:'id3') as c3 \gset
select pg_temp.ok(:'c3'::jsonb->>'grund' = 'aufgabe' and (:'c3'::jsonb->>'sieger')::int = 1 and jsonb_array_length(:'c3'::jsonb->'belohnung'->'xp') = 0 and not (:'c3'::jsonb->'belohnung'->>'gewertet')::boolean, 'Aufgabe: Der andere gewinnt, wer aufgibt, bekommt nichts');
select pg_temp.als('A');
select pg_temp.ok((public.rpg_my_wallet()->>'waehrung')::int = 50 and (public.rpg_arena_get(:'id3')->'belohnung'->>'gewertet')::boolean, 'Sieg durch Aufgabe: Währung und XP für den, der bleibt');
reset role;
select pg_temp.ok(not exists (select 1 from public.rpg_hero_offers where campaign_id = :'id3'), 'Sieg durch Aufgabe: keine Heldenchance');
-- Obergrenze: fünf gewertete Kämpfe am Tag
insert into public.rpg_arena_matches (id, status, host_id, host_name, host_team, host_schnitt) select gen_random_uuid(), 'beendet', '00000000-0000-0000-0000-0000000008a1', 'x', '[]'::jsonb, 1 from generate_series(1, 3);
insert into public.rpg_arena_rewards (match_id, user_id, sieg, gewertet) select id, '00000000-0000-0000-0000-0000000008a1', true, true from public.rpg_arena_matches where host_name = 'x';
set role authenticated;
select pg_temp.als('A'); select public.rpg_arena_create(array['schildwaechter', 'trickser', 'lichtbringer'])->>'id' as id4 \gset
select pg_temp.als('B'); select public.rpg_arena_join(:'id4', array['trickser', 'berserker', 'duellant']);
select pg_temp.als('A'); select public.rpg_arena_room(:'id4', 'MNOP');
select pg_temp.als('B'); select public.rpg_arena_cancel(:'id4');
select pg_temp.als('A');
select pg_temp.ok((public.rpg_arena_list()->>'heute')::int = 5 and (public.rpg_my_wallet()->>'waehrung')::int = 50 and not (public.rpg_arena_get(:'id4')->'belohnung'->>'gewertet')::boolean, 'Sechster Kampf des Tages: keine Belohnung mehr');
-- Ein offener Kampf lässt sich verwerfen
select public.rpg_arena_create(array['schildwaechter', 'trickser', 'lichtbringer'])->>'id' as id5 \gset
select public.rpg_arena_cancel(:'id5')->>'status' as s5 \gset
select pg_temp.ok(:'s5' = 'abgebrochen' and public.rpg_arena_list()->'mein' = 'null'::jsonb, 'Offener Kampf: verwerfen');
reset role;
