-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 008: Arena (Spieler gegen Spieler mit Monstern) und Währung
-- Setzt Migration 001–007 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG. Legt ausschließlich neue Objekte mit dem Präfix rpg_ an.
-- Bestehende Tabellen, Funktionen und Daten werden nicht verändert.
--
-- Was diese Migration einführt (KONZEPT-PVPVE.md):
--   • Arena-Kämpfe: Ein Konto erstellt einen Kampf mit drei Helden aus seiner Sammlung. Andere sehen in der
--     Übersicht nur den Namen und die Durchschnittsstufe, nicht die Helden. Wer beitritt, wählt drei eigene
--     Helden; die Durchschnittsstufen dürfen höchstens 1,0 auseinanderliegen. Karte und Monster lost der Server.
--     Die Aufstellungen beider Seiten sehen nur die beiden Teilnehmer, und erst nach dem Beitritt.
--   • Ergebnis: Beide Seiten melden es. Stimmen die Meldungen überein (oder gibt jemand auf), wird gewertet.
--   • Belohnungen (auf dem Server gerechnet, höchstens 5 gewertete Kämpfe je Tag):
--       – XP je Held: 25 auf der Stufe des Kampfes, je Stufe darunter 10 mehr (höchstens 100),
--         je Stufe darüber 5 weniger (mindestens 5); bei einer Niederlage ein Drittel; höchstens 150 XP je Held und Tag.
--       – Sieg: 25 Einheiten der Währung („Seelensplitter“).
--       – Sieg (nicht durch Aufgabe des Gegners): 8 % Chance auf eine Heldenwahl aus drei fehlenden Helden.
--   • Währung je Konto (rpg_wallet). Wofür sie ausgegeben wird, kommt später.
--
-- Rückbau: 008_rpg_arena_rueckbau.sql
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) Tabellen
-- ---------------------------------------------------------------------
create table if not exists public.rpg_wallet (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  betrag      integer     not null default 0 check (betrag >= 0),
  updated_at  timestamptz not null default now()
);

create table if not exists public.rpg_arena_matches (
  id             uuid         primary key default gen_random_uuid(),
  status         text         not null default 'offen' check (status in ('offen', 'bereit', 'laeuft', 'beendet', 'abgebrochen')),
  host_id        uuid         not null references auth.users(id) on delete cascade,
  host_name      text         not null,
  host_team      jsonb        not null,                 -- [{ "held": "...", "stufe": n } × 3]
  host_schnitt   numeric(3,1) not null,
  guest_id       uuid         references auth.users(id) on delete set null,
  guest_name     text,
  guest_team     jsonb,
  guest_schnitt  numeric(3,1),
  karte          text,
  begegnung      text,
  seed           integer,
  room_code      text         check (room_code is null or room_code ~ '^[A-Za-z0-9-]{3,16}$'),
  sieger         smallint     check (sieger in (1, 2)), -- 1 = Ersteller, 2 = Beigetretener
  grund          text         check (grund is null or grund in ('team', 'punkte', 'aufgabe')),
  punkte         jsonb,
  runden         integer,
  host_meldung   jsonb,
  guest_meldung  jsonb,
  created_at     timestamptz  not null default now(),
  started_at     timestamptz,
  ended_at       timestamptz
);
create index if not exists rpg_arena_matches_offen on public.rpg_arena_matches (created_at desc) where status = 'offen';
create index if not exists rpg_arena_matches_host on public.rpg_arena_matches (host_id, created_at desc);
create index if not exists rpg_arena_matches_guest on public.rpg_arena_matches (guest_id, created_at desc);

