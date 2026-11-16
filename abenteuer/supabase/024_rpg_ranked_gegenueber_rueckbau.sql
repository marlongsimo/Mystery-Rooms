-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 024 (Rang des Gegners in der Aufstellung)
-- Entfernt nur die eine Funktion. Daten gibt es zu dieser Migration keine.
-- =====================================================================
begin;
drop function if exists public.rpg_ranked_gegenueber(uuid);
commit;
