-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 018 (Profilrahmen für andere sichtbar).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000018a1', false), ('00000000-0000-0000-0000-0000000018a2', false), ('00000000-0000-0000-0000-0000000018a3', false), ('00000000-0000-0000-0000-0000000018a4', false);
insert into public.rpg_profiles (user_id, handle, avatar_key) values ('00000000-0000-0000-0000-0000000018a1', 'Sicht_A', 'schildwaechter'), ('00000000-0000-0000-0000-0000000018a2', 'Sicht_B', 'trickser'),
  ('00000000-0000-0000-0000-0000000018a3', 'Sicht_C', null), ('00000000-0000-0000-0000-0000000018a4', 'Fremd_D', 'berserker');
insert into public.rpg_cosmetic_owned (user_id, item_id, preis) values ('00000000-0000-0000-0000-0000000018a1', 'r_lorbeer', 150), ('00000000-0000-0000-0000-0000000018a2', 'r_krone', 150), ('00000000-0000-0000-0000-0000000018a4', 'r_gold', 150), ('00000000-0000-0000-0000-0000000018a1', 'w_glut', 150);
insert into public.rpg_cosmetic_equipped (user_id, wuerfel, rahmen) values ('00000000-0000-0000-0000-0000000018a1', 'w_glut', 'r_lorbeer'), ('00000000-0000-0000-0000-0000000018a2', null, 'r_krone'), ('00000000-0000-0000-0000-0000000018a4', null, 'r_gold');
insert into public.rpg_friendships (requester_id, addressee_id, status) values ('00000000-0000-0000-0000-0000000018a1', '00000000-0000-0000-0000-0000000018a2', 'accepted'), ('00000000-0000-0000-0000-0000000018a1', '00000000-0000-0000-0000-0000000018a3', 'pending');
-- Kampf A gegen D (keine Freunde)
insert into public.rpg_arena_matches (id, status, host_id, host_name, host_team, host_schnitt, guest_id, guest_name, guest_team, guest_schnitt)
  values ('00000000-0000-0000-0000-0000000018f1', 'bereit', '00000000-0000-0000-0000-0000000018a1', 'Sicht_A', '[]', 1.0, '00000000-0000-0000-0000-0000000018a4', 'Fremd_D', '[]', 1.0);
create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000018a' || case p when 'A' then '1' when 'B' then '2' when 'C' then '3' else '4' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin begin execute sql; exception when others then if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if; raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm; end;
  raise exception '✗ %: kein Fehler', t; end $$;
grant execute on all functions in schema pg_temp to authenticated;
set role authenticated;
-- Arena: beide Teilnehmer sehen einander, auch ohne Freundschaft
select pg_temp.als('D');
select public.rpg_arena_looks('00000000-0000-0000-0000-0000000018f1') as l \gset
select pg_temp.ok(:'l'::jsonb->'host' = '{"name": "Sicht_A", "avatar": "schildwaechter", "rahmen": "r_lorbeer"}'::jsonb and :'l'::jsonb->'gast'->>'rahmen' = 'r_gold' and :'l'::jsonb->'gast'->>'avatar' = 'berserker',
  'Arena: Der Gegner sieht Profilbild und Rahmen beider Teilnehmer');
select pg_temp.ok(:'l'::text !~ 'w_glut' and :'l'::text !~ 'wuerfel' and :'l'::text !~ 'besitz', '… aber weder den Würfel noch den Besitz');
select pg_temp.als('B');
select pg_temp.fehler('select public.rpg_arena_looks(''00000000-0000-0000-0000-0000000018f1'')', 'gibt es nicht', 'Ein Unbeteiligter erfährt über den Kampf nichts');
-- Freunde
select pg_temp.als('A');
select public.rpg_looks(array['Sicht_B', 'sicht_a', 'Sicht_C', 'Fremd_D', 'Niemand']) as f \gset
select pg_temp.ok(:'f'::jsonb->'Sicht_B'->>'rahmen' = 'r_krone' and :'f'::jsonb->'Sicht_A'->>'rahmen' = 'r_lorbeer', 'Freunde: A sieht den Rahmen seines Freundes B und den eigenen (Groß-/Kleinschreibung egal)');
select pg_temp.ok(not (:'f'::jsonb ? 'Fremd_D') and not (:'f'::jsonb ? 'Sicht_C') and not (:'f'::jsonb ? 'Niemand'), 'Für Fremde, offene Anfragen und unbekannte Namen kommt nichts zurück');
select pg_temp.ok(public.rpg_looks(array[]::text[]) = '{}'::jsonb and public.rpg_looks(null) = '{}'::jsonb, 'Leere Anfrage: leere Antwort');
select pg_temp.fehler('select public.rpg_looks(array(select ''n'' || g from generate_series(1, 61) g))', 'Zu viele Namen', 'Mehr als 60 Namen werden abgelehnt');
select pg_temp.fehler('select public.rpg_look_von(''00000000-0000-0000-0000-0000000018a4'')', 'permission denied', 'Die innere Funktion ist nicht direkt aufrufbar');
select pg_temp.als('C');
select pg_temp.ok(public.rpg_looks(array['Sicht_C'])->'Sicht_C' = '{"name": "Sicht_C", "avatar": null, "rahmen": null}'::jsonb, 'Ohne Auswahl: Rahmen und Bild sind leer (Standard)');
reset role;
select pg_temp.ok(has_function_privilege('authenticated', 'public.rpg_looks(text[])', 'execute') and not has_function_privilege('anon', 'public.rpg_looks(text[])', 'execute') and not has_function_privilege('anon', 'public.rpg_arena_looks(uuid)', 'execute'), 'Rechte: nur angemeldete Nutzer');
