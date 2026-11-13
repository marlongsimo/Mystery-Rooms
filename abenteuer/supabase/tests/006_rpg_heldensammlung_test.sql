-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 006 (Heldensammlung, Enden, Codes).
-- Vorher (pruefen.sh): Konto „Altspieler“ (…e0) existiert schon vor der Migration, Konto „Nachzuegler“ (…e9) entsteht
-- zwischen erstem und zweitem Ausführen.
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000e1', false),  -- N: neues Konto
  ('00000000-0000-0000-0000-0000000000e2', true),   -- G: Gast
  ('00000000-0000-0000-0000-0000000000e3', false),  -- P: Mitspieler mit Konto und Held
  ('00000000-0000-0000-0000-0000000000e4', false),  -- Z: Zuschauer ohne Held
  ('00000000-0000-0000-0000-0000000000e5', false);  -- R: probiert Codes
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', case p when 'A' then '00000000-0000-0000-0000-0000000000e0' when 'N' then '00000000-0000-0000-0000-0000000000e1'
  when 'G' then '00000000-0000-0000-0000-0000000000e2' when 'P' then '00000000-0000-0000-0000-0000000000e3' when 'Z' then '00000000-0000-0000-0000-0000000000e4'
  when 'R' then '00000000-0000-0000-0000-0000000000e5' else '' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
-- Kampagne mit n Spielständen, letzter Stand auf einer Szene, dann abgeschlossen
create function pg_temp.kampagne(p_ab text, p_szene text, p_n integer default 8) returns uuid language plpgsql as $$
declare v_k uuid;
begin
  v_k := public.rpg_create_campaign('Test ' || p_ab, 'normal', 'Spieltisch', p_ab);
  for i in 1..p_n loop
    perform public.rpg_save_snapshot(v_k, i - 1, jsonb_build_object('abenteuer', jsonb_build_object('abenteuer', p_ab, 'szene', case when i = p_n then p_szene else 'szene_' || i end)));
  end loop;
  return v_k;
end $$;
grant execute on all functions in schema pg_temp to authenticated;

-- ---------- Bestandsschutz ----------
select pg_temp.ok((select count(*) from public.rpg_hero_collection where user_id = '00000000-0000-0000-0000-0000000000e0' and quelle = 'bestand') = 15, 'Konto aus der Zeit vor der Migration hat alle 15 Helden (Bestandsschutz)');
select pg_temp.ok((select count(*) from public.rpg_hero_collection where user_id = '00000000-0000-0000-0000-0000000000e9') = 0, 'Erneutes Ausführen vergibt keinen Bestandsschutz an spätere Konten');
select pg_temp.ok((select count(*) from public.rpg_hero_catalog) = 15 and (select count(*) from public.rpg_adventure_endings) = 13, 'Katalog: 15 Helden, 13 Enden');

set role authenticated;
-- ---------- Keine direkten Tabellenrechte ----------
select pg_temp.als('A');
select pg_temp.fehler('select * from public.rpg_hero_collection', 'permission denied', 'Sammlung ist nicht direkt lesbar');
select pg_temp.fehler('select * from public.rpg_unlock_codes', 'permission denied', 'Codes sind nicht direkt lesbar');
select pg_temp.fehler($q$select public.rpg_create_unlock_code('Hack', 100, 10)$q$, 'permission denied', 'Spieler können keine Codes anlegen');
select pg_temp.fehler($q$select public.rpg_hero_ziehen('00000000-0000-0000-0000-0000000000e0', 3)$q$, 'permission denied', 'Interne Ziehfunktion ist gesperrt');

-- ---------- Gast ----------
select pg_temp.als('G');
select pg_temp.ok((public.rpg_my_heroes()->>'konto')::boolean = false, 'Gast: keine Sammlung (konto=false)');
select pg_temp.fehler('select public.rpg_hero_start_offer()', 'nur mit einem Spielerkonto', 'Gast bekommt keine Startrunde');
select pg_temp.fehler($q$select public.rpg_redeem_unlock_code('ABCD-EFGH-JKLM')$q$, 'nur ein Spielerkonto', 'Gast kann keinen Code einlösen');

