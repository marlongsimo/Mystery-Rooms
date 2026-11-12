# Balance-Analyse der Helden (Normal)

Erzeugt mit `node abenteuer/tools/balance-helden.js 100`. Gesteuert von der eingebauten KI, nicht von Menschen.
Je Kampfszene und Gruppengröße (3, 4, 5, 6) 100 zufällige Gruppen. Werte „je Kampf“ sind Durchschnitte über alle Kämpfe, in denen der Held dabei war.

**Spalten:** Kämpfe = Anzahl Simulationen mit dem Held · Ø Gruppe = durchschnittliche Gruppengröße · Sieg = Siegquote seiner Gruppen (95-%-Bereich) · Δ ohne = Siegquote mit ihm minus Siegquote aller Kämpfe ohne ihn (Prozentpunkte; misst seinen Beitrag unabhängig von der Kampagnenschwere) · Steht = am Kampfende auf den Beinen · Nie 0 = nie auf 0 TP · Schaden aus/ein = verursacht/erlitten je Kampf (ohne Overkill) · Heilung = an anderen (+ selbst) je Kampf · Auf = Verbündete aufgerichtet je Kampf · Unterst./Kontr. = neue Zustände auf Verbündeten/Gegnern je Kampf · Aktionen = ausgeführte Aktionen je Kampf, davon mit Wirkung · Spezial = Spezialfähigkeiten (begrenzt oder Zauberplatz) je Kampf, davon mit Wirkung · Spezial sinnvoll = Anteil der Kämpfe mit mindestens einer wirksamen Spezialfähigkeit.

## Das Moor der stummen Lichter

5 Kampfszenen · 2000 Kämpfe · Sieg gesamt 78.0 %

**Gruppengröße:** 3 Helden: 500 Kämpfe, Sieg 79 % · 4 Helden: 500 Kämpfe, Sieg 77 % · 5 Helden: 500 Kämpfe, Sieg 76 % · 6 Helden: 500 Kämpfe, Sieg 80 %

**Klasse in der Gruppe:** Krieger mit 78 % / ohne 78 % · Zauberer mit 79 % / ohne 75 % · Schurke mit 78 % / ohne 79 % · Kleriker mit 80 % / ohne 73 % · Waldläufer mit 77 % / ohne 80 %

**Zuordnung des Gegnerschadens:** 96 % direkt im Zug eines Helden · 4 % im Zug der Gegner (Reaktionen, Flächen, Nachwirkungen – nicht einem Helden zugeordnet) · 0 % durch Begleiter.

| # | Held | Kämpfe | Ø Gruppe | Sieg (95 %) | Δ ohne | Steht | Nie 0 | Schaden aus | Schaden ein | Heilung | Auf | Unterst. | Kontr. | Aktionen (Wirkung) | Spezial (Wirkung) | Spezial sinnvoll |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Torvald (Krieger) | 600 | 4.8 | 83.8 % (81–87) | +8.3 | 75 % | 58 % | 33.5 | 22.5 | 1.0 (+15.0) | 1.03 | 0.0 | 5.7 | 14.3 (88 %) | 3.3 (100 %) | 100 % |
| 2 | Silra (Schurke) | 579 | 4.8 | 82.4 % (79–85) | +6.1 | 75 % | 57 % | 80.8 | 10.4 | 0.4 (+5.7) | 0.43 | 0.0 | 4.3 | 14.6 (80 %) | 0.0 (0 %) | 0 % |
| 3 | Morwen (Zauberer) | 636 | 4.8 | 81.8 % (79–85) | +5.4 | 79 % | 65 % | 32.4 | 8.9 | 0.4 (+6.1) | 0.44 | 0.0 | 7.3 | 11.2 (70 %) | 2.9 (82 %) | 97 % |
| 4 | Brogar (Kleriker) | 608 | 4.7 | 81.4 % (78–84) | +4.8 | 75 % | 60 % | 31.9 | 11.6 | 17.1 (+8.3) | 1.69 | 0.8 | 3.5 | 13.2 (73 %) | 4.1 (100 %) | 99 % |
| 5 | Vaelin (Zauberer) | 607 | 4.7 | 80.4 % (77–83) | +3.4 | 73 % | 56 % | 83.6 | 11.1 | 0.5 (+7.0) | 0.47 | 0.0 | 2.1 | 9.1 (87 %) | 2.9 (100 %) | 100 % |
| 6 | Seran (Kleriker) | 601 | 4.8 | 79.7 % (76–83) | +2.4 | 58 % | 30 % | 29.9 | 17.5 | 7.3 (+9.7) | 1.21 | 0.0 | 1.2 | 11.6 (88 %) | 3.6 (96 %) | 100 % |
| 7 | Elara (Kleriker) | 606 | 4.8 | 79.5 % (76–83) | +2.1 | 75 % | 61 % | 33.3 | 10.3 | 10.0 (+6.7) | 1.36 | 3.2 | 0.8 | 12.8 (71 %) | 3.1 (100 %) | 100 % |
| 8 | Lyra (Zauberer) | 604 | 4.8 | 77.5 % (74–81) | −0.8 | 71 % | 49 % | 53.6 | 11.8 | 0.4 (+6.6) | 0.42 | 0.0 | 1.0 | 16.8 (90 %) | 0.0 (0 %) | 0 % |
| 9 | Kael (Waldläufer) | 592 | 4.8 | 77.4 % (74–81) | −1.0 | 74 % | 62 % | 72.3 | 11.4 | 0.6 (+7.2) | 0.63 | 0.0 | 6.7 | 13.7 (82 %) | 6.2 (81 %) | 99 % |
| 10 | Orin (Waldläufer) | 598 | 4.8 | 77.1 % (74–80) | −1.4 | 73 % | 64 % | 69.9 | 10.1 | 0.5 (+5.9) | 0.53 | 0.0 | 5.1 | 12.7 (79 %) | 3.4 (79 %) | 77 % |
| 11 | Ragnar (Krieger) | 598 | 4.8 | 76.4 % (73–80) | −2.3 | 55 % | 44 % | 45.8 | 23.1 | 1.1 (+11.0) | 1.06 | 0.0 | 3.1 | 12.4 (100 %) | 2.4 (100 %) | 100 % |
| 12 | Darian (Schurke) | 611 | 4.7 | 75.9 % (72–79) | −3.0 | 58 % | 35 % | 59.9 | 17.1 | 0.8 (+9.4) | 0.77 | 0.0 | 1.6 | 9.4 (92 %) | 1.5 (100 %) | 86 % |
| 13 | Faye (Waldläufer) | 611 | 4.7 | 74.1 % (71–77) | −5.6 | 44 % | 13 % | 43.1 | 22.7 | 0.4 (+11.0) | 0.42 | 0.0 | 4.1 | 10.7 (79 %) | 3.3 (74 %) | 92 % |
| 14 | Isolde (Krieger) | 577 | 4.8 | 73.0 % (69–76) | −7.1 | 56 % | 38 % | 34.2 | 24.8 | 1.0 (+13.8) | 1.00 | 0.0 | 3.3 | 12.5 (92 %) | 2.9 (100 %) | 99 % |
| 15 | Vex (Schurke) | 572 | 4.8 | 71.2 % (67–75) | −9.7 | 46 % | 15 % | 54.2 | 20.7 | 0.5 (+9.9) | 0.46 | 0.0 | 3.1 | 9.2 (90 %) | 1.6 (100 %) | 96 % |

