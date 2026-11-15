-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 009 (Spielmodi der Arena).
-- Läuft nach 008_rpg_arena_test.sql: Konten A (…08a1), B (…08a2), C (…08a3) gibt es schon.
\set ON_ERROR_STOP on
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', case p when 'A' then '00000000-0000-0000-0000-0000000008a1' when 'B' then '00000000-0000-0000-0000-0000000008a2' when 'C' then '00000000-0000-0000-0000-0000000008a3' else '' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
set role authenticated;
select pg_temp.als('A');
select public.rpg_arena_create(array['schildwaechter', 'trickser', 'lichtbringer'])->>'id' as id \gset
select pg_temp.fehler('select * from public.rpg_arena_modes', 'permission denied', 'Modi sind nicht direkt lesbar');
select pg_temp.ok(public.rpg_arena_modes(array[:'id']::uuid[])->>:'id' = 'arena', 'Ohne Eintrag gilt der Standardmodus');
select pg_temp.fehler(format('select public.rpg_arena_set_mode(%L, ''unsinn'')', :'id'), 'Unbekannter Modus', 'Nur bekannte Modi');
select pg_temp.ok(public.rpg_arena_set_mode(:'id', 'koenig') = 'koenig' and public.rpg_arena_set_mode(:'id', 'horde') = 'horde', 'Ersteller legt den Modus fest und kann ihn ändern');
select pg_temp.als('C');
select pg_temp.ok(public.rpg_arena_modes(array[:'id']::uuid[])->>:'id' = 'horde', 'Andere sehen den Modus eines offenen Kampfes');
select pg_temp.fehler(format('select public.rpg_arena_set_mode(%L, ''arena'')', :'id'), 'gibt es nicht', 'Fremde können den Modus nicht ändern');
select pg_temp.als('B'); select public.rpg_arena_join(:'id', array['trickser', 'berserker', 'duellant']);
select pg_temp.ok(public.rpg_arena_modes(array[:'id']::uuid[])->>:'id' = 'horde', 'Der Beigetretene sieht den Modus weiter');
select pg_temp.als('C');
select pg_temp.ok(public.rpg_arena_modes(array[:'id']::uuid[]) = '{}'::jsonb, 'Unbeteiligte sehen den Modus eines vergebenen Kampfes nicht mehr');
select pg_temp.als('A');
select pg_temp.fehler(format('select public.rpg_arena_set_mode(%L, ''arena'')', :'id'), 'nicht mehr ändern', 'Nach dem Beitritt bleibt der Modus fest');
select public.rpg_arena_cancel(:'id');
reset role;
