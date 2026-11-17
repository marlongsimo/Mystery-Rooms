/*
 * Mythara – Arena, Serverkampf: der Teil, der auf dem Server rechnet (ohne Netz und ohne Datenbank, testbar in Node).
 * Benutzt dieselben Regeln wie das Spiel (js/regeln.js). Die Edge Function (supabase/functions/arena/index.ts, gebaut mit
 * tools/arena-funktion-bauen.js) lädt den Stand aus der Datenbank, ruft diesen Kern auf und speichert das Ergebnis.
 *
 * Grundsätze:
 *   • Nur der Server kennt den vollständigen Stand. Jede Seite bekommt ihre Sicht: ohne den Anführer des Gegners
 *     (Königsmord, bis zum Ende) und ohne den Zustand des Zufallsgenerators.
 *   • Ein Zug wird nur ausgeführt, wenn der Held am Zug zum Team des Aufrufers gehört. Die Regeln selbst prüfen den Rest.
 *   • Monster ziehen sofort nach; jeder Schritt wird einzeln festgehalten, damit die Geräte ihn einzeln zeigen können.
 *   • Zugzeit: eine Minute je Held. Ist sie abgelaufen, darf jede Seite das Zugende auslösen. Lässt ein Team dreimal
 *     hintereinander die Zeit verstreichen, hat es aufgegeben.
 *   • Rechner-Gegner (match.bot): Team 2 wird vom Server gespielt (server/arena-bot.js), Schritt für Schritt und mit Bedenkzeit.
 *     Die Sicht der Spieler nennt nur den Zeitpunkt, zu dem der nächste Schritt fällig ist (arena.takt).
 */