-- ---------- Registrierung: drei Runden ----------
select pg_temp.als('N'); select public.rpg_set_profile('Neuling');
select pg_temp.als('P'); select public.rpg_set_profile('Mitspieler');
select pg_temp.als('Z'); select public.rpg_set_profile('Zuschauer');
select pg_temp.als('R'); select public.rpg_set_profile('Codeprobierer');
select pg_temp.als('N');
select pg_temp.ok((public.rpg_my_heroes()->>'start_offen')::boolean, 'Neues Konto: Startrunden offen, 0 Helden');
select public.rpg_hero_start_offer() as r1 \gset
select pg_temp.ok((public.rpg_hero_start_offer()->'angebot'->>'id') = (:'r1'::jsonb->'angebot'->>'id'), 'Neuladen zeigt dieselbe Runde (gleiche drei Helden)');
select pg_temp.ok(jsonb_array_length(:'r1'::jsonb->'angebot'->'helden') = 3 and (:'r1'::jsonb->>'runde')::int = 1, 'Runde 1 mit drei Helden');
reset role;
select pg_temp.ok((select count(distinct c.klasse) from jsonb_array_elements_text(:'r1'::jsonb->'angebot'->'helden') h join public.rpg_hero_catalog c on c.hero_id = h) = 3, 'Drei Helden aus drei Klassen');
set role authenticated;
select pg_temp.fehler(format('select public.rpg_hero_pick(%L, %L)', :'r1'::jsonb->'angebot'->>'id', 'gibtsnicht'), 'steht nicht zur Wahl', 'Fremder Held ist nicht wählbar');
select public.rpg_hero_pick((:'r1'::jsonb->'angebot'->>'id')::uuid, :'r1'::jsonb->'angebot'->'helden'->>0);
select pg_temp.ok((public.rpg_hero_pick((:'r1'::jsonb->'angebot'->>'id')::uuid, :'r1'::jsonb->'angebot'->'helden'->>0)->>'schon')::boolean, 'Doppeltes Absenden derselben Wahl schadet nicht');
select pg_temp.fehler(format('select public.rpg_hero_pick(%L, %L)', :'r1'::jsonb->'angebot'->>'id', :'r1'::jsonb->'angebot'->'helden'->>1), 'schon gewählt', 'Zweiter Held aus derselben Runde ist nicht möglich');
select public.rpg_hero_start_offer() as r2 \gset
select public.rpg_hero_pick((:'r2'::jsonb->'angebot'->>'id')::uuid, :'r2'::jsonb->'angebot'->'helden'->>2);
select public.rpg_hero_start_offer() as r3 \gset
select pg_temp.ok((:'r3'::jsonb->>'runde')::int = 3, 'Runde 3');
select public.rpg_hero_pick((:'r3'::jsonb->'angebot'->>'id')::uuid, :'r3'::jsonb->'angebot'->'helden'->>1);
select pg_temp.ok((public.rpg_hero_start_offer()->>'fertig')::boolean, 'Nach drei Runden ist die Registrierung fertig');
select pg_temp.ok(jsonb_array_length(public.rpg_my_heroes()->'helden') = 3, 'Genau drei Helden in der Sammlung');
reset role;
select pg_temp.ok((select count(distinct h) from public.rpg_hero_offers o, unnest(o.helden) h where o.user_id = '00000000-0000-0000-0000-0000000000e1' and o.art = 'start') = 9, 'In den Startrunden wurden 9 verschiedene Helden angeboten');
set role authenticated;

