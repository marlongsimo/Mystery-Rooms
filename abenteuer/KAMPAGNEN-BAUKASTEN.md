# MYTHARA – Kampagnen-Baukasten

So entsteht eine neue Kampagne schnell und ohne vergessene Stellen. Grundlage sind die vier fertigen Abenteuer (Moor, Grauwacht, Hochwacht, Krone). Was der Spielkern schon kann, steht in Teil C. Neue Mechanik ist der teuerste Teil einer Kampagne und sollte die Ausnahme bleiben.

---

## Teil A – Ablauf

| Schritt | Was | Werkzeug |
|---|---|---|
| 1 | Idee in der **Konzeptvorlage** (Teil B) festhalten: Akte, Szenenliste, Kämpfe, Enden. **Die Bild-Prompts entstehen gleich mit** und gehen sofort raus, damit die Bilder parallel gemalt werden | – |
| 2 | Datei `daten/<id>.js` anlegen (Vorbild: `daten/hochwacht.js` für kurz, `daten/krone.js` für verzweigt), `META.entwurf: true` setzen | – |
| 3 | In `index.html` die Datei einbinden (neben den anderen `daten/*.js`) | – |
| 4 | **Prüfen**, nach jeder größeren Änderung | `node abenteuer/tools/kampagne.js pruefen <id>` |
| 5 | **Durchspielen** lassen: Fehler, nie erreichte Szenen, fehlende Enden | `node abenteuer/tools/kampagne.js durchlauf <id> 200` |
| 6 | **Gegnerzahl festlegen**, dann **Kämpfe messen**, Zielquoten in `META.zielquoten` | `node abenteuer/tools/kampagne.js aufbau <id>` und `… kaempfe <id> [--helden]` |
| 7 | **Kalibrieren** (schreibt den Lebensfaktor je Gruppengröße in `js/regeln.js`). Warnungen (⚠) beachten: Faktor am Anschlag heißt „mehr oder weniger Gegner einplanen“, über 12 Runden heißt „der Kampf zieht sich“ | `… kaempfe <id> --kalibrieren` und `… --kalibrieren --hardcore` |
| 8 | Spielen im Browser mit `index.html?entwurf` (Entwürfe sind nur so im Hub sichtbar) | – |
| 9 | **Karten vom Bild bauen (Bilder zuerst):** Die Kampfkarten entstehen erst, wenn die Bilder da sind. Hindernisse vorschlagen lassen, am Kontrollbild korrigieren, Startplätze setzen. So wird nur einmal kalibriert. Solange Bilder fehlen, reichen einfache gezeichnete Karten zum Probespielen | `node abenteuer/tools/karten.js --bild=pfad.png --vorschlag` und `node abenteuer/tools/karten.js <id>` |
| 10 | **Freigeben** in einem Schritt: entfernt `META.entwurf`, erzeugt `js/enden.js`, ergänzt Migration 006 und den Datenbanktest, gibt die SQL-Zeile für Supabase aus | `node abenteuer/tools/kampagne.js freigeben <id>` |
| 11 | Alles testen, in einem Befehl: prüfen, Durchlauf, Kämpfe (Normal und Hardcore), Karten, Browser | `node abenteuer/tools/kampagne.js alles <id> [--kalibrieren]` |

**Eine Quelle für die Enden:** Reguläre Enden sind Szenen mit `art: "ende"`, die nicht `D.NIEDERLAGE` sind und nicht `niederlage: true` tragen. `tools/kampagne.js enden` erzeugt daraus `js/enden.js` (Endenamen, Kampagnentitel für die Heldensammlung) und die SQL-Zeilen für `rpg_adventure_endings`. Der allgemeine Test schlägt fehl, wenn eins davon fehlt. So kann keine Kampagne ohne Belohnung live gehen.

**Der allgemeine Test** (`tests/kampagnen.test.js`) prüft jede Datei in `daten/` automatisch: statische Prüfung, 200 Durchläufe mit festen Zufallszahlen, alle Szenen und Enden erreicht, Enden in `js/enden.js` und in Migration 006. Für eine neue Kampagne braucht es keinen neuen Testcode.

