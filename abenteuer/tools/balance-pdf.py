# Mythara – baut die Dokumentation „Ranked Season 0 · Balance-Stand“ als PDF.
# Quelle der Zahlen: abenteuer/doku/ranked-season-0/turnier-ergebnis.txt (eigene Simulation, Bot gegen Bot).
# Aufruf (im Ordner abenteuer): python3 tools/balance-pdf.py   · braucht reportlab und die DejaVu-Schriften
import json, re, os
HIER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'doku', 'ranked-season-0')
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
D='/usr/share/fonts/truetype/dejavu/'
pdfmetrics.registerFont(TTFont('DV', D+'DejaVuSans.ttf')); pdfmetrics.registerFont(TTFont('DVB', D+'DejaVuSans-Bold.ttf'))
pdfmetrics.registerFontFamily('DV', normal='DV', bold='DVB', italic='DV', boldItalic='DVB')
GOLD=colors.HexColor('#8a6a1f'); DUNKEL=colors.HexColor('#1f1a14'); HELL=colors.HexColor('#f6f1e6'); LINIE=colors.HexColor('#cfc4a8')
N=ParagraphStyle('n', fontName='DV', fontSize=9.5, leading=13.5, textColor=DUNKEL)
K=ParagraphStyle('k', parent=N, fontSize=8.5, leading=12, textColor=colors.HexColor('#5a5348'))
H1=ParagraphStyle('h1', parent=N, fontName='DVB', fontSize=20, leading=25, textColor=GOLD, spaceAfter=2)
H2=ParagraphStyle('h2', parent=N, fontName='DVB', fontSize=13.5, leading=18, textColor=GOLD, spaceBefore=12, spaceAfter=5, keepWithNext=1)
H3=ParagraphStyle('h3', parent=N, fontName='DVB', fontSize=10.5, leading=14, spaceBefore=7, spaceAfter=3, keepWithNext=1)
Z=ParagraphStyle('z', parent=N, fontSize=8.8, leading=11.5)
ZB=ParagraphStyle('zb', parent=Z, fontName='DVB', textColor=colors.white)
def P(t,s=N): return Paragraph(t,s)
def liste(punkte): return [Paragraph('•&nbsp;&nbsp;'+p, ParagraphStyle('l', parent=N, leftIndent=11, firstLineIndent=-11, spaceAfter=2.5)) for p in punkte]
def tab(kopf, zeilen, breiten, fett0=False):
    daten=[[P(k,ZB) for k in kopf]]+[[P(str(c), Z) for c in z] for z in zeilen]
    t=Table(daten, colWidths=[b*mm for b in breiten], repeatRows=1)
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),GOLD),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,HELL]),('GRID',(0,0),(-1,-1),0.4,LINIE),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),3.2),('BOTTOMPADDING',(0,0),(-1,-1),3.2),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5)]))
    return t
# Daten aus dem Turnier
txt=open(os.path.join(HIER, 'turnier-ergebnis.txt'), encoding='utf-8').read(); kombi={}; helden={}
st=None
for z in txt.splitlines():
    m=re.match(r'Stufe (\d+)',z)
    if m: st=int(m.group(1)); kombi[st]=[]; continue
    m=re.match(r'(\d+)\. (.*?) \| gegen das Feld (\d+) % \((\d+)\) \| gegen die Top 24 (\d+) %',z)
    if m: kombi[st].append((m.group(1), re.sub(r' \((\w+)\)', r' <font color="#7a7266" size="7.5">(\1)</font>', m.group(2)).replace(' + ',' · '), m.group(3)+' %', m.group(5)+' %'))
    m=re.match(r'Helden \(.*?\): (.*)',z)
    if m: helden[st]=[(x.rsplit(' ',1)[0], int(x.rsplit(' ',1)[1])) for x in m.group(1).split(', ')]
KL={'Torvald':'Krieger','Ragnar':'Krieger','Isolde':'Krieger','Lyra':'Zauberer','Vaelin':'Zauberer','Morwen':'Zauberer','Darian':'Schurke','Silra':'Schurke','Vex':'Schurke','Elara':'Kleriker','Brogar':'Kleriker','Seran':'Kleriker','Orin':'Waldläufer','Faye':'Waldläufer','Kael':'Waldläufer'}
ALT={1:{'Faye':60,'Silra':58,'Vex':57,'Vaelin':56,'Darian':54,'Elara':53,'Brogar':53,'Seran':50,'Ragnar':50,'Isolde':49,'Kael':46,'Torvald':45,'Orin':45,'Lyra':39,'Morwen':38},
     5:{'Faye':68,'Vex':62,'Darian':59,'Kael':57,'Silra':54,'Brogar':53,'Elara':49,'Vaelin':48,'Orin':47,'Ragnar':47,'Seran':46,'Isolde':44,'Lyra':41,'Torvald':41,'Morwen':36},
     10:{'Faye':69,'Brogar':63,'Morwen':62,'Vex':60,'Kael':53,'Darian':53,'Silra':50,'Vaelin':50,'Ragnar':48,'Elara':45,'Seran':44,'Orin':43,'Isolde':41,'Torvald':36,'Lyra':35}}
