# Krimidinner-Engine – Technische Spezifikation

Stand: 1.0 · Grundlage: Konzept „Plattform für digitale Krimidinner“ 1.0 und der Code von Eichenfels (`krimidinner/eichenfels/`, Stand `bcd3cfa`)

**Ziel:** Ein gemeinsames Spielsystem für beliebig viele Krimidinner. Ein neuer Fall besteht aus **Texten, einer Konfigurationsdatei und Bildern**, nicht aus neuem Programmcode. Eichenfels wird der erste Fall auf dieser Engine, ohne dass bereits verschickte Codes oder Links ungültig werden.

---

## 1. Grundsätze

1. **Kein Server nötig.** Rollen stecken in den Codes, Runden öffnen sich über Losungswörter. Supabase ist nur ein optionaler Zusatz für die Live-Verbindung.
2. **Eine Quelle für Inhalte.** Die freigegebenen Markdown-Texte sind die Quelle. Ein Werkzeug erzeugt daraus die Spieldaten. Niemand pflegt Inhalte doppelt.
3. **Alles Fallspezifische steht in `fall.json`** oder in den Texten. Die Engine kennt keine Namen, Rollennummern, Losungswörter oder Kartennummern.
4. **Rollen gehen nie an einen Server.**
5. **Die Spielleitung bekommt nie eine Täterrolle** (Standard, abschaltbar je Fall).
6. **Bestehendes bleibt gültig.** URLs, Eichenfels-Codes (6 Zeichen) und gespeicherte Spielstände funktionieren weiter.
7. **Erste Ausbaustufe:** feste Rollen, ein vorgegebener Täter (oder eine feste Tätergruppe), lineare Runden. Wechselnde Täter, mehrere Enden oder verzweigte Runden kommen später und dürfen die erste Engine nicht verkomplizieren.

---

## 2. Ist-Stand: Was heute fest auf Eichenfels zugeschnitten ist

Die App (`eichenfels/js/app.js`, 506 Zeilen) ist schon weitgehend datengetrieben: Rollen, Karten, Gastgeberheft und Anleitung kommen aus `content.js`, das `tools/build_content.py` aus den `.md`-Dateien erzeugt. **Fest im Code stehen:**

| Was | Wo (`app.js`) | Wohin künftig |
|---|---|---|
| Rollen-IDs R01–R10, Namen beider Varianten | Z. 18–21 | `fall.json → roles` |
| Besetzungsreihenfolge nach Personenzahl | Z. 19 | `fall.json → cast.order` |
| Losungswörter, Rundennamen, Farben | Z. 73–78 | `fall.json → rounds` |
| Zusatzwort FUNK für B12 | Z. 79, 296, 313 | `fall.json → cards.B12.extraWord` |
| Kartenbedingungen (B8 ohne R07, B12 ohne R04) | Z. 83 | `fall.json → cards.*.when` |
| Dichter Druck für B3, B9, B11 · Grundriss B3 als eigenes Blatt | Z. 93, 348–349 | `fall.json → cards.*.print` |
| Code-Format: genau 10 Rollen, 30 Bit | Z. 24–46 | Code-Format v2 (Abschnitt 5) |
| Verschleierungsschlüssel | Z. 50 | `fall.json → id` (Schlüssel daraus abgeleitet) |
| Speicherschlüssel `kd_eich_*` | ca. 20 Stellen | `kd:<fall>:*` |
| Ablaufschritte und Phasen | Z. 263–271 | `fall.json → steps` |
| Täterrolle R08 bei der Auswertung | Z. 486 | `fall.json → culprits` |
| Texte: Kopfzeile „STERNWARTE EICHENFELS“, Titel, Einladungstext, Anklagefrage, Haus-Beschreibung | Z. 93, 103, 161, 209, 460 | `fall.json → texts` |
| Live-Spielkennung `krimidinner-eichenfels` | Z. 370 | eine Kennung `krimidinner` für alle Fälle |

Im Erzeugungswerkzeug (`tools/build_content.py`) ist nur der Pfad fest. Die Regeln für das Einlesen (Überschriften, Varianten, Kartenköpfe) sind schon allgemein und werden zur Norm (Abschnitt 6).

---

## 3. Ordnerstruktur

