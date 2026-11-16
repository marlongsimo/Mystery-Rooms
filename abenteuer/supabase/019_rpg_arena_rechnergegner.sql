-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 019: Arena – Rechner-Gegner nach etwa 30 Sekunden Suche
-- Setzt Migration 015 (Serverkampf), 016 (Spielarten) und 018 (Profilrahmen sichtbar) voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent). Bitte UNVERÄNDERT ausführen.
-- Danach die Edge Function „arena“ neu ausrollen (abenteuer/supabase/functions/arena/index.ts) – sie spielt den Gegner.
--
-- NUR FÜR DAS RPG. Es wird nichts gelöscht; kein Konto wird angelegt (auth.users bleibt unberührt).
--
-- Was diese Migration bringt:
--   • Findet die Suche (Normal oder Arcade) etwa 30 Sekunden lang keinen Menschen, stellt der Server einen Gegner:
--     zufälliger Name, drei zufällige Helden, deren Stufen denen des Spielers entsprechen (je Held gleich oder eine Stufe
--     darunter, nie darüber – der Durchschnitt liegt damit immer im erlaubten Bereich), Karte, Monster und Modus wie sonst auch.
--   • Der Kampf läuft als gewöhnlicher Serverkampf und wird gewöhnlich gewertet (Tagesgrenze, Erfahrung, Seelensplitter).
--     Die Züge des Gegners rechnet die Edge Function.
--   • Der Gegner hat kein Konto: Am Kampf steht kein guest_id, nur Name und Aufstellung. Dafür:
--       – rpg_arena_json zeigt den Gegner auch dann, wenn nur Name und Aufstellung vorhanden sind;
--       – rpg_arena_belohnen bucht für „kein Konto“ nichts (statt mit einem Fehler abzubrechen).
--     Beide Funktionen werden in ihrer vorhandenen Fassung nur an dieser einen Stelle ergänzt – unabhängig von ihrer
--     Formatierung. Nur wenn rpg_arena_json den Gegner ganz anders prüft als erwartet, wird sie in der Fassung aus 008 neu gesetzt.
--   • rpg_arena_queue, rpg_arena_srv_load und rpg_arena_looks werden in der Fassung aus 016/018 neu gesetzt, ergänzt
--     um den Rechner-Gegner. (Wer 015, 016 oder 018 später noch einmal ausführt, führt danach auch 019 noch einmal aus.)
--   • Neue Spalten: rpg_arena_fights.bot (Profilbild und Rahmen des Gegners; leer = Mensch), rpg_arena_search_srv.seit
--     (Beginn der laufenden Suche).
--
-- Rückbau: 019_rpg_arena_rechnergegner_rueckbau.sql
-- =====================================================================
begin;

do $$ begin
  if to_regclass('public.rpg_arena_fights') is null or to_regclass('public.rpg_arena_search_srv') is null or to_regprocedure('public.rpg_arena_queue(text)') is null then
    raise exception 'Migration 019 braucht Migration 015 und 016 (Arena-Serverkampf mit Spielarten). Bitte zuerst diese ausführen.';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'rpg_arena_fights' and column_name = 'modus') then
    raise exception 'Migration 019 braucht Migration 016 (Spalte rpg_arena_fights.modus fehlt).';
  end if;
  if to_regprocedure('public.rpg_look_von(uuid)') is null or to_regclass('public.rpg_cosmetic_items') is null then
    raise exception 'Migration 019 braucht Migration 017 und 018 (Ausstattung, Profilrahmen sichtbar). Bitte zuerst diese ausführen.';
  end if;
  if to_regclass('public.rpg_hero_catalog') is null then raise exception 'Migration 019 braucht die Heldensammlung (Migration 006).'; end if;
end $$;

-- ---------------------------------------------------------------------
-- 1) Spalten
-- ---------------------------------------------------------------------
alter table public.rpg_arena_fights add column if not exists bot jsonb;                              -- { "avatar": …, "rahmen": … }; null = Mensch
alter table public.rpg_arena_search_srv add column if not exists seit timestamptz not null default now(); -- Beginn der laufenden Suche

