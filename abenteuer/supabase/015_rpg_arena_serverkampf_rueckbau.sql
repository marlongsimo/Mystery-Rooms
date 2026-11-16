-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 015 (Arena: der Server rechnet den Kampf)
-- Entfernt nur, was Migration 015 angelegt hat. Kämpfe, Belohnungen, gespeicherte Teams, die Suche aus Migration 014
-- und die bisherige Arena bleiben unberührt. Die Edge Function „arena“ kann im Dashboard gelöscht werden.
-- =====================================================================
begin;
drop function if exists public.rpg_arena_srv_end(uuid);
drop function if exists public.rpg_arena_srv_save(uuid, uuid, integer, jsonb, jsonb);
drop function if exists public.rpg_arena_srv_load(uuid, uuid);
drop function if exists public.rpg_arena_fight_leader(uuid, integer);
drop function if exists public.rpg_arena_fight(uuid, integer);
drop function if exists public.rpg_arena_search_server();
drop table if exists public.rpg_arena_search_srv;
drop table if exists public.rpg_arena_steps;
drop table if exists public.rpg_arena_fights;
commit;
