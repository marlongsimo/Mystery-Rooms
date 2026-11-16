-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 014 (gespeichertes Arena-Team und Gegnersuche).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-0000000014a1', false),  -- A: alle Helden Stufe 1
  ('00000000-0000-0000-0000-0000000014a2', false),  -- B: alle Helden Stufe 1
  ('00000000-0000-0000-0000-0000000014a3', false),  -- C: drei Helden auf Stufe 6 (zu weit entfernt)
  ('00000000-0000-0000-0000-0000000014a4', false),  -- D: Stufe 1
  ('00000000-0000-0000-0000-0000000014a5', true);   -- G: Gast
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000014a1', 'Sucher_A'), ('00000000-0000-0000-0000-0000000014a2', 'Sucher_B'), ('00000000-0000-0000-0000-0000000014a3', 'Sucher_C'), ('00000000-0000-0000-0000-0000000014a4', 'Sucher_D');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select u, hero_id, 'code' from public.rpg_hero_catalog,
  (values ('00000000-0000-0000-0000-0000000014a1'::uuid), ('00000000-0000-0000-0000-0000000014a2'::uuid), ('00000000-0000-0000-0000-0000000014a3'::uuid), ('00000000-0000-0000-0000-0000000014a4'::uuid)) v(u);
insert into public.rpg_hero_progress (user_id, hero_id, xp) select '00000000-0000-0000-0000-0000000014a3', h, 1350 from unnest(array['schildwaechter', 'trickser', 'lichtbringer']) h;
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000014a' || case p when 'A' then '1' when 'B' then '2' when 'C' then '3' when 'D' then '4' else '5' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
set role authenticated;

-- ---------- Mein Team ----------
select pg_temp.als('A');
select pg_temp.fehler('select * from public.rpg_arena_squads', 'permission denied', 'Teams sind nicht direkt lesbar');
select pg_temp.fehler('insert into public.rpg_arena_search (match_id, user_id) values (gen_random_uuid(), gen_random_uuid())', 'permission denied', 'Die Suchliste ist nicht direkt schreibbar');
select pg_temp.ok(public.rpg_arena_squad()->'team' = 'null'::jsonb and (public.rpg_arena_squad()->>'konto')::boolean, 'Ohne gespeichertes Team: team = null');
select pg_temp.fehler('select public.rpg_arena_search()', 'Lege zuerst dein Team fest', 'Suche ohne Team wird abgelehnt');
select pg_temp.fehler('select public.rpg_arena_squad_set(array[''schildwaechter'', ''trickser''])', 'genau drei', 'Team braucht genau drei Helden');
select pg_temp.ok((public.rpg_arena_squad_set(array['schildwaechter', 'trickser', 'lichtbringer'])->>'schnitt')::numeric = 1.0, 'Team gespeichert, Schnitt 1,0');
select pg_temp.ok(jsonb_array_length(public.rpg_arena_squad()->'team') = 3 and public.rpg_arena_squad()->'team'->0->>'held' = 'schildwaechter', 'Team wird wieder gelesen');
select pg_temp.ok((public.rpg_arena_squad_set(array['berserker', 'trickser', 'lichtbringer'])->'team'->0->>'held') = 'berserker', 'Team lässt sich ändern');
select pg_temp.als('G');
select pg_temp.fehler('select public.rpg_arena_squad_set(array[''schildwaechter'', ''trickser'', ''lichtbringer''])', 'Spielerkonto', 'Gäste haben kein Team');

-- ---------- Suche ----------
select pg_temp.als('A');
select public.rpg_arena_search() as a1 \gset
select pg_temp.ok(:'a1'::jsonb->>'status' = 'offen' and (:'a1'::jsonb->>'seite')::int = 1, 'A sucht: noch niemand da, A wartet');
select pg_temp.ok(public.rpg_arena_search()->>'id' = :'a1'::jsonb->>'id', 'Erneuter Aufruf (Lebenszeichen): derselbe Eintrag, kein zweiter');
select pg_temp.ok(public.rpg_arena_search_count() = 0, 'A sieht sich selbst nicht als Suchenden');