-- ---------- Kampagnen-Ende ----------
select pg_temp.als('N');
select pg_temp.kampagne('rabenmoor', 'ende_erloest') as k1 \gset
select pg_temp.fehler(format('select public.rpg_claim_ending(%L)', :'k1'), 'noch nicht abgeschlossen', 'Nicht abgeschlossene Kampagne zählt nicht');
select public.rpg_set_campaign_status(:'k1', 'abgeschlossen');
select pg_temp.fehler(format('select public.rpg_claim_ending(%L)', :'k1'), 'nicht gewertet', 'Zu schnell durchgespielt (unter 15 Minuten) zählt nicht');
reset role; update public.rpg_campaigns set created_at = now() - interval '2 hours' where id = :'k1';
insert into public.rpg_campaign_members (campaign_id, user_id, role, display_name, character_id) values
  (:'k1', '00000000-0000-0000-0000-0000000000e3', 'spieler', 'Mitspieler', 'trickser'),
  (:'k1', '00000000-0000-0000-0000-0000000000e4', 'spieler', 'Zuschauer', null);
set role authenticated;
select public.rpg_claim_ending(:'k1') as e1 \gset
select pg_temp.ok((:'e1'::jsonb->>'neu')::boolean and :'e1'::jsonb->>'ende' = 'ende_erloest' and (:'e1'::jsonb->>'gefunden')::int = 1 and (:'e1'::jsonb->>'gesamt')::int = 2, 'Neues Ende: gefunden 1 von 2');
select pg_temp.ok(jsonb_array_length(:'e1'::jsonb->'angebot'->'helden') = 3, 'Neues Ende: Wahl aus drei');
select pg_temp.ok(not exists (select 1 from jsonb_array_elements_text(:'e1'::jsonb->'angebot'->'helden') h where h = any (array(select jsonb_array_elements_text(public.rpg_my_heroes()->'helden')))), 'Angeboten werden nur Helden, die noch fehlen');
select pg_temp.ok((public.rpg_claim_ending(:'k1')->>'schon_gemeldet')::boolean and (public.rpg_claim_ending(:'k1')->'angebot'->>'id') = (:'e1'::jsonb->'angebot'->>'id'), 'Erneutes Melden liefert dasselbe Angebot');
select public.rpg_hero_pick((:'e1'::jsonb->'angebot'->>'id')::uuid, :'e1'::jsonb->'angebot'->'helden'->>0);
select pg_temp.ok(jsonb_array_length(public.rpg_my_heroes()->'helden') = 4, 'Nach der Wahl: vier Helden');
select pg_temp.ok(public.rpg_claim_ending(:'k1')->'angebot' = 'null'::jsonb, 'Nach der Wahl ist kein Angebot mehr offen');
-- Mitspieler mit Held bekommt seine eigene Wahl, Zuschauer ohne Held nicht
select pg_temp.als('P');
select pg_temp.ok((public.rpg_claim_ending(:'k1')->>'neu')::boolean, 'Mitspieler mit Helden: neues Ende für sein Konto');
select pg_temp.als('Z');
select pg_temp.fehler(format('select public.rpg_claim_ending(%L)', :'k1'), 'keinen Helden gespielt', 'Mitglied ohne Helden bekommt nichts');
select pg_temp.als('R');
select pg_temp.fehler(format('select public.rpg_claim_ending(%L)', :'k1'), 'keinen Helden gespielt', 'Wer nicht dabei war, bekommt nichts');
-- Spieltisch: Helden aus der Sammlung des Hosts
select pg_temp.fehler(format('select public.rpg_campaign_heroes(%L)', :'k1'), 'Nur der Spieltisch', 'Fremde sehen die Sammlung des Hosts nicht');
select pg_temp.als('P');
select pg_temp.fehler(format('select public.rpg_campaign_heroes(%L)', :'k1'), 'Nur der Spieltisch', 'Mitspieler fragen ihre eigene Sammlung ab, nicht die des Hosts');
select pg_temp.als('N');
select pg_temp.ok(public.rpg_campaign_heroes(:'k1')->'helden' = public.rpg_my_heroes()->'helden', 'Host am Tisch: seine eigene Sammlung');
reset role;
insert into public.rpg_campaign_members (campaign_id, user_id, role, display_name) values (:'k1', '00000000-0000-0000-0000-0000000000e2', 'tisch', 'Tisch');
set role authenticated;
select pg_temp.als('G');
select pg_temp.ok(jsonb_array_length(public.rpg_campaign_heroes(:'k1')->'helden') = 4, 'Tisch-Gerät (Gast) nutzt die Sammlung des Hosts');
-- Dasselbe Ende in einer zweiten Kampagne: keine Belohnung
select pg_temp.als('N');
select pg_temp.kampagne('rabenmoor', 'ende_erloest') as k2 \gset
select public.rpg_set_campaign_status(:'k2', 'abgeschlossen');
reset role; update public.rpg_campaigns set created_at = now() - interval '2 hours' where id = :'k2'; set role authenticated;
select public.rpg_claim_ending(:'k2') as e2 \gset
select pg_temp.ok(not (:'e2'::jsonb->>'neu')::boolean and :'e2'::jsonb->'angebot' = 'null'::jsonb, 'Schon bekanntes Ende: keine neue Wahl');
-- Niederlage zählt nicht
select pg_temp.kampagne('rabenmoor', 'moor_behaelt') as k3 \gset
select public.rpg_set_campaign_status(:'k3', 'abgeschlossen');
reset role; update public.rpg_campaigns set created_at = now() - interval '2 hours' where id = :'k3'; set role authenticated;
select pg_temp.fehler(format('select public.rpg_claim_ending(%L)', :'k3'), 'nicht gewertet', 'Niederlage ist kein Ende für die Sammlung');
-- Zu wenige Spielstände
select pg_temp.kampagne('rabenmoor', 'ende_besiegt', 3) as k4 \gset
select public.rpg_set_campaign_status(:'k4', 'abgeschlossen');
reset role; update public.rpg_campaigns set created_at = now() - interval '2 hours' where id = :'k4'; set role authenticated;
select pg_temp.fehler(format('select public.rpg_claim_ending(%L)', :'k4'), 'nicht gewertet', 'Nur drei Spielstände: zählt nicht');
-- Zweites Moor-Ende: Titel
select pg_temp.kampagne('rabenmoor', 'ende_besiegt') as k5 \gset
select public.rpg_set_campaign_status(:'k5', 'abgeschlossen');
reset role; update public.rpg_campaigns set created_at = now() - interval '2 hours' where id = :'k5'; set role authenticated;
select pg_temp.ok((public.rpg_claim_ending(:'k5')->>'gefunden')::int = 2, 'Zweites Ende im Moor: 2 von 2');
select pg_temp.ok(public.rpg_my_heroes()->'titel' ? 'rabenmoor', 'Alle Enden des Moors gefunden: Titel');
select pg_temp.ok(jsonb_array_length(public.rpg_my_heroes()->'angebote') = 1, 'Offenes Angebot erscheint in „Meine Helden“');

