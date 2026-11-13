-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 006: Heldensammlung (Open Beta)
-- Setzt Migration 001–005 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG. Legt ausschließlich neue Objekte mit dem Präfix rpg_ an.
-- Bestehende Tabellen, Funktionen und Daten werden nicht verändert.
--
-- Was diese Migration einführt (KONZEPT-HELDENFREISCHALTUNG.md, Teil D):
--   • Jedes Spielerkonto hat eine Heldensammlung. Neue Konten wählen in drei Runden
--     je einen von drei Helden (gelost auf dem Server).
--   • Jedes Kampagnen-Ende, das ein Konto zum ersten Mal erreicht, bringt eine Wahl
--     aus drei weiteren Helden. Ein schon bekanntes Ende bringt nichts.
--   • Wer alle Enden einer Kampagne gefunden hat, bekommt einen Kampagnentitel.
--   • Freischalt-Codes: Ein gültiger Code schaltet alle 15 Helden für ein Konto frei.
--   • Bestandsschutz: Konten, die es beim ERSTEN Ausführen dieser Migration schon gibt,
--     bekommen alle 15 Helden (einmalig, wird beim erneuten Ausführen nicht wiederholt).
--   • Spieler ohne Konto (Gäste) haben keine Sammlung; das Spiel gibt ihnen ein festes Starter-Set.
--
-- Admins: dürfen im Spiel unter „Code-Übersicht“ Codes anlegen und sperren. Festlegen nur hier im SQL Editor:
--   insert into public.rpg_admins (user_id) select user_id from public.rpg_profiles where lower(handle) = lower('DeinName') on conflict do nothing;
--   delete from public.rpg_admins where user_id = (select user_id from public.rpg_profiles where lower(handle) = lower('DeinName'));
--
-- Codes anlegen im SQL Editor (geht zusätzlich zur Code-Übersicht im Spiel):
--   select public.rpg_create_unlock_code('Beta-Tester Runde 1', 20, 90);
--     → gibt den Code einmal im Klartext zurück (z. B. K7QM-2XHP-9RTA), 20 Einlösungen, 90 Tage gültig
--   select public.rpg_disable_unlock_code('Beta-Tester Runde 1');   → sperrt alle Codes mit dieser Bezeichnung
--   select * from public.rpg_unlock_codes_uebersicht;                → Übersicht: Bezeichnung, Einlösungen, Ablauf
--
-- Rückbau: 006_rpg_heldensammlung_rueckbau.sql
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) Stammdaten: Helden und Enden
-- ---------------------------------------------------------------------
create table if not exists public.rpg_hero_catalog (
  hero_id  text primary key check (hero_id ~ '^[a-z_]{2,30}$'),
  klasse   text not null check (klasse in ('krieger', 'zauberer', 'schurke', 'kleriker', 'waldlaeufer'))
);
insert into public.rpg_hero_catalog (hero_id, klasse) values
  ('schildwaechter', 'krieger'), ('berserker', 'krieger'), ('duellant', 'krieger'),
  ('gelehrter', 'zauberer'), ('elementarist', 'zauberer'), ('schattenmagier', 'zauberer'),
  ('schattenlaeufer', 'schurke'), ('trickser', 'schurke'), ('assassine', 'schurke'),
  ('lichtbringer', 'kleriker'), ('wanderheiler', 'kleriker'), ('inquisitor', 'kleriker'),
  ('wildnislaeufer', 'waldlaeufer'), ('tiergefaehrte', 'waldlaeufer'), ('kopfgeldjaeger', 'waldlaeufer')
on conflict (hero_id) do update set klasse = excluded.klasse;

