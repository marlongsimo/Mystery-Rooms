-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 009 (Spielmodi der Arena)
-- Entfernt die gemerkten Modi. Kämpfe, Belohnungen und alles aus 001–008 bleiben unverändert.
-- =====================================================================
begin;
drop function if exists public.rpg_arena_modes(uuid[]);
drop function if exists public.rpg_arena_set_mode(uuid, text);
drop table if exists public.rpg_arena_modes;
commit;
