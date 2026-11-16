-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 015 (Arena: der Server rechnet den Kampf).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-0000000015a1', false), ('00000000-0000-0000-0000-0000000015a2', false),
  ('00000000-0000-0000-0000-0000000015a3', false), ('00000000-0000-0000-0000-0000000015a4', false);
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000015a1', 'Server_A'), ('00000000-0000-0000-0000-0000000015a2', 'Server_B'), ('00000000-0000-0000-0000-0000000015a3', 'Geraet_C'), ('00000000-0000-0000-0000-0000000015a4', 'Dritter_D');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select u, hero_id, 'code' from public.rpg_hero_catalog,
  (values ('00000000-0000-0000-0000-0000000015a1'::uuid), ('00000000-0000-0000-0000-0000000015a2'::uuid), ('00000000-0000-0000-0000-0000000015a3'::uuid), ('00000000-0000-0000-0000-0000000015a4'::uuid)) v(u);
insert into public.rpg_arena_squads (user_id, team) select u, array['schildwaechter', 'trickser', 'lichtbringer'] from
  (values ('00000000-0000-0000-0000-0000000015a1'::uuid), ('00000000-0000-0000-0000-0000000015a2'::uuid), ('00000000-0000-0000-0000-0000000015a3'::uuid), ('00000000-0000-0000-0000-0000000015a4'::uuid)) v(u);
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000015a' || case p when 'A' then '1' when 'B' then '2' when 'C' then '3' else '4' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
set role authenticated;

-- ---------- Suche: getrennte Töpfe ----------
select pg_temp.als('C');
select public.rpg_arena_search() as c1 \gset
select pg_temp.als('A');
select public.rpg_arena_search_server() as a1 \gset
select pg_temp.ok(:'a1'::jsonb->>'status' = 'offen' and :'a1'::jsonb->>'id' <> :'c1'::jsonb->>'id', 'A sucht einen Serverkampf: wird nicht mit C verbunden, der einen Geräte-Kampf sucht');
select pg_temp.als('C');
select pg_temp.ok(public.rpg_arena_search()->>'status' = 'offen', 'C (Geräte-Kampf) wird umgekehrt auch nicht mit A verbunden');
select pg_temp.als('B');
select public.rpg_arena_search_server() as b1 \gset
select pg_temp.ok(:'b1'::jsonb->>'status' = 'bereit' and :'b1'::jsonb->>'id' = :'a1'::jsonb->>'id' and (:'b1'::jsonb->>'seite')::int = 2, 'B sucht einen Serverkampf: wird mit A verbunden');
select (:'a1'::jsonb->>'id') as id \gset

-- ---------- Sicht der Spieler ----------
select public.rpg_arena_fight(:'id'::uuid, 0) as fb \gset
select pg_temp.ok((:'fb'::jsonb->>'server')::boolean and (:'fb'::jsonb->>'seite')::int = 2 and not (:'fb'::jsonb->>'laeuft')::boolean and (:'fb'::jsonb->>'beginn')::bigint > (:'fb'::jsonb->>'jetzt')::bigint
  and jsonb_array_length(:'fb'::jsonb->'schritte') = 0, 'rpg_arena_fight: Serverkampf, noch nicht begonnen, Startzeit liegt in der Zukunft');
select pg_temp.ok(public.rpg_arena_fight_leader(:'id'::uuid, 2), 'B bestimmt seinen Anführer (Platz 3)');
select pg_temp.ok((public.rpg_arena_fight(:'id'::uuid, 0)->>'anfuehrer')::int = 2, 'B liest ihn wieder');
select pg_temp.fehler(format('select public.rpg_arena_fight_leader(%L, 5)', :'id'), 'Ungültiger Anführer', 'Anführer außerhalb des Teams wird abgelehnt');
select pg_temp.als('A');
select pg_temp.ok((public.rpg_arena_fight(:'id'::uuid, 0)->>'anfuehrer')::int = 0 and (public.rpg_arena_fight(:'id'::uuid, 0)->>'seite')::int = 1, 'A sieht nur seinen eigenen Anführer (0), nicht den von B');
select pg_temp.als('D');
select pg_temp.fehler(format('select public.rpg_arena_fight(%L, 0)', :'id'), 'gibt es nicht', 'Ein Unbeteiligter kann den Kampf nicht lesen');
select pg_temp.fehler(format('select public.rpg_arena_fight_leader(%L, 1)', :'id'), 'gibt es nicht', 'Ein Unbeteiligter kann keinen Anführer setzen');
select pg_temp.als('C');
select pg_temp.ok(not (public.rpg_arena_fight((:'c1'::jsonb->>'id')::uuid, 0)->>'server')::boolean, 'Ein Geräte-Kampf meldet: kein Serverkampf');