-- Reguläre Enden je Abenteuer (Niederlagen zählen nicht). Neue Abenteuer: hier Zeilen ergänzen.
create table if not exists public.rpg_adventure_endings (
  adventure  text not null check (adventure ~ '^[a-z0-9-]{2,40}$'),
  ending     text not null check (ending ~ '^[a-z0-9_]{2,40}$'),
  primary key (adventure, ending)
);
insert into public.rpg_adventure_endings (adventure, ending) values
  ('rabenmoor', 'ende_erloest'), ('rabenmoor', 'ende_besiegt'),
  ('grauwacht', 'ende_waechter'), ('grauwacht', 'ende_kobold'), ('grauwacht', 'ende_opfer'), ('grauwacht', 'ende_bruch'), ('grauwacht', 'ende_verrat'),
  ('hochwacht', 'ende_fackel'), ('hochwacht', 'ende_funke'), ('hochwacht', 'ende_dunkel'),
  ('krone', 'ende_stabil'), ('krone', 'ende_versiegelt'), ('krone', 'ende_umgeleitet')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 2) Daten je Konto
-- ---------------------------------------------------------------------
create table if not exists public.rpg_hero_collection (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  hero_id      text        not null references public.rpg_hero_catalog(hero_id),
  quelle       text        not null check (quelle in ('start', 'ende', 'code', 'bestand')),
  campaign_id  uuid,       -- bei quelle = 'ende' (ohne Fremdschlüssel: gelöschte Kampagnen nehmen nichts weg)
  unlocked_at  timestamptz not null default now(),
  primary key (user_id, hero_id)
);

-- Auswahlrunden: drei gezogene Helden, einer wird gewählt
create table if not exists public.rpg_hero_offers (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  art          text        not null check (art in ('start', 'ende')),
  runde        integer     check (runde between 1 and 3),
  helden       text[]      not null check (cardinality(helden) between 1 and 3),
  campaign_id  uuid,
  adventure    text,
  ending       text,
  status       text        not null default 'offen' check (status in ('offen', 'gewaehlt', 'verfallen')),
  gewaehlt     text,
  created_at   timestamptz not null default now(),
  chosen_at    timestamptz
);
create unique index if not exists rpg_hero_offers_ein_start on public.rpg_hero_offers (user_id) where art = 'start' and status = 'offen';
create unique index if not exists rpg_hero_offers_je_kampagne on public.rpg_hero_offers (user_id, campaign_id) where art = 'ende';

-- Gefundene Enden je Konto (jedes Ende zählt einmal)
create table if not exists public.rpg_hero_endings_found (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  adventure    text        not null,
  ending       text        not null,
  campaign_id  uuid,
  found_at     timestamptz not null default now(),
  primary key (user_id, adventure, ending),
  foreign key (adventure, ending) references public.rpg_adventure_endings (adventure, ending)
);

-- Je Konto und Kampagne wird ein Ende genau einmal gemeldet (Neuladen ändert nichts)
create table if not exists public.rpg_ending_claims (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  campaign_id  uuid        not null,
  adventure    text        not null,
  ending       text        not null,
  neu          boolean     not null,
  offer_id     uuid,
  claimed_at   timestamptz not null default now(),
  primary key (user_id, campaign_id)
);

-- Admins (nur per SQL Editor eintragen, siehe Kopf)
create table if not exists public.rpg_admins (
  user_id   uuid        primary key references auth.users(id) on delete cascade,
  added_at  timestamptz not null default now()
);