-- ---------- Volle Sammlung ----------
select pg_temp.als('A');
select pg_temp.kampagne('krone', 'ende_stabil') as k6 \gset
select public.rpg_set_campaign_status(:'k6', 'abgeschlossen');
reset role; update public.rpg_campaigns set created_at = now() - interval '5 hours' where id = :'k6'; set role authenticated;
select public.rpg_claim_ending(:'k6') as e6 \gset
select pg_temp.ok((:'e6'::jsonb->>'neu')::boolean and :'e6'::jsonb->'angebot' = 'null'::jsonb and (:'e6'::jsonb->>'sammlung')::int = 15, 'Volle Sammlung: neues Ende zählt, aber keine Wahl');

-- ---------- Freischalt-Codes ----------
reset role;
select public.rpg_create_unlock_code('Beta-Tester', 2, 30) as code \gset
select public.rpg_create_unlock_code('Alt', 5, 30) as alt \gset
update public.rpg_unlock_codes set expires_at = now() - interval '1 day' where label = 'Alt';
select public.rpg_create_unlock_code('Gesperrt', 5, 30) as zu \gset
select pg_temp.ok(public.rpg_disable_unlock_code('Gesperrt') = 1, 'Code sperren');
select pg_temp.ok(not exists (select 1 from public.rpg_unlock_codes where code_hash = :'code'), 'Code wird nicht im Klartext gespeichert');
set role authenticated;
select pg_temp.als('N');
select pg_temp.ok((public.rpg_redeem_unlock_code(lower(replace(:'code', '-', ' ')))->>'neu')::int = 11, 'Code (klein, mit Leerzeichen) schaltet die fehlenden 11 Helden frei');
select pg_temp.ok(jsonb_array_length(public.rpg_my_heroes()->'helden') = 15, 'Danach: alle 15');
select pg_temp.fehler(format('select public.rpg_redeem_unlock_code(%L)', :'code'), 'schon eingelöst', 'Zweimal einlösen geht nicht');
select pg_temp.als('P');
select pg_temp.fehler(format('select public.rpg_redeem_unlock_code(%L)', :'alt'), 'abgelaufen', 'Abgelaufener Code');
select pg_temp.fehler(format('select public.rpg_redeem_unlock_code(%L)', :'zu'), 'nicht mehr gültig', 'Gesperrter Code');
select pg_temp.ok((public.rpg_redeem_unlock_code(:'code')->>'gesamt')::int = 15, 'Zweite Einlösung (von 2) klappt');
select pg_temp.als('R');
select pg_temp.fehler(format('select public.rpg_redeem_unlock_code(%L)', :'code'), 'so oft eingelöst', 'Dritte Einlösung: Code ausgeschöpft');
select pg_temp.ok((public.rpg_hero_start_offer()->>'fertig')::boolean = false, 'R hat eine offene Startrunde');
select pg_temp.ok(public.rpg_redeem_unlock_code('FALS-CHER-CODE')->>'fehler' = 'Dieser Code ist ungültig.', 'Unbekannter Code: Meldung „ungültig“');
select public.rpg_redeem_unlock_code('FALS-CHER-CODE') from generate_series(1, 9);
select pg_temp.fehler(format('select public.rpg_redeem_unlock_code(%L)', :'zu'), 'Zu viele Versuche', 'Nach 10 Fehlversuchen: eine Stunde Pause');
reset role;
select pg_temp.ok((select uses from public.rpg_unlock_codes where label = 'Beta-Tester') = 2, 'Zähler der Einlösungen stimmt');
select pg_temp.ok((select count(*) from public.rpg_unlock_codes_uebersicht) = 3, 'Übersicht der Codes für den SQL Editor');

