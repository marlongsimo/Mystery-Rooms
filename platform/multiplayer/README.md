# Multiplayer für Mystery Rooms

Gemeinsames Spielen für alle Escape Rooms der Plattform. Bis zu vier Personen spielen in einer privaten Sitzung. Jede Person bewegt sich frei durch die Räume. Rucksack, Akte, gelöste Rätsel und der Fortschritt gehören dem ganzen Team. Einen Chat gibt es bewusst nicht.

Die Website bleibt rein statisch (GitHub Pages) und braucht keinen eigenen Server. Supabase übernimmt Anmeldung, Sitzungen und den gemeinsamen Spielstand.

## Aufbau

| Schicht | Datei | Aufgabe |
|---|---|---|
| Plattform | `platform/multiplayer/mp-config.js` | Supabase-Adresse und **Publishable Key** (für alle Spiele gleich) |
| Multiplayer-Kern | `platform/multiplayer/mp-core.js` | Anonyme Anmeldung, Sitzung erstellen/beitreten/starten/verlassen, Wiederherstellen nach dem Neuladen, Echtzeit + Abgleich, gemeinsamer Zustand mit Konfliktbehandlung. Kennt kein Rätsel, nur den `gameSlug`. |
| Lobby | `platform/multiplayer/mp-lobby.js`, `mp-lobby.css` | Lobby-Oberfläche: Name, Sitzung erstellen, Code anzeigen und kopieren, mit Code beitreten, Spielerliste, Start nur durch den Host, Verlassen. Texte und Farben sind je Spiel einstellbar. |
| Bibliothek | `platform/multiplayer/vendor/supabase-js-2.45.4.js` | Supabase JS in fester Version, lokal eingebunden (kein CDN, Lizenz MIT liegt daneben) |
| Spiel-Engine | z. B. `hotel-nocturne/js/engine.js` | Stellt `exportShared()`, `applyShared()`, `normalizeShared()`, `position()` bereit und meldet Änderungen |
| Spiel-Anbindung | z. B. `hotel-nocturne/js/mp-adapter.js` | Verbindet Engine, Kern und Lobby; Team-Anzeige, kurze Meldungen |
| Rauminhalte | z. B. `hotel-nocturne/js/rooms/*.js` | unverändert – Räume wissen nichts vom Multiplayer |

Fehlen die Plattform-Skripte oder ist kein Netz da, läuft jedes Spiel ganz normal allein weiter.

## Sicherheit

- Im Browser steht **ausschließlich der Publishable Key**. `mp-core.js` verweigert den Start, wenn versehentlich ein Secret- oder Service-Role-Key eingetragen wird.
- Was jemand lesen und ändern darf, entscheiden die RLS-Richtlinien und Funktionen in Supabase. Der Code umgeht sie nicht und legt keine Tabellen oder Funktionen an.
- Getestet: Wer nicht in einer Sitzung ist, liest dort nichts (leere Liste) und kann nichts schreiben („Du bist kein Teilnehmer dieser Sitzung.“). Nur der Host kann starten.

## Verwendete Datenbank (vorhanden, nicht verändert)

| Funktion | Parameter |
|---|---|
| `create_game_session` | `p_game_slug`, `p_player_name`, `p_max_players` |
| `join_game_session` | `p_room_code` (mit oder ohne Bindestrich), `p_player_name` |
| `start_game_session` | `p_session_id` (nur Host) |
| `leave_game_session` | `p_session_id` (verlässt der Host, wird die Sitzung geschlossen) |
| `set_session_state` | `p_session_id`, `p_state_key`, `p_state` → neue Revision |

Gelesen werden die Tabellen `game_sessions`, `session_players` und `session_state` (Echtzeit über `postgres_changes`, dazu alle 4 Sekunden ein Abgleich als Sicherheitsnetz).

## Gemeinsamer Zustand und Konflikte

`set_session_state` ersetzt den ganzen Eintrag und prüft keine Version. Damit nichts verloren geht:

1. Jedes Gerät liest den aktuellen Stand, **vereinigt** ihn mit seinem eigenen und schreibt das Ergebnis. Listen, Wahrheitswerte und Zahlen können dabei nur wachsen. Deshalb ist die Reihenfolge der Schreibzugriffe egal.
2. Kurz nach dem Schreiben liest das Gerät nach. Fehlt etwas, weil ein anderes Gerät im selben Moment geschrieben hat, schreibt es erneut.
3. Bei jedem empfangenen Stand prüft jedes Gerät, ob sein eigener Fortschritt enthalten ist. Wenn nicht, schickt es ihn noch einmal.
4. Was wieder verschwinden muss (verbrauchte Gegenstände, zurückgenommene Zustände), steht in einer eigenen Liste `gone`. Ein veralteter Stand kann es so nicht zurückbringen.

