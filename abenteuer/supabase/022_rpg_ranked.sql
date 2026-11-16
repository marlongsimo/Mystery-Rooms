-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 022: Arena – Ranked (Season 0)
-- Setzt Migration 015/016 (Serverkampf, Spielarten), 017 (Ausstattung), 019/020 (Rechner-Gegner) voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent). Bitte UNVERÄNDERT ausführen.
--
-- NUR FÜR DAS RPG. Es wird nichts gelöscht, und KEINE vorhandene Funktion wird verändert.
--
-- Was diese Migration bringt:
--   • Saisons (rpg_ranked_seasons). Angelegt wird „Season 0“: Beginn jetzt, Dauer 6 Wochen – falls noch keine Saison läuft.
--   • Rangpunkte je Konto und Saison (rpg_ranked_players), beginnend bei 0. Je 100 Punkte eine Stufe:
--     Bronze III/II/I (0–299), Silber (300–599), Gold (600–899), Platin (900–1199), Meister III/II/I (ab 1200; Meister I ab 1400).
--   • Suche rpg_ranked_queue(): immer Duell, als Serverkampf. Zugeteilt wird nach Rang, nicht nach Heldenstufe:
--       – zuerst nur Gegner im selben Rang; hat eine der beiden Seiten länger als 25 Sekunden gesucht, auch einen Rang darüber/darunter;
--       – findet sich nach der eingestellten Wartezeit (Admin-Bereich, Rechner-Gegner) kein Mensch, springt ein Rechner-Gegner
--         im selben Rang ein – stärker als in den anderen Spielarten und mit dem Rang zunehmend.
--   • Wertung (rpg_ranked_werten, einmal je Kampf): gleicher Rang oder Rechner-Gegner: Sieg +25, Niederlage −15.
--     Ein Rang Unterschied: Der Höhere gewinnt +15 oder verliert −25, der Niedrigere gewinnt +35 oder verliert −5.
--     Punkte fallen nie unter 0. Gewertet wird, sobald der Kampf beendet ist und eine Seite ihr Ergebnis abruft –
--     die Funktionen für Kampfende und Aufgabe bleiben unberührt.
--   • rpg_ranked_status(): Saison, eigener Rang, Rangliste der besten 50, die eigenen letzten 5 Kämpfe.
--     rpg_ranked_result(Kampf): Punkte vorher/nachher für den Ergebnisbildschirm (Aufstieg, Abstieg).
--   • Belohnungen am Saisonende nach dem höchsten erreichten Rang (rpg_admin_ranked_end, nur Admins):
--     Bronze 150 · Silber 300 · Gold 500 · Platin 800 · Meister 1200 Seelensplitter, dazu Würfel und Rahmen des Rangs
--     (zehn neue Stücke in rpg_cosmetic_items, nicht käuflich). rpg_admin_ranked_start(Name, Tage) beginnt die nächste Saison.
--   • Der gewöhnliche Lohn eines Arena-Kampfs (Erfahrung, Seelensplitter, Tagesgrenze) gilt in Ranked wie in Normal.
--
-- Rückbau: 022_rpg_ranked_rueckbau.sql
-- =====================================================================
begin;

do $$ begin
  if to_regclass('public.rpg_arena_fights') is null or to_regprocedure('public.rpg_arena_queue(text)') is null then raise exception 'Migration 022 braucht Migration 015 und 016 (Arena-Serverkampf mit Spielarten).'; end if;
  if to_regprocedure('public.rpg_arena_bot(uuid, text)') is null or to_regprocedure('public.rpg_arena_bot_cfg()') is null then raise exception 'Migration 022 braucht Migration 019 und 020 (Rechner-Gegner mit Einstellungen).'; end if;
  if to_regclass('public.rpg_cosmetic_items') is null or to_regprocedure('public.rpg_look_von(uuid)') is null then raise exception 'Migration 022 braucht Migration 017 und 018 (Ausstattung).'; end if;
  if to_regprocedure('public.rpg_ist_admin()') is null then raise exception 'Migration 022 braucht die Admins aus Migration 006.'; end if;
end $$;

