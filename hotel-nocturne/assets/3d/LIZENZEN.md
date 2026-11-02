# 3D-Assets – Herkunft und Lizenzen

| Datei | Original | Urheber | Lizenz | Quelle |
|---|---|---|---|---|
| `env/lobby-512.exr` | HDRI „lobby“ (512 px) | Poly Haven | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | Poly Haven, über [@pmndrs/assets](https://github.com/pmndrs/assets) 1.7.0 (CC0) |

Alles andere (Tapeten, Holz, Marmor, Teppiche, Möbel aus Code, Normal- und Rauheitskarten) wird zur Laufzeit aus Code erzeugt und gehört zum Projekt.

## Fremde Modelle

Die zeitweise eingebauten Khronos-Beispielmodelle (Sofa, zwei Lampen, CC BY 4.0) wurden wieder entfernt – die selbst gebauten Möbel passten optisch besser. Der GLB-Lader in `gfx.js` bleibt erhalten.

### Warum keine Modelle von Poly Haven oder Quaternius?

Beide Seiten sind aus der Entwicklungsumgebung nicht erreichbar (Netzwerksperre). Erreichbar waren nur die Khronos-Beispielmodelle (GitHub) und npm. Wer Poly-Haven- oder Quaternius-Modelle einbauen möchte (alle CC0): GLB herunterladen, in `models/` ablegen, hier eintragen – Aufbereitung siehe README-3D.
