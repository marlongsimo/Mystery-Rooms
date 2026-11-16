/*
 * Mythara – Arena, Serverkampf: Attrappe für Tests. Lädt die GEBAUTE Edge Function (supabase/functions/arena/index.ts)
 * in Node und stellt ihr eine nachgebildete Datenbank hin (Anmeldedienst und die Funktionen rpg_arena_srv_* aus Migration 015).
 * So läuft in den Tests genau der Code, der später auf dem Server liegt.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const DIENST = "geheimer-dienstschluessel";

function attrappe() {
  const db = { nutzer: {}, kaempfe: {}, enden: [], aufrufe: { load: 0, save: 0, end: 0 }, abgewiesen: 0 };
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
  // Nachgebildet: /auth/v1/user und /rest/v1/rpc/rpg_arena_srv_* (nur mit dem Dienstschlüssel)
  async function netz(url, opt = {}) {
    const h = opt.headers || {}, u = String(url);
    if (u.endsWith("/auth/v1/user")) { const n = db.nutzer[String(h.Authorization || "").replace(/^Bearer /, "")]; return n ? json({ id: n }) : json({ message: "ungültig" }, 401); }
    const m = /\/rest\/v1\/rpc\/(\w+)$/.exec(u); if (!m) return json({ message: "unbekannt" }, 404);
    if (h.apikey !== DIENST || h.Authorization !== "Bearer " + DIENST) { db.abgewiesen++; return json({ message: "permission denied" }, 403); }
    const a = JSON.parse(opt.body || "{}"), k = db.kaempfe[a.p_match_id];
    if (m[1] === "rpg_arena_srv_load") { db.aufrufe.load++; return json(k ? JSON.parse(JSON.stringify({ kampf: { v: k.v, st: k.st, anf1: k.anf1, anf2: k.anf2, beginn: k.beginn }, match: k.match })) : null); }
    if (m[1] === "rpg_arena_srv_save") { db.aufrufe.save++; if (!k || k.v !== a.p_v_alt) return json(false);
      k.st = a.p_st; a.p_schritte.forEach((s, i) => k.schritte.push({ v: k.v + i + 1, sicht1: s.sicht1, sicht2: s.sicht2 })); k.v += a.p_schritte.length; k.schritte = k.schritte.filter((s) => s.v > k.v - 40);
      if (k.match.status === "bereit") k.match.status = "laeuft"; return json(true); }
    if (m[1] === "rpg_arena_srv_end") { db.aufrufe.end++; if (!k || !["bereit", "laeuft"].includes(k.match.status)) return json(false);
      Object.assign(k.match, { status: "beendet", sieger: a.p_sieger, grund: a.p_grund, punkte: a.p_punkte, runden: a.p_runden }); db.enden.push({ id: a.p_match_id, sieger: a.p_sieger, grund: a.p_grund }); return json(true); }
    return json({ message: "unbekannt" }, 404);
  }
  let handler = null;
  const umgebung = { SUPABASE_URL: "http://attrappe", SUPABASE_SERVICE_ROLE_KEY: DIENST };
  const kontext = vm.createContext({ Deno: { env: { get: (k) => umgebung[k] || null }, serve: (f) => { handler = f; } }, fetch: netz, Request, Response, console, Date, Math, JSON, Set, Map, Number, String, Object, Array, Error, RegExp, Promise });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../supabase/functions/arena/index.ts"), "utf8"), kontext, { filename: "arena/index.ts" });
  /** Kampf anlegen, wie ihn rpg_arena_search_server hinterlässt */
  function kampf(id, o) {
    db.kaempfe[id] = { v: 0, st: null, anf1: 0, anf2: 0, beginn: o.beginn == null ? Date.now() : o.beginn, schritte: [],
      match: Object.assign({ id, status: "bereit", host_id: "nutzer-a", guest_id: "nutzer-b", host_name: "Anna", guest_name: "Ben", karte: "gruft", begegnung: "kobolde", seed: 4712, kampfstufe: 3 }, o.match || {}) };
    return db.kaempfe[id];
  }
  /** Aufruf der Function wie vom Spiel */
  async function ruf(token, rumpf, methode = "POST") {
    const r = await handler(new Request("http://attrappe/functions/v1/arena", { method: methode, headers: Object.assign({ "Content-Type": "application/json" }, token ? { Authorization: "Bearer " + token } : {}), body: methode === "POST" ? JSON.stringify(rumpf) : undefined }));
    let o = null; try { o = await r.json(); } catch (e) { o = null; } return { status: r.status, o };
  }
  /** Nachgebildet: rpg_arena_fight (Sicht eines Spielers seit Schritt p_version) */
  function sicht(id, nutzer, version) {
    const k = db.kaempfe[id]; if (!k) return { server: false };
    const seite = k.match.host_id === nutzer ? 1 : 2;
    return { server: true, v: k.v, laeuft: Boolean(k.st), status: k.match.status, seite, beginn: k.beginn, jetzt: Date.now(), anfuehrer: seite === 1 ? k.anf1 : k.anf2,
      schritte: k.schritte.filter((s) => s.v > (version || 0)).slice(0, 12).map((s) => ({ v: s.v, st: seite === 1 ? s.sicht1 : s.sicht2 })) };
  }
  return { db, kampf, ruf, sicht, DIENST };
}
module.exports = attrappe;