-- ---------------------------------------------------------------------
-- 1) Tabellen und Spalten
-- ---------------------------------------------------------------------
create table if not exists public.rpg_ranked_seasons (
  id            serial       primary key,
  name          text         not null,
  beginn        timestamptz  not null default now(),
  ende          timestamptz  not null,
  status        text         not null default 'laeuft' check (status in ('laeuft', 'beendet')),
  abgerechnet   timestamptz
);
create unique index if not exists rpg_ranked_seasons_eine on public.rpg_ranked_seasons (status) where status = 'laeuft';

create table if not exists public.rpg_ranked_players (
  season_id     integer      not null references public.rpg_ranked_seasons(id) on delete cascade,
  user_id       uuid         not null references auth.users(id) on delete cascade,
  punkte        integer      not null default 0 check (punkte >= 0),
  hoechst       integer      not null default 0,
  siege         integer      not null default 0,
  niederlagen   integer      not null default 0,
  belohnt       boolean      not null default false,
  updated_at    timestamptz  not null default now(),
  primary key (season_id, user_id)
);
create index if not exists rpg_ranked_players_liste on public.rpg_ranked_players (season_id, punkte desc, updated_at);

-- Ein Eintrag je Ranked-Kampf: Punkte beider Seiten vor dem Kampf, nach der Wertung die Änderung
create table if not exists public.rpg_ranked_matches (
  match_id      uuid         primary key references public.rpg_arena_matches(id) on delete cascade,
  season_id     integer      not null references public.rpg_ranked_seasons(id) on delete cascade,
  host_vor      integer      not null,
  guest_vor     integer      not null,           -- beim Rechner-Gegner: die Punkte des Spielers (gleicher Rang)
  weit          boolean      not null default false,  -- ein Rang Unterschied
  host_delta    integer,
  guest_delta   integer,
  gewertet      timestamptz,
  created_at    timestamptz  not null default now()
);
create index if not exists rpg_ranked_matches_zeit on public.rpg_ranked_matches (season_id, created_at desc);

alter table public.rpg_ranked_seasons enable row level security;
alter table public.rpg_ranked_players enable row level security;
alter table public.rpg_ranked_matches enable row level security;
revoke all on public.rpg_ranked_seasons, public.rpg_ranked_players, public.rpg_ranked_matches from anon, authenticated;

alter table public.rpg_arena_fights add column if not exists ranked boolean not null default false;
alter table public.rpg_arena_search_srv add column if not exists rang integer;
-- Die Suchliste kennt jetzt drei Arten: normal, arcade, ranked (die Prüfung an der Spalte wird erweitert)
do $$
declare c record;
begin
  for c in select con.conname from pg_constraint con join pg_class t on t.oid = con.conrelid join pg_namespace n on n.oid = t.relnamespace
           where n.nspname = 'public' and t.relname = 'rpg_arena_search_srv' and con.contype = 'c' and pg_get_constraintdef(con.oid) ~ '\mart\M' and pg_get_constraintdef(con.oid) !~ 'ranked' loop
    execute format('alter table public.rpg_arena_search_srv drop constraint %I', c.conname);
  end loop;
  if not exists (select 1 from pg_constraint con join pg_class t on t.oid = con.conrelid where t.relname = 'rpg_arena_search_srv' and con.conname = 'rpg_arena_search_srv_art_ranked') then
    alter table public.rpg_arena_search_srv add constraint rpg_arena_search_srv_art_ranked check (art in ('normal', 'arcade', 'ranked'));
  end if;
end $$;

-- Season 0: sechs Wochen ab jetzt – nur, wenn es noch gar keine Saison gibt
insert into public.rpg_ranked_seasons (name, beginn, ende) select 'Season 0', now(), now() + interval '42 days'
  where not exists (select 1 from public.rpg_ranked_seasons);

-- Würfel und Rahmen der fünf Ränge (nicht käuflich: aktiv = false; es gibt sie nur als Belohnung)
insert into public.rpg_cosmetic_items (id, art, preis, reihe, aktiv) values
  ('w_s0_bronze', 'wuerfel', 0, 201, false), ('w_s0_silber', 'wuerfel', 0, 202, false), ('w_s0_gold', 'wuerfel', 0, 203, false), ('w_s0_platin', 'wuerfel', 0, 204, false), ('w_s0_meister', 'wuerfel', 0, 205, false),
  ('r_s0_bronze', 'rahmen', 0, 211, false), ('r_s0_silber', 'rahmen', 0, 212, false), ('r_s0_gold', 'rahmen', 0, 213, false), ('r_s0_platin', 'rahmen', 0, 214, false), ('r_s0_meister', 'rahmen', 0, 215, false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2) Hilfsfunktionen (nicht direkt aufrufbar)
