-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 010 (Auswertung der Arena, Händler)
-- Entfernt Auswertung und Händler samt Tagesauswahl und Kaufliste.
-- Gekaufte Helden bleiben in der Sammlung, ausgegebene Seelensplitter kommen nicht zurück. Alles aus 001–009 bleibt unverändert.
-- =====================================================================
begin;
drop function if exists public.rpg_shop_buy(text);
drop function if exists public.rpg_shop_today();
drop function if exists public.rpg_shop_preis();
drop function if exists public.rpg_arena_stats();
drop function if exists public.rpg_arena_modus(integer);
drop table if exists public.rpg_shop_purchases;
drop table if exists public.rpg_shop_daily;
commit;
