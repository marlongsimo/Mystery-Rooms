#!/usr/bin/env python3
"""Erzeugt hausplan.svg (für alle sichtbar) und fundskizze.svg (Karte B1). Aufruf: python3 plaene.py"""
import os
D = os.path.dirname(os.path.abspath(__file__))
STYLE = """<style>
    .wall { fill: #fbf6ea; stroke: #3b3122; stroke-width: 2.4; }
    .room { fill: #f3ead6; stroke: #6b5a3e; stroke-width: 1.3; }
    .hall { fill: #e7dcc2; stroke: #6b5a3e; stroke-width: 1; }
    .yard { fill: #e2e6d6; stroke: #8a9070; stroke-width: 1; stroke-dasharray: 4 3; }
    .door { stroke: #fbf6ea; stroke-width: 5; }
    .swing { fill: none; stroke: #6b5a3e; stroke-width: 1; }
    .t { font: 600 13px "DM Sans", Arial, sans-serif; fill: #231e14; }
    .s { font: 11px "DM Sans", Arial, sans-serif; fill: #4a3f2c; }
    .m { font: 700 11px "DM Mono", monospace; letter-spacing: .12em; fill: #7a6233; }
    .obj { fill: #d9c9a3; stroke: #6b5a3e; stroke-width: 1; }
  </style>"""

def door(x1, y1, x2, y2):
    return f'<line class="door" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>'

