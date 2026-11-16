-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 021 (Codes für Seelensplitter)
-- Entfernt die Spalte und die erweiterte Anlege-Funktion. Schon gutgeschriebene Seelensplitter bleiben.
-- Noch nicht eingelöste Splitter-Codes werden gesperrt (sie würden sonst nach dem Rückbau alle Helden freischalten).
-- WICHTIG: Danach Migration 006 noch einmal ausführen – sie stellt rpg_redeem_unlock_code, rpg_admin_create_code und
-- rpg_admin_codes in ihrer früheren Fassung wieder her.
-- =====================================================================
begin;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'rpg_unlock_codes' and column_name = 'waehrung') then
    update public.rpg_unlock_codes set active = false where waehrung is not null and active;
  end if;
end $$;
drop function if exists public.rpg_admin_create_code(text, text, integer, integer, integer);
alter table if exists public.rpg_unlock_codes drop column if exists waehrung;
commit;
