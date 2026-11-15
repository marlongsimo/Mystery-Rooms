-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 013 (Tagesgrenze zählt wieder alle gewerteten Kämpfe)
-- Nimmt nur die Ergänzung aus rpg_arena_belohnen und rpg_arena_list wieder heraus; alles andere bleibt.
-- =====================================================================
do $$
declare f record; v_alt text; v_neu text;
begin
  for f in select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('rpg_arena_belohnen', 'rpg_arena_list') loop
    v_alt := pg_get_functiondef(f.oid);
    v_neu := regexp_replace(v_alt, '(rpg_arena_rewards\s+where\s+user_id\s*=\s*[a-z_.]+\s+and\s+gewertet) and sieg(\s+and\s+created_at)', '\1\2', 'gi');
    v_neu := regexp_replace(v_neu, '''nur_siege'', true, ', '', 'g');
    if v_neu = v_alt then raise notice '%: unverändert', f.proname; else execute v_neu; raise notice '%: zählt wieder alle gewerteten Kämpfe', f.proname; end if;
  end loop;
end $$;
