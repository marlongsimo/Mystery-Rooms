/*
 * Mythara – Ausstattung: Würfel-Designs und Profilrahmen. Rein kosmetisch, ohne Wirkung auf das Spiel.
 * Gekauft wird beim Händler mit Seelensplittern, ausgewählt im Profil unter „Personalisieren“.
 * Katalog, Preise, Besitz und Auswahl liegen in der Datenbank (Migration 017); hier stehen Namen und Aussehen
 * unter derselben Kennung. Das Aussehen selbst ist reines CSS (css/abenteuer.css, Abschnitt „Ausstattung“):
 * Die Auswahl steht als data-wuerfel / data-rahmen am <body>, Vorschauen tragen dieselben Angaben an ihrem Kasten.
 * Die letzte Auswahl wird auf dem Gerät gemerkt, damit sie beim Start sofort gilt.
 * Globaler Name: window.ABKOS = { laden(), anwenden(), ausstattung(), personalisieren(), da() }
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const STUECKE = {
    w_obsidian: { name: "Obsidian", text: "Schwarzes Glas, kalter Rand." },
    w_elfenbein: { name: "Elfenbein", text: "Hell, mit dunkler Zahl." },
    w_smaragd: { name: "Smaragd", text: "Tiefes Grün." },
    w_rubin: { name: "Rubin", text: "Dunkles Rot." },
    w_glut: { name: "Glut", text: "Glüht von innen und flackert." },
    w_frost: { name: "Frost", text: "Eisblau, mit kaltem Schein." },
    w_arkan: { name: "Arkan", text: "Violettes Leuchten, das pulsiert." },
    w_gold: { name: "Königsgold", text: "Poliertes Gold, das schimmert." },
    r_bronze: { name: "Bronze", text: "Warmer, breiter Rand." },
    r_silber: { name: "Silber", text: "Heller, klarer Rand." },
    r_eisen: { name: "Eisen", text: "Dunkel und schwer." },
    r_wald: { name: "Waldgrün", text: "Für alle, die draußen zu Hause sind." },
    r_gold: { name: "Königsgold", text: "Doppelter Goldrand, der schimmert." },
    r_flammen: { name: "Flammen", text: "Ein Rand, der brennt." },
    r_frost: { name: "Frost", text: "Eis, das leise leuchtet." },
    r_splitter: { name: "Seelensplitter", text: "Violett, pulsierend wie ein Splitter." },
    r_dornen: { name: "Dornenkranz", text: "Geflochten, mit langen Dornen." },
    r_zahnrad: { name: "Zahnrad", text: "Für Tüftler und Fallensteller." },
    r_lorbeer: { name: "Lorbeerkranz", text: "Der Kranz der Sieger." },
    r_krone: { name: "Krone", text: "Eine Krone über dem Haupt." },
    r_schwingen: { name: "Schwingen", text: "Weiße Flügel zu beiden Seiten." },
    r_stern: { name: "Kompassstern", text: "Acht Zacken, die den Weg weisen." },
    r_runen: { name: "Runenkreis", text: "Ein Kreis aus Zeichen, der sich dreht." },
  };
  const ART = { wuerfel: { titel: "Würfel", einzahl: "Würfel", standard: "Der Würfel, wie ihn alle kennen." }, rahmen: { titel: "Profilrahmen", einzahl: "Rahmen", standard: "Der schlichte Goldrand." } };
  const MERKER = "ab_kosmetik";
  const netz = () => window.AB.liveClient();
  const fehlt = (e) => Boolean(e && (e.code === "PGRST202" || e.code === "42883" || /Could not find the function|schema cache|does not exist/i.test(e.roh || e.message || "")));
  let D = null; // Stand aus der Datenbank: { konto, waehrung, katalog, besitz, aktiv }
  let aktiv = { wuerfel: null, rahmen: null };
  try { const o = JSON.parse(localStorage.getItem(MERKER) || "null"); if (o) aktiv = { wuerfel: STUECKE[o.wuerfel] ? o.wuerfel : null, rahmen: STUECKE[o.rahmen] ? o.rahmen : null }; } catch (e) { /* privat */ }

  function anwenden() {
    const b = document.body; if (!b) return;
    if (aktiv.wuerfel) b.dataset.wuerfel = aktiv.wuerfel; else delete b.dataset.wuerfel;
    if (aktiv.rahmen) b.dataset.rahmen = aktiv.rahmen; else delete b.dataset.rahmen;
  }
  function uebernehmen(d) {
    D = d; if (!d || !d.konto) return;
    aktiv = { wuerfel: d.aktiv && STUECKE[d.aktiv.wuerfel] ? d.aktiv.wuerfel : null, rahmen: d.aktiv && STUECKE[d.aktiv.rahmen] ? d.aktiv.rahmen : null };
    try { localStorage.setItem(MERKER, JSON.stringify(aktiv)); } catch (e) { /* privat */ }
    anwenden();
    if (window.ARENA && window.MYTHARA && window.MYTHARA.waehrungZeigen && d.waehrung != null) window.MYTHARA.waehrungZeigen(d.waehrung);
  }
  /** Stand holen. Zurück: der Stand, oder null (kein Konto, keine Verbindung), oder { fehlt: true } ohne Migration 017 */
  async function laden() {
    try { await netz().ensureUser(); const d = await netz().rpc("rpg_cosmetics", {}); uebernehmen(d); return d; }
    catch (e) { return fehlt(e) ? { fehlt: true } : null; }
  }
  /** Abmelden oder Gast: zurück auf Standard */
  function zuruecksetzen() { D = null; aktiv = { wuerfel: null, rahmen: null }; try { localStorage.removeItem(MERKER); } catch (e) { /* privat */ } anwenden(); }

  /* ---------- Vorschau eines Stücks ---------- */
  const zeichen = () => (window.ARENA ? window.ARENA.ZEICHEN : "◈"), waehrung = () => (window.ARENA ? window.ARENA.WAEHRUNG : "Seelensplitter");
  function vorschau(art, id) {
    if (art === "wuerfel") return `<span class="kos-bild kos-wuerfel" data-wuerfel="${id || "standard"}"><span class="w20-box">${window.ABW.svg(20)}</span></span>`;
    const bild = window.MYTHARA && window.MYTHARA.avatarHtml ? window.MYTHARA.avatarHtml() : "";
    return `<span class="kos-bild kos-rahmen" data-rahmen="${id || "standard"}"><span class="rahmen-halter"><span class="hub-avatar">${bild}</span></span></span>`;
  }
  const stuecke = (art) => (D && D.katalog ? D.katalog.filter((k) => k.art === art && STUECKE[k.id]) : []);
  const hat = (id) => Boolean(D && (D.besitz || []).includes(id));

  /* ---------- Händler: Ausstattung kaufen ---------- */
  async function ausstattung(meldung) {
    const M = window.MYTHARA, kopf = (rest) => `<div class="shop" data-shop><button class="btn ghost klein shop-zurueck" data-shop-zurueck>← Zum Händler</button>${rest}</div>`;
    M.seite("shop", kopf(`<p class="shop-eyebrow">Der Händler</p><h1 class="hub-gruss">Einen Moment …</h1>`));
    const d = meldung && D ? D : await laden();
    if (!document.querySelector("[data-shop]")) return;
    const zurueck = () => { const z = $("[data-shop-zurueck]"); if (z) z.onclick = () => M.shop(); };
    if (!d || d.fehlt || !d.konto) { M.seite("shop", kopf(`<p class="shop-eyebrow">Der Händler</p><h1 class="hub-gruss">${d && d.fehlt ? "Folgt bald" : d ? "Nur für Spielerkonten" : "Keine Verbindung"}</h1>
      <p class="hub-untertitel">${d && d.fehlt ? "Der Händler packt die Ausstattung noch aus." : d ? "Ausstattung gibt es nur mit einem Konto." : "Der Händler ist gerade nicht erreichbar. Versuch es gleich noch einmal."}</p>`)); return zurueck(); }
    const karte = (k) => { const s = STUECKE[k.id], mein = hat(k.id), traegt = aktiv[k.art] === k.id, zuwenig = k.preis - d.waehrung;
      return `<div class="kos-karte ${mein ? "mein" : ""} ${k.preis >= 150 ? "edel" : ""}">${vorschau(k.art, k.id)}<b>${esc(s.name)}</b><small>${esc(s.text)}</small>
        ${mein ? `<span class="shop-gekauft">✓ Gehört dir</span><button class="btn ghost klein" data-kos-trag="${k.id}" data-art="${k.art}" ${traegt ? "disabled" : ""}>${traegt ? "Ausgewählt" : "Auswählen"}</button>`
          : `<button class="btn" data-kos-kauf="${k.id}" ${zuwenig > 0 ? "disabled" : ""}><i>${zeichen()}</i> ${k.preis}</button>${zuwenig > 0 ? `<small class="shop-fehlt">Es fehlen ${zuwenig}</small>` : ""}`}</div>`; };
    const block = (art) => { const l = stuecke(art); return l.length ? `<h2 class="hub-zwischen">${ART[art].titel}</h2><div class="kos-raster">${l.map(karte).join("")}</div>` : ""; };
    M.seite("shop", kopf(`<div class="shop-kopf"><div><p class="shop-eyebrow">Der Händler</p><h1 class="hub-gruss">Ausstattung</h1>
        <p class="hub-untertitel">Würfel und Profilrahmen. Rein fürs Auge – im Kampf ändert sich nichts.</p></div><p class="shop-stand"><i>${zeichen()}</i> ${d.waehrung} ${waehrung()}</p></div>
      ${meldung ? `<p class="fb">${esc(meldung)}</p>` : ""}${block("wuerfel")}${block("rahmen")}
      <p class="note">Was du trägst, wählst du jederzeit im Profil unter „Personalisieren“.</p>`));
    zurueck();
    document.querySelectorAll("[data-kos-kauf]").forEach((b) => { b.onclick = async () => { const id = b.dataset.kosKauf, k = d.katalog.find((x) => x.id === id);
      if (!confirm(`${ART[k.art].einzahl} „${STUECKE[id].name}“ für ${k.preis} ${waehrung()} kaufen?`)) return; b.disabled = true;
      try { uebernehmen(await netz().rpc("rpg_cosmetic_buy", { p_id: id })); if (window.ARENA) window.ARENA.pruefen(true).catch(() => {});
        // frisch gekauft: gleich anlegen
        try { uebernehmen(await netz().rpc("rpg_cosmetic_equip", { p_art: k.art, p_id: id })); } catch (e) { /* bleibt im Besitz, Auswahl später */ }
        if (M.kopfNeu) M.kopfNeu(); ausstattung(); if (M.toast) M.toast(`„${STUECKE[id].name}“ gehört jetzt dir und ist ausgewählt.`); }
      catch (e) { await laden(); ausstattung(e.message); } }; });
    document.querySelectorAll("[data-kos-trag]").forEach((b) => { b.onclick = () => waehlen(b.dataset.art, b.dataset.kosTrag, () => ausstattung()); });
  }
  async function waehlen(art, id, danach) {
    try { uebernehmen(await netz().rpc("rpg_cosmetic_equip", { p_art: art, p_id: id || null })); if (window.MYTHARA.kopfNeu) window.MYTHARA.kopfNeu(); }
    catch (e) { if (window.MYTHARA.toast) window.MYTHARA.toast(e.message); }
    if (danach) danach();
  }

  /* ---------- Profil: Personalisieren ---------- */
  async function personalisieren() {
    const M = window.MYTHARA; M.fenster("Personalisieren", `<p class="note">Einen Moment …</p>`);
    const d = await laden();
    const zeichne = () => {
      if (!d || d.fehlt || !d.konto) return M.fenster("Personalisieren", `<p class="note">${d && d.fehlt ? "Das Personalisieren ist in der Datenbank noch nicht eingerichtet (Migration 017)." : d ? "Das gibt es nur mit einem Spielerkonto." : "Gerade keine Verbindung. Versuch es gleich noch einmal."}</p>`);
      const wahl = (art, id, name, text) => `<button class="kos-wahl ${aktiv[art] === id ? "an" : ""}" data-kos-wahl="${id || ""}" data-art="${art}" aria-pressed="${aktiv[art] === id}">${vorschau(art, id)}<b>${esc(name)}</b><small>${esc(text)}</small></button>`;
      const block = (art) => { const meine = stuecke(art).filter((k) => hat(k.id)), offen = stuecke(art).length - meine.length;
        return `<h3 class="f-unter">${ART[art].titel}</h3><div class="kos-raster wahl">${wahl(art, null, "Standard", ART[art].standard)}${meine.map((k) => wahl(art, k.id, STUECKE[k.id].name, STUECKE[k.id].text)).join("")}</div>
          ${offen > 0 ? `<p class="note">${offen} weitere beim Händler.</p>` : ""}`; };
      M.fenster("Personalisieren", `<div class="kos-profil"><p class="note">Wähle, was du trägst. Die Auswahl ist an deinem Konto gespeichert und gilt auf jedem Gerät.</p>
        ${block("wuerfel")}${block("rahmen")}
        <div class="knoepfe"><button class="btn ghost" id="kos-zum-haendler">Zum Händler</button></div></div>`);
      document.querySelectorAll("[data-kos-wahl]").forEach((b) => { b.onclick = () => { document.querySelectorAll(`[data-kos-wahl][data-art="${b.dataset.art}"]`).forEach((x) => { x.disabled = true; }); waehlen(b.dataset.art, b.dataset.kosWahl || null, zeichne); }; });
      const h = $("#kos-zum-haendler"); if (h) h.onclick = () => { $("#qr-overlay").hidden = true; ausstattung(); };
    };
    zeichne();
  }

  anwenden();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", anwenden);
  window.ABKOS = { laden, anwenden, zuruecksetzen, ausstattung, personalisieren, STUECKE, aktiv: () => Object.assign({}, aktiv), da: () => Boolean(D && D.konto) };
})();
