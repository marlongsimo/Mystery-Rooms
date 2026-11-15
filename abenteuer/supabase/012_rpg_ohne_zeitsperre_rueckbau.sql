-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 012 (15-Minuten-Sperre wieder einsetzen)
-- Setzt die Zeitbedingung in rpg_claim_ending und rpg_award_xp wieder ein; alles andere an den Funktionen bleibt.
-- =====================================================================
do $$
declare f record; v_alt text; v_neu text;
begin
  for f in select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('rpg_claim_ending', 'rpg_award_xp') loop
    v_alt := pg_get_functiondef(f.oid);
    if v_alt ~* '15 minutes' then raise notice '%: Bedingung ist vorhanden (unverändert)', f.proname; continue; end if;
    v_neu := regexp_replace(v_alt, '(v_c\.completed_at is null)(\s+then)', '\1 or v_c.completed_at - v_c.created_at < interval ''15 minutes''\2', 'i');
    if v_neu = v_alt then raise notice '%: Stelle nicht gefunden (unverändert)', f.proname; else execute v_neu; raise notice '%: Bedingung wieder eingesetzt', f.proname; end if;
  end loop;
end $$;
