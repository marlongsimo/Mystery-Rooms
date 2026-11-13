# MYTHARA – Heldenfreischaltung und wachsende Sammlung

**Status:** **Umgesetzt** zur **Open Beta** (Datenbank: `supabase/006_rpg_heldensammlung.sql`, Spiel: `js/sammlung.js`). Mythara war vom 13. November 2026 an in der Closed Beta; Konten aus dieser Zeit haben alle 15 Helden (Bestandsschutz).

**Betrieb:**
- Admin festlegen (nur SQL Editor): `insert into public.rpg_admins (user_id) select user_id from public.rpg_profiles where lower(handle) = lower('Name') on conflict do nothing;`
- Admins legen im Spiel unter Profilmenü → „Code-Übersicht“ Freischalt-Codes an: für eine bestimmte Person (1×) oder für eine beliebige Person (1–100×), 30 Tage bis 1 Jahr gültig, höchstens 20 je Tag. Codes werden nur als Hash gespeichert und einmal angezeigt.
- Im SQL Editor: `select public.rpg_create_unlock_code('Bezeichnung', 1, 90);` und `select * from public.rpg_unlock_codes_uebersicht;`
- Neue Abenteuer: ihre regulären Enden in `rpg_adventure_endings` eintragen (und in `KAMPAGNEN` in `js/sammlung.js`), sonst bringen sie keine Belohnung.
**Fortsetzung:** Zum Launch kommt das dauerhafte Heldenlevel dazu, siehe [KONZEPT-HELDENLEVEL.md](KONZEPT-HELDENLEVEL.md) und Teil C unten.
Grundlage: „MYTHARA – Konzept Heldenfreischaltung“, Konzeptstand 1.0 vom 12. November 2026. Darunter folgen Anmerkungen aus dem Abgleich mit dem Spielstand vom 12. November 2026.

---

## Teil A – Das Konzept (Zusammenfassung)

### Leitidee
Spieler starten mit drei Helden, die sie selbst aus jeweils drei zufälligen Angeboten wählen. Nach jeder erfolgreich abgeschlossenen Kampagne schalten sie einen weiteren Helden dauerhaft frei, wieder aus drei Angeboten. So wächst die persönliche Heldensammlung durch das Spielen der Geschichten.

**Kernprinzip:** Die Kampagne bleibt das eigentliche Spiel. Die Sammlung ist der langfristige Anreiz, weitere Geschichten zu erleben. Sie ersetzt weder Abenteuer noch Entscheidungen oder taktische Kämpfe.

### 1. Zielbild
- Es gibt eine dauerhafte Heldensammlung pro MYTHARA-Konto. Die 15 bestehenden Helden (5 Klassen × 3) bleiben unverändert; freigeschaltet wird nur, wen man auswählen darf.
- **Ziele:** langfristige Motivation, Wiederspielwert durch andere Klassen und Fähigkeiten, persönliche Bindung an die eigenen Helden, ein Grund mehr für neue Geschichten.
- Dauerhaft freigeschaltet wird der **Held als wählbare Figur**, nicht sein Level und nicht seine Ausrüstung.
- Die Sammlung vergrößert die Auswahl, aber nicht die Zahl aktiver Figuren im Kampf (weiter 3–6 bzw. 2–6 im Moor).
- Escape Rooms und Krimidinner bleiben vollständig außen vor; dort braucht niemand ein Konto.

### 2. Start der Sammlung: drei Auswahlrunden
- Bei der ersten Registrierung gibt es drei Runden mit je drei zufälligen, noch nicht freigeschalteten Helden. Aus jeder Runde wählt man genau einen.
- **Faire Auslosung:**
  - Innerhalb der Startrunden wird kein Held doppelt angeboten, insgesamt also 9 verschiedene.
  - Bereits freigeschaltete Helden kommen nicht wieder.
  - Die drei Angebote einer Runde stammen möglichst aus drei Klassen.
  - Nicht gewählte Helden bleiben im Pool.
  - Die Wahl ist endgültig; es gibt kein bezahltes Neuwürfeln.
- Jede Heldenkarte zeigt Spielstil, besondere Fähigkeit und Stärke außerhalb des Kampfes. Details lassen sich aufklappen.
- Die Runden kommen nacheinander mit Anzeige „1 von 3“ usw., nicht alle neun Helden auf einmal.

