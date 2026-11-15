-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 009 (Spielmodi der Arena)
-- Entfernt die gemerkten Modi und die gewürfelte Währung (danach wieder fest 25 je Sieg). Kämpfe, Belohnungen und alles aus 001–008 bleiben unverändert.
-- =====================================================================
begin;
drop trigger if exists rpg_arena_waehrung_wuerfeln on public.rpg_arena_rewards;
drop function if exists public.rpg_arena_waehrung_wuerfeln();
drop function if exists public.rpg_arena_modes(uuid[]);
drop function if exists public.rpg_arena_set_mode(uuid, text);
drop table if exists public.rpg_arena_modes;
commit;