-- Belohnung je Konto und Kampf (genau einmal; zählt auch für die Obergrenze je Tag)
create table if not exists public.rpg_arena_rewards (
  match_id    uuid        not null references public.rpg_arena_matches(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  sieg        boolean     not null,
  gewertet    boolean     not null,             -- false: über der Obergrenze des Tages, keine Belohnung
  xp          jsonb       not null default '[]'::jsonb,
  waehrung    integer     not null default 0,
  offer_id    uuid,
  created_at  timestamptz not null default now(),
  primary key (match_id, user_id)
);
create index if not exists rpg_arena_rewards_user on public.rpg_arena_rewards (user_id, created_at desc);

alter table public.rpg_wallet        enable row level security;
alter table public.rpg_arena_matches enable row level security;
alter table public.rpg_arena_rewards enable row level security;
revoke all on public.rpg_wallet, public.rpg_arena_matches, public.rpg_arena_rewards from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Hilfsfunktionen (nicht direkt aufrufbar)
-- ---------------------------------------------------------------------
-- Prüft eine Aufstellung (genau drei verschiedene Helden aus der eigenen Sammlung) und liefert sie mit Stufen
create or replace function public.rpg_arena_team(p_user uuid, p_team text[])
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_team jsonb;
begin
  if p_team is null or cardinality(p_team) <> 3 or (select count(distinct h) from unnest(p_team) h) <> 3 then
    raise exception 'Wähle genau drei verschiedene Helden.';
  end if;
  if exists (select 1 from unnest(p_team) h where not exists (select 1 from public.rpg_hero_collection c where c.user_id = p_user and c.hero_id = h)) then
    raise exception 'Diese Helden gehören nicht alle zu deiner Sammlung.';
  end if;
  select jsonb_agg(jsonb_build_object('held', h, 'stufe', public.rpg_xp_stufe(coalesce((select xp from public.rpg_hero_progress p where p.user_id = p_user and p.hero_id = h), 0))) order by ord)
    into v_team from unnest(p_team) with ordinality as t(h, ord);
  return v_team;
end;
$$;

create or replace function public.rpg_arena_schnitt(p_team jsonb)
returns numeric language sql immutable set search_path = public as $$
  select round(avg((e->>'stufe')::numeric), 1) from jsonb_array_elements(p_team) e;
$$;

-- XP eines Helden für einen Kampf auf dieser Stufe
create or replace function public.rpg_arena_xp(p_kampfstufe integer, p_heldenstufe integer, p_sieg boolean)
returns integer language sql immutable set search_path = public as $$
  select greatest(1, round((case
    when p_heldenstufe <= p_kampfstufe then least(100, 25 + 10 * (p_kampfstufe - p_heldenstufe))
    else greatest(5, 25 - 5 * (p_heldenstufe - p_kampfstufe)) end)::numeric / (case when p_sieg then 1 else 3 end)))::integer;
$$;

-- Sicht eines Teilnehmers auf einen Kampf (die Aufstellung des Gegners erst, wenn beide feststehen)
create or replace function public.rpg_arena_json(p_m public.rpg_arena_matches, p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p_m.id, 'status', p_m.status, 'seite', case when p_m.host_id = p_user then 1 else 2 end,
    'host', jsonb_build_object('name', p_m.host_name, 'schnitt', p_m.host_schnitt, 'team', case when p_m.host_id = p_user or p_m.guest_id is not null then p_m.host_team else null end),
    'gast', case when p_m.guest_id is null then null else jsonb_build_object('name', p_m.guest_name, 'schnitt', p_m.guest_schnitt, 'team', p_m.guest_team) end,
    'karte', p_m.karte, 'begegnung', p_m.begegnung, 'seed', p_m.seed, 'room_code', p_m.room_code,
    'kampfstufe', round(greatest(p_m.host_schnitt, coalesce(p_m.guest_schnitt, p_m.host_schnitt)))::integer,
    'sieger', p_m.sieger, 'grund', p_m.grund, 'punkte', p_m.punkte, 'runden', p_m.runden, 'erstellt', p_m.created_at,
    'belohnung', (select jsonb_build_object('sieg', r.sieg, 'gewertet', r.gewertet, 'xp', r.xp, 'waehrung', r.waehrung,
                    'angebot', (select public.rpg_hero_angebot_json(o) from public.rpg_hero_offers o where o.id = r.offer_id and o.status = 'offen'))
                  from public.rpg_arena_rewards r where r.match_id = p_m.id and r.user_id = p_user));
$$;

-- Belohnung für ein Konto buchen (einmal je Kampf)
create or replace function public.rpg_arena_belohnen(p_m public.rpg_arena_matches, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_seite integer := case when p_m.host_id = p_user then 1 else 2 end; v_sieg boolean := p_m.sieger = v_seite;
  v_team jsonb := case when v_seite = 1 then p_m.host_team else p_m.guest_team end;
  v_stufe integer := round(greatest(p_m.host_schnitt, p_m.guest_schnitt))::integer;
  v_tag timestamptz := date_trunc('day', now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin';
  v_heute integer; v_e jsonb; v_h text; v_alt integer; v_vor integer; v_xp integer; v_schon integer; v_liste jsonb := '[]'::jsonb;
  v_waehrung integer := 0; v_offer uuid; v_helden text[];
begin
  if exists (select 1 from public.rpg_arena_rewards where match_id = p_m.id and user_id = p_user) then return; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_xp:' || p_user::text));
  -- Wer aufgibt, bekommt nichts
  if p_m.grund = 'aufgabe' and not v_sieg then
    insert into public.rpg_arena_rewards (match_id, user_id, sieg, gewertet) values (p_m.id, p_user, false, false) on conflict do nothing; return;
  end if;
  select count(*) into v_heute from public.rpg_arena_rewards where user_id = p_user and gewertet and created_at >= v_tag;
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

-- ---------------------------------------------------------------------
-- 3) Funktionen für das Spiel
-- ---------------------------------------------------------------------
-- Übersicht: offene Kämpfe anderer (nur Name und Durchschnittsstufe), der eigene laufende Kampf, die Währung
create or replace function public.rpg_arena_list()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_tag timestamptz := date_trunc('day', now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin';
begin
  if not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false); end if;
  return jsonb_build_object('konto', true,
    'waehrung', coalesce((select betrag from public.rpg_wallet where user_id = v_uid), 0),
    'heute', (select count(*) from public.rpg_arena_rewards where user_id = v_uid and gewertet and created_at >= v_tag),
    'offen', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.host_name, 'schnitt', m.host_schnitt, 'erstellt', m.created_at) order by m.created_at desc)
      from public.rpg_arena_matches m where m.status = 'offen' and m.host_id <> v_uid and m.created_at > now() - interval '2 hours'), '[]'::jsonb),
    'mein', (select public.rpg_arena_json(m, v_uid) from public.rpg_arena_matches m
      where (m.host_id = v_uid or m.guest_id = v_uid) and m.status in ('offen', 'bereit', 'laeuft') and m.created_at > now() - interval '2 hours'
      order by m.created_at desc limit 1));