-- Freischalt-Codes (nur als Hash gespeichert). for_user: nur dieses Konto darf ihn einlösen (sonst jeder)
create table if not exists public.rpg_unlock_codes (
  id          uuid        primary key default gen_random_uuid(),
  code_hash   text        not null unique,
  label       text        not null check (char_length(label) between 1 and 80),
  max_uses    integer     not null default 1 check (max_uses between 1 and 10000),
  uses        integer     not null default 0 check (uses >= 0),
  expires_at  timestamptz not null,
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);
alter table public.rpg_unlock_codes add column if not exists for_user uuid references auth.users(id) on delete cascade;
alter table public.rpg_unlock_codes add column if not exists created_by uuid references auth.users(id) on delete set null;
create table if not exists public.rpg_unlock_redemptions (
  code_id      uuid        not null references public.rpg_unlock_codes(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  redeemed_at  timestamptz not null default now(),
  primary key (code_id, user_id)
);
create table if not exists public.rpg_unlock_attempts (
  user_id  uuid        not null references auth.users(id) on delete cascade,
  at       timestamptz not null default now()
);
create index if not exists rpg_unlock_attempts_user on public.rpg_unlock_attempts (user_id, at);

-- Einmalige Merker (z. B. „Bestandsschutz schon vergeben“)
create table if not exists public.rpg_sammlung_meta (
  key    text        primary key,
  value  jsonb,
  at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3) Zugriff: keine direkten Rechte, alles nur über die Funktionen unten
-- ---------------------------------------------------------------------
alter table public.rpg_hero_catalog        enable row level security;
alter table public.rpg_adventure_endings   enable row level security;
alter table public.rpg_hero_collection     enable row level security;
alter table public.rpg_hero_offers         enable row level security;
alter table public.rpg_hero_endings_found  enable row level security;
alter table public.rpg_ending_claims       enable row level security;
alter table public.rpg_unlock_codes        enable row level security;
alter table public.rpg_unlock_redemptions  enable row level security;
alter table public.rpg_unlock_attempts     enable row level security;
alter table public.rpg_sammlung_meta       enable row level security;
alter table public.rpg_admins              enable row level security;
revoke all on public.rpg_hero_catalog, public.rpg_adventure_endings, public.rpg_hero_collection, public.rpg_hero_offers,
  public.rpg_hero_endings_found, public.rpg_ending_claims, public.rpg_unlock_codes, public.rpg_unlock_redemptions,
  public.rpg_unlock_attempts, public.rpg_sammlung_meta, public.rpg_admins from anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) Bestandsschutz: einmalig alle 15 Helden für alle Konten, die es jetzt schon gibt
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.rpg_sammlung_meta where key = 'bestand_vergeben') then
    insert into public.rpg_hero_collection (user_id, hero_id, quelle)
    select p.user_id, c.hero_id, 'bestand'
    from public.rpg_profiles p
    join auth.users u on u.id = p.user_id and coalesce(u.is_anonymous, false) = false
    cross join public.rpg_hero_catalog c
    on conflict do nothing;
    insert into public.rpg_sammlung_meta (key, value) values ('bestand_vergeben', jsonb_build_object('konten', (select count(*) from public.rpg_profiles)));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5) Hilfsfunktionen
-- ---------------------------------------------------------------------
-- Ist der Aufrufer ein Konto mit Benutzernamen? (Gäste haben keine Sammlung)
create or replace function public.rpg_sammlung_konto()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.rpg_ist_konto(auth.uid()) and exists (select 1 from public.rpg_profiles where user_id = auth.uid());
$$;

-- Bis zu n Helden ziehen, die der Nutzer noch nicht hat (und die nicht in p_ohne stehen), möglichst aus verschiedenen Klassen
create or replace function public.rpg_hero_ziehen(p_user uuid, p_n integer, p_ohne text[] default '{}')
returns text[] language plpgsql volatile security definer set search_path = public as $$
declare v_out text[] := '{}'; v_rec record;
begin
  -- erst je Klasse höchstens einen, Klassen in zufälliger Reihenfolge
  for v_rec in
    select hero_id from (
      select hero_id, klasse, row_number() over (partition by klasse order by random()) rn
      from public.rpg_hero_catalog
      where hero_id not in (select hero_id from public.rpg_hero_collection where user_id = p_user)
        and not (hero_id = any (coalesce(p_ohne, '{}')))
    ) t where rn = 1 order by random()
  loop
    exit when cardinality(v_out) >= p_n;
    v_out := v_out || v_rec.hero_id;
  end loop;
  -- reicht das nicht, mit beliebigen freien Helden auffüllen
  if cardinality(v_out) < p_n then
    for v_rec in
      select hero_id from public.rpg_hero_catalog
      where hero_id not in (select hero_id from public.rpg_hero_collection where user_id = p_user)
        and not (hero_id = any (v_out)) and not (hero_id = any (coalesce(p_ohne, '{}')))
      order by random()
    loop
      exit when cardinality(v_out) >= p_n;
      v_out := v_out || v_rec.hero_id;
    end loop;
  end if;
  return v_out;
end;
$$;

