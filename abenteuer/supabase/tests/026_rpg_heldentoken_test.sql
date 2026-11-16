-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 026 (Heldentoken, Held der Woche, Heldenkauf, Heldenchance).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000026a1', false), ('00000000-0000-0000-0000-0000000026a2', false), ('00000000-0000-0000-0000-0000000026a3', true);
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000026a1', 'Tk_Anna'), ('00000000-0000-0000-0000-0000000026a2', 'Tk_Ben');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) values ('00000000-0000-0000-0000-0000000026a1', 'trickser', 'start');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select '00000000-0000-0000-0000-0000000026a2', hero_id, 'code' from public.rpg_hero_catalog;
insert into public.rpg_wallet (user_id, betrag) values ('00000000-0000-0000-0000-0000000026a1', 3000), ('00000000-0000-0000-0000-0000000026a2', 100) on conflict (user_id) do update set betrag = excluded.betrag;
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000026a' || case p when 'A' then '1' when 'B' then '2' else '3' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
create function pg_temp.kampagne(p_ab text, p_szene text) returns uuid language plpgsql as $$
declare v_k uuid;
begin
  v_k := public.rpg_create_campaign('Test ' || p_ab, 'normal', 'Spieltisch', p_ab);
  for i in 1..8 loop perform public.rpg_save_snapshot(v_k, i - 1, jsonb_build_object('abenteuer', jsonb_build_object('abenteuer', p_ab, 'szene', case when i = 8 then p_szene else 'szene_' || i end))); end loop;
  perform public.rpg_set_campaign_status(v_k, 'abgeschlossen');
  return v_k;
end $$;
create function pg_temp.alt(p uuid) returns void language sql security definer as $$ update public.rpg_campaigns set created_at = now() - interval '2 hours' where id = p; $$;
create function pg_temp.chance(p numeric) returns void language plpgsql security definer as $$
begin execute format('create or replace function public.rpg_ende_heldenchance(p_neu boolean) returns numeric language sql stable as $f$ select %s::numeric; $f$', coalesce(p::text, 'case when p_neu then 0.08 else 0.02 end')); end $$;
create function pg_temp.hat(p text, h text) returns boolean language sql security definer as $$ select exists (select 1 from public.rpg_hero_collection where user_id = ('00000000-0000-0000-0000-0000000026a' || p)::uuid and hero_id = h); $$;
create function pg_temp.fehlt(p text) returns text language sql security definer as $$ select hero_id from public.rpg_hero_catalog c where not exists (select 1 from public.rpg_hero_collection k where k.user_id = ('00000000-0000-0000-0000-0000000026a' || p)::uuid and k.hero_id = c.hero_id) order by hero_id limit 1; $$;
grant execute on all functions in schema pg_temp to authenticated;
select pg_temp.ok(public.rpg_ende_heldenchance(true) = 0.08 and public.rpg_ende_heldenchance(false) = 0.02 and public.rpg_hero_preis() = 830 and public.rpg_woche_preis() = 415 and public.rpg_token_preis() = 830,
  'Preise und Chancen: Held 830, Held der Woche 415, Token 830; Heldenwahl 8 Prozent beim ersten und 2 Prozent bei jedem weiteren Abschluss');
set role authenticated;

-- ---------- Held der Woche ----------
select pg_temp.als('A');
select pg_temp.fehler('select * from public.rpg_hero_tokens', 'permission denied', 'Token-Vorrat ist nicht direkt lesbar');
select public.rpg_shop_week() as w1 \gset
select pg_temp.ok((:'w1'::jsonb->>'konto')::boolean and :'w1'::jsonb->>'held' is not null and :'w1'::jsonb->>'held' <> 'trickser' and (:'w1'::jsonb->>'preis')::int = 830 and (:'w1'::jsonb->>'angebot')::int = 415
  and (:'w1'::jsonb->>'tokens')::int = 0 and (:'w1'::jsonb->>'waehrung')::int = 3000 and not (:'w1'::jsonb->>'gekauft')::boolean and not (:'w1'::jsonb->>'alle')::boolean
  and (:'w1'::jsonb->>'bis')::timestamptz > now() and (:'w1'::jsonb->>'bis')::timestamptz <= now() + interval '7 days 1 hour', 'Held der Woche: ein Held, den Anna nicht hat, 415 statt 830, gültig bis Montag');
