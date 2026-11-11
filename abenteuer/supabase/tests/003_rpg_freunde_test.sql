-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 003 (Freunde, Einladungen).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000b1', false), ('00000000-0000-0000-0000-0000000000b2', false),
  ('00000000-0000-0000-0000-0000000000b3', false), ('00000000-0000-0000-0000-0000000000b4', true);
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', case p when 'A' then '00000000-0000-0000-0000-0000000000b1' when 'B' then '00000000-0000-0000-0000-0000000000b2' when 'C' then '00000000-0000-0000-0000-0000000000b3' when 'G' then '00000000-0000-0000-0000-0000000000b4' else '' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if b then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end; raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
set role authenticated;
select pg_temp.als('A'); select public.rpg_set_profile('Arthos');
select pg_temp.als('B'); select public.rpg_set_profile('Bruna');
select pg_temp.als('C'); select public.rpg_set_profile('Cato');
select pg_temp.als('G'); select public.rpg_set_profile('Gastino');

-- Gäste haben keine Freunde
select pg_temp.fehler('select public.rpg_request_friend(''Arthos'')', 'Spielerkonto', 'Gast kann keine Anfragen senden');
-- Suche nur exakt, Gäste unauffindbar
select pg_temp.als('A');
select pg_temp.ok(public.rpg_find_player('bruna')->>'beziehung' = 'keine', 'Arthos findet Bruna (Groß/Klein egal)');
select pg_temp.ok(public.rpg_find_player('Brun') is null and public.rpg_find_player('Gastino') is null and public.rpg_find_player('Arthos') is null, 'Kein Teiltreffer, kein Gast, nicht sich selbst');
select pg_temp.fehler('select * from public.rpg_friendships', 'permission denied', 'Tabelle nicht direkt lesbar');
-- Anfrage und Annahme
select pg_temp.ok(public.rpg_request_friend('Bruna') = 'angefragt', 'Arthos fragt Bruna an');
select pg_temp.ok(public.rpg_request_friend('Bruna') = 'angefragt', 'Doppelte Anfrage bleibt eine');
select pg_temp.ok(public.rpg_find_player('Bruna')->>'beziehung' = 'angefragt', 'Beziehung: angefragt');
select pg_temp.als('B');
select pg_temp.ok(jsonb_array_length(public.rpg_my_inbox()->'freunde') = 1 and public.rpg_my_inbox()->'freunde'->0->>'handle' = 'Arthos', 'Bruna: eine Anfrage von Arthos im Posteingang');
select pg_temp.ok((select count(*) from public.rpg_profiles) = 2, 'Bruna sieht Arthos’ Profil (offene Anfrage)');
select pg_temp.ok(public.rpg_answer_friend('Arthos', true) = 'freund', 'Bruna nimmt an');
select pg_temp.ok(jsonb_array_length(public.rpg_my_inbox()->'freunde') = 0, 'Posteingang danach leer');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_my_friends()->'freunde'->0->>'handle' = 'Bruna', 'Arthos hat Bruna als Freundin');
-- Gegenseitige Anfrage = sofort Freunde
select pg_temp.als('C'); select public.rpg_request_friend('Arthos');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_request_friend('Cato') = 'freund', 'Gegenseitige Anfrage: sofort befreundet');
-- Kampagne mit Freunden
select public.rpg_create_campaign('Mit Freunden') as k \gset
select pg_temp.ok(public.rpg_invite_friend(:'k', 'Bruna') = 'eingeladen', 'Host lädt Bruna ein');
select pg_temp.ok(public.rpg_invite_friend(:'k', 'Bruna') = 'eingeladen', 'Doppelte Einladung bleibt eine');
select pg_temp.fehler(format('select public.rpg_invite_friend(%L, %L)', :'k', 'Gastino'), 'nur Freunde', 'Nicht-Freunde kann man nicht einladen');
select pg_temp.ok(public.rpg_campaign_open_invites(:'k') = '["Bruna"]'::jsonb, 'Offene Einladungen: Bruna');
select pg_temp.als('C');
select pg_temp.fehler(format('select public.rpg_invite_friend(%L, %L)', :'k', 'Bruna'), 'Nur der Host', 'Nur der Host lädt ein');
select pg_temp.ok(jsonb_array_length(public.rpg_my_campaigns()) = 0, 'Cato (nicht eingeladen) sieht die Kampagne nicht');
select pg_temp.als('B');
select pg_temp.ok(public.rpg_my_inbox()->'kampagnen'->0->>'titel' = 'Mit Freunden' and public.rpg_my_inbox()->'kampagnen'->0->>'von' = 'Arthos', 'Bruna: Gruppenanfrage „Mit Freunden“ von Arthos');
select (public.rpg_my_inbox()->'kampagnen'->0->>'id') as einl \gset
select pg_temp.ok(public.rpg_answer_invite(:'einl', true) = 'mitglied', 'Bruna nimmt die Einladung an');
select pg_temp.ok(public.rpg_my_campaigns()->0->>'role' = 'spieler' and public.rpg_my_campaigns()->0->>'title' = 'Mit Freunden', 'Kampagne steht bei Bruna als Mitspielerin');
select pg_temp.fehler(format('select public.rpg_answer_invite(%L, true)', :'einl'), 'gibt es nicht mehr', 'Einladung nicht zweimal annehmbar');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_invite_friend(:'k', 'Bruna') = 'mitglied', 'Schon Mitglied: keine neue Einladung');
select pg_temp.ok(public.rpg_invite_friend(:'k', 'Cato') = 'eingeladen', 'Cato eingeladen');
select pg_temp.als('C');
select (public.rpg_my_inbox()->'kampagnen'->0->>'id') as einl2 \gset
select pg_temp.ok(public.rpg_answer_invite(:'einl2', false) = 'abgelehnt' and jsonb_array_length(public.rpg_my_campaigns()) = 0, 'Cato lehnt ab: keine Kampagne');
-- Entfernen und Blockieren
select pg_temp.als('A');
select public.rpg_remove_friend('Cato');
select pg_temp.ok(jsonb_array_length(public.rpg_my_friends()->'freunde') = 1, 'Freundschaft mit Cato beendet');
select pg_temp.als('C'); select public.rpg_block('Arthos');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_find_player('Cato') is null, 'Wer blockiert, ist für den Blockierten unauffindbar');
select pg_temp.fehler('select public.rpg_request_friend(''Cato'')', 'nicht möglich', 'Blockiert: keine Anfrage möglich');
select pg_temp.als('C');
select pg_temp.ok(public.rpg_my_friends()->'blockiert'->0->>'handle' = 'Arthos', 'Cato sieht seine Blockierliste');
select public.rpg_unblock('Arthos');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_request_friend('Cato') = 'angefragt', 'Nach dem Entsperren wieder anfragbar');
-- Grenze: 20 Anfragen am Tag
reset role;
insert into auth.users (id, is_anonymous) select ('00000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid, false from generate_series(1, 21) i;
insert into public.rpg_profiles (user_id, handle) select ('00000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid, 'Viel' || i from generate_series(1, 21) i;
set role authenticated; select pg_temp.als('B');
do $$ begin for i in 1..20 loop perform public.rpg_request_friend('Viel' || i); end loop; end $$;
select pg_temp.fehler('select public.rpg_request_friend(''Viel21'')', '20 Anfragen', 'Höchstens 20 Anfragen am Tag');
reset role;
\o
\echo 'ALLE PRÜFUNGEN BESTANDEN'
