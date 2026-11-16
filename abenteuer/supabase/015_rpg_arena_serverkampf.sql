-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 015: Arena – der Server rechnet den Kampf
-- Setzt Migration 008 und 014 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
-- Dazu gehört die Edge Function „arena“ (abenteuer/supabase/functions/arena/index.ts) – ohne sie bleibt alles beim Alten.
--
-- NUR FÜR DAS RPG. Additiv: zwei neue Tabellen, eine neue Spalte in rpg_arena_search (aus Migration 014),
-- neue Funktionen. Die Arena-Funktionen aus Migration 008 werden NICHT geändert; die bisherige Arena läuft weiter.
--
-- Was diese Migration bringt:
--   • Serverkampf: Ein Kampf, der über die neue Suche (rpg_arena_search_server) zustande kommt, wird nicht mehr
--     auf dem Gerät eines Spielers gerechnet, sondern von der Edge Function „arena“. Die Datenbank hält den Stand.
--   • Jeder Spieler bekommt nur SEINE Sicht (rpg_arena_fight): ohne den Anführer des Gegners (Königsmord)
--     und ohne den Zustand des Zufallsgenerators – niemand kann Würfe vorausberechnen.
--   • Das Ergebnis trägt der Server ein (rpg_arena_srv_end) und bucht die Belohnungen über die vorhandene
--     Funktion rpg_arena_belohnen. Spieler melden nichts mehr; ein Kampf lässt sich nicht mehr „platzen lassen“.
--   • Die Funktionen rpg_arena_srv_* darf NUR die Edge Function aufrufen (Rolle service_role), kein Spieler.
--
-- Rückbau: 015_rpg_arena_serverkampf_rueckbau.sql
-- =====================================================================
begin;

do $$ begin
  if to_regclass('public.rpg_arena_search') is null or to_regclass('public.rpg_arena_squads') is null then
    raise exception 'Migration 015 braucht Migration 014 (gespeichertes Team und Gegnersuche). Bitte zuerst 014 ausführen.';
  end if;
  if to_regprocedure('public.rpg_arena_belohnen(public.rpg_arena_matches, uuid)') is null then
    raise exception 'Migration 015 braucht rpg_arena_belohnen(rpg_arena_matches, uuid) aus Migration 008. Die Funktion fehlt oder hat andere Parameter.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1) Tabellen (nur über die Funktionen erreichbar)
-- ---------------------------------------------------------------------
-- Ein Serverkampf je Arena-Kampf. st: der vollständige Stand (nur der Server liest ihn), v: Zahl der gerechneten Schritte.
create table if not exists public.rpg_arena_fights (
  match_id    uuid        primary key references public.rpg_arena_matches(id) on delete cascade,
  v           integer     not null default 0,
  st          jsonb,
  anf1        smallint    not null default 0 check (anf1 between 0 and 2),   -- gewählter Anführer des Erstellers (Königsmord)
  anf2        smallint    not null default 0 check (anf2 between 0 and 2),
  beginn      timestamptz not null default now() + interval '15 seconds',    -- frühester Start: Zeit, Modus und Siegbedingungen zu lesen
  updated_at  timestamptz not null default now()
);
-- Die letzten Schritte als fertige Sichten beider Seiten (damit die Geräte jeden Schritt einzeln zeigen können)
create table if not exists public.rpg_arena_steps (
  match_id    uuid        not null references public.rpg_arena_fights(match_id) on delete cascade,
  v           integer     not null,
  sicht1      jsonb       not null,
  sicht2      jsonb       not null,
  primary key (match_id, v)
);
alter table public.rpg_arena_search add column if not exists server boolean not null default false;

