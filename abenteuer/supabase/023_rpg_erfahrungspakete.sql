-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 023: Erfahrungspakete beim Händler
-- Setzt Migration 006 (Heldensammlung), 007 (Heldenstufen) und 008 (Seelensplitter) voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent). Bitte UNVERÄNDERT ausführen.
--
-- NUR FÜR DAS RPG. Rein additiv: drei neue Tabellen, drei neue Funktionen; nichts Vorhandenes wird geändert.
--
-- Was diese Migration bringt:
--   • Drei Erfahrungspakete (Tabelle rpg_xp_packs – Preise und Grenzen lassen sich dort ändern):
--       klein  50 XP ·  90 Seelensplitter · höchstens 3 am Tag
--       mittel 150 XP · 250 Seelensplitter · höchstens 2 am Tag
--       gross  350 XP · 550 Seelensplitter · höchstens 1 am Tag
--     Die Grenzen gelten je Konto und Tag (Mitternacht deutscher Zeit), nicht je Held.
--     Die Grenzen gelten für den Kauf, nicht für das Einsetzen.
--   • Pakete kauft man beim Händler auf Vorrat (rpg_xp_inventory) – noch ohne Helden. Eingesetzt werden sie an der Heldenkarte.
--   • rpg_xp_shop(): Pakete mit Preis, Tagesgrenze, dem, was heute schon gekauft ist, und dem eigenen Vorrat; dazu der Kontostand.
--   • rpg_xp_buy(Paket, Anzahl): kauft Pakete in den Vorrat. Geprüft: Spielerkonto, Tagesgrenze, Kontostand.
--   • rpg_xp_use(Held, Paket, Anzahl): setzt Pakete aus dem Vorrat für einen eigenen Helden ein. Geprüft: Held in der eigenen
--     Sammlung, noch nicht auf Stufe 10, genug im Vorrat – und nicht mehr Pakete, als der Held bis Stufe 10 braucht.
--     Die Erfahrung aus Paketen zählt nicht zur Arena-Grenze von 150 XP je Held und Tag.
--   (Eine frühere Fassung dieser Migration kaufte direkt für einen Helden; sie wird hier ersetzt. Schon Gekauftes bleibt.)
--
-- Rückbau: 023_rpg_erfahrungspakete_rueckbau.sql
-- =====================================================================
begin;

do $$ begin
  if to_regclass('public.rpg_hero_progress') is null or to_regprocedure('public.rpg_xp_stufe(integer)') is null then raise exception 'Migration 023 braucht Migration 007 (Heldenstufen).'; end if;
  if to_regclass('public.rpg_wallet') is null then raise exception 'Migration 023 braucht Migration 008 (Seelensplitter).'; end if;
  if to_regprocedure('public.rpg_sammlung_konto()') is null then raise exception 'Migration 023 braucht Migration 006 (Heldensammlung).'; end if;
end $$;

create table if not exists public.rpg_xp_packs (
  id        text     primary key check (id ~ '^[a-z]{3,12}$'),
  xp        integer  not null check (xp between 1 and 2000),
  preis     integer  not null check (preis between 1 and 100000),
  pro_tag   integer  not null check (pro_tag between 1 and 50),
  reihe     integer  not null default 0,
  aktiv     boolean  not null default true
);
insert into public.rpg_xp_packs (id, xp, preis, pro_tag, reihe) values ('klein', 50, 90, 3, 1), ('mittel', 150, 250, 2, 2), ('gross', 350, 550, 1, 3)
on conflict (id) do nothing;

create table if not exists public.rpg_xp_purchases (
  id          bigserial    primary key,
  user_id     uuid         not null references auth.users(id) on delete cascade,
  hero_id     text,
  pack_id     text         not null,
  anzahl      integer      not null check (anzahl > 0),
  xp          integer      not null,
  preis       integer      not null,
  created_at  timestamptz  not null default now()
);
create index if not exists rpg_xp_purchases_user on public.rpg_xp_purchases (user_id, created_at desc);
alter table public.rpg_xp_purchases alter column hero_id drop not null;   -- frühere Fassung: Kauf direkt für einen Helden
-- Vorrat je Konto und Paket
create table if not exists public.rpg_xp_inventory (
  user_id     uuid         not null references auth.users(id) on delete cascade,
  pack_id     text         not null,
  anzahl      integer      not null default 0 check (anzahl >= 0),
  updated_at  timestamptz  not null default now(),
  primary key (user_id, pack_id)
);
alter table public.rpg_xp_packs enable row level security;
alter table public.rpg_xp_purchases enable row level security;
alter table public.rpg_xp_inventory enable row level security;
revoke all on public.rpg_xp_packs, public.rpg_xp_purchases, public.rpg_xp_inventory from anon, authenticated;
drop function if exists public.rpg_xp_buy(text, text, integer);   -- frühere Fassung

-- Übersicht: Pakete, heute gekauft, eigener Vorrat, Kontostand
create or replace function public.rpg_xp_shop()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_tag timestamptz := date_trunc('day', now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin';
begin
  if v_uid is null or not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false); end if;
  return jsonb_build_object('konto', true,
    'waehrung', coalesce((select betrag from public.rpg_wallet where user_id = v_uid), 0),
    'bis', v_tag + interval '1 day',
    'pakete', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'xp', p.xp, 'preis', p.preis, 'pro_tag', p.pro_tag,
        'heute', coalesce((select sum(k.anzahl) from public.rpg_xp_purchases k where k.user_id = v_uid and k.pack_id = p.id and k.created_at >= v_tag), 0),
        'besitz', coalesce((select i.anzahl from public.rpg_xp_inventory i where i.user_id = v_uid and i.pack_id = p.id), 0)) order by p.reihe, p.xp)
      from public.rpg_xp_packs p where p.aktiv), '[]'::jsonb));
