-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 001: Kampagnen, Spielstände, Sitzungen
-- Bauabschnitt A (Fachkonzept Schritt 2, vorgezogen)
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG:
--   • legt ausschließlich neue Objekte mit dem Präfix rpg_ an
--   • ändert KEINE bestehenden Tabellen, Richtlinien, Funktionen oder Daten
--     (game_sessions / session_players werden nur GELESEN, um zu prüfen,
--      dass ein Host wirklich Host seiner Live-Sitzung ist)
--   • Escape Rooms und Krimidinner sind nicht betroffen
--
-- Rückbau: 001_rpg_kampagnen_rueckbau.sql (entfernt nur diese rpg_-Objekte)
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) Tabellen
-- ---------------------------------------------------------------------

-- Kampagne: langlebiger Abenteuerfortschritt einer Gruppe
create table if not exists public.rpg_campaigns (
  id               uuid        primary key default gen_random_uuid(),
  adventure_slug   text        not null default 'grauwacht' check (adventure_slug ~ '^[a-z0-9-]{2,40}$'),
  title            text        not null check (char_length(title) between 1 and 80),
  owner_user_id    uuid        not null references auth.users(id) on delete cascade,
  status           text        not null default 'geplant'
                               check (status in ('geplant', 'aktiv', 'pausiert', 'abgeschlossen', 'archiviert')),
  difficulty       text        not null default 'normal' check (difficulty in ('normal', 'hardcore')),
  current_version  integer     not null default 0 check (current_version >= 0),
  -- Kurzinfo für die Bibliothek (Szene, Abschnitt, Stufe, Gruppe) – kein Spielstand
  checkpoint       jsonb       not null default '{}'::jsonb check (pg_column_size(checkpoint) <= 4096),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  completed_at     timestamptz
);
create index if not exists rpg_campaigns_owner on public.rpg_campaigns (owner_user_id);

-- Spielerplatz in einer Kampagne. Gäste sind anonym angemeldete Supabase-Nutzer:
-- jede Identität ist eine user_id, eine eigene Gästetabelle ist nicht nötig.
create table if not exists public.rpg_campaign_members (
  campaign_id    uuid        not null references public.rpg_campaigns(id) on delete cascade,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  role           text        not null default 'spieler' check (role in ('host', 'spieler')),
  display_name   text        not null check (char_length(display_name) between 1 and 24),
  character_id   text        check (character_id is null or character_id ~ '^[a-z_]{2,30}$'),
  member_status  text        not null default 'aktiv' check (member_status in ('aktiv', 'ausgetreten')),
  joined_at      timestamptz not null default now(),
  left_at        timestamptz,
  primary key (campaign_id, user_id)
);
create index if not exists rpg_campaign_members_user on public.rpg_campaign_members (user_id);
-- genau ein aktiver Host je Kampagne
create unique index if not exists rpg_campaign_members_ein_host
  on public.rpg_campaign_members (campaign_id) where role = 'host' and member_status = 'aktiv';

-- Spielsitzung: ein Spielabend bzw. eine Verbindungsphase innerhalb einer Kampagne
create table if not exists public.rpg_sessions (
  id               uuid        primary key default gen_random_uuid(),
  campaign_id      uuid        not null references public.rpg_campaigns(id) on delete cascade,
  -- Live-Verbindung über die bestehende Sitzungstechnik (game_sessions).
  -- Bewusst ohne Fremdschlüssel: die bestehende Tabelle bleibt unberührt.
  game_session_id  uuid,
  status           text        not null default 'aktiv' check (status in ('wartend', 'aktiv', 'beendet', 'unterbrochen')),
  created_by       uuid        references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  paused_at        timestamptz,
  ended_at         timestamptz
);
-- höchstens eine laufende Sitzung je Kampagne
create unique index if not exists rpg_sessions_eine_laufende
  on public.rpg_sessions (campaign_id) where status in ('wartend', 'aktiv');

-- Versionierte Spielstände. Der jeweils neueste ist rpg_campaigns.current_version.
create table if not exists public.rpg_state_snapshots (
  campaign_id  uuid        not null references public.rpg_campaigns(id) on delete cascade,
  version      integer     not null check (version > 0),
  kind         text        not null default 'auto'
                           check (kind in ('auto', 'szene', 'entscheidung', 'kampf', 'beute', 'lagerfeuer', 'kapitel', 'manuell')),
  state        jsonb       not null check (pg_column_size(state) <= 1048576),
  checksum     text        not null,
  created_by   uuid        references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  primary key (campaign_id, version)
);

