# Krimidinner – Supabase (gemeinsame Kennung für alle Fälle)

Die Live-Verbindung ist **optional**. Ohne sie funktionieren alle Krimidinner vollständig mit Codes und Losungswörtern.
Alle Befehle im Supabase-Dashboard unter **SQL Editor** ausführen. Nichts davon gehört in den Code der Website.

---

## Einmalig: Kennung `krimidinner` eintragen

Alle Fälle (Eichenfels, Der letzte Halt und alle weiteren) nutzen ab jetzt **eine** Live-Kennung. Neue Fälle brauchen keinen eigenen Eintrag mehr.

```sql
insert into public.game_catalog (slug, title, code_prefix, enabled)
values ('krimidinner', 'Krimidinner', 'KRIM', true);
```

Danach erhalten Live-Sitzungen Codes wie `KRIM-3F9A2C`.

**Gerätezahl:** Die Grenze von 11 Geräten gilt bereits (eingerichtet für Eichenfels in `create_game_session`). Sie gilt für alle Kennungen, hier ist nichts zu tun.

**Prüfen (nach dem Eintragen):**

```sql
select slug, title, code_prefix, enabled from public.game_catalog where slug like 'krimidinner%';
```

Erwartet: zwei Zeilen, `krimidinner` und `krimidinner-eichenfels`.

---

## Was die Website tut

| Situation | Verhalten |
|---|---|
| `krimidinner` ist eingetragen | Alle Fälle eröffnen Live-Sitzungen unter dieser Kennung. Im Sitzungsstand steht zusätzlich der Fall (`fall`: id, Nummer). Gäste eines anderen Falls werden abgewiesen. |
| `krimidinner` fehlt noch | Eichenfels weicht auf die alte Kennung `krimidinner-eichenfels` aus. „Der letzte Halt“ meldet, dass Live noch nicht freigeschaltet ist; Losungswörter funktionieren trotzdem. |
| Gäste treten bei | Sie probieren erst `krimidinner`, dann die alte Kennung ihres Falls. Laufende Eichenfels-Sitzungen bleiben dadurch erreichbar. |

**Der alte Eintrag `krimidinner-eichenfels`** bleibt bestehen, nicht löschen. Er wird nur noch als Rückfall benutzt.

**Aufbewahrung:** wie in `eichenfels/SUPABASE.md`, Schritt 3. Rollen-Codes liegen nie in der Datenbank und funktionieren unbegrenzt.
