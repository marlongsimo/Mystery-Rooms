-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 003 (Freunde, Einladungen)
-- ACHTUNG: Alle Freundschaften und offenen Einladungen gehen verloren.
-- Mitgliedschaften aus angenommenen Einladungen bleiben bestehen.
-- Danach 002_rpg_profile.sql erneut ausführen (stellt die alte Lese-Richtlinie für Profile wieder her).
-- =====================================================================
begin;
drop policy if exists rpg_profiles_lesen on public.rpg_profiles;
drop function if exists public.rpg_my_inbox();
drop function if exists public.rpg_campaign_open_invites(uuid);
drop function if exists public.rpg_answer_invite(uuid, boolean);
drop function if exists public.rpg_invite_friend(uuid, text);
drop function if exists public.rpg_my_friends();
drop function if exists public.rpg_unblock(text);
drop function if exists public.rpg_block(text);
drop function if exists public.rpg_remove_friend(text);
drop function if exists public.rpg_answer_friend(text, boolean);
drop function if exists public.rpg_request_friend(text);
drop function if exists public.rpg_find_player(text);
drop function if exists public.rpg_sieht_profil(uuid);
drop function if exists public.rpg_konto_pflicht();
drop function if exists public.rpg_sind_freunde(uuid, uuid);
drop function if exists public.rpg_freundschaft(uuid, uuid);
drop function if exists public.rpg_uid_von(text);
drop table if exists public.rpg_campaign_invites;
drop table if exists public.rpg_friendships;
commit;
