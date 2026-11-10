# Abenteuer – Supabase

Das Spielen mit Handys nutzt die vorhandene Mehrspieler-Plattform (`platform/multiplayer/mp-core.js`).
Es entsteht **keine neue Tabelle und keine neue Funktion**. Nötig ist nur ein Eintrag in `game_catalog`.
Im Supabase-Dashboard unter **SQL Editor** ausführen:

```sql
insert into public.game_catalog (slug, title, code_prefix, enabled)
values ('abenteuer', 'Abenteuer', 'ABEN', true);
```

Prüfen:

```sql
select slug, title, code_prefix, enabled from public.game_catalog where slug = 'abenteuer';
```

Danach bekommen Sitzungen Codes wie `ABEN-3F9A2C`. Ohne den Eintrag meldet der Spieltisch
„noch nicht freigeschaltet“; allein auf einem Gerät lässt sich trotzdem spielen.

## Was in der Sitzung steht

| Schlüssel | schreibt | Inhalt |
|---|---|---|
| `spiel` | nur der Spieltisch (Host) | öffentlicher Stand: Figuren, TP, Zug, Möglichkeiten der aktiven Figur, letzte Einträge, Figurenwahl |
| `wahl:<Nutzer-ID>` | das jeweilige Handy | gewünschte Figur |
| `zug:<Nutzer-ID>` | das jeweilige Handy | gewünschte Aktion mit Ziel oder „Zug beenden“ |

Die Datenbank erlaubt jedem Mitglied einer Sitzung, beliebige Schlüssel zu schreiben. Deshalb prüfen die Geräte
selbst, wer geschrieben hat (`updated_by`): Handys übernehmen `spiel` nur vom Host, der Tisch übernimmt
`wahl:`/`zug:` nur vom Nutzer im Schlüssel. Gewürfelt und geprüft wird nur am Tisch. Fremde Sitzungen bleiben
wie bisher durch RLS geschützt.

## Tests

- `node abenteuer/tests/abenteuer.test.js` – Regeln und ein Gerät allein
- `LIVESLUG=krimidinner node abenteuer/tests/live-abenteuer.test.js` – Tisch + zwei Handys gegen die echte Datenbank
  (bis `abenteuer` eingetragen ist, über die vorhandene Kennung; danach ohne `LIVESLUG`)
