-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 014: Arena – gespeichertes Team und Gegnersuche
-- Setzt Migration 008 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG. Rein additiv: zwei neue Tabellen, vier neue Funktionen.
-- An den vorhandenen Arena-Tabellen und -Funktionen wird NICHTS geändert; die bisherige Arena
-- (Kampf erstellen, Liste, Beitreten) läuft unverändert weiter.
--
-- Was diese Migration bringt:
--   • Mein Team: Jedes Konto speichert drei eigene Helden für die Arena (rpg_arena_squad_set) und
--     liest sie wieder (rpg_arena_squad). Das Team gilt für jeden Kampf, bis es geändert wird.
--   • Gegnersuche: rpg_arena_search() nimmt das gespeicherte Team und
--       – verbindet mit einem anderen Suchenden, dessen Durchschnittsstufe höchstens 1,0 entfernt ist, oder
--       – trägt das eigene Konto als suchend ein, wenn gerade niemand passt.
--     Das Spiel ruft die Funktion während der Suche alle paar Sekunden wieder auf. Das ist zugleich das
--     Lebenszeichen: Wer die Seite schließt, wird nach 20 Sekunden nicht mehr vermittelt.
--   • Die Suche benutzt die vorhandenen Funktionen rpg_arena_create und rpg_arena_join – alle Regeln
--     (eigene Helden, Stufenabstand, Auslosung von Karte und Modus, Belohnungen) bleiben dieselben.
--   • Abbrechen der Suche: wie bisher mit rpg_arena_cancel.
--
-- Rückbau: 014_rpg_arena_team_suche_rueckbau.sql
-- =====================================================================
begin;

do $$ begin
  if to_regprocedure('public.rpg_arena_team(uuid, text[])') is null or to_regprocedure('public.rpg_arena_schnitt(jsonb)') is null
     or to_regprocedure('public.rpg_arena_create(text[])') is null or to_regprocedure('public.rpg_arena_join(uuid, text[])') is null
     or to_regprocedure('public.rpg_arena_get(uuid)') is null then
    raise exception 'Migration 014 braucht die Arena-Funktionen aus Migration 008 (rpg_arena_team, rpg_arena_schnitt, rpg_arena_create, rpg_arena_join, rpg_arena_get). Mindestens eine fehlt oder hat andere Parameter.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1) Tabellen (nur über die Funktionen erreichbar)
-- ---------------------------------------------------------------------
create table if not exists public.rpg_arena_squads (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  team        text[]      not null check (cardinality(team) = 3),
  updated_at  timestamptz not null default now()
);
-- Wer gerade sucht: der offene Kampf des Suchenden und sein letztes Lebenszeichen
create table if not exists public.rpg_arena_search (
  match_id    uuid        primary key references public.rpg_arena_matches(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  seen_at     timestamptz not null default now()
);
create index if not exists rpg_arena_search_seen on public.rpg_arena_search (seen_at desc);

alter table public.rpg_arena_squads enable row level security;
alter table public.rpg_arena_search enable row level security;
revoke all on public.rpg_arena_squads, public.rpg_arena_search from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Mein Team
-- ---------------------------------------------------------------------
-- Das gespeicherte Team mit aktuellen Stufen. Gehört ein Held nicht mehr zur Sammlung, gilt das Team als nicht festgelegt.
create or replace function public.rpg_arena_squad()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_helden text[]; v_team jsonb;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false, 'team', null); end if;
  select team into v_helden from public.rpg_arena_squads where user_id = v_uid;
  if v_helden is null then return jsonb_build_object('konto', true, 'team', null); end if;
  begin v_team := public.rpg_arena_team(v_uid, v_helden);
  exception when others then return jsonb_build_object('konto', true, 'team', null); end;
  return jsonb_build_object('konto', true, 'team', v_team, 'schnitt', public.rpg_arena_schnitt(v_team));
end;
$$;

