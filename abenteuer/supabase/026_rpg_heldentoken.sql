-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 026: Heldentoken, Held der Woche, Heldenkauf in der Heldenhalle, Heldenchance nach Kampagnen
-- =====================================================================
-- Voraussetzung: Migrationen 006 (Heldensammlung) und 008 (Seelensplitter) sind eingespielt.
--
-- Was diese Migration tut:
--   1) Heldentoken (neu): Ein Token schaltet einen beliebigen Helden frei, den das Konto noch nicht hat.
--        – rpg_token_buy(Anzahl): kauft Token beim Händler, je 830 Seelensplitter (rpg_token_preis()).
--        – Der Vorrat steht in rpg_hero_tokens, jede Bewegung in rpg_hero_token_log.
--   2) Held der Woche (neu, ersetzt im Spiel die „Helden des Tages“):
--        – rpg_shop_week(): je Konto und Woche (Montag bis Sonntag, deutsche Zeit) ein zufälliger Held, den das Konto noch
--          nicht hat – zum halben Preis (415 statt 830). Hat das Konto alle Helden, meldet die Funktion „alle“.
--          Dazu Kontostand, Token-Vorrat und die Preise.
--        – rpg_shop_week_buy(): kauft den Helden der Woche für 415 Seelensplitter.
--   3) Heldenkauf in der Heldenhalle (neu):
--        – rpg_hero_buy(Held, 'token' | 'splitter'): schaltet einen Helden frei, für 1 Token oder 830 Seelensplitter.
--   4) Heldenchance nach Kampagnen (geändert, nur in rpg_claim_ending):
--        – Bisher gab es für jedes NEUE Ende sicher eine Heldenwahl (drei zur Auswahl).
--        – Jetzt: beim ersten Abschluss eines Endes 8 % Chance auf die Heldenwahl, bei jedem weiteren Abschluss desselben
--          Endes 2 % (rpg_ende_heldenchance). Alles andere an der Funktion bleibt: wer dabei war, was als Abschluss zählt,
--          die Zählung der gefundenen Enden, einmal je Kampagne.
--        – rpg_claim_ending wird NICHT neu geschrieben: In der vorhandenen Fassung wird nur die eine Bedingung ersetzt.
--          Passt sie nicht, bricht die ganze Migration ab und ändert nichts.
--
-- Die bisherigen Funktionen rpg_shop_today und rpg_shop_buy (Helden des Tages) bleiben unverändert bestehen;
-- das Spiel ruft sie nur nicht mehr auf. Es wird nichts gelöscht.
--
-- NUR FÜR DAS RPG. Rückbau: 026_rpg_heldentoken_rueckbau.sql
-- Unverändert in den Supabase SQL Editor einfügen und ausführen. Mehrfaches Ausführen ist unschädlich.
-- =====================================================================
begin;

do $$ begin
  if to_regclass('public.rpg_hero_collection') is null or to_regprocedure('public.rpg_hero_ziehen(uuid, integer, text[])') is null or to_regprocedure('public.rpg_claim_ending(uuid)') is null then
    raise exception 'Migration 006 (Heldensammlung) fehlt.';
  end if;
  if to_regclass('public.rpg_wallet') is null then raise exception 'Migration 008 (Seelensplitter) fehlt.'; end if;
end $$;

