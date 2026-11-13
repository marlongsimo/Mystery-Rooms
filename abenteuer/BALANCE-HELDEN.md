# Balance-Analyse der Helden (Normal)

Erzeugt mit `node abenteuer/tools/balance-helden.js 100`. Gesteuert von der eingebauten KI, nicht von Menschen.
Je Kampfszene und Gruppengröße (3, 4, 5, 6) 100 zufällige Gruppen. Werte „je Kampf“ sind Durchschnitte über alle Kämpfe, in denen der Held dabei war.

**Spalten:** Kämpfe = Anzahl Simulationen mit dem Held · Ø Gruppe = durchschnittliche Gruppengröße · Sieg = Siegquote seiner Gruppen (95-%-Bereich) · Δ ohne = Siegquote mit ihm minus Siegquote aller Kämpfe ohne ihn (Prozentpunkte; misst seinen Beitrag unabhängig von der Kampagnenschwere) · Steht = am Kampfende auf den Beinen · Nie 0 = nie auf 0 TP · Schaden aus/ein = verursacht/erlitten je Kampf (ohne Overkill) · Heilung = an anderen (+ selbst) je Kampf · Auf = Verbündete aufgerichtet je Kampf · Unterst./Kontr. = neue Zustände auf Verbündeten/Gegnern je Kampf · Aktionen = ausgeführte Aktionen je Kampf, davon mit Wirkung · Reakt. = automatische Reaktionen/Passive je Kampf (Schutzhaltung, Parade, Fangschuss, Schutzglyphe, Arkaner Schild, Gedankenstütze, Glückspilz) · Spezial = Spezialfähigkeiten (begrenzt oder Zauberplatz, auch automatische wie Schutzglyphe) je Kampf, davon mit Wirkung · Spezial sinnvoll = Anteil der Kämpfe mit mindestens einer wirksamen Spezialfähigkeit.

## Das Moor der stummen Lichter

5 Kampfszenen · 2000 Kämpfe · Sieg gesamt 82.0 %

**Gruppengröße:** 3 Helden: 500 Kämpfe, Sieg 83 % · 4 Helden: 500 Kämpfe, Sieg 83 % · 5 Helden: 500 Kämpfe, Sieg 78 % · 6 Helden: 500 Kämpfe, Sieg 84 %

**Klasse in der Gruppe:** Krieger mit 81 % / ohne 84 % · Zauberer mit 83 % / ohne 80 % · Schurke mit 83 % / ohne 81 % · Kleriker mit 83 % / ohne 80 % · Waldläufer mit 81 % / ohne 84 %

**Zuordnung des Gegnerschadens:** 98 % direkt im Zug eines Helden · 2 % im Zug der Gegner (Reaktionen, Flächen, Nachwirkungen – nicht einem Helden zugeordnet) · 0 % durch Begleiter.

| # | Held | Kämpfe | Ø Gruppe | Sieg (95 %) | Δ ohne | Steht | Nie 0 | Schaden aus | Schaden ein | Heilung | Auf | Unterst. | Kontr. | Aktionen (Wirkung) | Reakt. | Spezial (Wirkung) | Spezial sinnvoll |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Silra (Schurke) | 579 | 4.8 | 86.5 % (84–89) | +6.4 | 79 % | 58 % | 82.3 | 10.6 | 0.4 (+6.0) | 0.38 | 0.0 | 4.5 | 14.7 (79 %) | 0.6 | 0.8 (90 %) | 67 % |
| 2 | Morwen (Zauberer) | 636 | 4.8 | 84.3 % (81–87) | +3.4 | 81 % | 69 % | 31.3 | 7.8 | 0.4 (+5.0) | 0.44 | 0.0 | 6.9 | 10.7 (69 %) | 0.5 | 3.4 (83 %) | 99 % |
| 3 | Vaelin (Zauberer) | 607 | 4.7 | 83.7 % (81–86) | +2.5 | 76 % | 57 % | 83.8 | 11.2 | 0.4 (+7.2) | 0.43 | 0.0 | 2.1 | 9.0 (87 %) | 0.5 | 3.4 (100 %) | 100 % |
| 4 | Brogar (Kleriker) | 608 | 4.7 | 83.1 % (80–86) | +1.6 | 78 % | 62 % | 32.2 | 11.5 | 15.9 (+8.3) | 1.73 | 0.8 | 3.5 | 13.4 (73 %) | 0.0 | 4.1 (100 %) | 99 % |
| 5 | Seran (Kleriker) | 601 | 4.8 | 83.0 % (80–86) | +1.5 | 62 % | 29 % | 30.2 | 18.5 | 6.9 (+10.7) | 1.00 | 0.0 | 1.2 | 11.7 (88 %) | 0.0 | 3.7 (96 %) | 100 % |
| 6 | Lyra (Zauberer) | 604 | 4.8 | 82.3 % (79–85) | +0.5 | 74 % | 50 % | 53.9 | 11.8 | 0.4 (+6.5) | 0.39 | 0.0 | 1.0 | 16.6 (90 %) | 4.0 | 4.0 (100 %) | 98 % |
| 7 | Kael (Waldläufer) | 592 | 4.8 | 82.3 % (79–85) | +0.4 | 79 % | 68 % | 78.6 | 10.0 | 0.7 (+6.5) | 0.65 | 0.0 | 7.0 | 13.8 (83 %) | 0.0 | 7.4 (82 %) | 100 % |
| 8 | Elara (Kleriker) | 606 | 4.8 | 81.8 % (79–85) | −0.1 | 77 % | 59 % | 33.6 | 11.1 | 9.9 (+7.7) | 1.33 | 3.2 | 0.8 | 13.0 (72 %) | 0.0 | 3.2 (99 %) | 100 % |
| 9 | Vex (Schurke) | 572 | 4.8 | 81.3 % (78–84) | −0.9 | 63 % | 33 % | 63.0 | 20.3 | 0.7 (+11.8) | 0.65 | 0.0 | 3.6 | 10.7 (90 %) | 0.0 | 1.7 (100 %) | 97 % |
| 10 | Torvald (Krieger) | 600 | 4.8 | 81.2 % (78–84) | −1.1 | 66 % | 47 % | 30.1 | 22.8 | 0.9 (+15.0) | 0.86 | 0.0 | 4.3 | 12.6 (88 %) | 4.5 | 2.4 (100 %) | 100 % |
| 11 | Orin (Waldläufer) | 598 | 4.8 | 80.6 % (77–84) | −1.9 | 78 % | 68 % | 80.0 | 9.1 | 0.6 (+5.5) | 0.57 | 0.0 | 4.6 | 12.0 (79 %) | 1.2 | 3.5 (74 %) | 89 % |
| 12 | Darian (Schurke) | 611 | 4.7 | 80.4 % (77–83) | −2.3 | 62 % | 34 % | 59.5 | 17.8 | 0.6 (+9.9) | 0.61 | 0.0 | 1.6 | 9.3 (93 %) | 0.0 | 1.5 (100 %) | 87 % |
| 13 | Faye (Waldläufer) | 611 | 4.7 | 80.4 % (77–83) | −2.3 | 53 % | 27 % | 48.2 | 22.2 | 0.5 (+11.4) | 0.45 | 0.0 | 4.7 | 11.9 (79 %) | 0.0 | 3.7 (76 %) | 95 % |
| 14 | Isolde (Krieger) | 577 | 4.8 | 78.9 % (75–82) | −4.3 | 65 % | 49 % | 41.9 | 24.1 | 1.1 (+13.7) | 1.08 | 0.0 | 3.5 | 13.3 (92 %) | 1.5 | 3.0 (100 %) | 98 % |
| 15 | Ragnar (Krieger) | 598 | 4.8 | 78.8 % (75–82) | −4.5 | 56 % | 44 % | 45.8 | 23.2 | 0.9 (+11.2) | 0.86 | 0.0 | 3.2 | 12.6 (100 %) | 0.0 | 2.4 (100 %) | 100 % |