```
krimidinner/
├── ENGINE.md                    diese Spezifikation
├── faelle.js                    Verzeichnis aller Fälle: id, Nummer, Titel, Pfad (für Code-Weiterleitung und Startseite)
├── engine/
│   ├── kd-core.js               Codes, Varianten, Entschleiern, Speicher, Besetzung, Kartenauswahl
│   ├── kd-player.js             Rollenblatt, Haus, Regeln, Beweise, Anklage
│   ├── kd-host.js               Abend anlegen, Codes verteilen, geführter Ablauf, Lösung
│   ├── kd-print.js              Druck: Rollen, Karten, Gastgeberheft, Anleitung
│   ├── kd-live.js               optionale Live-Verbindung (platform/multiplayer)
│   ├── kd.css                   gemeinsame Gestaltung; Fälle setzen nur Farben/Schriften als Variablen
│   └── build_case.py            Erzeugt <fall>/content.js aus <fall>/*.md + fall.json
├── tests/
│   └── engine.test.js           läuft für jeden Fall (Parameter: Fall-ID)
└── eichenfels/                  ein Fall
    ├── index.html               schlank: lädt Engine, fall-eigene content.js, ggf. fall.css
    ├── fall.json                Konfiguration
    ├── FALLBUCH.md · BEWEISKARTEN.md · GASTGEBERHEFT.md · ANLEITUNG.md · SUPABASE.md
    ├── rollen/R01-….md …
    ├── assets/grundriss.svg
    ├── js/content.js            erzeugt, nicht von Hand bearbeiten
    └── tests/                   fallspezifische Prüfungen (Beweiskette, Vorwissen, Live)
```

Die URL `krimidinner/eichenfels/index.html` bleibt. Jeder Fall hat seine eigene Seite. Die Engine liegt einmal unter `krimidinner/engine/`.

---

## 4. Fallkonfiguration `fall.json`

Eine Datei je Fall. Alles, was nicht Text ist, steht hier. Beispiel Eichenfels, vollständig:

