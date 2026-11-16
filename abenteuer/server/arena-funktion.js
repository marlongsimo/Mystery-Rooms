/*
 * Mythara – Arena, Serverkampf: die Edge Function (Netz und Datenbank). Der Rechenteil steht in arena-kern.js.
 * Diese Datei wird von tools/arena-funktion-bauen.js zusammen mit den Regeln in supabase/functions/arena/index.ts geschrieben.
 *
 * Aufruf (vom Spiel, angemeldet): POST { match: "<Kampf-ID>", aktion: "start" | "zug" | "zeit", zug?: { typ, … } }
 * Antwort: { ok: true, v, schritte: [{ v, st }] }  – die neuen Schritte in der Sicht des Aufrufers
 *       oder { ok: true, wartet: <ms bis zum Start> }  oder { fehler: "…" }
 *
 * Schlüssel: Die Function liest SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY aus ihrer Umgebung (ersatzweise ARENA_URL und ARENA_SERVICE_KEY).
 * Der Service-Schlüssel bleibt auf dem Server; im Spiel steht weiterhin nur der öffentliche Schlüssel.
 */
const ARENA_KERN = globalThis.ABARENAKERN(globalThis.ABR, ARENA_KARTEN);
const KOPF = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const antwort = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: Object.assign({ "Content-Type": "application/json" }, KOPF) });

async function arenaAnfrage(req) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: KOPF });
  if (req.method !== "POST") return antwort({ fehler: "Nur POST." }, 405);
  // Supabase stellt beide Werte üblicherweise selbst bereit. Fehlen sie, lassen sie sich als eigene Secrets ARENA_URL und ARENA_SERVICE_KEY hinterlegen.
  const URL_DB = Deno.env.get("SUPABASE_URL") || Deno.env.get("ARENA_URL"), DIENST = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("ARENA_SERVICE_KEY");
  if (!URL_DB || !DIENST) { console.error("arena: es fehlt " + (!URL_DB ? "SUPABASE_URL (oder ARENA_URL) " : "") + (!DIENST ? "SUPABASE_SERVICE_ROLE_KEY (oder ARENA_SERVICE_KEY)" : "")); return antwort({ fehler: "Der Server für den Arena-Kampf ist nicht fertig eingerichtet." }, 500); }
  // Reihenfolge der Zugriffskontrolle – vor dem ersten Datenbankaufruf mit dem Service-Schlüssel steht immer:
  //   1. gültiges Anmelde-Token (der Anmeldedienst prüft es und nennt das Konto; aus dem Rumpf wird keine Identität übernommen),
  //   2. wohlgeformte Kampf-ID.
  // Der erste Datenbankaufruf (rpg_arena_srv_load) bekommt dieses Konto mit und liefert nur dessen eigenen Serverkampf.
  const token = req.headers.get("Authorization") || "";
  if (!/^Bearer .+/.test(token)) return antwort({ fehler: "Nicht angemeldet." }, 401);
  let nutzer = null;
  try { const r = await fetch(URL_DB + "/auth/v1/user", { headers: { Authorization: token, apikey: req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY") || DIENST } });
    if (r.ok) nutzer = await r.json(); } catch (e) { nutzer = null; }
  if (!nutzer || !nutzer.id) return antwort({ fehler: "Nicht angemeldet." }, 401);
  let rumpf = null; try { rumpf = await req.json(); } catch (e) { rumpf = null; }
  if (!rumpf || typeof rumpf.match !== "string" || !/^[0-9a-f-]{36}$/i.test(rumpf.match)) return antwort({ fehler: "Kampf fehlt." }, 400);
  const srv = async (name, args) => { const r = await fetch(URL_DB + "/rest/v1/rpc/" + name, { method: "POST", headers: { apikey: DIENST, Authorization: "Bearer " + DIENST, "Content-Type": "application/json" }, body: JSON.stringify(args) });
    if (!r.ok) throw new Error(name + ": " + (await r.text()).slice(0, 300)); const t = await r.text(); return t ? JSON.parse(t) : null; };
  try {
    // Hat inzwischen jemand anderes gerechnet (gleichzeitiger Aufruf beider Seiten), wird neu geladen und noch einmal versucht
    for (let versuch = 0; versuch < 3; versuch++) {
      // Die Datenbank gibt den Kampf nur heraus, wenn das angemeldete Konto daran teilnimmt – sonst bekommt die Function ihn gar nicht zu sehen
      const d = await srv("rpg_arena_srv_load", { p_match_id: rumpf.match, p_user: nutzer.id });
      if (!d || !d.match || (d.seite !== 1 && d.seite !== 2)) return antwort({ fehler: "Diesen Kampf gibt es für dich nicht." }, 404);
      const m = d.match, k = d.kampf, seite = d.seite;
      if (m.status !== "bereit" && m.status !== "laeuft") return antwort({ ok: true, v: k.v, status: m.status, schritte: [] });
      const jetzt = Date.now(); let st = null, schritte = [];
      if (!k.st) {
        if (jetzt < k.beginn) return antwort({ ok: true, v: 0, wartet: k.beginn - jetzt, schritte: [] });
        const s = ARENA_KERN.start(m, k.anf1, k.anf2, jetzt); st = s.st; schritte = s.schritte;
      } else {
        st = ARENA_KERN.laden(k.st);
        // Das Ergebnis liest die Datenbank selbst aus dem gespeicherten Stand – die Function reicht keines hinein
        if (st.ende) { await srv("rpg_arena_srv_end", { p_match_id: m.id }); return antwort({ ok: true, v: k.v, status: "beendet", schritte: [] }); }
        const r = rumpf.aktion === "zug" ? ARENA_KERN.zug(st, seite, rumpf.zug, jetzt) : ARENA_KERN.zeit(st, jetzt);
        if (r.fehler) return antwort({ fehler: r.fehler, v: k.v });
        schritte = r.schritte;
      }
      if (!schritte.length) return antwort({ ok: true, v: k.v, schritte: [] });
      const gespeichert = await srv("rpg_arena_srv_save", { p_match_id: m.id, p_user: nutzer.id, p_v_alt: k.v, p_st: ARENA_KERN.speichern(st), p_schritte: schritte });
      if (!gespeichert) continue;
      if (st.ende) await srv("rpg_arena_srv_end", { p_match_id: m.id });
      return antwort({ ok: true, v: k.v + schritte.length, schritte: schritte.map((s, i) => ({ v: k.v + i + 1, st: seite === 1 ? s.sicht1 : s.sicht2 })) });
    }
    return antwort({ fehler: "Gerade rechnet der Server noch den Zug davor. Bitte noch einmal." }, 409);
  } catch (e) { console.error("arena:", e && e.message || e); return antwort({ fehler: "Der Server konnte den Zug nicht rechnen." }, 500); } // Einzelheiten nur ins Protokoll der Function, nicht ans Spiel
}
Deno.serve(arenaAnfrage);
