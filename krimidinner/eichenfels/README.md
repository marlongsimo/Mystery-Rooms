# Der letzte Stern von Eichenfels – Krimidinner, Fall 01

Krimidinner für 4–10 Personen am Tisch, mit einer Spielleitung, die mitspielen darf. Spielbar am Handy oder komplett ausgedruckt.

**Stand:** Vorschau. Inhalt vollständig (Fallbuch 0.6, zehn Rollen, 14 Beweise, Gastgeberheft, Anleitung), Technik fertig und im Browser getestet. **Noch nicht an einem echten Tisch gespielt.**

## Dateien

| Datei | Inhalt |
|---|---|
| `FALLBUCH.md` | **maßgebliche Quelle**: Schauplatz, Zeitleiste, Beweise, Lösung, Regeln, Standards. Enthält die Lösung. |
| `rollen/R01…R10-*.md` | die zehn Rollenblätter, je vier Seiten, beide Varianten |
| `BEWEISKARTEN.md` | B1–B14 mit Gestaltung und Freigabe |
| `GASTGEBERHEFT.md` | Teil A offen, Teil B versiegelt (Lösung) |
| `ANLEITUNG.md` | für alle, ohne Lösung |
| `index.html`, `css/kd.css`, `js/app.js` | die Anwendung |
| `js/content.js` | **erzeugt** aus den .md-Dateien: `python3 tools/build_content.py` (nach jeder Textänderung ausführen) |
| `tests/krimidinner.test.js` | Ablauf im Browser |
| `assets/grundriss.svg` | Grundriss für B3 (wird beim Erzeugen in die Karte eingesetzt, im Druck als eigenes Blatt) |

## So funktioniert die Technik

- **Kein Server, keine Datenbank, kein Netz am Abend nötig.** Alles läuft im Browser.
- **Codes:**
  - Die Spielleitung trägt Namen und Rollenvariante ein, die Rollen werden zufällig verteilt.
  - Jede Person bekommt einen Code `XXX-XXX` (30 Bit). Er enthält Rolle, Personenzahl und die Varianten aller zehn Rollen, verschleiert und mit Prüfsumme.
  - Die Spielleitung sieht nur Codes und einen eigenen Spielleitungscode.
- **Runden:** Die Spielleitung liest Losungswörter vor, Gäste schalten damit die Beweise frei:

  | Losungswort | Runde |
  |---|---|
  | KUPPEL | Runde 1 |
  | ORION | Runde 2 |
  | NEBEL | Runde 3 |
  | MORGENGRAUEN | Finale |
  | FUNK | B12, falls Lindner die Aufnahme nicht vorlegt |

  B8 und B12 erscheinen je nach Besetzung automatisch.
- **Varianten:** `[w / m]` für die eigene Rolle, `{Rxx: w / m}` für andere Rollen, aufgelöst beim Anzeigen. Die Kleidungstabelle zeigt nur die eigene Spalte.
- **Geheimes:** Rollenblätter, Karten und Teil B liegen nicht im Klartext im Quelltext. Das ist ein Schutz gegen zufälliges Mitlesen, kein Kopierschutz.
- **Druck:**
  - Beweiskarten, vier pro A4, in den Rundenfarben. Der Grundriss (B3) als eigenes Blatt.
  - Gastgeberheft A und B getrennt, Anleitung.
  - Rollenblätter in zufälliger Reihenfolge ohne Namen. Jede Person kann ihr eigenes Blatt auch selbst drucken.

## Testen

```
python3 -m http.server 8765 &      # im Repository-Wurzelordner
node krimidinner/eichenfels/tests/krimidinner.test.js   # SHOTS=1 für Bildschirmfotos und PDF in /tmp
```