-- ---------------------------------------------------------------------
-- 2) Hilfsfunktionen für die Richtlinien (security definer: keine Rekursion in RLS)
-- ---------------------------------------------------------------------
create or replace function public.rpg_ist_mitglied(p_campaign_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.rpg_campaign_members
    where campaign_id = p_campaign_id and user_id = auth.uid() and member_status = 'aktiv'
  );
$$;

create or replace function public.rpg_ist_host(p_campaign_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.rpg_campaign_members
    where campaign_id = p_campaign_id and user_id = auth.uid() and role = 'host' and member_status = 'aktiv'
  );
$$;

-- ---------------------------------------------------------------------
-- 3) Zugriff: nur LESEN über Richtlinien, alle Änderungen nur über die Funktionen unten
-- ---------------------------------------------------------------------
alter table public.rpg_campaigns        enable row level security;
alter table public.rpg_campaign_members enable row level security;
alter table public.rpg_sessions         enable row level security;
alter table public.rpg_state_snapshots  enable row level security;

revoke all on public.rpg_campaigns, public.rpg_campaign_members, public.rpg_sessions, public.rpg_state_snapshots from anon, authenticated;
grant select on public.rpg_campaigns, public.rpg_campaign_members, public.rpg_sessions, public.rpg_state_snapshots to authenticated;

drop policy if exists rpg_campaigns_lesen on public.rpg_campaigns;
create policy rpg_campaigns_lesen on public.rpg_campaigns
  for select to authenticated using (public.rpg_ist_mitglied(id));

drop policy if exists rpg_campaign_members_lesen on public.rpg_campaign_members;
create policy rpg_campaign_members_lesen on public.rpg_campaign_members
  for select to authenticated using (public.rpg_ist_mitglied(campaign_id) or user_id = auth.uid());

drop policy if exists rpg_sessions_lesen on public.rpg_sessions;
create policy rpg_sessions_lesen on public.rpg_sessions
  for select to authenticated using (public.rpg_ist_mitglied(campaign_id));

drop policy if exists rpg_state_snapshots_lesen on public.rpg_state_snapshots;
create policy rpg_state_snapshots_lesen on public.rpg_state_snapshots
  for select to authenticated using (public.rpg_ist_mitglied(campaign_id));

-- ---------------------------------------------------------------------
-- 4) Funktionen (alle prüfen auth.uid(); Fehlertexte sind für Spieler lesbar)
-- ---------------------------------------------------------------------

-- Neue Kampagne; der Aufrufer wird Host. Höchstens 20 nicht archivierte Kampagnen je Nutzer.
create or replace function public.rpg_create_campaign(
  p_title text, p_difficulty text default 'normal', p_display_name text default 'Spieltisch', p_adventure text default 'grauwacht')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  if (select count(*) from public.rpg_campaigns where owner_user_id = auth.uid() and status <> 'archiviert') >= 20 then
    raise exception 'Du hast bereits 20 Kampagnen. Bitte archiviere oder lösche eine.';
  end if;
  insert into public.rpg_campaigns (title, difficulty, adventure_slug, owner_user_id)
  values (left(coalesce(nullif(trim(p_title), ''), 'Neue Kampagne'), 80), p_difficulty, p_adventure, auth.uid())
  returning id into v_id;
  insert into public.rpg_campaign_members (campaign_id, user_id, role, display_name)
  values (v_id, auth.uid(), 'host', left(coalesce(nullif(trim(p_display_name), ''), 'Spieltisch'), 24));
  return v_id;
end;
$$;

-- Spielstand speichern mit Versionsprüfung (optimistische Sperre).
-- Nur der Host (Spieltisch). Ist p_expected_version veraltet, wird NICHTS geschrieben:
-- Fehler „RPG_VERALTET:<aktuelle Version>“ – der Tisch lädt dann den neueren Stand.
create or replace function public.rpg_save_snapshot(
  p_campaign_id uuid, p_expected_version integer, p_state jsonb, p_kind text default 'auto', p_checkpoint jsonb default null)
