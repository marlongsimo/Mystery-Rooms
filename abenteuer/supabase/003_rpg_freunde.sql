-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 003: Freunde und Kampagnen-Einladungen
-- Setzt Migration 001 und 002 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG: neue Tabellen rpg_friendships und rpg_campaign_invites,
-- neue rpg_-Funktionen; die Lese-Richtlinie für rpg_profiles wird erweitert
-- (Freunde und offene Anfragen dürfen sich gegenseitig sehen).
-- Escape Rooms und Krimidinner sind nicht betroffen.
--
-- Regeln:
--   • Freunde gibt es nur zwischen Konten (Gäste haben keinen Benutzernamen).
--   • Gesucht wird nur nach dem exakten Benutzernamen – es gibt keine Liste aller Spieler.
--   • Höchstens 20 Freundschaftsanfragen je Tag. Wer blockiert, bekommt keine Anfragen mehr.
--   • Zu einer Kampagne einladen kann nur ihr Host, und nur bestätigte Freunde.
--     Wer annimmt, wird Mitspieler der Kampagne. Höchstens 8 Plätze.
--
-- Rückbau: 003_rpg_freunde_rueckbau.sql
-- =====================================================================

begin;

create table if not exists public.rpg_friendships (
  id            uuid        primary key default gen_random_uuid(),
  requester_id  uuid        not null references auth.users(id) on delete cascade,
  addressee_id  uuid        not null references auth.users(id) on delete cascade,
  status        text        not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  blocked_by    uuid        references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (requester_id <> addressee_id)
);
-- je Paar nur ein Eintrag (Richtung egal)
create unique index if not exists rpg_friendships_paar on public.rpg_friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists rpg_friendships_an on public.rpg_friendships (addressee_id, status);

create table if not exists public.rpg_campaign_invites (
  id           uuid        primary key default gen_random_uuid(),
  campaign_id  uuid        not null references public.rpg_campaigns(id) on delete cascade,
  from_user    uuid        not null references auth.users(id) on delete cascade,
  to_user      uuid        not null references auth.users(id) on delete cascade,
  status       text        not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  answered_at  timestamptz
);
create unique index if not exists rpg_campaign_invites_offen on public.rpg_campaign_invites (campaign_id, to_user) where status = 'pending';
create index if not exists rpg_campaign_invites_an on public.rpg_campaign_invites (to_user, status);

alter table public.rpg_friendships enable row level security;
alter table public.rpg_campaign_invites enable row level security;
revoke all on public.rpg_friendships, public.rpg_campaign_invites from anon, authenticated;
-- Kein direkter Zugriff: alles läuft über die Funktionen unten.

-- Hilfsfunktionen (nur intern)
create or replace function public.rpg_uid_von(p_handle text)
returns uuid language sql stable security definer set search_path = public as $$
  select p.user_id from public.rpg_profiles p where lower(p.handle) = lower(p_handle) and public.rpg_ist_konto(p.user_id);
$$;
create or replace function public.rpg_freundschaft(p_a uuid, p_b uuid)
returns public.rpg_friendships language sql stable security definer set search_path = public as $$
  select * from public.rpg_friendships where least(requester_id, addressee_id) = least(p_a, p_b) and greatest(requester_id, addressee_id) = greatest(p_a, p_b);