-- ---------------------------------------------------------------------
-- Rang aus Punkten: 0 = Bronze III … 14 = Meister I (je 100 Punkte eine Stufe)
create or replace function public.rpg_ranked_rang(p_punkte integer)
returns integer language sql immutable as $$ select least(14, greatest(0, coalesce(p_punkte, 0)) / 100); $$;

-- Die laufende Saison (null, wenn keine läuft oder ihre Zeit um ist)
create or replace function public.rpg_ranked_saison()
returns public.rpg_ranked_seasons language sql stable security definer set search_path = public as $$
  select s from public.rpg_ranked_seasons s where s.status = 'laeuft' and now() < s.ende order by s.id desc limit 1;
$$;

-- Wertung eines Kampfs (einmal; ohne Wirkung, solange der Kampf nicht beendet ist)
create or replace function public.rpg_ranked_werten(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_r public.rpg_ranked_matches%rowtype; v_m public.rpg_arena_matches%rowtype; v_hd integer; v_gd integer; v_hoeher integer;
begin
  select * into v_r from public.rpg_ranked_matches where match_id = p_match_id for update;
  if not found or v_r.gewertet is not null then return; end if;
  select * into v_m from public.rpg_arena_matches where id = p_match_id;
  if not found or v_m.status <> 'beendet' or v_m.sieger is null then return; end if;
  if not v_r.weit then
    v_hd := case when v_m.sieger = 1 then 25 else -15 end; v_gd := case when v_m.sieger = 2 then 25 else -15 end;
  else
    -- ein Rang Unterschied: Der Höhere gewinnt wenig und verliert viel, der Niedrigere umgekehrt
    v_hoeher := case when public.rpg_ranked_rang(v_r.host_vor) >= public.rpg_ranked_rang(v_r.guest_vor) then 1 else 2 end;
    v_hd := case when v_hoeher = 1 then (case when v_m.sieger = 1 then 15 else -25 end) else (case when v_m.sieger = 1 then 35 else -5 end) end;
    v_gd := case when v_hoeher = 2 then (case when v_m.sieger = 2 then 15 else -25 end) else (case when v_m.sieger = 2 then 35 else -5 end) end;
  end if;
  update public.rpg_ranked_players set punkte = greatest(0, punkte + v_hd), hoechst = greatest(hoechst, punkte + v_hd), siege = siege + (v_m.sieger = 1)::integer,
    niederlagen = niederlagen + (v_m.sieger <> 1)::integer, updated_at = now() where season_id = v_r.season_id and user_id = v_m.host_id;
  if v_m.guest_id is not null then
    update public.rpg_ranked_players set punkte = greatest(0, punkte + v_gd), hoechst = greatest(hoechst, punkte + v_gd), siege = siege + (v_m.sieger = 2)::integer,
      niederlagen = niederlagen + (v_m.sieger <> 2)::integer, updated_at = now() where season_id = v_r.season_id and user_id = v_m.guest_id;
  end if;
  update public.rpg_ranked_matches set host_delta = v_hd, guest_delta = v_gd, gewertet = now() where match_id = p_match_id;
end;
$$;

-- Alle beendeten, noch nicht gewerteten Kämpfe eines Kontos werten (z. B. nach einer Aufgabe, wenn niemand das Ergebnis abgerufen hat)
create or replace function public.rpg_ranked_nachholen(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  for v_id in select r.match_id from public.rpg_ranked_matches r join public.rpg_arena_matches m on m.id = r.match_id
              where r.gewertet is null and m.status = 'beendet' and (m.host_id = p_user or m.guest_id = p_user) loop
    perform public.rpg_ranked_werten(v_id);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Suche: Gegner im selben Rang; nach 25 Sekunden auch einen Rang daneben; sonst der Rechner-Gegner
-- ---------------------------------------------------------------------
create or replace function public.rpg_ranked_queue()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_helden text[]; v_team jsonb; v_schnitt numeric; v_id uuid; v_mein public.rpg_arena_matches%rowtype; v_json jsonb;
  v_s public.rpg_ranked_seasons%rowtype; v_punkte integer; v_rang integer; v_seit timestamptz; v_c public.rpg_arena_bot_settings%rowtype; v_m public.rpg_arena_matches%rowtype;
  v_gp integer; v_karten text[] := array['garten', 'turm', 'gruft', 'pilze', 'schacht', 'halle', 'siegel']; v_monster text[] := array['garten', 'kobolde', 'gruft'];
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Die Arena gibt es nur mit einem Spielerkonto.'; end if;
  v_s := public.rpg_ranked_saison();
  if v_s.id is null then raise exception 'Gerade läuft keine Ranked-Saison.'; end if;
  select team into v_helden from public.rpg_arena_squads where user_id = v_uid;
  if v_helden is null then raise exception 'Lege zuerst dein Team fest.'; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_arena_suche_srv'));
  perform public.rpg_ranked_nachholen(v_uid);
  select id into v_id from public.rpg_arena_matches
    where (host_id = v_uid or guest_id = v_uid) and status in ('bereit', 'laeuft') and created_at > now() - interval '2 hours' order by created_at desc limit 1;
  if v_id is not null then return public.rpg_arena_get(v_id); end if;

  insert into public.rpg_ranked_players (season_id, user_id) values (v_s.id, v_uid) on conflict do nothing;
  select punkte into v_punkte from public.rpg_ranked_players where season_id = v_s.id and user_id = v_uid;
  v_rang := public.rpg_ranked_rang(v_punkte);
  v_team := public.rpg_arena_team(v_uid, v_helden); v_schnitt := public.rpg_arena_schnitt(v_team);
  select m.* into v_mein from public.rpg_arena_matches m join public.rpg_arena_search_srv s on s.match_id = m.id
    where m.host_id = v_uid and m.status = 'offen' and s.art = 'ranked' order by m.created_at desc limit 1;
  if v_mein.id is not null then
    update public.rpg_arena_search_srv set seit = case when seen_at < now() - interval '20 seconds' then now() else seit end, seen_at = now(), rang = v_rang
      where match_id = v_mein.id returning seit into v_seit;
  end if;
  -- ein wartender Mensch: gleicher Rang – oder ein Rang daneben, wenn er oder ich schon länger als 25 Sekunden suche
  select m.id into v_id from public.rpg_arena_matches m join public.rpg_arena_search_srv s on s.match_id = m.id
    where m.status = 'offen' and m.host_id <> v_uid and s.art = 'ranked' and s.seen_at > now() - interval '20 seconds'
      and (s.rang = v_rang or (abs(s.rang - v_rang) = 1 and (s.seit < now() - interval '25 seconds' or (v_seit is not null and v_seit < now() - interval '25 seconds'))))
      and (v_mein.id is null or m.created_at < v_mein.created_at)
    order by abs(s.rang - v_rang), m.created_at limit 1;
  if v_id is not null then
    -- beitreten (wie rpg_arena_join, aber ohne Stufengrenze: In Ranked zählt nur der Rang)
    select * into v_m from public.rpg_arena_matches where id = v_id and status = 'offen' for update;
    if found then
      update public.rpg_arena_matches set status = 'abgebrochen', ended_at = now() where host_id = v_uid and status = 'offen';
      update public.rpg_arena_matches set status = 'bereit', guest_id = v_uid, guest_name = (select handle from public.rpg_profiles where user_id = v_uid),
        guest_team = v_team, guest_schnitt = v_schnitt,
        karte = v_karten[1 + floor(random() * cardinality(v_karten))::integer], begegnung = v_monster[1 + floor(random() * cardinality(v_monster))::integer],
        seed = floor(random() * 2000000000)::integer
        where id = v_id returning * into v_m;
      insert into public.rpg_arena_fights (match_id, modus, ranked) values (v_id, 'duell', true) on conflict (match_id) do nothing;
      insert into public.rpg_ranked_players (season_id, user_id) values (v_s.id, v_m.host_id) on conflict do nothing;
      select punkte into v_gp from public.rpg_ranked_players where season_id = v_s.id and user_id = v_m.host_id;
      insert into public.rpg_ranked_matches (match_id, season_id, host_vor, guest_vor, weit)
        values (v_id, v_s.id, v_gp, v_punkte, public.rpg_ranked_rang(v_gp) <> v_rang) on conflict (match_id) do nothing;
      delete from public.rpg_arena_search_srv where match_id = v_id;
      return public.rpg_arena_json(v_m, v_uid);
    end if;
  end if;
  if v_mein.id is not null then
    -- kein Mensch: nach der eingestellten Wartezeit der Rechner-Gegner – im selben Rang, stärker als sonst und mit dem Rang zunehmend
    v_c := public.rpg_arena_bot_cfg();
    if v_c.aktiv and v_seit is not null and v_seit < now() - make_interval(secs => greatest(5, v_c.wartezeit - 4 + abs(hashtext(v_mein.id::text)) % 9)) then
      if v_mein.host_team is distinct from v_team then update public.rpg_arena_matches set host_team = v_team, host_schnitt = v_schnitt where id = v_mein.id; end if;
      v_json := public.rpg_arena_bot(v_mein.id, 'normal');
      if v_json is not null then
        update public.rpg_arena_fights set ranked = true, bot = bot || jsonb_build_object('staerke', round((0.6 + 0.4 * v_rang / 14.0)::numeric, 2)) where match_id = v_mein.id;
        insert into public.rpg_ranked_matches (match_id, season_id, host_vor, guest_vor, weit) values (v_mein.id, v_s.id, v_punkte, v_punkte, false) on conflict (match_id) do nothing;
        return v_json;
      end if;
    end if;
    return public.rpg_arena_get(v_mein.id);
  end if;
  v_json := public.rpg_arena_create(v_helden);
  insert into public.rpg_arena_search_srv (match_id, user_id, art, rang) values ((v_json->>'id')::uuid, v_uid, 'ranked', v_rang)
    on conflict (match_id) do update set seen_at = now(), seit = now(), art = excluded.art, rang = excluded.rang;
  return v_json;
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Für das Spiel: Übersicht (Saison, Rang, Rangliste, letzte Kämpfe) und Ergebnis eines Kampfs
-- ---------------------------------------------------------------------
create or replace function public.rpg_ranked_status()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_s public.rpg_ranked_seasons%rowtype; v_p public.rpg_ranked_players%rowtype; v_platz integer;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false); end if;
  perform public.rpg_ranked_nachholen(v_uid);
  -- die laufende Saison, sonst die zuletzt beendete (damit Rangliste und Ergebnis sichtbar bleiben)
  select * into v_s from public.rpg_ranked_seasons order by (status = 'laeuft') desc, id desc limit 1;
  if not found then return jsonb_build_object('konto', true, 'saison', null); end if;
  select * into v_p from public.rpg_ranked_players where season_id = v_s.id and user_id = v_uid;
  if found and v_p.siege + v_p.niederlagen > 0 then
    select 1 + count(*) into v_platz from public.rpg_ranked_players o where o.season_id = v_s.id and o.siege + o.niederlagen > 0
      and (o.punkte > v_p.punkte or (o.punkte = v_p.punkte and o.updated_at < v_p.updated_at));
  end if;
  return jsonb_build_object('konto', true,
    'saison', jsonb_build_object('id', v_s.id, 'name', v_s.name, 'beginn', v_s.beginn, 'ende', v_s.ende, 'laeuft', v_s.status = 'laeuft' and now() < v_s.ende,
      'jetzt', (extract(epoch from clock_timestamp()) * 1000)::bigint),
    'ich', jsonb_build_object('punkte', coalesce(v_p.punkte, 0), 'rang', public.rpg_ranked_rang(coalesce(v_p.punkte, 0)), 'hoechst', coalesce(v_p.hoechst, 0),
      'siege', coalesce(v_p.siege, 0), 'niederlagen', coalesce(v_p.niederlagen, 0), 'platz', v_platz),
    'rangliste', coalesce((select jsonb_agg(z order by (z->>'platz')::integer) from (
      select jsonb_build_object('platz', row_number() over (order by o.punkte desc, o.updated_at), 'name', pr.handle, 'avatar', pr.avatar_key,
        'rahmen', (select e.rahmen from public.rpg_cosmetic_equipped e where e.user_id = o.user_id), 'punkte', o.punkte, 'rang', public.rpg_ranked_rang(o.punkte),
        'siege', o.siege, 'niederlagen', o.niederlagen, 'ich', o.user_id = v_uid) as z
      from public.rpg_ranked_players o join public.rpg_profiles pr on pr.user_id = o.user_id
      where o.season_id = v_s.id and o.siege + o.niederlagen > 0 order by o.punkte desc, o.updated_at limit 50) q), '[]'::jsonb),
    'chronik', coalesce((select jsonb_agg(z) from (
      select jsonb_build_object('gegner', case when m.host_id = v_uid then m.guest_name else m.host_name end, 'sieg', m.sieger = case when m.host_id = v_uid then 1 else 2 end,
        'grund', m.grund, 'runden', m.runden, 'delta', case when m.host_id = v_uid then r.host_delta else r.guest_delta end,
        'vor', case when m.host_id = v_uid then r.host_vor else r.guest_vor end, 'wann', coalesce(m.ended_at, m.created_at),
        'team', case when m.host_id = v_uid then m.host_team else m.guest_team end, 'gegner_team', case when m.host_id = v_uid then m.guest_team else m.host_team end) as z
      from public.rpg_ranked_matches r join public.rpg_arena_matches m on m.id = r.match_id
      where r.gewertet is not null and (m.host_id = v_uid or m.guest_id = v_uid) order by r.gewertet desc limit 5) q), '[]'::jsonb),
    'belohnungen', jsonb_build_array(150, 300, 500, 800, 1200));
end;
$$;

-- Ergebnis eines Kampfs für den Teilnehmer: wertet, falls noch nicht geschehen. {ranked: false}, wenn es kein Ranked-Kampf ist.
create or replace function public.rpg_ranked_result(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m public.rpg_arena_matches%rowtype; v_r public.rpg_ranked_matches%rowtype; v_vor integer; v_d integer; v_nach integer;
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id;
  if not found or v_uid is null or (v_m.host_id <> v_uid and v_m.guest_id is distinct from v_uid) then raise exception 'Diesen Kampf gibt es nicht.'; end if;
  if not exists (select 1 from public.rpg_ranked_matches where match_id = p_match_id) then return jsonb_build_object('ranked', false); end if;
  perform public.rpg_ranked_werten(p_match_id);
  select * into v_r from public.rpg_ranked_matches where match_id = p_match_id;
  v_vor := case when v_m.host_id = v_uid then v_r.host_vor else v_r.guest_vor end;
  v_d := case when v_m.host_id = v_uid then v_r.host_delta else v_r.guest_delta end;
  v_nach := greatest(0, v_vor + coalesce(v_d, 0));
  return jsonb_build_object('ranked', true, 'gewertet', v_r.gewertet is not null, 'vor', v_vor, 'delta', v_d, 'nach', v_nach,
    'rang_vor', public.rpg_ranked_rang(v_vor), 'rang_nach', public.rpg_ranked_rang(v_nach), 'weit', v_r.weit);
end;
$$;

-- ---------------------------------------------------------------------
-- 5) Für Admins: Saison beenden (Belohnungen nach dem höchsten erreichten Rang) und die nächste beginnen
-- ---------------------------------------------------------------------
create or replace function public.rpg_admin_ranked()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins sehen die Saisons.'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'beginn', s.beginn, 'ende', s.ende, 'status', s.status, 'abgerechnet', s.abgerechnet,
      'spieler', (select count(*) from public.rpg_ranked_players p where p.season_id = s.id and p.siege + p.niederlagen > 0),
      'kaempfe', (select count(*) from public.rpg_ranked_matches r where r.season_id = s.id and r.gewertet is not null),
      'gegen_bot', (select count(*) from public.rpg_ranked_matches r join public.rpg_arena_matches m on m.id = r.match_id where r.season_id = s.id and r.gewertet is not null and m.guest_id is null),
      'je_rang', (select coalesce(jsonb_object_agg(t, n), '{}'::jsonb) from (select (public.rpg_ranked_rang(p.punkte) / 3)::text as t, count(*) n from public.rpg_ranked_players p where p.season_id = s.id and p.siege + p.niederlagen > 0 group by 1) q))
    order by s.id desc) from public.rpg_ranked_seasons s), '[]'::jsonb);