S=[]
S+= [P('Mythara · Ranked Season 0', H1), P('Balance-Stand der Arena · Regelstand v77 (regeln.js v77, figuren.js v27) · 17. November 2026', K), Spacer(1,4),
     P('<b>Grundlage:</b> ausschließlich eigene Tests – Duell-Simulationen mit der Bot-Logik des Spiels sowie die automatischen Regel- und Arena-Tests des Projekts. Es sind keine Daten aus echten Ranked-Kämpfen eingeflossen. Dieses Dokument hält den Stand fest, mit dem Season 0 gespielt wird, und dient als Vergleichsbasis für spätere Änderungen.', N), Spacer(1,4)]
S+= [P('Das Wichtigste in Kürze', H2)]
S+= liste([
 '<b>Die Krieger sind konkurrenzfähig.</b> Isolde und Ragnar stehen auf Stufe 1 und 5 in vielen der zehn besten Teams. Vor den Änderungen stand in allen Top-5-Listen zusammen genau ein Krieger.',
 '<b>Das Feld ist enger geworden.</b> Die stärksten Helden liegen jetzt bei 58 bis 63 % Siegquote, vorher bei bis zu 69 %.',
 '<b>Drei Helden prägen weiter die Spitze:</b> Vaelin auf Stufe 1 (in allen zehn besten Teams), Faye auf Stufe 5 (in allen zehn), Brogar auf Stufe 10 (in allen zehn, Faye dort in acht).',
 '<b>Ein grundlegender Arena-Fehler ist behoben:</b> Schutzwirkungen und Reaktionen des Teams, das gerade nicht am Zug ist, wirkten in der Arena bisher gar nicht.',
 '<b>Sorgenkinder:</b> Orin ist auf allen Stufen unter den schwächsten, Morwen bis Stufe 5, Lyra und Torvald auf Stufe 10.'])
S+= [P('Grundlage: eigene Tests', H2)]
S+= liste([
 'Beide Seiten spielen mit der Bot-Logik der Arena in voller Stärke, im Duell (drei gegen drei, keine Monster) auf den sieben Arena-Karten.',
 '<b>Vorrunde:</b> alle 455 möglichen Dreierkombinationen, je Stufe 7.280 Kämpfe gegen zufällige Gegner (rund 32 Kämpfe je Team).',
 '<b>Endrunde:</b> die besten 24 Teams je Stufe jeder gegen jeden (138 Kämpfe je Team) und zusätzlich 60 Kämpfe gegen das zufällige Feld.',
 'Wer zuerst zieht, gewinnt nur leicht häufiger (50 bis 52 %). Das verzerrt die Listen nicht.',
 'Einzelne Änderungen wurden vor dem Einbau mit je 400 Duellen pro Stufe auf denselben Paarungen vorher und nachher verglichen.',
 'Zusätzlich sichern automatische Tests die Regeln ab: Regelkern, Serverkampf, Rechner-Gegner und ein eigener Test für die neuen Fähigkeiten und die Arena-Reparatur.',
 '<b>Gilt für Ranked:</b> Ranked spielt ausschließlich Duell. Zugeteilt wird nach Rang, nicht nach Heldenstufe – Teams verschiedener Stufen können also aufeinandertreffen. Die Simulation vergleicht dagegen immer Teams gleicher Stufe.'])
S+= [P('<b>Grenzen der Aussage:</b> Alle Zahlen stammen aus eigenen Simulationen, Bot gegen Bot. Menschen spielen anders, vor allem Stellungsspiel und Kontrollzauber setzt ein Mensch vermutlich besser ein. Eine einzelne Siegquote schwankt bei dieser Kampfzahl um etwa ±8 Prozentpunkte; nah beieinanderliegende Plätze sind nicht belastbar unterscheidbar.', K)]
S+= [P('Die zehn besten Dreierkombinationen', H2), P('Reihenfolge nach dem Mittelwert aus beiden Spalten. „Feld“ = gegen beliebige Teams, „Top 24“ = gegen die besten 24 Teams der Stufe.', K)]
for st in (1,5,10):
    S.append(KeepTogether([P(f'Stufe {st}', H3), tab(['Platz','Kombination','gegen das Feld','gegen die Top 24'], kombi[st], [14,104,28,30])]))