-- ---------- Admins: Code-Übersicht im Spiel ----------
set role authenticated;
select pg_temp.als('P');
select pg_temp.fehler('select public.rpg_admin_codes()', 'Nur Admins', 'Normales Konto sieht die Code-Übersicht nicht');
select pg_temp.fehler($$select public.rpg_admin_create_code('Versuch')$$, 'Nur Admins', 'Normales Konto kann keine Codes anlegen');
select pg_temp.ok(not (public.rpg_my_heroes()->>'admin')::boolean, 'Normales Konto: admin = false');
select pg_temp.fehler('insert into public.rpg_admins (user_id) values (auth.uid())', 'permission denied', 'Niemand kann sich selbst zum Admin machen');
select pg_temp.als('G');
select pg_temp.fehler('select public.rpg_admin_codes()', 'Nur Admins', 'Gast sieht die Code-Übersicht nicht');
reset role;
insert into public.rpg_admins (user_id) select user_id from public.rpg_profiles where lower(handle) = lower('neuling');
set role authenticated;
select pg_temp.als('N');
select pg_temp.ok((public.rpg_my_heroes()->>'admin')::boolean, 'Admin per SQL eingetragen: admin = true');
select public.rpg_admin_create_code('Für Mitspieler', 'mitspieler', 5, 90) as pers \gset
select pg_temp.ok(:'pers'::jsonb->>'nur_fuer' = 'Mitspieler' and (:'pers'::jsonb->>'hoechstens')::int = 1, 'Persönlicher Code: nur für „Mitspieler“, immer 1× einlösbar');
select public.rpg_admin_create_code('Für alle', null, 1, 90) as offen \gset
select pg_temp.ok(:'offen'::jsonb->>'nur_fuer' is null and (:'offen'::jsonb->>'hoechstens')::int = 1, 'Offener Code: jede Person, 1×');
select pg_temp.ok((public.rpg_admin_create_code('Viel', '', 5000, 9999)->>'hoechstens')::int = 100, 'Grenze: höchstens 100 Einlösungen');
select pg_temp.fehler($$select public.rpg_admin_create_code('X', 'gibtsnicht')$$, 'gibt es nicht', 'Unbekannter Benutzername');
select pg_temp.fehler($$select public.rpg_admin_create_code('  ')$$, 'Bezeichnung', 'Bezeichnung ist Pflicht');
select pg_temp.ok((select count(*) from jsonb_array_elements(public.rpg_admin_codes()) c where c->>'angelegt_von' = 'Neuling') = 3, 'Code-Übersicht zeigt, wer angelegt hat');
select pg_temp.ok(not exists (select 1 from jsonb_array_elements(public.rpg_admin_codes()) c where c ? 'code' or c ? 'code_hash'), 'Code-Übersicht zeigt keine Codes im Klartext oder als Hash');
reset role; delete from public.rpg_unlock_attempts; set role authenticated;
select pg_temp.als('Z');
select pg_temp.fehler(format('select public.rpg_redeem_unlock_code(%L)', :'pers'::jsonb->>'code'), 'anderes Konto', 'Persönlicher Code: ein anderes Konto kann ihn nicht einlösen');
select pg_temp.ok((public.rpg_redeem_unlock_code(:'offen'::jsonb->>'code')->>'gesamt')::int = 15, 'Offener Code: beliebiges Konto löst ihn ein');
select pg_temp.als('P');
select pg_temp.fehler(format('select public.rpg_redeem_unlock_code(%L)', :'offen'::jsonb->>'code'), 'so oft eingelöst', 'Offener Code 1×: danach verbraucht');
select pg_temp.ok((public.rpg_redeem_unlock_code(:'pers'::jsonb->>'code')->>'gesamt')::int = 15, 'Persönlicher Code: der Empfänger löst ihn ein');
select pg_temp.als('N');
select pg_temp.ok(public.rpg_admin_disable_code((select (c->>'id')::uuid from jsonb_array_elements(public.rpg_admin_codes()) c where c->>'bezeichnung' = 'Viel')), 'Admin sperrt einen Code');
select pg_temp.ok((select not (c->>'aktiv')::boolean from jsonb_array_elements(public.rpg_admin_codes()) c where c->>'bezeichnung' = 'Viel'), 'Gesperrt in der Übersicht');
select public.rpg_admin_create_code('Serie ' || i) from generate_series(1, 17) i; -- zusammen mit den 3 von oben: 20
select pg_temp.fehler($$select public.rpg_admin_create_code('Eins zu viel')$$, 'Höchstens 20', 'Grenze: 20 neue Codes pro Tag');
reset role;
select pg_temp.ok((select count(*) from public.rpg_unlock_codes_uebersicht where nur_fuer = 'Mitspieler' and angelegt_von = 'Neuling') = 1, 'SQL-Übersicht zeigt Empfänger und Admin');