### 3. Neue Helden durch Kampagnenabschlüsse
- Nach einem erfolgreichen Abschluss bekommt jeder berechtigte, registrierte Spieler eine **persönliche** Dreierauswahl aus seinem eigenen verbleibenden Pool.
- **Was als Abschluss zählt:**
  - Jedes reguläre Ende zählt, auch ein moralisch ungünstiges.
  - Abbruch und ein vollständiger Gruppenverlust in Hardcore zählen nicht.
- **Wie die Belohnung vergeben wird:**
  - Höchstens eine Freischaltung pro Konto und Kampagnenversion.
  - Eine nicht eingelöste Belohnung bleibt im Hub offen und verfällt nicht.
  - Gewählt wird auf dem eigenen Handy; der Spieltisch zeigt nur, dass eine Belohnung bereitsteht.
- **Wenn kaum noch Helden übrig sind:** Bei nur noch 2 gesperrten Helden gibt es 2 Angebote, bei 1 nur diesen einen. Ist die Sammlung vollständig, gibt es stattdessen Titel, einen Chronikeintrag oder eine kosmetische Variante.

### 4. Figurenwahl, Fortschritt und Balance
- **Am Konto gespeichert:** ob ein Held freigeschaltet ist, sein Grundprofil, das Freischaltdatum, Auszeichnungen und Chronik.
- **Nur im jeweiligen Abenteuer:** Level 1–3, Trefferpunkte, Zustände, Ausrüstung, Entscheidungen und der Hardcore-Verlauf.
- **Keine dauerhafte Machtsteigerung:** keine Boni auf Werte, Trefferpunkte, Schaden oder Zauber-SG.
- **Gruppenwahl:**
  - Man wählt nur aus den eigenen freigeschalteten Helden.
  - Kein Held darf doppelt in derselben Gruppe stehen.
  - Die Gruppe entscheidet gemeinsam.
- **Hardcore:** Der Tod gilt nur im jeweiligen Abenteuer. Der Held bleibt in der Sammlung.

### 5. Oberfläche
- **„Meine Helden“ im Hub:**
  - Fortschritt wie „3 von 15“, als Zahl berechnet statt fest eingetragen.
  - Freigeschaltete Helden als volle Karten, gesperrte als Silhouette.
  - Eine offene Belohnung ist gut sichtbar, ohne Countdown.
- **Nach dem Finale:**
  - Spieltisch: Hinweis, dass eine Freischaltung bereitsteht.
  - Handy: drei Karten zur Wahl.
  - Hub: die neue Karte in „Meine Helden“, dazu ein Chronikeintrag.
  - Nächste Kampagne: Der neue Held steht zur Wahl.
- **Chronik:** in welcher Kampagne, mit welchem Ende und mit wem ein Held freigeschaltet wurde.
- **Kein Druck:** keine Login-Serien, keine Pflicht, keine verfallenden Belohnungen.

### 6. Technisches Zielbild (Vorschlag)
| Objekt | Zweck |
|---|---|
| `rpg_hero_catalog` | Kanonischer Heldenkatalog (aus `figuren.js` speisbar) |
| `rpg_hero_collection` | Freigeschaltete Helden je Konto: wann und wodurch |
| `rpg_hero_unlock_offers` | Gespeicherte Auswahlrunden (3 Angebote, Status offen/eingelöst) |
| `rpg_campaign_reward_claims` | Einmalige Verknüpfung: Konto ↔ Kampagnenabschluss ↔ Freischaltung |

**Regeln:**
- Auslosung nur auf dem Server, nie im Browser.
- Idempotent: Reloads und Wiederverbindungen erzeugen keine zweite Belohnung.
- Angebote und Auswahl werden auf dem Server gespeichert und sind auf allen Geräten gleich.
- RLS: Jeder sieht und beansprucht nur seine eigenen Angebote.
- Keine Duplikate in den Angeboten.
- Nachvollziehbar: Auslosung, Wahl, Kampagnen-ID und Zeitpunkt werden protokolliert.
- Strikt im `rpg_`-Namensraum.

**Gäste und wiederholte Kampagnen:**
- Ohne Konto gibt es keine Sammlung; eine spätere Verknüpfung mit einem Konto wird ein eigener, sicher zu planender Schritt.
- Eine Belohnung gibt es je Konto und Kampagnenversion nur einmal.

