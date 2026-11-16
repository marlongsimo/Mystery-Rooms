-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 023 (Erfahrungspakete)
-- Entfernt Pakete, Kaufliste und die beiden Funktionen. Schon gekaufte Erfahrung bleibt bei den Helden.
-- =====================================================================
begin;
drop function if exists public.rpg_xp_buy(text, text, integer);
drop function if exists public.rpg_xp_shop();
drop table if exists public.rpg_xp_purchases;
drop table if exists public.rpg_xp_packs;
commit;
