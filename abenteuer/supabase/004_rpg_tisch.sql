-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 004: Spieltisch-Geräte und Kampagnen-Links
-- Setzt Migration 001–003 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG. Neu:
--   • Rolle „tisch“: ein Gerät, das als Spieltisch einer Kampagne spielt (auch ohne Konto).
--     Es darf speichern, Sitzungen starten, Mitspieler übernehmen, pausieren und abschließen –
--     aber nicht löschen, archivieren, neu beginnen oder einladen.
--   • Kampagnen-Links (Tabelle rpg_links): ein Link für Gäste (7 Tage gültig) und einer für das
--     Tisch-Gerät (24 Stunden), je Kampagne immer nur der neueste. In der Datenbank liegt nur ein Hash.
--   • Wer per Gast-Link beitritt, wird Mitspieler und findet den Raum des Spieltischs von selbst –
--     auch wenn der Tisch später auf ein anderes Gerät wechselt.
--   • Kampagne umbenennen (Host).
-- Die Funktionen rpg_save_snapshot, rpg_start_session, rpg_sync_members und rpg_set_campaign_status
-- aus Migration 001 werden ersetzt (nur die Rechteprüfung ändert sich: Host ODER Tisch).
-- Bestehende Tabellen der Escape Rooms und Krimidinner werden nur gelesen (Raumcode der Live-Sitzung).
--
-- Rückbau: 004_rpg_tisch_rueckbau.sql
-- =====================================================================

begin;

-- Rolle „tisch“ zulassen
do $$
declare v_name text;
begin
  for v_name in select conname from pg_constraint where conrelid = 'public.rpg_campaign_members'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%role%' loop
    execute format('alter table public.rpg_campaign_members drop constraint %I', v_name);
  end loop;
end $$;
alter table public.rpg_campaign_members add constraint rpg_campaign_members_role_check check (role in ('host', 'spieler', 'tisch'));

create or replace function public.rpg_ist_tisch(p_campaign_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rpg_campaign_members where campaign_id = p_campaign_id and user_id = auth.uid() and role in ('host', 'tisch') and member_status = 'aktiv');
$$;

create or replace function public.rpg_save_snapshot(
  p_campaign_id uuid, p_expected_version integer, p_state jsonb, p_kind text default 'auto', p_checkpoint jsonb default null)
returns integer language plpgsql security definer set search_path = public as $$
declare v_c public.rpg_campaigns%rowtype; v_neu integer;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  if not public.rpg_ist_tisch(p_campaign_id) then raise exception 'Nur der Spieltisch kann den Spielstand speichern.'; end if;
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