-- ---------- Die Server-Funktionen sind für Spieler gesperrt ----------
select pg_temp.als('A');
select pg_temp.fehler(format('select public.rpg_arena_srv_load(%L, %L)', :'id', '00000000-0000-0000-0000-0000000015a1'), 'permission denied', 'Spieler dürfen rpg_arena_srv_load nicht aufrufen');
select pg_temp.fehler(format('select public.rpg_arena_srv_save(%L, %L, 0, ''{}''::jsonb, ''[]''::jsonb)', :'id', '00000000-0000-0000-0000-0000000015a1'), 'permission denied', 'Spieler dürfen rpg_arena_srv_save nicht aufrufen');
select pg_temp.fehler(format('select public.rpg_arena_srv_end(%L)', :'id'), 'permission denied', 'Spieler dürfen rpg_arena_srv_end nicht aufrufen');
select pg_temp.fehler('select * from public.rpg_arena_fights', 'permission denied', 'Der Stand des Kampfes ist nicht direkt lesbar');
select pg_temp.fehler('select * from public.rpg_arena_steps', 'permission denied', 'Die Sichten sind nicht direkt lesbar');
select pg_temp.fehler('select * from public.rpg_arena_search_srv', 'permission denied', 'Die Suchliste des Serverkampfs ist nicht direkt lesbar');

-- ---------- Was die Edge Function tut (hier als Datenbank-Eigentümer) ----------
reset role;
\set ua '00000000-0000-0000-0000-0000000015a1'
\set ub '00000000-0000-0000-0000-0000000015a2'
\set ud '00000000-0000-0000-0000-0000000015a4'
select public.rpg_arena_srv_load(:'id'::uuid, :'ua'::uuid) as l0 \gset
select pg_temp.ok((:'l0'::jsonb->>'seite')::int = 1 and (:'l0'::jsonb->'kampf'->>'v')::int = 0 and :'l0'::jsonb->'kampf'->'st' = 'null'::jsonb and (:'l0'::jsonb->'kampf'->>'anf2')::int = 2 and :'l0'::jsonb->'match'->>'host_name' = 'Server_A'
  and jsonb_array_length(:'l0'::jsonb->'match'->'guest_team') = 3 and :'l0'::jsonb->'match'->>'seed' is not null and (:'l0'::jsonb->'match'->>'kampfstufe')::int = 1, 'srv_load für Teilnehmer A: Seite 1, Teams, Namen, Karte, Zufallszahl, Anführer');
