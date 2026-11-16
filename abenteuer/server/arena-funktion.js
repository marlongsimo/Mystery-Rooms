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
  if (!URL_DB || !DIENST) return antwort({ fehler: "Der Server für den Arena-Kampf ist nicht fertig eingerichtet.", technisch: `Es fehlt: ${!URL_DB ? "SUPABASE_URL (oder ARENA_URL) " : ""}${!DIENST ? "SUPABASE_SERVICE_ROLE_KEY (oder ARENA_SERVICE_KEY)" : ""}` }, 500);
  // Wer ruft? Das Anmelde-Token prüft der Anmeldedienst selbst – die Function vertraut keiner Angabe aus dem Rumpf
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
      const d = await srv("rpg_arena_srv_load", { p_match_id: rumpf.match });
      if (!d || !d.match) return antwort({ fehler: "Diesen Kampf rechnet nicht der Server." }, 404);
      const m = d.match, k = d.kampf, seite = m.host_id === nutzer.id ? 1 : m.guest_id === nutzer.id ? 2 : 0;
      if (!seite) return antwort({ fehler: "Du nimmst an diesem Kampf nicht teil." }, 403);
      if (m.status !== "bereit" && m.status !== "laeuft") return antwort({ ok: true, v: k.v, status: m.status, schritte: [] });
      const jetzt = Date.now(); let st = null, schritte = [];
      if (!k.st) {
        if (jetzt < k.beginn) return antwort({ ok: true, v: 0, wartet: k.beginn - jetzt, schritte: [] });
        const s = ARENA_KERN.start(m, k.anf1, k.anf2, jetzt); st = s.st; schritte = s.schritte;
      } else {
        st = ARENA_KERN.laden(k.st);
        if (st.ende) { const e = ARENA_KERN.ergebnis(st); await srv("rpg_arena_srv_end", { p_match_id: m.id, p_sieger: e.sieger, p_grund: e.grund, p_punkte: e.punkte, p_runden: e.runden }); return antwort({ ok: true, v: k.v, status: "beendet", schritte: [] }); }
        const r = rumpf.aktion === "zug" ? ARENA_KERN.zug(st, seite, rumpf.zug, jetzt) : ARENA_KERN.zeit(st, jetzt);
        if (r.fehler) return antwort({ fehler: r.fehler, v: k.v });
        schritte = r.schritte;
      }
      if (!schritte.length) return antwort({ ok: true, v: k.v, schritte: [] });
      const gespeichert = await srv("rpg_arena_srv_save", { p_match_id: m.id, p_v_alt: k.v, p_st: ARENA_KERN.speichern(st), p_schritte: schritte });
      if (!gespeichert) continue;
      if (st.ende) { const e = ARENA_KERN.ergebnis(st); await srv("rpg_arena_srv_end", { p_match_id: m.id, p_sieger: e.sieger, p_grund: e.grund, p_punkte: e.punkte, p_runden: e.runden }); }
      return antwort({ ok: true, v: k.v + schritte.length, schritte: schritte.map((s, i) => ({ v: k.v + i + 1, st: seite === 1 ? s.sicht1 : s.sicht2 })) });
    }
    return antwort({ fehler: "Gerade rechnet der Server noch den Zug davor. Bitte noch einmal." }, 409);
  } catch (e) { return antwort({ fehler: "Der Server konnte den Zug nicht rechnen.", technisch: String(e && e.message || e).slice(0, 300) }, 500); }
}
Deno.serve(arenaAnfrage);
