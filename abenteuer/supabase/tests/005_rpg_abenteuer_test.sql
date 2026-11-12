-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 005 (Abenteuer einer Kampagne).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000000d1', false), ('00000000-0000-0000-0000-0000000000d2', true), ('00000000-0000-0000-0000-0000000000d3', true);
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', case p when 'H' then '00000000-0000-0000-0000-0000000000d1' when 'T' then '00000000-0000-0000-0000-0000000000d2' when 'F' then '00000000-0000-0000-0000-0000000000d3' else '' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if b then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end; raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
set role authenticated;
select pg_temp.als('H'); select public.rpg_set_profile('Abenteurer');
select public.rpg_create_campaign('Moor · 12.11.', 'normal', 'Spieltisch', 'rabenmoor') as k \gset
reset role; select pg_temp.ok((select adventure_slug from public.rpg_campaigns where id = :'k') = 'rabenmoor', 'Beim Anlegen wird das Abenteuer gespeichert'); set role authenticated;
select pg_temp.ok(public.rpg_set_adventure(:'k', 'hochwacht') = 'hochwacht', 'Host wechselt das Abenteuer der leeren Kampagne');
select pg_temp.fehler(format('select public.rpg_set_adventure(%L, %L)', :'k', 'Hoch Wacht!'), 'Unbekanntes Abenteuer', 'Ungültiger Name abgelehnt');
select pg_temp.als('F');
select pg_temp.fehler(format('select public.rpg_set_adventure(%L, %L)', :'k', 'krone'), 'Nur der Host oder der Spieltisch', 'Fremder kann das Abenteuer nicht ändern');
select pg_temp.als('H'); select public.rpg_create_link(:'k', 'tisch') as tisch \gset
select pg_temp.als('T');
select pg_temp.ok((public.rpg_claim_table(:'tisch')->>'abenteuer') = 'hochwacht', 'Das Tisch-Gerät erfährt das Abenteuer (hochwacht)');
select pg_temp.ok(public.rpg_set_adventure(:'k', 'krone') = 'krone', 'Auch der Spieltisch darf es vor dem ersten Speichern ändern');
select public.rpg_save_snapshot(:'k', 0, '{"a":1}'::jsonb);
select pg_temp.fehler(format('select public.rpg_set_adventure(%L, %L)', :'k', 'grauwacht'), 'vor dem ersten Speichern', 'Nach dem ersten Speichern ist das Abenteuer fest');
reset role;
select pg_temp.ok((select adventure_slug from public.rpg_campaigns where id = :'k') = 'krone', 'Gespeichert bleibt krone');
