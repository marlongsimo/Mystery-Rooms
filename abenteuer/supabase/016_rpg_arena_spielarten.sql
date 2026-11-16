-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 016: Arena – Normal, Arcade und privater Kampf
-- Setzt Migration 003 (Freunde), 008, 014 und 015 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
-- Bitte UNVERÄNDERT ausführen. Dazu gehört die neu gebaute Edge Function „arena“ (index.ts): Erst mit ihr gilt der
-- festgelegte Modus auch auf dem Server. Reihenfolge: erst diese Migration, dann die Function neu ausrollen.
--
-- NUR FÜR DAS RPG. Additiv: eine neue Tabelle, drei neue Spalten in Tabellen des Serverkampfs (aus Migration 015),
-- neue Funktionen. Zwei Funktionen aus Migration 015 (rpg_arena_fight, rpg_arena_srv_load) bekommen je eine zusätzliche
-- Angabe in ihrer Antwort; die Suche aus 015 (rpg_arena_search_server) reiht sich in die Arcade-Warteschlange ein. Nichts aus den Migrationen 001 bis 014 wird geändert; die bisherige Arena läuft weiter.
--
-- Was diese Migration bringt (alles als Serverkampf):
--   • Normal:  rpg_arena_queue('normal')  – sucht einen Gegner mit passender Stufe, gespielt wird immer ein Duell.
--   • Arcade:  rpg_arena_queue('arcade')  – ebenso, der Modus wird aus Arena, Königsmord und Horde ausgelost.
--     Normal und Arcade haben getrennte Warteschlangen. Belohnungen wie bisher.
--   • Privater Kampf: einen Freund einladen (rpg_arena_invite) und den Modus selbst wählen. Der Eingeladene nimmt an oder
--     lehnt ab (rpg_arena_invite_answer). Ohne Stufengrenze und OHNE Belohnung – sonst könnten sich Freunde gegenseitig
--     Siege zuschieben. Dafür trägt die Migration für beide Konten schon beim Anlegen einen Belohnungseintrag
--     „nicht gewertet“ ein; die vorhandene Funktion rpg_arena_belohnen bucht dann nichts mehr.
--   • Der Modus eines Serverkampfs steht jetzt am Kampf (rpg_arena_fights.modus) und wird nicht mehr aus der
--     Zufallszahl abgeleitet.
--
-- Rückbau: 016_rpg_arena_spielarten_rueckbau.sql
-- =====================================================================
begin;

do $$ begin
  if to_regclass('public.rpg_arena_fights') is null or to_regclass('public.rpg_arena_search_srv') is null then
    raise exception 'Migration 016 braucht Migration 015 (Arena-Serverkampf). Bitte zuerst 015 ausführen.';
  end if;
  if to_regprocedure('public.rpg_sind_freunde(uuid, uuid)') is null or to_regprocedure('public.rpg_uid_von(text)') is null then
    raise exception 'Migration 016 braucht die Freundesfunktionen aus Migration 003 (rpg_sind_freunde, rpg_uid_von). Mindestens eine fehlt oder hat andere Parameter.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1) Spalten und Tabelle
-- ---------------------------------------------------------------------
alter table public.rpg_arena_fights add column if not exists modus text check (modus is null or modus in ('arena', 'koenig', 'horde', 'duell'));
alter table public.rpg_arena_fights add column if not exists privat boolean not null default false;
alter table public.rpg_arena_search_srv add column if not exists art text not null default 'arcade' check (art in ('normal', 'arcade'));