alter table public.rpg_arena_fights enable row level security;
alter table public.rpg_arena_steps  enable row level security;
revoke all on public.rpg_arena_fights, public.rpg_arena_steps from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Gegnersuche: getrennte Töpfe für Geräte-Kampf (wie Migration 014) und Serverkampf
-- ---------------------------------------------------------------------
create or replace function public.rpg_arena_search_impl(p_server boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_helden text[]; v_team jsonb; v_schnitt numeric; v_id uuid; v_mein public.rpg_arena_matches%rowtype; v_json jsonb;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Die Arena gibt es nur mit einem Spielerkonto.'; end if;
  select team into v_helden from public.rpg_arena_squads where user_id = v_uid;
  if v_helden is null then raise exception 'Lege zuerst dein Team fest.'; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_arena_suche'));
  select id into v_id from public.rpg_arena_matches
    where (host_id = v_uid or guest_id = v_uid) and status in ('bereit', 'laeuft') and created_at > now() - interval '2 hours' order by created_at desc limit 1;
  if v_id is not null then return public.rpg_arena_get(v_id); end if;

  v_team := public.rpg_arena_team(v_uid, v_helden); v_schnitt := public.rpg_arena_schnitt(v_team);
  select m.* into v_mein from public.rpg_arena_matches m join public.rpg_arena_search s on s.match_id = m.id
    where m.host_id = v_uid and m.status = 'offen' and s.server = p_server order by m.created_at desc limit 1;
  select m.id into v_id from public.rpg_arena_matches m join public.rpg_arena_search s on s.match_id = m.id
    where m.status = 'offen' and m.host_id <> v_uid and s.server = p_server and s.seen_at > now() - interval '20 seconds'
      and abs(m.host_schnitt - v_schnitt) <= 1.0 and (v_mein.id is null or m.created_at < v_mein.created_at)
    order by m.created_at limit 1;
  if v_id is not null then
    v_json := public.rpg_arena_join(v_id, v_helden);
    if p_server then insert into public.rpg_arena_fights (match_id) values (v_id) on conflict (match_id) do nothing; end if;
    return v_json;
  end if;
  if v_mein.id is not null then
    update public.rpg_arena_search set seen_at = now() where match_id = v_mein.id;
    return public.rpg_arena_get(v_mein.id);
  end if;
  v_json := public.rpg_arena_create(v_helden);
  insert into public.rpg_arena_search (match_id, user_id, server) values ((v_json->>'id')::uuid, v_uid, p_server)
    on conflict (match_id) do update set seen_at = now(), server = excluded.server;
  delete from public.rpg_arena_search where seen_at < now() - interval '1 day';
  return v_json;
end;
$$;
-- Die Suche aus Migration 014 bleibt, findet aber nur noch Suchende derselben Art
create or replace function public.rpg_arena_search()
returns jsonb language sql security definer set search_path = public as $$ select public.rpg_arena_search_impl(false); $$;
create or replace function public.rpg_arena_search_server()
returns jsonb language sql security definer set search_path = public as $$ select public.rpg_arena_search_impl(true); $$;

-- ---------------------------------------------------------------------
-- 3) Für die Spieler: eigene Sicht lesen, Anführer festlegen
-- ---------------------------------------------------------------------
-- Ist das ein Serverkampf, und was ist seit Schritt p_version passiert? Liefert höchstens 12 Schritte in der Sicht des Aufrufers.
create or replace function public.rpg_arena_fight(p_match_id uuid, p_version integer default 0)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m public.rpg_arena_matches%rowtype; v_f public.rpg_arena_fights%rowtype; v_seite integer; v_schritte jsonb;
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id;
  if not found or v_uid is null or (v_m.host_id <> v_uid and v_m.guest_id is distinct from v_uid) then raise exception 'Diesen Kampf gibt es nicht.'; end if;
  select * into v_f from public.rpg_arena_fights where match_id = p_match_id;
  if not found then return jsonb_build_object('server', false); end if;
  v_seite := case when v_m.host_id = v_uid then 1 else 2 end;
  select coalesce(jsonb_agg(jsonb_build_object('v', x.v, 'st', x.sicht) order by x.v), '[]'::jsonb) into v_schritte
    from (select s.v, case when v_seite = 1 then s.sicht1 else s.sicht2 end as sicht from public.rpg_arena_steps s
          where s.match_id = p_match_id and s.v > coalesce(p_version, 0) order by s.v limit 12) x;
  return jsonb_build_object('server', true, 'v', v_f.v, 'laeuft', v_f.st is not null, 'status', v_m.status, 'seite', v_seite,
    'beginn', (extract(epoch from v_f.beginn) * 1000)::bigint, 'jetzt', (extract(epoch from clock_timestamp()) * 1000)::bigint,
    'anfuehrer', case when v_seite = 1 then v_f.anf1 else v_f.anf2 end, 'schritte', v_schritte);
end;
$$;