**Der allgemeine Browsertest** (`tests/kampagnen-browser.test.js`) spielt jedes Abenteuer von der Startseite bis zu einem Ende durch (Hub, Regeln, Heldenwahl, Einleitung, alle Szenenarten, Kämpfe mit der Automatik) und prüft die Reihenfolge im Hub. Auch Entwürfe sind dabei. Mit `SHOTS=<Ordner>` entstehen nebenbei Screenshots von Hub, Szene, Kampf und Ende.

**Die Karten-Kontrolle** (`tools/karten.js`) legt Raster, Hindernisse und Startplätze über jede Kampfkarte und meldet Startplätze auf Hindernissen, doppelte Plätze und abgeschnittene Bereiche.

**Der Hindernis-Vorschlag** (`karten.js --bild=… --vorschlag`) lernt aus allen schon ausgerichteten Karten und schlägt für ein neues Bild die Hindernisse vor. Güte (gemessen mit `karten.js --guete`, jede Karte ohne sich selbst vorhergesagt): rund 80 % der Felder richtig als begehbar oder versperrt, bei „immer versperrt raten“ wären es 58 %. Wasser und große Flächen erkennt er gut, einzelne Kisten, Säulen und Ränder oft nicht. Er ist ein erster Entwurf, kein Ersatz für die Kontrolle am Bild.

**Der Aufbau-Vorschlag** (`kampagne.js aufbau <id>`) probiert je Kampf mehrere Gegnerzahlen durch und zeigt, bei welcher der Kampf 5–9 Runden dauert und der Lebensfaktor im gesunden Bereich bleibt. Das spart die zweite Kalibrierrunde.

---

## Teil B – Konzeptvorlage (zum Kopieren)

```markdown
# <Titel>
- id: <kurz, klein, z. B. „sumpf“> · Schwierigkeit: <1–5> · Helden: <min–max> · Stufen: <1–3> · Dauer: <z. B. 60 Minuten>
- Format: Kurzabenteuer (1 Abschnitt) / Kampagne (2–3 Abschnitte)
- Uhr: <Name, z. B. „Flut“>, was sie steigen lässt, was sie bewirkt
- Ehrentitel (alle Enden gefunden): „<…>“
- Neue Mechanik (höchstens eine): <keine / welche, warum>

## Vorgeschichte (Einleitung, 2–3 Seiten)
## Abschnitte
### Abschnitt 1 · <Name>
| Szene (id) | Art | Kurz | Weiter nach |
|---|---|---|---|
| prolog | erzaehlung | … | ankunft |
| ankunft | gespraech | Fragen an …, Klassenweg Schurke … | wahl_weg |
| wahl_weg | wahl | A: … / B: … | kampf_x / probe_y |

## Kämpfe
| Szene | Begegnung (neu/alt) | Karte | Gegner | Baustein (Teil C) | Zielquote |
|---|---|---|---|---|---|

## Merker (was sich die Geschichte merkt)
## Enden
| id | Titel | Bedingung |
## Bilder (Prompts im Stil der bisherigen Kampagnen)
Titelbild, Vorschau, je Abschnitt ein Bild, je Kampfkarte ein Bild, neue Gegner.
```

---

## Teil C – Was der Spielkern schon kann

### Szenenarten (`js/szenen.js`)
| Art | Wofür | Wichtige Felder |
|---|---|---|
| `erzaehlung` | Text, dann weiter | `text`, `weiter`, `rastErlaubt` |
| `gespraech` | Fragen stellen, dann eine Option führt weiter | `optionen[{id, text, frage, antwort, wer, wenn, setzt, probe, weiter}]` |
| `wahl` | Abstimmung der Gruppe (Mehrheit, Gleichstand würfelt) | `optionen`, `weiter` je Option |
| `geheim` | Jede Person entscheidet für sich am Handy | `frage`, `antworten`, `abschluss`, pro Figur möglich |
| `probe` | Würfelprobe einer Figur oder der Gruppe | `probe{name, attr, sg, wer, geuebt, vorteil, erfolg, knapp, fehl}` |
| `raetsel` | Reihenfolge antippen, Hinweise je Figur | `glocken`, `loesung`, `hinweise`, `richtig`, `falsch`, `aufgeben` |
| `kampf` | Kampf auf einer Karte | `kampf{…}` (siehe unten) oder Funktion `(A, h) => ({…})` |
| `lager` | Lange Rast, Aufstieg, Speicherpunkt, Ersatzhelden (Hardcore) | `aufstieg` |
| `ende` | Epilog | `niederlage: true` für Niederlage-Enden |

