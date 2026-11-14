-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 007 (Heldenstufen und XP)
-- Entfernt alle Objekte der Heldenstufen samt ihren Daten (Fortschritt, Buchungen).
-- Sammlungen, Kampagnen, Konten und alles aus 001–006 bleiben unverändert.
-- =====================================================================
begin;
drop function if exists public.rpg_award_xp(uuid);
drop function if exists public.rpg_campaign_levels(uuid);
drop function if exists public.rpg_hero_levels();
drop function if exists public.rpg_xp_fuer(integer, integer, integer);
drop function if exists public.rpg_xp_stufe(integer);
drop table if exists public.rpg_xp_ledger;
drop table if exists public.rpg_hero_progress;
drop table if exists public.rpg_adventure_xp;
commit;
