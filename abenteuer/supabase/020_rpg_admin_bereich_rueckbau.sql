-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 020 (Admin-Bereich: Rechner-Gegner einstellen, Kampfstatistik)
-- Entfernt die Einstellungen und die Admin-Funktionen. Kämpfe und Belohnungen bleiben.
-- WICHTIG: Danach Migration 019 noch einmal ausführen – sie stellt rpg_arena_bot, rpg_arena_queue und rpg_arena_srv_load
-- in ihrer Fassung ohne Einstellungen wieder her (bis dahin funktioniert die Arena-Suche nicht). Für die frühere
-- Arena-Auswertung anschließend Migration 010 noch einmal ausführen.
-- =====================================================================
begin;
drop function if exists public.rpg_admin_bot_set(boolean, integer, numeric, numeric, integer, integer);
drop function if exists public.rpg_admin_bot();
drop function if exists public.rpg_arena_stats();
drop function if exists public.rpg_arena_bot_cfg();
drop table if exists public.rpg_arena_bot_settings;
commit;
