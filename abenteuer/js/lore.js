/*
 * Mythara – Lore: die Geschichte der Welt bis zum Heute (Seite „Lore“) und die Geschichte jedes Helden
 * (Reiter „Geschichte“ im Heldenprofil). Nur Texte, keine Spielregeln.
 * Die Quelle für alles, was hier steht (und für das, was Spieler erst in den Kampagnen erfahren), ist LORE-MYTHARA.md.
 * Diese Seite verrät nichts, was eine Kampagne erst auflöst.
 * Globaler Name: window.ABLORE
 */
(function () {
  "use strict";
  const welt = [
    { titel: "Das Erste Licht", text: [
      "Bevor es Land und Meer gab, war Mythara ein einziges Licht ohne Gestalt. Als es zerbrach, wurden aus den großen Stücken Berge, Wasser und Himmel. Die kleinsten Stücke fielen in alles, was lebt.",
      "Diese Stücke nennt man Seelensplitter. Jedes Wesen trägt einen. Er ist das, was in einem Menschen brennt, wenn er liebt, zürnt oder standhält. Stirbt ein Wesen, kehrt sein Splitter in die Erde zurück und wartet.",
    ] },
    { titel: "Das Hohle", text: [
      "Wo das Licht zerbrach, blieb auch etwas zurück, das kein Stück davon abbekam: eine Leere, die sich ihrer selbst bewusst wurde. Die Alten nannten sie das Hohle.",
      "Das Hohle erschafft nichts. Es höhlt aus. Es nimmt Dingen, was sie ausmacht, und lässt die Hülle stehen: Tote, die nicht ruhen, Befehle, die niemand mehr zurücknimmt, Kälte, die nicht weicht. Lange lag es still, denn es fand keinen Weg in die Welt.",
    ] },
    { titel: "Der Krieg der Magier", text: [
      "Vor dreihundert Jahren stritten die Magier der alten Fürstentümer um die Macht des Ersten Lichts. Jeder zog mehr davon aus der Erde als der andere, bis das Land selbst dünn wurde.",
      "Niemand gewann diesen Krieg. Aber er setzte Kräfte frei, die sich nicht mehr einfangen ließen. Tiere wuchsen zu Ungeheuern heran. Tote standen auf und gingen weiter. Und es entstanden Wesen, die es vorher nie gegeben hatte. Durch den Riss, den die Magier geschlagen hatten, kam schließlich das Hohle selbst herein.",
    ] },
    { titel: "Die sieben Siegel", text: [
      "Das Reich von Veyrholm tat, was noch zu tun war. Töten ließ sich das Hohle nicht, also band man es: in sieben Siegel, verteilt über das ganze Land. Über jedes Siegel setzte das Reich eine Wacht, und einen Orden, der die Wachten verband.",
      "In der Hauptstadt Veyrholm schufen die Gründer das Kronenherz. Es hält die sieben Siegel im Gleichgewicht. Solange es schlägt, hält jedes Siegel das andere. Das Böse war besiegt. Vorerst.",
    ] },
    { titel: "Der König unter dem Eis", text: [
      "Die letzten Könige von Veyrholm wollten die Siegel nicht nur hüten. Sie wollten sie lenken. Was genau in jener Nacht geschah, weiß niemand mehr.",
      "Man weiß nur: Über Nacht kam das Eis. Ein Gletscher begrub die Stadt mit allen, die in ihr lebten. Das Reich zerfiel in Herrschaften, die einander kaum noch kennen. Seither heißt dieses Land die Splitterlande.",
    ] },
    { titel: "Was blieb", text: [
      "Das Hohle war gebunden, doch was der Krieg hervorgebracht hatte, verschwand nicht mit ihm. Die veränderten Tiere, die ruhelosen Toten und die neuen Kreaturen blieben in der Welt. Sie gehorchen niemandem mehr.",
      "Seither streifen sie frei durch die Splitterlande: Kröten, groß wie Kälber, im Moor. Kobolde an den Furten. Ertrunkene, die nachts aus dem Wasser steigen. Wo sie auftauchen, herrscht Chaos, und kein Fürst ist mehr da, der sie vertreibt.",
    ] },
    { titel: "Dreihundert Jahre später", text: [
      "Die Fürsten sind vergessen, ihre Münzen liegen noch in alten Truhen. Der Wachtorden ist zu einer Handvoll alter Leute geschrumpft. Die meisten Wachten sind Ruinen. Kaum jemand weiß noch, was unter ihnen liegt.",
      "Und nun mehren sich die Zeichen, dass das Böse wieder erwacht. Im Schwarzmoor ziehen stumme Lichter über das Wasser. In der Abtei Grauwacht läutet eine Glocke, Nacht für Nacht. Die Signalwarte von Hochwacht ist seit vierzig Jahren dunkel. Die Kreaturen werden dreister. Und auf den Straßen tauchen Maskierte auf, die eine leere Krone im Zeichen führen und nach den Siegeln fragen.",
    ] },
    { titel: "Die Gerufenen", text: [
      "Die Kräfte des Krieges haben nicht nur Tiere verändert. Auch manche Menschen tragen seither einen größeren Seelensplitter als andere, und mit ihm Fähigkeiten, die sich nicht erlernen lassen. Sie merken es selten selbst. Aber wenn ein Siegel schwach wird, zieht es sie dorthin, ob sie wollen oder nicht.",
      "Die Leute nennen sie Helden. Sie selbst nennen sich meistens gar nichts. Sie sind Wächter, Diebe, Heiler, Jäger – und sie sind gerade unterwegs.",
    ] },
    { titel: "Der Spiegelgrund", text: [
      "Unter den Trümmern einer namenlosen Wacht liegt ein Ort, an dem das Erste Licht noch Echos wirft. Wer hinabsteigt, steht dort keinem Menschen gegenüber, sondern dessen Spiegelbild aus Licht.",
      "Deshalb kann man im Spiegelgrund sich selbst begegnen, und deshalb stirbt dort niemand. Die Gerufenen nennen ihn die Arena. Wer ein Echo bezwingt, trägt ein paar seiner Splitter mit hinauf.",
    ] },
  ];

  // herkunft: eine Zeile · text: zwei kurze Absätze · geheimnis · verbunden
  const helden = {
    schildwaechter: { herkunft: "Halmbruck · einst Hauptmann der Torwache",
      text: ["Torvald hielt zwanzig Jahre lang das Nordtor von Halmbruck. In einer Winternacht fiel es trotzdem, und von seiner Schicht kam er als Einziger zurück.",
        "Seither stellt er sich vor jeden, der hinter ihm steht. Nachts zählt er die Namen derer, bei denen er zu spät kam. Es werden nicht mehr, und darauf achtet er."],
      geheimnis: "Das Tor fiel von innen. Er weiß bis heute nicht, wer den Riegel zog.", verbunden: "Elara – sie war in jener Nacht die Erste, die wieder ein Licht anzündete." },
    berserker: { herkunft: "Kaltbrunn · das letzte Dorf am Gletscher",
      text: ["Ragnar wuchs dort auf, wo sieben Häuser gegen das Eis stehen. Als Junge brach er im Gletscher ein und lag eine Nacht in einer Spalte, bevor man ihn fand.",
        "Was er dort unten sah, erzählt er niemandem. Aber seither spürt er Schmerz anders als andere: Er macht ihn nicht langsam, sondern wach."],
      geheimnis: "In der Spalte stand jemand im Eis, aufrecht, mit offenen Augen – und sah ihn an.", verbunden: "Brogar – der Einzige, der ihn nach einem Kampf anfassen darf." },
    duellant: { herkunft: "Die Flussstädte an der Wehre · Tochter eines verarmten Ritterhauses",
      text: ["Isolde lernte den alten Rittergruß, bevor sie lesen konnte. Vom Haus ihrer Familie blieb nur der Name und eine Klinge, die für ihre Hand zu schwer war. Sie lernte trotzdem, sie zu führen.",
        "Sie hat jedes Duell gewonnen, das sie je gefochten hat. Bis auf eines."],
      geheimnis: "Der Gegner, den sie nie besiegt hat, trug eine Maske mit einer leeren Krone. Er ließ sie leben, und sie weiß nicht, warum.", verbunden: "Vex – sie erkennt seine Schule am Schritt. Er ihre auch." },
    gelehrter: { herkunft: "Halmbruck · Schreiberin im Archiv des Wachtordens",
      text: ["Lyra hat mehr Jahre in Archiven verbracht als unter freiem Himmel. Sie liest die Kurzschrift der Mönche, sammelt Moorlieder und glaubt fest daran, dass alles eine Ordnung hat, wenn man nur genug davon gelesen hat.",
        "Sie brach auf, als sie eine Karte fand: die Splitterlande, darüber sieben silberne Kreise. Einer davon war durchgestrichen."],
      geheimnis: "Den Strich hat nicht der Kartenzeichner gesetzt. Die Tinte ist jünger als sie selbst.", verbunden: "Morwen – sie tauschen Bücher, die es nicht geben dürfte." },
    elementarist: { herkunft: "Der Osten · letzter Schüler eines Zirkels, den es nicht mehr gibt",
      text: ["Vaelins Lehrer führten ihre Kunst auf die Magier der alten Fürstentümer zurück und waren stolz darauf. Er war es auch, bis er begriff, was diese Magier angerichtet haben.",
        "Sein Zirkel brannte in einer einzigen Nacht nieder. Er sagt, er wisse nicht, wessen Feuer es war. Er sagt es zu schnell."],
      geheimnis: "Es war seines. Er hatte versucht, mehr Licht aus der Erde zu ziehen, als ein Mensch halten kann.", verbunden: "Seran – der ihn seit Jahren beobachtet und noch nicht gefragt hat." },
    schattenmagier: { herkunft: "Halmbruck · Findelkind, aufgezogen von einer Buchbinderin",
      text: ["Morwen lernte lesen aus Büchern, die zum Binden kamen und verschlossen bleiben sollten. Mit zwölf merkte sie, dass ihr Schatten manchmal einen Atemzug länger stehen blieb als sie.",
        "Sie sucht keine Macht. Sie sucht den Namen dessen, was ihr aus dem Dunkel antwortet, denn sie hat gelernt: Was einen Namen hat, kann man auch wieder wegschicken."],
      geheimnis: "Sie hat den Namen längst gefunden. Sie spricht ihn nicht aus, weil es ihr eigener ist.", verbunden: "Lyra – die Einzige, die fragt, ohne zu urteilen." },
    schattenlaeufer: { herkunft: "Unbekannt · er nennt jedes Mal einen anderen Ort",
      text: ["Darian hat für Fürstenerben spioniert, für Zöllner geschmuggelt und für beide Seiten desselben Streits Türen geöffnet. Er hinterlässt keine Spuren, keine Schulden und keine Freunde.",
        "Zumindest war das so, bis ihn ein Auftrag in eine alte Wacht führte und er dort etwas mitnahm, das er nicht verkaufen konnte."],
      geheimnis: "Er trägt einen Splitter Siegelstein bei sich. Er summt, wenn Maskierte in der Nähe sind.", verbunden: "Silra – sie hat ihn einmal bestohlen. Er hat es erst nach drei Tagen gemerkt und ist seitdem beeindruckt." },
    trickser: { herkunft: "Die Gassen der Flussstädte",
      text: ["Silra war sechs, als sie zum ersten Mal einem Zöllner die Börse abnahm, und acht, als sie lernte, dass ein Lächeln schneller ist als jede Hand. Sie hat eine ganze Gasse voller Kinder durch drei Winter gebracht.",
        "Sie redet viel, lacht laut und lässt sich von niemandem in die Karten sehen."],
      geheimnis: "Eines der Kinder ist den Maskierten gefolgt, die Brot und einen neuen Namen versprachen. Sie sucht es noch.", verbunden: "Darian – dem sie nie sagen wird, dass sie ihm die Börse zurückgelegt hat." },
    assassine: { herkunft: "Unbekannt · ausgebildet in einer Schule ohne Namen",
      text: ["Vex spricht selten und nie über früher. Sicher ist: Jemand hat ihm sehr früh beigebracht, wie man leise ist, und sehr gründlich, wie man es bleibt.",
        "Er nimmt keine Aufträge mehr an. Er geht jetzt dorthin, wo die Siegel schwach werden – als hätte er dort etwas gutzumachen."],
      geheimnis: "Die Schule gehörte dem Bund der Hohlkrone. Sie haben ihm seinen ersten Namen genommen. Vex ist der, den er sich selbst gegeben hat.", verbunden: "Isolde – die ahnt, woher er kommt, und trotzdem neben ihm kämpft." },
    lichtbringer: { herkunft: "Halmbruck · Tochter eines Kapellenwärters",
      text: ["Elara hat das Licht nicht in einer Abtei gefunden, sondern in einer Nacht, in der alle Lampen ausgingen. Sie war es, die die erste wieder anzündete, mit bloßen Händen.",
        "Sie predigt nicht. Sie geht voran, dorthin, wo die Toten nicht ruhen, und bleibt, bis sie es tun."],
      geheimnis: "Sie weiß nicht, woher ihr Licht kommt. Manchmal fürchtet sie, dass es nicht ihres ist, sondern nur geliehen.", verbunden: "Torvald – er hält die Tür, sie das Licht. So war es schon in Halmbruck." },
    wanderheiler: { herkunft: "Die Dörfer am Rand des Schwarzmoors",
      text: ["Brogar war Feldscher in einem Grenzstreit, an dessen Anlass sich niemand mehr erinnert. Danach legte er die Säge weg und lernte Kräuter. Seitdem zieht er von Dorf zu Dorf und fragt erst nach der Wunde, dann nach dem Namen.",
        "Er nimmt als Lohn, was man ihm gibt, und geht, bevor man ihm danken kann."],
      geheimnis: "Er hat einmal einen Mann geheilt, den er hätte sterben lassen sollen. Der Mann trägt heute eine Maske.", verbunden: "Ragnar – den er öfter zusammengeflickt hat als jeden anderen." },
    inquisitor: { herkunft: "Der Wachtorden · einer seiner letzten Geweihten",
      text: ["Seran wurde ausgebildet, Flüche zu brechen und Dinge zu bannen, an die außerhalb des Ordens kaum noch jemand glaubt. Er glaubt daran, weil er sie gesehen hat.",
        "Er fragt nur einmal. Nicht aus Härte, sondern weil er gelernt hat, dass die zweite Antwort immer eine Lüge ist."],
      geheimnis: "Der Orden hat ihm einen Namen genannt, den er richten soll. Es ist jemand, mit dem er reist.", verbunden: "Vaelin – der Name auf dem Zettel. Seran hat ihn noch nicht gefragt." },
    wildnislaeufer: { herkunft: "Die Hügel über dem Nordpass · Sohn eines Kundschafters der Hochwarte",
      text: ["Kaels Vater hatte Wache in der Nacht, in der das Signalfeuer der Hochwarte erlosch. Danach sprach im Tal niemand mehr mit der Familie. Kael lernte das Spurenlesen von einem Mann, der kaum noch redete.",
        "Er kennt jeden Pfad zwischen Pass und Gletscher. Er sieht jeden, lange bevor der ihn sieht, und er sorgt dafür, dass ihm nie wieder etwas entgeht."],
      geheimnis: "Das Feuer ging nicht aus. Sein Vater hat es gelöscht. Warum, steht in einem Brief, den Kael nie zu Ende gelesen hat.", verbunden: "Faye – sie liest Spuren am Boden, er die am Horizont." },
    tiergefaehrte: { herkunft: "Ein Dorf am Schwarzmoor, das es nicht mehr gibt",
      text: ["Faye fand den Wolf als Welpen neben seiner toten Mutter, im selben Winter, in dem sie selbst niemanden mehr hatte. Sie nannte ihn Grau, weil ihr nichts Besseres einfiel, und dabei blieb es.",
        "Mit Menschen redet sie wenig, mit ihm viel. Er geht vor, sie folgt. Bisher hat er sich nie geirrt."],
      geheimnis: "Grau ist einmal einem Licht ins Moor gefolgt und nach drei Tagen zurückgekommen. Seitdem knurrt er, bevor Tote aufstehen.", verbunden: "Kael – der Einzige, vor dem Grau nicht die Ohren anlegt." },
    kopfgeldjaeger: { herkunft: "Die Flussstädte an der Wehre",
      text: ["Orin kennt jeden Steckbrief zwischen Graufurt und dem Pass auswendig, auch die verblichenen. Er hat sie alle gefunden, lebend, und abgeliefert. Alle bis auf einen.",
        "Er sagt, es gehe ihm ums Geld. Er nimmt allerdings seit Jahren nur noch Aufträge an, die ihn dem Einen näher bringen."],
      geheimnis: "Der Eine ist sein Bruder. Auf dem Steckbrief steht ein falscher Name – Orin hat ihn selbst hingeschrieben.", verbunden: "Darian – der mehr über den Einen weiß, als er zugibt." },
  };

  window.ABLORE = {
    auftakt: "Was geschah, bevor ihr aufgebrochen seid.",
    schluss: "Was danach geschieht, steht noch nirgends. Das schreibt ihr.",
    welt, helden,
  };
})();