<details><summary>Fähigkeiten je Held (Einsätze gesamt · Anteil mit Wirkung)</summary>

- **Silra (Schurke):** Dolch 4141× (79 %) · Zweiter Dolch 3327× (74 %) · Heiltrank trinken 534× (100 %) · Glückspilz (automatisch)★ 345× (100 %) · Stabilisieren 220× (100 %) · Verstecken 151× (100 %) · Schmutziger Trick★ 133× (65 %) · Rückzug 16× (100 %)
- **Morwen (Zauberer):** Schattenstich 4230× (59 %) · Furcht★ 1689× (79 %) · Heiltrank trinken 497× (100 %) · Arkaner Schild (automatisch)★ 305× (100 %) · Stabilisieren 277× (100 %) · Schattenschritt★ 133× (100 %) · Spiegelbilder★ 5× (100 %)
- **Vaelin (Zauberer):** Glutpfeil 2715× (74 %) · Frosthauch★ 825× (100 %) · Heiltrank trinken 701× (100 %) · Donnerwelle★ 688× (100 %) · Arkaner Schild (automatisch)★ 303× (100 %) · Magisches Geschoss★ 261× (100 %) · Stabilisieren 258× (100 %)
- **Brogar (Kleriker):** Dornenranke 4927× (55 %) · Heilendes Wort★ 1019× (100 %) · Schild des Glaubens★ 720× (100 %) · Heiltrank trinken 549× (100 %) · Lebenshauch★ 412× (100 %) · Bewahren★ 347× (100 %) · Stabilisieren 191× (100 %)
- **Seran (Kleriker):** Kriegshammer 3009× (76 %) · Heilendes Wort★ 1382× (100 %) · Spurt 1006× (100 %) · Heiltrank trinken 649× (100 %) · Brandmal★ 559× (100 %) · Bannen★ 227× (63 %) · Stabilisieren 178× (100 %) · Befehl: Flieh!★ 31× (77 %)
- **Lyra (Zauberer):** Arkaner Funke 4765× (84 %) · Analyse 4420× (94 %) · Schutzglyphe (automatisch)★ 1558× (100 %) · Gedankenstütze (automatisch)★ 598× (100 %) · Heiltrank trinken 597× (100 %) · Arkaner Schild (automatisch)★ 235× (100 %) · Stabilisieren 233× (100 %)
- **Kael (Waldläufer):** Langbogen 2873× (79 %) · Jägermal★ 2548× (80 %) · Fesselnder Pfeil★ 1113× (82 %) · Doppelschuss★ 694× (90 %) · Heiltrank trinken 554× (100 %) · Stabilisieren 385× (100 %)
- **Elara (Kleriker):** Heiliges Licht 5015× (56 %) · Heilendes Wort★ 1194× (100 %) · Heiltrank trinken 594× (100 %) · Segen★ 488× (100 %) · Stabilisieren 338× (100 %) · Untote vertreiben★ 228× (96 %)
- **Vex (Schurke):** Klinge der Gilde 2370× (79 %) · Heiltrank trinken 1022× (100 %) · Gift★ 991× (100 %) · Leichte Armbrust 846× (84 %) · Aus dem Schatten 505× (100 %) · Stabilisieren 373× (100 %) · Spurt 39× (100 %)
- **Torvald (Krieger):** Langschwert 3626× (75 %) · Spurt 1164× (100 %) · Heiltrank trinken 865× (100 %) · Spott★ 578× (100 %) · Stabilisieren 518× (100 %) · Zweiter Atem★ 485× (100 %) · Tatendrang★ 352× (100 %)
- **Orin (Waldläufer):** Schwere Armbrust 4208× (78 %) · Jägermal★ 1753× (74 %) · Heiltrank trinken 524× (100 %) · Stabilisieren 342× (100 %) · Netz★ 340× (74 %)
- **Darian (Schurke):** Kurzschwert 1745× (81 %) · Heiltrank trinken 958× (100 %) · Schattenwirbel★ 929× (100 %) · Verstecken 833× (100 %) · Kurzbogen 817× (89 %) · Stabilisieren 371× (100 %) · Spurt 25× (100 %)
- **Faye (Waldläufer):** Kurzschwert 2589× (77 %) · Jägermal★ 1823× (85 %) · Heiltrank trinken 1020× (100 %) · Kurzbogen 827× (70 %) · Grau: Umreißen★ 429× (39 %) · Stabilisieren 277× (100 %) · Befehl an Grau 253× (31 %) · Spurt 25× (100 %)
- **Isolde (Krieger):** Rapier 3317× (82 %) · Spurt 1291× (100 %) · Finte★ 945× (100 %) · Heiltrank trinken 736× (100 %) · Stabilisieren 621× (100 %) · Zweiter Atem★ 432× (100 %) · Tatendrang★ 335× (100 %)
- **Ragnar (Krieger):** Großaxt, rücksichtslos 3054× (100 %) · Heiltrank trinken 1274× (100 %) · Spurt 1233× (100 %) · Raserei★ 580× (100 %) · Stabilisieren 514× (100 %) · Zweiter Atem★ 492× (100 %) · Tatendrang★ 369× (100 %) · Großaxt 40× (83 %)

