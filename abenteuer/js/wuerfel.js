/* Case Unlocked · Abenteuer – sichtbarer W20: rollt kurz, landet auf der gewürfelten Zahl */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /** SVG eines W20 mit Zahl */
  function svg(zahl, klasse = "") {
    return `<svg class="w20-svg ${klasse}" viewBox="0 0 100 100" aria-hidden="true">
      <polygon points="50,3 94,27 94,73 50,97 6,73 6,27" fill="#2a2216" stroke="currentColor" stroke-width="3"/>
      <polygon points="50,15 82,66 18,66" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="2"/>
      <path d="M50 15 L50 3 M82 66 L94 73 M18 66 L6 73 M18 66 L6 27 M82 66 L94 27 M50 15 L94 27 M50 15 L6 27 M18 66 L50 97 M82 66 L50 97" stroke="currentColor" stroke-opacity=".25" stroke-width="1.5"/>
      <text x="50" y="57" text-anchor="middle" font-size="25" font-weight="700" fill="#ece4d4" class="w20-zahl">${zahl}</text></svg>`;
  }
  /** Lässt den Würfel in el rollen und auf zahl landen; danach erscheint der Text */
  function rollen(el, zahl, text, opts = {}) {
    if (!el) return;
    const klasse = zahl === 20 ? "krit" : zahl === 1 ? "patzer" : opts.gut === true ? "gut" : opts.gut === false ? "schlecht" : "";
    el.innerHTML = `<div class="w20-box rollt ${klasse}">${svg(1 + Math.floor(Math.random() * 20))}</div><div class="w20-erg">${opts.titel ? `<b>${esc(opts.titel)}</b>` : ""}<span>${esc(text)}</span></div>`;
    const z = el.querySelector(".w20-zahl"), box = el.querySelector(".w20-box"), erg = el.querySelector(".w20-erg");
    if (opts.sofort) { z.textContent = zahl; box.classList.remove("rollt"); erg.classList.add("da"); return; }
    let n = 0;
    const tm = setInterval(() => {
      z.textContent = 1 + Math.floor(Math.random() * 20);
      if (++n >= 9) { clearInterval(tm); z.textContent = zahl; box.classList.remove("rollt"); box.classList.add("gelandet"); erg.classList.add("da"); }
    }, 60);
  }
  window.ABW = { svg, rollen };
})();
