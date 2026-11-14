-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 007: Heldenstufen und Erfahrung (XP)
-- Setzt Migration 001–006 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG. Legt ausschließlich neue Objekte mit dem Präfix rpg_ an.
-- Bestehende Tabellen, Funktionen und Daten werden nicht verändert.
--
-- Was diese Migration einführt (KONZEPT-HELDENLEVEL.md, „Stand der Umsetzung“):
--   • Jeder Held eines Kontos sammelt Erfahrung (XP) und steigt von Stufe 1 bis 10 auf.
--   • XP gibt es nur für den erfolgreichen Abschluss einer Kampagne, bei jedem Abschluss,
--     für jeden Helden der Gruppe, der einem Konto gehört:
--       – der eigene Held eines Mitspielers geht an dessen Konto,
--       – Helden, die der Tisch steuert (und alle Helden im Solo-Mode), gehen an den Gastgeber,
--       – Helden von Gästen ohne Konto bekommen nichts.
--   • Grundwert aus der Kampagne (Schwierigkeit; Kurzabenteuer die Hälfte). Ein Held auf der
--     empfohlenen Stufe bekommt den Grundwert, darunter mehr, darüber weniger.
--   • Gerechnet wird auf dem Server. Je Konto, Held und Kampagne genau eine Buchung.
--   • Jeder sieht nur den eigenen Fortschritt; der Spieltisch einer Kampagne sieht die Stufen der Gruppe.
--
-- Die Zahlen stehen auch in abenteuer/js/figuren.js (SCHWIERIGKEIT, XP_FAKTOR, XP_BIS) – bei Änderungen beide anpassen.
--
-- Rückbau: 007_rpg_heldenlevel_rueckbau.sql
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) Stammdaten: Grundwert und empfohlene Stufe je Kampagne
-- ---------------------------------------------------------------------
create table if not exists public.rpg_adventure_xp (
  adventure      text     primary key check (adventure ~ '^[a-z0-9-]{2,40}$'),
  schwierigkeit  smallint not null check (schwierigkeit between 1 and 5),
  stufe          smallint not null check (stufe between 1 and 10),   -- empfohlene Heldenstufe
  xp             integer  not null check (xp between 0 and 5000)      -- Grundwert je Abschluss
);
insert into public.rpg_adventure_xp (adventure, schwierigkeit, stufe, xp) values
  ('weidenhain', 1, 1, 50),    -- Kurzabenteuer: halber Grundwert
  ('rabenmoor',  1, 1, 100),
  ('graufurt',   2, 3, 100),   -- Kurzabenteuer: halber Grundwert
  ('grauwacht',  2, 3, 200),
  ('hochwacht',  3, 4, 300),
  ('krone',      4, 6, 450)
on conflict (adventure) do update set schwierigkeit = excluded.schwierigkeit, stufe = excluded.stufe, xp = excluded.xp;

-- ---------------------------------------------------------------------
-- 2) Daten je Konto
-- ---------------------------------------------------------------------
create table if not exists public.rpg_hero_progress (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  hero_id     text        not null references public.rpg_hero_catalog(hero_id),
  xp          integer     not null default 0 check (xp >= 0),
  updated_at  timestamptz not null default now(),
  primary key (user_id, hero_id)
);

-- Buchungen (nur Anfügen). Je Konto, Held und Kampagne genau eine: Neuladen bringt nichts doppelt.
create table if not exists public.rpg_xp_ledger (
  id            bigint      generated always as identity primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  hero_id       text        not null,
  campaign_id   uuid        not null,   -- ohne Fremdschlüssel: gelöschte Kampagnen nehmen nichts weg
  adventure     text        not null,
  xp            integer     not null check (xp >= 0),
  stufe_vorher  smallint    not null,
  stufe_danach  smallint    not null,
  created_at    timestamptz not null default now(),
  unique (user_id, hero_id, campaign_id)
);

alter table public.rpg_adventure_xp  enable row level security;
alter table public.rpg_hero_progress enable row level security;
alter table public.rpg_xp_ledger     enable row level security;
revoke all on public.rpg_adventure_xp, public.rpg_hero_progress, public.rpg_xp_ledger from anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) Rechenregeln
-- ---------------------------------------------------------------------
-- Gesamte XP → Stufe 1–10. Bis zur nächsten Stufe: 100, 150, 250, 350, 500, 700, 900, 1200, 1500.
create or replace function public.rpg_xp_stufe(p_xp integer)
returns integer language plpgsql immutable set search_path = public as $$
declare v_bis integer[] := array[100, 150, 250, 350, 500, 700, 900, 1200, 1500]; v_rest integer := greatest(coalesce(p_xp, 0), 0); v_s integer := 1;
begin
  while v_s < 10 and v_rest >= v_bis[v_s] loop v_rest := v_rest - v_bis[v_s]; v_s := v_s + 1; end loop;
  return v_s;