create or replace function public.rpg_start_session(p_campaign_id uuid, p_game_session_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_status text; v_id uuid;
begin
  if not public.rpg_ist_tisch(p_campaign_id) then raise exception 'Nur der Spieltisch kann eine Sitzung starten.'; end if;
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

create or replace function public.rpg_sync_members(p_campaign_id uuid, p_members jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare v_gs uuid; v_m jsonb; v_n integer := 0;
begin
  if not public.rpg_ist_tisch(p_campaign_id) then raise exception 'Nur der Spieltisch kann Mitspieler übernehmen.'; end if;
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

create or replace function public.rpg_set_campaign_status(p_campaign_id uuid, p_status text)
returns text language plpgsql security definer set search_path = public as $$
declare v_alt text;
begin
  if not public.rpg_ist_tisch(p_campaign_id) then raise exception 'Nur der Host kann den Status ändern.'; end if;
  -- Ein Tisch-Gerät darf nur fortsetzen, pausieren und abschließen; archivieren nur der Host
  if not public.rpg_ist_host(p_campaign_id) and p_status not in ('aktiv', 'pausiert', 'abgeschlossen') then raise exception 'Nur der Host kann den Status ändern.'; end if;
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

-- Kampagne umbenennen (Host)
create or replace function public.rpg_rename_campaign(p_campaign_id uuid, p_title text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.rpg_ist_host(p_campaign_id) then raise exception 'Nur der Host kann die Kampagne umbenennen.'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Bitte einen Namen eingeben.'; end if;
  update public.rpg_campaigns set title = left(trim(p_title), 80), updated_at = now() where id = p_campaign_id;
  return left(trim(p_title), 80);
end;
$$;

-- Kampagnen-Links
create table if not exists public.rpg_links (
  id           uuid        primary key default gen_random_uuid(),
  campaign_id  uuid        not null references public.rpg_campaigns(id) on delete cascade,
  art          text        not null check (art in ('gast', 'tisch')),
  token_hash   text        not null unique,
  created_by   uuid        references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  revoked_at   timestamptz
);
create index if not exists rpg_links_kampagne on public.rpg_links (campaign_id, art);
alter table public.rpg_links enable row level security;
revoke all on public.rpg_links from anon, authenticated;

create or replace function public.rpg_link_hash(p_token text)
returns text language sql immutable as $$ select encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex'); $$;

-- Gültiger Link zu einem Token (oder nichts)
create or replace function public.rpg_link_von(p_token text)
returns public.rpg_links language sql stable security definer set search_path = public as $$
  select * from public.rpg_links where token_hash = public.rpg_link_hash(p_token) and revoked_at is null and expires_at > now();
$$;

-- Raumcode der laufenden Live-Sitzung einer Kampagne (oder null)
create or replace function public.rpg_raum_von(p_campaign_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select g.room_code from public.rpg_sessions s join public.game_sessions g on g.id = s.game_session_id
  where s.campaign_id = p_campaign_id and s.status in ('wartend', 'aktiv') and g.status <> 'closed'
  order by s.created_at desc limit 1;
$$;

-- Neuen Link erzeugen (der vorige derselben Art wird ungültig). Gast-Link: Host oder Tisch; Tisch-Link: Host oder bisheriger Tisch.
-- Das Token wird nur hier einmal zurückgegeben.
create or replace function public.rpg_create_link(p_campaign_id uuid, p_art text)
returns text language plpgsql security definer set search_path = public as $$
declare v_token text; v_status text;
begin
  if p_art not in ('gast', 'tisch') then raise exception 'Unbekannte Link-Art.'; end if;
  if not public.rpg_ist_tisch(p_campaign_id) then raise exception 'Nur der Host oder der Spieltisch kann Einladungs-Links erzeugen.'; end if;
  select status into v_status from public.rpg_campaigns where id = p_campaign_id;
  if v_status in ('abgeschlossen', 'archiviert') then raise exception 'Diese Kampagne ist %.', v_status; end if;
  if (select count(*) from public.rpg_links where campaign_id = p_campaign_id and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Zu viele neue Links in kurzer Zeit.';
  end if;
  update public.rpg_links set revoked_at = now() where campaign_id = p_campaign_id and art = p_art and revoked_at is null;
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.rpg_links (campaign_id, art, token_hash, created_by, expires_at)
  values (p_campaign_id, p_art, public.rpg_link_hash(v_token), auth.uid(), now() + case when p_art = 'tisch' then interval '24 hours' else interval '7 days' end);
  return v_token;
end;
$$;

-- Was steckt hinter einem Link? (Titel, Art, ob der Spieltisch schon verbunden ist)
create or replace function public.rpg_link_info(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_l public.rpg_links%rowtype; v_c public.rpg_campaigns%rowtype; v_host text;
begin
  v_l := public.rpg_link_von(p_token);
  if v_l.id is null then return null; end if;
  select * into v_c from public.rpg_campaigns where id = v_l.campaign_id;
  select coalesce(p.handle, m.display_name) into v_host from public.rpg_campaign_members m left join public.rpg_profiles p on p.user_id = m.user_id
  where m.campaign_id = v_c.id and m.role = 'host';
  return jsonb_build_object('art', v_l.art, 'titel', v_c.title, 'host', v_host, 'status', v_c.status, 'tisch_verbunden', public.rpg_raum_von(v_c.id) is not null);
end;
$$;

-- Per Gast-Link Mitspieler werden; liefert den Raumcode, sobald der Spieltisch verbunden ist
create or replace function public.rpg_join_as_guest(p_token text, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_l public.rpg_links%rowtype; v_c public.rpg_campaigns%rowtype; v_name text;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  v_l := public.rpg_link_von(p_token);
  if v_l.id is null or v_l.art <> 'gast' then raise exception 'Dieser Einladungs-Link ist abgelaufen oder ungültig.'; end if;
  select * into v_c from public.rpg_campaigns where id = v_l.campaign_id;
  if v_c.status in ('abgeschlossen', 'archiviert') then raise exception 'Diese Kampagne ist beendet.'; end if;
  if not exists (select 1 from public.rpg_campaign_members where campaign_id = v_c.id and user_id = auth.uid() and member_status = 'aktiv') then
    if (select count(*) from public.rpg_campaign_members where campaign_id = v_c.id and member_status = 'aktiv' and role <> 'tisch') >= 8 then
      raise exception 'Die Kampagne hat bereits 8 Plätze.';
    end if;
    select coalesce((select handle from public.rpg_profiles where user_id = auth.uid()), nullif(trim(p_name), ''), 'Gast') into v_name;
    insert into public.rpg_campaign_members (campaign_id, user_id, role, display_name) values (v_c.id, auth.uid(), 'spieler', left(v_name, 24))
    on conflict (campaign_id, user_id) do update set member_status = 'aktiv', left_at = null where public.rpg_campaign_members.role = 'spieler';
  end if;
  return jsonb_build_object('campaign_id', v_c.id, 'titel', v_c.title, 'raum', public.rpg_raum_von(v_c.id));
end;
$$;

-- Per Tisch-Link dieses Gerät zum Spieltisch der Kampagne machen (der bisherige Tisch scheidet aus)
create or replace function public.rpg_claim_table(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_l public.rpg_links%rowtype; v_c public.rpg_campaigns%rowtype;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  v_l := public.rpg_link_von(p_token);
  if v_l.id is null or v_l.art <> 'tisch' then raise exception 'Dieser Tisch-Link ist abgelaufen oder ungültig.'; end if;
  select * into v_c from public.rpg_campaigns where id = v_l.campaign_id;
  if v_c.status in ('abgeschlossen', 'archiviert') then raise exception 'Diese Kampagne ist beendet.'; end if;
  if not public.rpg_ist_host(v_c.id) then
    update public.rpg_campaign_members set member_status = 'ausgetreten', left_at = now() where campaign_id = v_c.id and role = 'tisch' and user_id <> auth.uid();
    insert into public.rpg_campaign_members (campaign_id, user_id, role, display_name) values (v_c.id, auth.uid(), 'tisch', 'Spieltisch')
    on conflict (campaign_id, user_id) do update set role = 'tisch', member_status = 'aktiv', left_at = null, display_name = 'Spieltisch';
  end if;
  update public.rpg_links set revoked_at = now() where id = v_l.id; -- Tisch-Links gelten einmal
  return jsonb_build_object('campaign_id', v_c.id, 'titel', v_c.title, 'difficulty', v_c.difficulty, 'version', v_c.current_version, 'status', v_c.status);
end;
$$;

-- Raumcode für Mitglieder (z. B. eingeladene Freunde): „Zum Spieltisch“
create or replace function public.rpg_campaign_room(p_campaign_id uuid)
returns text language plpgsql stable security definer set search_path = public as $$
begin
  if not public.rpg_ist_mitglied(p_campaign_id) then raise exception 'Du gehörst nicht zu dieser Kampagne.'; end if;
  return public.rpg_raum_von(p_campaign_id);
end;
$$;

revoke all on function public.rpg_link_hash(text), public.rpg_link_von(text), public.rpg_raum_von(uuid) from public, anon, authenticated;
revoke all on function public.rpg_ist_tisch(uuid), public.rpg_rename_campaign(uuid, text), public.rpg_create_link(uuid, text), public.rpg_link_info(text),
  public.rpg_join_as_guest(text, text), public.rpg_claim_table(text), public.rpg_campaign_room(uuid) from public, anon;
grant execute on function public.rpg_ist_tisch(uuid), public.rpg_rename_campaign(uuid, text), public.rpg_create_link(uuid, text), public.rpg_link_info(text),
  public.rpg_join_as_guest(text, text), public.rpg_claim_table(text), public.rpg_campaign_room(uuid) to authenticated;

commit;
