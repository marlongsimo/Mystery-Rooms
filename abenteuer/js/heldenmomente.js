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
  root.ABHM = M;
  if (typeof module !== "undefined" && module.exports) module.exports = M;
})(typeof window !== "undefined" ? window : globalThis);
