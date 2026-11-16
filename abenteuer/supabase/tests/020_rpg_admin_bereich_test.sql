-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 020 (Admin-Bereich: Rechner-Gegner einstellen, Statistik).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000020a1', false), ('00000000-0000-0000-0000-0000000020a2', false);
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000020a1', 'Adm_Chef'), ('00000000-0000-0000-0000-0000000020a2', 'Adm_Spieler');
insert into public.rpg_admins (user_id) values ('00000000-0000-0000-0000-0000000020a1');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select u.id, hero_id, 'code' from public.rpg_hero_catalog, (select id from auth.users where id::text like '00000000-0000-0000-0000-0000000020a%') u;
insert into public.rpg_arena_squads (user_id, team) select id, array['schildwaechter', 'trickser', 'lichtbringer'] from auth.users where id::text like '00000000-0000-0000-0000-0000000020a%';
-- Spieler: alle drei Helden auf Stufe 6
insert into public.rpg_hero_progress (user_id, hero_id, xp) select '00000000-0000-0000-0000-0000000020a2', h, 1350 from unnest(array['schildwaechter', 'trickser', 'lichtbringer']) h;
update public.rpg_arena_matches set status = 'abgebrochen' where status in ('offen', 'bereit', 'laeuft');
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000020a' || case p when 'X' then '1' else '2' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
create function pg_temp.altern(p uuid, sek integer) returns void language sql security definer as $$ update public.rpg_arena_search_srv set seit = now() - make_interval(secs => sek) where match_id = p; $$;
grant execute on all functions in schema pg_temp to authenticated;
set role authenticated;

-- ---------- Nur Admins ----------
select pg_temp.als('A');
select pg_temp.fehler('select public.rpg_admin_bot()', 'Nur Admins', 'Ein Spieler sieht die Einstellungen nicht');
select pg_temp.fehler('select public.rpg_admin_bot_set(false, 30, 0, 0, -3, -3)', 'Nur Admins', 'Ein Spieler kann sie nicht ändern');
select pg_temp.fehler('select public.rpg_arena_stats()', 'Nur Admins', 'Ein Spieler sieht die Auswertung nicht');
select pg_temp.fehler('select * from public.rpg_arena_bot_settings', 'permission denied', 'Die Tabelle ist nicht direkt lesbar');
select pg_temp.als('X');
select public.rpg_admin_bot() as e0 \gset
select pg_temp.ok(:'e0'::jsonb->'einstellungen' @> '{"aktiv": true, "wartezeit": 30, "staerke_von": 1, "staerke_bis": 1, "stufe_von": -1, "stufe_bis": 1, "schnitt_max": 0.5}'::jsonb,
  'Voreinstellung: aktiv, 30 Sekunden, volle Stärke, Stufen je Held −1 bis +1, Durchschnitt höchstens ±0,5');
select pg_temp.fehler('select public.rpg_admin_bot_set(true, 30, 1, 1, 0, 0, 4)', 'Durchschnitts', 'Zu große Abweichung des Durchschnitts wird abgelehnt');
select pg_temp.fehler('select public.rpg_admin_bot_set(true, 5, 1, 1, 0, 0)', 'Wartezeit', 'Zu kurze Wartezeit wird abgelehnt');
select pg_temp.fehler('select public.rpg_admin_bot_set(true, 30, 0.8, 0.5, 0, 0)', 'Spielstärke', 'Stärke „von“ über „bis“ wird abgelehnt');
select pg_temp.fehler('select public.rpg_admin_bot_set(true, 30, 0.5, 1.2, 0, 0)', 'Spielstärke', 'Stärke über 100 % wird abgelehnt');
select pg_temp.fehler('select public.rpg_admin_bot_set(true, 30, 0.5, 0.6, -4, 0)', 'Stufenverschiebung', 'Zu große Stufenverschiebung wird abgelehnt');
select pg_temp.fehler('select public.rpg_admin_bot_set(null, 30, 0.5, 0.6, 0, 0)', 'alle Werte', 'Fehlende Werte werden abgelehnt');

