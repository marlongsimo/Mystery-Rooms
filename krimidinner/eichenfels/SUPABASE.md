# Krimidinner Eichenfels – Einrichtung in Supabase

Die Live-Verbindung ist **optional**. Ohne diese Schritte funktioniert das Krimidinner vollständig mit Codes und Losungswörtern.

Alle Befehle im Supabase-Dashboard unter **SQL Editor** ausführen. Nichts davon gehört in den Code der Website.

---

## Schritt 1 · Spiel eintragen (Pflicht für die Live-Verbindung)

```sql
insert into public.game_catalog (slug, title, code_prefix, enabled)
values ('krimidinner-eichenfels', 'Der letzte Stern von Eichenfels', 'EICH', true);
```

Danach erhalten Live-Sitzungen Codes wie `EICH-3F9A2C`.

---

## Schritt 2 · 11 Geräte erlauben (Spielleitung + 10 Gäste)

Zurzeit lehnt die Datenbank alles über 8 ab („Die Gruppengröße muss zwischen 2 und 8 liegen“). Diese Prüfung steckt in der Funktion `create_game_session`. Die anderen Spiele fragen nur 2–4 Plätze an und sind davon nicht betroffen.

**2a · Funktion anzeigen:**

```sql
select pg_get_functiondef('public.create_game_session'::regproc);
```

Im Ergebnis die Stelle mit der Grenze suchen, etwa `p_max_players < 2 or p_max_players > 8` oder `between 2 and 8`. Die **8 durch 11 ersetzen**, den Text der Fehlermeldung ebenso. Dann den kompletten, geänderten Text (beginnt mit `CREATE OR REPLACE FUNCTION`) ausführen.

**2b · Prüfen, ob die Tabelle eine eigene Grenze hat:**

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.game_sessions'::regclass and contype = 'c';
```

Steht dort etwas wie `CHECK ((max_players >= 2) AND (max_players <= 8))`, diese Regel auf 11 anheben (Namen aus dem Ergebnis übernehmen):

```sql
alter table public.game_sessions drop constraint <name_aus_dem_ergebnis>;
alter table public.game_sessions add constraint game_sessions_max_players_check check (max_players between 2 and 11);
```

**2c · Beitreten prüfen:** `join_game_session` vergleicht die Personenzahl normalerweise mit `max_players` der Sitzung. Steht dort ebenfalls eine feste 8, auch dort auf 11 ändern:

```sql
select pg_get_functiondef('public.join_game_session'::regproc);
```

**Test:** Die App fragt 11 Plätze an. Klappt das, steht bei der Spielleitung „verbunden (max. 11)“. Sonst nimmt sie automatisch 8 und zeigt einen Hinweis.

---

## Schritt 3 · Aufbewahrung: ein halbes Jahr

**Was gar nicht gelöscht werden muss:** Die **Rollen-Codes** liegen nicht in der Datenbank. Sie enthalten die Rolle selbst und funktionieren unbegrenzt, solange die Website existiert. Die Spielleitung kann sie also Wochen oder Monate vor dem Dinner verschicken. Jede Person liest ihr Rollenblatt vorher in Ruhe. Losungswörter und Beweise öffnen sich erst am Abend.

**Was in der Datenbank liegt:** nur die **Live-Sitzung** des Abends, also Rundenstand und Anklagen. Sie wird am Abend selbst eröffnet. Eine Sitzung hat kein Ablaufdatum (es gibt keine Spalte `expires_at`).

**Gibt es schon eine automatische Löschung?**

```sql
select jobid, jobname, schedule, command from cron.job;
```

Kommt ein Fehler (`cron` nicht vorhanden) oder eine leere Liste, wird nichts automatisch gelöscht. Dann bleiben Sitzungen bis auf Weiteres erhalten.

**Löschen nach sechs Monaten einrichten (optional):** Das gilt für **alle Spiele** der Plattform. Bei Escape Rooms ist eine Sitzung nach einem halben Jahr ohnehin nicht mehr nötig.

1. Unter **Database → Extensions** die Erweiterung `pg_cron` einschalten.
2. Prüfen, ob die Teiltabellen beim Löschen einer Sitzung mitgelöscht werden:

```sql
select conrelid::regclass as tabelle, confdeltype as beim_loeschen
from pg_constraint
where confrelid = 'public.game_sessions'::regclass and contype = 'f';
```

`c` bedeutet: wird mitgelöscht. Steht bei `session_players` und `session_state` ein `c`, genügt Variante A. Sonst Variante B nehmen.

**Variante A** (Teiltabellen löschen sich mit):

```sql
select cron.schedule('sitzungen-nach-6-monaten-loeschen', '17 3 * * *',
  $$ delete from public.game_sessions where created_at < now() - interval '6 months' $$);
```

**Variante B** (Teiltabellen zuerst):

```sql
select cron.schedule('sitzungen-nach-6-monaten-loeschen', '17 3 * * *', $$
  delete from public.session_state   where session_id in (select id from public.game_sessions where created_at < now() - interval '6 months');
  delete from public.session_players where session_id in (select id from public.game_sessions where created_at < now() - interval '6 months');
  delete from public.game_sessions   where created_at < now() - interval '6 months';
$$);
```

Der Auftrag läuft jede Nacht um 3:17 Uhr (UTC). Wieder entfernen:

```sql
select cron.unschedule('sitzungen-nach-6-monaten-loeschen');
```

---

## Was die App speichert (zur Information)

| Wo | Was | Wie lange |
|---|---|---|
| Rollen-Code (Link, Nachricht) | Rolle, Personenzahl, Varianten | unbegrenzt, nicht in der Datenbank |
| Browser der Spielleitung | Namen, Codes, Ablaufschritt | bis der Browserspeicher gelöscht wird |
| Browser jeder Person | freigeschaltete Runden | dito |
| Supabase `session_state` | `runde` (offene Runden, Anklage an/aus), `acc:<Nutzer-ID>` (Anklage, Motiv, Beweis, Name) | bis zur Löschung (Schritt 3) |
| Supabase `session_players` | Rufname je Gerät | dito |

**Rollen werden nie an Supabase übertragen.**
