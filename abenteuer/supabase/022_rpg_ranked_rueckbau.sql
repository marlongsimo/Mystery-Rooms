-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 022 (Arena: Ranked)
-- Entfernt Saisons, Rangpunkte und die Ranked-Funktionen. Gespielte Kämpfe, ihr gewöhnlicher Lohn und schon vergebene
-- Belohnungen (Seelensplitter, Würfel, Rahmen) bleiben. Offene Ranked-Suchen werden beendet.
-- =====================================================================
begin;
do $$ begin
  if to_regclass('public.rpg_arena_search_srv') is not null and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'rpg_arena_search_srv' and column_name = 'rang') then
    update public.rpg_arena_matches m set status = 'abgebrochen', ended_at = now() where m.status = 'offen' and exists (select 1 from public.rpg_arena_search_srv s where s.match_id = m.id and s.art = 'ranked');
    delete from public.rpg_arena_search_srv where art = 'ranked';
    alter table public.rpg_arena_search_srv drop constraint if exists rpg_arena_search_srv_art_ranked;
    alter table public.rpg_arena_search_srv add constraint rpg_arena_search_srv_art_check check (art in ('normal', 'arcade'));
    alter table public.rpg_arena_search_srv drop column rang;
  end if;
end $$;
drop function if exists public.rpg_admin_ranked_start(text, integer);
drop function if exists public.rpg_admin_ranked_end();
drop function if exists public.rpg_admin_ranked();
drop function if exists public.rpg_ranked_result(uuid);
drop function if exists public.rpg_ranked_status();
drop function if exists public.rpg_ranked_queue();
drop function if exists public.rpg_ranked_nachholen(uuid);
drop function if exists public.rpg_ranked_werten(uuid);
drop function if exists public.rpg_ranked_saison();
drop function if exists public.rpg_ranked_rang(integer);
drop table if exists public.rpg_ranked_matches;
drop table if exists public.rpg_ranked_players;
drop table if exists public.rpg_ranked_seasons;
alter table if exists public.rpg_arena_fights drop column if exists ranked;
-- Die Rang-Stücke bleiben im Katalog, solange jemand sie besitzt
do $$ begin
  if to_regclass('public.rpg_cosmetic_items') is not null then
    delete from public.rpg_cosmetic_items i where i.id like '%\_s0\_%' and not exists (select 1 from public.rpg_cosmetic_owned o where o.item_id = i.id)
      and not exists (select 1 from public.rpg_cosmetic_equipped e where e.wuerfel = i.id or e.rahmen = i.id);
  end if;
end $$;
commit;
