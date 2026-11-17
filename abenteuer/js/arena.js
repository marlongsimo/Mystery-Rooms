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
  /* Welche Arena? Standard ist die Server-Arena: gespeichertes Team, Suche in drei Spielarten, der Server rechnet den Kampf
     (Migration 014 bis 016 und die Edge Function „arena“). Sie gilt für alle, sobald die Datenbank sie kennt – das prüft das Spiel
     beim ersten Öffnen der Arena selbst (artKlaeren). Kennt die Datenbank sie noch nicht, bleibt es bei der früheren Arena.
     Über den Link lässt sich für diesen Tab ausdrücklich wählen:
     …/abenteuer/?arena=liste   – die frühere Arena (Kampf erstellen, Liste, Kampf auf dem Gerät des Erstellers)
     …/abenteuer/?arena=suche   – Suche, aber der Kampf läuft auf dem Gerät des Erstellers
     …/abenteuer/?arena=server  – die Server-Arena, auch wenn die Prüfung sie nicht gefunden hat */
  const WAHL = (() => { let a = ""; const p = new URLSearchParams(location.search).get("arena"), ok = (x) => x === "suche" || x === "server" || x === "liste";
    try { if (ok(p)) sessionStorage.setItem("ab_arena_neu", p); a = sessionStorage.getItem("ab_arena_neu") || ""; if (a === "1") a = "suche"; } catch (e) { a = ok(p) ? p : ""; } return ok(a) ? a : null; })();
  let ART = WAHL || "liste", NEU = ART === "suche" || ART === "server", SERVER = ART === "server", artGeklaert = Boolean(WAHL);
  const artSetzen = (a) => { ART = a; NEU = a === "suche" || a === "server"; SERVER = a === "server"; };
  /** Ohne ausdrückliche Wahl: Kennt die Datenbank die Server-Arena mit ihren Spielarten (Migration 016)? Dann gilt sie. */
  async function artKlaeren() {
    if (artGeklaert) return; 
    try { await rpc("rpg_arena_invites", {}); artSetzen("server"); artGeklaert = true; }
    catch (e) { if (fehlt(e)) { artSetzen("liste"); artGeklaert = true; } /* sonst (keine Verbindung): beim nächsten Öffnen noch einmal prüfen */ }
  }
  const stufe = (fid) => { const p = sm() && sm().fortschritt ? sm().fortschritt(fid) : null; return p ? p.stufe : 1; };

  // Z: Zustand der Arena-Seite
  const Z = { da: null, liste: null, match: null, fehler: "", laedt: false, wahl: [], modus: null, ziel: null, uhr: null, kampf: null };
  /* Spielmodi: Welcher gespielt wird, entscheidet das Los */
  const MODI = {
    arena: { name: "Arena", kurz: "Das klassische Duell um Punkte.", lang: "Zwei Teams, ein paar Monster dazwischen. Wer mehr Punkte sammelt, gewinnt.",
      ziel: ["Bringe alle drei gegnerischen Helden zu Boden – dann hast du sofort gewonnen.", "Sonst entscheiden nach 15 Runden die Punkte: 5 je gefälltem Helden, 1 je Monster, 2 je Anführer-Monster."] },
    duell: { name: "Duell", kurz: "Drei gegen drei. Keine Monster.", lang: "Nur ihr beide und eure Helden. Kein Monster mischt sich ein.",
      ziel: ["Bringe alle drei gegnerischen Helden zu Boden – dann hast du sofort gewonnen.", "Sonst entscheiden nach 15 Runden die Punkte: 5 je gefälltem Helden."] },
    koenig: { name: "Königsmord", kurz: "Jeder hat einen geheimen Anführer. Fällt er, ist alles verloren.", lang: "Vor dem Start bestimmst du verdeckt einen deiner Helden zum Anführer. Dein Gegner weiß nicht, wer es ist.",
      ziel: ["Bringe den gegnerischen Anführer zu Boden – dann hast du sofort gewonnen.", "Fällt dein eigener Anführer, hast du sofort verloren.", "Sonst entscheiden nach 15 Runden die Punkte."] },
    horde: { name: "Die Horde", kurz: "Jede Runde kommen neue, stärkere Monster.", lang: "Jede Runde erscheinen neue Monster, gleich weit von beiden Teams entfernt, und sie werden mit jeder Runde stärker.",
      ziel: ["Liegt ein Team ganz am Boden – durch Monster oder Gegner –, gewinnt das andere.", "Sonst entscheiden nach 30 Runden die Punkte."] } };
  const LOS = ["arena", "koenig", "horde", "duell"]; // Reihenfolge wie in rpg_arena_modus (Migration 010)
  const modusVon = (m) => { const fest = new URLSearchParams(location.search).get("arenamodus"); if (MODI[fest]) return fest;
    if (m && Z.festModus && Z.festModus.id === m.id && MODI[Z.festModus.modus]) return Z.festModus.modus; // Serverkampf: Der Modus steht am Kampf
    return m && m.seed != null && isFinite(Number(m.seed)) ? LOS[Math.abs(Math.trunc(Number(m.seed))) % LOS.length] : "arena"; };
  const modusHtml = (k, gross) => `<div class="arena-modus-karte${gross ? " gross" : ""}"><h3>${MODI[k].name}</h3><p>${MODI[k].lang}</p><b>So gewinnst du</b><ul>${MODI[k].ziel.map((z) => `<li>${z}</li>`).join("")}</ul></div>`;
  // Der eigene Anführer (Königsmord) wird nur auf diesem Gerät gemerkt
  const anfuehrerMerken = (id, fid) => { try { localStorage.setItem("ab_arena_anf", JSON.stringify({ id, fid })); } catch (e) { /* privat */ } };
  const anfuehrerIdx = (m) => { let fid = null; try { const o = JSON.parse(localStorage.getItem("ab_arena_anf") || "null"); if (o && o.id === m.id) fid = o.fid; } catch (e) { /* privat */ }
    const team = (m.seite === 1 ? m.host : m.gast).team || []; return Math.max(0, team.findIndex((h) => h.held === fid)); };
  const seiteOffen = () => { const s = $("#hub-seite"); return Boolean(s && !s.hidden && s.querySelector("[data-arena]")); };

  /** Gibt es die Arena in der Datenbank, und wie viel Währung hat das Konto? Ergebnis wird gemerkt. */
  /** Läuft für dieses Konto gerade ein Arena-Kampf (schon begonnen)? Für den Wiedereinstieg nach dem Schließen des Fensters */
  async function laufend() { try { await laden(); } catch (e) { return false; } return Boolean(Z.match && Z.match.status === "laeuft"); }
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
      if (r && r.konto && window.ABRANG) { await window.ABRANG.laden(true).catch(() => null); window.ABRANG.kopf(); } // Ranked (Migration 022); ohne sie bleibt die Arena wie bisher
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
    if (Z.liste && Z.liste.konto) await artKlaeren();
    if (!seiteOffen()) return;
    if (Z.match && Z.match.status !== "offen") return aufstellung(Z.match);
    if (NEU) return zeigenNeu();
    zeichneListe();
    if (Z.match) pollen(8000, async () => { await laden(); if (Z.match && Z.match.status !== "offen") return aufstellung(Z.match); if (seiteOffen() && !Z.modus) zeichneListe(); });
  }
  /** Tagesgrenze erreicht? Dann steht die Warnung schon in der Arena, nicht erst nach dem Kampf */
  const grenzeHtml = () => "";   // seit Migration 025 gibt es in der Arena keine Tagesgrenze mehr
  function zeichneListe() {
    const L = Z.liste || {}, offen = L.offen || [], m = Z.match;
    if (!L.konto) return seite(`<h1 class="hub-gruss">Arena</h1><p class="hub-untertitel">${esc(Z.fehler || "Die Arena gibt es nur mit einem Spielerkonto: Hier treten deine eigenen Helden mit ihren Stufen an.")}</p>`);
    const eigene = sm().zustand().helden.length;
    seite(`<div class="arena-kopf"><div><h1 class="hub-gruss">Arena</h1><p class="hub-untertitel">Du gegen einen anderen Spieler, jeder mit drei Helden. Dazwischen ein paar Monster.</p></div>
        <div class="arena-kopf-rechts">${waehrungHtml()}<button class="btn ghost klein arena-info-knopf" id="arena-info" aria-label="Regeln und Modi" title="Regeln und Modi">i</button><button class="btn ghost klein" id="arena-neu-laden">↻ Aktualisieren</button></div></div>
      ${grenzeHtml()}
      <p class="note">Ein Sieg bringt ${Z.modiDa ? "5 bis 25" : "25"} ${WAEHRUNG}, Erfahrung für deine Helden und mit etwas Glück einen neuen Helden.</p>
      <div class="arena-info" id="arena-info-text" ${Z.infoAuf ? "" : "hidden"}>
        <h2>So läuft ein Kampf</h2>
        <ul><li>Du wählst drei deiner Helden. Die Durchschnittsstufen beider Teams dürfen höchstens eine Stufe auseinanderliegen.</li>
          <li>Karte, Monster und <b>Modus werden ausgelost</b>. Vor dem Start siehst du, welcher Modus gespielt wird und wie man gewinnt.</li>
          <li>Jeder Held hat <b>eine Minute Zugzeit</b>. Läuft sie ab, endet sein Zug.</li>
          <li>Kontrollzauber wirken gegen Helden höchstens eine Runde; danach ist der Held zwei Runden dagegen gefeit.</li>
          <li>Belohnung: Erfahrung für deine Helden (bei einer Niederlage ein Drittel), bei einem Sieg ${Z.modiDa ? "5 bis 25" : "25"} ${WAEHRUNG} und mit etwas Glück ein neuer Held. Eine Tagesgrenze gibt es nicht.</li></ul>
        <h2>Die Modi</h2><div class="arena-modus-reihe vier">${LOS.map((k) => modusHtml(k)).join("")}</div></div>
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

  /* ---------- Neue Arena: Mein Team und Gegnersuche ---------- */
  async function zeigenNeu() {
    // In der neuen Arena wartet kein Kampf im Hintergrund: Ein übrig gebliebener Sucheintrag (Tab geschlossen, neu geladen) wird ausgetragen
    if (Z.match && Z.match.status === "offen") { try { await rpc("rpg_arena_cancel", { p_match_id: Z.match.id }); } catch (e) { /* schon weg */ } Z.match = null; meinMerken(null); }
    Z.teamFehlt = false;
    try { Z.team = await rpc("rpg_arena_squad", {}); } catch (e) { Z.team = null; if (fehlt(e)) Z.teamFehlt = true; else Z.fehler = e.message; }
    if (seiteOffen()) zeichneNeu();
  }
  /** Ranked (js/rang.js) – nur, wenn die Datenbank es kennt und eine Saison da ist */
  const RG = () => (window.ABRANG && window.ABRANG.da() ? window.ABRANG : null);
  function zeichneNeu() {
    const L = Z.liste || {};
    if (!L.konto) return seite(`<h1 class="hub-gruss">Arena</h1><p class="hub-untertitel">${esc(Z.fehler || "Die Arena gibt es nur mit einem Spielerkonto: Hier treten deine eigenen Helden mit ihren Stufen an.")}</p>`);
    const eigene = sm().zustand().helden.length, t = Z.team && Z.team.team ? Z.team : null;
    const held = (h) => { const d = F.FIGUREN[h.held] || { name: h.held, klasse: "krieger" };
      return `<div class="arena-held fest" style="--k:${F.KLASSEN[d.klasse].farbe}"><img src="${F.bild(h.held)}" alt=""><b>${esc(d.name)}</b>${F.meistertitel(h.held, h.stufe) ? `<small class="meister">♛ ${esc(F.meistertitel(h.held, h.stufe))}</small>` : ""}<em>Stufe ${h.stufe}</em></div>`; };
    const leer = `<div class="arena-held fest leer"><span>?</span><b>frei</b><em>&nbsp;</em></div>`;
    const infoBlock = `<div class="arena-info" id="arena-info-text" ${Z.infoAuf ? "" : "hidden"}>
        <h2>So läuft ein Kampf</h2>
        <ul><li>Du legst einmal dein Team aus drei Helden fest. Es gilt für jeden Kampf, bis du es änderst.</li>
          <li>„Gegner suchen“ verbindet dich mit einem anderen Suchenden, dessen Durchschnittsstufe höchstens eine Stufe von deiner entfernt ist.</li>
          ${SERVER ? `<li><b>Normal</b> ist immer ein Duell. In <b>Arcade</b> wird zwischen Arena, Königsmord und Horde gelost. Im <b>privaten Kampf</b> forderst du einen Freund heraus und wählst den Modus; er zählt nicht für Belohnungen und kennt keine Stufengrenze.</li>
          <li>Die Karte wird ausgelost. Vor dem Start siehst du, welcher Modus gespielt wird und wie man gewinnt.</li>` : `<li>Karte, Monster und <b>Modus werden ausgelost</b>. Vor dem Start siehst du, welcher Modus gespielt wird und wie man gewinnt.</li>`}
          <li>Jeder Held hat <b>eine Minute Zugzeit</b>. Läuft sie ab, endet sein Zug.</li>
          <li>Kontrollzauber wirken gegen Helden höchstens eine Runde; danach ist der Held zwei Runden dagegen gefeit.</li>
          <li>Belohnung: Erfahrung für deine Helden (bei einer Niederlage ein Drittel), bei einem Sieg ${Z.modiDa ? "5 bis 25" : "25"} ${WAEHRUNG} und mit etwas Glück ein neuer Held. Eine Tagesgrenze gibt es nicht.</li></ul>
        <h2>Die Modi</h2><div class="arena-modus-reihe vier">${LOS.map((k) => modusHtml(k)).join("")}</div></div>`;
    // Mit Ranked (Migration 022): kurze Seite mit drei Reitern – Ranked · Fun · Rangliste. Das Team steckt hinter einem Knopf oben rechts.
    if (SERVER && RG()) {
      const rg = RG(), tab = ["ranked", "fun", "rangliste"].includes(Z.reiter) ? Z.reiter : "ranked", ruft = Boolean(Z.einl && (Z.einl.an_mich || []).length);
      const inhalt = tab === "ranked" ? rg.karteHtml(Boolean(t)) + rg.reiterHtml()
        : tab === "rangliste" ? `<div class="arena-rangliste">${rg.ranglisteHtml()}</div>`
        : `<div id="arena-einladungen"></div><div class="arena-arten">
            <button class="arena-art" data-arena-art="normal" ${t ? "" : "disabled"}><b>⚔ Normal</b><span>Duell: drei gegen drei, keine Monster.</span><em>Gegner suchen</em></button>
            <button class="arena-art" data-arena-art="arcade" ${t ? "" : "disabled"}><b>🎲 Arcade</b><span>Arena, Königsmord oder Horde – das Los entscheidet.</span><em>Gegner suchen</em></button>
            <button class="arena-art privat" id="arena-privat" ${t ? "" : "disabled"}><b>♟ Privater Kampf</b><span>Fordere einen Freund heraus und wähle den Modus. Ohne Wertung.</span><em>Freund einladen</em></button></div>
          <p class="note">${t ? `Normal und Arcade: Gegner mit Durchschnittsstufe ${komma(Math.max(1, t.schnitt - 1))} bis ${komma(Math.min(10, Number(t.schnitt) + 1))}. ` : ""}Ohne Rangpunkte – Erfahrung und ${WAEHRUNG} gibt es wie in Ranked.</p>`;
      seite(`<div class="arena-kopf kurz"><h1 class="hub-gruss">Arena</h1>
          <div class="arena-kopf-rechts">${waehrungHtml()}<button class="btn ${t ? "ghost" : ""} klein arena-team-knopf" id="arena-team-aendern" ${eigene < 3 || Z.teamFehlt ? "disabled" : ""} title="${t ? esc(t.team.map((h) => (F.FIGUREN[h.held] || { name: h.held }).name + " (Stufe " + h.stufe + ")").join(", ")) : "Team festlegen"}">👥 Mein Team${t ? ` <small>Ø ${komma(t.schnitt)}</small>` : ""}</button>
            <button class="btn ghost klein arena-info-knopf" id="arena-info" aria-label="Regeln und Modi" title="Regeln und Modi">i</button></div></div>
        ${grenzeHtml()}
        ${Z.fehler ? `<p class="fb">${esc(Z.fehler)}</p>` : ""}
        ${t ? "" : `<p class="arena-ohne-team">${eigene < 3 ? "Du brauchst mindestens drei Helden in deiner Sammlung." : `Lege zuerst dein Team aus drei Helden fest. <button class="btn klein" data-team-auf>Team festlegen</button>`}</p>`}
        <nav class="admin-tabs arena-tabs" aria-label="Arena"><button data-arena-tab="ranked" class="${tab === "ranked" ? "an" : ""}">Ranked</button><button data-arena-tab="fun" class="${tab === "fun" ? "an" : ""}">Fun${ruft ? ` <i class="arena-punkt" title="Einladung"></i>` : ""}</button><button data-arena-tab="rangliste" class="${tab === "rangliste" ? "an" : ""}">Rangliste</button></nav>
        <div class="arena-tab" data-tab="${tab}">${inhalt}</div>
        ${infoBlock}`);
    } else
    seite(`<div class="arena-kopf"><div><h1 class="hub-gruss">Arena</h1><p class="hub-untertitel">Du gegen einen anderen Spieler, jeder mit drei Helden.</p></div>
        <div class="arena-kopf-rechts">${waehrungHtml()}<button class="btn ghost klein arena-info-knopf" id="arena-info" aria-label="Regeln und Modi" title="Regeln und Modi">i</button></div></div>
      ${grenzeHtml()}
      ${Z.teamFehlt ? `<p class="fb">Die neue Arena ist in der Datenbank noch nicht eingerichtet (Migration 014 fehlt).</p>` : ""}
      ${Z.fehler ? `<p class="fb">${esc(Z.fehler)}</p>` : ""}
      ${SERVER && RG() ? RG().karteHtml(Boolean(t)) : ""}
      <div class="arena-team mein arena-meinteam"><h3>Mein Team${t ? `<span>Ø ${komma(t.schnitt)}</span>` : ""}</h3>
        <div class="arena-team-helden">${t ? t.team.map(held).join("") : leer + leer + leer}</div>
        <div class="arena-meinteam-fuss"><small>${t ? "Mit diesen drei Helden trittst du in jedem Kampf an, bis du das Team änderst." : eigene < 3 ? "Du brauchst mindestens drei Helden in deiner Sammlung." : "Lege fest, mit welchen drei Helden du in der Arena antrittst."}</small>
          <button class="btn ${t ? "ghost" : ""} klein" id="arena-team-aendern" ${eigene < 3 || Z.teamFehlt ? "disabled" : ""}>${t ? "Team bearbeiten" : "Team festlegen"}</button></div></div>
      ${SERVER ? `<div id="arena-einladungen"></div>
      ${RG() ? `<h3 class="arena-zwischen">Weitere Spielarten</h3>` : ""}
      <div class="arena-arten">
        <button class="arena-art" data-arena-art="normal" ${t ? "" : "disabled"}><b>⚔ Normal</b><span>Duell: drei gegen drei, keine Monster.</span><em>Gegner suchen</em></button>
        <button class="arena-art" data-arena-art="arcade" ${t ? "" : "disabled"}><b>🎲 Arcade</b><span>Arena, Königsmord oder Horde – das Los entscheidet.</span><em>Gegner suchen</em></button>
        <button class="arena-art privat" id="arena-privat" ${t ? "" : "disabled"}><b>♟ Privater Kampf</b><span>Fordere einen Freund heraus und wähle den Modus. Ohne Wertung.</span><em>Freund einladen</em></button>
      </div>${RG() ? RG().reiterHtml() : ""}` : `<div class="knoepfe arena-suchknopf"><button class="btn gross" id="arena-suchen" ${t ? "" : "disabled"}>⚔ Gegner suchen</button></div>`}
      <p class="note">${t ? `Gesucht wird ein Gegner mit Durchschnittsstufe ${komma(Math.max(1, t.schnitt - 1))} bis ${komma(Math.min(10, Number(t.schnitt) + 1))}. ` : ""}Ein Sieg bringt ${Z.modiDa ? "5 bis 25" : "25"} ${WAEHRUNG}, Erfahrung für deine Helden und mit etwas Glück einen neuen Helden.</p>
      ${infoBlock}`);
    Z.fehler = "";
    const inf = $("#arena-info"); if (inf) inf.onclick = () => { Z.infoAuf = !Z.infoAuf; $("#arena-info-text").hidden = !Z.infoAuf; };
    const ta = $("#arena-team-aendern"); if (ta) ta.onclick = () => heldenWahl({ titel: "Mein Team", knopf: "Team speichern", vorwahl: t ? t.team.map((h) => h.held) : [],
      fertig: async (team) => { Z.team = await rpc("rpg_arena_squad_set", { p_team: team }); Z.modus = null; zeigen(); } });
    const su = $("#arena-suchen"); if (su) su.onclick = () => suchen();
    document.querySelectorAll("[data-arena-tab]").forEach((b) => { b.onclick = () => { Z.reiter = b.dataset.arenaTab; zeichneNeu(); }; });
    { const auf = document.querySelector("[data-team-auf]"); if (auf && ta) auf.onclick = () => ta.click(); }
    if (RG()) RG().binden();
    document.querySelectorAll("[data-arena-art]").forEach((b) => { b.onclick = () => suchen(b.dataset.arenaArt); });
    const pv = $("#arena-privat"); if (pv) pv.onclick = () => privatWahl();
    if (SERVER) { einladungenZeigen(); pollen(5000, async () => { if (!seiteOffen() || Z.modus) return stoppUhr(); try { Z.einl = await rpc("rpg_arena_invites", {}); } catch (e) { if (fehlt(e)) { Z.einl = null; stoppUhr(); } } einladungenZeigen(); });
      rpc("rpg_arena_invites", {}).then((e) => { Z.einl = e; einladungenZeigen(); }, () => {}); }
  }
  /** Einladungen von Freunden zu einem privaten Kampf (über der Auswahl der Spielart) */
  function einladungenZeigen() {
    { const fun = document.querySelector('[data-arena-tab="fun"]'), n = ((Z.einl && Z.einl.an_mich) || []).length; if (fun && Boolean(fun.querySelector(".arena-punkt")) !== Boolean(n)) fun.innerHTML = "Fun" + (n ? ' <i class="arena-punkt" title="Einladung"></i>' : ""); }
    const el = $("#arena-einladungen"); if (!el) return; const l = (Z.einl && Z.einl.an_mich) || [], team = Z.team && Z.team.team;
    const einlHtml = l.map((e) => `<div class="arena-einladung">${bildVon(e.von)}<div><b>${esc(e.von)} fordert dich heraus</b><small>Privater Kampf · ${esc((MODI[e.modus] || {}).name || e.modus)} · ohne Wertung</small></div>
      <span><button class="btn klein" data-einl-ja="${esc(e.id)}" ${team ? "" : "disabled"}>Annehmen</button><button class="btn ghost klein" data-einl-nein="${esc(e.id)}">Ablehnen</button></span></div>`).join("") + (l.length && !team ? `<p class="note">Lege zuerst dein Team fest, dann kannst du annehmen.</p>` : "");
    if (el.dataset.h !== einlHtml) { el.dataset.h = einlHtml; el.innerHTML = einlHtml; if (kos()) kos().schmuecken(el); }
    el.querySelectorAll("[data-einl-ja]").forEach((b) => { b.onclick = async () => { b.disabled = true; stoppUhr();
      try { const m = await rpc("rpg_arena_invite_answer", { p_id: b.dataset.einlJa, p_accept: true }); if (m) { Z.match = m; meinMerken(m.id); return aufstellung(m); } } catch (e) { Z.fehler = e.message; } zeigen(); }; });
    el.querySelectorAll("[data-einl-nein]").forEach((b) => { b.onclick = async () => { b.disabled = true; try { await rpc("rpg_arena_invite_answer", { p_id: b.dataset.einlNein, p_accept: false }); } catch (e) { /* schon weg */ }
      if (Z.einl) Z.einl.an_mich = (Z.einl.an_mich || []).filter((x) => x.id !== b.dataset.einlNein); einladungenZeigen(); }; });
  }
  /** Privater Kampf: Modus wählen, Freund einladen */
  async function privatWahl(modus) {
    stoppUhr(); Z.modus = "privat"; const gewaehlt = MODI[modus] ? modus : "duell";
    let freunde = null, fehlerText = "";
    try { const d = await rpc("rpg_my_friends", {}); freunde = (d && d.freunde) || []; } catch (e) { fehlerText = e.message; freunde = []; }
    if (!seiteOffen() || Z.modus !== "privat") return;
    seite(`<h1 class="hub-gruss">Privater Kampf</h1><p class="hub-untertitel">Wähle den Modus und fordere einen Freund heraus. Ohne Wertung, ohne Stufengrenze.</p>
      ${Z.fehler || fehlerText ? `<p class="fb">${esc(Z.fehler || fehlerText)}</p>` : ""}
      <h2 class="hub-zwischen">Modus</h2>
      <div class="arena-modus-wahl">${LOS.slice().sort((a, b) => (a === "duell" ? -1 : b === "duell" ? 1 : 0)).map((k) => `<button class="arena-modus-knopf ${k === gewaehlt ? "an" : ""}" data-privat-modus="${k}"><b>${MODI[k].name}</b><span>${MODI[k].kurz}</span></button>`).join("")}</div>
      <h2 class="hub-zwischen">Freund</h2>
      ${freunde.length ? `<ul class="arena-liste">${freunde.map((f) => `<li>${bildVon(f.handle)}<div><b>${esc(f.handle)}</b></div><button class="btn klein" data-privat-freund="${esc(f.handle)}">Einladen</button></li>`).join("")}</ul>`
        : `<p class="note">Du hast noch keine Freunde in deiner Liste. In der Taverne kannst du Spieler suchen und als Freunde hinzufügen.</p>`}
      <div class="knoepfe"><button class="btn ghost" id="arena-privat-zurueck">Zurück</button></div>`);
    Z.fehler = "";
    if (kos()) kos().schmuecken($("[data-arena]"));
    document.querySelectorAll("[data-privat-modus]").forEach((b) => { b.onclick = () => { document.querySelectorAll("[data-privat-modus]").forEach((x) => x.classList.toggle("an", x === b)); }; });
    const mod = () => { const an = document.querySelector("[data-privat-modus].an"); return an ? an.dataset.privatModus : "duell"; };
    document.querySelectorAll("[data-privat-freund]").forEach((b) => { b.onclick = async () => { b.disabled = true; const m = mod(), name = b.dataset.privatFreund;
      try { const id = await rpc("rpg_arena_invite", { p_handle: name, p_modus: m }); einladungWarten(id, name, m); } catch (e) { Z.fehler = fehlt(e) ? "Private Kämpfe sind in der Datenbank noch nicht eingerichtet (Migration 016 fehlt)." : e.message; privatWahl(m); } }; });
    $("#arena-privat-zurueck").onclick = zeigen;
  }
  /** Warten, bis der Freund annimmt oder ablehnt (das Nachfragen ist zugleich das Lebenszeichen der Einladung) */
  function einladungWarten(id, name, modus) {
    stoppUhr(); Z.modus = "einladung"; const seit = Date.now(); let vorbei = false, laeuft = false;
    seite(`<div class="arena-suche" role="status" aria-live="polite">
        <div class="arena-suche-ring"><i></i><i></i><span>♟</span></div>
        <h1 class="hub-gruss">Warte auf ${esc(name)} …</h1>
        <p class="hub-untertitel">Privater Kampf · ${esc(MODI[modus].name)} · <span id="arena-suche-zeit">0:00</span></p>
        <p class="note" id="arena-suche-text">${esc(name)} sieht deine Einladung in der Arena. Lass diese Seite offen.</p>
        <div class="knoepfe"><button class="btn ghost" id="arena-suche-ab">Einladung zurückziehen</button></div></div>`);
    const zurueck = async (meldung) => { if (vorbei) return; vorbei = true; stoppUhr(); clearInterval(takt); try { await rpc("rpg_arena_invite_cancel", { p_id: id }); } catch (e) { /* schon beantwortet */ } Z.modus = null; if (meldung !== false) { Z.fehler = meldung || ""; privatWahl(modus); } };
    const takt = setInterval(() => { const e = $("#arena-suche-zeit"); if (!e || Z.modus !== "einladung") { clearInterval(takt); if (!vorbei) zurueck(false); return; } const s = Math.floor((Date.now() - seit) / 1000); e.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }, 1000);
    const fragen = async () => {
      if (laeuft || vorbei) return; if (!seiteOffen() || Z.modus !== "einladung") return zurueck(false);
      laeuft = true;
      try { const d = await rpc("rpg_arena_invites", {}), e = d && d.von_mir; if (vorbei) return;
        if (e && e.id === id && e.status === "angenommen" && e.kampf) { vorbei = true; stoppUhr(); clearInterval(takt); Z.match = e.kampf; meinMerken(e.kampf.id); return aufstellung(e.kampf); }
        if (e && e.id === id && e.status === "abgelehnt") return zurueck(`${name} hat abgelehnt.`);
        if (!e || e.id !== id || e.status === "zurueck") return zurueck("Die Einladung gilt nicht mehr.");
        if (Date.now() - seit > 10 * 60000) return zurueck(`${name} hat nicht geantwortet.`);
      } catch (e) { /* nächster Versuch */ } finally { laeuft = false; }
    };
    $("#arena-suche-ab").onclick = () => { $("#arena-suche-ab").disabled = true; zurueck(""); };
    fragen(); pollen(3000, fragen);
  }
  /** Suchbildschirm: fragt alle paar Sekunden nach (das ist zugleich das Lebenszeichen), bis ein Gegner gefunden ist oder abgebrochen wird */
  function suchen(art) {
    stoppUhr(); Z.modus = "suche"; Z.fehler = ""; const t = Z.team, seit = Date.now(); let laeuft = false, vorbei = false, alt = false; // alt: Datenbank ohne Migration 016 → bisherige Server-Suche
    const zeit = () => { const s = Math.floor((Date.now() - seit) / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
    seite(`<div class="arena-suche" role="status" aria-live="polite">
        <div class="arena-suche-ring"><i></i><i></i><span>⚔</span></div>
        <h1 class="hub-gruss">${art === "ranked" ? "Ranked: Suche nach einem Gegner in deinem Rang …" : art === "normal" ? "Normal: Suche nach einem Duell …" : art === "arcade" ? "Arcade: Suche nach einem Gegner …" : "Suche nach einem Gegner …"}</h1>
        <p class="hub-untertitel">${art === "ranked" && RG() ? `${RG().emblem((RG().stand().ich || {}).rang, "mini")} ${RG().info((RG().stand().ich || {}).rang).name}` : `Durchschnittsstufe ${komma(Math.max(1, t.schnitt - 1))} bis ${komma(Math.min(10, Number(t.schnitt) + 1))}`} · <span id="arena-suche-zeit">0:00</span></p>
        <div class="arena-suche-team">${t.team.map((h) => `<img src="${F.bild(h.held)}" alt="${esc((F.FIGUREN[h.held] || {}).name || h.held)}">`).join("")}</div>
        <p class="note" id="arena-suche-text">${art === "ranked" ? "Gesucht wird in deinem Rang; nach 25 Sekunden auch einen Rang darüber oder darunter. Lass diese Seite offen." : "Sobald ein anderer Spieler mit passender Stufe sucht, werdet ihr verbunden. Lass diese Seite offen."}</p>
        <div class="knoepfe"><button class="btn ghost" id="arena-suche-ab">Abbrechen</button></div></div>`);
    const ende = async (zurueck) => { if (vorbei) return; vorbei = true; stoppUhr(); clearInterval(takt);
      const m = Z.match; if (m && m.status === "offen") { try { await rpc("rpg_arena_cancel", { p_match_id: m.id }); } catch (e) { /* schon weg */ } }
      Z.match = null; meinMerken(null); Z.modus = null; if (zurueck) zeigen(); };
    const takt = setInterval(() => { const e = $("#arena-suche-zeit"); if (!e || Z.modus !== "suche") { clearInterval(takt); if (!vorbei) ende(false); return; } e.textContent = zeit(); }, 1000);
    const fragen = async () => {
      if (laeuft || vorbei) return; if (!seiteOffen() || Z.modus !== "suche") return ende(false);
      laeuft = true;
      try {
        let m = null;
        if (SERVER && art === "ranked") m = await rpc("rpg_ranked_queue", {});
        else if (SERVER && art && !alt) { try { m = await rpc("rpg_arena_queue", { p_art: art }); } catch (e) { if (!fehlt(e)) throw e; alt = true; } }
        if (!m) m = await rpc(SERVER ? "rpg_arena_search_server" : "rpg_arena_search", {});
        if (vorbei) { if (m && m.status === "offen") rpc("rpg_arena_cancel", { p_match_id: m.id }).catch(() => {}); return; }
        Z.match = m; meinMerken(m && m.id);
        if (m && m.status !== "offen") { vorbei = true; stoppUhr(); clearInterval(takt); return aufstellung(m); }
        if (art !== "ranked" && Date.now() - seit > 60000) { const e = $("#arena-suche-text"); if (e) e.textContent = "Gerade sucht niemand mit passender Stufe. Du kannst weiter warten oder es später noch einmal versuchen."; }
      } catch (e) { vorbei = true; stoppUhr(); clearInterval(takt); Z.modus = null; Z.fehler = fehlt(e) ? `Die Gegnersuche ist in der Datenbank noch nicht eingerichtet (Migration ${SERVER ? "015" : "014"} fehlt).` : e.message; zeichneNeu(); }
      finally { laeuft = false; }
    };
    $("#arena-suche-ab").onclick = () => { $("#arena-suche-ab").disabled = true; ende(true); };
    fragen(); pollen(3000, fragen);
  }

  /* ---------- Heldenwahl: drei eigene Helden, oben der Schnitt ---------- */
  function heldenWahl(o) {
    stoppUhr(); Z.modus = "wahl"; Z.wahl = (o.vorwahl || []).filter((f) => sm().zustand().helden.includes(f)).slice(0, 3); Z.fehler = "";
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
      document.querySelectorAll("[data-arena-held]").forEach((b) => { b.onclick = () => { const f = b.dataset.arenaHeld; if (Z.wahl.includes(f)) Z.wahl = Z.wahl.filter((x) => x !== f); else if (Z.wahl.length < 3) Z.wahl.push(f);
        // neu zeichnen, ohne dass die Seite nach oben springt
        const y = window.scrollY, x = window.scrollX; zeichne(); window.scrollTo(x, y); }; });
      $("#arena-wahl-zurueck").onclick = zeigen;
      $("#arena-wahl-ok").onclick = async () => { $("#arena-wahl-ok").disabled = true; try { await o.fertig(Z.wahl.slice()); } catch (e) { Z.fehler = e.message; zeichne(); } };
    };
    zeichne();
  }
  async function erstellen(team) { Z.match = await rpc("rpg_arena_create", { p_team: team }); meinMerken(Z.match && Z.match.id); Z.modus = null; await zeigen(); }
  async function beitreten(id, team) { const m = await rpc("rpg_arena_join", { p_match_id: id, p_team: team }); Z.match = m; meinMerken(m && m.id); Z.modus = null; aufstellung(m); }

  /* ---------- Aufstellung beider Seiten, dann der Kampf ---------- */
  const KARTE = (k) => (k === "garten" ? R.KARTE_GARTEN : ((window.ABD_ALLE || {}).grauwacht || { KARTEN: {} }).KARTEN[String(k || "").toUpperCase()]) || R.KARTE_GARTEN;
  const kos = () => window.ABKOS, bildVon = (name, klasse) => (kos() ? kos().traeger(name, klasse) : "");
  const teamHtml = (t, name, mein, seiteNr) => `<div class="arena-team ${mein ? "mein" : "gegner"}" data-team-seite="${seiteNr || ""}"><h3>${bildVon(name)}<b class="arena-team-name">${esc(name)}${mein ? " (du)" : ""}</b><span>Ø ${komma(t.schnitt)}</span></h3><div class="arena-team-helden">${t.team.map((h) => { const d = F.FIGUREN[h.held] || { name: h.held, klasse: "krieger" };
    return `<div class="arena-held fest" style="--k:${F.KLASSEN[d.klasse].farbe}"><img src="${F.bild(h.held)}" alt=""><b>${esc(d.name)}</b>${F.meistertitel(h.held, h.stufe) ? `<small class="meister">♛ ${esc(F.meistertitel(h.held, h.stufe))}</small>` : ""}<em>Stufe ${h.stufe}</em></div>`; }).join("")}</div></div>`;
  /** Rang beider Seiten in der Aufstellung (Migration 024); fehlt die Funktion oder läuft keine Saison, bleibt die Zeile weg */
  const rangMerk = {};
  async function raengeZeigen(m) {
    const RGm = RG(); if (!SERVER || !RGm || !m || !m.id || rangMerk[m.id] === false) return;
    const setzen = (d) => { if (!d || !d.da || !Z.match || Z.match.id !== m.id) return; [[1, d.host], [2, d.gast]].forEach(([nr, rang]) => { const h = document.querySelector(`.arena-team[data-team-seite="${nr}"] h3`);
      if (!h || rang == null || h.querySelector(".arena-team-rang")) return; const n = h.querySelector(".arena-team-name"); if (!n) return;
      n.insertAdjacentHTML("beforeend", `<small class="arena-team-rang" data-rang="${rang}">${RGm.emblem(rang, "mini")}<span>${esc(RGm.info(rang).name)}</span></small>`); }); };
    if (rangMerk[m.id]) return setzen(rangMerk[m.id]);
    try { const d = await rpc("rpg_ranked_gegenueber", { p_match_id: m.id }); rangMerk[m.id] = d && d.da ? d : false; setzen(d); } catch (e) { rangMerk[m.id] = false; }
  }
  function aufstellung(m) {
    stoppUhr(); Z.modus = "aufstellung"; Z.match = m;
    const ich = m.seite, karte = KARTE(m.karte), beg = (R.BEGEGNUNGEN[m.begegnung] || {}).name || "Monster";
    seite(`<h1 class="hub-gruss">Die Aufstellung</h1><p class="hub-untertitel">${esc(karte.name || "Arena")} · ${esc(beg)} · Kampfstufe ${m.kampfstufe}</p>
      ${grenzeHtml()}
      <div id="arena-modus-text"></div>
      <div class="arena-gegenueber">${teamHtml(m.host, m.host.name, ich === 1, 1)}<span class="arena-vs">gegen</span>${teamHtml(m.gast, m.gast.name, ich === 2, 2)}</div>
      <p class="note" id="arena-status">${ich === 1 ? "Die Verbindung wird aufgebaut …" : "Warte auf den Ersteller des Kampfes …"}</p>
      <div class="knoepfe"><button class="btn ghost klein" id="arena-abbrechen">Abbrechen</button></div>`);
    raengeZeigen(m);
    if (kos()) kos().arena(m.id, $("[data-arena]")); // Profilbild und Rahmen beider Teilnehmer
    $("#arena-abbrechen").onclick = async () => { stoppUhr(); Z.kampf = null; Z.anfGeaendert = null; try { await rpc("rpg_arena_cancel", { p_match_id: m.id }); } catch (e) { /* schon beendet */ } await trennen(); Z.match = null; zeigen(); };
    let k = modusVon(m), bekannt = !SERVER, privat = false; const team = (ich === 1 ? m.host : m.gast).team || [];
    const zeichneModus = () => { const el = $("#arena-modus-text"); if (!el) return; if (!bekannt) { el.innerHTML = `<p class="arena-los">Der Modus wird geladen …</p>`; return; } const anf = anfuehrerIdx(m);
      el.innerHTML = `<p class="arena-los">${privat ? "Privater Kampf · ohne Wertung" : Z.festModus && Z.festModus.id === m.id && k === "duell" ? "Normal" : "Das Los hat entschieden"}</p>${modusHtml(k, true)}
        ${k === "koenig" ? `<div class="arena-anfuehrer"><b>♛ Bestimme deinen Anführer</b> <small>– dein Gegner erfährt nicht, wer es ist.</small><div>${team.map((h, i) => `<button data-arena-anf="${esc(h.held)}" class="${i === anf ? "an" : ""}">${i === anf ? "♛ " : ""}${esc((F.FIGUREN[h.held] || {}).name || h.held)}</button>`).join("")}</div></div>` : ""}
        <p class="note">Jeder Held hat eine Minute Zugzeit.</p>`;
      el.querySelectorAll("[data-arena-anf]").forEach((b) => { b.onclick = () => { anfuehrerMerken(m.id, b.dataset.arenaAnf); zeichneModus(); if (Z.anfGeaendert) Z.anfGeaendert(); }; }); };
    zeichneModus();
    Promise.resolve().then(async () => {
      // Nur wer ausdrücklich den Serverkampf gewählt hat (?arena=server), fragt danach – die bisherige Arena ruft keine der neuen Funktionen auf.
      // Ob es wirklich ein Serverkampf ist, entscheidet der Kampf selbst: Er entsteht nur, wenn BEIDE über die Server-Suche kamen. Sonst läuft er wie bisher.
      if (SERVER) { let s = null; try { s = await rpc("rpg_arena_fight", { p_match_id: m.id, p_version: 0 }); } catch (e) { s = null; }
        if (s && s.server && MODI[s.modus]) Z.festModus = { id: m.id, modus: s.modus };
        privat = Boolean(s && s.privat); k = modusVon(m); bekannt = true; zeichneModus();
        if (s && s.server) return serverKampf(m, s); }
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
    // Derselbe Aufbau auf beiden Geräten: Der Ersteller rechnet, der Beigetretene rechnet mit (js/spiel.js, Mitrechnen)
    const beg = R.BEGEGNUNGEN[m.begegnung] ? m.begegnung : "garten", alt = Math.max(1, Math.min(3, R.BEGEGNUNGEN[beg].stufe || 1));
    let anfGast = 0;
    const neu = () => R.neueArena(m.seed || 1, { modus, anfuehrer: ich === 1 ? [anfuehrerIdx(m), anfGast] : [0, anfuehrerIdx(m)], teams: [m.host.team, m.gast.team].map((tm) => tm.map((h) => ({ fid: h.held, stufe: h.stufe }))), namen: [m.host.name, m.gast.name],
      karte: KARTE(m.karte), begegnung: beg, bedrohung: Math.max(0, m.kampfstufe - [1, 3, 6][alt - 1]) });
    if (ich === 1) {
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
          window.AB.arenaStart({ st: null, seite: 2, gast: true, schatten: neu, sende: (w) => { t.writeOwn("zug:" + uid, Object.assign({}, w, { n: ++n, at: Date.now() })).catch(() => {}); }, ende }); }
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
  /* ---------- Serverkampf: Der Server rechnet, beide Geräte zeigen an und schicken ihre Züge ---------- */
  /** Edge Function aufrufen (angemeldet). Zurück: die Antwort – auch bei einem Fehlerstatus, dann mit { fehler } */
  async function funktion(name, rumpf) {
    const c = window.AB.liveClient(); await c.ensureUser();
    const { data, error } = await c.db.functions.invoke(name, { body: rumpf });
    if (!error) return data || {};
    let o = null; try { if (error.context && error.context.json) o = await error.context.json(); } catch (e) { o = null; }
    return o && o.fehler ? o : { fehler: /not found|404/i.test(error.message || "") ? "Der Server für den Arena-Kampf ist noch nicht eingerichtet." : "Der Server hat nicht geantwortet." };
  }
  function serverKampf(m, s0) {
    if (Z.kampf) return; const modus = modusVon(m); Z.kampf = { m, gemeldet: false, modus, server: true, privat: Boolean(s0.privat) }; Z.modus = "kampf"; F.STUFEN10.aktiv = true;
    const ruf = (rumpf) => funktion("arena", Object.assign({ match: m.id }, rumpf));
    let gesehen = 0, gestartet = false, spielt = false, sendet = false, laeuft = false, uhrDiff = Date.now() - (s0.jetzt || Date.now()), letzterStart = 0, letzteZeit = 0, anfDa = s0.anfuehrer, fehlerN = 0;
    const schlange = [], kStatus = (t, html) => { const el = $("#arena-status"); if (el) { if (html) el.innerHTML = t; else el.textContent = t; } };
    const hinweis = (t) => { const h = $("#hinweis"); if (h && t) h.textContent = t; };
    const aktiv = () => Z.kampf && Z.kampf.m === m && !Z.kampf.gemeldet;
    // Schritte der Reihe nach zeigen: jeder bleibt kurz stehen (Würfel, Bewegung), nach einer Pause wird aufgeholt
    const abspielen = async () => {
      if (spielt) return; spielt = true;
      try { while (schlange.length && Z.kampf && Z.kampf.m === m) {
        const s = schlange.shift();
        if (!gestartet) { gestartet = true; kStatus("Der Kampf beginnt …");
          window.AB.arenaStart({ st: null, seite: m.seite, gast: true, server: true, sende, ende: () => fertig() }); aufgebenKnopf(m, null); }
        window.AB.arenaStand(s.st);
        if (schlange.length) await new Promise((r) => setTimeout(r, schlange.length > 8 ? 120 : 850));
      } } finally { spielt = false; }
    };
    const nimm = (schritte) => {
      const neu = (schritte || []).filter((s) => s && s.v > gesehen && s.st);
      // Wiedereinstieg in einen laufenden Kampf: nicht alle bisherigen Züge nachspielen, sondern gleich beim aktuellen Stand weitermachen
      if (!gestartet && !schlange.length && neu.length > 2) { const letzter = neu[neu.length - 1]; gesehen = letzter.v; schlange.push(letzter); Z.kampf.wieder = true; return abspielen(); }
      for (const s of neu) { gesehen = s.v; schlange.push(s); } abspielen(); };
    // Eigener Zug: an den Server; die Antwort bringt die neuen Schritte gleich mit
    const sende = (w) => { if (sendet || !aktiv()) return; sendet = true;
      ruf({ aktion: "zug", zug: w }).then((r) => { if (r.fehler) hinweis(r.fehler); nimm(r.schritte); }, () => hinweis("Der Server hat nicht geantwortet. Versuch es noch einmal.")).then(() => { sendet = false; }); };
    // Ende: Das Ergebnis steht in der Datenbank, sobald der Server den letzten Schritt gerechnet hat
    const fertig = async () => {
      if (!aktiv()) return; Z.kampf.gemeldet = true; stoppUhr();
      const st = window.AB.st, a = st && st.arena; if (a && a.modus) Z.kampf.modus = a.modus;
      if (a) schirm(`<p class="arena-ende-eyebrow">Der Kampf ist vorbei</p><h1>${a.sieger === m.seite ? "Sieg" : "Niederlage"}</h1><p>Das Ergebnis wird gewertet …</p>`, a.sieger === m.seite);
      let g = null;
      try { for (let i = 0; i < 10; i++) { g = await rpc("rpg_arena_get", { p_match_id: m.id }); if (g.status === "beendet" || g.status === "abgebrochen") break; await ruf({ aktion: "zeit" }).catch(() => {}); await new Promise((r) => setTimeout(r, 1500)); } }
      catch (e) { g = { status: "fehler", fehler: e.message, seite: m.seite, sieger: a && a.sieger, punkte: a && a.punkte, host: m.host, gast: m.gast }; }
      ergebnisZeigen(Object.assign({ punkteLokal: a && a.punkte }, g), null);
    };
    // Königsmord: den eigenen Anführer beim Server hinterlegen, solange der Kampf noch nicht begonnen hat
    const anfSenden = () => { if (modus !== "koenig" || laeuft) return; const i = anfuehrerIdx(m); if (i === anfDa) return; anfDa = i; rpc("rpg_arena_fight_leader", { p_match_id: m.id, p_idx: i }).catch(() => { anfDa = null; }); };
    Z.anfGeaendert = anfSenden; anfSenden();
    const takt = async () => {
      if (!Z.kampf || Z.kampf.m !== m) return stoppUhr();
      let s = null; try { s = await rpc("rpg_arena_fight", { p_match_id: m.id, p_version: gesehen }); fehlerN = 0; } catch (e) { if (++fehlerN === 5) kStatus("Die Verbindung zum Server ist unterbrochen …"); return; }
      if (!Z.kampf || Z.kampf.m !== m) return;
      uhrDiff = Date.now() - s.jetzt; laeuft = Boolean(s.laeuft); nimm(s.schritte);
      const jetzt = Date.now() - uhrDiff;
      if (!laeuft && (s.status === "bereit" || s.status === "laeuft")) {
        anfSenden();
        const rest = Math.ceil((s.beginn - jetzt) / 1000);
        if (rest > 0) kStatus(`Der Kampf beginnt in <b>${rest}</b> …`, true);
        else { kStatus("Der Kampf beginnt …"); if (Date.now() - letzterStart > 2500) { letzterStart = Date.now(); ruf({ aktion: "start" }).then((r) => { if (r.fehler) kStatus(r.fehler); nimm(r.schritte); }, () => {}); } }
        return;
      }
      // Zugzeit abgelaufen (auch die des Gegners): Der Server beendet den Zug, sobald ihn eine Seite darauf hinweist
      const st = window.AB.st, bis = st && !st.ende && st.arena && st.arena.zugBis;
      if (laeuft && bis && jetzt > bis + 1500 && !schlange.length && Date.now() - letzteZeit > 4000) { letzteZeit = Date.now(); ruf({ aktion: "zeit" }).then((r) => nimm(r.schritte), () => {}); }
      // Der Server nennt, wann der nächste Schritt fällig ist (arena.takt): dann nachfragen
      const tk = st && !st.ende && st.arena && st.arena.takt;
      if (laeuft && tk && jetzt >= tk && !schlange.length && !spielt && !sendet && Date.now() - letzteZeit > 600) { letzteZeit = Date.now(); ruf({ aktion: "zeit" }).then((r) => nimm(r.schritte), () => {}); }
      // Aufgabe oder Abbruch durch den Gegner: Das Ende kommt dann nicht als Schritt, sondern nur als Status
      if ((s.status === "beendet" || s.status === "abgebrochen") && !schlange.length && !spielt && aktiv() && !(window.AB.st && window.AB.st.ende)) {
        Z.kampf.gemeldet = true; stoppUhr(); const g = await rpc("rpg_arena_get", { p_match_id: m.id }); ergebnisZeigen(g, null); }
    };
    pollen(1200, takt); takt();
  }
  function aufgebenKnopf(m, t) {
    let b = $("#arena-aufgeben"); if (!b) { b = document.createElement("button"); b.id = "arena-aufgeben"; b.className = "btn ghost klein arena-aufgeben"; b.textContent = "Aufgeben"; document.body.appendChild(b); }
    b.hidden = false;
    b.onclick = async () => { if (!confirm("Kampf aufgeben? Dein Gegner gewinnt, und du bekommst keine Belohnung.")) return; b.disabled = true;
      try { const g = await rpc("rpg_arena_cancel", { p_match_id: m.id }); Z.kampf.gemeldet = true; ergebnisZeigen(g, t); } catch (e) { b.disabled = false; } };
  }
  async function ergebnisMelden(m, st, t) {
    if (!Z.kampf || Z.kampf.gemeldet) return; Z.kampf.gemeldet = true; Z.kampf.gemeldetSelbst = true; stoppUhr();
    const a = st.arena; if (a.modus) Z.kampf.modus = a.modus;
    // Mitrechnen fehlgeschlagen: abweichend melden – die Datenbank beendet den Kampf dann ohne Wertung
    const pr = window.AB.arenaPruef ? window.AB.arenaPruef() : null, faul = Boolean(pr && !pr.ok);
    if (faul) Z.kampf.faul = pr.grund;
    const grund = /am Boden|ist gefallen/.test(a.grund || "") ? "team" : "punkte";
    schirm(`<p class="arena-ende-eyebrow">Der Kampf ist vorbei</p><h1>${faul ? "Nicht gewertet" : a.sieger === m.seite ? "Sieg" : "Niederlage"}</h1><p>${faul ? esc(pr.grund) : "Das Ergebnis wird gewertet …"}</p>`, !faul && a.sieger === m.seite);
    let g = null;
    try {
      g = await rpc("rpg_arena_report", { p_match_id: m.id, p_sieger: faul ? 3 - a.sieger : a.sieger, p_grund: grund, p_punkte: a.punkte, p_runden: st.runde });
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
    // Die EP-Einträge kommen je nach Datenbank mit „vorher/stufe/gesamt“ oder „stufe_vorher/stufe_danach“: vereinheitlichen
    if (g.belohnung && g.belohnung.xp && g.belohnung.xp.length) {
      if (sm()) { try { await sm().laden(true); } catch (e) { /* ohne Verbindung: ohne Balken */ } }
      const xpJetzt = (sm() && sm().zustand().xp) || {};
      g.belohnung.xp = g.belohnung.xp.map((h) => ({ held: h.held, xp: h.xp || 0, vorher: h.vorher != null ? h.vorher : h.stufe_vorher || 1, stufe: h.stufe != null ? h.stufe : h.stufe_danach || 1, gesamt: h.gesamt != null ? h.gesamt : xpJetzt[h.held] || 0 }));
    }
    const gewertet = g.status === "beendet", sieg = gewertet ? g.sieger === g.seite : g.sieger === g.seite, b = g.belohnung || null, p = g.punkte || g.punkteLokal || null;
    const xp = b && b.xp && b.xp.length ? `<div class="arena-xp">${b.xp.map((h) => { const d = F.FIGUREN[h.held]; if (!d) return ""; const f = F.stufeAusXp(h.gesamt || 0), auf = h.stufe > h.vorher, voll = !f.bis, pct = voll ? 100 : Math.round(100 * f.xp / f.bis);
      return `<div class="sm-xp-zeile${auf ? " auf" : ""}"><img src="${F.bild(h.held)}" alt=""><div class="sm-xp-mitte"><div class="sm-xp-kopf"><b>${esc(d.name)}</b><span>+${h.xp} EP</span></div><i><u style="width:${pct}%"></u></i><small>${auf ? `<strong>Aufstieg: Stufe ${h.vorher} → ${h.stufe}</strong> · ` : `Stufe ${h.stufe} · `}${voll ? "höchste Stufe erreicht" : `${f.xp} / ${f.bis} EP bis Stufe ${f.stufe + 1}`}</small></div></div>`; }).join("")}</div>` : "";
    const text = g.status === "abgebrochen" ? (Z.kampf && Z.kampf.faul ? "Der Kampf wurde ohne Wertung beendet: " + esc(Z.kampf.faul) : Z.kampf && Z.kampf.m && g.sieger == null && g.runden == null && Z.kampf.gemeldetSelbst ? "Der Kampf wurde ohne Wertung beendet: Die beiden Geräte kamen nicht zum selben Ergebnis." : "Der Kampf wurde ohne Wertung beendet.") : g.status === "fehler" ? "Das Ergebnis konnte nicht gemeldet werden: " + esc(g.fehler || "") : g.status === "laeuft" ? "Dein Gegner hat das Ergebnis noch nicht bestätigt. Sobald er es tut, wird gewertet."
      : g.grund === "aufgabe" ? (sieg ? "Dein Gegner hat aufgegeben." : "Du hast aufgegeben.") : g.grund === "team" ? (Z.kampf && Z.kampf.modus === "koenig" ? (sieg ? "Der gegnerische Anführer ist gefallen." : "Dein Anführer ist gefallen.") : sieg ? "Das gegnerische Team liegt am Boden." : "Dein Team liegt am Boden.") : "Nach Punkten entschieden.";
    const lohn = Z.kampf && Z.kampf.privat ? `<p class="arena-ende-note">Privater Kampf: ohne Wertung.</p>` : !b ? "" : !b.gewertet && !(b.xp && b.xp.length) && !b.waehrung ? (g.grund === "aufgabe" && !sieg ? "" : `<p class="arena-ende-note">Dieser Kampf brachte keine Belohnung.</p>`)
      : `${b.waehrung ? `<p class="arena-ende-lohn"><i>${ZEICHEN}</i> +${b.waehrung} ${WAEHRUNG}</p>` : ""}${xp}${b.angebot ? `<p class="arena-ende-lohn held">★ Ein neuer Held will sich dir anschließen!</p>` : ""}`;
    const e = schirm(`<div class="arena-ende-gegner">${g.host ? bildVon(g.host.name, "gross") : ""}<p class="arena-ende-eyebrow">${esc(g.host ? g.host.name : "")} gegen ${esc(g.gast ? g.gast.name : "")}</p>${g.gast ? bildVon(g.gast.name, "gross") : ""}</div><h1>${g.status === "abgebrochen" ? "Abgebrochen" : sieg ? "Sieg" : "Niederlage"}</h1>
      ${p ? `<p class="arena-ende-punkte">${p[1] != null ? p[1] : p["1"]} : ${p[2] != null ? p[2] : p["2"]}</p>` : ""}<p>${text}</p>${lohn}
      <div class="knoepfe mitte"><button class="btn gross" id="arena-ende-zu">${b && b.angebot ? "Helden wählen" : "Zur Startseite"}</button></div>`, sieg && g.status !== "abgebrochen");
    if (kos()) kos().arena(g.id || (Z.kampf && Z.kampf.m && Z.kampf.m.id), e);
    if (window.ABRANG && g.status === "beendet") window.ABRANG.ergebnis(g.id || (Z.kampf && Z.kampf.m && Z.kampf.m.id), e); // Ranked: Punkte, Aufstieg, Abstieg
    $("#arena-ende-zu").onclick = async () => {
      e.hidden = true; e.innerHTML = ""; window.AB.arenaEnde(); Z.kampf = null; Z.match = null; Z.modus = null; await trennen();
      await pruefen(true); if (window.MYTHARA.waehrungZeigen) window.MYTHARA.waehrungZeigen(Z.waehrung);
      if (sm()) await sm().laden(true);
      window.MYTHARA.zeigeHub();
      if (b && b.angebot && sm() && sm().offeneBelohnung) sm().offeneBelohnung(() => window.MYTHARA.zeigeHub());
    };
  }

  window.ARENA = { pruefen, laufend, zeigen, waehrung: () => Z.waehrung || 0, WAEHRUNG, ZEICHEN, zustand: () => Z };
})();