<details><summary>Fähigkeiten je Held (Einsätze gesamt · Anteil mit Wirkung)</summary>

- **Torvald (Krieger):** Langschwert 4064× (75 %) · Spott★ 1143× (100 %) · Spurt 1095× (100 %) · Heiltrank trinken 828× (100 %) · Stabilisieren 619× (100 %) · Zweiter Atem★ 478× (100 %) · Tatendrang★ 353× (100 %)
- **Silra (Schurke):** Dolch 4078× (79 %) · Zweiter Dolch 3318× (73 %) · Heiltrank trinken 505× (100 %) · Stabilisieren 248× (100 %) · Verstecken 152× (100 %) · Rückzug 132× (100 %) · Schmutziger Trick★ 1× (0 %)
- **Morwen (Zauberer):** Schattenstich 4404× (59 %) · Furcht★ 1705× (80 %) · Heiltrank trinken 599× (100 %) · Stabilisieren 277× (100 %) · Schattenschritt★ 160× (100 %) · Spiegelbilder★ 7× (100 %)
- **Brogar (Kleriker):** Dornenranke 4830× (55 %) · Heilendes Wort★ 1019× (100 %) · Schild des Glaubens★ 713× (100 %) · Heiltrank trinken 538× (100 %) · Lebenshauch★ 406× (100 %) · Bewahren★ 352× (100 %) · Stabilisieren 166× (100 %)
- **Vaelin (Zauberer):** Glutpfeil 2761× (74 %) · Frosthauch★ 814× (100 %) · Heiltrank trinken 692× (100 %) · Donnerwelle★ 685× (100 %) · Stabilisieren 285× (100 %) · Magisches Geschoss★ 262× (100 %)
- **Seran (Kleriker):** Kriegshammer 3023× (75 %) · Heilendes Wort★ 1357× (100 %) · Spurt 909× (100 %) · Heiltrank trinken 609× (100 %) · Brandmal★ 557× (100 %) · Stabilisieren 229× (100 %) · Bannen★ 223× (63 %) · Befehl: Flieh!★ 35× (71 %)
- **Elara (Kleriker):** Heiliges Licht 5007× (56 %) · Heilendes Wort★ 1172× (100 %) · Heiltrank trinken 531× (100 %) · Segen★ 489× (100 %) · Stabilisieren 358× (100 %) · Untote vertreiben★ 226× (96 %)
- **Lyra (Zauberer):** Arkaner Funke 4827× (83 %) · Analyse 4494× (94 %) · Heiltrank trinken 600× (100 %) · Stabilisieren 255× (100 %)
- **Kael (Waldläufer):** Langbogen 3502× (78 %) · Jägermal★ 2483× (82 %) · Fesselnder Pfeil★ 1161× (80 %) · Heiltrank trinken 605× (100 %) · Stabilisieren 370× (100 %)
- **Orin (Waldläufer):** Leichte Armbrust 4728× (75 %) · Jägermal★ 1998× (79 %) · Heiltrank trinken 557× (100 %) · Stabilisieren 317× (100 %) · Netz★ 7× (57 %)
- **Ragnar (Krieger):** Großaxt, rücksichtslos 3094× (100 %) · Heiltrank trinken 1182× (100 %) · Spurt 1037× (100 %) · Stabilisieren 632× (100 %) · Raserei★ 581× (100 %) · Zweiter Atem★ 501× (100 %) · Tatendrang★ 369× (100 %) · Großaxt 23× (96 %)
- **Darian (Schurke):** Kurzschwert 1807× (79 %) · Schattenwirbel★ 928× (100 %) · Heiltrank trinken 894× (100 %) · Verstecken 843× (100 %) · Kurzbogen 785× (91 %) · Stabilisieren 472× (100 %) · Spurt 27× (100 %)
- **Faye (Waldläufer):** Kurzschwert 2279× (78 %) · Jägermal★ 1619× (83 %) · Heiltrank trinken 1028× (100 %) · Kurzbogen 798× (73 %) · Grau: Umreißen★ 369× (36 %) · Stabilisieren 254× (100 %) · Befehl an Grau 191× (33 %) · Spurt 22× (100 %)
- **Isolde (Krieger):** Rapier 3194× (82 %) · Spurt 1001× (100 %) · Finte★ 905× (100 %) · Heiltrank trinken 743× (100 %) · Stabilisieren 578× (100 %) · Zweiter Atem★ 429× (100 %) · Tatendrang★ 336× (100 %)
- **Vex (Schurke):** Klinge der Gilde 1971× (80 %) · Gift★ 933× (100 %) · Heiltrank trinken 896× (100 %) · Leichte Armbrust 768× (82 %) · Aus dem Schatten 398× (100 %) · Stabilisieren 265× (100 %) · Spurt 40× (100 %)

