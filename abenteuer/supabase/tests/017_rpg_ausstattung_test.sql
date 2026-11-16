-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 017 (Ausstattung beim Händler).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000017a1', false), ('00000000-0000-0000-0000-0000000017a2', false), ('00000000-0000-0000-0000-0000000017a3', true);
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000017a1', 'Kaeufer_A'), ('00000000-0000-0000-0000-0000000017a2', 'Kaeufer_B');
insert into public.rpg_wallet (user_id, betrag) values ('00000000-0000-0000-0000-0000000017a1', 240), ('00000000-0000-0000-0000-0000000017a2', 50);
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000017a' || case p when 'A' then '1' when 'B' then '2' else '3' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
select pg_temp.ok((select count(*) = 23 and count(*) filter (where art = 'wuerfel') = 8 and count(*) filter (where art = 'rahmen') = 15 and count(*) filter (where preis = 75) = 10 and count(*) filter (where preis = 150) = 13 from public.rpg_cosmetic_items),
  'Katalog: 8 Würfel und 15 Rahmen; einfache für 75, ausgefallene für 150 Seelensplitter');
set role authenticated;
select pg_temp.als('A');
select pg_temp.fehler('select * from public.rpg_cosmetic_items', 'permission denied', 'Der Katalog ist nicht direkt lesbar');
select pg_temp.fehler('update public.rpg_cosmetic_items set preis = 0', 'permission denied', 'Preise sind nicht änderbar');
select pg_temp.fehler('insert into public.rpg_cosmetic_owned (user_id, item_id, preis) values (''00000000-0000-0000-0000-0000000017a1'', ''w_gold'', 0)', 'permission denied', 'Besitz lässt sich nicht selbst eintragen');
select public.rpg_cosmetics() as c0 \gset
select pg_temp.ok((:'c0'::jsonb->>'konto')::boolean and (:'c0'::jsonb->>'waehrung')::int = 240 and jsonb_array_length(:'c0'::jsonb->'katalog') = 23 and jsonb_array_length(:'c0'::jsonb->'besitz') = 0
  and :'c0'::jsonb->'aktiv'->'wuerfel' = 'null'::jsonb, 'Übersicht: Kontostand, ganzer Katalog, noch kein Besitz, Standard ausgewählt');