```json
{
  "id": "eichenfels",
  "nr": 1,
  "title": "Der letzte Stern von Eichenfels",
  "players": { "min": 4, "max": 10 },
  "roles": [
    { "id": "R01", "file": "rollen/R01-familie.md",    "names": ["Leonie Sander", "Leon Sander"] },
    { "id": "R02", "file": "rollen/R02-forschung.md",  "names": ["Dr. Irene Marwitz", "Dr. Ingo Marwitz"] },
    { "id": "R03", "file": "rollen/R03-kanzlei.md",    "names": ["Johanna Ritter", "Johannes Ritter"] },
    { "id": "R04", "file": "rollen/R04-presse.md",     "names": ["Clara Lindner", "Carl Lindner"] },
    { "id": "R05", "file": "rollen/R05-veranstaltung.md", "names": ["Tessa Hollerbach", "Tom Hollerbach"] },
    { "id": "R06", "file": "rollen/R06-kueche.md",     "names": ["Mina Yilmaz", "Emre Yilmaz"] },
    { "id": "R07", "file": "rollen/R07-arzt.md",       "names": ["Dr. Nina Seebach", "Dr. Nils Seebach"] },
    { "id": "R08", "file": "rollen/R08-archiv.md",     "names": ["Dr. Judith Rademacher", "Dr. Julius Rademacher"] },
    { "id": "R09", "file": "rollen/R09-technik.md",    "names": ["Paula Faber", "Pascal Faber"] },
    { "id": "R10", "file": "rollen/R10-sammler.md",    "names": ["Eva Falk", "Egon Falk"] }
  ],
  "cast": { "order": ["R02", "R08", "R09", "R10", "R01", "R03", "R06", "R04", "R05", "R07"] },
  "culprits": ["R08"],
  "host": { "mayPlay": true, "neverCulprit": true },
  "rounds": [
    { "no": 1, "name": "Runde 1 · nach dem Fund",          "word": "KUPPEL",       "color": "#2c4a7a", "rolePart": "Runde 1" },
    { "no": 2, "name": "Runde 2 · Geheimnisse",            "word": "ORION",        "color": "#a8823e", "rolePart": "Runde 2" },
    { "no": 3, "name": "Runde 3 · die letzte Ermittlung",  "word": "NEBEL",        "color": "#9e2b25", "rolePart": "Runde 3" },
    { "no": 4, "name": "Finale · nach der Anklage",        "word": "MORGENGRAUEN", "color": "#d5ad62", "final": true }
  ],
  "cards": {
    "B3":  { "print": "sheet" },
    "B8":  { "when": { "missing": ["R07"] } },
    "B9":  { "print": "dense" },
    "B11": { "print": "dense" },
    "B12": { "when": { "missing": ["R04"] }, "extraWord": "FUNK" }
  },
  "steps": [
    { "key": "vorb",  "title": "Vorbereitung",                   "sections": ["A1", "A2", "A3", "A4"] },
    { "key": "start", "title": "Start · Regeln vorlesen",        "sections": ["A5"], "mins": 5 },
    { "key": "p1",    "title": "Phase 1 · Der Empfang",          "sections": ["Phase 1"], "phase": 1, "mins": 20 },
    { "key": "p2",    "title": "Phase 2 · Der Mord",             "sections": ["Phase 2"], "phase": 2, "round": 1, "mins": 20 },
    { "key": "p3",    "title": "Phase 3 · Geheimnisse und Intrigen", "sections": ["Phase 3"], "phase": 3, "round": 2, "mins": 30 },
    { "key": "p4",    "title": "Phase 4 · Die letzte Ermittlung", "sections": ["Phase 4"], "phase": 4, "round": 3, "mins": 25 },
    { "key": "fin",   "title": "Finale · Anklage und Auflösung", "sections": ["Finale"], "phase": 5, "round": 4, "mins": 25, "accusation": true }
  ],
  "npc": { "phaseToRound": { "2": 1, "3": 2, "4": 3 } },
  "house": { "svg": "assets/grundriss.svg", "intro": "Ein Herrenhaus von 1901 mit Kuppel …", "note": "Wer welche Tür öffnen kann …" },
  "texts": {
    "brand": "EICHENFELS",
    "cardHeader": "STERNWARTE EICHENFELS",
    "eyebrow": "Krimidinner · Fall 01",
    "teaser": "Ein Galadinner in einer Sternwarte im Thüringer Wald …",
    "accusation": "Wer hat Theodor Sander getötet?",
    "inviteText": "{name}, hier ist dein Rollenblatt für „{title}“. Bitte nur selbst öffnen: {link} (Code {code})"
  },
  "theme": { "bg": "#0d1018", "accent": "#d5ad62" },
  "live": { "maxDevices": 11 },
  "leakCheck": ["Mord", "Ermittlung", "Kalender steht", "Leiche", "Tatzeit", "Tatwaffe", "Alibi"]
}
```

**Regeln für die Felder:**
- `roles`: 2–20 Rollen. Die Reihenfolge legt die Bits im Code fest und darf nach der ersten Veröffentlichung **nicht mehr geändert** werden. Neue Rollen kommen ans Ende.
- `cast.order`: Die ersten n Rollen werden bei n Personen besetzt. Alle Täterrollen müssen bei `players.min` schon besetzt sein. Das prüft das Erzeugungswerkzeug.
- `cards.*.when`: zunächst nur `missing` (Rolle unbesetzt) und `present` (Rolle besetzt). Ohne `when` erscheint die Karte immer.
- `rounds`: beliebig viele. Die Runde mit `final: true` öffnet die Spielleitung nur nach einer Rückfrage. Sie öffnet auch die Anklage.
- `steps`: verweisen auf Abschnitte des Gastgeberhefts nach ihrer Überschrift (Abschnitt 6).
- `leakCheck`: Wörter, die in den sofort sichtbaren Rollenteilen unschuldiger Rollen nicht vorkommen dürfen. Das prüft der Test.

---

## 5. Code-Format v2

**Problem:** Das heutige Format hat 30 Bit, davon genau 10 für die Varianten von genau 10 Rollen. Es kennt keinen Fall.

**Neu:** Felder in fester Reihenfolge, als `BigInt` gerechnet, in Base32 (Crockford, ohne I, L, O, U) geschrieben:

