/*
 * Krimidinner-Engine (ohne Server) – gemeinsam für alle Fälle.
 *
 * Alles Fallspezifische steht in <fall>/fall.json und kommt über <fall>/js/content.js (window.KD_CONTENT.fall),
 * erzeugt von engine/build_case.py aus den .md-Dateien. Diese Datei kennt keinen Fall, keine Rolle und kein Losungswort.
 *
 * Spielleitung: Namen + Rollenvariante eintragen → Rollen werden zufällig verteilt → jede Person bekommt einen Code.
 * Code v2 (9 Zeichen, XXX-XXX-XXX): Version, Fall, Art (Person/Spielleitung), Rolle, Personenzahl, Varianten aller Rollen,
 * Salz, Prüfsumme. Ältere 6-Zeichen-Codes (v1) gelten weiter, wenn der Fall sie kennt (fall.codeV1).
 * Runden werden mit Losungswörtern freigeschaltet. Optional: Live-Verbindung über platform/multiplayer (eine Kennung für alle Fälle).
 */
(() => {
  "use strict";
  const C = window.KD_CONTENT, F = C.fall;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat */ } } };
  const SK = (k) => F.store + k; // Speicherschlüssel je Fall, z. B. kd_eich_host

  /* ---------- Fall: Rollen, Besetzung, Gestaltung ---------- */
  const IDS = F.roles.map((r) => r.id);
  const NAMES = Object.fromEntries(F.roles.map((r) => [r.id, r.names]));
  const ORDER = F.cast.order, MIN = F.players.min, MAX = F.players.max;
  const cast = (n) => ORDER.slice(0, n);
  const T = F.texts;
  const ROUNDS = F.rounds.map((r) => ({ ...r, cls: "r" + r.no }));
  const FINAL = ROUNDS.find((r) => r.final) || ROUNDS[ROUNDS.length - 1];
  const RP = ROUNDS.filter((r) => r.rolePart); // Runden mit eigenem Abschnitt im Rollenblatt
  const PARTS = ["Charakter", "Kleidung", "Vertraulich"].concat(RP.map((r) => r.rolePart));
  const STEPS = F.steps;
  const HOUSE = F.house || null, HOUSE_TAB = (HOUSE && HOUSE.tab) || "Haus";
  (function theme() {
    const th = F.theme || {}, root = document.documentElement.style;
    if (th.bg) root.setProperty("--bg", th.bg);
    if (th.accent) { root.setProperty("--brass", th.accent); root.setProperty("--gold", th.accent); }
    if (th.panel) root.setProperty("--panel", th.panel);
    const st = document.createElement("style");
    st.textContent = ROUNDS.map((r) => (r.color ? `.${r.cls}{--c:${r.color}}` : "")).join("");
    document.head.appendChild(st);
    const br = $(".top .brand"); if (br && T.brand) br.textContent = T.brand;
  })();

  /* ---------- Codes ---------- */
  const ALPHA = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const clean = (code) => String(code || "").toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1").replace(/U/g, "V");
  const group = (s) => s.match(/.{1,3}/g).join("-");
  const R = IDS.length, PBITS = 19 + R, CHARS = Math.ceil((PBITS + 14) / 5), W = CHARS * 5 - 14;
  /** Maske aus dem Salz: verschleiert alle Felder (auch die Füllbits), damit Codes nicht ähnlich aussehen. */
  function mask(salt, width) {
    let x = (Math.imul(salt + 7, 2654435761) ^ 0x5bd1e995) >>> 0, m = 0n;
    for (let got = 0; got < width; got += 32) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; m = (m << 32n) | BigInt(x); }
    return m & ((1n << BigInt(width)) - 1n);
  }
  function chk8(payload, salt) { let h = 0x811c9dc5 ^ salt; let p = payload; for (let i = 0; i < 10; i++) { h = Math.imul(h ^ Number(p & 255n), 16777619) >>> 0; p >>= 8n; } return (h ^ (h >>> 8) ^ (h >>> 16) ^ (h >>> 24)) & 255; }
  /** variants: Bitmaske, Bit i = 1 → IDS[i] männlich. role: Index in IDS. */
  function encode({ host, role = 0, n, variants }) {
    const salt = Math.floor(Math.random() * 64);
    const payload = 1n | (BigInt(F.nr) << 2n) | (BigInt(host ? 1 : 0) << 8n) | (BigInt(role) << 9n) | (BigInt(n) << 14n) | (BigInt(variants) << 19n);
    let v = ((payload ^ mask(salt, W)) << 14n) | (BigInt(salt) << 8n) | BigInt(chk8(payload, salt)), s = "";
    for (let i = 0; i < CHARS; i++) { s = ALPHA[Number(v & 31n)] + s; v >>= 5n; }
    return group(s);
  }
  /** Liest einen Code. Ergebnis: Rolle dieses Falls · { other: nr } für einen Code eines anderen Falls · null. */
  function decode(code) {
    const s = clean(code);
    if (s.length === 6) return F.codeV1 ? decodeV1(s) : null;
    if (s.length < 9 || s.length > 12) return null;
    let v = 0n; for (const ch of s) { const k = ALPHA.indexOf(ch); if (k < 0) return null; v = v * 32n + BigInt(k); }
    const c = Number(v & 255n), salt = Number((v >> 8n) & 63n), width = s.length * 5 - 14;
    const payload = (v >> 14n) ^ mask(salt, width);
    if (chk8(payload, salt) !== c || (payload & 3n) !== 1n) return null;
    const nr = Number((payload >> 2n) & 63n);
    if (nr !== F.nr) return { other: nr, code: group(s) };
    if (s.length !== CHARS || payload >> BigInt(PBITS)) return null;
    const host = Boolean((payload >> 8n) & 1n), ri = Number((payload >> 9n) & 31n), n = Number((payload >> 14n) & 31n), variants = Number((payload >> 19n) & ((1n << BigInt(R)) - 1n));
    if (ri >= R || n < MIN || n > MAX) return null;
    if (!host && !cast(n).includes(IDS[ri])) return null;
    return { host, role: IDS[ri], n, variants, code: group(s), v: 2 };
  }
  /* Code v1 (6 Zeichen, 30 Bit, genau 10 Rollen, 4–10 Personen) – nur für Fälle, die schon damit verschickt wurden. */
  const mask18 = (salt) => (((salt + 11) * 40503) ^ (salt << 9) ^ 0x2B5A3) & 0x3FFFF;
  const chk6 = (p18, salt) => { let h = (p18 ^ (salt * 2654435761)) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; return (h ^ (h >>> 13)) & 63; };
  function encodeV1({ host, role = 0, n, variants }) {
    const salt = Math.floor(Math.random() * 64);
    const p18 = ((host ? 1 : 0) << 17) | (role << 13) | ((n - 4) << 10) | variants;
    let v = ((p18 ^ mask18(salt)) << 12) | (salt << 6) | chk6(p18, salt), s = "";
    for (let i = 0; i < 6; i++) { s = ALPHA[v & 31] + s; v = Math.floor(v / 32); }
    return s.slice(0, 3) + "-" + s.slice(3);
  }
  function decodeV1(s) {
    let v = 0; for (const ch of s) { const k = ALPHA.indexOf(ch); if (k < 0) return null; v = v * 32 + k; }
    const c = v & 63, salt = (v >>> 6) & 63, p18 = ((v >>> 12) & 0x3FFFF) ^ mask18(salt);
    if (chk6(p18, salt) !== c) return null;
    const host = Boolean(p18 >> 17), role = (p18 >> 13) & 15, n = ((p18 >> 10) & 7) + 4, variants = p18 & 1023;
    if (n > 10 || role > 9 || role >= R || n < MIN || n > MAX) return null;
    if (!host && !cast(n).includes(IDS[role])) return null;
    return { host, role: IDS[role], n, variants, code: s.slice(0, 3) + "-" + s.slice(3), v: 1 };
  }
  const male = (variants, id) => Boolean(variants & (1 << IDS.indexOf(id)));
  const nameOf = (id, variants) => NAMES[id][male(variants, id) ? 1 : 0];
  const otherCase = (nr) => (window.KD_FAELLE || []).find((f) => f.nr === nr);

  /* ---------- Inhalte entschleiern und Varianten auflösen ---------- */
  const KEY = new TextEncoder().encode(C.key);
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

  /* ---------- Karten ---------- */
  const CARDCFG = F.cards || {};
  const EXTRA = Object.entries(CARDCFG).filter(([, k]) => k.extraWord).map(([id, k]) => ({ id, word: k.extraWord.toUpperCase(), hint: k.extraHint || "" }));
  const condOk = (id, c) => { const w = (CARDCFG[id] || {}).when || {}; return (w.present || []).every((r) => c.includes(r)) && (w.missing || []).every((r) => !c.includes(r)); };
  /** extraOpen: true (alle Zusatzwörter) · Objekt der geöffneten Runden/Zusatzwörter eines Gastes · false */
  const extraIsOpen = (extraOpen, id) => extraOpen === true || Boolean(extraOpen && (extraOpen["x:" + id] || (extraOpen.extra && EXTRA[0] && EXTRA[0].id === id)));
  function cardsFor(r, n, extraOpen) {
    const c = cast(n);
    return Object.entries(C.cards).filter(([id, k]) => k.round === r && (condOk(id, c) || ((CARDCFG[id] || {}).extraWord && extraIsOpen(extraOpen, id)))).map(([id]) => id);
  }
  const P2R = (F.npc && F.npc.phaseToRound) || {};
  /** Aussagen der Nebenfiguren: Wissen unbesetzter Rollen als Karte, Phase → Runde laut fall.json. */
  const npcFor = (r, n) => C.npc.map((x, i) => ({ ...x, i })).filter((x) => P2R[x.phase] === r && !cast(n).includes(x.role));
  const roundOf = (no) => ROUNDS.find((r) => r.no === no);
  function npcHtml(x, variants) {
    const r = roundOf(P2R[x.phase]);
    return `<article class="ecard npc-card ${r.cls}"><header><span>${esc(T.cardHeader)}</span><span>AUSSAGE ☏</span></header><h4>Aussage · ${esc(nameOf(x.role, variants))}</h4><div class="body"><p>${resolve(unveil(x.html), variants)}</p></div><footer>Nebenfigur · bei euch nicht besetzt · ${esc(r.name.split(" · ")[0])}</footer></article>`;
  }
  function cardHtml(id, variants) {
    const k = C.cards[id], r = roundOf(k.round), pr = (CARDCFG[id] || {}).print;
    return `<article class="ecard ${r.cls}${pr === "dense" || pr === "sheet" ? " dense" : ""}"><header><span>${esc(T.cardHeader)}</span><span>${id} ${esc(k.icon)}</span></header><h4>${esc(k.title)}</h4><div class="body">${resolve(unveil(k.html), variants)}</div><footer>${esc(k.foot)}</footer></article>`;
  }

  /* ---------- Ansichten ---------- */
  const app = $("#app");
  const go = (h) => { location.hash = h; };
  const emblem = C.emblem || `<svg class="star" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-opacity=".35"/><path d="M50 14 L57 43 L86 50 L57 57 L50 86 L43 57 L14 50 L43 43 Z" fill="currentColor"/></svg>`;

  function viewStart() {
    const host = store.get(SK("host"), null), me = store.get(SK("me"), null);
    app.innerHTML = `${emblem}<p class="eyebrow">${esc(T.eyebrow)}</p><h1>${esc(F.title)}</h1>
      <p class="lead">${esc(T.teaser)} Für ${MIN}–${MAX} Personen am Tisch, mit einer Spielleitung, die mitspielen darf.</p>
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
  const blank = () => ({ people: Array.from({ length: MIN }, () => ({ name: "", m: false })), hostIdx: -1 });
  let draft = store.get(SK("draft"), null) || blank();
  if (draft.hostIdx === undefined) draft.hostIdx = -1;
  const saveDraft = () => store.set(SK("draft"), draft);
  function viewAnlegen() {
    const n = draft.people.length, hostRule = Boolean(F.host && F.host.neverCulprit);
    app.innerHTML = `<p class="eyebrow">Spielleitung · Schritt 1</p><h1>Gäste eintragen</h1>
      <p>Trag alle ein, die mitspielen – <b>auch dich selbst, wenn du mitspielst</b>. Wähle für jede Person die Rollenvariante: wie die Figur dargestellt wird, weiblich oder männlich. Jede Person darf frei wählen.</p>
      <div class="people">${draft.people.map((p, i) => `<div class="person"><input type="text" data-name="${i}" value="${esc(p.name)}" placeholder="Name ${i + 1}" maxlength="30" autocomplete="off">
        <span class="seg"><button type="button" data-v="${i}|0" class="${p.m ? "" : "on"}">weiblich</button><button type="button" data-v="${i}|1" class="${p.m ? "on" : ""}">männlich</button></span>
        <button type="button" class="x" data-del="${i}" aria-label="Entfernen" ${n <= MIN ? "disabled" : ""}>×</button>
        ${hostRule ? `<label class="ishost small"><input type="checkbox" data-host="${i}" ${draft.hostIdx === i ? "checked" : ""}> Das bin ich (Spielleitung)</label>` : ""}</div>`).join("")}</div>
      <div class="row"><button class="btn ghost small" data-add ${n >= MAX ? "disabled" : ""}>+ Person hinzufügen (${n}/${MAX})</button></div>
      <p class="note">Es spielen ${n} Personen. Besetzt werden die ${n} Rollen für diese Gruppengröße${n < IDS.length ? ", die übrigen sind Nebenfiguren, deren Wissen über die Beweise kommt" : ""}.${hostRule ? " Spielst du selbst mit, markiere dich: Die Spielleitung bekommt nie die Täterrolle." : ""}</p>
      <div class="row"><button class="btn" data-deal>Rollen verteilen</button><a class="btn ghost" href="#start">Abbrechen</a></div><p class="fb" id="fb"></p>`;
    $$("[data-name]").forEach((el) => el.addEventListener("input", () => { draft.people[+el.dataset.name].name = el.value; saveDraft(); }));
    $$("[data-v]").forEach((b) => b.onclick = () => { const [i, m] = b.dataset.v.split("|"); draft.people[+i].m = m === "1"; saveDraft(); viewAnlegen(); });
    $$("[data-host]").forEach((b) => b.onchange = () => { draft.hostIdx = b.checked ? +b.dataset.host : -1; saveDraft(); viewAnlegen(); });
    $$("[data-del]").forEach((b) => b.onclick = () => { const k = +b.dataset.del; draft.people.splice(k, 1); if (draft.hostIdx === k) draft.hostIdx = -1; else if (draft.hostIdx > k) draft.hostIdx--; saveDraft(); viewAnlegen(); });
    $("[data-add]").onclick = () => { draft.people.push({ name: "", m: false }); saveDraft(); viewAnlegen(); $$("[data-name]").pop().focus(); };
    $("[data-deal]").onclick = deal;
  }
  /** Rollen zufällig verteilen; die Spielleitung (falls markiert) bekommt keine Täterrolle. */
  function assign(n, hostIdx) {
    const roles = cast(n).slice();
    for (let i = roles.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [roles[i], roles[j]] = [roles[j], roles[i]]; }
    const never = Boolean(F.host && F.host.neverCulprit); // je Fall: true → Spielleitung nie Täter; Standard: alle Rollen möglich
    if (never && hostIdx >= 0 && F.culprits.includes(roles[hostIdx])) {
      const ok = roles.map((r, k) => k).filter((k) => k !== hostIdx && !F.culprits.includes(roles[k]));
      if (ok.length) { const k = ok[Math.floor(Math.random() * ok.length)]; [roles[hostIdx], roles[k]] = [roles[k], roles[hostIdx]]; }
    }
    return roles;
  }
  function deal() {
    const ppl = draft.people.map((p) => ({ ...p, name: p.name.trim() }));
    if (ppl.some((p) => !p.name)) { $("#fb").textContent = "Bitte bei allen Personen einen Namen eintragen."; return; }
    const n = ppl.length, roles = assign(n, F.host && F.host.neverCulprit ? draft.hostIdx : -1);
    let variants = 0;
    IDS.forEach((id, i) => { if (!roles.includes(id) && Math.random() < 0.5) variants |= 1 << i; }); // Nebenfiguren zufällig
    ppl.forEach((p, k) => { if (p.m) variants |= 1 << IDS.indexOf(roles[k]); });
    const people = ppl.map((p, k) => ({ name: p.name, code: encode({ host: false, role: IDS.indexOf(roles[k]), n, variants }), isHost: k === draft.hostIdx }));
    const host = { code: encode({ host: true, n, variants }), people, created: Date.now(), seen: {} };
    store.set(SK("host"), host); store.set(SK("draft"), null); draft = blank();
    go("verteilen");
  }
  const link = (code) => location.href.split("#")[0] + "#c=" + clean(code);
  function viewVerteilen() {
    const host = store.get(SK("host"), null); if (!host) { go("anlegen"); return; }
    app.innerHTML = `<p class="eyebrow">Spielleitung · Schritt 2</p><h1>Codes weitergeben</h1>
      <p>Jede Person bekommt <b>nur ihren eigenen</b> Code. Am einfachsten über „Senden“: Dann geht ein Link direkt an die Person, und du musst den Code nicht ansehen.</p>
      <div class="codes">${host.people.map((p, i) => `<div class="codeline"><b>${esc(p.name)}${p.isHost ? " <span class=\"muted small\">(du)</span>" : ""}</b><span class="shown" data-show="${i}" hidden>${p.code}</span>
        <button class="btn ghost small" data-reveal="${i}">Code zeigen</button><button class="btn small" data-share="${i}">Senden</button></div>`).join("")}</div>
      <p class="note">Bitte nicht in eine Gruppe schreiben. Wer einen fremden Code öffnet, sieht dessen Rolle. Das Spiel lebt davon, dass das niemand tut – auch die Spielleitung nicht.</p>
      <h2>Dein Spielleitungscode</h2><p>Damit öffnest du Ablauf, Losungswörter, Beweise und am Ende die Lösung, auch auf einem anderen Gerät. Gut aufheben.</p>
      <div class="bigcode">${host.code}</div>
      <div class="row"><a class="btn" href="#leitung">Weiter zur Spielleitung</a><a class="btn ghost" href="#anleitung">Anleitung (zum Weiterschicken)</a></div>`;
    $$("[data-reveal]").forEach((b) => b.onclick = () => { const s = $(`[data-show="${b.dataset.reveal}"]`); s.hidden = !s.hidden; b.textContent = s.hidden ? "Code zeigen" : "verbergen"; });
    $$("[data-share]").forEach((b) => b.onclick = async () => {
      const p = host.people[+b.dataset.share], text = T.inviteText.replace("{name}", p.name).replace("{title}", F.title).replace("{link}", link(p.code)).replace("{code}", p.code);
      try { if (navigator.share) { await navigator.share({ title: "Dein Rollenblatt", text }); return; } } catch (e) { return; }
      try { await navigator.clipboard.writeText(text); b.textContent = "Kopiert ✓"; } catch (e) { const s = $(`[data-show="${b.dataset.share}"]`); s.hidden = false; }
    });
  }

  /* Code eingeben */
  function viewCode(prefill) {
    app.innerHTML = `<p class="eyebrow">Für alle Gäste</p><h1>Rollenblatt öffnen</h1><p>Gib den Code ein, den du von der Spielleitung bekommen hast.</p>
      <input type="text" class="code" id="codeIn" maxlength="15" placeholder="XXX-XXX-XXX" autocomplete="off" value="${esc(prefill || "")}"><p class="fb" id="fb"></p>
      <div class="row"><button class="btn" id="open">Öffnen</button><a class="btn ghost" href="#start">Zurück</a></div>`;
    const open = () => {
      const d = decode($("#codeIn").value);
      if (d && d.other) {
        const f = otherCase(d.other);
        $("#fb").innerHTML = f ? `Dieser Code gehört zu „${esc(f.title)}“. <a href="../${esc(f.path)}#c=${clean(d.code)}">Dort öffnen</a>` : "Dieser Code gehört zu einem anderen Krimidinner.";
        return;
      }
      if (!d) { $("#fb").textContent = "Dieser Code passt nicht. Bitte noch einmal genau abschreiben."; return; }
      if (d.host) { const h = store.get(SK("host"), null); store.set(SK("host"), h && h.code === d.code ? h : { code: d.code, people: [], seen: {} }); go("leitung"); return; }
      store.set(SK("me"), { code: d.code, open: {} }); go("rolle");
    };
    $("#open").onclick = open; $("#codeIn").addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
    if (prefill) open();
  }

  /* Rollenblatt: Charakter, Kleidung, Vertraulich sofort – die Runden erst mit dem Losungswort */
  const WORDS_HINT = "Die Spielleitung liest zu Beginn jeder Runde ein <b>Losungswort</b> vor. Es öffnet die neuen Beweise und den nächsten Abschnitt deines Rollenblatts.";
  const partRound = (k) => (k >= 3 ? RP[k - 3] : null); // Runde zum Rollenteil k
  function rolePart(d, k, forPrint) {
    const role = C.roles[d.role], isM = male(d.variants, d.role), lbl = PARTS[k];
    const div = document.createElement("div"); div.className = "doc" + (k >= 2 ? " secret" : "");
    const label = k >= 3 ? `<span class="stamp">${esc(lbl.toUpperCase())}</span>${forPrint ? `<p class="dossier-head">ERST ÖFFNEN, WENN DIE SPIELLEITUNG DAS LOSUNGSWORT DER ${esc(lbl.toUpperCase())} NENNT</p>` : ""}` : k === 2 ? `<span class="stamp">VERTRAULICH</span>` : "";
    div.innerHTML = label + `<p class="dossier-head">${esc(T.cardHeader)} · DOSSIER${forPrint ? "" : " " + d.role} · ${esc(lbl.toUpperCase())}</p>` + (k === 0 && forPrint ? `<h1>${esc(nameOf(d.role, d.variants))}</h1>` : "") + resolve(unveil(role.pages[k]), d.variants, d.role);
    pruneVariantTable(div, isM);
    return div;
  }
  const norm = (w) => String(w || "").trim().toUpperCase().replace(/\s+/g, "");
  const matchRound = (w) => ROUNDS.find((x) => norm(x.word) === w || (x.alt || []).some((a) => norm(a) === w));
  function unlockForm(me, after) {
    const box = document.createElement("div");
    box.innerHTML = `<p>${WORDS_HINT}</p><div class="unlock"><input type="text" class="code" id="word" placeholder="LOSUNGSWORT" autocomplete="off" style="letter-spacing:.12em;font-size:18px"><button class="btn" id="unl">Freischalten</button></div><p class="fb" id="fb"></p>`;
    const tryWord = () => {
      const w = norm($("#word", box).value), r = matchRound(w), x = EXTRA.find((e) => e.word === w), open = me.open || {};
      if (x) open["x:" + x.id] = true;
      else if (r) { ROUNDS.forEach((q) => { if (q.no <= r.no) open[q.no] = true; }); }
      else { $("#fb", box).textContent = "Dieses Losungswort kennt das Spiel nicht."; return; }
      me.open = open; store.set(SK("me"), me); after(r ? r.no : null);
    };
    $("#unl", box).onclick = tryWord; $("#word", box).addEventListener("keydown", (e) => { if (e.key === "Enter") tryWord(); });
    return box;
  }
  /** Orientierungsblatt für alle (Haus, Zug …). Was darüber hinaus gilt, steht erst auf den Beweisen. */
  function houseHtml() {
    if (!HOUSE) return "";
    return `<div class="doc"><p class="dossier-head">${esc(T.cardHeader)} · ${esc(HOUSE.head || HOUSE_TAB.toUpperCase())}</p><h2>${esc(HOUSE.title || HOUSE_TAB)}</h2>
      <p>${esc(HOUSE.intro || "")}</p>
      <p class="plan-hint">↔ Plan zum Verschieben wischen</p><div class="plan-wrap">${C.plan}</div>
      ${HOUSE.note ? `<p class="small"><i>${esc(HOUSE.note)}</i></p>` : ""}</div>`;
  }
  let tab = "p0";
  function viewRolle() {
    const me = store.get(SK("me"), null), d = me && decode(me.code);
    if (!d || d.host || d.other) { go("code"); return; }
    const role = C.roles[d.role], name = nameOf(d.role, d.variants), open = me.open || {};
    const runde = liveOn() ? LIVE.client.states.runde : null, accOpen = Boolean(runde && runde.anklage);
    const parts = PARTS.map((l, k) => [`p${k}`, k >= 3 && !open[partRound(k).no] ? `🔒 ${l}` : l]);
    const tabs = parts.slice(0, 3).concat([["anl", "Regeln"]], HOUSE ? [["haus", HOUSE_TAB]] : [], parts.slice(3), [["bew", "Beweise"]], accOpen ? [["acc", "Anklage"]] : []);
    if (!tabs.some(([k]) => k === tab)) tab = "p0";
    app.innerHTML = `<p class="eyebrow">Dein Rollenblatt · ${d.role}</p><h1>${esc(name)}</h1><p class="muted">${esc(role.title.replace(/\s*—.*$/, ""))}</p>${playerLiveBox(me)}
      <nav class="tabs no-print">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? "on" : ""}${k === "p2" ? " secret" : ""}">${esc(l)}</button>`).join("")}</nav><section id="pane"></section>`;
    $$("[data-tab]").forEach((b) => b.onclick = () => { tab = b.dataset.tab; viewRolle(); });
    bindPlayerLive(me);
    const pane = $("#pane");
    const printBtn = () => {
      pane.insertAdjacentHTML("beforeend", `<p class="row no-print" style="margin-top:18px"><button class="btn ghost small" id="prt">Mein Rollenblatt drucken</button><a class="btn ghost small" href="#start">Start</a></p>`);
      $("#prt").onclick = () => {
        const P = $("#print"); P.innerHTML = "";
        PARTS.forEach((_, k) => { const w = document.createElement("div"); w.className = "p-doc"; w.appendChild(rolePart(d, k, true)); P.appendChild(w); });
        P.insertAdjacentHTML("beforeend", `${HOUSE ? `<div class="p-doc">${houseHtml()}</div>` : ""}<div class="p-doc"><div class="guide"><h1>Regeln und Ablauf</h1>${C.rules}</div></div>`);
        window.print();
      };
    };
    if (tab.startsWith("p")) {
      const k = +tab.slice(1);
      if (k === 2 && !me.s4) {
        pane.innerHTML = `<div class="seal"><span class="stamp">VERTRAULICH</span><p>Dieser Teil ist nur für dich: dein Geheimnis, deine Ziele und was du vor Spielbeginn erlebt hast. Achte darauf, dass niemand mitliest.</p><button class="btn" id="s4">Öffnen</button></div>`;
        $("#s4").onclick = () => { me.s4 = true; store.set(SK("me"), me); viewRolle(); };
        return;
      }
      if (k >= 3 && !open[partRound(k).no]) {
        pane.innerHTML = `<div class="seal"><span class="stamp">${esc(PARTS[k].toUpperCase())}</span><p>Was deine Figur in dieser Runde weiß, öffnet sich erst, wenn die Spielleitung das Losungswort nennt. So weiß niemand vorher mehr, als er soll.</p></div>`;
        pane.appendChild(unlockForm(me, (r) => { if (r) { const idx = RP.map((x) => x.no <= r).lastIndexOf(true); if (idx >= 0) tab = `p${idx + 3}`; } viewRolle(); }));
        return;
      }
      pane.appendChild(rolePart(d, k));
      printBtn();
      return;
    }
    if (tab === "anl") { pane.innerHTML = `<div class="guide">${C.rules}</div>`; return; }
    if (tab === "haus") { pane.innerHTML = houseHtml(); return; }
    if (tab === "acc") { pane.innerHTML = accOpen ? accusationForm(d, me) : `<p class="muted">Die Anklage ist noch nicht freigegeben.</p>`; bindAccusation(me); return; }
    // Beweise
    const unlocked = ROUNDS.filter((r) => open[r.no]);
    pane.appendChild(unlockForm(me, () => viewRolle()));
    pane.insertAdjacentHTML("beforeend", `${unlocked.length ? "" : `<p class="muted">Noch keine Beweise freigegeben.</p>`}
      <div class="cardlist">${unlocked.slice().reverse().map((r) => `<h3>${esc(r.name)}</h3>` + cardsFor(r.no, d.n, open).map((id) => cardHtml(id, d.variants)).join("") + npcFor(r.no, d.n).map((x) => npcHtml(x, d.variants)).join("")).join("")}</div>`);
  }

  /* Spielleitung: geführter Ablauf Schritt für Schritt (Schritte aus fall.json) */
  const filterNpcTable = (root, c) => $$("table", root).forEach((t) => { const th = $("thead th", t); if (th && th.textContent.trim() === "Nebenfigur") $$("tbody tr", t).forEach((tr) => { if (c.includes(tr.children[0].textContent.trim())) tr.remove(); }); });
  const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const stepLabel = (s, k) => (k === 0 ? "Vorb." : s.key === "start" ? "Start" : k === STEPS.length - 1 ? "Finale" : "P" + (s.phase || k - 1));
  let htab = "ablauf", timerTick = null;
  function viewLeitung() {
    clearInterval(timerTick);
    const host = store.get(SK("host"), null), d = host && decode(host.code);
    if (!d || !d.host) { viewCode(); $("h1").textContent = "Spielleitungscode eingeben"; return; }
    const c = cast(d.n), seen = host.seen || (host.seen = {}), save = () => store.set(SK("host"), host);
    const tabs = [["ablauf", "Ablauf"], ["heft", "Gastgeberheft"], ["druck", "Drucken"], ["loesung", "Lösung"]];
    app.innerHTML = `<p class="eyebrow">Spielleitung · ${d.n} Personen · Code ${d.code}</p><h1>Der Abend</h1>
      <nav class="tabs no-print">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${htab === k ? "on" : ""}${k === "loesung" ? " secret" : ""}">${l}</button>`).join("")}</nav><section id="pane"></section>`;
    $$("[data-tab]").forEach((b) => b.onclick = () => { htab = b.dataset.tab; viewLeitung(); });
    const pane = $("#pane");
    if (htab === "ablauf") {
      const i = Math.max(0, Math.min(STEPS.length - 1, host.step || 0)), st = STEPS[i], timers = host.timers || (host.timers = {});
      const missing = IDS.filter((id) => !c.includes(id));
      const npc = st.phase ? C.npc.filter((n) => n.phase === st.phase && missing.includes(n.role)) : [];
      const imp = st.phase && C.impulses["Phase " + st.phase] ? [C.impulses["Phase " + st.phase], C.impulses.Immer].filter(Boolean) : [];
      const r = st.round ? roundOf(st.round) : null, roundOpen = r && seen[r.no];
      const extras = r ? EXTRA.filter((x) => C.cards[x.id] && C.cards[x.id].round === r.no && !condOk(x.id, c)) : [];
      const nNpc = r ? npcFor(r.no, d.n).length : 0;
      pane.innerHTML = `<div class="steps no-print">${STEPS.map((s, k) => `<button data-step="${k}" class="${k === i ? "on" : k < i ? "done" : ""}" title="${esc(s.title)}">${stepLabel(s, k)}</button>`).join("")}</div>
        <div class="step-head"><h2>${esc(st.title)}</h2>${st.mins ? `<div class="timer"><span id="tm">${timers[st.key] ? mmss(Date.now() - timers[st.key]) : "0:00"}</span> / ca. ${st.mins} Min. <button class="btn ghost small" id="tstart">${timers[st.key] ? "neu starten" : "Zeit starten"}</button></div>` : ""}</div>
        ${hostLiveBox(host)}
        ${i === 0 ? `<p class="note">Bei euch besetzt: ${c.join(" · ")}. Nebenfiguren: ${missing.join(" · ") || "keine"}.${missing.length ? " Was die Nebenfiguren wissen, erscheint mit dem Losungswort bei allen Gästen als <b>Aussagekarte</b> – du musst dafür nichts vorlesen." : ""}</p>` : ""}
        ${r ? `<div class="round ${r.cls}"><h3>Losungswort für die Gäste</h3>${roundOpen ? `<div class="word">${esc(r.word)}</div><p class="small muted">Öffnet: ${cardsFor(r.no, d.n, false).join(", ") || "–"}${nNpc ? ` · ${nNpc} ${nNpc === 1 ? "Aussage" : "Aussagen"} von Nebenfiguren` : ""}${r.rolePart ? ` · im Rollenblatt ${esc(r.rolePart)}` : ""}.</p><button class="btn small" data-cards="${r.no}">Karten zeigen</button>` : `<p class="small muted">${r.final ? "Erst, wenn alle ihre Anklage abgegeben haben." : "Zu Beginn dieser Phase öffnen und vorlesen."}</p><button class="btn small" data-round="${r.no}">${r.final ? "Finale-Karten öffnen" : "Losungswort anzeigen"}</button>`}
          ${extras.map((x) => `<p class="small" style="margin-top:12px">${esc(x.hint) || "Falls nötig, zusätzlich:"} ${seen["x:" + x.id] || (seen.extra && EXTRA[0].id === x.id) ? `<b class="word" style="font-size:18px">${esc(x.word)}</b> <button class="btn ghost small" data-cards="x:${x.id}">${x.id} zeigen</button>` : `<button class="btn ghost small" data-round="x:${x.id}">Zusatzwort ${esc(x.word)} anzeigen</button>`}</p>`).join("")}</div>` : ""}
        ${npc.length ? `<div class="npc"><h3>Aussagen der Nebenfiguren · ${npc.length}</h3><p class="small muted">Diese Figuren spielt bei euch niemand. Ihre Aussagen erscheinen mit dem Losungswort bei allen Gästen als Karte (und unter „Karten zeigen“). <b>Du musst nichts vorlesen.</b> Nur ohne Handys: vorlesen oder die gedruckten Aussagekarten auf den Tisch legen.</p><details><summary>Aussagen ansehen</summary>${npc.map((n) => `<blockquote><b>${n.role}</b> ${resolve(unveil(n.html), d.variants)}</blockquote>`).join("")}</details></div>` : ""}
        <div class="hostdoc step-doc">${st.sections.map((k) => C.sections[k] ? (st.sections.length > 1 ? `<h2>${esc(C.sections[k].title)}</h2>` : "") + resolve(C.sections[k].html, d.variants) : "").join("")}</div>
        ${imp.length ? `<details class="imp"><summary>Wenn es stockt</summary><ul>${imp.map((x) => `<li>${x}</li>`).join("")}</ul></details>` : ""}
        ${st.accusation ? hostAccusations(host, d) + `<p class="note red">Nach dem Vorlesen der Anklagen: Reiter <b>Lösung</b> öffnen.</p>` : ""}
        <div class="row stepnav no-print"><button class="btn ghost" id="prev" ${i === 0 ? "disabled" : ""}>← Zurück</button><button class="btn" id="next" ${i === STEPS.length - 1 ? "disabled" : ""}>Weiter: ${i < STEPS.length - 1 ? esc(STEPS[i + 1].title.split(" · ")[0]) : ""} →</button></div>`;
      filterNpcTable(pane, c); bindHostLive(host); bindHostAccusations(host);
      $$("[data-step]").forEach((b) => b.onclick = () => { host.step = +b.dataset.step; save(); viewLeitung(); });
      if ($("#prev")) $("#prev").onclick = () => { host.step = i - 1; save(); viewLeitung(); };
      if ($("#next")) $("#next").onclick = () => { host.step = i + 1; save(); viewLeitung(); };
      if ($("#tstart")) $("#tstart").onclick = () => { timers[st.key] = Date.now(); save(); viewLeitung(); };
      if (timers[st.key]) timerTick = setInterval(() => { const el = $("#tm"); if (!el) { clearInterval(timerTick); return; } const ms = Date.now() - timers[st.key]; el.textContent = mmss(ms); el.classList.toggle("over", ms > st.mins * 60000); }, 1000);
      $$("[data-round]").forEach((b) => b.onclick = () => {
        const k = b.dataset.round;
        if (r && r.final && k === String(r.no) && !confirm("Haben alle ihre Anklage abgegeben? Die Finale-Karten verraten die Lösung.")) return;
        seen[k] = true; save(); livePush(host); viewLeitung();
      });
      $$("[data-cards]").forEach((b) => b.onclick = () => { const k = b.dataset.cards, isX = k.startsWith("x:"), ids = isX ? [k.slice(2)] : cardsFor(+k, d.n, false); showOverlay(`<div class="cardlist">${ids.map((id) => cardHtml(id, d.variants)).join("")}${isX ? "" : npcFor(+k, d.n).map((x) => npcHtml(x, d.variants)).join("")}</div>`); });
      return;
    }
    if (htab === "heft") {
      pane.innerHTML = `<div class="hostdoc">${resolve(C.hostA, d.variants)}</div>`; filterNpcTable(pane, c);
      return;
    }
    if (htab === "druck") {
      const sheet = Object.keys(CARDCFG).filter((id) => CARDCFG[id].print === "sheet");
      pane.innerHTML = `<p>Für einen Abend ohne Handys. Der Browser öffnet den Druckdialog, dort kannst du auch „Als PDF sichern“ wählen.</p>
        <div class="rounds">
          <div class="round"><h3>Beweiskarten</h3><p class="muted small">A6, vier pro Seite, nach Runden.${sheet.length ? ` ${sheet.join(", ")} als eigenes Blatt.` : ""} Finale-Karten in einen Umschlag „Erst nach der Anklage öffnen“.</p><button class="btn small" data-p="cards">Drucken</button></div>
          <div class="round"><h3>Gastgeberheft Teil A</h3><p class="muted small">Ablauf, Vorlesetexte, Wissen der Nebenfiguren, Anklagezettel. Keine Lösung.</p><button class="btn small" data-p="hostA">Drucken</button></div>
          <div class="round"><h3>Spielanleitung</h3><p class="muted small">Für alle, ohne Lösung.</p><button class="btn small" data-p="guide">Drucken</button></div>
          <div class="round r3"><h3>Alle Rollenblätter</h3><p class="muted small">Jede Rolle mit ${PARTS.length} Teilen, jeder auf eigener Seite: ${PARTS.slice(0, 3).join(", ")} und ${RP.length > 1 ? `${RP[0].rolePart}–${RP[RP.length - 1].rolePart.replace(/^\D+/, "")}` : RP.map((x) => x.rolePart).join("")}. Die Runden gehören in eigene Umschläge („Erst bei Runde … öffnen“). <b>Du siehst dabei alle Rollen.</b> Wenn du mitspielst, lass jede Person ihr Blatt lieber selbst drucken. Ohne Namen, in zufälliger Reihenfolge.</p><button class="btn ghost small" data-p="roles">Trotzdem drucken</button></div>
        </div>`;
      $$("[data-p]").forEach((b) => b.onclick = () => printDocs(b.dataset.p, d));
      return;
    }
    // Lösung
    if (!seen.solution) {
      pane.innerHTML = `<div class="seal"><span class="stamp">VERSIEGELT</span><p>Teil B des Gastgeberhefts enthält die Lösung. Öffne ihn erst, wenn alle Anklagezettel abgegeben und vorgelesen sind.</p><button class="btn" id="sol">Siegel brechen</button></div>`;
      $("#sol").onclick = () => { if (!confirm("Wirklich öffnen? Danach kennst du die Lösung.")) return; seen.solution = true; save(); viewLeitung(); };
      return;
    }
    pane.innerHTML = `${liveOn() && host.anklage ? hostAccusations({ ...host, accShow: true }, d) : ""}<div class="hostdoc">${resolve(unveil(C.hostB), d.variants)}</div><p class="row" style="margin-top:14px"><button class="btn ghost small" data-p="hostB">Teil B drucken</button></p>`;
    $("[data-p]").onclick = () => printDocs("hostB", d);
  }

  function printDocs(what, d) {
    const P = $("#print"); P.innerHTML = "";
    const add = (html, cls = "p-doc") => { const w = document.createElement("div"); w.className = cls; w.innerHTML = html; P.appendChild(w); return w; };
    if (what === "hostA") add(`<div class="hostdoc">${resolve(C.hostA, d.variants)}</div>`);
    if (what === "hostB") add(`<div class="hostdoc">${resolve(unveil(C.hostB), d.variants)}</div>`);
    if (what === "guide") add(`<div class="guide"><h1>${esc(F.title)} – Spielanleitung</h1>${C.guide}</div>`);
    if (what === "cards") {
      const sheet = Object.keys(CARDCFG).filter((id) => CARDCFG[id].print === "sheet");
      const items = ROUNDS.flatMap((r) => cardsFor(r.no, d.n, true).filter((id) => !sheet.includes(id)).map((id) => cardHtml(id, d.variants)).concat(npcFor(r.no, d.n).map((x) => npcHtml(x, d.variants))));
      sheet.forEach((id) => add(cardHtml(id, d.variants), "p-cards p-plan")); // Karten mit Plan als eigenes Blatt
      for (let i = 0; i < items.length; i += 4) add(items.slice(i, i + 4).join(""), "p-cards");
    }
    if (what === "roles") {
      const ids = cast(d.n).slice().sort(() => Math.random() - 0.5);
      ids.forEach((id) => { const pd = { ...d, role: id }; PARTS.forEach((_, k) => { const w = document.createElement("div"); w.className = "p-doc"; w.appendChild(rolePart(pd, k, true)); P.appendChild(w); }); });
    }
    window.print();
  }

  function showOverlay(html) {
    const o = $("#overlay"); o.innerHTML = `<div class="inner"><button class="close" aria-label="Schließen">×</button>${html}</div>`; o.hidden = false;
    $(".close", o).onclick = () => { o.hidden = true; o.innerHTML = ""; };
  }


  /* ---------- Live-Verbindung (optional, über platform/multiplayer – nur vorhandene Funktionen, Publishable Key) ----------
     Eine Spielkennung für alle Fälle („krimidinner“). Geteilt wird nur: „fall“ (welcher Fall), „runde“ (Rundenstand, nur die
     Spielleitung schreibt) und auf Wunsch die Anklagen („acc:<Nutzer-ID>“, jede Person ihre eigene). Rollen gehen nie an den Server.
     Fehlt die gemeinsame Kennung noch in der Datenbank, nimmt die Spielleitung die alte Kennung des Falls (live.legacySlug);
     Gäste probieren beim Beitreten beide. Erlaubt die Datenbank weniger Geräte, wird es mit 8 versucht. */
  const LIVE_CFG = F.live || {};
  const TEST_SLUG = new URLSearchParams(location.search).get("liveslug"); // ?liveslug= nur für Tests
  const SLUGS = TEST_SLUG ? [TEST_SLUG] : [LIVE_CFG.slug || "krimidinner"].concat(LIVE_CFG.legacySlug ? [LIVE_CFG.legacySlug] : []);
  const LIVE = { client: null, err: "", busy: false, slug: SLUGS[0] };
  const liveKey = (slug) => SK("live:" + slug);
  function liveClient(slug) {
    if (slug && LIVE.client && LIVE.slug !== slug) { LIVE.client = null; }
    if (LIVE.client) return LIVE.client;
    if (!window.MRMultiplayer) { LIVE.err = "Die Live-Verbindung ist gerade nicht verfügbar. Die Losungswörter funktionieren immer."; return null; }
    LIVE.slug = slug || LIVE.slug;
    try { LIVE.client = window.MRMultiplayer.connect({ gameSlug: LIVE.slug, maxPlayers: LIVE_CFG.maxDevices || 11, storeKey: liveKey(LIVE.slug) }); }
    catch (e) { LIVE.err = e.message; return null; }
    const c = LIVE.client;
    c.on("state", (row) => onLiveState(row));
    c.on("players", () => liveRefresh());
    c.on("lost", (why) => { toast(why || "Live-Verbindung beendet."); liveRefresh(); });
    return c;
  }
  const liveOn = () => Boolean(LIVE.client && LIVE.client.session);
  const liveIsHost = () => liveOn() && LIVE.client.session.is_host;
  const catalogErr = (e) => /nicht verfügbar|game_catalog|unbekannt|unknown|not.*found|kein.*Spiel|anderen Escape Room/i.test((e && e.message) || String(e || ""));
  function liveMsg(e) { const m = (e && e.message) || String(e || ""); return catalogErr(e) ? "Die Live-Verbindung ist für dieses Spiel noch nicht freigeschaltet. Die Losungswörter funktionieren trotzdem." : m; }
  let toastTm = null;
  function toast(text) { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast no-print"; t.setAttribute("role", "status"); document.body.appendChild(t); } t.textContent = text; t.classList.add("show"); clearTimeout(toastTm); toastTm = setTimeout(() => t.classList.remove("show"), 5200); }
  /** Neu zeichnen, aber nie mitten in eine Eingabe hinein. */
  function liveRefresh() { const a = document.activeElement; if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return; const h = location.hash.slice(1); if (h === "rolle") viewRolle(); else if (h === "leitung") viewLeitung(); }
  function onLiveState(row) {
    if (row.state_key === "fall") {
      const st = row.state || {};
      if (st.id && st.id !== F.id && !liveIsHost()) { toast("Diese Live-Sitzung gehört zu einem anderen Krimidinner."); LIVE.client.leave().catch(() => {}); liveRefresh(); }
      return;
    }
    if (row.state_key === "runde") {
      const me = store.get(SK("me"), null), st = row.state || {};
      if (me && location.hash.slice(1) === "rolle") {
        const open = me.open || {}; let fresh = 0;
        ROUNDS.forEach((r) => { if (st.open && st.open[r.no] && !open[r.no]) { open[r.no] = true; fresh = r.no; } });
        const xs = Array.isArray(st.extra) ? st.extra : st.extra && EXTRA[0] ? [EXTRA[0].id] : [];
        xs.forEach((id) => { if (!open["x:" + id]) { open["x:" + id] = true; fresh = fresh || C.cards[id].round; } });
        me.open = open; store.set(SK("me"), me);
        if (fresh) toast(fresh === FINAL.no && FINAL.final ? "Das Finale ist offen: Die letzten Beweise liegen auf dem Tisch." : `Runde ${fresh} ist offen – neue Beweise und ein neuer Abschnitt in deinem Rollenblatt.`);
        if (fresh || st.anklage) liveRefresh();
      }
      return;
    }
    if (row.state_key.startsWith("acc:") && location.hash.slice(1) === "leitung") liveRefresh();
  }
  /** Spielleitung: Fall und Rundenstand an alle Geräte. */
  function livePush(host) {
    if (!liveIsHost()) return;
    const seen = host.seen || {}, open = {}; ROUNDS.forEach((r) => { if (seen[r.no]) open[r.no] = true; });
    const extra = EXTRA.filter((x) => seen["x:" + x.id] || (seen.extra && EXTRA[0].id === x.id)).map((x) => x.id);
    LIVE.client.writeOwn("fall", { id: F.id, nr: F.nr, codeVersion: 2 }).catch(() => {});
    LIVE.client.writeOwn("runde", { open, extra, anklage: Boolean(host.anklage), at: Date.now() }).catch((e) => toast("Live: " + liveMsg(e)));
  }
  const liveDevices = () => (liveOn() ? LIVE.client.players.length : 0);
  function hostLiveBox(host) {
    const c = LIVE.client;
    if (liveOn()) return `<div class="live on"><span class="dot"></span><b>LIVE</b> · Code <b class="lcode">${esc(c.session.room_code)}</b> · ${liveDevices()} ${liveDevices() === 1 ? "Gerät" : "Geräte"} verbunden (max. ${c.session.max_players}) <button class="btn ghost small" id="liveEnd">beenden</button></div>`;
    return `<div class="live"><b>Live-Verbindung (optional)</b><p class="small muted">Dann springen die Handys der verbundenen Gäste automatisch in die nächste Runde, und die Anklagen kommen digital bei dir an. Die Losungswörter funktionieren weiter – für alle, die nicht verbunden sind. Rollen werden dabei nie übertragen.</p>
      <button class="btn small" id="liveStart" ${LIVE.busy ? "disabled" : ""}>Live-Sitzung eröffnen</button>${LIVE.err ? `<p class="fb">${esc(LIVE.err)}</p>` : ""}</div>`;
  }
  /** Sitzung eröffnen: erst die gemeinsame Kennung, dann ggf. die alte; bei zu vielen Plätzen mit 8. */
  async function createSession() {
    let last = null;
    for (const slug of SLUGS) {
      const c = liveClient(slug); if (!c) throw new Error(LIVE.err);
      try { await c.create("Spielleitung"); return null; }
      catch (e) {
        if (/Gruppengröße/i.test(e.message || "")) { c.maxPlayers = 8; await c.create("Spielleitung"); return "Hinweis: Die Datenbank erlaubt zurzeit nur 8 Geräte. Alle weiteren Gäste nutzen die Losungswörter."; }
        last = e; if (!catalogErr(e)) throw e;
      }
    }
    throw last;
  }
  function bindHostLive(host) {
    const st = $("#liveStart"), en = $("#liveEnd");
    if (st) st.onclick = async () => {
      if (!window.MRMultiplayer) { LIVE.err = "Die Live-Verbindung ist gerade nicht verfügbar. Die Losungswörter funktionieren immer."; viewLeitung(); return; }
      LIVE.busy = true; LIVE.err = ""; viewLeitung();
      try { const note = await createSession(); livePush(host); if (note) LIVE.err = note; }
      catch (e) { LIVE.err = liveMsg(e); }
      LIVE.busy = false; viewLeitung();
    };
    if (en) en.onclick = async () => { if (!confirm("Live-Sitzung beenden? Die Gäste nutzen dann wieder die Losungswörter.")) return; try { await LIVE.client.leave(); } catch (e) { /* schon zu */ } viewLeitung(); };
  }
  function playerLiveBox(me) {
    const c = LIVE.client;
    if (liveOn()) return `<div class="live on small"><span class="dot"></span>Live mit der Spielleitung verbunden · ${esc(c.session.room_code)}</div>`;
    return `<details class="live small"><summary>Live mit der Spielleitung verbinden (optional)</summary>
      <p class="small muted">Dann öffnen sich die Runden von selbst. Den Live-Code zeigt dir die Spielleitung.</p>
      <div class="unlock"><input type="text" id="liveCode" class="code" placeholder="LIVE-CODE" autocomplete="off" style="font-size:16px;letter-spacing:.1em"><input type="text" id="liveName" placeholder="Dein Name" maxlength="30" autocomplete="off" value="${esc(me.name || "")}"></div>
      <button class="btn small" id="liveJoin" ${LIVE.busy ? "disabled" : ""}>Verbinden</button>${LIVE.err ? `<p class="fb">${esc(LIVE.err)}</p>` : ""}</details>`;
  }
  async function joinSession(code, nm) {
    let last = null;
    for (const slug of SLUGS) {
      const c = liveClient(slug); if (!c) throw new Error(LIVE.err);
      try { await c.join(code, nm); return c; }
      catch (e) { last = e; if (!/anderen Escape Room/i.test(e.message || "")) throw e; }
    }
    throw last;
  }
  function bindPlayerLive(me) {
    const j = $("#liveJoin"); if (!j) return;
    j.onclick = async () => {
      const code = $("#liveCode").value.trim(), nm = $("#liveName").value.trim();
      if (!code || !nm) { LIVE.err = "Bitte Live-Code und Namen eingeben."; viewRolle(); return; }
      if (!window.MRMultiplayer) { LIVE.err = "Die Live-Verbindung ist gerade nicht verfügbar. Die Losungswörter funktionieren immer."; viewRolle(); return; }
      me.name = nm; store.set(SK("me"), me);
      LIVE.busy = true; LIVE.err = "";
      try {
        const c = await joinSession(code, nm);
        const fall = c.states.fall;
        if (fall && fall.id && fall.id !== F.id) { await c.leave().catch(() => {}); throw new Error("Diese Live-Sitzung gehört zu einem anderen Krimidinner."); }
        const st = c.states.runde; if (st) onLiveState({ state_key: "runde", state: st }); toast("Verbunden. Die Runden öffnen sich jetzt von selbst.");
      }
      catch (e) { LIVE.err = liveMsg(e); }
      LIVE.busy = false; document.activeElement && document.activeElement.blur(); viewRolle();
    };
  }
  /** Anklage digital (wenn die Spielleitung sie freigibt). */
  function accusationForm(d, me) {
    const c = LIVE.client, mine = c && c.user && c.states["acc:" + c.user.id];
    const opts = IDS.map((id) => `<option value="${id}">${esc(nameOf(id, d.variants))}</option>`).join("");
    if (mine) return `<div class="seal"><span class="stamp">ABGEGEBEN</span><p>Deine Anklage liegt bei der Spielleitung: <b>${esc(nameOf(mine.who, d.variants))}</b>.</p></div>`;
    return `<div class="doc"><p class="dossier-head">${esc(T.cardHeader)} · ANKLAGE</p><h2>${esc(T.accusation)}</h2>
      <label class="fld">Ich klage an<select id="accWho"><option value="">– bitte wählen –</option>${opts}</select></label>
      <label class="fld">Weil (Motiv)<textarea id="accWhy" rows="3" maxlength="400"></textarea></label>
      <label class="fld">Der Beweis, der es zeigt<textarea id="accProof" rows="3" maxlength="400"></textarea></label>
      <button class="btn" id="accSend">Verdeckt abgeben</button><p class="fb" id="accFb"></p><p class="small">Erst nach dem Abgeben sehen die anderen, dass du fertig bist – nicht, wen du anklagst.</p></div>`;
  }
  function bindAccusation(me) {
    const b = $("#accSend"); if (!b) return;
    b.onclick = async () => {
      const who = $("#accWho").value, why = $("#accWhy").value.trim(), proof = $("#accProof").value.trim();
      if (!who) { $("#accFb").textContent = "Bitte eine Person wählen."; return; }
      if (!confirm("Anklage abgeben? Danach lässt sie sich nicht mehr ändern.")) return;
      try { await LIVE.client.writeOwn("acc:" + LIVE.client.user.id, { who, why, proof, name: me.name || "", at: Date.now() }); toast("Anklage abgegeben."); }
      catch (e) { $("#accFb").textContent = liveMsg(e); return; }
      document.activeElement && document.activeElement.blur(); viewRolle();
    };
  }
  function hostAccusations(host, d) {
    const c = LIVE.client; if (!liveOn()) return "";
    const accs = Object.entries(c.states).filter(([k]) => k.startsWith("acc:")).map(([k, v]) => ({ uid: k.slice(4), ...v }));
    const guests = c.players.filter((p) => !p.is_host), right = (a) => F.culprits.includes(a.who);
    if (!host.anklage) return `<div class="live"><b>Anklagen digital einsammeln</b><p class="small muted">Die verbundenen Gäste bekommen ein Formular. Wer nicht verbunden ist, nutzt den Anklagezettel.</p><button class="btn small" id="accOpen">Formular an alle verbundenen Gäste</button></div>`;
    const show = host.accShow, solved = (host.seen || {}).solution;
    return `<div class="live on"><b>Anklagen: ${accs.length} von ${guests.length} verbundenen Gästen abgegeben</b>
      <p class="small">${guests.map((p) => `${accs.some((a) => a.uid === p.user_id) ? "✓" : "…"} ${esc(p.player_name)}`).join(" · ")}</p>
      ${show ? `<table class="acc"><thead><tr><th>Name</th><th>klagt an</th><th>Motiv</th><th>Beweis</th>${solved ? "<th></th>" : ""}</tr></thead><tbody>${accs.map((a) => `<tr><td>${esc(c.playerName(a.uid) || a.name)}</td><td><b>${esc(NAMES[a.who] ? nameOf(a.who, d.variants) : "?")}</b></td><td>${esc(a.why)}</td><td>${esc(a.proof)}</td>${solved ? `<td>${right(a) ? "✓" : "✗"}</td>` : ""}</tr>`).join("")}</tbody></table>
        ${solved ? `<p class="small">Richtig angeklagt: <b>${accs.filter(right).length}</b> von ${accs.length}.</p>` : `<p class="small muted">Ob es stimmt, zeigt die Tabelle nach dem Öffnen der Lösung.</p>`}` : `<button class="btn small" id="accShow">Anklagen vorlesen</button>`}</div>`;
  }
  function bindHostAccusations(host) {
    const save = () => store.set(SK("host"), host);
    const o = $("#accOpen"); if (o) o.onclick = () => { host.anklage = true; save(); livePush(host); viewLeitung(); };
    const s = $("#accShow"); if (s) s.onclick = () => { host.accShow = true; save(); viewLeitung(); };
  }
  // nach dem Neuladen: laufende Live-Sitzung wiederfinden (gemeinsame oder alte Kennung)
  (() => { try { const slug = SLUGS.find((s) => localStorage.getItem(liveKey(s))); if (slug) { const c = liveClient(slug); if (c) c.restore().then(() => { if (liveIsHost()) livePush(store.get(SK("host"), {})); liveRefresh(); }).catch(() => {}); } } catch (e) { /* privat */ } })();

  /* ---------- Router ---------- */
  function route() {
    const h = location.hash.slice(1);
    window.scrollTo(0, 0);
    if (h.startsWith("c=")) { viewCode(decodeURIComponent(h.slice(2))); return; }
    ({ anlegen: viewAnlegen, verteilen: viewVerteilen, code: () => viewCode(), rolle: viewRolle, leitung: viewLeitung, anleitung: viewAnleitung }[h] || viewStart)();
  }
  window.addEventListener("hashchange", route);
  route();
  window.KD = { encode, decode, cast, cardsFor, assign, fall: F, live: () => LIVE.client, ...(F.codeV1 ? { encodeV1 } : {}) }; // für Tests
})();