-- ---------------------------------------------------------------------
-- 1) Tabellen
-- ---------------------------------------------------------------------
create table if not exists public.rpg_hero_tokens (
  user_id     uuid         primary key references auth.users(id) on delete cascade,
  anzahl      integer      not null default 0 check (anzahl >= 0),
  updated_at  timestamptz  not null default now()
);
create table if not exists public.rpg_hero_token_log (
  id          uuid         primary key default gen_random_uuid(),
  user_id     uuid         not null references auth.users(id) on delete cascade,
  art         text         not null check (art in ('token_kauf', 'held_token', 'held_splitter', 'held_woche')),
  anzahl      integer      not null default 1,
  hero_id     text,
  preis       integer      not null default 0,          -- bezahlte Seelensplitter
  created_at  timestamptz  not null default now()
);
create index if not exists rpg_hero_token_log_user on public.rpg_hero_token_log (user_id, created_at desc);
create table if not exists public.rpg_shop_weekly (
  user_id     uuid         not null references auth.users(id) on delete cascade,
  woche       date         not null,                    -- Montag der Woche (deutsche Zeit)
  hero_id     text,                                     -- null: Das Konto hatte beim Ziehen schon alle Helden
  created_at  timestamptz  not null default now(),
  primary key (user_id, woche)
);
alter table public.rpg_hero_tokens enable row level security;
alter table public.rpg_hero_token_log enable row level security;
alter table public.rpg_shop_weekly enable row level security;
revoke all on public.rpg_hero_tokens, public.rpg_hero_token_log, public.rpg_shop_weekly from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Preise und Chancen (an einer Stelle; zum Ändern genügt es, die Zahl hier zu ersetzen und die Migration erneut auszuführen)
-- ---------------------------------------------------------------------
create or replace function public.rpg_hero_preis() returns integer language sql immutable as $$ select 830; $$;          -- ein Held gegen Seelensplitter
create or replace function public.rpg_token_preis() returns integer language sql immutable as $$ select 830; $$;         -- ein Heldentoken
create or replace function public.rpg_woche_preis() returns integer language sql immutable as $$ select 415; $$;         -- der Held der Woche
create or replace function public.rpg_ende_heldenchance(p_neu boolean) returns numeric language sql stable as $$ select case when p_neu then 0.08 else 0.02 end; $$;

-- ---------------------------------------------------------------------
-- 3) Händler: Held der Woche und Heldentoken
-- ---------------------------------------------------------------------
create or replace function public.rpg_shop_week()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_woche date := date_trunc('week', now() at time zone 'Europe/Berlin')::date; v_held text; v_da boolean; v_alle boolean;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false); end if;
  select hero_id, true into v_held, v_da from public.rpg_shop_weekly where user_id = v_uid and woche = v_woche;
  if not coalesce(v_da, false) then
    v_held := (public.rpg_hero_ziehen(v_uid, 1))[1];
    insert into public.rpg_shop_weekly (user_id, woche, hero_id) values (v_uid, v_woche, v_held) on conflict (user_id, woche) do nothing;
    select hero_id into v_held from public.rpg_shop_weekly where user_id = v_uid and woche = v_woche;
  end if;
  v_alle := not exists (select 1 from public.rpg_hero_catalog c where not exists (select 1 from public.rpg_hero_collection k where k.user_id = v_uid and k.hero_id = c.hero_id));
  return jsonb_build_object('konto', true,
    'waehrung', coalesce((select betrag from public.rpg_wallet where user_id = v_uid), 0),
    'tokens', coalesce((select anzahl from public.rpg_hero_tokens where user_id = v_uid), 0),
    'preis', public.rpg_hero_preis(), 'angebot', public.rpg_woche_preis(), 'token_preis', public.rpg_token_preis(),
    'bis', ((v_woche + 7)::timestamp at time zone 'Europe/Berlin'),
    'alle', v_alle, 'held', v_held,
    'gekauft', v_held is not null and exists (select 1 from public.rpg_hero_collection where user_id = v_uid and hero_id = v_held));
end;
$$;

create or replace function public.rpg_shop_week_buy()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_woche date := date_trunc('week', now() at time zone 'Europe/Berlin')::date; v_held text; v_preis integer := public.rpg_woche_preis();
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Der Händler handelt nur mit Spielerkonten.'; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_shop:' || v_uid::text));
  select hero_id into v_held from public.rpg_shop_weekly where user_id = v_uid and woche = v_woche;
  if v_held is null then raise exception 'Diese Woche hat der Händler keinen Helden für dich.'; end if;
  if exists (select 1 from public.rpg_hero_collection where user_id = v_uid and hero_id = v_held) then raise exception 'Diesen Helden hast du schon.'; end if;
  update public.rpg_wallet set betrag = betrag - v_preis, updated_at = now() where user_id = v_uid and betrag >= v_preis;
  if not found then raise exception 'Dafür reichen deine Seelensplitter nicht.'; end if;
  insert into public.rpg_hero_collection (user_id, hero_id, quelle) values (v_uid, v_held, 'code');
  insert into public.rpg_hero_token_log (user_id, art, hero_id, preis) values (v_uid, 'held_woche', v_held, v_preis);
  return public.rpg_shop_week();
end;
$$;