**Werkzeuge in Szenen:** Merker (`setzt`, `wenn`, `h.m(A, "…")`), Klassenwege (`wer`, `h.klasse(A, "schurke")`), die Uhr des Abenteuers (`glocke: 1`), Zufallsereignisse (`EREIGNISSE` + `h.ereignis(A, punkt, danach)`), Beute (`beute: true`), Heilen (`heilen: 0.5`), Heiltränke (`tranke`, `trankWeg`), Gegnerwissen je Klasse (`WISSEN`), Text als Funktion für Varianten.

### Kampf-Bausteine (`js/regeln.js`, Feld `kampf` einer Szene)
| Baustein | Feld | Beispiel |
|---|---|---|
| Begegnung und Karte | `begegnung`, `karte` | alle Kampagnen |
| Stärke je Gruppengröße | `skala` je Begegnung (kalibriert), `skalaMal` je Szene | alle |
| Überraschung, Läufer, Anführer, gemischte Startplätze | `ueberraschung`, `laeufer`, `anfuehrer`, `mischen` | Grauwacht |
| Begleitung/Eskorte (Figur schützen, ans Ziel bringen) | `begleiter{name, tp, start, route}` | Hochwacht (Sera) |
| Ziele auf der Karte (aktivieren, halten, umkehren) | `mechanik.ziele` | Krone (Horn, Siegelsteine, Tafeln) |
| Siegbedingung statt „alle besiegt“ | `mechanik.sieg{ziele, besiegt, text}` | Krone |
| Verstärkungswellen aus Quellen | `mechanik.wellen` | Krone (Kammern, Kronensaal) |
| Gelände, das sich ausbreitet (Eis) | `mechanik.eis` | Krone (Stollen, Brücke) |
| Ausgang erreichen | `mechanik.ausgang` | Krone (Brücke) |
| Schutzschild, gebunden an Ziele | `mechanik.schild` | Krone (Pilger) |
| Erst Ziele, dann Kampf | `mechanik.zieleZuerst` | Krone (Kammern) |
| Angekündigte Angriffe (Telegraph), Phasen, Rückstoß | Gegnerfähigkeiten in `js/regeln.js` | Krone (Bosse) |
| Feste Gegner statt Begegnung (Duelle, Bosse) | `gegner`, `figuren`, `boss` | Grauwacht |

Neue Gegner kommen in `R.GEGNER`, neue Begegnungen in `R.BEGEGNUNGEN` (Stufe, Gegnerliste, `skala`, `skalaHC`).

---

## Teil D – Regeln für schnelleres Bauen

1. **Höchstens eine neue Mechanik pro Kampagne.** Alles andere aus Teil C kombinieren.
2. **Kurzabenteuer als Standardformat** zwischen großen Kampagnen: 1 Abschnitt, 45–60 Minuten, 3–4 Kämpfe, 2 Enden, 1 Lager. Bringt neue Enden für die Heldensammlung bei etwa einem Drittel des Aufwands.
3. **Bilder parallel:** Prompts entstehen mit dem Konzept (Teil B); gebaut wird mit Platzhaltern. Gegnerbilder wiederverwenden, wo es passt.
4. **Prüfen früh und oft:** `pruefen` nach jeder Szenengruppe, `durchlauf` nach jedem Abschnitt, `kaempfe` erst, wenn ein Abschnitt steht.
5. **Kalibrierung zuletzt:** erst wenn Karten und Gegner feststehen, dann Normal und Hardcore.

---

## Teil E – Offene Befunde aus dem neuen Werkzeug (Stand 13. November 2026)

- **Krone wirkt leichter als geplant.** Die alte Auswertung hat die Helden für Kämpfe der Stufen 2 und 3 mit Trefferpunkten und Zauberplätzen der Stufe 1 gerechnet. Mit ausgeruhten Helden der richtigen Stufe liegen die späteren Kämpfe bei 91–99 % statt 78–88 %. Im echten Spiel kommt die Gruppe oft angeschlagen an, die Wahrheit liegt also dazwischen. Vor einer Neukalibrierung sollten echte Runden zeigen, wie schwer es sich anfühlt.
- **Totenpfad (Moor):** In einzelnen simulierten Kämpfen mit 4 Helden findet die Kampf-KI kein Ende (Simulation hängt, kein Fehler im Spiel). Bei Gelegenheit ansehen.
