/*
 * Der letzte Stern von Eichenfels – Krimidinner (ohne Server)
 *
 * Spielleitung: Namen + Rollenvariante eintragen → Rollen werden zufällig verteilt → jede Person bekommt einen Code.
 * Ein Code (6 Zeichen) enthält: Art (Person/Spielleitung), Rolle, Anzahl Personen, Varianten aller zehn Rollen.
 * Die Spielleitung sieht nur Codes, nie die Zuordnung. Runden werden mit Losungswörtern freigeschaltet, die die
 * Spielleitung vorliest. Alles läuft im Browser, nichts wird an einen Server geschickt.
 * Inhalte: js/content.js (erzeugt aus den .md-Dateien, tools/build_content.py).
 */
(() => {
  "use strict";
  const C = window.KD_CONTENT;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat */ } } };

  /* ---------- Rollen ---------- */
  const IDS = ["R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08", "R09", "R10"];
  const ORDER = ["R02", "R08", "R09", "R10", "R01", "R03", "R06", "R04", "R05", "R07"]; // Besetzung nach Personenzahl
  const NAMES = { R01: ["Leonie Sander", "Leon Sander"], R02: ["Dr. Irene Marwitz", "Dr. Ingo Marwitz"], R03: ["Johanna Ritter", "Johannes Ritter"], R04: ["Clara Lindner", "Carl Lindner"], R05: ["Tessa Hollerbach", "Tom Hollerbach"],
    R06: ["Mina Yilmaz", "Emre Yilmaz"], R07: ["Dr. Nina Seebach", "Dr. Nils Seebach"], R08: ["Dr. Judith Rademacher", "Dr. Julius Rademacher"], R09: ["Paula Faber", "Pascal Faber"], R10: ["Eva Falk", "Egon Falk"] };
  const cast = (n) => ORDER.slice(0, n);

  /* ---------- Codes ---------- */
  const ALPHA = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const mask18 = (salt) => (((salt + 11) * 40503) ^ (salt << 9) ^ 0x2B5A3) & 0x3FFFF;
  const chk = (p18, salt) => { let h = (p18 ^ (salt * 2654435761)) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; return (h ^ (h >>> 13)) & 63; };
  /** variants: Bitmaske, Bit i = 1 → IDS[i] männlich */
  function encode({ host, role = 0, n, variants }) {
    const salt = Math.floor(Math.random() * 64);
    const p18 = ((host ? 1 : 0) << 17) | (role << 13) | ((n - 4) << 10) | variants;
    let v = ((p18 ^ mask18(salt)) << 12) | (salt << 6) | chk(p18, salt), s = "";
    for (let i = 0; i < 6; i++) { s = ALPHA[v & 31] + s; v = Math.floor(v / 32); }
    return s.slice(0, 3) + "-" + s.slice(3);
  }
  function decode(code) {
    const s = String(code || "").toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
    if (s.length !== 6) return null;
    let v = 0; for (const ch of s) { const k = ALPHA.indexOf(ch); if (k < 0) return null; v = v * 32 + k; }
    const c = v & 63, salt = (v >>> 6) & 63, p18 = ((v >>> 12) & 0x3FFFF) ^ mask18(salt);
    if (chk(p18, salt) !== c) return null;
    const host = Boolean(p18 >> 17), role = (p18 >> 13) & 15, n = ((p18 >> 10) & 7) + 4, variants = p18 & 1023;
    if (n > 10 || role > 9) return null;
    if (!host && !cast(n).includes(IDS[role])) return null;
    return { host, role: IDS[role], n, variants, code: s.slice(0, 3) + "-" + s.slice(3) };
  }
  const male = (variants, id) => Boolean(variants & (1 << IDS.indexOf(id)));

  /* ---------- Inhalte entschleiern und Varianten auflösen ---------- */
  const KEY = new TextEncoder().encode("Eichenfels-1901-Sternwarte");
  function unveil(b64) { const bin = atob(b64), b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i) ^ KEY[i % KEY.length]; return new TextDecoder().decode(b); }
  /** {R06: Mina / Emre} → Variante von R06 · [Johanna / Johannes] → eigene Variante */
  function resolve(html, variants, own) {
    html = html.replace(/\{(R\d\d): ([^{}]*?) \/ ([^{}]*?)\}/g, (_, id, w, m) => (male(variants, id) ? m : w));
    if (own) html = html.replace(/\[([^\[\]\/<>]*?) \/ ([^\[\]\/<>]*?)\]/g, (_, w, m) => (male(variants, own) ? m : w));
    return html;
  }
  /** Kleidungstabelle: nur die eigene Spalte; „dasselbe“ übernimmt die weibliche Angabe. */
  function pruneVariantTable(root, isMale) {
    $$("table", root).forEach((t) => {
      const h = $$("thead th", t).map((x) => x.textContent.trim());
      if (h[1] !== "weiblich" || h[2] !== "männlich") return;
      $$("tr", t).forEach((tr) => {
        const c = tr.children; if (c.length < 3) return;
        if (isMale && c[2].textContent.trim() !== "dasselbe") c[1].innerHTML = c[2].innerHTML;
        c[2].remove();
      });
      const th = $("thead th:nth-child(2)", t); if (th) th.textContent = "Deine Variante";
    });
  }

  /* ---------- Runden ---------- */
  const ROUNDS = [
    { no: 1, name: "Runde 1 · nach dem Fund", phase: "Phase 2", word: "KUPPEL", cls: "r1" },
    { no: 2, name: "Runde 2 · Geheimnisse", phase: "Phase 3", word: "ORION", cls: "r2" },
    { no: 3, name: "Runde 3 · die letzte Ermittlung", phase: "Phase 4", word: "NEBEL", cls: "r3" },
    { no: 4, name: "Finale · nach der Anklage", phase: "Finale", word: "MORGENGRAUEN", cls: "r4" },
  ];
  const EXTRA = { word: "FUNK", card: "B12" }; // Lindners Aufnahme, wenn R04 besetzt ist, aber nichts vorgelegt hat
  /** Welche Karten gehören in dieser Besetzung zu Runde r? */
  function cardsFor(r, n, extraOpen) {
    const c = cast(n);
    return Object.entries(C.cards).filter(([id, k]) => k.round === r && (id !== "B8" || !c.includes("R07")) && (id !== "B12" || !c.includes("R04") || extraOpen)).map(([id]) => id);
  }
  function cardHtml(id, variants) {
    const k = C.cards[id], r = ROUNDS[k.round - 1];
    return `<article class="ecard ${r.cls}${["B3", "B9", "B11"].includes(id) ? " dense" : ""}"><header><span>STERNWARTE EICHENFELS</span><span>${id} ${esc(k.icon)}</span></header><h4>${esc(k.title)}</h4><div class="body">${resolve(unveil(k.html), variants)}</div><footer>${esc(k.foot)}</footer></article>`;
  }

  /* ---------- Ansichten ---------- */
  const app = $("#app");
  const go = (h) => { location.hash = h; };
  const star = `<svg class="star" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-opacity=".35"/><path d="M50 14 L57 43 L86 50 L57 57 L50 86 L43 57 L14 50 L43 43 Z" fill="currentColor"/></svg>`;

  function viewStart() {
    const host = store.get("kd_eich_host", null), me = store.get("kd_eich_me", null);
    app.innerHTML = `${star}<p class="eyebrow">Krimidinner · Fall 01</p><h1>Der letzte Stern von Eichenfels</h1>
      <p class="lead">Ein Galadinner in einer Sternwarte im Thüringer Wald. Ein Professor kündigt für 22 Uhr die Wahrheit an – und erlebt es nicht mehr. Für 4–10 Personen am Tisch, mit einer Spielleitung, die mitspielen darf.</p>
      <div class="choice">
        <a href="#anlegen"><b>Einen Abend anlegen</b><span>Für die Spielleitung: Gäste eintragen, Rollen verteilen lassen, Codes weitergeben.</span></a>
        <a href="#code"><b>Mein Rollenblatt öffnen</b><span>Für alle Gäste: mit dem Code, den du von der Spielleitung bekommen hast.</span></a>
      </div>
      <div class="row">${me ? `<a class="btn" href="#rolle">Weiter zu meinem Rollenblatt</a>` : ""}${host ? `<a class="btn ghost" href="#leitung">Zur Spielleitung</a>` : ""}<a class="btn ghost" href="#anleitung">Spielanleitung lesen</a></div>
      <p class="muted small" style="margin-top:28px">Alles läuft in deinem Browser. Namen und Codes werden nirgends hochgeladen.</p>`;
  }

  function viewAnleitung() {
    app.innerHTML = `<p class="eyebrow">Für alle · ohne Lösung</p><h1>Spielanleitung</h1><div class="guide">${C.guide}</div><p><a class="btn ghost" href="#start">Zurück</a></p>`;
  }

  /* Abend anlegen */
  let draft = store.get("kd_eich_draft", null) || { people: [{ name: "", m: false }, { name: "", m: false }, { name: "", m: false }, { name: "", m: false }] };
  function viewAnlegen() {
    const n = draft.people.length;
    app.innerHTML = `<p class="eyebrow">Spielleitung · Schritt 1</p><h1>Gäste eintragen</h1>
      <p>Trag alle ein, die mitspielen – <b>auch dich selbst, wenn du mitspielst</b>. Wähle für jede Person die Rollenvariante: wie die Figur dargestellt wird, weiblich oder männlich. Jede Person darf frei wählen.</p>
      <div class="people">${draft.people.map((p, i) => `<div class="person"><input type="text" data-name="${i}" value="${esc(p.name)}" placeholder="Name ${i + 1}" maxlength="30" autocomplete="off">
        <span class="seg"><button type="button" data-v="${i}|0" class="${p.m ? "" : "on"}">weiblich</button><button type="button" data-v="${i}|1" class="${p.m ? "on" : ""}">männlich</button></span>
        <button type="button" class="x" data-del="${i}" aria-label="Entfernen" ${n <= 4 ? "disabled" : ""}>×</button></div>`).join("")}</div>
      <div class="row"><button class="btn ghost small" data-add ${n >= 10 ? "disabled" : ""}>+ Person hinzufügen (${n}/10)</button></div>
      <p class="note">Es spielen ${n} Personen. Besetzt werden die ${n} Rollen für diese Gruppengröße, die übrigen sind Nebenfiguren, deren Wissen über die Beweise kommt.</p>
      <div class="row"><button class="btn" data-deal>Rollen verteilen</button><a class="btn ghost" href="#start">Abbrechen</a></div><p class="fb" id="fb"></p>`;
    $$("[data-name]").forEach((el) => el.addEventListener("input", () => { draft.people[+el.dataset.name].name = el.value; store.set("kd_eich_draft", draft); }));
    $$("[data-v]").forEach((b) => b.onclick = () => { const [i, m] = b.dataset.v.split("|"); draft.people[+i].m = m === "1"; store.set("kd_eich_draft", draft); viewAnlegen(); });
    $$("[data-del]").forEach((b) => b.onclick = () => { draft.people.splice(+b.dataset.del, 1); store.set("kd_eich_draft", draft); viewAnlegen(); });
    $("[data-add]").onclick = () => { draft.people.push({ name: "", m: false }); store.set("kd_eich_draft", draft); viewAnlegen(); $$("[data-name]").pop().focus(); };
    $("[data-deal]").onclick = deal;
  }
  function deal() {
    const ppl = draft.people.map((p) => ({ ...p, name: p.name.trim() }));
    if (ppl.some((p) => !p.name)) { $("#fb").textContent = "Bitte bei allen Personen einen Namen eintragen."; return; }
    const n = ppl.length, roles = cast(n).slice();
    for (let i = roles.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [roles[i], roles[j]] = [roles[j], roles[i]]; } // zufällig
    let variants = 0;
    IDS.forEach((id, i) => { if (!roles.includes(id) && Math.random() < 0.5) variants |= 1 << i; }); // Nebenfiguren zufällig
    ppl.forEach((p, k) => { if (p.m) variants |= 1 << IDS.indexOf(roles[k]); });
    const people = ppl.map((p, k) => ({ name: p.name, code: encode({ host: false, role: IDS.indexOf(roles[k]), n, variants }) }));
    const host = { code: encode({ host: true, n, variants }), people, created: Date.now(), seen: {} };
    store.set("kd_eich_host", host); store.set("kd_eich_draft", null); draft = { people: [{ name: "", m: false }, { name: "", m: false }, { name: "", m: false }, { name: "", m: false }] };
    go("verteilen");
  }
  const link = (code) => location.href.split("#")[0] + "#c=" + code.replace("-", "");
  function viewVerteilen() {
    const host = store.get("kd_eich_host", null); if (!host) { go("anlegen"); return; }
    app.innerHTML = `<p class="eyebrow">Spielleitung · Schritt 2</p><h1>Codes weitergeben</h1>
      <p>Jede Person bekommt <b>nur ihren eigenen</b> Code. Am einfachsten über „Senden“: Dann geht ein Link direkt an die Person, und du musst den Code nicht ansehen.</p>
      <div class="codes">${host.people.map((p, i) => `<div class="codeline"><b>${esc(p.name)}</b><span class="shown" data-show="${i}" hidden>${p.code}</span>
        <button class="btn ghost small" data-reveal="${i}">Code zeigen</button><button class="btn small" data-share="${i}">Senden</button></div>`).join("")}</div>
      <p class="note">Bitte nicht in eine Gruppe schreiben. Wer einen fremden Code öffnet, sieht dessen Rolle. Das Spiel lebt davon, dass das niemand tut – auch die Spielleitung nicht.</p>
      <h2>Dein Spielleitungscode</h2><p>Damit öffnest du Ablauf, Losungswörter, Beweise und am Ende die Lösung, auch auf einem anderen Gerät. Gut aufheben.</p>
      <div class="bigcode">${host.code}</div>
      <div class="row"><a class="btn" href="#leitung">Weiter zur Spielleitung</a><a class="btn ghost" href="#anleitung">Anleitung (zum Weiterschicken)</a></div>`;
    $$("[data-reveal]").forEach((b) => b.onclick = () => { const s = $(`[data-show="${b.dataset.reveal}"]`); s.hidden = !s.hidden; b.textContent = s.hidden ? "Code zeigen" : "verbergen"; });
    $$("[data-share]").forEach((b) => b.onclick = async () => {
      const p = host.people[+b.dataset.share], text = `${p.name}, hier ist dein Rollenblatt für „Der letzte Stern von Eichenfels“. Bitte nur selbst öffnen: ${link(p.code)} (Code ${p.code})`;
      try { if (navigator.share) { await navigator.share({ title: "Dein Rollenblatt", text }); return; } } catch (e) { return; }
      try { await navigator.clipboard.writeText(text); b.textContent = "Kopiert ✓"; } catch (e) { const s = $(`[data-show="${b.dataset.share}"]`); s.hidden = false; }
    });
  }

  /* Code eingeben */
  function viewCode(prefill) {
    app.innerHTML = `<p class="eyebrow">Für alle Gäste</p><h1>Rollenblatt öffnen</h1><p>Gib den Code ein, den du von der Spielleitung bekommen hast.</p>
      <input type="text" class="code" id="codeIn" maxlength="7" placeholder="XXX-XXX" autocomplete="off" value="${esc(prefill || "")}"><p class="fb" id="fb"></p>
      <div class="row"><button class="btn" id="open">Öffnen</button><a class="btn ghost" href="#start">Zurück</a></div>`;
    const open = () => {
      const d = decode($("#codeIn").value);
      if (!d) { $("#fb").textContent = "Dieser Code passt nicht. Bitte noch einmal genau abschreiben."; return; }
      if (d.host) { const h = store.get("kd_eich_host", null); store.set("kd_eich_host", h && h.code === d.code ? h : { code: d.code, people: [], seen: {} }); go("leitung"); return; }
      store.set("kd_eich_me", { code: d.code, open: {} }); go("rolle");
    };
    $("#open").onclick = open; $("#codeIn").addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
    if (prefill) open();
  }

  /* Rollenblatt */
  let tab = "s1";
  function viewRolle() {
    const me = store.get("kd_eich_me", null), d = me && decode(me.code);
    if (!d || d.host) { go("code"); return; }
    const role = C.roles[d.role], isM = male(d.variants, d.role), name = NAMES[d.role][isM ? 1 : 0];
    const tabs = [["s1", "Charakter"], ["s2", "Kleidung"], ["s3", "Was du weißt"], ["s4", "Vertraulich"], ["bew", "Beweise"], ["anl", "Regeln"]];
    app.innerHTML = `<p class="eyebrow">Dein Rollenblatt · ${d.role}</p><h1>${esc(name)}</h1><p class="muted">${esc(role.title.replace(/\s*—.*$/, ""))}</p>
      <nav class="tabs no-print">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? "on" : ""}${k === "s4" ? " secret" : ""}">${l}</button>`).join("")}</nav><section id="pane"></section>`;
    $$("[data-tab]").forEach((b) => b.onclick = () => { tab = b.dataset.tab; viewRolle(); });
    const pane = $("#pane");
    const page = (i) => { const div = document.createElement("div"); div.className = "doc" + (i === 3 ? " secret" : ""); div.innerHTML = (i === 3 ? `<span class="stamp">VERTRAULICH</span>` : "") + `<p class="dossier-head">STERNWARTE EICHENFELS · DOSSIER ${d.role} · SEITE ${i + 1}</p>` + resolve(unveil(role.pages[i]), d.variants, d.role); pruneVariantTable(div, isM); return div; };
    if (tab.startsWith("s")) {
      const i = +tab[1] - 1;
      if (i === 3 && !me.s4) {
        pane.innerHTML = `<div class="seal"><span class="stamp">VERTRAULICH</span><p>Diese Seite ist nur für dich: dein Geheimnis, deine Ziele, deine Spielhinweise. Achte darauf, dass niemand mitliest.</p><button class="btn" id="s4">Öffnen</button></div>`;
        $("#s4").onclick = () => { me.s4 = true; store.set("kd_eich_me", me); viewRolle(); };
      } else pane.appendChild(page(i));
      pane.insertAdjacentHTML("beforeend", `<p class="row no-print" style="margin-top:18px"><button class="btn ghost small" id="prt">Mein Rollenblatt drucken</button><a class="btn ghost small" href="#start">Start</a></p>`);
      $("#prt").onclick = () => { $("#print").innerHTML = ""; for (let k = 0; k < 4; k++) { const w = document.createElement("div"); w.className = "p-doc"; w.appendChild(page(k)); $("#print").appendChild(w); } window.print(); };
      return;
    }
    if (tab === "anl") { pane.innerHTML = `<div class="guide">${C.guide}</div>`; return; }
    // Beweise
    const open = me.open || {};
    const unlocked = ROUNDS.filter((r) => open[r.no]);
    pane.innerHTML = `<p>Die Spielleitung liest zu Beginn jeder Runde ein <b>Losungswort</b> vor. Gib es hier ein, dann siehst du die Beweise dieser Runde.</p>
      <div class="unlock"><input type="text" class="code" id="word" placeholder="LOSUNGSWORT" autocomplete="off" style="letter-spacing:.12em;font-size:18px"><button class="btn" id="unl">Freischalten</button></div><p class="fb" id="fb"></p>
      ${unlocked.length ? "" : `<p class="muted">Noch keine Beweise freigegeben.</p>`}
      <div class="cardlist">${unlocked.slice().reverse().map((r) => `<h3>${esc(r.name)}</h3>` + cardsFor(r.no, d.n, open.extra).map((id) => cardHtml(id, d.variants)).join("")).join("")}</div>`;
    const tryWord = () => {
      const w = $("#word").value.trim().toUpperCase().replace(/\s+/g, "");
      const r = ROUNDS.find((x) => x.word === w);
      if (w === EXTRA.word) { open.extra = true; } else if (r) { for (let k = 1; k <= r.no; k++) open[k] = true; } else { $("#fb").textContent = "Dieses Losungswort kennt das Spiel nicht."; return; }
      me.open = open; store.set("kd_eich_me", me); viewRolle();
    };
    $("#unl").onclick = tryWord; $("#word").addEventListener("keydown", (e) => { if (e.key === "Enter") tryWord(); });
  }

  /* Spielleitung */
  let htab = "ablauf";
  function viewLeitung() {
    const host = store.get("kd_eich_host", null), d = host && decode(host.code);
    if (!d || !d.host) { viewCode(); $("h1").textContent = "Spielleitungscode eingeben"; return; }
    const c = cast(d.n), seen = host.seen || {};
    const tabs = [["ablauf", "Ablauf & Vorlesetexte"], ["runden", "Runden & Beweise"], ["druck", "Drucken"], ["loesung", "Lösung"]];
    app.innerHTML = `<p class="eyebrow">Spielleitung · ${d.n} Personen · Code ${d.code}</p><h1>Der Abend</h1>
      <nav class="tabs no-print">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${htab === k ? "on" : ""}${k === "loesung" ? " secret" : ""}">${l}</button>`).join("")}</nav><section id="pane"></section>`;
    $$("[data-tab]").forEach((b) => b.onclick = () => { htab = b.dataset.tab; viewLeitung(); });
    const pane = $("#pane");
    if (htab === "ablauf") {
      pane.innerHTML = `<p class="note">Besetzt: ${c.map((id) => id).join(" · ")}. Nebenfiguren: ${IDS.filter((id) => !c.includes(id)).join(" · ") || "keine"}. ${c.includes("R07") ? "" : "B8 kommt in Runde 2 dazu. "}${c.includes("R04") ? "B12 nur, wenn Lindner die Aufnahme bis Runde 3 nicht vorlegt (Losungswort FUNK)." : "B12 kommt in Runde 3 dazu."}</p>
        <div class="hostdoc">${resolve(C.hostA, d.variants)}</div>`;
      // Nebenfiguren-Tabelle: nur nicht besetzte Rollen zeigen
      $$(".hostdoc table").forEach((t) => { if ($("thead th", t) && $("thead th", t).textContent.trim() === "Nebenfigur") $$("tbody tr", t).forEach((tr) => { if (c.includes(tr.children[0].textContent.trim())) tr.remove(); }); });
      return;
    }
    if (htab === "runden") {
      pane.innerHTML = `<p>Öffne eine Runde erst, wenn die Phase beginnt. Lies dann das <b>Losungswort</b> vor: Wer es eingibt, sieht die Beweise auf dem eigenen Handy. Ohne Handys zeigst du die Karten hier oder legst die gedruckten Karten auf den Tisch.</p>
        <div class="rounds">${ROUNDS.map((r) => `<div class="round ${r.cls}"><h3>${esc(r.name)}</h3><p class="muted small">${r.phase} · ${cardsFor(r.no, d.n, false).join(", ")}</p>
          ${seen[r.no] ? `<div class="word">${r.word}</div><button class="btn small" data-cards="${r.no}">Karten zeigen</button>` : `<button class="btn ghost small" data-round="${r.no}">${r.no === 4 ? "Finale öffnen – erst nach der Anklage" : "Runde öffnen"}</button>`}</div>`).join("")}
          ${c.includes("R04") ? `<div class="round r3"><h3>Zusatz · Lindners Aufnahme (B12)</h3><p class="muted small">Nur wenn Lindner die Aufnahme bis Runde 3 nicht vorgelegt hat.</p>${seen.extra ? `<div class="word">${EXTRA.word}</div><button class="btn small" data-cards="extra">Karte zeigen</button>` : `<button class="btn ghost small" data-round="extra">Freigeben</button>`}</div>` : ""}</div>`;
      $$("[data-round]").forEach((b) => b.onclick = () => {
        const k = b.dataset.round;
        if (k === "4" && !confirm("Haben alle ihre Anklage abgegeben? Die Finale-Karten verraten die Lösung.")) return;
        seen[k] = true; host.seen = seen; store.set("kd_eich_host", host); viewLeitung();
      });
      $$("[data-cards]").forEach((b) => b.onclick = () => {
        const k = b.dataset.cards, ids = k === "extra" ? ["B12"] : cardsFor(+k, d.n, false);
        showOverlay(`<div class="cardlist">${ids.map((id) => cardHtml(id, d.variants)).join("")}</div>`);
      });
      return;
    }
    if (htab === "druck") {
      pane.innerHTML = `<p>Für einen Abend ohne Handys. Der Browser öffnet den Druckdialog, dort kannst du auch „Als PDF sichern“ wählen.</p>
        <div class="rounds">
          <div class="round"><h3>Beweiskarten</h3><p class="muted small">A6, vier pro Seite, nach Runden. Finale-Karten in einen Umschlag „Erst nach der Anklage öffnen“.</p><button class="btn small" data-p="cards">Drucken</button></div>
          <div class="round"><h3>Gastgeberheft Teil A</h3><p class="muted small">Ablauf, Vorlesetexte, Anklagezettel. Keine Lösung.</p><button class="btn small" data-p="hostA">Drucken</button></div>
          <div class="round"><h3>Spielanleitung</h3><p class="muted small">Für alle, ohne Lösung.</p><button class="btn small" data-p="guide">Drucken</button></div>
          <div class="round r3"><h3>Alle Rollenblätter</h3><p class="muted small">Jedes Blatt beginnt auf einer neuen Seite, die vertrauliche Seite 4 einzeln. <b>Du siehst dabei alle Rollen.</b> Wenn du mitspielst, lass jede Person ihr Blatt lieber selbst drucken (im Rollenblatt: „Drucken“). Ohne Namen, in zufälliger Reihenfolge – jede Person zieht verdeckt einen Umschlag.</p><button class="btn ghost small" data-p="roles">Trotzdem drucken</button></div>
        </div>`;
      $$("[data-p]").forEach((b) => b.onclick = () => printDocs(b.dataset.p, d));
      return;
    }
    // Lösung
    if (!seen.solution) {
      pane.innerHTML = `<div class="seal"><span class="stamp">VERSIEGELT</span><p>Teil B des Gastgeberhefts enthält die Lösung. Öffne ihn erst, wenn alle Anklagezettel abgegeben und vorgelesen sind.</p><button class="btn" id="sol">Siegel brechen</button></div>`;
      $("#sol").onclick = () => { if (!confirm("Wirklich öffnen? Danach kennst du die Lösung.")) return; seen.solution = true; host.seen = seen; store.set("kd_eich_host", host); viewLeitung(); };
      return;
    }
    pane.innerHTML = `<div class="hostdoc">${resolve(unveil(C.hostB), d.variants)}</div><p class="row" style="margin-top:14px"><button class="btn ghost small" data-p="hostB">Teil B drucken</button></p>`;
    $("[data-p]").onclick = () => printDocs("hostB", d);
  }

  function printDocs(what, d) {
    const P = $("#print"); P.innerHTML = "";
    const add = (html, cls = "p-doc") => { const w = document.createElement("div"); w.className = cls; w.innerHTML = html; P.appendChild(w); return w; };
    if (what === "hostA") add(`<div class="hostdoc">${resolve(C.hostA, d.variants)}</div>`);
    if (what === "hostB") add(`<div class="hostdoc">${resolve(unveil(C.hostB), d.variants)}</div>`);
    if (what === "guide") add(`<div class="guide"><h1>Der letzte Stern von Eichenfels – Spielanleitung</h1>${C.guide}</div>`);
    if (what === "cards") {
      const ids = [1, 2, 3, 4].flatMap((r) => cardsFor(r, d.n, true));
      for (let i = 0; i < ids.length; i += 4) add(ids.slice(i, i + 4).map((id) => cardHtml(id, d.variants)).join(""), "p-cards");
    }
    if (what === "roles") {
      const ids = cast(d.n).slice().sort(() => Math.random() - 0.5);
      ids.forEach((id) => {
        const isM = male(d.variants, id), role = C.roles[id];
        for (let k = 0; k < 4; k++) {
          const w = add(`<div class="doc${k === 3 ? " secret" : ""}">${k === 3 ? `<span class="stamp">VERTRAULICH</span>` : ""}<p class="dossier-head">STERNWARTE EICHENFELS · DOSSIER · SEITE ${k + 1}</p>${k === 0 ? `<h1>${esc(NAMES[id][isM ? 1 : 0])}</h1>` : ""}${resolve(unveil(role.pages[k]), d.variants, id)}</div>`);
          pruneVariantTable(w, isM);
        }
      });
    }
    window.print();
  }

  function showOverlay(html) {
    const o = $("#overlay"); o.innerHTML = `<div class="inner"><button class="close" aria-label="Schließen">×</button>${html}</div>`; o.hidden = false;
    $(".close", o).onclick = () => { o.hidden = true; o.innerHTML = ""; };
  }

  /* ---------- Router ---------- */
  function route() {
    const h = location.hash.slice(1);
    window.scrollTo(0, 0);
    if (h.startsWith("c=")) { viewCode(decodeURIComponent(h.slice(2))); return; }
    ({ anlegen: viewAnlegen, verteilen: viewVerteilen, code: () => viewCode(), rolle: viewRolle, leitung: viewLeitung, anleitung: viewAnleitung }[h] || viewStart)();
  }
  window.addEventListener("hashchange", route);
  route();
  window.KD = { encode, decode, cast, cardsFor }; // für Tests
})();