end;
$$;

create or replace function public.rpg_admin_ranked_end()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_s public.rpg_ranked_seasons%rowtype; v_p record; v_t integer; v_n integer := 0; v_sum integer := 0;
  v_lohn integer[] := array[150, 300, 500, 800, 1200]; v_name text[] := array['bronze', 'silber', 'gold', 'platin', 'meister'];
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins können eine Saison beenden.'; end if;
  select * into v_s from public.rpg_ranked_seasons where status = 'laeuft' order by id desc limit 1 for update;
  if not found then raise exception 'Es läuft keine Saison.'; end if;
  -- offene Wertungen nachholen, dann nach dem höchsten erreichten Rang belohnen (einmal je Konto)
  perform public.rpg_ranked_werten(r.match_id) from public.rpg_ranked_matches r join public.rpg_arena_matches m on m.id = r.match_id where r.season_id = v_s.id and r.gewertet is null and m.status = 'beendet';
  for v_p in select * from public.rpg_ranked_players where season_id = v_s.id and siege + niederlagen > 0 and not belohnt loop
    v_t := 1 + public.rpg_ranked_rang(v_p.hoechst) / 3;
    insert into public.rpg_wallet (user_id, betrag) values (v_p.user_id, v_lohn[v_t])
      on conflict (user_id) do update set betrag = public.rpg_wallet.betrag + excluded.betrag, updated_at = now();
    insert into public.rpg_cosmetic_owned (user_id, item_id, preis) values (v_p.user_id, 'w_s0_' || v_name[v_t], 0), (v_p.user_id, 'r_s0_' || v_name[v_t], 0) on conflict do nothing;
    update public.rpg_ranked_players set belohnt = true where season_id = v_s.id and user_id = v_p.user_id;
    v_n := v_n + 1; v_sum := v_sum + v_lohn[v_t];
  end loop;
  update public.rpg_ranked_seasons set status = 'beendet', abgerechnet = now(), ende = least(ende, now()) where id = v_s.id;
  delete from public.rpg_arena_search_srv where art = 'ranked';
  return jsonb_build_object('saison', v_s.name, 'belohnt', v_n, 'seelensplitter', v_sum);