(function (root) {
  "use strict";
  const LOS = ["arena", "koenig", "horde", "duell"]; // wie js/arena.js und rpg_arena_modus (Migration 010)
  const STAERKE = [1, 1]; // Spielstärke des Rechner-Gegners ohne Angabe am Kampf: von … bis (1 = so gut er kann). Sonst gilt die Einstellung der Admins (Migration 020).
  const ZUGZEIT = 60000, ZEITAUS_MAX = 3, LOG_MAX = 140, MONSTER_MAX = 60;
  const NACHHOL_AB = 8000, NACHHOL_MAX = 60; // Rechner-Gegner: ab 8 Sekunden Verzug wird nachgeholt, höchstens 60 Schritte je Aufruf

  function kern(R, KARTEN, botFabrik) {
    const fabrik = botFabrik || root.ABARENABOT, BOT = fabrik ? fabrik(R) : null;
    // Arenakämpfe laufen immer im Zehn-Stufen-Modell. Das muss schon beim Laden gelten, nicht erst beim Anlegen eines Kampfes:
    // Eine frisch gestartete Funktion rechnet sonst laufende Kämpfe mit dem alten Modell weiter (Stufe 4+ ohne Werte: "W20 + undefined").
    if (R.FD && R.FD.STUFEN10) R.FD.STUFEN10.aktiv = true;
    // Bedenkzeit: vor dem ersten Schritt eines Zugs länger (manchmal deutlich), zwischen den Schritten kurz
    const denkZeit = () => 1800 + Math.random() * 3600 + (Math.random() < 0.15 ? 2500 + Math.random() * 4000 : 0), zwischenZeit = () => 700 + Math.random() * 1700;
    const modusVon = (seed) => LOS[Math.abs(Math.trunc(Number(seed) || 0)) % LOS.length];
    const karteVon = (k) => (k !== "garten" && KARTEN && KARTEN[String(k || "").toUpperCase()]) || R.KARTE_GARTEN;
    const idx = (n) => Math.max(0, Math.min(2, Math.trunc(Number(n) || 0)));
    const istMonster = (st, f) => !R.teamVon(st, f);

    /** Frischer Kampf aus den Angaben des Kampfes (wie auf den Geräten: js/arena.js, kampf()) */
    function neu(match, anf1, anf2) {
      if (R.FD && R.FD.STUFEN10) R.FD.STUFEN10.aktiv = true;
      // Der Modus steht am Kampf (Normal: Duell, Arcade: ausgelost, privat: gewählt); ältere Kämpfe ohne Angabe: aus der Zufallszahl
      const modus = LOS.includes(match.modus) ? match.modus : modusVon(match.seed), beg = R.BEGEGNUNGEN[match.begegnung] ? match.begegnung : "garten", alt = Math.max(1, Math.min(3, R.BEGEGNUNGEN[beg].stufe || 1));
      const st = R.neueArena(match.seed || 1, { modus, anfuehrer: [idx(anf1), idx(anf2)],
        teams: [match.host_team, match.guest_team].map((tm) => tm.map((h) => ({ fid: h.held, stufe: h.stufe }))), namen: [match.host_name, match.guest_name],
        karte: karteVon(match.karte), begegnung: beg, bedrohung: Math.max(0, (match.kampfstufe || 1) - [1, 3, 6][alt - 1]) });
      st.arena.zeitaus = { 1: 0, 2: 0 };
      if (match.bot && BOT) {
        // Spielstärke je Gegner verschieden (manche spielen besser als andere); fest je Kampf
        st.arena.bot = { seite: 2, bis: 0, lauf: 0, n: 0, staerke: match.staerke != null ? Number(match.staerke) : STAERKE[0] + Math.random() * (STAERKE[1] - STAERKE[0]) };
        if (st.arena.koenig) { const h = st.figuren.filter((f) => f.team === 2)[BOT.anfuehrer(st, 2)]; if (h) st.arena.koenig[2] = h.id; }
      }
      return st;
    }
    /** Zugzeit stellen, sobald ein anderer Held an die Reihe kommt */
    function uhr(st, jetzt) {
      const a = R.aktiv(st), held = !st.ende && a && !istMonster(st, a) && R.kannZiehen(st, a), k = held ? a.id + ":" + st.runde : null;
      if (st.arena.zugWer === k) return;
      st.arena.zugWer = k; st.arena.zugBis = k ? jetzt + ZUGZEIT : null;
      const b = st.arena.bot; if (b && held && R.teamVon(st, a) === b.seite) { b.bis = jetzt + denkZeit(); b.lauf = 0; b.n = 0; }
    }
    /** Was eine Seite sehen darf */
    function sicht(st, seite, jetzt) {
      const j = R.speichern(st);
      delete j.rs; j.log = (j.log || []).slice(-LOG_MAX);
      j.arena = Object.assign({}, j.arena, { jetzt });
      if (j.arena.bot) { const a = R.aktiv(st); j.arena.takt = !st.ende && a && R.kannZiehen(st, a) && R.teamVon(st, a) === j.arena.bot.seite ? j.arena.bot.bis : null; delete j.arena.bot; }
      if (j.arena.koenig && !st.ende) j.arena.koenig = { 1: seite === 1 ? j.arena.koenig[1] : null, 2: seite === 2 ? j.arena.koenig[2] : null };
      return j;
    }
    const schritt = (st, out, jetzt) => { uhr(st, jetzt); out.push({ sicht1: sicht(st, 1, jetzt), sicht2: sicht(st, 2, jetzt) }); };
    /** Monster ziehen, bis wieder ein Held an der Reihe ist */
    function monster(st, out, jetzt) {
      for (let n = 0; n < MONSTER_MAX && !st.ende; n++) { const a = R.aktiv(st); if (!a || !istMonster(st, a)) break; R.gegnerZug(st); schritt(st, out, jetzt); }
    }
    /** Kampf beginnen. Zurück: { st, schritte } */
    function start(match, anf1, anf2, jetzt) {
      const st = neu(match, anf1, anf2), schritte = [];
      schritt(st, schritte, jetzt); monster(st, schritte, jetzt);
      return { st, schritte };
    }
    /** Zug einer Seite. w: { typ: "bewegen", x, y } | { typ: "aktion", aktion, ziel } | { typ: "ende" }. Zurück: { fehler } oder { schritte } – st wird verändert */
    function zug(st, seite, w, jetzt) {
      if (!st || st.ende) return { fehler: "Der Kampf läuft nicht." };
      if (seite !== 1 && seite !== 2) return { fehler: "Du nimmst an diesem Kampf nicht teil." };
      const akt = R.aktiv(st);
      if (!akt || R.teamVon(st, akt) !== seite) return { fehler: "Du bist gerade nicht am Zug." };
      if (!w || typeof w !== "object") return { fehler: "Unbekannter Zug." };
      let r = null;
      if (w.typ === "bewegen") { const x = Number(w.x), y = Number(w.y); if (!Number.isInteger(x) || !Number.isInteger(y)) return { fehler: "Unbekanntes Feld." }; r = R.bewegen(st, x, y); }
      else if (w.typ === "aktion") { if (typeof w.aktion !== "string" || w.aktion.length > 60) return { fehler: "Unbekannte Aktion." }; r = R.handeln(st, w.aktion, String(w.ziel || akt.id).slice(0, 60)); }
      else if (w.typ === "ende") R.zugEnde(st);
      else return { fehler: "Unbekannter Zug." };
      if (r && r.fehler) return { fehler: r.fehler };
      st.arena.zeitaus = st.arena.zeitaus || { 1: 0, 2: 0 }; st.arena.zeitaus[seite] = 0;
      const schritte = []; schritt(st, schritte, jetzt); monster(st, schritte, jetzt);
      return { schritte };
    }
    /** Zugzeit abgelaufen? Dann endet der Zug des Helden. Zurück: { schritte } (leer, wenn noch Zeit ist) */
    /** Rechner-Gegner: ein Schritt (bewegen, Aktion oder Zugende) */
    function botSchritt(st, jetzt) {
      const b = st.arena.bot; b.n = (b.n || 0) + 1;
      let w = { typ: "ende" };
      if (b.n <= 12) { try { w = BOT.entscheide(st, b); } catch (e) { w = { typ: "ende" }; } }
      if (w.typ === "bewegen") b.lauf = (b.lauf || 0) + 1;
      b.letzt = w; // nur im Stand des Servers (für Tests und Fehlersuche)
      b.bis = jetzt + zwischenZeit(); // gilt, solange derselbe Held weiterzieht; beim nächsten Helden stellt uhr() neu
      let r = zug(st, b.seite, w, jetzt);
      if (r.fehler && w.typ !== "ende") r = zug(st, b.seite, { typ: "ende" }, jetzt);
      return r.fehler ? { schritte: [] } : r;
    }
    /** Zeit vergeht. Gegen einen Menschen wie bisher: ein fälliger Schritt je Aufruf (das Gerät des Gegners hält den Kampf in Gang).
     *  Gegen den Rechner-Gegner hält niemand den Kampf in Gang, wenn der Spieler weg ist. Deshalb wird hier NACHGEHOLT, was in der
     *  Zwischenzeit geschehen wäre: abgelaufene Zugzeiten des Spielers (dreimal in Folge = verloren) und die Züge des Rechners –
     *  jeweils zu dem Zeitpunkt, an dem sie fällig waren. So läuft ein verlassener Kampf weiter wie gegen einen Menschen. */
    function zeit(st, jetzt) {
      if (!st || st.ende || !st.arena.bot || !BOT) return zeitEin(st, jetzt);
      const alle = [];
      for (let n = 0; n < NACHHOL_MAX && !st.ende; n++) {
        const a = R.aktiv(st), botDran = a && R.teamVon(st, a) === st.arena.bot.seite, faellig = botDran ? st.arena.bot.bis : st.arena.zugBis;
        if (!faellig || jetzt < faellig) break;
        const spaet = jetzt - faellig > NACHHOL_AB;            // deutlich überfällig: in der Vergangenheit rechnen und weitermachen
        const r = zeitEin(st, spaet ? faellig : jetzt); if (!r.schritte.length) break;
        for (const x of r.schritte) alle.push(x);
        if (!spaet) break;                                     // im laufenden Spiel: ein Schritt je Aufruf, wie bisher
      }
      return { schritte: alle };
    }
    function zeitEin(st, jetzt) {
      if (st && !st.ende && st.arena.bot && BOT) { const a = R.aktiv(st);
        if (a && R.teamVon(st, a) === st.arena.bot.seite) return jetzt < st.arena.bot.bis ? { schritte: [] } : botSchritt(st, jetzt); }
      if (!st || st.ende || !st.arena.zugBis || jetzt < st.arena.zugBis) return { schritte: [] };
      const a = R.aktiv(st), tm = a ? R.teamVon(st, a) : 0; if (!tm) return { schritte: [] };
      st.arena.zeitaus = st.arena.zeitaus || { 1: 0, 2: 0 }; st.arena.zeitaus[tm]++;
      st.log.push({ t: `Die Zugzeit von ${a.name} ist abgelaufen.`, art: "schlecht" });
      const schritte = [];
      if (st.arena.zeitaus[tm] >= ZEITAUS_MAX) {
        // Dreimal hintereinander nichts getan: Das Team gilt als aufgegeben
        R.arenaSicht(st, 0); st.arena.sieger = 3 - tm; st.arena.grund = `${st.arena.namen[tm - 1]} hat dreimal die Zugzeit verstreichen lassen.`; st.arena.aufgabe = true; st.arena.aufgabeZeit = Math.round(jetzt); st.ende = "arena"; // Zwangsaufgabe: Die Datenbank verhängt dafür eine Zeitstrafe
        st.log.push({ t: `${st.arena.grund} Sieg für ${st.arena.namen[2 - tm]}.`, art: "ende" });
        schritt(st, schritte, jetzt); return { schritte };
      }
      R.zugEnde(st); schritt(st, schritte, jetzt); monster(st, schritte, jetzt);
      return { schritte };
    }
    /** Ergebnis für die Datenbank (erst nach dem Ende) */
    function ergebnis(st) {
      if (!st || !st.ende) return null;
      const a = st.arena;
      return { sieger: a.sieger, grund: a.aufgabe ? "aufgabe" : /am Boden|ist gefallen/.test(a.grund || "") ? "team" : "punkte", punkte: a.punkte, runden: st.runde };
    }
    return { modusVon, neu, start, zug, zeit, sicht, ergebnis, laden: R.laden, speichern: R.speichern, ZUGZEIT, bot: BOT };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = kern;
  else root.ABARENAKERN = kern;
})(typeof window !== "undefined" ? window : globalThis);
