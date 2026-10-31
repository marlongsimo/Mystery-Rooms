/*
 * STATIONEN 2–7 – VORLÄUFIGE FASSUNG
 * Die Rätsel stammen aus dem Prototyp und sind bereits spielbar,
 * die Räume haben aber noch keine gezeichnete Szene. Sie werden nach und nach
 * nach dem Vorbild der Rezeption (01-rezeption.js) ausgebaut.
 *
 * Kurzform: card(glyph, label) erzeugt einen Gegenstand, der das Rätsel des Raums öffnet.
 */
(() => {
  const N = window.NOCTURNE;
  const card = (glyph, label, puzzle) => ({ id: label.toLowerCase().replace(/[^a-zäöü]/g, ""), glyph, label, title: label, lock: puzzle });
  const note = (title, text) => ({ title, kind: "note", html: `<p>${text}</p>` });

  Object.assign(N.docs, {
    brief_elias: { title: "Brief an Mara", kind: "letter", html: `<p class="handwriting">Mara,<br><br>falls du jemals zurückkehrst, erinnere dich daran: Dein Name stand niemals in den offiziellen Aufzeichnungen. Das war meine Entscheidung.<br><br>Ihr wart sechs – und keiner von euch war allein.</p><p class="handwriting sign">E.</p>` },
    foto_mara: note("Foto von Mara", "Eine junge Frau, lachend, vor dem Hoteleingang. Auf der Rückseite steht: „Mara – 14.10.2009“."),
    gepaeckverzeichnis: note("Originales Gepäckverzeichnis", "Sechs Gäste verließen das Hotel in jener Nacht. Neben „M. Vale, Zimmer 217“ steht handschriftlich ergänzt: <b>Mara Voss</b>.<br><br>„Einer von ihnen durfte niemals offiziell existieren.“"),
    bauakte: note("Bauliche Veränderungen – Oktober 2009", "„Der westliche Servicetunnel ist nach außen hin als dauerhaft verschlossen zu dokumentieren. Eine tatsächliche Stilllegung wird nicht vorgenommen.“<br><br>Unterzeichnet: <b>Viktor Lehn</b>, Eigentümer"),
    entschluesselt: note("Entschlüsselte Nachricht", "DER WESTGANG IST OFFEN"),
    kameraprotokoll: note("Überwachungsprotokoll 14.10.2009", "23:17 – Stromausfall in der Lobby.<br>Notstrom springt an.<br><b>23:24</b> – Sechs Personen verlassen das Gebäude durch ein Tor im Westen.<br>Danach: Elias Voss betritt allein das Managerbüro und nimmt ein Buch aus dem Regal."),
    aufnahme_elias: note("Tonaufnahme von Elias", "„Falls jemand diese Aufnahme gefunden hat, ist es endlich an der Zeit, die Wahrheit zu erfahren. Der Keller ist der Schlüssel. Nicht die Tür, die Sie sehen. Die Tür, die Sie niemals sehen sollten.“"),
    wartungsplan: note("Wartungsplan Technikkeller", "Generator → C → A → D → B → Westtor.<br>Der westliche Servicetunnel ist weiterhin an den Notstrom angeschlossen."),
    wartungsregister: note("Originales Wartungsregister", "Der Servicetunnel war 2009 voll funktionsfähig. Eintrag vom 14.10.2009, 23:21, in Elias’ Handschrift: „Evakuierung über Westgang. 6 Personen.“"),
  });

  const rooms = [
    {
      id: "zimmer217", name: "Zimmer 217", title: "Zimmer 217", kicker: "2. ETAGE / OSTFLÜGEL",
      story: "Der Raum ist unberührt. Auf dem Nachttisch liegt ein Brief: „Ich habe alles zurückgelassen. Doch nichts davon war zufällig platziert.“ Vier Gegenstände sind sorgfältig aufgestellt.",
      cards: [["⌛", "Sanduhr"], ["♜", "Kerzenständer"], ["⚿", "Schlüssel"], ["▧", "Porträtfoto"], ["▭", "Kommode"]],
      puzzle: {
        type: "code", length: 4, title: "Die Kommode",
        prompt: "Die Kommode hat ein vierstelliges Ziffernschloss. Im Brief auf dem Nachttisch steht: „Zuerst das, was die Zeit festhält. Danach das, was Licht spendet. Anschließend das, was Türen öffnet. Zuletzt das, was Erinnerungen bewahrt.“",
        clue: "Auf jedem Gegenstand klebt eine Zahl:\nSanduhr – 4\nKerzenständer – 1\nSchlüssel – 7\nPorträtfoto – 3",
        answers: ["4173"],
        objective: "Öffne die Kommode.",
        hints: ["Die vier Satzteile im Brief beschreiben jeweils einen der Gegenstände.", "Zeit = Sanduhr, Licht = Kerzenständer, Türen = Schlüssel, Erinnerungen = Porträtfoto.", "Die Reihenfolge ergibt 4 – 1 – 7 – 3."],
        success: "Die Kommode öffnet sich. Darin liegt ein Brief an jemanden namens Mara – und ein Foto, auf dessen Rückseite ein Datum steht.",
        onSolve: [{ doc: "brief_elias" }, { doc: "foto_mara" }],
      },
    },
    {
      id: "gepaecklager", name: "Gepäcklager", title: "Das Gepäcklager", kicker: "UNTERGESCHOSS / SERVICEBEREICH",
      story: "Staub liegt auf den Regalen. Vier Koffer stehen auf einem Tisch, die Anhänger sind noch lesbar. Das Gepäckverzeichnis daneben ist vom Wasser beschädigt.",
      cards: [["♟", "Schachfigur"], ["♧", "Blauer Schal"], ["♫", "Notenblatt"], ["⌖", "Kompass"], ["▤", "Verzeichnis"]],
      puzzle: {
        type: "code", length: 4, title: "Der verschlossene Koffer",
        prompt: "Ein fünfter Koffer hat ein Zahlenschloss. Auf dem Deckel: „In der Reihenfolge, in der sie ankamen.“ Ordne die Gegenstände den Gästen zu.",
        clue: "Aus dem Gästeregister:\nL. Berger – 201 – 20:14\nM. Vale – 217 – 21:17\nJ. Winter – 214 – 21:31\nA. Stern – 220 – 22:08\n\nAnhänger: Schachfigur 2 · Blauer Schal 6 · Notenblatt 9 · Kompass 4\n\nReste des Verzeichnisses:\n• Die Schachfigur gehört dem, der von diesen vier zuerst ankam.\n• Der blaue Schal gehört zu Zimmer 217.\n• Das Notenblatt gehört zu Zimmer 214.\n• Der Kompass gehört dem, der von diesen vier zuletzt ankam.",
        answers: ["2694"],
        objective: "Öffne den verschlossenen Koffer.",
        hints: ["Sortiere zuerst die vier Gäste nach ihrer Check-in-Zeit.", "Reihenfolge: Berger, Vale, Winter, Stern. Ordne dann jedem Gast seinen Gegenstand zu.", "Schachfigur 2, Schal 6, Notenblatt 9, Kompass 4 → 2694."],
        success: "Im Koffer liegt das originale Gepäckverzeichnis. Neben dem Namen M. Vale hat jemand handschriftlich etwas ergänzt.",
        onSolve: [{ doc: "gepaeckverzeichnis" }],
      },
    },
    {
      id: "archiv", name: "Hotelarchiv", title: "Das Hotelarchiv", kicker: "ERDGESCHOSS / VERWALTUNG",
      story: "Zwischen Personalakten und vergilbten Zeitungsartikeln liegt ein Brief, der keinen Sinn ergibt. Der Schreibtisch hat ein Fach mit Buchstabenschloss.",
      cards: [["✉", "Brief"], ["▤", "Bauakte"], ["⌕", "Personalakten"], ["▭", "Schreibtisch"]],
      puzzle: {
        type: "text", title: "Das Buchstabenschloss",
        prompt: "Das Fach öffnet sich nur mit dem richtigen Satz. Der Brief enthält nur eine Zeile. Auf der Rückseite steht: „Der Verfasser war seiner Zeit immer drei Schritte voraus.“",
        clue: "GHU ZHVWJDQJ LVW RIIHQ",
        answers: ["DER WESTGANG IST OFFEN"],
        objective: "Entschlüssle den Brief.",
        hints: ["Der Text verwendet eine sehr alte, bekannte Methode, Buchstaben zu verschlüsseln.", "Jeder Buchstabe wurde um dieselbe Anzahl an Stellen im Alphabet verschoben.", "Gehe bei jedem Buchstaben drei Stellen im Alphabet zurück: G → D, H → E, U → R …"],
        success: "Das Fach springt auf. Darin liegt eine Akte mit dem Titel „Bauliche Veränderungen – Oktober 2009“.",
        onSolve: [{ doc: "entschluesselt" }, { doc: "bauakte" }],
      },
    },
    {
      id: "ueberwachung", name: "Überwachungsraum", title: "Der Überwachungsraum", kicker: "UNTERGESCHOSS / SICHERHEIT",
      story: "Vier Monitore zeigen Standbilder aus der Nacht des 14. Oktober 2009. Das System verlangt die Aufnahmen in der richtigen Reihenfolge.",
      cards: [["▣", "Lobby"], ["▣", "Generator"], ["▣", "Innenhof"], ["▣", "Büro"]],
      puzzle: {
        type: "code", length: 4, title: "Rekonstruktion der Nacht",
        prompt: "Gib die Kennziffern der vier Aufnahmen in zeitlicher Reihenfolge ein.",
        clue: "A – LOBBY · 23:17 · Das Licht geht aus, die Uhr bleibt stehen. · Kennziffer 5\nB – GENERATORRAUM · Ein Notstromgenerator springt an. · Kennziffer 2\nC – INNENHOF · 23:24 · Sechs Personen verlassen das Gebäude durch ein Tor im Westen. · Kennziffer 8\nD – MANAGERBÜRO · Elias nimmt allein ein dickes Buch aus dem Regal. · Kennziffer 1\n\nHandschriftlich auf dem Protokoll:\n„Ohne Notstrom öffnet sich das Westtor nicht.\nIch bin erst zurück, als alle draußen waren.“",
        answers: ["5281"],
        objective: "Bringe die Aufnahmen in die richtige Reihenfolge.",
        hints: ["Beginne mit der Aufnahme, die einen Zeitstempel und den Stromausfall zeigt.", "Ohne Strom kein Generator, ohne Generator kein offenes Westtor. Elias kehrte erst zurück, als alle draußen waren.", "A → B → C → D ergibt 5281."],
        success: "Eine fünfte Datei erscheint. Elias nimmt ein Buch mit der Aufschrift „Originales Wartungsregister“ an sich. Dann sieht er direkt in die Kamera – und beginnt zu sprechen.",
        onSolve: [{ doc: "kameraprotokoll" }, { doc: "aufnahme_elias" }],
      },
    },
    {
      id: "keller", name: "Keller", title: "Der Keller", kicker: "UNTERGESCHOSS / TECHNIK",
      story: "Es riecht nach feuchtem Beton. An der Wand hängt ein Sicherungskasten, daneben ein Wartungsplan. Die westliche Tür bleibt dunkel – ohne Notstrom bewegt sich hier nichts.",
      cards: [["ϟ", "Generator"], ["▦", "Sicherungskasten"], ["▱", "Wäscheschrank"]],
      puzzle: {
        type: "code", length: 4, title: "Der Stromkreislauf",
        prompt: "Die Schalter müssen in der Reihenfolge betätigt werden, in der der Strom sie durchläuft.",
        clue: "Wartungsplan:\nGENERATOR → SCHALTER C → SCHALTER A → RELAIS D → AUSGANG B → WESTTOR\n\nKennziffern: C = 3 · A = 1 · D = 4 · B = 2",
        answers: ["3142"],
        objective: "Stelle den Notstrom wieder her.",
        hints: ["Beginne beim Generator und folge dem Pfeil bis zum Westtor.", "Die Reihenfolge lautet C, A, D, B.", "Die Kennziffern ergeben 3 – 1 – 4 – 2."],
        success: "Das Notstromsystem springt an, die Wandleuchten flackern. Hinter dem alten Wäscheschrank zeichnet sich eine Tür ab: „Nur wer die Vergangenheit versteht, darf eintreten.“",
        onSolve: [{ doc: "wartungsplan" }],
      },
    },
    {
      id: "buero", name: "Managerbüro", title: "Das Managerbüro", kicker: "WESTFLÜGEL / PRIVATBEREICH",
      story: "Ein großes, beinahe unberührtes Büro. Auf dem Schreibtisch liegt das originale Wartungsregister, daneben steht ein Tresor. „Sie haben die einzelnen Teile gefunden. Jetzt müssen Sie verstehen, was sie gemeinsam bedeuten.“",
      cards: [["▤", "Wartungsregister"], ["▣", "Tresor"]],
      final: true,
      puzzle: {
        type: "multi", title: "Der Tresor",
        prompt: "Der Tresor hat vier Eingabefelder. Die Antworten findest du in deiner Beweismappe.",
        fields: [
          { label: "Über welchen Ausgang wurden die Gäste evakuiert?", answers: ["WESTGANG", "SERVICETUNNEL", "WESTLICHER SERVICETUNNEL", "WESTTOR", "TUNNEL"] },
          { label: "Wie viele Gäste verließen das Hotel?", answers: ["6", "SECHS"] },
          { label: "Wer blieb nach der Evakuierung zunächst im Hotel zurück?", answers: ["ELIAS VOSS", "ELIAS", "VOSS"] },
          { label: "Um wie viel Uhr wurden die Gäste im Innenhof aufgezeichnet?", answers: ["2324", "2324 UHR"] },
        ],
        objective: "Öffne den Tresor.",
        hints: ["Alle Antworten stehen in der Beweismappe: Bauakte, Gepäckverzeichnis und Überwachungsprotokoll.", "Gesucht sind der Ausgang, die Zahl der Gäste, der Name des Nachtmanagers und der Zeitstempel aus dem Innenhof.", "Westgang · 6 · Elias Voss · 23:24"],
        success: "Der Tresor öffnet sich mit einem tiefen Seufzen. Darin liegt ein letzter Brief.",
        onSolve: [{ doc: "wartungsregister" }],
      },
    },
  ];

  for (const r of rooms) {
    const pid = r.id + "_raetsel";
    N.rooms.push({
      id: r.id, name: r.name, title: r.title, kicker: r.kicker, story: r.story, final: r.final,
      draft: true,
      hotspots: r.cards.map(([g, l]) => card(g, l, pid)),
      puzzles: { [pid]: r.puzzle },
      completeWhen: [pid],
    });
  }
})();