select pg_temp.ok((public.rpg_arena_srv_load(:'id'::uuid, :'ub'::uuid)->>'seite')::int = 2, 'srv_load für Teilnehmer B: Seite 2');
select pg_temp.ok(public.rpg_arena_srv_load(:'id'::uuid, :'ud'::uuid) is null and public.rpg_arena_srv_load(:'id'::uuid, null) is null, 'srv_load für ein Konto, das nicht teilnimmt (oder ohne Konto): nichts');
select pg_temp.ok(public.rpg_arena_srv_load((:'c1'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000015a3'::uuid) is null, 'srv_load für einen Geräte-Kampf: nichts, auch für dessen Teilnehmer');
select pg_temp.ok(not public.rpg_arena_srv_save(:'id'::uuid, :'ud'::uuid, 0, '{"rs": 1}'::jsonb, '[{"sicht1": {}, "sicht2": {}}]'::jsonb), 'srv_save im Namen eines Unbeteiligten: abgelehnt');
select pg_temp.ok((select v = 0 and st is null from public.rpg_arena_fights where match_id = :'id'::uuid), '… und nichts gespeichert');
select pg_temp.fehler(format('select public.rpg_arena_srv_save(%L, %L, 0, ''{"rs": 1}''::jsonb, ''[]''::jsonb)', :'id', :'ua'), 'Ungültiger Stand', 'srv_save ohne Schritte wird abgelehnt');
select pg_temp.fehler(format('select public.rpg_arena_srv_save(%L, %L, 0, ''{"rs": 1}''::jsonb, ''[{"sicht1": 5, "sicht2": {}}]''::jsonb)', :'id', :'ua'), 'Ungültiger Stand', 'srv_save mit kaputter Sicht wird abgelehnt');
select pg_temp.ok(not public.rpg_arena_srv_end(:'id'::uuid), 'srv_end vor dem ersten Stand: trägt nichts ein');
select pg_temp.ok(public.rpg_arena_srv_save(:'id'::uuid, :'ua'::uuid, 0, '{"rs": 42, "geheim": true, "runde": 1, "arena": {"punkte": {"1": 0, "2": 0}}}'::jsonb,
  '[{"sicht1": {"fuer": 1, "n": 1}, "sicht2": {"fuer": 2, "n": 1}}, {"sicht1": {"fuer": 1, "n": 2}, "sicht2": {"fuer": 2, "n": 2}}]'::jsonb), 'srv_save: erster Stand mit zwei Schritten gespeichert');
select pg_temp.ok((select status = 'laeuft' and started_at is not null from public.rpg_arena_matches where id = :'id'::uuid), 'Mit dem ersten Stand läuft der Kampf');
select pg_temp.ok(not public.rpg_arena_srv_save(:'id'::uuid, :'ub'::uuid, 0, '{"rs": 1}'::jsonb, '[{"sicht1": {}, "sicht2": {}}]'::jsonb), 'srv_save auf veraltetem Stand (gleichzeitiger Aufruf): abgelehnt');
select pg_temp.ok((select v = 2 and (st->>'rs')::int = 42 from public.rpg_arena_fights where match_id = :'id'::uuid), '… und nichts überschrieben');
select pg_temp.ok(public.rpg_arena_srv_save(:'id'::uuid, :'ub'::uuid, 2, '{"rs": 43, "runde": 2, "arena": {"punkte": {"1": 1, "2": 0}}}'::jsonb, '[{"sicht1": {"fuer": 1, "n": 3}, "sicht2": {"fuer": 2, "n": 3}}]'::jsonb), 'srv_save auf aktuellem Stand: gespeichert');
select pg_temp.ok((select v = 3 and (st->>'rs')::int = 43 from public.rpg_arena_fights where match_id = :'id'::uuid), 'Der Kampf steht bei Schritt 3');
select pg_temp.ok(not public.rpg_arena_srv_end(:'id'::uuid), 'srv_end, solange der gespeicherte Stand nicht beendet ist: trägt nichts ein');
select pg_temp.ok((select status = 'laeuft' and sieger is null from public.rpg_arena_matches where id = :'id'::uuid) and (select count(*) = 0 from public.rpg_arena_rewards where match_id = :'id'::uuid), '… der Kampf läuft weiter, keine Belohnung');
set role authenticated;
select pg_temp.als('A');
select public.rpg_arena_fight(:'id'::uuid, 1) as fa \gset
select pg_temp.ok((:'fa'::jsonb->>'v')::int = 3 and (:'fa'::jsonb->>'laeuft')::boolean and jsonb_array_length(:'fa'::jsonb->'schritte') = 2 and (:'fa'::jsonb->'schritte'->0->>'v')::int = 2
  and (:'fa'::jsonb->'schritte'->0->'st'->>'fuer')::int = 1 and (:'fa'::jsonb->'schritte'->1->'st'->>'n')::int = 3, 'A liest ab Schritt 1: die Schritte 2 und 3, in SEINER Sicht');
select pg_temp.ok(:'fa'::text !~ 'geheim' and :'fa'::text !~ '"rs"', 'Der vollständige Stand (mit Zufallsgenerator) erscheint in keiner Antwort');
select pg_temp.als('B');
select pg_temp.ok((public.rpg_arena_fight(:'id'::uuid, 0)->'schritte'->0->'st'->>'fuer')::int = 2 and jsonb_array_length(public.rpg_arena_fight(:'id'::uuid, 3)->'schritte') = 0, 'B bekommt seine Sicht; ab dem neuesten Schritt gibt es nichts Neues');
select pg_temp.ok(not public.rpg_arena_fight_leader(:'id'::uuid, 0), 'Nach dem Start lässt sich der Anführer nicht mehr ändern');

-- ---------- Ergebnis: steht im gespeicherten Stand, niemand reicht es hinein ----------
reset role;
select pg_temp.ok(not public.rpg_arena_srv_end((:'c1'::jsonb->>'id')::uuid), 'srv_end für einen Kampf der bisherigen Arena: unmöglich');
select pg_temp.ok((select status = 'offen' from public.rpg_arena_matches where id = (:'c1'::jsonb->>'id')::uuid), '… der Geräte-Kampf ist unberührt');
select pg_temp.ok(public.rpg_arena_srv_save(:'id'::uuid, :'ua'::uuid, 3, '{"rs": 44, "runde": 15, "ende": "arena", "arena": {"sieger": 2, "grund": "Nach 15 Runden entscheiden die Punkte.", "punkte": {"1": 3, "2": 7}}}'::jsonb,
  '[{"sicht1": {"fuer": 1, "n": 4, "ende": "arena"}, "sicht2": {"fuer": 2, "n": 4, "ende": "arena"}}]'::jsonb), 'Der Server speichert den letzten, beendeten Stand');
select pg_temp.ok(public.rpg_arena_srv_end(:'id'::uuid), 'srv_end: Ergebnis aus dem Stand eingetragen');
select pg_temp.ok((select status = 'beendet' and sieger = 2 and grund = 'punkte' and runden = 15 and (punkte->>'2')::int = 7 from public.rpg_arena_matches where id = :'id'::uuid), 'Kampf ist beendet: Sieger, Grund, Punkte und Runden stammen aus dem Stand');
select pg_temp.ok((select count(*) = 2 and bool_or(sieg) and bool_or(not sieg) and bool_and(gewertet) from public.rpg_arena_rewards where match_id = :'id'::uuid), 'Belohnungen für beide gebucht: ein Sieg, eine Niederlage');
select pg_temp.ok((select betrag > 0 from public.rpg_wallet where user_id = '00000000-0000-0000-0000-0000000015a2'), 'Der Sieger hat Seelensplitter bekommen');
select pg_temp.ok(not public.rpg_arena_srv_end(:'id'::uuid), 'Zweiter Aufruf von srv_end: ändert nichts');
select pg_temp.ok((select count(*) = 2 from public.rpg_arena_rewards where match_id = :'id'::uuid), '… keine doppelte Belohnung');
select pg_temp.ok(not public.rpg_arena_srv_save(:'id'::uuid, :'ua'::uuid, 4, '{"rs": 45}'::jsonb, '[{"sicht1": {}, "sicht2": {}}]'::jsonb), 'Nach dem Ende lässt sich kein Stand mehr speichern');
set role authenticated;
select pg_temp.als('B');
select pg_temp.ok(public.rpg_arena_get(:'id'::uuid)->>'status' = 'beendet' and (public.rpg_arena_get(:'id'::uuid)->'belohnung'->>'sieg')::boolean, 'B sieht über die vorhandene Funktion rpg_arena_get: beendet, Sieg, Belohnung');
select pg_temp.ok(public.rpg_arena_fight(:'id'::uuid, 3)->>'status' = 'beendet', 'rpg_arena_fight meldet den beendeten Kampf');
reset role;
select pg_temp.ok(not has_function_privilege('authenticated', 'public.rpg_arena_srv_end(uuid)', 'execute') and not has_function_privilege('anon', 'public.rpg_arena_srv_end(uuid)', 'execute') and not has_function_privilege('authenticated', 'public.rpg_arena_srv_save(uuid, uuid, integer, jsonb, jsonb)', 'execute') and not has_function_privilege('anon', 'public.rpg_arena_srv_load(uuid, uuid)', 'execute') and not has_function_privilege('anon', 'public.rpg_arena_fight(uuid, integer)', 'execute')
  and has_function_privilege('authenticated', 'public.rpg_arena_search_server()', 'execute') and not has_table_privilege('authenticated', 'public.rpg_arena_fights', 'select'), 'Rechte: Spieler lesen nur ihre Sicht; Stand und Ergebnis schreibt nur der Server');
