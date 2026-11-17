-- =====================================================================
-- MYSTERY ROOMS · RPG · Migration 027: Arena – Zwangsaufgabe nach drei verstrichenen Zügen; Zeitstrafe beim dritten Verstoß in 24 Stunden
-- =====================================================================
-- Voraussetzung: Migrationen 015 (Serverkampf), 019/020 (Rechner-Gegner) und 022 (Ranked) sind eingespielt.
-- (Frühere Fassungen dieser Datei regelten nur verlassene Kämpfe gegen den Rechner-Gegner bzw. verhängten die Zeitstrafe
--  schon beim ersten Mal. Diese Fassung ersetzt sie; es ist gleich, ob eine frühere schon eingespielt wurde.)
--
-- Die Regel:
--   Wer dreimal in Folge seine Zugzeit verstreichen lässt, gibt den Kampf zwangsweise auf – gegen Menschen wie gegen den
--   Rechner-Gegner. Das zählt als VERSTOSS. Beim dritten Verstoß innerhalb von 24 Stunden gibt es eine ZEITSTRAFE:
--   eine Stunde lang keine Gegnersuche (Ranked, Normal, Arcade).
--     – Mit dem ersten Verstoß beginnen die 24 Stunden. Sind sie um, steht der Zähler wieder auf 0.
--     – Mit einer verhängten Zeitstrafe steht der Zähler ebenfalls wieder auf 0.
--   Wer freiwillig über „Aufgeben“ aufgibt, begeht keinen Verstoß.
--
-- Was diese Migration tut:
--   1) Neue Tabelle rpg_arena_sperren (je Konto: Zahl der Verstöße, Beginn der 24 Stunden, gesperrt bis wann). Nur über Funktionen erreichbar.
--   2) Neuer Auslöser an rpg_arena_matches: Endet ein Kampf durch Aufgabe und steht im gespeicherten Stand des Serverkampfs
--      „dreimal die Zugzeit verstreichen lassen“, wird dem Verlierer ein Verstoß angerechnet – zum Zeitpunkt der
--      Zwangsaufgabe (steht im Stand), sonst jetzt. An den vorhandenen Funktionen des Serverkampfs ändert sich nichts.
--   3) rpg_ranked_nachholen (aus Migration 022) wird ersetzt: Ein Kampf gegen den Rechner-Gegner, in dem seit über
--      5 Minuten kein Schritt mehr gerechnet wurde, gilt als zwangsweise aufgegeben (der Spieler ist nicht zurückgekehrt) –
--      ein Verstoß zu dem Zeitpunkt, an dem der dritte Zug verstrichen wäre. Danach wird wie bisher gewertet.
--   4) Die beiden Suchfunktionen prüfen die Zeitstrafe. Sie werden NICHT neu geschrieben; in ihre vorhandene Fassung wird
--      je eine Zeile eingefügt:
--        – rpg_arena_queue(text): am Anfang – verlassene Kämpfe abschließen, dann die Zeitstrafe prüfen
--        – rpg_ranked_queue():    nach dem vorhandenen Aufruf von rpg_ranked_nachholen – die Zeitstrafe prüfen
--      Passt eine Stelle nicht, bricht die ganze Migration ab und ändert nichts.
--   5) Neue Funktion rpg_arena_sperre(): nennt dem eigenen Konto eine laufende Zeitstrafe und die Zahl der Verstöße (für die Anzeige).
--
-- Private Kämpfe (Einladungen unter Freunden) sind von der Sperre nicht betroffen.
-- NUR FÜR DAS RPG. Rückbau: 027_rpg_ranked_verlassen_rueckbau.sql
-- Unverändert in den Supabase SQL Editor einfügen und ausführen. Mehrfaches Ausführen ist unschädlich.
-- =====================================================================
begin;

do $$ begin
  if to_regprocedure('public.rpg_ranked_nachholen(uuid)') is null or to_regprocedure('public.rpg_ranked_werten(uuid)') is null or to_regprocedure('public.rpg_ranked_queue()') is null then raise exception 'Migration 022 (Ranked) fehlt.'; end if;
  if to_regprocedure('public.rpg_arena_queue(text)') is null then raise exception 'Migration 016 (Spielarten der Arena) fehlt.'; end if;
  if to_regclass('public.rpg_arena_fights') is null or not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'rpg_arena_fights' and column_name = 'bot') then
    raise exception 'Migration 015 (Serverkampf) oder 019 (Rechner-Gegner) fehlt.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1) Zeitstrafen
