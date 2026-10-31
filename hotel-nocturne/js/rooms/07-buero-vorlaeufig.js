/*
 * STATION 7 – VORLÄUFIGE FASSUNG (Raum 6 ist fertig: 06-keller.js)
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
    wartungsregister: note("Originales Wartungsregister", "Der Servicetunnel war 2009 voll funktionsfähig. Eintrag vom 14.10.2009, 23:21, in Elias’ Handschrift: „Evakuierung über Westgang. 6 Personen.“"),
  });

  const rooms = [
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