-- ---------- Ausgeschaltet: Die Suche wartet weiter ----------
select pg_temp.ok(public.rpg_admin_bot_set(false, 30, 1, 1, -1, 1)->'einstellungen'->>'aktiv' = 'false', 'Rechner-Gegner ausgeschaltet');
select pg_temp.als('A');
select public.rpg_arena_queue('normal') as q1 \gset
select pg_temp.altern((:'q1'::jsonb->>'id')::uuid, 120);
select pg_temp.ok(public.rpg_arena_queue('normal')->>'status' = 'offen', 'Ausgeschaltet: Auch nach zwei Minuten kommt kein Rechner-Gegner');
-- ---------- Wartezeit ----------
select pg_temp.als('X');
select pg_temp.ok((public.rpg_admin_bot_set(true, 60, 0.2, 0.4, -2, -2, 3)->'einstellungen'->>'wartezeit')::integer = 60 and public.rpg_admin_bot()->'einstellungen'->>'von' = 'Adm_Chef', 'Eingeschaltet, Wartezeit 60 Sekunden, Stärke 20–40 %, Stufen −2 (Durchschnitt bis ±3 erlaubt); vermerkt, wer es geändert hat');
select pg_temp.als('A');
select pg_temp.altern((:'q1'::jsonb->>'id')::uuid, 45);
select pg_temp.ok(public.rpg_arena_queue('normal')->>'status' = 'offen', 'Wartezeit 60: nach 45 Sekunden noch kein Gegner');
select pg_temp.altern((:'q1'::jsonb->>'id')::uuid, 70);
select public.rpg_arena_queue('normal') as q2 \gset
select pg_temp.ok(:'q2'::jsonb->>'status' = 'bereit' and (select bool_and((e->>'stufe')::integer = 4) from jsonb_array_elements(:'q2'::jsonb->'gast'->'team') e), 'Nach 70 Sekunden: Gegner da; seine Helden stehen zwei Stufen unter denen des Spielers (4 statt 6)');
reset role;
select public.rpg_arena_srv_load((:'q1'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000020a2') as s1 \gset
select pg_temp.ok((:'s1'::jsonb->'match'->>'bot')::boolean and (:'s1'::jsonb->'match'->>'staerke')::numeric between 0.2 and 0.4, 'Die Edge Function bekommt die geloste Spielstärke (' || (:'s1'::jsonb->'match'->>'staerke') || ', aus 0,2 bis 0,4)');
select pg_temp.ok(public.rpg_arena_srv_save((:'q1'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000020a2', 0, '{"ende": "arena", "runde": 6, "arena": {"sieger": 1, "grund": "Das Team von X liegt am Boden.", "punkte": {"1": 15, "2": 5}}}', '[{"sicht1": {}, "sicht2": {}}]')
  and public.rpg_arena_srv_end((:'q1'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000020a2'), 'Kampf gespielt und beendet (Sieg des Spielers)');
set role authenticated;
select pg_temp.als('A');
select pg_temp.ok(public.rpg_arena_fight((:'q1'::jsonb->>'id')::uuid, 0)::text !~* 'staerke|bot', 'Der Spieler erfährt die Spielstärke nicht');

-- ---------- Statistik ----------
select pg_temp.als('X');
select public.rpg_admin_bot() as e1 \gset
select pg_temp.ok((:'e1'::jsonb->'statistik'->>'kaempfe')::integer >= 1 and (:'e1'::jsonb->'statistik'->>'siege_spieler')::integer >= 1
  and exists (select 1 from jsonb_array_elements(:'e1'::jsonb->'statistik'->'nach_staerke') z where z->>'stufe' = '1 schwach' and (z->>'kaempfe')::integer = 1 and (z->>'siege_spieler')::integer = 1)
  and :'e1'::jsonb->'statistik'->'letzte'->0->>'spieler' = 'Adm_Spieler' and (:'e1'::jsonb->'statistik'->'letzte'->0->>'staerke')::numeric between 0.2 and 0.4,
  'Statistik: Kämpfe gegen den Rechner-Gegner, Siege der Spieler, Aufteilung nach Spielstärke, letzte Kämpfe');
select public.rpg_arena_stats() as a1 \gset
select pg_temp.ok((:'a1'::jsonb->>'gegen_bot')::integer >= 1 and (:'a1'::jsonb->>'bot_siege_spieler')::integer >= 1 and :'a1'::jsonb ? 'gegen_mensch' and :'a1'::jsonb ? 'privat'
  and exists (select 1 from jsonb_array_elements(:'a1'::jsonb->'modi') z where z->>'modus' = 'duell'), 'Arena-Auswertung: getrennt nach Mensch, Rechner-Gegner und privat; der Modus kommt vom Kampf (Duell)');
select pg_temp.ok(public.rpg_admin_bot_set(true, 30, 1, 1, -1, 1, 0.5)->'einstellungen' @> '{"aktiv": true, "wartezeit": 30, "staerke_von": 1, "stufe_bis": 1, "schnitt_max": 0.5}'::jsonb, 'Zurück auf die Voreinstellung');
-- Durchschnitt: 80 Gegner gegen ein Team mit den Stufen 3, 6 und 9 (Durchschnitt 6,0)
reset role;
create temp table pg_temp_schnitt (art text, ab numeric);
do $$
declare v_id uuid; v_j jsonb; i integer; art text;
begin
  foreach art in array array['halb', 'null', 'eng'] loop
    if art = 'null' then update public.rpg_arena_bot_settings set schnitt_max = 0; elsif art = 'eng' then update public.rpg_arena_bot_settings set schnitt_max = 0.5, stufe_von = -2, stufe_bis = -2; end if;
    for i in 1..80 loop
      insert into public.rpg_arena_matches (status, host_id, host_name, host_team, host_schnitt)
        values ('offen', '00000000-0000-0000-0000-0000000020a2', 'Adm_Spieler', '[{"held": "trickser", "stufe": 3}, {"held": "berserker", "stufe": 6}, {"held": "gelehrter", "stufe": 9}]', 6.0) returning id into v_id;
      v_j := public.rpg_arena_bot(v_id, 'normal');
      insert into pg_temp_schnitt values (art, (select avg((e->>'stufe')::numeric) from jsonb_array_elements(v_j->'gast'->'team') e) - 6.0);
      update public.rpg_arena_matches set status = 'abgebrochen' where id = v_id;
    end loop;
  end loop;
  update public.rpg_arena_bot_settings set schnitt_max = 0.5, stufe_von = -1, stufe_bis = 1;
end $$;
select pg_temp.ok((select max(abs(ab)) <= 0.5 and count(distinct round(ab, 2)) = 3 from pg_temp_schnitt where art = 'halb'), 'Durchschnitt höchstens ±0,5: 80 Gegner liegen alle im Bereich (' || (select string_agg(distinct to_char(ab, 'FMS0.00'), ' · ') from pg_temp_schnitt where art = 'halb') || ')');
select pg_temp.ok((select max(abs(ab)) = 0 from pg_temp_schnitt where art = 'null'), 'Durchschnitt ±0: immer genau der Durchschnitt des Spielers');
select pg_temp.ok((select min(ab) = -2 and max(ab) = -2 from pg_temp_schnitt where art = 'eng'), 'Passt die Einstellung nicht zusammen (alle Helden −2 bei höchstens ±0,5), gilt die kleinstmögliche Abweichung – die Suche bleibt nicht hängen');
set role authenticated;
reset role;
select pg_temp.ok((select count(*) = 1 from public.rpg_arena_bot_settings) and not has_function_privilege('authenticated', 'public.rpg_arena_bot_cfg()', 'execute') and not has_function_privilege('anon', 'public.rpg_admin_bot()', 'execute')
  and has_function_privilege('authenticated', 'public.rpg_admin_bot()', 'execute'), 'Genau eine Zeile Einstellungen; Rechte: Admin-Funktionen nur für angemeldete Nutzer (und darin nur Admins)');