★ = Spezialfähigkeit
</details>

## Das Siegel von Grauwacht

14 Kampfszenen · 5600 Kämpfe · Sieg gesamt 80.8 %

**Gruppengröße:** 3 Helden: 1400 Kämpfe, Sieg 75 % · 4 Helden: 1400 Kämpfe, Sieg 80 % · 5 Helden: 1400 Kämpfe, Sieg 82 % · 6 Helden: 1400 Kämpfe, Sieg 87 %

**Klasse in der Gruppe:** Krieger mit 82 % / ohne 79 % · Zauberer mit 82 % / ohne 79 % · Schurke mit 82 % / ohne 78 % · Kleriker mit 81 % / ohne 80 % · Waldläufer mit 82 % / ohne 79 %

**Zuordnung des Gegnerschadens:** 99 % direkt im Zug eines Helden · 1 % im Zug der Gegner (Reaktionen, Flächen, Nachwirkungen – nicht einem Helden zugeordnet) · 0 % durch Begleiter.

| # | Held | Kämpfe | Ø Gruppe | Sieg (95 %) | Δ ohne | Steht | Nie 0 | Schaden aus | Schaden ein | Heilung | Auf | Unterst. | Kontr. | Aktionen (Wirkung) | Reakt. | Spezial (Wirkung) | Spezial sinnvoll |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Elara (Kleriker) | 1547 | 4.8 | 83.2 % (81–85) | +3.4 | 79 % | 72 % | 12.8 | 7.3 | 7.2 (+4.5) | 0.76 | 3.3 | 1.4 | 7.1 (76 %) | 0.0 | 2.7 (99 %) | 98 % |
| 2 | Faye (Waldläufer) | 1569 | 4.8 | 82.7 % (81–84) | +2.6 | 70 % | 48 % | 23.9 | 14.7 | 0.3 (+6.6) | 0.29 | 0.0 | 3.0 | 8.0 (83 %) | 0.0 | 2.7 (90 %) | 95 % |
| 3 | Lyra (Zauberer) | 1582 | 4.8 | 82.6 % (81–84) | +2.6 | 75 % | 62 % | 22.4 | 8.1 | 0.1 (+3.6) | 0.09 | 0.0 | 0.3 | 8.8 (87 %) | 3.0 | 3.0 (100 %) | 91 % |
| 4 | Ragnar (Krieger) | 1535 | 4.8 | 82.6 % (81–84) | +2.5 | 77 % | 72 % | 28.5 | 13.3 | 0.6 (+6.0) | 0.57 | 0.0 | 1.4 | 8.3 (99 %) | 0.0 | 2.2 (100 %) | 100 % |
| 5 | Isolde (Krieger) | 1873 | 4.7 | 82.6 % (81–84) | +2.7 | 78 % | 73 % | 28.6 | 18.8 | 0.5 (+9.8) | 0.45 | 0.0 | 1.8 | 9.0 (86 %) | 1.7 | 2.7 (100 %) | 97 % |
| 6 | Morwen (Zauberer) | 1571 | 4.8 | 82.6 % (81–84) | +2.5 | 79 % | 71 % | 13.7 | 7.4 | 0.2 (+4.8) | 0.17 | 0.0 | 4.3 | 7.0 (77 %) | 0.5 | 3.1 (86 %) | 94 % |
| 7 | Seran (Kleriker) | 1541 | 4.8 | 82.5 % (81–84) | +2.5 | 72 % | 54 % | 17.2 | 10.7 | 5.7 (+4.7) | 0.78 | 0.0 | 1.0 | 7.2 (83 %) | 0.0 | 2.8 (95 %) | 98 % |
| 8 | Kael (Waldläufer) | 1520 | 4.8 | 82.2 % (80–84) | +2.0 | 76 % | 69 % | 31.6 | 10.0 | 0.3 (+6.3) | 0.33 | 0.0 | 3.9 | 8.8 (82 %) | 0.0 | 5.7 (83 %) | 98 % |
| 9 | Vex (Schurke) | 1598 | 4.8 | 82.2 % (80–84) | +2.0 | 71 % | 53 % | 28.3 | 13.8 | 0.3 (+7.2) | 0.34 | 0.0 | 0.8 | 6.7 (86 %) | 0.0 | 1.1 (100 %) | 89 % |
| 10 | Torvald (Krieger) | 1543 | 4.8 | 82.2 % (80–84) | +1.9 | 76 % | 67 % | 18.2 | 15.4 | 0.5 (+10.0) | 0.52 | 0.0 | 2.6 | 8.4 (84 %) | 2.8 | 2.0 (100 %) | 99 % |
| 11 | Darian (Schurke) | 1592 | 4.8 | 82.1 % (80–84) | +1.9 | 74 % | 57 % | 35.4 | 13.4 | 0.4 (+8.3) | 0.41 | 0.0 | 0.4 | 6.3 (91 %) | 0.0 | 1.5 (100 %) | 88 % |
| 12 | Silra (Schurke) | 1556 | 4.8 | 81.6 % (80–83) | +1.1 | 73 % | 61 % | 34.0 | 7.6 | 0.1 (+3.4) | 0.12 | 0.0 | 1.9 | 8.0 (74 %) | 0.5 | 1.1 (73 %) | 64 % |
| 13 | Brogar (Kleriker) | 1588 | 4.8 | 81.3 % (79–83) | +0.7 | 74 % | 62 % | 13.4 | 8.8 | 12.8 (+5.2) | 1.04 | 0.8 | 1.2 | 7.8 (77 %) | 0.0 | 3.3 (100 %) | 96 % |
| 14 | Vaelin (Zauberer) | 1628 | 4.8 | 80.7 % (79–83) | −0.1 | 76 % | 66 % | 50.8 | 8.1 | 0.1 (+5.0) | 0.13 | 0.0 | 1.3 | 5.0 (92 %) | 0.4 | 3.0 (100 %) | 98 % |
| 15 | Orin (Waldläufer) | 1557 | 4.8 | 80.4 % (78–82) | −0.5 | 77 % | 71 % | 30.4 | 8.4 | 0.2 (+5.0) | 0.17 | 0.0 | 2.5 | 7.7 (77 %) | 0.9 | 2.4 (80 %) | 81 % |

