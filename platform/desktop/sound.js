/*
 * MYSTERY ROOMS – Geräusche für Desktop-Spiele (Web Audio, keine Audiodateien)
 * Bereitgestellt als window.MRSound; DEADLINE.exe nutzt sie zusätzlich als DL.sound.
 * Lüfterrauschen, Klicks, Benachrichtigungen, Fehler, Störungen, Morse-Töne.
 */
(() => {
  "use strict";
  let ctx = null, master = null, fan = null, on = true;
  // Speicherschlüssel je Spiel: <html data-sound-key="..."> (DEADLINE: deadline_sound)
  const KEY = (document.documentElement && document.documentElement.dataset.soundKey) || "mr_sound";
  try { on = localStorage.getItem(KEY) !== "off"; } catch (e) { /* privat */ }

  function ensure() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(ctx.destination);
    return ctx;
  }
  function tone(freq, dur, { type = "sine", vol = 0.12, at = 0, attack = 0.005, release = 0.03 } = {}) {
    if (!ensure()) return;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release)); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, { vol = 0.2, at = 0, freq = 1200 } = {}) {
    if (!ensure()) return;
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master); src.start(ctx.currentTime + at);
  }
  function startFan() {
    if (fan || !ensure()) return;
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; src.loop = true; f.type = "lowpass"; f.frequency.value = 420; g.gain.value = 0.05;
    src.connect(f); f.connect(g); g.connect(master); src.start();
    fan = { src, g };
  }

  const fx = {
    click: () => tone(1800, 0.025, { type: "square", vol: 0.03 }),
    open: () => { tone(660, 0.06, { vol: 0.05 }); tone(990, 0.08, { vol: 0.04, at: 0.05 }); },
    notify: () => { tone(880, 0.09, { vol: 0.08 }); tone(1320, 0.14, { vol: 0.07, at: 0.1 }); },
    message: () => { tone(520, 0.07, { type: "triangle", vol: 0.1 }); tone(780, 0.12, { type: "triangle", vol: 0.09, at: 0.09 }); },
    error: () => { tone(180, 0.14, { type: "square", vol: 0.06 }); tone(150, 0.2, { type: "square", vol: 0.06, at: 0.16 }); },
    unlock: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, { type: "triangle", vol: 0.08, at: i * 0.07 })); },
    glitch: () => { noise(0.35, { vol: 0.35, freq: 2400 }); tone(70, 0.3, { type: "sawtooth", vol: 0.06 }); },
    alarm: () => { [0, 0.4, 0.8].forEach((t) => { tone(740, 0.18, { type: "square", vol: 0.05, at: t }); tone(560, 0.18, { type: "square", vol: 0.05, at: t + 0.2 }); }); },
    heart: () => { tone(58, 0.12, { type: "sine", vol: 0.32, attack: 0.01, release: 0.08 }); tone(52, 0.14, { type: "sine", vol: 0.24, at: 0.2, attack: 0.01, release: 0.1 }); },
    deny: () => { tone(220, 0.09, { type: "square", vol: 0.06 }); tone(165, 0.22, { type: "square", vol: 0.06, at: 0.1 }); },
    level: () => { [196, 165, 131].forEach((f, i) => tone(f, 0.35, { type: "sawtooth", vol: 0.05, at: i * 0.22 })); },
    beep: () => tone(1046, 0.06, { vol: 0.06 }),
    key: () => tone(2400 + Math.random() * 400, 0.012, { type: "square", vol: 0.015 }),
    boot: () => { tone(110, 0.6, { type: "sawtooth", vol: 0.04 }); tone(220, 0.4, { vol: 0.05, at: 0.3 }); },
  };

  /** Morse abspielen: Gruppen wie ["-.", "---"], Rückgabe: Liste {start, dur} in Sekunden */
  function morse(groups, { unit = 0.11, onDone } = {}) {
    const plan = []; let t = 0.15;
    groups.forEach((g, gi) => {
      g.split("").forEach((c, ci) => { const dur = c === "-" ? unit * 3 : unit; plan.push({ start: t, dur, g: gi }); t += dur + (ci < g.length - 1 ? unit : 0); });
      t += unit * 7;
    });
    if (ensure()) plan.forEach((p) => tone(640, p.dur, { type: "sine", vol: 0.14, at: p.start, attack: 0.004, release: 0.01 }));
    if (onDone) setTimeout(onDone, (t + 0.1) * 1000);
    return { plan, total: t };
  }

  const api = {
    play(name) { if (!on) return; try { ensure(); fx[name] && fx[name](); } catch (e) { /* ohne Ton */ } },
    morse,
    fan() { if (on) { try { startFan(); } catch (e) { /* ohne Ton */ } } },
    isOn: () => on,
    /** Lüfter lauter, je näher die Löschung kommt (0 = normal, 1 = Höchstlast) */
    fanLevel(x) { if (fan && ctx) fan.g.gain.setTargetAtTime(0.05 + 0.13 * Math.max(0, Math.min(1, x)), ctx.currentTime, 1.5); },
    toggle() {
      on = !on;
      try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) { /* privat */ }
      if (ensure()) master.gain.value = on ? 1 : 0;
      if (on) startFan();
      return on;
    },
  };
  api.tone = tone; api.noise = noise;
  /** Pause: alles stumm schalten, ohne die Einstellung zu ändern */
  api.suspend = (off) => { if (ctx) { if (off) ctx.suspend(); else ctx.resume(); } };
  window.MRSound = api;
  if (window.DL) window.DL.sound = api;
})();