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
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../016_rpg_arena_spielarten.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../016_rpg_arena_spielarten.sql 2>/dev/null     # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 016_rpg_arena_spielarten_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../015_rpg_arena_serverkampf.sql 2>/dev/null     # 015 nach 016 erneut: darf an den erweiterten Tabellen nicht scheitern
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../016_rpg_arena_spielarten_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../015_rpg_arena_serverkampf.sql 2>/dev/null     # nach dem Rückbau von 016: stellt die Fassungen aus 015 wieder her
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../015_rpg_arena_serverkampf_rueckbau.sql
ARENA_ENDE=$(psql -q -At -d "$DB" -c "select md5(string_agg(pg_get_functiondef(p.oid), '' order by p.oid::regprocedure::text)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'rpg_arena%'")
if [ "$ARENA_VOR" = "$ARENA_ENDE" ]; then echo "✓ Nach dem Rückbau von 015 ist alles wie vorher"; else echo "✗ Der Rückbau von 015 hinterlässt Reste"; exit 1; fi
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../014_rpg_arena_team_suche_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../017_rpg_ausstattung.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../017_rpg_ausstattung.sql 2>/dev/null     # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 017_rpg_ausstattung_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../018_rpg_ausstattung_sichtbar.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../018_rpg_ausstattung_sichtbar.sql 2>/dev/null     # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 018_rpg_ausstattung_sichtbar_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
# Migration 019 (Rechner-Gegner) braucht 014 bis 018 zugleich: Arena-Suche und Serverkampf noch einmal einspielen
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../014_rpg_arena_team_suche.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../015_rpg_arena_serverkampf.sql 2>/dev/null
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../016_rpg_arena_spielarten.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -c "do \$\$ declare d text := pg_get_functiondef('public.rpg_arena_json(public.rpg_arena_matches, uuid)'::regprocedure); n text; begin n := regexp_replace(regexp_replace(d, 'p_m\\.guest_id is not null then', E'p_m.guest_id\\n        IS NOT NULL\\n      THEN'), 'case when p_m\\.guest_id is null then', E'CASE\\n      WHEN p_m.\\\"guest_id\\\" IS NULL THEN'); if n = d then raise exception 'Umformatierung für den Test greift nicht'; end if; execute n; end \$\$;"
ARENA_VOR19=$(psql -q -At -d "$DB" -c "select md5(string_agg(regexp_replace(lower(pg_get_functiondef(p.oid)), '[[:space:]\"]+', '', 'g'), '' order by p.oid::regprocedure::text)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'rpg_arena%'")
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../019_rpg_arena_rechnergegner.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  /  /"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../019_rpg_arena_rechnergegner.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  /  /"     # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 019_rpg_arena_rechnergegner_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../020_rpg_admin_bereich.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../020_rpg_admin_bereich.sql 2>/dev/null     # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 019_rpg_arena_rechnergegner_test2.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //" | grep -c "✓" | sed "s/^/✓ Mit 020 und Voreinstellung verhält sich der Rechner-Gegner wie in 019 (Prüfungen bestanden: /; s/$/)/"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 020_rpg_admin_bereich_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
# Migration 022 (Ranked): braucht 015–020 zugleich
RANK_VOR=$(psql -q -At -d "$DB" -c "select md5(string_agg(regexp_replace(lower(pg_get_functiondef(p.oid)), '[[:space:]\\\"]+', '', 'g'), '' order by p.oid::regprocedure::text)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and (p.proname like 'rpg_arena%' or p.proname like 'rpg_cosmetic%' or p.proname like 'rpg_admin%')")
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../022_rpg_ranked.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../022_rpg_ranked.sql 2>/dev/null     # zweimal: idempotent
RANK_MIT=$(psql -q -At -d "$DB" -c "select md5(string_agg(regexp_replace(lower(pg_get_functiondef(p.oid)), '[[:space:]\\\"]+', '', 'g'), '' order by p.oid::regprocedure::text)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and (p.proname like 'rpg_arena%' or p.proname like 'rpg_cosmetic%' or (p.proname like 'rpg_admin%' and p.proname not like 'rpg_admin_ranked%'))")
if [ "$RANK_VOR" = "$RANK_MIT" ]; then echo "✓ Migration 022 verändert keine vorhandene Funktion (Arena, Ausstattung, Admin)"; else echo "✗ Migration 022 hat eine vorhandene Funktion verändert"; exit 1; fi
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 022_rpg_ranked_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../022_rpg_ranked_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../020_rpg_admin_bereich_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../019_rpg_arena_rechnergegner.sql 2>/dev/null
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../016_rpg_arena_spielarten.sql      # 016 nach 019 erneut: darf nicht scheitern (danach 019 erneut)
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../019_rpg_arena_rechnergegner.sql 2>/dev/null
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../019_rpg_arena_rechnergegner_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../016_rpg_arena_spielarten.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../018_rpg_ausstattung_sichtbar.sql
ARENA_NACH19=$(psql -q -At -d "$DB" -c "select md5(string_agg(regexp_replace(lower(pg_get_functiondef(p.oid)), '[[:space:]\"]+', '', 'g'), '' order by p.oid::regprocedure::text)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'rpg_arena%'")
if [ "$ARENA_VOR19" = "$ARENA_NACH19" ]; then echo "✓ Nach dem Rückbau von 019 (und erneutem 016 und 018) sind alle Arena-Funktionen wie vorher (bis auf Leerraum und Schreibweise)"; else echo "✗ Der Rückbau von 019 hinterlässt Reste"; exit 1; fi
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../016_rpg_arena_spielarten_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../015_rpg_arena_serverkampf.sql 2>/dev/null
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../015_rpg_arena_serverkampf_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../014_rpg_arena_team_suche_rueckbau.sql
# Migration 023 (Erfahrungspakete): braucht 006 bis 008
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../023_rpg_erfahrungspakete.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../023_rpg_erfahrungspakete.sql 2>/dev/null     # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 023_rpg_erfahrungspakete_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../023_rpg_erfahrungspakete_rueckbau.sql
# Migration 021 (Codes für Seelensplitter): braucht 006 und 008
CODE_VOR=$(psql -q -At -d "$DB" -c "select md5(string_agg(pg_get_functiondef(p.oid), '' order by p.oid::regprocedure::text)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('rpg_redeem_unlock_code', 'rpg_admin_create_code', 'rpg_admin_codes')")
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../021_rpg_splitter_codes.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../021_rpg_splitter_codes.sql 2>/dev/null     # zweimal: idempotent
psql -q -v ON_ERROR_STOP=1 -d "$DB" -o /dev/null -f 021_rpg_splitter_codes_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  //"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../021_rpg_splitter_codes_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../006_rpg_heldensammlung.sql 2>/dev/null
CODE_NACH=$(psql -q -At -d "$DB" -c "select md5(string_agg(pg_get_functiondef(p.oid), '' order by p.oid::regprocedure::text)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('rpg_redeem_unlock_code', 'rpg_admin_create_code', 'rpg_admin_codes')")
if [ "$CODE_VOR" = "$CODE_NACH" ]; then echo "✓ Nach dem Rückbau von 021 (und erneutem 006) sind die Code-Funktionen wie vorher"; else echo "✗ Der Rückbau von 021 hinterlässt Reste"; exit 1; fi
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../018_rpg_ausstattung_sichtbar_rueckbau.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f ../017_rpg_ausstattung_rueckbau.sql
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
