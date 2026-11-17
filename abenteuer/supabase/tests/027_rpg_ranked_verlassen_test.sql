-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 027 (Zwangsaufgabe nach drei verstrichenen Zügen; Zeitstrafe beim dritten Verstoß in 24 Stunden).
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
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
create function pg_temp.straffrei(p text) returns void language sql security definer as $$ update public.rpg_arena_sperren set bis = now() - interval '1 second' where user_id = ('00000000-0000-0000-0000-0000000027a' || p)::uuid; $$;
-- Kampf zu Ende spielen wie die Edge Function: Zwangsaufgabe der Seite p_wer (dreimal Zugzeit verstrichen), vor p_minuten Minuten
create function pg_temp.zwang(p uuid, p_wer integer, p_minuten integer) returns boolean language plpgsql security definer as $$
declare v_h uuid; v_v integer;
begin select host_id into v_h from public.rpg_arena_matches where id = p; select v into v_v from public.rpg_arena_fights where match_id = p;
  perform public.rpg_arena_srv_save(p, v_h, v_v, jsonb_build_object('ende', 'arena', 'runde', 3, 'arena', jsonb_build_object('sieger', 3 - p_wer, 'aufgabe', true,
    'grund', 'X hat dreimal die Zugzeit verstreichen lassen.', 'aufgabeZeit', (extract(epoch from now() - make_interval(mins => p_minuten)) * 1000)::bigint, 'punkte', jsonb_build_object('1', 0, '2', 0))), '[{"sicht1": {}, "sicht2": {}}]');
  return public.rpg_arena_srv_end(p, v_h); end $$;
create function pg_temp.verstoss(p text, p_minuten integer) returns void language sql security definer as $$ select public.rpg_arena_sperren_setzen(('00000000-0000-0000-0000-0000000027a' || p)::uuid, now() - make_interval(mins => p_minuten), null); $$;
create function pg_temp.fenster(p text, p_stunden integer, n integer) returns void language sql security definer as $$ update public.rpg_arena_sperren set verstoesse = n, fenster_ab = now() - make_interval(hours => p_stunden), bis = null where user_id = ('00000000-0000-0000-0000-0000000027a' || p)::uuid; $$;
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
select public.rpg_arena_sperre() as sp1 \gset
select pg_temp.ok(not (:'sp1'::jsonb->>'gesperrt')::boolean and (:'sp1'::jsonb->>'verstoesse')::int = 1 and (:'sp1'::jsonb->>'verstoesse_max')::int = 3
  and (:'sp1'::jsonb->>'fenster_bis')::timestamptz between now() + interval '23 hours 50 minutes' and now() + interval '24 hours', 'Das zählt als erster Verstoß (1 von 3); die 24 Stunden laufen ab dem Zeitpunkt, an dem der dritte Zug verstrichen wäre – noch keine Zeitstrafe');
select pg_temp.ok(public.rpg_ranked_queue()->>'status' = 'offen', 'Nach dem ersten Verstoß kann Anna weiter suchen');

