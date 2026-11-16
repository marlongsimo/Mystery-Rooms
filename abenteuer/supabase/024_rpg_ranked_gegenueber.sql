-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 024: Arena – der Rang des Gegners in der Aufstellung
-- =====================================================================
-- Voraussetzung: Migration 022 (Ranked) ist eingespielt.
--
-- Was diese Migration tut:
--   • Eine neue Funktion rpg_ranked_gegenueber(Kampf): nennt den beiden Teilnehmern eines Kampfs den Rang beider Seiten,
--     damit die Aufstellung vor dem Kampf ihn zeigen kann.
--       – Ranked-Kampf: der Rang, mit dem beide in den Kampf gegangen sind.
--       – Sonst (Normal, Arcade): der aktuelle Rang der laufenden Saison (wer noch nicht gespielt hat: Bronze III).
--       – Ein Rechner-Gegner steht im selben Rang wie der Spieler.
--     Herausgegeben wird nur der Rang (0 = Bronze III … 14 = Meister I), keine Punkte. Unbeteiligte erfahren nichts.
--     Läuft keine Saison, meldet die Funktion {"da": false}.
--
-- NUR FÜR DAS RPG. Rein additiv: eine neue Funktion; keine Tabelle, keine vorhandene Funktion wird geändert.
-- Rückbau: 024_rpg_ranked_gegenueber_rueckbau.sql
-- Unverändert in den Supabase SQL Editor einfügen und ausführen. Mehrfaches Ausführen ist unschädlich.
-- =====================================================================
begin;

do $$ begin
  if to_regprocedure('public.rpg_ranked_rang(integer)') is null or to_regclass('public.rpg_ranked_matches') is null then
    raise exception 'Migration 022 (Ranked) fehlt. Bitte zuerst 022_rpg_ranked.sql einspielen.';
  end if;
end $$;

create or replace function public.rpg_ranked_gegenueber(p_match_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m public.rpg_arena_matches%rowtype; v_s public.rpg_ranked_seasons%rowtype; v_r public.rpg_ranked_matches%rowtype;
  v_hp integer; v_gp integer; v_ranked boolean := false;
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id;
  if not found or v_uid is null or (v_m.host_id <> v_uid and v_m.guest_id is distinct from v_uid) then raise exception 'Diesen Kampf gibt es nicht.'; end if;
  select * into v_r from public.rpg_ranked_matches where match_id = p_match_id;
  if found then
    v_ranked := true; v_hp := v_r.host_vor; v_gp := v_r.guest_vor;
  else
    v_s := public.rpg_ranked_saison();
    if v_s.id is null then return jsonb_build_object('da', false); end if;
    select coalesce((select punkte from public.rpg_ranked_players where season_id = v_s.id and user_id = v_m.host_id), 0) into v_hp;
    if v_m.guest_id is not null then
      select coalesce((select punkte from public.rpg_ranked_players where season_id = v_s.id and user_id = v_m.guest_id), 0) into v_gp;
    elsif v_m.guest_team is not null then
      v_gp := v_hp;   -- Rechner-Gegner: derselbe Rang
    end if;
  end if;
  return jsonb_build_object('da', true, 'ranked', v_ranked, 'host', public.rpg_ranked_rang(v_hp),
    'gast', case when v_gp is null then null else public.rpg_ranked_rang(v_gp) end);
end;
$$;

revoke all on function public.rpg_ranked_gegenueber(uuid) from public, anon;
grant execute on function public.rpg_ranked_gegenueber(uuid) to authenticated;

commit;
