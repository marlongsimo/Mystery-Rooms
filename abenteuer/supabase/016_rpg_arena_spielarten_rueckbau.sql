-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 016 (Arena: Normal, Arcade, privater Kampf)
-- Entfernt, was Migration 016 angelegt hat. Kämpfe und Belohnungen bleiben.
-- WICHTIG: Danach Migration 015 noch einmal ausführen – sie stellt rpg_arena_fight, rpg_arena_srv_load und
-- rpg_arena_search_server in ihrer Fassung ohne Spielarten wieder her. Die Edge Function kommt mit beiden Fassungen zurecht.
-- =====================================================================
begin;
drop function if exists public.rpg_arena_invite_answer(uuid, boolean);
drop function if exists public.rpg_arena_invite_cancel(uuid);
drop function if exists public.rpg_arena_invites();
drop function if exists public.rpg_arena_invite(text, text);
drop function if exists public.rpg_arena_search_server();
drop function if exists public.rpg_arena_queue(text);
drop table if exists public.rpg_arena_invites;
alter table if exists public.rpg_arena_search_srv drop column if exists art;
alter table if exists public.rpg_arena_fights drop column if exists privat;
alter table if exists public.rpg_arena_fights drop column if exists modus;
commit;
