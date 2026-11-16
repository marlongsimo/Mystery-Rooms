-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 021 (Codes für Seelensplitter).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000021a1', false), ('00000000-0000-0000-0000-0000000021a2', false), ('00000000-0000-0000-0000-0000000021a3', false);
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000021a1', 'Spl_Chef'), ('00000000-0000-0000-0000-0000000021a2', 'Spl_Anna'), ('00000000-0000-0000-0000-0000000021a3', 'Spl_Ben');
insert into public.rpg_admins (user_id) values ('00000000-0000-0000-0000-0000000021a1');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) values ('00000000-0000-0000-0000-0000000021a2', 'berserker', 'start'), ('00000000-0000-0000-0000-0000000021a3', 'berserker', 'start');
insert into public.rpg_wallet (user_id, betrag) values ('00000000-0000-0000-0000-0000000021a2', 40);
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000021a' || case p when 'X' then '1' when 'A' then '2' else '3' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
set role authenticated;
select pg_temp.als('A');
select pg_temp.fehler('select public.rpg_admin_create_code(''Geschenk'', null, 5, 30, 100)', 'Nur Admins', 'Ein Spieler kann keinen Splitter-Code anlegen');
select pg_temp.als('X');
select pg_temp.fehler('select public.rpg_admin_create_code(''Zu viel'', null, 1, 30, 6000)', '1 bis 5000', 'Mehr als 5000 Seelensplitter je Code werden abgelehnt');
select pg_temp.fehler('select public.rpg_admin_create_code(''Null'', null, 1, 30, 0)', '1 bis 5000', 'Null Seelensplitter werden abgelehnt');
select public.rpg_admin_create_code('Turnier Mai', null, 2, 30, 150) as c1 \gset
select pg_temp.ok((:'c1'::jsonb->>'waehrung')::integer = 150 and (:'c1'::jsonb->>'hoechstens')::integer = 2 and :'c1'::jsonb->>'code' ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$', 'Splitter-Code angelegt: 150 Seelensplitter, zweimal einlösbar');
select public.rpg_admin_create_code('Für Ben', 'Spl_Ben', 1, 30, 75) as c2 \gset
select public.rpg_admin_create_code('Helden wie bisher', null, 1, 30) as c3 \gset
select pg_temp.ok(:'c3'::jsonb->'waehrung' = 'null'::jsonb and :'c3'::jsonb->>'code' is not null, 'Ohne Betrag: ein Helden-Code wie bisher (Aufruf mit vier Angaben geht weiter)');
select pg_temp.ok((select count(*) filter (where x->>'waehrung' = '150') = 1 and count(*) filter (where x->>'bezeichnung' = 'Helden wie bisher' and x->'waehrung' = 'null'::jsonb) = 1 from jsonb_array_elements(public.rpg_admin_codes()) x), 'Die Übersicht nennt je Code, was er bringt');
-- einlösen
select pg_temp.als('A');
select public.rpg_redeem_unlock_code(:'c1'::jsonb->>'code') as r1 \gset
select pg_temp.ok((:'r1'::jsonb->>'waehrung')::integer = 150 and (:'r1'::jsonb->>'kontostand')::integer = 190 and (public.rpg_my_wallet()->>'waehrung')::integer = 190, 'Anna löst ein: +150, Kontostand 40 → 190');
reset role;
select pg_temp.ok((select count(*) = 1 from public.rpg_hero_collection where user_id = '00000000-0000-0000-0000-0000000021a2'), 'An der Heldensammlung ändert ein Splitter-Code nichts');
set role authenticated;
select pg_temp.fehler('select public.rpg_redeem_unlock_code(''' || (:'c1'::jsonb->>'code') || ''')', 'schon eingelöst', 'Zweimal vom selben Konto geht nicht');
select pg_temp.fehler('select public.rpg_redeem_unlock_code(''' || (:'c2'::jsonb->>'code') || ''')', 'anderes Konto', 'Ein Code „nur für Ben“ gilt für Anna nicht');
select pg_temp.als('B');
select pg_temp.ok((public.rpg_redeem_unlock_code(:'c1'::jsonb->>'code')->>'kontostand')::integer = 150, 'Ben löst denselben Code ein: +150 (hatte noch keinen Geldbeutel)');
select pg_temp.ok((public.rpg_redeem_unlock_code(:'c2'::jsonb->>'code')->>'kontostand')::integer = 225, 'Ben löst seinen persönlichen Code ein: +75 → 225');
select pg_temp.als('X');
select pg_temp.fehler('select public.rpg_redeem_unlock_code(''' || (:'c1'::jsonb->>'code') || ''')', 'so oft eingelöst', 'Nach zwei Einlösungen ist der Code verbraucht');
select pg_temp.als('B');
select public.rpg_redeem_unlock_code(:'c3'::jsonb->>'code') as r3 \gset
select pg_temp.ok((:'r3'::jsonb->>'neu')::integer = 14 and :'r3'::jsonb->'waehrung' is null and (public.rpg_my_wallet()->>'waehrung')::integer = 225, 'Ein Helden-Code schaltet weiter alle Helden frei und bringt keine Seelensplitter');
select pg_temp.ok((public.rpg_redeem_unlock_code('AAAA-BBBB-CCCC')->>'fehler') ~ 'ungültig', 'Ein falscher Code wird wie bisher abgewiesen');
reset role;
select pg_temp.ok(not has_function_privilege('anon', 'public.rpg_admin_create_code(text, text, integer, integer, integer)', 'execute') and to_regprocedure('public.rpg_admin_create_code(text, text, integer, integer)') is null, 'Rechte: nur angemeldete Nutzer; die Fassung mit vier Angaben ist ersetzt');
