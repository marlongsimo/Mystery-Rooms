-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 004 (Spieltisch-Geräte, Kampagnen-Links).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000c1', false), ('00000000-0000-0000-0000-0000000000c2', true),
  ('00000000-0000-0000-0000-0000000000c3', true), ('00000000-0000-0000-0000-0000000000c4', true), ('00000000-0000-0000-0000-0000000000c5', true);
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', case p when 'H' then '00000000-0000-0000-0000-0000000000c1' when 'T' then '00000000-0000-0000-0000-0000000000c2' when 'S' then '00000000-0000-0000-0000-0000000000c3' when 'F' then '00000000-0000-0000-0000-0000000000c4' when 'T2' then '00000000-0000-0000-0000-0000000000c5' else '' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if b then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end; raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
-- Live-Räume: T ist Host von Raum 1, T2 von Raum 2
insert into public.game_sessions (id, game_slug, room_code, host_id) values ('22222222-2222-2222-2222-222222222221', 'abenteuer', 'ABEN-TISCH1', '00000000-0000-0000-0000-0000000000c2'), ('22222222-2222-2222-2222-222222222222', 'abenteuer', 'ABEN-TISCH2', '00000000-0000-0000-0000-0000000000c5');
insert into public.session_players (session_id, user_id, player_name, is_host) values ('22222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-0000000000c2', 'Spieltisch', true), ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000c5', 'Spieltisch', true);
set role authenticated;

select pg_temp.als('H'); select public.rpg_set_profile('Hosti');
select public.rpg_create_campaign('Tischtest', 'hardcore') as k \gset
select pg_temp.ok(public.rpg_rename_campaign(:'k', 'Grauwacht am Freitag') = 'Grauwacht am Freitag', 'Host benennt die Kampagne um');
select public.rpg_create_link(:'k', 'gast') as gast \gset
select public.rpg_create_link(:'k', 'tisch') as tisch \gset
select pg_temp.ok(:'gast' ~ '^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$' and :'gast' <> :'tisch', 'Gast- und Tisch-Code erzeugt (Format XXXX-XXXX-XXXX, verschieden)');
select pg_temp.ok(public.rpg_link_info(lower(replace(:'gast', '-', ' '))) is not null, 'Code klein und mit Leerzeichen eingegeben: gilt trotzdem');
reset role; select pg_temp.ok((select count(*) from public.rpg_links where token_hash = :'gast') = 0, 'In der Datenbank liegt nur der Hash'); set role authenticated;

-- Fremde und falsche Links
select pg_temp.als('F');
select pg_temp.fehler(format('select public.rpg_create_link(%L, %L)', :'k', 'gast'), 'Nur der Host oder der Spieltisch', 'Fremder kann keine Links erzeugen');
select pg_temp.ok(public.rpg_link_info('falsch') is null, 'Ungültiger Link: nichts');
select pg_temp.ok(public.rpg_link_info(:'gast')->>'titel' = 'Grauwacht am Freitag' and (public.rpg_link_info(:'gast')->>'tisch_verbunden')::boolean = false, 'Link-Info: Titel, Tisch noch nicht verbunden');
select pg_temp.fehler(format('select public.rpg_claim_table(%L)', :'gast'), 'Tisch-Link', 'Gast-Link macht niemanden zum Tisch');

-- Handy tritt per Gast-Link bei, bevor der Tisch da ist
select pg_temp.als('S');
select pg_temp.ok((public.rpg_join_as_guest(:'gast', 'Sina')->>'raum') is null, 'Gast tritt bei: noch kein Raum (Tisch fehlt)');
select pg_temp.ok(public.rpg_my_campaigns()->0->>'role' = 'spieler', 'Gast ist Mitspieler');
select pg_temp.fehler(format('select public.rpg_save_snapshot(%L, 0, %L)', :'k', '{}'), 'Nur der Spieltisch', 'Mitspieler kann nicht speichern');

