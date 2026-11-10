/* Case Unlocked · Abenteuer – Zeichnungen für Tisch und Handy (Porträts, Gegner) */
(function () {
  "use strict";
  const F = () => window.ABF;
  function kaefer() {
    return '<g><ellipse rx="17" ry="13" fill="#7a4a2a" stroke="#2a1a10" stroke-width="2"/><path d="M0 -13 V13" stroke="#2a1a10" stroke-width="1.5"/>' +
      [-1, 1].map((s) => `<path d="M${s * 12} -8 l${s * 9} -6 M${s * 14} 0 l${s * 10} 0 M${s * 12} 8 l${s * 9} 6" stroke="#2a1a10" stroke-width="2.4" stroke-linecap="round"/>`).join("") +
      '<circle cx="-5" cy="-14" r="2.4" fill="#e8c27a"/><circle cx="5" cy="-14" r="2.4" fill="#e8c27a"/>' +
      '<circle cx="-6" cy="-2" r="3" fill="#b5713d" opacity=".8"/><circle cx="6" cy="4" r="2.5" fill="#b5713d" opacity=".8"/></g>';
  }
  const GEGNER = {
    rostkaefer: kaefer,
    schattenkobold: () => '<g><path d="M-12 16 Q-14 0 -8 -6 L-16 -14 L-6 -10 Q0 -16 6 -10 L16 -14 L8 -6 Q14 0 12 16 Z" fill="#2c2f3a" stroke="#0e0f14" stroke-width="2"/><circle cx="-4" cy="-4" r="2.2" fill="#f2d35a"/><circle cx="4" cy="-4" r="2.2" fill="#f2d35a"/><path d="M-4 5 L0 8 L4 5" stroke="#f2d35a" stroke-width="1.6" fill="none"/></g>',
    knochenwaechter: () => '<g><path d="M-13 -2 Q-13 -18 0 -18 Q13 -18 13 -2 Q13 6 7 8 L7 14 L-7 14 L-7 8 Q-13 6 -13 -2 Z" fill="#e6dfcf" stroke="#4a4438" stroke-width="2"/><circle cx="-5" cy="-3" r="4" fill="#1b1814"/><circle cx="5" cy="-3" r="4" fill="#1b1814"/><path d="M0 2 L-2 6 L2 6 Z" fill="#1b1814"/><path d="M-4 10 V14 M0 10 V14 M4 10 V14" stroke="#4a4438" stroke-width="1.4"/></g>',
    pilzbrut: () => '<g><path d="M-18 0 Q-16 -18 0 -18 Q16 -18 18 0 Z" fill="#8e5aa0" stroke="#3a2140" stroke-width="2"/><rect x="-6" y="0" width="12" height="15" rx="3" fill="#d9cfb8" stroke="#3a2140" stroke-width="2"/><circle cx="-8" cy="-8" r="3" fill="#e9c6f0"/><circle cx="5" cy="-11" r="2.5" fill="#e9c6f0"/><circle cx="10" cy="-4" r="2" fill="#e9c6f0"/></g>',
    netzweber: () => '<g>' + [-1, 1].map((s) => `<path d="M${s * 6} -4 l${s * 14} -10 M${s * 7} 0 l${s * 16} -2 M${s * 7} 4 l${s * 15} 8 M${s * 5} 7 l${s * 10} 12" stroke="#1a1410" stroke-width="2.6" stroke-linecap="round" fill="none"/>`).join("") + '<ellipse rx="9" ry="11" fill="#3b2a22" stroke="#120c08" stroke-width="2"/><circle cy="-11" r="6" fill="#3b2a22" stroke="#120c08" stroke-width="2"/><circle cx="-2.5" cy="-12" r="1.6" fill="#ff5a3a"/><circle cx="2.5" cy="-12" r="1.6" fill="#ff5a3a"/></g>',
    aschehund: () => '<g><path d="M-16 8 L-12 -6 L-6 -10 L-4 -18 L2 -11 L10 -12 L16 -4 L12 2 L6 2 L4 12 L-10 12 Z" fill="#3a2a24" stroke="#120c08" stroke-width="2"/><circle cx="6" cy="-6" r="2" fill="#ffb347"/><path d="M14 -2 Q20 0 18 6" stroke="#ff7a2a" stroke-width="2.4" fill="none"/><circle cx="-8" cy="4" r="2" fill="#ff7a2a" opacity=".8"/></g>',
    grabritter: () => '<g><path d="M-14 -6 Q-14 -20 0 -20 Q14 -20 14 -6 L14 12 L-14 12 Z" fill="#5d6470" stroke="#1b1e24" stroke-width="2"/><rect x="-10" y="-6" width="20" height="4" fill="#0e1014"/><path d="M0 -20 V-2" stroke="#1b1e24" stroke-width="2"/><circle cx="-5" cy="-4" r="1.4" fill="#7fd0ff"/><circle cx="5" cy="-4" r="1.4" fill="#7fd0ff"/><path d="M-14 12 L-18 18 M14 12 L18 18" stroke="#1b1e24" stroke-width="2"/></g>',
  };
  const gegner = (art) => (GEGNER[art] || kaefer)();
  /** Rundes Porträt im SVG (r = Radius). clipId muss eindeutig sein. */
  function portraet(href, r, farbe, clipId, grau) {
    return `<defs><clipPath id="${clipId}"><circle r="${r}"/></clipPath></defs><circle r="${r + 3}" fill="${farbe}"/><image href="${href}" x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"${grau ? ' style="filter:grayscale(1) brightness(.6)"' : ""}/>`;
  }
  /** Kleines Porträt als HTML (Lobby, Handy) */
  const marke = (fid, px = 40) => { const d = F().FIGUREN[fid], k = F().KLASSEN[d.klasse]; return `<img class="marke" src="${F().bild(fid)}" width="${px}" height="${px}" alt="" style="border-color:${k.farbe}">`; };
  window.ABB = { kaefer, gegner, portraet, marke };
})();
