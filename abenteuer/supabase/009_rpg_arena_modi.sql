-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 009: Spielmodi der Arena
-- Setzt Migration 001–008 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG. Legt ausschließlich neue Objekte mit dem Präfix rpg_ an.
-- Bestehende Tabellen, Funktionen und Daten werden nicht verändert
-- (auch die Arena-Funktionen aus Migration 008 bleiben, wie sie sind).
--
-- Was diese Migration einführt:
--   • Zu jedem Arena-Kampf lässt sich ein Modus merken: 'arena' (Standard), 'koenig' (Königsmord), 'horde' (Die Horde).
--   • Der Ersteller legt ihn fest, solange der Kampf offen ist. Alle sehen den Modus offener Kämpfe;
--     bei laufenden oder beendeten Kämpfen sehen ihn nur die beiden Teilnehmer.
--   • Ohne Eintrag gilt 'arena'.
--
-- Rückbau: 009_rpg_arena_modi_rueckbau.sql
-- =====================================================================

begin;

create table if not exists public.rpg_arena_modes (
  match_id    uuid        primary key references public.rpg_arena_matches(id) on delete cascade,
  modus       text        not null check (modus in ('arena', 'koenig', 'horde')),
  created_at  timestamptz not null default now()
);
alter table public.rpg_arena_modes enable row level security;
revoke all on public.rpg_arena_modes from anon, authenticated;

-- Modus festlegen: nur der Ersteller, nur solange der Kampf offen ist
create or replace function public.rpg_arena_set_mode(p_match_id uuid, p_modus text)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_m public.rpg_arena_matches%rowtype;
begin
  if p_modus is null or p_modus not in ('arena', 'koenig', 'horde') then raise exception 'Unbekannter Modus.'; end if;
  select * into v_m from public.rpg_arena_matches where id = p_match_id;
  if not found or v_uid is null or v_m.host_id <> v_uid then raise exception 'Diesen Kampf gibt es nicht.'; end if;
  if v_m.status <> 'offen' then raise exception 'Der Modus lässt sich nicht mehr ändern.'; end if;
  insert into public.rpg_arena_modes (match_id, modus) values (p_match_id, p_modus)
    on conflict (match_id) do update set modus = excluded.modus;
  return p_modus;
end;
$$;

-- Modi mehrerer Kämpfe: { "<id>": "<modus>" }. Offene Kämpfe für alle, andere nur für die Teilnehmer.
create or replace function public.rpg_arena_modes(p_ids uuid[])
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(m.id, coalesce(mo.modus, 'arena')), '{}'::jsonb)
  from public.rpg_arena_matches m left join public.rpg_arena_modes mo on mo.match_id = m.id
  where auth.uid() is not null and m.id = any(coalesce(p_ids, '{}'::uuid[])) and cardinality(coalesce(p_ids, '{}'::uuid[])) <= 100
    and (m.status = 'offen' or m.host_id = auth.uid() or m.guest_id = auth.uid());
$$;

revoke all on function public.rpg_arena_set_mode(uuid, text), public.rpg_arena_modes(uuid[]) from public, anon;
grant execute on function public.rpg_arena_set_mode(uuid, text), public.rpg_arena_modes(uuid[]) to authenticated;

commit;