$$;
create or replace function public.rpg_sind_freunde(p_a uuid, p_b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((public.rpg_freundschaft(p_a, p_b)).status = 'accepted', false);
$$;
create or replace function public.rpg_konto_pflicht()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.rpg_ist_konto(auth.uid()) or not exists (select 1 from public.rpg_profiles where user_id = auth.uid()) then
    raise exception 'Freunde gibt es nur mit einem Spielerkonto.';
  end if;
end;
$$;

-- Profile: auch Freunde und Personen mit offener Anfrage sehen sich
create or replace function public.rpg_sieht_profil(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_user_id = auth.uid() or public.rpg_teilt_kampagne(p_user_id)
    or coalesce((public.rpg_freundschaft(auth.uid(), p_user_id)).status in ('pending', 'accepted'), false);
$$;
drop policy if exists rpg_profiles_lesen on public.rpg_profiles;
create policy rpg_profiles_lesen on public.rpg_profiles
  for select to authenticated using (public.rpg_sieht_profil(user_id));

-- Spieler über den exakten Benutzernamen finden: Name, Bild und Beziehung (keine IDs)
create or replace function public.rpg_find_player(p_handle text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid; v_f public.rpg_friendships%rowtype; v_p public.rpg_profiles%rowtype;
begin
  perform public.rpg_konto_pflicht();
  v_uid := public.rpg_uid_von(p_handle);
  if v_uid is null or v_uid = auth.uid() then return null; end if;
  v_f := public.rpg_freundschaft(auth.uid(), v_uid);
  if v_f.status = 'blocked' and v_f.blocked_by <> auth.uid() then return null; end if; -- wer mich blockiert, ist für mich unauffindbar
  select * into v_p from public.rpg_profiles where user_id = v_uid;
  return jsonb_build_object('handle', v_p.handle, 'avatar_key', v_p.avatar_key,
    'beziehung', case when v_f.id is null or v_f.status = 'declined' then 'keine'
                      when v_f.status = 'accepted' then 'freund'
                      when v_f.status = 'blocked' then 'blockiert'
                      when v_f.requester_id = auth.uid() then 'angefragt' else 'anfrage_an_mich' end);
end;
$$;

-- Freundschaftsanfrage senden. Hat der andere mir schon eine geschickt, sind wir sofort befreundet.
create or replace function public.rpg_request_friend(p_handle text)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_f public.rpg_friendships%rowtype;
begin
  perform public.rpg_konto_pflicht();
  v_uid := public.rpg_uid_von(p_handle);
  if v_uid is null then raise exception 'Diesen Spieler gibt es nicht.'; end if;
  if v_uid = auth.uid() then raise exception 'Du kannst dich nicht selbst als Freund hinzufügen.'; end if;
  v_f := public.rpg_freundschaft(auth.uid(), v_uid);
  if v_f.status = 'blocked' then raise exception 'Diese Anfrage ist nicht möglich.'; end if;
  if v_f.status = 'accepted' then return 'freund'; end if;
  if v_f.status = 'pending' and v_f.addressee_id = auth.uid() then
    update public.rpg_friendships set status = 'accepted', updated_at = now() where id = v_f.id; return 'freund';
  end if;
  if v_f.status = 'pending' then return 'angefragt'; end if;
  if (select count(*) from public.rpg_friendships where requester_id = auth.uid() and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Du hast heute schon 20 Anfragen verschickt. Versuch es morgen wieder.';
  end if;
  if v_f.id is not null then -- früher abgelehnt: neue Anfrage
    update public.rpg_friendships set requester_id = auth.uid(), addressee_id = v_uid, status = 'pending', created_at = now(), updated_at = now() where id = v_f.id;
  else
    insert into public.rpg_friendships (requester_id, addressee_id) values (auth.uid(), v_uid);
  end if;
  return 'angefragt';
end;
$$;

-- Anfrage an mich annehmen oder ablehnen
create or replace function public.rpg_answer_friend(p_handle text, p_accept boolean)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_f public.rpg_friendships%rowtype;
begin
  perform public.rpg_konto_pflicht();
  v_uid := public.rpg_uid_von(p_handle);
  v_f := public.rpg_freundschaft(auth.uid(), v_uid);
  if v_f.id is null or v_f.status <> 'pending' or v_f.addressee_id <> auth.uid() then raise exception 'Diese Anfrage gibt es nicht mehr.'; end if;
  update public.rpg_friendships set status = case when p_accept then 'accepted' else 'declined' end, updated_at = now() where id = v_f.id;
  return case when p_accept then 'freund' else 'abgelehnt' end;
end;
$$;

-- Freundschaft beenden (oder eigene Anfrage zurückziehen)
create or replace function public.rpg_remove_friend(p_handle text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_f public.rpg_friendships%rowtype;
begin
  perform public.rpg_konto_pflicht();
  v_uid := public.rpg_uid_von(p_handle);
  v_f := public.rpg_freundschaft(auth.uid(), v_uid);
  if v_f.id is not null and v_f.status in ('accepted', 'pending', 'declined') then delete from public.rpg_friendships where id = v_f.id; end if;
end;
$$;

-- Blockieren: keine Anfragen und Einladungen mehr von dieser Person
create or replace function public.rpg_block(p_handle text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_f public.rpg_friendships%rowtype;
begin
  perform public.rpg_konto_pflicht();
  v_uid := public.rpg_uid_von(p_handle);
  if v_uid is null or v_uid = auth.uid() then raise exception 'Diesen Spieler gibt es nicht.'; end if;
  v_f := public.rpg_freundschaft(auth.uid(), v_uid);
  if v_f.id is null then insert into public.rpg_friendships (requester_id, addressee_id, status, blocked_by) values (auth.uid(), v_uid, 'blocked', auth.uid());
  else update public.rpg_friendships set status = 'blocked', blocked_by = auth.uid(), updated_at = now() where id = v_f.id; end if;
  delete from public.rpg_campaign_invites where status = 'pending' and ((from_user = v_uid and to_user = auth.uid()) or (from_user = auth.uid() and to_user = v_uid));
end;
$$;

create or replace function public.rpg_unblock(p_handle text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid;
begin
  perform public.rpg_konto_pflicht();
  v_uid := public.rpg_uid_von(p_handle);
  delete from public.rpg_friendships f where f.status = 'blocked' and f.blocked_by = auth.uid()
    and least(f.requester_id, f.addressee_id) = least(auth.uid(), v_uid) and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), v_uid);
end;
$$;

-- Meine Freunde, offene Anfragen (an mich / von mir) und von mir Blockierte
create or replace function public.rpg_my_friends()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'freunde', coalesce((select jsonb_agg(jsonb_build_object('handle', p.handle, 'avatar_key', p.avatar_key) order by lower(p.handle))
      from public.rpg_friendships f join public.rpg_profiles p on p.user_id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
      where f.status = 'accepted' and auth.uid() in (f.requester_id, f.addressee_id)), '[]'::jsonb),
    'an_mich', coalesce((select jsonb_agg(jsonb_build_object('handle', p.handle, 'avatar_key', p.avatar_key, 'seit', f.created_at) order by f.created_at desc)
      from public.rpg_friendships f join public.rpg_profiles p on p.user_id = f.requester_id
      where f.status = 'pending' and f.addressee_id = auth.uid()), '[]'::jsonb),
    'von_mir', coalesce((select jsonb_agg(jsonb_build_object('handle', p.handle, 'avatar_key', p.avatar_key) order by f.created_at desc)
      from public.rpg_friendships f join public.rpg_profiles p on p.user_id = f.addressee_id
      where f.status = 'pending' and f.requester_id = auth.uid()), '[]'::jsonb),
    'blockiert', coalesce((select jsonb_agg(jsonb_build_object('handle', p.handle) order by lower(p.handle))
      from public.rpg_friendships f join public.rpg_profiles p on p.user_id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
      where f.status = 'blocked' and f.blocked_by = auth.uid()), '[]'::jsonb));
$$;

-- Freund zu einer Kampagne einladen (nur Host, nur bestätigte Freunde)
create or replace function public.rpg_invite_friend(p_campaign_id uuid, p_handle text)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_status text;
begin
  perform public.rpg_konto_pflicht();
  if not public.rpg_ist_host(p_campaign_id) then raise exception 'Nur der Host kann zu dieser Kampagne einladen.'; end if;
  select status into v_status from public.rpg_campaigns where id = p_campaign_id;
  if v_status in ('abgeschlossen', 'archiviert') then raise exception 'Zu dieser Kampagne kann niemand mehr eingeladen werden.'; end if;
  v_uid := public.rpg_uid_von(p_handle);
  if v_uid is null or not public.rpg_sind_freunde(auth.uid(), v_uid) then raise exception 'Einladen kannst du nur Freunde, die deine Anfrage angenommen haben.'; end if;
  if exists (select 1 from public.rpg_campaign_members where campaign_id = p_campaign_id and user_id = v_uid and member_status = 'aktiv') then return 'mitglied'; end if;
  if (select count(*) from public.rpg_campaign_members where campaign_id = p_campaign_id and member_status = 'aktiv')
     + (select count(*) from public.rpg_campaign_invites where campaign_id = p_campaign_id and status = 'pending') >= 8 then
    raise exception 'Die Kampagne hat bereits 8 Plätze.';
  end if;
  insert into public.rpg_campaign_invites (campaign_id, from_user, to_user) values (p_campaign_id, auth.uid(), v_uid)
  on conflict (campaign_id, to_user) where status = 'pending' do nothing;
  return 'eingeladen';
end;
$$;

-- Einladung annehmen (wird Mitspieler) oder ablehnen
create or replace function public.rpg_answer_invite(p_invite_id uuid, p_accept boolean)
returns text language plpgsql security definer set search_path = public as $$
declare v_i public.rpg_campaign_invites%rowtype; v_name text;
begin
  perform public.rpg_konto_pflicht();
  select * into v_i from public.rpg_campaign_invites where id = p_invite_id and to_user = auth.uid() and status = 'pending' for update;
  if not found then raise exception 'Diese Einladung gibt es nicht mehr.'; end if;
  update public.rpg_campaign_invites set status = case when p_accept then 'accepted' else 'declined' end, answered_at = now() where id = v_i.id;
  if not p_accept then return 'abgelehnt'; end if;
  select handle into v_name from public.rpg_profiles where user_id = auth.uid();
  insert into public.rpg_campaign_members (campaign_id, user_id, role, display_name)
  values (v_i.campaign_id, auth.uid(), 'spieler', left(v_name, 24))
  on conflict (campaign_id, user_id) do update set member_status = 'aktiv', left_at = null, display_name = excluded.display_name
  where public.rpg_campaign_members.role = 'spieler';
  return 'mitglied';
end;
$$;

-- Offene Einladungen eines Hosts zu einer Kampagne (für „Freunde einladen“)
create or replace function public.rpg_campaign_open_invites(p_campaign_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.rpg_ist_host(p_campaign_id) then coalesce(jsonb_agg(p.handle order by lower(p.handle)), '[]'::jsonb) else '[]'::jsonb end
  from public.rpg_campaign_invites i join public.rpg_profiles p on p.user_id = i.to_user
  where i.campaign_id = p_campaign_id and i.status = 'pending';
$$;

-- Alles, was auf mich wartet (für die Glocke): Freundschaftsanfragen und Kampagnen-Einladungen
create or replace function public.rpg_my_inbox()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'freunde', coalesce((select jsonb_agg(jsonb_build_object('handle', p.handle, 'avatar_key', p.avatar_key, 'seit', f.created_at) order by f.created_at desc)
      from public.rpg_friendships f join public.rpg_profiles p on p.user_id = f.requester_id
      where f.status = 'pending' and f.addressee_id = auth.uid()), '[]'::jsonb),
    'kampagnen', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'titel', c.title, 'von', p.handle, 'avatar_key', p.avatar_key, 'seit', i.created_at) order by i.created_at desc)
      from public.rpg_campaign_invites i join public.rpg_campaigns c on c.id = i.campaign_id join public.rpg_profiles p on p.user_id = i.from_user
      where i.to_user = auth.uid() and i.status = 'pending' and c.status not in ('abgeschlossen', 'archiviert')), '[]'::jsonb));
