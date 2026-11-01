/*
 * DEADLINE.exe – Inhalte des Falls (Version 2: vier Siegel, parallele Ermittlungsstränge)
 *
 * Alles, was auf Elias' Computer liegt: Dateien, Mails, Chats, Kalender, Intranet,
 * Protokolle, die Nachrichten von UNBEKANNT, Hinweise und Enden.
 * Die Spiellogik steht in game.js, die Oberfläche in os.js und apps.js.
 *
 * Sichtbarkeit: `when` ist ein Schritt ("solved:archiv"), ein Ereignis ("event:e60")
 * oder fehlt (immer sichtbar).
 *
 * Ablauf: Einstieg (archiv → chat → nora), danach vier Siegel in beliebiger Reihenfolge:
 *   Gerät (trace) · Zeit (Zutrittsprotokoll) · Quelle (Sicherheitsbericht) · Schlüssel (decrypt + verify).
 * Sind alle vier gebrochen, ist CASE_17 entsiegelt („case“) und die Entscheidung möglich.
 */
window.DL = window.DL || {};
(() => {
  "use strict";

  /* ---------- Schritte (needs = Voraussetzungen für Hinweise und Fortschritt) ---------- */
  const steps = [
    { id: "archiv", label: "ARCHIV_01 öffnen", needs: [] },
    { id: "chat", label: "Chat-Backup entschlüsseln", needs: ["archiv"] },
    { id: "nora", label: "NORA_PRIVATE öffnen", needs: ["chat"] },
    { id: "trace", label: "Siegel 1 · Gerät", needs: ["nora"] },
    { id: "zeit", label: "Siegel 2 · Zeit", needs: ["nora"] },
    { id: "quelle", label: "Siegel 3 · Quelle", needs: ["nora"] },
    { id: "decrypt", label: "Siegel 4 · Schlüssel (decrypt)", needs: ["trace"] },
    { id: "verify", label: "Siegel 4 · Bestätigung (verify)", needs: ["decrypt"] },
    { id: "finale", label: "Entscheidung treffen", needs: ["case"] },
  ];
  const seals = [
    { id: "trace", name: "GERÄT" },
    { id: "zeit", name: "ZEIT" },
    { id: "quelle", name: "QUELLE" },
    { id: "verify", name: "SCHLÜSSEL" },
  ];

  /* ---------- Dateisystem ---------- */
  const nodes = {
    /* --- Ordner --- */
    docs: { name: "Dokumente", type: "folder", icon: "folder" },
    pics: { name: "Bilder", type: "folder", icon: "folder" },
    audio: { name: "Audio", type: "folder", icon: "folder" },
    downloads: { name: "Downloads", type: "folder", icon: "folder" },
    trash: { name: "Papierkorb", type: "folder", icon: "trash" },
    archiv: { name: "ARCHIV_01", type: "folder", parent: "docs", date: "17.10. 23:41", lock: { code: "2140", step: "archiv", digits: 4, prompt: "ARCHIV_01 ist geschützt. Vierstelliger Schlüssel:" } },
    nora: { name: "NORA_PRIVATE", type: "folder", parent: "docs", date: "17.10. 21:40", lock: { code: "1704", step: "nora", digits: 4, prompt: "NORA_PRIVATE · Ordner von N. Weiss. Vierstelliger Schlüssel:" } },
    zutritt: { name: "zutritt_c01.zip", type: "folder", parent: "downloads", date: "16.10. 18:20", icon: "zip", lock: { code: "1914", step: "zeit", digits: 4, prompt: "zutritt_c01.zip ist verschlüsselt (Absender: M. Brück). Passwort, vier Ziffern:" } },
    temp: { name: "TEMP_ACCESS", type: "folder", desktop: true, when: "event:e60", date: "jetzt" },
    evidence: { name: "EVIDENCE_UNLOCKED", type: "folder", desktop: true, when: "solved:case", date: "jetzt", icon: "evidence" },

    /* --- Desktop / Dokumente --- */
    start: {
      name: "START_HERE.txt", type: "txt", parent: "docs", desktop: true, date: "17.10. 23:52",
      text: `Wenn du das hier liest, ist die Routine bereits gestartet.

Ich habe den ersten Schlüssel nicht versteckt. Ich habe ihn gelöscht.
Suche nach Noras letzter Übergabe – nicht nach meiner.
Es kommt auf die Uhrzeit an.

Und glaube nicht alles, was du auf diesem Computer findest.
Auch keinem Datum.

– E.`,
    },
    termhelp: {
      name: "terminal_help.txt", type: "txt", parent: "docs", date: "02.09. 10:15",
      text: `VANTA SYSTEM TERMINAL · Kurzanleitung (IT-Forensik)

help                                  verfügbare Befehle
ls                                    Dateien im Arbeitsordner
cat <datei>                           Textdatei anzeigen
status <paket>                        Siegel und Zustand eines Beweispakets
trace <geräte-id>                     Aktivitäten eines Geräts (Tagesprotokoll)
decrypt <paket> --key <wort>          verschlüsseltes Paket öffnen
verify <paket> --seed <code>          Integrität eines Pakets prüfen
clear                                 Bildschirm leeren

Gerätekennungen mit oder ohne Bindestrich (LT-N14 = LTN14).
Groß- und Kleinschreibung spielt keine Rolle.`,
    },
    pruefung: {
      name: "pruefung.txt", type: "txt", parent: "docs", when: "solved:nora", date: "17.10. 23:30",
      text: `CASE_17 ist mit vier Siegeln verschlossen. Jedes steht für eine Frage, die ich beantworten musste.
In welcher Reihenfolge du sie öffnest, ist egal. Im Terminal zeigt  status CASE_17,  was noch fehlt.

SIEGEL 1 · GERÄT
Von welchem Gerät kamen die Zugriffe unter Noras Namen? Das Terminal kann jedes Gerät
zurückverfolgen. Untersuchst du das richtige, bricht das Siegel.

SIEGEL 2 · ZEIT
Malte hat mir geschickt, wer an dem Abend im Sicherheitsbüro war. Er hat es verschlossen –
mit einer Uhrzeit, die die Kamera nicht zeigt.

SIEGEL 3 · QUELLE
Jemand hat Stimmung gegen Nora gemacht. Nicht jede Mail ist so alt, wie sie tut.
Security Review führt über alles Akten.

SIEGEL 4 · SCHLÜSSEL
decrypt mit dem Namen des Projekts hinter den Zugriffen.
verify mit den Prüfziffern der Handlungen, die unter fremdem Namen über den gespiegelten Dienst liefen.
Nichts Automatisches. In der Reihenfolge, in der sie passiert sind.
Was die Ereignisse bedeuten, steht in ereignistypen.txt.`,
    },
    ereignis: {
      name: "ereignistypen.txt", type: "txt", parent: "docs", when: "solved:nora", date: "11.09. 14:02",
      text: `VANTA AUDIT · EREIGNISTYPEN (Auszug Handbuch IT-Forensik)

AUTH_REPLAY     Anmeldung wird aus einer gespiegelten Sitzung wiederholt     · manuell
SESSION_CLONE   Sitzung wird auf ein anderes Gerät kopiert                   · manuell
DOWNLOAD        Datei wird heruntergeladen                                   · manuell
UPLOAD          Datei wird hochgeladen                                       · manuell
LOG_REWRITE     Protokolleinträge werden geändert                            · manuell
MIRROR_START    Spiegeldienst wird gestartet (am eigenen Konto)              · manuell
HEARTBEAT       Verbindungsprüfung, alle 60 Sekunden                         · automatisch
TOKEN_RENEW     Anmeldetoken wird verlängert                                 · automatisch
BACKUP_CHECK    Prüfung der Datensicherung                                   · automatisch
LOGIN / LOGOUT  An- und Abmeldung                                            · manuell

Jedes Ereignis trägt eine Prüfziffer (CHECK). Sie dient der Integritätsprüfung von Beweispaketen.`,
    },
    stellen: {
      name: "kantine_kw42.txt", type: "txt", parent: "docs", date: "13.10. 07:02",
      text: `KANTINE VANTA · KW 42

Mo  Linsensuppe · Gemüsecurry
Di  Schnitzel · Ofengemüse
Mi  Pasta Arrabbiata
Do  Fischfilet · Kartoffelsalat
Fr  geschlossen (Patchnacht-Nachbereitung)`,
    },

    /* --- Papierkorb --- */
    ueb_alt: {
      name: "uebergabe_0910.tmp", type: "txt", parent: "trash", date: "09.10. 18:31",
      text: `ÜBERGABE
Datum:   09.10.
Uhrzeit: 18:30
Quelle:  USB · N. WEISS
Ziel:    Dokumente/NORA_PRIVATE
Status:  abgebrochen (Gegenstelle nicht erreichbar)`,
    },
    ueb_test: {
      name: "uebergabe_1210.tmp", type: "txt", parent: "trash", date: "12.10. 22:06",
      text: `ÜBERGABE
Datum:   12.10.
Uhrzeit: 22:05
Quelle:  USB · N. WEISS
Ziel:    Dokumente/NORA_PRIVATE
Status:  Prüfsumme fehlerhaft – verworfen`,
    },
    ueb_sync: {
      name: "uebergabe_sync.tmp", type: "txt", parent: "trash", date: "17.10. 22:16",
      text: `ÜBERGABE
Datum:   17.10.
Uhrzeit: 22:15
Quelle:  WS-E02 · E. VOSS (automatische Sicherung)
Ziel:    Backup/privat
Status:  Übergabe erfolgreich.`,
    },
    ueb: {
      name: "uebergabe (wiederhergestellt).tmp", type: "txt", parent: "trash", date: "18.10. 00:09",
      text: `ÜBERGABE
Datum:   17.10.
Uhrzeit: 21:40
Quelle:  USB · N. WEISS
Ziel:    Dokumente/NORA_PRIVATE
Status:  Übergabe erfolgreich.

[Datei am 18.10. um 00:09 durch das System wiederhergestellt – Änderungsdatum aktualisiert]`,
    },
    regeln: {
      name: "autoresp.cfg", type: "txt", parent: "trash", date: "17.10. 23:49",
      text: `# autoresp.cfg   (Fragment – Datei beschädigt)

ON  fail:ARCHIV_01 >= 2        SEND  "Nicht raten. ███ ████ ███ ████, ███ ███ ██████ █████."
ON  open:ARCHIV_01             SEND  "Du bist schneller als ███ ██████."
ON  play:memo_03               SEND  "████. ████. ███ ████ ███ ███ ███████, ████ ███ ████."
ON  █████████████████          SEND  "██████████████████████████"

SENDER   "UNBEKANNT"
DELAY    rand(4,11)s
█████████████████████████████████`,
    },
    einkauf: {
      name: "notiz_samstag.txt", type: "txt", parent: "trash", date: "11.10. 09:12",
      text: `– Kaffee
– Akku Fahrradlicht
– Mama zurückrufen (Geburtstag 26.)
– Sicherheitskopie privat ↯ NICHT auf Firmenrechner`,
    },
    errlog: {
      name: "system_error.log", type: "txt", parent: "trash", when: "event:e30", date: "jetzt",
      text: `[purge] stage 1/4 · user cache ......................... DELETED
[purge] stage 1/4 · thumbnails ......................... DELETED
[warn ] profile sync failed: mrr.svc session handle not found
[warn ] mrr.svc: replay buffer empty (origin SEC-01)
[warn ] clock skew B-01-CAM: +00:09:00 (ticket #3311 open)
[purge] stage 2/4 scheduled
[info ] protected: CASE_17.enc (sealed 4/4, status required)`,
    },

    /* --- ARCHIV_01 --- */
    notiz: {
      name: "notiz.txt", type: "txt", parent: "archiv", date: "16.10. 23:20",
      text: `Nora wollte mir den zweiten Schlüssel nicht schriftlich schicken.
Sie hat ihn mir am Telefon geklopft.

Vorher hab ich geübt, ob mein Mikrofon so etwas überhaupt sauber aufnimmt.
Die Testaufnahme liegt noch bei den anderen Memos.

Kurze und lange Signale. Mehr brauchst du nicht.
Das Passwort, das Nora gewählt hat, öffnet das Chat-Backup im Messenger.`,
    },
    memo3: { name: "memo_03.wav", type: "wav", parent: "archiv", date: "16.10. 22:58", audio: "memo3" },
    kalender: { name: "kalender.ics", type: "ics", parent: "archiv", date: "16.10. 22:31" },

    /* --- Audio --- */
    memo1: { name: "memo_01.wav", type: "wav", parent: "audio", date: "15.10. 08:10", audio: "memo1" },
    memo2: { name: "memo_02.wav", type: "wav", parent: "audio", date: "15.10. 19:47", audio: "memo2" },
    memo4: { name: "memo_04.wav", type: "wav", parent: "audio", date: "16.10. 21:30", audio: "memo4" },

    /* --- Bilder --- */
    whiteboard: { name: "whiteboard.jpg", type: "jpg", parent: "pics", date: "16.10. 19:02", image: "whiteboard" },
    sommerfest: { name: "sommerfest.jpg", type: "jpg", parent: "pics", date: "29.08. 20:14", image: "sommerfest" },

    /* --- NORA_PRIVATE --- */
    statement: {
      name: "statement.txt", type: "txt", parent: "nora", date: "17.10. 20:55",
      text: `Ich habe die Kundendaten nicht exportiert.

Am 14.10. habe ich mich um 18:17 abgemeldet und bin kurz danach nach Hause gefahren.
Mein Laptop lag ausgeschaltet in meiner Tasche.

Elias hat mir gezeigt, dass mein Konto um 19:14 trotzdem benutzt wurde.
In den Protokollen steht ein Gerät, das nicht meines ist.
Und dann tauchte diese Mail auf, in der jemand behauptet, mich um sieben am Platz gesehen zu haben.
Das ist eine Lüge.

Wenn das hier jemals jemand liest: Mein Name soll drinbleiben.
Ich will, dass alle wissen, dass ich es nicht war.

– Nora`,
    },
    auditcsv: { name: "audit_1410.csv", type: "csv", parent: "nora", date: "15.10. 09:30", table: "audit" },
    registry: {
      name: "device_registry.txt", type: "txt", parent: "nora", date: "15.10. 16:12",
      text: `VANTA SYSTEMS · GERÄTEREGISTER (Auszug, Stand 15.10.)

HD-03    Helpdesk-Arbeitsplatz     Standort: Helpdesk EG            Zuständig: J. Thiel
LT-N14   Laptop                    Standort: Arbeitsplatz 14         Zuständig: N. Weiss
WS-E02   Desktop                   Standort: Arbeitsplatz 02         Zuständig: E. Voss
WS-L07   Desktop                   Standort: Arbeitsplatz 07         Zuständig: L. Ahrens
SEC-01   Sicherheitsterminal       Standort: Sicherheitsbüro C-01    Zuständig: Leitung IT-Sicherheit
SEC-10   Sicherheitsterminal       Standort: Analyse C-10            Zuständig: Analyst IT-Sicherheit
SRV-L1   Server (LANTERN)          Standort: Rechenzentrum           Zuständig: IT-Betrieb
CAM-B01  Konferenzsystem           Standort: Raum B-01               Zuständig: Haustechnik

Gerätekennungen sind hardwaregebunden und werden bei jeder Aktion mitprotokolliert.`,
    },
    meeting: { name: "meetingroom.jpg", type: "jpg", parent: "nora", date: "14.10. 19:23", image: "meeting" },

    /* --- Downloads / zutritt_c01.zip --- */
    zutrittTxt: {
      name: "zutritt_c01.txt", type: "txt", parent: "zutritt", date: "16.10. 18:12",
      text: `ZUTRITTSPROTOKOLL · 14.10.2025 · Auszug Haustechnik (M. Brück)

18:21  Badge N. WEISS    Haupteingang            AUSGANG
18:38  Badge V. KERN     C-01 Sicherheitsbüro    EINTRITT
18:51  Badge S. OKAFOR   C-10 Analyse            EINTRITT
19:06  Badge E. VOSS     Haupteingang            AUSGANG
19:34  Badge V. KERN     C-01 Sicherheitsbüro    AUSTRITT
19:41  Badge S. OKAFOR   C-10 Analyse            AUSTRITT

Zwischen 18:38 und 19:34 kein weiterer Zutritt zu C-01.`,
    },

    /* --- TEMP_ACCESS (nach 60 Minuten) --- */
    planb: {
      name: "plan_b.txt", type: "txt", parent: "temp", date: "17.10. 23:55",
      text: `Falls du festhängst – so bin ich vorgegangen:

1  Papierkorb: Noras letzte Übergabe, nicht das neueste Datum
2  Zwei Morse-Aufnahmen. Nur eine ist von Nora.
3  Kalender + Chat → Noras Ordner (der Raum im Kalender stimmt nicht)
Danach in beliebiger Reihenfolge (pruefung.txt):
4  GERÄT: Audit-Log → Register → Terminal
5  ZEIT: Kamera-Uhr in B-01 geht falsch → Maltes Anhang
6  QUELLE: Kopfzeilen der anonymen Mails → Sicherheitsberichte
7  SCHLÜSSEL: Dienst → Projekt → decrypt · Prüfziffern → verify
8  Lies meine letzte Nachricht, bevor du entscheidest.

Unten in der Leiste gibt es außerdem Hinweise (?).`,
    },

    /* --- EVIDENCE_UNLOCKED --- */
    final: {
      name: "final_message.txt", type: "txt", parent: "evidence", date: "17.10. 23:58",
      text: `Wenn du das lesen kannst, hast du gesehen, was ich gesehen habe.

Viktor hat MIRROR benutzt, um sich als Nora anzumelden und die Kundendaten zu exportieren.
Eine Minute später hat er meine Sitzung gespiegelt, damit es aussieht, als hätte ich ihr geholfen.
Danach hat er die Protokolle umgeschrieben. Nur die Gerätekennung konnte er nicht fälschen.
Den Vorfall hatte er schon zwölf Minuten vorher angelegt. Die „Zeugin“ hat er selbst geschrieben.

Nora war es nicht.

Die Löschroutine habe ich selbst gestartet. Sie vernichtet die Rohdaten und meine Zugangsschlüssel,
damit Viktor nichts findet, falls er vor dir hier ist.

Die Nachrichten von UNBEKANNT waren nie live. Ich habe sie vorbereitet, Regel für Regel.
Niemand hat dich beobachtet. Aber allein warst du auch nicht.

Bevor du den Bericht abschickst:
Darin stehen zwei Menschen, die mir geholfen haben, obwohl sie nichts davon hatten.
Wenn ihre Namen bei VANTA ankommen, sind sie ihre Stellen los. Schwärze sie.
Aber nur sie. Ohne Viktors Namen ist der Bericht wertlos. Nora will ihren Namen drin haben.
Meiner ist egal.

Und schick ihn nicht an Security Review. Du weißt inzwischen, wer das leitet.

Wenn du nichts tust, entscheidet die Uhr.

Danke, dass du dir die Zeit genommen hast.
– Elias`,
    },
    report: { name: "CASE_17_bericht.txt", type: "report", parent: "evidence", date: "17.10. 23:57" },
  };

  /* ---------- Audit-Export (NORA_PRIVATE/audit_1410.csv) ---------- */
  const audit = {
    title: "Audit-Log 14.10.2025 · 17:30–20:00 · Export für Vorfall #4471 · erstellt von: Security Review",
    head: ["Zeit", "Konto", "Aktion", "Objekt", "Gerät"],
    rows: [
      ["17:48", "JTHIEL", "LOGIN", "—", "HD-03"],
      ["18:02", "NWEISS", "LOGIN", "—", "LT-N14"],
      ["18:11", "NWEISS", "DOWNLOAD", "patchliste_q4.xlsx", "LT-N14"],
      ["18:17", "NWEISS", "LOGOUT", "—", "LT-N14"],
      ["18:24", "EVOSS", "LOGIN", "—", "WS-E02"],
      ["18:30", "LAHRENS", "LOGIN", "—", "WS-L07"],
      ["18:45", "LAHRENS", "DOWNLOAD", "sicherungsplan_q4.pdf", "WS-L07"],
      ["18:51", "SOKAFOR", "LOGIN", "—", "SEC-10"],
      ["19:02", "SOKAFOR", "DOWNLOAD", "wochenbericht_kw42.pdf", "SEC-10"],
      ["19:06", "EVOSS", "LOGOUT", "—", "WS-E02"],
      ["19:14", "NWEISS", "DOWNLOAD", "kundendaten_gesamt.zip", "SEC-01"],
      ["19:15", "EVOSS", "UPLOAD", "kundendaten_gesamt.zip", "SEC-01"],
      ["19:19", "JTHIEL", "LOGOUT", "—", "HD-03"],
      ["19:22", "LAHRENS", "LOGOUT", "—", "WS-L07"],
      ["19:40", "SOKAFOR", "LOGOUT", "—", "SEC-10"],
    ],
  };

  /* ---------- Mails (Reihenfolge = Anzeige; angezeigt wird das Datum aus dem Kopf) ---------- */
  const mails = [
    {
      id: "m_ticket", from: "Haustechnik-Tickets", addr: "tickets-ht@vanta.local", date: "06.10. 09:14", subject: "Ticket #3311 – Uhrzeit Konferenzkamera B-01",
      body: `An: IT, alle Teamleitungen

Die Kamera des Konferenzsystems in Raum B-01 (CAM-B01) geht seit dem letzten Update 9 Minuten vor.
Die Korrektur erfolgt nach der Patchnacht, voraussichtlich am 15.10.
Bis dahin bitte die Zeitstempel der automatischen Raumaufnahmen entsprechend lesen.

Ticket #3311 · Status: offen
Haustechnik`,
    },
    {
      id: "m_anon2", from: "anonym", addr: "noreply-4471@vanta.local", date: "14.10. 19:20", subject: "Ich habe sie gesehen",
      body: `Ich war am Dienstag noch spät im Haus.
Um kurz nach sieben saß Nora Weiss an ihrem Platz und hat etwas auf einen USB-Stick gezogen.

Ich will keinen Ärger. Aber das musste raus.

– jemand aus der IT`,
      headers: `Received: from SEC-01.vanta.local (10.4.0.11)
        by mail.vanta.local; Wed, 15 Oct 2025 07:12:40 +0200
Date: Tue, 14 Oct 2025 19:20:11 +0200
From: noreply-4471@vanta.local
X-Mailer: VANTA Notify 2.3 (geplanter Versand)
X-SR-Ref: SR-0458`,
    },
    {
      id: "m_kern1", from: "Viktor Kern", addr: "v.kern@vanta.local", date: "15.10. 08:41", subject: "Vorfall #4471 – keine eigenen Ermittlungen",
      body: `Elias,

ich höre, dass du dir die Protokolle zum Vorfall #4471 ansiehst.
Das lässt du bitte. Der Fall liegt bei Security Review, und dort bleibt er.

Nora Weiss ist bis auf Weiteres freigestellt. Kontakt zu ihr ist zu unterlassen.

Viktor Kern
Leitung IT-Sicherheit · Leitung Security Review
VANTA Systems · Sicherheitsbüro C-01`,
    },
    {
      id: "m_hr", from: "Personalabteilung", addr: "hr@vanta.local", date: "15.10. 10:02", subject: "Information: Freistellung N. Weiss",
      body: `Liebe Kolleginnen und Kollegen der IT,

Frau Nora Weiss ist mit sofortiger Wirkung freigestellt. Hintergrund ist ein Verdacht auf unberechtigten Datenexport (Vorfall #4471).
Bitte leiten Sie Anfragen an Security Review weiter.

Personalabteilung VANTA Systems`,
      headers: `Received: from hr-02.vanta.local (10.2.0.40)
        by mail.vanta.local; Wed, 15 Oct 2025 10:02:17 +0200
Date: Wed, 15 Oct 2025 10:02:15 +0200
From: hr@vanta.local
X-SR-Ref: SR-0449`,
    },
    {
      id: "m_jana", from: "Jana Thiel", addr: "j.thiel@vanta.local", date: "15.10. 16:14", subject: "AW: Geräteliste",
      body: `Hi Elias,

wie besprochen: das aktuelle Geräteregister. Ich hab es Nora auch rübergeschickt, sie wollte es sehen.

Du hast das nicht von mir. Wenn Viktor erfährt, dass ich dir das gebe, bin ich am Helpdesk Geschichte.

J.`,
    },
    {
      id: "m_anon", from: "anonym", addr: "noreply-4471@vanta.local", date: "15.10. 17:30", subject: "Was ihr über Nora Weiss wissen solltet",
      body: `An alle in der IT,

Nora Weiss hat nicht zum ersten Mal Daten mitgenommen.
Fragt euch, warum sie immer als Letzte geht.

Jemand, der es gut meint`,
      headers: `Received: from SEC-01.vanta.local (10.4.0.11)
        by mail.vanta.local; Wed, 15 Oct 2025 17:30:02 +0200
Date: Wed, 15 Oct 2025 17:30:00 +0200
From: noreply-4471@vanta.local
X-Mailer: VANTA Notify 2.3
X-SR-Ref: SR-0451`,
    },
    {
      id: "m_ombud", from: "Ombudsstelle Albers & Roth", addr: "kontakt@albers-roth.de", date: "16.10. 11:05", subject: "Eingangsbestätigung Ihrer Anfrage",
      body: `Sehr geehrter Herr Voss,

wir bestätigen den Eingang Ihrer Anfrage. Wir sind als externe Ombudsstelle für VANTA Systems tätig und von der Geschäftsführung unabhängig.
Hinweisgebende Personen werden bei uns geschützt. Bitte bedenken Sie: Namen Dritter, die in Ihren Unterlagen stehen, können wir nur schützen, wenn Sie diese vor der Übermittlung schwärzen.

Unterlagen können Sie über unser gesichertes Portal einreichen.

Dr. Henrike Albers
Ombudsstelle Albers & Roth`,
    },
    {
      id: "m_malte", from: "Malte Brück", addr: "m.brueck@vanta.local", date: "16.10. 18:20", subject: "das, was du wolltest", attach: "zutritt",
      body: `Elias,

im Anhang das Zutrittsprotokoll vom Sicherheitsbüro, Dienstagabend.
Ich hab's verschlüsselt. Passwort ist die echte Uhrzeit von dem Foto aus B-01, das Nora dir geben will.
Du weißt ja, dass die Kamera da falsch geht – ich hab das Ticket selbst geschrieben. Vier Ziffern.

Ich hab das aus der Haustechnik gezogen, das darf ich eigentlich gar nicht.
Wenn das jemand erfährt, bin ich meinen Job los. Lösch die Mail.

Malte`,
    },
    {
      id: "m_kern2", from: "Viktor Kern", addr: "v.kern@vanta.local", date: "17.10. 18:02", subject: "Morgen 08:00",
      body: `Elias,

morgen um 08:00 in meinem Büro. Bring deinen Laptop mit.

V.`,
    },
    {
      id: "m_sent", from: "an: Nora Weiss (privat)", addr: "gesendet", date: "17.10. 19:12", subject: "Heute",
      body: `Heute Abend wie besprochen. Bring alles mit, was du hast.
Ich kümmere mich um den Rest.

E.`,
    },
  ];

  /* ---------- Messenger ---------- */
  const chat = [
    { who: "Elias", time: "22:14", text: "Hast du den Notfallordner vorbereitet?" },
    { who: "Nora", time: "22:15", text: "Ja. Mit allem, was ich habe. Statement, Audit-Auszug, das Register von Jana." },
    { who: "Nora", time: "22:15", text: "Und ein Foto aus dem Konferenzsystem in B-01. Automatische Aufnahme vom Dienstagabend. Sieh dir die Glasscheibe genau an." },
    { who: "Elias", time: "22:16", text: "Wie sperrst du ihn?" },
    { who: "Nora", time: "22:18", text: "Mit unserem nächsten Treffen. Tag und Raumnummer. Den Monat lassen wir weg." },
    { who: "Elias", time: "22:19", text: "Das ist morgen. Ich verschieb's auf abends, mittags ist zu viel los." },
    { who: "Nora", time: "22:20", text: "Und nicht in B-03, da hängt jetzt auch so eine Kamera. Nimm B-04." },
    { who: "Elias", time: "22:21", text: "Ok. Ich trag's ein." },
    { who: "Nora", time: "22:23", text: "Elias, ich hab Angst. Wer kann so was überhaupt?" },
    { who: "Elias", time: "22:24", text: "Jemand mit sehr viel Zugriff. Ich sag es dir, wenn ich sicher bin." },
    { who: "Nora", time: "22:26", text: "Das Passwort für dieses Backup klopf ich dir nachher am Telefon. Milo schläft gerade auf meiner Tastatur. 🐈" },
    { who: "Elias", time: "22:27", text: "Falls etwas passiert, muss jemand den Kalender finden." },
  ];

  /* ---------- Kalender (ARCHIV_01/kalender.ics) ---------- */
  const calendar = [
    { day: "Mo 13.10.", time: "09:00", title: "Jour fixe IT-Sicherheit", place: "Raum A-01" },
    { day: "Di 14.10.", time: "18:30", title: "Patchnacht vorbereiten", place: "Arbeitsplatz 02" },
    { day: "Mi 15.10.", time: "18:00", title: "Gespräch mit Nora", place: "Raum B-02", note: "abgesagt – N. freigestellt", cancelled: true },
    { day: "Do 16.10.", time: "12:30", title: "Mittag mit Jana", place: "Kantine" },
    { day: "Fr 17.10.", time: "08:15", title: "Zahnarzt", place: "–" },
    { day: "Fr 17.10.", time: "12:30", title: "Abstimmung N.", place: "Raum B-03", note: "verschoben auf 21:40", cancelled: true },
    { day: "Fr 17.10.", time: "21:40", title: "Abstimmung N. (verschoben)", place: "Raum B-03", note: "geändert 16.10. 22:31" },
    { day: "Sa 18.10.", time: "08:00", title: "Termin V. Kern", place: "Sicherheitsbüro C-01" },
    { day: "Mo 20.10.", time: "19:00", title: "Treffen N. (falls nötig)", place: "Raum B-11", note: "nachgetragen 17.10. 23:40" },
  ];

  /* ---------- Intranet ---------- */
  const team = [
    { name: "Viktor Kern", role: "Leitung IT-Sicherheit · Leitung Security Review", place: "Sicherheitsbüro C-01" },
    { name: "Sven Okafor", role: "Analyst IT-Sicherheit", place: "Analyse C-10" },
    { name: "Elias Voss", role: "IT-Forensik", place: "Arbeitsplatz 02" },
    { name: "Nora Weiss", role: "Systemadministration", place: "Arbeitsplatz 14", note: "derzeit nicht im Haus" },
    { name: "Lea Ahrens", role: "IT-Betrieb", place: "Arbeitsplatz 07" },
    { name: "Jana Thiel", role: "Helpdesk", place: "Helpdesk EG" },
    { name: "Malte Brück", role: "Haustechnik", place: "UG" },
  ];
  const projects = [
    { name: "LANTERN", svc: "ltn.svc", what: "Automatisierte Datensicherung", owner: "IT-Betrieb" },
    { name: "QUARTZ", svc: "qtz.svc", what: "Abrechnung und Finanzverwaltung", owner: "Finanzen" },
    { name: "ORBIT", svc: "orb.svc", what: "Überwachung von Systemausfällen", owner: "IT-Betrieb" },
    { name: "HALCYON", svc: "hlc.svc", what: "Zertifikats- und Schlüsselverwaltung", owner: "IT-Sicherheit" },
    {
      name: "MIRROR", svc: "mrr.svc", what: "Spiegelung von Benutzersitzungen für Sicherheitsprüfungen", owner: "IT-Sicherheit (V. Kern)",
      detail: "Ermöglicht die zeitgleiche Wiedergabe autorisierter Sitzungen und die Simulation bestehender Benutzerkennungen. Gespiegelte Aktionen laufen unter der Kennung des Zielkontos. Die Gerätesignatur des ausführenden Terminals ist hardwaregebunden und bleibt erhalten.",
    },
  ];

  /* ---------- Widerspruch im Audit-Portal ---------- */

  /* ---------- Sicherheitsberichte im Audit-Portal (Aufruf per Vorgangsnummer) ---------- */
  const srReports = {
    SR0449: { title: "SR-0449 · Personalvorgang N. Weiss", text: `Angelegt: 15.10.2025, 09:50 · von: VKERN

Freistellung N. Weiss veranlasst (Vorfall #4471).
Information an Personalabteilung erfolgt.` },
    SR0451: { title: "SR-0451 · Anonymer Hinweis (Rundmail)", text: `Angelegt: 15.10.2025, 17:31 · von: VKERN

Anonyme Rundmail an die IT eingegangen.
Absender nicht ermittelbar. Keine weiteren Schritte.` },
    SR0458: { key: true, title: "SR-0458 · Vorfall #4471 – Datenexport N. Weiss", text: `VERTRAULICH · SECURITY REVIEW

Angelegt: 14.10.2025, 19:02 · von: VKERN · Gerät: SEC-01
Betreff: Verdacht auf Datenexport durch NWEISS

Verlauf
19:02  Vorgang angelegt
19:14  Export bestätigt (kundendaten_gesamt.zip)
19:31  Vorgang auf „in Prüfung“ gesetzt

Anlage: Zeugenhinweis (anonym)
       Versand geplant: 15.10. 07:12
       Datum im Kopf setzen auf: 14.10. 19:20

Status: Entwurf – nicht weiterleiten.` },
  };

  /* ---------- Terminal-Trace ---------- */
  const traces = {
    SEC01: {
      owner: "Sicherheitsbüro C-01 · Leitung IT-Sicherheit",
      groups: [
        ["KONTO VKERN", [["18:40", "LOGIN", "auth.svc", 2], ["19:10", "MIRROR_START", "mrr.svc", 0], ["19:31", "LOGOUT", "auth.svc", 8]]],
        ["KONTO NWEISS", [["19:14", "DOWNLOAD", "mrr.svc", 3], ["19:12", "AUTH_REPLAY", "mrr.svc", 7], ["19:16", "HEARTBEAT", "mrr.svc", 4]]],
        ["KONTO EVOSS", [["19:22", "LOG_REWRITE", "mrr.svc", 9], ["19:15", "SESSION_CLONE", "mrr.svc", 1], ["19:18", "TOKEN_RENEW", "auth.svc", 6]]],
        ["KONTO SYSTEM", [["19:25", "BACKUP_CHECK", "ltn.svc", 5]]],
      ],
    },
    SEC10: { owner: "Analyse C-10 · Analyst IT-Sicherheit", groups: [["KONTO SOKAFOR", [["18:51", "LOGIN", "auth.svc", 4], ["19:02", "DOWNLOAD", "orb.svc", 6], ["19:11", "HEARTBEAT", "orb.svc", 2], ["19:40", "LOGOUT", "auth.svc", 0]]]] },
    LTN14: { owner: "Arbeitsplatz 14 · N. Weiss", groups: [["KONTO NWEISS", [["18:02", "LOGIN", "auth.svc", 1], ["18:11", "DOWNLOAD", "fs.svc", 5], ["18:17", "LOGOUT", "auth.svc", 2]]]], tail: "DEVICE OFFLINE 18:19 – 08:02 (15.10.)" },
    WSE02: { owner: "Arbeitsplatz 02 · E. Voss", groups: [["KONTO EVOSS", [["18:24", "LOGIN", "auth.svc", 6], ["19:06", "LOGOUT", "auth.svc", 3]]]], tail: "DEVICE OFFLINE 19:08 – 07:51 (15.10.)" },
    HD03: { owner: "Helpdesk EG · J. Thiel", groups: [["KONTO JTHIEL", [["17:48", "LOGIN", "auth.svc", 9], ["19:19", "LOGOUT", "auth.svc", 4]]]] },
    WSL07: { owner: "Arbeitsplatz 07 · L. Ahrens", groups: [["KONTO LAHRENS", [["18:30", "LOGIN", "auth.svc", 3], ["18:45", "DOWNLOAD", "fs.svc", 8], ["19:22", "LOGOUT", "auth.svc", 1]]]] },
    SRVL1: { owner: "Rechenzentrum · IT-Betrieb", groups: [["KONTO SYSTEM", [["19:25", "BACKUP_CHECK", "ltn.svc", 5]]]] },
    CAMB01: { owner: "Raum B-01 · Haustechnik", groups: [["KONTO SYSTEM", [["19:23", "SNAPSHOT", "cam.svc", 0]]]], tail: "CLOCK SKEW +00:09:00 · Ticket #3311" },
  };

  /* ---------- Beweisbericht (Namen sind schwärzbar) ---------- */
  const people = ["Nora Weiss", "Viktor Kern", "Elias Voss", "Jana Thiel", "Malte Brück"];
  const report = `BEWEISBERICHT CASE_17
erstellt von {Elias Voss}, IT-Forensik · 17.10.2025

1  Am 14.10.2025 um 19:14 wurde unter dem Konto von {Nora Weiss} die Datei kundendaten_gesamt.zip exportiert. {Nora Weiss} hatte sich um 18:17 an ihrem Laptop LT-N14 abgemeldet und das Gebäude um 18:21 verlassen. Das Gerät war danach bis zum Morgen offline.

2  Ausführendes Gerät war SEC-01, das Sicherheitsterminal im Büro von {Viktor Kern}.

3  Das Geräteregister, das diese Zuordnung belegt, hat mir {Jana Thiel} vom Helpdesk zur Verfügung gestellt.

4  Laut Zutrittsprotokoll betrat {Viktor Kern} das Sicherheitsbüro um 18:38 und verließ es um 19:34. Niemand sonst war im Raum. Quelle: {Malte Brück}, Haustechnik. Die Aufnahme der Kamera B-01 (Kamerazeit 19:23, tatsächlich 19:14) zeigt ihn am Terminal.

5  Der Trace von SEC-01 zeigt vier Handlungen über den Dienst mrr.svc (Projekt MIRROR) unter den Konten von {Nora Weiss} und {Elias Voss}: AUTH_REPLAY, DOWNLOAD, SESSION_CLONE, LOG_REWRITE. Prüfziffern 7-3-1-9.

6  Vorgang SR-0458 wurde um 19:02 von {Viktor Kern} angelegt – zwölf Minuten vor dem Export. Die anonyme „Zeugen“-Mail stammt von SEC-01 und wurde mit falschem Datum verschickt.

7  Ergebnis: {Viktor Kern} hat mit MIRROR die Benutzerkennungen von {Nora Weiss} und {Elias Voss} übernommen, die Kundendaten exportiert, die Protokolle umgeschrieben und einen Zeugen erfunden. {Nora Weiss} ist unschuldig.`;

  /* ---------- Nachrichten von UNBEKANNT (vorbereitet von Elias) ---------- */
  const messages = {
    u_start: { text: "Er hat dir gesagt, du sollst nicht alles glauben. Das gilt auch für mich.", rule: 1 },
    u_fail: { text: "Nicht raten. Er hat dir doch gesagt, wo du suchen musst.", rule: 2 },
    u_archiv: { text: "Du bist schneller als der Letzte.", rule: 3 },
    u_memo: { text: "Kurz. Lang. Hör nicht auf die Melodie, zähl die Töne.", rule: 4 },
    u_nora: { text: "Jetzt weißt du, warum es ausgerechnet sie getroffen hat.", rule: 5 },
    u_e45: { text: "Du bist nicht der Erste, der das versucht.", rule: 6 },
    u_trace: { text: "Du hast gerade sein Terminal durchleuchtet. Ab jetzt sieht er dich.", rule: 7 },
    u_term: { text: "Dieses Terminal hat er früher schon überwacht. Beeil dich.", rule: 8 },
    u_case: { text: "Alle vier Siegel. Jetzt liegt es bei dir.", rule: 9 },
  };

  /* ---------- Ereignisse nach Spielzeit (Minuten seit Start) ---------- */
  const events = [
    { id: "e30", at: 30, note: "Ein Teil der Benutzerdaten wurde beschädigt.", sub: "Im Papierkorb ist eine neue Datei.", sound: "error" },
    { id: "e45", at: 45, msg: "u_e45" },
    { id: "e60", at: 60, note: "Integritätsprüfung fehlgeschlagen.", sub: "Neues Element auf dem Desktop: TEMP_ACCESS", glitch: true, sound: "glitch" },
    { id: "e75", at: 85, note: "WARNING: FINAL PURGE SEQUENCE PREPARED.", sub: "Noch 15 Minuten.", sound: "error", countdownOnly: true },
    { id: "e85", at: 95, note: "Du musst dich jetzt entscheiden.", sub: "– E.", red: true, sound: "alarm", countdownOnly: true },
  ];

  /* ---------- Hinweise: drei Stufen ohne Lösung, dazu die Lösung hinter einer Abfrage ---------- */
  const hints = {
    archiv: [
      "START_HERE sagt: Der erste Schlüssel wurde gelöscht. Sieh in den Papierkorb.",
      "Dort liegen mehrere Übergaben. Gesucht ist Noras letzte, die geklappt hat – vergleiche Quelle, Ziel und Status, nicht das Änderungsdatum in der Liste.",
      "Eine Datei wurde wiederhergestellt; ihr Änderungsdatum ist deshalb später als die Übergabe selbst. Ihr Inhalt zählt. Der Schlüssel ist eine Uhrzeit.",
      "uebergabe (wiederhergestellt).tmp: 17.10., 21:40, USB N. WEISS → NORA_PRIVATE. ARCHIV_01 öffnet sich mit 2140.",
    ],
    chat: [
      "notiz.txt in ARCHIV_01 erklärt, wie Nora das Passwort übermittelt hat.",
      "Es gibt zwei Aufnahmen mit kurzen und langen Tönen (Audio und ARCHIV_01). Eine Morsetabelle steht im Browser unter IT-Hilfe.",
      "Nur eine Aufnahme stammt von Nora – die andere ist Elias' Mikrofontest. Die Angabe „Quelle“ im Player verrät, welche welche ist.",
      "memo_03.wav (Anruf N. Weiss): -- / .. / .-.. / --- = MILO.",
    ],
    nora: [
      "Im Chat-Backup erklärt Nora, womit sie ihren Ordner gesperrt hat.",
      "Gesucht: Tag und Raumnummer des nächsten Treffens nach dem Chat (Donnerstag, 16.10., abends). Der Kalender liegt in ARCHIV_01.",
      "Lies den Chat bis zum Ende: Das Treffen wurde verschoben und verlegt. Elias hat nur die Uhrzeit im Kalender geändert, den Raum nicht.",
      "Freitag, 17.10., Raum B-04 (nicht B-03): 1704.",
    ],
    trace: [
      "pruefung.txt in Dokumente beschreibt vier Siegel. Siegel 1: das Gerät hinter den Zugriffen unter Noras Namen.",
      "audit_1410.csv: Nora war um 18:17 abgemeldet. Von welchem Gerät kam der Download um 19:14? Vorsicht bei ähnlichen Kennungen.",
      "Wer für das Gerät zuständig ist, steht im Register. Untersuchen kannst du es im Terminal mit trace und der Gerätekennung.",
      "Tippe im Terminal: trace SEC-01",
    ],
    zeit: [
      "Malte Brück hat Elias ein verschlüsseltes Zutrittsprotokoll geschickt (Mail mit Anhang, auch unter Downloads).",
      "Das Passwort ist die echte Uhrzeit des Fotos aus B-01 – meetingroom.jpg in NORA_PRIVATE. Die Kamera zeigt nicht die echte Zeit.",
      "Ein Ticket der Haustechnik (Mail vom 06.10.) sagt, um wie viel die Kamera-Uhr in B-01 vorgeht. Zieh das von der Zeit im Bild ab.",
      "19:23 minus 9 Minuten = 19:14. Passwort: 1914.",
    ],
    quelle: [
      "Es gibt zwei anonyme Mails gegen Nora. Eine davon ist nicht so alt, wie sie tut.",
      "Öffne bei beiden „Kopfzeilen anzeigen“ und vergleiche Date (angegeben) mit Received (wann der Server sie wirklich bekam).",
      "Die rückdatierte Mail trägt eine Vorgangsnummer von Security Review (X-SR-Ref). Im Audit-Portal unter Sicherheitsberichte lässt sich ein Vorgang damit aufrufen.",
      "Gib unter Sicherheitsberichte SR-0458 ein.",
    ],
    decrypt: [
      "Siegel 4 braucht zuerst einen Schlüssel: den Namen des Projekts hinter den Zugriffen.",
      "Im Trace von SEC-01 steht bei den verdächtigen Handlungen ein Dienst. Im Audit-Portal unter „Interne Projekte“ steht, zu welchem Projekt er gehört.",
      "mrr.svc gehört zu einem Projekt der IT-Sicherheit. Befehl: decrypt CASE_17 --key <Projektname>",
      "decrypt CASE_17 --key MIRROR",
    ],
    verify: [
      "Die Bestätigung sind Prüfziffern (CHECK) aus dem Trace von SEC-01 – aber nicht alle. ereignistypen.txt erklärt die Ereignisse.",
      "Es zählen nur Handlungen unter fremden Konten (nicht VKERN, nicht SYSTEM) über den gespiegelten Dienst mrr.svc. Automatisches zählt nicht.",
      "Vier Ereignisse bleiben übrig. Sortiere sie nach Uhrzeit, nicht nach der Reihenfolge im Trace.",
      "19:12 → 7, 19:14 → 3, 19:15 → 1, 19:22 → 9. Tippe: verify CASE_17 --seed 7319",
    ],
    finale: [
      "Lies final_message.txt in EVIDENCE_UNLOCKED, bevor du DEADLINE.exe benutzt.",
      "Wer hat Elias geholfen? Das steht in seinen Mails. Und wer leitet Security Review?",
      "Schwärze nur die zwei Helfer. Viktor und Nora müssen im Bericht bleiben. Der Empfänger muss unabhängig von VANTA sein.",
      "Jana Thiel und Malte Brück schwärzen und an die Ombudsstelle Albers & Roth senden.",
    ],
  };

  /* ---------- Morse-Aufnahmen ---------- */
  const memos = {
    memo3: { morse: ["--", "..", ".-..", "---"], source: "Anruf N. Weiss (Mobil) · 16.10. 22:58" },
    memo4: { morse: ["-.", "---", ".-.", ".-"], source: "Mikrofon WS-E02 · Testaufnahme · 16.10. 21:30" },
  };
  const endings = {
    truth: {
      title: "DIE WAHRHEIT", kind: "good",
      log: ["CONNECTING TO albers-roth.de/portal ...", "UPLOAD STARTED", "EVIDENCE PACKAGE: CASE_17", "REDACTION: 2 NAMES", "SIGNATURE: VALID", "UPLOAD SUCCESSFUL.", "LOCAL SYSTEM QUARANTINED.", "DELETION PROTOCOL STOPPED."],
      text: [
        "Die Ombudsstelle Albers & Roth hat noch in derselben Woche eine externe Untersuchung eingeleitet.",
        "Viktor Kern wurde von seinen Aufgaben entbunden. Gegen ihn wird wegen Datenmanipulation ermittelt. MIRROR wurde abgeschaltet.",
        "Nora Weiss wurde rehabilitiert. Ihr Name steht in jedem Bericht – so, wie sie es wollte.",
        "Wer Elias geholfen hat, hat VANTA nie erfahren.",
        "Elias Voss wurde nicht gefunden. Sein letzter bekannter Aufenthaltsort bleibt unbekannt.",
      ],
      quote: "„Du hast die richtige Entscheidung getroffen. Nicht für mich. Für die Wahrheit.“",
    },
    price: {
      title: "DER PREIS", kind: "mixed",
      log: ["CONNECTING TO albers-roth.de/portal ...", "UPLOAD STARTED", "EVIDENCE PACKAGE: CASE_17", "REDACTION: INCOMPLETE", "SIGNATURE: VALID", "UPLOAD SUCCESSFUL.", "DELETION PROTOCOL STOPPED."],
      text: [
        "Die Ombudsstelle hat eine Untersuchung eingeleitet. Viktor Kern wurde von seinen Aufgaben entbunden, Nora Weiss rehabilitiert.",
        "Der Bericht ging vollständig an die Geschäftsführung – mit allen Namen darin.",
        "Drei Wochen später bekamen die Menschen, die Elias geholfen hatten, ihre Kündigung. Begründung: Weitergabe interner Daten.",
        "Elias Voss wurde nicht gefunden.",
      ],
      quote: "„Die Wahrheit ist angekommen. Bezahlt haben andere.“",
    },
    empty: {
      title: "LEERE AKTE", kind: "bad",
      log: ["CONNECTING TO albers-roth.de/portal ...", "UPLOAD STARTED", "EVIDENCE PACKAGE: CASE_17", "REDACTION: EXTENSIVE", "UPLOAD SUCCESSFUL."],
      text: [
        "Die Ombudsstelle hat den Bericht sorgfältig geprüft. Aber wer gehandelt hat und wer beschuldigt wurde, war geschwärzt.",
        "Ohne Namen ließ sich nichts zuordnen. Das Verfahren wurde eingestellt.",
        "Viktor Kern blieb im Amt. Der Vorfall #4471 gilt bis heute als ungeklärt.",
      ],
      quote: "„Du hast alle geschützt. Auch den Falschen.“",
    },
    sender: {
      title: "ZURÜCK AN DEN ABSENDER", kind: "bad",
      log: ["CONNECTING TO review.vanta.local ...", "UPLOAD STARTED", "EVIDENCE PACKAGE: CASE_17", "RECIPIENT: SECURITY REVIEW", "ASSIGNED TO: V. KERN", "UPLOAD SUCCESSFUL."],
      text: [
        "Security Review hat den Eingang bestätigt. Bearbeiter: Viktor Kern.",
        "Zwei Stunden später war das Paket aus allen Systemen verschwunden. MIRROR auch.",
        "Nora Weiss wurde fristlos gekündigt. Gegen Elias Voss läuft eine Anzeige wegen Beihilfe.",
      ],
      quote: "„Du hast die Beweise genau dem Mann gegeben, gegen den sie sprechen.“",
    },
    purge: {
      title: "KEINE SPUREN", kind: "mixed",
      log: ["PURGE PROTOCOL ACTIVATED.", "DELETING LOCAL RECORDS ...", "DELETING MIRROR TRACES ...", "DELETING EVIDENCE ...", "REMOVING USER PROFILES ...", "100%", "SYSTEM SHUTDOWN."],
      text: [
        "Du hast die Daten vernichtet.",
        "Niemand wird mehr nachweisen können, was Viktor getan hat.",
        "Aber auch niemand wird jemals beweisen können, dass Nora unschuldig war.",
        "Vielleicht war es die richtige Entscheidung. Vielleicht auch nicht.",
      ],
      quote: "THANK_YOU.txt: „Manchmal ist die Wahrheit gefährlicher als die Lüge. – E.“",
    },
    timeout: {
      title: "SYSTEMVERLUST", kind: "bad",
      log: ["00:00:00", "AUTOMATIC PURGE INITIATED.", "CRITICAL FILES DELETED.", "EVIDENCE PACKAGE DESTROYED.", "USER DATA REMOVED.", "SYSTEM SHUTDOWN."],
      text: ["Du warst so nah dran.", "Die Daten sind weg."],
      quote: "",
    },
  };

  DL.story = { steps, seals, nodes, audit, mails, chat, calendar, team, projects, srReports, traces, people, report, messages, events, hints, memos, endings };
})();
