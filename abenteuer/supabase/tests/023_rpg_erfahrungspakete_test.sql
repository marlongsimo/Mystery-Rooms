-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 023 (Erfahrungspakete).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000023a1', false), ('00000000-0000-0000-0000-0000000023a2', false), ('00000000-0000-0000-0000-0000000023a3', true);
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000023a1', 'Xp_Anna'), ('00000000-0000-0000-0000-0000000023a2', 'Xp_Ben');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) values ('00000000-0000-0000-0000-0000000023a1', 'berserker', 'start'), ('00000000-0000-0000-0000-0000000023a1', 'trickser', 'start'), ('00000000-0000-0000-0000-0000000023a2', 'gelehrter', 'start');
insert into public.rpg_hero_progress (user_id, hero_id, xp) values ('00000000-0000-0000-0000-0000000023a1', 'berserker', 80), ('00000000-0000-0000-0000-0000000023a1', 'trickser', 99999);
insert into public.rpg_wallet (user_id, betrag) values ('00000000-0000-0000-0000-0000000023a1', 1500), ('00000000-0000-0000-0000-0000000023a2', 100);
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000023a' || case p when 'A' then '1' when 'B' then '2' else '3' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
set role authenticated;
select pg_temp.als('A');
select public.rpg_xp_shop() as s0 \gset
select pg_temp.ok((:'s0'::jsonb->>'waehrung')::integer = 1500 and jsonb_array_length(:'s0'::jsonb->'pakete') = 3
  and :'s0'::jsonb->'pakete'->0 @> '{"id": "klein", "xp": 50, "preis": 90, "pro_tag": 3, "heute": 0, "besitz": 0}'::jsonb and :'s0'::jsonb->'pakete'->2 @> '{"id": "gross", "xp": 350, "preis": 550, "pro_tag": 1}'::jsonb,
  'Händler: drei Pakete – 50 XP für 90 (3 am Tag), 150 für 250 (2), 350 für 550 (1); noch nichts im Vorrat');
-- kaufen: in den Vorrat, noch ohne Helden
select public.rpg_xp_buy('klein', 2) as k1 \gset
select pg_temp.ok(:'k1'::jsonb @> '{"anzahl": 2, "preis": 180, "waehrung": 1320}'::jsonb and :'k1'::jsonb->'laden'->'pakete'->0 @> '{"heute": 2, "besitz": 2}'::jsonb,
  'Zwei kleine Pakete gekauft: 180 Seelensplitter abgebucht, 2 im Vorrat, heute 2 von 3');
reset role;
select pg_temp.ok((select xp = 80 from public.rpg_hero_progress where user_id = '00000000-0000-0000-0000-0000000023a1' and hero_id = 'berserker'), 'Der Kauf allein ändert an keinem Helden etwas');
set role authenticated;
select pg_temp.fehler('select public.rpg_xp_buy(''klein'', 2)', 'heute nur noch 1', 'Tagesgrenze: Ein drittes und viertes kleines Paket auf einmal geht nicht');
select pg_temp.ok((public.rpg_xp_buy('klein', 1)->>'waehrung')::integer = 1230, 'Das dritte kleine Paket geht noch');
select pg_temp.fehler('select public.rpg_xp_buy(''klein'', 1)', 'keines mehr', 'Danach ist das kleine Paket für heute aufgebraucht');
select pg_temp.ok((public.rpg_xp_buy('gross', 1)->'laden'->'pakete'->2->>'besitz')::integer = 1, 'Ein großes Paket dazu');
select pg_temp.fehler('select public.rpg_xp_buy(''riesig'', 1)', 'führt der Händler nicht', 'Unbekanntes Paket wird abgelehnt');
select pg_temp.fehler('select public.rpg_xp_buy(''mittel'', 0)', 'Ungültige Anzahl', 'Anzahl 0 wird abgelehnt');
-- einsetzen: an einem eigenen Helden
select public.rpg_xp_use('berserker', 'klein', 2) as u1 \gset
select pg_temp.ok(:'u1'::jsonb @> '{"xp": 100, "gesamt": 180, "stufe_vorher": 1, "stufe": 2}'::jsonb and (:'u1'::jsonb->'laden'->'pakete'->0->>'besitz')::integer = 1 and (:'u1'::jsonb->'laden'->>'waehrung')::integer = 680,
  'Zwei kleine Pakete beim Berserker eingesetzt: +100 XP (Stufe 1 → 2), eines bleibt im Vorrat; das Einsetzen kostet nichts mehr');
