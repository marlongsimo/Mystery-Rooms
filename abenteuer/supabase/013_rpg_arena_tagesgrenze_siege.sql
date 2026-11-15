-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 013: Arena-Tagesgrenze zählt nur Siege
-- Setzt Migration 008 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG.
--
-- Was diese Migration ändert:
--   • Bisher zählte jeder gewertete Arena-Kampf zur Tagesgrenze von fünf, auch eine Niederlage.
--     Jetzt zählen nur noch Siege: Erst nach fünf gewerteten Siegen an einem Tag bringt die Arena
--     bis zum nächsten Tag keine Erfahrung und keine Heldenchance mehr.
--   • Niederlagen bringen weiter ihre (kleinere) Erfahrung, verbrauchen aber keinen der fünf Plätze.
--     Die Obergrenze von 150 Erfahrung je Held und Tag aus der Arena bleibt.
--   • Die Arena-Übersicht meldet zusätzlich 'nur_siege': true, damit das Spiel „Siege“ statt „Kämpfe“ anzeigt.
--
-- Wie: rpg_arena_belohnen und rpg_arena_list werden NICHT neu geschrieben. In ihrer vorhandenen Fassung
-- wird nur die Zählung ergänzt – eigene Anpassungen an diesen Funktionen bleiben erhalten.
-- Am Ende meldet die Abfrage je Funktion, ob sie geändert wurde.
--
-- Rückbau: 013_rpg_arena_tagesgrenze_siege_rueckbau.sql
-- =====================================================================

do $$
declare f record; v_alt text; v_neu text;
begin
  for f in select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('rpg_arena_belohnen', 'rpg_arena_list') loop
    v_alt := pg_get_functiondef(f.oid);
    -- Zählung „… from rpg_arena_rewards where user_id = <x> and gewertet and created_at …“ um „and sieg“ ergänzen
    v_neu := regexp_replace(v_alt, '(rpg_arena_rewards\s+where\s+user_id\s*=\s*[a-z_.]+\s+and\s+gewertet)(\s+and\s+created_at)', '\1 and sieg\2', 'gi');
    if f.proname = 'rpg_arena_list' and v_neu !~ '''nur_siege''' then
      v_neu := regexp_replace(v_neu, '(''heute''\s*,)', '''nur_siege'', true, \1', 'i');
    end if;
    if v_neu = v_alt then
      raise notice '%: nichts zu ändern (zählt schon nur Siege, oder die Zählung sieht anders aus)', f.proname;
    else
      execute v_neu;
      raise notice '%: Tagesgrenze zählt jetzt nur Siege', f.proname;
    end if;
  end loop;
end $$;