-- ---------- gegen einen Menschen: unverändert ----------
select pg_temp.schluss();
select pg_temp.als('A'); select public.rpg_ranked_queue() as m1 \gset
select pg_temp.als('B'); select public.rpg_ranked_queue() as m2 \gset
select pg_temp.ok(:'m2'::jsonb->>'status' = 'bereit' and :'m2'::jsonb->>'id' = :'m1'::jsonb->>'id' and pg_temp.beginnen((:'m1'::jsonb->>'id')::uuid), 'Anna gegen Ben: der Kampf beginnt');
select pg_temp.still((:'m1'::jsonb->>'id')::uuid, 30);
select pg_temp.ok((public.rpg_ranked_status()->'ich'->>'punkte')::int = 130 and (pg_temp.kampf((:'m1'::jsonb->>'id')::uuid)).status = 'laeuft', 'Gegen einen Menschen greift die Regel nicht (dort hält das Gerät des Gegners den Kampf in Gang)');
-- ---------- Zwangsaufgabe im Kampf (gegen einen Menschen): Zeitstrafe für den, der die Zeit verstreichen ließ ----------
select pg_temp.ok(pg_temp.zwang((:'m1'::jsonb->>'id')::uuid, 2, 0), 'Ben lässt dreimal die Zugzeit verstreichen: Der Server beendet den Kampf als Aufgabe');
select pg_temp.als('B');
select pg_temp.ok(not (public.rpg_arena_sperre()->>'gesperrt')::boolean and (public.rpg_arena_sperre()->>'verstoesse')::int = 1, 'Ben: erster Verstoß, noch keine Zeitstrafe');
select pg_temp.ok((public.rpg_ranked_status()->'ich'->>'punkte')::int = 115, 'Ben verliert die üblichen 15 Punkte');
select pg_temp.als('A');
select pg_temp.ok((public.rpg_arena_sperre()->>'verstoesse')::int = 1 and (public.rpg_ranked_status()->'ich'->>'punkte')::int = 140, 'Anna (Siegerin) bekommt keinen Verstoß und ihre 25 Punkte');
-- freiwillig aufgeben: kein Verstoß
select public.rpg_ranked_queue() as f1 \gset
select pg_temp.altern((:'f1'::jsonb->>'id')::uuid, 45);
select pg_temp.ok(public.rpg_ranked_queue()->>'status' = 'bereit' and pg_temp.beginnen((:'f1'::jsonb->>'id')::uuid), 'Anna beginnt einen weiteren Kampf gegen den Rechner-Gegner');
select pg_temp.ok(public.rpg_arena_cancel((:'f1'::jsonb->>'id')::uuid) is not null and (public.rpg_arena_sperre()->>'verstoesse')::int = 1, 'Freiwillig aufgegeben („Aufgeben“): kein Verstoß');
-- zweiter Verstoß (Zwangsaufgabe im Kampf): weiter keine Zeitstrafe
select public.rpg_ranked_queue() as g1 \gset
select pg_temp.altern((:'g1'::jsonb->>'id')::uuid, 45);
select pg_temp.ok(public.rpg_ranked_queue()->>'status' = 'bereit' and pg_temp.beginnen((:'g1'::jsonb->>'id')::uuid) and pg_temp.zwang((:'g1'::jsonb->>'id')::uuid, 1, 0), 'Anna lässt in einem zweiten Kampf dreimal die Zugzeit verstreichen');
select pg_temp.ok(not (public.rpg_arena_sperre()->>'gesperrt')::boolean and (public.rpg_arena_sperre()->>'verstoesse')::int = 2 and public.rpg_ranked_queue()->>'status' = 'offen', 'Zweiter Verstoß (2 von 3): Anna kann weiter suchen');
-- dritter Verstoß innerhalb von 24 Stunden: eine Stunde Zeitstrafe, Zähler zurück auf 0
select pg_temp.schluss();
select pg_temp.verstoss('1', 0);
select public.rpg_arena_sperre() as sp3 \gset
select pg_temp.ok((:'sp3'::jsonb->>'gesperrt')::boolean and (:'sp3'::jsonb->>'sekunden')::int between 59 * 60 and 3600 and (:'sp3'::jsonb->>'verstoesse')::int = 0, 'Dritter Verstoß: eine Stunde Zeitstrafe, der Zähler steht wieder auf 0');
select pg_temp.fehler('select public.rpg_ranked_queue()', 'Zeitstrafe: .* in (59|60) Minuten', 'Während der Zeitstrafe: keine Ranked-Suche');
select pg_temp.fehler('select public.rpg_arena_queue(''normal'')', 'Zeitstrafe', '… und keine normale Suche');
select pg_temp.fehler('select public.rpg_arena_queue(''arcade'')', 'Zeitstrafe', '… und keine Arcade-Suche');
select pg_temp.straffrei('1');
select pg_temp.ok(not (public.rpg_arena_sperre()->>'gesperrt')::boolean and public.rpg_ranked_queue()->>'status' = 'offen', 'Nach Ablauf der Stunde kann Anna wieder suchen');
select pg_temp.verstoss('1', 0);
select pg_temp.ok(not (public.rpg_arena_sperre()->>'gesperrt')::boolean and (public.rpg_arena_sperre()->>'verstoesse')::int = 1, 'Der nächste Verstoß danach ist wieder der erste');
-- 24 Stunden um: Der Zähler beginnt neu
select pg_temp.als('B');
select pg_temp.fenster('2', 25, 2);
select pg_temp.ok((public.rpg_arena_sperre()->>'verstoesse')::int = 0, 'Zwei Verstöße, aber der erste ist über 24 Stunden her: Der Zähler zeigt wieder 0');
select pg_temp.verstoss('2', 0);
select pg_temp.ok(not (public.rpg_arena_sperre()->>'gesperrt')::boolean and (public.rpg_arena_sperre()->>'verstoesse')::int = 1, 'Ein neuer Verstoß zählt dann als erster – keine Zeitstrafe');
-- der dritte Verstoß liegt schon länger zurück (Rückkehr nach Stunden): Die Stunde zählt ab dem Verstoß
select pg_temp.fenster('2', 5, 2);
select pg_temp.verstoss('2', 180);
select pg_temp.ok(not (public.rpg_arena_sperre()->>'gesperrt')::boolean and (public.rpg_arena_sperre()->>'verstoesse')::int = 0, 'Dritter Verstoß vor drei Stunden: Die Stunde ist schon um, der Zähler steht auf 0');
select pg_temp.schluss();
reset role;
select pg_temp.ok((select count(*) = 2 from public.rpg_arena_sperren where user_id::text like '00000000-0000-0000-0000-0000000027a%') and not has_table_privilege('authenticated', 'public.rpg_arena_sperren', 'select')
  and has_function_privilege('authenticated', 'public.rpg_arena_sperre()', 'execute') and not has_function_privilege('authenticated', 'public.rpg_arena_sperren_setzen(uuid, timestamptz, uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.rpg_arena_sperre_pruefen()', 'execute'), 'Verstöße und Zeitstrafen lassen sich nur ansehen, nicht selbst setzen oder löschen');
select pg_temp.ok(not has_function_privilege('authenticated', 'public.rpg_ranked_nachholen(uuid)', 'execute') and not has_function_privilege('anon', 'public.rpg_ranked_nachholen(uuid)', 'execute'), 'Rechte unverändert: Die Funktion ist nicht direkt aufrufbar');