★ = Spezialfähigkeit
</details>

## Das Siegel von Grauwacht

14 Kampfszenen · 5600 Kämpfe · Sieg gesamt 80.0 %

**Gruppengröße:** 3 Helden: 1400 Kämpfe, Sieg 74 % · 4 Helden: 1400 Kämpfe, Sieg 79 % · 5 Helden: 1400 Kämpfe, Sieg 81 % · 6 Helden: 1400 Kämpfe, Sieg 86 %

**Klasse in der Gruppe:** Krieger mit 81 % / ohne 77 % · Zauberer mit 80 % / ohne 80 % · Schurke mit 81 % / ohne 79 % · Kleriker mit 81 % / ohne 78 % · Waldläufer mit 81 % / ohne 79 %

**Zuordnung des Gegnerschadens:** 96 % direkt im Zug eines Helden · 4 % im Zug der Gegner (Reaktionen, Flächen, Nachwirkungen – nicht einem Helden zugeordnet) · 0 % durch Begleiter.

| # | Held | Kämpfe | Ø Gruppe | Sieg (95 %) | Δ ohne | Steht | Nie 0 | Schaden aus | Schaden ein | Heilung | Auf | Unterst. | Kontr. | Aktionen (Wirkung) | Spezial (Wirkung) | Spezial sinnvoll |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Torvald (Krieger) | 1543 | 4.8 | 83.8 % (82–86) | +5.2 | 79 % | 73 % | 19.1 | 14.3 | 0.5 (+8.7) | 0.53 | 0.0 | 3.4 | 9.2 (84 %) | 2.7 (99 %) | 99 % |
| 2 | Morwen (Zauberer) | 1571 | 4.8 | 82.4 % (80–84) | +3.4 | 78 % | 72 % | 13.7 | 7.2 | 0.2 (+4.8) | 0.20 | 0.0 | 4.3 | 7.1 (76 %) | 2.7 (84 %) | 89 % |
| 3 | Brogar (Kleriker) | 1588 | 4.8 | 82.3 % (80–84) | +3.2 | 75 % | 64 % | 13.6 | 8.5 | 14.9 (+5.1) | 1.13 | 0.7 | 1.2 | 7.9 (77 %) | 3.4 (100 %) | 96 % |
| 4 | Ragnar (Krieger) | 1535 | 4.8 | 82.2 % (80–84) | +3.0 | 76 % | 70 % | 28.1 | 13.6 | 0.6 (+6.0) | 0.58 | 0.0 | 1.4 | 8.3 (99 %) | 2.2 (100 %) | 99 % |
| 5 | Lyra (Zauberer) | 1582 | 4.8 | 82.0 % (80–84) | +2.8 | 74 % | 61 % | 22.2 | 8.2 | 0.1 (+3.7) | 0.10 | 0.0 | 0.3 | 8.9 (87 %) | 0.0 (0 %) | 0 % |
| 6 | Elara (Kleriker) | 1547 | 4.8 | 81.7 % (80–84) | +2.3 | 78 % | 71 % | 12.6 | 7.4 | 7.4 (+4.4) | 0.79 | 3.2 | 1.4 | 7.2 (76 %) | 2.7 (99 %) | 98 % |
| 7 | Faye (Waldläufer) | 1569 | 4.8 | 81.6 % (80–83) | +2.2 | 65 % | 39 % | 22.9 | 15.7 | 0.3 (+8.1) | 0.28 | 0.0 | 2.8 | 7.8 (83 %) | 2.4 (90 %) | 85 % |
| 8 | Seran (Kleriker) | 1541 | 4.8 | 81.6 % (80–83) | +2.1 | 71 % | 55 % | 17.1 | 10.6 | 6.2 (+4.7) | 0.89 | 0.0 | 1.0 | 7.3 (83 %) | 2.9 (95 %) | 99 % |
| 9 | Orin (Waldläufer) | 1557 | 4.8 | 81.1 % (79–83) | +1.4 | 76 % | 70 % | 28.3 | 8.8 | 0.2 (+5.2) | 0.17 | 0.0 | 2.8 | 8.3 (77 %) | 2.4 (89 %) | 80 % |
| 10 | Kael (Waldläufer) | 1520 | 4.8 | 81.0 % (79–83) | +1.3 | 75 % | 68 % | 29.0 | 10.2 | 0.4 (+6.4) | 0.35 | 0.0 | 3.8 | 9.0 (80 %) | 5.3 (82 %) | 99 % |
| 11 | Isolde (Krieger) | 1873 | 4.7 | 80.7 % (79–82) | +1.1 | 75 % | 69 % | 23.1 | 19.2 | 0.5 (+10.3) | 0.46 | 0.0 | 1.8 | 9.0 (87 %) | 2.7 (100 %) | 97 % |
| 12 | Darian (Schurke) | 1592 | 4.8 | 80.7 % (79–83) | +1.0 | 73 % | 57 % | 35.4 | 13.5 | 0.5 (+8.1) | 0.46 | 0.0 | 0.4 | 6.3 (91 %) | 1.5 (100 %) | 88 % |
| 13 | Silra (Schurke) | 1556 | 4.8 | 80.3 % (78–82) | +0.3 | 73 % | 64 % | 35.3 | 7.1 | 0.1 (+3.1) | 0.12 | 0.0 | 1.8 | 8.3 (76 %) | 0.1 (42 %) | 3 % |
| 14 | Vaelin (Zauberer) | 1628 | 4.8 | 80.0 % (78–82) | +0.0 | 74 % | 64 % | 51.1 | 8.5 | 0.1 (+5.1) | 0.13 | 0.0 | 1.4 | 5.1 (92 %) | 2.6 (100 %) | 96 % |
| 15 | Vex (Schurke) | 1598 | 4.8 | 79.3 % (77–81) | −0.9 | 66 % | 40 % | 26.2 | 14.6 | 0.2 (+6.9) | 0.24 | 0.0 | 0.7 | 6.3 (86 %) | 1.1 (100 %) | 85 % |

