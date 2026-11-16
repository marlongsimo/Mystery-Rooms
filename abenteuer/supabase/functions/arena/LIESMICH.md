# Edge Function „arena“ – der Server rechnet den Arena-Kampf

`index.ts` in diesem Ordner ist eine **gebaute Datei**. Sie enthält die Heldendaten, die Kampfregeln, die Arena-Karten
und den Serverteil in einem Stück. Nicht von Hand ändern, sondern neu bauen:

```
node abenteuer/tools/arena-funktion-bauen.js
```

## Einrichten (einmalig)

1. **Datenbank:** im Supabase SQL Editor nacheinander ausführen (falls noch nicht geschehen)
   `014_rpg_arena_team_suche.sql` und danach `015_rpg_arena_serverkampf.sql`.
2. **Function anlegen:** Supabase-Dashboard → **Edge Functions** → **Deploy a new function** → **Via Editor**.
   - Name: `arena` (genau so, klein geschrieben)
   - Den gesamten Inhalt von `index.ts` in den Editor einfügen (die Vorlage vorher löschen) → **Deploy**.
   - „Verify JWT“ eingeschaltet lassen (Standard).
3. **Schlüssel:** Die Function braucht die Adresse des Projekts und den Service-Schlüssel. Üblicherweise stellt
   Supabase beide jeder Function selbst bereit (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`); dann ist nichts zu tun.
   Meldet das Spiel beim ersten Kampf „Der Server für den Arena-Kampf ist nicht fertig eingerichtet“, fehlen sie:
   Dashboard → Edge Functions → **Secrets** → `ARENA_URL` (die Projekt-URL) und `ARENA_SERVICE_KEY`
   (der Service-Role- bzw. Secret-Schlüssel aus Project Settings → API) anlegen und die Function neu ausrollen.
   Der Service-Schlüssel bleibt auf dem Server; im Spiel steht weiterhin nur der öffentliche Schlüssel.

Die Menünamen im Dashboard können sich ändern; maßgeblich ist: eine Edge Function namens `arena` mit dem Inhalt von `index.ts`.

Wer lieber die Supabase-Kommandozeile benutzt: `supabase functions deploy arena --workdir abenteuer`.

## Ausprobieren

`https://case-unlocked.de/abenteuer/?arena=server` auf zwei Geräten mit zwei Konten öffnen, Team festlegen, beide suchen.
Ohne diesen Link (oder mit `?arena=liste`) bleibt alles bei der bisherigen Arena.

## Wichtig bei Änderungen an den Regeln

Der Server rechnet mit den Regeln, die beim Bauen in `index.ts` kopiert wurden. Nach jeder Änderung an
`js/regeln.js` oder `js/figuren.js` (neue Fähigkeit, andere Werte) gilt: **neu bauen und die Function neu ausrollen**
(Dashboard → Edge Functions → arena → Code ersetzen → Deploy). Sonst zeigt das Spiel andere Möglichkeiten an,
als der Server zulässt. Der Stand der Regeln steht in der vierten Zeile von `index.ts`.

## Was die Function tut

- Prüft über den Anmeldedienst, wer anfragt, und ob dieses Konto an dem Kampf teilnimmt.
- Lädt den Stand (`rpg_arena_srv_load`), rechnet den Zug mit denselben Regeln wie das Spiel und speichert
  (`rpg_arena_srv_save`). Rechnen zwei Aufrufe gleichzeitig, gewinnt der erste; der zweite lädt neu.
- Lässt Monster sofort nachziehen und hält jeden Schritt als Sicht beider Seiten fest.
- Beendet nach einer Minute Zugzeit den Zug eines Helden, sobald eine Seite darauf hinweist. Lässt ein Team dreimal
  hintereinander die Zeit verstreichen, hat es aufgegeben.
- Trägt am Ende das Ergebnis ein (`rpg_arena_srv_end`); die Belohnungen bucht die vorhandene Funktion `rpg_arena_belohnen`.

Tests: `node abenteuer/tests/arena-kern.test.js`, `node abenteuer/tests/arena-funktion.test.js`,
`node abenteuer/tests/arena-server.test.js` (dieser braucht den Webserver auf Port 8765).

## Rechner-Gegner (Migration 019)

Findet die Suche etwa 30 Sekunden lang keinen Menschen, stellt die Datenbank einen Gegner ohne Konto (zufälliger Name, drei
Helden auf den Stufen des Spielers). Seine Züge rechnet diese Function (`server/arena-bot.js`): Schritt für Schritt, mit
Bedenkzeit, ohne Kenntnis der kommenden Würfel und des verdeckten Anführers. Das Spiel fragt nach, sobald ein Schritt fällig
ist (`arena.takt` in der Sicht).

**Reihenfolge beim Einspielen: erst diese Function neu ausrollen, dann Migration 019 ausführen.** Mit der Migration, aber einer
alten Function, würde der Gegner nie ziehen und nach drei verstrichenen Zugzeiten als „aufgegeben“ gewertet.

Tests: `node abenteuer/tests/arena-bot.test.js` (Logik, viele Kämpfe), `node abenteuer/tests/arena-bot-browser.test.js` (im Browser).
