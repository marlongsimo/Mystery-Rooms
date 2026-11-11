-- =====================================================================
-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN.
-- Prüft Migration 001 gegen die Nachbildung (supabase_nachbildung.sql).
-- Aufruf: siehe abenteuer/supabase/tests/pruefen.sh
-- Jede Prüfung meldet „✓ …“; ein Fehler bricht mit „✗ …“ ab.
-- =====================================================================
\set ON_ERROR_STOP on
set client_min_messages = notice;

-- Testpersonen: H = Host (Spieltisch), S = Mitspieler (Handy), F = Fremder
insert into auth.users (id) values
  ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b'), ('00000000-0000-0000-0000-00000000000c');
-- bestehende Live-Sitzung: H ist Host, S ist beigetreten, F nicht
insert into public.game_sessions (id, game_slug, room_code, host_id) values ('11111111-1111-1111-1111-111111111111', 'abenteuer', 'ABEN-000001', '00000000-0000-0000-0000-00000000000a');
insert into public.session_players (session_id, user_id, player_name, is_host) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a', 'Spieltisch', true),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000b', 'Anna', false);

create function pg_temp.als(p text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', case p when 'H' then '00000000-0000-0000-0000-00000000000a' when 'S' then '00000000-0000-0000-0000-00000000000b' when 'F' then '00000000-0000-0000-0000-00000000000c' else '' end, false);
end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$
begin if b then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
-- erwarteter Fehler: führt sql aus und prüft, dass eine Meldung mit muster kommt
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then
    if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if;
    raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm;
  end;
  raise exception '✗ %: kein Fehler', t;
end $$;
grant execute on all functions in schema pg_temp to authenticated;

set role authenticated;

-- 1) Kampagne anlegen
select pg_temp.als('H');
select public.rpg_create_campaign('Grauwacht mit Freunden', 'normal', 'Spieltisch') as k \gset
select pg_temp.ok((select status from public.rpg_campaigns where id = :'k') = 'geplant', 'Kampagne angelegt (Status geplant), Host sieht sie');
select pg_temp.ok((select role from public.rpg_campaign_members where campaign_id = :'k' and user_id = auth.uid()) = 'host', 'Ersteller ist Host');

-- 2) Fremde sehen nichts und dürfen nichts
select pg_temp.als('F');
select pg_temp.ok((select count(*) from public.rpg_campaigns) = 0, 'Fremder sieht keine Kampagne');
select pg_temp.ok((select count(*) from public.rpg_state_snapshots) = 0, 'Fremder sieht keine Spielstände');
select pg_temp.fehler(format('select public.rpg_save_snapshot(%L, 0, %L)', :'k', '{"x":1}'), 'Nur der Host', 'Fremder kann nicht speichern');
select pg_temp.fehler(format('select public.rpg_load_campaign(%L)', :'k'), 'gehörst nicht', 'Fremder kann nicht laden');
select pg_temp.fehler(format('select public.rpg_delete_campaign(%L)', :'k'), 'Nur der Host', 'Fremder kann nicht löschen');
select pg_temp.fehler(format('insert into public.rpg_campaigns (title, owner_user_id) values (%L, auth.uid())', 'x'), 'permission denied', 'Direktes Schreiben in Tabellen ist gesperrt');
select pg_temp.fehler(format('update public.rpg_campaigns set title = %L', 'x'), 'permission denied', 'Direktes Ändern ist gesperrt');
reset role; set role anon;
select pg_temp.fehler('select public.rpg_my_campaigns()', 'permission denied', 'Nicht angemeldet (anon): keine Funktionen');
reset role; set role authenticated;

-- 3) Sitzung starten: nur mit eigener Live-Sitzung als Host
select pg_temp.als('S');
select pg_temp.fehler(format('select public.rpg_start_session(%L, %L)', :'k', '11111111-1111-1111-1111-111111111111'), 'Nur der Host', 'Mitspieler kann keine Sitzung starten');
select pg_temp.als('H');
select public.rpg_start_session(:'k', '11111111-1111-1111-1111-111111111111') as s1 \gset
select pg_temp.ok((select status from public.rpg_campaigns where id = :'k') = 'aktiv', 'Sitzung gestartet, Kampagne aktiv');
select pg_temp.ok(public.rpg_start_session(:'k', '11111111-1111-1111-1111-111111111111') = :'s1', 'Erneuter Start (Tisch neu geladen) liefert dieselbe Sitzung');

-- 4) Mitspieler übernehmen: nur wer in der Live-Sitzung ist
select public.rpg_sync_members(:'k', '[{"user_id":"00000000-0000-0000-0000-00000000000b","display_name":"Anna","character_id":"wildnislaeufer"},{"user_id":"00000000-0000-0000-0000-00000000000c","display_name":"Eindringling"}]') as n \gset
select pg_temp.ok(:n = 1, 'Nur Anna übernommen, Fremder (nicht in der Live-Sitzung) abgewiesen');
select pg_temp.ok((select character_id from public.rpg_campaign_members where campaign_id = :'k' and user_id = '00000000-0000-0000-0000-00000000000b') = 'wildnislaeufer', 'Annas Figur gespeichert');