S+= [P('Die Helden im Vergleich', H2), P('Durchschnittliche Siegquote aller Teams, in denen der Held steht (Vorrunde). „Vorher“ ist der Stand vor den unten beschriebenen Änderungen.', K)]
S+= [P('Die fünf stärksten Helden je Stufe', H3)]
top=[[str(i+1)]+[f'{helden[s][i][0]} <font color="#7a7266" size="7.5">({KL[helden[s][i][0]]})</font> · <b>{helden[s][i][1]} %</b>' for s in (1,5,10)] for i in range(5)]
S.append(tab(['Platz','Stufe 1','Stufe 5','Stufe 10'], top, [14,54,54,54]))
S+= [P('Alle 15 Helden: vorher und nachher', H3)]
def zelle(h,s):
    n=dict(helden[s])[h]; a=ALT[s][h]; d=n-a
    f='#2e7d32' if d>=4 else '#b23b2e' if d<=-4 else '#5a5348'
    return f'{a} → <b>{n} %</b> <font color="{f}" size="7.5">({"+" if d>0 else ""}{d})</font>'
reihen=[]
for kl in ['Krieger','Zauberer','Schurke','Kleriker','Waldläufer']:
    for h in [x for x in KL if KL[x]==kl]: reihen.append([h, kl, zelle(h,1), zelle(h,5), zelle(h,10)])
S.append(tab(['Held','Klasse','Stufe 1','Stufe 5','Stufe 10'], reihen, [28,28,40,40,40]))
S+= [Spacer(1,4), P('Grün und rot markiert sind Veränderungen ab 4 Prozentpunkten. Kleinere Unterschiede liegen im Zufallsbereich.', K)]
S+= [P('Was auffällt', H3)]
S+= liste([
 '<b>Krieger:</b> Isolde gewinnt am meisten (Stufe 5: 44 → 55 %, Stufe 10: 41 → 51 %), Ragnar ebenfalls deutlich. Torvald bleibt der schwächste der drei, vor allem auf Stufe 10 (44 %).',
 '<b>Elara</b> ist vom unteren Mittelfeld ins obere Drittel gerückt, <b>Seran</b> hilft auf Stufe 1, fällt danach aber wieder ab.',
 '<b>Faye</b> ist nicht mehr auf jeder Stufe allein an der Spitze, bleibt aber Stufe 5 klar vorn. Ihr Wolf ist der Grund: Ohne ihn läge sie bei 36 bis 45 %.',
 '<b>Brogar</b> gewinnt über Heilung, die mit der Stufe stark wächst (Bewahren, Lebenshauch, Massenheilwort): auf Stufe 10 rund 85 geheilte Lebenspunkte je Kampf.',
 '<b>Morwen</b> ist bis Stufe 5 schwach und auf Stufe 10 stark; <b>Kael</b> hat auf Stufe 5 deutlich verloren, <b>Orin</b> ist durchgehend unten.'])
S+= [P('Was vor Season 0 geändert wurde', H2)]
S+= [P('Arena-Reparatur (Fehler)', H3)]
S+= liste(['In der Arena behandelt das Spiel das Team, das nicht am Zug ist, intern als „Gegner“. Alles, was Helden in dieser Lage schützt, griff deshalb nicht: Isoldes Parade, Torvalds Schutzhaltung, Lyras Schutzglyphe, der Arkane Schild der Zauberer, Elaras Schutzkreis und Aura, der Kleriker-Beistand und die Übung bei Rettungswürfen.',
 'In 40 Testduellen löste vorher keine einzige Parade und keine Schutzhaltung aus – trotz 58 verfehlter Angriffe auf Isolde. Das ist behoben und durch einen eigenen Test abgesichert. In der Kampagne funktionierte alles schon vorher.'])
