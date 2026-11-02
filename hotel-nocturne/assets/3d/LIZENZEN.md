# 3D-Assets – Herkunft und Lizenzen

Alle Dateien wurden für das Web verkleinert: Texturen max. 512 px als WebP, Geometrie leicht vereinfacht (50 %, Fehlergrenze 0,1 %) und mit Meshopt komprimiert (glTF Transform 4.1.1). Inhaltlich sind sie unverändert.

| Datei | Original | Urheber | Lizenz | Quelle |
|---|---|---|---|---|
| `models/leather-sofa.glb` | SheenWoodLeatherSofa | © 2024 Darmstadt Graphics Group GmbH | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | [Khronos glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/SheenWoodLeatherSofa) |
| `models/tiffany-lamp.glb` | StainedGlassLamp | © 2021 Wayfair, LLC | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | [Khronos glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/StainedGlassLamp) |
| `models/nouveau-lamp.glb` | LightsPunctualLamp | © 2021 DGG (Darmstadt Graphics Group) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | [Khronos glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/LightsPunctualLamp) |
| `env/lobby-512.exr` | HDRI „lobby“ (512 px) | Poly Haven | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | Poly Haven, über [@pmndrs/assets](https://github.com/pmndrs/assets) 1.7.0 (CC0) |

**CC BY 4.0 verlangt eine Namensnennung.** Sie steht im Spiel auf der Startseite des 3D-Testmodus („Bildnachweise“) und hier.

Alles andere (Tapeten, Holz, Marmor, Teppiche, Möbel aus Code, Normal- und Rauheitskarten) wird zur Laufzeit aus Code erzeugt und gehört zum Projekt.

## Warum keine Modelle von Poly Haven oder Quaternius?

Beide Seiten sind aus der Entwicklungsumgebung nicht erreichbar (Netzwerksperre). Erreichbar waren nur die Khronos-Beispielmodelle (GitHub) und npm. Wer Poly-Haven- oder Quaternius-Modelle einbauen möchte (alle CC0): GLB herunterladen, in `models/` ablegen, hier eintragen – Aufbereitung siehe README-3D.