| Feld | Bit | Inhalt |
|---|---|---|
| Version | 2 | `1` = v2 |
| Fall | 6 | `nr` aus `fall.json` (1–63) |
| Art | 1 | 0 = Person, 1 = Spielleitung |
| Rolle | 5 | Index in `roles` (bei der Spielleitung 0) |
| Personen | 5 | 1–31 |
| Varianten | R | ein Bit je Rolle (R = Anzahl Rollen), 1 = männlich |
| Salz | 6 | Zufall, verschleiert die übrigen Felder |
| Prüfsumme | 8 | über alle Felder, mit dem Salz gemischt |

Bei 10 Rollen ergibt das 43 Bit, also **9 Zeichen: `XXX-XXX-XXX`**. Bei 16 Rollen sind es 10 Zeichen. Tippfehler fängt die Prüfsumme zu 99,6 % ab (vorher 98,4 %).

**Ablauf beim Öffnen:**
1. Hat der Code 6 Zeichen, ist er ein **Eichenfels-v1-Code** und wird mit dem alten Verfahren gelesen. Er bleibt dauerhaft gültig.
2. Sonst wird er als v2 gelesen, das Feld „Fall“ ausgewertet und mit `faelle.js` verglichen. Gehört der Code zu einem anderen Fall, kommt die Meldung „Dieser Code gehört zu ‚…‘“ mit Link. Alle Fälle teilen sich also ein gemeinsames Code-Eingabefeld.
3. Die Prüfsumme wird geprüft, ebenso, ob die Rolle in der Besetzung für diese Personenzahl liegt.

Neue Codes für Eichenfels werden ab der Umstellung im v2-Format erzeugt. Alte Codes funktionieren weiter.

---

## 6. Inhaltsformat (Norm für neue Fälle)

Das, was Eichenfels heute schon tut, wird zur verbindlichen Form. Das Erzeugungswerkzeug bricht mit einer klaren Meldung ab, wenn etwas fehlt.

**Rollenblatt** `rollen/<ID>-<name>.md`
- Erste Zeile: `# Rollenblatt <ID> · <Titel>`. Steht im Titel `TÄTERROLLE`, muss die ID in `culprits` stehen, und umgekehrt.
- Abschnitte: `## <Teil> · <Überschrift>` mit Teil ∈ `Charakter`, `Kleidung`, `Vertraulich` sowie für jede Runde der Wert ihres `rolePart` (z. B. `Runde 1`). Jeder Teil muss mindestens einmal vorkommen.
- Varianten: `[weiblich / männlich]` für die eigene Rolle, `{R03: die / der}` für eine andere Rolle. Unbekannte IDs sind ein Fehler.
- Kleidungstabelle mit den Spalten `| | weiblich | männlich |`. Die App zeigt nur die eigene Spalte, „dasselbe“ übernimmt die weibliche Angabe.

**Beweiskarten** `BEWEISKARTEN.md`
- Runden: `## Runde <n> …` bzw. `## Finale …`
- Karte: `### <ID> · <Symbol> <Titel>`, darunter der Text, am Ende `*Freigabe: …*`. Diese Zeile ist nur für Menschen, maßgeblich ist `fall.json`.

**Gastgeberheft** `GASTGEBERHEFT.md`
- `# Teil A …` (offen) und `# Teil B …` (versiegelt, wird verschleiert)
- Abschnitte `## <Schlüssel> · <Titel>`. Der Schlüssel ist das, worauf `steps.sections` verweist (z. B. `A2`, `Phase 3`, `Finale`).
- Wissen der Nebenfiguren: ein Abschnitt mit einer Tabelle `| Rolle | Phase | Zum Vorlesen |`. Daraus werden die Aussagekarten.
- Impulse für „Wenn es stockt“: Liste mit `- **Phase <n>:** …` und `- **Immer:** …`
- Vorstellung der Nebenfiguren: Tabelle mit erster Spalte `Nebenfigur`. Es werden nur unbesetzte Rollen gezeigt.

**Anleitung** `ANLEITUNG.md`
- Abschnitte `##`. In `fall.json` (`rulesSections`) steht, welche davon im Rollenblatt unter „Regeln“ erscheinen. Bei Eichenfels sind das die Regeln, der Ablauf, die Anklage und die Tipps.

