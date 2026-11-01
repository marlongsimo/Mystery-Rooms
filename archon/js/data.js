/*
 * DAS ARCHON-PROTOKOLL – Datensätze (Firmen, Register, Rechnungen, Handel)
 * Alle Firmen, Personen, Nummern und IBANs sind frei erfunden. IBANs sind formal aufgebaut
 * (Ländercode + zwei Prüfziffern + Kontokennung), aber ungültig.
 * Die 84 Buchungen stehen in ledger.js (erzeugt von tools/gen_ledger.py).
 */
window.AR = window.AR || {};
(() => {
  "use strict";

  /* ---------- Firmen (Register im Intranet, Profile in LEDGER) ---------- */
  AR.firms = {
    "NORD-01": {
      name: "Nordkap Handels GmbH", seat: "Hamburg", address: "Am Sandtorkai 12, 20457 Hamburg", reg: "HRB 148220 (Amtsgericht Hamburg)",
      vat: "DE318442907", iban: "DE42 2105 0170 0048 1173 05", founded: "2014", officers: "Geschäftsführer: Ole Brandes",
      owners: "Gesellschafterin: Corvane Holding AG (100 %)", history: ["2014 Gründung, Sitz seit Gründung Am Sandtorkai 12", "2021 Übernahme durch Corvane Holding AG"],
      business: "Großhandel mit Schiffsausrüstung. Hausbank: Hafenbank Nordelbe.",
    },
    "LUX-02": {
      name: "Luxor Capital S.à r.l.", seat: "Luxemburg", address: "12, Rue de l’Eau, L-1449 Luxembourg", reg: "RCS Luxembourg B231774",
      vat: "LU31488207", iban: "LU05 0141 4400 7720 1590", founded: "2019", officers: "Gérant: Halden Consult GmbH (Hamburg)",
      owners: "Associé unique: Corvane Holding AG", history: ["2019 Gründung", "keine Mitarbeitenden gemeldet"],
      business: "Beteiligungsverwaltung, Handel mit Hafen- und Schiffsbedarf.",
    },
    "VELL-03": {
      name: "Vellum Trust", seat: "Gibraltar", address: "Suite 4, 57 Line Wall Road, Gibraltar", reg: "kein Registereintrag (Trust)",
      vat: "–", iban: "– (kein Konto in LEDGER)", founded: "2018", officers: "Trustee: Halden Consult GmbH",
      owners: "Begünstigte: siehe Treuhandvertrag", history: ["2018 errichtet", "hält als Nominee alle Anteile der Sarnia Holdings Ltd"],
      business: "Treuhandvermögen ohne eigenen Geschäftsbetrieb.",
    },
    "MERC-04": {
      name: "Meridian Logistics Ltd", seat: "Valletta", address: "81, Triq il-Merkanti, Valletta VLT 1170, Malta", reg: "MBR C 88412",
      vat: "MT21048833", iban: "MT17 VALL 2201 3000 0000 4012 8873 1", founded: "2020", officers: "Director: Paul Camilleri (Nominee-Dienstleister)",
      owners: "Shareholder: Sarnia Holdings Ltd", history: ["2020 Gründung", "Sitz bei einem Firmendienstleister, keine Lagerflächen"],
      business: "Logistik und Speditionsvermittlung.",
    },
    "HALD-05": {
      name: "Halden Consult GmbH", seat: "Hamburg", address: "Große Elbstraße 145, 22767 Hamburg", reg: "HRB 151907 (Amtsgericht Hamburg)",
      vat: "DE327118650", iban: "DE63 2005 0550 1281 9944 72", founded: "2016", officers: "Geschäftsführer: Jonas Halden",
      owners: "Gesellschafter: Jonas Halden (100 %)", history: ["2016 Gründung", "Treuhand-, Direktoren- und Verwaltungsdienste"],
      business: "Treuhand- und Verwaltungsdienstleistungen.",
    },
    "SARN-06": {
      name: "Sarnia Holdings Ltd", seat: "Guernsey", address: "Les Banques, St Peter Port, Guernsey GY1 1BZ", reg: "Guernsey Registry 66812",
      vat: "–", iban: "GG31 4021 0000 6681 2007 41", founded: "2017", officers: "Director: Halden Consult GmbH",
      owners: "Shareholder: Vellum Trust (Nominee, 100 %)", history: ["2017 Gründung als „Sarnia Maritime Ltd“", "15.08.2026 Umfirmierung in „Sarnia Holdings Ltd“"],
      business: "Zwischenholding.",
    },
    "ARGO-07": {
      name: "Argos Shipping Ltd", seat: "Limassol", address: "28 Spyrou Kyprianou Ave, 3070 Limassol, Zypern", reg: "HE 401228",
      vat: "CY10401228X", iban: "CY88 0050 0221 0000 0022 1144 7890", founded: "2019", officers: "Director: Andreas Ioannou",
      owners: "Shareholder: Sarnia Holdings Ltd", history: ["2019 Gründung", "Eignerin des Frachters MS KESTREL (IMO 9381277)"],
      business: "Reederei, Charter und Fracht.",
    },
    "CORV-08": {
      name: "Corvane Holding AG", seat: "Zug", address: "Bahnhofstrasse 21, 6300 Zug, Schweiz", reg: "CHE-412.883.019",
      vat: "CHE-412.883.019 MWST", iban: "CH29 0078 7000 0912 4410 3", founded: "2012", officers: "Präsident des Verwaltungsrats: Dr. Felix Varga",
      owners: "Aktionärin: Sarnia Holdings Ltd (100 %)", history: ["2012 Gründung", "Kundin der Hafenbank Nordelbe seit 2015"],
      business: "Holding für Hafen- und Logistikbeteiligungen.",
    },
  };

  /* Ausländische Register: Abfrage nur über die Registernummer (R9) */
  AR.kestrel = {
    number: "FL-0002.413.587-4",
    digits: "00024135874",
    name: "Stiftung Kestrel", seat: "Vaduz, Liechtenstein", type: "Privatnützige Stiftung", founded: "11.04.2018",
    founder: "███████ ████ (geschwärzt)", protector: "Halden Consult GmbH, Hamburg", purpose: "Verwaltung von Familienvermögen",
  };

  /* ---------- Rechnungen (PRUEFUNG/Rechnungen) ---------- */
  AR.invoices = [
    { id: "RE-MER-0412", tx: "TX-1017", issuerKey: "MERC-04", toKey: "NORD-01", issuer: "Meridian Logistics Ltd", issuerAddr: "81, Triq il-Merkanti, Valletta VLT 1170", issuerVat: "MT21048833",
      to: "Nordkap Handels GmbH", toAddr: "Am Sandtorkai 12, 20457 Hamburg", date: "05.10.2026", item: "Warenvorschuss lt. Rahmenvereinbarung, Ihre Zahlung vom 06.10.", net: "48.500,00 EUR" },
    { id: "RE-ARG-0233", tx: "TX-1019", issuerKey: "ARGO-07", toKey: "MERC-04", issuer: "Argos Shipping Ltd", issuerAddr: "28 Spyrou Kyprianou Ave, 3070 Limassol", issuerVat: "CY10401228X",
      to: "Meridian Logistics Ltd", toAddr: "81, Triq il-Merkanti, Valletta VLT 1170", date: "12.10.2026", item: "Fracht Valletta–Limassol, bezahlt am 07.10.", net: "47.969,50 EUR" },
    { id: "RE-NOR-1180", tx: "TX-1042", toKey: "NORD-01", issuer: "Spedition Kühl GmbH & Co. KG", issuerAddr: "Ellerholzdamm 30, 20457 Hamburg", issuerVat: "DE241773105",
      to: "Nordkap Handels GmbH", toAddr: "Kehrwieder 4, 20457 Hamburg", date: "16.10.2026", item: "Lagerkosten Oktober, Zahlung am 19.10.", net: "530,00 EUR" },
    { id: "RE-LUX-0077", tx: "TX-1060", toKey: "LUX-02", issuer: "Fiduciaire Moselle S.A.", issuerAddr: "4, Route d’Esch, L-1470 Luxembourg", issuerVat: "LU20381164",
      to: "Luxor Capital S.à r.l.", toAddr: "12, Rue de l’Eau, L-1449 Luxembourg", toVat: "LU314882071", date: "20.10.2026", item: "Buchhaltung Oktober, Zahlung am 23.10.", net: "2.350,00 EUR" },
    { id: "RE-SAR-0019", tx: "TX-1041", toKey: "SARN-06", issuer: "Guernsey Registry Services", issuerAddr: "PO Box 451, St Peter Port, GY1 3HS", issuerVat: "–",
      to: "Sarnia Maritime Ltd", toAddr: "Les Banques, St Peter Port, GY1 1BZ", date: "14.10.2026", item: "Änderungsmeldung Direktor, Zahlung am 16.10.", net: "745,00 EUR" },
    { id: "AR-2026-118", tx: "TX-1046", issuerKey: "ARGO-07", toKey: "LUX-02", issuer: "Argos Shipping Ltd", issuerAddr: "28 Spyrou Kyprianou Ave, 3070 Limassol", issuerVat: "CY10401228X",
      to: "Luxor Capital S.à r.l.", toAddr: "12, Rue de l’Eau, L-1449 Luxembourg", toVat: "LU31488207", date: "16.10.2026", item: "Seefracht Hamburg–Limassol, Konnossement KN-2210, Zahlung am 19.10.", net: "12.400,00 EUR" },
  ];

  /* ---------- Handel: Frachtpapiere und Embargoliste (PRUEFUNG/Handel) ---------- */
  AR.freight = [
    { id: "KN-2071", ship: "MS ARGOS STAR", date: "31.08.2026", from: "Hamburg", to: "Limassol", shipper: "Luxor Capital S.à r.l.", consignee: "Argos Shipping Ltd", hs: "8431 49", goods: "Ersatzteile für Hafenkräne", booked: "verbucht" },
    { id: "KN-2210", ship: "MS ARGOS STAR", date: "15.10.2026", from: "Hamburg", to: "Limassol", shipper: "Luxor Capital S.à r.l.", consignee: "Argos Shipping Ltd", hs: "7308 90", goods: "Stahlkonstruktionen (Kaianlagen)", booked: "verbucht" },
    { id: "KN-2251", ship: "MS ARGOS STAR", date: "26.10.2026", from: "Hamburg", to: "Limassol", shipper: "Luxor Capital S.à r.l.", consignee: "Argos Shipping Ltd", hs: "8483 40", goods: "Getriebe für Förderanlagen", booked: "verbucht" },
    { id: "KN-2266", ship: "MS ARGOS STAR", date: "27.10.2026", from: "Hamburg", to: "Limassol", shipper: "Luxor Capital S.à r.l.", consignee: "Argos Shipping Ltd", hs: "9405 40", goods: "Hafenbeleuchtung", booked: "verbucht" },
    { id: "KN-2299", ship: "MS KESTREL", date: "09.10.2026", from: "Hamburg (Liegeplatz 47)", to: "Limassol, Weiterleitung Port Kaskar (Republik Kaskarien)", shipper: "Meridian Logistics Ltd", consignee: "Argos Shipping Ltd", hs: "8526 91", goods: "Funknavigationsgeräte", booked: "nicht verbucht" },
  ];
  AR.embargo = {
    title: "Sanktionsverordnung Republik Kaskarien – Warenliste (FIKTIV, Spielwelt)",
    note: "Die Ausfuhr der folgenden Waren in die Republik Kaskarien ist verboten. Maßgeblich sind die ersten vier Ziffern der Warennummer.",
    rows: [
      ["K-1", "Waffen und Munition", "93xx"],
      ["K-2", "Chemische Grundstoffe", "2812, 2853"],
      ["K-3", "Navigations- und Funktechnik", "8526"],
      ["K-4", "Luftfahrzeugteile", "8803"],
      ["K-5", "Verschlüsselungstechnik", "8543"],
    ],
  };
  AR.ais = [
    ["MS KESTREL", "IMO 9381277", "02.10.–04.10.", "Hamburg, Waltershof, Liegeplatz 47"],
    ["MS KESTREL", "IMO 9381277", "06.10.–09.10.", "Hamburg, Waltershof, Liegeplatz 47"],
    ["MS KESTREL", "IMO 9381277", "10.10.–17.10.", "auf See (Ärmelkanal → Mittelmeer)"],
    ["MS KESTREL", "IMO 9381277", "20.10.–23.10.", "Limassol, New Port"],
    ["MS ARGOS STAR", "IMO 9265011", "29.08.–31.08.", "Hamburg, Burchardkai"],
    ["MS ARGOS STAR", "IMO 9265011", "14.10.–15.10.", "Hamburg, Burchardkai"],
  ];
})();
