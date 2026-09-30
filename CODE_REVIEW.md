# Code-Review: BrowserCraft (gemini_sandbox)

Datum: 2026-09-29
Umfang: Alle Skript-Module (Statische Analyse, nicht das Spiel ausgeführt).
Alle Befunde wurden gegen die Quelldateien verifiziert. Nichts wurde am Repo geändert.

## Befund-Hierarchie

| # | Schwere | Datei | Zeile | Problem |
|---|---------|-------|-------|---------|
| 1 | 🔴 Kritisch | renderEngine.js | 292 / 417 | **`getFaceAO`-Aufruf übergibt zu wenig Argumente** → Ambient Occlusion komplett deaktiviert. Signatur: `getFaceAO(lx, y, lz, gx, gy, gz, faceIdx)` (7 Parameter). Aufruf: `getFaceAO(x, y, z, gx, gz, f)` (nur 6 Werte) → `faceIdx` wird `undefined`, Schalter greift nie → alle 4 Ecken liefern `undefined`, kein AO-Shading. |
| 2 | 🔴 Kritisch | renderEngine.js | 1443 / 1450 / 1477 | **Geteiltes `particleGeo` wird beim ersten Partikeltod disposed.** `particleGeo` ist eine einzige modulweite `BoxGeometry`, die von ALLEN Partikeln referenziert wird. `p.mesh.geometry.dispose()` (1477) gibt die gemeinsame Geometrie frei → alle noch lebenden + künftigen Partikel sind danach defekt (Use-after-dispose auf geteiltem Objekt). |
| 3 | 🟠 Hoch | settings.js | 204–206 | **Gespeicherte Sichtweite < 32 Chunks wird beim Laden auf 128 zurückgesetzt.** `this.renderDistance = parsedVal < 32 ? 128 : …`. Der Slider (index.html) erlaubt Werte ab 4 und die UI bietet eine „12 CHUNKS“-Taste → stellt man 12 ein und lädt neu, stehen wieder 128 da. Die Bedingung müsste lauten `parsedVal < 4` (nur ungültige Werte zurücksetzen). |
| 4 | 🟠 Hoch | renderEngine.js | 690 / 693 | **LoD-Kanten: Spurious 1-Block-Skirt an jeder Chunk-Grenze.** Für Off-Chunk-Nachbarn wird `nh = y` gesetzt; `topLevel` ist `y+1` (Z. 657). `topLevel > nh` ist damit immer wahr → auf ebenem Gelände wird entlang jeder 16er-Kante ein 1-Block-Wand-Streifen erzeugt → sichtbare Chunk-Nähte im Horizont-LoD. |
| 5 | 🟠 Hoch | inventory.js | 228–229 | **Sandstein-Rezept 4 Sand → 4 Sandstein (4× Überproduktion).** In Minecraft: 4 Sand → 1 Sandstein. `reduceCraftingIngredients()` entnimmt pro belegtem Feld je 1 → Verhältnis ist 1:1-Inflation statt 4:1. |
| 6 | 🟠 Hoch | inventory.js | 252–253 | **Ziegel-Rezept prüft `BLOCKS.DIRT` statt Ton/Sand.** Kommentar (Z. 250) sagt „4 Clay/Sand -> 4 Bricks“, Code prüft aber `DIRT`. Erde erzeugt keine Ziegel → falsches Eingangsmaterial. |
| 7 | 🟡 Mittel | ui/modals.js vs. settings.js | modals 245/247 vs. settings 145–146, 179–180 | **Namens-Disconnect für eigene Farben:** `setCustomColor()` schreibt `GameSettings.customAccent`/`customGlow`, aber `settings.js` definiert/persistiert/speichert/lädt `customAccentColor`/`customGlowColor`. Folge: Eigene Farben werden live angewandt, aber **nie gespeichert** – beim Neuladen gehen sie verloren. |
| 8 | 🟡 Mittel | interaction.js / audio.js | 147 / audio-Switch | **Mining-Sound stumm:** Jeder Minen-Hit ruft `playSound('stone')`, aber `audio.js` hat **keinen `'stone'`-Fall** (und auch keinen `'drop'`). `playSound` erzeugt Oszillator+Gain, matched aber nichts → kein Ton, leichte Knoten-Leckage pro Aufruf. |
| 9 | 🟡 Mittel | audio.js | 84 | **Gezwitscher-Check liest `window.currentEnvStatus`, das nirgends gesetzt wird** → `isNight` ist immer falsch, die Nachtgrillen spielen nie. |
| 10 | 🟡 Mittel | inventory.js | 23, 232 | **`BLOCKS.COBBLESTONE` existiert nicht** (nur `MOSSY_COBBLESTONE`). `BLOCKS.COBBLESTONE || BLOCKS.STONE` fällt daher auf `STONE` zurück → die „Cobblestone“-Rechnung (Moosiger Bruchstein) benutzt heimlich Stein als Zutat und Start-Slot 6 ist Stein statt Bruchstein. Inkonsistent mit `textures.js`, das `TILES.COBBLESTONE` kennt. |
| 11 | 🟡 Mittel | settings.js | 126–131 | **`speed`, `jumpHeight`, `gravity` werden gespeichert/geladen, aber von `physics.js` nie benutzt.** physics.js nutzt hartkodierte Konstanten (4.3/8.5/26). Die Einstell-Parameter sind tote Daten. |
| 12 | 🟡 Mittel | audio.js | 3 | **AudioContext wird zur Modul-Import-Zeit instanziiert, ohne Guard.** Ist `window.AudioContext`/`webkitAudioContext` nicht vorhanden, wirft `new (undefined)()` beim Laden des Moduls einen TypeError → bricht jeden Import von `playSound` (audio.js ist Abhängigkeit von interaction/inventory). |
| 13 | 🟢 Tief | renderEngine.js | 859–863 u. a. | **Degenerierte UV an Macro/Mega-Kanten:** Die 4 Ecken jedes Seiten-Skirts bekommen denselben `(u0,v0)` statt die oberen Ecken mit `v1` → Kantentextur wird auf einen einzelnen Rand-Texel gestaucht. |
| 14 | 🟢 Tief | renderEngine.js | 1447 | **`particleMat` wird pro `spawnMiningParticles` neu erzeugt und nie disposed** → Material-Leck bei häufigen Mining-Events. |
| 15 | 🟢 Tief | ui/modals.js | 370–373 | `syncSettingsDisplay()` referenziert `cfg-underwater-color` / `cfg-underwater-color-lbl`, die in index.html nicht existieren → Einstellung wird nicht angezeigt/gewartet (stiller No-Op). |
| 16 | 🟢 Tief | droppedItems.js | 235–249 | `showPickupToast()` sucht `#pickup-toast`, das in index.html nicht existiert → Aufhebe-Toast erscheint nie. |
| 17 | 🟢 Tief | physics.js | 184–188 | Fall-ins-Nichts-Respawn ist auf **hartkodiert `(8,45,8)`** gesetzt statt auf den sicheren Spawn-Punkt des aktuellen Slots/Seeds. |
| 18 | 🟢 Tief | saveManager.js | 90 | `localStorage.setItem` ungeschützt → bei vollem Speicher/deaktiviertem Storage schlägt der Save fehl und der aktuelle Weltstand kann still verloren gehen. |
| 19 | 🟢 Tief | saveManager.js | 86 / 115 | **`playerRot` verliert die z-Komponente** beim Speichern (`{ x, y }`), während `playerPos` korrekt x/y/z speichert → asymmetrisch, Rotationszustand teilweise weg. |
| 20 | 🟢 Tief | saveManager.js | 162–175 | **Legacy-Save wird nie bereinigt, wenn Slot_1 bereits existiert**: Migration+Entfernen nur bei `!slot1` → veralteter `web_minecraft_save_v2`-Blob bleibt dauerhaft als stale Key liegen. |