end;
$$;

create or replace function public.rpg_admin_ranked_start(p_name text, p_tage integer default 42)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id integer;
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins können eine Saison beginnen.'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Bitte einen Namen angeben.'; end if;
  if p_tage is null or p_tage not between 1 and 180 then raise exception 'Eine Saison dauert 1 bis 180 Tage.'; end if;
  if exists (select 1 from public.rpg_ranked_seasons where status = 'laeuft') then raise exception 'Es läuft noch eine Saison. Beende sie zuerst.'; end if;
  insert into public.rpg_ranked_seasons (name, beginn, ende) values (left(trim(p_name), 40), now(), now() + make_interval(days => p_tage)) returning id into v_id;
  return jsonb_build_object('id', v_id, 'name', left(trim(p_name), 40));
end;
$$;

-- ---------------------------------------------------------------------
-- 6) Ausführungsrechte
-- ---------------------------------------------------------------------
revoke all on function public.rpg_ranked_rang(integer), public.rpg_ranked_saison(), public.rpg_ranked_werten(uuid), public.rpg_ranked_nachholen(uuid) from public, anon, authenticated;
revoke all on function public.rpg_ranked_queue(), public.rpg_ranked_status(), public.rpg_ranked_result(uuid), public.rpg_admin_ranked(), public.rpg_admin_ranked_end(), public.rpg_admin_ranked_start(text, integer) from public, anon;
grant execute on function public.rpg_ranked_queue(), public.rpg_ranked_status(), public.rpg_ranked_result(uuid), public.rpg_admin_ranked(), public.rpg_admin_ranked_end(), public.rpg_admin_ranked_start(text, integer) to authenticated;

commit;