<details><summary>Fähigkeiten je Held (Einsätze gesamt · Anteil mit Wirkung)</summary>

- **Elara (Kleriker):** Heiliges Licht 5560× (54 %) · Heilendes Wort★ 2287× (100 %) · Segen★ 1258× (100 %) · Heiltrank trinken 1000× (100 %) · Untote vertreiben★ 615× (95 %) · Stabilisieren 160× (100 %) · Siegelstein berühren 86× (100 %) · Streitkolben 4× (100 %)
- **Faye (Waldläufer):** Kurzschwert 5265× (72 %) · Jägermal★ 3917× (91 %) · Heiltrank trinken 1624× (100 %) · Stabilisieren 453× (100 %) · Kurzbogen 423× (68 %) · Befehl an Grau 389× (65 %) · Grau: Umreißen★ 294× (83 %) · Siegelstein berühren 103× (100 %) · Spurt 63× (100 %)
- **Lyra (Zauberer):** Arkaner Funke 6723× (76 %) · Analyse 6038× (97 %) · Schutzglyphe (automatisch)★ 2861× (100 %) · Gedankenstütze (automatisch)★ 1365× (100 %) · Heiltrank trinken 992× (100 %) · Arkaner Schild (automatisch)★ 486× (100 %) · Stabilisieren 149× (100 %) · Siegelstein berühren 88× (100 %)
- **Ragnar (Krieger):** Großaxt, rücksichtslos 6302× (99 %) · Raserei★ 1501× (100 %) · Heiltrank trinken 1493× (100 %) · Tatendrang★ 933× (100 %) · Zweiter Atem★ 905× (100 %) · Stabilisieren 872× (100 %) · Spurt 636× (100 %) · Großaxt 49× (98 %) · Siegelstein berühren 40× (100 %)
- **Isolde (Krieger):** Rapier 8520× (73 %) · Finte★ 2605× (100 %) · Heiltrank trinken 1519× (100 %) · Tatendrang★ 1301× (100 %) · Zweiter Atem★ 1103× (100 %) · Spurt 899× (100 %) · Stabilisieren 844× (100 %) · Siegelstein berühren 54× (100 %)
- **Morwen (Zauberer):** Schattenstich 5133× (63 %) · Furcht★ 3157× (79 %) · Heiltrank trinken 1327× (100 %) · Schattenschritt★ 942× (100 %) · Arkaner Schild (automatisch)★ 711× (100 %) · Stabilisieren 270× (100 %) · Siegelstein berühren 90× (100 %) · Spiegelbilder★ 17× (100 %)
- **Seran (Kleriker):** Kriegshammer 5390× (70 %) · Heilendes Wort★ 2581× (100 %) · Brandmal★ 1245× (100 %) · Heiltrank trinken 717× (100 %) · Bannen★ 504× (59 %) · Spurt 375× (100 %) · Stabilisieren 178× (100 %) · Siegelstein berühren 75× (100 %) · Befehl: Flieh!★ 17× (47 %)
- **Kael (Waldläufer):** Jägermal★ 4534× (90 %) · Langbogen 2659× (67 %) · Fesselnder Pfeil★ 2460× (68 %) · Doppelschuss★ 1673× (83 %) · Heiltrank trinken 1365× (100 %) · Stabilisieren 503× (100 %) · Siegelstein berühren 123× (100 %)
- **Vex (Schurke):** Klinge der Gilde 5224× (74 %) · Heiltrank trinken 1858× (100 %) · Gift★ 1765× (100 %) · Aus dem Schatten 648× (100 %) · Stabilisieren 551× (100 %) · Leichte Armbrust 526× (76 %) · Siegelstein berühren 97× (100 %) · Spurt 58× (100 %)
- **Torvald (Krieger):** Langschwert 6992× (70 %) · Heiltrank trinken 1305× (100 %) · Spott★ 1230× (100 %) · Zweiter Atem★ 993× (100 %) · Tatendrang★ 930× (100 %) · Stabilisieren 798× (100 %) · Spurt 607× (100 %) · Siegelstein berühren 41× (100 %)
- **Darian (Schurke):** Kurzschwert 3224× (75 %) · Schattenwirbel★ 2362× (100 %) · Heiltrank trinken 2125× (100 %) · Verstecken 1046× (100 %) · Stabilisieren 652× (100 %) · Kurzbogen 385× (76 %) · Siegelstein berühren 90× (100 %) · Spurt 71× (100 %)
- **Silra (Schurke):** Dolch 6048× (72 %) · Zweiter Dolch 3824× (69 %) · Heiltrank trinken 983× (100 %) · Schmutziger Trick★ 888× (49 %) · Glückspilz (automatisch)★ 755× (100 %) · Rückzug 246× (100 %) · Verstecken 196× (100 %) · Stabilisieren 180× (100 %) · Siegelstein berühren 118× (100 %)
- **Brogar (Kleriker):** Dornenranke 6112× (54 %) · Heilendes Wort★ 2181× (100 %) · Schild des Glaubens★ 1781× (100 %) · Bewahren★ 780× (100 %) · Heiltrank trinken 761× (100 %) · Lebenshauch★ 527× (100 %) · Stabilisieren 112× (100 %) · Siegelstein berühren 81× (100 %)
- **Vaelin (Zauberer):** Glutpfeil 2053× (69 %) · Donnerwelle★ 1858× (100 %) · Heiltrank trinken 1663× (100 %) · Frosthauch★ 1531× (100 %) · Magisches Geschoss★ 836× (100 %) · Arkaner Schild (automatisch)★ 731× (100 %) · Stabilisieren 206× (100 %) · Siegelstein berühren 69× (100 %)
- **Orin (Waldläufer):** Schwere Armbrust 6262× (68 %) · Jägermal★ 2970× (88 %) · Heiltrank trinken 1536× (100 %) · Netz★ 783× (50 %) · Stabilisieren 260× (100 %) · Siegelstein berühren 118× (100 %)