Lösen zwei Personen dasselbe Rätsel gleichzeitig, zählt es einmal. Wer das Schloss gerade offen hat, sieht „Jemand aus deinem Team hat das gerade gelöst.“

Eigene Position (Raum, Blickrichtung) schreibt jedes Gerät unter `pos:<Nutzer-ID>`. Diesen Eintrag ändert nur das Gerät selbst.

## Einen weiteren Escape Room anschließen

**1. Spiel in Supabase eintragen** (einmalig, im Supabase-Dashboard, nicht im Frontend): ein Eintrag in `game_catalog` mit `slug` (z. B. `der-letzte-fall`), Titel, Code-Präfix (z. B. `FALL`) und `enabled = true`. Ohne diesen Eintrag lehnt `create_game_session` das Spiel ab.

**2. Dateien einbinden** – im `<head>`:

```html
<link rel="stylesheet" href="../platform/multiplayer/mp-lobby.css?v=1">
```

am Ende von `<body>`, **nach** der eigenen Engine:

```html
<script src="../platform/multiplayer/vendor/supabase-js-2.45.4.js"></script>
<script src="../platform/multiplayer/mp-config.js?v=1"></script>
<script src="../platform/multiplayer/mp-core.js?v=1"></script>
<script src="../platform/multiplayer/mp-lobby.js?v=1"></script>
<script src="js/mp-adapter.js?v=1"></script>
```

**3. Platz für die Lobby** auf dem Titelbildschirm:

```html
<section class="mp-root" id="mpEntry" aria-label="Gemeinsam spielen"></section>
```

**4. Engine-Schnittstelle bereitstellen.** Die Engine muss ihren Spielstand in zwei Teile trennen: was das Team teilt und was jede Person für sich hat. Gebraucht werden:

| Funktion | Zweck |
|---|---|
| `exportShared()` | gemeinsamer Teil des Spielstands als JSON (nur Listen, Wahrheitswerte, Zahlen) |
| `applyShared(state)` | Server-Stand übernehmen und neu zeichnen, Rückgabe: Liste neuer Dinge für eine Meldung |
| `normalizeShared(state)` | optional: Verbrauchtes herausfiltern |
| `position()` | optional: `{ room, roomName, view }` |
| Änderungs-Meldung | nach jedem Speichern `hooks.changed()` aufrufen |
| eigener Speicherplatz | im Multiplayer einen eigenen `localStorage`-Schlüssel je Sitzung verwenden, damit der Einzelspieler-Stand unberührt bleibt |

Vorlage: der Abschnitt „Multiplayer-Schnittstelle“ in `hotel-nocturne/js/engine.js`.

**5. Anbindung schreiben** (`js/mp-adapter.js`). Kopiere die Anbindung von Hotel Nocturne und passe an:

```js
const client = MRMultiplayer.connect({ gameSlug: "der-letzte-fall", maxPlayers: 4 });
const lobby = MRLobby.mount({
  client, root: document.getElementById("mpEntry"),
  texts: { title: "Gemeinsam ermitteln", start: "Ermittlung beginnen", enter: "Zurück zum Fall" },
  onEnter(session) { /* Engine auf Sitzungs-Spielstand umstellen, sync starten, Spiel beginnen */ },
  onLeft() { /* sync stoppen, zurück zum Einzelspieler */ },
});
const link = MRMultiplayer.sync(client, { exportShared, applyShared, normalize, position, onTeam });
```

**Optional: Vorbereitung vor dem Start.** Mit `prepare: { label, run(done) }` bekommt die Lobby einen Knopf (z. B. „Fallakte lesen“). Nach `done()` gilt man als bereit (`client.setReady()`, eigener Eintrag `ready:<Nutzer-ID>` über `set_session_state`). Die Spielerliste zeigt „BEREIT“ / „LIEST …“, der Host-Knopf „2 von 3 bereit“ – starten kann der Host trotzdem jederzeit.

**6. Aussehen anpassen** über CSS-Variablen auf `.mp-root`: `--mp-accent`, `--mp-accent-2`, `--mp-text`, `--mp-text-2`, `--mp-muted`, `--mp-line`, `--mp-panel`, `--mp-field`, `--mp-ok`, `--mp-error`, `--mp-serif`, `--mp-mono`, `--mp-sans`.

**7. Testen:** Sitzung erstellen, in einem zweiten Browserprofil beitreten, starten, etwas aufnehmen, ein Rätsel lösen, neu laden, verlassen. Wichtig: auch einmal ohne Sitzung spielen, um den Einzelspieler zu prüfen.

