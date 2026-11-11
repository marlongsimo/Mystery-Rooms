-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 002: Spielerprofile mit eindeutigem Benutzernamen
-- Bauabschnitt B (Konten). Setzt Migration 001 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG:
--   • legt die Tabelle rpg_profiles und rpg_-Funktionen an
--   • ersetzt zwei Funktionen aus Migration 001 (rpg_load_campaign, rpg_my_campaigns),
--     damit Mitspieler mit ihrem Benutzernamen erscheinen
--   • liest auth.users nur, um zu prüfen, ob ein Konto bestätigt ist (is_anonymous);
--     E-Mail-Adressen werden nirgends herausgegeben
--   • ändert keine Tabellen oder Daten der Escape Rooms und Krimidinner
--
-- Benutzernamen: 3–20 Zeichen, Buchstaben (auch ÄÖÜäöüß), Ziffern und _.
-- Groß/klein zählt beim Vergleich gleich („Anna“ = „anna“), angezeigt wird die eigene Schreibweise.
-- Ein Gast (noch nicht bestätigtes Konto) reserviert seinen Namen für 2 Tage; danach ist er wieder frei.
--
-- Rückbau: 002_rpg_profile_rueckbau.sql
-- =====================================================================

begin;

create table if not exists public.rpg_profiles (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  handle      text        not null check (handle ~ '^[A-Za-z0-9_ÄÖÜäöüß]{3,20}$'),
  avatar_key  text        check (avatar_key is null or avatar_key ~ '^[a-z0-9_-]{1,40}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists rpg_profiles_handle_eindeutig on public.rpg_profiles (lower(handle));

-- Ist p_user_id ein bestätigtes Konto (kein anonymer Gast)?
create or replace function public.rpg_ist_konto(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from auth.users u where u.id = p_user_id and coalesce(u.is_anonymous, false) = false);
$$;

-- Teilen der Aufrufer und p_user_id eine Kampagne? (Profile sind nur unter Mitspielern sichtbar)
create or replace function public.rpg_teilt_kampagne(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.rpg_campaign_members a
    join public.rpg_campaign_members b on b.campaign_id = a.campaign_id
    where a.user_id = auth.uid() and a.member_status = 'aktiv' and b.user_id = p_user_id and b.member_status = 'aktiv');
$$;

alter table public.rpg_profiles enable row level security;
revoke all on public.rpg_profiles from anon, authenticated;
grant select (user_id, handle, avatar_key, created_at) on public.rpg_profiles to authenticated;
drop policy if exists rpg_profiles_lesen on public.rpg_profiles;
create policy rpg_profiles_lesen on public.rpg_profiles
  for select to authenticated using (user_id = auth.uid() or public.rpg_teilt_kampagne(user_id));

-- Reservierte Namen
create or replace function public.rpg_name_gesperrt(p_handle text)
returns boolean language sql immutable as $$
  select lower(p_handle) = any (array['admin', 'administrator', 'mythara', 'caseunlocked', 'case_unlocked', 'spieltisch', 'gast',
    'system', 'moderator', 'support', 'host', 'valdric', 'anselm']);
$$;

-- Ist der Name frei? (für die Live-Prüfung im Registrierungsformular)
-- Belegt ist ein Name, wenn ein bestätigtes Konto ihn hat oder ein Gast ihn vor weniger als 2 Tagen reserviert hat.
create or replace function public.rpg_handle_frei(p_handle text)
returns text language plpgsql stable security definer set search_path = public as $$
declare v_p public.rpg_profiles%rowtype;
begin
  if p_handle is null or p_handle !~ '^[A-Za-z0-9_ÄÖÜäöüß]{3,20}$' then return 'ungueltig'; end if;
  if public.rpg_name_gesperrt(p_handle) then return 'gesperrt'; end if;
  select * into v_p from public.rpg_profiles where lower(handle) = lower(p_handle);
  if not found or v_p.user_id = auth.uid() then return 'frei'; end if;
  if public.rpg_ist_konto(v_p.user_id) or v_p.updated_at > now() - interval '2 days' then return 'vergeben'; end if;
  return 'frei';
end;
$$;

-- Eigenen Benutzernamen festlegen oder ändern. Abgelaufene Gast-Reservierungen werden dabei freigegeben.
create or replace function public.rpg_set_profile(p_handle text, p_avatar_key text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_frei text; v_p public.rpg_profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  v_frei := public.rpg_handle_frei(p_handle);
  if v_frei = 'ungueltig' then raise exception 'Der Benutzername braucht 3–20 Zeichen: Buchstaben, Ziffern oder _.'; end if;
  if v_frei = 'gesperrt' then raise exception 'Dieser Benutzername ist nicht erlaubt.'; end if;
  if v_frei = 'vergeben' then raise exception 'Dieser Benutzername ist schon vergeben.'; end if;
  delete from public.rpg_profiles where lower(handle) = lower(p_handle) and user_id <> auth.uid(); -- abgelaufene Reservierung
  begin
    insert into public.rpg_profiles (user_id, handle, avatar_key) values (auth.uid(), p_handle, p_avatar_key)
    on conflict (user_id) do update set handle = excluded.handle, avatar_key = coalesce(excluded.avatar_key, public.rpg_profiles.avatar_key), updated_at = now()
    returning * into v_p;
  exception when unique_violation then
    raise exception 'Dieser Benutzername ist schon vergeben.';
  end;
  -- In allen eigenen Kampagnen unter dem neuen Namen erscheinen
  update public.rpg_campaign_members set display_name = left(p_handle, 24) where user_id = auth.uid();
  return jsonb_build_object('handle', v_p.handle, 'avatar_key', v_p.avatar_key, 'konto', public.rpg_ist_konto(auth.uid()));
end;
$$;

-- Eigenes Profil (null, wenn noch keins)
create or replace function public.rpg_my_profile()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when p.user_id is null then null else
    jsonb_build_object('handle', p.handle, 'avatar_key', p.avatar_key, 'created_at', p.created_at, 'konto', public.rpg_ist_konto(auth.uid())) end
  from (select 1) x left join public.rpg_profiles p on p.user_id = auth.uid();
$$;

-- Migration 001 ergänzen: Mitspieler mit Benutzername (falls vorhanden)
create or replace function public.rpg_load_campaign(p_campaign_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_c public.rpg_campaigns%rowtype; v_state jsonb;
begin
  if not public.rpg_ist_mitglied(p_campaign_id) then raise exception 'Du gehörst nicht zu dieser Kampagne.'; end if;
  select * into v_c from public.rpg_campaigns where id = p_campaign_id;
  select state into v_state from public.rpg_state_snapshots where campaign_id = p_campaign_id and version = v_c.current_version;
  return jsonb_build_object(
    'campaign', to_jsonb(v_c), 'version', v_c.current_version, 'state', v_state,
    'members', (select coalesce(jsonb_agg(jsonb_build_object('user_id', m.user_id, 'display_name', coalesce(p.handle, m.display_name), 'handle', p.handle, 'role', m.role,
                  'character_id', m.character_id, 'member_status', m.member_status) order by m.joined_at), '[]'::jsonb)
                from public.rpg_campaign_members m left join public.rpg_profiles p on p.user_id = m.user_id
                where m.campaign_id = p_campaign_id));
end;
$$;

create or replace function public.rpg_my_campaigns()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'title', c.title, 'adventure_slug', c.adventure_slug, 'status', c.status, 'difficulty', c.difficulty,
      'version', c.current_version, 'checkpoint', c.checkpoint, 'updated_at', c.updated_at, 'created_at', c.created_at,
      'role', me.role, 'is_owner', c.owner_user_id = auth.uid(),
      'laeuft', exists (select 1 from public.rpg_sessions s where s.campaign_id = c.id and s.status in ('wartend', 'aktiv')),
      'members', (select coalesce(jsonb_agg(jsonb_build_object('display_name', coalesce(p.handle, m.display_name), 'role', m.role, 'character_id', m.character_id) order by m.joined_at), '[]'::jsonb)
                  from public.rpg_campaign_members m left join public.rpg_profiles p on p.user_id = m.user_id
                  where m.campaign_id = c.id and m.member_status = 'aktiv'))
    order by c.updated_at desc), '[]'::jsonb)
  from public.rpg_campaigns c
  join public.rpg_campaign_members me on me.campaign_id = c.id and me.user_id = auth.uid() and me.member_status = 'aktiv';
$$;

-- rpg_ist_konto und rpg_name_gesperrt werden nur intern genutzt und sind nicht aufrufbar
revoke all on function public.rpg_ist_konto(uuid), public.rpg_name_gesperrt(text) from public, anon, authenticated;
revoke all on function public.rpg_teilt_kampagne(uuid), public.rpg_handle_frei(text), public.rpg_set_profile(text, text), public.rpg_my_profile() from public, anon;
grant execute on function public.rpg_teilt_kampagne(uuid), public.rpg_handle_frei(text), public.rpg_set_profile(text, text), public.rpg_my_profile() to authenticated;

commit;
