#!/usr/bin/env python3
"""
Erzeugt js/content.js aus den freigegebenen Texten (einzige Quelle):
  rollen/R01-…R10-*.md  → Rollenblätter, je vier Seiten
  BEWEISKARTEN.md       → Karten B1–B14 mit Runde
  GASTGEBERHEFT.md      → Teil A (offen) und Teil B (Lösung)
  ANLEITUNG.md          → Anleitung für alle
Geheimes (Rollenblätter, Karten, Teil B) wird leicht verschleiert, damit es nicht im Klartext im Quelltext steht.
Aufruf (im Ordner krimidinner/eichenfels):  python3 tools/build_content.py
"""
import base64, glob, html, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = b"Eichenfels-1901-Sternwarte"


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
roles = {}
for path in sorted(glob.glob(os.path.join(ROOT, "rollen", "R*.md"))):
    rid = os.path.basename(path)[:3]
    src = read(os.path.relpath(path, ROOT))
    lines = src.split("\n")
    title = re.sub(r"^#\s*Rollenblatt\s+R\d\d\s*·\s*", "", lines[0]).strip()
    body = "\n".join(l for l in lines[1:] if not l.startswith("*Schreibweise"))
    pages = {}
    for chunk in re.split(r"(?=^## Seite \d)", body, flags=re.M):
        m = re.match(r"^## Seite (\d) · (.*)", chunk)
        if not m: continue
        n = int(m.group(1))
        rest = chunk.split("\n", 1)[1] if "\n" in chunk else ""
        pages.setdefault(n, []).append(f"## {m.group(2)}\n{rest}")
    assert sorted(pages) == [1, 2, 3, 4], (rid, sorted(pages))
    roles[rid] = {"title": title, "pages": [veil(md("\n".join(pages[n]).replace("\n---\n", "\n"))) for n in (1, 2, 3, 4)], "culprit": "TÄTERROLLE" in lines[0]}

# ---------- Beweiskarten ----------
cards, rnd = {}, None
src = read("BEWEISKARTEN.md")
for chunk in re.split(r"(?=^## |^### B\d)", src, flags=re.M):
    if chunk.startswith("## Runde"):
        rnd = int(re.match(r"## Runde (\d)", chunk).group(1)); continue
    if chunk.startswith("## Finale"):
        rnd = 4; continue
    m = re.match(r"^### (B\d+) · (\S+) (.*)", chunk)
    if not m: continue
    cid = m.group(1)
    body = chunk.split("\n", 1)[1].strip()
    body = re.sub(r"\n---\s*$", "", body).strip()
    foot = re.findall(r"^\*Freigabe:.*\*$", body, flags=re.M)
    body = re.sub(r"^\*Freigabe:.*\*$", "", body, flags=re.M).strip()
    cards[cid] = {"round": rnd, "icon": m.group(2), "title": m.group(3).strip(), "html": veil(md(body)), "foot": foot[0].strip("*") if foot else ""}
assert len(cards) == 14, sorted(cards)

# ---------- Gastgeberheft, Anleitung ----------
gh = read("GASTGEBERHEFT.md")
a_part, b_part = gh.split("# Teil B", 1)
a_part = a_part.split("# Teil A", 1)[1]
host_a = md("# Teil A" + a_part.replace("\n---\n---\n", "\n"))
host_b = veil(md("# Teil B" + b_part))
guide = md(read("ANLEITUNG.md").split("\n", 1)[1])

data = {"roles": roles, "cards": cards, "hostA": host_a, "hostB": host_b, "guide": guide}
out = "/* Erzeugt von tools/build_content.py aus den .md-Dateien – nicht von Hand bearbeiten. */\nwindow.KD_CONTENT = " + json.dumps(data, ensure_ascii=False) + ";\n"
os.makedirs(os.path.join(ROOT, "js"), exist_ok=True)
with open(os.path.join(ROOT, "js", "content.js"), "w", encoding="utf-8") as f:
    f.write(out)
print("ok", len(roles), "Rollen,", len(cards), "Karten,", len(out) // 1024, "KB")
