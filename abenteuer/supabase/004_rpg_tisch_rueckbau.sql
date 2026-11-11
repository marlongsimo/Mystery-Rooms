-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 004 (Spieltisch-Geräte, Kampagnen-Links)
-- Danach 001_rpg_kampagnen.sql und 002_rpg_profile.sql erneut ausführen
-- (stellt die ersetzten Funktionen mit reiner Host-Prüfung wieder her).
-- ACHTUNG: Tisch-Mitgliedschaften werden entfernt, alle Links ungültig.
-- =====================================================================
begin;
drop function if exists public.rpg_campaign_room(uuid);
drop function if exists public.rpg_claim_table(text);
drop function if exists public.rpg_join_as_guest(text, text);
drop function if exists public.rpg_link_info(text);
drop function if exists public.rpg_create_link(uuid, text);
drop function if exists public.rpg_raum_von(uuid);
drop function if exists public.rpg_link_von(text);
drop function if exists public.rpg_link_hash(text);
drop function if exists public.rpg_neuer_code();
drop table if exists public.rpg_links;
drop function if exists public.rpg_rename_campaign(uuid, text);
delete from public.rpg_campaign_members where role = 'tisch';
alter table public.rpg_campaign_members drop constraint if exists rpg_campaign_members_role_check;
alter table public.rpg_campaign_members add constraint rpg_campaign_members_role_check check (role in ('host', 'spieler'));
-- rpg_ist_tisch wird von den ersetzten Funktionen benutzt: erst nach erneutem Einspielen von 001 entfernen
commit;
