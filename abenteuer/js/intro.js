/*
 * Mythara – Intro: die Geschichte der Welt als kurzer Film aus Standbildern (Kamerafahrten, Überblendungen, eingeblendeter Text).
 * Läuft einmal nach der Registrierung vor der Heldenwahl und lässt sich am Splitterbrunnen noch einmal ansehen.
 * Die Bilder werden erst geladen, wenn das Intro startet. Überspringen geht jederzeit; ein Tipp ins Bild springt zur nächsten Szene.
 * Globaler Name: window.ABINTRO = { zeigen(fertig), gesehen() }
 */
(function () {
  "use strict";
  // bild: Breitbild · hoch: eigenes Hochformat (sonst fährt die Kamera am Handy quer über das Breitbild) · fahrt: Bewegung der Kamera
  const SZENEN = [
    { bild: "img/intro/szene-1.webp", dauer: 6000, fahrt: "zoom-rein", text: "Am Anfang war Mythara ein einziges Licht." },
    { bild: "img/intro/szene-2.webp", dauer: 6500, fahrt: "runter", text: "Als es zerbrach, fiel ein Splitter davon in alles, was lebt." },
    { bild: "img/intro/szene-3.webp", dauer: 7000, fahrt: "rechts", text: "Vor dreihundert Jahren griffen die Magier nach dieser Macht. Niemand gewann ihren Krieg." },
    { bild: "img/intro/szene-4.webp", dauer: 7500, fahrt: "zoom-rein", text: "Er verwandelte Tiere in Ungeheuer. Er ließ die Toten aufstehen. Und er öffnete dem Hohlen die Tür." },
    { bild: "img/intro/szene-5.webp", dauer: 7000, fahrt: "zoom-raus", text: "Das Reich von Veyrholm band das Böse in sieben Siegel. Es war besiegt. Vorerst." },
    { bild: "img/intro/szene-6.webp", dauer: 6500, fahrt: "links", text: "Dann wollten seine Könige mehr. In einer Nacht begrub das Eis die Stadt." },
    { bild: "img/intro/szene-7.webp", dauer: 6500, fahrt: "rechts", text: "Die Kreaturen sind geblieben. Sie gehorchen niemandem mehr." },
    { bild: "img/intro/szene-8.webp", dauer: 6500, fahrt: "links", text: "Jetzt werden die Siegel schwach. Etwas erwacht." },
    { bild: "img/dorf/dorf-breit.webp", hoch: "img/dorf/dorf-hoch.webp", dauer: 7500, fahrt: "zoom-raus", text: "Manche tragen einen größeren Splitter in sich. Es zieht sie dorthin, wo es bricht. Du bist einer von ihnen." },
  ];
  // AKTIV: Bei false liefe das Intro nur auf der Vorschau-Seite (intro.html) – nicht nach der Registrierung und nicht am Splitterbrunnen.
  const AKTIV = true, MUSIK = "ton/intro.mp3";
  const MERKER = "ab_intro_gesehen";
  // ?schnell und ?testlauf (automatische Tests) überspringen das Intro; ?intro erzwingt es
  const PARAM = new URLSearchParams(location.search);
  const gesehen = () => { if (PARAM.has("intro")) return false; if (PARAM.has("schnell") || PARAM.has("testlauf")) return true; try { return localStorage.getItem(MERKER) === "1"; } catch (e) { return false; } };
  const merken = () => { try { localStorage.setItem(MERKER, "1"); } catch (e) { /* privat */ } };
  const hochkant = () => window.matchMedia("(orientation: portrait) and (max-width: 760px)").matches;
  const quelle = (s) => (s.hoch && hochkant() ? s.hoch : s.bild);
  const laden = (src) => new Promise((ok) => { const i = new Image(); i.onload = i.onerror = () => ok(); i.src = src; });

  let lauf = null;
  function zeigen(fertig) {
    if (lauf) lauf.ende(true);
    const el = document.createElement("div"); el.className = "intro-film"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Intro: Die Geschichte von Mythara");
    el.innerHTML = `<div class="intro-buehne"></div><div class="intro-schleier"></div>
      <p class="intro-text" aria-live="polite"></p>
      <div class="intro-ende" hidden><span>MYTHARA</span><small>Die Splitterlande</small></div>
      <div class="intro-leiste"><span class="intro-punkte">${SZENEN.map(() => "<i></i>").join("")}</span><span class="intro-knoepfe"><button class="btn ghost klein" id="intro-ton" aria-label="Ton an oder aus">🔊 Ton</button><button class="btn ghost klein" id="intro-skip">Überspringen</button></span></div>`;
    document.body.appendChild(el); document.body.classList.add("intro-an");
    const buehne = el.querySelector(".intro-buehne"), text = el.querySelector(".intro-text"), punkte = [...el.querySelectorAll(".intro-punkte i")];
    let nr = -1, uhr = null, vorbei = false;
    // Musik: Browser spielen Ton nur nach einem Tipp ab. Gelingt der Start nicht, bleibt das Intro stumm und der Knopf heißt „Ton an“.
    const musik = new Audio(MUSIK); musik.preload = "auto"; musik.volume = 0.8;
    const tonKnopf = el.querySelector("#intro-ton"), tonZeigen = () => { tonKnopf.textContent = musik.paused || musik.muted ? "🔇 Ton an" : "🔊 Ton aus"; };
    musik.play().then(tonZeigen, tonZeigen);
    tonKnopf.onclick = (e) => { e.stopPropagation(); if (musik.paused) { musik.muted = false; musik.play().then(tonZeigen, tonZeigen); } else { musik.muted = !musik.muted; tonZeigen(); } };
    const leiser = () => { const t0 = Date.now(), v0 = musik.volume, takt = setInterval(() => { const k = 1 - (Date.now() - t0) / 900; if (k <= 0) { clearInterval(takt); musik.pause(); } else musik.volume = v0 * k; }, 60); };
    const ende = (still) => {
      if (vorbei) return; vorbei = true; clearTimeout(uhr); lauf = null; merken(); if (still) musik.pause(); else leiser();
      el.classList.add("zu"); document.body.classList.remove("intro-an");
      setTimeout(() => { el.remove(); }, still ? 0 : 600);
      if (!still && fertig) fertig();
    };
    const schluss = () => { // Titel einblenden, dann weiter
      text.classList.remove("an"); el.querySelector(".intro-ende").hidden = false; el.classList.add("titel");
      uhr = setTimeout(() => ende(false), 2600);
    };
    const weiter = async () => {
      if (vorbei) return; clearTimeout(uhr);
      nr++; if (nr >= SZENEN.length) return schluss();
      const s = SZENEN[nr], src = quelle(s);
      await laden(src); if (vorbei) return;
      const bild = document.createElement("div"); bild.className = "intro-bild fahrt-" + s.fahrt + (s.hoch && hochkant() ? " passt" : "");
      bild.style.backgroundImage = `url("${src}")`; bild.style.animationDuration = s.dauer + 1200 + "ms";
      buehne.appendChild(bild); void bild.offsetWidth; bild.classList.add("an");
      [...buehne.children].slice(0, -1).forEach((alt) => { alt.classList.remove("an"); setTimeout(() => alt.remove(), 1300); });
      punkte.forEach((p, i) => p.classList.toggle("an", i <= nr));
      text.classList.remove("an"); setTimeout(() => { if (!vorbei) { text.textContent = s.text; text.classList.add("an"); } }, 500);
      if (SZENEN[nr + 1]) laden(quelle(SZENEN[nr + 1])); // nächste Szene vorladen
      uhr = setTimeout(weiter, s.dauer);
    };
    el.querySelector("#intro-skip").onclick = (e) => { e.stopPropagation(); ende(false); };
    el.onclick = () => { if (!el.classList.contains("titel")) weiter(); };
    const taste = (e) => { if (vorbei) return document.removeEventListener("keydown", taste); if (e.key === "Escape") ende(false); else if (e.key === " " || e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); if (!el.classList.contains("titel")) weiter(); } };
    document.addEventListener("keydown", taste);
    lauf = { ende };
    weiter();
  }

  // still: in automatischen Tests (?schnell, ?testlauf) startet das Intro nirgends von selbst
  window.ABINTRO = { zeigen, gesehen, SZENEN, aktiv: AKTIV || PARAM.has("intro"), still: !PARAM.has("intro") && (PARAM.has("schnell") || PARAM.has("testlauf")) };
})();