returns integer language plpgsql security definer set search_path = public as $$
declare v_c public.rpg_campaigns%rowtype; v_neu integer;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  if not public.rpg_ist_host(p_campaign_id) then raise exception 'Nur der Host kann den Spielstand speichern.'; end if;
  select * into v_c from public.rpg_campaigns where id = p_campaign_id for update;
  if v_c.status in ('abgeschlossen', 'archiviert') then raise exception 'Diese Kampagne ist % und kann nicht mehr gespeichert werden.', v_c.status; end if;
  if v_c.current_version <> p_expected_version then
    raise exception 'RPG_VERALTET:%', v_c.current_version using hint = 'Ein neuerer Spielstand liegt vor. Bitte neu laden.';
  end if;
  if (select count(*) from public.rpg_state_snapshots where campaign_id = p_campaign_id and created_at > now() - interval '1 minute') >= 120 then
    raise exception 'Zu viele Speichervorgänge in kurzer Zeit.';
  end if;
  v_neu := v_c.current_version + 1;
  insert into public.rpg_state_snapshots (campaign_id, version, kind, state, checksum, created_by)
  values (p_campaign_id, v_neu, coalesce(p_kind, 'auto'), p_state, md5(p_state::text), auth.uid());
  update public.rpg_campaigns set
    current_version = v_neu,
    checkpoint = coalesce(p_checkpoint, checkpoint),
    status = case when status = 'geplant' then 'aktiv' else status end,
    updated_at = now()
  where id = p_campaign_id;
  -- Aufräumen: die letzten 20 Stände bleiben, dazu die 10 jüngsten Lagerfeuer-/Kapitelstände
  delete from public.rpg_state_snapshots s
  where s.campaign_id = p_campaign_id and s.version <= v_neu - 20
    and (s.kind not in ('lagerfeuer', 'kapitel')
         or s.version not in (select version from public.rpg_state_snapshots
                              where campaign_id = p_campaign_id and kind in ('lagerfeuer', 'kapitel')
                              order by version desc limit 10));
  return v_neu;
end;
$$;

-- Kampagne mit neuestem Spielstand laden (alle aktiven Mitglieder)
create or replace function public.rpg_load_campaign(p_campaign_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_c public.rpg_campaigns%rowtype; v_state jsonb;
begin
  if not public.rpg_ist_mitglied(p_campaign_id) then raise exception 'Du gehörst nicht zu dieser Kampagne.'; end if;
  select * into v_c from public.rpg_campaigns where id = p_campaign_id;
  select state into v_state from public.rpg_state_snapshots where campaign_id = p_campaign_id and version = v_c.current_version;
  return jsonb_build_object(
    'campaign', to_jsonb(v_c), 'version', v_c.current_version, 'state', v_state,
    'members', (select coalesce(jsonb_agg(jsonb_build_object('user_id', m.user_id, 'display_name', m.display_name, 'role', m.role,
                  'character_id', m.character_id, 'member_status', m.member_status) order by m.joined_at), '[]'::jsonb)
                from public.rpg_campaign_members m where m.campaign_id = p_campaign_id));
end;
$$;

-- Eigene Kampagnen für die Bibliothek (ohne Spielstände, nur Kurzinfo)
create or replace function public.rpg_my_campaigns()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'title', c.title, 'adventure_slug', c.adventure_slug, 'status', c.status, 'difficulty', c.difficulty,
      'version', c.current_version, 'checkpoint', c.checkpoint, 'updated_at', c.updated_at, 'created_at', c.created_at,
      'role', me.role, 'is_owner', c.owner_user_id = auth.uid(),
      'laeuft', exists (select 1 from public.rpg_sessions s where s.campaign_id = c.id and s.status in ('wartend', 'aktiv')),
      'members', (select coalesce(jsonb_agg(jsonb_build_object('display_name', m.display_name, 'role', m.role, 'character_id', m.character_id) order by m.joined_at), '[]'::jsonb)
                  from public.rpg_campaign_members m where m.campaign_id = c.id and m.member_status = 'aktiv'))
    order by c.updated_at desc), '[]'::jsonb)
  from public.rpg_campaigns c
  join public.rpg_campaign_members me on me.campaign_id = c.id and me.user_id = auth.uid() and me.member_status = 'aktiv';
$$;