-- Angebot als jsonb für das Spiel
create or replace function public.rpg_hero_angebot_json(p_o public.rpg_hero_offers)
returns jsonb language sql stable as $$
  select case when p_o.id is null then null else jsonb_build_object('id', p_o.id, 'art', p_o.art, 'runde', p_o.runde, 'helden', to_jsonb(p_o.helden),
    'campaign_id', p_o.campaign_id, 'abenteuer', p_o.adventure, 'ende', p_o.ending) end;
$$;

-- ---------------------------------------------------------------------
-- 6) Funktionen für das Spiel
-- ---------------------------------------------------------------------

-- Meine Sammlung: Helden, offene Angebote, gefundene Enden, abgeschlossene Kampagnen (für Titel)
create or replace function public.rpg_my_heroes()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false); end if;
  return jsonb_build_object(
    'konto', true,
    'admin', exists (select 1 from public.rpg_admins where user_id = v_uid),
    'helden', coalesce((select jsonb_agg(hero_id order by unlocked_at) from public.rpg_hero_collection where user_id = v_uid), '[]'::jsonb),
    'start_offen', (select count(*) from public.rpg_hero_collection where user_id = v_uid) < 3
                   and (select count(*) from public.rpg_hero_collection where user_id = v_uid and quelle = 'start') < 3,
    'angebote', coalesce((select jsonb_agg(public.rpg_hero_angebot_json(o) order by o.created_at) from public.rpg_hero_offers o where o.user_id = v_uid and o.status = 'offen'), '[]'::jsonb),
    'enden', coalesce((select jsonb_agg(jsonb_build_object('abenteuer', adventure, 'ende', ending, 'am', found_at) order by found_at) from public.rpg_hero_endings_found where user_id = v_uid), '[]'::jsonb),
    'alle_enden', coalesce((select jsonb_object_agg(adventure, n) from (select adventure, count(*) n from public.rpg_adventure_endings group by adventure) t), '{}'::jsonb),
    'titel', coalesce((select jsonb_agg(a.adventure) from (select adventure, count(*) n from public.rpg_adventure_endings group by adventure) a
                       where a.n = (select count(*) from public.rpg_hero_endings_found f where f.user_id = v_uid and f.adventure = a.adventure)), '[]'::jsonb)
  );
end;
$$;

-- Registrierung: aktuelle Startrunde holen (wird bei Bedarf gezogen; Neuladen zeigt dieselben drei)
create or replace function public.rpg_hero_start_offer()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_o public.rpg_hero_offers%rowtype; v_runde integer; v_gesehen text[];
begin
  if not public.rpg_sammlung_konto() then raise exception 'Die Heldensammlung gibt es nur mit einem Spielerkonto.'; end if;
  perform pg_advisory_xact_lock(hashtext('rpg_hero_start:' || v_uid::text));
  select count(*) + 1 into v_runde from public.rpg_hero_collection where user_id = v_uid and quelle = 'start';
  if v_runde > 3 or (select count(*) from public.rpg_hero_collection where user_id = v_uid) >= 3 then
    return jsonb_build_object('fertig', true, 'helden', (select jsonb_agg(hero_id order by unlocked_at) from public.rpg_hero_collection where user_id = v_uid));
  end if;
  select * into v_o from public.rpg_hero_offers where user_id = v_uid and art = 'start' and status = 'offen';
  if not found then
    -- In den drei Startrunden wird kein Held zweimal angeboten (insgesamt 9 verschiedene)
    select coalesce(array_agg(h), '{}') into v_gesehen from public.rpg_hero_offers o, unnest(o.helden) h where o.user_id = v_uid and o.art = 'start';
    insert into public.rpg_hero_offers (user_id, art, runde, helden) values (v_uid, 'start', v_runde, public.rpg_hero_ziehen(v_uid, 3, v_gesehen))
    returning * into v_o;
  end if;
  return jsonb_build_object('fertig', false, 'runde', v_o.runde, 'angebot', public.rpg_hero_angebot_json(v_o));
end;
$$;