★ = Spezialfähigkeit
</details>

## Die letzte Fackel von Hochwacht

8 Kampfszenen · 3200 Kämpfe · Sieg gesamt 73.2 %

**Gruppengröße:** 3 Helden: 800 Kämpfe, Sieg 67 % · 4 Helden: 800 Kämpfe, Sieg 78 % · 5 Helden: 800 Kämpfe, Sieg 70 % · 6 Helden: 800 Kämpfe, Sieg 77 %

**Klasse in der Gruppe:** Krieger mit 75 % / ohne 70 % · Zauberer mit 74 % / ohne 72 % · Schurke mit 73 % / ohne 73 % · Kleriker mit 73 % / ohne 74 % · Waldläufer mit 74 % / ohne 72 %

**Zuordnung des Gegnerschadens:** 98 % direkt im Zug eines Helden · 2 % im Zug der Gegner (Reaktionen, Flächen, Nachwirkungen – nicht einem Helden zugeordnet) · 0 % durch Begleiter.

| # | Held | Kämpfe | Ø Gruppe | Sieg (95 %) | Δ ohne | Steht | Nie 0 | Schaden aus | Schaden ein | Heilung | Auf | Unterst. | Kontr. | Aktionen (Wirkung) | Reakt. | Spezial (Wirkung) | Spezial sinnvoll |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Torvald (Krieger) | 967 | 4.7 | 76.6 % (74–79) | +5.0 | 70 % | 55 % | 29.5 | 24.0 | 0.9 (+17.8) | 0.94 | 0.0 | 4.2 | 12.8 (81 %) | 4.9 | 2.5 (100 %) | 100 % |
| 2 | Vex (Schurke) | 956 | 4.8 | 75.6 % (73–78) | +3.5 | 63 % | 37 % | 51.3 | 19.2 | 0.6 (+11.9) | 0.60 | 0.0 | 2.3 | 9.7 (83 %) | 0.0 | 1.5 (100 %) | 95 % |
| 3 | Isolde (Krieger) | 866 | 4.7 | 74.9 % (72–78) | +2.4 | 70 % | 59 % | 44.7 | 31.5 | 1.0 (+23.1) | 0.96 | 0.0 | 3.3 | 14.1 (87 %) | 2.4 | 3.2 (100 %) | 99 % |
| 4 | Morwen (Zauberer) | 1007 | 4.8 | 74.9 % (72–77) | +2.5 | 74 % | 65 % | 26.7 | 9.4 | 0.3 (+6.9) | 0.32 | 0.0 | 6.2 | 10.6 (72 %) | 0.5 | 3.9 (85 %) | 98 % |
| 5 | Ragnar (Krieger) | 962 | 4.8 | 74.4 % (72–77) | +1.8 | 64 % | 57 % | 49.1 | 32.1 | 0.9 (+22.5) | 0.90 | 0.0 | 3.2 | 14.8 (99 %) | 0.0 | 2.5 (100 %) | 100 % |
| 6 | Brogar (Kleriker) | 944 | 4.8 | 74.3 % (71–77) | +1.6 | 69 % | 56 % | 25.4 | 13.5 | 15.7 (+9.8) | 1.39 | 0.8 | 2.8 | 11.8 (74 %) | 0.0 | 4.0 (100 %) | 98 % |
| 7 | Faye (Waldläufer) | 979 | 4.8 | 74.1 % (71–77) | +1.3 | 55 % | 30 % | 41.6 | 20.9 | 0.5 (+11.5) | 0.51 | 0.0 | 3.9 | 10.9 (78 %) | 0.0 | 3.0 (79 %) | 94 % |
| 8 | Lyra (Zauberer) | 947 | 4.8 | 73.9 % (71–77) | +1.1 | 69 % | 55 % | 39.5 | 12.0 | 0.3 (+7.1) | 0.27 | 0.0 | 0.6 | 14.5 (83 %) | 4.1 | 4.1 (100 %) | 98 % |
| 9 | Seran (Kleriker) | 977 | 4.8 | 73.6 % (71–76) | +0.6 | 58 % | 33 % | 30.0 | 17.1 | 7.4 (+10.0) | 1.17 | 0.0 | 0.9 | 10.5 (81 %) | 0.0 | 3.1 (99 %) | 99 % |
| 10 | Orin (Waldläufer) | 927 | 4.8 | 73.4 % (70–76) | +0.3 | 72 % | 64 % | 55.8 | 13.9 | 0.5 (+9.9) | 0.47 | 0.0 | 3.3 | 11.7 (68 %) | 1.4 | 2.9 (63 %) | 80 % |
| 11 | Silra (Schurke) | 980 | 4.8 | 73.2 % (70–76) | +0.0 | 67 % | 54 % | 62.4 | 11.9 | 0.3 (+6.9) | 0.28 | 0.0 | 3.4 | 13.3 (67 %) | 0.6 | 1.3 (73 %) | 74 % |
| 12 | Darian (Schurke) | 968 | 4.8 | 72.4 % (70–75) | −1.1 | 60 % | 34 % | 51.3 | 20.7 | 0.6 (+12.9) | 0.64 | 0.0 | 1.2 | 8.5 (87 %) | 0.0 | 1.5 (100 %) | 85 % |
| 13 | Kael (Waldläufer) | 951 | 4.8 | 72.0 % (69–75) | −1.6 | 68 % | 59 % | 57.8 | 14.6 | 0.6 (+10.1) | 0.64 | 0.0 | 5.5 | 12.6 (77 %) | 0.0 | 6.3 (78 %) | 97 % |
| 14 | Vaelin (Zauberer) | 980 | 4.8 | 71.5 % (69–74) | −2.3 | 68 % | 56 % | 71.9 | 13.0 | 0.3 (+9.2) | 0.32 | 0.0 | 1.3 | 8.7 (79 %) | 0.6 | 3.3 (100 %) | 98 % |
| 15 | Elara (Kleriker) | 989 | 4.8 | 71.3 % (68–74) | −2.7 | 70 % | 58 % | 28.7 | 12.9 | 8.4 (+9.0) | 1.06 | 3.8 | 0.0 | 11.5 (72 %) | 0.0 | 2.7 (100 %) | 98 % |

