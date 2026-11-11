/*
 * Case Unlocked · Abenteuer – Heldenwahl (gemeinsam für Tisch und Handy)
 * Kacheln der 15 Figuren und die große Vorstellung einer Figur mit Profil, Werten und Fähigkeiten.
 */
(function () {
  "use strict";
  const F = window.ABF, R = window.ABR;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const vorz = (n) => (n >= 0 ? "+" + n : String(n));
  const ACHSEN = ["Angriff", "Schutz", "Unterstützung", "Kontrolle", "Beweglichkeit"];
  /** Profil (1–5) je Achse, Anspruch (1 Einstieg – 3 anspruchsvoll) und Spielweise in zwei Sätzen */
  const PROFIL = {
    schildwaechter: { p: [2, 5, 3, 2, 1], anspruch: 1, spielweise: "Steht vorn und zieht die Angriffe auf sich. Wer neben ihm kämpft, wird seltener getroffen." },
    berserker: { p: [5, 4, 1, 1, 2], anspruch: 1, spielweise: "Stürmt los, nimmt Treffer und teilt mehr aus. Je schlimmer es um ihn steht, desto gefährlicher wird er." },
    duellant: { p: [4, 3, 1, 2, 3], anspruch: 2, spielweise: "Sucht sich einen Gegner und lässt ihn nicht mehr los. Jeder Fehler des Gegners wird bestraft." },
    gelehrter: { p: [2, 1, 4, 3, 2], anspruch: 3, spielweise: "Deckt Schwächen auf, schützt Verbündete im letzten Moment und kennt jede Inschrift der Abtei." },
    elementarist: { p: [5, 1, 1, 3, 2], anspruch: 2, spielweise: "Feuer und Frost auf Entfernung, am liebsten auf mehrere Gegner zugleich. Braucht Schutz in der Nähe." },
    schattenmagier: { p: [2, 2, 2, 5, 3], anspruch: 3, spielweise: "Macht Gegner wehrlos statt tot: Furcht, Fesseln, Albträume. Wer sie trifft, trifft oft nur ein Trugbild." },
    schattenlaeufer: { p: [4, 2, 1, 2, 5], anspruch: 2, spielweise: "Taucht auf, sticht zu, ist wieder weg. Findet Fallen und öffnet, was verschlossen ist." },
    trickser: { p: [3, 2, 3, 3, 4], anspruch: 3, spielweise: "Blendet, täuscht und holt Freunde aus der Gefahr. Hat immer noch einen Trick und manchmal einfach Glück." },
    assassine: { p: [5, 2, 1, 1, 4], anspruch: 2, spielweise: "Der erste Schlag entscheidet. Gift, Schatten und kein unnötiges Wort." },
    lichtbringer: { p: [2, 4, 4, 2, 1], anspruch: 2, spielweise: "Segnet die Gruppe, heilt im Vorbeigehen und brennt Untote aus der Welt." },
    wanderheiler: { p: [1, 3, 5, 2, 2], anspruch: 2, spielweise: "Hält alle am Leben. Wer fällt, steht bei ihm wieder auf." },
    inquisitor: { p: [4, 4, 2, 3, 1], anspruch: 2, spielweise: "Markiert sein Ziel mit heiligem Feuer und befiehlt ihm zu fliehen. Durchschaut jede Lüge." },
    wildnislaeufer: { p: [4, 2, 1, 2, 4], anspruch: 1, spielweise: "Trifft aus großer Entfernung und hält Abstand. Liest jede Spur." },
    tiergefaehrte: { p: [3, 3, 2, 2, 4], anspruch: 3, spielweise: "Kämpft zu zweit: mit Grau, ihrem Wolf, als zweiter Figur auf dem Feld." },
    kopfgeldjaeger: { p: [4, 2, 1, 3, 3], anspruch: 2, spielweise: "Markiert, fängt und erlegt. Gegen sein Ziel trifft er öfter kritisch." },
  };
  const ANSPRUCH = { 1: "Einstieg", 2: "Fortgeschritten", 3: "Anspruchsvoll" };
  const KLASSE_ZEICHEN = { krieger: "⚔", zauberer: "✦", schurke: "◆", kleriker: "☀", waldlaeufer: "❦" };
  /** Kurze Angaben je Klasse für die Klassenwahl (Werte aus figuren.js, nur die Worte stehen hier) */
  const KLASSE_INFO = {
    krieger: { kurz: "Meister des Nahkampfs und Schild der Gefährten.", stark: "Hält am meisten aus, nagelt Gegner fest", platz: "vorn", wofuer: "Für alle, die mitten ins Getümmel wollen." },
    zauberer: { kurz: "Hüter arkanen Wissens. Zerbrechlich, aber gefährlich.", stark: "Zauber auf mehrere Gegner, arkaner Schild, Runen lesen", platz: "hinten", wofuer: "Für alle, die gern planen und Wirkung sehen." },
    schurke: { kurz: "Meister der List, der Täuschung und der leisen Klinge.", stark: "Hinterhalt, Nachbluten, Fallen und Schlösser", platz: "Mitte", wofuer: "Für alle, die den richtigen Moment abpassen." },
    kleriker: { kurz: "Heiler, Beschützer und Kämpfer gegen die Finsternis.", stark: "Heilen, segnen, Beistand für Nachbarn", platz: "vorn oder Mitte", wofuer: "Für alle, die die Gruppe zusammenhalten." },
    waldlaeufer: { kurz: "Kundschafter, Jäger und Überlebenskünstler der Wildnis.", stark: "Fernkampf, Rüstung durchbrechen, Spuren lesen", platz: "hinten oder Mitte", wofuer: "Für alle, die aus sicherer Entfernung treffen." },
  };
  const ATTR_NAME = { STR: "Stärke", GES: "Geschick", KON: "Konstitution", INT: "Intelligenz", WEI: "Weisheit", CHA: "Charisma" };
  const vonKlasse = (k) => F.REIHE.filter((fid) => F.FIGUREN[fid].klasse === k);

  /** Klassenfähigkeiten hervorgehoben: Merkmal (Klassenfarbe) + Grundfähigkeiten als Marken, darunter die Wirkung des Merkmals */
  function klassenFaehig(k, alle) {
    const kl = F.KLASSEN[k], [mName, ...mText] = (kl.merkmal || "").split(": ");
    const marken = (kl.merkmal ? [`<b class="marke merkmal">${esc(mName)}</b>`] : [])
      .concat(F.KLASSE_FAEHIG[k].filter((a) => alle || a.ab === 1).map((a) => `<b class="marke">${esc(a.name)}${a.ab > 1 ? ` <small>ab Stufe ${a.ab}</small>` : ""}</b>`));
    return `<span class="klassen-faehig" style="--k:${kl.farbe}"><i>Klassenfähigkeiten</i><span class="marken">${marken.join("")}</span>${kl.merkmal ? `<span class="merkmal-text"><b>${esc(mName)}:</b> ${esc(mText.join(": "))}</span>` : ""}</span>`;
  }
  /** Schritt 1: fünf Klassenbanner mit kurzen Angaben. o.gruppe markiert, wer schon dabei ist */
  function klassenWahl(o = {}) {
    const gruppe = o.gruppe || [];
    return `<div class="klassen-banner">${Object.entries(F.KLASSEN).map(([k, kl]) => {
      const info = KLASSE_INFO[k], helden = vonKlasse(k), dabei = helden.filter((f) => gruppe.includes(f)).length;
      return `<button class="banner" data-klasse="${k}" style="--k:${kl.farbe}" aria-label="${esc(kl.name)}: ${esc(info.kurz)}">
        <span class="banner-bild">${helden.map((f) => `<img src="${F.bild(f)}" alt="" decoding="async">`).join("")}</span>
        <span class="banner-zeichen" aria-hidden="true">${KLASSE_ZEICHEN[k]}</span>
        <b class="banner-name">${esc(kl.name)}</b>
        <span class="banner-kurz">${esc(info.kurz)}</span>
        ${klassenFaehig(k, false)}
        <span class="banner-spec">
          <span><i>Stärke</i>${esc(info.stark)}</span>
          <span><i>Platz</i>${esc(info.platz)}</span>
          <span><i>Bewegung</i>${kl.bewegung || 6} Felder je Zug</span>
          <span><i>Lebenswürfel</i>W${kl.wuerfel}${kl.plaetze ? " · zaubert" : ""}</span>
          <span><i>Rettung</i>${kl.rettung.map((a) => ATTR_NAME[a]).join(", ")}</span>
        </span>
        <span class="banner-fuss">${dabei ? `<em>${dabei} in der Gruppe</em>` : `3 Helden`}<span aria-hidden="true">→</span></span>
      </button>`;
    }).join("")}</div>`;
  }
  /** Schritt 2: Leiste zum Wechseln der Klasse */
  function klassenLeiste(aktiv) {
    return `<nav class="klassen-leiste" aria-label="Klasse wechseln"><button class="link" id="klassen-zurueck">← Alle Klassen</button>${Object.entries(F.KLASSEN).map(([k, kl]) => `<button data-klasse="${k}" class="${k === aktiv ? "an" : ""}" style="--k:${kl.farbe}">${KLASSE_ZEICHEN[k]} ${esc(kl.name)}</button>`).join("")}</nav>`;
  }
  /** Kopf von Schritt 2: Klasse mit kurzer Beschreibung */
  function klassenKopf(k) {
    const kl = F.KLASSEN[k], info = KLASSE_INFO[k];
    return `<div class="klassen-kopf" style="--k:${kl.farbe}"><span class="banner-zeichen" aria-hidden="true">${KLASSE_ZEICHEN[k]}</span><div><h2>${esc(kl.name)}</h2><p>${esc(info.kurz)} ${esc(info.wofuer)}</p>${klassenFaehig(k, true)}</div></div>`;
  }

  /** Kachel in der Galerie */
  function kachel(fid, o = {}) {
    const d = F.FIGUREN[fid], k = F.KLASSEN[d.klasse];
    return `<button class="fkarte ${o.an ? "an" : ""} ${o.fokus ? "fokus" : ""}" data-fid="${fid}" ${o.gesperrt ? "aria-disabled=\"true\"" : ""} style="--k:${k.farbe}" title="${esc(d.name)} – ${esc(d.titel)}">
      <img src="${F.bild(fid)}" alt="" loading="lazy"><span class="klasse">${KLASSE_ZEICHEN[d.klasse]} ${esc(k.name)}</span>
      <b>${esc(d.name)}</b><small>${esc(d.titel)}</small>${o.status ? `<em class="${o.statusArt || ""}">${esc(o.status)}</em>` : ""}</button>`;
  }
  /** Große Vorstellung einer Figur. knopf: HTML für die Aktion (wählen) */
  function detail(fid, stufe = 1, knopf = "") {
    const d = F.FIGUREN[fid], k = F.KLASSEN[d.klasse], pr = PROFIL[fid];
    const eigene = d.faehig.filter((a) => a.ab === 1), spaeter = d.faehig.filter((a) => a.ab > 1);
    const kl = F.KLASSE_FAEHIG[d.klasse].filter((a) => a.ab === 1);
    const balken = ACHSEN.map((n, i) => `<div class="achse"><span>${n}</span><i>${Array.from({ length: 5 }, (_, j) => `<b class="${j < pr.p[i] ? "an" : ""}"></b>`).join("")}</i></div>`).join("");
    const werte = ["STR", "GES", "KON", "INT", "WEI", "CHA"].map((a) => `<span class="${d.werte[a] >= 16 ? "haupt" : ""}"><small>${a}</small><b>${d.werte[a]}</b><em>${vorz(R.mod(d.werte[a]))}</em></span>`).join("");
    const fae = (a) => `<li><b>${esc(a.name)}</b><span class="typ">${a.typ === "passiv" ? "immer" : a.typ === "bonus" ? "Bonusaktion" : a.typ === "frei" ? "frei" : "Aktion"}</span><p>${esc(a.text)}</p></li>`;
    return `<article class="held" style="--k:${k.farbe}">
      <div class="held-bild"><img src="${F.bild(fid)}" alt="${esc(d.name)}"><span class="held-klasse">${KLASSE_ZEICHEN[d.klasse]} ${esc(k.name)}</span></div>
      <div class="held-text">
        <p class="eyebrow">${esc(d.rolle)} · ${"●".repeat(pr.anspruch)}${"○".repeat(3 - pr.anspruch)} ${ANSPRUCH[pr.anspruch]}</p>
        <h2>${esc(d.name)}</h2><p class="held-titel">${esc(d.titel)}</p>
        <blockquote>„${esc(d.spruch)}“</blockquote>
        <p class="held-spielweise">${esc(pr.spielweise)}</p>
        <div class="held-achsen">${balken}</div>
        <div class="held-kern"><span><b>${F.tpVon(fid, stufe)}</b><small>Trefferpunkte</small></span><span><b>${d.rk[stufe - 1]}</b><small>Rüstungsklasse</small></span><span><b>${d.bewegung || k.bewegung || 6}</b><small>Felder Bewegung</small></span>${k.plaetze ? `<span><b>${F.PLAETZE[stufe][0] + F.PLAETZE[stufe][1]}</b><small>Zauberplätze</small></span>` : ""}${d.wolf ? `<span><b>🐺</b><small>Wolf ${esc(d.wolf.name)}</small></span>` : ""}</div>
        <div class="held-werte">${werte}</div>
        ${knopf}
        <div class="held-reiter" role="tablist"><button role="tab" data-reiter="faehig" class="an">Fähigkeiten</button><button role="tab" data-reiter="werte">Attribute</button><button role="tab" data-reiter="aussen">Abseits des Kampfes</button></div>
        <div class="held-tafel" data-tafel="faehig">
          <ul class="held-faehig">${k.merkmal ? (([n, ...t]) => `<li class="klassen-merkmal"><b>${esc(n)}</b><span class="typ">Klassenmerkmal · immer</span><p>${esc(t.join(": "))}</p></li>`)(k.merkmal.split(": ")) : ""}${eigene.map(fae).join("")}${kl.map(fae).join("")}</ul>
          <p class="held-spaeter">Später: ${spaeter.map((a) => `<b>${esc(a.name)}</b> (Stufe ${a.ab})`).join(" · ")}</p>
        </div>
        <div class="held-tafel" data-tafel="werte" hidden><ul class="held-attr">${["STR", "GES", "KON", "INT", "WEI", "CHA"].map((a) => `<li class="${d.werte[a] >= 16 ? "haupt" : ""}"><span>${ATTR_NAME[a]}</span><b>${d.werte[a]}</b><em>${vorz(R.mod(d.werte[a]))}</em></li>`).join("")}</ul>
          <p class="held-spaeter">Rettungswürfe der Klasse: ${k.rettung.map((a) => ATTR_NAME[a]).join(", ")} · Lebenswürfel W${k.wuerfel}</p></div>
        <div class="held-tafel" data-tafel="aussen" hidden><p class="held-aussen"><b>${esc(d.aussen.name)}:</b> ${esc(d.aussen.text)}</p><p class="held-spaeter">Rolle in der Gruppe: ${esc(d.rolle)}</p></div>
      </div></article>`;
  }
  /** Gruppenplätze (3 Pflicht, 3 frei) */
  function plaetze(gruppe, namen = {}) {
    return `<div class="plaetze">${Array.from({ length: 6 }, (_, i) => {
      const fid = gruppe[i];
      if (!fid) return `<span class="platz leer ${i < 3 ? "pflicht" : ""}"><i>${i + 1}</i><small>${i < 3 ? "gesucht" : "frei"}</small></span>`;
      const d = F.FIGUREN[fid], k = F.KLASSEN[d.klasse];
      return `<span class="platz" style="--k:${k.farbe}" data-platz="${fid}"><img src="${F.bild(fid)}" alt=""><b>${esc(d.name)}</b><small>${namen[fid] ? "📱 " + esc(namen[fid]) : esc(d.titel)}</small></span>`;
    }).join("")}</div>`;
  }
  // Reiter in der Vorstellung (Tisch und Handy)
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-reiter]"); if (!b) return;
    const art = b.closest(".held"); if (!art) return;
    art.querySelectorAll("[data-reiter]").forEach((x) => x.classList.toggle("an", x === b));
    art.querySelectorAll("[data-tafel]").forEach((t) => { t.hidden = t.dataset.tafel !== b.dataset.reiter; });
  });
  window.ABH_HELDEN = { PROFIL, ACHSEN, kachel, detail, plaetze, KLASSE_ZEICHEN, KLASSE_INFO, klassenWahl, klassenLeiste, klassenKopf, vonKlasse };
})();