def hausplan():
    o = []
    o.append('<rect class="yard" x="20" y="14" width="600" height="40"/><text class="m" x="320" y="38" text-anchor="middle">HOF · FEUERKORB · LICHTERKETTE</text>')
    o.append('<rect class="wall" x="20" y="60" width="600" height="340"/>')
    # Saal
    o.append('<rect class="room" x="20" y="60" width="230" height="340"/><text class="t" x="135" y="180" text-anchor="middle">Saal</text>')
    o.append('<text class="s" x="135" y="198" text-anchor="middle">Büfett · Tombola · Bühne</text><text class="s" x="135" y="214" text-anchor="middle">Basteltisch</text>')
    o.append('<rect class="obj" x="30" y="350" width="70" height="38"/><text class="s" x="65" y="373" text-anchor="middle">Garderobe</text>')
    o.append('<text class="s" x="65" y="342" text-anchor="middle">Kassenecke</text>')
    o.append(door(60, 60, 110, 60) + '<text class="s" x="85" y="76" text-anchor="middle">Terrassentür</text>')
    o.append(door(150, 400, 200, 400) + '<text class="m" x="175" y="416" text-anchor="middle">HAUPTEINGANG</text>')
    # Flur
    o.append('<rect class="hall" x="250" y="190" width="310" height="60"/><text class="m" x="300" y="226" text-anchor="middle">FLUR (W)</text><text class="m" x="480" y="226" text-anchor="middle">FLUR (O)</text>')
    o.append(door(250, 200, 250, 240) + '<text class="s" x="244" y="186" text-anchor="end">Schwingtür</text>')
    # Nordseite
    o.append('<rect class="room" x="250" y="60" width="130" height="130"/><text class="t" x="315" y="140" text-anchor="middle">Büro</text><rect class="obj" x="262" y="66" width="90" height="16"/><text class="s" x="307" y="98" text-anchor="middle">Aktenschrank</text>')
    o.append('<rect class="room" x="380" y="60" width="130" height="130"/><text class="t" x="445" y="140" text-anchor="middle">Beratungsraum</text><rect class="obj" x="392" y="66" width="70" height="16"/><text class="s" x="427" y="98" text-anchor="middle">Schrank (verschlossen)</text>')
    o.append('<rect class="room" x="510" y="60" width="110" height="130"/><text class="t" x="565" y="110" text-anchor="middle">Hausmeister-</text><text class="t" x="565" y="126" text-anchor="middle">kammer</text>')
    o.append(door(330, 190, 360, 190) + door(420, 190, 450, 190) + door(540, 190, 570, 190))
    # Südseite
    o.append('<rect class="room" x="250" y="250" width="180" height="150"/><text class="t" x="340" y="330" text-anchor="middle">Küche</text>')
    o.append('<rect class="room" x="430" y="250" width="130" height="150"/><text class="t" x="495" y="330" text-anchor="middle">WC</text><rect class="room" x="560" y="300" width="60" height="100"/><text class="s" x="590" y="356" text-anchor="middle">Lager</text>')
    o.append('<rect class="room" x="560" y="190" width="60" height="110"/><text class="s" x="590" y="236" text-anchor="middle">Wind-</text><text class="s" x="590" y="250" text-anchor="middle">fang</text>')
    o.append(door(290, 250, 320, 250) + door(470, 250, 500, 250) + door(560, 205, 560, 235) + door(620, 220, 620, 250))
    o.append('<text class="s" x="590" y="270" text-anchor="middle">Hinter-</text><text class="s" x="590" y="284" text-anchor="middle">ausgang →</text>')
    o.append('<rect class="obj" x="262" y="252" width="16" height="10"/><text class="s" x="262" y="276">Schlüsselkasten</text>')
    o.append('<text class="m" x="320" y="414" text-anchor="middle">N ↑</text>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 424" class="plan-svg" role="img" aria-label="Grundriss Haus am Anger: Saal, Flur, Büro, Beratungsraum, Hausmeisterkammer, Küche, WC, Windfang">\n  {STYLE}\n  ' + "\n  ".join(o) + "\n</svg>\n"

def fundskizze():
    o = []
    o.append('<rect class="wall" x="40" y="30" width="400" height="300"/><text class="m" x="240" y="22" text-anchor="middle">BÜRO · NORDWAND</text>')
    # Schrank an der Nordwand, linke Tür 90° offen
    o.append('<rect class="obj" x="170" y="34" width="200" height="40"/><text class="s" x="300" y="58" text-anchor="middle">Stahlaktenschrank</text>')
    o.append('<line x1="170" y1="74" x2="170" y2="150" stroke="#3b3122" stroke-width="4"/><text class="s" x="160" y="120" text-anchor="end">linke Tür offen</text>')
    o.append('<rect x="190" y="26" width="70" height="20" fill="#ead9b4" stroke="#6b5a3e"/><text class="s" x="225" y="40" text-anchor="middle">ZURÜCK</text><rect x="240" y="20" width="14" height="8" fill="#b58b55"/>')
    # Leiter umgekippt nach links
    o.append('<g transform="translate(205 150) rotate(-12)"><rect x="0" y="0" width="110" height="26" fill="none" stroke="#3b3122" stroke-width="2"/>' + "".join(f'<line x1="{x}" y1="0" x2="{x}" y2="26" stroke="#3b3122"/>' for x in (28, 55, 82)) + '</g><text class="s" x="300" y="200">Trittleiter, umgekippt</text>')
    # Körperumriss links, Kopf an der Schranktür
    o.append('<path d="M176 156 q18 -6 30 8 l60 40 q10 8 2 18 l-70 60 q-14 8 -22 -4 l-8 -40 z" fill="none" stroke="#9e2b25" stroke-width="1.6" stroke-dasharray="5 3"/>')
    o.append('<circle cx="180" cy="160" r="12" fill="none" stroke="#9e2b25" stroke-width="1.6" stroke-dasharray="5 3"/><text class="s" x="150" y="230" text-anchor="end">Kopf an der</text><text class="s" x="150" y="244" text-anchor="end">Schranktür</text>')
    o.append('<circle cx="236" cy="236" r="5" fill="#2f5a3e"/><text class="s" x="220" y="300" text-anchor="end">rechte Hand,</text><text class="s" x="220" y="314" text-anchor="end">Fadenende</text>')
    o.append('<rect class="obj" x="330" y="230" width="100" height="60"/><text class="s" x="380" y="264" text-anchor="middle">Schreibtisch</text><text class="s" x="380" y="278" text-anchor="middle">(Redemanuskript)</text>')
    o.append(door(80, 330, 120, 330) + '<text class="s" x="100" y="346" text-anchor="middle">Bürotür zum Flur (zu)</text>')
    o.append('<text class="s" x="440" y="346" text-anchor="end">keine Tür zum Nachbarraum</text>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 356" class="plan-svg" role="img" aria-label="Fundskizze Büro: umgekippte Leiter, offene Schranktür, Karton ZURÜCK, Lage Hannos">\n  {STYLE}\n  ' + "\n  ".join(o) + "\n</svg>\n"

open(os.path.join(D, "hausplan.svg"), "w").write(hausplan())
open(os.path.join(D, "fundskizze.svg"), "w").write(fundskizze())
open(os.path.join(D, "emblem.svg"), "w").write('<svg class="star" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-opacity=".35"/><path d="M30 80V24h40v56" fill="none" stroke="currentColor" stroke-width="4"/><path d="M34 78V28l26 6v48z" fill="currentColor" opacity=".55"/><circle cx="54" cy="56" r="2.6" fill="currentColor"/><path d="M70 80c6-6 10-14 6-22-3 7-8 10-12 12" fill="currentColor" opacity=".7"/><path d="M22 82h56" stroke="currentColor" stroke-width="3"/></svg>\n')
print("ok")
