#!/usr/bin/env bash
# Prüft die RPG-Migrationen gegen ein lokales Postgres (Nachbildung von Supabase).
# Nur für Entwickler – führt NICHTS in Supabase aus.
# Aufruf: abenteuer/supabase/tests/pruefen.sh   (braucht psql und eine leere Testdatenbank)
#   PGHOST/PGPORT/PGUSER wie üblich setzen, z. B. PGHOST=/tmp/pgtest PGPORT=54329 PGUSER=postgres
set -euo pipefail
cd "$(dirname "$0")"
DB=rpg_test_$$
createdb "$DB"
trap 'dropdb --if-exists "$DB"' EXIT
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase_nachbildung.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../001_rpg_kampagnen.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../001_rpg_kampagnen.sql   # zweimal: muss idempotent sein
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 001_rpg_kampagnen_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../002_rpg_profile.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../002_rpg_profile.sql      # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 002_rpg_profile_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../003_rpg_freunde.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../003_rpg_freunde.sql      # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 003_rpg_freunde_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../004_rpg_tisch.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../004_rpg_tisch.sql        # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 004_rpg_tisch_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../005_rpg_abenteuer.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../005_rpg_abenteuer.sql    # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 005_rpg_abenteuer_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
# Migration 006: ein Konto gibt es schon vorher (Bestandsschutz), eines entsteht zwischen den beiden Läufen (kein Bestandsschutz)
psql -q -v ON_ERROR_STOP=1 -d "$DB" -c "insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000000e0', false); insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000000e0', 'Altspieler');"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../006_rpg_heldensammlung.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -c "insert into auth.users (id, is_anonymous) values ('00000000-0000-0000-0000-0000000000e9', false); insert into public.rpg_profiles (user_id, handle) values ('00000000-0000-0000-0000-0000000000e9', 'Nachzuegler');"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../006_rpg_heldensammlung.sql   # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 006_rpg_heldensammlung_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../007_rpg_heldenlevel.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../007_rpg_heldenlevel.sql      # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 007_rpg_heldenlevel_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../008_rpg_arena.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../008_rpg_arena.sql            # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 008_rpg_arena_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../009_rpg_arena_modi.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../009_rpg_arena_modi.sql       # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 009_rpg_arena_modi_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../010_rpg_arena_auswertung_haendler.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../010_rpg_arena_auswertung_haendler.sql       # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 010_rpg_arena_auswertung_haendler_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../010_rpg_arena_auswertung_haendler_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../011_rpg_tutorial.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../011_rpg_tutorial.sql       # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 011_rpg_tutorial_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../011_rpg_tutorial_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../012_rpg_ohne_zeitsperre.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  /  /"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../012_rpg_ohne_zeitsperre.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  /  /"       # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 012_rpg_ohne_zeitsperre_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../012_rpg_ohne_zeitsperre_rueckbau.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  /  /"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../009_rpg_arena_modi_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../013_rpg_arena_tagesgrenze_siege.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  /  /"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../013_rpg_arena_tagesgrenze_siege.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  /  /"       # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 013_rpg_arena_tagesgrenze_siege_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../013_rpg_arena_tagesgrenze_siege_rueckbau.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  /  /"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../014_rpg_arena_team_suche.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../014_rpg_arena_team_suche.sql 2>/dev/null     # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 014_rpg_arena_team_suche_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
# Fingerabdruck aller Arena-Funktionen aus 008 und 014 – Migration 015 darf keine davon verändern
ARENA_VOR=$(psql -q -At -d "$DB" -c "select md5(string_agg(pg_get_functiondef(p.oid), '' order by p.oid::regprocedure::text)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'rpg_arena%'")
# Vorher liegt eine ABWEICHENDE Fassung des Serverkampfs in der Datenbank (andere Parameter, anderer Tabellenaufbau, fehlerhafte Suche) – 015 muss sie ersetzen
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f 015_abweichende_fassung.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../015_rpg_arena_serverkampf.sql 2>&1 | grep -i "neu angelegt" | sed "s/^.*NOTICE:  /  /"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../015_rpg_arena_serverkampf.sql 2>/dev/null     # zweimal: idempotent
ARENA_NACH=$(psql -q -At -d "$DB" -c "select md5(string_agg(pg_get_functiondef(p.oid), '' order by p.oid::regprocedure::text)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'rpg_arena%' and p.proname not in ('rpg_arena_search_server', 'rpg_arena_fight', 'rpg_arena_fight_leader', 'rpg_arena_srv_load', 'rpg_arena_srv_save', 'rpg_arena_srv_end')")
if [ "$ARENA_VOR" = "$ARENA_NACH" ]; then echo "✓ Migration 015 verändert keine vorhandene Arena-Funktion (008, 014)"; else echo "✗ Migration 015 hat eine vorhandene Arena-Funktion verändert"; exit 1; fi
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 015_rpg_arena_serverkampf_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../015_rpg_arena_serverkampf_rueckbau.sql
ARENA_ENDE=$(psql -q -At -d "$DB" -c "select md5(string_agg(pg_get_functiondef(p.oid), '' order by p.oid::regprocedure::text)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'rpg_arena%'")
if [ "$ARENA_VOR" = "$ARENA_ENDE" ]; then echo "✓ Nach dem Rückbau von 015 ist alles wie vorher"; else echo "✗ Der Rückbau von 015 hinterlässt Reste"; exit 1; fi
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../014_rpg_arena_team_suche_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../008_rpg_arena_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../007_rpg_heldenlevel_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../006_rpg_heldensammlung_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../005_rpg_abenteuer_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../004_rpg_tisch_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../001_rpg_kampagnen.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../002_rpg_profile.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -c "drop function if exists public.rpg_ist_tisch(uuid);"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../003_rpg_freunde_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../002_rpg_profile.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../002_rpg_profile_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../001_rpg_kampagnen.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../001_rpg_kampagnen_rueckbau.sql
test "$(psql -tA -d "$DB" -c "select count(*) from pg_class where relname like 'rpg\_%'")" = 0
test "$(psql -tA -d "$DB" -c "select count(*) from pg_proc where proname like 'rpg\_%'")" = 0
test "$(psql -tA -d "$DB" -c "select count(*) from public.game_sessions")" = 3
echo "✓ Rückbau entfernt alle rpg_-Objekte, bestehende Tabellen bleiben"