select pg_temp.ok(public.rpg_shop_week()->>'held' = :'w1'::jsonb->>'held', 'Der Held der Woche bleibt in der Woche derselbe');
select public.rpg_shop_week_buy() as w2 \gset
select pg_temp.ok((:'w2'::jsonb->>'gekauft')::boolean and (:'w2'::jsonb->>'waehrung')::int = 2585 and pg_temp.hat('1', :'w1'::jsonb->>'held'), 'Gekauft: 415 Seelensplitter abgebucht, der Held ist in der Sammlung');
select pg_temp.fehler('select public.rpg_shop_week_buy()', 'hast du schon', 'Der Held der Woche lässt sich nur einmal kaufen');
select pg_temp.als('B');
select pg_temp.ok((public.rpg_shop_week()->>'alle')::boolean and public.rpg_shop_week()->'held' = 'null'::jsonb, 'Ben hat alle Helden: kein Held der Woche, „alle“ gemeldet');
select pg_temp.fehler('select public.rpg_shop_week_buy()', 'keinen Helden für dich', '… und nichts zu kaufen');
select pg_temp.fehler('select public.rpg_token_buy(1)', 'reichen deine Seelensplitter nicht', 'Token ohne genug Seelensplitter: abgelehnt');

-- ---------- Heldentoken und Heldenkauf ----------
select pg_temp.als('A');
select public.rpg_token_buy(2) as t1 \gset
select pg_temp.ok((:'t1'::jsonb->>'tokens')::int = 2 and (:'t1'::jsonb->>'waehrung')::int = 2585 - 1660, 'Zwei Heldentoken gekauft: 1660 Seelensplitter abgebucht');
select pg_temp.fehler('select public.rpg_token_buy(0)', 'Ungültige Anzahl', 'Anzahl 0 wird abgelehnt');
select pg_temp.fehlt('1') as h1 \gset
select public.rpg_hero_buy(:'h1', 'token') as b1 \gset
select pg_temp.ok((:'b1'::jsonb->>'tokens')::int = 1 and (:'b1'::jsonb->>'waehrung')::int = 925 and :'b1'::jsonb->>'held_neu' = :'h1' and pg_temp.hat('1', :'h1'), 'Held mit einem Token freigeschaltet: Token weg, Seelensplitter unberührt');
select pg_temp.fehler(format('select public.rpg_hero_buy(%L, ''token'')', :'h1'), 'hast du schon', 'Denselben Helden noch einmal: abgelehnt, kein Token verbraucht');
select pg_temp.fehlt('1') as h2 \gset
select public.rpg_hero_buy(:'h2', 'splitter') as b2 \gset
select pg_temp.ok((:'b2'::jsonb->>'tokens')::int = 1 and (:'b2'::jsonb->>'waehrung')::int = 95 and pg_temp.hat('1', :'h2'), 'Held für 830 Seelensplitter freigeschaltet: Token unberührt');
select pg_temp.fehlt('1') as h3 \gset
select pg_temp.fehler(format('select public.rpg_hero_buy(%L, ''splitter'')', :'h3'), 'reichen deine Seelensplitter nicht', 'Ohne genug Seelensplitter kein Kauf');
select pg_temp.fehler(format('select public.rpg_hero_buy(%L, ''geschenkt'')', :'h3'), 'Unbekannte Zahlungsart', 'Unbekannte Zahlungsart wird abgelehnt');
select pg_temp.fehler('select public.rpg_hero_buy(''niemand'', ''token'')', 'gibt es nicht', 'Unbekannter Held wird abgelehnt');
select public.rpg_hero_buy(:'h3', 'token') as b3 \gset
select pg_temp.fehler(format('select public.rpg_hero_buy(%L, ''token'')', pg_temp.fehlt('1')), 'keinen Heldentoken', 'Ohne Token kein Kauf mit Token');
select pg_temp.als('G');
select pg_temp.ok(not (public.rpg_shop_week()->>'konto')::boolean, 'Gäste: kein Händler');
select pg_temp.fehler('select public.rpg_token_buy(1)', 'nur mit Spielerkonten', 'Gäste können keine Token kaufen');
select pg_temp.fehler('select public.rpg_hero_buy(''trickser'', ''splitter'')', 'nur mit einem Spielerkonto', 'Gäste können keine Helden kaufen');

