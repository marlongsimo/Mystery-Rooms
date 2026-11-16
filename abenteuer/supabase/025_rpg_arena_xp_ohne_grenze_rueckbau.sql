-- =====================================================================
-- MYSTERY ROOMS · RPG · Rückbau von Migration 025 (Arena: Erfahrung ohne Tagesgrenzen)
-- Stellt die bisherige Fassung von rpg_arena_belohnen wieder her: keine Erfahrung mehr nach fünf Siegen am Tag,
-- höchstens 150 XP je Held und Tag, Heldenchance 8 % bis zum fünften Sieg. Schon Gebuchtes bleibt.
-- =====================================================================
begin;
create or replace function public.rpg_arena_belohnen(p_m public.rpg_arena_matches, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_seite integer := case when p_m.host_id = p_user then 1 else 2 end; v_sieg boolean := p_m.sieger = v_seite;
  v_team jsonb := case when v_seite = 1 then p_m.host_team else p_m.guest_team end;
  v_stufe integer := round(greatest(p_m.host_schnitt, p_m.guest_schnitt))::integer;
  v_tag timestamptz := date_trunc('day', now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin';
  v_heute integer; v_e jsonb; v_h text; v_alt integer; v_vor integer; v_xp integer; v_schon integer; v_liste jsonb := '[]'::jsonb;
  v_waehrung integer := 0; v_offer uuid; v_helden text[];
begin
  if p_user is null then return; end if; -- kein Konto (Rechner-Gegner): nichts zu buchen
  if exists (select 1 from public.rpg_arena_rewards where match_id = p_m.id and user_id = p_user) then return; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_xp:' || p_user::text));
  -- Wer aufgibt, bekommt nichts
  if p_m.grund = 'aufgabe' and not v_sieg then
    insert into public.rpg_arena_rewards (match_id, user_id, sieg, gewertet) values (p_m.id, p_user, false, false) on conflict do nothing; return;
  end if;
  select count(*) into v_heute from public.rpg_arena_rewards where user_id = p_user and gewertet and sieg and created_at >= v_tag;
  if v_heute >= 5 then
    insert into public.rpg_arena_rewards (match_id, user_id, sieg, gewertet) values (p_m.id, p_user, v_sieg, false) on conflict do nothing; return;
  end if;
  for v_e in select * from jsonb_array_elements(v_team) loop
    v_h := v_e->>'held';
    if not exists (select 1 from public.rpg_hero_collection where user_id = p_user and hero_id = v_h) then continue; end if;
    select coalesce((select xp from public.rpg_hero_progress where user_id = p_user and hero_id = v_h), 0) into v_alt;
    v_vor := public.rpg_xp_stufe(v_alt);
    v_xp := public.rpg_arena_xp(v_stufe, v_vor, v_sieg);
    -- höchstens 150 XP je Held und Tag aus der Arena
    select coalesce(sum(xp), 0) into v_schon from public.rpg_xp_ledger where user_id = p_user and hero_id = v_h and adventure = 'arena' and created_at >= v_tag;
    v_xp := greatest(0, least(v_xp, 150 - v_schon));
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
    -- 8 % Chance auf eine Heldenwahl (nicht bei einem Sieg durch Aufgabe des Gegners)
    if p_m.grund <> 'aufgabe' and random() < 0.08 then
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
