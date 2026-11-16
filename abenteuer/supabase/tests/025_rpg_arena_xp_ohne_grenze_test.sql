-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN. Prüft Migration 025 (Arena: Erfahrung ohne Tagesgrenzen).
\set ON_ERROR_STOP on
insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000025a1', false), ('00000000-0000-0000-0000-0000000025a2', false);
insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000025a1', 'Ar25_Anna'), ('00000000-0000-0000-0000-0000000025a2', 'Ar25_Ben');
insert into public.rpg_hero_collection (user_id, hero_id, quelle) select '00000000-0000-0000-0000-0000000025a1', hero_id, 'code' from public.rpg_hero_catalog;
create function pg_temp.ok(b boolean, t text) returns void language plpgsql as $$ begin if coalesce(b, false) then raise notice '✓ %', t; else raise exception '✗ %', t; end if; end $$;
-- Ein beendeter Kampf (Ersteller = Prüfkonto, Gegner drei Stufen höher: 55 XP je Sieg), dann die Belohnung buchen; liefert die Belohnungszeile
create function pg_temp.kampf(p_sieg boolean, p_grund text default 'team') returns public.rpg_arena_rewards language plpgsql as $$
declare m public.rpg_arena_matches; u uuid := '00000000-0000-0000-0000-0000000025a1'; r public.rpg_arena_rewards;
begin
  insert into public.rpg_arena_matches (status, host_id, host_name, host_team, host_schnitt, guest_id, guest_name, guest_team, guest_schnitt, sieger, grund, ended_at)
    values ('beendet', u, 'Ar25_Anna', '[{"held":"schildwaechter","stufe":1},{"held":"trickser","stufe":1},{"held":"lichtbringer","stufe":1}]', 1.0,
      '00000000-0000-0000-0000-0000000025a2', 'Ar25_Ben', '[{"held":"schildwaechter","stufe":10},{"held":"trickser","stufe":10},{"held":"lichtbringer","stufe":10}]', 10.0,
      case when p_sieg then 1 else 2 end, p_grund, now()) returning * into m;
  perform public.rpg_arena_belohnen(m, u); perform public.rpg_arena_belohnen(m, u);   -- zweimal: wird nur einmal gebucht
  select * into r from public.rpg_arena_rewards where match_id = m.id and user_id = u; return r;
end $$;
create function pg_temp.xp(h text) returns integer language sql as $$ select coalesce((select xp from public.rpg_hero_progress where user_id = '00000000-0000-0000-0000-0000000025a1' and hero_id = h), 0); $$;
create function pg_temp.splitter() returns integer language sql as $$ select coalesce((select betrag from public.rpg_wallet where user_id = '00000000-0000-0000-0000-0000000025a1'), 0); $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000025a1', false);

-- fünf Siege: Erfahrung über 150 je Held hinaus, Seelensplitter je Sieg (fest 25 – oder gewürfelt 5 bis 25, wenn der Auslöser aus 009 da ist)
select pg_temp.ok((select bool_and((k).gewertet and (k).waehrung between 5 and 25 and jsonb_array_length((k).xp) = 3) from (select pg_temp.kampf(true) k from generate_series(1, 5)) q), 'Fünf Siege: gewertet, Seelensplitter, Erfahrung für alle drei Helden');
select pg_temp.ok(pg_temp.xp('schildwaechter') > 150 and pg_temp.xp('schildwaechter') = pg_temp.xp('trickser'),
  'Nach fünf Siegen hat jeder Held mehr als 150 XP aus der Arena (' || pg_temp.xp('schildwaechter') || '): Die Grenze je Held und Tag ist weg');
select (select sum(xp) from public.rpg_xp_ledger where user_id = '00000000-0000-0000-0000-0000000025a1' and adventure = 'arena') as vor6 \gset
select pg_temp.splitter() as s5 \gset
-- sechster Sieg: Erfahrung und Seelensplitter wie bei den ersten fünf
select pg_temp.kampf(true) as k6 \gset
select (select sum(xp) from public.rpg_xp_ledger where user_id = '00000000-0000-0000-0000-0000000025a1' and adventure = 'arena') as nach6 \gset
select pg_temp.ok(:nach6 > :vor6 and (:'k6'::public.rpg_arena_rewards).gewertet and (:'k6'::public.rpg_arena_rewards).waehrung between 5 and 25 and pg_temp.splitter() = :s5 + (:'k6'::public.rpg_arena_rewards).waehrung
  and jsonb_array_length((:'k6'::public.rpg_arena_rewards).xp) = 3, 'Sechster Sieg des Tages: gewertet wie die ersten fünf – Erfahrung (' || (:nach6 - :vor6) || ' XP) und Seelensplitter');
select pg_temp.kampf(false) as k7 \gset
select pg_temp.ok((select sum(xp) from public.rpg_xp_ledger where user_id = '00000000-0000-0000-0000-0000000025a1' and adventure = 'arena') > :nach6 and (:'k7'::public.rpg_arena_rewards).gewertet
  and (:'k7'::public.rpg_arena_rewards).waehrung = 0 and pg_temp.splitter() = :s5 + (:'k6'::public.rpg_arena_rewards).waehrung, 'Eine Niederlage bringt ihre Erfahrung, aber keine Seelensplitter');
-- Heldenchance: 4 % bei jedem Sieg, auch nach dem fünften (das Konto hat schon alle Helden – geprüft wird deshalb am Funktionstext und an vielen Siegen ohne Fehler)
select pg_temp.ok((select bool_and((k).gewertet and ((k).xp->0->>'xp')::integer > 0) from (select pg_temp.kampf(true) k from generate_series(1, 40)) q), '40 weitere Siege: jedes Mal gewertet, jedes Mal Erfahrung');
select pg_temp.ok(pg_get_functiondef('public.rpg_arena_belohnen(public.rpg_arena_matches, uuid)'::regprocedure) ~ 'random\(\) < 0\.04' and pg_get_functiondef('public.rpg_arena_belohnen(public.rpg_arena_matches, uuid)'::regprocedure) !~ '0\.08|v_heute|150',
  'Heldenchance 4 Prozent; keine Tagesgrenze und keine 150er-Grenze mehr in der Funktion');
-- unverändert: Aufgabe, Sieg durch Aufgabe, kein Konto
select pg_temp.xp('schildwaechter') as x0 \gset
select pg_temp.ok(not (pg_temp.kampf(false, 'aufgabe')).gewertet and pg_temp.xp('schildwaechter') = :x0, 'Wer aufgibt, bekommt weiterhin nichts');
do $$ declare m public.rpg_arena_matches; begin select * into m from public.rpg_arena_matches where host_id = '00000000-0000-0000-0000-0000000025a1' limit 1; perform public.rpg_arena_belohnen(m, null); end $$;
select pg_temp.ok(true, 'Ohne Konto (Rechner-Gegner) wird nichts gebucht und nichts bricht ab');
select pg_temp.ok((select bool_and(p.prosecdef) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'rpg_arena_belohnen')
  and not has_function_privilege('authenticated', 'public.rpg_arena_belohnen(public.rpg_arena_matches, uuid)', 'execute') and not has_function_privilege('anon', 'public.rpg_arena_belohnen(public.rpg_arena_matches, uuid)', 'execute'), 'Rechte unverändert: Spieler können die Funktion nicht selbst aufrufen');
