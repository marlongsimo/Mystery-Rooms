-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 023 (Erfahrungspakete)
-- Entfernt Pakete, Vorrat, Kaufliste und die Funktionen. Schon eingesetzte Erfahrung bleibt bei den Helden;
-- noch nicht eingesetzte Pakete im Vorrat gehen verloren (die Seelensplitter dafür werden nicht erstattet).
-- =====================================================================
begin;
drop function if exists public.rpg_xp_use(text, text, integer);
drop function if exists public.rpg_xp_buy(text, integer);
drop function if exists public.rpg_xp_buy(text, text, integer);
drop function if exists public.rpg_xp_shop();
drop table if exists public.rpg_xp_inventory;
drop table if exists public.rpg_xp_purchases;
drop table if exists public.rpg_xp_packs;
commit;