-- Einen Helden aus einem offenen Angebot wählen (Start oder Ende)
create or replace function public.rpg_hero_pick(p_offer_id uuid, p_hero text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_o public.rpg_hero_offers%rowtype;
begin
  if not public.rpg_sammlung_konto() then raise exception 'Die Heldensammlung gibt es nur mit einem Spielerkonto.'; end if;
  select * into v_o from public.rpg_hero_offers where id = p_offer_id and user_id = v_uid for update;
  if not found then raise exception 'Dieses Angebot gibt es nicht.'; end if;
  if v_o.status = 'gewaehlt' then
    if v_o.gewaehlt = p_hero then return jsonb_build_object('held', p_hero, 'art', v_o.art, 'runde', v_o.runde, 'schon', true); end if;
    raise exception 'Aus diesem Angebot wurde schon gewählt.';
  end if;
  if v_o.status <> 'offen' then raise exception 'Dieses Angebot ist nicht mehr gültig.'; end if;
  if not (p_hero = any (v_o.helden)) then raise exception 'Dieser Held steht nicht zur Wahl.'; end if;
  insert into public.rpg_hero_collection (user_id, hero_id, quelle, campaign_id) values (v_uid, p_hero, v_o.art, v_o.campaign_id) on conflict do nothing;
  update public.rpg_hero_offers set status = 'gewaehlt', gewaehlt = p_hero, chosen_at = now() where id = v_o.id;
  return jsonb_build_object('held', p_hero, 'art', v_o.art, 'runde', v_o.runde,
    'anzahl', (select count(*) from public.rpg_hero_collection where user_id = v_uid));
end;
$$;

-- Kampagnen-Ende melden. Prüft auf dem Server, ob das Ende plausibel erreicht wurde:
--   • die Kampagne ist abgeschlossen, der Aufrufer war dabei (Host oder mit eigenem Helden)
--   • der zuletzt gespeicherte Stand steht auf einer regulären Endszene dieses Abenteuers
--   • mindestens 8 gespeicherte Stände und 15 Minuten zwischen Anlegen und Abschluss
-- Neues Ende → Wahl aus drei (solange die Sammlung nicht vollständig ist). Bekanntes Ende → nichts.
create or replace function public.rpg_claim_ending(p_campaign_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_c public.rpg_campaigns%rowtype; v_m public.rpg_campaign_members%rowtype;
  v_state jsonb; v_ab text; v_ende text; v_cl public.rpg_ending_claims%rowtype; v_neu boolean; v_o public.rpg_hero_offers%rowtype;
  v_helden text[]; v_n integer; v_gef integer;
begin
  if not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false); end if;
  select * into v_cl from public.rpg_ending_claims where user_id = v_uid and campaign_id = p_campaign_id;
  if found then
    select * into v_o from public.rpg_hero_offers where id = v_cl.offer_id;
    return jsonb_build_object('konto', true, 'neu', v_cl.neu, 'abenteuer', v_cl.adventure, 'ende', v_cl.ending, 'schon_gemeldet', true,
      'angebot', case when v_o.status = 'offen' then public.rpg_hero_angebot_json(v_o) else null end,
      'gefunden', (select count(*) from public.rpg_hero_endings_found where user_id = v_uid and adventure = v_cl.adventure),
      'gesamt', (select count(*) from public.rpg_adventure_endings where adventure = v_cl.adventure),
      'sammlung', (select count(*) from public.rpg_hero_collection where user_id = v_uid));
  end if;
  select * into v_c from public.rpg_campaigns where id = p_campaign_id;
  if not found then raise exception 'Diese Kampagne gibt es nicht.'; end if;
  select * into v_m from public.rpg_campaign_members where campaign_id = p_campaign_id and user_id = v_uid and member_status = 'aktiv';
  if not found or not (v_m.role = 'host' or v_m.character_id is not null) then raise exception 'Du hast in dieser Kampagne keinen Helden gespielt.'; end if;
  if v_c.status <> 'abgeschlossen' then raise exception 'Diese Kampagne ist noch nicht abgeschlossen.'; end if;
  if v_c.current_version < 8 or v_c.completed_at is null or v_c.completed_at - v_c.created_at < interval '15 minutes' then
    raise exception 'Dieses Ende kann nicht gewertet werden.';
  end if;
  select state into v_state from public.rpg_state_snapshots where campaign_id = p_campaign_id and version = v_c.current_version;
  v_ab := coalesce(v_state #>> '{abenteuer,abenteuer}', 'grauwacht'); v_ende := v_state #>> '{abenteuer,szene}';
  if v_ab <> v_c.adventure_slug or not exists (select 1 from public.rpg_adventure_endings where adventure = v_ab and ending = v_ende) then
    raise exception 'Dieses Ende kann nicht gewertet werden.';
  end if;
  perform pg_advisory_xact_lock(hashtext('rpg_hero_ende:' || v_uid::text));
  insert into public.rpg_hero_endings_found (user_id, adventure, ending, campaign_id) values (v_uid, v_ab, v_ende, p_campaign_id) on conflict do nothing;
  get diagnostics v_n = row_count; v_neu := v_n > 0;
  if v_neu then
    v_helden := public.rpg_hero_ziehen(v_uid, 3);
    if cardinality(v_helden) > 0 then
      insert into public.rpg_hero_offers (user_id, art, helden, campaign_id, adventure, ending) values (v_uid, 'ende', v_helden, p_campaign_id, v_ab, v_ende)
      returning * into v_o;
    end if;
  end if;
  insert into public.rpg_ending_claims (user_id, campaign_id, adventure, ending, neu, offer_id) values (v_uid, p_campaign_id, v_ab, v_ende, v_neu, v_o.id);
  select count(*) into v_gef from public.rpg_hero_endings_found where user_id = v_uid and adventure = v_ab;
  return jsonb_build_object('konto', true, 'neu', v_neu, 'abenteuer', v_ab, 'ende', v_ende, 'angebot', public.rpg_hero_angebot_json(v_o),
    'gefunden', v_gef, 'gesamt', (select count(*) from public.rpg_adventure_endings where adventure = v_ab),
    'sammlung', (select count(*) from public.rpg_hero_collection where user_id = v_uid));
end;
$$;

-- Freischalt-Code einlösen: alle 15 Helden. Höchstens 10 Fehlversuche je Stunde.
-- Ein unbekannter Code liefert {fehler: …} statt einer Ausnahme (der Fehlversuch muss gespeichert bleiben).
create or replace function public.rpg_redeem_unlock_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_k public.rpg_unlock_codes%rowtype; v_vorher integer;
begin
  if not public.rpg_sammlung_konto() then raise exception 'Codes kann nur ein Spielerkonto einlösen.'; end if;
  delete from public.rpg_unlock_attempts where at < now() - interval '1 day';
  if (select count(*) from public.rpg_unlock_attempts where user_id = v_uid and at > now() - interval '1 hour') >= 10 then
    raise exception 'Zu viele Versuche. Bitte in einer Stunde noch einmal.';
  end if;
  select * into v_k from public.rpg_unlock_codes where code_hash = public.rpg_link_hash(p_code) for update;
  if not found then
    -- kein Fehler werfen: sonst würde der Fehlversuch mit zurückgerollt und die Sperre griffe nie
    insert into public.rpg_unlock_attempts (user_id) values (v_uid);
    return jsonb_build_object('fehler', 'Dieser Code ist ungültig.');
  end if;
  if exists (select 1 from public.rpg_unlock_redemptions where code_id = v_k.id and user_id = v_uid) then
    raise exception 'Diesen Code hast du schon eingelöst.';
  end if;
  if v_k.for_user is not null and v_k.for_user <> v_uid then raise exception 'Dieser Code ist für ein anderes Konto bestimmt.'; end if;
  if not v_k.active then raise exception 'Dieser Code ist nicht mehr gültig.'; end if;
  if v_k.expires_at < now() then raise exception 'Dieser Code ist abgelaufen.'; end if;
  if v_k.uses >= v_k.max_uses then raise exception 'Dieser Code wurde schon so oft eingelöst wie möglich.'; end if;
  select count(*) into v_vorher from public.rpg_hero_collection where user_id = v_uid;
  insert into public.rpg_hero_collection (user_id, hero_id, quelle) select v_uid, hero_id, 'code' from public.rpg_hero_catalog on conflict do nothing;
  -- offene Startrunde ist damit erledigt
  update public.rpg_hero_offers set status = 'verfallen' where user_id = v_uid and art = 'start' and status = 'offen';
  insert into public.rpg_unlock_redemptions (code_id, user_id) values (v_k.id, v_uid);
  update public.rpg_unlock_codes set uses = uses + 1 where id = v_k.id;
  return jsonb_build_object('neu', (select count(*) from public.rpg_hero_collection where user_id = v_uid) - v_vorher,
    'gesamt', (select count(*) from public.rpg_hero_catalog), 'bezeichnung', v_k.label);
end;
$$;

-- ---------------------------------------------------------------------
-- 7) Verwaltung (nur im SQL Editor, nicht aus dem Spiel aufrufbar)
-- ---------------------------------------------------------------------
create or replace function public.rpg_create_unlock_code(p_label text, p_max_uses integer default 1, p_valid_days integer default 90)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if coalesce(trim(p_label), '') = '' then raise exception 'Bitte eine Bezeichnung angeben.'; end if;
  loop
    v_code := public.rpg_neuer_code();
    exit when not exists (select 1 from public.rpg_unlock_codes where code_hash = public.rpg_link_hash(v_code));
  end loop;
  insert into public.rpg_unlock_codes (code_hash, label, max_uses, expires_at)
  values (public.rpg_link_hash(v_code), left(trim(p_label), 80), greatest(1, p_max_uses), now() + make_interval(days => greatest(1, p_valid_days)));
  return v_code;
end;
$$;

create or replace function public.rpg_disable_unlock_code(p_label text)
returns integer language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  update public.rpg_unlock_codes set active = false where label = p_label and active;
  get diagnostics v_n = row_count; return v_n;
end;
$$;

drop view if exists public.rpg_unlock_codes_uebersicht;
create view public.rpg_unlock_codes_uebersicht as
  select k.label as bezeichnung, fp.handle as nur_fuer, k.uses as eingeloest, k.max_uses as hoechstens, k.expires_at as gueltig_bis, k.active as aktiv,
    k.created_at as angelegt, cp.handle as angelegt_von
  from public.rpg_unlock_codes k
  left join public.rpg_profiles fp on fp.user_id = k.for_user
  left join public.rpg_profiles cp on cp.user_id = k.created_by
  order by k.created_at desc;
revoke all on public.rpg_unlock_codes_uebersicht from anon, authenticated;

-- ---------------------------------------------------------------------
-- 7b) Code-Übersicht im Spiel (nur Admins). Grenzen: höchstens 100 Einlösungen, 365 Tage, 20 neue Codes je Tag und Admin.
-- ---------------------------------------------------------------------
create or replace function public.rpg_ist_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.rpg_sammlung_konto() and exists (select 1 from public.rpg_admins where user_id = auth.uid());
$$;

