/*
 * Mythara – Arena, Serverkampf: die gebaute Edge Function in Node, mit nachgebildeter Datenbank (tests/arena-server-attrappe.js).
 * Prüft den Weg einer Anfrage: Anmeldung, Teilnahme, Startzeit, Zugrecht, gleichzeitige Aufrufe, Ergebnis.
 * Vorher bauen: node abenteuer/tools/arena-funktion-bauen.js   ·   Aufruf: node abenteuer/tests/arena-funktion.test.js
 */
const attrappe = require("./arena-server-attrappe.js"); const R = require("../js/regeln.js");
let ok = true; const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) ok = false; };
const ID = "00000000-0000-0000-0000-00000000c001";
const team = (h) => h.map((held) => ({ held, stufe: 3 }));
(async () => {
  console.log("Edge Function „arena“");
  const A = attrappe(); Object.assign(A.db.nutzer, { "tok-a": "nutzer-a", "tok-b": "nutzer-b", "tok-c": "nutzer-c" });
  const m = { host_team: team(["schildwaechter", "lichtbringer", "wildnislaeufer"]), guest_team: team(["berserker", "elementarist", "trickser"]) };
  A.kampf(ID, { match: Object.assign({ seed: 4713 }, m), beginn: Date.now() + 60000 }); A.db.kaempfe[ID].anf1 = 1; A.db.kaempfe[ID].anf2 = 2;
  // Zugang
  check((await A.ruf(null, { match: ID, aktion: "start" })).status === 401 && (await A.ruf("gefaelscht", { match: ID, aktion: "start" })).status === 401, "Ohne oder mit falschem Anmelde-Token: abgelehnt (401)");
  { const vor = JSON.stringify(A.db.kaempfe[ID]); const r1 = await A.ruf("tok-c", { match: ID, aktion: "start" }), r2 = await A.ruf("tok-c", { match: ID, aktion: "zug", zug: { typ: "ende" } });
    check(r1.status === 404 && r2.status === 404 && JSON.stringify(A.db.kaempfe[ID]) === vor && JSON.stringify(r1.o).length < 80, "Ein angemeldeter Dritter, der nicht teilnimmt: abgelehnt, erfährt nichts über den Kampf, nichts wird verändert"); }
  check((await A.ruf("tok-a", { match: "00000000-0000-0000-0000-00000000ffff", aktion: "start" })).status === 404 && (await A.ruf("tok-a", { aktion: "start" })).status === 400, "Unbekannter oder fehlender Kampf: abgelehnt");
  check((await A.ruf("tok-a", {}, "GET")).status === 405 && (await A.ruf(null, {}, "OPTIONS")).status === 200, "Nur POST; die Vorabfrage des Browsers (OPTIONS) wird beantwortet");
  // Start erst nach der Lesezeit
  const frueh = await A.ruf("tok-a", { match: ID, aktion: "start" });
  check(frueh.o.ok && frueh.o.wartet > 0 && A.db.kaempfe[ID].st === null, "Vor der Startzeit: Der Kampf beginnt noch nicht, die Antwort nennt die Wartezeit");
  A.db.kaempfe[ID].beginn = Date.now() - 1;
  const [s1, s2] = await Promise.all([A.ruf("tok-a", { match: ID, aktion: "start" }), A.ruf("tok-b", { match: ID, aktion: "start" })]);
  const k = A.db.kaempfe[ID];
  check(s1.o.ok && s2.o.ok && k.st && k.match.status === "laeuft" && k.schritte.filter((s) => s.v === 1).length === 1, "Beide rufen gleichzeitig „start“: Der Kampf entsteht genau einmal, Status „läuft“");
  const st0 = R.laden(k.st), k1 = st0.arena.koenig[1], k2 = st0.arena.koenig[2];
  check(A.sicht(ID, "nutzer-a", 0).schritte[0].st.arena.koenig[2] === null && A.sicht(ID, "nutzer-a", 0).schritte[0].st.arena.koenig[1] === k1 && A.sicht(ID, "nutzer-b", 0).schritte[0].st.arena.koenig[1] === null,
    "Königsmord: Jede Seite bekommt nur ihren eigenen Anführer zu sehen");
  check(st0.figuren.filter((f) => f.team === 1)[1].id === k1 && st0.figuren.filter((f) => f.team === 2)[2].id === k2, "Die vorab gewählten Anführer gelten");
  check(JSON.stringify(A.sicht(ID, "nutzer-a", 0)).indexOf('"rs"') < 0 && typeof k.st.rs === "number", "Der Zustand des Zufallsgenerators steht nur in der Datenbank, nie in einer Sicht");
  // Zugrecht
  const dran = () => { const st = R.laden(A.db.kaempfe[ID].st), a = R.aktiv(st), tm = R.teamVon(st, a); return { st, a, tm, tok: tm === 1 ? "tok-a" : "tok-b", andere: tm === 1 ? "tok-b" : "tok-a" }; };
  let d = dran(); const vVor = k.v;
  const falsch = await A.ruf(d.andere, { match: ID, aktion: "zug", zug: { typ: "ende" } });
  check(falsch.o.fehler && /nicht am Zug/.test(falsch.o.fehler) && k.v === vVor, "Zug der Seite, die nicht dran ist: abgelehnt, nichts gespeichert");
  const feld = [...R.bewegungsfelder(d.st, d.a).keys()].find((x) => x !== d.a.x + "," + d.a.y).split(",").map(Number);
  const zug = await A.ruf(d.tok, { match: ID, aktion: "zug", zug: { typ: "bewegen", x: feld[0], y: feld[1] } });
  const danach = R.laden(k.st), fig = R.fig(danach, d.a.id);
  check(zug.o.ok && zug.o.schritte.length >= 1 && zug.o.v === k.v && fig.x === feld[0] && fig.y === feld[1], "Erlaubter Zug: ausgeführt, gespeichert, die Antwort bringt die neuen Schritte in der eigenen Sicht");
  check((await A.ruf(d.tok, { match: ID, aktion: "zug", zug: { typ: "bewegen", x: 999, y: 0 } })).o.fehler && (await A.ruf(d.tok, { match: ID, aktion: "zug", zug: { typ: "aktion", aktion: "x".repeat(80) } })).o.fehler, "Unsinnige Züge: abgelehnt");
  // Zugzeit: vor Ablauf nichts, nach Ablauf endet der Zug – ausgelöst von der wartenden Seite
  const v2 = k.v; const zuFrueh = await A.ruf(d.andere, { match: ID, aktion: "zeit" });
  check(zuFrueh.o.ok && zuFrueh.o.schritte.length === 0 && k.v === v2, "„zeit“ vor Ablauf der Zugzeit: nichts passiert");
  k.st.arena.zugBis = Date.now() - 5; const spaet = await A.ruf(d.andere, { match: ID, aktion: "zeit" });
  check(spaet.o.ok && spaet.o.schritte.length >= 1 && R.aktiv(R.laden(k.st)).id !== d.a.id, "„zeit“ nach Ablauf: Der Zug des säumigen Helden endet, auch wenn die andere Seite es auslöst");
  // Gleichzeitige Züge: Nur einer kann auf demselben Stand rechnen
  d = dran(); const v3 = k.v;
  const [g1, g2] = await Promise.all([A.ruf(d.tok, { match: ID, aktion: "zug", zug: { typ: "ende" } }), A.ruf(d.tok, { match: ID, aktion: "zug", zug: { typ: "ende" } })]);
  const erfolg = [g1, g2].filter((g) => g.o.ok && g.o.schritte.length).length, vs = k.schritte.map((s) => s.v);
  check(erfolg >= 1 && new Set(vs).size === vs.length && vs.every((v, i) => i === 0 || v === vs[i - 1] + 1) && k.v > v3, "Zwei gleichzeitige Aufrufe: keine doppelten oder fehlenden Schritte");
  // Bis zum Ende spielen: Beide beenden nur ihre Züge → Punkte nach der letzten Runde
  let n = 0; while (A.db.kaempfe[ID].match.status === "laeuft" && n++ < 400) { d = dran(); if (d.st.ende) break; await A.ruf(d.tok, { match: ID, aktion: "zug", zug: { typ: "ende" } }); }
  const ende = A.db.enden[0];
  check(k.match.status === "beendet" && A.db.enden.length === 1 && ende && [1, 2].includes(ende.sieger) && ["team", "punkte"].includes(ende.grund), `Kampfende: Der Server trägt das Ergebnis genau einmal ein (Sieger Team ${ende && ende.sieger}, Grund „${ende && ende.grund}“)`);
  const letzte = A.sicht(ID, "nutzer-a", k.v - 1).schritte[0].st;
  check(Boolean(letzte.ende) && letzte.arena.koenig[2] === k2, "Nach dem Ende ist auch der Anführer des Gegners aufgedeckt");
  const nach = await A.ruf("tok-a", { match: ID, aktion: "zug", zug: { typ: "ende" } });
  check(nach.o.ok && nach.o.status === "beendet" && A.db.enden.length === 1, "Nach dem Ende wird nichts mehr gerechnet");
  check(A.db.abgewiesen === 0 && A.db.aufrufe.save > 20, "Alle Datenbankaufrufe der Function tragen den Dienstschlüssel");
  check(!A.db.fremdErgebnis, "Die Function reicht kein Ergebnis in die Datenbank: rpg_arena_srv_end bekommt nur Kampf und geprüftes Konto");
  check(!A.db.endeOhneTeilnahme && A.db.aufrufe.end >= 1, "Beim Eintragen des Ergebnisses übergibt die Function das Konto eines Teilnehmers");
  // Zugriffskontrolle vor dem Service-Schlüssel: Ohne gültige Anmeldung erreicht kein Aufruf die Datenbank
  { const B2 = attrappe(); B2.kampf(ID, { match: m }); const l0 = B2.db.aufrufe.load;
    await B2.ruf(null, { match: ID, aktion: "start" }); await B2.ruf("erfunden", { match: ID, aktion: "zug", zug: { typ: "ende" } }); await B2.ruf("", { match: ID });
    check(B2.db.aufrufe.load === l0 && B2.db.aufrufe.save === 0 && B2.db.aufrufe.end === 0, "Ohne gültige Anmeldung macht die Function keinen einzigen Datenbankaufruf"); }
  { const B3 = attrappe(); Object.assign(B3.db.nutzer, { "tok-a": "nutzer-a" }); B3.kampf(ID, { match: m }); const l0 = B3.db.aufrufe.load;
    await B3.ruf("tok-a", { match: "kaputt", aktion: "start" }); await B3.ruf("tok-a", { match: ID + "'; drop table x; --", aktion: "start" });
    check(B3.db.aufrufe.load === l0, "Eine ungültige Kampf-ID wird abgewiesen, bevor die Datenbank gefragt wird"); }
  // Ohne Schlüssel in der Umgebung
  console.log(ok ? "\nARENA-FUNKTION IN ORDNUNG" : "\nARENA-FUNKTION: FEHLER"); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