<details><summary>Fähigkeiten je Held (Einsätze gesamt · Anteil mit Wirkung)</summary>

- **Torvald (Krieger):** Langschwert 7435× (69 %) · Spott★ 2455× (98 %) · Heiltrank trinken 1123× (100 %) · Tatendrang★ 929× (100 %) · Zweiter Atem★ 840× (100 %) · Stabilisieren 821× (100 %) · Spurt 597× (100 %) · Siegelstein berühren 40× (100 %)
- **Morwen (Zauberer):** Schattenstich 5279× (62 %) · Furcht★ 3157× (79 %) · Heiltrank trinken 1324× (100 %) · Schattenschritt★ 991× (100 %) · Stabilisieren 307× (100 %) · Siegelstein berühren 93× (100 %) · Spiegelbilder★ 20× (100 %)
- **Brogar (Kleriker):** Dornenranke 6275× (54 %) · Heilendes Wort★ 2295× (100 %) · Schild des Glaubens★ 1722× (100 %) · Bewahren★ 786× (100 %) · Heiltrank trinken 771× (100 %) · Lebenshauch★ 563× (100 %) · Stabilisieren 96× (100 %) · Siegelstein berühren 76× (100 %)
- **Ragnar (Krieger):** Großaxt, rücksichtslos 6312× (99 %) · Raserei★ 1496× (100 %) · Heiltrank trinken 1481× (100 %) · Zweiter Atem★ 946× (100 %) · Tatendrang★ 930× (100 %) · Stabilisieren 895× (100 %) · Spurt 637× (100 %) · Siegelstein berühren 41× (100 %) · Großaxt 19× (95 %)
- **Lyra (Zauberer):** Arkaner Funke 6768× (76 %) · Analyse 6063× (97 %) · Heiltrank trinken 1010× (100 %) · Stabilisieren 161× (100 %) · Siegelstein berühren 90× (100 %)
- **Elara (Kleriker):** Heiliges Licht 5631× (53 %) · Heilendes Wort★ 2334× (100 %) · Segen★ 1257× (100 %) · Heiltrank trinken 1002× (100 %) · Untote vertreiben★ 617× (96 %) · Stabilisieren 172× (100 %) · Siegelstein berühren 89× (100 %) · Streitkolben 4× (100 %)
- **Faye (Waldläufer):** Kurzschwert 5157× (72 %) · Jägermal★ 3569× (91 %) · Heiltrank trinken 1970× (100 %) · Stabilisieren 433× (100 %) · Kurzbogen 410× (70 %) · Befehl an Grau 345× (61 %) · Grau: Umreißen★ 226× (82 %) · Siegelstein berühren 104× (100 %) · Spurt 63× (100 %)
- **Seran (Kleriker):** Kriegshammer 5458× (69 %) · Heilendes Wort★ 2691× (100 %) · Brandmal★ 1242× (100 %) · Heiltrank trinken 748× (100 %) · Bannen★ 501× (60 %) · Spurt 365× (100 %) · Stabilisieren 230× (100 %) · Siegelstein berühren 74× (100 %) · Befehl: Flieh!★ 16× (63 %)
- **Orin (Waldläufer):** Leichte Armbrust 7239× (65 %) · Jägermal★ 3740× (90 %) · Heiltrank trinken 1572× (100 %) · Stabilisieren 267× (100 %) · Siegelstein berühren 117× (100 %) · Netz★ 7× (43 %)
- **Kael (Waldläufer):** Jägermal★ 4643× (92 %) · Langbogen 3627× (63 %) · Fesselnder Pfeil★ 2728× (64 %) · Heiltrank trinken 1407× (100 %) · Doppelschuss★ 616× (88 %) · Stabilisieren 537× (100 %) · Siegelstein berühren 124× (100 %)
- **Isolde (Krieger):** Rapier 8492× (73 %) · Finte★ 2549× (100 %) · Heiltrank trinken 1629× (100 %) · Tatendrang★ 1301× (100 %) · Zweiter Atem★ 1147× (100 %) · Spurt 871× (100 %) · Stabilisieren 853× (100 %) · Siegelstein berühren 56× (100 %)
- **Darian (Schurke):** Kurzschwert 3177× (74 %) · Schattenwirbel★ 2366× (100 %) · Heiltrank trinken 2097× (100 %) · Verstecken 1044× (100 %) · Stabilisieren 725× (100 %) · Kurzbogen 409× (78 %) · Siegelstein berühren 90× (100 %) · Spurt 75× (100 %)
- **Silra (Schurke):** Dolch 6306× (72 %) · Zweiter Dolch 4202× (70 %) · Heiltrank trinken 926× (100 %) · Rückzug 834× (100 %) · Verstecken 210× (100 %) · Stabilisieren 179× (100 %) · Siegelstein berühren 118× (100 %) · Schmutziger Trick★ 112× (42 %)
- **Vaelin (Zauberer):** Glutpfeil 2116× (67 %) · Donnerwelle★ 1832× (100 %) · Heiltrank trinken 1676× (100 %) · Frosthauch★ 1542× (100 %) · Magisches Geschoss★ 830× (100 %) · Stabilisieren 215× (100 %) · Siegelstein berühren 68× (100 %)
- **Vex (Schurke):** Klinge der Gilde 4802× (74 %) · Heiltrank trinken 1813× (100 %) · Gift★ 1744× (100 %) · Aus dem Schatten 587× (100 %) · Leichte Armbrust 524× (75 %) · Stabilisieren 386× (100 %) · Siegelstein berühren 97× (100 %) · Spurt 53× (100 %)

