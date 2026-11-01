/*
 * DAS ARCHON-PROTOKOLL – Inhalte: Dateien, Mails, Notizbuch, Audio, Nachrichten, Rätsel, Hinweise, Enden
 *
 * Sichtbarkeit (`when`): "ch:N" (ab Kapitel N), "solved:ID", "side:ID", "flag:ID" – fehlt = immer
 * (nach der Anmeldung). Schlösser (`lock`): { code, puzzle | side, prompt, target }.
 * Lösungen stehen in DESIGN.md; geprüft werden sie in game.js (normalisiert).
 */
window.AR = window.AR || {};
(() => {
  "use strict";

  /* ---------- Haupträtsel ---------- */
  AR.puzzles = [
    { id: "R1", ch: 1, label: "Das unsichtbare Passwort", hints: [
      "Das Bild ist mehr als ein Hintergrund.",
      "Bilder haben Eigenschaften, die man nicht sieht. Das Terminal kann sie lesen – und manche Zeichenketten übersetzen.",
      "Zwei Teile: ein Name, der nur von Nahem lesbar ist, und eine Zahl aus den Bilddaten. Die Richtlinie sagt, in welcher Reihenfolge."] },
    { id: "R2", ch: 1, label: "Die manipulierte Spam-Mail", hints: [
      "Nicht jede Spam-Mail ist Spam.",
      "Sieh dir an, was eine Mail über sich selbst verrät – unter der Oberfläche.",
      "Eine Kopfzeile beginnt mit X- und gehört zu keinem Mailprogramm. Das Terminal kann sie lesbar machen."] },
    { id: "R3", ch: 1, label: "Der erste Terminalzugang", needs: ["R2"], hints: [
      "Das Terminal kann jetzt mehr. Frag es.",
      "„help“ zeigt einen neuen Befehl.",
      "Der Schlüssel stammt aus der Mail, die keine Spam-Mail war."] },
    { id: "R4", ch: 2, label: "Die gelöschte Akte", hints: [
      "Drei Teile einer Datei. Die Reihenfolge stand irgendwo, als sie noch ganz war.",
      "Aris hat die Teile an sich selbst gemailt. Achte auf die Uhrzeit, zu der er sie ursprünglich verschickt hat.",
      "Weiterleitungen tragen ein neues Datum. Die echte Zeit steht im zitierten Text."] },
    { id: "R5", ch: 2, label: "Der letzte Anruf", hints: [
      "Aris hat nicht nur gesprochen.",
      "Untersuche die Frequenzbereiche der Aufnahme.",
      "Im mittleren Abschnitt, hoch oben im Spektrum, ist etwas geschrieben."] },
    { id: "R6", ch: 2, label: "Die falsche Identität", hints: [
      "Drei Dokumente, eine Person. Eines lügt.",
      "Vergleiche nicht nur die Person, sondern auch die Angaben über die Dokumente selbst.",
      "Ein Datum kann nicht stimmen, egal welches Jahr."] },
    { id: "R8", ch: 3, label: "Transaktionsanalyse: die vier Konten", hints: [
      "Es geht nicht um die größten Beträge, sondern um die regelmäßigsten.",
      "Folge einer Zahlung: Wohin geht dasselbe Geld ein, zwei Tage später?",
      "Der Prüfbericht sagt, welche Konten zählen und in welcher Reihenfolge. Die Ziffern stehen in den Firmenprofilen."] },
    { id: "R9", ch: 3, label: "Die Kontrollkette", hints: [
      "Wem gehört Corvane – und wem gehört der, dem Corvane gehört?",
      "Der Trust verweist auf eine Anlage. Ein Name fehlt dort, eine Nummer nicht.",
      "Ausländische Register lassen sich im Intranet nur über die Registernummer abfragen."] },
    { id: "R10", ch: 3, label: "Der Rechnungsabgleich", hints: [
      "Fünf Rechnungen haben je genau einen Fehler. Eine einzige ist mit allen drei Quellen konsistent.",
      "Prüfe jede Rechnung gegen drei Quellen: Buchung, Register, Prüfbericht.",
      "Achte auf Beträge, Daten, Anschriften, Steuernummern und darauf, ob es den Aussteller oder Empfänger an diesem Tag unter diesem Namen noch gab."] },
    { id: "R11", ch: 4, label: "Das Organisationsdiagramm", hints: [
      "Fünf Decknamen, fünf Ebenen. Die Kopfzeilen verraten, wer wem berichtet.",
      "Beginne bei den Zahlungslisten und folge der Berichtskette bis zu der Person, an die niemand berichtet.",
      "Der Schlüssel ist ein Wort aus fünf Buchstaben: der Anfang jedes Decknamens, von unten nach oben."] },
    { id: "R12", ch: 4, label: "Die Identität von ARCHON", hints: [
      "Nordstern hat eine Lücke im Terminkalender verraten.",
      "Vergleiche den Zeitstempel des Telefonats mit dem Sitzungsprotokoll.",
      "Das Protokoll vermerkt eine Unterbrechung. Wer hat den Raum in genau dieser Zeit verlassen? Die Teilnehmerliste sagt, wer diese Rolle hat."] },
    { id: "R14", ch: 5, label: "Das beschädigte Masterprotokoll", hints: [
      "Die Regeln standen in Aris' Prüfbericht.",
      "Hex-Ziffern: A=10 … F=15. Jede Zeile prüft sich selbst.",
      "Rechne für jeden Block die Summe der ersten drei Stellen mod 16 und vergleiche mit der vierten."] },
    { id: "R15", ch: 5, label: "Die letzte Verschlüsselung", needs: ["R14"], hints: [
      "Das Format steht im reparierten Protokoll.",
      "Jeder Teil ist ein Schlüssel, den du schon benutzt oder gefunden hast.",
      "Zugang = das erste, was du auf diesem Rechner eingegeben hast. Ton = was du gesehen, nicht gehört hast."] },
  ];
  // R7 ist Teil von R8, R13 ist ein Story-Ereignis – zusammen 15 Haupträtsel
  AR.MAIN_TOTAL = 15;

  /* ---------- Nebenrätsel (Beweistiefe) ---------- */
  AR.sides = {
    N1: { cat: "org", label: "Bank-Infrastruktur (whoami)" },
    N2: { cat: "org", label: "Ordner HELM" },
    N3: { cat: "person", label: "Die Treffen mit „H.“" },
    N4: { cat: "person", label: "Idas Sprachnachricht" },
    N5: { cat: "fin", label: "Automatisierter Zahlungsplan" },
    N6: { cat: "fin", label: "Embargoverstoß der KESTREL" },
    N7: { cat: "watch", label: "ns_observer und die Sitzungspausen" },
    N8: { cat: "watch", label: "Pressekontakt Mats Brenner" },
    N9: { cat: "org", label: "Herkunft der Überwachung" },
    N10: { cat: "watch", label: "Aris' Befehlsverlauf" },
    N11: { cat: "person", label: "Die gelöschte SMS" },
    N12: { cat: "person", label: "Die Postkarte" },
  };
  AR.CATS = { fin: "Finanziell", org: "Organisatorisch", person: "Personenbezogen", watch: "Überwachung / Bestätigung" };

  /* ---------- Dateisystem ---------- */
  AR.nodes = {
    docs: { name: "Dokumente", type: "folder" },
    pics: { name: "Bilder", type: "folder" },
    audio: { name: "Audio", type: "folder" },
    trash: { name: "Papierkorb", type: "folder" },
    pruefung: { name: "PRUEFUNG", type: "folder", when: "ch:3" },
    inquisition: { name: "INQUISITION_PROTOCOL", type: "folder", when: "ch:4", icon: "red" },
    core: { name: "ARCHIVE_CORE", type: "folder", when: "ch:5", icon: "red" },

    /* Dokumente */
    kanzlei: { name: "kanzlei", type: "folder", parent: "docs", date: "12.06. 10:02" },
    identitaet: { name: "identitaet_halden", type: "folder", parent: "docs", date: "22.10. 18:40" },
    privat: { name: "privat", type: "folder", parent: "docs", date: "31.10. 23:10" },
    verifiziert: { name: "VERIFIZIERT", type: "folder", parent: "docs", date: "01.11. 20:58", lock: { code: "HR2209", puzzle: "R6", target: "R6", prompt: "VERIFIZIERT – Freigabe nur mit der Dokumentnummer der Fälschung:" } },
    restored: { name: "wiederhergestellt", type: "folder", parent: "docs", when: "solved:R4", date: "jetzt" },
    helm: { name: "HELM", type: "folder", parent: "privat", date: "30.10. 22:15", lock: { code: "HELM", side: "N2", target: "N2", prompt: "Ordner HELM – Kennwort:" } },
    auftrag: { name: "pruefauftrag_hafenbank.txt", type: "txt", parent: "kanzlei", date: "12.06. 10:02", text: `HAFENBANK NORDELBE AG · Der Aufsichtsrat · Die Vorsitzende

Prüfauftrag an Aris & Lund Prüfungsgesellschaft, z. Hd. Herrn H. V. Aris

Gegenstand: Sonderprüfung der Geschäftsbeziehung zur Corvane Holding AG (Zug) und deren
Tochtergesellschaften, einschließlich Zahlungsverkehr, Gesellschafterstruktur und
wirtschaftlich Berechtigter.

Bitte berichten Sie ausschließlich an mich persönlich. Zwischenstände erbitte ich jeweils
am Morgen nach den Sitzungen des Aufsichtsrats.

Hamburg, 12.06.2026
Margarete Holm
Vorsitzende des Aufsichtsrats` },
    mandat: { name: "mandat_notizen.txt", type: "txt", parent: "kanzlei", date: "14.06. 17:20", text: `Notizen zum Mandat Hafenbank / Corvane – H. A.

- Ungewöhnlich: Auftrag direkt von der Aufsichtsratsvorsitzenden, nicht vom Vorstand.
- Ungewöhnlich: Berichte nur an sie, nur mündlich, immer am Morgen nach den Sitzungen.
- Ida meint, ich sehe Gespenster. Vielleicht.
- Die Hafenbank hat eine interne Freigabeschwelle von 50.000 EUR (Vier-Augen-Prinzip).
  Darunter genügt eine Unterschrift. Das ist KEINE gesetzliche Meldegrenze.` },
    regHalden: { name: "HR-2209_registerauszug_halden.txt", type: "txt", parent: "identitaet", date: "22.10. 18:41", text: `HANDELSREGISTER B · Amtsgericht Hamburg · Dokument HR-2209

Firma:            Halden Consult GmbH
Sitz:             Hamburg, Große Elbstraße 145, 22767 Hamburg
Registernummer:   HRB 151907
Geschäftsführer:  Jonas Halden, geb. 12.03.1979, Hamburg
Vertretung:       einzelvertretungsberechtigt
Eintragung der Geschäftsführerbestellung: 31.09.2025
Ausdruck vom:     22.10.2026` },
    passHalden: { name: "PA-5517_passkopie_halden.jpg", type: "jpg", parent: "identitaet", date: "22.10. 18:43", image: "pass", meta: { Dokument: "PA-5517", Aufnahme: "22.10.2026 18:43", Quelle: "Scan, Kanzlei Aris & Lund" } },
    profHalden: { name: "IN-0384_intranetprofil_halden.txt", type: "txt", parent: "identitaet", date: "22.10. 18:45", text: `HAFENBANK NORDELBE · Intranet · Geschäftspartner-Profil · Dokument IN-0384

Name:            Jonas Halden
Firma:           Halden Consullt GmbH
Anschrift:       Große Elbstraße 145, 22767 Hamburg
Geburtsdatum:    12.03.1979
Rolle:           Treuhänder / Nominee-Direktor für Kundengesellschaften
Betreuer:        Firmenkundenbereich, Team Hafen
[Foto: unscharf, Upload 2019]
Stand:           02.10.2026` },
    briefIda: { name: "entwurf_brief_ida.txt", type: "txt", parent: "privat", date: "31.10. 23:10", text: `Ida,

wenn du das liest, habe ich mich nicht gemeldet. Mach dir keine Sorgen um mich –
mach dir Sorgen um die, für die wir arbeiten.

Ich habe jemandem einen Zugang vorbereitet. Wer es schafft, bis ins Archiv zu kommen,
versteht, was ich verstanden habe.

H.` },
    notizH: { name: "notiz_H.enc", type: "txt", parent: "privat", date: "30.10. 07:55", lock: { code: "DONNERSTAG", side: "N3", target: "N3", prompt: "notiz_H.enc – Kennwort (Hinweis von Aris: „Der Tag, an dem ich H. treffe“):" }, text: `H. trifft V. immer am Morgen nach dem Aufsichtsrat. Nie an einem anderen Tag.
Jedes Mal dieselben Fragen: Wie weit bin ich? Was weiß ich über Anlage B?
H. = Holm? Dann wüsste die Auftraggeberin mehr als der Prüfer.` },
    kalender: { name: "kalender_aris.ics", type: "ics", parent: "docs", date: "01.11. 20:30" },
    kestrel1: { name: "kestrel_kai.jpg", type: "jpg", parent: "helm", date: "06.10. 22:14", image: "kestrel", meta: { Aufnahme: "06.10.2026 22:14", Ort: "Hamburg, Waltershof, Liegeplatz 47", Kommentar: "Eignerin laut Schiffsregister: Argos Shipping Ltd" } },
    helmNote: { name: "helm.txt", type: "txt", parent: "helm", date: "30.10. 22:15", text: `MS KESTREL · Eignerin Argos Shipping Ltd (Limassol)
Liegt immer genau dann in Hamburg, wenn Geld über Argos läuft.
Frachtpapiere? Für die Zahlungen „Fracht“ von Meridian an Argos gibt es keine.` },

    /* Bilder */
    harbour: { name: "harbour.jpg", type: "jpg", parent: "pics", date: "30.10. 21:58", image: "harbour", meta: { Kamera: "NX-500", Aufnahme: "30.10.2026 21:58", Kommentar: "TGllZ2VwbGF0eiA0Nw==" } },
    office: { name: "buero_aris.jpg", type: "jpg", parent: "pics", date: "29.10. 19:20", image: "office", meta: { Aufnahme: "29.10.2026 19:20", Ort: "Kanzlei Aris & Lund, 4. OG" } },
    bank: { name: "hafenbank_fassade.jpg", type: "jpg", parent: "pics", date: "28.10. 19:44", image: "bank", meta: { Aufnahme: "28.10.2026 19:44", Ort: "Hafenbank Nordelbe, Seiteneingang", Kommentar: "Wagen der Vorsitzenden steht hier" } },

    /* Audio */
    anruf: { name: "anruf_3010.wav", type: "wav", parent: "audio", date: "30.10. 19:52", audio: "anruf" },
    ida: { name: "sprachnachricht_ida.wav", type: "wav", parent: "audio", date: "02.11. 08:12", audio: "ida" },
    memo: { name: "memo_2810.wav", type: "wav", parent: "audio", date: "28.10. 21:30", audio: "memo" },

    /* Papierkorb */
    fragA: { name: "frag_A.bin", type: "frag", parent: "trash", date: "29.10. 18:02", frag: "2C9", text: "…die Zahlungsroute umfasst vier beteiligte Konten vom Ursprung bis zur letzten…" },
    fragB: { name: "frag_B.bin", type: "frag", parent: "trash", date: "29.10. 18:02", frag: "7F3", text: "…Anhang: Prüfregeln für Sicherungsprotokolle. Die vierte Stelle…" },
    fragC: { name: "frag_C.bin", type: "frag", parent: "trash", date: "29.10. 18:02", frag: "A11", text: "…Auftraggeber: Aufsichtsrat, Vorsitz M. Holm. Gesellschaften NORD-01, LUX-02…" },
    sms: { name: "sms_export_2810.txt", type: "txt", parent: "trash", when: "ch:4", date: "28.10. 19:30", side: "N11", text: `SMS · 28.10.2026 · 19:30 · von: Fahrdienst Hafenbank
An: Frau Holm
„Wagen steht 19:35 am Seiteneingang. Gute Fahrt.“` },
    alt: { name: "einkauf.txt", type: "txt", parent: "trash", date: "24.10. 10:00", text: "Milch · Brot · Batterien fürs Diktiergerät · Ida Geburtstagskarte (07.11.)" },

    /* wiederhergestellt (R4) */
    bericht: { name: "pruefbericht_entwurf.txt", type: "txt", parent: "restored", date: "29.10. 16:40", text: `PRÜFBERICHT (ENTWURF) · Sonderprüfung Corvane · Aris & Lund · Stand 29.10.2026

Auftraggeber: Hafenbank Nordelbe AG, Aufsichtsrat, Vorsitz M. Holm

1  Beteiligte Gesellschaften (Kürzel wie in LEDGER)
   NORD-01 Nordkap Handels GmbH · LUX-02 Luxor Capital · VELL-03 Vellum Trust ·
   MERC-04 Meridian Logistics · HALD-05 Halden Consult · SARN-06 Sarnia Holdings ·
   ARGO-07 Argos Shipping · CORV-08 Corvane Holding

2  Befund Zahlungsverkehr
   Die Zahlungsroute umfasst vier beteiligte Konten vom Ursprung bis zur letzten
   Zwischenstation. Das Ausschüttungskonto ist davon getrennt. Maßgeblich für die
   Reihenfolge ist der erste vollständige Durchlauf.
   Auffällig: Beträge knapp unter der internen Freigabeschwelle der Hafenbank,
   regelmäßige Abstände, keine Rechnungsreferenzen, Weiterleitung „Fracht“ ohne Frachtpapiere.

3  Gesellschafterstruktur
   Corvane gehört Sarnia, Sarnia gehört (als Nominee) dem Vellum Trust. Wer hinter dem Trust
   steht, ergibt sich aus dem Treuhandvertrag und seinen Anlagen.

ANHANG · Prüfregeln für Sicherungsprotokolle
   Sicherungsprotokolle bestehen aus Blöcken zu vier Hexadezimal-Zeichen.
   Regel: Die vierte Stelle ist die Summe der ersten drei Stellen mod 16.
   Weicht die vierte Stelle ab, ist der Block beschädigt; korrigiert wird die vierte Stelle.` },

    /* PRUEFUNG (Kapitel 3) */
    rechnungen: { name: "Rechnungen", type: "folder", parent: "pruefung" },
    handel: { name: "Handel", type: "folder", parent: "pruefung" },
    treuhand: { name: "Treuhand", type: "folder", parent: "pruefung" },
    berichte: { name: "Pruefberichte", type: "folder", parent: "pruefung" },
    abgleich: { name: "abgleich_final.enc", type: "txt", parent: "pruefung", date: "31.10. 21:05", lock: { code: "AR2026118", puzzle: "R10", target: "R10", prompt: "abgleich_final.enc – Kennwort: Referenznummer der einzigen stimmigen Rechnung" }, text: `ABGLEICH (H. A., 31.10.)

Fünf der sechs Rechnungen halten keiner Prüfung stand – sie wurden nachträglich erstellt,
um die Zahlungen zu decken. Nur der echte Handel Argos → Luxor ist sauber belegt.

Das Netz steht: Ursprung Nordkap → Meridian → Argos → Luxor → Ausschüttung an Corvane.
Corvane → Sarnia → Vellum → Stiftung Kestrel. Ich weiß jetzt, wo es endet.
Und ich glaube, ich weiß, wer es angefangen hat.` },
    deed: { name: "vellum_deed.txt", type: "txt", parent: "treuhand", date: "15.10. 11:20", text: `TREUHANDVERTRAG · VELLUM TRUST (Gibraltar) · Auszug

Trustee:        Halden Consult GmbH, Hamburg
Treugut:        sämtliche Anteile an der Sarnia Holdings Ltd (Guernsey), gehalten als Nominee
Begünstigt ist die in Anlage B genannte Stiftung.
Weisungen erteilt ausschließlich der Protektor der Stiftung.` },
    anlageB: { name: "anlage_b.txt", type: "txt", parent: "treuhand", date: "15.10. 11:21", text: `ANLAGE B zum Treuhandvertrag Vellum Trust

Begünstigte Stiftung:   ███████ ███████
Sitz:                   Vaduz
Registernummer:         FL-0002.413.587-4
Stifter/in:             ████████ ████
Protektor:              Halden Consult GmbH` },
    pb1: { name: "pb_kontrollen_zahlungsverkehr.txt", type: "txt", parent: "berichte", date: "03.07. 09:00", text: `HAFENBANK NORDELBE · Interne Revision · Bericht 2026/07

Zahlungsaufträge ab 50.000 EUR benötigen eine Zweitfreigabe (Vier-Augen-Prinzip).
Diese Schwelle ist eine bankinterne Regel. Unabhängig davon gilt die gesetzliche Pflicht
zur Verdachtsmeldung bei Anhaltspunkten für Geldwäsche – unabhängig vom Betrag.

Feststellung: Mehrere Firmenkunden reichen auffällig viele Aufträge knapp unterhalb
der Schwelle ein. Empfehlung: Muster-Auswertung im Quartal.` },
    pb2: { name: "pb_corvane_vorpruefung.txt", type: "txt", parent: "berichte", date: "20.08. 14:00", text: `VORPRÜFUNG CORVANE (H. A., 20.08.)

- Corvane selbst zahlt ordentlich: große Projektzahlungen, alle mit Vertrag. Keine Auffälligkeit.
- Halden Consult stellt monatliche Honorare – ordentlich belegt.
- Auffällig ist nicht, was groß ist. Auffällig ist, was sich wiederholt.` },
    pb3: { name: "pb_handel_argos.txt", type: "txt", parent: "berichte", date: "02.09. 16:30", text: `PRÜFNOTIZ HANDEL (H. A.)

Echter Handel zwischen Luxor und Argos existiert: Rechnung, Konnossement, Ware.
Zu den Zahlungen „Fracht“ Meridian → Argos und Argos → Luxor gibt es dagegen
weder Konnossemente noch Ladelisten.` },

    /* INQUISITION_PROTOCOL (Kapitel 4) */
    msgs: { name: "nachrichten", type: "folder", parent: "inquisition" },
    profile: { name: "profile", type: "folder", parent: "inquisition" },
    fragmente: { name: "audio_fragmente", type: "folder", parent: "inquisition" },
    protokoll: { name: "sitzungsprotokoll_2810.txt", type: "txt", parent: "inquisition", date: "28.10. 21:30", text: `HAFENBANK NORDELBE AG · Protokoll der Sitzung des Aufsichtsrats · 28.10.2026, 18:00–21:00

Teilnehmende: Margarete Holm (Vorsitzende), Dr. Kai Ehlers (stv. Vorsitzender),
              Renate Sohst, Tobias Wiegand, Dr. Lina Okoye; Gast: Vorstand Finanzen (TOP 3)

TOP 1  Protokoll der letzten Sitzung – genehmigt.
TOP 2  Bericht des Vorstands.
TOP 3  Quartalszahlen Q3 (Beginn 19:10).
       19:35–19:48 Sitzung unterbrochen; die Vorsitzende verlässt kurz den Raum.
       Fortsetzung 19:48 unter Leitung der Vorsitzenden.
TOP 4  Verschiedenes – Ende 21:00.

Protokoll: Büro des Aufsichtsrats` },
    hierarchie: { name: "hierarchie.lock", type: "txt", parent: "inquisition", date: "jetzt", lock: { code: "ORKAN", puzzle: "R11", target: "R11", prompt: "hierarchie.lock – Freigabewort (fünf Buchstaben):" }, text: `ORDNUNG ARCHON – bestätigt

1 Obolus   · Finanzielle Infrastruktur
2 Reede    · Logistische Infrastruktur
3 Kompass  · Informationsbeschaffung
4 Anker    · Exekutive Kontrolle
5 Nordstern · ARCHON-Kern

Niemand steht über Nordstern.` },
    nordstern: { name: "nordstern.enc", type: "txt", parent: "inquisition", date: "jetzt", lock: { code: "HOLM", puzzle: "R12", target: "R12", prompt: "nordstern.enc – Kennwort: Nachname von Nordstern" }, text: `VON: Nordstern  AN: Anker  ·  30.10.2026 08:02

Lasst den Prüfer weitermachen. Ich will wissen, wie weit man kommt.
Wenn er bei Anlage B ankommt, entscheiden wir.

– N.` },
    m1: { name: "MSG-01.eml", type: "imsg", parent: "msgs", msg: 0 }, m2: { name: "MSG-02.eml", type: "imsg", parent: "msgs", msg: 1 },
    m3: { name: "MSG-03.eml", type: "imsg", parent: "msgs", msg: 2 }, m4: { name: "MSG-04.eml", type: "imsg", parent: "msgs", msg: 3 },
    m5: { name: "MSG-05.eml", type: "imsg", parent: "msgs", msg: 4 }, m6: { name: "MSG-06.eml", type: "imsg", parent: "msgs", msg: 5 },
    p1: { name: "profil_zahlungsabwicklung.txt", type: "txt", parent: "profile", text: "Profil: Zahlungsabwicklung Nordkap. Führt wöchentliche Überweisungslisten. Handelt nur auf Freigabe. Deckname in Nachrichten: Obolus." },
    p2: { name: "profil_reederei_zypern.txt", type: "txt", parent: "profile", text: "Profil: Reederei-Kontakt Limassol (Argos). Organisiert Routen, Umschlag und Fracht. Deckname: Reede." },
    p3: { name: "profil_varga.txt", type: "txt", parent: "profile", text: "Profil: Dr. Felix Varga, VR-Präsident Corvane. Pflegt Kontakte zu Prüfern und Behörden, sammelt Informationen. Deckname: Kompass." },
    p4: { name: "profil_halden.txt", type: "txt", parent: "profile", text: "Profil: Jonas Halden, Halden Consult. Treuhänder, Nominee-Direktor, setzt Anweisungen um. Deckname: Anker." },
    p5: { name: "profil_aufsichtsratsbuero.txt", type: "txt", parent: "profile", text: "Profil: Büro des Aufsichtsrats der Hafenbank Nordelbe. Organisiert Sitzungen, Protokolle und Termine der Vorsitzenden." },
    f1: { name: "F1_2810_1941.wav", type: "wav", parent: "fragmente", audio: "f1", meta: { Aufnahmezeit: "28.10.2026 19:41", Dauer: "0:38" } },
    f2: { name: "F2_2810_1943.wav", type: "wav", parent: "fragmente", audio: "f2", meta: { Aufnahmezeit: "28.10.2026 19:43", Dauer: "0:21" } },
    f3: { name: "F3_2810_1958.wav", type: "wav", parent: "fragmente", audio: "f3", meta: { Aufnahmezeit: "28.10.2026 19:58", Dauer: "0:14" } },

    /* ARCHIVE_CORE (Kapitel 5) */
    master: { name: "master.proto", type: "proto", parent: "core", date: "01.11. 21:12" },
    origin: { name: "ARCHON_ORIGIN.enc", type: "origin", parent: "core", date: "01.11. 21:14" },
  };
  // Rechnungen, Frachtpapiere und Embargoliste als Dateien
  (AR.invoices || []).forEach((r, i) => { AR.nodes["inv" + i] = { name: r.id + ".pdf", type: "invoice", parent: "rechnungen", invoice: i, date: r.date.slice(0, 6) }; });
  (AR.freight || []).forEach((f, i) => { AR.nodes["kn" + i] = { name: f.id + "_konnossement.pdf", type: "freight", parent: "handel", freight: i, date: f.date.slice(0, 6) }; });
  AR.nodes.embargo = { name: "embargoliste_kaskarien.pdf", type: "embargo", parent: "handel", date: "01.07." };

  /* ---------- interne Nachrichten (R11) ---------- */
  AR.imsgs = [
    { id: "MSG-01", from: "Obolus", to: "Reede", date: "23.10.2026 18:02", subject: "Wochenlauf", text: "Die Überweisungen der Woche sind raus. Freigabe wie angewiesen; die Zahlungslisten liegen im Tresor." },
    { id: "MSG-02", from: "Reede", to: "Kompass", date: "24.10.2026 09:40", subject: "Umschlag", text: "Umschlag über Limassol abgeschlossen. Die Route entspricht deiner Vorgabe." },
    { id: "MSG-03", from: "Kompass", to: "Anker", date: "27.10.2026 16:15", subject: "Prüfer", text: "Der Prüfer fragt nach Anlage B. Ich beobachte ihn und melde jede Abweichung." },
    { id: "MSG-04", from: "Anker", to: "Nordstern", date: "28.10.2026 08:30", subject: "Bestätigung", text: "Treuhänder bestätigt. Die Anweisungen wurden umgesetzt. Ich erwarte deine nächste Freigabe." },
    { id: "MSG-05", from: "Nordstern", to: "Anker", date: "28.10.2026 22:10", subject: "–", text: "Niemand berichtet über mich. Alle berichten an mich." },
    { id: "MSG-06", from: "Obolus", to: "Reede", cc: "Anker", date: "30.10.2026 18:05", subject: "Kontrolle", text: "Die Zahlungsläufe wurden nach Freigabe durch Reede ausgeführt; die operative Anweisung kam über dessen Route." },
  ];

  /* ---------- Mails (24) ---------- */
  AR.mails = [
    /* Kapitel 1: eingeschränktes Postfach */
    { id: "spam", folder: "in", stage: 1, from: "Paketdienst Express", addr: "noreply@paket-zustellung.example", date: "03.11. 19:12", subject: "Ihre Sendung konnte nicht zugestellt werden",
      body: "Sehr geehrter Kunde,\n\nIhre Sendung 88-310-2 konnte nicht zugestellt werden. Bitte bestätigen Sie Ihre Adresse über den folgenden Link.\n\nIhr Zustellteam",
      headers: "Received: from mx3.paket-zustellung.example (203.0.113.7)\n        by mail.aris-lund.de; Tue, 03 Nov 2026 19:12:44 +0100\nDate: Tue, 03 Nov 2026 19:12:40 +0100\nFrom: noreply@paket-zustellung.example\nTo: h.aris@aris-lund.de\nSubject: Ihre Sendung konnte nicht zugestellt werden\nX-Archive-Key: c2FyZ2Fzc28=\nContent-Type: text/plain; charset=utf-8" },
    { id: "it", folder: "in", stage: 1, from: "IT-Service Aris & Lund", addr: "it@aris-lund.de", date: "02.11. 07:30", subject: "Ihr Archivzugang: eingeschränkter Modus",
      body: "Ihr Archivrechner ARIS-ARCHIVE-07 befindet sich im eingeschränkten Modus. Erweiterte Funktionen werden im Terminal mit einem Archivschlüssel freigegeben (Befehl: auth).",
      headers: "Received: from it.aris-lund.de by mail.aris-lund.de; Mon, 02 Nov 2026 07:30:01 +0100\nDate: Mon, 02 Nov 2026 07:30:00 +0100\nFrom: it@aris-lund.de" },
    { id: "news", folder: "in", stage: 1, from: "Hafenblatt", addr: "newsletter@hafenblatt.example", date: "03.11. 06:00", subject: "Hafenblatt am Morgen: Containerumschlag stabil",
      body: "Der Containerumschlag im Hamburger Hafen bleibt stabil. Außerdem: neue Liegeplätze in Waltershof, Kreuzfahrtsaison endet.",
      headers: "Received: from mail.hafenblatt.example by mail.aris-lund.de; Tue, 03 Nov 2026 06:00:12 +0100\nDate: Tue, 03 Nov 2026 06:00:00 +0100\nFrom: newsletter@hafenblatt.example\nList-Unsubscribe: <mailto:off@hafenblatt.example>" },
    { id: "ida1", folder: "in", stage: 1, from: "Ida Lund", addr: "i.lund@aris-lund.de", date: "02.11. 22:40", subject: "Wo bist du?",
      body: "Hendrik, du gehst seit gestern nicht ans Telefon. Ich habe deinen Archivrechner nicht angerührt, wie du gesagt hast. Bitte melde dich.\n\nIda",
      headers: "Received: from i-lund.aris-lund.de by mail.aris-lund.de; Mon, 02 Nov 2026 22:40:03 +0100\nDate: Mon, 02 Nov 2026 22:40:00 +0100\nFrom: i.lund@aris-lund.de" },
    /* ab Kapitel 2: Sicherung (R4) */
    { id: "s1", folder: "backup", stage: 2, from: "H. Aris", addr: "h.aris@aris-lund.de", date: "02.11. 08:00", subject: "Fwd: Sicherung Teil", attach: "teil_2C9.bin",
      body: "(automatische Weiterleitung aus dem Archivordner)\n\n---------- Weitergeleitete Nachricht ----------\nAm 29.10.2026 um 09:14 schrieb H. Aris:\n> Sicherung, Teil im Anhang." },
    { id: "s2", folder: "backup", stage: 2, from: "H. Aris", addr: "h.aris@aris-lund.de", date: "29.10. 11:02", subject: "Sicherung Teil", attach: "teil_A11.bin",
      body: "Sicherung, Teil im Anhang." },
    { id: "s3", folder: "backup", stage: 2, from: "H. Aris", addr: "h.aris@aris-lund.de", date: "01.11. 17:20", subject: "Fwd: Sicherung Teil", attach: "teil_7F3.bin",
      body: "(automatische Weiterleitung aus dem Archivordner)\n\n---------- Weitergeleitete Nachricht ----------\nAm 29.10.2026 um 16:40 schrieb H. Aris:\n> Sicherung, Teil im Anhang." },
    /* Posteingang */
    { id: "holm1", folder: "in", stage: 2, from: "Margarete Holm", addr: "m.holm@hafenbank-nordelbe.example", date: "12.06. 10:05", subject: "Ihr Auftrag",
      body: "Sehr geehrter Herr Aris,\n\nanbei der Prüfauftrag. Ich lege Wert auf absolute Vertraulichkeit. Bitte berichten Sie nur an mich, jeweils am Morgen nach unseren Sitzungen.\n\nM. Holm" },
    { id: "holm2", folder: "in", stage: 2, from: "Margarete Holm", addr: "m.holm@hafenbank-nordelbe.example", date: "27.10. 08:10", subject: "Wie weit sind Sie?",
      body: "Herr Aris,\n\nwie weit sind Sie mit der Gesellschafterstruktur? Haben Sie die Anlagen zum Treuhandvertrag bereits gesehen?\n\nM. H." },
    { id: "ida2", folder: "in", stage: 2, from: "Ida Lund", addr: "i.lund@aris-lund.de", date: "30.10. 20:15", subject: "Nach deinem Anruf",
      body: "Du hast am Telefon so seltsam geklungen. Und was war das für ein Pfeifen in der Leitung? Ich habe die Aufnahme in dein Audio-Archiv gelegt, wie du wolltest.\n\nI." },
    { id: "brenner1", folder: "in", stage: 2, from: "Mats Brenner", addr: "m.brenner@hanse-rundschau.example", date: "21.10. 17:45", subject: "Treffen?",
      body: "Herr Aris, ich recherchiere seit Monaten zu Zahlungsströmen über Malta und Zypern. Ich glaube, wir suchen dasselbe. Treffen wir uns?\n\nMats Brenner, Hanse-Rundschau" },
    { id: "brenner2", folder: "in", stage: 3, from: "Mats Brenner", addr: "m.brenner@hanse-rundschau.example", date: "29.10. 22:05", subject: "Meine Unterlagen", attach: "brenner_notizen.zip",
      body: "Wie besprochen meine Notizen, verschlüsselt. Das Kennwort ist der Name dessen, wofür Sie arbeiten – in Großbuchstaben, ohne Zusatz.\n\nM. B." },
    { id: "halden", folder: "in", stage: 3, from: "Jonas Halden", addr: "j.halden@halden-consult.example", date: "15.10. 11:30", subject: "Unterlagen Vellum",
      body: "Sehr geehrter Herr Aris,\n\nwie von Frau Holm angekündigt, anbei der Treuhandvertrag mit Anlage B (Ordner PRUEFUNG/Treuhand). Die Namen sind aus Datenschutzgründen geschwärzt.\n\nJ. Halden" },
    { id: "varga", folder: "in", stage: 3, from: "Dr. Felix Varga", addr: "f.varga@corvane.example", date: "22.10. 09:50", subject: "Ihre Fragen",
      body: "Herr Aris, Ihre Fragen zur Gesellschafterstruktur beantworte ich gern persönlich. Schriftlich nur über Frau Holm.\n\nF. Varga" },
    { id: "compliance", folder: "in", stage: 3, from: "Hafenbank Compliance", addr: "compliance@hafenbank-nordelbe.example", date: "05.08. 14:00", subject: "Information: interne Freigabeschwellen",
      body: "Zur Information für die Sonderprüfung: Die Hafenbank verlangt für Zahlungsaufträge ab 50.000 EUR eine Zweitfreigabe. Das ist eine interne Kontrollschwelle; die gesetzliche Verdachtsmeldepflicht gilt unabhängig vom Betrag." },
    { id: "registry", folder: "in", stage: 3, from: "Guernsey Registry", addr: "notices@registry.example", date: "16.08. 09:00", subject: "Change of name: Sarnia Maritime Ltd",
      body: "Notice: With effect from 15 August 2026, Sarnia Maritime Ltd (No. 66812) changed its name to Sarnia Holdings Ltd." },
    { id: "hafen", folder: "in", stage: 3, from: "Hafen-Portal", addr: "service@hafenportal.example", date: "01.10. 09:00", subject: "Ihr Zugang zum Hafen-Intranet",
      body: "Ihr Lesezugang zum Hafen-Intranet ist eingerichtet: Schiffspositionen (AIS), Liegeplätze und Geräuschkarte der Anleger. Adresse im Browser: hafen.intern" },
    { id: "lund", folder: "in", stage: 2, from: "Ida Lund", addr: "i.lund@aris-lund.de", date: "26.10. 12:00", subject: "Partnerrunde",
      body: "Partnerrunde verschoben auf Freitag. Und bitte: Hör auf, nachts allein im Büro zu sitzen." },
    { id: "spam2", folder: "in", stage: 2, from: "Gewinnspiel-Team", addr: "win@lucky.example", date: "31.10. 03:12", subject: "Sie haben gewonnen!",
      body: "Herzlichen Glückwunsch! Klicken Sie hier, um Ihren Preis abzuholen.",
      headers: "Received: from unknown (198.51.100.23) by mail.aris-lund.de; Sat, 31 Oct 2026 03:12:09 +0100\nDate: Sat, 31 Oct 2026 03:12:00 +0100\nFrom: win@lucky.example" },
    { id: "bankit", folder: "in", stage: 2, from: "Hafenbank IT", addr: "it@hafenbank-nordelbe.example", date: "15.06. 10:00", subject: "Zugang Prüfer-Arbeitsplatz",
      body: "Ihr Archivrechner wird über unsere Infrastruktur betrieben (Gruppe wg-nordelbe). Bei Fragen wenden Sie sich an das Büro des Aufsichtsrats." },
    /* Gesendet */
    { id: "sent1", folder: "sent", stage: 2, from: "an: Ida Lund", addr: "gesendet", date: "31.10. 23:12", subject: "Falls ich mich nicht melde",
      body: "Ida, falls ich mich nicht melde: Rühr den Archivrechner nicht an. Es wird jemand kommen, der weiß, was er tut. H." },
    { id: "sent2", folder: "sent", stage: 2, from: "an: Mats Brenner", addr: "gesendet", date: "28.10. 23:40", subject: "AW: Treffen?",
      body: "Herr Brenner, ja. Aber nicht telefonisch, nicht über die Kanzlei. Ich schicke Ihnen, was ich habe, wenn es so weit ist. H. Aris" },
    { id: "sent3", folder: "sent", stage: 2, from: "an: Margarete Holm", addr: "gesendet", date: "28.10. 09:05", subject: "Anlage B",
      body: "Frau Holm, für den Abschluss brauche ich die ungeschwärzte Anlage B zum Vellum-Treuhandvertrag. Ohne sie bleibt der wirtschaftlich Berechtigte offen. H. A." },
    { id: "kalinfo", folder: "in", stage: 2, from: "Kalender", addr: "kalender@aris-lund.de", date: "29.10. 07:00", subject: "Erinnerung: Termin „H.“ 08:00",
      body: "Erinnerung an Ihren Termin „H.“ heute um 08:00 Uhr. (Ihr Kalender liegt unter Dokumente/kalender_aris.ics)" },
  ];

  /* ---------- Kalender (N3) ---------- */
  AR.calendar = [
    { day: "Mi 16.09.", time: "18:00", title: "Aufsichtsrat Hafenbank (Holm berichtet)", place: "Hafenbank" },
    { day: "Do 17.09.", time: "08:00", title: "H.", place: "Café am Kai" },
    { day: "Mi 14.10.", time: "18:00", title: "Aufsichtsrat Hafenbank", place: "Hafenbank" },
    { day: "Do 15.10.", time: "08:00", title: "H.", place: "Café am Kai" },
    { day: "Di 27.10.", time: "14:00", title: "Varga, Corvane (abgesagt)", place: "–", cancelled: true },
    { day: "Mi 28.10.", time: "18:00", title: "Aufsichtsrat Hafenbank", place: "Hafenbank" },
    { day: "Do 29.10.", time: "08:00", title: "H.", place: "Café am Kai" },
    { day: "Fr 30.10.", time: "19:30", title: "Ida anrufen", place: "–" },
    { day: "So 01.11.", time: "21:30", title: "Archiv schließen. Gehen.", place: "–" },
  ];

  /* ---------- Notizbuch ---------- */
  AR.notebook = [
    { title: "Seite 1 – Grundsätze", text: "Nicht dem Geld folgen. Dem Muster.\nWer berichtet an wen?\nWer fragt, wie weit ich bin?" },
    { title: "Seite 2 – Kontakte", text: "Ida (Kanzlei) · Mats Brenner (Hanse-Rundschau) · Hafen-Portal: hafen.intern\nNordsuche: Kanzlei-Wissensdatenbank im Browser – für alles, was ich nicht im Kopf habe." },
    { title: "Seite 3 – Ablage", text: "Was ich am Hafen gesehen habe, liegt in einem Ordner unter privat.\nKennwort, damit ich es nicht vergesse:\n\n        8 – 5 – 12 – 13\n\n(Stellen im Alphabet.)" },
    { title: "Seite 4 – H.", text: "Wer ist H.? Meine Notiz dazu ist verschlüsselt.\nKennwort: der Wochentag, an dem ich H. treffe. Steht im Kalender." },
    { title: "Seite 5 – Protokolle", text: "Masterprotokoll kaputt? Die Regeln stehen im Anhang meines Prüfberichts.\nWenn der Bericht gelöscht ist: Papierkorb, drei Teile." },
  ];

  /* ---------- Audio ---------- */
  AR.audio = {
    anruf: { title: "Anruf mit Ida · 30.10. 19:52", dur: 160, transcript: [
      [0, "Aris: Ida? Ich bin's. Nein, mir geht's gut. Ich sitze noch im Büro."],
      [8, "Ida: Um diese Uhrzeit? Hendrik, es ist fast acht."],
      [13, "Aris: Ich weiß. Ich wollte nur deine Stimme hören."],
      [18, "Ida: Das sagst du sonst nie."],
      [24, "Ida: Du klingst müde, Hendrik."],
      [28, "Aris: Bin ich auch. Die Sache mit der Bank … sie ist größer, als ich dachte. Ich kann dir am Telefon nicht mehr sagen."],
      [40, "Aris: Wenn mir was passiert – hör genau hin, nicht nur auf mich."],
      [47, "Ida: Was soll das heißen, wenn dir was passiert?"],
      [52, "Aris: Nichts. Nur so ein Satz. Vergiss es wieder."],
      [58, "Ida: Hendrik."],
      [60, "Aris: Warte kurz, ich muss … einen Moment."],
      [70, "[1:10–1:30 · Rauschen, gleichmäßiger hoher Pfeifton]"],
      [90, "Ida: Hallo? Was war das? Hendrik?"],
      [95, "Aris: Nur die Leitung. Alles gut."],
      [99, "Ida: Das klang nicht nach Leitung. Das klang, als hätte jemand gepfiffen."],
      [106, "Aris: Leg die Aufnahme in mein Archiv, ja? Die automatische, die dein Telefon macht."],
      [114, "Ida: Warum?"],
      [116, "Aris: Weil ich es dir irgendwann erklären will. Nicht heute."],
      [123, "Ida: Du machst mir Angst."],
      [127, "Aris: Ich weiß. Tut mir leid."],
      [134, "Aris: Geh schlafen, Ida. Ich mach hier noch zu."],
      [139, "Ida: Ruf mich morgen an. Versprochen?"],
      [143, "Aris: Ich melde mich."],
      [147, "[Aufgelegt]"]], spectro: "VELLUM" },
    ida: { title: "Sprachnachricht von Ida · 02.11. 08:12", dur: 20, reverse: true, src: "audio/ida_rueckwaerts.mp3", srcRev: "audio/ida_vorwaerts.mp3",
      forward: "»…thcäirhcaN eseid hcsöl dnU .ow ,thcin garF .rehcis tsi rE …« (unverständlich, klingt wie rückwärts gesprochen)",
      backward: "„Hendrik, ich bin's. … Nein – wer auch immer das hier abhört: Er ist sicher. Frag nicht, wo. Und lösch diese Nachricht.“" },
    memo: { title: "Diktat · 28.10. 21:30", dur: 34, src: "audio/memo_2810.mp3", transcript: [
      [0, "Aris: Notiz, achtundzwanzigster Oktober, halb zehn."],
      [4, "Aris: Holm fragt jedes Mal nach Anlage B. Woher weiß sie, dass es eine Anlage B gibt? Ich habe ihr das nie gesagt."],
      [16, "Aris: Und warum immer am Morgen nach der Sitzung? Sie will nicht wissen, was ich gefunden habe. Sie will wissen, wie weit ich bin."],
      [29, "Aris: Ende der Notiz."]] },
    f1: { title: "Fragment F1 · Aufnahmezeit 28.10. 19:41", dur: 35, transcript: [
      [0, "[gedämpftes Stimmengemurmel hinter einer Tür]"],
      [2, "Stimme (verzerrt): Ich habe zehn Minuten. Drinnen reden sie noch über die Quartalszahlen."],
      [8, "Stimme: Sag Anker, er soll den Prüfer laufen lassen."],
      [15, "Stimme: Nein. Er soll nichts unternehmen. Ich will wissen, wie weit er kommt."],
      [24, "Stimme: Wenn er bei Anlage B ankommt, entscheide ich. Nicht du."]] },
    f2: { title: "Fragment F2 · Aufnahmezeit 28.10. 19:43", dur: 20, transcript: [
      [0, "[Wind, Wasser an einer Kaimauer, Möwen, ein langes Schiffshorn]"],
      [9, "Stimme (verzerrt): … nicht hier draußen."],
      [12, "Stimme: Ruf mich morgen an. Vor acht."]], place: "Geräuschkarte im Hafen-Intranet: typisch für den Anleger Hafenbank / Kehrwieder" },
    f3: { title: "Fragment F3 · Aufnahmezeit 28.10. 19:58", dur: 15, transcript: [
      [0, "[Glockenschlag]"],
      [6, "Stimme (verzerrt): Gleich acht."],
      [8, "Stimme: Ich muss wieder rein."],
      [10, "[Schritte auf Stein, eine schwere Tür]"]] },
  };

  /* ---------- Masterprotokoll (R14) ---------- */
  AR.proto = { blocks: ["3A2F", "51C2", "9042", "B230", "778B", "0E53", "C1DF", "442A"], fixes: { 3: "904D", 5: "7786", 7: "C1DA" } };

  /* ---------- Nachrichten von Aris ---------- */
  AR.aris = {
    r13: "Wenn du das lesen kannst, bist du bereits Teil der Untersuchung. Du hast zwei Möglichkeiten. Aber du musst verstehen, was du zerstörst, bevor du dich entscheidest. Das Masterprotokoll ist beschädigt – ich musste es so lassen. Du kennst die Regeln.",
  };

  /* ---------- Enden ---------- */
  AR.endings = {
    A1: { title: "DIE WAHRHEIT", kind: "good", text: [
      "Die Staatsanwaltschaft Hamburg nimmt die Beweise entgegen. Die Kette ist geschlossen: Geld, Firmen, Stiftung, Personen.",
      "Margarete Holm wird festgenommen. Die Hafenbank stellt sich hinter die Ermittler.",
      "Mats Brenner veröffentlicht drei Tage später – unabhängig bestätigt, nicht mehr zu stoppen.",
      "Die Rückverfolgung hat dich erreicht. Aber du bist jetzt Zeugin bzw. Zeuge – und geschützt.",
      "Eine Woche später steht Hendrik Aris vor der Tür seiner Kanzlei."] },
    A2: { title: "DIE HALBE WAHRHEIT", kind: "mixed", text: [
      "Die Beweise gehen an die Staatsanwaltschaft. Holm tritt „aus persönlichen Gründen“ zurück.",
      "Doch die Kette hat Lücken. Die Verteidigung zerlegt sie Stück für Stück, die Anklage scheitert.",
      "Deine Identität ist bekannt. Aris bleibt verschwunden."] },
    B1: { title: "DIE AUSLÖSCHUNG", kind: "mixed", text: [
      "ARCHON-WORM läuft. Konten werden eingefroren, Treuhandverträge widerrufen, Server gelöscht.",
      "Weil du das ganze Netz kanntest, trifft der Wurm jede Ebene. ARCHON zerfällt vollständig.",
      "Die Beweise sind weg. Niemand wird je angeklagt. Du bleibst unerkannt.",
      "Wochen später liegt eine Postkarte ohne Absender im Briefkasten. Ein Frachter, ein Liegeplatz, kein Text."] },
    B2: { title: "DER SCHATTEN", kind: "bad", text: [
      "ARCHON-WORM trifft, was du kanntest – nicht mehr.",
      "ARCHON verliert ein Netz und baut ein neues. Nordstern bleibt im Amt.",
      "Du bleibst unerkannt. Aber du weißt, dass es weitergeht."] },
    FAIL: { title: "SYSTEM FAILURE", kind: "bad", text: ["ARCHIVE PURGED · ALL EVIDENCE DESTROYED · SESSION TERMINATED", "Die Rückverfolgung war schneller. Die verbleibenden Daten wurden unwiderruflich gelöscht."] },
  };
})();
