-- =====================================================================
-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN.
-- Prüft Migration 002 (Benutzernamen) gegen die Nachbildung.
-- =====================================================================
\set ON_ERROR_STOP on
-- K = Konto (bestätigt), G = Gast (anonym), F = weiteres Konto
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000a1', false), ('00000000-0000-0000-0000-0000000000a2', true), ('00000000-0000-0000-0000-0000000000a3', false);

create function pg_temp.als(p text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', case p when 'K' then '00000000-0000-0000-0000-0000000000a1' when 'G' then '00000000-0000-0000-0000-0000000000a2' when 'F' then '00000000-0000-0000-0000-0000000000a3' else '' end, false); end $$;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$
begin if b then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
create function pg_temp.fehler(sql text, muster text, t text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then
    if sqlerrm ~ muster then raise notice '✓ % (%)', t, sqlerrm; return; end if;
    raise exception '✗ %: unerwartete Meldung „%“', t, sqlerrm;
  end;
  raise exception '✗ %: kein Fehler', t;
end $$;
grant execute on all functions in schema pg_temp to authenticated;
set role authenticated;

-- Prüfung der Namen
select pg_temp.als('K');
select pg_temp.ok(public.rpg_handle_frei('ab') = 'ungueltig' and public.rpg_handle_frei('mit leerzeichen') = 'ungueltig' and public.rpg_handle_frei(repeat('x', 21)) = 'ungueltig', 'Zu kurz, Leerzeichen, zu lang: ungültig');
select pg_temp.ok(public.rpg_handle_frei('Admin') = 'gesperrt' and public.rpg_handle_frei('Spieltisch') = 'gesperrt', 'Reservierte Namen gesperrt');
select pg_temp.ok(public.rpg_handle_frei('Jörg_42') = 'frei', 'Umlaute, Ziffern und _ erlaubt');
select pg_temp.ok(public.rpg_my_profile() is null, 'Ohne Profil: kein Profil');

-- Eindeutig, ohne Groß/Klein
select pg_temp.ok(public.rpg_set_profile('Anna')->>'handle' = 'Anna', 'Konto K heißt Anna');
select pg_temp.ok((public.rpg_my_profile()->>'konto')::boolean, 'Profil zeigt: bestätigtes Konto');
select pg_temp.als('F');
select pg_temp.ok(public.rpg_handle_frei('anna') = 'vergeben', '„anna“ ist vergeben (Groß/Klein egal)');
select pg_temp.fehler('select public.rpg_set_profile(''ANNA'')', 'schon vergeben', 'F kann ANNA nicht nehmen');
select pg_temp.fehler('select public.rpg_set_profile(''a b'')', '3–20 Zeichen', 'Ungültiger Name abgewiesen');

-- Gast reserviert für 2 Tage
select pg_temp.als('G');
select pg_temp.ok(public.rpg_set_profile('Bruno')->>'konto' = 'false', 'Gast reserviert Bruno (noch kein Konto)');
select pg_temp.als('F');
select pg_temp.ok(public.rpg_handle_frei('bruno') = 'vergeben', 'Frische Gast-Reservierung gilt als vergeben');
reset role; update public.rpg_profiles set updated_at = now() - interval '3 days' where handle = 'Bruno'; set role authenticated;
select pg_temp.ok(public.rpg_handle_frei('Bruno') = 'frei', 'Nach 2 Tagen ohne Bestätigung wieder frei');
select pg_temp.ok(public.rpg_set_profile('Bruno')->>'handle' = 'Bruno', 'F übernimmt Bruno');
reset role;
select pg_temp.ok((select count(*) from public.rpg_profiles where lower(handle) = 'bruno') = 1
  and (select user_id from public.rpg_profiles where handle = 'Bruno') = '00000000-0000-0000-0000-0000000000a3', 'Abgelaufene Reservierung des Gasts entfernt');
set role authenticated;

-- Ein bestätigtes Konto verliert seinen Namen nie
reset role; update public.rpg_profiles set updated_at = now() - interval '30 days' where handle = 'Anna'; set role authenticated;
select pg_temp.als('F');
select pg_temp.ok(public.rpg_handle_frei('Anna') = 'vergeben', 'Konto-Name bleibt auch nach Wochen vergeben');

-- Sichtbarkeit: nur eigenes Profil und Mitspieler
select pg_temp.ok((select count(*) from public.rpg_profiles) = 1, 'F sieht nur das eigene Profil');
select pg_temp.fehler('select updated_at from public.rpg_profiles', 'permission denied', 'Interne Spalten nicht lesbar');
select pg_temp.fehler('insert into public.rpg_profiles (user_id, handle) values (auth.uid(), ''Hack'')', 'permission denied', 'Direktes Schreiben gesperrt');
select pg_temp.fehler('select public.rpg_ist_konto(auth.uid())', 'permission denied', 'Interne Funktion nicht aufrufbar');
select pg_temp.als('K');
select public.rpg_create_campaign('Gemeinsam') as k \gset
reset role;
insert into public.rpg_campaign_members (campaign_id, user_id, role, display_name) values (:'k', '00000000-0000-0000-0000-0000000000a3', 'spieler', 'Handy');
set role authenticated;
select pg_temp.als('F');
select pg_temp.ok((select count(*) from public.rpg_profiles) = 2, 'Mitspieler sehen sich gegenseitig (Anna und Bruno)');
select pg_temp.ok((select jsonb_agg(m->>'display_name' order by m->>'display_name') from jsonb_array_elements(public.rpg_load_campaign(:'k')->'members') m) = '["Anna", "Bruno"]'::jsonb, 'Kampagne zeigt Benutzernamen statt Gerätenamen');
select pg_temp.ok((select jsonb_agg(x->>'display_name') from jsonb_array_elements(public.rpg_my_campaigns()->0->'members') x) ? 'Anna', 'Bibliothek zeigt Benutzernamen');

-- Umbenennen
select pg_temp.als('K');
select pg_temp.ok(public.rpg_set_profile('Annika')->>'handle' = 'Annika', 'Umbenennen in Annika');
select pg_temp.ok(public.rpg_handle_frei('Anna') = 'frei', 'Alter Name wieder frei');
select pg_temp.ok((select display_name from public.rpg_campaign_members where user_id = auth.uid()) = 'Annika', 'Name in den Kampagnen angepasst');
reset role;
\echo 'ALLE PRÜFUNGEN BESTANDEN'
