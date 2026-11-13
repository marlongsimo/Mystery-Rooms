/*
 * Mythara – reguläre Enden aller Abenteuer (für die Heldensammlung, js/sammlung.js)
 * NICHT VON HAND ÄNDERN: wird aus daten/*.js erzeugt mit  node abenteuer/tools/kampagne.js enden
 * Muss zu public.rpg_adventure_endings in der Datenbank passen (dieselbe Ausgabe liefert die SQL-Zeilen).
 */
(function (root) {
  "use strict";
  root.ABENDEN = {
    "rabenmoor": {
      "titel": "Das Moor der stummen Lichter",
      "ehrentitel": "Kenner des Schwarzmoors",
      "enden": {
        "ende_erloest": "Der Name im Wasser",
        "ende_besiegt": "Stille über dem Moor"
      }
    },
    "grauwacht": {
      "titel": "Das Siegel von Grauwacht",
      "ehrentitel": "Hüter von Grauwacht",
      "enden": {
        "ende_waechter": "Der letzte Winter",
        "ende_kobold": "Der Hüter mit den vielen Zähnen",
        "ende_opfer": "Der neue Hüter",
        "ende_bruch": "Der Einsturz",
        "ende_verrat": "Der Hüter wider Willen"
      }
    },
    "hochwacht": {
      "titel": "Die letzte Fackel von Hochwacht",
      "ehrentitel": "Fackelträger des Nordens",
      "enden": {
        "ende_fackel": "Die Fackel bewahrt",
        "ende_funke": "Der Funke im Gepäck",
        "ende_dunkel": "Die Nordwarte verstummt"
      }
    },
    "krone": {
      "titel": "Die Krone unter dem Eis",
      "ehrentitel": "Bezwinger der Eiskrone",
      "enden": {
        "ende_stabil": "Das Herz schlägt ruhig",
        "ende_versiegelt": "Die Stadt schläft",
        "ende_umgeleitet": "Ein Siegel entlastet, ein anderes bebt"
      }
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
