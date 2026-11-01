# Erzeugt die 84 Buchungen für archon/js/data.js (deterministisch) und prüft die Festlegungen.
import json, datetime as dt
D = lambda s: dt.datetime.strptime(s, "%d.%m.%Y %H:%M")
tx = []
def add(date, time, amt, frm, to, ref, purpose, group, cur="EUR"):
    tx.append(dict(d=D(f"{date}.2026 {time}"), amount=round(amt, 2), cur=cur, frm=frm, to=to, ref=ref, purpose=purpose, group=group))
# 9 strukturierte Zahlungen NORD -> MERC (+ je zwei Weiterleitungen)
struct = [("03.10","07:00",48200,("13.10","10:41"),("15.10","14:05")),
          ("06.10","09:12",48700,("07.10","11:30"),("09.10","10:02")),
          ("08.10","09:20",47900,("09.10","15:44"),("13.10","09:15")),
          ("12.10","09:05",48900,("13.10","16:20"),("15.10","16:48")),
          ("14.10","09:18",48500,("15.10","11:02"),("19.10","10:30")),
          ("16.10","09:09",48100,("19.10","14:12"),("21.10","10:44")),
          ("20.10","09:14",48800,("21.10","15:30"),("23.10","11:20")),
          ("22.10","09:11",47950,("23.10","16:05"),("27.10","09:50")),
          ("26.10","09:16",48350,("27.10","14:40"),("29.10","10:10"))]
lux_in = []
for d,t,a,(d1,t1),(d2,t2) in struct:
    add(d,t,a,"NORD-01","MERC-04","","Warenvorschuss","struct")
    a1 = a*0.985; add(d1,t1,a1,"MERC-04","ARGO-07","","Fracht","forward")
    a2 = a1*0.985; add(d2,t2,a2,"ARGO-07","LUX-02","","Fracht","forward"); lux_in.append((D(d2+".2026 "+t2), round(a2,2)))
# 3 Ausschüttungen LUX -> CORV (Sammelbeträge der bis dahin eingegangenen Weiterleitungen)
for d,t in [("14.10","15:30"),("22.10","15:45"),("30.10","15:20")]:
    cut = D(d+".2026 "+t); prev = [x for x in tx if x["group"]=="dividend"]
    since = prev[-1]["d"] if prev else D("01.01.2026 00:00")
    s = sum(a for (when,a) in lux_in if since < when < cut)
    add(d,t,round(s,2),"LUX-02","CORV-08","","Dividende Q4 (Abschlag)","dividend")
# 4 echte Handelsbuchungen LUX -> ARGO (mit Rechnung und Frachtpapier)
for d,t,a,r in [("02.09","10:15",9800,"AR-2026-071"),("27.10","15:10",15200,"AR-2026-125"),("19.10","13:25",12400,"AR-2026-118"),("28.10","10:55",11050,"AR-2026-131")]:
    add(d,t,a,"LUX-02","ARGO-07",r,"Seefracht Hamburg–Limassol lt. Konnossement","trade")
# 6 Honorare HALD
for d,t,frm,r in [("01.09","08:30","SARN-06","HC-2026-0901"),("01.09","08:32","CORV-08","HC-2026-0902"),("01.09","08:35","NORD-01","HC-2026-0903"),
                  ("20.10","08:30","SARN-06","HC-2026-1001"),("20.10","08:31","CORV-08","HC-2026-1002"),("20.10","08:34","NORD-01","HC-2026-1003")]:
    add(d,t,8500,frm,"HALD-05",r,"Treuhand- und Verwaltungshonorar","fee")
# 5 große, belegte Buchungen CORV -> Dritte
for d,t,a,to,r in [("10.09","11:00",312000,"EXT Alpenwerk Logistik AG","AW-55102"),("23.10","10:20",258500,"EXT Hanse Kontor Bau GmbH","HK-2026-77"),
                   ("16.10","11:10",276000,"EXT Brandt & Söhne Werft KG","BS-4410"),("21.10","10:05",404000,"EXT Alpenwerk Logistik AG","AW-55388"),("29.10","11:30",265750,"EXT Nordlicht Immobilien GmbH","NL-118")]:
    add(d,t,a,"CORV-08",to,r,"Projektzahlung lt. Vertrag","legal")
