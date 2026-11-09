#!/usr/bin/env python3
"""
Krimidinner-Engine: erzeugt <fall>/js/content.js aus den freigegebenen Texten (einzige Quelle) und fall.json.
  rollen/*.md       → Rollenblätter (Charakter, Kleidung, Vertraulich, je Runde ein Teil laut fall.json)
  BEWEISKARTEN.md   → Karten mit Runde
  GASTGEBERHEFT.md  → Teil A (offen) und Teil B (Lösung, verschleiert)
  ANLEITUNG.md      → Anleitung für alle, Regeln fürs Rollenblatt (fall.json → rulesSections)
Vorher prüft tools/check_case.py den Fall; bei einem Fehler wird nichts geschrieben.
Geheimes wird leicht verschleiert, damit es nicht im Klartext im Quelltext steht.
Aufruf:  python3 krimidinner/engine/build_case.py krimidinner/eichenfels
"""
import base64, glob, html, json, os, re, sys

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tools"))
import check_case  # noqa: E402
if check_case.main(ROOT):
    sys.exit("Abbruch: der Fall erfüllt die Norm nicht (siehe oben).")
FALL = json.load(open(os.path.join(ROOT, "fall.json"), encoding="utf-8"))
KEY_STR = "kd:" + FALL["id"] + ":veil"
KEY = KEY_STR.encode()


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", t)
    t = re.sub(r"~~(.+?)~~", r"<s>\1</s>", t)
    return t


def md(src):
    """Kleiner Markdown-Umsetzer für genau die Elemente, die in den Texten vorkommen."""
    lines = src.split("\n")
    out, i = [], 0
    def flush_par(buf):
        if buf:
            out.append("<p>" + "<br>".join(inline(x) for x in buf) + "</p>")
    par = []
    while i < len(lines):
        ln = lines[i]
        s = ln.strip()
        if s.startswith("```"):
            flush_par(par); par = []
            j = i + 1; buf = []
            while j < len(lines) and not lines[j].strip().startswith("```"):
                buf.append(lines[j]); j += 1
            out.append('<pre class="plan">' + html.escape("\n".join(buf)) + "</pre>")
            i = j + 1; continue
        if not s:
            flush_par(par); par = []; i += 1; continue
        m = re.match(r"^(#{1,4})\s+(.*)", s)
        if m:
            flush_par(par); par = []
            n = len(m.group(1)); out.append(f"<h{n}>{inline(m.group(2))}</h{n}>"); i += 1; continue
        if re.match(r"^-{3,}$", s):
            flush_par(par); par = []; out.append("<hr>"); i += 1; continue
        if s.startswith("|"):
            flush_par(par); par = []
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(lines[i].strip()); i += 1
            cells = [[c.strip() for c in r.strip("|").split("|")] for r in rows]
            head, body = cells[0], [r for r in cells[1:] if not all(re.match(r"^:?-+:?$", c) for c in r)]
            t = "<table><thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>"
            t += "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body)
            out.append(t + "</tbody></table>"); continue
        if s.startswith(">"):
            flush_par(par); par = []
            buf = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip()[1:].strip()); i += 1
            paras = "\n".join(buf).split("\n\n")
            out.append("<blockquote>" + "".join("<p>" + "<br>".join(inline(x) for x in p.split("\n") if x) + "</p>" for p in paras) + "</blockquote>"); continue
        if re.match(r"^(-|\d+\.)\s", s):
            flush_par(par); par = []
            ordered = bool(re.match(r"^\d+\.", s))
            items = []
            while i < len(lines) and (re.match(r"^\s*(-|\d+\.)\s", lines[i]) or (lines[i].startswith("   ") and lines[i].strip())):
                l2 = lines[i]
                if re.match(r"^\s*(-|\d+\.)\s", l2):
                    depth = len(l2) - len(l2.lstrip())
                    txt = re.sub(r"^\s*(-|\d+\.)\s", "", l2)
                    box = ""
                    if txt.startswith("[ ] "):
                        box, txt = '<span class="box"></span>', txt[4:]
                    items.append([depth, box + inline(txt)])
                else:
                    items[-1][1] += " " + inline(l2.strip())
                i += 1
            tag = "ol" if ordered else "ul"
            h = f"<{tag}>"; cur = items[0][0] if items else 0; open_sub = False
            for d, t in items:
                if d > cur and not open_sub:
                    h = h[:-5] + "<ul>"; open_sub = True
                elif d <= cur and open_sub:
                    h += "</ul></li>"; open_sub = False
                h += f"<li>{t}</li>"
            if open_sub: h += "</ul></li>"
            out.append(h + f"</{tag}>"); continue
        par.append(s); i += 1
    flush_par(par)
    return "\n".join(out)


def veil(text):
    b = text.encode("utf-8")
    return base64.b64encode(bytes(c ^ KEY[i % len(KEY)] for i, c in enumerate(b))).decode()


