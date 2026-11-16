-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 016 (Arena: Normal, Arcade, privater Kampf).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-0000000016a1', false), ('00000000-0000-0000-0000-0000000016a2', false),
  ('00000000-0000-0000-0000-0000000016a3', false), ('00000000-0000-0000-0000-0000000016a4', false), ('00000000-0000-0000-0000-0000000016a5', false);
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000016a1', 'Art_A'), ('00000000-0000-0000-0000-0000000016a2', 'Art_B'), ('00000000-0000-0000-0000-0000000016a3', 'Art_C'), ('00000000-0000-0000-0000-0000000016a4', 'Art_D'), ('00000000-0000-0000-0000-0000000016a5', 'Fremd_E');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select u.id, hero_id, 'code' from public.rpg_hero_catalog, (select id from auth.users where id::text like '00000000-0000-0000-0000-0000000016a%') u;
insert into public.rpg_arena_squads (user_id, team) select id, array['schildwaechter', 'trickser', 'lichtbringer'] from auth.users where id::text like '00000000-0000-0000-0000-0000000016a%' and id::text not like '%a3';
-- C hat starke Helden (Stufe 6): für die Suche zu weit weg, für den privaten Kampf egal
insert into public.rpg_hero_progress (user_id, hero_id, xp) select '00000000-0000-0000-0000-0000000016a3', h, 1350 from unnest(array['schildwaechter', 'trickser', 'lichtbringer']) h;
insert into public.rpg_arena_squads (user_id, team) values ('00000000-0000-0000-0000-0000000016a3', array['schildwaechter', 'trickser', 'lichtbringer']);
-- A ist mit B und C befreundet, nicht mit E
insert into public.rpg_friendships (requester_id, addressee_id, status) select a, b, 'accepted' from (values
  ('00000000-0000-0000-0000-0000000016a1'::uuid, '00000000-0000-0000-0000-0000000016a2'::uuid), ('00000000-0000-0000-0000-0000000016a1'::uuid, '00000000-0000-0000-0000-0000000016a3'::uuid)) v(a, b);
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000016a' || case p when 'A' then '1' when 'B' then '2' when 'C' then '3' when 'D' then '4' else '5' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
select pg_temp.ok(public.rpg_sind_freunde('00000000-0000-0000-0000-0000000016a1', '00000000-0000-0000-0000-0000000016a2') and public.rpg_sind_freunde('00000000-0000-0000-0000-0000000016a3', '00000000-0000-0000-0000-0000000016a1') and not public.rpg_sind_freunde('00000000-0000-0000-0000-0000000016a1', '00000000-0000-0000-0000-0000000016a5'), 'Vorbereitung: A hat zwei Freunde');
set role authenticated;

-- ---------- Normal und Arcade: getrennte Warteschlangen ----------
select pg_temp.als('A');
select pg_temp.fehler('select public.rpg_arena_queue(''turnier'')', 'Unbekannte Spielart', 'Unbekannte Spielart wird abgelehnt');
select public.rpg_arena_queue('normal') as a1 \gset
select pg_temp.als('B');
select public.rpg_arena_queue('arcade') as b1 \gset
select pg_temp.ok(:'a1'::jsonb->>'status' = 'offen' and :'b1'::jsonb->>'status' = 'offen' and :'a1'::jsonb->>'id' <> :'b1'::jsonb->>'id', 'A sucht Normal, B sucht Arcade: Sie werden nicht verbunden');
select pg_temp.als('E');
select pg_temp.ok(public.rpg_arena_search_server()->>'status' = 'bereit' and public.rpg_arena_search_server()->>'id' = :'b1'::jsonb->>'id', 'Die ältere Server-Suche (015) verbindet mit dem Arcade-Suchenden B – nie mit dem Normal-Suchenden A, obwohl A länger wartet');
reset role;
update public.rpg_arena_matches set status = 'abgebrochen' where id = (:'b1'::jsonb->>'id')::uuid;
set role authenticated;
select pg_temp.als('B');
select public.rpg_arena_queue('arcade') as b1 \gset
select pg_temp.als('D');
select public.rpg_arena_queue('normal') as d1 \gset
select pg_temp.ok(:'d1'::jsonb->>'status' = 'bereit' and :'d1'::jsonb->>'id' = :'a1'::jsonb->>'id', 'D sucht Normal: wird mit A verbunden');
select pg_temp.ok(public.rpg_arena_fight((:'d1'::jsonb->>'id')::uuid, 0)->>'modus' = 'duell' and not (public.rpg_arena_fight((:'d1'::jsonb->>'id')::uuid, 0)->>'privat')::boolean, 'Normal: Der Modus ist Duell, mit Wertung');
reset role;
select pg_temp.ok(public.rpg_arena_srv_load((:'d1'::jsonb->>'id')::uuid, '00000000-0000-0000-0000-0000000016a1'::uuid)->'match'->>'modus' = 'duell', 'Der Server bekommt den festgelegten Modus (srv_load)');
update public.rpg_arena_matches set status = 'abgebrochen' where id = (:'d1'::jsonb->>'id')::uuid;
set role authenticated;
select pg_temp.als('A');
select public.rpg_arena_queue('arcade') as a2 \gset
select pg_temp.ok(:'a2'::jsonb->>'status' = 'bereit' and :'a2'::jsonb->>'id' = :'b1'::jsonb->>'id', 'A sucht jetzt Arcade: wird mit B verbunden');
select pg_temp.ok(public.rpg_arena_fight((:'a2'::jsonb->>'id')::uuid, 0)->>'modus' in ('arena', 'koenig', 'horde'), 'Arcade: Der Modus ist Arena, Königsmord oder Horde – nie Duell');
reset role;
-- viele Arcade-Paarungen: nie Duell, und alle drei kommen vor
do $$ declare i integer; m text; gesehen text[] := '{}'; kid uuid; begin
  for i in 1..60 loop
    update public.rpg_arena_matches set status = 'abgebrochen' where status in ('offen', 'bereit', 'laeuft') and host_id::text like '00000000-0000-0000-0000-0000000016a%';
    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000016a1', false); perform public.rpg_arena_queue('arcade');
    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000016a2', false); kid := (public.rpg_arena_queue('arcade')->>'id')::uuid;
    select f.modus into m from public.rpg_arena_fights f where f.match_id = kid;
    if m = 'duell' or m is null then raise exception '✗ Arcade hat „%“ ausgelost', m; end if;
    if not m = any(gesehen) then gesehen := gesehen || m; end if;
  end loop;
  if cardinality(gesehen) <> 3 then raise exception '✗ Arcade: nicht alle drei Modi kamen vor (%)', gesehen; end if;
  raise notice '✓ 60 Arcade-Paarungen: nie Duell, alle drei Modi kommen vor';
  update public.rpg_arena_matches set status = 'abgebrochen' where status in ('offen', 'bereit', 'laeuft') and host_id::text like '00000000-0000-0000-0000-0000000016a%';