-- Einladungen zu einem privaten Kampf
create table if not exists public.rpg_arena_invites (
  id          uuid        primary key default gen_random_uuid(),
  von         uuid        not null references auth.users(id) on delete cascade,
  an          uuid        not null references auth.users(id) on delete cascade,
  modus       text        not null check (modus in ('arena', 'koenig', 'horde', 'duell')),
  status      text        not null default 'offen' check (status in ('offen', 'angenommen', 'abgelehnt', 'zurueck')),
  match_id    uuid        references public.rpg_arena_matches(id) on delete set null,
  created_at  timestamptz not null default now(),
  seen_at     timestamptz not null default now()    -- Lebenszeichen des Einladenden: Nur wer noch wartet, kann angenommen werden
);
create index if not exists rpg_arena_invites_an on public.rpg_arena_invites (an, created_at desc) where status = 'offen';
create index if not exists rpg_arena_invites_von on public.rpg_arena_invites (von, created_at desc);
alter table public.rpg_arena_invites enable row level security;
revoke all on public.rpg_arena_invites from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Suche: Normal (immer Duell) und Arcade (Arena, Königsmord oder Horde) – getrennte Warteschlangen
-- ---------------------------------------------------------------------
create or replace function public.rpg_arena_queue(p_art text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_helden text[]; v_team jsonb; v_schnitt numeric; v_id uuid; v_mein public.rpg_arena_matches%rowtype; v_json jsonb;
  v_arcade text[] := array['arena', 'koenig', 'horde'];
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
    update public.rpg_arena_search_srv set seen_at = now() where match_id = v_mein.id;
    return public.rpg_arena_get(v_mein.id);
  end if;
  v_json := public.rpg_arena_create(v_helden);
  insert into public.rpg_arena_search_srv (match_id, user_id, art) values ((v_json->>'id')::uuid, v_uid, p_art)
    on conflict (match_id) do update set seen_at = now(), art = excluded.art;
  delete from public.rpg_arena_search_srv where seen_at < now() - interval '1 day';
  return v_json;
end;
$$;

-- Die Server-Suche aus Migration 015 kannte keine Spielarten. Damit sie die Warteschlangen nicht mischt, sucht sie ab jetzt
-- wie Arcade (ihr Verhalten bisher: ausgeloster Modus). Wer Normal sucht, wird ausschließlich mit Normal verbunden.
create or replace function public.rpg_arena_search_server()
returns jsonb language sql security definer set search_path = public as $$ select public.rpg_arena_queue('arcade'); $$;

-- ---------------------------------------------------------------------
-- 3) Privater Kampf: Freund einladen, Modus wählen
-- ---------------------------------------------------------------------
-- Einladen. Eine frühere eigene offene Einladung wird dabei zurückgezogen. Zurück: die ID der Einladung.
create or replace function public.rpg_arena_invite(p_handle text, p_modus text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_an uuid; v_id uuid;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Die Arena gibt es nur mit einem Spielerkonto.'; end if;
  if p_modus is null or p_modus not in ('arena', 'koenig', 'horde', 'duell') then raise exception 'Unbekannter Modus.'; end if;
  if not exists (select 1 from public.rpg_arena_squads where user_id = v_uid) then raise exception 'Lege zuerst dein Team fest.'; end if;
  v_an := public.rpg_uid_von(p_handle);
  if v_an is null or v_an = v_uid or not public.rpg_sind_freunde(v_uid, v_an) then raise exception 'Du kannst nur Freunde einladen.'; end if;
  if exists (select 1 from public.rpg_arena_matches where (host_id = v_uid or guest_id = v_uid) and status in ('bereit', 'laeuft') and created_at > now() - interval '2 hours') then
    raise exception 'Du hast schon einen laufenden Kampf.';
  end if;
  update public.rpg_arena_invites set status = 'zurueck' where von = v_uid and status = 'offen';
  insert into public.rpg_arena_invites (von, an, modus) values (v_uid, v_an, p_modus) returning id into v_id;
  delete from public.rpg_arena_invites where created_at < now() - interval '7 days';
  return v_id;
end;
$$;

-- Meine Einladungen: an mich (nur von Freunden, die gerade noch warten) und die eigene laufende. Der Aufruf ist zugleich
-- das Lebenszeichen des Einladenden.
create or replace function public.rpg_arena_invites()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_e public.rpg_arena_invites%rowtype; v_von jsonb := null;
begin
  if v_uid is null or not public.rpg_sammlung_konto() then return jsonb_build_object('an_mich', '[]'::jsonb, 'von_mir', null); end if;
  update public.rpg_arena_invites set seen_at = now() where von = v_uid and status = 'offen';
  select * into v_e from public.rpg_arena_invites where von = v_uid and created_at > now() - interval '15 minutes' order by created_at desc limit 1;
  if found then
    v_von := jsonb_build_object('id', v_e.id, 'an', (select handle from public.rpg_profiles where user_id = v_e.an), 'modus', v_e.modus, 'status', v_e.status,
      'kampf', case when v_e.status = 'angenommen' and v_e.match_id is not null
                      and exists (select 1 from public.rpg_arena_matches m where m.id = v_e.match_id and m.status in ('bereit', 'laeuft')) then public.rpg_arena_get(v_e.match_id) else null end);
  end if;
  return jsonb_build_object('von_mir', v_von,
    'an_mich', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'von', p.handle, 'modus', e.modus, 'seit', e.created_at) order by e.created_at desc)
      from public.rpg_arena_invites e join public.rpg_profiles p on p.user_id = e.von
      where e.an = v_uid and e.status = 'offen' and e.seen_at > now() - interval '30 seconds' and e.created_at > now() - interval '15 minutes'
        and public.rpg_sind_freunde(e.von, v_uid)), '[]'::jsonb));
