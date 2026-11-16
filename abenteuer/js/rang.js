/*
 * Mythara – Arena, Ranked: Ränge, Saison, Rangliste, Chronik, Belohnungen und die Anzeige dazu (Migration 022).
 * Dieses Modul rechnet nichts am Kampf: Punkte vergibt allein die Datenbank. Es liest rpg_ranked_status / rpg_ranked_result
 * und zeichnet – die Karte in der Arena, die Reiter darunter, den Block im Ergebnisbildschirm, das Abzeichen in der Kopfzeile.
 * Ränge: je 100 Punkte eine Stufe, 0 = Bronze III … 14 = Meister I.
 * Globaler Name: window.ABRANG = { laden(), da(), info(rang), emblem(rang), karteHtml(), reiterHtml(), binden(), ergebnis(), kopf(), zeile() }
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TIER = [["bronze", "Bronze"], ["silber", "Silber"], ["gold", "Gold"], ["platin", "Platin"], ["meister", "Meister"]], ROEM = ["III", "II", "I"];
  const LOHN = [150, 300, 500, 800, 1200];
  const klemm = (r) => Math.max(0, Math.min(14, Math.floor(Number(r) || 0)));
  const ausPunkten = (p) => klemm(Math.max(0, Number(p) || 0) / 100);
  const info = (rang) => { const r = klemm(rang), t = Math.floor(r / 3); return { rang: r, tier: t, schluessel: TIER[t][0], gruppe: TIER[t][1], stufe: ROEM[r % 3], name: TIER[t][1] + " " + ROEM[r % 3] }; };
  /** Abzeichen: Schild in der Farbe des Rangs mit der Stufe (III, II, I) */
  const emblem = (rang, klasse) => { const i = info(rang); return `<span class="rang-emblem ${klasse || ""}" data-tier="${i.schluessel}" role="img" aria-label="${i.name}"><i></i><b>${i.stufe}</b></span>`; };
  /** Fortschritt innerhalb der Stufe: { von, bis, anteil, naechster } – in Meister I gibt es kein Ziel mehr */
  const fortschritt = (p) => { const r = ausPunkten(p); return r >= 14 ? { in: p - 1400, von: null, anteil: 1, naechster: null } : { in: p % 100, von: 100, anteil: (p % 100) / 100, naechster: info(r + 1).name }; };
  const rpc = async (name, args = {}) => { const c = window.AB.liveClient(); await c.ensureUser(); return c.rpc(name, args); };
  const fehltF = (e) => Boolean(e && (e.code === "PGRST202" || e.code === "42883" || /Could not find the function|schema cache|does not exist/i.test(e.roh || e.message || "")));
  let D = null, fehlt = false, zeit = 0, reiter = "chronik";

  /** Stand holen (höchstens alle 20 Sekunden neu, außer neu = true). null, wenn die Datenbank Ranked nicht kennt. */
  async function laden(neu) {
    if (fehlt) return null;
    if (!neu && D && Date.now() - zeit < 20000) return D;
    try { D = await rpc("rpg_ranked_status", {}); zeit = Date.now(); } catch (e) { if (fehltF(e)) { fehlt = true; D = null; } }
    return D;
  }
  const da = () => Boolean(D && D.konto && D.saison);
  const laeuft = () => Boolean(da() && D.saison.laeuft);
  const restText = () => { if (!da()) return ""; const ms = new Date(D.saison.ende).getTime() - (D.saison.jetzt ? D.saison.jetzt + (Date.now() - zeit) : Date.now());
    if (!D.saison.laeuft || ms <= 0) return "beendet"; const t = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5); return t >= 2 ? `noch ${t} Tage` : t === 1 ? `noch 1 Tag, ${h} Std.` : `noch ${Math.max(1, h)} Std.`; };

  /** Die große Karte in der Arena: Rang, Fortschritt, Bilanz – und der Knopf zum Spielen */
  function karteHtml(teamDa) {
    if (!da()) return "";
    const ich = D.ich || { punkte: 0 }, i = info(ich.rang), f = fortschritt(ich.punkte), spiele = (ich.siege || 0) + (ich.niederlagen || 0);
    return `<section class="rang-karte" data-tier="${i.schluessel}" aria-label="Ranked">
        <div class="rang-karte-kopf"><span class="rang-saison">${esc(D.saison.name)} · ${restText()}</span><span class="rang-art">Ranked · Duell</span></div>
        <div class="rang-karte-mitte">${emblem(ich.rang, "gross")}
          <div class="rang-stand"><b>${i.name}</b>
            <div class="rang-balken" role="progressbar" aria-valuemin="0" aria-valuemax="${f.von || 100}" aria-valuenow="${f.in}"><u style="width:${Math.round(f.anteil * 100)}%"></u></div>
            <small>${f.von ? `${f.in} / ${f.von} bis ${f.naechster}` : `${ich.punkte} Punkte – höchster Rang`}</small></div>
          <dl class="rang-zahlen"><div><dt>Punkte</dt><dd>${ich.punkte}</dd></div><div><dt>Bilanz</dt><dd>${ich.siege || 0} : ${ich.niederlagen || 0}</dd></div><div><dt>Platz</dt><dd>${ich.platz ? "#" + ich.platz : "–"}</dd></div></dl></div>
        <div class="rang-karte-fuss">
          <button class="btn gross rang-spielen" data-arena-art="ranked" ${teamDa && laeuft() ? "" : "disabled"}>⚔ Ranked spielen</button>
          <small>${!laeuft() ? "Die Saison ist beendet. Die Belohnungen werden nach dem Abschluss verteilt." : !teamDa ? "Lege zuerst dein Team fest." : spiele ? "Sieg +25 · Niederlage −15. Gegner aus deinem Rang." : "Dein erster Kampf der Saison: Alle beginnen in Bronze III."}</small></div></section>`;
  }
  const bild = (name, avatar, rahmen) => { const F = window.ABF, img = avatar && F && F.FIGUREN[avatar] ? `<img src="img/figuren/${esc(avatar)}.jpg" alt="">` : `<span>${esc((name || "?").slice(0, 1).toUpperCase())}</span>`;
    return `<span class="kos-bild kos-rahmen rang-bild" data-rahmen="${esc(rahmen || "standard")}"><span class="rahmen-halter"><span class="hub-avatar">${img}</span></span></span>`; };
  const wann = (t) => { try { const d = new Date(t), h = (Date.now() - d.getTime()) / 36e5; return h < 1 ? "gerade eben" : h < 24 ? `vor ${Math.floor(h)} Std.` : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }); } catch (e) { return ""; } };
  function ranglisteHtml() {
    const l = (D && D.rangliste) || [];
    if (!l.length) return `<p class="note">Noch steht niemand auf der Rangliste. Der erste gewertete Kampf bringt dich hinein.</p>`;
    const ich = D.ich || {}, drin = l.some((z) => z.ich);
    return `<ol class="rang-liste">${l.map((z) => `<li class="${z.ich ? "ich" : ""} ${z.platz <= 3 ? "top p" + z.platz : ""}"><em>${z.platz}</em>${bild(z.name, z.avatar, z.rahmen)}<b>${esc(z.name)}</b><small>${z.siege} : ${z.niederlagen}</small>${emblem(z.rang, "klein")}<span class="rang-p">${z.punkte}</span></li>`).join("")}</ol>
      ${!drin && ich.platz ? `<p class="rang-eigen">Dein Platz: <b>#${ich.platz}</b> · ${info(ich.rang).name} · ${ich.punkte} Punkte</p>` : ""}`;
  }
  function chronikHtml() {
    const l = (D && D.chronik) || [], F = window.ABF;
    if (!l.length) return `<p class="note">Hier stehen deine letzten fünf Ranked-Kämpfe.</p>`;
    const kopf = (t) => (t || []).map((h) => F && F.FIGUREN[h.held] ? `<img src="${F.bild(h.held)}" alt="${esc(F.FIGUREN[h.held].name)}" title="${esc(F.FIGUREN[h.held].name)} · Stufe ${h.stufe}">` : "").join("");
    return `<ul class="rang-chronik">${l.map((k) => { const nach = Math.max(0, (k.vor || 0) + (k.delta || 0)), auf = ausPunkten(nach) > ausPunkten(k.vor), ab = ausPunkten(nach) < ausPunkten(k.vor);
      return `<li class="${k.sieg ? "sieg" : "niederlage"}"><span class="rang-ausgang">${k.sieg ? "Sieg" : "Niederlage"}</span>
        <div class="rang-kampf"><b>gegen ${esc(k.gegner || "?")}</b><small>${k.grund === "aufgabe" ? "durch Aufgabe" : k.runden ? k.runden + " Runden" : ""} · ${wann(k.wann)}</small>
          <div class="rang-teams"><span>${kopf(k.team)}</span><i>vs</i><span>${kopf(k.gegner_team)}</span></div></div>
        <span class="rang-delta">${k.delta > 0 ? "+" : ""}${k.delta}${auf ? `<small>▲ ${info(ausPunkten(nach)).name}</small>` : ab ? `<small>▼ ${info(ausPunkten(nach)).name}</small>` : ""}</span></li>`; }).join("")}</ul>`;
  }
  function belohnungenHtml() {
    const ich = (D && D.ich) || {}, meiner = Math.floor(ausPunkten(ich.hoechst || 0) / 3), gespielt = (ich.siege || 0) + (ich.niederlagen || 0) > 0, W = window.ABW;
    return `<p class="note">Am Ende der Saison bekommt jeder, der mindestens einen gewerteten Kampf gespielt hat, die Belohnung des <b>höchsten Rangs, den er erreicht hat</b>.</p>
      <ul class="rang-lohn">${TIER.map((t, n) => `<li class="${gespielt && n === meiner ? "meiner" : ""}" data-tier="${t[0]}">${emblem(n * 3 + 2, "klein")}<b>${t[1]}</b>
        <span class="rang-lohn-s">◈ ${LOHN[n]}</span>
        <span class="kos-bild kos-wuerfel" data-wuerfel="w_s0_${t[0]}" title="Würfel ${t[1]}"><span class="w20-box">${W ? W.svg(20) : ""}</span></span>
        <span class="kos-bild kos-rahmen" data-rahmen="r_s0_${t[0]}" title="Rahmen ${t[1]}"><span class="rahmen-halter"><span class="hub-avatar">${window.MYTHARA && window.MYTHARA.avatarHtml ? window.MYTHARA.avatarHtml() : ""}</span></span></span>
        ${gespielt && n === meiner ? `<em>dein Stand</em>` : ""}</li>`).reverse().join("")}</ul>`;
  }
  const REITER = [["chronik", "Letzte Kämpfe"], ["belohnungen", "Belohnungen"]]; // die Rangliste hat in der Arena einen eigenen Reiter
  const reiterInhalt = () => (reiter === "belohnungen" ? belohnungenHtml() : chronikHtml());
  function reiterHtml() {
    if (!da()) return "";
    return `<section class="rang-reiter" id="rang-reiter"><nav class="rang-unter" aria-label="Ranked">${REITER.map((r) => `<button data-rang-reiter="${r[0]}" class="${r[0] === reiter ? "an" : ""}"${r[0] === reiter ? ' aria-current="page"' : ""}>${r[1]}</button>`).join("")}</nav>
      <div class="rang-reiter-inhalt">${reiterInhalt()}</div></section>`;
  }
  function binden() {
    const el = $("#rang-reiter"); if (!el) return;
    el.querySelectorAll("[data-rang-reiter]").forEach((b) => { b.onclick = () => { reiter = b.dataset.rangReiter; el.outerHTML = reiterHtml(); binden(); }; });
  }

  /** Ergebnisbildschirm: Punkte vorher → nachher, Aufstieg oder Abstieg. el: der Bildschirm (#arena-ende) */
  async function ergebnis(matchId, el) {
    if (fehlt || !matchId || !el) return null;
    let r = null;
    for (let i = 0; i < 6 && el.isConnected; i++) {
      try { r = await rpc("rpg_ranked_result", { p_match_id: matchId }); } catch (e) { if (fehltF(e)) fehlt = true; return null; }
      if (!r || !r.ranked) return null;
      if (r.gewertet) break;
      await new Promise((x) => setTimeout(x, 1200));
    }
    if (!r || !r.gewertet || !el.isConnected) return r;
    const i0 = info(r.rang_vor), i1 = info(r.rang_nach), f0 = fortschritt(r.vor), f1 = fortschritt(r.nach), auf = r.rang_nach > r.rang_vor, ab = r.rang_nach < r.rang_vor;
    const block = document.createElement("div"); block.className = "rang-ergebnis " + (auf ? "auf" : ab ? "ab" : "") + (r.delta < 0 ? " minus" : ""); block.dataset.tier = i1.schluessel;
    block.innerHTML = `${auf || ab ? `<p class="rang-wechsel">${auf ? "▲ Aufstieg" : "▼ Abstieg"}: <b>${i1.name}</b></p>` : ""}
      <div class="rang-ergebnis-reihe">${emblem(auf || ab ? r.rang_vor : r.rang_nach, "mittel")}
        <div class="rang-stand"><b>${auf || ab ? i0.name : i1.name}</b><div class="rang-balken"><u style="width:${Math.round(f0.anteil * 100)}%"></u></div><small><span class="rang-zahl">${r.vor}</span> Rangpunkte</small></div>
        <span class="rang-delta gross">${r.delta > 0 ? "+" : ""}${r.delta}</span></div>`;
    const vor = el.querySelector(".knoepfe"); (vor && vor.parentNode ? vor.parentNode : el).insertBefore(block, vor || null);
    // kurz zeigen, wo man stand – dann zum neuen Stand laufen lassen
    setTimeout(() => { if (!block.isConnected) return;
      if (auf || ab) { const e = block.querySelector(".rang-emblem"), n = block.querySelector(".rang-stand b"); if (e) e.outerHTML = emblem(r.rang_nach, "mittel puls"); if (n) n.textContent = i1.name; }
      const u = block.querySelector(".rang-balken u"), z = block.querySelector(".rang-zahl"); if (u) u.style.width = Math.round(f1.anteil * 100) + "%"; if (z) z.textContent = r.nach; block.classList.add("fertig"); }, 900);
    D = null; laden(true).then(kopf); // Stand für Arena und Kopfzeile auffrischen
    return r;
  }
  /** Abzeichen in der Kopfzeile des Dorfs (neben den Seelensplittern) */
  function kopf() {
    const e = $("#hub-rang"); if (!e) return;
    if (!da() || !laeuft()) { e.hidden = true; return; }
    const ich = D.ich || {}; e.hidden = false; e.innerHTML = `${emblem(ich.rang, "mini")}<span>${info(ich.rang).name}</span>`; e.title = `${D.saison.name}: ${ich.punkte || 0} Rangpunkte`;
  }
  /** Eine Zeile für die Profilseite */
  const zeile = () => (da() ? `${emblem((D.ich || {}).rang, "mini")} ${info((D.ich || {}).rang).name} · ${(D.ich || {}).punkte || 0} Rangpunkte (${esc(D.saison.name)})` : "");

  window.ABRANG = { laden, da, laeuft, info, ausPunkten, emblem, karteHtml, reiterHtml, ranglisteHtml, binden, ergebnis, kopf, zeile, stand: () => D, LOHN };
})();