### 7. Einführung in Phasen
1. **Fundament:** Katalog, Sammlung und Anzeige im Hub; andere Spielmodi bleiben unverändert.
2. **Registrierungsstart:** drei Runden; ein neues Konto bekommt genau drei verschiedene Helden, Reloads ändern nichts.
3. **Kampagnenbelohnung:** Abschlussereignis, persönliche Dreierauswahl, offene Belohnung; höchstens eine Freischaltung pro Abschluss.
4. **Chronik und Ausbau:** Freischaltungen in der Chronik, spätere Erweiterungen ohne Änderung am Datenmodell.

**Risiken und Gegenmaßnahmen:**

| Risiko | Gegenmaßnahme |
|---|---|
| Unfaires Losglück | Klassenvielfalt und klare Kurzprofile |
| Spieler wiederholen nur die leichteste Kampagne | Belohnung einmal pro Kampagnenversion |
| Neue Helden wirken wie Upgrades | Keine Werteboni |
| Belohnung nach dem Finale verpasst | Wahl bleibt offen und verfällt nicht |
| Hardcore-Tod entwertet die Sammlung | Tod gilt nur im Abenteuer |
| Zu wenige Kampagnen | Neue Kampagnen als wichtigste Erweiterung |

**Messgrößen:**
- Anteil der neuen Konten, die alle drei Startentscheidungen treffen.
- Verteilung der freigeschalteten Helden nach Klasse und Figur.
- Anteil abgeschlossener Kampagnen mit eingelöster Belohnung.
- Anzahl verschiedener Kampagnen, die für Freischaltungen gespielt werden.
- Wiedereinstieg von Spielern mit offener Belohnung.

**Empfohlene Entscheidungen:**
- Alle regulären Enden zählen; ein vollständiger Gruppenverlust nicht.
- Nur aktive Kampagnenmitglieder mit gespeicherter Figur werden belohnt.
- Nach vollständiger Sammlung gibt es Auszeichnungen oder Kosmetik.
- Gäste bekommen eine Kontoverknüpfung erst nach dem Kernsystem.

**Bewusste Nicht-Ziele:** kein Login-Zwang, keine Lootboxen, keine bezahlten Neuwürfe, keine dauerhaften Kampfboni, keine Änderung an Escape Rooms oder Krimidinner, keine Erhöhung auf 8 aktive Figuren.

---

## Teil B – Anmerkungen aus dem Abgleich mit dem Spielstand

### B1. Das Tempo passt erst mit mehr Abenteuern
Bei 3 Start-Helden und einem Helden pro Kampagne braucht man **12 abgeschlossene Kampagnen** bis zur vollen Sammlung. Mit den vier Abenteuern der Closed Beta (Moor, Grauwacht, Hochwacht, Krone) kommt ein Spieler auf **höchstens 7 von 15**, wenn nur die erste Kampagne je Abenteuer zählt. Zählt jedes Ende einmal (Grauwacht 5, Hochwacht 3, Krone 3, Moor 2 Siegesenden), reicht es für die ganze Sammlung. Weitere Hebel neben neuen Abenteuern:
- **Jedes erreichte Ende zählt einmal.** Grauwacht hat 5 Enden, das Moor 2 Siegesenden. Das belohnt Wiederspielen mit anderen Entscheidungen.
- ~~Freischaltung durch die Geschichte~~ (Helden als Nebenfiguren, die sich über einen bestimmten Pfad anschließen): **verworfen** am 13. November 2026. Es gibt keine Verzweigungen in den Kampagnen für Freischaltungen.

### B2. Gäste und Tisch-Helden regeln
Das Konzept legt fest, dass Gäste nichts freischalten, aber nicht, **welche Helden sie spielen dürfen**. Dasselbe gilt für die Helden, die der Spieltisch steuert (seit November 2026 möglich, z. B. zwei Handys plus ein Tisch-Held). Vorschlag:
- Gäste wählen aus einem **festen Starter-Set**, etwa einem Helden je Klasse, also 5.
- **Tisch-Helden** stammen aus der Sammlung des Gastgebers bzw. des Kampagnen-Hosts.