select pg_temp.fehler('select public.rpg_xp_use(''berserker'', ''klein'', 2)', 'im Vorrat: 1', 'Mehr einsetzen, als im Vorrat ist, geht nicht');
select pg_temp.fehler('select public.rpg_xp_use(''berserker'', ''mittel'', 1)', 'im Vorrat: 0', 'Ein Paket, das man nicht hat, lässt sich nicht einsetzen');
select pg_temp.fehler('select public.rpg_xp_use(''trickser'', ''klein'', 1)', 'höchste Stufe', 'Ein Held auf Stufe 10 braucht keine Erfahrung mehr');
select pg_temp.fehler('select public.rpg_xp_use(''gelehrter'', ''klein'', 1)', 'nicht zu deiner Sammlung', 'Nur für eigene Helden');
select pg_temp.ok((public.rpg_xp_use('berserker', 'gross', 1)->>'gesamt')::integer = 530, 'Das große Paket: +350 XP');
select pg_temp.als('B');
select pg_temp.fehler('select public.rpg_xp_buy(''mittel'', 1)', 'reichen deine Seelensplitter nicht', 'Ohne genug Seelensplitter kein Kauf');
select pg_temp.ok((public.rpg_xp_shop()->>'waehrung')::integer = 100 and (public.rpg_xp_shop()->'pakete'->0->>'heute')::integer = 0 and (public.rpg_xp_shop()->'pakete'->0->>'besitz')::integer = 0, '… nichts abgebucht; Tagesgrenze und Vorrat gelten je Konto');
select pg_temp.ok((public.rpg_xp_buy('klein', 1)->>'waehrung')::integer = 10 and (public.rpg_xp_use('gelehrter', 'klein', 1)->>'gesamt')::integer = 50, 'Ein Held ohne bisherige Erfahrung bekommt sie gutgeschrieben');
select pg_temp.als('G');
select pg_temp.ok(not (public.rpg_xp_shop()->>'konto')::boolean, 'Gäste: kein Händler');
select pg_temp.fehler('select public.rpg_xp_buy(''klein'', 1)', 'nur mit Spielerkonten', 'Gäste können nichts kaufen');
reset role;
-- kurz vor Stufe 10: nicht mehr Pakete als nötig
update public.rpg_hero_progress set xp = 5600 where user_id = '00000000-0000-0000-0000-0000000023a1' and hero_id = 'berserker';
update public.rpg_xp_inventory set anzahl = 3 where user_id = '00000000-0000-0000-0000-0000000023a1' and pack_id = 'klein';
-- gestern gekauft zählt heute nicht
update public.rpg_xp_purchases set created_at = created_at - interval '1 day' where user_id = '00000000-0000-0000-0000-0000000023a1';
set role authenticated; select pg_temp.als('A');
select pg_temp.fehler('select public.rpg_xp_use(''berserker'', ''klein'', 3)', 'braucht dieser Held nicht mehr', 'Kurz vor Stufe 10: Überzählige Pakete werden nicht verbraucht');
select pg_temp.ok((public.rpg_xp_use('berserker', 'klein', 1)->>'stufe')::integer = 10, 'Ein Paket reicht bis Stufe 10');
select pg_temp.ok((public.rpg_xp_shop()->'pakete'->0->>'besitz')::integer = 2, '… die übrigen bleiben im Vorrat');
select pg_temp.ok((public.rpg_xp_shop()->'pakete'->0->>'heute')::integer = 0 and (public.rpg_xp_buy('klein', 1)->'laden'->'pakete'->0->>'besitz')::integer = 3, 'Am nächsten Tag gilt die Tagesgrenze von vorn');
reset role;
select pg_temp.ok((select betrag = 1500 - 180 - 90 - 550 - 90 from public.rpg_wallet where user_id = '00000000-0000-0000-0000-0000000023a1')
  and (select count(*) = 4 and sum(preis) = 910 from public.rpg_xp_purchases where user_id = '00000000-0000-0000-0000-0000000023a1'), 'Gebucht: Kontostand und Kaufliste stimmen überein');
select pg_temp.ok(not has_function_privilege('anon', 'public.rpg_xp_buy(text, integer)', 'execute') and not has_function_privilege('anon', 'public.rpg_xp_use(text, text, integer)', 'execute') and not has_table_privilege('authenticated', 'public.rpg_xp_inventory', 'select')
  and to_regprocedure('public.rpg_xp_buy(text, text, integer)') is null, 'Rechte: nur angemeldete Nutzer, Tabellen nur über die Funktionen; die frühere Kauf-Funktion ist ersetzt');
