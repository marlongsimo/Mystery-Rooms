#!/usr/bin/env python3
"""
Zeichnet die beiden Pläne des Palais Mirage als SVG (Quelle für assets/theaterplan.svg und assets/plan1938.svg).
  theaterplan.svg  Bauamtsplan Stand 1950/1958: Grundriss Erdgeschoss + Längsschnitt A–A, Änderungsfeld, Bleistiftnotizen.
                   Den alten Künstlergang zeigt er NICHT (dort ist nur Wand, „Rückwand neu verputzt“).
  plan1938.svg     Kellergeschoss 1938: zeigt den Künstlergang von der Garderobe zur hinteren Unterbühne (Karte B15).
Aufruf: python3 krimidinner/mirage/assets/plaene.py   (danach build_case.py)
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))

STYLE = """  <style>
    .paper { fill: %(paper)s; }
    .frame { fill: none; stroke: %(ink)s; stroke-width: 1.6; }
    .w { fill: none; stroke: %(ink)s; stroke-width: 4; stroke-linejoin: miter; }
    .w2 { fill: none; stroke: %(ink)s; stroke-width: 1.4; }
    .thin { fill: none; stroke: %(ink)s; stroke-width: .8; }
    .hatch { fill: url(#hatch); stroke: %(ink)s; stroke-width: 1.2; }
    .mirror { fill: #c9d6df; fill-opacity: .55; stroke: %(ink)s; stroke-width: 1.4; }
    .dash { fill: none; stroke: %(ink)s; stroke-width: 1; stroke-dasharray: 6 4; }
    .door { fill: none; stroke: %(ink)s; stroke-width: .9; }
    .gap { stroke: %(paper)s; stroke-width: 5; }
    .lbl { font: 600 12px "DM Mono", "Courier New", monospace; letter-spacing: .06em; fill: %(ink)s; }
    .sm { font: 10px "DM Mono", "Courier New", monospace; fill: %(ink)s; }
    .hd { font: 700 13px "DM Mono", "Courier New", monospace; letter-spacing: .16em; fill: %(ink)s; }
    .ttl { font: 700 15px "DM Mono", "Courier New", monospace; letter-spacing: .12em; fill: %(ink)s; }
    .pen { font: italic 13px "Caveat", "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive; fill: #5a5a66; }
    .stamp { fill: none; stroke: #9e2b25; stroke-width: 2; opacity: .75; }
    .stampt { font: 700 10px "DM Mono", monospace; fill: #9e2b25; opacity: .8; letter-spacing: .1em; }
    .seat { fill: %(ink)s; opacity: .55; }
  </style>
  <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="%(ink)s" stroke-width=".7" opacity=".5"/></pattern></defs>"""


def door(o, x, y, r, rot):
    """Tür mit Aufschlagbogen: Drehpunkt (x,y), Breite r, Richtung rot in Grad."""
    o.append(f'  <g transform="translate({x} {y}) rotate({rot})"><line class="gap" x1="0" y1="0" x2="{r}" y2="0"/><line class="door" x1="0" y1="0" x2="0" y2="{-r}"/><path class="door" d="M{r} 0 A{r} {r} 0 0 0 0 {-r}"/></g>')


def stairs(o, x, y, w, h, n, label=None, down=True):
    o.append(f'  <rect class="w2" x="{x}" y="{y}" width="{w}" height="{h}"/>')
    for i in range(1, n):
        o.append(f'  <line class="thin" x1="{x}" y1="{y + i * h / n:.1f}" x2="{x + w}" y2="{y + i * h / n:.1f}"/>')
    o.append(f'  <path class="thin" d="M{x + w / 2} {y + 4} V{y + h - 6} m-4 -6 l4 6 l4 -6"/>')
    if label:
        o.append(f'  <text class="sm" x="{x + w + 6}" y="{y + h / 2 + 4}">{label}</text>')


def scalebar(o, x, y):
    o.append(f'  <g><rect x="{x}" y="{y}" width="40" height="6" fill="#2b2418"/><rect x="{x + 40}" y="{y}" width="40" height="6" class="w2"/><rect x="{x + 80}" y="{y}" width="40" height="6" fill="#2b2418"/>'
             f'<text class="sm" x="{x}" y="{y + 18}">0</text><text class="sm" x="{x + 36}" y="{y + 18}">5</text><text class="sm" x="{x + 74}" y="{y + 18}">10</text><text class="sm" x="{x + 110}" y="{y + 18}">15 m</text></g>')


def north(o, x, y):
    o.append(f'  <g transform="translate({x} {y})"><circle r="14" class="w2"/><path d="M0 -12 L5 6 L0 2 L-5 6 Z" fill="#2b2418"/><text class="sm" x="-3" y="-17">N</text></g>')


def theaterplan():
    ink, paper = "#2b2418", "#efe6cf"
    o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 1080" class="plan-svg" role="img" aria-label="Bauamtsplan des Palais Mirage, Stand 1950: Grundriss Erdgeschoss mit Bühnenhaus, Zuschauerraum und Foyer, dazu Längsschnitt durch Bühne und Unterbühne">']
    o.append(STYLE % {"ink": ink, "paper": paper})
    o.append('  <rect class="paper" width="760" height="1080"/><rect class="frame" x="12" y="12" width="736" height="1056"/><rect class="frame" x="16" y="16" width="728" height="1048" stroke-width=".6"/>')
    o.append('  <text class="hd" x="40" y="44">GRUNDRISS ERDGESCHOSS · M 1:200</text>')
    north(o, 700, 44)
    # --- Bühnenhaus ---
    o.append('  <rect class="w" x="40" y="70" width="680" height="240"/>')
    # Hinterbühne
    o.append('  <line class="w2" x1="160" y1="112" x2="600" y2="112"/><text class="lbl" x="380" y="96" text-anchor="middle">HINTERBÜHNE</text>')
    # Seitenbühne links + Tonkabine
    o.append('  <line class="w" x1="160" y1="70" x2="160" y2="230"/><text class="lbl" x="100" y="96" text-anchor="middle">SEITENBÜHNE</text><text class="lbl" x="100" y="111" text-anchor="middle">LINKS</text>')
    o.append('  <rect class="w2" x="52" y="200" width="96" height="70"/><text class="lbl" x="100" y="232" text-anchor="middle">TONKABINE</text><text class="sm" x="100" y="248" text-anchor="middle">Änd. c</text>')
    door(o, 148, 222, 18, 90)
    # Bühne
    o.append('  <text class="lbl" x="380" y="292" text-anchor="middle">BÜHNE</text>')
    # Kabinett: Rückkammer oben (hinten), Vorderraum unten (zum Saal)
    o.append('  <rect class="mirror" x="320" y="128" width="120" height="44"/><line class="w2" x1="320" y1="172" x2="440" y2="172" stroke-width="3"/><rect class="mirror" x="320" y="172" width="120" height="52"/>')
    o.append('  <text class="sm" x="380" y="146" text-anchor="middle">RÜCKKAMMER</text><text class="sm" x="380" y="158" text-anchor="middle">(Änd. a)</text>')
    o.append('  <rect class="dash" x="404" y="150" width="22" height="18"/><text class="sm" x="430" y="166">3</text>')
    o.append('  <text class="sm" x="380" y="190" text-anchor="middle">VORDERRAUM</text>')
    o.append('  <rect class="dash" x="334" y="196" width="22" height="18"/><text class="sm" x="360" y="212">A</text>')
    o.append('  <path class="door" d="M350 224 A30 30 0 0 1 380 240 M410 224 A30 30 0 0 0 380 240"/>')
    o.append('  <text class="lbl" x="380" y="258" text-anchor="middle">SPIEGELKABINETT</text>')
    o.append('  <line class="dash" x1="160" y1="300" x2="600" y2="300"/><text class="sm" x="166" y="296">Vorhang / Portal</text>')
    # Seitenbühne rechts: Treppe, Requisiten, Garderoben, Büro, Personalgang
    o.append('  <line class="w" x1="600" y1="70" x2="600" y2="230"/><text class="lbl" x="660" y="88" text-anchor="middle">SEITENB. RE.</text>')
    stairs(o, 610, 96, 40, 50, 8)
    o.append('  <text class="sm" x="655" y="114">Bühnen-</text><text class="sm" x="655" y="126">treppe ↓</text><text class="sm" x="655" y="138">Unterb.</text>')
    o.append('  <rect class="w2" x="606" y="152" width="108" height="34"/><text class="sm" x="660" y="173" text-anchor="middle">REQUISITEN</text>')
    o.append('  <rect class="w2" x="606" y="186" width="54" height="34"/><text class="sm" x="633" y="207" text-anchor="middle">GARD. 1</text>')
    o.append('  <rect class="w2" x="660" y="186" width="54" height="34"/><text class="sm" x="687" y="207" text-anchor="middle">GARD. 2</text>')
    o.append('  <rect class="w2" x="606" y="220" width="108" height="34"/><text class="sm" x="660" y="241" text-anchor="middle">BÜRO DIR.</text>')
    door(o, 606, 160, 14, 180); door(o, 620, 220, 12, 0); door(o, 674, 220, 12, 0); door(o, 620, 254, 12, 180)
    o.append('  <text class="sm" x="606" y="272">Gang</text>')
    # --- Zuschauerraum ---
    o.append('  <rect class="w" x="40" y="310" width="680" height="220"/>')
    o.append('  <rect class="w2" x="40" y="310" width="80" height="110"/><text class="lbl" x="80" y="368" text-anchor="middle">LOGE 1</text>')
    o.append('  <rect class="w2" x="600" y="310" width="70" height="110"/><text class="lbl" x="635" y="368" text-anchor="middle">LOGE 2</text>')
    o.append('  <rect class="w2" x="670" y="230" width="50" height="300"/><text class="sm" x="695" y="440" text-anchor="middle" transform="rotate(-90 695 440)">PERSONALGANG</text>')
    door(o, 670, 350, 14, 90)
    o.append('  <text class="sm" x="640" y="410" text-anchor="middle">Logentür</text>')
    door(o, 690, 230, 14, 180)
    for i in range(12):
        x = 150 + i * 36
        o.append(f'  <rect class="seat" x="{x}" y="330" width="24" height="12" rx="2"/><text class="sm" x="{x + 12}" y="354" text-anchor="middle">{i + 1}</text>')
    o.append('  <text class="sm" x="132" y="340" text-anchor="end">R. 1</text>')
    for r in range(4):
        for i in range(12):
            o.append(f'  <rect class="seat" x="{150 + i * 36}" y="{366 + r * 24}" width="24" height="10" rx="2" opacity=".28"/>')
    o.append('  <text class="lbl" x="366" y="480" text-anchor="middle">PARKETT</text>')
    door(o, 230, 530, 22, 0); door(o, 480, 530, 22, 0)
    # --- Foyer ---
    o.append('  <rect class="w" x="40" y="530" width="680" height="110"/>')
    o.append('  <rect class="w2" x="40" y="530" width="170" height="110"/><text class="lbl" x="125" y="588" text-anchor="middle">GARDEROBE</text><text class="sm" x="125" y="604" text-anchor="middle">Änd. b</text>')
    o.append('  <line class="thin" x1="52" y1="618" x2="198" y2="618"/><text class="sm" x="125" y="630" text-anchor="middle">Tresen</text>')
    o.append('  <rect class="thin" x="60" y="538" width="130" height="10" fill="url(#hatch)"/><text class="sm" x="125" y="562" text-anchor="middle">Kleiderständer</text>')
    o.append('  <text class="lbl" x="360" y="588" text-anchor="middle">FOYER</text><text class="sm" x="360" y="604" text-anchor="middle">Kasse · Haupteingang ↓</text>')
    o.append('  <rect class="w2" x="510" y="530" width="210" height="110"/><text class="lbl" x="615" y="580" text-anchor="middle">SALON · BAR</text>')
    door(o, 672, 530, 20, 0)
    o.append('  <text class="sm" x="640" y="550">Bühnentür</text><text class="sm" x="640" y="562">(Personal)</text>')
    door(o, 720, 600, 20, 90)
    o.append('  <path class="dash" d="M724 586 h18 v40 h-18"/><text class="sm" x="700" y="660" text-anchor="end">Seiteneingang · Vordach</text>')
    o.append('  <path class="w2" d="M330 640 v14 M390 640 v14"/>')
    # Schnittlinie A–A durch das Kabinett
    o.append('  <line class="dash" x1="380" y1="62" x2="380" y2="318" stroke-dasharray="14 4 2 4"/><text class="lbl" x="372" y="60">A</text><text class="lbl" x="384" y="328">A</text>')
    # --- Längsschnitt ---
    y0 = 700
    o.append(f'  <text class="hd" x="40" y="{y0}">LÄNGSSCHNITT A–A · BÜHNE UND UNTERBÜHNE · M 1:200</text>')
    fl = y0 + 110  # Bühnenboden
    o.append(f'  <line class="w" x1="60" y1="{fl}" x2="700" y2="{fl}"/><text class="sm" x="64" y="{fl - 6}">Parkett / Saal</text>')
    o.append(f'  <line class="dash" x1="220" y1="{y0 + 30}" x2="640" y2="{y0 + 30}"/><text class="sm" x="430" y="{y0 + 24}" text-anchor="middle">Beleuchterbrücke</text>')
    o.append(f'  <line class="dash" x1="230" y1="{y0 + 20}" x2="230" y2="{fl}"/><text class="sm" x="234" y="{y0 + 60}">Portal</text>')
    o.append(f'  <rect class="mirror" x="320" y="{fl - 70}" width="60" height="70"/><rect class="mirror" x="380" y="{fl - 70}" width="60" height="70"/>')
    o.append(f'  <line class="w2" x1="380" y1="{fl - 70}" x2="380" y2="{fl}" stroke-width="3"/>')
    o.append(f'  <text class="sm" x="350" y="{fl - 40}" text-anchor="middle">Vorder-</text><text class="sm" x="350" y="{fl - 28}" text-anchor="middle">raum</text><text class="sm" x="410" y="{fl - 40}" text-anchor="middle">Rück-</text><text class="sm" x="410" y="{fl - 28}" text-anchor="middle">kammer</text>')
    o.append(f'  <text class="sm" x="520" y="{fl - 8}" text-anchor="middle">Hinterbühne</text>')
    o.append(f'  <line class="gap" x1="336" y1="{fl}" x2="364" y2="{fl}"/><line class="dash" x1="336" y1="{fl}" x2="364" y2="{fl}"/><text class="sm" x="350" y="{fl + 14}" text-anchor="middle">Kl. A</text>')
    o.append(f'  <line class="gap" x1="396" y1="{fl}" x2="424" y2="{fl}"/><line class="dash" x1="396" y1="{fl}" x2="424" y2="{fl}"/><text class="sm" x="430" y="{fl + 14}">Kl. 3</text>')
    ub = fl + 100
    o.append(f'  <path class="w" d="M240 {fl} V{ub} H660 V{fl}"/>')
    o.append(f'  <text class="sm" x="290" y="{ub - 10}" text-anchor="middle">Unterbühne vorn</text>')
    o.append(f'  <rect class="hatch" x="368" y="{fl}" width="14" height="{ub - fl + 20}"/>')
    o.append(f'  <path class="w2" d="M366 {fl} V{ub + 20} H384 V{fl}"/><text class="sm" x="392" y="{ub + 16}">Gegengewichtsschacht</text>')
    o.append(f'  <rect class="w2" x="394" y="{fl + 56}" width="32" height="8"/><line class="thin" x1="410" y1="{fl + 64}" x2="410" y2="{ub}"/><circle class="w2" cx="440" cy="{fl + 78}" r="8"/><line class="thin" x1="440" y1="{fl + 70}" x2="452" y2="{fl + 64}"/>')
    o.append(f'  <text class="sm" x="456" y="{fl + 74}">Versenkung (Handkurbel)</text><text class="sm" x="456" y="{fl + 86}">unter Kl. 3 · Änd. a</text>')
    o.append(f'  <text class="sm" x="590" y="{fl + 30}" text-anchor="middle">Unterbühne hinten</text>')
    o.append(f'  <text class="sm" x="664" y="{fl + 50}">Rückwand</text>')
    o.append(f'  <text class="sm" x="560" y="{fl - 50}">Bühnentreppe: seitlich</text><text class="sm" x="560" y="{fl - 38}">rechts, s. Grundriss</text>')
    # Bleistiftnotizen
    o.append('  <text class="pen" x="190" y="212" transform="rotate(-4 190 212)">Kl. A – Rohn prüft!</text>')
    o.append('  <text class="pen" x="176" y="140" transform="rotate(2 176 140)">Lichttest 21:06 – nur hinten</text>')
    o.append('  <text class="pen" x="470" y="150" transform="rotate(-5 470 150)">Treppe: 4. Stufe knarrt →</text>')
    o.append(f'  <text class="pen" x="470" y="{y0 + 48}" transform="rotate(-2 470 {y0 + 48})">max. 2 Pers.! – R.D.</text>')
    # Änderungsfeld und Planfeld
    yb = 960
    o.append(f'  <rect class="w2" x="40" y="{yb}" width="380" height="96"/><text class="lbl" x="48" y="{yb + 16}">ÄNDERUNGEN</text>')
    rows = [("a", "04/1949", "Rückkammer stillgelegt, Klappe 3 und"), ("", "", "Versenkung außer Betrieb"), ("b", "06/1950", "Garderobe: Rückwand neu verputzt"), ("c", "10/1955", "Tonkabine eingebaut (Seitenb. li.)")]
    for i, (k, d, t) in enumerate(rows):
        yy = yb + 36 + i * 16
        o.append(f'  <text class="sm" x="48" y="{yy}">{k}</text><text class="sm" x="64" y="{yy}">{d}</text><text class="sm" x="128" y="{yy}">{t}</text>')
    o.append(f'  <line class="thin" x1="40" y1="{yb + 22}" x2="420" y2="{yb + 22}"/>')
    o.append(f'  <rect class="w2" x="430" y="{yb}" width="290" height="96"/>')
    o.append(f'  <text class="ttl" x="440" y="{yb + 22}">PALAIS MIRAGE</text><text class="sm" x="440" y="{yb + 38}">Nordhafen · Hafenstraße 12</text>')
    o.append(f'  <text class="sm" x="440" y="{yb + 54}">Bühnen- u. Zuschauerhaus · EG, Schnitt A–A</text>')
    o.append(f'  <text class="sm" x="440" y="{yb + 70}">M 1:200 · Blatt 3/7 · Stand Umbau 1950</text><text class="sm" x="440" y="{yb + 86}">Bauamt Nordhafen, Abt. Hochbau</text>')
    o.append(f'  <g transform="rotate(-12 650 {yb - 30})"><circle class="stamp" cx="650" cy="{yb - 30}" r="30"/><circle class="stamp" cx="650" cy="{yb - 30}" r="25" stroke-width="1"/><text class="stampt" x="650" y="{yb - 33}" text-anchor="middle">GEPRÜFT</text><text class="stampt" x="650" y="{yb - 21}" text-anchor="middle">12.6.1950</text></g>')
    scalebar(o, 40, yb - 34)
    o.append('</svg>')
    return "\n".join(o) + "\n"


def plan1938():
    ink, paper = "#3a2a14", "#e6d5ae"
    o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 640" class="plan-svg" role="img" aria-label="Bauplan von 1938, Kellergeschoss des Palais Mirage, mit dem Künstlergang von der Garderobe zur hinteren Unterbühne">']
    o.append(STYLE % {"ink": ink, "paper": paper})
    o.append('  <rect class="paper" width="760" height="640"/><rect class="frame" x="12" y="12" width="736" height="616"/>')
    o.append('  <text class="hd" x="40" y="44">GRUNDRISS KELLERGESCHOSS · M 1:200 · UMBAU 1938</text>')
    north(o, 700, 44)
    # Umriss wie oben, gedimmt: Bühnenhaus, Saal, Foyer
    o.append('  <rect class="w2" x="40" y="70" width="680" height="240" stroke-dasharray="3 3"/><rect class="w2" x="40" y="310" width="680" height="220" stroke-dasharray="3 3"/><rect class="w2" x="40" y="530" width="680" height="80" stroke-dasharray="3 3"/>')
    o.append('  <text class="sm" x="380" y="86" text-anchor="middle">(darüber: Bühne)</text><text class="sm" x="380" y="326" text-anchor="middle">(darüber: Parkett)</text><text class="sm" x="380" y="546" text-anchor="middle">(darüber: Foyer)</text>')
    # Unterbühne: vorn, Schacht, hinten (hinten = oben im Plan)
    o.append('  <rect class="w" x="160" y="110" width="440" height="190"/>')
    o.append('  <rect class="hatch" x="160" y="186" width="440" height="20"/><text class="sm" x="380" y="200" text-anchor="middle">Gegengewichtsschacht</text>')
    o.append('  <text class="lbl" x="380" y="150" text-anchor="middle">UNTERBÜHNE HINTEN</text><text class="lbl" x="380" y="256" text-anchor="middle">UNTERBÜHNE VORN</text>')
    stairs(o, 604, 120, 40, 60, 9)
    o.append('  <text class="sm" x="650" y="146">Bühnen-</text><text class="sm" x="650" y="158">treppe</text>')
    # Künstlergang: Garderobe (links unten) → Treppe ab → unter Loge 1 / Seitenbühne li. → Unterbühne hinten
    o.append('  <rect class="w2" x="40" y="530" width="170" height="80"/><text class="lbl" x="125" y="580" text-anchor="middle">GARDEROBE</text>')
    stairs(o, 70, 488, 34, 40, 6)
    o.append('  <text class="sm" x="110" y="500">Abgang</text><text class="sm" x="110" y="512">Künstler</text>')
    o.append('  <path class="w2" d="M70 488 V130 H160 M104 488 V164 H160"/>')
    o.append('  <path class="w2" d="M70 300 q17 -14 34 0" stroke-width="2.2"/><text class="sm" x="112" y="296">Bogen</text>')
    o.append('  <text class="lbl" x="87" y="400" text-anchor="middle" transform="rotate(-90 87 400)">KÜNSTLERGANG</text>')
    door(o, 160, 130, 18, 90)
    o.append('  <text class="pen" x="200" y="474" transform="rotate(-3 200 474)">direkt zur Unterbühne hinten,</text><text class="pen" x="200" y="492" transform="rotate(-3 200 492)">ohne über die Bühne – f. Artisten</text>')
    yb = 524 + 0
    o.append('  <rect class="w2" x="440" y="548" width="280" height="62" style="fill:#e6d5ae"/>')
    o.append('  <text class="ttl" x="450" y="568">VARIETÉ MIRAGE</text><text class="sm" x="450" y="584">Umbau Bühnenhaus · Kellergeschoss</text><text class="sm" x="450" y="600">Blatt 2/5 · Baupolizei Nordhafen, 1938</text>')
    o.append('</svg>')
    return "\n".join(o) + "\n"


if __name__ == "__main__":
    for name, fn in (("theaterplan.svg", theaterplan), ("plan1938.svg", plan1938)):
        with open(os.path.join(HERE, name), "w", encoding="utf-8") as f:
            f.write(fn())
        print("geschrieben:", name)
