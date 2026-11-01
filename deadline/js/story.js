/*
 * DEADLINE.exe – Inhalte des Falls
 *
 * Alles, was auf Elias' Computer liegt: Dateien, Mails, Chats, Kalender, Intranet,
 * Protokolle, die Nachrichten von UNBEKANNT, Hinweise und Enden.
 * Die Spiellogik steht in game.js, die Oberfläche in os.js und apps.js.
 *
 * Sichtbarkeit: `when` ist ein Schritt ("solved:archiv"), ein Ereignis ("event:e60")
 * oder fehlt (immer sichtbar).
 */
window.DL = window.DL || {};
(() => {
  "use strict";

  /* ---------- Schritte der Ermittlung (Reihenfolge = Hinweis-Reihenfolge) ---------- */
  const steps = [
    { id: "archiv", label: "ARCHIV_01 öffnen" },
    { id: "chat", label: "Chat-Backup entschlüsseln" },
    { id: "nora", label: "NORA_PRIVATE öffnen" },
    { id: "widerspruch", label: "Widerspruch #4471 einreichen" },
    { id: "trace", label: "Gerät untersuchen" },
    { id: "decrypt", label: "CASE_17 entschlüsseln" },
    { id: "verify", label: "Beweispaket verifizieren" },
    { id: "finale", label: "Entscheidung treffen" },
  ];

  /* ---------- Dateisystem ---------- */
  const nodes = {
    /* --- Ordner --- */
    docs: { name: "Dokumente", type: "folder", icon: "folder" },
    pics: { name: "Bilder", type: "folder", icon: "folder" },
    audio: { name: "Audio", type: "folder", icon: "folder" },
    trash: { name: "Papierkorb", type: "folder", icon: "trash" },
    archiv: { name: "ARCHIV_01", type: "folder", parent: "docs", date: "17.10. 23:41", lock: { code: "2140", step: "archiv", digits: 4, prompt: "ARCHIV_01 ist geschützt. Vierstelliger Schlüssel:" } },
    nora: { name: "NORA_PRIVATE", type: "folder", parent: "docs", date: "17.10. 21:40", lock: { code: "1704", step: "nora", digits: 4, prompt: "NORA_PRIVATE · Ordner von N. Weiss. Vierstelliger Schlüssel:" } },
    temp: { name: "TEMP_ACCESS", type: "folder", desktop: true, when: "event:e60", date: "jetzt" },
    evidence: { name: "EVIDENCE_UNLOCKED", type: "folder", desktop: true, when: "solved:verify", date: "jetzt", icon: "evidence" },

    /* --- Desktop / Dokumente --- */
    start: {
      name: "START_HERE.txt", type: "txt", parent: "docs", desktop: true, date: "17.10. 23:52",
      text: `Wenn du das hier liest, ist die Routine bereits gestartet.

Ich habe den ersten Schlüssel nicht versteckt. Ich habe ihn gelöscht.
Suche nach der letzten Übergabe.

Und glaube nicht alles, was du auf diesem Computer findest.

– E.`,
    },
    termhelp: {
      name: "terminal_help.txt", type: "txt", parent: "docs", date: "02.09. 10:15",
      text: `VANTA SYSTEM TERMINAL · Kurzanleitung (IT-Forensik)

help                                  verfügbare Befehle
ls                                    Dateien im Arbeitsordner
cat <datei>                           Textdatei anzeigen
trace <geräte-id>                     Aktivitäten eines Geräts (Tagesprotokoll)
decrypt <paket> --key <wort>          verschlüsseltes Paket öffnen
verify <paket> --seed <code>          Integrität eines Pakets prüfen
clear                                 Bildschirm leeren

Gerätekennungen mit oder ohne Bindestrich (LT-N14 = LTN14).
Groß- und Kleinschreibung spielt keine Rolle.`,
    },
    pruefung: {
      name: "pruefung.txt", type: "txt", parent: "docs", when: "solved:widerspruch", date: "17.10. 23:30",
      text: `Wenn du den Widerspruch eingereicht hast, bist du weiter als jeder vor dir.

Das Beweispaket liegt im Terminal: CASE_17.

1. Untersuche das Gerät, das du gefunden hast. Das Terminal kann jedes Gerät zurückverfolgen.

2. Der Schlüssel ist der Name des Projekts, über dessen Dienst die fremden Zugriffe liefen.
   Welcher Dienst zu welchem Projekt gehört, steht im Audit-Portal.

3. Die Bestätigung sind die Prüfziffern – aber nur die der Ereignisse, die unter fremdem Namen liefen.
   In der Reihenfolge, in der sie passiert sind. Nicht in der, in der das Terminal sie anzeigt.

Der Name ist der Schlüssel. Die Ziffern sind die Bestätigung.`,
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
Status:  abgebrochen (Gegenstelle nicht erreichbar)`,
    },
    ueb: {
      name: "uebergabe.tmp", type: "txt", parent: "trash", date: "17.10. 21:41",
      text: `LETZTE ÜBERGABE
Datum:   17.10.
Uhrzeit: 21:40
Quelle:  USB · N. WEISS
Ziel:    Dokumente/NORA_PRIVATE
Status:  Übergabe erfolgreich.`,
    },
    ueb_test: {
      name: "uebergabe_test.tmp", type: "txt", parent: "trash", date: "12.10. 22:05",
      text: `TESTÜBERGABE
Datum:   12.10.
Uhrzeit: 22:05
Status:  Prüfsumme fehlerhaft – verworfen`,
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
[purge] stage 2/4 scheduled
[info ] protected: CASE_17.enc (sealed, verify required)`,
    },

    /* --- ARCHIV_01 --- */
    notiz: {
      name: "notiz.txt", type: "txt", parent: "archiv", date: "16.10. 23:20",
      text: `Nora wollte mir den zweiten Schlüssel nicht schriftlich schicken.
Sie hat ihn gesprochen. Nein – geklopft.

Kurze und lange Signale. Mehr brauchst du nicht.
(Und nein, es ist nicht ihr Name. So leicht macht sie es niemandem.)
Das Passwort öffnet das Chat-Backup im Messenger.`,
    },
    memo3: { name: "memo_03.wav", type: "wav", parent: "archiv", date: "16.10. 22:58", audio: "memo3" },
    kalender: { name: "kalender.ics", type: "ics", parent: "archiv", date: "17.10. 18:00" },

    /* --- Audio --- */
    memo1: { name: "memo_01.wav", type: "wav", parent: "audio", date: "15.10. 08:10", audio: "memo1" },
    memo2: { name: "memo_02.wav", type: "wav", parent: "audio", date: "15.10. 19:47", audio: "memo2" },

    /* --- Bilder --- */
    whiteboard: { name: "whiteboard.jpg", type: "jpg", parent: "pics", date: "16.10. 19:02", image: "whiteboard" },
    sommerfest: { name: "sommerfest.jpg", type: "jpg", parent: "pics", date: "29.08. 20:14", image: "sommerfest" },

    /* --- NORA_PRIVATE --- */
    statement: {
      name: "statement.txt", type: "txt", parent: "nora", date: "17.10. 20:55",
      text: `Ich habe die Kundendaten nicht exportiert.

Am 14.10. habe ich mich um kurz nach sechs abgemeldet und bin nach Hause gefahren.
Mein Laptop lag ausgeschaltet in meiner Tasche.

Elias hat mir gezeigt, dass mein Konto um 19:14 trotzdem benutzt wurde.
In den Protokollen steht ein Gerät, das nicht meines ist.
Ich weiß nicht, wem es gehört. Aber ich weiß, dass ich es nicht war.

Wenn das hier jemals jemand liest: Mein Name soll drinbleiben.
Ich will, dass alle wissen, dass ich es nicht war.

– Nora`,
    },
    auditcsv: { name: "audit_1410.csv", type: "csv", parent: "nora", date: "15.10. 09:30", table: "audit" },
    registry: {
      name: "device_registry.txt", type: "txt", parent: "nora", date: "15.10. 16:12",
      text: `VANTA SYSTEMS · GERÄTEREGISTER (Auszug, Stand 15.10.)

HD-03    Helpdesk-Arbeitsplatz       Standort: Helpdesk EG     Zuständig: J. Thiel
LT-N14   Laptop                      Standort: Arbeitsplatz 14  Zuständig: N. Weiss
WS-E02   Desktop                     Standort: Arbeitsplatz 02  Zuständig: E. Voss
WS-L07   Desktop                     Standort: Arbeitsplatz 07  Zuständig: L. Ahrens
SEC-01   Sicherheitsterminal         Standort: Sicherheitsbüro C-01   Zuständig: Leitung IT-Sicherheit
SEC-02   Sicherheitsterminal         Standort: Analyse C-02           Zuständig: Analyst IT-Sicherheit
SRV-L1   Server (LANTERN)            Standort: Rechenzentrum    Zuständig: IT-Betrieb

Gerätekennungen sind hardwaregebunden und werden bei jeder Aktion mitprotokolliert.`,
    },
    meeting: { name: "meetingroom.jpg", type: "jpg", parent: "nora", date: "14.10. 19:16", image: "meeting" },

    /* --- TEMP_ACCESS (nach 60 Minuten) --- */
    planb: {
      name: "plan_b.txt", type: "txt", parent: "temp", date: "17.10. 23:55",
      text: `Falls du festhängst – so bin ich vorgegangen:

1  Papierkorb: die letzte Übergabe
2  Der Ton in ARCHIV_01 → Chat-Backup
3  Kalender + Chat → Noras Ordner
4  Das fremde Gerät → Widerspruch im Audit-Portal
5  Das Gerät im Terminal zurückverfolgen
6  Der Dienst verrät das Projekt → Schlüssel
7  Die Ziffern der fremden Ereignisse → Bestätigung
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
      ["18:51", "SOKAFOR", "LOGIN", "—", "SEC-02"],
      ["19:06", "EVOSS", "LOGOUT", "—", "WS-E02"],
      ["19:14", "NWEISS", "DOWNLOAD", "kundendaten_gesamt.zip", "SEC-01"],
      ["19:15", "EVOSS", "UPLOAD", "kundendaten_gesamt.zip", "SEC-01"],
      ["19:19", "JTHIEL", "LOGOUT", "—", "HD-03"],
      ["19:40", "SOKAFOR", "LOGOUT", "—", "SEC-02"],
    ],
  };

  /* ---------- Mails ---------- */
  const mails = [
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
From: noreply-4471@vanta.local
X-Originating-Device: SEC-01
X-Mailer: VANTA Notify 2.3`,
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
      id: "m_malte", from: "Malte Brück", addr: "m.brueck@vanta.local", date: "16.10. 18:20", subject: "das, was du wolltest",
      body: `Elias,

Zutrittsprotokoll Sicherheitsbüro C-01, 14.10.:
Badge V. KERN – rein 18:38, raus 19:34.
Sonst niemand.

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
      body: `Heute 21:40, B-04. Bring alles mit, was du hast.
Ich kümmere mich um den Rest.

E.`,
    },
  ];

  /* ---------- Messenger ---------- */
  const chat = [
    { who: "Elias", time: "22:14", text: "Hast du den Notfallordner vorbereitet?" },
    { who: "Nora", time: "22:15", text: "Ja. Mit allem, was ich habe. Statement, Audit-Auszug, das Register von Jana." },
    { who: "Nora", time: "22:15", text: "Und ein Foto aus dem Konferenzsystem in B-01. Automatische Aufnahme vom 14., 19:16. Sieh dir die Glasscheibe genau an." },
    { who: "Elias", time: "22:16", text: "Wie sperrst du ihn?" },
    { who: "Nora", time: "22:18", text: "Mit unserem nächsten Treffen. Tag und Raumnummer. Den Monat lassen wir weg." },
    { who: "Elias", time: "22:18", text: "Gut. Ich trag es in den Kalender ein." },
    { who: "Nora", time: "22:21", text: "Elias, ich hab Angst. Wer kann so was überhaupt?" },
    { who: "Elias", time: "22:23", text: "Jemand mit sehr viel Zugriff. Ich sag es dir, wenn ich sicher bin." },
    { who: "Elias", time: "22:24", text: "Falls etwas passiert, muss jemand den Kalender finden." },
    { who: "Nora", time: "22:25", text: "Das Passwort für dieses Backup klopf ich dir nachher aufs Handy. Milo schläft gerade auf meiner Tastatur. 🐈" },
  ];

  /* ---------- Kalender (ARCHIV_01/kalender.ics) ---------- */
  const calendar = [
    { day: "Mo 13.10.", time: "09:00", title: "Jour fixe IT-Sicherheit", place: "Raum A-01" },
    { day: "Di 14.10.", time: "18:30", title: "Patchnacht vorbereiten", place: "Arbeitsplatz 02" },
    { day: "Mi 15.10.", time: "18:00", title: "Gespräch mit Nora", place: "Raum B-02", note: "abgesagt – N. freigestellt", cancelled: true },
    { day: "Do 16.10.", time: "12:30", title: "Mittag mit Jana", place: "Kantine" },
    { day: "Fr 17.10.", time: "08:15", title: "Zahnarzt", place: "–" },
    { day: "Fr 17.10.", time: "21:40", title: "Letzte Abstimmung (N.)", place: "Raum B-04", note: "Übergabe Ordner" },
    { day: "Sa 18.10.", time: "08:00", title: "Termin V. Kern", place: "Sicherheitsbüro C-01" },
    { day: "Mo 20.10.", time: "19:00", title: "Treffen N. (falls nötig)", place: "Raum B-11" },
  ];

  /* ---------- Intranet ---------- */
  const team = [
    { name: "Viktor Kern", role: "Leitung IT-Sicherheit · Leitung Security Review", place: "Sicherheitsbüro C-01" },
    { name: "Sven Okafor", role: "Analyst IT-Sicherheit", place: "Analyse C-02" },
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
  const objection = {
    device: "SEC01",
    person: "Viktor Kern",
    persons: ["Nora Weiss", "Elias Voss", "Jana Thiel", "Sven Okafor", "Viktor Kern"],
    need: ["18:17", "19:14"],
    allowed: ["19:15", "19:06"],
    wrongDevice: {
      LTN14: "LT-N14 ist Noras Laptop. Genau das bestreitet der Widerspruch.",
      SEC02: "SEC-02 taucht um 19:14 nicht auf. Lies die Zeile des Downloads genau.",
      WSE02: "WS-E02 ist Elias' Rechner. Er war um 19:06 abgemeldet.",
      HD03: "HD-03 ist der Helpdesk. Der Download kam nicht von dort.",
    },
    wrongPerson: {
      "Nora Weiss": "Das ist genau die Behauptung, die der Widerspruch widerlegen soll.",
      "Elias Voss": "Elias war um 19:06 abgemeldet. Auch sein Konto wurde benutzt.",
      "Jana Thiel": "Jana sitzt am Helpdesk, an HD-03. Wer ist für das Gerät aus dem Protokoll zuständig?",
      "Sven Okafor": "Okafor arbeitet an SEC-02. Prüfe die Gerätenummer genau.",
    },
    wrongRow: {
      "18:11": "Der Download um 18:11 kam von Noras eigenem Laptop. Der spricht eher gegen sie.",
      "18:02": "Die Anmeldung zeigt nur, dass Nora da war, nicht, dass sie später weg war.",
    },
  };

  /* ---------- Terminal-Trace ---------- */
  const traces = {
    SEC01: {
      owner: "Sicherheitsbüro C-01 · Leitung IT-Sicherheit",
      groups: [
        ["KONTO VKERN", [["18:40", "LOGIN", "auth.svc", 2], ["19:31", "LOGOUT", "auth.svc", 8]]],
        ["KONTO NWEISS", [["19:14", "DOWNLOAD", "mrr.svc", 3], ["19:12", "AUTH_REPLAY", "mrr.svc", 7]]],
        ["KONTO EVOSS", [["19:22", "LOG_REWRITE", "mrr.svc", 9], ["19:15", "SESSION_CLONE", "mrr.svc", 1]]],
        ["KONTO SYSTEM", [["19:25", "BACKUP_CHECK", "ltn.svc", 5]]],
      ],
    },
    SEC02: { owner: "Analyse C-02 · Analyst IT-Sicherheit", groups: [["KONTO SOKAFOR", [["18:51", "LOGIN", "auth.svc", 4], ["19:02", "REPORT_EXPORT", "orb.svc", 6], ["19:40", "LOGOUT", "auth.svc", 0]]]] },
    LTN14: { owner: "Arbeitsplatz 14 · N. Weiss", groups: [["KONTO NWEISS", [["18:02", "LOGIN", "auth.svc", 1], ["18:11", "DOWNLOAD", "fs.svc", 5], ["18:17", "LOGOUT", "auth.svc", 2]]]], tail: "DEVICE OFFLINE 18:19 – 08:02 (15.10.)" },
    WSE02: { owner: "Arbeitsplatz 02 · E. Voss", groups: [["KONTO EVOSS", [["18:24", "LOGIN", "auth.svc", 6], ["19:06", "LOGOUT", "auth.svc", 3]]]], tail: "DEVICE OFFLINE 19:08 – 07:51 (15.10.)" },
    HD03: { owner: "Helpdesk EG · J. Thiel", groups: [["KONTO JTHIEL", [["17:48", "LOGIN", "auth.svc", 9], ["19:19", "LOGOUT", "auth.svc", 4]]]] },
    WSL07: { owner: "Arbeitsplatz 07 · L. Ahrens", groups: [], tail: "NO ACTIVITY ON 14.10." },
    SRVL1: { owner: "Rechenzentrum · IT-Betrieb", groups: [["KONTO SYSTEM", [["19:25", "BACKUP_CHECK", "ltn.svc", 5]]]] },
  };

  /* ---------- Beweisbericht (Namen sind schwärzbar) ---------- */
  const people = ["Nora Weiss", "Viktor Kern", "Elias Voss", "Jana Thiel", "Malte Brück"];
  const report = `BEWEISBERICHT CASE_17
erstellt von {Elias Voss}, IT-Forensik · 17.10.2025

1  Am 14.10.2025 um 19:14 wurde unter dem Konto von {Nora Weiss} die Datei kundendaten_gesamt.zip exportiert. {Nora Weiss} hatte sich um 18:17 an ihrem Laptop LT-N14 abgemeldet. Das Gerät war danach bis zum Morgen offline.

2  Ausführendes Gerät war SEC-01, das Sicherheitsterminal im Büro von {Viktor Kern}.

3  Das Geräteregister, das diese Zuordnung belegt, hat mir {Jana Thiel} vom Helpdesk zur Verfügung gestellt.

4  Laut Zutrittsprotokoll betrat {Viktor Kern} das Sicherheitsbüro um 18:38 und verließ es um 19:34. Niemand sonst war im Raum. Quelle: {Malte Brück}, Haustechnik.

5  Der Trace von SEC-01 zeigt vier Ereignisse über den Dienst mrr.svc (Projekt MIRROR) unter den Konten von {Nora Weiss} und {Elias Voss}: AUTH_REPLAY, DOWNLOAD, SESSION_CLONE, LOG_REWRITE. Prüfziffern 7-3-1-9.

6  Ergebnis: {Viktor Kern} hat mit MIRROR die Benutzerkennungen von {Nora Weiss} und {Elias Voss} übernommen, die Kundendaten exportiert und die Protokolle umgeschrieben. {Nora Weiss} ist unschuldig.`;

  /* ---------- Nachrichten von UNBEKANNT (vorbereitet von Elias) ---------- */
  const messages = {
    u_start: { text: "Er hat dir gesagt, du sollst nicht alles glauben. Das gilt auch für mich.", rule: 1 },
    u_fail: { text: "Nicht raten. Er hat dir doch gesagt, wo du suchen musst.", rule: 2 },
    u_archiv: { text: "Du bist schneller als der Letzte.", rule: 3 },
    u_memo: { text: "Kurz. Lang. Hör nicht auf die Melodie, zähl die Töne.", rule: 4 },
    u_nora: { text: "Jetzt weißt du, warum es ausgerechnet sie getroffen hat.", rule: 5 },
    u_e45: { text: "Du bist nicht der Erste, der das versucht.", rule: 6 },
    u_widerspruch: { text: "Du hast gerade einen Widerspruch eingereicht. Ab jetzt sieht er dich.", rule: 7 },
    u_term: { text: "Dieses Terminal hat er früher schon überwacht. Beeil dich.", rule: 8 },
    u_verify: { text: "Jetzt liegt es bei dir.", rule: 9 },
  };

  /* ---------- Ereignisse nach Spielzeit (Minuten seit Start) ---------- */
  const events = [
    { id: "e30", at: 30, note: "Ein Teil der Benutzerdaten wurde beschädigt.", sub: "Im Papierkorb ist eine neue Datei.", sound: "error" },
    { id: "e45", at: 45, msg: "u_e45" },
    { id: "e60", at: 60, note: "Integritätsprüfung fehlgeschlagen.", sub: "Neues Element auf dem Desktop: TEMP_ACCESS", glitch: true, sound: "glitch" },
    { id: "e75", at: 75, note: "WARNING: FINAL PURGE SEQUENCE PREPARED.", sub: "Noch 15 Minuten.", sound: "error", countdownOnly: true },
    { id: "e85", at: 85, note: "Du musst dich jetzt entscheiden.", sub: "– E.", red: true, sound: "alarm", countdownOnly: true },
  ];

  /* ---------- Hinweise (drei Stufen je Schritt) ---------- */
  const hints = {
    archiv: [
      "START_HERE sagt: Der erste Schlüssel wurde gelöscht.",
      "Sieh in den Papierkorb. Dort liegt mehr als eine Übergabe – du brauchst die letzte, die geklappt hat.",
      "Die letzte Übergabe war am 17.10. um 21:40. ARCHIV_01 (in Dokumente) öffnet sich mit 2140.",
    ],
    chat: [
      "In ARCHIV_01 liegt eine Notiz zu einer Sprachaufnahme.",
      "memo_03.wav besteht aus kurzen und langen Tönen: Morsezeichen. Eine Tabelle findest du im Browser unter IT-Hilfe.",
      "-- / .. / .-.. / --- ergibt MILO. Damit öffnest du das Chat-Backup im Messenger.",
    ],
    nora: [
      "Im Chat-Backup erklärt Nora, womit sie ihren Ordner gesperrt hat.",
      "Tag und Raumnummer des nächsten Treffens nach dem Chat (16.10.). Der Kalender liegt in ARCHIV_01.",
      "Das nächste Treffen war Freitag, 17.10., in Raum B-04. NORA_PRIVATE öffnet sich mit 1704.",
    ],
    widerspruch: [
      "Nora sagt, ihr Konto wurde benutzt, während ihr Laptop aus war. Im Browser liegt im Audit-Portal ein Widerspruch von Elias im Entwurf.",
      "Vergleiche in audit_1410.csv: Wann hat sich Nora abgemeldet, und von welchem Gerät kam der Download um 19:14? Wer für das Gerät zuständig ist, steht im Register; wer diese Stelle hat, steht im Intranet unter Mitarbeiter.",
      "Gerät SEC-01 · Leitung IT-Sicherheit = Viktor Kern · Belege: 18:17 (Abmeldung an LT-N14) und 19:14 (Download über SEC-01).",
    ],
    trace: [
      "In Dokumente ist pruefung.txt aufgetaucht.",
      "Öffne das Terminal und verfolge das Gerät zurück. Die Befehle stehen in terminal_help.txt.",
      "Tippe im Terminal: trace SEC-01",
    ],
    decrypt: [
      "Der Schlüssel ist ein Projektname. Welcher Dienst steht bei den Ereignissen unter fremden Konten?",
      "mrr.svc. Im Audit-Portal unter „Interne Projekte“ steht, zu welchem Projekt dieser Dienst gehört.",
      "Tippe: decrypt CASE_17 --key MIRROR",
    ],
    verify: [
      "Du brauchst die Prüfziffern (CHECK) aus dem Trace – aber nicht alle.",
      "Nur die Ereignisse unter fremden Konten (NWEISS und EVOSS), sortiert nach Uhrzeit.",
      "19:12 → 7, 19:14 → 3, 19:15 → 1, 19:22 → 9. Tippe: verify CASE_17 --seed 7319",
    ],
    finale: [
      "Lies final_message.txt in EVIDENCE_UNLOCKED, bevor du DEADLINE.exe benutzt.",
      "Wer hat Elias geholfen? Das steht in seinen Mails. Und wer leitet Security Review?",
      "Schwärze Jana Thiel und Malte Brück – sonst niemanden. Sende an die Ombudsstelle Albers & Roth.",
    ],
  };

  /* ---------- Enden ---------- */
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

  DL.story = { steps, nodes, audit, mails, chat, calendar, team, projects, objection, traces, people, report, messages, events, hints, endings };
})();
