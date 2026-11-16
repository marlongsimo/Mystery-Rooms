-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 015 (Arena: der Server rechnet den Kampf)
-- Entfernt nur, was Migration 015 angelegt hat. Kämpfe, Belohnungen, gespeicherte Teams und die bisherige Arena bleiben.
-- WICHTIG: Danach Migration 014 noch einmal ausführen – sie stellt die Gegnersuche (rpg_arena_search) in ihrer
-- Fassung ohne Serverkampf wieder her. Die Edge Function „arena“ kann im Dashboard gelöscht werden.
-- =====================================================================
begin;
drop function if exists public.rpg_arena_srv_end(uuid, integer, text, jsonb, integer);
drop function if exists public.rpg_arena_srv_save(uuid, integer, jsonb, jsonb);
drop function if exists public.rpg_arena_srv_load(uuid);
drop function if exists public.rpg_arena_fight_leader(uuid, integer);
drop function if exists public.rpg_arena_fight(uuid, integer);
drop function if exists public.rpg_arena_search_server();
drop function if exists public.rpg_arena_search();
drop function if exists public.rpg_arena_search_impl(boolean);
drop table if exists public.rpg_arena_steps;
drop table if exists public.rpg_arena_fights;
alter table if exists public.rpg_arena_search drop column if exists server;
commit;
