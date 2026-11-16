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
  and :'s0'::jsonb->'pakete'->0 @> '{"id": "klein", "xp": 50, "preis": 90, "pro_tag": 3, "heute": 0}'::jsonb and :'s0'::jsonb->'pakete'->2 @> '{"id": "gross", "xp": 350, "preis": 550, "pro_tag": 1}'::jsonb,
  'Händler: drei Pakete – 50 XP für 90 (3 am Tag), 150 für 250 (2), 350 für 550 (1)');
select public.rpg_xp_buy('berserker', 'klein', 2) as k1 \gset
select pg_temp.ok(:'k1'::jsonb @> '{"xp": 100, "preis": 180, "gesamt": 180, "stufe_vorher": 1, "stufe": 2, "waehrung": 1320}'::jsonb and (:'k1'::jsonb->'laden'->'pakete'->0->>'heute')::integer = 2,
  'Zwei kleine Pakete für den Berserker: +100 XP (Stufe 1 → 2), 180 Seelensplitter abgebucht, heute 2 von 3');
select pg_temp.fehler('select public.rpg_xp_buy(''berserker'', ''klein'', 2)', 'heute nur noch 1', 'Tagesgrenze: Ein drittes und viertes kleines Paket auf einmal geht nicht');
select pg_temp.ok((public.rpg_xp_buy('berserker', 'klein', 1)->>'waehrung')::integer = 1230, 'Das dritte kleine Paket geht noch');
select pg_temp.fehler('select public.rpg_xp_buy(''berserker'', ''klein'', 1)', 'keines mehr', 'Danach ist das kleine Paket für heute aufgebraucht');
select pg_temp.ok((public.rpg_xp_buy('berserker', 'gross', 1)->>'gesamt')::integer = 580, 'Das große Paket: +350 XP');
select pg_temp.fehler('select public.rpg_xp_buy(''trickser'', ''mittel'', 1)', 'höchste Stufe', 'Ein Held auf Stufe 10 braucht keine Erfahrung mehr');
select pg_temp.fehler('select public.rpg_xp_buy(''gelehrter'', ''mittel'', 1)', 'nicht zu deiner Sammlung', 'Nur für eigene Helden');
select pg_temp.fehler('select public.rpg_xp_buy(''berserker'', ''riesig'', 1)', 'führt der Händler nicht', 'Unbekanntes Paket wird abgelehnt');
select pg_temp.fehler('select public.rpg_xp_buy(''berserker'', ''mittel'', 0)', 'Ungültige Anzahl', 'Anzahl 0 wird abgelehnt');
select pg_temp.als('B');
select pg_temp.fehler('select public.rpg_xp_buy(''gelehrter'', ''mittel'', 1)', 'reichen deine Seelensplitter nicht', 'Ohne genug Seelensplitter kein Kauf');
select pg_temp.ok((public.rpg_xp_shop()->>'waehrung')::integer = 100 and (public.rpg_xp_shop()->'pakete'->0->>'heute')::integer = 0, '… nichts abgebucht; die Tagesgrenze gilt je Konto');
select pg_temp.ok((public.rpg_xp_buy('gelehrter', 'klein', 1)->>'waehrung')::integer = 10, 'Ein Held ohne bisherige Erfahrung bekommt sie gutgeschrieben');
select pg_temp.als('G');
select pg_temp.ok(not (public.rpg_xp_shop()->>'konto')::boolean, 'Gäste: kein Händler');
select pg_temp.fehler('select public.rpg_xp_buy(''berserker'', ''klein'', 1)', 'nur mit Spielerkonten', 'Gäste können nichts kaufen');
reset role;
-- gestern gekauft zählt heute nicht
update public.rpg_xp_purchases set created_at = created_at - interval '1 day' where user_id = '00000000-0000-0000-0000-0000000023a1';
set role authenticated; select pg_temp.als('A');
select pg_temp.ok((public.rpg_xp_shop()->'pakete'->0->>'heute')::integer = 0 and (public.rpg_xp_buy('berserker', 'klein', 1)->>'gesamt')::integer = 630, 'Am nächsten Tag gilt die Grenze von vorn');
reset role;
select pg_temp.ok((select xp = 630 from public.rpg_hero_progress where user_id = '00000000-0000-0000-0000-0000000023a1' and hero_id = 'berserker') and (select betrag = 1500 - 180 - 90 - 550 - 90 from public.rpg_wallet where user_id = '00000000-0000-0000-0000-0000000023a1')
  and (select count(*) = 4 and sum(preis) = 910 from public.rpg_xp_purchases where user_id = '00000000-0000-0000-0000-0000000023a1'), 'Gebucht: Erfahrung, Kontostand und Kaufliste stimmen überein');
select pg_temp.ok(not has_function_privilege('anon', 'public.rpg_xp_buy(text, text, integer)', 'execute') and not has_table_privilege('authenticated', 'public.rpg_xp_packs', 'select'), 'Rechte: nur angemeldete Nutzer, Tabellen nur über die Funktionen');