$$;

-- Rechte: Hilfsfunktionen intern, die übrigen für angemeldete Nutzer
revoke all on function public.rpg_uid_von(text), public.rpg_freundschaft(uuid, uuid), public.rpg_sind_freunde(uuid, uuid), public.rpg_konto_pflicht() from public, anon, authenticated;
revoke all on function public.rpg_sieht_profil(uuid), public.rpg_find_player(text), public.rpg_request_friend(text), public.rpg_answer_friend(text, boolean),
  public.rpg_remove_friend(text), public.rpg_block(text), public.rpg_unblock(text), public.rpg_my_friends(), public.rpg_invite_friend(uuid, text),
  public.rpg_answer_invite(uuid, boolean), public.rpg_campaign_open_invites(uuid), public.rpg_my_inbox() from public, anon;
grant execute on function public.rpg_sieht_profil(uuid), public.rpg_find_player(text), public.rpg_request_friend(text), public.rpg_answer_friend(text, boolean),
  public.rpg_remove_friend(text), public.rpg_block(text), public.rpg_unblock(text), public.rpg_my_friends(), public.rpg_invite_friend(uuid, text),
  public.rpg_answer_invite(uuid, boolean), public.rpg_campaign_open_invites(uuid), public.rpg_my_inbox() to authenticated;

commit;
