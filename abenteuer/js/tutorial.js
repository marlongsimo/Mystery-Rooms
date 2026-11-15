/*
 * Mythara – Tutorial: ein geführter Rundgang durch das Dorf (Heldenhalle, Abenteurergilde, Taverne, Arena, Händler, Hilfe).
 * Je Schritt ist genau eine Stelle hervorgehoben. Alles andere ist gesperrt: Bei „Klick“-Schritten lässt sich nur die markierte
 * Stelle antippen, bei „Info“-Schritten nur „Weiter“. Oben rechts steht immer „Tutorial überspringen“.
 * Es wird keine Kampagne gestartet.
 *
 * Ob das Tutorial ansteht, steht je Spielerkonto in der Datenbank (Migration 011: rpg_tutorial_state / _done / _reset).
 * Ohne 011 merkt sich dieses Gerät den Wert (gesetzt bei der Registrierung).
 * Globaler Name: window.ABTUT = { pruefen(), starten(), nochmal(), merkeNeu(), laeuft() }
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const PARAM = new URLSearchParams(location.search);
  const STILL = !PARAM.has("tutorial") && (PARAM.has("schnell") || PARAM.has("testlauf")); // automatische Tests: nie von selbst starten
  // Der Wert dieses Geräts gilt je Konto (Benutzername): „offen“ nach der Registrierung, „fertig“ nach Überspringen oder Abschluss
  let KONTO = "";
  const lokal = (v) => { try { const k = "ab_tutorial:" + KONTO.toLowerCase(); if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* privat */ } return null; };
  const fehlt = (e) => Boolean(e && (e.code === "PGRST202" || e.code === "42883" || /Could not find the function|schema cache|does not exist/i.test(e.roh || e.message || "")));
  const rpc = async (name) => { const c = window.AB.liveClient(); await c.ensureUser(); return c.rpc(name, {}); };
  const F = () => window.ABF, SM = () => window.ABSAMMLUNG;

  /** Steht das Tutorial für dieses Konto an? */
  async function offen() {
    if (lokal() === "fertig") return false; // auf diesem Gerät schon beendet (gilt sofort, auch wenn die Datenbank es noch nicht gespeichert hat)
    try { const r = await rpc("rpg_tutorial_state"); return Boolean(r && r.tutorial); }
    catch (e) { return lokal() === "offen"; } // ohne Migration 011 (oder ohne Verbindung): der Wert dieses Geräts
  }
  async function erledigt() { lokal("fertig"); try { await rpc("rpg_tutorial_done"); } catch (e) { /* ohne 011 gilt der Wert dieses Geräts */ } }

  // Beispielheld: der erste eigene Held (sonst der Schildwächter)
  const held = () => { const h = ((SM() && SM().zustand().helden) || [])[0]; return F().FIGUREN[h] ? h : "schildwaechter"; };
  const klasse = () => F().FIGUREN[held()].klasse;
  const nav = (n) => `.hub-nav-punkt[data-hub="${n}"]`;

  /* Die Schritte. art: "info" (Weiter) · "klick" (die markierte Stelle antippen) · "ende". opt: fehlt die Stelle, wird der Schritt ausgelassen. */
  const SCHRITTE = () => [
    // --- Das Dorf ---
    { art: "info", titel: "Willkommen in Mythara", text: "Das ist dein Dorf. Von hier aus erreichst du alles. Ich zeige dir in ein paar Minuten jeden Ort – du klickst einfach mit. Eine Kampagne starten wir dabei nicht." },
    { art: "info", ziel: ".dorf", titel: "Der Dorfplatz", text: "Jedes Schild ist ein Ort: Heldenhalle, Abenteurergilde, Arena, Taverne, Händler, Stadttor und Splitterbrunnen." },
    { art: "info", ziel: ".hub-nav", titel: "Die Leiste", text: "Dieselben Orte findest du immer auch hier oben – praktisch, wenn du gerade nicht auf dem Dorfplatz stehst." },
    { art: "info", ziel: "#hub-profil-knopf", titel: "Dein Profil", text: "Hier wählst du dein Profilbild, siehst deine Helden und meldest dich ab." },
    { art: "info", ziel: "#hub-waehrung", opt: true, titel: "Seelensplitter", text: "Deine Seelensplitter. Du gewinnst sie in der Arena und tauschst sie beim Händler ein." },
    // --- Heldenhalle ---
    { art: "klick", ziel: '.dorf-ort[data-hub="helden"]', titel: "Die Heldenhalle", text: "Hier leben deine Helden. Tippe auf das Schild." },
    { art: "info", ziel: "#hub-seite .hub-gruss", titel: "Fünf Klassen, fünfzehn Helden", text: "Es gibt fünf Klassen mit je drei Helden: Krieger, Zauberer, Schurken, Kleriker und Waldläufer." },
    { art: "info", ziel: ".sm-sammlung-kopf, .sm-sammlung-zahl", opt: true, titel: "Deine Sammlung", text: "So viele der fünfzehn Helden gehören dir schon. Gestartet bist du mit den drei, die du eben gewählt hast." },
    { art: "info", ziel: ".sm-enden", opt: true, titel: "Enden bringen Helden", text: "Jede Kampagne hat mehrere Enden. Für jedes Ende, das du zum ersten Mal erreichst, darfst du dir einen neuen Helden aussuchen." },
    { art: "klick", ziel: () => `.hub-helden .banner[data-klasse="${klasse()}"]`, titel: "Eine Klasse ansehen", text: () => `Sehen wir uns eine Klasse an: ${F().KLASSEN[klasse()].name}. Tippe auf das Banner.` },
    { art: "info", ziel: ".klassen-kopf", titel: "Was die Klasse ausmacht", text: "Oben steht, wofür die Klasse gut ist und welche Fähigkeit alle ihre Helden teilen." },
    { art: "info", ziel: ".hub-held-reihe", titel: "Drei Helden je Klasse", text: "Helden mit Schloss gehören dir noch nicht. Ansehen kannst du sie trotzdem." },
    { art: "klick", ziel: () => `.hub-held-reihe .fkarte[data-fid="${held()}"]`, titel: "Ein Held im Einzelnen", text: () => `Das ist ${F().FIGUREN[held()].name}, einer deiner Helden. Tippe auf die Karte.` },
    { art: "info", ziel: ".held .held-text .eyebrow", titel: "Rolle und Anspruch", text: "Die erste Zeile sagt, wo der Held im Kampf steht und wie anspruchsvoll er zu spielen ist." },
    { art: "info", ziel: ".held .sm-stufe", opt: true, titel: "Stufe und Erfahrung", text: "Jeder Held hat seine eigene Stufe von 1 bis 10. Der Balken zeigt, wie viel Erfahrung bis zur nächsten Stufe fehlt." },
    { art: "info", ziel: ".held .held-achsen", titel: "Stärken auf einen Blick", text: "Fünf Balken: Angriff, Schutz, Unterstützung, Kontrolle und Beweglichkeit." },
    { art: "info", ziel: ".held .held-kern", titel: "Die wichtigsten Werte", text: "Trefferpunkte sind das Leben des Helden. Die Rüstungsklasse sagt, wie schwer er zu treffen ist. Bewegung zählt in Feldern je Zug." },
    { art: "info", ziel: ".held .held-werte", titel: "Attribute", text: "Sechs Attribute von Stärke bis Charisma. Das hervorgehobene ist das Hauptattribut – es steckt in fast jedem Wurf des Helden." },
    { art: "info", ziel: ".held .held-faehig", titel: "Fähigkeiten", text: "Das kann der Held jetzt schon. Dabei steht, ob eine Fähigkeit die Aktion, die Bonusaktion oder nichts kostet." },
    { art: "info", ziel: ".held .held-faehig.gesperrt", opt: true, titel: "Was noch kommt", text: "Mit Schloss: Fähigkeiten, die erst auf höheren Stufen dazukommen – und ab welcher Stufe." },
    { art: "klick", ziel: '.held [data-reiter="stufen"]', titel: "Wie Helden aufsteigen", text: "Tippe auf „Stufen“." },
    { art: "info", ziel: ".held .held-pfad", titel: "Der Weg bis Stufe 10", text: "Der Weg ist fest: neue Fähigkeiten auf Stufe 3 und 7, Verbesserungen auf 5 und 8, die Meisterschaft samt Titel auf Stufe 10. Erfahrung gibt es für jede abgeschlossene Kampagne und für Kämpfe in der Arena." },
    { art: "klick", ziel: '.held [data-reiter="aussen"]', titel: "Abseits des Kampfes", text: "Helden können mehr als kämpfen. Tippe auf „Abseits des Kampfes“." },
    { art: "info", ziel: ".held .held-aussen", titel: "Eigene Wege in der Geschichte", text: "In den Kampagnen öffnet jeder Held eigene Möglichkeiten: Schlösser knacken, Spuren lesen, Tote zur Ruhe singen." },
    { art: "klick", ziel: '.held [data-reiter="lore"]', opt: true, titel: "Die Geschichte des Helden", text: "Jeder Held hat eine Vergangenheit. Tippe auf „Geschichte“." },
    { art: "info", ziel: ".held .held-lore", opt: true, titel: "Herkunft und Geheimnis", text: "Woher der Held kommt, was ihn antreibt – und etwas, das kaum jemand weiß." },
    { art: "info", ziel: ".hub-held-reihe .fkarte.gesperrt", opt: true, titel: "Weitere Helden finden", text: "Neue Helden bekommst du auf drei Wegen: für jedes neue Kampagnen-Ende, mit etwas Glück nach einem Sieg in der Arena und beim Händler gegen Seelensplitter." },
    // --- Abenteurergilde ---
    { art: "klick", ziel: nav("kampagnen"), titel: "Die Abenteurergilde", text: "Weiter zur Abenteurergilde. Tippe oben in der Leiste darauf." },
    { art: "info", ziel: ".karte-box.gilde .k-kopf, #hub-seite .hub-gruss", titel: "Das Auftragsbrett", text: "Hier hängen deine Kampagnen. Eine Kampagne ist ein ganzes Abenteuer mit Geschichte, Entscheidungen und Kämpfen." },
    { art: "info", ziel: '.gilde-knoepfe [data-hub="neu"]', titel: "Neue Kampagne starten", text: "Damit beginnst du ein Abenteuer. Du wählst die Kampagne, mindestens drei Helden und ob du allein spielst (Solo-Mode) oder mit Freunden an einem Tisch (Coop-Mode). Das machen wir jetzt noch nicht." },
    { art: "info", ziel: '.gilde-knoepfe [data-hub="beitreten"]', titel: "Kampagne beitreten", text: "Hat dich jemand an seinen Tisch eingeladen, trittst du hier mit dem Code bei und spielst deinen Helden auf dem Handy." },
    { art: "info", ziel: ".karte-box.gilde .k-liste, .karte-box.gilde .gilde-leer, .karte-box.gilde .note", opt: true, titel: "Laufende und pausierte Aufträge", text: "Jede Kampagne wird von selbst gespeichert. Hier setzt du sie fort, nimmst eine pausierte wieder auf oder beginnst neu." },
    { art: "klick", ziel: "#k-zu", opt: true, titel: "Zurück ins Dorf", text: "Schließe das Auftragsbrett." },
    // --- Taverne ---
    { art: "klick", ziel: nav("freunde"), titel: "Die Taverne", text: "In der Taverne triffst du deine Freunde. Tippe darauf." },
    { art: "info", ziel: "#qr-overlay .karte-box .k-kopf", titel: "Freunde", text: "Freunde lädst du mit einem Tipp in deine Kampagnen ein, statt Codes zu verschicken." },
    { art: "info", ziel: "#f-suche", opt: true, titel: "Spieler finden", text: "Gib den genauen Benutzernamen ein und schicke eine Anfrage. Anfragen an dich erscheinen oben bei der Glocke." },
    { art: "klick", ziel: "#fenster-zu", titel: "Weiter", text: "Schließe die Taverne." },
    // --- Arena ---
    { art: "klick", ziel: nav("arena"), titel: "Die Arena", text: "Jetzt zur Arena. Tippe darauf." },
    { art: "info", ziel: "[data-arena] .hub-gruss", titel: "Spieler gegen Spieler", text: "In der Arena trittst du mit drei deiner Helden gegen einen anderen Spieler an. Niemand stirbt hier: Ihr kämpft gegen Spiegelbilder." },
    { art: "klick", ziel: "#arena-info", opt: true, titel: "Regeln und Modi", text: "Hinter dem „i“ stehen alle Regeln. Tippe darauf." },
    { art: "info", ziel: "#arena-info-text", opt: true, titel: "Vier Modi, das Los entscheidet", text: "Arena, Königsmord, Die Horde oder Duell: Welcher Modus gespielt wird, wird ausgelost. Jeder Held hat eine Minute Zugzeit." },
    { art: "info", ziel: "#arena-erstellen", opt: true, titel: "Kampf erstellen", text: "Du wählst drei Helden und wartest auf einen Gegner. Die Durchschnittsstufen beider Teams dürfen höchstens eine Stufe auseinanderliegen." },
    { art: "info", ziel: "[data-arena] .arena-liste, [data-arena] .hub-zwischen", opt: true, titel: "Offene Kämpfe", text: "Hier siehst du, wer gerade einen Gegner sucht, und trittst bei." },
    { art: "info", ziel: "[data-arena] .arena-waehrung", opt: true, titel: "Belohnungen", text: "Ein Sieg bringt Seelensplitter und Erfahrung für deine Helden, mit etwas Glück sogar einen neuen Helden. Erfahrung gibt es bis zum fünften Sieg am Tag." },
    // --- Händler ---
    { art: "klick", ziel: nav("shop"), titel: "Der Händler", text: "Weiter zum Händler. Tippe darauf." },
    { art: "info", ziel: ".shop-held, .shop-bald .hub-gruss, .shop .hub-gruss", titel: "Helden des Tages", text: "Jeden Tag bietet der Händler drei Helden an, die dir noch fehlen. Um Mitternacht wechselt die Auswahl." },
    { art: "info", ziel: ".shop-stand", opt: true, titel: "Bezahlt wird mit Seelensplittern", text: "Hier steht, wie viele du hast. Reicht es noch nicht, zeigt jeder Held, wie viele fehlen." },
    // --- Hilfe ---
    { art: "klick", ziel: nav("regeln"), titel: "Hilfe und Regeln", text: "Zum Schluss: die Hilfe. Tippe darauf." },
    { art: "ende", ziel: "#hub-seite .hub-gruss", titel: "Alles Weitere steht hier", text: "Hier findest du jederzeit die Regeln, einfach erklärt. Auswendig musst du nichts können – das Spiel rechnet für dich. Viel Erfolg in den Splitterlanden!" },
  ];

  let L = null; // laufendes Tutorial
  const sichtbar = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(el).visibility !== "hidden"; };
  const finde = (z) => { if (!z) return null; const s = typeof z === "function" ? z() : z; return [...document.querySelectorAll(s)].find(sichtbar) || null; };
  const warte = (z, ms) => new Promise((ok) => { const t0 = Date.now(), takt = setInterval(() => { const el = finde(z); if (el || Date.now() - t0 > ms || !L) { clearInterval(takt); ok(el); } }, 120); });

  function starten() {
    if (L) return;
    const root = document.createElement("div"); root.className = "tut"; root.id = "tut";
    root.innerHTML = `<div class="tut-b" data-b="o"></div><div class="tut-b" data-b="u"></div><div class="tut-b" data-b="l"></div><div class="tut-b" data-b="r"></div><div class="tut-b mitte" data-b="m"></div>
      <div class="tut-ring"></div>
      <button class="btn ghost klein tut-skip" id="tut-skip">Tutorial überspringen</button>
      <div class="tut-blase" role="dialog" aria-live="polite"><p class="tut-zahl"></p><h3></h3><p class="tut-text"></p><div class="tut-knoepfe"></div></div>`;
    document.body.appendChild(root); document.body.classList.add("tut-an");
    L = { root, liste: SCHRITTE(), nr: -1, ziel: null, takt: null, losKlick: null };
    $("#tut-skip").onclick = () => beenden();
    L.takt = setInterval(legen, 200); window.addEventListener("resize", legen); window.addEventListener("scroll", legen, true);
    weiter();
  }
  async function beenden() {
    if (!L) return; const l = L; L = null;
    clearInterval(l.takt); window.removeEventListener("resize", legen); window.removeEventListener("scroll", legen, true);
    if (l.losKlick) l.losKlick();
    const fertig = erledigt(); // zuerst merken, dann aufräumen
    l.root.remove(); document.body.classList.remove("tut-an");
    await fertig;
  }

  /** Sperrflächen, Ring und Sprechblase an die markierte Stelle legen */
  function legen() {
    if (!L) return; const { root } = L, el = L.ziel && document.body.contains(L.ziel) ? L.ziel : null, W = innerWidth, H = innerHeight, b = (n) => root.querySelector(`[data-b="${n}"]`);
    const blase = root.querySelector(".tut-blase"), ring = root.querySelector(".tut-ring"), s = L.liste[L.nr] || {};
    const setze = (n, x, y, w, h) => { const e = b(n); e.style.cssText = `left:${x}px;top:${y}px;width:${Math.max(0, w)}px;height:${Math.max(0, h)}px`; };
    if (!el) { setze("o", 0, 0, W, H); ["u", "l", "r", "m"].forEach((n) => setze(n, 0, 0, 0, 0)); ring.style.display = "none"; blase.className = "tut-blase mitte"; blase.style.cssText = ""; return; }
    const q = el.getBoundingClientRect(), p = 6, x = Math.max(0, q.left - p), y = Math.max(0, q.top - p), r = Math.min(W, q.right + p), u = Math.min(H, q.bottom + p);
    setze("o", 0, 0, W, y); setze("u", 0, u, W, H - u); setze("l", 0, y, x, u - y); setze("r", r, y, W - r, u - y);
    if (s.art === "klick") setze("m", 0, 0, 0, 0); else setze("m", x, y, r - x, u - y); // Info-Schritt: auch die markierte Stelle ist gesperrt
    ring.style.cssText = `display:block;left:${x}px;top:${y}px;width:${r - x}px;height:${u - y}px`;
    // Sprechblase: am Handy oben oder unten angeheftet, sonst unter oder über der Stelle
    blase.className = "tut-blase"; blase.style.cssText = "";
    const bh = blase.offsetHeight, bw = blase.offsetWidth, mitteY = (y + u) / 2;
    if (W < 700) { // Handy: unten oder oben angeheftet – dort, wo die Stelle frei bleibt (sonst dort, wo mehr Platz ist)
      const untenFrei = u <= H - bh - 20, obenFrei = y >= 54 + bh + 8;
      blase.classList.add(untenFrei ? "unten" : obenFrei ? "oben" : H - u >= y ? "unten" : "oben"); return; }
    const lage = [[(x + r) / 2 - bw / 2, u + 14], [(x + r) / 2 - bw / 2, y - bh - 14], [r + 14, (y + u) / 2 - bh / 2], [x - bw - 14, (y + u) / 2 - bh / 2]]
      .map(([lx, ty]) => [Math.max(12, Math.min(W - bw - 12, lx)), Math.max(56, Math.min(H - bh - 10, ty))])
      .find(([lx, ty]) => ty >= u + 6 || ty + bh <= y - 6 || lx >= r + 6 || lx + bw <= x - 6);
    const [left, top] = lage || [W - bw - 16, H - bh - 16]; // sehr große Stelle: unten rechts in die Ecke
    blase.style.cssText = `left:${left}px;top:${top}px`;
  }

  async function weiter() {
    if (!L) return;
    if (L.losKlick) { L.losKlick(); L.losKlick = null; }
    L.nr++; const s = L.liste[L.nr]; if (!s) return beenden();
    const { root } = L, blase = root.querySelector(".tut-blase");
    L.ziel = null; blase.classList.add("wartet"); legen();
    let el = s.ziel ? await warte(s.ziel, s.opt ? 1800 : 6000) : null; if (!L) return;
    if (s.ziel && !el && s.opt) return weiter();                       // die Stelle gibt es hier nicht: auslassen
    if (el) { try { el.scrollIntoView({ block: "center", inline: "center" }); } catch (e) { el.scrollIntoView(); } await new Promise((r) => setTimeout(r, 120)); if (!L) return; }
    L.ziel = el;
    const text = typeof s.text === "function" ? s.text() : s.text, klick = s.art === "klick" && el, nInfo = L.liste.length;
    root.querySelector(".tut-zahl").textContent = `Schritt ${L.nr + 1} von ${nInfo}`;
    blase.querySelector("h3").textContent = s.titel; root.querySelector(".tut-text").textContent = text;
    const kn = root.querySelector(".tut-knoepfe");
    kn.innerHTML = s.art === "ende" ? `<button class="btn gross" id="tut-fertig">Ich bin bereit!</button>`
      : klick ? `<span class="tut-hinweis">👆 Tippe auf die markierte Stelle</span>` : `<button class="btn" id="tut-weiter">Weiter</button>`;
    blase.classList.remove("wartet"); legen();
    const w = $("#tut-weiter"); if (w) { w.onclick = weiter; w.focus({ preventScroll: true }); }
    const f = $("#tut-fertig"); if (f) { f.onclick = () => beenden(); f.focus({ preventScroll: true }); }
    if (klick) { // nur die markierte Stelle ist anklickbar; danach geht es von selbst weiter
      const los = () => { el.removeEventListener("click", los, true); L && (L.losKlick = null); setTimeout(weiter, 380); };
      el.addEventListener("click", los, true); L.losKlick = () => el.removeEventListener("click", los, true);
    }
  }

  /** Nach der Heldenwahl und beim Betreten des Dorfs: Tutorial starten, wenn es für dieses Konto ansteht */
  async function pruefen() {
    if (L || STILL) return false;
    const hub = $("#hub"); if (!hub || hub.hidden) return false;
    if (!(await offen())) return false;
    if (L || hub.hidden || $(".intro-film") || ($("#sm-buehne") && !$("#sm-buehne").hidden)) return false;
    if (window.MYTHARA && window.MYTHARA.zeigeHub) window.MYTHARA.zeigeHub();
    const o = $("#qr-overlay"); if (o) o.hidden = true;
    starten(); return true;
  }
  /** Aus dem Profilmenü: Tutorial noch einmal ansehen */
  async function nochmal() { lokal("offen"); try { await rpc("rpg_tutorial_reset"); } catch (e) { /* ohne 011: Wert dieses Geräts */ } if (window.MYTHARA && window.MYTHARA.zeigeHub) window.MYTHARA.zeigeHub(); const o = $("#qr-overlay"); if (o) o.hidden = true; starten(); }

  window.ABTUT = { pruefen, starten, nochmal, beenden, konto: (name) => { KONTO = String(name || ""); }, merkeNeu: () => lokal("offen"), laeuft: () => Boolean(L), SCHRITTE };
})();