<details><summary>Fähigkeiten je Held (Einsätze gesamt · Anteil mit Wirkung)</summary>

- **Torvald (Krieger):** Langschwert 6646× (65 %) · Heiltrank trinken 1713× (100 %) · Stabilisieren 906× (100 %) · Spott★ 885× (100 %) · Zweiter Atem★ 796× (100 %) · Tatendrang★ 710× (100 %) · Spurt 677× (100 %)
- **Vex (Schurke):** Klinge der Gilde 4477× (68 %) · Heiltrank trinken 1780× (100 %) · Gift★ 1469× (100 %) · Stabilisieren 574× (100 %) · Leichte Armbrust 465× (68 %) · Aus dem Schatten 328× (100 %) · Spurt 193× (100 %)
- **Isolde (Krieger):** Rapier 5775× (72 %) · Heiltrank trinken 2265× (100 %) · Finte★ 1464× (100 %) · Stabilisieren 830× (100 %) · Zweiter Atem★ 656× (100 %) · Tatendrang★ 639× (100 %) · Spurt 597× (100 %)
- **Morwen (Zauberer):** Schattenstich 5846× (59 %) · Furcht★ 2565× (77 %) · Heiltrank trinken 1131× (100 %) · Schattenschritt★ 753× (100 %) · Arkaner Schild (automatisch)★ 538× (100 %) · Stabilisieren 324× (100 %) · Spiegelbilder★ 28× (100 %)
- **Ragnar (Krieger):** Großaxt, rücksichtslos 5627× (99 %) · Heiltrank trinken 4328× (100 %) · Raserei★ 937× (100 %) · Stabilisieren 861× (100 %) · Zweiter Atem★ 786× (100 %) · Tatendrang★ 697× (100 %) · Spurt 669× (100 %) · Großaxt 297× (71 %)
- **Brogar (Kleriker):** Dornenranke 6265× (53 %) · Heilendes Wort★ 1505× (100 %) · Schild des Glaubens★ 1082× (100 %) · Heiltrank trinken 939× (100 %) · Bewahren★ 645× (100 %) · Lebenshauch★ 502× (100 %) · Stabilisieren 193× (100 %)
- **Faye (Waldläufer):** Kurzschwert 4458× (72 %) · Jägermal★ 2502× (84 %) · Heiltrank trinken 1736× (100 %) · Kurzbogen 534× (60 %) · Stabilisieren 500× (100 %) · Grau: Umreißen★ 456× (51 %) · Befehl an Grau 401× (40 %) · Spurt 126× (100 %)
- **Lyra (Zauberer):** Arkaner Funke 6727× (69 %) · Analyse 5718× (96 %) · Schutzglyphe (automatisch)★ 2207× (100 %) · Gedankenstütze (automatisch)★ 1246× (100 %) · Heiltrank trinken 1058× (100 %) · Arkaner Schild (automatisch)★ 406× (100 %) · Stabilisieren 260× (100 %) · Zeitriss★ 3× (67 %)
- **Seran (Kleriker):** Kriegshammer 5391× (65 %) · Heilendes Wort★ 2166× (100 %) · Heiltrank trinken 1063× (100 %) · Brandmal★ 826× (100 %) · Spurt 435× (100 %) · Stabilisieren 352× (100 %) · Befehl: Flieh!★ 70× (39 %)
- **Orin (Waldläufer):** Schwere Armbrust 6090× (60 %) · Heiltrank trinken 1575× (100 %) · Jägermal★ 1556× (74 %) · Netz★ 1161× (48 %) · Stabilisieren 435× (100 %)
- **Silra (Schurke):** Dolch 6351× (64 %) · Zweiter Dolch 4046× (61 %) · Heiltrank trinken 1126× (100 %) · Schmutziger Trick★ 723× (52 %) · Glückspilz (automatisch)★ 553× (100 %) · Rückzug 275× (100 %) · Stabilisieren 272× (100 %) · Verstecken 196× (100 %)
- **Darian (Schurke):** Kurzschwert 3170× (68 %) · Heiltrank trinken 1976× (100 %) · Schattenwirbel★ 1457× (100 %) · Stabilisieren 621× (100 %) · Verstecken 493× (100 %) · Kurzbogen 405× (75 %) · Spurt 146× (100 %)
- **Kael (Waldläufer):** Langbogen 4033× (64 %) · Jägermal★ 3064× (84 %) · Fesselnder Pfeil★ 1613× (70 %) · Heiltrank trinken 1381× (100 %) · Doppelschuss★ 1325× (76 %) · Stabilisieren 604× (100 %)
- **Vaelin (Zauberer):** Glutpfeil 4054× (56 %) · Heiltrank trinken 1564× (100 %) · Donnerwelle★ 1327× (100 %) · Frosthauch★ 753× (100 %) · Magisches Geschoss★ 556× (100 %) · Arkaner Schild (automatisch)★ 554× (100 %) · Stabilisieren 313× (100 %)
- **Elara (Kleriker):** Heiliges Licht 6959× (55 %) · Heilendes Wort★ 1721× (100 %) · Heiltrank trinken 1248× (100 %) · Segen★ 948× (100 %) · Stabilisieren 384× (100 %) · Streitkolben 159× (62 %)