-- ---------------------------------------------------------------------
-- 2) Zwei vorhandene Funktionen an genau einer Stelle ergänzen (nicht neu schreiben)
-- ---------------------------------------------------------------------
do $$
declare f record; v_alt text; v_neu text;
begin
  -- rpg_arena_belohnen: ohne Konto (Rechner-Gegner, gelöschtes Konto) nichts buchen
  for f in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'rpg_arena_belohnen' loop
    v_alt := pg_get_functiondef(f.oid);
    if v_alt ~ 'if p_user is null then return; end if;' then raise notice 'rpg_arena_belohnen: nichts zu ändern'; continue; end if;
    v_neu := regexp_replace(v_alt, '(\n[ \t]*begin[ \t\r]*\n)', E'\\1  if p_user is null then return; end if; -- kein Konto (Rechner-Gegner): nichts zu buchen\n', 'i');
    if v_neu = v_alt then raise exception 'rpg_arena_belohnen sieht anders aus als erwartet. Die Migration ändert nichts; bitte melden.'; end if;
    execute v_neu; raise notice 'rpg_arena_belohnen: bucht für „kein Konto“ nichts';
  end loop;
  -- rpg_arena_json: Der Gegner ist da, sobald seine Aufstellung feststeht (auch ohne Konto).
  -- Unabhängig von der Formatierung der vorhandenen Fassung (Zeilenumbrüche, Groß-/Kleinschreibung, Anführungszeichen):
  --   „<m>.guest_id is not null“ → „(<m>.guest_id is not null or <m>.guest_team is not null)“
  --   „<m>.guest_id is null“     → „(<m>.guest_id is null and <m>.guest_team is null)“
  for f in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'rpg_arena_json' loop
    v_alt := pg_get_functiondef(f.oid);
    if v_alt ~* 'guest_team"?\s+is\s+not\s+null' then raise notice 'rpg_arena_json: nichts zu ändern'; continue; end if;
    v_neu := regexp_replace(v_alt, '(\w+)\."?guest_id"?\s+is\s+not\s+null', '(\1.guest_id is not null or \1.guest_team is not null)', 'gi');
    v_neu := regexp_replace(v_neu, '(\w+)\."?guest_id"?\s+is\s+null', '(\1.guest_id is null and \1.guest_team is null)', 'gi');
    if v_neu ~* 'guest_id is not null or \w+\.guest_team is not null' and v_neu ~* 'guest_id is null and \w+\.guest_team is null' then
      execute v_neu; raise notice 'rpg_arena_json: zeigt den Gegner, sobald seine Aufstellung feststeht (vorhandene Fassung ergänzt)';
    else
      -- Die vorhandene Fassung prüft den Gegner anders als erwartet: Dann wird die Funktion in der Fassung aus Migration 008
      -- (mit der Ergänzung) neu gesetzt. Gleiche Felder, gleiche Sichtregeln.
      begin
        execute $f$
          create or replace function public.rpg_arena_json(p_m public.rpg_arena_matches, p_user uuid)
          returns jsonb language sql stable security definer set search_path = public as $j$
            select jsonb_build_object(
              'id', p_m.id, 'status', p_m.status, 'seite', case when p_m.host_id = p_user then 1 else 2 end,
              'host', jsonb_build_object('name', p_m.host_name, 'schnitt', p_m.host_schnitt, 'team', case when p_m.host_id = p_user or (p_m.guest_id is not null or p_m.guest_team is not null) then p_m.host_team else null end),
              'gast', case when (p_m.guest_id is null and p_m.guest_team is null) then null else jsonb_build_object('name', p_m.guest_name, 'schnitt', p_m.guest_schnitt, 'team', p_m.guest_team) end,
              'karte', p_m.karte, 'begegnung', p_m.begegnung, 'seed', p_m.seed, 'room_code', p_m.room_code,
              'kampfstufe', round(greatest(p_m.host_schnitt, coalesce(p_m.guest_schnitt, p_m.host_schnitt)))::integer,
              'sieger', p_m.sieger, 'grund', p_m.grund, 'punkte', p_m.punkte, 'runden', p_m.runden, 'erstellt', p_m.created_at,
              'belohnung', (select jsonb_build_object('sieg', r.sieg, 'gewertet', r.gewertet, 'xp', r.xp, 'waehrung', r.waehrung,
                              'angebot', (select public.rpg_hero_angebot_json(o) from public.rpg_hero_offers o where o.id = r.offer_id and o.status = 'offen'))
                            from public.rpg_arena_rewards r where r.match_id = p_m.id and r.user_id = p_user));
          $j$;
        $f$;
        raise notice 'rpg_arena_json: in der Fassung aus Migration 008 neu gesetzt (mit Gegner ohne Konto)';
      exception when others then
        raise exception 'rpg_arena_json ließ sich weder ergänzen noch neu setzen (%). Die Migration ändert nichts. Bitte die Ausgabe von: select pg_get_functiondef(''public.rpg_arena_json(public.rpg_arena_matches, uuid)''::regprocedure); melden.', sqlerrm;
      end;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3) Den Rechner-Gegner in einen offenen Kampf setzen (nicht direkt aufrufbar)
