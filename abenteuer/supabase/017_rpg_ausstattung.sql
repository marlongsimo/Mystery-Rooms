-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 017: Ausstattung beim Händler (Würfel-Designs, Profilrahmen)
-- Setzt Migration 008 (Seelensplitter: rpg_wallet) voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent). Bitte UNVERÄNDERT ausführen.
--
-- NUR FÜR DAS RPG. Rein additiv: drei neue Tabellen, drei neue Funktionen. Nichts Vorhandenes wird geändert.
--
-- Was diese Migration bringt:
--   • Katalog (rpg_cosmetic_items): welche Ausstattung es gibt und was sie kostet. Preise stehen NUR hier –
--     das Spiel kann keinen Preis vorgeben. Namen und Aussehen stehen im Spiel (js/kosmetik.js) unter derselben Kennung.
--   • Kaufen (rpg_cosmetic_buy): zieht Seelensplitter ab und trägt den Besitz ein. Jedes Stück nur einmal.
--   • Personalisieren (rpg_cosmetic_equip): je Art (Würfel, Rahmen) ein Stück auswählen – nur eines, das man besitzt –
--     oder zurück auf Standard. Die Auswahl ist am Konto gespeichert und gilt auf jedem Gerät.
--   • Rein kosmetisch: nichts davon wirkt auf Kämpfe, Erfahrung oder Belohnungen.
--
-- Neue Stücke später: eine Zeile in den Katalog unten ergänzen und die Datei erneut ausführen (und im Spiel das Aussehen).
-- Rückbau: 017_rpg_ausstattung_rueckbau.sql
-- =====================================================================
begin;

do $$ begin
  if to_regclass('public.rpg_wallet') is null or to_regprocedure('public.rpg_sammlung_konto()') is null then
    raise exception 'Migration 017 braucht die Seelensplitter aus Migration 008 (rpg_wallet) und rpg_sammlung_konto aus Migration 006.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1) Tabellen (nur über die Funktionen erreichbar)
-- ---------------------------------------------------------------------
create table if not exists public.rpg_cosmetic_items (
  id      text     primary key check (id ~ '^[a-z][a-z0-9_]{1,30}$'),
  art     text     not null check (art in ('wuerfel', 'rahmen')),
  preis   integer  not null check (preis >= 0),
  reihe   integer  not null default 0,
  aktiv   boolean  not null default true      -- false: nicht mehr zu kaufen; wer es hat, behält es
);
create table if not exists public.rpg_cosmetic_owned (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  item_id     text        not null references public.rpg_cosmetic_items(id),
  preis       integer     not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, item_id)
);
create table if not exists public.rpg_cosmetic_equipped (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  wuerfel     text        references public.rpg_cosmetic_items(id),
  rahmen      text        references public.rpg_cosmetic_items(id),
  updated_at  timestamptz not null default now()
);
alter table public.rpg_cosmetic_items    enable row level security;
alter table public.rpg_cosmetic_owned    enable row level security;
alter table public.rpg_cosmetic_equipped enable row level security;
revoke all on public.rpg_cosmetic_items, public.rpg_cosmetic_owned, public.rpg_cosmetic_equipped from anon, authenticated;

-- Katalog: einfache Stücke 75, ausgefallene 150 Seelensplitter
insert into public.rpg_cosmetic_items (id, art, preis, reihe) values
  ('w_obsidian', 'wuerfel',  75, 10), ('w_elfenbein', 'wuerfel',  75, 20), ('w_smaragd', 'wuerfel',  75, 30), ('w_rubin', 'wuerfel',  75, 40),
  ('w_glut',     'wuerfel', 150, 50), ('w_frost',     'wuerfel', 150, 60), ('w_arkan',   'wuerfel', 150, 70), ('w_gold',  'wuerfel', 150, 80),
  ('r_bronze',   'rahmen',   75, 10), ('r_silber',    'rahmen',   75, 20), ('r_eisen',   'rahmen',   75, 30), ('r_wald',  'rahmen',   75, 40),
  ('r_gold',     'rahmen',  150, 50), ('r_flammen',   'rahmen',  150, 60), ('r_frost',   'rahmen',  150, 70), ('r_splitter', 'rahmen', 150, 80),
  ('r_dornen',   'rahmen',   75, 42), ('r_zahnrad',   'rahmen',   75, 44),
  ('r_lorbeer',  'rahmen',  150, 90), ('r_krone',     'rahmen',  150, 100), ('r_schwingen', 'rahmen', 150, 110), ('r_stern', 'rahmen', 150, 120), ('r_runen', 'rahmen', 150, 130)