end;
$$;

create or replace function public.rpg_my_wallet()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('konto', public.rpg_sammlung_konto(), 'waehrung', coalesce((select betrag from public.rpg_wallet where user_id = auth.uid()), 0));
$$;

-- Kampf erstellen. Ein noch offener eigener Kampf wird dabei verworfen.
create or replace function public.rpg_arena_create(p_team text[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_team jsonb; v_m public.rpg_arena_matches%rowtype;
begin
  if not public.rpg_sammlung_konto() then raise exception 'Die Arena gibt es nur mit einem Spielerkonto.'; end if;
  if exists (select 1 from public.rpg_arena_matches where (host_id = v_uid or guest_id = v_uid) and status in ('bereit', 'laeuft') and created_at > now() - interval '2 hours') then
    raise exception 'Du hast schon einen laufenden Kampf.';
  end if;
  v_team := public.rpg_arena_team(v_uid, p_team);
  update public.rpg_arena_matches set status = 'abgebrochen', ended_at = now() where host_id = v_uid and status = 'offen';
  insert into public.rpg_arena_matches (host_id, host_name, host_team, host_schnitt)
    values (v_uid, (select handle from public.rpg_profiles where user_id = v_uid), v_team, public.rpg_arena_schnitt(v_team)) returning * into v_m;
  return public.rpg_arena_json(v_m, v_uid);
end;
$$;

-- Beitreten: drei eigene Helden, Durchschnittsstufe höchstens 1,0 vom Ersteller entfernt. Karte, Monster und Startwert lost der Server.
create or replace function public.rpg_arena_join(p_match_id uuid, p_team text[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_team jsonb; v_schnitt numeric; v_m public.rpg_arena_matches%rowtype;
  v_karten text[] := array['garten', 'turm', 'gruft', 'pilze', 'schacht', 'halle', 'siegel']; v_monster text[] := array['garten', 'kobolde', 'gruft'];
begin
  if not public.rpg_sammlung_konto() then raise exception 'Die Arena gibt es nur mit einem Spielerkonto.'; end if;
  if exists (select 1 from public.rpg_arena_matches where (host_id = v_uid or guest_id = v_uid) and status in ('bereit', 'laeuft') and created_at > now() - interval '2 hours') then
    raise exception 'Du hast schon einen laufenden Kampf.';
  end if;
  select * into v_m from public.rpg_arena_matches where id = p_match_id for update;
  if not found or v_m.status <> 'offen' then raise exception 'Diesen Kampf gibt es nicht mehr, oder jemand anderes war schneller.'; end if;
  if v_m.host_id = v_uid then raise exception 'Das ist dein eigener Kampf.'; end if;
  v_team := public.rpg_arena_team(v_uid, p_team); v_schnitt := public.rpg_arena_schnitt(v_team);
  if abs(v_schnitt - v_m.host_schnitt) > 1.0 then
    raise exception 'Dein Team (Stufe %) liegt zu weit von Stufe % entfernt. Erlaubt ist höchstens eine Stufe Unterschied.', v_schnitt, v_m.host_schnitt;
  end if;
  update public.rpg_arena_matches set status = 'abgebrochen', ended_at = now() where host_id = v_uid and status = 'offen';
  update public.rpg_arena_matches set status = 'bereit', guest_id = v_uid, guest_name = (select handle from public.rpg_profiles where user_id = v_uid),
    guest_team = v_team, guest_schnitt = v_schnitt,
    karte = v_karten[1 + floor(random() * cardinality(v_karten))::integer], begegnung = v_monster[1 + floor(random() * cardinality(v_monster))::integer],
    seed = floor(random() * 2000000000)::integer
    where id = p_match_id returning * into v_m;
  return public.rpg_arena_json(v_m, v_uid);
end;
$$;

-- Stand eines Kampfes (nur für die beiden Teilnehmer)
create or replace function public.rpg_arena_get(p_match_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m public.rpg_arena_matches%rowtype;
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id;
  if not found or v_uid is null or (v_m.host_id <> v_uid and v_m.guest_id is distinct from v_uid) then raise exception 'Diesen Kampf gibt es nicht.'; end if;
  return public.rpg_arena_json(v_m, v_uid);
end;
$$;

-- Der Ersteller hinterlegt den Code der Live-Verbindung; damit beginnt der Kampf
create or replace function public.rpg_arena_room(p_match_id uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m public.rpg_arena_matches%rowtype;
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id for update;
  if not found or v_m.host_id <> v_uid then raise exception 'Diesen Kampf gibt es nicht.'; end if;
  if v_m.status not in ('bereit', 'laeuft') then raise exception 'Dieser Kampf kann nicht gestartet werden.'; end if;
  if p_code is null or p_code !~ '^[A-Za-z0-9-]{3,16}$' then raise exception 'Ungültiger Code.'; end if;
  update public.rpg_arena_matches set room_code = p_code, status = 'laeuft', started_at = coalesce(started_at, now()) where id = p_match_id returning * into v_m;
  return public.rpg_arena_json(v_m, v_uid);
end;
$$;

-- Verlassen: Ein offener Kampf wird verworfen. Ist schon jemand beigetreten, gilt das als Aufgabe (der andere gewinnt).
create or replace function public.rpg_arena_cancel(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m public.rpg_arena_matches%rowtype; v_seite integer;
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id for update;
  if not found or v_uid is null or (v_m.host_id <> v_uid and v_m.guest_id is distinct from v_uid) then raise exception 'Diesen Kampf gibt es nicht.'; end if;
  if v_m.status in ('beendet', 'abgebrochen') then return public.rpg_arena_json(v_m, v_uid); end if;
  v_seite := case when v_m.host_id = v_uid then 1 else 2 end;
  if v_m.status = 'offen' then
    update public.rpg_arena_matches set status = 'abgebrochen', ended_at = now() where id = p_match_id returning * into v_m;
  elsif v_m.status = 'bereit' then
    -- noch nicht begonnen: ohne Wertung auflösen
    update public.rpg_arena_matches set status = 'abgebrochen', ended_at = now() where id = p_match_id returning * into v_m;
  else
    update public.rpg_arena_matches set status = 'beendet', sieger = 3 - v_seite, grund = 'aufgabe', ended_at = now() where id = p_match_id returning * into v_m;
    perform public.rpg_arena_belohnen(v_m, v_m.host_id); perform public.rpg_arena_belohnen(v_m, v_m.guest_id);
  end if;
  return public.rpg_arena_json(v_m, v_uid);
end;
$$;

-- Ergebnis melden. Gewertet wird, sobald beide Seiten denselben Sieger melden.
-- Ein Kampf zählt erst nach mindestens 2 Minuten (gegen abgesprochene Blitz-Ergebnisse).
create or replace function public.rpg_arena_report(p_match_id uuid, p_sieger integer, p_grund text, p_punkte jsonb default null, p_runden integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m public.rpg_arena_matches%rowtype; v_meldung jsonb;
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id for update;
  if not found or v_uid is null or (v_m.host_id <> v_uid and v_m.guest_id is distinct from v_uid) then raise exception 'Diesen Kampf gibt es nicht.'; end if;
  if v_m.status in ('beendet', 'abgebrochen') then return public.rpg_arena_json(v_m, v_uid); end if;
  if v_m.status <> 'laeuft' then raise exception 'Dieser Kampf läuft nicht.'; end if;
  if p_sieger not in (1, 2) or p_grund not in ('team', 'punkte') then raise exception 'Ungültige Meldung.'; end if;
  if pg_column_size(coalesce(p_punkte, '{}'::jsonb)) > 512 then raise exception 'Ungültige Meldung.'; end if;
  v_meldung := jsonb_build_object('sieger', p_sieger, 'grund', p_grund, 'punkte', p_punkte, 'runden', p_runden);
  if v_m.host_id = v_uid then update public.rpg_arena_matches set host_meldung = v_meldung where id = p_match_id returning * into v_m;
  else update public.rpg_arena_matches set guest_meldung = v_meldung where id = p_match_id returning * into v_m; end if;
  if v_m.host_meldung is not null and v_m.guest_meldung is not null then
    if (v_m.host_meldung->>'sieger') = (v_m.guest_meldung->>'sieger') and now() - v_m.started_at >= interval '2 minutes' then
      update public.rpg_arena_matches set status = 'beendet', sieger = p_sieger, grund = p_grund, punkte = p_punkte, runden = p_runden, ended_at = now() where id = p_match_id returning * into v_m;
      perform public.rpg_arena_belohnen(v_m, v_m.host_id); perform public.rpg_arena_belohnen(v_m, v_m.guest_id);
    else
      -- widersprüchliche Meldungen oder zu kurz: ohne Wertung beenden
      update public.rpg_arena_matches set status = 'abgebrochen', ended_at = now() where id = p_match_id returning * into v_m;
    end if;
  end if;
  return public.rpg_arena_json(v_m, v_uid);
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Ausführungsrechte
-- ---------------------------------------------------------------------
revoke all on function public.rpg_arena_team(uuid, text[]), public.rpg_arena_schnitt(jsonb), public.rpg_arena_xp(integer, integer, boolean),
  public.rpg_arena_json(public.rpg_arena_matches, uuid), public.rpg_arena_belohnen(public.rpg_arena_matches, uuid) from public, anon, authenticated;
revoke all on function public.rpg_arena_list(), public.rpg_my_wallet(), public.rpg_arena_create(text[]), public.rpg_arena_join(uuid, text[]), public.rpg_arena_get(uuid),
  public.rpg_arena_room(uuid, text), public.rpg_arena_cancel(uuid), public.rpg_arena_report(uuid, integer, text, jsonb, integer) from public, anon;
grant execute on function public.rpg_arena_list(), public.rpg_my_wallet(), public.rpg_arena_create(text[]), public.rpg_arena_join(uuid, text[]), public.rpg_arena_get(uuid),
  public.rpg_arena_room(uuid, text), public.rpg_arena_cancel(uuid), public.rpg_arena_report(uuid, integer, text, jsonb, integer) to authenticated;

commit;
