-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 027: Arena – ein verlassener Kampf gegen den Rechner-Gegner zählt als verloren
-- =====================================================================
-- Voraussetzung: Migrationen 015 (Serverkampf), 019 (Rechner-Gegner) und 022 (Ranked) sind eingespielt.
--
-- Worum es geht:
--   Gegen einen Menschen hält das Gerät des Gegners den Kampf in Gang: Wer weggeht, verliert nach drei verstrichenen Zügen.
--   Gegen den Rechner-Gegner hält niemand den Kampf in Gang. Die Edge Function „arena“ holt jetzt nach, was in der
--   Abwesenheit geschehen wäre, sobald der Spieler zurückkommt. Kommt er aber GAR NICHT zurück, bliebe der Kampf offen
--   und würde nie gewertet – ein schlecht laufender Ranked-Kampf ließe sich so einfach liegen lassen.
--
-- Was diese Migration ändert (nur die Funktion rpg_ranked_nachholen aus Migration 022):
--   • Bevor die Ranked-Wertung nachgeholt wird, werden verlassene Kämpfe des Kontos gegen den Rechner-Gegner beendet:
--     Läuft ein solcher Kampf und ist seit mehr als 5 Minuten kein Schritt mehr gerechnet worden, gilt er als aufgegeben
--     (Sieger: der Rechner-Gegner, Grund: Aufgabe). Fünf Minuten sind mehr als die drei verstrichenen Zugzeiten,
--     nach denen der Kampf ohnehin verloren wäre.
--   • Danach läuft die Wertung wie bisher: In Ranked kostet das die übliche Niederlage (−15 Punkte). Erfahrung und
--     Seelensplitter gibt es für eine Aufgabe wie bisher nicht.
--   • rpg_ranked_nachholen wird von rpg_ranked_queue und rpg_ranked_status aufgerufen – also immer, wenn das Konto die
--     Arena öffnet oder erneut sucht. Kämpfe gegen Menschen und Kämpfe vor dem Start sind nicht betroffen.
--
-- NUR FÜR DAS RPG. Keine Tabelle und keine andere Funktion wird geändert. Rückbau: 027_rpg_ranked_verlassen_rueckbau.sql
-- Unverändert in den Supabase SQL Editor einfügen und ausführen. Mehrfaches Ausführen ist unschädlich.
-- =====================================================================
begin;

do $$ begin
  if to_regprocedure('public.rpg_ranked_nachholen(uuid)') is null or to_regprocedure('public.rpg_ranked_werten(uuid)') is null then raise exception 'Migration 022 (Ranked) fehlt.'; end if;
  if to_regclass('public.rpg_arena_fights') is null or not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'rpg_arena_fights' and column_name = 'bot') then
    raise exception 'Migration 015 (Serverkampf) oder 019 (Rechner-Gegner) fehlt.';
  end if;
end $$;

create or replace function public.rpg_ranked_nachholen(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_m public.rpg_arena_matches%rowtype;
begin
  if p_user is null then return; end if;
  -- Verlassene Kämpfe gegen den Rechner-Gegner: seit über 5 Minuten kein Schritt mehr → aufgegeben
  for v_id in select m.id from public.rpg_arena_matches m join public.rpg_arena_fights f on f.match_id = m.id
              where m.host_id = p_user and m.guest_id is null and m.guest_team is not null and f.bot is not null
                and m.status = 'laeuft' and f.updated_at < now() - interval '5 minutes' loop
    update public.rpg_arena_matches set status = 'beendet', sieger = 2, grund = 'aufgabe', ended_at = now()
      where id = v_id and status = 'laeuft' returning * into v_m;
    if found then perform public.rpg_arena_belohnen(v_m, v_m.host_id); end if;
  end loop;
  -- wie bisher: beendete, noch nicht gewertete Ranked-Kämpfe werten
  for v_id in select r.match_id from public.rpg_ranked_matches r join public.rpg_arena_matches m on m.id = r.match_id
              where r.gewertet is null and m.status = 'beendet' and (m.host_id = p_user or m.guest_id = p_user) loop
    perform public.rpg_ranked_werten(v_id);
  end loop;
end;
$$;
revoke all on function public.rpg_ranked_nachholen(uuid) from public, anon, authenticated;

commit;