-- 5) Speichern mit Versionsprüfung
select pg_temp.ok(public.rpg_save_snapshot(:'k', 0, '{"szene":"prolog"}', 'szene', '{"titel":"Halmbruck"}') = 1, 'Stand 1 gespeichert');
select pg_temp.ok(public.rpg_save_snapshot(:'k', 1, '{"szene":"halmbruck"}', 'entscheidung') = 2, 'Stand 2 gespeichert');
select pg_temp.fehler(format('select public.rpg_save_snapshot(%L, 1, %L)', :'k', '{"szene":"alt"}'), 'RPG_VERALTET:2', 'Veralteter Stand wird abgewiesen, nichts überschrieben');
select pg_temp.ok((select state->>'szene' from public.rpg_state_snapshots where campaign_id = :'k' and version = 2) = 'halmbruck', 'Neuester Stand unverändert');
select pg_temp.ok((select checkpoint->>'titel' from public.rpg_campaigns where id = :'k') = 'Halmbruck', 'Kurzinfo für die Bibliothek gesetzt');

-- 6) Mitspieler: lesen ja, schreiben nein
select pg_temp.als('S');
select pg_temp.ok((public.rpg_load_campaign(:'k')->'state'->>'szene') = 'halmbruck', 'Mitspieler lädt den neuesten Stand');
select pg_temp.ok(jsonb_array_length(public.rpg_my_campaigns()) = 1, 'Kampagne steht in Annas Bibliothek');
select pg_temp.fehler(format('select public.rpg_save_snapshot(%L, 2, %L)', :'k', '{"x":1}'), 'Nur der Host', 'Mitspieler kann nicht speichern');
select pg_temp.fehler(format('select public.rpg_reset_campaign(%L)', :'k'), 'Nur der Host', 'Mitspieler kann nicht neu beginnen');

-- 7) Aufräumen: höchstens 20 Stände + Lagerfeuer
select pg_temp.als('H');
do $$ declare v int := 2; k uuid := (select id from public.rpg_campaigns limit 1); begin
  for i in 1..30 loop v := public.rpg_save_snapshot(k, v, jsonb_build_object('i', i), case when i = 3 then 'lagerfeuer' else 'auto' end); end loop; end $$;
select pg_temp.ok((select count(*) from public.rpg_state_snapshots where campaign_id = :'k') = 21, 'Nach 32 Speicherungen bleiben 20 Stände plus 1 Lagerfeuer');
select pg_temp.ok((select max(version) from public.rpg_state_snapshots where campaign_id = :'k') = 32, 'Neueste Version 32');

-- 8) Pausieren beendet die Sitzung, Fortsetzen startet eine neue
select pg_temp.ok(public.rpg_set_campaign_status(:'k', 'pausiert') = 'pausiert', 'Kampagne pausiert');
select pg_temp.ok((select count(*) from public.rpg_sessions where campaign_id = :'k' and status in ('wartend','aktiv')) = 0, 'Keine laufende Sitzung mehr');
select public.rpg_start_session(:'k', '11111111-1111-1111-1111-111111111111') as s2 \gset
select pg_temp.ok(:'s2' <> :'s1' and (select status from public.rpg_campaigns where id = :'k') = 'aktiv', 'Fortsetzen: neue Sitzung, Kampagne wieder aktiv');
select pg_temp.ok((public.rpg_load_campaign(:'k')->>'version')::int = 32, 'Fortsetzen lädt Version 32');
select pg_temp.fehler(format('select public.rpg_set_campaign_status(%L, %L)', :'k', 'geplant'), 'nicht erlaubt', 'Unerlaubter Statuswechsel abgewiesen');

-- 9) Neu beginnen
select pg_temp.ok(public.rpg_reset_campaign(:'k') = 21, 'Neu beginnen löscht alle 21 Stände');
select pg_temp.ok((select current_version from public.rpg_campaigns where id = :'k') = 0, 'Version wieder 0');
select pg_temp.ok((select count(*) from public.rpg_campaign_members where campaign_id = :'k') = 2, 'Mitglieder bleiben');
select pg_temp.ok(public.rpg_save_snapshot(:'k', 0, '{"szene":"prolog"}') = 1, 'Nach Neustart wieder ab Version 1');

-- 10) Verlassen und Löschen
select pg_temp.als('S');
select public.rpg_leave_campaign(:'k');
select pg_temp.ok(jsonb_array_length(public.rpg_my_campaigns()) = 0 and (select count(*) from public.rpg_campaigns) = 0, 'Anna hat verlassen: sieht die Kampagne nicht mehr');
select pg_temp.als('H');
select pg_temp.fehler(format('select public.rpg_leave_campaign(%L)', :'k'), 'nicht verlassen', 'Host kann nicht einfach verlassen');
select public.rpg_delete_campaign(:'k');
reset role;
select pg_temp.ok((select count(*) from public.rpg_campaigns) + (select count(*) from public.rpg_state_snapshots) + (select count(*) from public.rpg_sessions) + (select count(*) from public.rpg_campaign_members) = 0, 'Gelöscht: Kampagne samt Ständen, Sitzungen und Plätzen');
select pg_temp.ok((select count(*) from public.game_sessions) = 1 and (select count(*) from public.session_players) = 2, 'Bestehende Sitzungstabellen unverändert');

-- 11) Grenze: 20 Kampagnen je Nutzer
set role authenticated; select pg_temp.als('F');
do $$ begin for i in 1..20 loop perform public.rpg_create_campaign('K' || i); end loop; end $$;
select pg_temp.fehler('select public.rpg_create_campaign(''zu viel'')', '20 Kampagnen', 'Höchstens 20 Kampagnen je Nutzer');
reset role;
\o
\echo 'ALLE PRÜFUNGEN BESTANDEN'
