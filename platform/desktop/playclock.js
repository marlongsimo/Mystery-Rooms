/*
 * MYSTERY ROOMS – Spielzeit-Uhr für Desktop-Spiele
 *
 *   const clock = MRPlayClock.create({ get: () => sec, set: (sec) => {}, onTick: (sec) => {}, save: () => {} });
 *   clock.start() · clock.stop() · clock.pause(true|false) · clock.isPaused() · clock.isRunning()
 *
 * Zählt Spielzeit, solange das Spiel läuft und nicht pausiert ist – auch in einem
 * Hintergrund-Tab. Gemessen wird mit der Systemuhr, weil Browser Zeitgeber im Hintergrund
 * drosseln. Ein Sprung über `maxJump` Sekunden (Ruhezustand) zählt nur als 1 Sekunde.
 * Gespeichert wird alle 5 Sekunden und beim Verlassen der Seite.
 */
(() => {
  "use strict";
  function create({ get, set, onTick = () => {}, save = () => {}, maxJump = 120 }) {
    let running = false, paused = false, last = null, frac = 0, lastSave = 0;
    function tick() {
      if (!running || paused) { last = null; return; }
      const now = Date.now();
      if (last === null) { last = now; return; }
      let d = (now - last) / 1000; last = now;
      if (d > maxJump) d = 1;
      frac += d;
      const whole = Math.floor(frac);
      if (!whole) return;
      frac -= whole;
      set(get() + whole);
      if (now - lastSave > 5000) { lastSave = now; save(); }
      onTick(get());
    }
    const timer = setInterval(tick, 250);
    window.addEventListener("pagehide", () => save());
    return {
      start() { running = true; last = null; },
      stop() { running = false; save(); },
      pause(on) { paused = Boolean(on); last = null; save(); },
      isPaused: () => paused,
      isRunning: () => running,
      destroy() { clearInterval(timer); },
    };
  }
  window.MRPlayClock = { create, version: 1 };
})();
