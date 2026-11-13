-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 006 (Heldensammlung)
-- Entfernt alle Objekte der Heldensammlung samt ihren Daten (Sammlungen, Angebote,
-- gefundene Enden, Freischalt-Codes). Kampagnen, Konten und alles aus 001–005 bleiben unverändert.
-- =====================================================================
begin;
drop view if exists public.rpg_unlock_codes_uebersicht;
drop function if exists public.rpg_my_heroes();
drop function if exists public.rpg_hero_start_offer();
drop function if exists public.rpg_hero_pick(uuid, text);
drop function if exists public.rpg_claim_ending(uuid);
drop function if exists public.rpg_redeem_unlock_code(text);
drop function if exists public.rpg_campaign_heroes(uuid);
drop function if exists public.rpg_create_unlock_code(text, integer, integer);
drop function if exists public.rpg_disable_unlock_code(text);
drop function if exists public.rpg_hero_angebot_json(public.rpg_hero_offers);
drop function if exists public.rpg_hero_ziehen(uuid, integer, text[]);
drop function if exists public.rpg_sammlung_konto();
drop table if exists public.rpg_unlock_attempts;
drop table if exists public.rpg_unlock_redemptions;
drop table if exists public.rpg_unlock_codes;
drop table if exists public.rpg_ending_claims;
drop table if exists public.rpg_hero_endings_found;
drop table if exists public.rpg_hero_offers;
drop table if exists public.rpg_hero_collection;
drop table if exists public.rpg_adventure_endings;
drop table if exists public.rpg_hero_catalog;
drop table if exists public.rpg_sammlung_meta;
commit;