select pg_temp.fehler('select public.rpg_cosmetic_equip(''wuerfel'', ''w_gold'')', 'besitzt du nicht', 'Auswählen ohne Besitz wird abgelehnt');
select pg_temp.fehler('select public.rpg_cosmetic_buy(''w_gibt_es_nicht'')', 'führt der Händler nicht', 'Unbekanntes Stück wird abgelehnt');
select public.rpg_cosmetic_buy('w_obsidian') as c1 \gset
select pg_temp.ok((:'c1'::jsonb->>'waehrung')::int = 165 and :'c1'::jsonb->'besitz' = '["w_obsidian"]'::jsonb, 'Kauf eines einfachen Würfels: 75 abgezogen, im Besitz');
select pg_temp.fehler('select public.rpg_cosmetic_buy(''w_obsidian'')', 'besitzt du schon', 'Dasselbe Stück lässt sich nicht zweimal kaufen');
select public.rpg_cosmetic_buy('r_gold') as c2 \gset
select pg_temp.ok((:'c2'::jsonb->>'waehrung')::int = 15 and jsonb_array_length(:'c2'::jsonb->'besitz') = 2, 'Kauf eines ausgefallenen Rahmens: 150 abgezogen');
select pg_temp.fehler('select public.rpg_cosmetic_buy(''w_rubin'')', 'reichen deine Seelensplitter nicht', 'Ohne genug Seelensplitter kein Kauf');
select pg_temp.ok((public.rpg_cosmetics()->>'waehrung')::int = 15 and jsonb_array_length(public.rpg_cosmetics()->'besitz') = 2, '… und nichts wurde abgezogen');
-- Auswählen
select pg_temp.ok(public.rpg_cosmetic_equip('wuerfel', 'w_obsidian')->'aktiv'->>'wuerfel' = 'w_obsidian', 'Würfel ausgewählt');
select pg_temp.ok(public.rpg_cosmetic_equip('rahmen', 'r_gold')->'aktiv' = '{"wuerfel": "w_obsidian", "rahmen": "r_gold"}'::jsonb, 'Rahmen ausgewählt; der Würfel bleibt');
select pg_temp.fehler('select public.rpg_cosmetic_equip(''rahmen'', ''w_obsidian'')', 'besitzt du nicht', 'Ein Würfel lässt sich nicht als Rahmen auswählen');
select pg_temp.fehler('select public.rpg_cosmetic_equip(''titel'', null)', 'Unbekannte Art', 'Unbekannte Art wird abgelehnt');
select pg_temp.ok(public.rpg_cosmetic_equip('wuerfel', null)->'aktiv' = '{"wuerfel": null, "rahmen": "r_gold"}'::jsonb, 'Zurück auf Standard: der Würfel ist abgewählt, der Besitz bleibt');
select pg_temp.ok(public.rpg_cosmetics()->'besitz' ? 'w_obsidian', '… das Stück gehört einem weiterhin');
-- anderes Konto, Gast
select pg_temp.als('B');
select pg_temp.ok(jsonb_array_length(public.rpg_cosmetics()->'besitz') = 0 and public.rpg_cosmetics()->'aktiv'->'rahmen' = 'null'::jsonb, 'Ein anderes Konto sieht nur seinen eigenen (leeren) Besitz');
select pg_temp.fehler('select public.rpg_cosmetic_equip(''rahmen'', ''r_gold'')', 'besitzt du nicht', 'Fremden Besitz kann man nicht auswählen');
select pg_temp.fehler('select public.rpg_cosmetic_buy(''r_bronze'')', 'reichen deine Seelensplitter nicht', 'B hat 50 Seelensplitter: 75 reichen nicht');
select pg_temp.als('G');
select pg_temp.ok(not (public.rpg_cosmetics()->>'konto')::boolean, 'Gäste: kein Händler');
select pg_temp.fehler('select public.rpg_cosmetic_buy(''r_bronze'')', 'Spielerkonten', 'Gäste können nichts kaufen');
reset role;
-- Aus dem Angebot genommen: nicht mehr kaufbar, bleibt aber bei denen, die es haben
update public.rpg_cosmetic_items set aktiv = false where id in ('w_obsidian', 'w_rubin');
update public.rpg_wallet set betrag = 500 where user_id = '00000000-0000-0000-0000-0000000017a1';
set role authenticated;
select pg_temp.als('A');
select pg_temp.fehler('select public.rpg_cosmetic_buy(''w_rubin'')', 'führt der Händler nicht', 'Aus dem Angebot genommen: nicht mehr kaufbar');
select pg_temp.ok(jsonb_array_length(public.rpg_cosmetics()->'katalog') = 22 and public.rpg_cosmetic_equip('wuerfel', 'w_obsidian')->'aktiv'->>'wuerfel' = 'w_obsidian', '… wer es schon hat, sieht und benutzt es weiter');
reset role;
select pg_temp.ok((select count(*) = 2 and sum(preis) = 225 from public.rpg_cosmetic_owned where user_id = '00000000-0000-0000-0000-0000000017a1'), 'Gebucht sind genau die beiden Käufe (75 + 150)');
select pg_temp.ok(has_function_privilege('authenticated', 'public.rpg_cosmetic_buy(text)', 'execute') and not has_function_privilege('anon', 'public.rpg_cosmetic_buy(text)', 'execute')
  and not has_function_privilege('anon', 'public.rpg_cosmetics()', 'execute') and not has_table_privilege('authenticated', 'public.rpg_cosmetic_owned', 'select'), 'Rechte: nur angemeldete Nutzer, Tabellen nur über Funktionen');
