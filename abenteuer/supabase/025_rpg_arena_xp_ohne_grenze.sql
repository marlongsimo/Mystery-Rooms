-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 025: Arena – Belohnungen ohne Tagesgrenze
-- =====================================================================
-- Voraussetzung: Migrationen 008, 013 und 019 sind eingespielt.
--
-- Was diese Migration ändert (nur die Funktion rpg_arena_belohnen, die nach jedem Arena-Kampf die Belohnung bucht):
--   • In der Arena gibt es keine Tagesgrenze mehr – weder für Erfahrung noch für Seelensplitter noch für die Heldenchance:
--       – Bisher brachten Kämpfe nach fünf Siegen am Tag keine Erfahrung und keine Heldenchance mehr. Das entfällt.
--       – Bisher gab es je Held höchstens 150 XP am Tag aus der Arena. Das entfällt.
--       – Seelensplitter gab es schon bisher für jeden Sieg (gewürfelt, 5 bis 25 – das macht weiter der Auslöser
--         rpg_arena_waehrung_wuerfeln aus Migration 009; er wird nicht angefasst).
--   • Die Heldenchance nach einem Sieg sinkt dafür von 8 % auf 4 % – bei jedem Sieg, den ganzen Tag.
--   • Unverändert bleibt: Wer aufgibt, bekommt nichts. Ein Sieg durch Aufgabe des Gegners bringt keine Heldenchance.
--     Die Höhe der Erfahrung je Kampf (rpg_arena_xp). Rechner-Gegner bekommen nichts. Jeder Kampf wird einmal gebucht.
--   • Keine Tabelle und keine andere Funktion wird angefasst. Die Rechte der Funktion bleiben, wie sie sind.
--   (Eine frühere Fassung dieser Datei ließ Seelensplitter und Heldenchance noch begrenzt; diese Fassung ersetzt sie.)
--
-- NUR FÜR DAS RPG. Rückbau: 025_rpg_arena_xp_ohne_grenze_rueckbau.sql (stellt die bisherige Fassung wieder her)
-- Unverändert in den Supabase SQL Editor einfügen und ausführen. Mehrfaches Ausführen ist unschädlich.
-- =====================================================================
begin;

do $$ begin
  if to_regprocedure('public.rpg_arena_belohnen(public.rpg_arena_matches, uuid)') is null or to_regprocedure('public.rpg_arena_xp(integer, integer, boolean)') is null
     or to_regclass('public.rpg_arena_rewards') is null then
    raise exception 'Migration 008 (Arena) fehlt. Bitte zuerst die früheren Migrationen einspielen.';
  end if;
end $$;

create or replace function public.rpg_arena_belohnen(p_m public.rpg_arena_matches, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_seite integer := case when p_m.host_id = p_user then 1 else 2 end; v_sieg boolean := p_m.sieger = v_seite;
  v_team jsonb := case when v_seite = 1 then p_m.host_team else p_m.guest_team end;
  v_stufe integer := round(greatest(p_m.host_schnitt, p_m.guest_schnitt))::integer;
  v_e jsonb; v_h text; v_alt integer; v_vor integer; v_xp integer; v_liste jsonb := '[]'::jsonb;
  v_waehrung integer := 0; v_offer uuid; v_helden text[];
begin
  if p_user is null then return; end if; -- kein Konto (Rechner-Gegner): nichts zu buchen
  if exists (select 1 from public.rpg_arena_rewards where match_id = p_m.id and user_id = p_user) then return; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_xp:' || p_user::text));
  -- Wer aufgibt, bekommt nichts
  if p_m.grund = 'aufgabe' and not v_sieg then
    insert into public.rpg_arena_rewards (match_id, user_id, sieg, gewertet) values (p_m.id, p_user, false, false) on conflict do nothing; return;
  end if;
  for v_e in select * from jsonb_array_elements(v_team) loop
    v_h := v_e->>'held';
    if not exists (select 1 from public.rpg_hero_collection where user_id = p_user and hero_id = v_h) then continue; end if;
    select coalesce((select xp from public.rpg_hero_progress where user_id = p_user and hero_id = v_h), 0) into v_alt;
    v_vor := public.rpg_xp_stufe(v_alt);
    v_xp := public.rpg_arena_xp(v_stufe, v_vor, v_sieg);
    insert into public.rpg_xp_ledger (user_id, hero_id, campaign_id, adventure, xp, stufe_vorher, stufe_danach)
      values (p_user, v_h, p_m.id, 'arena', v_xp, v_vor, public.rpg_xp_stufe(v_alt + v_xp)) on conflict (user_id, hero_id, campaign_id) do nothing;
    if found and v_xp > 0 then
      insert into public.rpg_hero_progress (user_id, hero_id, xp) values (p_user, v_h, v_xp)
        on conflict (user_id, hero_id) do update set xp = public.rpg_hero_progress.xp + excluded.xp, updated_at = now();
    end if;
    v_liste := v_liste || jsonb_build_object('held', v_h, 'xp', v_xp, 'vorher', v_vor, 'stufe', public.rpg_xp_stufe(v_alt + v_xp), 'gesamt', v_alt + v_xp, 'neu', true);
  end loop;
  if v_sieg then
    v_waehrung := 25;
    insert into public.rpg_wallet (user_id, betrag) values (p_user, v_waehrung)
      on conflict (user_id) do update set betrag = public.rpg_wallet.betrag + excluded.betrag, updated_at = now();
    -- 4 % Chance auf eine Heldenwahl (nicht bei einem Sieg durch Aufgabe des Gegners)
    if p_m.grund <> 'aufgabe' and random() < 0.04 then
      v_helden := public.rpg_hero_ziehen(p_user, 3);
      if cardinality(v_helden) > 0 then
        insert into public.rpg_hero_offers (user_id, art, helden, campaign_id, adventure) values (p_user, 'ende', v_helden, p_m.id, 'arena') returning id into v_offer;
      end if;
    end if;
  end if;
  insert into public.rpg_arena_rewards (match_id, user_id, sieg, gewertet, xp, waehrung, offer_id) values (p_m.id, p_user, v_sieg, true, v_liste, v_waehrung, v_offer) on conflict do nothing;
end;
$$;

commit;