**Haus** (optional): eine SVG-Datei und zwei Sätze Text, angegeben in `house`.

---

## 7. Engine-Module

| Modul | Aufgaben | Liest aus der Konfiguration |
|---|---|---|
| `kd-core.js` | Codes v1/v2, Varianten auflösen, Entschleiern, Speicher `kd:<fall>:…`, Besetzung, Kartenauswahl nach `when`, Aussagekarten nach `npc` | roles, cast, cards, rounds, npc |
| `kd-player.js` | Reiter Charakter, Kleidung, Vertraulich (versiegelt), Regeln, Haus, Runden (gesperrt bis Losungswort), Beweise, Anklage | rounds, house, texts |
| `kd-host.js` | Abend anlegen (Namen, Varianten, **Spielleitung markieren**), Verteilung, Codes senden, geführter Ablauf, Zeitnahme, Losungswörter, Aussagen der Nebenfiguren, Lösung versiegelt | steps, host, culprits, players |
| `kd-print.js` | Rollenblätter (je Teil eine Seite, Runden mit „Erst öffnen …“), Karten vier pro A4, Sonderblätter, Gastgeberheft A/B, Anleitung | cards.print, rounds |
| `kd-live.js` | Live-Sitzung, Rundenstand, Anklagen (siehe 8) | live, culprits |

**Rollenverteilung mit Spielleitung:** Beim Anlegen markiert die Spielleitung, ob und als welche Person sie mitspielt. Ist `host.neverCulprit` gesetzt, kommen die Täterrollen nur unter die übrigen Personen. Alle anderen Rollen werden weiter zufällig verteilt.

**Was die Engine bewusst nicht kann (erste Stufe):** Täter, die von der Besetzung abhängen, mehrere Enden, verzweigte Runden, Rollen, die erst während des Abends dazukommen.

---

## 8. Live-Verbindung

- **Eine Spielkennung für alle Fälle:** `krimidinner` in `game_catalog` (Präfix z. B. `KRIM`). Neue Fälle brauchen keinen eigenen Eintrag in Supabase mehr. Übergangsweise funktioniert der vorhandene Eintrag `krimidinner-eichenfels` weiter.
- **Einträge im Sitzungsstand:**

  | Schlüssel | Wer schreibt | Inhalt |
  |---|---|---|
  | `fall` | Spielleitung | `{ id, nr, codeVersion }`. Gäste eines anderen Falls werden abgewiesen. |
  | `runde` | Spielleitung | `{ open: {1: true, …}, extra: {B12: true}, anklage: bool }` |
  | `acc:<Nutzer-ID>` | jede Person ihre eigene | `{ who, why, proof, name, at }` |

- **Geräte:** `live.maxDevices` aus der Konfiguration, höchstens so viele, wie die Datenbank erlaubt. Sonst gibt es automatisch einen Rückfall auf 8 mit Hinweis (wie heute).
- **Losungswörter funktionieren immer**, auch parallel zur Live-Verbindung.

---

## 9. Erzeugungswerkzeug `engine/build_case.py`

`python3 krimidinner/engine/build_case.py eichenfels` erzeugt `eichenfels/js/content.js` und **prüft dabei**:
- Alle Rollen aus `fall.json` haben eine Datei mit allen Pflichtteilen. Titel und `culprits` passen zusammen.
- Alle `{Rxx: …}` verweisen auf existierende Rollen. Es gibt keine offenen Klammern ohne Gegenstück.
- Alle Karten aus `fall.json` existieren in `BEWEISKARTEN.md`, und jede Karte liegt in einer Runde.
- Alle `steps.sections` existieren im Gastgeberheft.
- `culprits` sind bei `players.min` besetzt.
- Die Wörter aus `leakCheck` fehlen in den sofort sichtbaren Teilen unschuldiger Rollen.

Bei einem Verstoß bricht das Werkzeug mit Datei und Zeile ab.

---

## 10. Tests

