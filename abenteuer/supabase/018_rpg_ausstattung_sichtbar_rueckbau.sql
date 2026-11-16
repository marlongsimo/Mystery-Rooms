-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 018 (Profilrahmen für andere sichtbar)
-- Entfernt nur die drei Funktionen. Ausstattung, Besitz und Auswahl bleiben; andere sehen die Rahmen dann nicht mehr.
-- =====================================================================
begin;
drop function if exists public.rpg_looks(text[]);
drop function if exists public.rpg_arena_looks(uuid);
drop function if exists public.rpg_look_von(uuid);
commit;
