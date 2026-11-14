-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 008 (Arena und Währung)
-- Entfernt alle Objekte der Arena samt ihren Daten (Kämpfe, Belohnungen, Währung).
-- Heldenstufen, Sammlungen, Kampagnen und alles aus 001–007 bleiben unverändert
-- (XP, die in der Arena verdient wurden, bleiben den Helden erhalten).
-- =====================================================================
begin;
drop function if exists public.rpg_arena_report(uuid, integer, text, jsonb, integer);
drop function if exists public.rpg_arena_cancel(uuid);
drop function if exists public.rpg_arena_room(uuid, text);
drop function if exists public.rpg_arena_get(uuid);
drop function if exists public.rpg_arena_join(uuid, text[]);
drop function if exists public.rpg_arena_create(text[]);
drop function if exists public.rpg_my_wallet();
drop function if exists public.rpg_arena_list();
drop function if exists public.rpg_arena_belohnen(public.rpg_arena_matches, uuid);
drop function if exists public.rpg_arena_json(public.rpg_arena_matches, uuid);
drop function if exists public.rpg_arena_xp(integer, integer, boolean);
drop function if exists public.rpg_arena_schnitt(jsonb);
drop function if exists public.rpg_arena_team(uuid, text[]);
drop table if exists public.rpg_arena_rewards;
drop table if exists public.rpg_arena_matches;
drop table if exists public.rpg_wallet;
commit;
