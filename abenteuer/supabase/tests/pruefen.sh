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