## Testprotokoll (31.10.2026, Chromium über Playwright, echte Supabase-Datenbank)

Getestet mit getrennten Browserprofilen (jedes Profil = eigener anonymer Nutzer), der Gast in Smartphone-Ansicht (390 × 844, Touch).

| # | Szenario | Ergebnis |
|---|---|---|
| 1 | Einzelspieler startet Hotel Nocturne | ✓ ohne Multiplayer-Einträge im Speicher |
| 2 | Host erstellt eine Sitzung | ✓ Code im Format `NOCT-XXXXXX` |
| 3 | Zweiter Spieler tritt mit Code bei | ✓ auch klein geschrieben und ohne Bindestrich |
| 4 | Beide werden in beiden Lobbys angezeigt | ✓ (Host/Gast, „du“) |
| 5 | Host startet | ✓ Gäste starten automatisch mit; Gäste haben keinen Start-Knopf |
| 6 | Unabhängig bewegen | ✓ verschiedene Blickrichtungen, Team-Anzeige zeigt Raum und Richtung der anderen |
| 7 | Gegenstand einsammeln | ✓ (gleichzeitig mit 9) |
| 8 | Gegenstand erscheint beim anderen | ✓ |
| 9 | Rätsel lösen | ✓ |
| 10 | Gelöster Zustand bei allen | ✓ Gegenstände, Akte, Nachricht, Schloss als gelöst, Mechanismus (Abdeckung) offen |
| 11 | Seite neu laden | ✓ laufende Sitzung wird erkannt |
| 12 | Gemeinsamer Spielstand wiederhergestellt | ✓ Rucksack, Akte, eigene Blickrichtung; danach kommen neue Fortschritte weiter an |
| 13 | Spieler verlässt die Sitzung | ✓ zurück im Einzelspieler, Host sieht es |
| – | Host verlässt | ✓ Sitzung geschlossen, Gäste werden informiert und landen im Einzelspieler |
| – | Falscher Code | ✓ „Dieser Einladungscode ist unbekannt.“ |
| – | Fünfter Spieler | ✓ „Diese Sitzung ist bereits voll.“ |
| – | Beitritt nach Spielstart | ✓ abgewiesen |
| – | Fremder Nutzer liest/schreibt/startet | ✓ blockiert |
| – | Secret-Key bzw. Service-Role-JWT eingetragen | ✓ Start verweigert |
| – | Spiel ohne Eintrag in `game_catalog` | ✓ „Dieser Escape Room ist nicht verfügbar.“ |
| – | 3 Geräte schreiben gleichzeitig je 6 Einträge | ✓ 18/18 erhalten (dreimal wiederholt) |
| – | 3 Geräte im Spiel, gleichzeitig je 5 neue Dokumente | ✓ alle Geräte und Server 15/15 nach etwa 3 Sekunden |
| – | Verbrauchter Gegenstand kommt durch veralteten Stand nicht zurück | ✓ (Logiktest) |
| – | Bestehende Einzelspieler-Raumtests (Räume 1–5, Migration) | ✓ ohne Fehler |
| – | Echtzeit | ✓ Änderungen kommen nach etwa 1 Sekunde an |

Die Browser-Konsole zeigt bei abgewiesenen Beitritten (falscher Code, volle oder gestartete Sitzung) die 400-Antwort des Servers. Das ist erwartet und kein Programmfehler.

**Nicht getestet:**

- Die Live-Seite auf GitHub Pages. Die Bereitstellung lief erfolgreich durch, aber aus der Testumgebung ist `github.io` nicht erreichbar. Getestet wurde derselbe Code über einen lokalen Webserver gegen die echte Datenbank.
- Echte Geräte: iPhone/Safari und Android. Getestet wurde nur Chromium mit Smartphone-Ansicht. Insbesondere ist offen, ob die Musik auf iOS startet, wenn Gäste automatisch ins Spiel geholt werden.
- Verbindungsabbruch mitten im Spiel und Wiederkehr nach längerer Zeit offline.
- Sitzungen über mehr als eine Stunde (automatische Erneuerung des Anmelde-Tokens).
- Räume 2–7 im Multiplayer durchgespielt. Getestet wurde die Rezeption; die übrigen Räume nutzen dieselben Mechanismen.
- Verzögerte Aktionen (`later`) über mehrere Geräte. Sie laufen auf dem auslösenden Gerät, das Ergebnis wird geteilt.
- Zwei Personen lösen exakt dasselbe Rätsel im selben Moment. Das ist abgedeckt durch die Vereinigung, aber nicht gezielt getestet.