end $$;

-- ---------- Privater Kampf ----------
set role authenticated;
select pg_temp.als('A');
select pg_temp.fehler('select public.rpg_arena_invite(''Fremd_E'', ''duell'')', 'nur Freunde', 'Einladen geht nur bei Freunden');
select pg_temp.fehler('select public.rpg_arena_invite(''Art_A'', ''duell'')', 'nur Freunde', 'Sich selbst einladen geht nicht');
select pg_temp.fehler('select public.rpg_arena_invite(''Art_B'', ''schach'')', 'Unbekannter Modus', 'Unbekannter Modus wird abgelehnt');
select pg_temp.fehler('select * from public.rpg_arena_invites', 'permission denied', 'Einladungen sind nicht direkt lesbar');
select public.rpg_arena_invite('Art_B', 'duell') as e0 \gset
select public.rpg_arena_invite('Art_C', 'horde') as e1 \gset
select pg_temp.ok(public.rpg_arena_invites()->'von_mir'->>'an' = 'Art_C' and public.rpg_arena_invites()->'von_mir'->>'modus' = 'horde' and public.rpg_arena_invites()->'von_mir'->>'status' = 'offen', 'A lädt C zu „Horde“ ein; die frühere Einladung an B ist zurückgezogen');
select pg_temp.als('B');
select pg_temp.ok(jsonb_array_length(public.rpg_arena_invites()->'an_mich') = 0, 'B sieht die zurückgezogene Einladung nicht mehr');
select pg_temp.fehler(format('select public.rpg_arena_invite_answer(%L, true)', :'e0'), 'gilt nicht mehr', 'Eine zurückgezogene Einladung lässt sich nicht annehmen');
select pg_temp.fehler(format('select public.rpg_arena_invite_answer(%L, true)', :'e1'), 'gibt es nicht', 'Eine fremde Einladung lässt sich nicht annehmen');
select pg_temp.als('C');
select pg_temp.ok(jsonb_array_length(public.rpg_arena_invites()->'an_mich') = 1 and public.rpg_arena_invites()->'an_mich'->0->>'von' = 'Art_A' and public.rpg_arena_invites()->'an_mich'->0->>'modus' = 'horde', 'C sieht die Einladung von A mit dem Modus');
select public.rpg_arena_invite_answer(:'e1'::uuid, true) as k1 \gset
select pg_temp.ok(:'k1'::jsonb->>'status' = 'bereit' and (:'k1'::jsonb->>'seite')::int = 2 and :'k1'::jsonb->'host'->>'name' = 'Art_A' and (:'k1'::jsonb->'gast'->>'schnitt')::numeric = 6.0 and (:'k1'::jsonb->'host'->>'schnitt')::numeric = 1.0
  and :'k1'::jsonb->>'karte' is not null and :'k1'::jsonb->>'seed' is not null, 'C nimmt an: Kampf steht bereit – trotz Stufe 6 gegen Stufe 1 (keine Stufengrenze)');
