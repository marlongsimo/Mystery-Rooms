-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 005 (Abenteuer einer Kampagne)
-- Entfernt rpg_set_adventure. rpg_claim_table liefert 'abenteuer' weiter mit – das stört nicht;
-- wer es ganz zurück will, führt danach 004_rpg_tisch.sql erneut aus. Es werden keine Daten gelöscht.
-- =====================================================================
begin;
drop function if exists public.rpg_set_adventure(uuid, text);
commit;