-- Status ändern (nur Host): aktiv ↔ pausiert, → abgeschlossen, → archiviert, archiviert → pausiert
create or replace function public.rpg_set_campaign_status(p_campaign_id uuid, p_status text)
returns text language plpgsql security definer set search_path = public as $$
declare v_alt text;
begin
  if not public.rpg_ist_host(p_campaign_id) then raise exception 'Nur der Host kann den Status ändern.'; end if;
  select status into v_alt from public.rpg_campaigns where id = p_campaign_id for update;
  if not (
       (v_alt in ('geplant', 'aktiv') and p_status = 'pausiert')
    or (v_alt in ('geplant', 'pausiert') and p_status = 'aktiv')
    or (v_alt in ('geplant', 'aktiv', 'pausiert') and p_status = 'abgeschlossen')
    or (v_alt in ('geplant', 'pausiert', 'abgeschlossen') and p_status = 'archiviert')
    or (v_alt = 'archiviert' and p_status = 'pausiert')
    or v_alt = p_status) then
    raise exception 'Statuswechsel von % nach % ist nicht erlaubt.', v_alt, p_status;
  end if;
  update public.rpg_campaigns set status = p_status, updated_at = now(),
    completed_at = case when p_status = 'abgeschlossen' then now() when p_status in ('aktiv', 'pausiert') then null else completed_at end
  where id = p_campaign_id;
  -- Pausieren/Abschließen beendet die laufende Sitzung (die Kampagne bleibt)
  if p_status <> 'aktiv' then
    update public.rpg_sessions set status = 'beendet', paused_at = now(), ended_at = now()
    where campaign_id = p_campaign_id and status in ('wartend', 'aktiv');
  end if;
  return p_status;
end;
$$;

