-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 020: Admin-Bereich – Rechner-Gegner einstellen, Kampfstatistik
-- Setzt Migration 019 (Rechner-Gegner) und 006 (Admins: rpg_ist_admin) voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent). Bitte UNVERÄNDERT ausführen.
-- Die Spielstärke wirkt erst, wenn auch die Edge Function „arena“ in der aktuellen Fassung ausgerollt ist
-- (abenteuer/supabase/functions/arena/index.ts). Die Reihenfolge ist egal: Ohne Angabe spielt der Gegner wie bisher.
--
-- NUR FÜR DAS RPG. Es wird nichts gelöscht.
--
-- Was diese Migration bringt:
--   • Einstellungen des Rechner-Gegners (eine Zeile, Tabelle rpg_arena_bot_settings), änderbar nur von Admins im Spiel:
--       aktiv         – Rechner-Gegner ein/aus (aus: Die Suche wartet weiter auf einen Menschen)
--       wartezeit     – Sekunden, bis er einspringt (10 bis 180; je Suche bis zu 4 Sekunden kürzer oder länger)
--       staerke_von/bis – Spielstärke 0 bis 1 (1 = so gut er kann); je Gegner wird ein Wert aus dem Bereich gelost
--       stufe_von/bis – Verschiebung seiner Helden gegenüber den Stufen des Spielers (−3 bis +2)
--     Voreinstellung = bisheriges Verhalten: aktiv, 30 Sekunden, Stärke 1 bis 1, Stufen −1 bis +1.
--   • rpg_admin_bot(): Einstellungen und Statistik der Kämpfe gegen den Rechner-Gegner (nur Admins).
--     rpg_admin_bot_set(…): Einstellungen ändern (nur Admins).
--   • rpg_arena_bot, rpg_arena_queue und rpg_arena_srv_load (Fassungen aus 019) lesen die Einstellungen bzw. reichen die
--     Spielstärke an die Edge Function weiter. (Wer 019 später noch einmal ausführt, führt danach auch 020 noch einmal aus.)
--   • rpg_arena_stats (Arena-Auswertung für Admins, bisher Migration 010) wird neu gesetzt: Der Modus kommt vom Kampf
--     (seit Migration 016 steht er dort) statt aus der Zufallszahl, und Kämpfe gegen Menschen, gegen den Rechner-Gegner
--     und private Kämpfe werden getrennt gezählt.
--
-- Rückbau: 020_rpg_admin_bereich_rueckbau.sql
-- =====================================================================
begin;

do $$ begin
  if to_regprocedure('public.rpg_arena_bot(uuid, text)') is null or not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'rpg_arena_fights' and column_name = 'bot') then
    raise exception 'Migration 020 braucht Migration 019 (Rechner-Gegner). Bitte zuerst 019 ausführen.';
  end if;
  if to_regprocedure('public.rpg_ist_admin()') is null then raise exception 'Migration 020 braucht die Admins aus Migration 006 (rpg_ist_admin).'; end if;
end $$;

-- ---------------------------------------------------------------------
-- 1) Einstellungen (genau eine Zeile; nur über die Funktionen erreichbar)
-- ---------------------------------------------------------------------
create table if not exists public.rpg_arena_bot_settings (
  id           boolean      primary key default true check (id),
  aktiv        boolean      not null default true,
  wartezeit    integer      not null default 30 check (wartezeit between 10 and 180),
  staerke_von  numeric(3,2) not null default 1 check (staerke_von between 0 and 1),
  staerke_bis  numeric(3,2) not null default 1 check (staerke_bis between 0 and 1),
  stufe_von    integer      not null default -1 check (stufe_von between -3 and 2),
  stufe_bis    integer      not null default 1 check (stufe_bis between -3 and 2),
  updated_at   timestamptz  not null default now(),
  updated_by   uuid         references auth.users(id) on delete set null,
  check (staerke_von <= staerke_bis and stufe_von <= stufe_bis)
);
insert into public.rpg_arena_bot_settings (id) values (true) on conflict (id) do nothing;
alter table public.rpg_arena_bot_settings enable row level security;
revoke all on public.rpg_arena_bot_settings from anon, authenticated;