end;
$$;

create or replace function public.rpg_arena_invite_cancel(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.rpg_arena_invites set status = 'zurueck' where id = p_id and von = auth.uid() and status = 'offen';
  return found;
end;
$$;

-- Annehmen oder ablehnen. Beim Annehmen entsteht der Kampf sofort als Serverkampf mit dem gewählten Modus – beide treten
-- mit ihrem gespeicherten Team an, ohne Stufengrenze und ohne Belohnung. Zurück: der Kampf (wie rpg_arena_get) oder null.
create or replace function public.rpg_arena_invite_answer(p_id uuid, p_accept boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_e public.rpg_arena_invites%rowtype; v_h1 text[]; v_h2 text[]; v_t1 jsonb; v_t2 jsonb; v_id uuid;
  v_karten text[] := array['garten', 'turm', 'gruft', 'pilze', 'schacht', 'halle', 'siegel']; v_monster text[] := array['garten', 'kobolde', 'gruft'];
begin
  if v_uid is null or not public.rpg_sammlung_konto() then raise exception 'Die Arena gibt es nur mit einem Spielerkonto.'; end if;
  select * into v_e from public.rpg_arena_invites where id = p_id for update;
  if not found or v_e.an <> v_uid then raise exception 'Diese Einladung gibt es nicht.'; end if;
  if v_e.status <> 'offen' then raise exception 'Diese Einladung gilt nicht mehr.'; end if;
  if not coalesce(p_accept, false) then update public.rpg_arena_invites set status = 'abgelehnt' where id = p_id; return null; end if;
  if v_e.seen_at < now() - interval '30 seconds' or v_e.created_at < now() - interval '15 minutes' then
    update public.rpg_arena_invites set status = 'zurueck' where id = p_id;
    raise exception 'Dein Freund wartet nicht mehr.';
  end if;
  if not public.rpg_sind_freunde(v_e.von, v_uid) then raise exception 'Diese Einladung gilt nicht mehr.'; end if;
  select team into v_h1 from public.rpg_arena_squads where user_id = v_e.von;
  select team into v_h2 from public.rpg_arena_squads where user_id = v_uid;
  if v_h2 is null then raise exception 'Lege zuerst dein Team fest.'; end if;
  if v_h1 is null then raise exception 'Dein Freund hat kein Team mehr festgelegt.'; end if;
  if exists (select 1 from public.rpg_arena_matches where (host_id in (v_uid, v_e.von) or guest_id in (v_uid, v_e.von)) and status in ('bereit', 'laeuft') and created_at > now() - interval '2 hours') then
    raise exception 'Einer von euch hat schon einen laufenden Kampf.';
  end if;
  v_t1 := public.rpg_arena_team(v_e.von, v_h1); v_t2 := public.rpg_arena_team(v_uid, v_h2);
  -- wie beim Beitreten: offene eigene Kämpfe (laufende Suchen) beider Seiten verwerfen
  update public.rpg_arena_matches set status = 'abgebrochen', ended_at = now() where host_id in (v_uid, v_e.von) and status = 'offen';
  insert into public.rpg_arena_matches (status, host_id, host_name, host_team, host_schnitt, guest_id, guest_name, guest_team, guest_schnitt, karte, begegnung, seed)
    values ('bereit', v_e.von, (select handle from public.rpg_profiles where user_id = v_e.von), v_t1, public.rpg_arena_schnitt(v_t1),
      v_uid, (select handle from public.rpg_profiles where user_id = v_uid), v_t2, public.rpg_arena_schnitt(v_t2),
      v_karten[1 + floor(random() * cardinality(v_karten))::integer], v_monster[1 + floor(random() * cardinality(v_monster))::integer], floor(random() * 2000000000)::integer)
    returning id into v_id;
  insert into public.rpg_arena_fights (match_id, modus, privat) values (v_id, v_e.modus, true);
  -- Ohne Wertung: Mit diesen Einträgen bucht rpg_arena_belohnen für diesen Kampf nichts mehr (auch nicht bei einer Aufgabe)
  insert into public.rpg_arena_rewards (match_id, user_id, sieg, gewertet) values (v_id, v_e.von, false, false), (v_id, v_uid, false, false) on conflict do nothing;
  update public.rpg_arena_invites set status = 'angenommen', match_id = v_id where id = p_id;
  return public.rpg_arena_get(v_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Zwei Funktionen aus Migration 015 nennen jetzt zusätzlich Modus und „privat“
-- ---------------------------------------------------------------------
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
    'modus', v_f.modus, 'privat', v_f.privat,
    'beginn', (extract(epoch from v_f.beginn) * 1000)::bigint, 'jetzt', (extract(epoch from clock_timestamp()) * 1000)::bigint,
    'anfuehrer', case when v_seite = 1 then v_f.anf1 else v_f.anf2 end, 'schritte', v_schritte);
end;
$$;

create or replace function public.rpg_arena_srv_load(p_match_id uuid, p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('seite', case when m.host_id = p_user then 1 else 2 end,
    'kampf', jsonb_build_object('v', f.v, 'st', f.st, 'anf1', f.anf1, 'anf2', f.anf2, 'beginn', (extract(epoch from f.beginn) * 1000)::bigint),
    'match', jsonb_build_object('id', m.id, 'status', m.status, 'host_name', m.host_name, 'guest_name', m.guest_name,
      'host_team', m.host_team, 'guest_team', m.guest_team, 'karte', m.karte, 'begegnung', m.begegnung, 'seed', m.seed, 'modus', f.modus,
      'kampfstufe', round(greatest(m.host_schnitt, coalesce(m.guest_schnitt, m.host_schnitt)))::integer))
  from public.rpg_arena_fights f join public.rpg_arena_matches m on m.id = f.match_id
  where f.match_id = p_match_id and p_user is not null and (m.host_id = p_user or m.guest_id = p_user);
$$;

-- ---------------------------------------------------------------------
-- 5) Ausführungsrechte
-- ---------------------------------------------------------------------
revoke all on function public.rpg_arena_srv_load(uuid, uuid) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then grant execute on function public.rpg_arena_srv_load(uuid, uuid) to service_role; end if;
end $$;
revoke all on function public.rpg_arena_queue(text), public.rpg_arena_search_server(), public.rpg_arena_invite(text, text), public.rpg_arena_invites(), public.rpg_arena_invite_cancel(uuid),
  public.rpg_arena_invite_answer(uuid, boolean), public.rpg_arena_fight(uuid, integer) from public, anon;
grant execute on function public.rpg_arena_queue(text), public.rpg_arena_search_server(), public.rpg_arena_invite(text, text), public.rpg_arena_invites(), public.rpg_arena_invite_cancel(uuid),
  public.rpg_arena_invite_answer(uuid, boolean), public.rpg_arena_fight(uuid, integer) to authenticated;

commit;
