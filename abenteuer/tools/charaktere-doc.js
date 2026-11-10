/*
 * Schreibt die Figuren-Abschnitte in CHARAKTERE.md aus js/figuren.js neu (zwischen den Markierungen
 * <!-- FIGUREN:START --> und <!-- FIGUREN:END -->), damit Dokument und Engine nie auseinanderlaufen.
 * Aufruf: node abenteuer/tools/charaktere-doc.js
 */
"use strict";
const fs = require("fs"), path = require("path");
const F = require("../js/figuren.js");
const DATEI = path.join(__dirname, "..", "CHARAKTERE.md");
const ATTR = ["STR", "GES", "KON", "INT", "WEI", "CHA"];
const mod = F.mod, vorz = (n) => (n >= 0 ? "+" + n : String(n));
const TYP = { aktion: "Aktion", bonus: "Bonusaktion", reaktion: "Reaktion", passiv: "passiv", frei: "frei" };

function info(a, d) {
  const t = [TYP[a.typ] || "Aktion"];
  if (a.reichweite) t.push(a.reichweite === 1 ? "Nahkampf" : `${a.reichweite} Felder`);
  if (a.radius || a.form === "kreis") t.push(`Radius ${a.radius || a.groesse}`);
  if (a.art === "angriff") t.push(`Angriff ${vorz(mod(d.werte[a.attr]) + 2)}${a.bogen && d === F.FIGUREN.wildnislaeufer ? " (Stufe 2+: " + vorz(mod(d.werte[a.attr]) + 3) + ")" : ""}`);
  if (a.rettung && a.attr) t.push(`${a.rettung}-Rettung SG ${8 + 2 + mod(d.werte[a.attr])}`);
  if (a.schaden) t.push(`${a.schaden}${a.anzahl ? " ×" + a.anzahl : ""}${a.art === "angriff" && !a.ohneMod ? " + " + mod(d.werte[a.attr]) : a.plusAttr ? " + " + mod(d.werte[a.attr]) : a.plus ? " + " + a.plus : ""}`);
  if (a.heilung) t.push(`heilt ${a.heilung}${a.plusStufe ? " + Stufe" : a.plusAttr ? " + " + a.plusAttr : ""}`);
  if (a.platz) t.push(a.platz === 2 ? "Platz vom 2. Grad" : "1 Zauberplatz");
  if (a.pro) { const v = a.pro.kampf != null ? a.pro.kampf : a.pro.rast != null ? a.pro.rast : a.pro.lange; t.push(`${Array.isArray(v) ? v.join("/") : v}× je ${a.pro.kampf != null ? "Kampf" : a.pro.rast != null ? "Rast" : "lange Rast"}`); }
  return t.join(" · ");
}

const KLASSEN_REIHE = ["krieger", "zauberer", "schurke", "kleriker", "waldlaeufer"];
let md = "";
KLASSEN_REIHE.forEach((kl, i) => {
  const K = F.KLASSEN[kl];
  md += `## ${i + 2} · ${K.name}\n\n`;
  for (const fid of F.REIHE.filter((f) => F.FIGUREN[f].klasse === kl)) {
    const d = F.FIGUREN[fid];
    md += `### ${d.name} – ${d.titel}\n„${d.spruch}“\n\n`;
    md += `**Rolle:** ${d.rolle} · **Werte:** ${ATTR.map((a) => `${a} ${d.werte[a]} (${vorz(mod(d.werte[a]))})`).join(" · ")}\n`;
    md += `**TP** ${[1, 2, 3].map((s) => F.tpVon(fid, s)).join(" / ")} · **RK** ${[...new Set(d.rk)].length === 1 ? d.rk[0] : d.rk.join(" / ")} (${d.ruestung})${K.plaetze ? ` · **Zauberplätze** ${[1, 2, 3].map((s) => F.PLAETZE[s][0] + (F.PLAETZE[s][1] ? "+" + F.PLAETZE[s][1] : "")).join(" / ")}` : ""}`;
    if (d.wolf) md += ` · **Wolf ${d.wolf.name}:** TP ${d.wolf.tp.join(" / ")}, RK ${d.wolf.rk}, Biss ${d.wolf.angriff.map(vorz).join("/")}, ${d.wolf.schaden} + ${d.wolf.plus}, ${d.wolf.bewegung} Felder`;
    md += "\n\n| Fähigkeit | Stufe | Werte | Wirkung |\n|---|---|---|---|\n";
    for (const a of F.faehigVon(fid, 3)) md += `| **${a.name}** | ${a.ab} | ${info(a, d)} | ${a.text || ""} |\n`;
    md += `| **${d.aussen.name}** | – | außerhalb des Kampfes | ${d.aussen.text} |\n\n`;
    md += `**Versuchung des Abts:** ${d.versuchung}\n\n**Moment in Grauwacht:** ${d.moment}\n\n`;
  }
});
const alt = fs.readFileSync(DATEI, "utf8");
const a = alt.indexOf("<!-- FIGUREN:START -->"), b = alt.indexOf("<!-- FIGUREN:END -->");
if (a < 0 || b < 0) throw new Error("Markierungen fehlen in CHARAKTERE.md");
fs.writeFileSync(DATEI, alt.slice(0, a) + "<!-- FIGUREN:START -->\n<!-- Dieser Teil wird von tools/charaktere-doc.js aus js/figuren.js erzeugt. Nicht von Hand ändern. -->\n\n" + md + alt.slice(b));
console.log("CHARAKTERE.md: 15 Figuren geschrieben.");