-- p_fuer: Benutzername, der den Code einlösen darf (leer = jede Person)
create or replace function public.rpg_admin_create_code(p_label text, p_fuer text default null, p_max_uses integer default 1, p_valid_days integer default 90)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_fuer uuid; v_handle text; v_code text; v_max integer; v_tage integer;
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins können Codes anlegen.'; end if;
  if coalesce(trim(p_label), '') = '' then raise exception 'Bitte eine Bezeichnung angeben.'; end if;
  if (select count(*) from public.rpg_unlock_codes where created_by = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Höchstens 20 neue Codes pro Tag.';
  end if;
  if coalesce(trim(p_fuer), '') <> '' then
    select p.user_id, p.handle into v_fuer, v_handle from public.rpg_profiles p where lower(p.handle) = lower(trim(p_fuer));
    if v_fuer is null or not public.rpg_ist_konto(v_fuer) then raise exception 'Ein Konto „%“ gibt es nicht.', trim(p_fuer); end if;
  end if;
  v_max := case when v_fuer is not null then 1 else least(100, greatest(1, coalesce(p_max_uses, 1))) end;
  v_tage := least(365, greatest(1, coalesce(p_valid_days, 90)));
  loop
    v_code := public.rpg_neuer_code();
    exit when not exists (select 1 from public.rpg_unlock_codes where code_hash = public.rpg_link_hash(v_code));
  end loop;
  insert into public.rpg_unlock_codes (code_hash, label, max_uses, expires_at, for_user, created_by)
  values (public.rpg_link_hash(v_code), left(trim(p_label), 80), v_max, now() + make_interval(days => v_tage), v_fuer, v_uid);
  return jsonb_build_object('code', v_code, 'bezeichnung', left(trim(p_label), 80), 'nur_fuer', v_handle, 'hoechstens', v_max,
    'gueltig_bis', now() + make_interval(days => v_tage));
end;
$$;

-- Die neuesten 200 Codes (ohne Klartext: der wird nur beim Anlegen einmal gezeigt)
create or replace function public.rpg_admin_codes()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins sehen die Code-Übersicht.'; end if;
  return coalesce((select jsonb_agg(x order by x.angelegt desc) from (
    select k.id, k.label as bezeichnung, fp.handle as nur_fuer, k.uses as eingeloest, k.max_uses as hoechstens, k.expires_at as gueltig_bis,
      k.active as aktiv, k.created_at as angelegt, cp.handle as angelegt_von
    from public.rpg_unlock_codes k
    left join public.rpg_profiles fp on fp.user_id = k.for_user
    left join public.rpg_profiles cp on cp.user_id = k.created_by
    order by k.created_at desc limit 200) x), '[]'::jsonb);
end;
$$;

create or replace function public.rpg_admin_disable_code(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.rpg_ist_admin() then raise exception 'Nur Admins können Codes sperren.'; end if;
  update public.rpg_unlock_codes set active = false where id = p_id and active;
  return found;
end;
$$;

-- Spieltisch: Helden, die der Tisch steuern darf, kommen aus der Sammlung des Hosts.
-- Nur Host und Tisch-Gerät der Kampagne dürfen fragen (z. B. nach „Auf anderem Gerät spielen“).
create or replace function public.rpg_campaign_heroes(p_campaign_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_host uuid;
begin
  if not public.rpg_ist_tisch(p_campaign_id) then raise exception 'Nur der Spieltisch dieser Kampagne darf das abfragen.'; end if;
  select user_id into v_host from public.rpg_campaign_members where campaign_id = p_campaign_id and role = 'host' and member_status = 'aktiv' limit 1;
  if v_host is null or not public.rpg_ist_konto(v_host) then return jsonb_build_object('konto', false); end if;
  return jsonb_build_object('konto', true,
    'helden', coalesce((select jsonb_agg(hero_id order by unlocked_at) from public.rpg_hero_collection where user_id = v_host), '[]'::jsonb));
end;
$$;

-- ---------------------------------------------------------------------
-- 8) Ausführungsrechte
-- ---------------------------------------------------------------------
revoke all on function public.rpg_sammlung_konto(), public.rpg_hero_ziehen(uuid, integer, text[]), public.rpg_hero_angebot_json(public.rpg_hero_offers),
  public.rpg_create_unlock_code(text, integer, integer), public.rpg_disable_unlock_code(text), public.rpg_ist_admin() from public, anon, authenticated;
revoke all on function public.rpg_my_heroes(), public.rpg_hero_start_offer(), public.rpg_hero_pick(uuid, text), public.rpg_claim_ending(uuid),
  public.rpg_redeem_unlock_code(text), public.rpg_campaign_heroes(uuid),
  public.rpg_admin_create_code(text, text, integer, integer), public.rpg_admin_codes(), public.rpg_admin_disable_code(uuid) from public, anon;
grant execute on function public.rpg_my_heroes(), public.rpg_hero_start_offer(), public.rpg_hero_pick(uuid, text), public.rpg_claim_ending(uuid),
  public.rpg_redeem_unlock_code(text), public.rpg_campaign_heroes(uuid),
  public.rpg_admin_create_code(text, text, integer, integer), public.rpg_admin_codes(), public.rpg_admin_disable_code(uuid) to authenticated;

commit;
