#!/usr/bin/env python3
"""
Prüft einen Krimidinner-Fall gegen die Inhaltsnorm aus ENGINE.md, Abschnitt 6.
Vorstufe der Prüfungen, die später build_case.py übernimmt. Schreibt nichts.
Aufruf:  python3 krimidinner/tools/check_case.py krimidinner/silberkamm
"""
import json, os, re, sys

def main(folder):
    errs, notes = [], []
    fall = json.load(open(os.path.join(folder, "fall.json"), encoding="utf-8"))
    ids = [r["id"] for r in fall["roles"]]
    pmin, pmax = fall["players"]["min"], fall["players"]["max"]
    order = fall["cast"]["order"]

    # Besetzung
    if sorted(order) != sorted(ids):
        errs.append("cast.order enthält nicht genau alle Rollen")
    for c in fall["culprits"]:
        if c not in order[:pmin]:
            errs.append(f"Täterrolle {c} ist bei {pmin} Personen nicht besetzt")
    if pmax > len(ids):
        errs.append("players.max größer als Rollenzahl")

    # Rollenblätter
    parts_needed = ["Charakter", "Kleidung", "Vertraulich"] + [r["rolePart"] for r in fall["rounds"] if "rolePart" in r]
    var_ref = re.compile(r"\{(R\d\d):([^}]*)\}")
    for r in fall["roles"]:
        p = os.path.join(folder, r["file"])
        if not os.path.exists(p):
            errs.append(f"{r['id']}: Datei fehlt ({r['file']})"); continue
        t = open(p, encoding="utf-8").read()
        first = t.split("\n", 1)[0]
        if not first.startswith(f"# Rollenblatt {r['id']} · "):
            errs.append(f"{r['id']}: erste Zeile entspricht nicht der Norm")
        if ("TÄTERROLLE" in first) != (r["id"] in fall["culprits"]):
            errs.append(f"{r['id']}: TÄTERROLLE im Titel passt nicht zu culprits")
        heads = re.findall(r"^## (.+?) · ", t, re.M)
        for need in parts_needed:
            if need not in heads:
                errs.append(f"{r['id']}: Teil „{need}“ fehlt")
        for rid, body in var_ref.findall(t):
            if rid not in ids:
                errs.append(f"{r['id']}: unbekannte Rolle {rid} in Variante")
            if rid == r["id"]:
                errs.append(f"{r['id']}: eigene Rolle in {{…}} statt […]")
            if body.count("/") != 1 or not all(s.strip() for s in body.split("/")):
                errs.append(f"{r['id']}: Variante {{{rid}:{body}}} nicht zweiteilig")
        for m in re.findall(r"\[([^\]\n]*)\]", t):
            if "/" in m and (m.count("/") != 1 or not all(s.strip() for s in m.split("/"))):
                errs.append(f"{r['id']}: eigene Variante [{m}] nicht zweiteilig")
        # Lecks in sofort sichtbaren Teilen unschuldiger Rollen
        if r["id"] not in fall["culprits"]:
            pre = re.split(r"^## " + re.escape(fall["rounds"][0]["rolePart"]) + " · ", t, flags=re.M)[0]
            for w in fall.get("leakCheck", []):
                if w.lower() in pre.lower():
                    errs.append(f"{r['id']}: Leck „{w.strip()}“ vor {fall['rounds'][0]['rolePart']}")

    # Beweiskarten
    bk = open(os.path.join(folder, "BEWEISKARTEN.md"), encoding="utf-8").read()
    cards = re.findall(r"^### (B\d+) · ", bk, re.M)
    if len(cards) != len(set(cards)):
        errs.append("doppelte Kartennummern")
    for cid, spec in fall.get("cards", {}).items():
        if cid not in cards:
            errs.append(f"fall.json nennt {cid}, das in BEWEISKARTEN.md fehlt")
        for kind in ("present", "missing"):
            for rid in spec.get("when", {}).get(kind, []):
                if rid not in ids:
                    errs.append(f"{cid}: Bedingung mit unbekannter Rolle {rid}")
    for rid, body in var_ref.findall(bk):
        if rid not in ids:
            errs.append(f"Karten: unbekannte Rolle {rid}")

    # Kartenzahl je Besetzung
    for n in range(pmin, pmax + 1):
        cast = set(order[:n]); k = 0
        for c in cards:
            w = fall.get("cards", {}).get(c, {}).get("when", {})
            ok = all(x in cast for x in w.get("present", [])) and all(x not in cast for x in w.get("missing", []))
            k += ok
        notes.append(f"{n} Personen: {k} Karten")

    # Gastgeberheft
    gh = open(os.path.join(folder, "GASTGEBERHEFT.md"), encoding="utf-8").read()
    if "# Teil A" not in gh or "# Teil B" not in gh:
        errs.append("Gastgeberheft: Teil A oder B fehlt")
    keys = re.findall(r"^## (.+?) · ", gh, re.M)
    for s in fall["steps"]:
        for sec in s["sections"]:
            if sec not in keys:
                errs.append(f"Schritt {s['key']}: Abschnitt „{sec}“ fehlt im Gastgeberheft")
    npc = re.findall(r"^\| (R\d\d) \| (\d) \| ", gh, re.M)
    always = set(order[:pmin])
    for rid, ph in npc:
        if rid in always:
            errs.append(f"Aussagekarte für {rid}, das immer besetzt ist")
        if ph not in fall["npc"]["phaseToRound"]:
            errs.append(f"Aussagekarte {rid} Phase {ph} ohne Runde")
    for rid, body in var_ref.findall(gh):
        if rid not in ids:
            errs.append(f"Gastgeberheft: unbekannte Rolle {rid}")

    # Anleitung, Asset
    an = open(os.path.join(folder, "ANLEITUNG.md"), encoding="utf-8").read()
    for s in fall.get("rulesSections", []):
        if f"## {s}" not in an:
            errs.append(f"Anleitung: Abschnitt „{s}“ fehlt")
    for cid, spec in fall.get("cards", {}).items():
        if spec.get("svg") and not os.path.exists(os.path.join(folder, spec["svg"])):
            errs.append(f"{cid}: Zeichnung fehlt ({spec['svg']})")
    svg = fall.get("house", {}).get("svg")
    if svg and not os.path.exists(os.path.join(folder, svg)):
        errs.append(f"Asset fehlt: {svg}")

    for n in notes: print("·", n)
    for e in errs: print("FEHLER:", e)
    print("OK" if not errs else f"{len(errs)} Fehler")
    return 1 if errs else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "."))
