-- =====================================================================
-- NUR FÜR LOKALE TESTS – NIEMALS IN SUPABASE AUSFÜHREN.
-- Bildet die Teile von Supabase nach, die Migration 001 braucht:
-- Rollen anon/authenticated, auth.users, auth.uid() und die bestehenden
-- Sitzungstabellen (Spalten wie in der echten Datenbank abgelesen).
-- =====================================================================
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
create schema auth;
create table auth.users (id uuid primary key, email text, is_anonymous boolean default true);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant usage on schema public to anon, authenticated;

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(), game_slug text not null, room_code text not null, status text not null default 'waiting',
  host_id uuid, max_players int default 4, created_at timestamptz default now(), started_at timestamptz, closed_at timestamptz);
create table public.session_players (
  session_id uuid references public.game_sessions(id), user_id uuid, player_name text, is_host boolean default false,
  joined_at timestamptz default now(), primary key (session_id, user_id));
-- wie in Supabase: Spieler lesen nur ihre eigenen Sitzungen, schreiben nur über Funktionen
alter table public.game_sessions enable row level security;
alter table public.session_players enable row level security;