create or replace function public.rpg_token_buy(p_anzahl integer default 1)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_preis integer;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Der Händler handelt nur mit Spielerkonten.'; end if;
  if p_anzahl is null or p_anzahl < 1 or p_anzahl > 15 then raise exception 'Ungültige Anzahl.'; end if;
  v_preis := public.rpg_token_preis() * p_anzahl;
  perform pg_advisory_xact_lock(hashtext('rpg_shop:' || v_uid::text));
  update public.rpg_wallet set betrag = betrag - v_preis, updated_at = now() where user_id = v_uid and betrag >= v_preis;
  if not found then raise exception 'Dafür reichen deine Seelensplitter nicht.'; end if;
  insert into public.rpg_hero_tokens (user_id, anzahl) values (v_uid, p_anzahl)
    on conflict (user_id) do update set anzahl = public.rpg_hero_tokens.anzahl + excluded.anzahl, updated_at = now();
  insert into public.rpg_hero_token_log (user_id, art, anzahl, preis) values (v_uid, 'token_kauf', p_anzahl, v_preis);
  return public.rpg_shop_week();
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Heldenhalle: einen Helden freischalten – für 1 Token oder 830 Seelensplitter
-- ---------------------------------------------------------------------
create or replace function public.rpg_hero_buy(p_held text, p_mit text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_preis integer := public.rpg_hero_preis();
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Helden gibt es nur mit einem Spielerkonto.'; end if;
  if p_mit is null or p_mit not in ('token', 'splitter') then raise exception 'Unbekannte Zahlungsart.'; end if;
  if not exists (select 1 from public.rpg_hero_catalog where hero_id = p_held) then raise exception 'Diesen Helden gibt es nicht.'; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_shop:' || v_uid::text));
  if exists (select 1 from public.rpg_hero_collection where user_id = v_uid and hero_id = p_held) then raise exception 'Diesen Helden hast du schon.'; end if;
  if p_mit = 'token' then
    update public.rpg_hero_tokens set anzahl = anzahl - 1, updated_at = now() where user_id = v_uid and anzahl >= 1;
    if not found then raise exception 'Du hast keinen Heldentoken.'; end if;
    insert into public.rpg_hero_token_log (user_id, art, hero_id) values (v_uid, 'held_token', p_held);
  else
    update public.rpg_wallet set betrag = betrag - v_preis, updated_at = now() where user_id = v_uid and betrag >= v_preis;
    if not found then raise exception 'Dafür reichen deine Seelensplitter nicht.'; end if;
    insert into public.rpg_hero_token_log (user_id, art, hero_id, preis) values (v_uid, 'held_splitter', p_held, v_preis);
  end if;
  insert into public.rpg_hero_collection (user_id, hero_id, quelle) values (v_uid, p_held, 'code');
  return public.rpg_shop_week() || jsonb_build_object('held_neu', p_held);
end;
$$;

revoke all on function public.rpg_hero_preis(), public.rpg_token_preis(), public.rpg_woche_preis(), public.rpg_ende_heldenchance(boolean),
  public.rpg_shop_week(), public.rpg_shop_week_buy(), public.rpg_token_buy(integer), public.rpg_hero_buy(text, text) from public, anon;
grant execute on function public.rpg_shop_week(), public.rpg_shop_week_buy(), public.rpg_token_buy(integer), public.rpg_hero_buy(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 5) Kampagnen: Heldenwahl nur noch mit 8 % (erstes Mal) bzw. 2 % (jedes weitere Mal) – eine Bedingung in rpg_claim_ending
-- ---------------------------------------------------------------------
do $$
declare v_alt text := pg_get_functiondef('public.rpg_claim_ending(uuid)'::regprocedure); v_neu text;
begin
  if v_alt ~* 'rpg_ende_heldenchance' then raise notice 'rpg_claim_ending: nichts zu ändern (die Chance ist schon eingebaut)'; return; end if;
  v_neu := regexp_replace(v_alt, 'if\s+v_neu\s+then(\s+v_helden\s*:=\s*(public\.)?rpg_hero_ziehen)', 'if random() < public.rpg_ende_heldenchance(v_neu) then\1', 'i');
  if v_neu = v_alt then raise exception 'rpg_claim_ending sieht anders aus als erwartet. Die Migration ändert nichts; bitte melden.'; end if;
  execute v_neu;
  raise notice 'rpg_claim_ending: Heldenwahl jetzt mit 8 Prozent (erstes Mal) und 2 Prozent (jedes weitere Mal)';
end $$;

commit;
