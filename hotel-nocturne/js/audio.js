/*
 * Klangeffekte, live im Browser erzeugt (Web Audio API) – keine Audiodateien nötig.
 * Später können hier echte Aufnahmen (assets/audio/…) ergänzt werden.
 */
(() => {
  let ctx = null;
  let enabled = true;
  let ambientTimer = null;
  let ambientName = null;

  /* iPhone/iPad: Web Audio wäre sonst bei aktivem Lautlos-Schalter stumm.
     „playback“ behandelt das Spiel wie einen Musik-Player (iOS 16.4+). */
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* älteres iOS */ }
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  /* iOS spielt ein <audio>-Element auch im Lautlos-Modus ab – und solange eines läuft,
     sind auch die Web-Audio-Geräusche hörbar. Deshalb läuft auf iPhone/iPad immer ein
     Element: die Musik oder, wenn sie aus ist, eine stille Schleife. */
  let keeper = null;
  function keepAlive(on) {
    if (!IOS) return;
    if (on) {
      if (!keeper) { keeper = new Audio("assets/audio/silence.mp3"); keeper.loop = true; keeper.setAttribute("playsinline", ""); }
      if (keeper.paused) keeper.play().catch(() => {});
    } else if (keeper && !keeper.paused) keeper.pause();
  }
  /* Auf iOS lässt sich die Lautstärke eines <audio>-Elements nicht regeln. Darum gibt es
     zu jeder Musikdatei eine leiser abgemischte Fassung mit der Endung -ios.mp3. */
  const iosUrl = (u) => u.replace(/\.mp3$/, "-ios.mp3");

  function getCtx() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state !== "running" && !document.hidden) ctx.resume().catch(() => {});
    return ctx;
  }
  function ac() { return enabled ? getCtx() : null; }

  /* Bei jeder Berührung prüfen, ob iOS den Ton angehalten hat (z. B. nach App-Wechsel),
     und ihn innerhalb der Geste wieder freigeben – inklusive eines stillen Puffers. */
  let unlocked = false;
  function unlock() {
    if (!enabled) return;
    const c = getCtx(); if (!c) return;
    if (!unlocked) {
      try { const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); unlocked = true; } catch (e) { /* egal */ }
    }
    if (M.active && M.el && M.el.paused && !M.src) M.el.play().catch(() => {});
    if (!M.active || !M.el) keepAlive(true);
  }
  ["pointerdown", "touchend", "keydown"].forEach((ev) => document.addEventListener(ev, unlock, { capture: true, passive: true }));

  function tone({ f = 440, type = "sine", d = 0.2, v = 0.12, delay = 0, slide = 0 }) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + d + 0.05);
  }

  function noise({ d = 0.1, v = 0.1, freq = 2000, delay = 0, type = "bandpass" }) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * d), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = type; f.frequency.value = freq; g.gain.value = v;
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
  }

  const sounds = {
    click: () => tone({ f: 1100, type: "square", d: 0.025, v: 0.025 }),
    key: () => { noise({ d: 0.03, v: 0.25, freq: 2500 }); tone({ f: 700, type: "triangle", d: 0.05, v: 0.03 }); },
    open: () => noise({ d: 0.25, v: 0.12, freq: 900 }),
    paper: () => { noise({ d: 0.12, v: 0.12, freq: 4000 }); noise({ d: 0.1, v: 0.08, freq: 3000, delay: 0.1 }); },
    error: () => { tone({ f: 160, type: "sawtooth", d: 0.18, v: 0.05 }); tone({ f: 120, type: "sawtooth", d: 0.22, v: 0.05, delay: 0.12 }); },
    unlock: () => { noise({ d: 0.06, v: 0.4, freq: 1500 }); tone({ f: 180, type: "triangle", d: 0.25, v: 0.12, delay: 0.05, slide: -60 }); },
    success: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ f, d: 0.9, v: 0.05, delay: i * 0.11 })),
    bell: () => { tone({ f: 1318, d: 1.8, v: 0.1 }); tone({ f: 2637, d: 1.1, v: 0.03 }); tone({ f: 1318, d: 1.4, v: 0.012, delay: 1.3 }); },
    phone: () => { for (let i = 0; i < 3; i++) tone({ f: 880, type: "square", d: 0.12, v: 0.02, delay: i * 0.18 }); noise({ d: 1.2, v: 0.02, freq: 1200, delay: 0.6 }); },
    elevator: () => { tone({ f: 70, type: "sawtooth", d: 2.2, v: 0.04, slide: 30 }); tone({ f: 1046, d: 1.2, v: 0.05, delay: 2.0 }); },
    tick: () => noise({ d: 0.012, v: 0.07, freq: 5000 }),
    step: () => { noise({ d: 0.07, v: 0.18, freq: 300, type: "lowpass" }); noise({ d: 0.06, v: 0.12, freq: 280, type: "lowpass", delay: 0.22 }); },
    pickup: () => { noise({ d: 0.08, v: 0.12, freq: 1800 }); tone({ f: 660, type: "triangle", d: 0.12, v: 0.05, delay: 0.05 }); tone({ f: 990, type: "triangle", d: 0.2, v: 0.04, delay: 0.12 }); },
    door: () => { tone({ f: 90, type: "sawtooth", d: 0.9, v: 0.035, slide: 60 }); noise({ d: 0.5, v: 0.08, freq: 500, delay: 0.5 }); },
    buzz: () => { for (let i = 0; i < 2; i++) tone({ f: 140, type: "square", d: 0.18, v: 0.03, delay: i * 0.28 }); },
    light: () => noise({ d: 0.02, v: 0.3, freq: 3500 }),
    drop: () => { noise({ d: 0.04, v: 0.3, freq: 3000 }); tone({ f: 1400, d: 0.4, v: 0.03, delay: 0.02 }); noise({ d: 0.05, v: 0.2, freq: 2500, delay: 0.18 }); },
    rumble: () => { noise({ d: 1.6, v: 0.35, freq: 120, type: "lowpass" }); tone({ f: 55, type: "sawtooth", d: 1.4, v: 0.04, slide: 20 }); noise({ d: 0.5, v: 0.15, freq: 400, delay: 1.2 }); },
    steps_far: () => { [0, 0.45, 0.9, 1.3].forEach((t, i) => noise({ d: 0.06, v: 0.12 - i * 0.025, freq: 250, type: "lowpass", delay: t })); },
    gate: () => { noise({ d: 0.05, v: 0.4, freq: 2500 }); tone({ f: 310, type: "square", d: 0.3, v: 0.03, delay: 0.03 }); tone({ f: 120, type: "sawtooth", d: 0.8, v: 0.03, delay: 0.2, slide: -40 }); },
    drip: () => { tone({ f: 1800 + Math.random() * 700, d: 0.09, v: 0.035, slide: -900 }); },
    thunder: () => { noise({ d: 2.6, v: 0.5, freq: 160, type: "lowpass" }); noise({ d: 1.4, v: 0.35, freq: 90, type: "lowpass", delay: 0.3 }); },
  };

  /* ---------- Hintergrundmusik (Endlosschleife) ----------
     Bevorzugt Web Audio (lückenloser Loop). Wenn die Datei nicht geladen werden kann
     (z. B. beim Öffnen direkt aus dem Dateisystem), wird ein normales <audio>-Element benutzt. */
  const M = { url: null, vol: 0.38, active: false, gain: null, src: null, bufs: {}, failed: {}, el: null, fadeTimer: null };
  const musicCtx = getCtx;
  async function loadBuffer(url) {
    if (M.bufs[url] || M.failed[url]) return M.bufs[url] || null;
    if (location.protocol === "file:") { M.failed[url] = true; return null; } // fetch geht im Dateisystem nicht
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      M.bufs[url] = await musicCtx().decodeAudioData(await res.arrayBuffer());
    } catch (e) { M.failed[url] = true; }
    return M.bufs[url] || null;
  }
  function fadeElement(el, to, ms, done) {
    clearInterval(M.fadeTimer);
    const from = el.volume, steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    M.fadeTimer = setInterval(() => {
      i++; el.volume = Math.min(1, Math.max(0, from + (to - from) * (i / steps)));
      if (i >= steps) { clearInterval(M.fadeTimer); if (done) done(); }
    }, 50);
  }
  function playElement(url) {
    if (!M.el || M.el.dataset.url !== url) {
      if (M.el) M.el.pause();
      const el = new Audio(IOS ? iosUrl(url) : url);
      el.loop = true; el.preload = "auto"; el.setAttribute("playsinline", ""); el.dataset.url = url;
      if (IOS) el.addEventListener("error", () => { if (el.src.endsWith("-ios.mp3")) { el.src = url; if (M.active) el.play().catch(() => {}); } }, { once: true });
      M.el = el;
    }
    keepAlive(false);
    M.el.volume = IOS ? 1 : 0; // iOS erlaubt keine Lautstärkeregelung für <audio>
    const p = M.el.play(); // muss synchron in der Nutzergeste passieren (iOS)
    if (p) p.then(() => { if (!IOS) fadeElement(M.el, M.vol, 3000); }).catch(() => { /* wird beim nächsten Antippen erneut versucht */ });
  }
  async function startMusic(url) {
    M.url = url; M.active = true;
    // Dateisystem oder sehr altes iOS: direkt über <audio>, ohne vorher etwas zu laden
    if (location.protocol === "file:" || IOS || M.failed[url]) return playElement(url);
    const c = musicCtx();
    const buf = c ? await loadBuffer(url) : null;
    if (!M.active || M.url !== url) return; // inzwischen gestoppt oder gewechselt
    if (buf) {
      M.gain = c.createGain();
      M.gain.gain.setValueAtTime(0.0001, c.currentTime);
      M.gain.gain.exponentialRampToValueAtTime(M.vol, c.currentTime + 3);
      M.src = c.createBufferSource();
      M.src.buffer = buf; M.src.loop = true;
      M.src.connect(M.gain).connect(c.destination);
      M.src.start();
    } else {
      playElement(url);
    }
  }
  function stopMusic(fade = 1500) {
    M.active = false;
    if (M.src && ctx) {
      const g = M.gain, s = M.src, t = ctx.currentTime;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + fade / 1000);
      s.stop(t + fade / 1000 + 0.05);
      M.src = null; M.gain = null;
    }
    if (M.el && !M.el.paused) { const el = M.el; if (IOS) el.pause(); else fadeElement(el, 0, fade, () => el.pause()); }
    if (enabled) keepAlive(true);
  }
  document.addEventListener("visibilitychange", () => {
    if (!M.active) return;
    if (document.hidden) { if (ctx) ctx.suspend().catch(() => {}); if (M.el) M.el.pause(); keepAlive(false); }
    else { if (ctx) ctx.resume().catch(() => {}); if (M.el && !M.src) M.el.play().catch(() => {}); }
  });

  window.NOCTURNE.audio = {
    play(name) { if (enabled && sounds[name]) try { sounds[name](); } catch (e) { /* Audio ist optional */ } },
    setEnabled(on) { enabled = on; if (!on) { this.ambient(null); stopMusic(400); keepAlive(false); } },
    /* Zustand der Musik (für Tests und Fehlersuche) */
    musicInfo() { return { active: M.active, url: M.url, mode: M.src ? "webaudio" : M.el && !M.el.paused ? "element" : "aus", src: M.el ? M.el.src.split("/").pop() : null, keeper: keeper ? (keeper.paused ? "pausiert" : "läuft") : "keiner", ctx: ctx ? ctx.state : "keiner", ios: IOS, session: navigator.audioSession ? navigator.audioSession.type : "nicht verfügbar" }; },
    /* music(url) startet bzw. wechselt die Musik, music(null) blendet sie aus. */
    music(url) {
      if (!url || !enabled) { if (M.active) stopMusic(); return; }
      if (M.active && M.url === url) return;
      if (M.active) stopMusic(800);
      startMusic(url);
    },
    /* Raumgeräusch: "tick" (Uhr) oder "drip" (Tropfen und Rohrbrummen im Keller) */
    ambient(name) {
      if (name === ambientName && ambientTimer) return;
      clearInterval(ambientTimer); clearTimeout(ambientTimer); ambientTimer = null; ambientName = null;
      if (!enabled || !name) return;
      ambientName = name;
      if (name === "tick") {
        let odd = false;
        ambientTimer = setInterval(() => { odd = !odd; if (!document.hidden) noise({ d: 0.012, v: odd ? 0.05 : 0.035, freq: odd ? 5000 : 4200 }); }, 1000);
      }
      if (name === "drip") {
        const next = () => {
          ambientTimer = setTimeout(() => {
            if (!document.hidden) { sounds.drip(); if (Math.random() < 0.15) noise({ d: 1.4, v: 0.06, freq: 90, type: "lowpass" }); }
            if (ambientName === "drip") next();
          }, 700 + Math.random() * 1900);
        };
        next();
      }
    },
  };
})();