- **`krimidinner/tests/engine.test.js <fall>`** läuft für jeden Fall gleich:
  - Anlegen, Verteilen, Codes (v1 und v2, falsche Codes, Code eines fremden Falls)
  - jede Rolle in beiden Varianten ohne offene Klammern
  - alle Personenzahlen von `min` bis `max`: Besetzung, Täterrolle dabei, bedingte Karten, Aussagekarten
  - Spielleitung spielt mit und bekommt nie eine Täterrolle (z. B. 200 Verteilungen)
  - Runden gesperrt und per Losungswort geöffnet, geführter Ablauf, Siegel, Druck
- **Fallspezifisch** (`<fall>/tests/`): Beweiskette, besondere Karten, Live gegen die echte Datenbank.
- **Testabende:** kleinste, mittlere und größte Besetzung. Dazu ein Protokoll nach Vorlage `krimidinner/TESTPROTOKOLL.md`: Rückfragen, Leerlauf, welcher Hinweis die Lösung brachte, Dauer je Phase.

---

## 11. Umstellung von Eichenfels (Reihenfolge)

1. `fall.json` für Eichenfels anlegen (Inhalt wie Abschnitt 4).
2. `engine/` aus `eichenfels/js/app.js` herauslösen. Jede feste Stelle aus Abschnitt 2 liest jetzt aus der Konfiguration.
3. Code-Format v2 einbauen, v1 weiter lesbar. Speicher `kd_eich_*` beim ersten Start einmalig nach `kd:eichenfels:*` übernehmen.
4. `build_case.py` mit den Prüfungen aus Abschnitt 9. Die heutigen `.md`-Dateien bleiben unverändert.
5. Spielleitung markieren, Täterrolle ausschließen.
6. Die 67 Eichenfels-Prüfungen und der Live-Test müssen unverändert grün sein. Zusätzlich läuft `engine.test.js eichenfels`.
7. `faelle.js` anlegen und die Startseite daraus speisen (Kategorie „Krimidinner“, sobald es zwei Fälle gibt).

**Abnahme:** Eichenfels sieht für Gäste und Spielleitung genauso aus wie vorher. Ein alter 6-Zeichen-Code öffnet weiter dieselbe Rolle. Es gibt keinen fallspezifischen Begriff mehr in `engine/`. Geprüft wird das per Suche nach „Eichenfels“, „R08“, „KUPPEL“ usw.

**Aufwand:** Schritte 1–6 etwa ein bis zwei Arbeitstage, Schritt 7 ein halber.

---

## 12. Fall 02: Anforderungen an die Probe

Fall 02 soll die Engine bewusst anders belasten als Eichenfels, sonst beweist er nichts:
- **eine andere Rollenzahl**, z. B. 8,
- **eine andere Rundenzahl**, z. B. 2 Ermittlungsrunden plus Finale,
- **mindestens eine Karte mit `present`-Bedingung**, also eine Karte, die nur erscheint, wenn eine bestimmte Rolle besetzt ist,
- **kein Grundriss** oder ein anderes Haus-Element.

Gelingt das, ohne `engine/` anzufassen, ist die Architektur bestätigt.

---

## 13. Offene Entscheidungen

| Frage | Vorschlag |
|---|---|
| Codelänge 9 Zeichen statt 6 | annehmen, mit Prüfsumme und Fallkennung |
| Eine Live-Kennung `krimidinner` für alle Fälle | ja, Eintrag in `game_catalog` mit Präfix `KRIM` |
| Spielleitung nie Täter | Standard ja, je Fall abschaltbar |
| Gestaltung je Fall | gemeinsames Layout, je Fall nur Farben, Schriften, Kopfzeile, Bilder |
| Startseite | eigene Kategorie „Krimidinner“ ab Fall 02 |

---

## Nachtrag: Erweiterungen aus Fall 02 (Silberkamm)

Diese Felder nutzt `silberkamm/fall.json` zusätzlich. Die Engine muss sie bei der Migration verstehen.

| Feld | Bedeutung |
|---|---|
| `rounds[].alt` | weitere Schreibweisen des Losungsworts, zum Beispiel `LAEUTWERK` für `LÄUTWERK`. Vergleich ohne Groß- und Kleinschreibung. |
| `house.tab` | Name des Reiters für das Orientierungsblatt („Haus“ in Eichenfels, „Zug“ in Silberkamm). Standard ist „Haus“. |
| `cards.*.when.present` | wird erstmals genutzt (B8 nur mit R03). Mit B13 (`missing: R05`) sind beide Bedingungsarten im Einsatz. |
| `rounds` mit 4 Runden und Finale | Rollenblätter haben Runde 1–4. Die Spielleitung hat 6 Phasen. |

