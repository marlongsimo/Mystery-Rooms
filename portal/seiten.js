/*
 * CASE UNLOCKED – Texte für Spielseiten und Themenseiten (Quelle für tools/build-site.js)
 * Kompakt: sichtbar sind nur Einleitung und Kurzangaben, Längeres steht in aufklappbaren Abschnitten.
 * Keine Spoiler. Nach Änderungen: node tools/build-site.js
 */
window.MR_SEITEN = {
  /* Kurztexte je Spiel: intro (sichtbar), wen / team / tipp (drei Kurzzeilen), mehr (aufklappbar) */
  spiele: {
    "hotel-nocturne": {
      intro: "Ein klassischer Escape Room in sieben Räumen: Rezeption, Zimmer 217, Gepäcklager, Archiv, Überwachung, Keller und Büro, jeder mit vier Blickrichtungen.",
      wen: "Für alle, die Räume absuchen, Gegenstände kombinieren und Schlösser öffnen wollen. Gut für den Einstieg, mit Tiefe für Erfahrene.",
      team: "Allein oder mit bis zu vier Personen, Rucksack und Akte teilt ihr.",
      tipp: "Mit Ton spielen. Das Hotel hat mehr zu sagen, als man sieht.",
      mehr: "21 Rätsel führen tiefer in die Geschichte des Hauses: Gästebücher, Briefe und Notizen, Zahlenschlösser, versteckte Hinweise und Dinge, die man erst im Dunkeln sieht. Gegenstände nimmst du in die Hand, drehst und kombinierst sie.",
    },
    "sektor-9": {
      intro: "Ein Escape Room in 3D in einem Bunker aus dem Kalten Krieg: fünf Abschnitte, Tonbänder, Schaltbücher und eine Entscheidung mit drei möglichen Enden.",
      wen: "Für alle, die dichte Atmosphäre, eine starke Geschichte und Technik-Rätsel mögen.",
      team: "Allein oder mit bis zu vier Personen, mit Funk im Spiel. Manches gelingt am besten zu zweit gleichzeitig.",
      tipp: "Kopfhörer auf, Licht aus.",
      mehr: "Von der Verteilerhalle über Personal- und Forschungstrakt bis zur Sicherheitszentrale setzt du zusammen, was in der letzten Nacht vor der Versiegelung 1987 geschah. Die Entscheidung am Ende trefft ihr im Team gemeinsam.",
    },
    "der-letzte-fall": {
      intro: "Ein Krimi-Escape-Room im Theater: fünf Bereiche, 15 Rätsel und die Ermittlungswand eines verschwundenen Kommissars, an der du selbst weiterarbeitest.",
      wen: "Für alle, die lieber ermitteln als Schlösser knacken: Spuren lesen, Widersprüche finden, Schlüsse ziehen.",
      team: "Allein oder mit bis zu vier Personen, die Wand teilt ihr.",
      tipp: "Nicht jeder Faden an der Wand ist richtig.",
      mehr: "Spuren, Aussagen und Dokumente heftest du an die Pinnwand, bestätigst oder widerlegst die Fäden des Kommissars und baust deine eigene Beweisführung. Fünf Geheimnisse warten darauf, entdeckt zu werden.",
    },
    "deadline": {
      intro: "Ein digitales Escape Game auf einem fremden Computer: Mails, Chats, Kalender, Protokolle und ein Terminal. Und eine Löschroutine, die in 100 Minuten alles vernichtet.",
      wen: "Für alle, die gern in Datenspuren stöbern und aus Texten, Zeitstempeln und Codes Schlüsse ziehen.",
      team: "Allein oder mit bis zu vier Personen. Vier Spuren lassen sich gut aufteilen.",
      tipp: "Am besten am Computer oder Tablet spielen.",
      mehr: "Nach einem kurzen Einstieg öffnen sich vier Ermittlungsspuren in beliebiger Reihenfolge. Was du am Ende mit den Beweisen tust, entscheidest du. Sechs Enden sind möglich.",
    },
    "archon": {
      intro: "Der schwerste Fall bei Case Unlocked: ein digitaler Thriller für eine Person, 120 Minuten, Geldströme durch acht Firmen und eine Rückverfolgung im Nacken.",
      wen: "Für Erfahrene, die eine echte Herausforderung suchen.",
      team: "Bewusst für eine Person.",
      tipp: "Computer oder Tablet im Querformat, Notizzettel daneben.",
      mehr: "Du prüfst Rechnungen und Frachtpapiere, wertest Tonaufnahmen aus und findest heraus, wer hinter ARCHON steckt. Eine eingebaute Wissensdatenbank erklärt Begriffe, ohne Lösungen zu verraten. Pause ist jederzeit möglich.",
    },
    "krimidinner-eichenfels": {
      intro: "Ein Galadinner in einer Sternwarte im Thüringer Wald, ein Professor, der um 22 Uhr die Wahrheit erzählen will, und ein Unwetter, das das Haus abschneidet.",
      wen: "Ideal als erstes Krimidinner, auch für kleinere Runden ab vier Personen.",
      team: "4–10 Personen am Tisch, die Spielleitung spielt mit.",
      tipp: "Ein Grundriss des Hauses hilft beim Ordnen der Alibis.",
      mehr: "Bis zu zehn Figuren mit Geheimnissen, drei Ermittlungsrunden und ein Finale. Rollen per Handy oder ausgedruckt, Gastgeberheft mit Ablauf und Vorlesetexten.",
    },
    "krimidinner-silberkamm": {
      intro: "Februar 1929: Der Silberkamm-Express steckt im Schnee fest, im Salonabteil liegt ein toter Fabrikant, und die Uhr zeigt eine Zeit, zu der fast alle ein Alibi haben.",
      wen: "Für Runden, die gern mit Uhrzeiten und Alibis knobeln.",
      team: "6–8 Personen am Tisch, die Spielleitung spielt mit.",
      tipp: "Mode der späten Zwanziger: Weste, Hut, Perlenkette.",
      mehr: "Acht Figuren, ein Wagenplan, vier Runden und ein Finale. Rollen per Handy oder ausgedruckt, Gastgeberheft mit Ablauf und Vorlesetexten.",
    },
    "krimidinner-nebenan": {
      intro: "Oktober 2004: das Herbstfest eines Nachbarschaftsvereins. Der Gründer stürzt im Büro von der Leiter. Was wie ein Unfall aussieht, führt in einen Raum, den nicht alle am Tisch kennen.",
      wen: "Für Runden, die Geheimnisse, Papierspuren und eine Entscheidung am Ende mögen.",
      team: "5–10 Personen am Tisch, die Spielleitung spielt mit.",
      tipp: "Strickjacke, Cordhose oder Fleecepulli, und ein Notizblock für die Zeitleiste.",
      mehr: "Zehn Figuren, ein Hausplan, Dokumente zum Vergleichen und Zusammensetzen, vier Runden und ein Finale mit zwei Entscheidungen. Rollen per Handy oder ausgedruckt, Gastgeberheft mit Ablauf und Vorlesetexten.",
    },
    "krimidinner-mirage": {
      intro: "November 1958: die letzte Vorstellung im Varieté Palais Mirage. Der Impresario liegt hinter dem Spiegelkabinett, obwohl er um 21:58 noch aus der Loge gegrüßt hat.",
      wen: "Für Runden, die Bühnenzauber und eine gute Täuschung mögen.",
      team: "6–10 Personen am Tisch, die Spielleitung spielt mit.",
      tipp: "Petticoat, Smoking oder Paillettenkleid, und ein Veilchen fürs Knopfloch.",
      mehr: "Zehn Figuren, ein Bauamtsplan des Theaters, vier Runden und ein Finale. Rollen per Handy oder ausgedruckt, Gastgeberheft mit Ablauf und Vorlesetexten.",
    },
  },

  /* Themenseiten: kompakt mit Überschrift, zwei Sätzen, Spielen, drei Schritten und aufklappbaren Fragen */
  themen: [
    {
      slug: "online-escape-room-kostenlos",
      menu: "Online Escape Room kostenlos",
      title: "Online Escape Room kostenlos – ohne Anmeldung im Browser | Case Unlocked",
      desc: "Kostenlose Online Escape Rooms auf Deutsch: direkt im Browser, ohne Anmeldung, allein oder mit bis zu vier Personen. Hotel, Bunker, Theater oder ein fremder Computer.",
      kicker: "ONLINE · KOSTENLOS · OHNE ANMELDUNG",
      h1: "Kostenlose Online Escape Rooms",
      lead: "Komplette Escape Rooms direkt im Browser, auf Deutsch, ohne Anmeldung und ohne Download. Seite öffnen, ersten Raum betreten, losrätseln.",
      filter: "online",
      steps: [
        ["Raum betreten", "Du siehst den Raum aus deiner Sicht, drehst dich um und untersuchst, was dir auffällt."],
        ["Hinweise verbinden", "Codes, Dokumente und Gegenstände führen dich weiter. Wenn du feststeckst, helfen Hinweise in drei Stufen."],
        ["Pause machen", "Dein Spielstand wird automatisch gespeichert. Später machst du genau dort weiter."],
      ],
      faq: [
        ["Was brauche ich?", "Ein Smartphone, Tablet oder einen Computer mit aktuellem Browser. Auf dem Smartphone am besten quer halten, mit Ton ist es noch atmosphärischer."],
        ["Ab welchem Alter?", "Die meisten Escape Rooms ab 12 Jahren, SEKTOR 9 und das ARCHON-Protokoll ab 14. Gruseln gehört dazu."],
        ["Ist das wirklich kostenlos?", "Ja. Case Unlocked ist ein privates Projekt von zwei Escape-Room-Fans: keine Werbung, kein Tracking, keine versteckten Kosten."],
        ["Welcher Escape Room ist der leichteste?", "Für den Einstieg eignen sich Hotel Nocturne und Der letzte Fall. Das ARCHON-Protokoll ist unser schwerstes Spiel."],
      ],
      cross: ["escape-room-mit-freunden-online", "Lieber gemeinsam? Escape Room mit Freunden online"],
    },
    {
      slug: "escape-room-mit-freunden-online",
      menu: "Escape Room mit Freunden online",
      title: "Escape Room mit Freunden online spielen – kostenlos, jeder am eigenen Gerät | Case Unlocked",
      desc: "Online Escape Room mit Freunden: Sitzung erstellen, Einladungscode teilen, gemeinsam rätseln – bis zu vier Personen, jeder am eigenen Handy oder Computer. Kostenlos, ohne Anmeldung.",
      kicker: "GEMEINSAM · BIS ZU VIER PERSONEN",
      h1: "Escape Room mit Freunden online spielen",
      lead: "Jede Person auf ihrem eigenen Gerät, am selben Tisch oder in verschiedenen Städten. Funde, Notizen und gelöste Rätsel teilt ihr automatisch.",
      filter: "team",
      steps: [
        ["Sitzung erstellen", "Eine Person öffnet ein Abenteuer und wählt „Gemeinsam spielen“."],
        ["Code teilen", "Die anderen wählen „Beitreten“ und geben den Einladungscode ein."],
        ["Zusammen rätseln", "Bis zu vier Personen bewegen sich frei, Rucksack und Akte sind gemeinsam."],
      ],
      faq: [
        ["Was brauchen wir?", "Jede Person ein Gerät mit Browser. Wer nicht im selben Raum sitzt, telefoniert nebenher. In SEKTOR 9 gibt es Funk im Spiel."],
        ["Wie teilen wir uns auf?", "Eine Person liest Dokumente, eine sucht Zahlen, eine probiert Schlösser, und alle sprechen laut aus, was sie sehen. Die Lösung entsteht oft zwischen zwei Personen."],
        ["Wie lange dauert eine Runde?", "Plant eineinhalb bis zwei Stunden ein, bei SEKTOR 9 etwas mehr. Pausen sind jederzeit möglich."],
      ],
      cross: ["krimidinner-fuer-zuhause", "Mehr als vier Personen? Krimidinner für zu Hause"],
    },
    {
      slug: "krimidinner-fuer-zuhause",
      menu: "Krimidinner für zu Hause",
      title: "Krimidinner für zu Hause – kostenlos, mit Handy oder zum Ausdrucken | Case Unlocked",
      desc: "Krimidinner kostenlos für 4–10 Personen: Rollen per Code oder ausgedruckt, Beweise in Runden, Gastgeberheft mit Ablauf und Vorlesetexten. Sternwarte, Nachtzug 1929 oder Varieté 1958.",
      kicker: "AM TISCH · 4–10 PERSONEN",
      h1: "Krimidinner für zu Hause",
      lead: "Jede Person spielt eine Figur mit Geheimnissen, die Beweise kommen Runde für Runde aufs Handy oder als Karte auf den Tisch. Eine Person am Tisch kennt die Wahrheit, denn sie war es selbst.",
      filter: "tisch",
      steps: [
        ["Abend anlegen", "Die Spielleitung trägt die Gäste ein. Die Rollen werden zufällig verteilt, auch die Spielleitung spielt mit."],
        ["Codes verschicken", "Jede Person liest ihre Rolle vorher in Ruhe: Charakter, Kostümvorschlag, Geheimnis."],
        ["Ermitteln und anklagen", "Losungswörter öffnen neue Beweise. Am Ende klagen alle verdeckt an, dann wird aufgelöst."],
      ],
      faq: [
        ["Was brauchen wir?", "Eine Spielleitung, die mitspielt, Essen und Getränke, Handys oder einen Drucker. Kostüme sind freiwillig, jede Rolle schlägt Kleidung und ein Requisit vor."],
        ["Was, wenn wir weniger Gäste als Rollen sind?", "Figuren, die niemand spielt, werden zu Nebenfiguren. Ihr Wissen kommt als Aussagekarte zu den Beweisen, damit der Fall lösbar bleibt."],
        ["Geht es auch ganz ohne Handy?", "Ja. Rollenblätter, Beweiskarten, Gastgeberheft und Anleitung lassen sich ausdrucken."],
        ["Ist das kostenlos?", "Ja, alle drei Fälle mit allen Unterlagen."],
      ],
      cross: ["online-escape-room-kostenlos", "Lieber online rätseln? Kostenlose Online Escape Rooms"],
    },
  ],
};