-- ---------------------------------------------------------------------
create table if not exists public.rpg_arena_sperren (
  user_id     uuid         primary key references auth.users(id) on delete cascade,
  bis         timestamptz,                          -- gesperrt bis (null: keine Zeitstrafe)
  grund       text         not null default 'zugzeit',
  match_id    uuid,
  created_at  timestamptz  not null default now(),
  verstoesse  integer      not null default 0,      -- Zwangsaufgaben im laufenden 24-Stunden-Fenster
  fenster_ab  timestamptz                           -- Beginn des Fensters (erster Verstoß)
);
-- frühere Fassung dieser Migration: Spalten nachziehen
alter table public.rpg_arena_sperren add column if not exists verstoesse integer not null default 0;
alter table public.rpg_arena_sperren add column if not exists fenster_ab timestamptz;
alter table public.rpg_arena_sperren alter column bis drop not null;
alter table public.rpg_arena_sperren enable row level security;
revoke all on public.rpg_arena_sperren from anon, authenticated;

create or replace function public.rpg_arena_strafdauer() returns interval language sql immutable as $$ select interval '1 hour'; $$;

create or replace function public.rpg_arena_verstoss_fenster() returns interval language sql immutable as $$ select interval '24 hours'; $$;
create or replace function public.rpg_arena_verstoss_max() returns integer language sql immutable as $$ select 3; $$;

-- Einen Verstoß anrechnen (Zeitpunkt p_ab). Beim dritten im Fenster: Zeitstrafe ab diesem Zeitpunkt, Zähler zurück auf 0.
create or replace function public.rpg_arena_sperren_setzen(p_user uuid, p_ab timestamptz, p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_t timestamptz := least(coalesce(p_ab, now()), now()); v_s public.rpg_arena_sperren%rowtype; v_n integer; v_ab timestamptz;
begin
  if p_user is null then return; end if;
  insert into public.rpg_arena_sperren (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into v_s from public.rpg_arena_sperren where user_id = p_user for update;
  -- Fenster abgelaufen (oder noch keines): neu beginnen
  if v_s.fenster_ab is null or v_s.verstoesse <= 0 or v_t > v_s.fenster_ab + public.rpg_arena_verstoss_fenster() then v_n := 0; v_ab := v_t; else v_n := v_s.verstoesse; v_ab := v_s.fenster_ab; end if;
  v_n := v_n + 1;
  if v_n >= public.rpg_arena_verstoss_max() then
    update public.rpg_arena_sperren set verstoesse = 0, fenster_ab = null, bis = greatest(coalesce(bis, '-infinity'::timestamptz), v_t + public.rpg_arena_strafdauer()), match_id = p_match, created_at = now() where user_id = p_user;
  else
    update public.rpg_arena_sperren set verstoesse = v_n, fenster_ab = v_ab, match_id = p_match where user_id = p_user;
  end if;
end;
$$;

-- Für die Anzeige: die eigene laufende Zeitstrafe
create or replace function public.rpg_arena_sperre()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('gesperrt', s.bis is not null and s.bis > now(), 'bis', case when s.bis > now() then s.bis end,
      'sekunden', case when s.bis > now() then ceil(extract(epoch from s.bis - now()))::integer else 0 end,
      'verstoesse', case when s.fenster_ab is not null and now() <= s.fenster_ab + public.rpg_arena_verstoss_fenster() then s.verstoesse else 0 end,
      'verstoesse_max', public.rpg_arena_verstoss_max(),
      'fenster_bis', case when s.verstoesse > 0 and s.fenster_ab is not null and now() <= s.fenster_ab + public.rpg_arena_verstoss_fenster() then s.fenster_ab + public.rpg_arena_verstoss_fenster() end)
    from public.rpg_arena_sperren s where s.user_id = auth.uid()),
    jsonb_build_object('gesperrt', false, 'sekunden', 0, 'verstoesse', 0, 'verstoesse_max', public.rpg_arena_verstoss_max()));
$$;

-- Für die Suche: bricht mit einer Meldung ab, solange die Zeitstrafe läuft
create or replace function public.rpg_arena_sperre_pruefen()
returns void language plpgsql stable security definer set search_path = public as $$
declare v_bis timestamptz;
begin
  select bis into v_bis from public.rpg_arena_sperren where user_id = auth.uid() and bis > now();
  if found then
    raise exception 'Zeitstrafe: Du hast innerhalb von 24 Stunden dreimal einen Kampf durch verstrichene Zugzeit verloren. Einen neuen Gegner kannst du in % Minuten suchen.', greatest(1, ceil(extract(epoch from v_bis - now()) / 60))::integer;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) Auslöser: Zwangsaufgabe im Serverkampf → ein Verstoß für den Verlierer
-- ---------------------------------------------------------------------
create or replace function public.rpg_arena_strafe_bei_ende()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_a jsonb; v_wer uuid; v_ab timestamptz;
begin
  if new.status <> 'beendet' or old.status = 'beendet' or new.grund is distinct from 'aufgabe' or new.sieger not in (1, 2) then return new; end if;
  select f.st->'arena' into v_a from public.rpg_arena_fights f where f.match_id = new.id;
  if v_a is null or coalesce(v_a->>'grund', '') !~ 'Zugzeit' then return new; end if;      -- freiwillige Aufgabe: kein Verstoß
  v_wer := case when new.sieger = 1 then new.guest_id else new.host_id end;
  if (v_a->>'aufgabeZeit') ~ '^[0-9]{10,15}$' then v_ab := to_timestamp((v_a->>'aufgabeZeit')::bigint / 1000.0); end if;
  perform public.rpg_arena_sperren_setzen(v_wer, least(coalesce(v_ab, now()), now()), new.id);
  return new;