S+= [P('Krieger', H3)]
S+= liste(['Bewegung 4 statt 3.','Sturmangriff: Steht zu Zugbeginn kein Gegner neben ihnen, laufen sie 2 Felder weiter.','Kein Abzug mehr auf Waffenschaden (vorher −1).','+1W4 auf Nahkampftreffer, nicht auf Fernangriffe.'])
S+= [P('Warum diese Mischung: Krieger hatten schon rund 50 % mehr Lebenspunkte als alle anderen, kamen aber zu spät an den Gegner und machten in mehr als der Hälfte ihrer Züge keinen Schaden. In der Simulation brachten mehr Lebenspunkte allein fast nichts, mehr Schaden allein wenig – erst Tempo und Schaden zusammen wirkten.', K)]
S+= [P('Elara', H3)]
S+= liste(['Heiliges Licht heilt bei einem Treffer den am schwersten Verletzten in 3 Feldern (1W4, ab Stufe 5 1W6, ab Stufe 10 1W8).','Segen und Schutzkreis sind Bonusaktionen.','„Untote vertreiben“ heißt jetzt „Gleißendes Licht“ und blendet lebende Gegner eine Runde.','Die Aura wirkt ab Stufe 5 in 2 Feldern, ab Stufe 8 mit einem Schaden mehr.'])
S+= [P('Seran', H3)]
S+= liste(['Neuer Fernzauber Richtspruch (5 Felder, 1W8, plus Brandmal-Schaden auf das Brandmal-Ziel).','Befehl „Knie!“ zusätzlich zu „Flieh!“.','Bannen nimmt lebenden Zielen ihre Verstärkungen.','Brandmal bindet: Schritte von ihm weg kosten doppelte Bewegung.','Sühne: Hammertreffer auf das Brandmal-Ziel heilen ihn um 1W4.'])
S+= [P('Morwen und Seran: Zaubertricks streifen', H3)]
S+= liste(['Schattenstich und Richtspruch machen bei gelungenem Rettungswurf halben Schaden (ohne Zusatzwirkung). Vorher trafen sie nur in 44 bis 59 % der Fälle, gegen ein Team mit Elara auf Stufe 1 nur in 36 % – der Rest der Züge blieb wirkungslos.',
 'Morwens Züge ohne Schaden sinken damit von 55 / 50 / 36 % auf rund 8 / 11 / 13 % (Stufe 1 / 5 / 10).',
 'Elara und Brogar sind bewusst ausgenommen: Mit derselben Regel wäre Elara auf 67 / 60 / 63 % gestiegen.'])
S+= [P('Offene Stellschrauben für spätere Seasons', H2)]
S+= liste([
 '<b>Brogar auf Stufe 10:</b> Bewahren verteilt 6 × Stufe Lebenspunkte. In der Arena auf 4 × Stufe begrenzen wäre der naheliegende Hebel.',
 '<b>Faye:</b> Graus Tod könnte als halber gefallener Held zählen, der Befehl eine kürzere Reichweite bekommen oder Grau weniger Lebenspunkte haben.',
 '<b>Vaelin auf Stufe 1:</b> höchster Schaden je Zug aller Helden; ein kleiner Abschlag auf niedrigen Stufen würde die Top 10 öffnen.',
 '<b>Orin:</b> braucht eine Aufwertung; er ist auf allen drei Stufen unter den schwächsten.',
 '<b>Torvald und Lyra auf Stufe 10</b> sowie <b>Morwen bis Stufe 5</b> und <b>Seran ab Stufe 5</b> liegen weiter unter 45 %.',
 '<b>Nach den ersten Wochen prüfen:</b> die Zahlen aus echten Ranked-Kämpfen (Admin-Bereich, Kampfstatistiken) gegen diese Simulation halten.'])
S+= [P('Rahmen von Season 0', H2)]
S+= liste(['Ränge Bronze bis Meister, je drei Stufen (III, II, I), 100 Punkte je Stufe, Start bei 0.',
 'Gleicher Rang: Sieg +25, Niederlage −15. Nach 25 Sekunden Suche auch ein Rang daneben: der Höhere +15 / −25, der Niedrigere +35 / −5.',
 'Findet sich kein Mensch, springt ein Rechner-Gegner im selben Rang ein; seine Spielstärke steigt mit dem Rang.',
 'Dauer sechs Wochen. Belohnung nach dem höchsten erreichten Rang: 1200 / 800 / 500 / 300 / 150 Seelensplitter sowie Rang-Würfel und Rang-Rahmen.',
 'Erfahrung, Seelensplitter und Heldenchance (4 % je Sieg) gibt es in Ranked wie in normalen Kämpfen, ohne Tagesgrenze.'])
def fuss(c, doc):
    c.saveState(); c.setFont('DV', 7.5); c.setFillColor(colors.HexColor('#8a8275'))
    c.drawString(18*mm, 10*mm, 'Mythara · Ranked Season 0 · Balance-Stand · eigene Tests (Simulation Bot gegen Bot)'); c.drawRightString(A4[0]-18*mm, 10*mm, f'Seite {doc.page}'); c.restoreState()
doc=SimpleDocTemplate(os.path.join(HIER, 'Ranked-Season-0_Balance-Stand.pdf'), pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=17*mm, title='Mythara – Ranked Season 0 · Balance-Stand', author='Mythara')
doc.build(S, onFirstPage=fuss, onLaterPages=fuss)
