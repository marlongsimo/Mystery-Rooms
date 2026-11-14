/*
 * Mythara – Heldenmomente: Was nur dieser eine Held sagt, denkt oder erzählt.
 * Die Kampagnen sprechen meist „ihr“ an. Hier steht, was jede Figur für sich mitbringt:
 *
 *   feuer     eine persönliche Frage am Lagerfeuer (geheime Szene, jede Person bekommt ihre eigene),
 *             zwei Antworten mit „echo“: der Satz, den die anderen danach hören und den das Ende aufgreift
 *   stimmen   kurze Auftritte zu wiederkehrenden Lagen. Eine Szene ruft h.stimme(A, "kind") auf und
 *             bekommt den Moment einer Figur aus der Gruppe (reihum, damit jede drankommt):
 *               kind      ein Kind ist in Gefahr oder gerettet
 *               gnade     ein besiegter Gegner liegt am Boden
 *               gold      eine Versuchung, allein, ungesehen (in der Du-Form: nur diese Person liest es)
 *               angst     etwas Unheimliches, das man nicht bekämpfen kann
 *               fremde    ein Dorf, das Fremden misstraut
 *               abschied  das Ende einer Nacht, der Aufbruch
 *
 * Neue Lagen: hier je Figur eine Zeile ergänzen. Fehlt einer Figur eine Zeile, kommt eine andere dran.
 */
