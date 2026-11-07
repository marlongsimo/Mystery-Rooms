# SEKTOR 9 – Das letzte Protokoll

Kooperativer Mystery-Escape-Room in 3D im Browser. Geschichte, Figuren, Rätselketten und Enden: [`DREHBUCH.md`](DREHBUCH.md).

**Stand:** vollständig spielbar – alle fünf Abschnitte (Verteilerhalle, Kommando A, Personal B, Forschung C, Sicherheit D, Sektor 9) mit drei Enden. Allein oder gemeinsam mit bis zu vier Personen.

| Abschnitt | Halle | Kern |
|---|---|---|
| 1 | Verteilerhalle, Kommando A | Handrad, Gitter 4625, Notstrom, Band 1, Kassette 2338 (Funkzeit ≠ Lagetafel) |
| 2 | Personal B | Bürotür 1730, Käfig, Spind 0311, Wartungsgang A–B, Bänder 2–3 (die sieben Minuten, Albers’ Abbruch) |
| 3 | Forschung C | ECHO-Uhr (Ortszeit + 7 Min.), Versuchsplan, Beobachtungsraum, Band 4, Schleuse, **K1**: Terminal „3 2251“ |
| 4 | Sicherheit D | Schaltbuch, Band 5, Glastür 2305, Prozessliste (Hilfe = ECHO), Band 6 (Quelle des Funksignals), **K3**: Hebel + Leitstand-Schalter innerhalb von 90 s · freiwillig: **Befehlsarchiv** (Eintrag 22:58 in zwei Fassungen, Code 2251), **Steckfeld** (vier Kamerastecker → ECHO blind) |
| 5 | Sektor 9 | Ostrowskis letzte Aufzeichnung, Entscheidung: **A** Abschalten (K3) · **B** Senden (K3 + alle sechs Bänder) · **C** Fortsetzen – im Team als **Abstimmung** (gilt erst, wenn alle dasselbe wählen) – danach ECHOs Auswertung |

**ECHO lenkt (Drehbuch, Abschnitt 5):** Ab Sektor D empfiehlt die „Wartungsassistenz“ im ECHO-Terminal offen FORTSETZEN (T2, die Hinweise bleiben richtig). Das Befehlsarchiv zeigt nicht jedem dieselbe Fassung (T3: im Team je nach Platz, allein wechselt sie beim erneuten Hinsehen). ECHO kommentiert echte Handlungen: kurzes Verweilen, Hinweise, geteilte Funde, Stimmen (T4) – bis das Steckfeld gezogen ist. Beim ersten Betreten von Sektor D läuft ein falscher Countdown „Druckabfall in 10:00“ (T5): Er läuft mit der Spielzeit, bei null passiert nichts, ECHO zählt nur, wie oft ihr den Standpunkt gewechselt habt; „ausblenden“ schaltet ihn ab. Die Auswertung nennt Abstimmungsrunden, wer zuerst FORTSETZEN gewählt hat, wie oft Zögern notiert wurde und ob die Beobachtung abgeschaltet war (T6).

## Aufbau

| Datei | Aufgabe |
|---|---|
| `index.html` | Titel, Spieloberfläche (Szene, Ausrüstung, Karte, Archiv, ECHO), Fenster |
| `js/data.js` | **Inhalte**: Hallen → Standpunkte → Blickrichtungen, Hotspots, Rätsel mit drei Hinweisstufen, Dokumente, Gegenstände |
| `js/engine.js` | **Einzige Wahrheit** über den Spielstand: Hotspots, Rätselprüfung (`tryLock`), Bewegung, Archiv, Karte, ECHO-Meldungen, Speichern |
| `js/3d/core.js` | 3D-Kern aus Hotel Nocturne, erweitert um **Standpunkte** (mehrere Augenpunkte je Halle, Kamera gleitet) und Helmlampen für Mitspieler |
| `js/3d/s9kit.js` | Bunker-Baukasten: Beton, Stahl, Panzertür mit Handrad, Standpunkt-Markierung, Röhrenbildschirm, Lampen |
| `js/3d/verteiler.js`, `js/3d/kommando.js` | die Hallen |
| `js/3d/interact.js`, `gfx.js`, `hd.js`, `kit.js`, `js/audio.js` | aus Hotel Nocturne übernommen (eigener Namensraum `SEKTOR9`), Hotel Nocturne bleibt unverändert |

**Grundregel wie in Hotel Nocturne:** Die 3D-Schicht zeichnet nur und ruft `engine.hotspot(id)` oder `engine.tryLock(rätsel, wert)` auf. Lösungen, Fehlertexte und Folgen stehen in `data.js`. Jedes direkt bedienbare Objekt lässt sich auch über „Klassisch lösen“ im Fenster lösen.

## Testen

```
python3 -m http.server 8765 &      # im Repository-Wurzelordner
node sektor-9/tests/abschnitt1.test.js        # Abschnitt 1 in 3D, SHOTS=1 für Bildschirmfotos
node sektor-9/tests/abschnitt2.test.js        # Abschnitt 2 (Spielstand nach Abschnitt 1)
node sektor-9/tests/abschnitt3.test.js        # Abschnitt 3 (Spielstand nach Abschnitt 2)
node sektor-9/tests/abschnitt4.test.js        # Abschnitte 4–5 bis Ende B
node sektor-9/tests/enden.test.js             # Bedingungen der Enden, Ende A und C
node sektor-9/tests/nebenraetsel.test.js      # Befehlsarchiv, Steckfeld, ECHOs Empfehlung und Kommentare
node sektor-9/tests/countdown.test.js         # falscher Countdown in Sektor D
node sektor-9/tests/mehrspieler.test.js       # zu zweit gegen die echte Datenbank
node sektor-9/tests/mehrspieler-k3.test.js    # Nowaks Abschaltung zu zweit (echte Datenbank)
node sektor-9/tests/mehrspieler-abstimmung.test.js  # Abstimmung im Rechenkern zu zweit (echte Datenbank)
```

## Gemeinsam spielen

Anbindung `js/mp-adapter.js` an `platform/multiplayer` (nur vorhandene Funktionen, nur Publishable Key, keine eigenen Tabellen):

| Eintrag (`set_session_state`) | Inhalt |
|---|---|
| `shared` | gelöste Rätsel, Zustände, Ausrüstungs-Vorrat, verbrauchte Gegenstände (`gone`), Team-Archiv |
| `pos:<Nutzer-ID>` | Halle, Standpunkt, Blickrichtung – Teamliste, Punkte auf der Karte, Helmlampe in derselben Halle · eigene Stimme im Rechenkern (`vote`, `vr` = Runde) |
| `chat` | Funk im Team, Nachrichten werden vereinigt |

Pro Person bleiben Standpunkt, Hinweise, ECHO-Protokoll und **eigene Funde**. Ein Fund geht erst mit „Mit dem Team teilen“ ins Team-Archiv.

`game_catalog` enthält `sektor-9` (Codes `ECHO-XXXXXX`). Getestet am 07.11.2026 mit zwei Browserprofilen über die echte Datenbank: 24 von 24 Prüfungen (Lobby, Bereitschaft, Start, gemeinsamer Stand, Meldung, Positionen, Team-Archiv, Funk in beide Richtungen, Neuladen, Verlassen, Einzelspieler-Stand unberührt).
Test: `node sektor-9/tests/mehrspieler.test.js` (zwei Browserprofile gegen die echte Datenbank).