★ = Spezialfähigkeit
</details>

## Die letzte Fackel von Hochwacht

8 Kampfszenen · 3200 Kämpfe · Sieg gesamt 70.5 %

**Gruppengröße:** 3 Helden: 800 Kämpfe, Sieg 67 % · 4 Helden: 800 Kämpfe, Sieg 73 % · 5 Helden: 800 Kämpfe, Sieg 69 % · 6 Helden: 800 Kämpfe, Sieg 72 %

**Klasse in der Gruppe:** Krieger mit 73 % / ohne 65 % · Zauberer mit 71 % / ohne 70 % · Schurke mit 70 % / ohne 72 % · Kleriker mit 71 % / ohne 69 % · Waldläufer mit 69 % / ohne 73 %

**Zuordnung des Gegnerschadens:** 95 % direkt im Zug eines Helden · 5 % im Zug der Gegner (Reaktionen, Flächen, Nachwirkungen – nicht einem Helden zugeordnet) · 0 % durch Begleiter.

| # | Held | Kämpfe | Ø Gruppe | Sieg (95 %) | Δ ohne | Steht | Nie 0 | Schaden aus | Schaden ein | Heilung | Auf | Unterst. | Kontr. | Aktionen (Wirkung) | Spezial (Wirkung) | Spezial sinnvoll |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Torvald (Krieger) | 967 | 4.7 | 75.9 % (73–78) | +7.7 | 73 % | 60 % | 29.3 | 22.4 | 0.9 (+15.7) | 0.94 | 0.0 | 5.1 | 13.5 (82 %) | 3.3 (100 %) | 99 % |
| 2 | Ragnar (Krieger) | 962 | 4.8 | 73.4 % (71–76) | +4.1 | 63 % | 57 % | 48.6 | 21.1 | 1.0 (+11.5) | 1.00 | 0.0 | 3.2 | 12.7 (99 %) | 2.5 (100 %) | 100 % |
| 3 | Seran (Kleriker) | 977 | 4.8 | 72.6 % (70–75) | +2.9 | 58 % | 34 % | 29.1 | 16.5 | 7.7 (+9.2) | 1.21 | 0.0 | 0.9 | 10.4 (81 %) | 3.1 (99 %) | 99 % |
| 4 | Isolde (Krieger) | 866 | 4.7 | 72.5 % (69–75) | +2.7 | 66 % | 51 % | 35.4 | 31.4 | 0.9 (+23.0) | 0.87 | 0.0 | 3.2 | 13.8 (87 %) | 3.2 (100 %) | 99 % |
| 5 | Brogar (Kleriker) | 944 | 4.8 | 71.6 % (69–74) | +1.5 | 66 % | 54 % | 25.2 | 14.0 | 17.5 (+9.8) | 1.54 | 0.7 | 2.8 | 11.9 (74 %) | 4.0 (100 %) | 99 % |
| 6 | Silra (Schurke) | 980 | 4.8 | 71.3 % (68–74) | +1.1 | 67 % | 54 % | 62.4 | 11.3 | 0.3 (+6.4) | 0.35 | 0.0 | 3.1 | 13.4 (70 %) | 0.1 (33 %) | 2 % |
| 7 | Morwen (Zauberer) | 1007 | 4.8 | 71.3 % (68–74) | +1.1 | 71 % | 62 % | 27.5 | 10.7 | 0.4 (+7.7) | 0.37 | 0.0 | 6.4 | 11.1 (72 %) | 3.4 (83 %) | 95 % |
| 8 | Lyra (Zauberer) | 947 | 4.8 | 70.6 % (68–73) | +0.2 | 64 % | 50 % | 38.8 | 12.6 | 0.3 (+7.2) | 0.33 | 0.0 | 0.5 | 14.6 (83 %) | 0.0 (0 %) | 0 % |
| 9 | Vaelin (Zauberer) | 980 | 4.8 | 70.3 % (67–73) | −0.3 | 66 % | 53 % | 71.7 | 13.4 | 0.4 (+9.4) | 0.38 | 0.0 | 1.3 | 8.8 (79 %) | 2.7 (100 %) | 95 % |
| 10 | Elara (Kleriker) | 989 | 4.8 | 69.6 % (67–72) | −1.4 | 67 % | 54 % | 28.5 | 13.6 | 8.6 (+9.2) | 1.20 | 3.8 | 0.0 | 11.7 (72 %) | 2.7 (100 %) | 99 % |
| 11 | Faye (Waldläufer) | 979 | 4.8 | 69.2 % (66–72) | −2.0 | 48 % | 21 % | 38.0 | 21.4 | 0.5 (+11.9) | 0.54 | 0.0 | 3.6 | 10.3 (79 %) | 2.7 (79 %) | 89 % |
| 12 | Orin (Waldläufer) | 927 | 4.8 | 68.9 % (66–72) | −2.3 | 68 % | 58 % | 50.9 | 15.1 | 0.5 (+10.5) | 0.47 | 0.0 | 3.4 | 11.9 (70 %) | 1.9 (78 %) | 59 % |
| 13 | Vex (Schurke) | 956 | 4.8 | 68.8 % (66–72) | −2.4 | 50 % | 23 % | 44.7 | 20.1 | 0.6 (+11.1) | 0.57 | 0.0 | 2.1 | 8.8 (83 %) | 1.5 (100 %) | 93 % |
| 14 | Darian (Schurke) | 968 | 4.8 | 68.6 % (66–71) | −2.8 | 58 % | 32 % | 50.6 | 20.1 | 0.7 (+12.3) | 0.67 | 0.0 | 1.1 | 8.4 (87 %) | 1.5 (100 %) | 84 % |
| 15 | Kael (Waldläufer) | 951 | 4.8 | 68.0 % (65–71) | −3.6 | 65 % | 54 % | 52.8 | 15.6 | 0.7 (+10.5) | 0.68 | 0.0 | 5.2 | 12.7 (76 %) | 5.3 (78 %) | 97 % |

