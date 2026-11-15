-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 010: Auswertung der Arena und Händler
-- Setzt Migration 001–009 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG. Legt ausschließlich neue Objekte mit dem Präfix rpg_ an.
-- Bestehende Tabellen, Funktionen und Daten werden nicht verändert.
--
-- Was diese Migration einführt:
--   • Auswertung der Arena für Admins (rpg_arena_stats): Kämpfe je Modus, Siegquote je Held und je Dreier-Team.
--     Gelesen wird aus den vorhandenen Kämpfen (rpg_arena_matches) – es wird nichts zusätzlich gespeichert.
--   • Händler: jeden Tag drei zufällige Helden, die das Konto noch nicht hat, je 830 Seelensplitter
--     (rpg_shop_today, rpg_shop_buy). Die Auswahl wechselt um Mitternacht (Europe/Berlin) und ist je Konto verschieden.
--
-- Rückbau: 010_rpg_arena_auswertung_haendler_rueckbau.sql
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) Auswertung der Arena
-- ---------------------------------------------------------------------
-- Der Modus eines Kampfes ergibt sich aus seiner Zufallszahl – dieselbe Rechnung wie im Spiel (js/arena.js, LOS)
create or replace function public.rpg_arena_modus(p_seed integer)
returns text language sql immutable as $$
  select (array['arena', 'koenig', 'horde', 'duell'])[1 + (abs(coalesce(p_seed, 0)::bigint) % 4)::integer];
$$;

create or replace function public.rpg_arena_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins sehen die Auswertung.'; end if;
  with m as (
    select id, public.rpg_arena_modus(seed) as modus, sieger, grund, runden, host_team, guest_team, karte,
      extract(epoch from (ended_at - started_at)) as dauer
    from public.rpg_arena_matches
    where status = 'beendet' and sieger is not null and guest_team is not null
  ), e as (
    select m.id, m.modus, 1 as seite, m.sieger = 1 as sieg, x->>'held' as held, (x->>'stufe')::integer as stufe from m, jsonb_array_elements(m.host_team) x
    union all
    select m.id, m.modus, 2, m.sieger = 2, x->>'held', (x->>'stufe')::integer from m, jsonb_array_elements(m.guest_team) x
  ), t as (
    select id, seite, bool_or(sieg) as sieg, array_agg(held order by held) as team from e group by id, seite
  )
  select jsonb_build_object(
    'kaempfe', (select count(*) from m),
    'offen', (select count(*) from public.rpg_arena_matches where status in ('offen', 'bereit', 'laeuft')),
    'abgebrochen', (select count(*) from public.rpg_arena_matches where status = 'abgebrochen'),
    'modi', coalesce((select jsonb_agg(z order by z->>'modus') from (
      select jsonb_build_object('modus', modus, 'kaempfe', count(*), 'sieg_ersteller', count(*) filter (where sieger = 1),
        'runden', round(avg(runden)::numeric, 1), 'minuten', round((avg(dauer) / 60)::numeric, 1),
        'team', count(*) filter (where grund = 'team'), 'punkte', count(*) filter (where grund = 'punkte'), 'aufgabe', count(*) filter (where grund = 'aufgabe')) as z
      from m group by modus) q), '[]'::jsonb),
    'helden', coalesce((select jsonb_agg(z order by (z->>'kaempfe')::integer desc, z->>'held') from (
      select jsonb_build_object('held', held, 'kaempfe', count(*), 'siege', count(*) filter (where sieg), 'stufe', round(avg(stufe)::numeric, 1),
        'modi', (select jsonb_object_agg(modus, jsonb_build_array(n, s)) from (select modus, count(*) n, count(*) filter (where sieg) s from e e2 where e2.held = e.held group by modus) mm)) as z
      from e group by held) q), '[]'::jsonb),
    'teams', coalesce((select jsonb_agg(z) from (
      select jsonb_build_object('team', to_jsonb(team), 'kaempfe', count(*), 'siege', count(*) filter (where sieg)) as z
      from t group by team order by count(*) desc, team limit 40) q), '[]'::jsonb),
    'karten', coalesce((select jsonb_object_agg(coalesce(karte, '?'), n) from (select karte, count(*) n from m group by karte) q), '{}'::jsonb)
  ) into v;
  return v;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) Händler: drei Helden am Tag
