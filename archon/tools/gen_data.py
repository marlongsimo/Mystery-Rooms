import json
ledger = json.load(open("ledger.json"))
for t in ledger: t["from"] = t.pop("from_"); t.pop("g")
out = "/* AUTOMATISCH ERZEUGT von tools/gen_ledger.py + gen_data.py – Buchungen nicht von Hand ändern. */\n"
out += "window.AR = window.AR || {};\nAR.ledger = " + json.dumps(ledger, ensure_ascii=False, indent=0).replace("\n", "") + ";\n"
open("../js/ledger.js", "w").write(out)
print("ok", len(ledger))