<details><summary>Fähigkeiten je Held (Einsätze gesamt · Anteil mit Wirkung)</summary>

- **Torvald (Krieger):** Langschwert 6812× (65 %) · Spott★ 1733× (100 %) · Heiltrank trinken 1477× (100 %) · Stabilisieren 906× (100 %) · Zweiter Atem★ 717× (100 %) · Tatendrang★ 704× (100 %) · Spurt 689× (100 %)
- **Ragnar (Krieger):** Großaxt, rücksichtslos 5566× (99 %) · Heiltrank trinken 2290× (100 %) · Stabilisieren 966× (100 %) · Raserei★ 937× (100 %) · Zweiter Atem★ 796× (100 %) · Tatendrang★ 701× (100 %) · Spurt 641× (100 %) · Großaxt 284× (68 %)
- **Seran (Kleriker):** Kriegshammer 5304× (65 %) · Heilendes Wort★ 2181× (100 %) · Heiltrank trinken 1004× (100 %) · Brandmal★ 812× (100 %) · Spurt 414× (100 %) · Stabilisieren 367× (100 %) · Befehl: Flieh!★ 68× (41 %)
- **Isolde (Krieger):** Rapier 5591× (73 %) · Heiltrank trinken 2231× (100 %) · Finte★ 1438× (100 %) · Stabilisieren 753× (100 %) · Zweiter Atem★ 672× (100 %) · Tatendrang★ 630× (100 %) · Spurt 629× (100 %)
- **Brogar (Kleriker):** Dornenranke 6226× (53 %) · Heilendes Wort★ 1510× (100 %) · Schild des Glaubens★ 1078× (100 %) · Heiltrank trinken 1014× (100 %) · Bewahren★ 641× (100 %) · Lebenshauch★ 545× (100 %) · Stabilisieren 215× (100 %)
- **Silra (Schurke):** Dolch 6411× (64 %) · Zweiter Dolch 4193× (61 %) · Heiltrank trinken 1046× (100 %) · Rückzug 877× (100 %) · Stabilisieren 340× (100 %) · Verstecken 216× (100 %) · Schmutziger Trick★ 61× (33 %)
- **Morwen (Zauberer):** Schattenstich 6063× (58 %) · Furcht★ 2573× (78 %) · Heiltrank trinken 1277× (100 %) · Schattenschritt★ 840× (100 %) · Stabilisieren 371× (100 %) · Spiegelbilder★ 26× (100 %)
- **Lyra (Zauberer):** Arkaner Funke 6705× (68 %) · Analyse 5755× (96 %) · Heiltrank trinken 1086× (100 %) · Stabilisieren 314× (100 %) · Zeitriss★ 2× (0 %)
- **Vaelin (Zauberer):** Glutpfeil 4053× (56 %) · Heiltrank trinken 1596× (100 %) · Donnerwelle★ 1322× (100 %) · Frosthauch★ 757× (100 %) · Magisches Geschoss★ 546× (100 %) · Stabilisieren 372× (100 %)
- **Elara (Kleriker):** Heiliges Licht 6988× (54 %) · Heilendes Wort★ 1716× (100 %) · Heiltrank trinken 1306× (100 %) · Segen★ 944× (100 %) · Stabilisieren 474× (100 %) · Streitkolben 139× (55 %)
- **Faye (Waldläufer):** Kurzschwert 4137× (72 %) · Jägermal★ 2257× (85 %) · Heiltrank trinken 1839× (100 %) · Stabilisieren 530× (100 %) · Kurzbogen 469× (63 %) · Grau: Umreißen★ 389× (46 %) · Befehl an Grau 353× (34 %) · Spurt 148× (100 %)
- **Orin (Waldläufer):** Leichte Armbrust 7188× (59 %) · Jägermal★ 1729× (78 %) · Heiltrank trinken 1671× (100 %) · Stabilisieren 434× (100 %) · Netz★ 11× (55 %)
- **Vex (Schurke):** Klinge der Gilde 3922× (68 %) · Heiltrank trinken 1687× (100 %) · Gift★ 1393× (100 %) · Stabilisieren 542× (100 %) · Leichte Armbrust 423× (71 %) · Aus dem Schatten 278× (100 %) · Spurt 147× (100 %)
- **Darian (Schurke):** Kurzschwert 3062× (68 %) · Heiltrank trinken 1919× (100 %) · Schattenwirbel★ 1418× (100 %) · Stabilisieren 648× (100 %) · Verstecken 486× (100 %) · Kurzbogen 441× (74 %) · Spurt 146× (100 %)
- **Kael (Waldläufer):** Langbogen 4934× (62 %) · Jägermal★ 3009× (85 %) · Fesselnder Pfeil★ 1661× (67 %) · Heiltrank trinken 1425× (100 %) · Stabilisieren 643× (100 %) · Doppelschuss★ 387× (77 %)

★ = Spezialfähigkeit
</details>

## Die Krone unter dem Eis