end;
$$;

-- Kauf in den Vorrat
create or replace function public.rpg_xp_buy(p_pack text, p_anzahl integer default 1)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_p public.rpg_xp_packs%rowtype; v_tag timestamptz := date_trunc('day', now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin';
  v_heute integer; v_stand integer; v_preis integer;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Der Händler handelt nur mit Spielerkonten.'; end if;
  if p_anzahl is null or p_anzahl < 1 or p_anzahl > 50 then raise exception 'Ungültige Anzahl.'; end if;
  select * into v_p from public.rpg_xp_packs where id = p_pack and aktiv;
  if not found then raise exception 'Dieses Paket führt der Händler nicht.'; end if;
  -- alles Weitere nacheinander je Konto (kein doppelter Kauf durch zwei Klicks zugleich)
  perform pg_advisory_xact_lock(hashtext('rpg_xp:' || v_uid::text));
  select coalesce(sum(anzahl), 0) into v_heute from public.rpg_xp_purchases where user_id = v_uid and pack_id = v_p.id and created_at >= v_tag;
  if v_heute + p_anzahl > v_p.pro_tag then
    raise exception 'Von diesem Paket gibt es heute nur noch %.', case when v_p.pro_tag - v_heute <= 0 then 'keines mehr' else (v_p.pro_tag - v_heute)::text end;
  end if;
  v_preis := v_p.preis * p_anzahl;
  select coalesce((select betrag from public.rpg_wallet where user_id = v_uid for update), 0) into v_stand;
  if v_stand < v_preis then raise exception 'Dafür reichen deine Seelensplitter nicht.'; end if;
  update public.rpg_wallet set betrag = betrag - v_preis, updated_at = now() where user_id = v_uid;
  insert into public.rpg_xp_inventory (user_id, pack_id, anzahl) values (v_uid, v_p.id, p_anzahl)
    on conflict (user_id, pack_id) do update set anzahl = public.rpg_xp_inventory.anzahl + excluded.anzahl, updated_at = now();
  insert into public.rpg_xp_purchases (user_id, hero_id, pack_id, anzahl, xp, preis) values (v_uid, null, v_p.id, p_anzahl, v_p.xp * p_anzahl, v_preis);
  return jsonb_build_object('paket', v_p.id, 'anzahl', p_anzahl, 'preis', v_preis, 'waehrung', v_stand - v_preis, 'laden', public.rpg_xp_shop());
end;
$$;

-- Einsetzen: Pakete aus dem Vorrat für einen eigenen Helden
create or replace function public.rpg_xp_use(p_held text, p_pack text, p_anzahl integer default 1)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_p public.rpg_xp_packs%rowtype; v_da integer; v_alt integer; v_xp integer;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Erfahrungspakete gibt es nur mit einem Spielerkonto.'; end if;
  if p_anzahl is null or p_anzahl < 1 or p_anzahl > 50 then raise exception 'Ungültige Anzahl.'; end if;
  select * into v_p from public.rpg_xp_packs where id = p_pack;
  if not found then raise exception 'Dieses Paket gibt es nicht.'; end if;
  if not exists (select 1 from public.rpg_hero_collection where user_id = v_uid and hero_id = p_held) then raise exception 'Dieser Held gehört nicht zu deiner Sammlung.'; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_xp:' || v_uid::text));
  select coalesce((select anzahl from public.rpg_xp_inventory where user_id = v_uid and pack_id = v_p.id for update), 0) into v_da;
  if v_da < p_anzahl then raise exception 'So viele dieser Pakete hast du nicht (im Vorrat: %).', v_da; end if;
  select coalesce((select xp from public.rpg_hero_progress where user_id = v_uid and hero_id = p_held), 0) into v_alt;
  if public.rpg_xp_stufe(v_alt) >= 10 then raise exception 'Dieser Held hat die höchste Stufe schon erreicht.'; end if;
  -- nicht mehr Pakete, als der Held bis Stufe 10 braucht (das letzte darf überstehen)
  if p_anzahl > 1 and public.rpg_xp_stufe(v_alt + v_p.xp * (p_anzahl - 1)) >= 10 then raise exception 'So viele Pakete braucht dieser Held nicht mehr.'; end if;
  v_xp := v_p.xp * p_anzahl;
  update public.rpg_xp_inventory set anzahl = anzahl - p_anzahl, updated_at = now() where user_id = v_uid and pack_id = v_p.id;
  insert into public.rpg_hero_progress (user_id, hero_id, xp) values (v_uid, p_held, v_xp)
    on conflict (user_id, hero_id) do update set xp = public.rpg_hero_progress.xp + excluded.xp, updated_at = now();
  return jsonb_build_object('held', p_held, 'xp', v_xp, 'gesamt', v_alt + v_xp, 'stufe_vorher', public.rpg_xp_stufe(v_alt), 'stufe', public.rpg_xp_stufe(v_alt + v_xp), 'laden', public.rpg_xp_shop());
end;
$$;

revoke all on function public.rpg_xp_shop(), public.rpg_xp_buy(text, integer), public.rpg_xp_use(text, text, integer) from public, anon;
grant execute on function public.rpg_xp_shop(), public.rpg_xp_buy(text, integer), public.rpg_xp_use(text, text, integer) to authenticated;

commit;