end;
$$;

-- XP für einen Abschluss: Grundwert × Faktor nach Abstand der Heldenstufe zur empfohlenen Stufe. Stufe 10 sammelt nichts mehr.
create or replace function public.rpg_xp_fuer(p_grundwert integer, p_empfohlen integer, p_stufe integer)
returns integer language sql immutable set search_path = public as $$
  select case when p_stufe >= 10 then 0 else round(p_grundwert * (case greatest(-3, least(4, p_stufe - p_empfohlen))
    when -3 then 2.0 when -2 then 1.6 when -1 then 1.3 when 0 then 1.0 when 1 then 0.7 when 2 then 0.45 when 3 then 0.25 else 0.1 end))::integer end;
$$;

-- ---------------------------------------------------------------------
-- 4) Lesen
-- ---------------------------------------------------------------------
-- Eigener Fortschritt: { konto, xp: { held: gesamte XP } }
create or replace function public.rpg_hero_levels()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false); end if;
  return jsonb_build_object('konto', true,
    'xp', coalesce((select jsonb_object_agg(hero_id, xp) from public.rpg_hero_progress where user_id = v_uid), '{}'::jsonb));
end;
$$;

-- Für den Spieltisch einer Kampagne: Fortschritt des Gastgebers (für Tisch-Helden) und der Mitspieler mit Konto (nur ihr gewählter Held).
-- { host: { held: xp } | null, spieler: { held: xp } }
create or replace function public.rpg_campaign_levels(p_campaign_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_host uuid;
begin
  if not public.rpg_ist_tisch(p_campaign_id) then raise exception 'Nur der Spieltisch dieser Kampagne darf das abfragen.'; end if;
  select user_id into v_host from public.rpg_campaign_members where campaign_id = p_campaign_id and role = 'host' and member_status = 'aktiv' limit 1;
  return jsonb_build_object(
    'host', case when v_host is not null and public.rpg_ist_konto(v_host)
      then coalesce((select jsonb_object_agg(hero_id, xp) from public.rpg_hero_progress where user_id = v_host), '{}'::jsonb) else null end,
    'spieler', coalesce((select jsonb_object_agg(m.character_id, coalesce(pr.xp, 0))
      from public.rpg_campaign_members m
      left join public.rpg_hero_progress pr on pr.user_id = m.user_id and pr.hero_id = m.character_id
      where m.campaign_id = p_campaign_id and m.member_status = 'aktiv' and m.character_id is not null and public.rpg_ist_konto(m.user_id)
        and exists (select 1 from public.rpg_profiles p where p.user_id = m.user_id)), '{}'::jsonb));
end;
$$;

-- ---------------------------------------------------------------------
-- 5) Vergabe nach dem Abschluss einer Kampagne
-- ---------------------------------------------------------------------
-- Jedes Konto ruft das für sich selbst auf (wie rpg_claim_ending). Gleiche Prüfungen: abgeschlossen, gültiges Ende,
-- genug Spielstände, Mindestdauer. Zurück: { konto, abenteuer, helden: [{ held, xp, vorher, stufe, gesamt, neu }] }
create or replace function public.rpg_award_xp(p_campaign_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_c public.rpg_campaigns%rowtype; v_state jsonb; v_ab text; v_ende text;
  v_rolle text; v_eigen text; v_ax public.rpg_adventure_xp%rowtype; v_gruppe text[]; v_helden text[] := '{}';
  v_h text; v_alt integer; v_vor integer; v_xp integer; v_n integer; v_liste jsonb := '[]'::jsonb; v_b public.rpg_xp_ledger%rowtype;
begin
  if not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false); end if;
  select * into v_c from public.rpg_campaigns where id = p_campaign_id;
  if not found then raise exception 'Diese Kampagne gibt es nicht.'; end if;
  select m.role, m.character_id into v_rolle, v_eigen from public.rpg_campaign_members m
    where m.campaign_id = p_campaign_id and m.user_id = v_uid and m.member_status = 'aktiv';
  if not found or not (v_rolle = 'host' or v_eigen is not null) then raise exception 'Du hast in dieser Kampagne keinen Helden gespielt.'; end if;
  if v_c.status <> 'abgeschlossen' then raise exception 'Diese Kampagne ist noch nicht abgeschlossen.'; end if;
  if v_c.current_version < 8 or v_c.completed_at is null or v_c.completed_at - v_c.created_at < interval '15 minutes' then
    raise exception 'Dieser Abschluss kann nicht gewertet werden.';
  end if;
  select state into v_state from public.rpg_state_snapshots where campaign_id = p_campaign_id and version = v_c.current_version;
  v_ab := coalesce(v_state #>> '{abenteuer,abenteuer}', 'grauwacht'); v_ende := v_state #>> '{abenteuer,szene}';
  if v_ab <> v_c.adventure_slug or not exists (select 1 from public.rpg_adventure_endings where adventure = v_ab and ending = v_ende) then
    raise exception 'Dieser Abschluss kann nicht gewertet werden.';
  end if;
  select * into v_ax from public.rpg_adventure_xp where adventure = v_ab;
  if not found then return jsonb_build_object('konto', true, 'abenteuer', v_ab, 'helden', '[]'::jsonb); end if;
  -- Die Gruppe am Ende der Kampagne (höchstens sechs Helden, nur bekannte)
  if jsonb_typeof(v_state #> '{abenteuer,gruppe}') = 'array' then
    select coalesce(array_agg(distinct g), '{}') into v_gruppe from jsonb_array_elements_text(v_state #> '{abenteuer,gruppe}') g
      where exists (select 1 from public.rpg_hero_catalog k where k.hero_id = g);
  end if;
  if v_gruppe is null or cardinality(v_gruppe) = 0 or cardinality(v_gruppe) > 6 then
    return jsonb_build_object('konto', true, 'abenteuer', v_ab, 'helden', '[]'::jsonb);
  end if;
  -- Wem gehört welcher Held? Der eigene; als Gastgeber zusätzlich alle, die kein anderes Mitglied auf dem Handy gespielt hat.
  if v_eigen is not null and v_eigen = any(v_gruppe) then v_helden := array[v_eigen]; end if;
  if v_rolle = 'host' then
    select v_helden || coalesce(array_agg(g), '{}') into v_helden from unnest(v_gruppe) g
      where g <> coalesce(v_eigen, '') and not exists (select 1 from public.rpg_campaign_members m
        where m.campaign_id = p_campaign_id and m.member_status = 'aktiv' and m.user_id <> v_uid and m.character_id = g);
  end if;
  perform pg_advisory_xact_lock(hashtext('rpg_xp:' || v_uid::text));
  foreach v_h in array v_helden loop
    -- nur Helden aus der eigenen Sammlung
    if not exists (select 1 from public.rpg_hero_collection where user_id = v_uid and hero_id = v_h) then continue; end if;
    select coalesce((select xp from public.rpg_hero_progress where user_id = v_uid and hero_id = v_h), 0) into v_alt;
    v_vor := public.rpg_xp_stufe(v_alt);
    v_xp := public.rpg_xp_fuer(v_ax.xp, v_ax.stufe, v_vor);
    insert into public.rpg_xp_ledger (user_id, hero_id, campaign_id, adventure, xp, stufe_vorher, stufe_danach)
      values (v_uid, v_h, p_campaign_id, v_ab, v_xp, v_vor, public.rpg_xp_stufe(v_alt + v_xp))
      on conflict (user_id, hero_id, campaign_id) do nothing;
    get diagnostics v_n = row_count;
    if v_n > 0 then
      insert into public.rpg_hero_progress (user_id, hero_id, xp) values (v_uid, v_h, v_xp)
        on conflict (user_id, hero_id) do update set xp = public.rpg_hero_progress.xp + excluded.xp, updated_at = now();
    end if;
    select * into v_b from public.rpg_xp_ledger where user_id = v_uid and hero_id = v_h and campaign_id = p_campaign_id;
    v_liste := v_liste || jsonb_build_object('held', v_h, 'xp', v_b.xp, 'vorher', v_b.stufe_vorher, 'stufe', v_b.stufe_danach, 'neu', v_n > 0,
      'gesamt', (select xp from public.rpg_hero_progress where user_id = v_uid and hero_id = v_h));
  end loop;
  return jsonb_build_object('konto', true, 'abenteuer', v_ab, 'helden', v_liste);
end;
$$;

-- ---------------------------------------------------------------------
-- 6) Ausführungsrechte
-- ---------------------------------------------------------------------
revoke all on function public.rpg_xp_stufe(integer), public.rpg_xp_fuer(integer, integer, integer) from public, anon, authenticated;
revoke all on function public.rpg_hero_levels(), public.rpg_campaign_levels(uuid), public.rpg_award_xp(uuid) from public, anon;
grant execute on function public.rpg_hero_levels(), public.rpg_campaign_levels(uuid), public.rpg_award_xp(uuid) to authenticated;

commit;