-- ---------- Heldenchance nach Kampagnen ----------
select pg_temp.als('A');
select pg_temp.chance(0);
select pg_temp.kampagne('rabenmoor', 'ende_erloest') as k1 \gset
select pg_temp.alt(:'k1');
select public.rpg_claim_ending(:'k1') as e1 \gset
select pg_temp.ok((:'e1'::jsonb->>'neu')::boolean and :'e1'::jsonb->'angebot' = 'null'::jsonb and (:'e1'::jsonb->>'gefunden')::int = 1, 'Neues Ende ohne Glück: Das Ende zählt, aber es gibt keine Heldenwahl mehr');
select pg_temp.chance(1);
select pg_temp.kampagne('rabenmoor', 'ende_erloest') as k2 \gset
select pg_temp.alt(:'k2');
select public.rpg_claim_ending(:'k2') as e2 \gset
select pg_temp.ok(not (:'e2'::jsonb->>'neu')::boolean and jsonb_array_length(:'e2'::jsonb->'angebot'->'helden') >= 1 and (:'e2'::jsonb->>'gefunden')::int = 1, 'Dasselbe Ende noch einmal, mit Glück: Jetzt kann auch ein wiederholter Abschluss eine Heldenwahl bringen');
select pg_temp.ok((public.rpg_claim_ending(:'k2')->>'schon_gemeldet')::boolean and public.rpg_claim_ending(:'k2')->'angebot'->>'id' = :'e2'::jsonb->'angebot'->>'id', 'Erneutes Melden würfelt nicht neu: dasselbe Angebot');
select pg_temp.kampagne('rabenmoor', 'ende_besiegt') as k3 \gset
select pg_temp.alt(:'k3');
select pg_temp.ok((public.rpg_claim_ending(:'k3')->>'neu')::boolean and (public.rpg_claim_ending(:'k3')->>'gefunden')::int = 2, 'Ein zweites, neues Ende zählt weiter als neu (2 von 2)');
select pg_temp.chance(null);
reset role;
select pg_temp.ok(pg_get_functiondef('public.rpg_claim_ending(uuid)'::regprocedure) ~ 'random\(\) < public\.rpg_ende_heldenchance\(v_neu\)' and pg_get_functiondef('public.rpg_claim_ending(uuid)'::regprocedure) !~* 'if\s+v_neu\s+then\s+v_helden',
  'rpg_claim_ending: nur die eine Bedingung ist ersetzt');
select pg_temp.ok((select count(*) = 5 and sum(preis) = 415 + 1660 + 830 from public.rpg_hero_token_log where user_id = '00000000-0000-0000-0000-0000000026a1')
  and (select betrag = 3000 - 415 - 1660 - 830 from public.rpg_wallet where user_id = '00000000-0000-0000-0000-0000000026a1'), 'Gebucht: Kaufliste und Kontostand stimmen überein');
select pg_temp.ok(not has_function_privilege('anon', 'public.rpg_hero_buy(text, text)', 'execute') and not has_function_privilege('anon', 'public.rpg_shop_week()', 'execute') and has_function_privilege('authenticated', 'public.rpg_token_buy(integer)', 'execute')
  and not has_table_privilege('authenticated', 'public.rpg_shop_weekly', 'select') and (select bool_and(prosecdef) from pg_proc where proname in ('rpg_shop_week', 'rpg_shop_week_buy', 'rpg_token_buy', 'rpg_hero_buy', 'rpg_claim_ending')),
  'Rechte: nur angemeldete Nutzer, Tabellen nur über die Funktionen');
