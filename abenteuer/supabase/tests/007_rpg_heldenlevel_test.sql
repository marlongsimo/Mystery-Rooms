-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 007 (Heldenstufen und XP).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000f1', false),  -- H: Gastgeber mit Konto, alle Helden
  ('00000000-0000-0000-0000-0000000000f2', false),  -- S: Mitspieler mit Konto, besitzt die Trickserin
  ('00000000-0000-0000-0000-0000000000f3', true),   -- G: Gast
  ('00000000-0000-0000-0000-0000000000f4', false);  -- F: Fremder mit Konto
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000000f1', 'Gastgeber'), ('00000000-0000-0000-0000-0000000000f2', 'Mitspielerin'), ('00000000-0000-0000-0000-0000000000f4', 'Fremder');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select '00000000-0000-0000-0000-0000000000f1', hero_id, 'code' from public.rpg_hero_catalog;
insert into public.rpg_hero_collection (user_id, hero_id, quelle) values ('00000000-0000-0000-0000-0000000000f2', 'trickser', 'start');
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', case p when 'H' then '00000000-0000-0000-0000-0000000000f1' when 'S' then '00000000-0000-0000-0000-0000000000f2'
  when 'G' then '00000000-0000-0000-0000-0000000000f3' when 'F' then '00000000-0000-0000-0000-0000000000f4' else '' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
-- Kampagne mit 8 Spielständen und Gruppe, letzter Stand auf einer Szene
create function pg_temp.kampagne(p_ab text, p_szene text, p_gruppe jsonb) returns uuid language plpgsql as $$
declare v_k uuid;
begin
  v_k := public.rpg_create_campaign('XP ' || p_ab, 'normal', 'Spieltisch', p_ab);
  for i in 1..8 loop
    perform public.rpg_save_snapshot(v_k, i - 1, jsonb_build_object('abenteuer', jsonb_build_object('abenteuer', p_ab, 'gruppe', p_gruppe, 'szene', case when i = 8 then p_szene else 'szene_' || i end)));
  end loop;
  return v_k;
end $$;
grant execute on all functions in schema pg_temp to authenticated;

-- ---------- Rechenregeln ----------
select pg_temp.ok(public.rpg_xp_stufe(0) = 1 and public.rpg_xp_stufe(99) = 1 and public.rpg_xp_stufe(100) = 2 and public.rpg_xp_stufe(260) = 3 and public.rpg_xp_stufe(5650) = 10 and public.rpg_xp_stufe(99999) = 10, 'Stufe aus XP: 100 → 2, 260 → 3, 5650 → 10');
select pg_temp.ok(public.rpg_xp_fuer(200, 3, 3) = 200 and public.rpg_xp_fuer(200, 3, 1) = 320 and public.rpg_xp_fuer(200, 3, 5) = 90 and public.rpg_xp_fuer(450, 6, 1) = 900 and public.rpg_xp_fuer(100, 1, 10) = 0, 'XP: Grundwert auf empfohlener Stufe, mehr darunter, weniger darüber, nichts auf Stufe 10');
select pg_temp.ok((select count(*) from public.rpg_adventure_xp) = 6 and (select xp from public.rpg_adventure_xp where adventure = 'graufurt') = 100, 'Stammdaten: sechs Kampagnen, Kurzabenteuer mit halbem Grundwert');

set role authenticated;
select pg_temp.als('H');
select pg_temp.fehler('select * from public.rpg_hero_progress', 'permission denied', 'Fortschritt ist nicht direkt lesbar');
select pg_temp.fehler('insert into public.rpg_hero_progress (user_id, hero_id, xp) values (auth.uid(), ''trickser'', 5000)', 'permission denied', 'Fortschritt ist nicht direkt schreibbar');
select pg_temp.fehler('select public.rpg_xp_fuer(1, 1, 1)', 'permission denied', 'Rechenfunktionen sind nicht direkt aufrufbar');
select pg_temp.ok(public.rpg_hero_levels() = '{"konto": true, "xp": {}}'::jsonb, 'Neues Konto: noch keine XP');

-- ---------- Coop: Gastgeber mit eigenem Helden, Mitspielerin, Gast, ein Tisch-Held ----------
select pg_temp.kampagne('grauwacht', 'ende_waechter', '["schildwaechter", "trickser", "elementarist", "lichtbringer"]'::jsonb) as k1 \gset
select pg_temp.fehler(format('select public.rpg_award_xp(%L)', :'k1'), 'noch nicht abgeschlossen', 'Nicht abgeschlossene Kampagne gibt keine XP');
select public.rpg_set_campaign_status(:'k1', 'abgeschlossen');
select pg_temp.fehler(format('select public.rpg_award_xp(%L)', :'k1'), 'nicht gewertet', 'Zu schnell durchgespielt gibt keine XP');
reset role; update public.rpg_campaigns set created_at = now() - interval '2 hours' where id = :'k1';
update public.rpg_campaign_members set character_id = 'schildwaechter' where campaign_id = :'k1' and role = 'host';
insert into public.rpg_campaign_members (campaign_id, user_id, role, display_name, character_id) values
  (:'k1', '00000000-0000-0000-0000-0000000000f2', 'spieler', 'Mitspielerin', 'trickser'),
  (:'k1', '00000000-0000-0000-0000-0000000000f3', 'spieler', 'Gast', 'elementarist');