10 Kampfszenen · 4000 Kämpfe · Sieg gesamt 83.3 %

**Gruppengröße:** 3 Helden: 1000 Kämpfe, Sieg 84 % · 4 Helden: 1000 Kämpfe, Sieg 86 % · 5 Helden: 1000 Kämpfe, Sieg 82 % · 6 Helden: 1000 Kämpfe, Sieg 82 %

**Klasse in der Gruppe:** Krieger mit 86 % / ohne 79 % · Zauberer mit 84 % / ohne 82 % · Schurke mit 83 % / ohne 84 % · Kleriker mit 82 % / ohne 85 % · Waldläufer mit 82 % / ohne 87 %

**Zuordnung des Gegnerschadens:** 95 % direkt im Zug eines Helden · 5 % im Zug der Gegner (Reaktionen, Flächen, Nachwirkungen – nicht einem Helden zugeordnet) · 0 % durch Begleiter.

| # | Held | Kämpfe | Ø Gruppe | Sieg (95 %) | Δ ohne | Steht | Nie 0 | Schaden aus | Schaden ein | Heilung | Auf | Unterst. | Kontr. | Aktionen (Wirkung) | Spezial (Wirkung) | Spezial sinnvoll |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Ragnar (Krieger) | 1208 | 4.7 | 87.4 % (85–89) | +5.9 | 75 % | 67 % | 32.0 | 15.8 | 0.7 (+8.1) | 0.69 | 0.0 | 2.0 | 10.7 (100 %) | 2.2 (100 %) | 100 % |
| 2 | Torvald (Krieger) | 1216 | 4.8 | 86.3 % (84–88) | +4.4 | 79 % | 63 % | 20.0 | 17.5 | 0.6 (+11.2) | 0.63 | 0.0 | 3.9 | 11.4 (86 %) | 2.9 (100 %) | 97 % |
| 3 | Silra (Schurke) | 1151 | 4.8 | 85.1 % (83–87) | +2.5 | 75 % | 64 % | 47.6 | 7.7 | 0.2 (+4.1) | 0.21 | 0.0 | 2.8 | 11.7 (73 %) | 0.4 (56 %) | 18 % |
| 4 | Lyra (Zauberer) | 1229 | 4.8 | 84.7 % (83–87) | +2.1 | 73 % | 63 % | 30.8 | 8.1 | 0.2 (+4.1) | 0.17 | 0.0 | 1.2 | 13.2 (83 %) | 0.0 (47 %) | 1 % |
| 5 | Isolde (Krieger) | 1236 | 4.8 | 84.2 % (82–86) | +1.4 | 74 % | 60 % | 24.5 | 18.3 | 0.8 (+11.5) | 0.75 | 0.0 | 2.2 | 10.5 (91 %) | 2.6 (100 %) | 94 % |
| 6 | Brogar (Kleriker) | 1147 | 4.8 | 84.0 % (82–86) | +1.0 | 75 % | 66 % | 20.6 | 9.4 | 14.2 (+6.6) | 1.26 | 0.8 | 2.4 | 10.4 (79 %) | 3.6 (100 %) | 98 % |
| 7 | Morwen (Zauberer) | 1137 | 4.9 | 83.5 % (81–86) | +0.3 | 78 % | 72 % | 17.9 | 6.6 | 0.3 (+5.0) | 0.28 | 0.0 | 4.7 | 8.9 (72 %) | 2.8 (77 %) | 91 % |
| 8 | Vaelin (Zauberer) | 1131 | 4.8 | 83.1 % (81–85) | −0.2 | 74 % | 64 % | 52.3 | 8.5 | 0.3 (+5.8) | 0.27 | 0.0 | 1.5 | 7.6 (85 %) | 2.7 (100 %) | 99 % |
| 9 | Faye (Waldläufer) | 1195 | 4.8 | 82.8 % (81–85) | −0.7 | 59 % | 36 % | 27.4 | 15.9 | 0.3 (+8.6) | 0.30 | 0.0 | 2.9 | 9.7 (80 %) | 2.8 (79 %) | 91 % |
| 10 | Darian (Schurke) | 1226 | 4.8 | 82.7 % (80–85) | −0.8 | 67 % | 47 % | 36.3 | 13.8 | 0.4 (+8.0) | 0.43 | 0.0 | 0.7 | 8.0 (91 %) | 1.2 (100 %) | 74 % |
| 11 | Seran (Kleriker) | 1261 | 4.8 | 82.3 % (80–84) | −1.4 | 66 % | 47 % | 19.9 | 12.8 | 6.2 (+7.0) | 1.08 | 0.0 | 1.2 | 9.5 (83 %) | 3.2 (91 %) | 100 % |
| 12 | Orin (Waldläufer) | 1210 | 4.7 | 80.2 % (78–82) | −4.3 | 74 % | 67 % | 35.4 | 9.8 | 0.3 (+6.3) | 0.27 | 0.0 | 2.5 | 9.4 (73 %) | 1.7 (79 %) | 61 % |
| 13 | Elara (Kleriker) | 1222 | 4.8 | 80.0 % (78–82) | −4.7 | 73 % | 65 % | 21.3 | 8.4 | 8.1 (+5.5) | 1.05 | 3.5 | 0.2 | 9.9 (77 %) | 2.6 (100 %) | 98 % |
| 14 | Vex (Schurke) | 1212 | 4.7 | 79.9 % (78–82) | −4.9 | 60 % | 34 % | 29.1 | 15.8 | 0.3 (+7.5) | 0.32 | 0.0 | 1.3 | 8.1 (88 %) | 1.4 (100 %) | 96 % |
| 15 | Kael (Waldläufer) | 1219 | 4.8 | 79.7 % (77–82) | −5.2 | 73 % | 64 % | 38.7 | 9.8 | 0.4 (+6.2) | 0.36 | 0.0 | 3.8 | 10.3 (78 %) | 4.9 (78 %) | 98 % |