-- ---------------------------------------------------------------------
create table if not exists public.rpg_shop_daily (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  tag         date        not null,
  helden      text[]      not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, tag)
);
create table if not exists public.rpg_shop_purchases (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  hero_id     text        not null,
  preis       integer     not null,
  created_at  timestamptz not null default now()
);
create index if not exists rpg_shop_purchases_user on public.rpg_shop_purchases (user_id, created_at desc);
alter table public.rpg_shop_daily enable row level security;
alter table public.rpg_shop_purchases enable row level security;
revoke all on public.rpg_shop_daily, public.rpg_shop_purchases from anon, authenticated;

create or replace function public.rpg_shop_preis() returns integer language sql immutable as $$ select 830; $$;

-- Auswahl des Tages: beim ersten Aufruf am Tag gezogen (Helden, die das Konto noch nicht hat), danach fest bis Mitternacht
create or replace function public.rpg_shop_today()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_tag date := (now() at time zone 'Europe/Berlin')::date; v_helden text[];
begin
  if not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false); end if;
  select helden into v_helden from public.rpg_shop_daily where user_id = v_uid and tag = v_tag;
  if not found then
    v_helden := public.rpg_hero_ziehen(v_uid, 3);
    insert into public.rpg_shop_daily (user_id, tag, helden) values (v_uid, v_tag, v_helden) on conflict (user_id, tag) do nothing;
    select helden into v_helden from public.rpg_shop_daily where user_id = v_uid and tag = v_tag;
  end if;
  return jsonb_build_object('konto', true, 'preis', public.rpg_shop_preis(),
    'waehrung', coalesce((select betrag from public.rpg_wallet where user_id = v_uid), 0),
    'bis', ((v_tag + 1)::timestamp at time zone 'Europe/Berlin'),
    'alle', not exists (select 1 from public.rpg_hero_catalog c where not exists (select 1 from public.rpg_hero_collection k where k.user_id = v_uid and k.hero_id = c.hero_id)),
    'helden', coalesce((select jsonb_agg(jsonb_build_object('held', h, 'gekauft', exists (select 1 from public.rpg_hero_collection where user_id = v_uid and hero_id = h)) order by ord)
      from unnest(v_helden) with ordinality as u(h, ord)), '[]'::jsonb));
end;
$$;

-- Kaufen: nur ein Held aus der heutigen Auswahl, nur mit genug Seelensplittern, jeder Held nur einmal
create or replace function public.rpg_shop_buy(p_held text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_tag date := (now() at time zone 'Europe/Berlin')::date; v_preis integer := public.rpg_shop_preis();
begin
  if not public.rpg_sammlung_konto() then raise exception 'Der Händler handelt nur mit Spielerkonten.'; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_shop:' || v_uid::text));
  if not exists (select 1 from public.rpg_shop_daily where user_id = v_uid and tag = v_tag and p_held = any (helden)) then
    raise exception 'Diesen Helden bietet der Händler heute nicht an.';
  end if;
  if exists (select 1 from public.rpg_hero_collection where user_id = v_uid and hero_id = p_held) then raise exception 'Diesen Helden hast du schon.'; end if;
  update public.rpg_wallet set betrag = betrag - v_preis, updated_at = now() where user_id = v_uid and betrag >= v_preis;
  if not found then raise exception 'Dafür reichen deine Seelensplitter nicht.'; end if;
  insert into public.rpg_hero_collection (user_id, hero_id, quelle) values (v_uid, p_held, 'code');
  insert into public.rpg_shop_purchases (user_id, hero_id, preis) values (v_uid, p_held, v_preis);
  return public.rpg_shop_today();
end;
$$;

revoke all on function public.rpg_arena_modus(integer), public.rpg_arena_stats(), public.rpg_shop_preis(), public.rpg_shop_today(), public.rpg_shop_buy(text) from public, anon;
grant execute on function public.rpg_arena_stats(), public.rpg_shop_today(), public.rpg_shop_buy(text) to authenticated;

commit;
