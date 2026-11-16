-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 014 (gespeichertes Arena-Team und Gegnersuche)
-- Entfernt nur, was Migration 014 angelegt hat. Kämpfe, Belohnungen und die bisherige Arena bleiben.
-- =====================================================================
begin;
drop function if exists public.rpg_arena_search_count();
drop function if exists public.rpg_arena_search();
drop function if exists public.rpg_arena_squad_set(text[]);
drop function if exists public.rpg_arena_squad();
drop table if exists public.rpg_arena_search;
drop table if exists public.rpg_arena_squads;
commit;