create or replace function public.rpg_arena_squad_set(p_team text[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_team jsonb;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Die Arena gibt es nur mit einem Spielerkonto.'; end if;
  v_team := public.rpg_arena_team(v_uid, p_team); -- prüft: genau drei verschiedene Helden aus der eigenen Sammlung
  insert into public.rpg_arena_squads (user_id, team) values (v_uid, p_team)
    on conflict (user_id) do update set team = excluded.team, updated_at = now();
  -- Wer mit dem alten Team noch als suchend eingetragen ist, wird ausgetragen
  update public.rpg_arena_matches set status = 'abgebrochen', ended_at = now() where host_id = v_uid and status = 'offen';
  return jsonb_build_object('konto', true, 'team', v_team, 'schnitt', public.rpg_arena_schnitt(v_team));
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Gegnersuche
-- ---------------------------------------------------------------------
-- Liefert den Kampf aus eigener Sicht (wie rpg_arena_get): Status 'offen' = es wird noch gesucht, 'bereit' = Gegner gefunden.
create or replace function public.rpg_arena_search()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_helden text[]; v_team jsonb; v_schnitt numeric; v_id uuid; v_mein public.rpg_arena_matches%rowtype; v_json jsonb;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Die Arena gibt es nur mit einem Spielerkonto.'; end if;
  select team into v_helden from public.rpg_arena_squads where user_id = v_uid;
  if v_helden is null then raise exception 'Lege zuerst dein Team fest.'; end if;
  -- Suchen laufen nacheinander: So finden sich zwei, die gleichzeitig suchen, sicher
  perform pg_advisory_xact_lock(hashtext('rpg_arena_suche'));
  -- Schon verbunden (der andere hat mich gefunden) oder ein Kampf läuft noch
  select id into v_id from public.rpg_arena_matches
    where (host_id = v_uid or guest_id = v_uid) and status in ('bereit', 'laeuft') and created_at > now() - interval '2 hours' order by created_at desc limit 1;
  if v_id is not null then return public.rpg_arena_get(v_id); end if;

  v_team := public.rpg_arena_team(v_uid, v_helden); v_schnitt := public.rpg_arena_schnitt(v_team);
  select m.* into v_mein from public.rpg_arena_matches m join public.rpg_arena_search s on s.match_id = m.id
    where m.host_id = v_uid and m.status = 'offen' order by m.created_at desc limit 1;
  -- Ein anderer Suchender mit passender Stufe und frischem Lebenszeichen? Suchen beide schon, tritt der später Gekommene dem Älteren bei.
  select m.id into v_id from public.rpg_arena_matches m join public.rpg_arena_search s on s.match_id = m.id
    where m.status = 'offen' and m.host_id <> v_uid and s.seen_at > now() - interval '20 seconds'
      and abs(m.host_schnitt - v_schnitt) <= 1.0 and (v_mein.id is null or m.created_at < v_mein.created_at)
    order by m.created_at limit 1;
  if v_id is not null then
    return public.rpg_arena_join(v_id, v_helden); -- verwirft dabei den eigenen offenen Kampf
  end if;
  if v_mein.id is not null then
    update public.rpg_arena_search set seen_at = now() where match_id = v_mein.id;
    return public.rpg_arena_get(v_mein.id);
  end if;
  v_json := public.rpg_arena_create(v_helden);
  insert into public.rpg_arena_search (match_id, user_id) values ((v_json->>'id')::uuid, v_uid) on conflict (match_id) do update set seen_at = now();
  delete from public.rpg_arena_search where seen_at < now() - interval '1 day';
  return v_json;
end;
$$;

-- Wie viele suchen gerade (ohne mich)? Nur eine Zahl, keine Namen.
create or replace function public.rpg_arena_search_count()
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.rpg_arena_matches m join public.rpg_arena_search s on s.match_id = m.id
    where m.status = 'offen' and m.host_id <> auth.uid() and s.seen_at > now() - interval '20 seconds';
$$;

-- ---------------------------------------------------------------------
-- 4) Ausführungsrechte
-- ---------------------------------------------------------------------
revoke all on function public.rpg_arena_squad(), public.rpg_arena_squad_set(text[]), public.rpg_arena_search(), public.rpg_arena_search_count() from public, anon;
grant execute on function public.rpg_arena_squad(), public.rpg_arena_squad_set(text[]), public.rpg_arena_search(), public.rpg_arena_search_count() to authenticated;

commit;
