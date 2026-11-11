-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 002
-- Entfernt rpg_profiles und die Profilfunktionen und stellt die beiden
-- Funktionen aus Migration 001 wieder her (erneut 001 einspielen genügt dafür:
-- 001_rpg_kampagnen.sql ist wiederholbar und überschreibt sie).
-- ACHTUNG: Alle Benutzernamen gehen verloren.
-- =====================================================================
begin;
drop function if exists public.rpg_login_email(text);
drop function if exists public.rpg_my_profile();
drop function if exists public.rpg_set_profile(text, text);
drop function if exists public.rpg_handle_frei(text);
drop function if exists public.rpg_name_gesperrt(text);
drop function if exists public.rpg_anmelde_adresse(uuid);
drop table if exists public.rpg_profiles;
drop function if exists public.rpg_teilt_kampagne(uuid);
drop function if exists public.rpg_ist_konto(uuid);
commit;
-- Danach 001_rpg_kampagnen.sql erneut ausführen (stellt rpg_load_campaign / rpg_my_campaigns ohne Profile wieder her).