on conflict (id) do update set art = excluded.art, preis = excluded.preis, reihe = excluded.reihe;

-- ---------------------------------------------------------------------
-- 2) Funktionen
-- ---------------------------------------------------------------------
-- Alles auf einmal: Katalog mit Preisen, eigener Besitz, eigene Auswahl, Kontostand
create or replace function public.rpg_cosmetics()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false); end if;
  return jsonb_build_object('konto', true,
    'waehrung', coalesce((select betrag from public.rpg_wallet where user_id = v_uid), 0),
    'katalog', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'art', i.art, 'preis', i.preis) order by i.art, i.reihe, i.id)
      from public.rpg_cosmetic_items i where i.aktiv or exists (select 1 from public.rpg_cosmetic_owned o where o.user_id = v_uid and o.item_id = i.id)), '[]'::jsonb),
    'besitz', coalesce((select jsonb_agg(o.item_id order by o.created_at) from public.rpg_cosmetic_owned o where o.user_id = v_uid), '[]'::jsonb),
    'aktiv', coalesce((select jsonb_build_object('wuerfel', e.wuerfel, 'rahmen', e.rahmen) from public.rpg_cosmetic_equipped e where e.user_id = v_uid), jsonb_build_object('wuerfel', null, 'rahmen', null)));
end;
$$;

-- Kaufen: Preis aus dem Katalog, nur mit genug Seelensplittern, jedes Stück nur einmal
create or replace function public.rpg_cosmetic_buy(p_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_i public.rpg_cosmetic_items%rowtype;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Der Händler handelt nur mit Spielerkonten.'; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_shop:' || v_uid::text));
  select * into v_i from public.rpg_cosmetic_items where id = p_id and aktiv;
  if not found then raise exception 'Das führt der Händler nicht.'; end if;
  if exists (select 1 from public.rpg_cosmetic_owned where user_id = v_uid and item_id = p_id) then raise exception 'Das besitzt du schon.'; end if;
  if v_i.preis > 0 then
    update public.rpg_wallet set betrag = betrag - v_i.preis, updated_at = now() where user_id = v_uid and betrag >= v_i.preis;
    if not found then raise exception 'Dafür reichen deine Seelensplitter nicht.'; end if;
  end if;
  insert into public.rpg_cosmetic_owned (user_id, item_id, preis) values (v_uid, p_id, v_i.preis);
  return public.rpg_cosmetics();
end;
$$;

-- Auswählen: p_id = null stellt die Art auf Standard zurück. Sonst muss das Stück zur Art passen und einem gehören.
create or replace function public.rpg_cosmetic_equip(p_art text, p_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Das geht nur mit einem Spielerkonto.'; end if;
  if p_art is null or p_art not in ('wuerfel', 'rahmen') then raise exception 'Unbekannte Art.'; end if;
  if p_id is not null and not exists (select 1 from public.rpg_cosmetic_owned o join public.rpg_cosmetic_items i on i.id = o.item_id
                                      where o.user_id = v_uid and o.item_id = p_id and i.art = p_art) then
    raise exception 'Das besitzt du nicht.';
  end if;
  insert into public.rpg_cosmetic_equipped (user_id) values (v_uid) on conflict (user_id) do nothing;
  if p_art = 'wuerfel' then update public.rpg_cosmetic_equipped set wuerfel = p_id, updated_at = now() where user_id = v_uid;
  else update public.rpg_cosmetic_equipped set rahmen = p_id, updated_at = now() where user_id = v_uid; end if;
  return public.rpg_cosmetics();
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Ausführungsrechte
-- ---------------------------------------------------------------------
revoke all on function public.rpg_cosmetics(), public.rpg_cosmetic_buy(text), public.rpg_cosmetic_equip(text, text) from public, anon;
grant execute on function public.rpg_cosmetics(), public.rpg_cosmetic_buy(text), public.rpg_cosmetic_equip(text, text) to authenticated;

commit;
