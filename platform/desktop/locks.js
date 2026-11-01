/*
 * MYSTERY ROOMS – Sperren bei falschen Lösungen
 *
 *   const locks = MRLocks.create({ store: () => obj, now: () => spielSekunden, onChange })
 *   locks.left(ziel)            → verbleibende Sperre in Sekunden (0 = frei)
 *   locks.fail(ziel, { fixed }) → zählt einen Fehlversuch, setzt ggf. eine Sperre, gibt Sekunden zurück
 *   locks.fails(ziel)           → Anzahl der Fehlversuche
 *   locks.total()               → Fehlversuche insgesamt
 *
 * Standard: Der erste Fehlversuch je Ziel ist frei, danach 30 → 60 → 90 → 120 Sekunden.
 * `fixed`: feste Dauer ab dem zweiten Fehler (z. B. 90 für LEDGER).
 * Sperren laufen in Spielzeit – in der Pause stehen sie still. Sie betreffen nur Eingaben.
 */
(() => {
  "use strict";
  const STEPS = [0, 30, 60, 90, 120];
  function create({ store, now, onChange = () => {} }) {
    const S = () => store();
    const entry = (t) => (S()[t] = S()[t] || { fails: 0, until: 0 });
    return {
      left(t) { const e = S()[t]; return e ? Math.max(0, e.until - now()) : 0; },
      fails(t) { const e = S()[t]; return e ? e.fails : 0; },
      total() { return Object.values(S()).reduce((a, e) => a + (e.fails || 0), 0); },
      fail(t, { fixed = 0 } = {}) {
        const e = entry(t);
        e.fails += 1;
        const sec = e.fails <= 1 ? 0 : fixed || STEPS[Math.min(e.fails - 1, STEPS.length - 1)];
        e.until = now() + sec;
        onChange(t, sec);
        return sec;
      },
      fmt(sec) { sec = Math.ceil(sec); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`; },
    };
  }
  window.MRLocks = { create, version: 1 };
})();
