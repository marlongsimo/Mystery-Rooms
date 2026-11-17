-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 027 (Zwangsaufgabe und Zeitstrafe)
-- Nimmt die Prüfzeilen aus den beiden Suchfunktionen, stellt rpg_ranked_nachholen in der Fassung von Migration 022 wieder her
-- und entfernt Auslöser, Funktionen und die Tabelle der Zeitstrafen. Schon gewertete Kämpfe bleiben gewertet.
-- =====================================================================
begin;
do $$
declare v_alt text; v_neu text;
begin
  if to_regprocedure('public.rpg_arena_queue(text)') is not null then
    v_alt := pg_get_functiondef('public.rpg_arena_queue(text)'::regprocedure);
    v_neu := regexp_replace(v_alt, '[ \t]*perform public\.rpg_ranked_nachholen\(auth\.uid\(\)\); perform public\.rpg_arena_sperre_pruefen\(\);[^\n]*\n', '', 'i');
    if v_neu <> v_alt then execute v_neu; raise notice 'rpg_arena_queue: wieder wie vorher'; end if;
  end if;
  if to_regprocedure('public.rpg_ranked_queue()') is not null then
    v_alt := pg_get_functiondef('public.rpg_ranked_queue()'::regprocedure);
    v_neu := regexp_replace(v_alt, ' perform public\.rpg_arena_sperre_pruefen\(\);', '', 'i');
    if v_neu <> v_alt then execute v_neu; raise notice 'rpg_ranked_queue: wieder wie vorher'; end if;
  end if;
end $$;
create or replace function public.rpg_ranked_nachholen(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  for v_id in select r.match_id from public.rpg_ranked_matches r join public.rpg_arena_matches m on m.id = r.match_id
              where r.gewertet is null and m.status = 'beendet' and (m.host_id = p_user or m.guest_id = p_user) loop
    perform public.rpg_ranked_werten(v_id);
  end loop;
end;
$$;
drop trigger if exists rpg_arena_strafe_bei_ende on public.rpg_arena_matches;
drop function if exists public.rpg_arena_strafe_bei_ende();
drop function if exists public.rpg_arena_sperre_pruefen();
drop function if exists public.rpg_arena_sperre();
drop function if exists public.rpg_arena_sperren_setzen(uuid, timestamptz, uuid);
drop function if exists public.rpg_arena_strafdauer();
drop table if exists public.rpg_arena_sperren;
commit;
