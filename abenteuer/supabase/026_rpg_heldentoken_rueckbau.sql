-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 026 (Heldentoken, Held der Woche, Heldenkauf, Heldenchance nach Kampagnen)
-- Stellt in rpg_claim_ending die alte Bedingung wieder her (jedes neue Ende bringt sicher eine Heldenwahl) und entfernt die
-- neuen Funktionen und Tabellen. Gekaufte Helden bleiben in den Sammlungen. Noch nicht eingesetzte Heldentoken gehen verloren
-- (die Seelensplitter dafür werden nicht erstattet).
-- =====================================================================
begin;
do $$
declare v_alt text; v_neu text;
begin
  if to_regprocedure('public.rpg_claim_ending(uuid)') is null then return; end if;
  v_alt := pg_get_functiondef('public.rpg_claim_ending(uuid)'::regprocedure);
  v_neu := regexp_replace(v_alt, 'if\s+random\(\)\s*<\s*(public\.)?rpg_ende_heldenchance\(\s*v_neu\s*\)\s+then', 'if v_neu then', 'i');
  if v_neu <> v_alt then execute v_neu; raise notice 'rpg_claim_ending: wieder wie vorher (jedes neue Ende bringt eine Heldenwahl)'; end if;
end $$;
drop function if exists public.rpg_hero_buy(text, text);
drop function if exists public.rpg_token_buy(integer);
drop function if exists public.rpg_shop_week_buy();
drop function if exists public.rpg_shop_week();
drop function if exists public.rpg_ende_heldenchance(boolean);
drop function if exists public.rpg_woche_preis();
drop function if exists public.rpg_token_preis();
drop function if exists public.rpg_hero_preis();
drop table if exists public.rpg_shop_weekly;
drop table if exists public.rpg_hero_token_log;
drop table if exists public.rpg_hero_tokens;
commit;
