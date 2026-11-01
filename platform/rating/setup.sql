-- =====================================================================
-- MYSTERY ROOMS – Bewertungen nach Spielabschluss
-- Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Ändert keine bestehenden Tabellen.
-- =====================================================================

-- 1) Tabelle
create table if not exists public.game_ratings (
  id          bigint generated always as identity primary key,
  game_slug   text        not null check (game_slug in ('hotel-nocturne', 'der-letzte-fall', 'deadline')),
  stars       smallint    not null check (stars between 1 and 5),
  comment     text                 check (comment is null or char_length(comment) <= 500),
  ending      text                 check (ending  is null or char_length(ending)  <= 40),
  created_at  timestamptz not null default now()
);

-- 2) Zugriff: Besucher dürfen nur EINTRAGEN – nicht lesen, ändern oder löschen.
alter table public.game_ratings enable row level security;
revoke all on public.game_ratings from anon, authenticated;
grant insert (game_slug, stars, comment, ending) on public.game_ratings to anon, authenticated;

drop policy if exists "ratings_insert_only" on public.game_ratings;
create policy "ratings_insert_only" on public.game_ratings
  for insert to anon, authenticated
  with check (true);
-- Es gibt absichtlich KEINE select-Policy: Lesen geht nur im Dashboard (Rolle postgres / service_role).

-- 3) Schutz gegen Massen-Einträge: höchstens 30 Bewertungen pro Minute insgesamt.
create or replace function public.game_ratings_throttle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.game_ratings where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'Zu viele Bewertungen in kurzer Zeit. Bitte später erneut versuchen.';
  end if;
  return new;
end;
$$;
revoke all on function public.game_ratings_throttle() from public, anon, authenticated;

drop trigger if exists game_ratings_throttle on public.game_ratings;
create trigger game_ratings_throttle
  before insert on public.game_ratings
  for each row execute function public.game_ratings_throttle();

-- =====================================================================
-- AUSWERTUNG (nur im SQL Editor ausführen – bewusst KEINE View,
-- damit nichts über die öffentliche API lesbar wird):
--
--   select game_slug, count(*) as bewertungen, round(avg(stars), 2) as schnitt
--   from public.game_ratings group by game_slug order by game_slug;
--
--   select created_at, game_slug, stars, ending, comment
--   from public.game_ratings where comment is not null order by created_at desc;
-- =====================================================================

-- =====================================================================
-- 4) Öffentliche Zusammenfassung für die Startseite (nur Schnitt + Anzahl,
--    keine Kommentare). Angezeigt wird erst ab 3 Bewertungen (portal.js).
-- =====================================================================
create or replace function public.game_rating_summary()
returns table (game_slug text, avg_stars numeric, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  select game_slug, round(avg(stars)::numeric, 1), count(*)
  from public.game_ratings
  group by game_slug;
$$;
revoke all on function public.game_rating_summary() from public;
grant execute on function public.game_rating_summary() to anon, authenticated;