end;
$$;
drop trigger if exists rpg_arena_strafe_bei_ende on public.rpg_arena_matches;
create trigger rpg_arena_strafe_bei_ende after update of status on public.rpg_arena_matches
  for each row execute function public.rpg_arena_strafe_bei_ende();

-- ---------------------------------------------------------------------
-- 3) Nicht zurückgekehrt: verlassene Kämpfe gegen den Rechner-Gegner abschließen, dann wie bisher werten
-- ---------------------------------------------------------------------
create or replace function public.rpg_ranked_nachholen(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_rec record; v_m public.rpg_arena_matches%rowtype; v_id uuid;
begin
  if p_user is null then return; end if;
  for v_rec in select m.id, f.updated_at from public.rpg_arena_matches m join public.rpg_arena_fights f on f.match_id = m.id
               where m.host_id = p_user and m.guest_id is null and m.guest_team is not null and f.bot is not null
                 and m.status = 'laeuft' and f.updated_at < now() - interval '5 minutes' loop
    update public.rpg_arena_matches set status = 'beendet', sieger = 2, grund = 'aufgabe', ended_at = now()
      where id = v_rec.id and status = 'laeuft' returning * into v_m;
    if found then
      perform public.rpg_arena_belohnen(v_m, v_m.host_id);
      -- Verstoß zu dem Zeitpunkt, an dem der dritte Zug verstrichen wäre (rund vier Minuten nach dem letzten Schritt)
      perform public.rpg_arena_sperren_setzen(p_user, v_rec.updated_at + interval '4 minutes', v_rec.id);
    end if;
  end loop;
  for v_id in select r.match_id from public.rpg_ranked_matches r join public.rpg_arena_matches m on m.id = r.match_id
              where r.gewertet is null and m.status = 'beendet' and (m.host_id = p_user or m.guest_id = p_user) loop
    perform public.rpg_ranked_werten(v_id);
  end loop;
end;
$$;

revoke all on function public.rpg_arena_strafdauer(), public.rpg_arena_verstoss_fenster(), public.rpg_arena_verstoss_max(), public.rpg_arena_sperren_setzen(uuid, timestamptz, uuid), public.rpg_arena_sperre(), public.rpg_arena_sperre_pruefen(),
  public.rpg_arena_strafe_bei_ende(), public.rpg_ranked_nachholen(uuid) from public, anon, authenticated;
grant execute on function public.rpg_arena_sperre() to authenticated;

-- ---------------------------------------------------------------------
-- 4) Die Suche prüft die Zeitstrafe (je eine Zeile in den vorhandenen Fassungen)
-- ---------------------------------------------------------------------
do $$
declare v_alt text; v_neu text;
begin
  -- rpg_arena_queue(text): gleich am Anfang
  v_alt := pg_get_functiondef('public.rpg_arena_queue(text)'::regprocedure);
  if v_alt ~ 'rpg_arena_sperre_pruefen' then raise notice 'rpg_arena_queue: nichts zu ändern'; else
    v_neu := regexp_replace(v_alt, '(\n[ \t]*begin[ \t\r]*\n)', E'\\1  perform public.rpg_ranked_nachholen(auth.uid()); perform public.rpg_arena_sperre_pruefen(); -- Zeitstrafe nach drei verstrichenen Zügen\n', 'i');
    if v_neu = v_alt then raise exception 'rpg_arena_queue sieht anders aus als erwartet. Die Migration ändert nichts; bitte melden.'; end if;
    execute v_neu; raise notice 'rpg_arena_queue: prüft jetzt die Zeitstrafe';
  end if;
  -- rpg_ranked_queue(): nach dem Abschließen verlassener Kämpfe
  v_alt := pg_get_functiondef('public.rpg_ranked_queue()'::regprocedure);
  if v_alt ~ 'rpg_arena_sperre_pruefen' then raise notice 'rpg_ranked_queue: nichts zu ändern'; else
    v_neu := regexp_replace(v_alt, '(perform\s+(public\.)?rpg_ranked_nachholen\s*\(\s*v_uid\s*\)\s*;)', E'\\1 perform public.rpg_arena_sperre_pruefen();', 'i');
    if v_neu = v_alt then raise exception 'rpg_ranked_queue sieht anders aus als erwartet. Die Migration ändert nichts; bitte melden.'; end if;
    execute v_neu; raise notice 'rpg_ranked_queue: prüft jetzt die Zeitstrafe';
  end if;
end $$;

commit;