## Korrigierter False Positive
- **renderEngine.js Z. 600–602 (`chunkGroup.userData` ohne Initialisierung):** ⛔ **KEIN Bug.** Three.js (hier v0.184.0) initialisiert `Object3D.userData` bereits im Konstruktor als `{}` → die Zuweisung `chunkGroup.userData.isLod = true` ist sicher. Der Sub-Agent hatte dies als „Crashrisiko“ gemeldet, hängt aber von der Three.js-Vorgabe ab, die tatsächlich erfüllt ist.

## Hinweise (keine Bugs)
- `saveManager.js`: Die `Map`↔`Object`-Serialisierung ist korrekt implementiert (kein Fehler).
- `droppedItems.js` Zeile 56–63: `itemTex` wird im Promise-Callback vor seiner `const`-Deklaration referenziert, funktioniert aber dank asynchronem Timing — nicht schön, aber kein Laufzeitfehler.
- Es gibt im Repo eine doppelte Ordner-Verschachtelung (`gemini_sandbox/gemini_sandbox/…`) und Texturen liegen doppelt unter `public/textures/` und dem Skript-Ordner.

## Empfohlene Priorität
1. **Bug 1 & 2** (AO + geteiltes `particleGeo`) — größte sichtbare/kritische Auswirkung auf Grafik & Partikel.
2. **Bug 3** (Sichtweite) — klarer Logikfehler, der Nutzereinstellungen zerstört.
3. **Bug 4** (LoD-Kanten-Skirt) & **Bug 5/6** (Sandstein-/Ziegel-Rezept) — sichtbare Fehler im LoD-Horizont und im Crafting.
4. **Bug 7** (Farb-Persistenz) — Property-Namen angleichen.
5. Die übrigen (8–20) sind kleiner/Behebbar; alle Defekte sind oben mit Zeilennummer belegt.

Hinweis: `settings.js` Zeile 204 `parsedVal < 32 ? 128` kappt auch gültige niedrige Werte (12, 24) — die Grenze müsste `< 4` sein.

## ✅ Bereits behoben (2026-09-29)
| Bug | Datei | Fix |
|-----|-------|-----|
| 1 (AO) | renderEngine.js:417 | `getFaceAO(x, y, z, gx, gz, f)` → `getFaceAO(x, y, z, gx, y, gz, f)` |
| 2 + 14 (Partikel) | renderEngine.js:1447/1477 | Material jetzt pro Partikel; geteiltes `particleGeo` wird nicht mehr disposed, stattdessen `material.dispose()` |
| 3 (Sichtweite) | settings.js:206 | Grenze von `< 32` auf `(isNaN || < 4)` korrigiert — gültige niedrige Werte bleiben erhalten |
| 4 (LoD-Skirt) | renderEngine.js:690 | Off-Chunk-Nachbar-Höhe jetzt über `getSurfacePoint()` statt `nh = y` → kein Spurious-1-Block-Kantenstreifen auf ebenem Gelände |
| 6 (Ziegel) | inventory.js:252 | Eingang von `DIRT` auf `SAND` korrigiert (passend zum Kommentar „4 Sand → 4 Bricks“) |
| 7 (Farben) | ui/modals.js | Set/Get auf `customAccentColor`/`customGlowColor` vereinheitlicht → Farben werden jetzt gespeichert |
| 8 (Mining-Sound) | audio.js | `'stone'`-Fall in `playSound()` ergänzt → Mining-Hits hörbar |

Verifiziert (2. Durchgang): `npm run build` (✓ 24 Module), `npx tsc --noEmit` (✓ Exit 0), Dev-Server rendert Welt + LoD-Horizont ohne JS-Fehler.