set role authenticated;
select pg_temp.ok(public.rpg_campaign_levels(:'k1') = '{"host": {}, "spieler": {"schildwaechter": 0, "trickser": 0}}'::jsonb, 'Spieltisch sieht die Stufen der Gruppe (Gäste fehlen)');
select public.rpg_award_xp(:'k1') as x1 \gset
select pg_temp.ok(jsonb_array_length(:'x1'::jsonb->'helden') = 2, 'Gastgeber: eigener Held und der Tisch-Held, nicht die Helden von Mitspielerin und Gast');
select pg_temp.ok((select bool_and((h->>'xp')::int = 320 and (h->>'vorher')::int = 1 and (h->>'stufe')::int = 3 and (h->>'neu')::boolean) from jsonb_array_elements(:'x1'::jsonb->'helden') h), 'Grauwacht mit Stufe-1-Helden: 320 XP, Stufe 1 → 3');
select pg_temp.ok(public.rpg_hero_levels()->'xp' = '{"schildwaechter": 320, "lichtbringer": 320}'::jsonb, 'Fortschritt des Gastgebers gespeichert');
select public.rpg_award_xp(:'k1') as x1b \gset
select pg_temp.ok((select bool_and(not (h->>'neu')::boolean and (h->>'xp')::int = 320) from jsonb_array_elements(:'x1b'::jsonb->'helden') h) and public.rpg_hero_levels()->'xp'->>'schildwaechter' = '320', 'Erneutes Melden bucht nichts doppelt');
select pg_temp.als('S');
select public.rpg_award_xp(:'k1') as x2 \gset
select pg_temp.ok(jsonb_array_length(:'x2'::jsonb->'helden') = 1 and :'x2'::jsonb->'helden'->0->>'held' = 'trickser' and public.rpg_hero_levels()->'xp' = '{"trickser": 320}'::jsonb, 'Mitspielerin: nur ihr eigener Held');
select pg_temp.fehler(format('select public.rpg_campaign_levels(%L)', :'k1'), 'Nur der Spieltisch', 'Mitspieler dürfen die Stufen der Gruppe nicht abfragen');
select pg_temp.als('G');
select pg_temp.ok(public.rpg_award_xp(:'k1') = '{"konto": false}'::jsonb and public.rpg_hero_levels() = '{"konto": false}'::jsonb, 'Gast: keine XP, kein Fortschritt');
select pg_temp.als('F');
select pg_temp.fehler(format('select public.rpg_award_xp(%L)', :'k1'), 'keinen Helden gespielt', 'Fremde bekommen nichts');

-- ---------- Solo: alle Helden gehören dem Gastgeber; jeder Abschluss zählt; höhere Stufe bekommt weniger ----------
select pg_temp.als('H');
select pg_temp.kampagne('weidenhain', 'ende_fest', '["schildwaechter", "wildnislaeufer", "lichtbringer"]'::jsonb) as k2 \gset
select public.rpg_set_campaign_status(:'k2', 'abgeschlossen');
reset role; update public.rpg_campaigns set created_at = now() - interval '1 hour' where id = :'k2'; set role authenticated;
select public.rpg_award_xp(:'k2') as x3 \gset
select pg_temp.ok(jsonb_array_length(:'x3'::jsonb->'helden') = 3, 'Solo: alle drei Helden der Gruppe');
select pg_temp.ok((select (h->>'xp')::int from jsonb_array_elements(:'x3'::jsonb->'helden') h where h->>'held' = 'wildnislaeufer') = 50
  and (select (h->>'xp')::int from jsonb_array_elements(:'x3'::jsonb->'helden') h where h->>'held' = 'schildwaechter') = 23, 'Weidenhain (Kurzabenteuer, 50): Stufe 1 bekommt 50, Stufe 3 nur 23');
select pg_temp.kampagne('weidenhain', 'ende_nacht', '["schildwaechter", "wildnislaeufer", "lichtbringer"]'::jsonb) as k3 \gset
select public.rpg_set_campaign_status(:'k3', 'abgeschlossen');
reset role; update public.rpg_campaigns set created_at = now() - interval '1 hour' where id = :'k3'; set role authenticated;
select public.rpg_award_xp(:'k3') as x4 \gset
select pg_temp.ok((:'x4'::jsonb->'helden'->0->>'neu')::boolean and (public.rpg_hero_levels()->'xp'->>'wildnislaeufer')::int = 100, 'Wiederholung: jeder Abschluss bringt wieder XP');
-- Kein Ende erreicht (Niederlage-Szene): keine XP
select pg_temp.kampagne('weidenhain', 'niederlage', '["schildwaechter", "wildnislaeufer", "lichtbringer"]'::jsonb) as k4 \gset
select public.rpg_set_campaign_status(:'k4', 'abgeschlossen');
reset role; update public.rpg_campaigns set created_at = now() - interval '1 hour' where id = :'k4'; set role authenticated;
select pg_temp.fehler(format('select public.rpg_award_xp(%L)', :'k4'), 'nicht gewertet', 'Ohne gültiges Ende keine XP');
reset role;
select pg_temp.ok((select count(*) from public.rpg_xp_ledger) = 9, 'Buchungen: neun (2 + 1 + 3 + 3)');