-- ---------------------------------------------------------------------
create or replace function public.rpg_arena_bot(p_match_id uuid, p_art text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_m public.rpg_arena_matches%rowtype; v_helden text[]; v_stufen integer[]; v_team jsonb := '[]'::jsonb; v_name text; v_i integer; v_rahmen text;
  v_karten text[] := array['garten', 'turm', 'gruft', 'pilze', 'schacht', 'halle', 'siegel']; v_monster text[] := array['garten', 'kobolde', 'gruft'];
  v_arcade text[] := array['arena', 'koenig', 'horde'];
  v_stamm text[] := array['Mara', 'Jonas', 'Finn', 'Lukas', 'Nele', 'Timo', 'Svenja', 'Kilian', 'Ronja', 'Malte', 'Darius', 'Elif', 'Noah', 'Jule', 'Paul', 'Leon', 'Mika', 'Lena', 'Tobi', 'Hannes',
    'Basti', 'Flo', 'Chrissi', 'Maxi', 'Steffi', 'Domi', 'Vroni', 'Kathi', 'Benni', 'Sina', 'Marv', 'Nico', 'Lea', 'Jannik', 'Meike', 'Ole', 'Tessa', 'Fabi', 'Lars', 'Anni',
    'Schattenfuchs', 'Eisenherz', 'Nachtfalke', 'Runenwolf', 'Sturmkind', 'Mondklinge', 'Grimbart', 'Feuerkelch', 'Rabenfeder', 'Wolfsblut', 'Nebelwanderer', 'Dornenritter', 'Aschenbrand', 'Silberzunge', 'Donnerkeil',
    'Kruemel', 'Zwergenbier', 'Wuerfelgott', 'Krit20', 'Pixelritter', 'Kartoffelkoenig', 'Pechvogel', 'Lootgoblin', 'Wuerfelpech', 'Heilerin', 'Tankwart', 'Keksdose', 'Brotzeit', 'Feierabend', 'Schnitzel',
    'DerLange', 'DieChefin', 'Onkel_Tom', 'HerrVorragend', 'FrauHolle', 'Kapitaen', 'Opa_Heinz', 'Sir_Lanzelot', 'Lady_Mo', 'Der_Micha'];
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id and status = 'offen' for update;
  if not found then return null; end if;
  select array_agg(hero_id) into v_helden from (select hero_id from public.rpg_hero_catalog order by random() limit 3) t;
  if v_helden is null or cardinality(v_helden) <> 3 then return null; end if;
  -- Stufen: die des Spielers in zufälliger Reihenfolge, je Held gleich oder eine Stufe darunter – nie darüber (1 bis 10)
  select array_agg(greatest(1, least(10, (e->>'stufe')::integer + floor(random() * 2)::integer - 1)) order by random()) into v_stufen from jsonb_array_elements(v_m.host_team) e;
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
  insert into public.rpg_arena_fights (match_id, modus, bot)
    values (p_match_id, case when p_art = 'normal' then 'duell' else v_arcade[1 + floor(random() * cardinality(v_arcade))::integer] end,
            jsonb_build_object('avatar', (select hero_id from public.rpg_hero_catalog order by random() limit 1), 'rahmen', v_rahmen))
    on conflict (match_id) do nothing;
  delete from public.rpg_arena_search_srv where match_id = p_match_id;
  return public.rpg_arena_json(v_m, v_m.host_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Suche (Fassung aus Migration 016), ergänzt: nach etwa 30 Sekunden ohne Menschen kommt der Rechner-Gegner
-- ---------------------------------------------------------------------
create or replace function public.rpg_arena_queue(p_art text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_helden text[]; v_team jsonb; v_schnitt numeric; v_id uuid; v_mein public.rpg_arena_matches%rowtype; v_json jsonb;
  v_arcade text[] := array['arena', 'koenig', 'horde']; v_seit timestamptz;
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
    -- Etwa 30 Sekunden gewartet (je Suche 26 bis 35) und kein Mensch gefunden: Der Server stellt den Gegner.
    -- Die Aufstellung am Kampf kann älter sein als das gespeicherte Team – dann gilt die aktuelle.
    if v_seit is not null and v_seit < now() - make_interval(secs => 26 + abs(hashtext(v_mein.id::text)) % 10) then
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

-- ---------------------------------------------------------------------
-- 5) Für die Edge Function (Fassung aus Migration 016), ergänzt um die Angabe, ob Team 2 vom Server gespielt wird
-- ---------------------------------------------------------------------
create or replace function public.rpg_arena_srv_load(p_match_id uuid, p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('seite', case when m.host_id = p_user then 1 else 2 end,
    'kampf', jsonb_build_object('v', f.v, 'st', f.st, 'anf1', f.anf1, 'anf2', f.anf2, 'beginn', (extract(epoch from f.beginn) * 1000)::bigint),
    'match', jsonb_build_object('id', m.id, 'status', m.status, 'host_name', m.host_name, 'guest_name', m.guest_name,
      'host_team', m.host_team, 'guest_team', m.guest_team, 'karte', m.karte, 'begegnung', m.begegnung, 'seed', m.seed, 'modus', f.modus,
      'bot', f.bot is not null and m.guest_id is null,
      'kampfstufe', round(greatest(m.host_schnitt, coalesce(m.guest_schnitt, m.host_schnitt)))::integer))
  from public.rpg_arena_fights f join public.rpg_arena_matches m on m.id = f.match_id
  where f.match_id = p_match_id and p_user is not null and (m.host_id = p_user or m.guest_id = p_user);
$$;

-- ---------------------------------------------------------------------
-- 6) Profilbild und Rahmen beider Teilnehmer (Fassung aus Migration 018), ergänzt um den Gegner ohne Konto
-- ---------------------------------------------------------------------
create or replace function public.rpg_arena_looks(p_match_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m public.rpg_arena_matches%rowtype; v_bot jsonb;
begin
  select * into v_m from public.rpg_arena_matches where id = p_match_id;
  if not found or v_uid is null or (v_m.host_id <> v_uid and v_m.guest_id is distinct from v_uid) then raise exception 'Diesen Kampf gibt es nicht.'; end if;
  if v_m.guest_id is null then select bot into v_bot from public.rpg_arena_fights where match_id = p_match_id; end if;
  return jsonb_build_object('host', public.rpg_look_von(v_m.host_id),
    'gast', case when v_m.guest_id is not null then public.rpg_look_von(v_m.guest_id)
                 when v_bot is not null then jsonb_build_object('name', v_m.guest_name, 'avatar', v_bot->>'avatar', 'rahmen', v_bot->>'rahmen') else null end);
end;
$$;

-- ---------------------------------------------------------------------
-- 7) Ausführungsrechte
-- ---------------------------------------------------------------------
revoke all on function public.rpg_arena_bot(uuid, text), public.rpg_arena_srv_load(uuid, uuid) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then grant execute on function public.rpg_arena_srv_load(uuid, uuid) to service_role; end if;
end $$;
revoke all on function public.rpg_arena_queue(text), public.rpg_arena_looks(uuid) from public, anon;
grant execute on function public.rpg_arena_queue(text), public.rpg_arena_looks(uuid) to authenticated;

commit;