**Prüfwerkzeug:** `tools/check_case.py <Ordner>` prüft einen Fall schon jetzt gegen die Norm aus Abschnitt 6, ohne etwas zu erzeugen. Es prüft:
- Besetzung und Täterrolle bei der Mindestzahl
- Rollenteile und Varianten
- Lecks vor Runde 1
- Kartennummern und Bedingungen, Kartenzahl je Besetzung
- Abschnitte des Gastgeberhefts, Aussagekarten
- Regelabschnitte und Asset

Später geht es in `build_case.py` auf.

---

## Umsetzungsstand (Engine 1.0)

Umgesetzt sind die Engine, Code v2, die gemeinsame Live-Kennung und beide Fälle.

| Teil | Stand |
|---|---|
| `engine/kd.js` | gemeinsame App für alle Fälle. Enthält keinen Fallnamen, keine Rolle und kein Losungswort. Die Aufteilung in fünf Module (Abschnitt 7) ist vorerst eine Datei. |
| `engine/kd.css` | gemeinsame Gestaltung. Farben kommen aus `fall.json → theme` und `rounds[].color`. |
| `engine/build_case.py <fall>` | erzeugt `<fall>/js/content.js`. Vorher läuft `tools/check_case.py`, bei einem Fehler wird nichts geschrieben. |
| `faelle.js` | Verzeichnis der Fälle für die Meldung „Dieser Code gehört zu …“. |
| Code v2 | wie Abschnitt 5: 2 + 6 + 1 + 5 + 5 + R + 6 + 8 Bit, bei bis zu 12 Rollen 9 Zeichen. Alte 6-Zeichen-Codes gelten weiter (`codeV1: true` nur bei Eichenfels). |
| Live | Kennung `krimidinner` für alle Fälle, Sitzungsstand `fall`. Rückfall auf `live.legacySlug`. Einrichtung siehe `SUPABASE.md`. |
| Spielleitung | Beim Anlegen markiert sich die Spielleitung („Das bin ich“). Sie bekommt dann nie die Täterrolle. |

**Abweichungen von der Spezifikation:**
- **Speicherschlüssel** bleiben je Fall mit festem Präfix (`fall.json → store`: `kd_eich_`, `kd_silb_`) statt `kd:<fall>:*`. Gespeicherte Abende und Rollenblätter brauchen dadurch keine Übernahme.
- **Neue Felder in `fall.json`:**

  | Feld | Bedeutung |
  |---|---|
  | `store` | Präfix der Speicherschlüssel |
  | `codeV1` | alte 6-Zeichen-Codes zulassen |
  | `cards.*.extraHint` | Hinweistext für die Spielleitung zum Zusatzwort |
  | `house.head` | Kopfzeile des Orientierungsblatts |
  | `house.title` | Überschrift des Orientierungsblatts |
  | `steps[].accusation` | in diesem Schritt werden die Anklagen gesammelt |
  | `live.slug`, `live.legacySlug` | Live-Kennung und alte Kennung als Rückfall |
  | `assets/emblem.svg` | optionales Zeichen auf der Startseite |

**Tests:**

| Test | Prüfungen |
|---|---|
| `eichenfels/tests/krimidinner.test.js` | 70, darunter v1-Code, 200 v2-Codes hin und zurück, Tippfehler |
| `eichenfels/tests/live.test.js` | 16, gegen die echte Datenbank |
| `silberkamm/tests/silberkamm.test.js` | 51 |

Der Silberkamm-Test prüft unter anderem: 8 Rollen, 4 Runden und Finale, `present`- und `missing`-Karte, Wagenplan statt Grundriss, Codes eines anderen Falls, 300 Verteilungen ohne Täterrolle für die Spielleitung, Live mit Sitzungsstand `fall`.

**Abnahme aus Abschnitt 12:** Fall 02 läuft, ohne dass `engine/` einen fallspezifischen Begriff enthält. Geprüft per Suche nach Fallnamen, Rollennummern und Losungswörtern in `engine/`.