-- Die geltenden Einstellungen (nicht direkt aufrufbar)
create or replace function public.rpg_arena_bot_cfg()
returns public.rpg_arena_bot_settings language sql stable security definer set search_path = public as $$
  select coalesce((select s from public.rpg_arena_bot_settings s where s.id), row(true, true, 30, 1, 1, -1, 1, now(), null)::public.rpg_arena_bot_settings);
$$;

-- ---------------------------------------------------------------------
-- 2) Rechner-Gegner, Suche und Laden für die Edge Function (Fassungen aus Migration 019, ergänzt um die Einstellungen)
-- ---------------------------------------------------------------------
create or replace function public.rpg_arena_bot(p_match_id uuid, p_art text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_m public.rpg_arena_matches%rowtype; v_helden text[]; v_stufen integer[]; v_team jsonb := '[]'::jsonb; v_name text; v_i integer; v_rahmen text; v_c public.rpg_arena_bot_settings%rowtype; v_staerke numeric;
  v_karten text[] := array['garten', 'turm', 'gruft', 'pilze', 'schacht', 'halle', 'siegel']; v_monster text[] := array['garten', 'kobolde', 'gruft'];
  v_arcade text[] := array['arena', 'koenig', 'horde'];
  v_stamm text[] := array['Mara', 'Jonas', 'Finn', 'Lukas', 'Nele', 'Timo', 'Svenja', 'Kilian', 'Ronja', 'Malte', 'Darius', 'Elif', 'Noah', 'Jule', 'Paul', 'Leon', 'Mika', 'Lena', 'Tobi', 'Hannes',
    'Basti', 'Flo', 'Chrissi', 'Maxi', 'Steffi', 'Domi', 'Vroni', 'Kathi', 'Benni', 'Sina', 'Marv', 'Nico', 'Lea', 'Jannik', 'Meike', 'Ole', 'Tessa', 'Fabi', 'Lars', 'Anni',
    'Schattenfuchs', 'Eisenherz', 'Nachtfalke', 'Runenwolf', 'Sturmkind', 'Mondklinge', 'Grimbart', 'Feuerkelch', 'Rabenfeder', 'Wolfsblut', 'Nebelwanderer', 'Dornenritter', 'Aschenbrand', 'Silberzunge', 'Donnerkeil',
    'Kruemel', 'Zwergenbier', 'Wuerfelgott', 'Krit20', 'Pixelritter', 'Kartoffelkoenig', 'Pechvogel', 'Lootgoblin', 'Wuerfelpech', 'Heilerin', 'Tankwart', 'Keksdose', 'Brotzeit', 'Feierabend', 'Schnitzel',
    'DerLange', 'DieChefin', 'Onkel_Tom', 'HerrVorragend', 'FrauHolle', 'Kapitaen', 'Opa_Heinz', 'Sir_Lanzelot', 'Lady_Mo', 'Der_Micha'];
begin
  v_c := public.rpg_arena_bot_cfg();
  select * into v_m from public.rpg_arena_matches where id = p_match_id and status = 'offen' for update;
  if not found then return null; end if;
  select array_agg(hero_id) into v_helden from (select hero_id from public.rpg_hero_catalog order by random() limit 3) t;
  if v_helden is null or cardinality(v_helden) <> 3 then return null; end if;
  -- Stufen: die des Spielers in zufälliger Reihenfolge, je Held verschoben um einen Wert aus den Einstellungen (stufe_von bis stufe_bis); 1 bis 10
  select array_agg(greatest(1, least(10, (e->>'stufe')::integer + v_c.stufe_von + floor(random() * (v_c.stufe_bis - v_c.stufe_von + 1))::integer)) order by random()) into v_stufen from jsonb_array_elements(v_m.host_team) e;
  if v_stufen is null or cardinality(v_stufen) <> 3 then return null; end if;
  for v_i in 1..3 loop v_team := v_team || jsonb_build_object('held', v_helden[v_i], 'stufe', v_stufen[v_i]); end loop;
  -- Name: wie ein Benutzername; keiner, den es als Konto gibt, und nicht der des Spielers
  for v_i in 1..12 loop
    v_name := v_stamm[1 + floor(random() * cardinality(v_stamm))::integer];
    if random() < 0.55 then
      v_name := v_name || (case when random() < 0.25 then '_' else '' end)
        || (case floor(random() * 4)::integer when 0 then lpad(floor(random() * 100)::integer::text, 2, '0') when 1 then lpad(((84 + floor(random() * 22)::integer) % 100)::text, 2, '0')
                                                when 2 then (1 + floor(random() * 9)::integer)::text else (10 + floor(random() * 990)::integer)::text end);
    end if;
    v_name := left(v_name, 20);
    exit when lower(v_name) <> lower(v_m.host_name) and not exists (select 1 from public.rpg_profiles where lower(handle) = lower(v_name));
    v_name := null;
  end loop;
  if v_name is null then return null; end if;
  -- Profilbild: ein Held; Rahmen: bei etwa jedem dritten Gegner einer aus dem Katalog
  if random() < 0.35 then select id into v_rahmen from public.rpg_cosmetic_items where art = 'rahmen' and aktiv order by random() limit 1; end if;
  update public.rpg_arena_matches set status = 'bereit', guest_id = null, guest_name = v_name, guest_team = v_team, guest_schnitt = public.rpg_arena_schnitt(v_team),
    karte = v_karten[1 + floor(random() * cardinality(v_karten))::integer], begegnung = v_monster[1 + floor(random() * cardinality(v_monster))::integer],
    seed = floor(random() * 2000000000)::integer
    where id = p_match_id returning * into v_m;
  -- Spielstärke: je Gegner aus dem eingestellten Bereich gelost und am Kampf vermerkt (die Edge Function spielt danach)
  v_staerke := round((v_c.staerke_von + random() * (v_c.staerke_bis - v_c.staerke_von))::numeric, 2);
  insert into public.rpg_arena_fights (match_id, modus, bot)
    values (p_match_id, case when p_art = 'normal' then 'duell' else v_arcade[1 + floor(random() * cardinality(v_arcade))::integer] end,
            jsonb_build_object('avatar', (select hero_id from public.rpg_hero_catalog order by random() limit 1), 'rahmen', v_rahmen, 'staerke', v_staerke))
    on conflict (match_id) do nothing;
  delete from public.rpg_arena_search_srv where match_id = p_match_id;
  return public.rpg_arena_json(v_m, v_m.host_id);
end;
$$;

create or replace function public.rpg_arena_queue(p_art text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_helden text[]; v_team jsonb; v_schnitt numeric; v_id uuid; v_mein public.rpg_arena_matches%rowtype; v_json jsonb;
  v_arcade text[] := array['arena', 'koenig', 'horde']; v_seit timestamptz; v_c public.rpg_arena_bot_settings%rowtype;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Die Arena gibt es nur mit einem Spielerkonto.'; end if;
  if p_art is null or p_art not in ('normal', 'arcade') then raise exception 'Unbekannte Spielart.'; end if;
  select team into v_helden from public.rpg_arena_squads where user_id = v_uid;
  if v_helden is null then raise exception 'Lege zuerst dein Team fest.'; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_arena_suche_srv'));
  select id into v_id from public.rpg_arena_matches
    where (host_id = v_uid or guest_id = v_uid) and status in ('bereit', 'laeuft') and created_at > now() - interval '2 hours' order by created_at desc limit 1;
  if v_id is not null then return public.rpg_arena_get(v_id); end if;

  v_team := public.rpg_arena_team(v_uid, v_helden); v_schnitt := public.rpg_arena_schnitt(v_team);
  select m.* into v_mein from public.rpg_arena_matches m join public.rpg_arena_search_srv s on s.match_id = m.id
    where m.host_id = v_uid and m.status = 'offen' and s.art = p_art order by m.created_at desc limit 1;
  select m.id into v_id from public.rpg_arena_matches m join public.rpg_arena_search_srv s on s.match_id = m.id
    where m.status = 'offen' and m.host_id <> v_uid and s.art = p_art and s.seen_at > now() - interval '20 seconds'
      and abs(m.host_schnitt - v_schnitt) <= 1.0 and (v_mein.id is null or m.created_at < v_mein.created_at)
    order by m.created_at limit 1;
  if v_id is not null then
    v_json := public.rpg_arena_join(v_id, v_helden);
    insert into public.rpg_arena_fights (match_id, modus)
      values (v_id, case when p_art = 'normal' then 'duell' else v_arcade[1 + floor(random() * cardinality(v_arcade))::integer] end)
      on conflict (match_id) do nothing;
    return v_json;
  end if;
  if v_mein.id is not null then
    -- Lebenszeichen; war die Suche unterbrochen (länger als 20 Sekunden kein Lebenszeichen), beginnt die Wartezeit neu
    update public.rpg_arena_search_srv set seit = case when seen_at < now() - interval '20 seconds' then now() else seit end, seen_at = now()
      where match_id = v_mein.id returning seit into v_seit;
    -- Eingestellte Wartezeit (je Suche bis zu 4 Sekunden kürzer oder länger) vorbei und kein Mensch gefunden: Der Server stellt den Gegner –
    -- wenn der Rechner-Gegner eingeschaltet ist.
    v_c := public.rpg_arena_bot_cfg();
    -- Die Aufstellung am Kampf kann älter sein als das gespeicherte Team – dann gilt die aktuelle.
    if v_c.aktiv and v_seit is not null and v_seit < now() - make_interval(secs => greatest(5, v_c.wartezeit - 4 + abs(hashtext(v_mein.id::text)) % 9)) then
      if v_mein.host_team is distinct from v_team then
        update public.rpg_arena_matches set host_team = v_team, host_schnitt = v_schnitt where id = v_mein.id;
      end if;
      v_json := public.rpg_arena_bot(v_mein.id, p_art);
      if v_json is not null then return v_json; end if;
    end if;
    return public.rpg_arena_get(v_mein.id);
  end if;
  v_json := public.rpg_arena_create(v_helden);
  insert into public.rpg_arena_search_srv (match_id, user_id, art) values ((v_json->>'id')::uuid, v_uid, p_art)
    on conflict (match_id) do update set seen_at = now(), seit = now(), art = excluded.art;
  delete from public.rpg_arena_search_srv where seen_at < now() - interval '1 day';
  return v_json;
end;
$$;

create or replace function public.rpg_arena_srv_load(p_match_id uuid, p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('seite', case when m.host_id = p_user then 1 else 2 end,
    'kampf', jsonb_build_object('v', f.v, 'st', f.st, 'anf1', f.anf1, 'anf2', f.anf2, 'beginn', (extract(epoch from f.beginn) * 1000)::bigint),
    'match', jsonb_build_object('id', m.id, 'status', m.status, 'host_name', m.host_name, 'guest_name', m.guest_name,
      'host_team', m.host_team, 'guest_team', m.guest_team, 'karte', m.karte, 'begegnung', m.begegnung, 'seed', m.seed, 'modus', f.modus,
      'bot', f.bot is not null and m.guest_id is null,
      'staerke', case when f.bot is not null and (f.bot->>'staerke') ~ '^[0-9.]+$' then (f.bot->>'staerke')::numeric else null end,
      'kampfstufe', round(greatest(m.host_schnitt, coalesce(m.guest_schnitt, m.host_schnitt)))::integer))
  from public.rpg_arena_fights f join public.rpg_arena_matches m on m.id = f.match_id
  where f.match_id = p_match_id and p_user is not null and (m.host_id = p_user or m.guest_id = p_user);
$$;

-- ---------------------------------------------------------------------
-- 3) Für Admins im Spiel: Einstellungen lesen und ändern, Statistik der Kämpfe gegen den Rechner-Gegner
-- ---------------------------------------------------------------------
create or replace function public.rpg_admin_bot()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_c public.rpg_arena_bot_settings%rowtype; v jsonb;
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins sehen die Einstellungen des Rechner-Gegners.'; end if;
  v_c := public.rpg_arena_bot_cfg();
  with k as (
    select m.id, m.status, m.sieger, m.grund, m.runden, m.host_name, m.guest_name, m.host_schnitt, m.guest_schnitt, m.created_at, f.modus,
      case when (f.bot->>'staerke') ~ '^[0-9.]+$' then (f.bot->>'staerke')::numeric else null end as staerke
    from public.rpg_arena_matches m join public.rpg_arena_fights f on f.match_id = m.id
    where f.bot is not null and m.guest_id is null
  ), b as (select * from k where status = 'beendet' and sieger is not null)
  select jsonb_build_object(
    'einstellungen', jsonb_build_object('aktiv', v_c.aktiv, 'wartezeit', v_c.wartezeit, 'staerke_von', v_c.staerke_von, 'staerke_bis', v_c.staerke_bis,
      'stufe_von', v_c.stufe_von, 'stufe_bis', v_c.stufe_bis, 'geaendert', v_c.updated_at, 'von', (select handle from public.rpg_profiles where user_id = v_c.updated_by)),
    'statistik', jsonb_build_object(
      'kaempfe', (select count(*) from b), 'siege_spieler', (select count(*) from b where sieger = 1), 'aufgaben', (select count(*) from b where grund = 'aufgabe'),
      'laufend', (select count(*) from k where status in ('bereit', 'laeuft')), 'abgebrochen', (select count(*) from k where status = 'abgebrochen'),
      'runden', (select round(avg(runden)::numeric, 1) from b where grund <> 'aufgabe'),
      'heute', (select count(*) from k where created_at > now() - interval '24 hours'),
      -- nach Spielstärke: unter 0,4 · 0,4 bis unter 0,7 · ab 0,7 · ohne Angabe (vor dieser Migration: volle Stärke)
      'nach_staerke', coalesce((select jsonb_agg(z order by z->>'stufe') from (
        select jsonb_build_object('stufe', g, 'kaempfe', count(*), 'siege_spieler', count(*) filter (where sieger = 1), 'runden', round(avg(runden) filter (where grund <> 'aufgabe')::numeric, 1)) as z
        from (select b.*, case when staerke is null then '4 ohne Angabe' when staerke < 0.4 then '1 schwach' when staerke < 0.7 then '2 mittel' else '3 stark' end as g from b) q group by g) q2), '[]'::jsonb),
      'nach_modus', coalesce((select jsonb_agg(z order by z->>'modus') from (
        select jsonb_build_object('modus', coalesce(modus, '?'), 'kaempfe', count(*), 'siege_spieler', count(*) filter (where sieger = 1)) as z from b group by modus) q), '[]'::jsonb),
      'letzte', coalesce((select jsonb_agg(z) from (
        select jsonb_build_object('spieler', host_name, 'gegner', guest_name, 'modus', modus, 'status', status, 'sieger', sieger, 'grund', grund, 'runden', runden, 'staerke', staerke,
          'stufe_spieler', host_schnitt, 'stufe_gegner', guest_schnitt, 'wann', created_at) as z
        from k order by created_at desc limit 15) q), '[]'::jsonb))
  ) into v;
  return v;
end;
$$;

create or replace function public.rpg_admin_bot_set(p_aktiv boolean, p_wartezeit integer, p_staerke_von numeric, p_staerke_bis numeric, p_stufe_von integer, p_stufe_bis integer)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins können den Rechner-Gegner einstellen.'; end if;
  if p_aktiv is null or p_wartezeit is null or p_staerke_von is null or p_staerke_bis is null or p_stufe_von is null or p_stufe_bis is null then raise exception 'Bitte alle Werte angeben.'; end if;
  if p_wartezeit not between 10 and 180 then raise exception 'Die Wartezeit muss zwischen 10 und 180 Sekunden liegen.'; end if;
  if p_staerke_von not between 0 and 1 or p_staerke_bis not between 0 and 1 or p_staerke_von > p_staerke_bis then raise exception 'Die Spielstärke muss zwischen 0 und 100 Prozent liegen, „von“ nicht über „bis“.'; end if;
  if p_stufe_von not between -3 and 2 or p_stufe_bis not between -3 and 2 or p_stufe_von > p_stufe_bis then raise exception 'Die Stufenverschiebung muss zwischen −3 und +2 liegen, „von“ nicht über „bis“.'; end if;
  insert into public.rpg_arena_bot_settings (id, aktiv, wartezeit, staerke_von, staerke_bis, stufe_von, stufe_bis, updated_at, updated_by)
    values (true, p_aktiv, p_wartezeit, round(p_staerke_von, 2), round(p_staerke_bis, 2), p_stufe_von, p_stufe_bis, now(), auth.uid())
    on conflict (id) do update set aktiv = excluded.aktiv, wartezeit = excluded.wartezeit, staerke_von = excluded.staerke_von, staerke_bis = excluded.staerke_bis,
      stufe_von = excluded.stufe_von, stufe_bis = excluded.stufe_bis, updated_at = now(), updated_by = excluded.updated_by;
  return public.rpg_admin_bot();
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Arena-Auswertung für Admins (bisher Migration 010): Modus vom Kampf, getrennt nach Mensch, Rechner-Gegner, privat
-- ---------------------------------------------------------------------
create or replace function public.rpg_arena_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins sehen die Auswertung.'; end if;
  with m as (
    select a.id, coalesce(f.modus, (array['arena', 'koenig', 'horde', 'duell'])[1 + (abs(coalesce(a.seed, 0)::bigint) % 4)::integer]) as modus,
      a.sieger, a.grund, a.runden, a.host_team, a.guest_team, a.karte, extract(epoch from (a.ended_at - a.started_at)) as dauer,
      (f.bot is not null and a.guest_id is null) as bot, coalesce(f.privat, false) as privat
    from public.rpg_arena_matches a left join public.rpg_arena_fights f on f.match_id = a.id
    where a.status = 'beendet' and a.sieger is not null and a.guest_team is not null
  ), e as (
    select m.id, m.modus, 1 as seite, m.sieger = 1 as sieg, x->>'held' as held, (x->>'stufe')::integer as stufe from m, jsonb_array_elements(m.host_team) x
    union all
    select m.id, m.modus, 2, m.sieger = 2, x->>'held', (x->>'stufe')::integer from m, jsonb_array_elements(m.guest_team) x
  ), t as (
    select id, seite, bool_or(sieg) as sieg, array_agg(held order by held) as team from e group by id, seite
  )
  select jsonb_build_object(
    'kaempfe', (select count(*) from m),
    'gegen_mensch', (select count(*) from m where not bot and not privat), 'gegen_bot', (select count(*) from m where bot), 'privat', (select count(*) from m where privat),
    'bot_siege_spieler', (select count(*) from m where bot and sieger = 1),
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
-- 5) Ausführungsrechte
-- ---------------------------------------------------------------------
revoke all on function public.rpg_arena_bot(uuid, text), public.rpg_arena_bot_cfg(), public.rpg_arena_srv_load(uuid, uuid) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then grant execute on function public.rpg_arena_srv_load(uuid, uuid) to service_role; end if;
end $$;
revoke all on function public.rpg_arena_queue(text), public.rpg_admin_bot(), public.rpg_admin_bot_set(boolean, integer, numeric, numeric, integer, integer), public.rpg_arena_stats() from public, anon;
grant execute on function public.rpg_arena_queue(text), public.rpg_admin_bot(), public.rpg_admin_bot_set(boolean, integer, numeric, numeric, integer, integer), public.rpg_arena_stats() to authenticated;

commit;
