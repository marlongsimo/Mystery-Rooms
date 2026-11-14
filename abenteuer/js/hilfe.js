/*
 * Mythara – Hilfe & Regeln: die Grundlagen in einfachen Worten (Seite „Hilfe & Regeln“ auf der Startseite).
 * Bewusst allgemein gehalten: wie gewürfelt wird, welche Werte zählen, was ein Rettungswurf ist, wie man heilt.
 * Die Zahlen stammen aus js/regeln.js und js/szenen.js – wer dort etwas ändert, passt es hier an.
 */
(function () {
  "use strict";
  const TEILE = [
    { id: "kurz", titel: "Das Wichtigste in einer Minute", html: `
      <ul>
        <li><b>Ein Gerät ist der Spieltisch.</b> Es erzählt die Geschichte, zeigt die Karte und würfelt. Jede Person spielt ihren Helden auf dem eigenen Handy. Allein oder zu zweit geht es auch auf einem Gerät.</li>
        <li><b>Ihr entscheidet, die Würfel entscheiden mit.</b> Immer wenn etwas schiefgehen kann, wird ein zwanzigseitiger Würfel geworfen.</li>
        <li><b>Hoch ist gut.</b> Je höher der Wurf, desto besser. Was euer Held gut kann, bekommt einen Bonus obendrauf.</li>
        <li><b>Ihr müsst nichts rechnen.</b> Das Spiel rechnet alles aus und schreibt es in die Chronik. Diese Seite erklärt nur, was dort steht.</li>
      </ul>` },
    { id: "wuerfel", titel: "Wie gewürfelt wird", html: `
      <p>Fast alles in Mythara läuft nach derselben Regel:</p>
      <p class="hilfe-formel"><span>W20</span> + <span>Bonus</span> ≥ <span>Zielzahl</span> → geschafft</p>
      <ul>
        <li><b>W20</b> ist der Würfel mit 20 Seiten. Er zeigt eine Zahl von 1 bis 20.</li>
        <li><b>Bonus</b> ist das, was euer Held mitbringt: sein Talent und seine Übung. Meist liegt er zwischen +0 und +5.</li>
        <li><b>Zielzahl</b> ist die Hürde. Beim Angriff ist es die Rüstung des Gegners, bei einer Probe die Schwierigkeit.</li>
      </ul>
      <p class="hilfe-beispiel"><b>Beispiel:</b> Torvald schlägt nach einer Kröte. Er würfelt eine 9 und hat +5 Bonus: zusammen 14. Die Kröte hat Rüstung 11. 14 ist mindestens 11, also trifft er.</p>
      <ul>
        <li><b>Eine gewürfelte 20</b> gelingt immer. Im Kampf ist sie ein kritischer Treffer mit doppelten Schadenswürfeln.</li>
        <li><b>Eine gewürfelte 1</b> geht immer schief, egal wie hoch der Bonus ist.</li>
      </ul>
      <p>Andere Würfel heißen genauso: Ein <b>W8</b> hat acht Seiten, ein <b>W6</b> sechs. „2W4+2“ heißt: zwei vierseitige Würfel werfen, zusammenzählen, 2 dazu.</p>` },
    { id: "werte", titel: "Die Werte eures Helden", html: `
      <p>Jeder Held hat sechs Eigenschaften. Aus jeder ergibt sich ein Bonus, und nur der Bonus zählt beim Würfeln.</p>
      <table class="hilfe-tabelle">
        <tr><th>Kürzel</th><th>Eigenschaft</th><th>Wofür</th></tr>
        <tr><td>STR</td><td>Stärke</td><td>Schwert, Axt, Schild; stemmen, ziehen, festhalten</td></tr>
        <tr><td>GES</td><td>Geschicklichkeit</td><td>Bogen, Dolch; schleichen, ausweichen, balancieren</td></tr>
        <tr><td>KON</td><td>Konstitution</td><td>Zähigkeit: Gift, Kälte, Erschöpfung aushalten</td></tr>
        <tr><td>INT</td><td>Intelligenz</td><td>Zauber der Zauberer; Wissen, Rätsel, Schriften</td></tr>
        <tr><td>WEI</td><td>Weisheit</td><td>Zauber der Kleriker; aufmerksam sein, Menschen durchschauen</td></tr>
        <tr><td>CHA</td><td>Charisma</td><td>überzeugen, beruhigen, täuschen</td></tr>
      </table>
      <p><b>Vom Wert zum Bonus:</b> 10 ist der Durchschnitt und gibt +0. Je zwei Punkte darüber gibt es +1, darunter −1.</p>
      <table class="hilfe-tabelle schmal">
        <tr><th>Wert</th><td>8</td><td>10</td><td>12</td><td>14</td><td>16</td><td>18</td></tr>
        <tr><th>Bonus</th><td>−1</td><td>+0</td><td>+1</td><td>+2</td><td>+3</td><td>+4</td></tr>
      </table>
      <ul>
        <li><b>Übung (+2):</b> Was ein Held gelernt hat, bekommt 2 obendrauf. Angriffe mit der eigenen Waffe und die eigenen Zauber sind immer geübt.</li>
        <li><b>TP (Trefferpunkte):</b> das Leben. Schaden zieht TP ab. Bei 0 geht der Held zu Boden.</li>
        <li><b>RK (Rüstungsklasse):</b> wie schwer man zu treffen ist. Ein Angriff muss mindestens diese Zahl erreichen. Mit Kettenpanzer und Schild liegt sie bei 17, ohne Rüstung um 11.</li>
        <li><b>Stufe:</b> wie erfahren die Gruppe ist. An bestimmten Lagerfeuern steigt sie auf: mehr TP und neue Fähigkeiten.</li>
      </ul>` },
    { id: "angriff", titel: "Angreifen: treffen und Schaden", html: `
      <p>Ein Angriff besteht aus zwei Schritten.</p>
      <ol>
        <li><b>Treffe ich?</b> W20 + Angriffsbonus. Das Ergebnis muss die RK des Ziels erreichen. Der Angriffsbonus ist der Bonus der passenden Eigenschaft plus 2 für Übung.</li>
        <li><b>Wie viel Schaden?</b> Nur bei einem Treffer: der Würfel der Waffe plus ein fester Wert. Der Schaden wird von den TP des Ziels abgezogen.</li>
      </ol>
      <p class="hilfe-beispiel"><b>Beispiel:</b> Torvald hat Stärke 16, also +3, dazu +2 Übung: Angriffsbonus +5. Sein Langschwert macht 1W8+2 Schaden, also 3 bis 10. Bei einer gewürfelten 20 sind es 2W8+2.</p>
      <p>Bevor ihr angreift, zeigt die Zahl über dem Ziel die Chance in Prozent. In der Chronik steht danach <span class="hilfe-marke gut">✓ Treffer</span>, <span class="hilfe-marke gut">✓ Kritisch</span> oder <span class="hilfe-marke schlecht">✗ Verfehlt</span>. Grün ist gut für die Helden, rot schlecht.</p>` },
    { id: "rettung", titel: "Rettungswürfe", html: `
      <p>Manchmal würfelt nicht der Angreifer, sondern das <b>Ziel</b>: um auszuweichen, standzuhalten oder zu widerstehen. Das ist ein Rettungswurf.</p>
      <p class="hilfe-formel"><span>W20</span> + <span>Bonus der Eigenschaft</span> ≥ <span>SG</span> → gerettet</p>
      <ul>
        <li><b>SG</b> heißt Schwierigkeitsgrad. Je höher, desto schwerer ist es, sich zu retten.</li>
        <li><b>„GES-Rettung SG 13“</b> bedeutet: Das Ziel würfelt W20 plus seinen Geschicklichkeits-Bonus und braucht mindestens 13.</li>
        <li><b>Geschafft:</b> Die Wirkung bleibt aus oder fällt schwächer aus.</li>
        <li><b>Misslungen:</b> Die Wirkung trifft voll, zum Beispiel Schaden, Umfallen oder Festhalten.</li>
      </ul>
      <p class="hilfe-beispiel"><b>Beispiel:</b> Torvald rammt einen Kobold mit dem Schild. Der Kobold macht eine STR-Rettung. Würfelt er zu niedrig, wird er weggestoßen und liegt am Boden.</p>
      <p>Für euch heißt das: Ein hoher SG bei euren eigenen Fähigkeiten ist gut. Wenn ihr selbst würfeln müsst, hilft ein hoher Bonus in der genannten Eigenschaft.</p>` },
    { id: "proben", titel: "Proben außerhalb des Kampfes", html: `
      <p>Klettern, schleichen, jemanden überzeugen, Spuren lesen: Dafür gibt es Proben. Sie funktionieren wie alles andere, mit W20 + Bonus gegen einen SG.</p>
      <table class="hilfe-tabelle schmal">
        <tr><th>leicht</th><th>mittel</th><th>schwer</th></tr>
        <tr><td>SG 10</td><td>SG 13</td><td>SG 16</td></tr>
      </table>
      <ul>
        <li><b>Wer würfelt?</b> Meist eine Person, die sich meldet („Ich versuche es“). Nehmt die Figur, zu der es passt: Das Spiel zeigt bei jeder ihren Bonus.</li>
        <li><b>Geübt (+2):</b> Manche Klassen sind in einer Probe geübt, zum Beispiel Schurken im Schleichen. Das steht dabei.</li>
        <li><b>Drei Ausgänge:</b> <i>Geschafft</i>, <i>knapp daneben</i> (bis zu 3 unter dem SG: Es gelingt halb oder kostet etwas) und <i>misslungen</i>.</li>
        <li><b>Gruppenprobe:</b> Alle würfeln. Schafft es mindestens die Hälfte, kommt die Gruppe durch.</li>
      </ul>` },
    { id: "vorteil", titel: "Vorteil und Nachteil", html: `
      <p>Ist die Lage besonders günstig oder ungünstig, wird <b>zweimal</b> gewürfelt.</p>
      <ul>
        <li><b>Vorteil:</b> Der bessere der beiden Würfe zählt. Zum Beispiel wenn das Ziel am Boden liegt, festgehalten oder geblendet ist, oder wenn ihr aus dem Versteck angreift.</li>
        <li><b>Nachteil:</b> Der schlechtere zählt. Zum Beispiel wenn ihr selbst geblendet seid oder auf ein liegendes Ziel aus der Ferne schießt.</li>
        <li>Vorteil und Nachteil zugleich heben sich auf.</li>
      </ul>
      <p>Vorteil ist viel wert: Er hebt eure Chance etwa so stark wie ein Bonus von +4.</p>` },
    { id: "zug", titel: "Dein Zug im Kampf", html: `
      <p>Wer wann dran ist, bestimmt die Initiative. Die Reihenfolge steht am Rand der Karte. In deinem Zug hast du:</p>
      <ul>
        <li><b>Bewegung:</b> Krieger 3 Felder, Zauberer und Kleriker 4, Schurken und Waldläufer 5.</li>
        <li><b>Eine Aktion:</b> angreifen, zaubern, jemanden aufrichten oder noch einmal so weit laufen (Spurt).</li>
        <li><b>Oft eine Bonusaktion:</b> etwas Kleines nebenher, zum Beispiel einen Heiltrank trinken oder eine besondere Fähigkeit.</li>
        <li><b>Eine Reaktion:</b> Manche Fähigkeiten lösen sich von selbst aus, wenn ein anderer dran ist, etwa Torvalds Schutzhaltung.</li>
      </ul>
      <ul>
        <li><b>Vorsicht beim Weglaufen:</b> Wer neben einem Gegner losläuft, bekommt einen Hieb mit.</li>
        <li><b>Deckung:</b> Hindernisse zwischen euch und einem Schützen machen euch schwerer zu treffen.</li>
        <li><b>Zusammenbleiben:</b> Viele Fähigkeiten wirken nur auf Verbündete in der Nähe.</li>
        <li><b>Begrenzte Fähigkeiten:</b> Manche gehen nur einmal je Kampf oder einmal je Rast, Zauber verbrauchen Zauberplätze. Das steht auf dem Charakterbogen.</li>
      </ul>` },
    { id: "boden", titel: "Am Boden: wenn die TP auf 0 fallen", html: `
      <p>Wer 0 TP erreicht, geht zu Boden und kann nicht mehr handeln. Was dann geschieht, hängt von der Schwierigkeit ab.</p>
      <table class="hilfe-tabelle">
        <tr><th></th><th>Normal</th><th>Hardcore</th></tr>
        <tr><td>Am Boden</td><td>Niemand stirbt. Die Figur wartet auf Hilfe.</td><td>Jede Runde ein Todeswurf: ab 10 ein Erfolg, darunter ein Fehlschlag. Drei Fehlschläge bedeuten den Tod.</td></tr>
        <tr><td>Aufrichten</td><td>Eine Figur daneben richtet sie auf: Sie steht mit 1 TP wieder.</td><td>Aufrichten beendet nur die Todeswürfe.</td></tr>
        <tr><td>Heilung</td><td colspan="2">Jede Heilung (Zauber, Trank) bringt die Figur wieder auf die Beine.</td></tr>
        <tr><td>Nach dem Sieg</td><td>Wer noch am Boden liegt, steht mit halben TP auf.</td><td>Wer gestorben ist, bleibt tot. Am Lagerfeuer kann eine neue Figur nachrücken.</td></tr>
        <tr><td>Alle am Boden</td><td>Rückzug zum letzten Lagerfeuer, dann noch einmal.</td><td>Die Kampagne ist verloren.</td></tr>
      </table>` },
    { id: "rast", titel: "Heilen und rasten", html: `
      <table class="hilfe-tabelle">
        <tr><th></th><th>Was es bringt</th><th>Was es kostet</th></tr>
        <tr><td><b>Lagerfeuer</b></td><td><b>Normal: alle TP kommen zurück.</b> Dazu alle Zauberplätze und Fähigkeiten. Das Spiel wird gespeichert.</td><td>Nichts. Lagerfeuer stehen an festen Stellen der Geschichte.</td></tr>
        <tr><td><b>Kurze Rast</b></td><td>Die Hälfte der fehlenden TP. Fähigkeiten „je Rast“ und „je Kampf“ kommen zurück.</td><td>Die Uhr rückt um 1 vor. Einmal je Abschnitt, nur in Normal.</td></tr>
        <tr><td><b>Heiltrank</b></td><td>2W4+2 TP, also 4 bis 10. Geht als Bonusaktion, auch für sich selbst.</td><td>Der Trank ist weg. Jeder Held startet mit einem.</td></tr>
        <tr><td><b>Heilzauber</b></td><td>Kleriker heilen Verbündete im Kampf.</td><td>Einen Zauberplatz.</td></tr>
        <tr><td><b>Rückzug</b></td><td><b>Normal: Die Gruppe kommt mit vollen TP zurück</b> und versucht den Kampf noch einmal.</td><td>Die Uhr rückt um 1 vor.</td></tr>
      </table>
      <p>In <b>Hardcore</b> gibt es keine kurze Rast und keinen Rückzug, und bei fortgeschrittener Uhr heilt das Lagerfeuer nur bis drei Viertel.</p>` },
    { id: "uhr", titel: "Die Uhr der Kampagne", html: `
      <p>Jede Kampagne hat eine Uhr mit sieben Schritten. Sie heißt überall anders: die Nacht, die Lichter, der Pegel, die Glocke, die Kälte, der Frost.</p>
      <ul>
        <li><b>Sie rückt vor</b>, wenn ihr eine kurze Rast macht, einen Umweg nehmt, eine Probe verpatzt oder euch zurückziehen müsst.</li>
        <li><b>Je weiter sie ist</b>, desto schlechter steht es um das, was ihr retten wollt. Das Ende erzählt, wie viel davon übrig ist.</li>
        <li>Die Uhr ist kein Zeitdruck in echten Minuten. Ihr könnt in Ruhe reden und überlegen.</li>
      </ul>` },
    { id: "entscheiden", titel: "Entscheidungen und ihre Folgen", html: `
      <ul>
        <li><b>Gespräche:</b> Ihr könnt in beliebiger Reihenfolge fragen. Ein <b>✦</b> markiert, was ihr nicht auslassen solltet. Mit dem goldenen Knopf geht es weiter; was ihr nicht gefragt habt, erfahrt ihr dann nicht mehr.</li>
        <li><b>Abstimmungen:</b> Jede Person stimmt auf ihrem Handy ab, die Mehrheit entscheidet. Bei Gleichstand entscheidet der Würfel.</li>
        <li><b>Geheime Entscheidungen:</b> Jede Person entscheidet für sich. Die anderen sehen nur, wie die Gruppe insgesamt entschieden hat, nicht wer was gewählt hat. Manches davon kommt später ans Licht.</li>
        <li><b>„Das hat Folgen“:</b> Diese Zeile erscheint, wenn eine Entscheidung später zählt.</li>
        <li><b>„Eure Spur“:</b> So markierte Absätze stehen nur da, weil ihr vorher etwas getan oder gelassen habt.</li>
        <li><b>Heldenmomente:</b> Jeder Held hat eigene Auftritte und bekommt am Lagerfeuer eine eigene Frage.</li>
        <li><b>Am Ende</b> zeigt die Rückschau, was ihr getan habt, und deutet an, woran die anderen Enden hingen. Jedes neue Ende schaltet für euer Konto einen Helden frei.</li>
      </ul>` },
    { id: "modus", titel: "Normal oder Hardcore", html: `
      <ul>
        <li><b>Normal:</b> Niemand stirbt endgültig. Lagerfeuer und Rückzug bringen alle TP zurück, kurze Rasten sind erlaubt. Gut für die erste Runde und für alle, denen die Geschichte wichtiger ist als die Gefahr.</li>
        <li><b>Hardcore:</b> Wer fällt, würfelt um sein Leben, und der Tod ist endgültig. Keine kurze Rast, kein Rückzug. Für Gruppen, die die Kämpfe schon kennen.</li>
      </ul>` },
    { id: "woerter", titel: "Kleines Wörterbuch", html: `
      <table class="hilfe-tabelle">
        <tr><td><b>W20, W8 …</b></td><td>Würfel mit 20, 8 … Seiten</td></tr>
        <tr><td><b>Bonus</b></td><td>Zahl, die zum Würfelwurf dazukommt</td></tr>
        <tr><td><b>TP</b></td><td>Trefferpunkte, das Leben</td></tr>
        <tr><td><b>RK</b></td><td>Rüstungsklasse: So hoch muss ein Angriff würfeln</td></tr>
        <tr><td><b>SG</b></td><td>Schwierigkeitsgrad: So hoch muss eine Probe oder ein Rettungswurf würfeln</td></tr>
        <tr><td><b>Rettungswurf</b></td><td>Das Ziel würfelt, um einer Wirkung zu entgehen</td></tr>
        <tr><td><b>Probe</b></td><td>Würfelwurf außerhalb des Kampfes</td></tr>
        <tr><td><b>Vorteil / Nachteil</b></td><td>Zweimal würfeln, der bessere / schlechtere zählt</td></tr>
        <tr><td><b>Kritischer Treffer</b></td><td>Gewürfelte 20: doppelte Schadenswürfel</td></tr>
        <tr><td><b>Aktion / Bonusaktion</b></td><td>Das Große und das Kleine, das du in deinem Zug tun kannst</td></tr>
        <tr><td><b>Reaktion</b></td><td>Etwas, das sich im Zug eines anderen von selbst auslöst</td></tr>
        <tr><td><b>Zauberplatz</b></td><td>Vorrat für Zauber; kommt am Lagerfeuer zurück</td></tr>
        <tr><td><b>Initiative</b></td><td>Die Reihenfolge im Kampf</td></tr>
        <tr><td><b>Stufe</b></td><td>Erfahrung der Gruppe: mehr TP, neue Fähigkeiten</td></tr>
      </table>` },
  ];
  /** HTML der Hilfe-Seite: aufklappbare Abschnitte, der erste ist offen */
  function html() {
    return `<nav class="hilfe-inhalt" aria-label="Inhalt">${TEILE.map((t) => `<button type="button" data-hilfe-zu="${t.id}">${t.titel}</button>`).join("")}</nav>
      ${TEILE.map((t, i) => `<details class="hilfe-teil" id="hilfe-${t.id}"${i < 2 ? " open" : ""}><summary>${t.titel}</summary><div class="hilfe-text">${t.html}</div></details>`).join("")}`;
  }
  /** Sprungmarken im Inhaltsverzeichnis: Abschnitt öffnen und hinrollen */
  function binden(wurzel) {
    (wurzel || document).querySelectorAll("[data-hilfe-zu]").forEach((b) => { b.onclick = () => { const d = document.getElementById("hilfe-" + b.dataset.hilfeZu); if (!d) return; d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); }; });
  }
  window.ABHILFE = { html, binden, TEILE };
})();
