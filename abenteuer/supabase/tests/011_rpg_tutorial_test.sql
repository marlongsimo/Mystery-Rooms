-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 011 (Tutorial je Profil).
-- Läuft nach den Tests zu 008: Konten A (…08a1), B (…08a2), C (…08a3) und Gast G (…08a4) gibt es schon.
\set ON_ERROR_STOP on
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', case p when 'A' then '00000000-0000-0000-0000-0000000008a1' when 'B' then '00000000-0000-0000-0000-0000000008a2' when 'C' then '00000000-0000-0000-0000-0000000008a3' when 'G' then '00000000-0000-0000-0000-0000000008a4' else '' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
-- A gab es schon vor der Migration, B wurde danach registriert
update public.rpg_profiles set created_at = (select eingefuehrt from public.rpg_tutorial_meta) - interval '1 day' where user_id = '00000000-0000-0000-0000-0000000008a1';
update public.rpg_profiles set created_at = (select eingefuehrt from public.rpg_tutorial_meta) + interval '1 minute' where user_id = '00000000-0000-0000-0000-0000000008a2';
set role authenticated;
select pg_temp.als('A');
select pg_temp.fehler('select * from public.rpg_tutorial', 'permission denied', 'Tutorial-Werte sind nicht direkt lesbar');
select pg_temp.ok(not (public.rpg_tutorial_state()->>'tutorial')::boolean, 'Bestehendes Konto: kein Tutorial');
select pg_temp.als('B');
select pg_temp.ok((public.rpg_tutorial_state()->>'tutorial')::boolean, 'Neu registriertes Konto: Tutorial steht an');
select pg_temp.ok(not (public.rpg_tutorial_done()->>'tutorial')::boolean, 'Überspringen oder „Ich bin bereit!“: Tutorial ist erledigt');
select pg_temp.ok(not (public.rpg_tutorial_state()->>'tutorial')::boolean, '… und bleibt es beim nächsten Abfragen');
select pg_temp.als('A');
select pg_temp.ok((public.rpg_tutorial_reset()->>'tutorial')::boolean, 'Noch einmal ansehen: auch ein bestehendes Konto kann es wieder einschalten');
select pg_temp.ok((public.rpg_tutorial_state()->>'tutorial')::boolean, '… und es steht danach wieder an');
select pg_temp.als('B');
select pg_temp.ok(not (public.rpg_tutorial_state()->>'tutorial')::boolean, 'Der Wert gilt je Konto (B bleibt erledigt)');
select pg_temp.als('G');
select pg_temp.ok(not (public.rpg_tutorial_state()->>'tutorial')::boolean and not (public.rpg_tutorial_done()->>'konto')::boolean, 'Gäste: kein Tutorial-Wert');
reset role;
select pg_temp.ok((select count(*) = 2 from public.rpg_tutorial), 'Gespeichert sind genau die zwei Konten, die etwas geändert haben');
