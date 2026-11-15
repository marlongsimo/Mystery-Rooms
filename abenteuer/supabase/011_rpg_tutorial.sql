-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 011: Tutorial je Profil
-- Setzt Migration 001–006 voraus.
--
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Darf mehrfach ausgeführt werden (idempotent).
--
-- NUR FÜR DAS RPG. Legt ausschließlich neue Objekte mit dem Präfix rpg_ an.
-- Bestehende Tabellen, Funktionen und Daten werden nicht verändert.
--
-- Was diese Migration einführt:
--   • Je Spielerkonto ein Wert „Tutorial offen: ja/nein“.
--   • Konten, die NACH dem Einspielen dieser Migration registriert werden, beginnen mit „ja“.
--     Konten, die es schon gibt, stehen auf „nein“ (sie bekommen das Tutorial nicht ungefragt).
--   • Überspringen oder „Ich bin bereit!“ setzt den Wert auf „nein“ (rpg_tutorial_done).
--     rpg_tutorial_reset stellt ihn für das eigene Konto wieder auf „ja“ (Tutorial noch einmal ansehen).
--
-- Rückbau: 011_rpg_tutorial_rueckbau.sql
-- =====================================================================

begin;

create table if not exists public.rpg_tutorial (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  offen       boolean     not null,
  updated_at  timestamptz not null default now()
);
-- Stichtag: ab wann neue Konten mit dem Tutorial beginnen (wird beim ersten Einspielen gesetzt und danach nicht mehr verändert)
create table if not exists public.rpg_tutorial_meta (
  id            boolean     primary key default true check (id),
  eingefuehrt   timestamptz not null default now()
);
insert into public.rpg_tutorial_meta (id) values (true) on conflict (id) do nothing;
alter table public.rpg_tutorial enable row level security;
alter table public.rpg_tutorial_meta enable row level security;
revoke all on public.rpg_tutorial, public.rpg_tutorial_meta from anon, authenticated;

-- Steht für dieses Konto das Tutorial noch an?
create or replace function public.rpg_tutorial_state()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('konto', public.rpg_sammlung_konto(), 'tutorial', public.rpg_sammlung_konto() and coalesce(
    (select offen from public.rpg_tutorial where user_id = auth.uid()),
    (select p.created_at >= (select eingefuehrt from public.rpg_tutorial_meta) from public.rpg_profiles p where p.user_id = auth.uid()),
    false));
$$;

-- Tutorial beendet oder übersprungen
create or replace function public.rpg_tutorial_done()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false, 'tutorial', false); end if;
  insert into public.rpg_tutorial (user_id, offen) values (auth.uid(), false)
    on conflict (user_id) do update set offen = false, updated_at = now();
  return jsonb_build_object('konto', true, 'tutorial', false);
end;
$$;

-- Tutorial noch einmal ansehen
create or replace function public.rpg_tutorial_reset()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.rpg_sammlung_konto() then return jsonb_build_object('konto', false, 'tutorial', false); end if;
  insert into public.rpg_tutorial (user_id, offen) values (auth.uid(), true)
    on conflict (user_id) do update set offen = true, updated_at = now();
  return jsonb_build_object('konto', true, 'tutorial', true);
end;
$$;

revoke all on function public.rpg_tutorial_state(), public.rpg_tutorial_done(), public.rpg_tutorial_reset() from public, anon;
grant execute on function public.rpg_tutorial_state(), public.rpg_tutorial_done(), public.rpg_tutorial_reset() to authenticated;

commit;
