# HOTEL NOCTURNE – Die letzte Nacht

Ein düsteres Point-and-Click-Ermittlungsspiel für den Browser – allein oder mit bis zu vier Personen. Kein eigener Server, keine Anmeldung. Schriften, Grafiken, Geräusche und Bibliotheken sind lokal eingebunden bzw. werden im Browser erzeugt. Nur das gemeinsame Spielen nutzt Supabase.

## Starten

- **Lokal:** `index.html` doppelklicken.
- **GitHub Pages:** *Settings → Pages →* „Deploy from a branch“, Branch `main`, Ordner `/ (root)`. Das Spiel liegt dann unter `…/hotel-nocturne/index.html`, die Startseite aller Escape Rooms unter `…/`.

## Personalisieren

Nur `js/config.js` bearbeiten: `playerName` (Name auf der Reservierung) und `personalMessage` (Abschlussbildschirm). Dort steht auch `multiplayer` (Spielkennung `hotel-nocturne`, höchstens 4 Personen).

## Bedienung

| | |
|---|---|
| **‹ ›**, Wischen, Pfeiltasten | Im Raum umdrehen (vier Blickrichtungen) |
| Antippen | Dinge im Raum untersuchen, Gegenstände mitnehmen, Türen benutzen |
| **Rucksack** (rechts) | Gegenstand antippen → auf eine Stelle im Raum tippen. Oder direkt dorthin ziehen. Zweimal antippen = genauer ansehen |
| **Telefon** | Nachrichten, Taschenlampe, Notizen, Karte (mit Schnellreise), Hinweise |
| **Akte** | Alle gefundenen Dokumente zum Umblättern, inklusive Rückseiten |

## Gemeinsam spielen

Auf dem Titelbildschirm unter „Nicht allein einchecken.“: Namen eingeben und eine Sitzung erstellen, oder mit einem Einladungscode (`NOCT-XXXXXX`) beitreten. Bis zu vier Personen, nur der Host öffnet das Hotel.

- **Geteilt:** gelöste Rätsel, geöffnete Türen und Mechanismen, Story-Zustände, Rucksack, Akte, Beweise, freigeschaltete und gesicherte Bereiche, Nachrichten, Geheimnisse, das Ende.
- **Pro Person:** Raum und Blickrichtung, besuchte Räume, Taschenlampe, Notizen, Hinweise, Spielzeit.
- Rechts unter „Team“ steht, wo die anderen gerade sind. Funde der anderen erscheinen als kurze Meldung.
- Neu laden ist kein Problem: Die Sitzung wird erkannt, „Zurück ins Hotel“ setzt fort.
- Verlassen über das Menü (☰). Verlässt der Host, endet die Sitzung für alle. Der eigene Einzelspieler-Spielstand bleibt dabei immer unberührt.

Technik, Sicherheit und Anleitung für weitere Escape Rooms: [`platform/multiplayer/README.md`](../platform/multiplayer/README.md).

## Projektstruktur

```text
hotel-nocturne/
├── index.html                  Grundgerüst (Titel, Spiel, Telefon, Akte, Dialog, Ende)
├── css/style.css               gesamtes Design inkl. Smartphone-Ansicht
├── js/
│   ├── config.js               persönliche Einstellungen
│   ├── audio.js                Geräusche (Web Audio, keine Dateien)
│   ├── engine.js               Spiel-Engine (mit Multiplayer-Schnittstelle)
│   ├── mp-adapter.js           Anbindung an den Multiplayer der Plattform
│   └── rooms/
│       ├── 01-rezeption.js     Raum 1 mit vier Blickrichtungen (Musterraum)
│       ├── 02-zimmer217.js     Raum 2 mit vier Blickrichtungen
│       ├── 03-gepaecklager.js  Raum 3 mit vier Blickrichtungen
│       ├── 04-archiv.js        Raum 4 mit vier Blickrichtungen
│       ├── 05-ueberwachung.js  Raum 5 mit vier Blickrichtungen
│       ├── 06-keller.js        Raum 6 mit vier Blickrichtungen (dunkel bis Strom)
│       └── 07-buero-vorlaeufig.js Raum 7, spielbar, noch ohne Szene
├── assets/audio/               Hintergrundmusik
└── assets/fonts/               Schriften + Lizenzen (SIL OFL)
```

## Wie ein Raum aufgebaut ist (Vorlage: `01-rezeption.js`)

