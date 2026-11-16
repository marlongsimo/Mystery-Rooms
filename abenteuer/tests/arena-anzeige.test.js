/*
 * Mythara – Anzeige im Kampf, vier Dinge:
 *   1. Arena über den Server: Würfel und Meldungen erscheinen auch, wenn der Server die Chronik vorn kürzt (lange Kämpfe).
 *   2. Figuren antippen: Infokarte mit Leben, Rüstung und den Effekten, die auf die Figur wirken (eigene Helden und gegnerische).
 *   3. Blutung: Ein Blutstropfen erscheint, wenn die Wunde Schaden macht.
 *   4. Musik: Beim Ortswechsel läuft nur ein Stück – auch auf Geräten, die die Lautstärke nicht stellen lassen (?lautfest).
 * Aufruf: node abenteuer/tests/arena-anzeige.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright");
const BASIS = "http://localhost:8765/abenteuer/index.html?testlauf";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
(async () => {
  const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  console.log("Anzeige im Kampf");
  // ---------- 1. gekürzte Chronik ----------
  { const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message));
    await p.goto(BASIS); await p.click("#my-gast-start"); await p.waitForSelector(".dorf-ort");
    // Ein Arena-Kampf läuft „auf dem Server“ (hier: in der Seite gerechnet); das Spiel bekommt nur Sichten mit den letzten 12 Zeilen der Chronik
    const r = await p.evaluate(async () => { const R = window.AB.R, GRENZE = 12, warte = (ms) => new Promise((x) => setTimeout(x, ms));
      window.ABF.STUFEN10.aktiv = true;
      const voll = R.neueArena(4711, { modus: "duell", teams: [["berserker", "duellant", "schildwaechter"], ["berserker", "duellant", "schildwaechter"]].map((t) => t.map((fid) => ({ fid, stufe: 3 }))), namen: ["Anna", "Ben"], karte: R.KARTE_GARTEN, begegnung: "garten", bedrohung: 0 });
      const sicht = () => { const j = R.speichern(voll); delete j.rs; j.log = j.log.slice(-GRENZE); j.arena = Object.assign({}, j.arena, { jetzt: Date.now() }); return j; };
      window.AB.arenaStart({ st: null, seite: 1, gast: true, server: true, sende() {}, ende() {} }); window.AB.arenaStand(sicht()); await warte(300);
      const wurfEl = document.querySelector("#wurf"); let wuerfe = 0, gezeigt = 0, spaet = 0, spaetGezeigt = 0, gekuerzt = false, schritte = 0;
      for (let i = 0; i < 400 && !voll.ende && schritte < 90; i++) {
        const a = R.aktiv(voll), vorLog = voll.log.length;
        // ziehen wie ein einfacher Spieler: angreifen, wenn möglich, sonst heranlaufen, sonst Zug beenden
        let getan = false;
        if (voll.zug.aktion) for (const x of R.aktionenVon(a, voll)) { if (x.art !== "angriff" || R.grund(voll, x.id)) continue; const z = R.ziele(voll, x.id)[0]; if (z) { R.handeln(voll, x.id, z.id); getan = true; break; } }
        if (!getan && voll.zug.bewegung > 0 && voll.zug.aktion) { const g = voll.figuren.filter((f) => f.seite !== a.seite && f.tp > 0); let best = null;
          for (const k of R.bewegungsfelder(voll, a).keys()) { const [x, y] = k.split(",").map(Number), d = Math.min(...g.map((f) => R.abstand(f, { x, y }))); if (!best || d < best.d) best = { x, y, d }; }
          if (best && !(best.x === a.x && best.y === a.y)) { R.bewegen(voll, best.x, best.y); getan = true; } }
        if (!getan) R.zugEnde(voll);
        const neu = voll.log.slice(vorLog), wurf = neu.some((l) => l.wurf && (l.art === "wurf" || l.art === "gegner"));
        const istGekuerzt = voll.log.length > GRENZE; gekuerzt = gekuerzt || istGekuerzt;
        wurfEl.classList.remove("an"); wurfEl.innerHTML = "";
        window.AB.arenaStand(sicht()); schritte++; await warte(wurf ? 760 : 60);
        if (wurf) { wuerfe++; const da = wurfEl.classList.contains("an") && wurfEl.innerHTML.length > 20; if (da) gezeigt++; if (istGekuerzt && voll.log.length > GRENZE * 4) { spaet++; if (da) spaetGezeigt++; } }
      }
      return { wuerfe, gezeigt, spaet, spaetGezeigt, gekuerzt, zeilen: voll.log.length, runde: voll.runde }; });
    check(r.gekuerzt && r.zeilen > 48 && r.spaet >= 5, `Langer Kampf: Die Chronik hat ${r.zeilen} Zeilen, das Spiel bekommt nur die letzten 12 (Runde ${r.runde}, ${r.wuerfe} Würfe)`);
    check(r.gezeigt === r.wuerfe, `Jeder Wurf erscheint auf dem Bildschirm (${r.gezeigt} von ${r.wuerfe})`);
    check(r.spaetGezeigt === r.spaet, `… auch lange nach der Kürzung (${r.spaetGezeigt} von ${r.spaet} späten Würfen)`);
    check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : "")); }
  // ---------- 2. und 3. Figuren-Info und Blutung ----------
  { const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message));
    await p.goto(BASIS); await p.click("#my-gast-start"); await p.waitForSelector(".dorf-ort");
    await p.evaluate(() => { const D = window.ABD_ALLE.weidenhain, K = Object.values(D.KARTEN); window.ABF.STUFEN10.aktiv = true;
      window.AB.kampfStarten({ figuren: ["schildwaechter", "lichtbringer", "elementarist"], stufenListe: [5, 5, 5], karte: K[K.length - 1], begegnung: "w_unke", gegner: window.AB.R.gegnerFuer("w_unke", 3, null, 1, false, 0) }, () => {}); });
    await p.waitForSelector("#karte .fig");
    for (let i = 0; i < 40; i++) { if (await p.evaluate(() => { const a = window.AB.R.aktiv(window.AB.st); return a.seite === "spieler" && Boolean(document.querySelector("#ende-zug")); })) break; await p.waitForTimeout(400); }
    // ein Verbündeter bekommt Effekte; dann sein Feld antippen
    const h = await p.evaluate(() => { const st = window.AB.st, a = window.AB.R.aktiv(st), f = st.figuren.find((x) => x.seite === "spieler" && x !== a && x.tp > 0); f.z.blutung = { rest: 2, w: "1W4", von: "Test" }; f.z.verlangsamt = 2; f.z.segen = a.id; return { id: f.id, x: f.x, y: f.y, name: f.name, eigX: a.x, eigY: a.y, eig: a.name }; });
    await p.click(`#karte .feld[data-x="${h.x}"][data-y="${h.y}"]`, { force: true });
    let info = await p.evaluate(() => { const e = document.querySelector("#gegner-info"); return { da: !e.hidden, text: e.textContent.replace(/\s+/g, " "), eff: [...e.querySelectorAll(".gi-eff li b")].map((x) => x.textContent) }; });
    check(info.da && info.text.includes(h.name) && /Held · Stufe 5/.test(info.text) && /Rüstungsklasse/.test(info.text), `Verbündeten antippen: Infokarte von ${h.name} mit Leben und Rüstungsklasse`);
    check(["blutet", "verlangsamt", "gesegnet"].every((x) => info.eff.includes(x)) && /noch 2/.test(info.text) && /verliert zu Beginn des eigenen Zugs Leben/.test(info.text), `Die Karte nennt die Effekte mit Erklärung: ${info.eff.join(", ")}`);
    await p.click(`#karte .feld[data-x="${h.x}"][data-y="${h.y}"]`, { force: true });
    check(await p.evaluate(() => document.querySelector("#gegner-info").hidden), "Noch einmal antippen schließt die Karte");
    await p.click(`#karte .feld[data-x="${h.eigX}"][data-y="${h.eigY}"]`, { force: true });
    info = await p.evaluate(() => { const e = document.querySelector("#gegner-info"); return { da: !e.hidden, text: e.textContent.replace(/\s+/g, " ") }; });
    check(info.da && info.text.includes(h.eig) && /Keine Effekte aktiv/.test(info.text), "Den eigenen Helden antippen: Karte, ohne Effekte steht „Keine Effekte aktiv“");
    await p.click("#gi-zu");
    const g = await p.evaluate(() => { const st = window.AB.st, f = st.figuren.find((x) => x.seite === "gegner" && x.tp > 0); f.z.blutung = { rest: 3, w: "1W4", von: "Test" }; return { x: f.x, y: f.y, name: f.name }; });
    await p.click(`#karte .feld[data-x="${g.x}"][data-y="${g.y}"]`, { force: true });
    check(await p.evaluate((n) => { const e = document.querySelector("#gegner-info"); return !e.hidden && e.textContent.includes(n) && /blutet/.test(e.textContent); }, g.name), "Gegner antippen: wie bisher, mit „blutet“");
    await p.click("#gi-zu");
    // Blutung: Der blutende Verbündete kommt an die Reihe → Schaden und Tropfen
    let tropfen = false, schaden = false;
    for (let i = 0; i < 60 && !tropfen; i++) { await p.evaluate(() => { const e = document.querySelector("#ende-zug"); if (e && !e.disabled) e.click(); });
      for (let j = 0; j < 8 && !tropfen; j++) { await p.waitForTimeout(120); tropfen = await p.evaluate(() => Boolean(document.querySelector(".fx-schild.blut"))); }
      schaden = await p.evaluate(() => window.AB.st.log.some((l) => /blutet: \d+ Schaden/.test(l.t))); if (schaden && !tropfen) { await p.waitForTimeout(300); tropfen = await p.evaluate(() => Boolean(document.querySelector(".fx-schild.blut"))); if (!tropfen) break; } }
    check(schaden && tropfen, "Blutung macht Schaden: Ein Blutstropfen erscheint an der Figur");
    if (tropfen && process.env.SHOT_DIR) await (await p.$(".karte-wrap")).screenshot({ path: process.env.SHOT_DIR + "/blut.png" });
    check(await p.evaluate(async () => { const r = await fetch("img/fx/blut.webp"); return r.ok && Number(r.headers.get("content-length")) > 2000; }), "Das Bild des Tropfens ist da");
    check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : "")); }
  // ---------- 4. Musik ----------
  for (const [zusatz, name] of [["", "Gerät mit stellbarer Lautstärke"], ["&lautfest", "Gerät ohne stellbare Lautstärke (wie iPhone)"]]) {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await p.goto(BASIS + zusatz); await p.click("#my-gast-start"); await p.waitForSelector(".dorf-ort"); await p.mouse.click(5, 5);
    await p.waitForFunction(() => { const s = window.ABMUSIK.spielt(); return s && /dorf/.test(s.src) && !s.pausiert; }, null, { timeout: 8000 }).catch(() => {});
    await p.evaluate(() => { const D = window.ABD_ALLE.weidenhain, K = Object.values(D.KARTEN); window.AB.kampfStarten({ figuren: ["schildwaechter", "lichtbringer", "elementarist"], karte: K[K.length - 1], begegnung: "w_unke", gegner: window.AB.R.gegnerFuer("w_unke", 3, null, 1, false, 0) }, () => {}); });
    await p.waitForFunction(() => { const s = window.ABMUSIK.spielt(); return s && /kampf/.test(s.src); }, null, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(zusatz ? 500 : 3200);
    const m = await p.evaluate(() => ({ s: window.ABMUSIK.spielt(), n: window.ABMUSIK.laufend(), fest: window.ABMUSIK.fest }));
    check(m.s && /kampf/.test(m.s.src) && m.n === 1 && m.fest === Boolean(zusatz), `${name}: Nach dem Wechsel Dorf → Kampf läuft genau ein Stück (${m.n})${zusatz ? " – ohne Überblendung, sofort" : ""}`);
    await p.close(); }
  await b.close();
  console.log(ok ? "\nANZEIGE IM KAMPF IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
