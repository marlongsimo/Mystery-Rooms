-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 001
-- Entfernt AUSSCHLIESSLICH die Objekte aus 001_rpg_kampagnen.sql.
-- ACHTUNG: Alle RPG-Kampagnen und Spielstände gehen dabei verloren.
-- Bestehende Tabellen (game_sessions, session_players, session_state,
-- game_catalog, game_ratings …) werden nicht angefasst.
-- =====================================================================
begin;
drop function if exists public.rpg_leave_campaign(uuid);
drop function if exists public.rpg_delete_campaign(uuid);
drop function if exists public.rpg_reset_campaign(uuid);
drop function if exists public.rpg_sync_members(uuid, jsonb);
drop function if exists public.rpg_start_session(uuid, uuid);
drop function if exists public.rpg_set_campaign_status(uuid, text);
drop function if exists public.rpg_my_campaigns();
drop function if exists public.rpg_load_campaign(uuid);
drop function if exists public.rpg_save_snapshot(uuid, integer, jsonb, text, jsonb);
drop function if exists public.rpg_create_campaign(text, text, text, text);
drop table if exists public.rpg_state_snapshots;
drop table if exists public.rpg_sessions;
drop table if exists public.rpg_campaign_members;
drop table if exists public.rpg_campaigns;
drop function if exists public.rpg_ist_host(uuid);
drop function if exists public.rpg_ist_mitglied(uuid);
commit;
