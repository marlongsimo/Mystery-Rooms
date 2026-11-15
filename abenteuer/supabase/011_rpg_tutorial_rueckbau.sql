-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 011 (Tutorial je Profil)
-- Entfernt den Tutorial-Wert aller Konten. Alles aus 001–010 bleibt unverändert.
-- =====================================================================
begin;
drop function if exists public.rpg_tutorial_reset();
drop function if exists public.rpg_tutorial_done();
drop function if exists public.rpg_tutorial_state();
drop table if exists public.rpg_tutorial;
drop table if exists public.rpg_tutorial_meta;
commit;
