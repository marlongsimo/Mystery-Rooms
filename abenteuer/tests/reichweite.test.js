/*
 * Mythara – Reichweiten der Helden und ihre Anzeige auf der Karte.
 * Regeln: Bogen 7 Felder · Armbrust, Zauber, Heilung 5 · Dolch und Netz geworfen 3 · Nahkampf 1.
 * Anzeige: Ist eine Aktion gewählt, sind alle Felder in Reichweite (mit Sichtlinie) eingefärbt – Angriffe rötlich, Heilung und Hilfe grünlich.
 * Aufruf: node abenteuer/tests/reichweite.test.js   (Webserver auf Port 8765)
 */
const { chromium } = require("playwright"); const R = require("../js/regeln.js");
const BASIS = "http://localhost:8765/abenteuer/index.html?testlauf&schnell";
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
console.log("Reichweiten");
// Regeln: jede Fähigkeit jedes Helden
{ const F = R.FD, BOGEN = /^(kurzbogen|langbogen|fesselpfeil|pfeilregen|doppelschuss|jaegermal)$/, WURF = /^(dolch|zweiter_dolch|netz)$/, falsch = [], zahl = { 7: 0, 5: 0, 3: 0, 1: 0 };
  F.STUFEN10.aktiv = true;
  for (const fid of Object.keys(F.FIGUREN)) for (const stufe of [1, 10]) for (const a of F.faehigVon(fid, stufe)) {
    if (!a.reichweite || /^wolf_/.test(a.id)) continue;
    const nah = a.reichweite <= 2 && !WURF.test(a.id), soll = nah ? a.reichweite : BOGEN.test(a.id) ? 7 : WURF.test(a.id) ? (a.id === "netz" && stufe === 10 ? 5 : 3) : 5;
    if (a.reichweite !== soll) falsch.push(`${fid}/${a.id}: ${a.reichweite} statt ${soll}`); else zahl[soll > 2 ? soll : 1]++;
  }
  check(!falsch.length && zahl[7] > 0 && zahl[5] > 0 && zahl[3] > 0 && zahl[1] > 0, `Alle Fähigkeiten: Bogen 7, Armbrust/Zauber/Heilung 5, Dolch und Netz 3, Nahkampf 1` + (falsch.length ? " – " + falsch.join("; ") : ` (${zahl[7] / 2} mit 7, ${zahl[5] / 2} mit 5, ${zahl[3] / 2} mit 3 Feldern)`));
  check(Math.max(...Object.keys(F.FIGUREN).flatMap((fid) => F.faehigVon(fid, 10).filter((a) => a.reichweite && !/^wolf_/.test(a.id)).map((a) => a.reichweite))) === 7, "Nichts reicht weiter als 7 Felder"); }
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(), fehler = []; p.on("pageerror", (e) => fehler.push(e.message));
  await p.goto(BASIS); await p.click("#my-gast-start"); await p.waitForSelector(".dorf-ort");
  await p.evaluate(() => { const D = window.ABD_ALLE.weidenhain, K = Object.values(D.KARTEN); window.ABF.STUFEN10.aktiv = true;
    window.AB.kampfStarten({ figuren: ["wildnislaeufer", "elementarist", "trickser", "wanderheiler", "schildwaechter"], stufenListe: [5, 5, 5, 5, 5], karte: K[K.length - 1], begegnung: "w_unke", gegner: window.AB.R.gegnerFuer("w_unke", 5, null, 1, false, 0) }, () => {}); });
  await p.waitForSelector("#karte .fig");
  const gesehen = {};
  for (let i = 0; i < 60 && Object.keys(gesehen).length < 5; i++) {
    const wer = await p.evaluate(() => { const st = window.AB.st, a = window.AB.R.aktiv(st); return a.seite === "spieler" && a.tp > 0 && document.querySelector("#ende-zug") ? a.fid : null; });
    if (!wer) { await p.waitForTimeout(300); continue; }
    if (!gesehen[wer]) {
      // der Heiler braucht einen Verletzten, damit die Heilung wählbar ist
      await p.evaluate(() => { const st = window.AB.st, a = window.AB.R.aktiv(st); for (const f of st.figuren) if (f.seite === "spieler" && f !== a) f.tp = Math.max(1, Math.floor(f.tpMax / 2)); });
      const ids = await p.evaluate(() => [...document.querySelectorAll("#aktionen .akt")].map((x) => x.dataset.a));
      gesehen[wer] = [];
      for (const id of ids) {
        const d = await p.evaluate((id) => { const R = window.AB.R, a = R.aktiv(window.AB.st), h = R.findeAktion(a, id); return h && h.a.reichweite ? { weit: h.a.reichweite, art: h.a.art, name: h.a.name } : null; }, id);
        if (!d) continue;
        const knopf = await p.$(`#aktionen .akt[data-a="${id}"]:not([disabled])`); if (!knopf) continue;
        await knopf.click(); await p.waitForTimeout(120);
        if (!(await p.$("#aktionen .akt.gewaehlt"))) continue; // sofort ausgeführt (kein Ziel zu wählen)
        const r = await p.evaluate(() => { const R = window.AB.R, st = window.AB.st, a = R.aktiv(st), Z = 60, f = [...document.querySelectorAll("#karte .rw")].map((x) => ({ x: Math.round((+x.getAttribute("x") - 3) / Z), y: Math.round((+x.getAttribute("y") - 3) / Z), k: x.getAttribute("class"), farbe: x.getAttribute("fill") }));
          const ab = f.map((q) => Math.max(Math.abs(q.x - a.x), Math.abs(q.y - a.y)));
          return { ohneZiel: document.querySelector("#aktionen .akt.gewaehlt").classList.contains("ohne-ziel") && /Kein Ziel in Reichweite/.test(document.querySelector("#hinweis").textContent), n: f.length, max: ab.length ? Math.max(...ab) : 0, selbst: f.some((q) => q.x === a.x && q.y === a.y), block: f.some((q) => st.karte.block.has(q.x + "," + q.y)), klassen: [...new Set(f.map((q) => q.k))].join(","), farbe: f[0] && f[0].farbe, blau: document.querySelectorAll('#karte rect[fill="#4D9DB6"]').length,
            zieleDrin: R.ziele(st, document.querySelector("#aktionen .akt.gewaehlt").dataset.a).every((z) => z === a || f.some((q) => q.x === z.x && q.y === z.y)) }; });
        gesehen[wer].push(Object.assign({ id }, d, r));
        await p.evaluate(() => { const g = document.querySelector("#aktionen .akt.gewaehlt"); if (g) g.click(); }); await p.waitForTimeout(80); // Wahl aufheben
      }
    }
    await p.evaluate(() => { const e = document.querySelector("#ende-zug"); if (e && !e.disabled) e.click(); }); await p.waitForTimeout(250);
  }
  const alle = Object.values(gesehen).flat(), hilfe = /^(heilung|aufrichten|schild|tausch|segen|bewahren|massenheil|selbstheilung)$/;
  check(Object.keys(gesehen).length === 5 && alle.length >= 10, `Fünf Helden, ${alle.length} Aktionen mit Reichweite durchgeklickt`);
  check(alle.every((a) => a.n > 0 && a.max <= a.weit && !a.selbst && !a.block), "Gewählte Aktion: Felder in Reichweite sind eingefärbt – keines weiter weg als die Reichweite, keines auf Hindernissen oder dem eigenen Feld");
  { const bogen = alle.find((a) => a.id === "langbogen"), zauber = alle.find((a) => a.id === "glutpfeil"), dolch = alle.find((a) => a.id === "dolch");
    check(bogen && bogen.max === 7 && zauber && zauber.max === 5 && dolch && dolch.max === 3, `Die Markierung reicht bis zur Reichweite: Langbogen ${bogen && bogen.max}, Glutpfeil ${zauber && zauber.max}, Dolch ${dolch && dolch.max} Felder (am Kartenrand und hinter Hindernissen entsprechend weniger)`);
    const ohne = alle.filter((a) => a.ohneZiel);
    check(ohne.length > 0 && ohne.every((a) => a.n > 0), `Aktionen ohne Ziel in Reichweite bleiben wählbar und zeigen ihre Reichweite (${[...new Set(ohne.map((a) => a.name))].join(", ")})`); }
  check(alle.filter((a) => a.weit === 1).every((a) => a.n <= 8) && alle.some((a) => a.weit === 1), "Nahkampf: nur die Felder direkt um den Helden");
  const rot = alle.filter((a) => !hilfe.test(a.art)), gruen = alle.filter((a) => hilfe.test(a.art));
  check(rot.length > 0 && rot.every((a) => a.klassen === "rw angriff" && a.farbe === "#d9534f"), `Angriffe und Zauber rötlich (${rot.length})`);
  check(gruen.length > 0 && gruen.every((a) => a.klassen === "rw hilfe" && a.farbe === "#4caf6a"), `Heilung und Hilfe grünlich (${gruen.map((a) => a.name).join(", ")})`);
  check(alle.every((a) => a.blau === 0 && a.zieleDrin), "Solange eine Aktion gewählt ist, sind die blauen Lauffelder weg; alle erlaubten Ziele stehen auf eingefärbten Feldern");
  check(await p.evaluate(() => document.querySelectorAll("#karte .rw").length === 0), "Ohne gewählte Aktion: keine Reichweiten-Markierung");
  if (process.env.SHOT_DIR) { for (const [fid, id, n] of [["wildnislaeufer", "langbogen", "bogen"], ["wanderheiler", "heilendes_wort", "heilung"]]) {
      for (let i = 0; i < 40; i++) { const w = await p.evaluate(() => { const a = window.AB.R.aktiv(window.AB.st); return a.seite === "spieler" && document.querySelector("#ende-zug") ? a.fid : null; }); if (w === fid) break; if (w) await p.evaluate(() => { const e = document.querySelector("#ende-zug"); if (e && !e.disabled) e.click(); }); await p.waitForTimeout(300); }
      await p.evaluate(() => { for (const f of window.AB.st.figuren) if (f.seite === "spieler") f.tp = Math.max(1, Math.floor(f.tpMax / 2)); });
      const k = await p.$(`#aktionen .akt[data-a="${id}"]:not([disabled])`); if (k) { await k.click(); await p.waitForTimeout(200); await (await p.$(".karte-wrap")).screenshot({ path: `${process.env.SHOT_DIR}/reichweite-${n}.png` }); await p.evaluate(() => { const g = document.querySelector("#aktionen .akt.gewaehlt"); if (g) g.click(); }); } } }
  check(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
  await b.close();
  console.log(ok ? "\nREICHWEITEN IN ORDNUNG" : "\nFEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