<details><summary>Fähigkeiten je Held (Einsätze gesamt · Anteil mit Wirkung)</summary>

- **Ragnar (Krieger):** Großaxt, rücksichtslos 5267× (99 %) · Heiltrank trinken 2142× (100 %) · Raserei★ 1201× (100 %) · Ziel bedienen 1042× (100 %) · Spurt 1003× (100 %) · Zweiter Atem★ 873× (100 %) · Stabilisieren 829× (100 %) · Tatendrang★ 569× (100 %) · Großaxt 32× (88 %)
- **Torvald (Krieger):** Langschwert 6050× (67 %) · Spott★ 2168× (100 %) · Heiltrank trinken 1345× (100 %) · Ziel bedienen 1113× (100 %) · Spurt 1054× (100 %) · Zweiter Atem★ 830× (100 %) · Stabilisieren 768× (100 %) · Tatendrang★ 588× (100 %)
- **Silra (Schurke):** Dolch 6018× (69 %) · Zweiter Dolch 4623× (65 %) · Heiltrank trinken 846× (100 %) · Ziel bedienen 736× (100 %) · Schmutziger Trick★ 455× (56 %) · Rückzug 296× (100 %) · Verstecken 242× (100 %) · Stabilisieren 239× (100 %)
- **Lyra (Zauberer):** Analyse 7219× (90 %) · Arkaner Funke 7198× (72 %) · Heiltrank trinken 881× (100 %) · Ziel bedienen 680× (100 %) · Stabilisieren 207× (100 %) · Zeitriss★ 34× (47 %)
- **Isolde (Krieger):** Rapier 5312× (78 %) · Finte★ 1748× (100 %) · Heiltrank trinken 1407× (100 %) · Ziel bedienen 1067× (100 %) · Spurt 1051× (100 %) · Stabilisieren 930× (100 %) · Zweiter Atem★ 865× (100 %) · Tatendrang★ 601× (100 %)
- **Brogar (Kleriker):** Dornenranke 6268× (60 %) · Heilendes Wort★ 1529× (100 %) · Schild des Glaubens★ 1483× (100 %) · Heiltrank trinken 786× (100 %) · Ziel bedienen 640× (100 %) · Lebenshauch★ 569× (100 %) · Bewahren★ 530× (100 %) · Stabilisieren 167× (100 %)
- **Morwen (Zauberer):** Schattenstich 4923× (58 %) · Furcht★ 2736× (73 %) · Heiltrank trinken 1009× (100 %) · Ziel bedienen 678× (100 %) · Schattenschritt★ 398× (100 %) · Stabilisieren 314× (100 %) · Spiegelbilder★ 47× (100 %)
- **Vaelin (Zauberer):** Glutpfeil 3365× (62 %) · Frosthauch★ 1271× (100 %) · Heiltrank trinken 1252× (100 %) · Magisches Geschoss★ 1008× (100 %) · Donnerwelle★ 771× (100 %) · Ziel bedienen 577× (100 %) · Stabilisieren 304× (100 %)
- **Faye (Waldläufer):** Kurzschwert 3528× (72 %) · Jägermal★ 2510× (86 %) · Heiltrank trinken 1699× (100 %) · Ziel bedienen 1117× (100 %) · Kurzbogen 875× (61 %) · Grau: Umreißen★ 782× (57 %) · Befehl an Grau 593× (54 %) · Stabilisieren 355× (100 %) · Spurt 165× (100 %)
- **Darian (Schurke):** Kurzschwert 2668× (75 %) · Heiltrank trinken 1763× (100 %) · Schattenwirbel★ 1474× (100 %) · Ziel bedienen 1315× (100 %) · Verstecken 1174× (100 %) · Kurzbogen 777× (75 %) · Stabilisieren 530× (100 %) · Spurt 130× (100 %)
- **Seran (Kleriker):** Kriegshammer 5011× (67 %) · Heilendes Wort★ 2209× (100 %) · Brandmal★ 1180× (100 %) · Heiltrank trinken 1089× (100 %) · Ziel bedienen 1013× (100 %) · Befehl: Flieh!★ 563× (47 %) · Spurt 409× (100 %) · Stabilisieren 404× (100 %) · Bannen★ 130× (50 %)
- **Orin (Waldläufer):** Leichte Armbrust 6784× (62 %) · Jägermal★ 2034× (80 %) · Heiltrank trinken 1407× (100 %) · Ziel bedienen 789× (100 %) · Stabilisieren 322× (100 %) · Netz★ 56× (46 %)
- **Elara (Kleriker):** Heiliges Licht 6814× (59 %) · Heilendes Wort★ 1948× (100 %) · Segen★ 1085× (100 %) · Heiltrank trinken 1013× (100 %) · Ziel bedienen 706× (100 %) · Stabilisieren 333× (100 %) · Untote vertreiben★ 139× (91 %) · Streitkolben 2× (100 %)
- **Vex (Schurke):** Klinge der Gilde 3281× (72 %) · Gift★ 1707× (100 %) · Heiltrank trinken 1635× (100 %) · Ziel bedienen 1125× (100 %) · Leichte Armbrust 969× (77 %) · Aus dem Schatten 666× (100 %) · Stabilisieren 389× (100 %) · Spurt 95× (100 %)
- **Kael (Waldläufer):** Langbogen 4036× (66 %) · Jägermal★ 3226× (83 %) · Fesselnder Pfeil★ 2173× (67 %) · Heiltrank trinken 1183× (100 %) · Ziel bedienen 853× (100 %) · Doppelschuss★ 598× (87 %) · Stabilisieren 437× (100 %)

★ = Spezialfähigkeit
</details>