★ = Spezialfähigkeit
</details>

## Die Krone unter dem Eis

10 Kampfszenen · 4000 Kämpfe · Sieg gesamt 85.2 %

**Gruppengröße:** 3 Helden: 1000 Kämpfe, Sieg 84 % · 4 Helden: 1000 Kämpfe, Sieg 85 % · 5 Helden: 1000 Kämpfe, Sieg 86 % · 6 Helden: 1000 Kämpfe, Sieg 86 %

**Klasse in der Gruppe:** Krieger mit 87 % / ohne 80 % · Zauberer mit 85 % / ohne 85 % · Schurke mit 85 % / ohne 85 % · Kleriker mit 85 % / ohne 86 % · Waldläufer mit 84 % / ohne 88 %

**Zuordnung des Gegnerschadens:** 98 % direkt im Zug eines Helden · 2 % im Zug der Gegner (Reaktionen, Flächen, Nachwirkungen – nicht einem Helden zugeordnet) · 0 % durch Begleiter.

| # | Held | Kämpfe | Ø Gruppe | Sieg (95 %) | Δ ohne | Steht | Nie 0 | Schaden aus | Schaden ein | Heilung | Auf | Unterst. | Kontr. | Aktionen (Wirkung) | Reakt. | Spezial (Wirkung) | Spezial sinnvoll |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Ragnar (Krieger) | 1208 | 4.7 | 89.2 % (87–91) | +5.8 | 77 % | 70 % | 32.4 | 15.3 | 0.7 (+8.1) | 0.68 | 0.0 | 2.1 | 10.7 (100 %) | 0.0 | 2.2 (100 %) | 100 % |
| 2 | Lyra (Zauberer) | 1229 | 4.8 | 87.1 % (85–89) | +2.8 | 78 % | 67 % | 31.1 | 7.5 | 0.1 (+3.9) | 0.14 | 0.0 | 1.2 | 13.1 (84 %) | 3.1 | 3.1 (100 %) | 92 % |
| 3 | Isolde (Krieger) | 1236 | 4.8 | 87.1 % (85–89) | +2.8 | 77 % | 66 % | 32.9 | 18.8 | 0.7 (+11.9) | 0.75 | 0.0 | 2.3 | 11.0 (90 %) | 2.3 | 2.7 (100 %) | 94 % |
| 4 | Torvald (Krieger) | 1216 | 4.8 | 87.0 % (85–89) | +2.6 | 75 % | 57 % | 19.7 | 18.3 | 0.5 (+12.6) | 0.55 | 0.0 | 3.0 | 10.6 (85 %) | 3.9 | 2.2 (100 %) | 98 % |
| 5 | Silra (Schurke) | 1151 | 4.8 | 86.5 % (84–88) | +1.9 | 77 % | 66 % | 48.9 | 7.5 | 0.2 (+4.3) | 0.18 | 0.0 | 2.9 | 11.8 (72 %) | 0.6 | 1.3 (79 %) | 78 % |
| 6 | Brogar (Kleriker) | 1147 | 4.8 | 86.4 % (84–88) | +1.7 | 77 % | 67 % | 20.5 | 8.9 | 12.4 (+6.2) | 1.11 | 0.9 | 2.4 | 10.3 (78 %) | 0.0 | 3.5 (100 %) | 98 % |
| 7 | Darian (Schurke) | 1226 | 4.8 | 85.6 % (83–87) | +0.6 | 69 % | 47 % | 37.3 | 14.2 | 0.4 (+8.5) | 0.40 | 0.0 | 0.7 | 8.2 (91 %) | 0.0 | 1.2 (100 %) | 76 % |
| 8 | Morwen (Zauberer) | 1137 | 4.9 | 85.0 % (83–87) | −0.3 | 80 % | 73 % | 18.0 | 6.6 | 0.3 (+5.1) | 0.26 | 0.0 | 4.8 | 8.9 (73 %) | 0.4 | 3.2 (80 %) | 94 % |
| 9 | Faye (Waldläufer) | 1195 | 4.8 | 84.5 % (82–86) | −0.9 | 62 % | 40 % | 28.5 | 16.2 | 0.4 (+7.7) | 0.36 | 0.0 | 3.0 | 10.1 (80 %) | 0.0 | 3.0 (78 %) | 94 % |
| 10 | Seran (Kleriker) | 1261 | 4.8 | 84.4 % (82–86) | −1.2 | 69 % | 46 % | 20.5 | 12.7 | 5.9 (+7.2) | 1.01 | 0.0 | 1.2 | 9.6 (83 %) | 0.0 | 3.2 (91 %) | 100 % |
| 11 | Vex (Schurke) | 1212 | 4.7 | 84.2 % (82–86) | −1.3 | 69 % | 48 % | 32.9 | 14.5 | 0.4 (+7.6) | 0.40 | 0.0 | 1.5 | 8.8 (89 %) | 0.0 | 1.4 (100 %) | 97 % |
| 12 | Vaelin (Zauberer) | 1131 | 4.8 | 84.1 % (82–86) | −1.5 | 76 % | 66 % | 53.2 | 8.0 | 0.2 (+5.6) | 0.22 | 0.0 | 1.5 | 7.5 (85 %) | 0.4 | 3.1 (100 %) | 100 % |
| 13 | Orin (Waldläufer) | 1210 | 4.7 | 83.9 % (82–86) | −1.9 | 78 % | 72 % | 37.4 | 8.9 | 0.2 (+6.1) | 0.24 | 0.0 | 2.0 | 8.9 (70 %) | 1.1 | 2.1 (57 %) | 68 % |
| 14 | Kael (Waldläufer) | 1219 | 4.8 | 83.7 % (81–86) | −2.2 | 76 % | 68 % | 41.8 | 9.6 | 0.3 (+6.1) | 0.34 | 0.0 | 3.9 | 10.3 (79 %) | 0.0 | 5.2 (78 %) | 99 % |
| 15 | Elara (Kleriker) | 1222 | 4.8 | 83.0 % (81–85) | −3.2 | 77 % | 68 % | 22.4 | 7.9 | 8.0 (+5.5) | 0.96 | 3.5 | 0.2 | 9.9 (77 %) | 0.0 | 2.6 (99 %) | 97 % |

