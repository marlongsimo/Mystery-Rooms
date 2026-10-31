/*
 * DER LETZTE FALL – Szenen-Grundgerüst und kleine Zeichenhelfer für alle Bereiche
 */
(() => {
  const N = window.MRGAME;

  /** Raumansicht 1200×900: Wand, Sockel, Boden, Vignette. pal: Farben je Bereich. */
  N.svgScene = (p, body, pal = {}) => {
    const c = { top: "#0b0d10", mid: "#1d2228", bot: "#121519", floorA: "#16130f", floorB: "#060505", base: "#2a2620", line: "#3a342a", wainscot: true, ...pal };
    return `
<svg viewBox="0 0 1200 900" class="scene-art" aria-hidden="true">
  <defs>
    <linearGradient id="${p}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.top}"/><stop offset=".55" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.bot}"/></linearGradient>
    <linearGradient id="${p}-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.floorA}"/><stop offset="1" stop-color="${c.floorB}"/></linearGradient>
    <linearGradient id="${p}-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2b1e"/><stop offset="1" stop-color="#171411"/></linearGradient>
    <linearGradient id="${p}-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a6d6a"/><stop offset=".5" stop-color="#3a3c3a"/><stop offset="1" stop-color="#555855"/></linearGradient>
    <linearGradient id="${p}-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4b885"/><stop offset=".5" stop-color="#806040"/><stop offset="1" stop-color="#b69a6d"/></linearGradient>
    <linearGradient id="${p}-velvet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a0d10"/><stop offset=".5" stop-color="#6b1a1e"/><stop offset="1" stop-color="#3a0d10"/></linearGradient>
    <radialGradient id="${p}-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e7c88a" stop-opacity=".42"/><stop offset="1" stop-color="#e7c88a" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-cold" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9fc4e0" stop-opacity=".3"/><stop offset="1" stop-color="#9fc4e0" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-vig" cx=".5" cy=".45" r=".75"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".82"/></radialGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#${p}-wall)"/>
  <rect width="1200" height="40" fill="#08090b"/><rect y="40" width="1200" height="4" fill="${c.line}"/>
  ${c.wainscot ? `<rect y="640" width="1200" height="120" fill="${c.base}"/><rect y="636" width="1200" height="5" fill="${c.line}"/>` : ""}
  <rect y="760" width="1200" height="140" fill="url(#${p}-floor)"/>
  <g stroke="#221d17" stroke-width="2" opacity=".7"><line x1="0" y1="800" x2="1200" y2="800"/><line x1="0" y1="850" x2="1200" y2="850"/><line x1="160" y1="760" x2="40" y2="900"/><line x1="440" y1="760" x2="400" y2="900"/><line x1="760" y1="760" x2="800" y2="900"/><line x1="1040" y1="760" x2="1160" y2="900"/></g>
  ${body}
  <rect width="1200" height="900" fill="url(#${p}-vig)"/>
</svg>`;
  };

  /* ---------- Helfer ---------- */
  const T = (x, y, t, o = {}) => `<text x="${x}" y="${y}" ${o.anchor === false ? "" : 'text-anchor="middle"'} fill="${o.fill || "#2a2119"}" font-family="${o.serif ? "Playfair Display, serif" : o.hand ? "Georgia, serif" : "DM Mono, monospace"}" font-size="${o.size || 12}"${o.italic || o.hand ? ' font-style="italic"' : ""}${o.ls ? ` letter-spacing="${o.ls}"` : ""}${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ""}>${t}</text>`;
  /** Blatt Papier mit angedeuteten Zeilen */
  const sheet = (x, y, w, h, o = {}) => `<g${o.rot ? ` transform="rotate(${o.rot} ${x + w / 2} ${y + h / 2})"` : ""}><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.fill || "#e6dcc3"}"/>${o.head ? `<rect x="${x}" y="${y}" width="${w}" height="${Math.min(16, h / 5)}" fill="${o.head}"/>` : ""}<g stroke="#6c5a44" stroke-width="1.2" opacity=".75">${Array.from({ length: Math.max(0, Math.floor((h - 26) / 12)) }, (_, i) => `<line x1="${x + 8}" y1="${y + 24 + i * 12}" x2="${x + w - 8 - ((i * 37) % 30)}" y2="${y + 24 + i * 12}"/>`).join("")}</g>${o.label ? T(x + w / 2, y + h + 16, o.label, { fill: o.labelFill || "#8a8f88", size: 11 }) : ""}</g>`;
  /** Absperrband quer */
  const tape = (x1, y1, x2, y2) => `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e8c84a" stroke-width="14"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#141414" stroke-width="14" stroke-dasharray="22 22" opacity=".85"/></g>`;
  /** Tür mit Rahmen; label oben */
  const door = (x, y, w, h, o = {}) => `<g><rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${h + 10}" fill="${o.frame || "#16130f"}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.fill || "#3a2c22"}" stroke="${o.stroke || "#1a130d"}" stroke-width="3"/>${o.window ? `<rect x="${x + w * 0.25}" y="${y + 30}" width="${w * 0.5}" height="${h * 0.28}" fill="${o.window}"/>` : ""}<rect x="${x + w - 26}" y="${y + h * 0.52}" width="12" height="34" rx="3" fill="${o.handle || "#b69a6d"}"/>${o.sign ? `<rect x="${x + w / 2 - Math.max(70, o.sign.length * 5.2 + 14)}" y="${y - 52}" width="${Math.max(140, o.sign.length * 10.4 + 28)}" height="30" fill="${o.signFill || "#e6dcc3"}"/>${T(x + w / 2, y - 32, o.sign, { fill: o.signText || "#2a2119", size: 12, ls: 2 })}` : ""}</g>`;
  /** Lampe mit Lichtkegel (Lichtschein über glow) */
  const lamp = (p, x, y, r = 160) => `<ellipse cx="${x}" cy="${y + r * 0.6}" rx="${r}" ry="${r * 0.9}" fill="url(#${p}-glow)" class="flicker"/><path d="M${x - 30} ${y} L${x + 30} ${y} L${x + 18} ${y - 26} L${x - 18} ${y - 26} Z" fill="#2a2b28"/><line x1="${x}" y1="${y - 26}" x2="${x}" y2="40" stroke="#2a2b28" stroke-width="3"/>`;
  N.draw = { T, sheet, tape, door, lamp };
})();