select (:'k1'::jsonb->>'id') as pid \gset
select pg_temp.ok(public.rpg_arena_fight(:'pid'::uuid, 0)->>'modus' = 'horde' and (public.rpg_arena_fight(:'pid'::uuid, 0)->>'privat')::boolean and (public.rpg_arena_fight(:'pid'::uuid, 0)->>'server')::boolean, 'Es ist ein Serverkampf im gewählten Modus, als privat gekennzeichnet');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_arena_invites()->'von_mir'->>'status' = 'angenommen' and public.rpg_arena_invites()->'von_mir'->'kampf'->>'id' = :'pid' and (public.rpg_arena_invites()->'von_mir'->'kampf'->>'seite')::int = 1, 'A erfährt: angenommen, und bekommt den Kampf');
select pg_temp.fehler('select public.rpg_arena_invite(''Art_B'', ''duell'')', 'laufenden Kampf', 'Während eines Kampfes lässt sich niemand einladen');
-- ohne Wertung, auch bei Aufgabe (rpg_arena_cancel bucht über rpg_arena_belohnen)
reset role;
select public.rpg_arena_srv_save(:'pid'::uuid, '00000000-0000-0000-0000-0000000016a1'::uuid, 0, '{"rs": 1, "runde": 1, "arena": {"punkte": {"1": 0, "2": 0}}}'::jsonb, '[{"sicht1": {}, "sicht2": {}}]'::jsonb) as gesp \gset
set role authenticated;
select pg_temp.als('C');
select public.rpg_arena_cancel(:'pid'::uuid) as auf \gset
select pg_temp.ok(:'auf'::jsonb->>'status' = 'beendet' and :'auf'::jsonb->>'grund' = 'aufgabe' and (:'auf'::jsonb->>'sieger')::int = 1, 'C gibt auf: A gewinnt');
reset role;
select pg_temp.ok((select count(*) = 2 and bool_and(not gewertet) and bool_and(waehrung = 0) and bool_and(xp = '[]'::jsonb) from public.rpg_arena_rewards where match_id = :'pid'::uuid), 'Privater Kampf: keine Belohnung für beide, auch nicht für den Sieger');
select pg_temp.ok(not exists (select 1 from public.rpg_xp_ledger where campaign_id = :'pid'::uuid) and coalesce((select betrag from public.rpg_wallet where user_id = '00000000-0000-0000-0000-0000000016a1'), 0) = 0, '… keine Erfahrung, keine Seelensplitter gebucht');
-- Ablehnen, und: Wer nicht mehr wartet, kann nicht angenommen werden
set role authenticated;
select pg_temp.als('A');
select public.rpg_arena_invite('Art_B', 'koenig') as e2 \gset
select pg_temp.als('B');
select pg_temp.ok(public.rpg_arena_invite_answer(:'e2'::uuid, false) is null, 'B lehnt ab');
select pg_temp.als('A');
select pg_temp.ok(public.rpg_arena_invites()->'von_mir'->>'status' = 'abgelehnt', 'A erfährt: abgelehnt');
select public.rpg_arena_invite('Art_B', 'arena') as e3 \gset
reset role;
update public.rpg_arena_invites set seen_at = now() - interval '2 minutes' where id = :'e3'::uuid;
set role authenticated;
select pg_temp.als('B');
select pg_temp.ok(jsonb_array_length(public.rpg_arena_invites()->'an_mich') = 0, 'A hat die Seite verlassen (kein Lebenszeichen): B sieht die Einladung nicht mehr');
select pg_temp.fehler(format('select public.rpg_arena_invite_answer(%L, true)', :'e3'), 'wartet nicht mehr', '… und kann sie nicht mehr annehmen');
select pg_temp.als('A');
select public.rpg_arena_invite('Art_B', 'arena') as e4 \gset
select pg_temp.ok(public.rpg_arena_invite_cancel(:'e4'::uuid), 'A zieht die Einladung zurück');
select pg_temp.als('B');
select pg_temp.fehler(format('select public.rpg_arena_invite_answer(%L, true)', :'e4'), 'gilt nicht mehr', 'Zurückgezogen: nicht mehr annehmbar');
reset role;
select pg_temp.ok(has_function_privilege('authenticated', 'public.rpg_arena_queue(text)', 'execute') and not has_function_privilege('anon', 'public.rpg_arena_queue(text)', 'execute') and not has_function_privilege('anon', 'public.rpg_arena_invite_answer(uuid, boolean)', 'execute')
  and not has_function_privilege('authenticated', 'public.rpg_arena_srv_load(uuid, uuid)', 'execute') and not has_table_privilege('authenticated', 'public.rpg_arena_invites', 'select'), 'Rechte: nur angemeldete Nutzer; Serverfunktion weiter gesperrt; Einladungen nur über Funktionen');