select pg_temp.als('C');
select public.rpg_arena_squad_set(array['schildwaechter', 'trickser', 'lichtbringer']) as c0 \gset
select public.rpg_arena_search() as c1 \gset
select pg_temp.ok(:'c1'::jsonb->>'status' = 'offen' and :'c1'::jsonb->>'id' <> :'a1'::jsonb->>'id', 'C (Stufe 6) wird nicht mit A (Stufe 1) verbunden und wartet selbst');
select pg_temp.ok(public.rpg_arena_search_count() = 1, 'C sieht: ein anderer sucht');

select pg_temp.als('B');
select public.rpg_arena_squad_set(array['duellant', 'trickser', 'lichtbringer']) as b0 \gset
select public.rpg_arena_search() as b1 \gset
select pg_temp.ok(:'b1'::jsonb->>'status' = 'bereit' and :'b1'::jsonb->>'id' = :'a1'::jsonb->>'id' and (:'b1'::jsonb->>'seite')::int = 2 and :'b1'::jsonb->'host'->>'name' = 'Sucher_A',
  'B sucht: wird mit A verbunden (passende Stufe), nicht mit C');
select pg_temp.ok(:'b1'::jsonb->>'karte' is not null and :'b1'::jsonb->>'seed' is not null and :'b1'::jsonb->'gast'->'team'->0->>'held' = 'duellant', 'Karte und Startwert sind ausgelost, B tritt mit seinem gespeicherten Team an');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_arena_search()->>'status' = 'bereit' and public.rpg_arena_search()->'gast'->>'name' = 'Sucher_B', 'A erfährt beim nächsten Aufruf: Gegner gefunden');

-- Verbundene werden nicht noch einmal vermittelt
select pg_temp.als('D');
select public.rpg_arena_squad_set(array['schildwaechter', 'trickser', 'lichtbringer']) as d0 \gset
select public.rpg_arena_search() as d1 \gset
select pg_temp.ok(:'d1'::jsonb->>'status' = 'offen' and :'d1'::jsonb->>'id' <> :'a1'::jsonb->>'id', 'D sucht: A und B sind vergeben, D wartet');

-- Abbrechen, und: Wer kein Lebenszeichen mehr sendet, wird nicht vermittelt
select public.rpg_arena_cancel((:'d1'::jsonb->>'id')::uuid) as x0 \gset
select pg_temp.als('A');
select public.rpg_arena_cancel((:'a1'::jsonb->>'id')::uuid) as y0 \gset
select pg_temp.als('D');
select public.rpg_arena_search() as d2 \gset
reset role;
update public.rpg_arena_search set seen_at = now() - interval '40 seconds' where match_id = (:'d2'::jsonb->>'id')::uuid;
set role authenticated;
select pg_temp.als('A');
select public.rpg_arena_search() as a2 \gset
select pg_temp.ok(:'a2'::jsonb->>'status' = 'offen' and :'a2'::jsonb->>'id' <> :'d2'::jsonb->>'id', 'D sendet seit 40 Sekunden nichts mehr: A wird nicht mit D verbunden');
-- D kommt zurück: Beide suchen schon – der später Gekommene tritt dem Älteren bei
select pg_temp.als('D');
select public.rpg_arena_search() as d3 \gset
select pg_temp.ok(:'d3'::jsonb->>'status' = 'offen', 'D ist der Ältere und bleibt Ersteller');
select pg_temp.als('A');
select public.rpg_arena_search() as a3 \gset
select pg_temp.ok(:'a3'::jsonb->>'status' = 'bereit' and :'a3'::jsonb->>'id' = :'d2'::jsonb->>'id' and (:'a3'::jsonb->>'seite')::int = 2, 'A (später gekommen) tritt D bei');
reset role;
select pg_temp.ok((select status from public.rpg_arena_matches where id = (:'a2'::jsonb->>'id')::uuid) = 'abgebrochen', 'As eigener Sucheintrag ist verworfen');
select pg_temp.ok(has_function_privilege('authenticated', 'public.rpg_arena_search()', 'execute') and not has_function_privilege('anon', 'public.rpg_arena_search()', 'execute')
  and not has_function_privilege('anon', 'public.rpg_arena_squad_set(text[])', 'execute') and not has_table_privilege('authenticated', 'public.rpg_arena_squads', 'select'), 'Rechte: nur angemeldete Nutzer, Tabellen nur über Funktionen');
