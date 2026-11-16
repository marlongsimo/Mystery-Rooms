-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 019 (Arena: Rechner-Gegner)
-- Entfernt, was Migration 019 angelegt oder ergänzt hat. Beendete Kämpfe und Belohnungen bleiben.
-- Noch nicht beendete Kämpfe gegen den Rechner-Gegner werden ohne Wertung abgebrochen.
-- WICHTIG: Danach Migration 016 und 018 noch einmal ausführen – sie stellen rpg_arena_queue, rpg_arena_srv_load und
-- rpg_arena_looks in ihrer Fassung ohne Rechner-Gegner wieder her. Die Edge Function kommt mit beiden Fassungen zurecht.
-- =====================================================================
begin;
do $$
declare f record; v_alt text; v_neu text;
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'rpg_arena_fights' and column_name = 'bot') then
    update public.rpg_arena_matches m set status = 'abgebrochen', ended_at = now()
      where m.status in ('bereit', 'laeuft') and m.guest_id is null and exists (select 1 from public.rpg_arena_fights k where k.match_id = m.id and k.bot is not null);
  end if;
  for f in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'rpg_arena_belohnen' loop
    v_alt := pg_get_functiondef(f.oid);
    v_neu := replace(v_alt, E'  if p_user is null then return; end if; -- kein Konto (Rechner-Gegner): nichts zu buchen\n', '');
    if v_neu <> v_alt then execute v_neu; end if;
  end loop;
  for f in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'rpg_arena_json' loop
    v_alt := pg_get_functiondef(f.oid);
    v_neu := replace(v_alt, 'p_m.host_id = p_user or p_m.guest_id is not null or p_m.guest_team is not null then', 'p_m.host_id = p_user or p_m.guest_id is not null then');
    v_neu := replace(v_neu, 'case when p_m.guest_id is null and p_m.guest_team is null then null else', 'case when p_m.guest_id is null then null else');
    if v_neu <> v_alt then execute v_neu; end if;
  end loop;
end $$;
drop function if exists public.rpg_arena_bot(uuid, text);
alter table if exists public.rpg_arena_search_srv drop column if exists seit;
alter table if exists public.rpg_arena_fights drop column if exists bot;
commit;