### B3. Ausweichregel bei kleinen Sammlungen
Haben zwei Spieler je 3 Helden und zufällig denselben, darf er nach dem Konzept nicht doppelt in die Gruppe. Am Anfang passiert das oft. Vorschlag: **Ein Spieler darf dann einen Helden aus der Sammlung eines Mitspielers am Tisch übernehmen.**

### B4. Ein Gerät allein und Hardcore-Ersatz
- **Ein Gerät:** Grauwacht braucht mindestens 3 Helden. Wer allein spielt und genau 3 besitzt, hat keine Wahl mehr. Ein festes Starter-Set (siehe B2) als Ergänzung für das Spiel auf einem Gerät würde helfen.
- **Hardcore-Ersatz am Lagerfeuer:** Heute wählt man aus allen freien Helden. Mit kleiner Sammlung gäbe es oft keinen Ersatz. Vorschlag: **Ersatzhelden bleiben frei wählbar**, als Gast in diesem Abenteuer, ohne Freischaltung.

### B5. Der Abschluss lässt sich nur auf Plausibilität prüfen
Das Spiel rechnet im Browser des Spieltischs; Supabase speichert Stände, kann ein Ende aber nicht selbst nachrechnen. Wer es darauf anlegt, könnte ein Ende über die Browser-Konsole vortäuschen. Für eine Belohnung ohne Geldwert ist das vertretbar, wenn der Server auf Plausibilität prüft:
- Kampagnenstatus `abgeschlossen`, gesetzt über `rpg_set_campaign_status` nach einem gespeicherten Endstand.
- Eine Mindestzahl an Spielständen (`rpg_state_snapshots`) und eine Mindestspieldauer zwischen erstem und letztem Stand.
- Der Endstand enthält eine Endszene des jeweiligen Abenteuers.

### B6. Die Balance trägt das Zufallsangebot
Simulation im Moor (Normal, alle Kämpfe, 2–6 Helden, eingebaute KI):
- Die 15 Helden liegen nur **4,6 Prozentpunkte** auseinander (90,5–95,1 % Siegquote, Werkzeug heute: `tools/kampagne.js kaempfe rabenmoor --helden`).
- Ein Startangebot mit „schwächeren“ Helden ist also kein echter Nachteil.
- Vor der Einführung sollte dieselbe Auswertung für alle Abenteuer laufen. Grauwacht hat dafür `tools/simulation.js`.

### B7. Woran sich die Umsetzung anknüpfen lässt
- Kampagnen haben bereits die Status `geplant/aktiv/pausiert/abgeschlossen/archiviert` (Migration 001).
- Mitglieder sind mit `role` und gespielter Figur (`character_id`) gespeichert (001/002).
- Konten haben Benutzernamen und Profile (002), Freunde und Einladungen gibt es (003).
- Der Heldenkatalog lässt sich aus `js/figuren.js` (15 Helden, 5 Klassen) speisen.
- Die Heldenwahl am Tisch (`spiel.js` → `zeichneSetup`) und auf dem Handy (`handy.js` → `viewWahl`) müsste nur nach der Sammlung filtern.
- Neue Tabellen und Funktionen als Migration `006_rpg_heldensammlung.sql` (005 ist inzwischen für die Abenteuer-Zuordnung der Kampagnen vergeben) im bewährten Ablauf: lokal prüfen (`supabase/tests/pruefen.sh`), mit Rückbau-Skript, und du führst sie in Supabase aus.

### B8. Offene Entscheidungen vor dem Start
1. Zählt jedes **Ende** einzeln oder nur die erste Kampagne pro Abenteuer?
2. Gibt es ein **Starter-Set** für Gäste und das Spiel auf einem Gerät, und wenn ja, welche fünf Helden?
3. Sollen auch **Freischaltungen durch die Geschichte** (B1) kommen, und in welchem Abenteuer zuerst?
4. Werden **bestehende Konten** beim Start alle Helden behalten (Bestandsschutz) oder auch die drei Startrunden spielen?

---

## Teil C – Abgleich mit dem Heldenlevel-Konzept (Stand 13. November 2026)

Zum Launch soll der Aufstieg **aus den Kampagnen heraus** wandern: Helden haben dann eine dauerhafte Stufe von 1 bis 10 am Konto und sammeln XP durch gespielte Abschnitte und Kampagnen (Details in [KONZEPT-HELDENLEVEL.md](KONZEPT-HELDENLEVEL.md)). Was sich dadurch an diesem Konzept ändert:

