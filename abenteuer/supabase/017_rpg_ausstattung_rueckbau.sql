-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 017 (Ausstattung beim Händler)
-- Entfernt Katalog, Besitz und Auswahl. ACHTUNG: Gekaufte Ausstattung geht dabei verloren; die dafür
-- ausgegebenen Seelensplitter werden NICHT zurückgebucht. Alles andere bleibt unberührt.
-- =====================================================================
begin;
drop function if exists public.rpg_cosmetic_equip(text, text);
drop function if exists public.rpg_cosmetic_buy(text);
drop function if exists public.rpg_cosmetics();
drop table if exists public.rpg_cosmetic_equipped;
drop table if exists public.rpg_cosmetic_owned;
drop table if exists public.rpg_cosmetic_items;
commit;