-- Sitzung starten (nur Host). Läuft schon eine, wird sie als „unterbrochen“ geschlossen
-- (z. B. Tisch neu geladen oder anderes Gerät) – es gibt nie zwei laufende Sitzungen.
-- p_game_session_id: Live-Sitzung, deren Host der Aufrufer sein muss (nur lesend geprüft).
create or replace function public.rpg_start_session(p_campaign_id uuid, p_game_session_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_status text; v_id uuid;
begin
  if not public.rpg_ist_host(p_campaign_id) then raise exception 'Nur der Host kann eine Sitzung starten.'; end if;
  select status into v_status from public.rpg_campaigns where id = p_campaign_id for update;
  if v_status in ('abgeschlossen', 'archiviert') then raise exception 'Diese Kampagne ist % und kann nicht fortgesetzt werden.', v_status; end if;
  if p_game_session_id is not null and not exists (
    select 1 from public.session_players where session_id = p_game_session_id and user_id = auth.uid() and is_host) then
    raise exception 'Du bist nicht Host dieser Live-Sitzung.';
  end if;
  select id into v_id from public.rpg_sessions
  where campaign_id = p_campaign_id and status in ('wartend', 'aktiv')
    and game_session_id is not distinct from p_game_session_id and created_by = auth.uid();
  if v_id is not null then return v_id; end if;
  update public.rpg_sessions set status = 'unterbrochen', ended_at = now()
  where campaign_id = p_campaign_id and status in ('wartend', 'aktiv');
  insert into public.rpg_sessions (campaign_id, game_session_id, status, created_by)
  values (p_campaign_id, p_game_session_id, 'aktiv', auth.uid()) returning id into v_id;
  update public.rpg_campaigns set status = 'aktiv', updated_at = now() where id = p_campaign_id;
  return v_id;
end;
$$;

-- Mitspieler der laufenden Live-Sitzung in die Kampagne übernehmen (nur Host).
-- p_members: [{"user_id": "...", "display_name": "...", "character_id": "..."}]
-- Übernommen wird nur, wer wirklich in der Live-Sitzung der Kampagne ist. Höchstens 8 Plätze.
create or replace function public.rpg_sync_members(p_campaign_id uuid, p_members jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare v_gs uuid; v_m jsonb; v_n integer := 0;
begin
  if not public.rpg_ist_host(p_campaign_id) then raise exception 'Nur der Host kann Mitspieler übernehmen.'; end if;
  select game_session_id into v_gs from public.rpg_sessions where campaign_id = p_campaign_id and status in ('wartend', 'aktiv');
  if v_gs is null then raise exception 'Es läuft keine Live-Sitzung für diese Kampagne.'; end if;
  for v_m in select * from jsonb_array_elements(coalesce(p_members, '[]'::jsonb)) loop
    if not exists (select 1 from public.session_players where session_id = v_gs and user_id = (v_m->>'user_id')::uuid) then continue; end if;
    if (v_m->>'user_id')::uuid = auth.uid() then continue; end if;
    if not exists (select 1 from public.rpg_campaign_members where campaign_id = p_campaign_id and user_id = (v_m->>'user_id')::uuid)
       and (select count(*) from public.rpg_campaign_members where campaign_id = p_campaign_id and member_status = 'aktiv') >= 8 then
      raise exception 'Die Kampagne hat bereits 8 Plätze.';
    end if;
    insert into public.rpg_campaign_members (campaign_id, user_id, role, display_name, character_id)
    values (p_campaign_id, (v_m->>'user_id')::uuid, 'spieler', left(coalesce(nullif(trim(v_m->>'display_name'), ''), 'Gast'), 24), nullif(v_m->>'character_id', ''))
    on conflict (campaign_id, user_id) do update set
      display_name = excluded.display_name, character_id = excluded.character_id, member_status = 'aktiv', left_at = null
    where public.rpg_campaign_members.role = 'spieler';
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

-- Neu beginnen (nur Host): alle Spielstände löschen, Version 0. Mitglieder bleiben.
create or replace function public.rpg_reset_campaign(p_campaign_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  if not public.rpg_ist_host(p_campaign_id) then raise exception 'Nur der Host kann die Kampagne neu beginnen.'; end if;
  perform 1 from public.rpg_campaigns where id = p_campaign_id for update;
  delete from public.rpg_state_snapshots where campaign_id = p_campaign_id;
  get diagnostics v_n = row_count;
  update public.rpg_campaigns set current_version = 0, checkpoint = '{}'::jsonb, status = 'aktiv', completed_at = null, updated_at = now()
  where id = p_campaign_id;
  return v_n;
end;
$$;

-- Kampagne endgültig löschen (nur Host) – mit allen Spielständen, Sitzungen und Plätzen
create or replace function public.rpg_delete_campaign(p_campaign_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.rpg_ist_host(p_campaign_id) then raise exception 'Nur der Host kann die Kampagne löschen.'; end if;
  delete from public.rpg_campaigns where id = p_campaign_id;
end;
$$;

-- Kampagne verlassen (Mitspieler; der Host löscht oder übergibt später)
create or replace function public.rpg_leave_campaign(p_campaign_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.rpg_ist_host(p_campaign_id) then raise exception 'Als Host kannst du die Kampagne nicht verlassen, nur löschen.'; end if;
  update public.rpg_campaign_members set member_status = 'ausgetreten', left_at = now()
  where campaign_id = p_campaign_id and user_id = auth.uid() and member_status = 'aktiv';
end;
$$;

-- Ausführen dürfen nur angemeldete Nutzer (Gäste sind anonym angemeldet = authenticated)
revoke all on function
  public.rpg_ist_mitglied(uuid), public.rpg_ist_host(uuid),
  public.rpg_create_campaign(text, text, text, text), public.rpg_save_snapshot(uuid, integer, jsonb, text, jsonb),
  public.rpg_load_campaign(uuid), public.rpg_my_campaigns(), public.rpg_set_campaign_status(uuid, text),
  public.rpg_start_session(uuid, uuid), public.rpg_sync_members(uuid, jsonb), public.rpg_reset_campaign(uuid),
  public.rpg_delete_campaign(uuid), public.rpg_leave_campaign(uuid)
from public, anon;
grant execute on function
  public.rpg_ist_mitglied(uuid), public.rpg_ist_host(uuid),
  public.rpg_create_campaign(text, text, text, text), public.rpg_save_snapshot(uuid, integer, jsonb, text, jsonb),
  public.rpg_load_campaign(uuid), public.rpg_my_campaigns(), public.rpg_set_campaign_status(uuid, text),
  public.rpg_start_session(uuid, uuid), public.rpg_sync_members(uuid, jsonb), public.rpg_reset_campaign(uuid),
  public.rpg_delete_campaign(uuid), public.rpg_leave_campaign(uuid)
to authenticated;

commit;

-- =====================================================================
-- PRÜFEN (optional, im SQL Editor):
--   select table_name from information_schema.tables where table_name like 'rpg\_%';
--   select proname from pg_proc where proname like 'rpg\_%' order by 1;
-- =====================================================================
