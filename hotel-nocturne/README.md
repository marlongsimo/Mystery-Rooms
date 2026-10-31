# HOTEL NOCTURNE – Die letzte Nacht

Ein düsteres Point-and-Click-Ermittlungsspiel für den Browser. Kein Server, keine Anmeldung, keine externen Abhängigkeiten. Schriften, Grafiken und Geräusche sind lokal eingebunden bzw. werden im Browser erzeugt.

## Starten

- **Lokal:** `index.html` doppelklicken.
- **GitHub Pages:** *Settings → Pages →* „Deploy from a branch“, Branch `main`, Ordner `/ (root)`. Das Spiel liegt dann unter `…/hotel-nocturne/index.html`, die Startseite aller Escape Rooms unter `…/`.

## Personalisieren

Nur `js/config.js` bearbeiten: `playerName` (Name auf der Reservierung) und `personalMessage` (Abschlussbildschirm).

## Bedienung

| | |
|---|---|
| **‹ ›**, Wischen, Pfeiltasten | Im Raum umdrehen (vier Blickrichtungen) |
| Antippen | Dinge im Raum untersuchen, Gegenstände mitnehmen, Türen benutzen |
| **Rucksack** (rechts) | Gegenstand antippen → auf eine Stelle im Raum tippen. Oder direkt dorthin ziehen. Zweimal antippen = genauer ansehen |
| **Telefon** | Nachrichten, Taschenlampe, Notizen, Karte (mit Schnellreise), Hinweise |
| **Akte** | Alle gefundenen Dokumente zum Umblättern, inklusive Rückseiten |

## Projektstruktur

```text
hotel-nocturne/
├── index.html                  Grundgerüst (Titel, Spiel, Telefon, Akte, Dialog, Ende)
├── css/style.css               gesamtes Design inkl. Smartphone-Ansicht
├── js/
│   ├── config.js               persönliche Einstellungen
│   ├── audio.js                Geräusche (Web Audio, keine Dateien)
│   ├── engine.js               Spiel-Engine
│   └── rooms/
│       ├── 01-rezeption.js     Musterraum mit vier Blickrichtungen
│       └── 02-07-vorlaeufig.js Räume 2–7, spielbar, noch ohne Szenen
└── assets/fonts/               Schriften + Lizenzen (SIL OFL)
```

## Wie ein Raum aufgebaut ist (Vorlage: `01-rezeption.js`)

| Feld | Bedeutung |
|---|---|
| `views` | Vier Blickrichtungen mit `dir`, `name`, `desc` (Text unter der Szene), `scene` (SVG 1200 × 900, später auch ein Foto möglich) und `hotspots`. |
| `dark` | Bereich einer Ansicht, der nur mit Taschenlampe sichtbar ist (`x, y, w, h` in %, optional `clip`). |
| Hotspot | Position `x, y, w, h` in Prozent. Kann `text` zeigen, ein `doc` in die Akte legen, ein Schloss tragen (`lock`), einen Gegenstand verlangen (`use`), einen Gegenstand liefern (`take`) oder in einen anderen Raum führen (`go`). Mit `if` / `unless` erscheint er nur in bestimmten Zuständen; `licht` steht für die eingeschaltete Taschenlampe. |
| `puzzles` | Rätsel in der Reihenfolge der Ziele. Typen: `code`, `text`, `multi`, `use`, `event`. Jedes mit drei Hinweisen (der dritte ist die Lösung) und optionalen Rückmeldungen für typische Fehlversuche (`wrong`). |
| `onSolve` | `flag`, `give` (Gegenstand), `doc` (Akte), `message` (Telefon), `sound`. |
| `completeWhen` | Welche Rätsel den nächsten Raum freischalten. |
| `N.messages` | Nachrichten, die während des Spiels aufs Telefon kommen. |

Antworten werden tolerant verglichen: Groß-/Kleinschreibung, Leerzeichen und Satzzeichen spielen keine Rolle.

## Spielstand

Automatisch im Browser (`localStorage`, Schlüssel `nocturne_save_v2`). Zurücksetzen über das Menü (☰).

## Hinweis zu den Lösungen

Alle Lösungen stehen im Klartext in `js/rooms/`. Bei einem reinen Browserspiel lässt sich das nicht verhindern. Vor dem Verschenken einmal komplett selbst durchspielen.
