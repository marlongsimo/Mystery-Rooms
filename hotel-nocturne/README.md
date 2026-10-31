# HOTEL NOCTURNE – Die letzte Nacht

Ein digitaler Mystery-Escape-Room für den Browser. Kein Server, keine Anmeldung, keine externen Abhängigkeiten. Schriften und Grafiken sind lokal eingebunden, es werden keine Daten an Dritte übertragen.

## Starten

- **Lokal:** `index.html` doppelklicken. Das Spiel funktioniert auch direkt aus dem Dateisystem.
- **GitHub Pages:** Im Repository unter *Settings → Pages* „Deploy from a branch“ wählen, Branch `main`, Ordner `/ (root)`. Das Spiel liegt dann unter `https://<benutzername>.github.io/<repository>/hotel-nocturne/`.

## Personalisieren

Nur `js/config.js` bearbeiten:

| Einstellung | Wirkung |
|---|---|
| `playerName` | Name auf der Reservierungsbestätigung (leer = „Verehrter Gast“) |
| `personalMessage` | Persönliche Nachricht auf dem Abschlussbildschirm |

## Projektstruktur

```text
hotel-nocturne/
├── index.html                  Grundgerüst (Titel, Spiel, Ende, Dialog)
├── css/
│   ├── fonts.css               lokale Schriften
│   └── style.css               gesamtes Design inkl. Smartphone-Ansicht
├── js/
│   ├── config.js               persönliche Einstellungen
│   ├── audio.js                Geräusche (live im Browser erzeugt)
│   ├── engine.js               Spiel-Engine
│   └── rooms/
│       ├── 01-rezeption.js     fertiger Musterraum
│       └── 02-07-vorlaeufig.js Räume 2–7, spielbar, noch ohne Szene
└── assets/fonts/               Schriftdateien + Lizenzen (SIL OFL)
```

## Wie ein Raum aufgebaut ist

Jeder Raum ist ein Datenobjekt. `01-rezeption.js` ist die Vorlage.

| Feld | Bedeutung |
|---|---|
| `scene` | Raumbild als SVG (später auch `<img>` möglich). Elemente mit `data-if="flag"` bzw. `data-unless="flag"` werden je nach Spielzustand ein-/ausgeblendet. |
| `hotspots` | Anklickbare Stellen. Position `x, y, w, h` in Prozent der Szene. Ein Hotspot kann Text zeigen (`text`), ein Dokument öffnen (`doc`), ein Schloss tragen (`lock`) oder einen Gegenstand verlangen (`use`). |
| `puzzles` | Rätsel des Raums. Typen: `code` (Ziffernfeld), `text` (Wort/Satz), `multi` (mehrere Fragen), `use` (Gegenstand benutzen). Mit `wrong` lassen sich eigene Rückmeldungen für typische Fehlversuche hinterlegen. |
| `hints` | Genau drei Hinweisstufen pro Rätsel, die dritte ist die Lösung. |
| `onSolve` | Was beim Lösen passiert: `flag`, `give` (Gegenstand), `doc` (Dokument in die Beweismappe), `sound`. |
| `completeWhen` | Welche Rätsel gelöst sein müssen, damit der nächste Raum freigeschaltet wird. |

Antworten werden tolerant verglichen: Groß-/Kleinschreibung, Leerzeichen und Satzzeichen spielen keine Rolle (`23:24`, `2324` und `23.24` sind gleich).

## Spielstand

Wird automatisch im Browser gespeichert (`localStorage`, Schlüssel `nocturne_save_v1`): Fortschritt, Inventar, Beweismappe, Notizen, genutzte Hinweise und Spielzeit. Zurücksetzen über das Menü (☰) → „Spielstand löschen“.

## Hinweis zu den Lösungen

Alle Lösungen stehen im Klartext in `js/rooms/`. Bei einem reinen Browserspiel lässt sich das nicht verhindern, und die dritte Hinweisstufe verrät sie ohnehin. Wer das Spiel verschenkt, sollte es vorher einmal komplett selbst durchspielen.
