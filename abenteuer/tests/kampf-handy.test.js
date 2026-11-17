/*
 * Mythara – Kampf am Handy (js/kampf-handy.js): Bedienleiste, vergrößerte Karte, Verschieben, Zwei-Finger-Zoom.
 * Solo-Kampf in Handygröße; dazu: am großen Bildschirm und mit ?handy=alt bleibt die bisherige Ansicht.
 * Aufruf: node abenteuer/tests/kampf-handy.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright");
const BASIS = "http://localhost:8765/abenteuer/index.html?testlauf";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
async function kampf(b, vp, zusatz, handy) {
  const p = await (await b.newContext({ viewport: vp, isMobile: Boolean(handy), hasTouch: Boolean(handy) })).newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message));
  await p.goto(BASIS + (zusatz || "")); await p.click("#my-gast-start"); await p.waitForSelector(".dorf-ort");
  await p.evaluate(() => { const D = window.ABD_ALLE.weidenhain, K = Object.values(D.KARTEN); window.ABF.STUFEN10.aktiv = true;
    window.AB.kampfStarten({ figuren: ["elementarist", "schildwaechter", "lichtbringer"], stufenListe: [10, 5, 5], karte: K[K.length - 1], begegnung: "w_unke", gegner: window.AB.R.gegnerFuer("w_unke", 3, null, 1, false, 0) }, () => {}); });
  await p.waitForSelector("#karte .fig"); return { p, fehler };
}
const meinZug = async (p) => { for (let i = 0; i < 60; i++) { if (await p.evaluate(() => { const st = window.AB.st, a = window.AB.R.aktiv(st); return a.seite === "spieler" && a.tp > 0 && Boolean(document.querySelector("#ende-zug")); })) return true; await p.waitForTimeout(400); } return false; };
(async () => {
  const b = await chromium.launch();
  console.log("Kampf am Handy");
  const { p, fehler } = await kampf(b, { width: 390, height: 844 }, "", true);
  await meinZug(p); await p.waitForTimeout(2600);
  const m = await p.evaluate(() => { const q = (s) => document.querySelector(s), f = q("#karte .feld").getBoundingClientRect(), w = q(".karte-wrap").getBoundingClientRect(), kh = q("#kh").getBoundingClientRect(), a = window.AB.R.aktiv(window.AB.st), fg = q(`#karte .fig[data-id="${a.id}"]`).getBoundingClientRect();
    const zu = (s) => { const e = q(s); return !e || getComputedStyle(e).display === "none"; };
    return { an: document.body.classList.contains("kh-an"), feld: Math.round(f.width), seite: document.documentElement.scrollHeight, fenster: innerHeight, karteH: Math.round(w.height), leisteUnten: Math.round(kh.bottom), kacheln: document.querySelectorAll(".kh-k").length, origKnoepfe: document.querySelectorAll("#aktionen .akt").length,
      alt: zu("#aktionen") && zu("#aktiv") && zu("header.top"), figurImBild: (() => { const cx = fg.left + fg.width / 2, cy = fg.top + fg.height / 2; return cx > w.left + 10 && cx < w.right - 10 && cy > w.top + 10 && cy < w.bottom - 10; })(), name: q(".kh-wer b").textContent, akt: a.name, pips: q(".kh-pips").textContent,
      rasterH: q(".kh-raster").clientHeight, rasterVoll: q(".kh-raster").scrollHeight }; });
  check(m.an && m.alt, "Handy, Solo-Kampf: Die neue Bedienleiste ist an, die lange Liste und die Kopfzeile sind weg");
  check(m.seite <= m.fenster && m.leisteUnten === m.fenster, `Kein Scrollen: Seite ${m.seite}px bei ${m.fenster}px Bildschirm, die Leiste sitzt am unteren Rand`);
  check(m.feld >= 44, `Felder sind fingerbreit (${m.feld}px; ohne die Steuerung waren es 29px)`);
  check(m.karteH >= 300, `Die Karte bekommt den Platz (${m.karteH}px hoch)`);
  check(m.figurImBild && m.name === m.akt, "Die Karte zeigt die Figur am Zug; die Leiste nennt sie (" + m.name + ")");
  check(m.kacheln === m.origKnoepfe && m.kacheln >= 6 && /👣/.test(m.pips) && /Aktion/.test(m.pips) && /Bonus/.test(m.pips), `Alle ${m.kacheln} Aktionen als Kacheln; Bewegung, Aktion und Bonusaktion auf einen Blick`);
  check(m.rasterH <= 156 && (m.kacheln <= 8 || m.rasterVoll > m.rasterH), `Viele Aktionen (${m.kacheln}): Das Raster bleibt gut zwei Reihen hoch${m.kacheln > 8 ? " und lässt sich hochschieben" : ""}`);
  // Zauberplätze: bei Zauberkundigen neben dem Namen, bei anderen nicht
  { const pl = await p.evaluate(() => { const R = window.AB.R, st = window.AB.st, a = R.aktiv(st), e = document.querySelector(".kh-plaetze"), max = (a.plaetzeMax || [0, 0]), da = max[0] + max[1] > 0;
      return { da, name: a.name, text: e ? [...e.querySelectorAll("u")].map((x) => x.textContent).join("") : null, soll: da ? "●".repeat(a.plaetze[0]) + "○".repeat(max[0] - a.plaetze[0]) + (max[1] ? "◆".repeat(a.plaetze[1]) + "◇".repeat(max[1] - a.plaetze[1]) : "") : null, label: e ? e.getAttribute("aria-label") : "", breit: document.querySelector(".kh-kopf").scrollWidth <= innerWidth }; });
    check(pl.da ? pl.text === pl.soll && /Grad 1 noch \d+ von \d+/.test(pl.label) && pl.breit : pl.text === null, pl.da ? `Zauberplätze von ${pl.name} stehen neben dem Namen (${pl.text})` : `${pl.name} hat keine Zauberplätze: nichts angezeigt`);
    // ein Platz verbraucht → ein hohler Kreis (danach zurückgestellt)
    if (pl.da) { const t = await p.evaluate(() => { const a = window.AB.R.aktiv(window.AB.st), v = a.plaetze[0]; if (v < 1) return "leer"; a.plaetze[0] = v - 1; window.ABKH.bauen(); const x = document.querySelector(".kh-plaetze u").textContent; a.plaetze[0] = v; window.ABKH.bauen(); return x; });
      check(t === "leer" || /○/.test(t), "Ein verbrauchter Platz erscheint hohl (" + t + ")"); } }
  // Kacheln: Zauber, die einen Platz kosten, tragen die Marke – alle anderen nicht
  { const k = await p.evaluate(() => { const R = window.AB.R, st = window.AB.st, a = R.aktiv(st); return [...document.querySelectorAll(".kh-k")].map((x) => { const h = R.findeAktion(a, x.dataset.kh), m = x.querySelector(".kh-platz"); return { name: h ? h.a.name : x.dataset.kh, soll: h ? (h.a.platz || 0) : 0, ist: m ? (m.classList.contains("g2") ? 2 : 1) : 0 }; }); });
    const mit = k.filter((x) => x.ist);
    check(k.every((x) => x.ist === x.soll || (x.soll && !x.ist)) && mit.every((x) => x.soll === x.ist), mit.length ? `Kacheln mit Platzkosten sind markiert: ${mit.map((x) => x.name + (x.ist === 2 ? " ◆" : " ●")).join(", ")}` : "Dieser Held hat keine Zauber mit Platzkosten: keine Marke"); }
  // gesperrte Kachel erklärt sich
  const aus = await p.evaluate(() => { const k = document.querySelector(".kh-k.aus"); return k ? k.dataset.kh : null; });
  if (aus) { await p.tap(`.kh-k[data-kh="${aus}"]`); await p.waitForTimeout(250);
    check(await p.evaluate(() => { const i = document.querySelector(".kh-info"); return i.classList.contains("aus") && i.textContent.length > 20 && !document.querySelector("#aktionen .akt.gewaehlt"); }), "Graue Kachel antippen: Die Leiste sagt, warum es gerade nicht geht – ausgelöst wird nichts"); }
  // Aktion wählen und abbrechen
  // eine Aktion, die ein Ziel braucht (nicht jeder Held hat zu Beginn eines in Reichweite: sonst Zug beenden und den nächsten nehmen)
  const mitZiel = () => p.evaluate(() => { const R = window.AB.R, st = window.AB.st; return [...document.querySelectorAll(".kh-k:not(.aus)")].map((x) => x.dataset.kh).find((id) => R.ziele(st, id).some((z) => z.seite === "gegner")) || null; });
  let frei = await mitZiel();
  for (let i = 0; i < 6 && !frei; i++) { await p.tap("#kh-ende"); await p.waitForTimeout(600); await meinZug(p); await p.waitForTimeout(2600); frei = await mitZiel(); }
  await p.evaluate((id) => document.querySelector(`.kh-k[data-kh="${id}"]`).scrollIntoView({ block: "nearest" }), frei); await p.tap(`.kh-k[data-kh="${frei}"]`); await p.waitForTimeout(400);
  check(await p.evaluate(() => Boolean(document.querySelector(".kh-k.an")) && Boolean(document.querySelector("#aktionen .akt.gewaehlt")) && /leuchtendes Ziel/.test(document.querySelector(".kh-info").textContent) && Boolean(document.querySelector("#kh-ab"))),
    "Kachel antippen: Aktion gewählt, Erklärung und „Abbrechen“ stehen direkt darüber");
  await p.tap("#kh-ab"); await p.waitForTimeout(300);
  check(await p.evaluate(() => !document.querySelector(".kh-k.an") && !document.querySelector("#aktionen .akt.gewaehlt")), "„Abbrechen“ hebt die Wahl auf");
  // Bewegen per Tipp
  const ziel = await p.evaluate(() => { const st = window.AB.st, R = window.AB.R, a = R.aktiv(st), w = document.querySelector(".karte-wrap").getBoundingClientRect();
    for (const key of [...R.bewegungsfelder(st, a).keys()]) { const [x, y] = key.split(",").map(Number); if (x === a.x && y === a.y) continue; const q = document.querySelector(`#karte .feld[data-x="${x}"][data-y="${y}"]`).getBoundingClientRect(), px = q.left + q.width / 2, py = q.top + q.height / 2;
      if (px > w.left + 12 && px < w.right - 12 && py > w.top + 12 && py < w.bottom - 12) return { id: a.id, x, y, px, py }; } return null; });
  await p.touchscreen.tap(ziel.px, ziel.py); await p.waitForTimeout(900);
  check(await p.evaluate((z) => { const fg = window.AB.R.fig(window.AB.st, z.id); return fg.x === z.x && fg.y === z.y; }, ziel), "Tipp auf ein blaues Feld in der vergrößerten Karte: Die Figur steht dort");
  // Verschieben löst nichts aus
  const lage = () => p.evaluate(() => { const a = window.AB.R.aktiv(window.AB.st); return { pos: a.x + "," + a.y, t: document.querySelector("#karte").style.transform }; });
  const mitte = await p.evaluate(() => { const r = document.querySelector(".karte-wrap").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const v1 = await lage(); await p.mouse.move(mitte.x, mitte.y); await p.mouse.down(); await p.mouse.move(mitte.x - 70, mitte.y - 30, { steps: 6 }); await p.mouse.move(mitte.x - 130, mitte.y - 40, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(250);
  const v2 = await lage();
  check(v1.t !== v2.t && v1.pos === v2.pos, "Karte mit dem Finger verschieben: Sie wandert, die Figur bleibt stehen (kein versehentlicher Zug)");
  // Zwei-Finger-Zoom (nachgestellt mit zwei Zeigern)
  const zoomVon = () => p.evaluate(() => Number((/scale\(([\d.]+)\)/.exec(document.querySelector("#karte").style.transform) || [])[1]));
  const kneifen = (von, bis) => p.evaluate(([von, bis]) => { const w = document.querySelector(".karte-wrap"), r = w.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const ev = (typ, id, x) => w.dispatchEvent(new PointerEvent(typ, { pointerId: id, pointerType: "touch", clientX: x, clientY: cy, bubbles: true }));
    ev("pointerdown", 11, cx - von); ev("pointerdown", 12, cx + von); for (let i = 1; i <= 6; i++) { const d = von + (bis - von) * i / 6; ev("pointermove", 11, cx - d); ev("pointermove", 12, cx + d); } ev("pointerup", 11, cx - bis); ev("pointerup", 12, cx + bis); }, [von, bis]);
  const z0 = await zoomVon(); await kneifen(60, 20); await p.waitForTimeout(150); const z1 = await zoomVon(); await kneifen(30, 110); await p.waitForTimeout(150); const z2 = await zoomVon(); await kneifen(40, 400); const z3 = await zoomVon();
  check(z1 < z0 && z1 >= 1 && z2 > z1 && z3 <= 2.61, `Zwei Finger: zusammenziehen verkleinert (${z0} → ${z1.toFixed(2)}), auseinanderziehen vergrößert (${z2.toFixed(2)}), begrenzt auf ${z3.toFixed(2)}`);
  check((await lage()).pos === v2.pos, "… und auch dabei wird kein Zug ausgelöst");
  // Hängender Finger: Ein Finger wird AUSSERHALB der Karte gehoben – danach muss ein einzelner Finger wieder verschieben (nicht zoomen) und Antippen wieder gehen
  { const erg = await p.evaluate(async () => { const w = document.querySelector(".karte-wrap"), r = w.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, k = document.querySelector("#karte");
      const zoom = () => Number((/scale\(([\d.]+)\)/.exec(k.style.transform) || [])[1]), trans = () => k.style.transform;
      const ev = (ziel, typ, id, x, y, prim) => ziel.dispatchEvent(new PointerEvent(typ, { pointerId: id, pointerType: "touch", isPrimary: prim, clientX: x, clientY: y, bubbles: true }));
      ev(w, "pointerdown", 21, cx - 40, cy, true); ev(w, "pointerdown", 22, cx + 40, cy, false); ev(w, "pointermove", 22, cx + 70, cy, false);   // zwei Finger
      ev(w, "pointerup", 22, cx + 70, cy, false); ev(document.body, "pointerup", 21, 5, 5, true);                                               // der erste wird außerhalb gehoben
      await new Promise((r2) => setTimeout(r2, 150)); const z0 = zoom(), t0 = trans();
      ev(w, "pointerdown", 23, cx, cy, true); for (let i = 1; i <= 5; i++) ev(w, "pointermove", 23, cx - i * 14, cy - i * 6, true); const z1 = zoom(), t1 = trans(); ev(w, "pointerup", 23, cx - 70, cy - 30, true);
      // Variante ohne jedes Loslassen (das Gerät verschluckt es): Der nächste erste Finger beginnt trotzdem neu
      ev(w, "pointerdown", 31, cx - 30, cy, true); ev(w, "pointerdown", 32, cx + 30, cy, false); await new Promise((r2) => setTimeout(r2, 50)); const z2 = zoom();
      ev(w, "pointerdown", 33, cx, cy, true); for (let i = 1; i <= 5; i++) ev(w, "pointermove", 33, cx + i * 12, cy, true); const z3 = zoom(); ev(w, "pointerup", 33, cx + 60, cy, true);
      await new Promise((r2) => setTimeout(r2, 200)); let geklickt = false; const h = () => { geklickt = true; }; k.addEventListener("click", h); w.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: cx, clientY: cy })); const fig = k.querySelector(".fig, rect, [data-x]") || k; fig.dispatchEvent(new MouseEvent("click", { bubbles: true })); k.removeEventListener("click", h);
      return { z0, z1, t0, t1, z2, z3, geklickt }; });
    check(Math.abs(erg.z1 - erg.z0) < 0.001 && erg.t1 !== erg.t0, `Finger außerhalb der Karte gehoben: Der nächste einzelne Finger verschiebt die Karte und zoomt nicht (Zoom ${erg.z0} → ${erg.z1})`);
    check(Math.abs(erg.z3 - erg.z2) < 0.001 && erg.geklickt, "Auch wenn das Loslassen ganz ausbleibt: ein neuer erster Finger verschiebt nur, und Antippen kommt danach wieder an"); }
  // Übersicht
  await p.waitForTimeout(150); await p.tap("#kh-zoom"); await p.waitForTimeout(400);
  const ueb = await p.evaluate(() => { const k = document.querySelector("#karte").getBoundingClientRect(), w = document.querySelector(".karte-wrap").getBoundingClientRect(); return k.width <= w.width + 1 && k.left >= w.left - 1; });
  check(ueb && Math.abs(await zoomVon() - 1) < 0.01, "Kartenknopf: zeigt die ganze Karte");
  await p.tap("#kh-zoom"); await p.waitForTimeout(400); check(Math.abs(await zoomVon() - 1.7) < 0.01, "… und noch einmal: wieder vergrößert");
  // Gegner antippen: Info schwebt über der Karte
  const geg = await p.evaluate(() => { const st = window.AB.st, g = st.figuren.find((f) => f.seite === "gegner" && f.tp > 0 && f.x >= 0); const m = document.querySelector(".karte-wrap").clientWidth / st.karte.b; return { id: g.id, name: g.name }; });
  await p.tap("#kh-zoom"); await p.waitForTimeout(350);
  const gp = await p.evaluate((id) => { const r = document.querySelector(`#karte .fig[data-id="${id}"]`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * .7 }; }, geg.id);
  await p.touchscreen.tap(gp.x, gp.y); await p.waitForTimeout(350);
  const gi = await p.evaluate(() => { const e = document.querySelector("#gegner-info"), k = document.querySelector("#kh").getBoundingClientRect(); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return { text: e.textContent.slice(0, 60), sichtbar: r.height > 20 && r.bottom <= k.top + 4 && r.top >= 0 }; });
  check(gi && gi.sichtbar, "Gegner antippen: Seine Werte erscheinen über der Karte, nicht unter der Leiste" + (gi ? " (" + gi.text.replace(/\s+/g, " ").trim() + ")" : ""));
  await p.touchscreen.tap(gp.x, gp.y); await p.waitForTimeout(250); await p.tap("#kh-zoom"); await p.waitForTimeout(300);
  // Chronik
  await p.tap("#kh-log"); await p.waitForTimeout(250);
  check(await p.evaluate(() => { const l = document.querySelector("#log"), r = l.getBoundingClientRect(); return getComputedStyle(l).display !== "none" && r.height > 100 && l.children.length > 0; }), "Chronik-Knopf: Die Chronik öffnet sich als Fenster");
  await p.touchscreen.tap(mitte.x, 20); await p.waitForTimeout(250);
  // Zug beenden; Leiste behält ihre Höhe, wenn der Gegner zieht
  const h1 = await p.evaluate(() => document.querySelector("#kh").offsetHeight), id1 = await p.evaluate(() => window.AB.R.aktiv(window.AB.st).id);
  await p.tap("#kh-ende"); await p.waitForTimeout(500);
  const danach = await p.evaluate(() => ({ id: window.AB.R.aktiv(window.AB.st).id, h: document.querySelector("#kh").offsetHeight, wartet: document.querySelector("#kh").classList.contains("wartet"), text: (document.querySelector(".kh-warten") || {}).textContent || "" }));
  check(danach.id !== id1, "„Zug beenden“ in der Leiste beendet den Zug");
  check(!danach.wartet || (danach.h >= h1 - 2 && /ist am Zug/.test(danach.text)), "Zieht ein Gegner, sagt die Leiste, wer dran ist, und behält ihre Höhe (die Karte springt nicht)");
  // Kampfende: Die Steuerung räumt das Feld, der Endbildschirm ist erreichbar
  await p.evaluate(() => { const st = window.AB.st; st.figuren.filter((f) => f.seite === "gegner").forEach((f) => { f.tp = 0; }); st.ende = "sieg"; window.AB.render(); });
  await p.waitForTimeout(1500);
  check(await p.evaluate(() => !document.body.classList.contains("kh-an") && !document.querySelector("#kh") && !document.querySelector("#ende").hidden && !/scale/.test(document.querySelector("#karte").style.transform || "")), "Kampfende: Die Leiste verschwindet, der Endbildschirm ist da");
  check(fehler.length === 0, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
  // Großer Bildschirm und Abschalten
  const G = await kampf(b, { width: 1280, height: 860 }, "", false); await meinZug(G.p); await G.p.waitForTimeout(800);
  check(await G.p.evaluate(() => !document.body.classList.contains("kh-an") && !document.querySelector("#kh") && getComputedStyle(document.querySelector("#aktionen")).display !== "none"), "Großer Bildschirm (Tisch, Laptop): alles wie bisher");
  const A = await kampf(b, { width: 390, height: 844 }, "&handy=alt", true); await meinZug(A.p); await A.p.waitForTimeout(800);
  check(await A.p.evaluate(() => !document.body.classList.contains("kh-an") && !document.querySelector("#kh")), "Handy mit ?handy=alt: die bisherige Ansicht");
  check(G.fehler.length === 0 && A.fehler.length === 0, "keine Skriptfehler in den Gegenproben");
  await b.close();
  console.log(ok ? "\nKAMPF-HANDY IN ORDNUNG" : "\nKAMPF-HANDY: FEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
