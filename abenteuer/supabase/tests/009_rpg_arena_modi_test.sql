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
-- Währung: A hat heute schon fünf gewertete Kämpfe; ein weiterer Sieg bringt trotzdem 5 bis 25
select (public.rpg_my_wallet()->>'waehrung')::int as vor \gset
select public.rpg_arena_create(array['schildwaechter', 'trickser', 'lichtbringer'])->>'id' as id2 \gset
select pg_temp.als('B'); select public.rpg_arena_join(:'id2', array['trickser', 'berserker', 'duellant']);
select pg_temp.als('A'); select public.rpg_arena_room(:'id2', 'QRST');
select pg_temp.als('B'); select public.rpg_arena_cancel(:'id2');
select pg_temp.als('A');
select (public.rpg_my_wallet()->>'waehrung')::int as nach \gset
select (public.rpg_arena_get(:'id2')->'belohnung'->>'waehrung')::int as lohn \gset
select pg_temp.ok(:lohn between 5 and 25 and :nach - :vor = :lohn, 'Sieg über der Tagesgrenze: gewürfelte Währung (' || :lohn || ') landet auf dem Konto');
select pg_temp.ok(not (public.rpg_arena_get(:'id2')->'belohnung'->>'gewertet')::boolean, 'XP und Heldenchance bleiben bei fünf Kämpfen am Tag');
select pg_temp.als('B');
select pg_temp.ok((public.rpg_arena_get(:'id2')->'belohnung'->>'waehrung')::int = 0, 'Wer verliert oder aufgibt, bekommt keine Währung');
reset role;
-- viele Würfe: immer 5 bis 25, Konto und Belohnung stimmen überein
insert into public.rpg_arena_matches (id, status, host_id, host_name, host_team, host_schnitt) select gen_random_uuid(), 'beendet', '00000000-0000-0000-0000-0000000008a3', 'w', '[]'::jsonb, 1 from generate_series(1, 200);
insert into public.rpg_arena_rewards (match_id, user_id, sieg, gewertet, waehrung) select id, '00000000-0000-0000-0000-0000000008a3', true, true, 25 from public.rpg_arena_matches where host_name = 'w';
select pg_temp.ok(min(waehrung) >= 5 and max(waehrung) <= 25 and count(distinct waehrung) > 10, 'Würfe liegen zwischen 5 und 25 (' || min(waehrung) || '–' || max(waehrung) || ')') from public.rpg_arena_rewards where user_id = '00000000-0000-0000-0000-0000000008a3';