def read(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


def split_on(src, pattern):
    """Teilt an Überschriften; liefert [(titelzeile, inhalt)]."""
    parts = re.split(pattern, src, flags=re.M)
    return parts


# ---------- Rollenblätter ----------
PARTS = ["Charakter", "Kleidung", "Vertraulich"] + [r["rolePart"] for r in FALL["rounds"] if r.get("rolePart")]
part_re = "|".join(re.escape(p) for p in PARTS)
roles = {}
for r in FALL["roles"]:
    rid = r["id"]
    src = read(r["file"])
    lines = src.split("\n")
    title = re.sub(r"^#\s*Rollenblatt\s+R\d\d\s*·\s*", "", lines[0]).strip()
    body = "\n".join(l for l in lines[1:] if not l.startswith("*Schreibweise"))
    pages = {}
    for chunk in re.split(r"(?=^## (?:" + part_re + r") · )", body, flags=re.M):
        m = re.match(r"^## (" + part_re + r") · (.*)", chunk)
        if not m: continue
        rest = chunk.split("\n", 1)[1] if "\n" in chunk else ""
        pages.setdefault(m.group(1), []).append(f"## {m.group(2)}\n{rest}")
    assert sorted(pages) == sorted(PARTS), (rid, sorted(pages))
    roles[rid] = {"title": title, "pages": [veil(md("\n".join(pages[k]).replace("\n---\n", "\n"))) for k in PARTS], "culprit": rid in FALL["culprits"]}

# ---------- Beweiskarten ----------
FINAL_NO = max(r["no"] for r in FALL["rounds"])
house_svg = read(FALL["house"]["svg"]) if FALL.get("house", {}).get("svg") else ""
cards, rnd = {}, None
src = read("BEWEISKARTEN.md")
for chunk in re.split(r"(?=^## |^### B\d)", src, flags=re.M):
    if chunk.startswith("## Runde"):
        rnd = int(re.match(r"## Runde (\d+)", chunk).group(1)); continue
    if chunk.startswith("## Finale"):
        rnd = FINAL_NO; continue
    if chunk.startswith("## "):
        rnd = None; continue
    m = re.match(r"^### (B\d+) · (\S+) (.*)", chunk)
    if not m: continue
    cid = m.group(1)
    assert rnd, f"{cid} liegt in keiner Runde"
    body = chunk.split("\n", 1)[1].strip()
    body = re.sub(r"\n---\s*$", "", body).strip()
    foot = re.findall(r"^\*Freigabe:.*\*$", body, flags=re.M)
    body = re.sub(r"^\*Freigabe:.*\*$", "", body, flags=re.M).strip()
    html_body = md(body)
    if FALL.get("cards", {}).get(cid, {}).get("print") == "sheet" and house_svg:  # Plan als Zeichnung statt Textplan
        html_body = re.sub(r'<pre class="plan">.*?</pre>', '<p class="plan-hint">↔ Plan zum Verschieben wischen</p><div class="plan-wrap">' + house_svg + '</div>', html_body, count=1, flags=re.S)
    cards[cid] = {"round": rnd, "icon": m.group(2), "title": m.group(3).strip(), "html": veil(html_body), "foot": foot[0].strip("*") if foot else ""}

# ---------- Gastgeberheft, Anleitung ----------
gh = read("GASTGEBERHEFT.md")
a_part, b_part = gh.split("# Teil B", 1)
a_part = a_part.split("# Teil A", 1)[1]
a_src = a_part.replace("\n---\n---\n", "\n")
host_a = md("# Teil A" + a_src)
# Abschnitte des Gastgeberhefts einzeln (für den geführten Ablauf)
sections = {}
for chunk in re.split(r"(?=^## )", a_src, flags=re.M):
    m = re.match(r"^## (.*)", chunk)
    if not m: continue
    key = m.group(1).split(" · ")[0].strip()  # „A1“ … „Phase 1“ … „Finale“
    sections[key] = {"title": m.group(1).strip(), "html": md(chunk.split("\n", 1)[1])}
# Wissen der Nebenfiguren (Tabelle | Rolle | Phase | Zum Vorlesen |) und Impulse („Wenn es stockt“) als Daten
npc = []
for row in re.findall(r"^\| (R\d\d) \| (\d) \| (.+) \|$", a_src, flags=re.M):
    npc.append({"role": row[0], "phase": int(row[1]), "html": veil(inline(row[2]))})
impulses = {}
for m in re.finditer(r"^- \*\*(Phase \d|Immer):\*\* (.+)$", a_src, flags=re.M):
    impulses[m.group(1)] = inline(m.group(2))
host_b = veil(md("# Teil B" + b_part))
guide_src = read("ANLEITUNG.md").split("\n", 1)[1]
guide = md(guide_src)
# Für das Rollenblatt nur, was am Abend gilt (fall.json → rulesSections)
RULE_PARTS = tuple(FALL.get("rulesSections", []))
rules = md("\n".join(c for c in re.split(r"(?=^## )", guide_src, flags=re.M) if c[3:].startswith(RULE_PARTS))) if RULE_PARTS else guide

emblem = read("assets/emblem.svg") if os.path.exists(os.path.join(ROOT, "assets", "emblem.svg")) else ""
fall_pub = {k: v for k, v in FALL.items() if k not in ("leakCheck",)}
data = {"fall": fall_pub, "key": KEY_STR, "plan": house_svg, "emblem": emblem, "roles": roles, "cards": cards, "hostA": host_a, "hostB": host_b, "guide": guide, "rules": rules, "sections": sections, "npc": npc, "impulses": impulses}
out = "/* Erzeugt von krimidinner/engine/build_case.py aus den .md-Dateien und fall.json – nicht von Hand bearbeiten. */\nwindow.KD_CONTENT = " + json.dumps(data, ensure_ascii=False) + ";\n"
os.makedirs(os.path.join(ROOT, "js"), exist_ok=True)
with open(os.path.join(ROOT, "js", "content.js"), "w", encoding="utf-8") as f:
    f.write(out)
print("ok", FALL["id"], len(roles), "Rollen,", len(cards), "Karten,", len(npc), "Aussagen,", len(out) // 1024, "KB")
