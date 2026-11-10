/* Case Unlocked · Abenteuer – Zeichnungen für Tisch und Handy (Klassen-Zeichen, Rostkäfer) */
(function () {
  "use strict";
  const ICON = {
    schild: '<path d="M0 -15 L12 -10 L11 4 Q8 12 0 16 Q-8 12 -11 4 L-12 -10 Z" fill="#1d1a14" stroke="#1d1a14" stroke-width="1"/><path d="M0 -10 V11 M-7 -2 H7" stroke="#c9a24a" stroke-width="2.5"/>',
    flamme: '<path d="M0 -16 C9 -6 12 2 7 10 C4 15 -4 15 -7 10 C-11 3 -6 -4 -2 -7 C-2 -2 0 1 3 1 C4 -6 2 -11 0 -16 Z" fill="#1d1a14"/>',
    sonne: '<circle r="7" fill="#1d1a14"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-1.6" y="-16" width="3.2" height="6" fill="#1d1a14" transform="rotate(${a})"/>`).join(""),
  };
  function kaefer() {
    return '<g><ellipse rx="17" ry="13" fill="#7a4a2a" stroke="#2a1a10" stroke-width="2"/><path d="M0 -13 V13" stroke="#2a1a10" stroke-width="1.5"/>' +
      [-1, 1].map((s) => `<path d="M${s * 12} -8 l${s * 9} -6 M${s * 14} 0 l${s * 10} 0 M${s * 12} 8 l${s * 9} 6" stroke="#2a1a10" stroke-width="2.4" stroke-linecap="round"/>`).join("") +
      '<circle cx="-5" cy="-14" r="2.4" fill="#e8c27a"/><circle cx="5" cy="-14" r="2.4" fill="#e8c27a"/>' +
      '<circle cx="-6" cy="-2" r="3" fill="#b5713d" opacity=".8"/><circle cx="6" cy="4" r="2.5" fill="#b5713d" opacity=".8"/></g>';
  }
  /** Spielerfigur als Plakette (ohne Position) */
  const plakette = (farbe, zeichen) => `<circle r="21" fill="${farbe}" stroke="#1d1a14" stroke-width="3"/>${ICON[zeichen] || ""}`;
  /** Kleines eigenständiges SVG, z. B. für Handy und Lobby */
  function marke(klasse, px = 40) {
    const c = window.ABR.KLASSEN[klasse];
    return `<svg class="marke" width="${px}" height="${px}" viewBox="-25 -25 50 50" aria-hidden="true">${plakette(c.farbe, c.zeichen)}</svg>`;
  }
  window.ABB = { ICON, kaefer, plakette, marke };
})();