| Stelle in Teil A | Bis zum Launch (Open Beta) | Ab dem Launch |
|---|---|---|
| 4. „Nur im jeweiligen Abenteuer: Level 1–3“ | gilt | Stufe 1–10 am Konto; im Abenteuer gibt es keinen Aufstieg mehr, sondern einen Kampagnen-Segen |
| 4. „Keine dauerhafte Machtsteigerung“ | gilt | dauerhafte Stufen ja; weiterhin keine dauerhaften Gegenstände und keine Kaufvorteile |
| 3. Belohnung nach dem Finale | Freischaltung | Freischaltung **plus** XP für die beteiligten Helden |
| Neu freigeschalteter Held | sofort voll spielbar | startet auf Stufe 1; der Erfahrungsschatz bringt ihn bis zwei Stufen unter den stärksten eigenen Helden |
| B2 Gäste und Tisch-Helden | Starter-Set | zusätzlich: spielen auf der empfohlenen Stufe der Kampagne |
| B4 Hardcore-Ersatz | frei wählbar | frei wählbar, spielt als Gast auf der empfohlenen Stufe |
| 6. Datenmodell | `006_rpg_heldensammlung.sql` | dazu `007_rpg_heldenlevel.sql` (Stufe, XP, Buchungen) |

**Empfehlung für die Open Beta:** Das Datenmodell der Sammlung so anlegen, dass `rpg_hero_progress` (Stufe, XP) direkt danebenpasst. XP schon während der Open Beta still mitschreiben (Phase 0 im Heldenlevel-Konzept) und zum Launch gutschreiben.

---

## Teil D – Entscheidungen vom 13. November 2026

- **Freischaltung nur über Kampagnen-Enden:** Ein neuer Held kommt dazu, wenn ein Konto ein **Ende einer Kampagne zum ersten Mal** erreicht. Gewählt wird aus drei Angeboten. Ein schon bekanntes Ende bringt keinen weiteren Helden. Damit ist B8, Frage 1 entschieden: Jedes Ende zählt einmal.
- **Keine Chronik:** Die Chronik aus Teil A (Abschnitt 4 „Am Konto gespeichert“, Abschnitt 5 und Teil A, 3) entfällt. Sichtbar sind nur die Sammlung, der Fortschritt „x von y Enden“ je Kampagne und die Kampagnentitel.
- **Keine Story-Freischaltungen:** keine eigenen Pfade oder Verzweigungen in den Kampagnen (B1, zweiter Punkt, und B8, Frage 3 entfallen).
- **Reichweite:** 13 reguläre Enden (Moor 2, Grauwacht 5, Hochwacht 3, Krone 3) plus 3 Start-Helden ergeben 16 Freischaltungen. Das reicht für alle 15 Helden; ab dem 13. neuen Ende greift die Regel für die vollständige Sammlung (Fortschritt und Kampagnentitel, keine Chronik).
- **Schon bekanntes Ende:** Sieg wie immer, dazu der Hinweis, wie viele Enden der Kampagne noch offen sind. Keine Freischaltung.
- **Sammlung vollständig:** Ein neues Ende bringt keinen Helden mehr, zählt aber im Fortschritt „x von y Enden“ (unter Charaktere). Eine Chronik gibt es bewusst nicht. Wer **alle Enden einer Kampagne** gefunden hat, bekommt einen **Titel**, der neben dem Spielernamen erscheint: „Kenner des Schwarzmoors“, „Hüter von Grauwacht“, „Fackelträger des Nordens“, „Bezwinger der Eiskrone“ (Vorschläge).
- **Nach der Registrierung:** Übersicht „Deine Helden sind eingebucht“ mit den drei Helden und dem Hinweis, dass sie unter **Charaktere** verfügbar sind; „Weiter“ führt zur Startseite nach der Anmeldung.
- **Prototyp:** `abenteuer/prototyp/helden.html` (nicht verlinkt, `noindex`). Er zeigt die Registrierung mit drei Runden, „Meine Helden“ mit gesperrten Helden, die Heldenwahl im Spiel und die Belohnung nach einem neuen Ende.