# 39 Alltagsbuchungen
daily = [
 ("01.09","07:05",4200,"NORD-01","EXT Speicherhaus Verwaltung KG","Miete September"),
 ("01.09","07:10",1890,"NORD-01","EXT Flotten-Leasing Nord","Leasing Fahrzeuge"),
 ("15.09","07:30",612.40,"NORD-01","EXT Hansewerk Energie","Strom Abschlag"),
 ("15.09","09:00",3150,"MERC-04","EXT Valletta Port Services","Liegegebühren"),
 ("19.10","12:00",780,"ARGO-07","EXT Limassol Marine Supply","Bordbedarf"),
 ("25.09","16:00",11430,"NORD-01","EXT Gehaltsläufe Nordkap","Gehälter September"),
 ("28.09","09:20",2350,"LUX-02","EXT Fiduciaire Moselle","Buchhaltung September"),
 ("30.09","07:00",1240,"SARN-06","EXT Guernsey Registry Services","Jahresgebühr"),
 ("01.10","07:05",4200,"NORD-01","EXT Speicherhaus Verwaltung KG","Miete Oktober"),
 ("01.10","07:10",1890,"NORD-01","EXT Flotten-Leasing Nord","Leasing Fahrzeuge"),
 ("05.10","08:40",355.90,"NORD-01","EXT Telekom Hansa","Telefon und Internet"),
 ("06.10","14:30",920,"ARGO-07","EXT Limassol Marine Supply","Bordbedarf"),
 ("07.10","13:00",1460,"MERC-04","EXT Malta Customs Brokers","Zollabfertigung"),
 ("16.10","13:10",2980,"CORV-08","EXT Zuger Treuhand Revision","Revisionshonorar"),
 ("14.10","16:00",64.20,"NORD-01","EXT Bürobedarf Hansen","Büromaterial"),
 ("19.10","09:00",1185,"LUX-02","EXT Luxembourg Office Center","Büromiete"),
 ("13.10","12:00",3150,"MERC-04","EXT Valletta Port Services","Liegegebühren"),
 ("14.10","08:20",410,"HALD-05","EXT Kanzlei Bergmann","Notarkosten"),
 ("15.10","07:30",612.40,"NORD-01","EXT Hansewerk Energie","Strom Abschlag"),
 ("15.10","13:15",2200,"ARGO-07","EXT Cyprus Crew Management","Heuer Oktober (1. Hälfte)"),
 ("16.10","15:00",745,"SARN-06","EXT Guernsey Registry Services","Änderungsmeldung Direktor"),
 ("19.10","08:05",530,"NORD-01","EXT Spedition Kühl","Lagerkosten"),
 ("20.10","10:40",1890,"CORV-08","EXT Zug Business Center","Büroservice"),
 ("21.10","09:30",128.50,"NORD-01","EXT Bürobedarf Hansen","Büromaterial"),
 ("22.10","12:20",960,"ARGO-07","EXT Limassol Marine Supply","Bordbedarf"),
 ("23.10","08:45",2350,"LUX-02","EXT Fiduciaire Moselle","Buchhaltung Oktober"),
 ("23.10","14:10",1460,"MERC-04","EXT Malta Customs Brokers","Zollabfertigung"),
 ("26.10","07:50",3300,"HALD-05","EXT Speicherhaus Verwaltung KG","Miete Büro Halden"),
 ("26.10","13:00",215,"NORD-01","EXT Hafenkantine Elbe","Bewirtung"),
 ("27.10","08:10",2200,"ARGO-07","EXT Cyprus Crew Management","Heuer Oktober (2. Hälfte)"),
 ("27.10","12:30",88.40,"HALD-05","EXT Telekom Hansa","Telefon"),
 ("28.10","09:00",1240,"CORV-08","EXT Zuger Treuhand Revision","Steuerberatung"),
 ("28.10","15:30",475,"NORD-01","EXT Spedition Kühl","Lagerkosten"),
 ("29.10","07:40",3150,"MERC-04","EXT Valletta Port Services","Liegegebühren"),
 ("29.10","13:45",690,"SARN-06","EXT Channel Islands Couriers","Kurierdienst"),
 ("30.10","07:20",398,"LUX-02","EXT Telekom Lux","Telefon und Internet"),
 ("30.10","09:30",1110,"ARGO-07","EXT Limassol Port Authority","Hafengebühr"),
 ("30.10","12:10",156.70,"HALD-05","EXT Bürobedarf Hansen","Büromaterial"),
 ("30.10","16:30",11430,"NORD-01","EXT Gehaltsläufe Nordkap","Gehälter Oktober"),
]
for d,t,a,f,to,p in daily: add(d,t,a,f,to,"",p,"daily")
tx.sort(key=lambda x: x["d"])
for i,x in enumerate(tx): x["id"] = f"TX-{1001+i}"
by = {x["id"]: x for x in tx}
from collections import Counter
print(len(tx), Counter(x["group"] for x in tx))
for k in ["TX-1015","TX-1017","TX-1019","TX-1022","TX-1031","TX-1046","TX-1084"]:
    x = by[k]; print(k, x["d"].strftime("%d.%m %H:%M"), x["frm"], x["to"], x["amount"], x["group"])
json.dump([dict(id=x["id"], date=x["d"].strftime("%d.%m.%Y"), time=x["d"].strftime("%H:%M"), amount=x["amount"], cur=x["cur"], from_=x["frm"], to=x["to"], ref=x["ref"], purpose=x["purpose"], g=x["group"]) for x in tx], open("ledger.json","w"), ensure_ascii=False)
