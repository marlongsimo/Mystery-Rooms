/*
 * Klangeffekte, live im Browser erzeugt (Web Audio API) – keine Audiodateien nötig.
 * Später können hier echte Aufnahmen (assets/audio/…) ergänzt werden.
 */
(() => {
  let ctx = null;
  let enabled = true;
  let ambientTimer = null;

  function ac() {
    if (!enabled) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

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

  function noise({ d = 0.1, v = 0.1, freq = 2000, delay = 0 }) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * d), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; g.gain.value = v;
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
  };

  window.NOCTURNE.audio = {
    play(name) { if (enabled && sounds[name]) try { sounds[name](); } catch (e) { /* Audio ist optional */ } },
    setEnabled(on) { enabled = on; if (!on) this.ambient(null); },
    ambient(name) {
      clearInterval(ambientTimer); ambientTimer = null;
      if (!enabled || !name || !sounds[name]) return;
      let odd = false;
      ambientTimer = setInterval(() => { odd = !odd; if (!document.hidden) noise({ d: 0.012, v: odd ? 0.05 : 0.035, freq: odd ? 5000 : 4200 }); }, 1000);
    },
  };
})();