-- Königsmord: den eigenen Anführer bestimmen (0, 1 oder 2 = Platz im Team). Geht nur, solange der Kampf noch nicht begonnen hat.
create or replace function public.rpg_arena_fight_leader(p_match_id uuid, p_idx integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m public.rpg_arena_matches%rowtype;
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id;
  if not found or v_uid is null or (v_m.host_id <> v_uid and v_m.guest_id is distinct from v_uid) then raise exception 'Diesen Kampf gibt es nicht.'; end if;
  if p_idx is null or p_idx not between 0 and 2 then raise exception 'Ungültiger Anführer.'; end if;
  if v_m.host_id = v_uid then update public.rpg_arena_fights set anf1 = p_idx where match_id = p_match_id and st is null;
  else update public.rpg_arena_fights set anf2 = p_idx where match_id = p_match_id and st is null; end if;
  return found;
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Nur für die Edge Function (Rolle service_role)
-- ---------------------------------------------------------------------
-- Alles, was der Server zum Rechnen braucht. null, wenn es kein Serverkampf ist.
create or replace function public.rpg_arena_srv_load(p_match_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'kampf', jsonb_build_object('v', f.v, 'st', f.st, 'anf1', f.anf1, 'anf2', f.anf2, 'beginn', (extract(epoch from f.beginn) * 1000)::bigint),
    'match', jsonb_build_object('id', m.id, 'status', m.status, 'host_id', m.host_id, 'guest_id', m.guest_id, 'host_name', m.host_name, 'guest_name', m.guest_name,
      'host_team', m.host_team, 'guest_team', m.guest_team, 'karte', m.karte, 'begegnung', m.begegnung, 'seed', m.seed,
      'kampfstufe', round(greatest(m.host_schnitt, coalesce(m.guest_schnitt, m.host_schnitt)))::integer))
  from public.rpg_arena_fights f join public.rpg_arena_matches m on m.id = f.match_id where f.match_id = p_match_id;
$$;

-- Neuen Stand speichern – nur, wenn inzwischen niemand anderes gerechnet hat (p_v_alt = bisheriger Schritt). p_schritte: [{ "sicht1": …, "sicht2": … }, …]
create or replace function public.rpg_arena_srv_save(p_match_id uuid, p_v_alt integer, p_st jsonb, p_schritte jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_n integer := jsonb_array_length(coalesce(p_schritte, '[]'::jsonb));
begin
  update public.rpg_arena_fights set st = p_st, v = v + v_n, updated_at = now() where match_id = p_match_id and v = p_v_alt;
  if not found then return false; end if;
  insert into public.rpg_arena_steps (match_id, v, sicht1, sicht2)
    select p_match_id, p_v_alt + t.ord, t.e->'sicht1', t.e->'sicht2' from jsonb_array_elements(p_schritte) with ordinality as t(e, ord);
  delete from public.rpg_arena_steps where match_id = p_match_id and v <= p_v_alt + v_n - 40;
  update public.rpg_arena_matches set status = 'laeuft', started_at = coalesce(started_at, now()) where id = p_match_id and status = 'bereit';
  return true;
end;
$$;

-- Ergebnis eintragen und Belohnungen buchen (über die vorhandene Funktion rpg_arena_belohnen). Zweiter Aufruf ändert nichts.
create or replace function public.rpg_arena_srv_end(p_match_id uuid, p_sieger integer, p_grund text, p_punkte jsonb default null, p_runden integer default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_m public.rpg_arena_matches%rowtype;
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id for update;
  if not found or v_m.status not in ('bereit', 'laeuft') then return false; end if;
  if p_sieger not in (1, 2) or p_grund not in ('team', 'punkte', 'aufgabe') then raise exception 'Ungültiges Ergebnis.'; end if;
  update public.rpg_arena_matches set status = 'beendet', sieger = p_sieger, grund = p_grund, punkte = p_punkte, runden = p_runden,
    started_at = coalesce(started_at, now()), ended_at = now() where id = p_match_id returning * into v_m;
  perform public.rpg_arena_belohnen(v_m, v_m.host_id); perform public.rpg_arena_belohnen(v_m, v_m.guest_id);
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- 5) Ausführungsrechte
-- ---------------------------------------------------------------------
revoke all on function public.rpg_arena_search_impl(boolean), public.rpg_arena_srv_load(uuid), public.rpg_arena_srv_save(uuid, integer, jsonb, jsonb),
  public.rpg_arena_srv_end(uuid, integer, text, jsonb, integer) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.rpg_arena_srv_load(uuid), public.rpg_arena_srv_save(uuid, integer, jsonb, jsonb), public.rpg_arena_srv_end(uuid, integer, text, jsonb, integer) to service_role;
  end if;
end $$;
revoke all on function public.rpg_arena_search(), public.rpg_arena_search_server(), public.rpg_arena_fight(uuid, integer), public.rpg_arena_fight_leader(uuid, integer) from public, anon;
grant execute on function public.rpg_arena_search(), public.rpg_arena_search_server(), public.rpg_arena_fight(uuid, integer), public.rpg_arena_fight_leader(uuid, integer) to authenticated;

commit;