| Feld | Bedeutung |
|---|---|
| `views` | Vier Blickrichtungen (Szenen-Grundgerüst: `N.svgScene`) mit `dir`, `name`, `desc` (Text unter der Szene), `scene` (SVG 1200 × 900, später auch ein Foto möglich) und `hotspots`. |
| `dark` | Bereich einer Ansicht, der nur mit Taschenlampe sichtbar ist (`x, y, w, h` in %, optional `clip`, optional `until: "flag"` – danach hell). |
| `darkUntil` | Ganzer Raum dunkel, bis der Zustand gesetzt ist: ohne Taschenlampe sind nur Hotspots mit `always: true` sichtbar. Dazu je Ansicht `descLit` (Text bei Licht) und `ambientAfter: { flag, name }` (Raumklang wechselt). |
| Hotspot | Position `x, y, w, h` in Prozent. Kann `text` zeigen, ein `doc` in die Akte legen, ein Schloss tragen (`lock`), einen Gegenstand verlangen (`use`), einen Gegenstand liefern (`take`) oder in einen anderen Raum führen (`go`). Mit `if` / `unless` (auch als Liste: alle bzw. keine) erscheint er nur in bestimmten Zuständen; `licht` steht für die eingeschaltete Taschenlampe. `solves` löst ein Ereignis-Rätsel beim Antippen (z. B. eine Tür, die jetzt aufgeht). |
| `puzzles` | Rätsel in der Reihenfolge der Ziele. Typen: `code` (Ziffernfeld), `wheels` (Buchstabenräder), `sort` (Streifen/Bilder in Reihenfolge bringen), `cipher` (Chiffrierscheibe), `choice` (Auswahlfragen in Stufen, auch Mehrfachauswahl), `text`, `multi`, `use` (Gegenstand), `event` (wird durch eine Aktion gelöst), `sequence` (Bedienelemente nacheinander betätigen – `checkEach` setzt bei jedem falschen Schritt zurück, sonst wird nach dem letzten geprüft; `wrongStep`, `wrongOrders`, `pressSound`, `failSound`). Ein Rätsel darf auch an einem Hotspot in einem anderen Raum hängen (z. B. die Tür „Personal“ in der Rezeption gehört zu Zimmer 217). Jedes mit drei Hinweisen (der dritte ist die Lösung) und optionalen Rückmeldungen für typische Fehlversuche (`wrong`). |
| `onSolve` | `flag`, `give` (Gegenstand), `remove` (Gegenstand verbrauchen), `doc` (Akte), `message` (Telefon), `sound`, `unlock` (Raum freischalten), `later: { ms, actions, narrate }` (verzögert, übersteht Neuladen), `evidence` (als Beweis markieren), `open` (Dokument/Aufnahme sofort zeigen), `unflag` (Zustand zurücknehmen). Sortier-Rätsel optional mit `checkButton`, `wrongOrders` und Bildern (`plain`, `items[].html`). Mit `quiet: true` erscheint statt des Erfolgsdialogs nur ein Text unter der Szene. |
| `events` | Einmalige Ereignisse beim Betreten einer Blickrichtung, optional erst nach einem bestimmten Rätsel (`ifSolved`) und mit Blitz (`flash`). |
| `secret: true` | Hotspot zählt als optionales Geheimnis (Zähler im Menü). |
| `completeWhen` | Welche Rätsel den nächsten Raum freischalten. |
| `N.messages` | Nachrichten, die während des Spiels aufs Telefon kommen. |

Antworten werden tolerant verglichen: Groß-/Kleinschreibung, Leerzeichen und Satzzeichen spielen keine Rolle.

## Musik

`assets/audio/shadowed-loop.mp3` läuft als Endlosschleife, sobald man das Hotel betritt, und wird auf dem Titel- und Endbildschirm ausgeblendet. Ein- und ausschalten über das Menü (☰) oder den Lautsprecher-Knopf. Die Datei wird in `js/engine.js` (`MUSIC`) festgelegt; einzelne Räume können mit `music: "…"` eine eigene Musik bekommen. Über GitHub Pages läuft der Loop lückenlos (Web Audio), beim lokalen Öffnen per Doppelklick über einen normalen Audio-Player.

## Spielstand

Automatisch im Browser (`localStorage`, Schlüssel `nocturne_save_v2`). Zurücksetzen über das Menü (☰). Gemeinsame Sitzungen speichern lokal unter `nocturne_mp_<Sitzungs-ID>` und auf dem Server. Der Einzelspieler-Stand wird davon nie berührt.

## Hinweis zu den Lösungen

Alle Lösungen stehen im Klartext in `js/rooms/`. Bei einem reinen Browserspiel lässt sich das nicht verhindern. Vor dem Verschenken einmal komplett selbst durchspielen.
