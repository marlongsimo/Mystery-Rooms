/*
 * Mythara – Arena: ein Spieler gegen einen anderen, jeder mit drei Helden aus seiner Sammlung, dazu schwache Monster.
 * Übersicht (offene Kämpfe mit Name und Durchschnittsstufe), Kampf erstellen oder beitreten (Heldenwahl mit Schnitt),
 * Aufstellung beider Seiten vor dem Start, Kampf über die Live-Verbindung, Ergebnis mit Belohnungen.
 *
 * Datenbank: Migration 008 (rpg_arena_*). Gibt es sie nicht, bleibt die Arena unsichtbar.
 * Spielmodi: Arena, Königsmord, Die Horde – das Los entscheidet (aus der Zufallszahl des Kampfes, die beide Geräte von der
 * Datenbank bekommen). Vor dem Start zeigt die Aufstellung Modus, Erklärung und Siegbedingungen.
 * Technik: Das Gerät des Erstellers rechnet den Kampf (js/regeln.js, neueArena) und schreibt den Stand unter „spiel“
 * in eine Live-Sitzung; der Beigetretene zeigt ihn an und schickt seine Züge unter „zug:<eigene Kennung>“.
 * Globaler Name: window.ARENA
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const F = window.ABF, R = window.ABR;
  const WAEHRUNG = "Seelensplitter", ZEICHEN = "◈";
  const komma = (n) => Number(n).toFixed(1).replace(".", ",");
  const rpc = async (name, args = {}) => { const c = window.AB.liveClient(); await c.ensureUser(); return c.rpc(name, args); };
  const fehlt = (e) => Boolean(e && (e.code === "PGRST202" || e.code === "42883" || /Could not find the function|schema cache|does not exist/i.test(e.roh || e.message || "")));
  const sm = () => window.ABSAMMLUNG;
  const stufe = (fid) => { const p = sm() && sm().fortschritt ? sm().fortschritt(fid) : null; return p ? p.stufe : 1; };

  // Z: Zustand der Arena-Seite
  const Z = { da: null, liste: null, match: null, fehler: "", laedt: false, wahl: [], modus: null, ziel: null, uhr: null, kampf: null };
  /* Spielmodi: Welcher gespielt wird, entscheidet das Los */
  const MODI = {
    arena: { name: "Arena", kurz: "Das klassische Duell um Punkte.", lang: "Zwei Teams, ein paar Monster dazwischen. Wer mehr Punkte sammelt, gewinnt.",
      ziel: ["Bringe alle drei gegnerischen Helden zu Boden – dann hast du sofort gewonnen.", "Sonst entscheiden nach 15 Runden die Punkte: 5 je gefälltem Helden, 1 je Monster, 2 je Anführer-Monster."] },
    koenig: { name: "Königsmord", kurz: "Jeder hat einen geheimen Anführer. Fällt er, ist alles verloren.", lang: "Vor dem Start bestimmst du verdeckt einen deiner Helden zum Anführer. Dein Gegner weiß nicht, wer es ist.",
      ziel: ["Bringe den gegnerischen Anführer zu Boden – dann hast du sofort gewonnen.", "Fällt dein eigener Anführer, hast du sofort verloren.", "Sonst entscheiden nach 15 Runden die Punkte."] },
    horde: { name: "Die Horde", kurz: "Jede Runde kommen neue, stärkere Monster.", lang: "Jede Runde erscheinen neue Monster, gleich weit von beiden Teams entfernt, und sie werden mit jeder Runde stärker.",
      ziel: ["Liegt ein Team ganz am Boden – durch Monster oder Gegner –, gewinnt das andere.", "Sonst entscheiden nach 30 Runden die Punkte."] } };
  const LOS = ["arena", "koenig", "horde"];
  const modusVon = (m) => { const fest = new URLSearchParams(location.search).get("arenamodus"); if (MODI[fest]) return fest;
    return m && m.seed != null && isFinite(Number(m.seed)) ? LOS[Math.abs(Math.trunc(Number(m.seed))) % LOS.length] : "arena"; };
  const modusHtml = (k, gross) => `<div class="arena-modus-karte${gross ? " gross" : ""}"><h3>${MODI[k].name}</h3><p>${MODI[k].lang}</p><b>So gewinnst du</b><ul>${MODI[k].ziel.map((z) => `<li>${z}</li>`).join("")}</ul></div>`;
  // Der eigene Anführer (Königsmord) wird nur auf diesem Gerät gemerkt
  const anfuehrerMerken = (id, fid) => { try { localStorage.setItem("ab_arena_anf", JSON.stringify({ id, fid })); } catch (e) { /* privat */ } };
  const anfuehrerIdx = (m) => { let fid = null; try { const o = JSON.parse(localStorage.getItem("ab_arena_anf") || "null"); if (o && o.id === m.id) fid = o.fid; } catch (e) { /* privat */ }
    const team = (m.seite === 1 ? m.host : m.gast).team || []; return Math.max(0, team.findIndex((h) => h.held === fid)); };
  const seiteOffen = () => { const s = $("#hub-seite"); return Boolean(s && !s.hidden && s.querySelector("[data-arena]")); };

  /** Gibt es die Arena in der Datenbank, und wie viel Währung hat das Konto? Ergebnis wird gemerkt. */
  async function pruefen(neu) {
    if (Z.da != null && !neu) return Z.da;
    try { const r = await rpc("rpg_my_wallet", {}); Z.da = Boolean(r && r.konto); Z.waehrung = (r && r.waehrung) || 0; }
    catch (e) { Z.da = false; }
    return Z.da;
  }
  const waehrungHtml = () => `<span class="arena-waehrung" title="${WAEHRUNG}: Belohnung für Siege in der Arena"><i>${ZEICHEN}</i>${Z.waehrung || 0}</span>`;

  /* ---------- Übersicht ---------- */
  async function laden() {
    Z.laedt = true; Z.fehler = "";
    try {
      let r = await rpc("rpg_arena_list", {});
      if (Array.isArray(r)) {
        // Die Datenbank liefert nur die offenen Kämpfe anderer: Währung und den eigenen Kampf eigens holen
        const w = await rpc("rpg_my_wallet", {}).catch(() => ({ konto: true, waehrung: Z.waehrung || 0 }));
        let mein = null; const id = meinId();
        if (id) { try { mein = await rpc("rpg_arena_get", { p_match_id: id }); } catch (e) { mein = null; } if (!mein || !["offen", "bereit", "laeuft"].includes(mein.status)) { mein = null; meinMerken(null); } }
        r = { konto: Boolean(w && w.konto), waehrung: (w && w.waehrung) || 0, heute: null, mein,
          offen: r.filter((m) => m && m.status === "offen" && m.host).map((m) => ({ id: m.id, name: m.host.name, schnitt: m.host.schnitt, erstellt: m.erstellt })) };
      }
      Z.liste = r; if (r && r.konto) { Z.waehrung = r.waehrung || 0; Z.match = r.mein || null; }
      if (r && r.konto) { if (Z.modiDa == null) { try { await rpc("rpg_arena_modes", { p_ids: [] }); Z.modiDa = true; } catch (e) { Z.modiDa = !fehlt(e); } } }
      if (window.MYTHARA && window.MYTHARA.waehrungZeigen) window.MYTHARA.waehrungZeigen(Z.waehrung);
    } catch (e) { Z.fehler = fehlt(e) ? "Die Arena ist noch nicht freigeschaltet." : e.message; Z.liste = Z.liste || { konto: !/Spielerkonto/.test(e.message || "") && Boolean(Z.da), offen: [] }; }
    Z.laedt = false;
  }
  // Der eigene offene Kampf wird auf diesem Gerät gemerkt (falls die Übersicht der Datenbank ihn nicht mitliefert)
  const meinId = () => { try { return localStorage.getItem("ab_arena_match") || null; } catch (e) { return null; } };
  const meinMerken = (id) => { try { if (id) localStorage.setItem("ab_arena_match", id); else localStorage.removeItem("ab_arena_match"); } catch (e) { /* privat */ } };
  function seite(html) { window.MYTHARA.seite("arena", `<div data-arena>${html}</div>`); }
  async function zeigen() {
    stoppUhr(); Z.modus = null;
    seite(`<h1 class="hub-gruss">Arena</h1><p class="hub-untertitel">Einen Moment …</p>`);
    if (sm()) await sm().laden(true);
    await laden();
    if (!seiteOffen()) return;
    if (Z.match && Z.match.status !== "offen") return aufstellung(Z.match);
    zeichneListe();
    if (Z.match) pollen(8000, async () => { await laden(); if (Z.match && Z.match.status !== "offen") return aufstellung(Z.match); if (seiteOffen() && !Z.modus) zeichneListe(); });
  }
  function zeichneListe() {
    const L = Z.liste || {}, offen = L.offen || [], m = Z.match;
    if (!L.konto) return seite(`<h1 class="hub-gruss">Arena</h1><p class="hub-untertitel">${esc(Z.fehler || "Die Arena gibt es nur mit einem Spielerkonto: Hier treten deine eigenen Helden mit ihren Stufen an.")}</p>`);
    const eigene = sm().zustand().helden.length;
    seite(`<div class="arena-kopf"><div><h1 class="hub-gruss">Arena</h1><p class="hub-untertitel">Du gegen einen anderen Spieler, jeder mit drei Helden. Dazwischen ein paar Monster.</p></div>
        <div class="arena-kopf-rechts">${waehrungHtml()}<button class="btn ghost klein arena-info-knopf" id="arena-info" aria-label="Regeln und Modi" title="Regeln und Modi">i</button><button class="btn ghost klein" id="arena-neu-laden">↻ Aktualisieren</button></div></div>
      <p class="note">${L.heute != null ? `Belohnungen heute: ${L.heute} von 5 Kämpfen. ` : "Belohnungen gibt es für die ersten fünf Kämpfe des Tages. "}Ein Sieg bringt ${Z.modiDa ? "5 bis 25" : "25"} ${WAEHRUNG}, Erfahrung für deine Helden und mit etwas Glück einen neuen Helden.</p>
      <div class="arena-info" id="arena-info-text" ${Z.infoAuf ? "" : "hidden"}>
        <h2>So läuft ein Kampf</h2>
        <ul><li>Du wählst drei deiner Helden. Die Durchschnittsstufen beider Teams dürfen höchstens eine Stufe auseinanderliegen.</li>
          <li>Karte, Monster und <b>Modus werden ausgelost</b>. Vor dem Start siehst du, welcher Modus gespielt wird und wie man gewinnt.</li>
          <li>Jeder Held hat <b>eine Minute Zugzeit</b>. Läuft sie ab, endet sein Zug.</li>
          <li>Kontrollzauber wirken gegen Helden höchstens eine Runde; danach ist der Held zwei Runden dagegen gefeit.</li>
          <li>Belohnung: Erfahrung für deine Helden (bei einer Niederlage ein Drittel), bei einem Sieg ${Z.modiDa ? "5 bis 25" : "25"} ${WAEHRUNG} und mit etwas Glück ein neuer Held. Erfahrung und Heldenchance gibt es für die ersten fünf Kämpfe des Tages.</li></ul>
        <h2>Die Modi</h2><div class="arena-modus-reihe">${LOS.map((k) => modusHtml(k)).join("")}</div></div>
      ${Z.fehler ? `<p class="fb">${esc(Z.fehler)}</p>` : ""}
      ${m ? `<div class="arena-mein"><div><b>Dein Kampf wartet auf einen Gegner</b><small>Durchschnittsstufe ${komma(m.host.schnitt)} · ${m.host.team.map((h) => esc(F.FIGUREN[h.held].name) + " (" + h.stufe + ")").join(", ")}</small></div><button class="btn ghost klein" id="arena-verwerfen">Verwerfen</button></div>`
        : `<div class="knoepfe"><button class="btn gross" id="arena-erstellen" ${eigene < 3 ? "disabled" : ""}>Kampf erstellen</button></div>${eigene < 3 ? `<p class="note">Du brauchst mindestens drei Helden in deiner Sammlung.</p>` : ""}`}
      <h2 class="hub-zwischen">Offene Kämpfe</h2>
      ${offen.length ? `<ul class="arena-liste">${offen.map((o) => `<li><div><b>${esc(o.name)}</b><small>Durchschnittsstufe ${komma(o.schnitt)}</small></div><button class="btn klein" data-arena-bei="${o.id}" data-schnitt="${o.schnitt}" ${m ? "disabled" : ""}>Beitreten</button></li>`).join("")}</ul>`
        : `<p class="note">Gerade wartet niemand. Erstelle selbst einen Kampf – andere sehen ihn nach dem Aktualisieren.</p>`}`);
    const inf = $("#arena-info"); if (inf) inf.onclick = () => { Z.infoAuf = !Z.infoAuf; $("#arena-info-text").hidden = !Z.infoAuf; };
    const nl = $("#arena-neu-laden"); if (nl) nl.onclick = async () => { nl.disabled = true; await laden(); if (Z.match && Z.match.status !== "offen") return aufstellung(Z.match); zeichneListe(); };
    const er = $("#arena-erstellen"); if (er) er.onclick = () => heldenWahl({ titel: "Kampf erstellen", knopf: "Kampf erstellen", fertig: erstellen });
    const vw = $("#arena-verwerfen"); if (vw) vw.onclick = async () => { vw.disabled = true; try { await rpc("rpg_arena_cancel", { p_match_id: m.id }); } catch (e) { Z.fehler = e.message; } Z.match = null; meinMerken(null); zeigen(); };
    document.querySelectorAll("[data-arena-bei]").forEach((b) => { b.onclick = () => heldenWahl({ titel: "Kampf beitreten", knopf: "Beitreten", gegner: Number(b.dataset.schnitt), fertig: (team) => beitreten(b.dataset.arenaBei, team) }); });
  }

  /* ---------- Heldenwahl: drei eigene Helden, oben der Schnitt ---------- */
  function heldenWahl(o) {
    stoppUhr(); Z.modus = "wahl"; Z.wahl = []; Z.fehler = "";
    const helden = F.REIHE.filter((f) => sm().zustand().helden.includes(f));
    const zeichne = () => {
      const st = Z.wahl.map(stufe), schnitt = st.length ? st.reduce((a, b) => a + b, 0) / st.length : 0, voll = Z.wahl.length === 3;
      const passt = o.gegner == null || !voll || Math.abs(Math.round(schnitt * 10) / 10 - o.gegner) <= 1.0001;
      seite(`<h1 class="hub-gruss">${esc(o.titel)}</h1>
        <div class="arena-schnitt ${voll ? (passt ? "gut" : "schlecht") : ""}"><b>${Z.wahl.length} von 3 Helden</b><span>Durchschnittsstufe: <strong>${Z.wahl.length ? komma(schnitt) : "–"}</strong>${o.gegner != null ? ` · Gegner: ${komma(o.gegner)} (erlaubt ist höchstens eine Stufe Unterschied)` : ""}</span></div>
        ${Z.fehler ? `<p class="fb">${esc(Z.fehler)}</p>` : ""}
        <div class="arena-helden">${helden.map((f) => { const d = F.FIGUREN[f], an = Z.wahl.includes(f);
          return `<button class="arena-held ${an ? "an" : ""}" data-arena-held="${f}" style="--k:${F.KLASSEN[d.klasse].farbe}"><img src="${F.bild(f)}" alt="" loading="lazy"><b>${esc(d.name)}</b><small>${esc(F.KLASSEN[d.klasse].name)}</small><em>Stufe ${stufe(f)}</em></button>`; }).join("")}</div>
        <div class="knoepfe"><button class="btn gross" id="arena-wahl-ok" ${voll && passt ? "" : "disabled"}>${esc(o.knopf)}</button><button class="btn ghost" id="arena-wahl-zurueck">Zurück</button></div>
        ${voll && !passt ? `<p class="note">Dein Team liegt mehr als eine Stufe vom Gegner entfernt. Tausche einen Helden.</p>` : ""}`);
      document.querySelectorAll("[data-arena-held]").forEach((b) => { b.onclick = () => { const f = b.dataset.arenaHeld; if (Z.wahl.includes(f)) Z.wahl = Z.wahl.filter((x) => x !== f); else if (Z.wahl.length < 3) Z.wahl.push(f); zeichne(); }; });
      $("#arena-wahl-zurueck").onclick = zeigen;
      $("#arena-wahl-ok").onclick = async () => { $("#arena-wahl-ok").disabled = true; try { await o.fertig(Z.wahl.slice()); } catch (e) { Z.fehler = e.message; zeichne(); } };
    };
    zeichne();
  }
  async function erstellen(team) { Z.match = await rpc("rpg_arena_create", { p_team: team }); meinMerken(Z.match && Z.match.id); Z.modus = null; await zeigen(); }
  async function beitreten(id, team) { const m = await rpc("rpg_arena_join", { p_match_id: id, p_team: team }); Z.match = m; meinMerken(m && m.id); Z.modus = null; aufstellung(m); }

  /* ---------- Aufstellung beider Seiten, dann der Kampf ---------- */
  const KARTE = (k) => (k === "garten" ? R.KARTE_GARTEN : ((window.ABD_ALLE || {}).grauwacht || { KARTEN: {} }).KARTEN[String(k || "").toUpperCase()]) || R.KARTE_GARTEN;
  const teamHtml = (t, name, mein) => `<div class="arena-team ${mein ? "mein" : "gegner"}"><h3>${esc(name)}${mein ? " (du)" : ""}<span>Ø ${komma(t.schnitt)}</span></h3><div class="arena-team-helden">${t.team.map((h) => { const d = F.FIGUREN[h.held] || { name: h.held, klasse: "krieger" };
    return `<div class="arena-held fest" style="--k:${F.KLASSEN[d.klasse].farbe}"><img src="${F.bild(h.held)}" alt=""><b>${esc(d.name)}</b><em>Stufe ${h.stufe}</em></div>`; }).join("")}</div></div>`;
  function aufstellung(m) {
    stoppUhr(); Z.modus = "aufstellung"; Z.match = m;
    const ich = m.seite, karte = KARTE(m.karte), beg = (R.BEGEGNUNGEN[m.begegnung] || {}).name || "Monster";
    seite(`<h1 class="hub-gruss">Die Aufstellung</h1><p class="hub-untertitel">${esc(karte.name || "Arena")} · ${esc(beg)} · Kampfstufe ${m.kampfstufe}</p>
      <div id="arena-modus-text"></div>
      <div class="arena-gegenueber">${teamHtml(m.host, m.host.name, ich === 1)}<span class="arena-vs">gegen</span>${teamHtml(m.gast, m.gast.name, ich === 2)}</div>
      <p class="note" id="arena-status">${ich === 1 ? "Die Verbindung wird aufgebaut …" : "Warte auf den Ersteller des Kampfes …"}</p>
      <div class="knoepfe"><button class="btn ghost klein" id="arena-abbrechen">Abbrechen</button></div>`);
    $("#arena-abbrechen").onclick = async () => { stoppUhr(); try { await rpc("rpg_arena_cancel", { p_match_id: m.id }); } catch (e) { /* schon beendet */ } await trennen(); Z.match = null; zeigen(); };
    const k = modusVon(m), team = (ich === 1 ? m.host : m.gast).team || [];
    const zeichneModus = () => { const el = $("#arena-modus-text"); if (!el) return; const anf = anfuehrerIdx(m);
      el.innerHTML = `<p class="arena-los">Das Los hat entschieden</p>${modusHtml(k, true)}
        ${k === "koenig" ? `<div class="arena-anfuehrer"><b>♛ Bestimme deinen Anführer</b> <small>– dein Gegner erfährt nicht, wer es ist.</small><div>${team.map((h, i) => `<button data-arena-anf="${esc(h.held)}" class="${i === anf ? "an" : ""}">${i === anf ? "♛ " : ""}${esc((F.FIGUREN[h.held] || {}).name || h.held)}</button>`).join("")}</div></div>` : ""}
        <p class="note">Jeder Held hat eine Minute Zugzeit.</p>`;
      el.querySelectorAll("[data-arena-anf]").forEach((b) => { b.onclick = () => { anfuehrerMerken(m.id, b.dataset.arenaAnf); zeichneModus(); }; }); };
    zeichneModus();
    Promise.resolve().then(() => {
      return verbinden(m);
    }).catch((e) => { const s = $("#arena-status"); if (s) s.textContent = "Die Verbindung ist fehlgeschlagen: " + e.message; });
  }
  function pollen(ms, fn) { stoppUhr(); Z.uhr = setInterval(() => { if (!document.hidden) Promise.resolve(fn()).catch(() => {}); }, ms); }
  function stoppUhr() { clearInterval(Z.uhr); Z.uhr = null; }

  /* ---------- Verbindung und Kampf ---------- */
  let T = null; // Live-Sitzung nur für diesen Kampf
  const transport = () => (T = T || window.RPGNetz.connect({ gameSlug: new URLSearchParams(location.search).get("liveslug") || "abenteuer", maxPlayers: 2, storeKey: "ab_arena" }));
  async function trennen() { stoppUhr(); const t = T; T = null; if (t && t.session) { try { await t.leave(); } catch (e) { /* schon zu */ } } }
  async function verbinden(m) {
    const t = transport(), status = (s) => { const el = $("#arena-status"); if (el) el.textContent = s; };
    if (m.seite === 1) {
      // Ersteller: Sitzung anlegen, Code hinterlegen, auf den Gegner warten, dann rechnen
      await t.create(m.host.name);
      await rpc("rpg_arena_room", { p_match_id: m.id, p_code: t.session.room_code });
      status("Warte auf " + m.gast.name + " …");
      const los = () => { if (Z.kampf || t.players.length < 2) return; stoppUhr(); kampf(m, t); };
      t.on("players", los); los();
      pollen(4000, async () => { await t.refresh(); los(); const g = await rpc("rpg_arena_get", { p_match_id: m.id }); if (g.status === "abgebrochen" || g.status === "beendet") { await trennen(); Z.match = null; zeigen(); } });
    } else {
      // Beigetretener: warten, bis der Ersteller den Code hinterlegt hat
      const versuch = async () => {
        const g = await rpc("rpg_arena_get", { p_match_id: m.id });
        if (g.status === "abgebrochen" || g.status === "beendet") { await trennen(); Z.match = null; return zeigen(); }
        if (!g.room_code || Z.kampf) return;
        stoppUhr(); await t.join(g.room_code, m.gast.name); kampf(g, t);
      };
      pollen(2500, versuch); await versuch();
    }
  }
  function kampf(m, t) {
    if (Z.kampf) return; const modus = modusVon(m); Z.kampf = { m, gemeldet: false, modus };
    // Vorlauf: Beide lesen Modus und Siegbedingungen (und bestimmen im Königsmord den Anführer), dann geht es los
    const VOR = modus === "koenig" ? 15 : 8; let rest = VOR;
    const zaehl = () => { const el = $("#arena-status"); if (el) el.innerHTML = rest > 0 ? `Der Kampf beginnt in <b>${rest}</b> …` : "Der Kampf beginnt …"; }; zaehl();
    const vorUhr = setInterval(() => { rest--; zaehl(); if (rest <= 0 || !Z.kampf) clearInterval(vorUhr); }, 1000); Z.modus = "kampf";
    const ich = m.seite, uid = t.user && t.user.id;
    F.STUFEN10.aktiv = true;
    const ende = (st) => ergebnisMelden(m, st, t);
    if (ich === 1) {
      const beg = R.BEGEGNUNGEN[m.begegnung] ? m.begegnung : "garten", alt = Math.max(1, Math.min(3, R.BEGEGNUNGEN[beg].stufe || 1));
      let anfGast = 0;
      const neu = () => R.neueArena(m.seed || 1, { modus, anfuehrer: [anfuehrerIdx(m), anfGast], teams: [m.host.team, m.gast.team].map((tm) => tm.map((h) => ({ fid: h.held, stufe: h.stufe }))), namen: [m.host.name, m.gast.name],
        karte: KARTE(m.karte), begegnung: beg, bedrohung: Math.max(0, m.kampfstufe - [1, 3, 6][alt - 1]) });
      let los = false;
      const starte = () => { if (los || !Z.kampf) return; los = true; clearInterval(vorUhr); window.AB.arenaStart({ st: neu(), seite: 1, publish, ende }); };
      // Stand schreiben: immer nur der neueste, nie zwei Schreibvorgänge gleichzeitig
      let schreibt = false, wartend = null;
      const publish = (json) => { wartend = json; if (schreibt) return; schreibt = true;
        const lauf = () => { const j = wartend; wartend = null; j.log = (j.log || []).slice(-140); t.writeOwn("spiel", { arena: true, at: Date.now(), st: j }).catch(() => {}).then(() => { if (wartend) lauf(); else schreibt = false; }); }; lauf(); };
      const erledigt = {};
      t.on("state", (row) => { const k = row.state_key || ""; if (!k.startsWith("zug:")) return; const von = k.slice(4); if (row.updated_by && row.updated_by !== von) return; if (von === uid) return;
        const v = row.state || {}; if (!v.n || v.n <= (erledigt[von] || 0)) return; erledigt[von] = v.n;
        if (v.typ === "anfuehrer") { anfGast = Math.max(0, Math.min(2, Number(v.idx) || 0)); return; }
        if (los) window.AB.arenaWunsch(v); });
      { const da = Object.keys(t.states || {}).find((k) => k.startsWith("zug:") && k.slice(4) !== uid && (t.states[k] || {}).typ === "anfuehrer"); if (da) anfGast = Math.max(0, Math.min(2, Number(t.states[da].idx) || 0)); }
      setTimeout(starte, VOR * 1000);
    } else {
      let n = 0, standDa = false, anfUhr = null;
      const sagAnf = () => { if (standDa || !Z.kampf) return clearInterval(anfUhr); t.writeOwn("zug:" + uid, { typ: "anfuehrer", idx: anfuehrerIdx(m), n: ++n, at: Date.now() }).catch(() => {}); };
      // Der Kampfbildschirm erscheint erst mit dem ersten Stand des Erstellers – bis dahin bleibt die Aufstellung stehen
      const stand = (json) => { if (!Z.kampf) return; if (!standDa) { standDa = true; clearInterval(anfUhr); clearInterval(vorUhr);
          window.AB.arenaStart({ st: null, seite: 2, gast: true, sende: (w) => { t.writeOwn("zug:" + uid, Object.assign({}, w, { n: ++n, at: Date.now() })).catch(() => {}); }, ende }); }
        window.AB.arenaStand(json); };
      t.on("state", (row) => { if (row.state_key === "spiel" && row.state && row.state.arena && row.state.st) stand(row.state.st); });
      const da = t.states && t.states.spiel; if (da && da.st) stand(da.st);
      if (modus === "koenig" && !standDa) { sagAnf(); anfUhr = setInterval(sagAnf, 2000); }
    }
    aufgebenKnopf(m, t);
    // Hat der andere aufgegeben oder die Verbindung verloren?
    pollen(6000, async () => { const g = await rpc("rpg_arena_get", { p_match_id: m.id }); if ((g.status === "beendet" || g.status === "abgebrochen") && !Z.kampf.gemeldet) { Z.kampf.gemeldet = true; ergebnisZeigen(g, t); } });
    t.on("lost", () => { if (Z.kampf && !Z.kampf.gemeldet) rpc("rpg_arena_get", { p_match_id: m.id }).then((g) => { if (g.status === "laeuft") return rpc("rpg_arena_cancel", { p_match_id: m.id }).then((x) => x, () => g); return g; }).then((g) => { if (!Z.kampf || Z.kampf.gemeldet) return; Z.kampf.gemeldet = true; ergebnisZeigen(g, t); }).catch(() => {}); });
  }
  function aufgebenKnopf(m, t) {
    let b = $("#arena-aufgeben"); if (!b) { b = document.createElement("button"); b.id = "arena-aufgeben"; b.className = "btn ghost klein arena-aufgeben"; b.textContent = "Aufgeben"; document.body.appendChild(b); }
    b.hidden = false;
    b.onclick = async () => { if (!confirm("Kampf aufgeben? Dein Gegner gewinnt, und du bekommst keine Belohnung.")) return; b.disabled = true;
      try { const g = await rpc("rpg_arena_cancel", { p_match_id: m.id }); Z.kampf.gemeldet = true; ergebnisZeigen(g, t); } catch (e) { b.disabled = false; } };
  }
  async function ergebnisMelden(m, st, t) {
    if (!Z.kampf || Z.kampf.gemeldet) return; Z.kampf.gemeldet = true; stoppUhr();
    const a = st.arena; if (a.modus) Z.kampf.modus = a.modus; const grund = /am Boden|ist gefallen/.test(a.grund || "") ? "team" : "punkte";
    schirm(`<p class="arena-ende-eyebrow">Der Kampf ist vorbei</p><h1>${a.sieger === m.seite ? "Sieg" : "Niederlage"}</h1><p>Das Ergebnis wird gewertet …</p>`, a.sieger === m.seite);
    let g = null;
    try {
      g = await rpc("rpg_arena_report", { p_match_id: m.id, p_sieger: a.sieger, p_grund: grund, p_punkte: a.punkte, p_runden: st.runde });
      // auf die Meldung der anderen Seite warten (höchstens 20 Sekunden)
      for (let i = 0; i < 10 && g.status === "laeuft"; i++) { await new Promise((r) => setTimeout(r, 2000)); g = await rpc("rpg_arena_get", { p_match_id: m.id }); }
    } catch (e) { g = { status: "fehler", fehler: e.message, seite: m.seite, sieger: a.sieger, punkte: a.punkte, host: m.host, gast: m.gast }; }
    ergebnisZeigen(Object.assign({ punkteLokal: a.punkte }, g), t);
  }

  /* ---------- Ergebnis: Sieg oder Niederlage, Belohnungen, zurück zur Startseite ---------- */
  function schirm(html, sieg) {
    let e = $("#arena-ende"); if (!e) { e = document.createElement("div"); e.id = "arena-ende"; document.body.appendChild(e); }
    e.className = "arena-ende " + (sieg ? "sieg" : "niederlage"); e.hidden = false; e.innerHTML = `<div class="arena-ende-inhalt">${html}</div>`;
    return e;
  }
  async function ergebnisZeigen(g, t) {
    stoppUhr(); const ab = $("#arena-aufgeben"); if (ab) ab.hidden = true; meinMerken(null);
    // Die XP-Einträge kommen je nach Datenbank mit „vorher/stufe/gesamt“ oder „stufe_vorher/stufe_danach“: vereinheitlichen
    if (g.belohnung && g.belohnung.xp && g.belohnung.xp.length) {
      if (sm()) { try { await sm().laden(true); } catch (e) { /* ohne Verbindung: ohne Balken */ } }
      const xpJetzt = (sm() && sm().zustand().xp) || {};
      g.belohnung.xp = g.belohnung.xp.map((h) => ({ held: h.held, xp: h.xp || 0, vorher: h.vorher != null ? h.vorher : h.stufe_vorher || 1, stufe: h.stufe != null ? h.stufe : h.stufe_danach || 1, gesamt: h.gesamt != null ? h.gesamt : xpJetzt[h.held] || 0 }));
    }
    const gewertet = g.status === "beendet", sieg = gewertet ? g.sieger === g.seite : g.sieger === g.seite, b = g.belohnung || null, p = g.punkte || g.punkteLokal || null;
    const xp = b && b.xp && b.xp.length ? `<div class="arena-xp">${b.xp.map((h) => { const d = F.FIGUREN[h.held]; if (!d) return ""; const f = F.stufeAusXp(h.gesamt || 0), auf = h.stufe > h.vorher, voll = !f.bis, pct = voll ? 100 : Math.round(100 * f.xp / f.bis);
      return `<div class="sm-xp-zeile${auf ? " auf" : ""}"><img src="${F.bild(h.held)}" alt=""><div class="sm-xp-mitte"><div class="sm-xp-kopf"><b>${esc(d.name)}</b><span>+${h.xp} XP</span></div><i><u style="width:${pct}%"></u></i><small>${auf ? `<strong>Aufstieg: Stufe ${h.vorher} → ${h.stufe}</strong> · ` : `Stufe ${h.stufe} · `}${voll ? "höchste Stufe erreicht" : `${f.xp} / ${f.bis} XP bis Stufe ${f.stufe + 1}`}</small></div></div>`; }).join("")}</div>` : "";
    const text = g.status === "abgebrochen" ? "Der Kampf wurde ohne Wertung beendet." : g.status === "fehler" ? "Das Ergebnis konnte nicht gemeldet werden: " + esc(g.fehler || "") : g.status === "laeuft" ? "Dein Gegner hat das Ergebnis noch nicht bestätigt. Sobald er es tut, wird gewertet."
      : g.grund === "aufgabe" ? (sieg ? "Dein Gegner hat aufgegeben." : "Du hast aufgegeben.") : g.grund === "team" ? (Z.kampf && Z.kampf.modus === "koenig" ? (sieg ? "Der gegnerische Anführer ist gefallen." : "Dein Anführer ist gefallen.") : sieg ? "Das gegnerische Team liegt am Boden." : "Dein Team liegt am Boden.") : "Nach Punkten entschieden.";
    const lohn = !b ? "" : !b.gewertet ? (g.grund === "aufgabe" && !sieg ? "" : `${b.waehrung ? `<p class="arena-ende-lohn"><i>${ZEICHEN}</i> +${b.waehrung} ${WAEHRUNG}</p>` : ""}<p class="arena-ende-note">Für heute hast du schon fünf gewertete Kämpfe: Erfahrung und Heldenchance gibt es morgen wieder.</p>`)
      : `${b.waehrung ? `<p class="arena-ende-lohn"><i>${ZEICHEN}</i> +${b.waehrung} ${WAEHRUNG}</p>` : ""}${xp}${b.angebot ? `<p class="arena-ende-lohn held">★ Ein neuer Held will sich dir anschließen!</p>` : ""}`;
    const e = schirm(`<p class="arena-ende-eyebrow">${esc(g.host ? g.host.name : "")} gegen ${esc(g.gast ? g.gast.name : "")}</p><h1>${g.status === "abgebrochen" ? "Abgebrochen" : sieg ? "Sieg" : "Niederlage"}</h1>
      ${p ? `<p class="arena-ende-punkte">${p[1] != null ? p[1] : p["1"]} : ${p[2] != null ? p[2] : p["2"]}</p>` : ""}<p>${text}</p>${lohn}
      <div class="knoepfe mitte"><button class="btn gross" id="arena-ende-zu">${b && b.angebot ? "Helden wählen" : "Zur Startseite"}</button></div>`, sieg && g.status !== "abgebrochen");
    $("#arena-ende-zu").onclick = async () => {
      e.hidden = true; e.innerHTML = ""; window.AB.arenaEnde(); Z.kampf = null; Z.match = null; Z.modus = null; await trennen();
      await pruefen(true); if (window.MYTHARA.waehrungZeigen) window.MYTHARA.waehrungZeigen(Z.waehrung);
      if (sm()) await sm().laden(true);
      window.MYTHARA.zeigeHub();
      if (b && b.angebot && sm() && sm().offeneBelohnung) sm().offeneBelohnung(() => window.MYTHARA.zeigeHub());
    };
  }

  window.ARENA = { pruefen, zeigen, waehrung: () => Z.waehrung || 0, WAEHRUNG, ZEICHEN, zustand: () => Z };
})();