<details><summary>Fähigkeiten je Held (Einsätze gesamt · Anteil mit Wirkung)</summary>

- **Ragnar (Krieger):** Großaxt, rücksichtslos 5242× (99 %) · Heiltrank trinken 2103× (100 %) · Raserei★ 1202× (100 %) · Spurt 1035× (100 %) · Ziel bedienen 1011× (100 %) · Zweiter Atem★ 872× (100 %) · Stabilisieren 823× (100 %) · Tatendrang★ 575× (100 %) · Großaxt 104× (93 %)
- **Lyra (Zauberer):** Analyse 7207× (91 %) · Arkaner Funke 7206× (73 %) · Schutzglyphe (automatisch)★ 2495× (100 %) · Gedankenstütze (automatisch)★ 927× (100 %) · Heiltrank trinken 819× (100 %) · Ziel bedienen 661× (100 %) · Arkaner Schild (automatisch)★ 350× (100 %) · Stabilisieren 175× (100 %) · Zeitriss★ 36× (64 %)
- **Isolde (Krieger):** Rapier 5742× (77 %) · Finte★ 1812× (100 %) · Heiltrank trinken 1542× (100 %) · Ziel bedienen 1113× (100 %) · Spurt 1027× (100 %) · Stabilisieren 925× (100 %) · Zweiter Atem★ 864× (100 %) · Tatendrang★ 602× (100 %)
- **Torvald (Krieger):** Langschwert 5915× (66 %) · Heiltrank trinken 1591× (100 %) · Spott★ 1136× (100 %) · Spurt 1047× (100 %) · Ziel bedienen 1035× (100 %) · Zweiter Atem★ 893× (100 %) · Stabilisieren 667× (100 %) · Tatendrang★ 594× (100 %)
- **Silra (Schurke):** Dolch 6114× (69 %) · Zweiter Dolch 4555× (65 %) · Heiltrank trinken 858× (100 %) · Schmutziger Trick★ 767× (60 %) · Glückspilz (automatisch)★ 707× (100 %) · Ziel bedienen 699× (100 %) · Verstecken 221× (100 %) · Stabilisieren 206× (100 %) · Rückzug 109× (100 %)
- **Brogar (Kleriker):** Dornenranke 6332× (60 %) · Schild des Glaubens★ 1545× (100 %) · Heilendes Wort★ 1442× (100 %) · Heiltrank trinken 696× (100 %) · Ziel bedienen 627× (100 %) · Bewahren★ 531× (100 %) · Lebenshauch★ 521× (100 %) · Stabilisieren 118× (100 %)
- **Darian (Schurke):** Kurzschwert 2677× (75 %) · Heiltrank trinken 1815× (100 %) · Schattenwirbel★ 1508× (100 %) · Ziel bedienen 1358× (100 %) · Verstecken 1223× (100 %) · Kurzbogen 806× (76 %) · Stabilisieren 495× (100 %) · Spurt 111× (100 %)
- **Morwen (Zauberer):** Schattenstich 4951× (59 %) · Furcht★ 2716× (73 %) · Heiltrank trinken 1012× (100 %) · Ziel bedienen 673× (100 %) · Arkaner Schild (automatisch)★ 505× (100 %) · Schattenschritt★ 411× (100 %) · Stabilisieren 300× (100 %) · Spiegelbilder★ 48× (100 %)
- **Faye (Waldläufer):** Kurzschwert 3627× (73 %) · Jägermal★ 2667× (85 %) · Heiltrank trinken 1530× (100 %) · Ziel bedienen 1152× (100 %) · Kurzbogen 872× (65 %) · Grau: Umreißen★ 864× (56 %) · Befehl an Grau 703× (59 %) · Stabilisieren 427× (100 %) · Spurt 171× (100 %)
- **Seran (Kleriker):** Kriegshammer 5172× (68 %) · Heilendes Wort★ 2160× (100 %) · Brandmal★ 1172× (100 %) · Heiltrank trinken 1111× (100 %) · Ziel bedienen 1048× (100 %) · Befehl: Flieh!★ 554× (44 %) · Spurt 421× (100 %) · Stabilisieren 392× (100 %) · Bannen★ 133× (59 %)
- **Vex (Schurke):** Klinge der Gilde 3626× (73 %) · Gift★ 1731× (100 %) · Heiltrank trinken 1638× (100 %) · Ziel bedienen 1249× (100 %) · Leichte Armbrust 1044× (77 %) · Aus dem Schatten 809× (100 %) · Stabilisieren 482× (100 %) · Spurt 104× (100 %)
- **Vaelin (Zauberer):** Glutpfeil 3428× (63 %) · Frosthauch★ 1259× (100 %) · Heiltrank trinken 1171× (100 %) · Magisches Geschoss★ 1012× (100 %) · Donnerwelle★ 777× (100 %) · Ziel bedienen 543× (100 %) · Arkaner Schild (automatisch)★ 482× (100 %) · Stabilisieren 252× (100 %)
- **Orin (Waldläufer):** Schwere Armbrust 5691× (63 %) · Netz★ 1417× (50 %) · Heiltrank trinken 1366× (100 %) · Jägermal★ 1180× (66 %) · Ziel bedienen 837× (100 %) · Stabilisieren 292× (100 %)
- **Kael (Waldläufer):** Langbogen 3775× (69 %) · Jägermal★ 3231× (81 %) · Fesselnder Pfeil★ 2033× (70 %) · Heiltrank trinken 1198× (100 %) · Doppelschuss★ 1059× (83 %) · Ziel bedienen 814× (100 %) · Stabilisieren 416× (100 %)
- **Elara (Kleriker):** Heiliges Licht 6979× (61 %) · Heilendes Wort★ 1922× (100 %) · Segen★ 1078× (100 %) · Heiltrank trinken 1001× (100 %) · Ziel bedienen 706× (100 %) · Stabilisieren 305× (100 %) · Untote vertreiben★ 146× (86 %) · Streitkolben 1× (100 %)

★ = Spezialfähigkeit
</details>
