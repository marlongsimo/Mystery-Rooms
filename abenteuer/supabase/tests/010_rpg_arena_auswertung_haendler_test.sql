-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 010 (Auswertung der Arena, Händler).
-- Läuft nach den Tests zu 008 und 009: Konten A (…08a1, alle Helden), B (…08a2), C (…08a3, ein Held), Gast G gibt es schon.
\set ON_ERROR_STOP on
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', case p when 'A' then '00000000-0000-0000-0000-0000000008a1' when 'B' then '00000000-0000-0000-0000-0000000008a2' when 'C' then '00000000-0000-0000-0000-0000000008a3' when 'G' then '00000000-0000-0000-0000-0000000008a4' else '' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
select pg_temp.ok(public.rpg_arena_modus(0) = 'arena' and public.rpg_arena_modus(1) = 'koenig' and public.rpg_arena_modus(2) = 'horde' and public.rpg_arena_modus(3) = 'duell' and public.rpg_arena_modus(-5) = 'koenig'
  and public.rpg_arena_modus(953080271) = 'duell' and public.rpg_arena_modus(null) = 'arena' and public.rpg_arena_modus(-2147483648) = 'arena', 'Modus aus der Zufallszahl (wie im Spiel, auch negativ und leer)');
delete from public.rpg_wallet where user_id = '00000000-0000-0000-0000-0000000008a3';
set role authenticated;
-- Händler
select pg_temp.als('C');
select pg_temp.fehler('select * from public.rpg_shop_daily', 'permission denied', 'Tagesauswahl ist nicht direkt lesbar');
select public.rpg_shop_today() as s1 \gset
select pg_temp.ok((:'s1'::jsonb->>'konto')::boolean and jsonb_array_length(:'s1'::jsonb->'helden') = 3 and (:'s1'::jsonb->>'preis')::int = 830 and (:'s1'::jsonb->>'waehrung')::int = 0
  and not (:'s1'::jsonb->'helden') @> '[{"held":"trickser"}]' and not (:'s1'::jsonb->'helden') @> '[{"gekauft":true}]' and (:'s1'::jsonb->>'bis')::timestamptz > now(), 'Händler: drei Helden, die das Konto nicht hat, je 830, gültig bis Mitternacht');
select pg_temp.ok(public.rpg_shop_today()->'helden' = :'s1'::jsonb->'helden', 'Die Auswahl bleibt am selben Tag gleich');
select :'s1'::jsonb->'helden'->0->>'held' as h1, :'s1'::jsonb->'helden'->1->>'held' as h2 \gset
select pg_temp.fehler(format('select public.rpg_shop_buy(%L)', :'h1'), 'reichen', 'Ohne Seelensplitter kein Kauf');
reset role; insert into public.rpg_wallet (user_id, betrag) values ('00000000-0000-0000-0000-0000000008a3', 1000) on conflict (user_id) do update set betrag = 1000; set role authenticated;
select pg_temp.fehler('select public.rpg_shop_buy(''trickser'')', 'heute nicht', 'Nur Helden aus der heutigen Auswahl');
select public.rpg_shop_buy(:'h1') as s2 \gset
select pg_temp.ok((:'s2'::jsonb->>'waehrung')::int = 170 and (:'s2'::jsonb->'helden'->0->>'gekauft')::boolean and not (:'s2'::jsonb->'helden'->1->>'gekauft')::boolean
  and (public.rpg_my_heroes()->'helden') ? :'h1' and (public.rpg_my_wallet()->>'waehrung')::int = 170, 'Kauf: 830 abgezogen, Held in der Sammlung, als gekauft markiert');
select pg_temp.fehler(format('select public.rpg_shop_buy(%L)', :'h1'), 'hast du schon', 'Jeder Held nur einmal');
select pg_temp.fehler(format('select public.rpg_shop_buy(%L)', :'h2'), 'reichen', 'Der Rest reicht nicht für einen zweiten');
select pg_temp.als('A');
select pg_temp.ok(jsonb_array_length(public.rpg_shop_today()->'helden') = 0 and (public.rpg_shop_today()->>'alle')::boolean, 'Wer alle Helden hat, bekommt eine leere Auswahl');
select pg_temp.als('G');
select pg_temp.ok(not (public.rpg_shop_today()->>'konto')::boolean, 'Gäste: kein Händler');
select pg_temp.fehler('select public.rpg_shop_buy(''trickser'')', 'Spielerkonten', 'Gäste können nichts kaufen');
reset role;
select pg_temp.ok((select count(*) = 1 and min(preis) = 830 from public.rpg_shop_purchases where user_id = '00000000-0000-0000-0000-0000000008a3'), 'Der Kauf steht in der Kaufliste');
-- morgen: neue Auswahl ohne den gekauften Helden
update public.rpg_shop_daily set tag = tag - 1 where user_id = '00000000-0000-0000-0000-0000000008a3';
set role authenticated; select pg_temp.als('C');
select pg_temp.ok(jsonb_array_length(public.rpg_shop_today()->'helden') = 3 and not (public.rpg_shop_today()->'helden') @> jsonb_build_array(jsonb_build_object('held', :'h1')), 'Am nächsten Tag: neue Auswahl, der gekaufte Held ist nicht mehr dabei');
-- Auswertung
select pg_temp.fehler('select public.rpg_arena_stats()', 'Nur Admins', 'Auswertung nur für Admins');
reset role; insert into public.rpg_admins (user_id) values ('00000000-0000-0000-0000-0000000008a1') on conflict do nothing; set role authenticated;
select pg_temp.als('A');
select public.rpg_arena_stats() as st \gset
select pg_temp.ok((:'st'::jsonb->>'kaempfe')::int >= 2 and jsonb_array_length(:'st'::jsonb->'helden') >= 3 and jsonb_array_length(:'st'::jsonb->'teams') >= 2 and jsonb_array_length(:'st'::jsonb->'modi') >= 1
  and (select sum((x->>'kaempfe')::int) from jsonb_array_elements(:'st'::jsonb->'modi') x) = (:'st'::jsonb->>'kaempfe')::int
  and (select sum((x->>'kaempfe')::int) from jsonb_array_elements(:'st'::jsonb->'helden') x) = 6 * (:'st'::jsonb->>'kaempfe')::int
  and (select bool_and((x->>'siege')::int <= (x->>'kaempfe')::int) from jsonb_array_elements(:'st'::jsonb->'helden') x), 'Auswertung: ' || (:'st'::jsonb->>'kaempfe') || ' Kämpfe, je Kampf sechs Helden gezählt, Modi summieren sich auf');
select pg_temp.ok((select (x->>'kaempfe')::int >= 2 and (x->>'siege')::int >= 1 from jsonb_array_elements(:'st'::jsonb->'helden') x where x->>'held' = 'schildwaechter'), 'Siegquote je Held (Schildwächter: ' || (select (x->>'siege') || ' von ' || (x->>'kaempfe') from jsonb_array_elements(:'st'::jsonb->'helden') x where x->>'held' = 'schildwaechter') || ')');
reset role; delete from public.rpg_admins where user_id = '00000000-0000-0000-0000-0000000008a1';