-- Tablet ohne Konto wird per Tisch-Link zum Spieltisch
select pg_temp.als('T');
select pg_temp.ok((public.rpg_claim_table(:'tisch')->>'difficulty') = 'hardcore', 'Tisch-Gerät übernimmt (Schwierigkeit hardcore mitgeliefert)');
select pg_temp.fehler(format('select public.rpg_claim_table(%L)', :'tisch'), 'abgelaufen oder ungültig', 'Tisch-Link gilt nur einmal');
select public.rpg_start_session(:'k', '22222222-2222-2222-2222-222222222221');
select pg_temp.ok(public.rpg_save_snapshot(:'k', 0, '{"szene":"prolog"}') = 1, 'Tisch-Gerät speichert');
select pg_temp.fehler(format('select public.rpg_delete_campaign(%L)', :'k'), 'Nur der Host', 'Tisch-Gerät kann nicht löschen');
select pg_temp.fehler(format('select public.rpg_set_campaign_status(%L, %L)', :'k', 'archiviert'), 'Nur der Host', 'Tisch-Gerät kann nicht archivieren');
select pg_temp.ok(public.rpg_set_campaign_status(:'k', 'pausiert') = 'pausiert', 'Tisch-Gerät kann pausieren');
select public.rpg_start_session(:'k', '22222222-2222-2222-2222-222222222221');
select pg_temp.fehler(format('select public.rpg_start_session(%L, %L)', :'k', '22222222-2222-2222-2222-222222222222'), 'nicht Host dieser Live-Sitzung', 'Fremden Raum kann der Tisch nicht nutzen');

-- Gast findet den Raum jetzt von selbst
select pg_temp.als('S');
select pg_temp.ok(public.rpg_join_as_guest(:'gast', 'Sina')->>'raum' = 'ABEN-TISCH1', 'Gast-Link liefert jetzt den Raumcode des Tischs');
select pg_temp.ok(public.rpg_campaign_room(:'k') = 'ABEN-TISCH1', 'Mitspieler: Raumcode über die Kampagne');
select pg_temp.als('F');
select pg_temp.fehler(format('select public.rpg_campaign_room(%L)', :'k'), 'gehörst nicht', 'Fremder bekommt keinen Raumcode');

-- Tisch wechselt auf ein anderes Gerät
select pg_temp.als('H'); select public.rpg_create_link(:'k', 'tisch') as tisch2 \gset
select pg_temp.als('T2');
select public.rpg_claim_table(:'tisch2');
select public.rpg_start_session(:'k', '22222222-2222-2222-2222-222222222222');
select pg_temp.ok(public.rpg_save_snapshot(:'k', 1, '{"szene":"halmbruck"}') = 2, 'Neuer Tisch speichert weiter');
select pg_temp.als('T');
select pg_temp.fehler(format('select public.rpg_save_snapshot(%L, 2, %L)', :'k', '{}'), 'Nur der Spieltisch', 'Alter Tisch darf nicht mehr speichern');
select pg_temp.als('S');
select pg_temp.ok(public.rpg_join_as_guest(:'gast', 'Sina')->>'raum' = 'ABEN-TISCH2', 'Gast findet den neuen Raum über denselben Link');

-- Gast-Link erneuern macht den alten ungültig
select pg_temp.als('H'); select public.rpg_create_link(:'k', 'gast') as gast2 \gset
select pg_temp.als('F');
select pg_temp.fehler(format('select public.rpg_join_as_guest(%L, %L)', :'gast', 'X'), 'abgelaufen oder ungültig', 'Alter Gast-Link ungültig');
select pg_temp.ok((public.rpg_join_as_guest(:'gast2', 'Fred')->>'campaign_id')::uuid = :'k', 'Neuer Gast-Link funktioniert');
reset role;
\o
\echo 'ALLE PRÜFUNGEN BESTANDEN'
