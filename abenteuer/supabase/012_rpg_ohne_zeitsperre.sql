-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 012: Belohnungen ohne 15-Minuten-Sperre
-- Setzt Migration 006 und 007 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG.
--
-- Was diese Migration ändert:
--   • Bisher brachte eine Kampagne nur dann eine Belohnung (neuer Held für ein neues Ende, XP),
--     wenn zwischen Anlegen und Abschluss mindestens 15 Minuten lagen. Diese Bedingung entfällt.
--   • Alles andere bleibt: Die Kampagne muss abgeschlossen sein, ein reguläres Ende erreicht haben
--     und mindestens 8 gespeicherte Stände besitzen.
--
-- Wie: Die beiden Funktionen rpg_claim_ending und rpg_award_xp werden NICHT neu geschrieben.
-- Aus ihrer vorhandenen Fassung in der Datenbank wird nur die Zeitbedingung herausgenommen –
-- eigene Anpassungen an diesen Funktionen bleiben erhalten. Am Ende meldet die Abfrage je Funktion,
-- ob sie geändert wurde oder die Bedingung schon fehlte.
--
-- Rückbau: 012_rpg_ohne_zeitsperre_rueckbau.sql
-- =====================================================================

do $$
declare f record; v_alt text; v_neu text;
begin
  for f in select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('rpg_claim_ending', 'rpg_award_xp') loop
    v_alt := pg_get_functiondef(f.oid);
    -- „… or <x>.completed_at - <x>.created_at < interval '15 minutes'“ herausnehmen
    v_neu := regexp_replace(v_alt, '\s+or\s+[a-z_.]*completed_at\s*-\s*[a-z_.]*created_at\s*<\s*interval\s*''15 minutes''', '', 'gi');
    if v_neu = v_alt then
      raise notice '%: keine 15-Minuten-Bedingung gefunden (unverändert)', f.proname;
    else
      execute v_neu;
      raise notice '%: 15-Minuten-Bedingung entfernt', f.proname;
    end if;
  end loop;
end $$;