(function (root) {
  "use strict";
  const M = {
    schildwaechter: {
      feuer: { frage: "Tebbe zeigt auf deinen Schild. „Wen hast du damit schon beschützt?“",
        antworten: [
          { id: "nicht", text: "„Nicht alle, die ich wollte.“", echo: "Torvald hat am Feuer von denen erzählt, die er nicht beschützen konnte. Er hat keine Namen genannt. Er kennt sie alle." },
          { id: "jeden", text: "„Jeden, der hinter mir stand.“", echo: "Torvald hat am Feuer gesagt, hinter seinem Schild sei noch nie jemand gefallen. Er hat dabei ins Feuer gesehen, nicht in die Runde." },
        ] },
      stimmen: {
        kind: "Torvald geht als Erster hinein und stellt sich so, dass sein Schild zwischen dem Jungen und der Tür ist. Erst dann atmet er aus.",
        gnade: "Torvald senkt den Schild nicht. „Ich habe geschworen, die zu schützen, die sich nicht wehren können“, sagt er. Er klingt nicht sicher, ob das hier dazugehört.",
        gold: "Du denkst an die, die du verloren hast. Keine Münze der Welt hätte auch nur eine von ihnen gerettet.",
        angst: "Torvald hebt den Schild, aus Gewohnheit. Dann merkt er, dass es nichts gibt, wovor er ihn halten könnte, und das ist schlimmer als jeder Hieb.",
        fremde: "Torvald stellt sich breit hin und legt die Hand nicht ans Schwert. Die Männer mit den Fackeln sehen es, und einer tritt einen Schritt zurück.",
        abschied: "Torvald prüft vor dem Aufbruch jeden Riemen an seinem Schild. Er zählt die Gruppe durch, leise, zweimal.",
      },
    },
    berserker: {
      feuer: { frage: "Tebbe starrt auf deine Narben. „Tut das noch weh?“",
        antworten: [
          { id: "immer", text: "„Immer. Darum weiß ich, dass ich noch da bin.“", echo: "Ragnar hat am Feuer gesagt, der Schmerz sei das Einzige, das ihn noch nie belogen habe. Tebbe hat lange darüber nachgedacht." },
          { id: "nie", text: "„Nein. Schon lange nicht mehr.“", echo: "Ragnar hat am Feuer gesagt, ihm tue nichts mehr weh. Er hat dabei gelacht. Niemand sonst hat gelacht." },
        ] },
      stimmen: {
        kind: "Ragnar bleibt in der Tür stehen, als er den Jungen sieht. Seine Hände sind noch rot. Er wischt sie an der Hose ab, lange, bevor er näher kommt.",
        gnade: "Ragnar steht über dem Tier, die Axt halb erhoben, und sein Atem geht schwer. „Sagt es schnell“, knurrt er. „Sonst entscheide ich.“",
        gold: "Du wiegst den Beutel in der Hand. Er wiegt weniger als deine Axt, und er hat dir noch nie das Leben gerettet.",
        angst: "Ragnar grinst, wie immer, wenn etwas gefährlich wird. Dann merkt er, dass es nichts zum Zuschlagen gibt, und das Grinsen bleibt ihm im Gesicht stehen.",
        fremde: "Ragnar lacht, als er die Fackeln sieht, laut und freundlich. Es beruhigt niemanden.",
        abschied: "Ragnar schultert die Axt und geht voraus, ohne sich umzudrehen. Am Dorfrand hebt er doch einmal die Hand.",
      },
    },
    duellant: {
      feuer: { frage: "Tebbe will wissen: „Hast du schon mal verloren?“",
        antworten: [
          { id: "einmal", text: "„Einmal. Ich denke jeden Tag daran.“", echo: "Isolde hat am Feuer von dem einen Gegner erzählt, den sie nie besiegt hat. Sie hat ihn nicht beschrieben. Das Feuer hat es für sie getan." },
          { id: "nein", text: "„Nein.“", echo: "Isolde hat am Feuer gesagt, sie habe nie verloren. Sie hat zu schnell geantwortet, und Tebbe hat es gemerkt." },
        ] },
      stimmen: {
        kind: "Isolde steckt das Rapier weg, bevor sie zu dem Jungen geht. Niemand hat sie je so behutsam eine Klinge wegstecken sehen.",
        gnade: "Isolde senkt die Klinge um eine Handbreit. „Sie hat verloren“, sagt sie. „Ich schlage niemanden, der schon verloren hat.“ Es klingt wie eine Regel, die sie sich selbst gegeben hat.",
        gold: "Du hast dir nie etwas genommen, das du nicht gewonnen hast. Das hier wäre nicht gewonnen.",
        angst: "Isolde sucht die Lücke, wie bei jedem Gegner. Es gibt keine. Es gibt nicht einmal einen Gegner.",
        fremde: "Isolde mustert die Männer einen nach dem anderen und weiß nach drei Herzschlägen, wer zuerst zuschlagen würde. Sie stellt sich neben genau diesen.",
        abschied: "Isolde verbeugt sich vor dem Dorf, knapp und förmlich, wie vor einem Gegner, den sie achtet.",
      },
    },
    gelehrter: {
      feuer: { frage: "Tebbe blättert in deinem Buch, ohne ein Wort zu verstehen. „Wozu musst du das alles wissen?“",
        antworten: [
          { id: "ordnung", text: "„Weil die Welt eine Ordnung hat. Ich will sie sehen.“", echo: "Lyra hat am Feuer erklärt, alles habe eine Ordnung, auch diese Nacht. Tebbe hat gefragt, welche. Darauf hatte sie zum ersten Mal keine Antwort." },
          { id: "angst", text: "„Weil mir das, was ich nicht verstehe, Angst macht.“", echo: "Lyra hat am Feuer zugegeben, dass sie liest, weil sie sich vor dem fürchtet, was sie nicht versteht. Seitdem hält sie das Buch ein wenig lockerer." },
        ] },
      stimmen: {
        kind: "Lyra kniet sich vor den Jungen und fragt ihn nach dem Namen der Katze. Es ist die klügste Frage, die an diesem Abend jemand stellt: Er hört auf zu zittern.",
        gnade: "Lyra sieht das Tier lange an. „Es folgt einer Ursache“, sagt sie. „Wenn wir die Ursache nicht töten, haben wir nichts getötet.“",
        gold: "Du zählst die Münzen nicht. Du liest den Namen auf dem Beutel, und danach ist es kein Fund mehr, sondern ein Eigentum.",
        angst: "Lyra sucht nach dem Wort für das, was sie sieht. Sie kennt vierzehn Sprachen. In keiner gibt es eines.",
        fremde: "Lyra hört den Männern zu und sortiert im Kopf, was sie wissen und was sie nur fürchten. Die zweite Liste wird länger.",
        abschied: "Lyra schreibt den Namen des Dorfes in ihr Buch, darunter drei Zeilen. Sie zeigt sie niemandem.",
      },
    },
    elementarist: {
      feuer: { frage: "Tebbe hält die Hände ans Lagerfeuer. „Kannst du machen, dass es nie ausgeht?“",
        antworten: [
          { id: "nein", text: "„Ein Feuer, das nie ausgeht, will niemand. Glaub mir.“", echo: "Vaelin hat am Feuer gesagt, das Schlimmste an einer Flamme sei, wenn sie nicht mehr aufhört. Er hat dabei seine eigenen Hände angesehen." },
          { id: "ja", text: "„Ja. Sieh hin.“", echo: "Vaelin hat für Tebbe eine kleine Flamme auf der Handfläche tanzen lassen, bis der Junge lachte. Er hat sie danach länger brennen lassen als nötig." },
        ] },
      stimmen: {
        kind: "Vaelin lässt eine winzige Flamme über seine Finger laufen, damit der Junge etwas Warmes zum Ansehen hat. „Die tut nichts“, sagt er. „Die gehört zu mir.“",
        gnade: "Zwischen Vaelins Fingern knistert es noch. Er schließt die Faust, und es wird still. „Feuer fragt nicht“, sagt er. „Ich schon. Also?“",
        gold: "Münzen schmelzen bei einer Hitze, die du mit zwei Fingern machst. Du hast nie verstanden, warum Leute dafür lügen.",
        angst: "Vaelin lässt Licht in seiner Hand aufflammen. Die Lichter da draußen flackern nicht einmal. Seines schon.",
        fremde: "Vaelin sieht auf die Fackeln der Männer und kann nicht anders: Eine nach der anderen brennen sie kleiner. Er tut, als wäre es der Wind.",
        abschied: "Vaelin zündet im Vorbeigehen die Laterne am Dorfrand an, mit einem Fingerschnippen. „Damit ihr uns kommen seht“, sagt er, „falls wir zurückkommen.“",
      },
    },
    schattenmagier: {
      feuer: { frage: "Tebbe sieht dich an, als suche er etwas. „Wie siehst du in echt aus?“",
        antworten: [
          { id: "so", text: "„So. Meistens.“", echo: "Morwen hat am Feuer für einen Augenblick nichts verborgen. Nur Tebbe hat hingesehen. Er hat gesagt, sie sehe müde aus, und sie hat genickt." },
          { id: "frag", text: "„Frag lieber, wie ich aussehen will.“", echo: "Morwen hat am Feuer nicht verraten, wie sie wirklich aussieht. Tebbe hat es dreimal versucht. Beim dritten Mal war sie eine Katze." },
        ] },
      stimmen: {
        kind: "Morwen lässt den Schatten in der Ecke kleiner werden, bis er nur noch ein Schatten ist. Der Junge hat es nicht bemerkt. Er hat nur aufgehört, dorthin zu starren.",
        gnade: "Morwen legt den Kopf schräg. „Sie zeigt uns, was sie ist“, sagt sie leise. „Das können nicht viele. Ich weiß, wovon ich rede.“",
        gold: "Niemand würde es je erfahren. Niemand erfährt je etwas über dich. Genau das ist ja das Schwere.",
        angst: "Morwen kennt Trugbilder. Das da draußen ist keines, und zum ersten Mal wünscht sie, es wäre eines.",
        fremde: "Morwen steht plötzlich nicht mehr dort, wo die Männer sie eben noch gesehen haben. Es hilft nicht gegen das Misstrauen. Sie merkt es und tritt wieder ins Licht.",
        abschied: "Als ihr geht, behauptet ein Kind steif und fest, die Frau mit dem dunklen Mantel habe ihm zugewinkt. Niemand sonst hat es gesehen.",
      },
    },
    schattenlaeufer: {
      feuer: { frage: "Tebbe hat dich die ganze Zeit nicht kommen hören. „Vor wem versteckst du dich?“",
        antworten: [
          { id: "allen", text: "„Vor allen. Das ist einfacher, als zu wählen.“", echo: "Darian hat am Feuer gesagt, er verstecke sich vor allen. Er hat es so leise gesagt, dass man sich zu ihm beugen musste, und ist trotzdem sitzen geblieben." },
          { id: "einem", text: "„Vor einem Einzigen. Und der sucht nicht mehr.“", echo: "Darian hat am Feuer von jemandem erzählt, der aufgehört hat, ihn zu suchen. Ob er darüber froh ist, hat er nicht gesagt." },
        ] },
      stimmen: {
        kind: "Darian ist schon oben auf dem Mühlboden, bevor jemand die Leiter findet. Er setzt sich neben den Jungen, ohne etwas zu sagen. Er weiß, wie es ist, sich zu verstecken.",
        gnade: "Darian steht im Rücken des Tiers, wo er immer steht, das Messer schon in der Hand. Er wartet. Es ist das erste Mal an diesem Abend, dass er auf jemanden wartet.",
        gold: "Du hast schon aus Taschen gelebt, die voller waren als diese. Aber die gehörten nie einer Witwe mit Namen.",
        angst: "Darian sucht den Schatten, in den er treten kann. Im Licht dieser Lichter wirft nichts einen Schatten.",
        fremde: "Die Männer zählen eure Gruppe und kommen auf einen zu wenig. Darian lehnt hinter ihnen an der Hauswand und hört zu.",
        abschied: "Niemand sieht Darian gehen. Aber auf der Schwelle von Lenes Haus liegt am Morgen eine Münze, die vorher nicht da war.",
      },
    },
    trickser: {
      feuer: { frage: "Tebbe hat deinen Münztrick durchschaut. „Lügst du immer?“",
        antworten: [
          { id: "nie", text: "„Nie, wenn es jemand merken könnte.“", echo: "Silra hat am Feuer zugegeben, dass sie lügt, sobald niemand es merken kann. Tebbe hat gefragt, ob das gerade auch gelogen war. Sie hat sehr lange gelacht." },
          { id: "gern", text: "„Nur zu Leuten, die ich mag.“", echo: "Silra hat am Feuer gesagt, sie belüge nur Leute, die sie mag. Dann hat sie Tebbe die Münze geschenkt, mit der sie ihn hereingelegt hatte." },
        ] },
      stimmen: {
        kind: "Silra zieht dem Jungen eine Münze hinter dem Ohr hervor, dann noch eine, dann die Katze, die er die ganze Zeit im Arm hatte. Er lacht, bevor er es selbst merkt.",
        gnade: "Silra pfeift leise. „Die blufft nicht“, sagt sie. „Glaubt mir, ich erkenne einen Bluff. Die hat nichts mehr in der Hand.“",
        gold: "Es wäre der leichteste Griff deines Lebens. Vielleicht ist es das, was dich stört: Es wäre zu leicht, um stolz darauf zu sein.",
        angst: "Silra will etwas Freches sagen. Es fällt ihr nichts ein. Das ist ihr noch nie passiert.",
        fremde: "Silra lächelt den grimmigsten der Männer an und fragt ihn nach seinem Hund. Er hat tatsächlich einen. Zwei Fackeln sinken.",
        abschied: "Silra umarmt beim Abschied das halbe Dorf. Niemandem fehlt danach etwas. Sie ist selbst ein wenig überrascht darüber.",
      },
    },
    assassine: {
      feuer: { frage: "Tebbe fragt, ohne Scheu: „Hast du schon mal jemanden totgemacht, der es nicht verdient hat?“",
        antworten: [
          { id: "ja", text: "„Ja.“", echo: "Vex hat am Feuer nur ein Wort gesagt: Ja. Tebbe hat genickt, als habe er die ehrlichste Antwort seines Lebens bekommen, und ist nicht weggerückt." },
          { id: "frage", text: "„Wer entscheidet, wer es verdient?“", echo: "Vex hat Tebbes Frage am Feuer mit einer Gegenfrage beantwortet. Der Junge hatte keine Antwort. Vex auch nicht, und das hat man ihm angesehen." },
        ] },
      stimmen: {
        kind: "Vex bleibt an der Tür stehen und hält Wache. Kinder haben Angst vor ihm, das weiß er. Der Junge winkt ihm trotzdem.",
        gnade: "Vex hat die Klinge schon wieder verschwinden lassen. „Dafür hat mich niemand bezahlt“, sagt er. Es ist nicht klar, ob das ein Einwand ist oder eine Erleichterung.",
        gold: "Du hast für weniger getötet. Du hast noch nie für weniger gestohlen. Seltsam, wo deine Grenzen liegen.",
        angst: "Vex zählt, wie viele es sind und wie schnell er wäre. Dann begreift er, dass man das hier nicht töten kann, und wird sehr ruhig.",
        fremde: "Vex steht im Halbdunkel und sagt nichts. Die Männer reden lauter, je länger er schweigt.",
        abschied: "Vex geht als Letzter und sieht sich nicht um. An der Dorflinde bleibt er kurz stehen und merkt sich die Gesichter. Diesmal aus einem anderen Grund als sonst.",
      },
    },
    lichtbringer: {
      feuer: { frage: "Tebbe zeigt auf dein heiliges Zeichen. „Hört dich da oben wirklich jemand?“",
        antworten: [
          { id: "ja", text: "„Ja. Nicht immer so, wie ich es mir wünsche.“", echo: "Elara hat am Feuer gesagt, das Licht höre sie, aber es antworte nicht immer so, wie sie es sich wünsche. Sie hat an jemanden gedacht dabei, das konnte man sehen." },
          { id: "hoffe", text: "„Ich hoffe es. Jeden Tag neu.“", echo: "Elara hat am Feuer zugegeben, dass sie nicht weiß, ob sie gehört wird, nur hofft. Tebbe fand, das sei mutiger, als es zu wissen." },
        ] },
      stimmen: {
        kind: "Elara legt dem Jungen die Hand auf die Stirn und spricht drei Worte, die niemand versteht. Er schläft nicht ein. Er hört nur auf, die Tür anzustarren.",
        gnade: "Elara tritt zwischen die Gruppe und das Tier, ohne es recht zu merken. „Das Licht unterscheidet nicht zwischen Mensch und Kröte, wenn etwas Angst hat“, sagt sie.",
        gold: "Du kennst die Witwe nicht. Aber du hast oft genug am Bett von Leuten gesessen, denen genau so ein Beutel gefehlt hat.",
        angst: "Elara hebt ihr Zeichen, und es leuchtet. Die Lichter über dem Wasser leuchten auch. Zum ersten Mal ist ihr Licht nicht das einzige, das nicht flackert.",
        fremde: "Elara geht geradewegs auf die Fackeln zu, die Hände offen. Zwei der Männer nehmen die Mütze ab, bevor sie wissen, warum.",
        abschied: "Elara segnet die Schwelle des Speichers, bevor ihr geht. Hanne tut, als hätte sie es nicht gesehen, und wischt sich mit dem Mehl im Gesicht herum.",
      },
    },
    wanderheiler: {
      feuer: { frage: "Tebbe sieht zu, wie du Verbände wickelst. „Warum bleibst du nie irgendwo?“",
        antworten: [
          { id: "wunden", text: "„Weil es überall jemanden gibt, der blutet.“", echo: "Brogar hat am Feuer gesagt, er ziehe weiter, weil überall jemand blute. Er hat dabei Tebbes Schramme verbunden, die gar keinen Verband gebraucht hätte." },
          { id: "bleiben", text: "„Weil ich einmal geblieben bin. Es ging nicht gut aus.“", echo: "Brogar hat am Feuer von einem Ort erzählt, an dem er einmal geblieben ist. Mehr als diesen einen Satz hat er nicht gesagt. Er hat danach sehr gründlich seine Tasche gepackt." },
        ] },
      stimmen: {
        kind: "Brogar hat die Tasche schon offen, bevor er kniet. „Erst die Wunde“, murmelt er. „Dann die Frage, was du hier oben zu suchen hattest.“ Die Frage stellt er dann nie.",
        gnade: "Brogar besieht sich die Wunden des Tiers, wie er jede Wunde besieht. „Die heilen“, sagt er sachlich. „Wenn man sie lässt.“",
        gold: "Du hast dein Leben lang geflickt, was andere zerschlagen haben. Du weißt genau, wie lange eine Witwe von so einem Beutel lebt.",
        angst: "Brogar tastet nach seiner Tasche. Es gibt keine Salbe gegen das hier. Er sucht trotzdem weiter.",
        fremde: "Brogar fragt in die Runde, wer von den Männern den Husten hat, den er die ganze Zeit hört. Einer hebt zögernd die Hand, und mit ihm senkt sich die Fackel.",
        abschied: "Brogar lässt beim Kräuterweib ein Päckchen zurück, mit einer Zeichnung, wie man es anwendet. Er hat nie gelernt, sich anders zu verabschieden.",
      },
    },
    inquisitor: {
      feuer: { frage: "Tebbe fragt geradeheraus: „Merkst du es immer, wenn jemand lügt?“",
        antworten: [
          { id: "immer", text: "„Immer. Es ist kein Geschenk.“", echo: "Seran hat am Feuer gesagt, er merke jede Lüge, und das sei kein Geschenk. Danach hat eine Weile niemand etwas gesagt, nur um sicherzugehen." },
          { id: "fast", text: "„Fast immer. Bei denen, die ich mag, will ich es nicht merken.“", echo: "Seran hat am Feuer zugegeben, dass er bei Leuten, die er mag, die Lüge lieber nicht bemerkt. Er hat dabei kurz in die Runde gesehen." },
        ] },
      stimmen: {
        kind: "Seran fragt den Jungen nur einmal, ob er verletzt ist, und sieht ihm dabei ins Gesicht. Was er dort liest, behält er für sich. Aber er bleibt neben ihm stehen.",
        gnade: "Seran sieht dem Tier in die Augen, wie er jedem in die Augen sieht. „Da ist keine Lüge“, sagt er. „Tiere können das nicht. Das macht es nicht leichter.“",
        gold: "Du hast Menschen für weniger verurteilt. Die Frage ist, ob du dich selbst genauso streng ansiehst.",
        angst: "Seran stellt die Frage, die er immer stellt: Was bist du? Es kommt keine Antwort. Er fragt nur einmal.",
        fremde: "Seran lässt die Männer ausreden. Dann wiederholt er leise den einen Satz, der nicht gestimmt hat. Der, der ihn gesagt hat, wird rot bis unter die Mütze.",
        abschied: "Seran dankt Hanne förmlich und meint es. Sie merkt es, weil er der Einzige ist, der dabei nicht lächelt.",
      },
    },
    wildnislaeufer: {
      feuer: { frage: "Tebbe fragt: „Bist du immer allein unterwegs?“",
        antworten: [
          { id: "besser", text: "„Ja. So verliert man niemanden.“", echo: "Kael hat am Feuer gesagt, wer allein gehe, könne niemanden verlieren. Er saß dabei mitten zwischen den anderen und hat es selbst gemerkt." },
          { id: "frueher", text: "„Früher nicht.“", echo: "Kael hat am Feuer zwei Worte gesagt: Früher nicht. Tebbe hat nicht weitergefragt. Er hat ihm nur eine der jungen Katzen auf das Knie gesetzt." },
        ] },
      stimmen: {
        kind: "Kael hat den Jungen schon gehört, bevor ihr die Mühle betreten habt: wie er atmet, wo er sitzt. Er nickt nach oben. „Er lebt. Und er hat etwas Kleines im Arm.“",
        gnade: "Kael geht in die Hocke, auf Augenhöhe mit dem Tier. „Sie verteidigt ein Revier, das nicht ihres ist“, sagt er. „Das tut nur, wer aus dem eigenen vertrieben wurde.“",
        gold: "Draußen brauchst du nichts davon. Du hast es schon einmal versucht, mit Geld etwas zurückzukaufen. Es geht nicht.",
        angst: "Kael liest Spuren, seit er laufen kann. Diese Lichter hinterlassen keine. Nichts, was lebt, hinterlässt keine.",
        fremde: "Kael sieht nicht die Männer an, sondern ihre Stiefel. Zwei davon waren heute schon im Moor. Er merkt sich, welche.",
        abschied: "Kael zeigt Tebbe im Gehen noch, wie man am Moos erkennt, wo Norden ist. „Falls du noch mal wegläufst“, sagt er. „Dann wenigstens richtig.“",
      },
    },
    tiergefaehrte: {
      feuer: { frage: "Tebbe krault Grau hinter den Ohren. „Was machst du, wenn er mal nicht mehr da ist?“",
        antworten: [
          { id: "nicht", text: "„Daran denke ich nicht. Noch nicht.“", echo: "Faye hat am Feuer gesagt, über einen Tag ohne Grau denke sie nicht nach. Der Wolf hat den Kopf auf ihren Fuß gelegt, als hätte er zugehört." },
          { id: "folgen", text: "„Dann gehe ich dahin, wo er hingegangen ist.“", echo: "Faye hat am Feuer gesagt, sie werde Grau eines Tages folgen, wohin er auch gehe. Tebbe hat den Wolf danach fester gehalten als die Katzen." },
        ] },
      stimmen: {
        kind: "Grau ist schneller oben als alle anderen. Als Faye nachkommt, liegt der Wolf quer vor dem Jungen, und die Katze faucht ihn an, und keiner von beiden gibt nach.",
        gnade: "Grau hat aufgehört zu knurren. Faye sieht es und senkt den Bogen. „Er kämpft nicht mehr“, sagt sie. „Er weiß so etwas früher als ich.“",
        gold: "Grau sieht dich an. Er versteht nichts von Münzen. Er versteht nur, ob du danach noch dieselbe bist.",
        angst: "Grau, der vor nichts zurückweicht, drückt sich an Fayes Bein und winselt. Das hat er noch nie getan.",
        fremde: "Die Männer weichen vor dem Wolf zurück. Faye legt Grau die Hand in den Nacken, und er setzt sich, mitten auf dem Dorfplatz, und gähnt.",
        abschied: "Grau läuft noch einmal um den ganzen Dorfplatz, die Nase am Boden. Dann erst folgt er Faye. Er merkt sich Orte, an denen es gut war.",
      },
    },
    kopfgeldjaeger: {
      feuer: { frage: "Tebbe hat die Steckbriefe in deiner Tasche gesehen. „Findest du jeden?“",
        antworten: [
          { id: "einen", text: "„Jeden bis auf einen.“", echo: "Orin hat am Feuer von dem Einen erzählt, den er nie gefunden hat. Er trägt dessen Steckbrief seit Jahren bei sich. Das Papier ist an den Falten durchgescheuert." },
          { id: "jeden", text: "„Jeden. Die Frage ist nur, was er wert ist.“", echo: "Orin hat am Feuer gesagt, jeder Mensch habe einen Preis. Tebbe hat gefragt, was er selbst wert sei. Orin hat lange überlegt und dann gesagt: Mehr als ich bezahlen könnte." },
        ] },
      stimmen: {
        kind: "Orin hat den Jungen in der Zeit eines Atemzugs gefunden; im Finden ist er gut. Dann steht er etwas ratlos da. Was man mit Gefundenen macht, die man nicht abliefert, hat ihm nie jemand gezeigt.",
        gnade: "Orin sieht das Tier an, wie er alles ansieht: was es wert ist, was es kostet. „Auf die gibt es kein Kopfgeld“, sagt er. „Und ich arbeite nicht umsonst. Glück für sie.“",
        gold: "Du weißt auf die Münze genau, was das wert ist. Du weißt auch, was es kostet. Das sind zwei verschiedene Zahlen.",
        angst: "Orin sucht nach der Schwäche, die alles hat. Zum ersten Mal findet er keine und merkt, dass er darum auch keinen Preis nennen könnte.",
        fremde: "Orin erkennt den Blick der Männer. So sieht man ihn in jedem Dorf an. Er nennt ihnen einen Preis dafür, die Kinder zu finden. Null. Das bringt sie aus dem Tritt.",
        abschied: "Orin zählt das Silber nicht nach. Wer ihn kennt, weiß, dass das bei ihm einer Liebeserklärung gleichkommt.",
      },
    },
  };
  /* ---------- Zweite und dritte Fragerunde, weitere Lagen ----------
   *   nacht   eine Frage, die sich die Figur in einer stillen Nacht selbst stellt (aus ihrer „Versuchung“)
   *   weg     warum sie morgen weitergeht
   *   Lagen:  wasser (ein Fluss, eine Überfahrt) · gefangen (jemand wird befreit) · tote (Gräber, Wiedergänger)
   *           kaelte (Frost, Erschöpfung) · schutz (jemand Schwächeres hängt an euch) · macht (etwas Mächtiges in Reichweite) */
  const MEHR = {
    schildwaechter: {
      nacht: { frage: "Die Glut ist fast aus. Du denkst an die, die du verloren hast. Wenn dir jemand anböte, einen von ihnen zurückzuholen: Würdest du nach dem Preis fragen?",
        antworten: [
          { id: "nein", text: "Nein. Ich würde ihn holen.", echo: "Torvald hat in der Nacht lange wach gelegen. Am Morgen hat er gesagt, es gebe Dinge, bei denen er nicht nach dem Preis fragen würde. Er hat es wie eine Warnung gesagt." },
          { id: "ja", text: "Ja. Und ich hätte Angst vor der Antwort.", echo: "Torvald hat in der Nacht lange wach gelegen. Am Morgen hat er gesagt, man müsse die Toten tot sein lassen. Es hat ihn sichtlich etwas gekostet." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "diese", text: "Wegen der Leute neben mir. Diesmal verliere ich keinen.", echo: "Torvald hat gesagt, er gehe weiter, damit diesmal alle zurückkommen. Er hat jeden von euch dabei angesehen, einzeln." },
          { id: "schuld", text: "Weil ich etwas gutzumachen habe.", echo: "Torvald hat gesagt, er habe etwas gutzumachen. Was, hat er nicht gesagt. Aber er trägt seinen Schild seither, als wöge er weniger." },
        ] },
      stimmen: {
        wasser: "Torvald geht als Letzter aufs Wasser. In Kette und Schild schwimmt niemand, das weiß er genau. Er geht trotzdem.",
        gefangen: "Torvald bricht den Riegel mit der Schildkante, bevor jemand nach einem Schlüssel suchen kann. „Hinter mich“, sagt er. Er sagt es zu jedem, den er befreit.",
        tote: "Torvald liest die Namen auf den Steinen, einen nach dem anderen, halblaut. Bei manchen bleibt er stehen, als kenne er sie.",
        kaelte: "Torvalds Kettenhemd ist so kalt, dass es brennt. Er zieht es nicht aus. Er stellt sich nur so, dass er den anderen den Wind nimmt.",
        schutz: "Torvald geht einen halben Schritt schräg vor ihr, den Schild auf ihrer Seite. Er hat es nicht entschieden. Er steht einfach immer dort.",
        macht: "Torvald sieht es an und denkt nicht an sich. Er denkt an eine Tür, die er einmal zu spät erreicht hat. Dann macht er die Faust zu.",
      },
    },
    berserker: {
      nacht: { frage: "Die Glut ist fast aus. Du erinnerst dich an das letzte Mal, als du Angst hattest. Fehlt sie dir?",
        antworten: [
          { id: "ja", text: "Ja. Wer keine Angst hat, hat auch sonst nicht mehr viel.", echo: "Ragnar hat in der Nacht gesagt, er vermisse es, sich zu fürchten. Niemand wusste, was man darauf sagt. Er hat es auch nicht erwartet." },
          { id: "nein", text: "Nein. Ohne sie bin ich schneller.", echo: "Ragnar hat in der Nacht gesagt, Angst mache nur langsam. Dann hat er sehr lange die eigenen Hände angesehen, ob sie zittern. Sie haben nicht gezittert." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "kampf", text: "Weil dort etwas ist, das zurückschlägt.", echo: "Ragnar hat gesagt, er gehe weiter, weil dort endlich etwas warte, das sich wehrt. Er hat sich darauf gefreut. Das war das Unheimliche daran." },
          { id: "ihr", text: "Weil ihr ohne mich draufgeht.", echo: "Ragnar hat gesagt, ohne ihn kämt ihr nicht weit. Er hat gegrinst dabei, und zum ersten Mal sah es nicht nach Kampf aus." },
        ] },
      stimmen: {
        wasser: "Ragnar steht am Bug und lässt sich das Wasser ins Gesicht schlagen. „Kalt“, sagt er zufrieden, als wäre das ein Geschenk.",
        gefangen: "Ragnar zerschlägt die Kette mit zwei Hieben und hält dann inne, die Axt noch erhoben, weil der Befreite vor ihm zurückweicht. Er lässt die Axt sehr langsam sinken.",
        tote: "Ragnar hat keine Angst vor den Toten. Er betrachtet sie eher neidisch: Die haben es hinter sich.",
        kaelte: "Ragnar hat den Mantel offen. „Solange es wehtut, erfriert man nicht“, sagt er. Seine Lippen sind blau.",
        schutz: "Ragnar ist kein Beschützer. Er stellt sich einfach dorthin, wo es zuerst kracht. Dass sie dadurch hinter ihm steht, scheint ihn selbst zu überraschen.",
        macht: "Ragnar streckt die Hand aus und zieht sie zurück. „Das fühlt sich an wie kurz vor der Raserei“, sagt er. „Nur ohne das Danach.“",
      },
    },
    duellant: {
      nacht: { frage: "Die Glut ist fast aus. Du denkst an den einen Kampf, den du verloren hast. Würdest du ihn tauschen gegen alle, die du gewonnen hast?",
        antworten: [
          { id: "ja", text: "Sofort.", echo: "Isolde hat in der Nacht gesagt, sie gäbe jeden Sieg für den einen her, der ihr fehlt. Sie hat dabei die Klinge gewetzt, die längst scharf war." },
          { id: "nein", text: "Nein. Die Niederlage hat mich besser gemacht als jeder Sieg.", echo: "Isolde hat in der Nacht gesagt, ihre eine Niederlage sei das Beste, das ihr je beigebracht wurde. Sie klang, als höre sie sich das selbst zum ersten Mal sagen." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "gegner", text: "Weil dort ein Gegner wartet, der es wert ist.", echo: "Isolde hat gesagt, sie gehe weiter, weil dort ein würdiger Gegner warte. Sie hat die Handschuhe dabei sehr sorgfältig angezogen." },
          { id: "wort", text: "Weil ich es zugesagt habe.", echo: "Isolde hat gesagt, sie habe ihr Wort gegeben, und mehr Grund brauche sie nicht. Es war die kürzeste Antwort am Feuer und die, die niemand angezweifelt hat." },
        ] },
      stimmen: {
        wasser: "Isolde steht auf dem schwankenden Holz, als wäre es eine Fechtbahn: Gewicht tief, Knie weich. Sie ist die Einzige, die nicht nach einem Halt greift.",
        gefangen: "Isolde durchtrennt die Fesseln mit einem einzigen Schnitt und ritzt dabei nicht einmal die Haut. Sie nickt dem Befreiten zu, knapp, wie nach einem Gefecht.",
        tote: "Isolde erkennt an den Knochen, wie diese Leute gestorben sind. Die meisten von hinten. Das macht sie zornig.",
        kaelte: "Isolde bewegt die Finger der Schwerthand, unablässig, damit sie nicht steif werden. Sie hat schon Kämpfe gesehen, die an kalten Fingern verloren gingen.",
        schutz: "Isolde bringt ihr im Gehen bei, wie man fällt, ohne sich etwas zu brechen. „Das Erste, was man lernt“, sagt sie. „Und das Letzte, was man vergisst.“",
        macht: "Isolde betrachtet es wie einen Gegner, der zu leicht zu schlagen wäre. „Was man geschenkt bekommt“, sagt sie, „hat man nicht.“",
      },
    },
    gelehrter: {
      nacht: { frage: "Die Glut ist fast aus. Wenn es ein Wissen gäbe, das du nie wieder vergessen und nie jemandem sagen könntest: Würdest du die Seite umblättern?",
        antworten: [
          { id: "ja", text: "Ja. Ich könnte nicht anders.", echo: "Lyra hat in der Nacht zugegeben, dass sie jede Seite umblättern würde, auch die, vor der man sie warnt. Sie hat sich nicht dafür entschuldigt." },
          { id: "nein", text: "Nein. Wissen, das man nicht teilen kann, ist nur eine Last.", echo: "Lyra hat in der Nacht gesagt, Wissen ohne jemanden, dem man es erzählen kann, sei nichts wert. Sie hat dabei das Buch zugeklappt und euch angesehen." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "wissen", text: "Weil ich wissen muss, was dort ist.", echo: "Lyra hat gesagt, sie gehe weiter, weil sie es wissen müsse. Nicht wolle. Müsse. Sie hat den Unterschied selbst betont." },
          { id: "zeuge", text: "Weil jemand aufschreiben muss, was wirklich geschehen ist.", echo: "Lyra hat gesagt, jemand müsse aufschreiben, was hier wirklich geschieht, bevor es andere falsch erzählen. Seitdem achtet ihr ein wenig darauf, was ihr in ihrer Nähe sagt." },
        ] },
      stimmen: {
        wasser: "Lyra rechnet halblaut: Strömung, Breite, Gewicht. Das Ergebnis behält sie für sich. Es würde niemanden beruhigen.",
        gefangen: "Lyra fragt den Befreiten als Erstes nach seinem Namen und schreibt ihn auf. „Damit es jemand weiß“, sagt sie, „falls es wieder passiert.“",
        tote: "Lyra liest die Inschriften und stockt. Zwei der Jahreszahlen können nicht stimmen. Oder die Toten liegen nicht dort, wo ihre Steine stehen.",
        kaelte: "Lyra kann das Buch nicht mehr aufschlagen, die Finger gehorchen nicht. Es ist das erste Mal seit Jahren, dass sie eine Stunde lang nichts liest. Sie zählt stattdessen Schritte.",
        schutz: "Lyra erklärt ihr unterwegs die Sternbilder, auch die, die man gerade nicht sieht. Es dauert eine Weile, bis ihr merkt, dass sie das nicht für sich tut.",
        macht: "Lyra liest die Zeichen darauf, und ihre Lippen bewegen sich mit. Jemand muss sie am Ärmel zurückziehen. Sie bedankt sich nicht. Später schon.",
      },
    },
    elementarist: {
      nacht: { frage: "Die Glut ist fast aus. Du könntest sie mit einem Gedanken wieder anfachen. Hast du Angst, dass du eines Tages nicht mehr aufhören kannst?",
        antworten: [
          { id: "ja", text: "Jeden Tag.", echo: "Vaelin hat in der Nacht gesagt, er fürchte den Tag, an dem sein Feuer nicht mehr aufhört. Er hat die Glut ausgehen lassen und im Dunkeln gesessen, um es sich zu beweisen." },
          { id: "nein", text: "Nein. Es gehört mir, nicht umgekehrt.", echo: "Vaelin hat in der Nacht gesagt, das Feuer gehorche ihm und nicht er dem Feuer. In seiner Hand hat dabei etwas geglommen, das er nicht bemerkt hat." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "brennen", text: "Weil dort etwas ist, das brennen muss.", echo: "Vaelin hat gesagt, er gehe weiter, weil dort etwas warte, das brennen müsse. Er hat nicht gesagt, ob er das Ding meint oder sich selbst." },
          { id: "licht", text: "Weil ihr dort unten Licht braucht.", echo: "Vaelin hat gesagt, jemand müsse euch dort leuchten. Er hat dabei eine Flamme hochgehalten, klein und ruhig, wie man sie sonst nie bei ihm sieht." },
        ] },
      stimmen: {
        wasser: "Vaelin hasst Wasser. Er sitzt genau in der Mitte, die Hände in den Ärmeln, und redet kein Wort, bis wieder Land unter dem Kiel ist.",
        gefangen: "Vaelin legt zwei Finger an das Schloss. Es glüht kurz auf und fällt als Tropfen zu Boden. „Schlüssel“, sagt er, „werden überschätzt.“",
        tote: "Vaelin würde sie am liebsten alle verbrennen, sauber, wie es sich gehört. Dass hier niemand verbrannt wurde, findet er das eigentlich Unheimliche.",
        kaelte: "Vaelin hält die Hände um eine Flamme, die kaum größer ist als ein Daumennagel. Mehr gibt die Kälte nicht her. Er teilt sie reihum.",
        schutz: "Vaelin lässt ein Fünkchen neben ihr herschweben, auf Schulterhöhe. „Wenn es ausgeht, ruf“, sagt er. Es geht nicht aus.",
        macht: "Vaelin spürt es, bevor er es sieht: wie Hitze hinter einer Tür. Er weicht einen Schritt zurück. Er weiß am besten, was mit Dingen geschieht, die nicht aufhören.",
      },
    },
    schattenmagier: {
      nacht: { frage: "Die Glut ist fast aus, und im Halbdunkel sieht dich niemand genau. Gibt es noch jemanden, der weiß, wer du wirklich bist?",
        antworten: [
          { id: "nein", text: "Nein. Und so ist es sicherer.", echo: "Morwen hat in der Nacht gesagt, es wisse niemand mehr, wer sie sei, und das sei gut so. Sie saß dabei näher am Feuer als sonst." },
          { id: "einer", text: "Einen. Ich habe ihn lange nicht gesehen.", echo: "Morwen hat in der Nacht von jemandem gesprochen, der sie kennt, wie sie ist. Für die Dauer dieses Satzes hat ihr Gesicht nicht geflimmert." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "sehen", text: "Weil dort etwas ist, das sich besser verbirgt als ich.", echo: "Morwen hat gesagt, sie wolle sehen, was sich dort verbirgt. Bisher habe sich noch nichts vor ihr verstecken können. Es klang nach Neugier und ein wenig nach Kränkung." },
          { id: "gesehen", text: "Weil ihr mich angesehen habt und geblieben seid.", echo: "Morwen hat gesagt, ihr hättet sie angesehen und wärt trotzdem geblieben. Mehr hat sie nicht gesagt. Sie hat danach eine ganze Stunde lang keine Gestalt gewechselt." },
        ] },
      stimmen: {
        wasser: "Morwen sieht ins Wasser und findet kein Spiegelbild, das ihr gefällt. Sie lässt es so, dieses eine Mal.",
        gefangen: "Der Befreite blinzelt Morwen an und fragt, ob sie wirklich da sei. „Meistens“, sagt sie und hält ihm die Hand hin, damit er es prüfen kann.",
        tote: "Morwen spürt die Toten wie einen Zug im Nacken. Sie kennt Schatten. Diese hier sind keine: Sie wollen gesehen werden.",
        kaelte: "Morwen legt ein Trugbild von Feuer über das Lager. Es wärmt nicht. Aber für eine Weile vergisst der Körper, dass er friert, und das ist auch etwas wert.",
        schutz: "Morwen lässt sie für die Augen der anderen ein wenig größer aussehen, ein wenig breiter in den Schultern. „Die meisten greifen nicht an, was stark aussieht“, sagt sie.",
        macht: "Morwen sieht, was es wirklich ist, unter dem, was es zeigt. Sie sagt es nicht. Aber sie stellt sich zwischen das Ding und denjenigen von euch, der es am längsten ansieht.",
      },
    },
    schattenlaeufer: {
      nacht: { frage: "Die Glut ist fast aus. Du bist als Einziger noch wach, wie immer. Wenn dich morgen niemand mehr finden könnte, nie wieder: Wäre das Freiheit?",
        antworten: [
          { id: "ja", text: "Ja. Das wollte ich immer.", echo: "Darian hat in der Nacht gesagt, unauffindbar zu sein sei das Einzige, was er sich je gewünscht habe. Er hat dabei mitten im Feuerschein gesessen, wo ihn jeder sah." },
          { id: "nein", text: "Nein. Nicht mehr.", echo: "Darian hat in der Nacht gesagt, er wolle gefunden werden können, wenn es darauf ankommt. Er hat es so leise gesagt, dass es fast nicht zählte. Es hat trotzdem jeder gehört." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "weg", text: "Weil hinter mir nichts ist, wohin ich zurück könnte.", echo: "Darian hat gesagt, er gehe weiter, weil es für ihn kein Zurück gebe. Er hat es ohne Bitterkeit gesagt, wie eine Wegbeschreibung." },
          { id: "voraus", text: "Weil jemand vorausgehen muss, und mich hört keiner.", echo: "Darian hat gesagt, er gehe voraus, weil ihn niemand höre. Er ist dann wirklich vorausgegangen, und zum ersten Mal hat er sich nach euch umgedreht." },
        ] },
      stimmen: {
        wasser: "Darian ist plötzlich am anderen Ende, ohne dass jemand gesehen hat, wie er über das nasse Holz gekommen ist. Er hält das Seil schon in der Hand.",
        gefangen: "Das Schloss ist offen, bevor jemand merkt, dass Darian sich davor gekniet hat. Er steckt die Dietriche weg und sagt nichts. Der Befreite auch nicht. Sie verstehen sich.",
        tote: "Darian geht an den Gräbern vorbei, ohne einen Stein zu berühren und ohne einen Laut. Die Toten sind die Einzigen, vor denen er sich nie verstecken musste.",
        kaelte: "Darian ist die Kälte gewohnt; wer nie am Feuer sitzt, lernt sie kennen. Er gibt seinen Mantel weiter, wortlos, und tut, als brauche er ihn nicht.",
        schutz: "Sie merkt erst nach einer Stunde, dass Darian die ganze Zeit drei Schritte hinter ihr geht. Sie erschrickt. Dann geht sie ruhiger als vorher.",
        macht: "Darians Finger zucken. Es ist die Sorte Ding, die man einsteckt und mit der man verschwindet, für immer. Er schiebt die Hände in die Taschen und lässt sie dort.",
      },
    },
    trickser: {
      nacht: { frage: "Die Glut ist fast aus. Wenn dir von morgen an jeder alles glauben würde: Wüsstest du dann noch, wer dich wirklich mag?",
        antworten: [
          { id: "egal", text: "Wäre mir gleich. Glauben reicht.", echo: "Silra hat in der Nacht gesagt, ihr reiche es, wenn man ihr glaubt, gemocht werden müsse sie nicht. Niemand hat ihr das geglaubt, und darüber war sie seltsam erleichtert." },
          { id: "nein", text: "Nein. Und das wäre das Schlimmste.", echo: "Silra hat in der Nacht gesagt, sie wolle lieber einmal durchschaut als immer geglaubt werden. Es war der einzige Satz des Abends, den sie nicht mit einem Witz beendet hat." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "geschichte", text: "Weil das die beste Geschichte wird, die ich je erzählt habe.", echo: "Silra hat gesagt, sie gehe weiter, weil daraus eine Geschichte werde, die ihr niemand glauben wird. Sie probt schon die ersten Sätze." },
          { id: "wahr", text: "Weil ich bei euch nicht lügen muss.", echo: "Silra hat gesagt, bei euch müsse sie nicht lügen. Dann hat sie sofort behauptet, das sei gelogen gewesen. Es war nicht gelogen." },
        ] },
      stimmen: {
        wasser: "Silra erzählt während der ganzen Überfahrt eine Geschichte von einem Fährmann, der nicht schwimmen konnte. Sie hat kein gutes Ende. Sie erfindet eines, als sie die Gesichter sieht.",
        gefangen: "Silra hat den Schlüssel längst in der Hand; niemand weiß, wem sie ihn abgenommen hat. „Der hing da so rum“, sagt sie.",
        tote: "Silra macht einen Witz über die Toten, zu laut. Dann entschuldigt sie sich, leise, bei einem der Steine.",
        kaelte: "Silra behauptet, ihr sei warm. Es ist die schlechteste Lüge, die sie je erzählt hat. Ihre Zähne klappern mitten im Satz.",
        schutz: "Silra bringt ihr bei, wie man eine Münze verschwinden lässt. Nutzlos, hier draußen. Aber sie übt es stundenlang und denkt dabei an nichts anderes.",
        macht: "Silra pfeift durch die Zähne. „Damit würde mir jeder alles glauben.“ Sie überlegt. „Dann wüsste ich nie wieder, ob ich gut bin.“ Sie lässt es liegen.",
      },
    },
    assassine: {
      nacht: { frage: "Die Glut ist fast aus. Wenn du einen Namen nennen könntest, und der Mensch wäre fort, ohne Spur, ohne Schuld: Hättest du einen Namen?",
        antworten: [
          { id: "ja", text: "Ja. Seit Jahren.", echo: "Vex hat in der Nacht zugegeben, dass er seit Jahren einen Namen mit sich trägt. Er hat ihn nicht genannt. Aber er hat gesagt, dass er ihn nicht mehr nennen will." },
          { id: "nein", text: "Nein. Meine Arbeit mache ich selbst.", echo: "Vex hat in der Nacht gesagt, was er zu tun habe, tue er mit eigenen Händen und trage es auch selbst. Für seine Verhältnisse war das beinahe ein Bekenntnis." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "auftrag", text: "Weil es der erste Auftrag ist, den ich mir selbst gegeben habe.", echo: "Vex hat gesagt, dies sei der erste Auftrag, für den ihn niemand bezahle. Er hat hinzugefügt, er wisse noch nicht, wie man so etwas zu Ende bringt." },
          { id: "zaehlen", text: "Weil ich wissen will, ob ich auch etwas retten kann.", echo: "Vex hat gesagt, er wolle wissen, ob seine Hände auch etwas anderes können. Dann hat er die Klinge gereinigt, wie jeden Abend, nur langsamer." },
        ] },
      stimmen: {
        wasser: "Vex setzt sich mit dem Rücken zur Bordwand, wo er alle sieht. Gewohnheit. Erst auf halber Strecke merkt er, dass er zum ersten Mal niemanden im Boot als Ziel betrachtet.",
        gefangen: "Vex schneidet die Fesseln durch, ohne dem Befreiten in die Augen zu sehen. Er hat schon Leute losgebunden. Nie, damit sie weglaufen konnten.",
        tote: "Vex zählt die Gräber, ohne es zu wollen. Er zählt immer. Die Zahl hier ist kleiner als seine eigene.",
        kaelte: "Vex friert nicht sichtbar. Wer lange stillhalten musste, in Dachsparren, in Schnee, verlernt das Zittern. Er merkt nur, dass er den Griff seines Messers nicht mehr spürt.",
        schutz: "Vex zeigt ihr, wohin man sticht, wenn man nur einen Versuch hat. Dann zeigt er ihr, wohin man läuft, und sagt, das Zweite sei wichtiger.",
        macht: "Vex sieht es an und weiß sofort, wen er damit töten würde. Das Bild ist so klar, dass er einen Schritt zurücktritt.",
      },
    },
    lichtbringer: {
      nacht: { frage: "Die Glut ist fast aus. Du denkst an jemanden, den dein Licht nicht retten konnte. Wenn du diesen Tod rückgängig machen könntest und dafür ein anderer Unschuldiger stürbe: Würdest du wählen?",
        antworten: [
          { id: "nein", text: "Nein. Das steht mir nicht zu.", echo: "Elara hat in der Nacht gesagt, es stehe ihr nicht zu, ein Leben gegen ein anderes zu wiegen. Sie hat dabei geweint, ohne es zu verbergen." },
          { id: "ja", text: "Ich weiß es nicht. Und das erschreckt mich.", echo: "Elara hat in der Nacht zugegeben, sie wisse nicht, was sie täte, wenn sie einen Tod ungeschehen machen könnte. Sie hat danach lange gebetet, und es klang wie eine Frage." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "licht", text: "Weil dort jemand im Dunkeln sitzt.", echo: "Elara hat gesagt, sie gehe weiter, weil dort unten jemand im Dunkeln sei. Sie meinte damit nicht nur die, die ihr sucht." },
          { id: "pruefung", text: "Weil ich wissen muss, ob mein Licht auch dort noch brennt.", echo: "Elara hat gesagt, sie müsse wissen, ob ihr Licht auch an so einem Ort noch brenne. Es war das erste Mal, dass sie einen Zweifel laut ausgesprochen hat." },
        ] },
      stimmen: {
        wasser: "Elara hält ihr Zeichen über das Wasser. Es spiegelt sich nicht. Sie spricht den Segen trotzdem zu Ende, etwas schneller als sonst.",
        gefangen: "Elara kniet sich hin, noch bevor die Fesseln ab sind, und sieht zuerst nach den Handgelenken. „Es ist vorbei“, sagt sie. Sie sagt es so, dass man es glaubt.",
        tote: "Elara spricht ein Gebet für die Toten. Mitten im Satz hält sie inne: Irgendwo hat jemand mitgesprochen.",
        kaelte: "Elaras Licht wärmt nicht, das hat es nie. Aber alle rücken näher, als sie es entzündet, und das wärmt dann doch.",
        schutz: "Elara geht neben ihr und fragt nicht, wie es ihr geht. Sie fragt, was sie als Kind am liebsten gegessen hat. Zwei Meilen lang reden sie über Apfelkuchen.",
        macht: "Elaras Zeichen wird heiß an ihrer Brust. Sie nimmt es in die Hand und hält es fest, bis die Knöchel weiß sind. „Nicht ansehen“, sagt sie. „Bitte.“",
      },
    },
    wanderheiler: {
      nacht: { frage: "Die Glut ist fast aus. Wenn du jede Wunde schließen könntest, und jede davon ginge bei dir selbst wieder auf: Wie lange würdest du es tun?",
        antworten: [
          { id: "immer", text: "Solange ich stehen kann.", echo: "Brogar hat in der Nacht gesagt, er würde jede fremde Wunde nehmen, solange er noch stehen könne. Niemand hat daran gezweifelt, und genau das hat euch Sorgen gemacht." },
          { id: "nicht", text: "Gar nicht. Ein toter Heiler heilt niemanden.", echo: "Brogar hat in der Nacht gesagt, ein Heiler, der sich aufopfert, sei am nächsten Tag keiner mehr. Er hat es wie etwas gesagt, das er auf die harte Art gelernt hat." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "wunden", text: "Weil ihr dort bluten werdet.", echo: "Brogar hat gesagt, er gehe weiter, weil ihr dort unten bluten werdet und jemand das Nähzeug dabeihaben müsse. Er hat es freundlich gesagt." },
          { id: "bleiben", text: "Weil ich diesmal nicht derjenige sein will, der weiterzieht.", echo: "Brogar hat gesagt, diesmal wolle er bleiben, bis es vorbei ist. Wer ihn kennt, weiß, dass er das noch nie zu jemandem gesagt hat." },
        ] },
      stimmen: {
        wasser: "Brogar hält seine Tasche über den Kopf, während ihm das Wasser um die Knie spült. Nasse Verbände taugen nichts. Nasse Füße verträgt er.",
        gefangen: "Brogar hat schon Salbe an den Fingern, bevor die Fesseln ab sind. „Das brennt jetzt“, sagt er. „Dann wird es besser. So ist es mit fast allem.“",
        tote: "Brogar betrachtet die Gräber mit dem Blick eines Mannes, der wissen will, woran sie gestorben sind. Bei dreien hätte er etwas tun können. Er sagt es nicht.",
        kaelte: "Brogar sieht sich reihum die Finger und Zehen an, ungefragt, und reibt, wo es nötig ist. „Weiß ist schlecht“, erklärt er. „Rot ist gut. Jammern ist am besten.“",
        schutz: "Brogar gibt ihr etwas zu tragen: die leichteste seiner Taschen, mit den Kräutern. „Wichtig“, sagt er. Sie trägt sie den ganzen Tag wie etwas Zerbrechliches.",
        macht: "Brogar denkt an jedes Bett, an dem er zu spät kam. Er streckt die Hand halb aus. Dann sieht er seine eigenen Finger an, rissig, alt, ehrlich, und nimmt sie zurück.",
      },
    },
    inquisitor: {
      nacht: { frage: "Die Glut ist fast aus. Wenn du jede Lüge sehen könntest, die man dir je erzählt hat, auch die gnädigen: Würdest du hinsehen?",
        antworten: [
          { id: "ja", text: "Ja. Die Wahrheit ist nie zu teuer.", echo: "Seran hat in der Nacht gesagt, er würde jede Lüge sehen wollen, auch die, die ihn schonen sollte. Er hat nicht ausgesehen wie jemand, der sich darauf freut." },
          { id: "nein", text: "Nein. Manche Lügen waren Geschenke.", echo: "Seran hat in der Nacht gesagt, manche Lügen seien Geschenke gewesen, und er wolle sie behalten. Aus seinem Mund war das beinahe eine Beichte." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "wahrheit", text: "Weil dort unten jemand gelogen hat, und ich will wissen, wer.", echo: "Seran hat gesagt, an diesem Ort sei gelogen worden, vor langer Zeit, und er gehe nicht, bevor er wisse, von wem. Er hat es gesagt wie ein Urteil, das noch aussteht." },
          { id: "urteil", text: "Weil ich einmal falsch geurteilt habe.", echo: "Seran hat gesagt, er habe einmal falsch geurteilt. Nur diesen einen Satz. Er hat danach niemanden mehr so angesehen, als wisse er schon alles." },
        ] },
      stimmen: {
        wasser: "Seran fragt den Fährmann, ob das Boot hält. „Ja“, sagt der. Seran nickt langsam und setzt sich dorthin, wo man am schnellsten hinauskommt.",
        gefangen: "Seran stellt dem Befreiten eine einzige Frage: „Wer?“ Er bekommt einen Namen. Er wiederholt ihn nicht. Er vergisst ihn auch nicht.",
        tote: "Seran liest auf einem der Steine „in Frieden entschlafen“ und bleibt stehen. Sein Blick wird hart. Auch Grabsteine können lügen.",
        kaelte: "Seran geht aufrecht, als friere er nicht. Es ist gelogen, und er weiß es. Er hält es trotzdem durch, weil sonst die anderen aufgeben.",
        schutz: "Seran sagt ihr die Wahrheit: wie weit es noch ist, wie gefährlich. Alle anderen finden das grausam. Sie nicht. Sie geht danach schneller.",
        macht: "Seran hört es flüstern und erkennt den Tonfall sofort: So klingt jemand, der die Wahrheit sagt, um zu betrügen. „Jedes Wort stimmt“, sagt er. „Fasst es nicht an.“",
      },
    },
    wildnislaeufer: {
      nacht: { frage: "Die Glut ist fast aus. Du sitzt ein Stück abseits, wie immer. Wenn du nie wieder jemanden verlieren könntest, weil du niemanden mehr heranlässt: Wäre es das wert?",
        antworten: [
          { id: "ja", text: "Ja. Ich habe genug begraben.", echo: "Kael hat in der Nacht gesagt, er habe genug Leute begraben und wolle keinen mehr nah genug heranlassen. Er saß dabei so weit weg vom Feuer, dass man ihn kaum hörte." },
          { id: "nein", text: "Nein. Aber ich kann es noch nicht.", echo: "Kael hat in der Nacht gesagt, allein zu sein sei es nicht wert, aber er könne es noch nicht anders. Dann ist er ein Stück näher ans Feuer gerückt. Ein kleines Stück." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "spur", text: "Weil die Spur dorthin führt. Ich gehe Spuren zu Ende.", echo: "Kael hat gesagt, er gehe jeder Spur bis ans Ende nach, das sei alles. Er hat es zu sachlich gesagt, als dass es alles sein könnte." },
          { id: "rudel", text: "Weil ich seit Langem wieder mit jemandem gehe.", echo: "Kael hat gesagt, er gehe zum ersten Mal seit Jahren nicht allein. Er hat dabei auf seine Stiefel gesehen. Mehr braucht man bei ihm nicht zu erwarten." },
        ] },
      stimmen: {
        wasser: "Kael liest das Wasser wie einen Pfad: wo es bricht, wo es zieht, wo etwas darunter liegt. „Links halten“, sagt er. Niemand fragt, warum.",
        gefangen: "Kael hat die Fährte der Wächter schon gelesen, bevor die Fesseln ab sind. „Zwei sind fort, einer kommt zurück“, sagt er. „Wir haben nicht lange.“",
        tote: "Kael kniet sich hin. Zwischen den Gräbern ist das Gras niedergetreten, frisch, von innen nach außen. Er steht langsam wieder auf.",
        kaelte: "Kael zeigt euch, wie man Schnee festtritt, wo man ihn schmilzt, an welcher Seite eines Felsens man schläft. Er redet an diesem Abend mehr als in der ganzen Woche davor.",
        schutz: "Kael zeigt ihr, wie man leise auftritt: Ferse, Kante, Ballen. Sie macht es nach. „Besser als die anderen“, sagt er, laut genug, dass die anderen es hören.",
        macht: "Kael sieht kein Ding. Er sieht eine Falle: zu offen, zu leicht, kein Tier in der Nähe. Er hat zu viele Schlingen gelegt, um in eine zu treten.",
      },
    },
    tiergefaehrte: {
      nacht: { frage: "Die Glut ist fast aus, und Grau schläft, den Kopf auf deinem Fuß. Wenn er nie sterben müsste, aber nicht mehr dein Wolf wäre: Würdest du es annehmen?",
        antworten: [
          { id: "nein", text: "Nein. Er soll alt werden dürfen.", echo: "Faye hat in der Nacht gesagt, Grau solle alt werden und sterben dürfen wie ein Wolf. Sie hat ihn dabei nicht angesehen. Er sie schon." },
          { id: "ja", text: "Ich würde ihn fragen. Und seine Antwort fürchten.", echo: "Faye hat in der Nacht gesagt, sie würde Grau selbst entscheiden lassen, wenn er könnte. Der Wolf hat im Schlaf mit den Pfoten gezuckt, als renne er irgendwohin." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "grau", text: "Weil Grau schon vorausgelaufen ist.", echo: "Faye hat gesagt, sie gehe weiter, weil Grau längst vorausgelaufen sei. „Er entscheidet so etwas. Ich hole nur meinen Mantel.“" },
          { id: "rudel", text: "Weil ein Rudel niemanden zurücklässt.", echo: "Faye hat gesagt, ein Rudel lasse niemanden zurück, und Grau habe euch längst dazugezählt. Der Wolf hat reihum an jedem geschnüffelt, wie zur Bestätigung." },
        ] },
      stimmen: {
        wasser: "Grau will nicht aufs Wasser. Faye redet leise auf ihn ein, die Stirn an seiner Stirn. Dann springt er, und sie sieht aus, als hätte sie selbst den Mut erst jetzt gefunden.",
        gefangen: "Grau ist als Erster bei dem Gefangenen und leckt ihm die Hände, bevor Faye die Fesseln löst. „Er mag dich“, sagt sie. „Das tut er nicht bei jedem.“",
        tote: "Grau hat das Nackenfell gesträubt und geht keinen Schritt weiter. Faye bleibt neben ihm stehen. „Er riecht etwas, das nicht tot genug ist“, sagt sie.",
        kaelte: "Faye schläft an Graus Flanke und lädt mit einer Kopfbewegung ein, wer will. Am Morgen liegen vier Leute um einen Wolf, und keiner spricht darüber.",
        schutz: "Grau geht den ganzen Tag neben ihr, die Schulter an ihrem Knie. Faye lässt ihn. „Er hat sie sich ausgesucht“, sagt sie. „Ich wurde nicht gefragt.“",
        macht: "Grau winselt und drängt Faye mit dem ganzen Körper zurück. Sie legt ihm die Hand in den Nacken. „Ja“, sagt sie. „Ich höre es auch. Es redet von dir.“",
      },
    },
    kopfgeldjaeger: {
      nacht: { frage: "Die Glut ist fast aus. Du ziehst den einen Steckbrief aus der Tasche, den du nie eingelöst hast. Wenn dir jemand den Mann brächte, jetzt, hierher: Wüsstest du, was du mit ihm tust?",
        antworten: [
          { id: "ja", text: "Ja. Seit Jahren.", echo: "Orin hat in der Nacht gesagt, er wisse seit Jahren genau, was er mit dem Einen tun werde. Dann hat er den Steckbrief wieder eingesteckt, sehr sorgfältig, an derselben Stelle wie immer." },
          { id: "nein", text: "Nein. Ich glaube, ich jage ihn, damit ich etwas zu jagen habe.", echo: "Orin hat in der Nacht gesagt, vielleicht wolle er den Einen gar nicht finden. Er hat den Steckbrief lange über die Glut gehalten. Er hat ihn nicht losgelassen. Noch nicht." },
        ] },
      weg: { frage: "Morgen geht es weiter, tiefer hinein. Warum gehst du mit?",
        antworten: [
          { id: "preis", text: "Weil die Bezahlung stimmt.", echo: "Orin hat gesagt, er gehe weiter, weil die Bezahlung stimme. Es zahlt ihn aber niemand mehr. Darauf hat ihn keiner hingewiesen." },
          { id: "finden", text: "Weil dort jemand ist, den ich zurückbringen will. Lebend.", echo: "Orin hat gesagt, er wolle diesmal jemanden lebend zurückbringen, ohne Kopfgeld. Er hat hinzugefügt, das solle sich bloß nicht herumsprechen." },
        ] },
      stimmen: {
        wasser: "Orin schätzt den Fährmann ab, das Boot, die Strömung, und nennt halblaut eine Zahl. Es ist der Preis, für den er selbst nicht hinüberfahren würde. Er fährt trotzdem.",
        gefangen: "Orin hat in seinem Leben mehr Leute gefesselt als befreit. Er löst die Knoten trotzdem am schnellsten: Er weiß genau, wie man sie macht.",
        tote: "Orin erkennt auf einem der Steine einen Namen, den er einmal auf einem Steckbrief hatte. Den Lohn hat er damals bekommen. Er nimmt den Hut ab.",
        kaelte: "Orin hat schon Männer durch schlimmeres Wetter verfolgt. Die Verfolgten sind dabei immer zuerst liegen geblieben. Er achtet seitdem darauf, wer von euch langsamer wird.",
        schutz: "Orin hat sein Leben lang Leute irgendwohin gebracht, die nicht dorthin wollten. Jemanden zu begleiten, der mitkommen will, ist ihm neu. Er geht, wie man neben einer offenen Tür geht.",
        macht: "Orin weiß, was das wert ist. Er kennt drei Leute, die ein Fürstentum dafür gäben. Er nennt die Zahl nicht. Zum ersten Mal ist ihm eine Zahl zu groß.",
      },
    },
  };
  for (const [fid, x] of Object.entries(MEHR)) { M[fid].nacht = x.nacht; M[fid].weg = x.weg; Object.assign(M[fid].stimmen, x.stimmen); }
  root.ABHM = M;
  if (typeof module !== "undefined" && module.exports) module.exports = M;
})(typeof window !== "undefined" ? window : globalThis);
