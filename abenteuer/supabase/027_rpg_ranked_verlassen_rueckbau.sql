-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 027 (verlassener Kampf gegen den Rechner-Gegner)
-- Stellt rpg_ranked_nachholen in der Fassung von Migration 022 wieder her. Schon gewertete Kämpfe bleiben gewertet.
-- =====================================================================
begin;
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
commit;
