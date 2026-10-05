# Code-Review: BrowserCraft (gemini_sandbox) — Durchgang 2

Datum: 2026-10-01
Umfang: Alle Skript-Module + `index.html` + `package.json`/`vite.config.ts`.
Methode: Statische Analyse **plus** Laufzeit-Verifikation (`npm run build`, `tsc --noEmit`,
Dev-Server + Browser-Boot, DOM-Probes zur Laufzeit).
**Nichts am Repo geändert.** Dieses Dokument ist eine neue, unversionierte Datei.

## Vorbemerkung zum vorherigen Review

`CODE_REVIEW.md` (2026-09-29) listete 20 Befunde, davon 8 als „behoben" markiert.
Ich habe **alle 8 Fixes gegen die Quelldateien nachgeprüft**:

| Alter Befund | Status heute |
|---|---|
| 1 AO (`getFaceAO`) | ✅ behoben — Aufruf hat jetzt 7 Args (renderEngine.js:425) |
| 2 + 14 Partikel-Disposal | ✅ behoben — Material pro Partikel, `particleGeo` bleibt Singleton (1454–1491) |
| 3 Sichtweite `< 32` | ✅ behoben — Grenze jetzt `isNaN \|\| < 4` (settings.js:206) |
| 4 LoD-Kanten-Skirt | ✅ behoben — `getSurfacePoint()` statt `nh = y` (700–701) |
| 6 Ziegel-Eingang | ⚠️ **REGRESSION** — siehe Befund 4 |
| 7 Farb-Persistenz | ✅ behoben — `customAccentColor`/`customGlowColor` (modals.js:245–247) |
| 8 Mining-Sound | ✅ behoben — `'stone'`-Fall existiert (audio.js:264) |
| 9 `currentEnvStatus` | ✅ behoben — `getWorldTime()` aus dayNight.js (audio.js:92) |
| 13 Skirt-UVs | ✅ behoben — obere Ecken nutzen `sv1` (739–740) |
| 18 ungeschütztes `setItem` | ✅ behoben — try/catch (saveManager.js:91–96) |
| 19 `playerRot` ohne z | ✅ behoben — `z: playerRot.z ?? 0` (saveManager.js:87) |
| 20 Legacy-Save bleibt liegen | ✅ behoben — Cleanup auch bei vorhandenem slot_1 (172–175) |

**Nicht behoben / neu:** Sandstein-Ratio (5) und Bruchstein-`BLOCKS.COBBLESTONE` (10) wurden
nicht angefasst. Zusätzlich sind 9 weitere, bisher **nicht dokumentierte** Defekte aufgetaucht —
darunter 3 kritische.

## Befund-Hierarchie

| # | Schwere | Datei | Zeile | Problem |
|---|---------|-------|-------|---------|
| 1 | 🔴 Kritisch | physics.js | 82 | **`GameSettings.sprintSpeed` existiert nicht.** `settings.js` definiert nur `speed`, `jumpHeight`, `gravity`. Sprinten nutzt deshalb den Fallback `6.6` — und **Gehen fällt auf `speed = 7.2` zurück, Sprinten auf 6.6**. Ergebnis: **Sprinten ist langsamer als Gehen.** (Umgekehrt gedacht sollte Sprinten der höhere Wert sein.) |
| 2 | 🔴 Kritisch | game.js 429–439 / renderEngine.js 186–201 | — | **Nebel lässt sich nicht wieder einschalten.** `toggleFogSetting` setzt beim Aus `scene.fog = null`. Beim Einschalten ruft es `updateFog()`, das nur ein **bestehendes** `scene.fog` verändert (`if (scene.fog)`) und es **nie neu erzeugt**. Einmal aus = für die Sitzung nie wieder an. |
| 3 | 🔴 Kritisch | style.css 25–75 / modals.js 271–287 | — | **Das gesamte Theme-System ist wirkungslos.** `--theme-accent`/`--theme-glow`/`--theme-dim` werden in `style.css` **definiert**, aber in **keiner einzigen** CSS-Regel `var(--theme-accent)` verwendet (verifiziert: 0 Treffer im ganzen Repo). JS setzt die Variablen zusätzlich auf `document.documentElement`, die Definitionen hängen aber an `body.theme-*` — doppelter Bruch. Zur Laufzeit bestätigt: `accentBody="#ffaa00"` (CSS) schlägt `accentHtml="#ff9a1f"` (JS)./themeselect, Custom-Farben und Liquid-Glow ändern **keinen** Pixel. |
| 4 | 🟠 Hoch | inventory.js | 252, 307 | **Ziegel-Rezept und Rezeptbuch widersprechen sich.** `checkCraftingRecipes` verlangt `2× SAND + 2× DIRT`, `autoFillRecipe('brick')` füllt `4× DIRT` ein → das Muster erzeugt **kein** Ergebnis, die Rezeptbuch-Karte „ZIEGEL (x4)" ist ein toter Knopf. (Regression: das alte Review hatte `DIRT→SAND` „korrigiert", was einen neuen Konflikt erzeugte.) |
| 5 | 🟠 Hoch | index.html 549, 553 / inventory.js 301–318 | — | **Zwei Rezeptbuch-Karten sind tote Buttons.** HTML ruft `autoFillRecipe('diamond_pickaxe')` und `autoFillRecipe('diamond_sword')`; die Objekt-Schlüssel heißen `diamondpick` / `diamondsword`. `if (!pattern) return;` → Klick tut nichts. (Zur Laufzeit bestätigt.) |
| 6 | 🟠 Hoch | inventory.js 578–598 | — | **12 von 20 Rezept-Icons werden nie gezeichnet.** `drawRecipeBookCanvases()` zeichnet 20 `rec-*`-Canvases, aber nur 8 davon existieren in `index.html` (bestätigt: `canvas[id^="rec-"]` → 8). `draw2DIcon` hat zwar einen `null`-Guard (kein Crash), aber Wood-/Stone-/Iron-/Gold-Spitzhacken und alle Sword-Icons bleiben leer. |
| 7 | 🟠 Hoch | interaction.js | 194 | **`BLOCKS.DIAMOND_ORE` existiert nicht** (in `blocks.js` heißt er `DIAMOND: 10`). Der Vergleich ist immer `false` → **Diamanterz liefert kein Drop**, obwohl `textures.js`/`worldGen.js` es als `DIAMOND_ORE` kennen. Diamant ist damit unminebar. |
| 8 | 🟡 Mittel | input.js 134–146 | — | **Tastenbindungen sind halb wirkungslos.** Bedingungen wie `e.code === kb.inventory \|\| e.code === 'KeyE'` zwingen zusätzlich immer `E`/`Q`/`T`/`WASD`/`Space` mit. Eine eigene Bindung auf z. B. `KeyF` für „Inventar" funktioniert zwar, aber `KeyE` löst **immer** zusätzlich aus — doppelte Auslösung beim Kollidieren, und das Zurücksetzen der Bindung ist wirkungslos. |
| 9 | 🟡 Mittel | game.js 245 vs. 216–223 | — | **`playerRot` wird gespeichert, aber nie geladen.** `saveCurrentGame()` schreibt `{x: pitch, y: yaw}`; `loadCurrentSlot()` liest `playerPos`, aber nie `playerRot`. `setYaw`/`setPitch` (input.js:16–17) sind exportiert, werden aber **nirgends aufgerufen**. Blickrichtung geht bei jedem Laden verloren. |
| 10 | 🟡 Mittel | physics.js 121–138 | — | **Fall-Teleport ohne Kollisionsprüfung.** `ensurePlayerUnstuck()` (game.js:185) wird nur beim Laden aufgerufen, nicht beim Void-Recatch in physics.js:189–198. Der Spieler kann in einen Block gesetzt werden. |
| 11 | 🟡 Mittel | settings.js 126–128 / physics.js 81,108,113 | — | **`speed`/`jumpHeight`/`gravity` sind halb tot.** Sie werden persistiert und gelesen, aber es gibt **keine UI** dafür (`index.html` hat keinen Slider). Nach dem Update sind sie auf 7.2/11.8/44.0 gehardcodete Konstanten — die alten Defaults 4.3/8.5/26.0 sind nur noch als `\|\|`-Fallback im toten Zweig. Wer die Werte je in einer alten `localStorage` hatte, hat andere Physik als ein Neustart. |
| 12 | 🟡 Mittel | index.html 638–640 | — | **Zwei Three.js-Instanzen gleichzeitig.** `index.html` lädt `three.min.js` **r128** vom CDN und `PointerLockControls` r128, während alle Module `import * as THREE from 'three'` → npm **0.184.0** nutzen. Zur Laufzeit bestätigt: `THREE.REVISION === "128"`. Ergebnis: ~2× Download, doppelter Parser-Overhead, und `PointerLockControls` ist **toter Code** (nirgends referenziert — das Spiel nutzt eigene Pointer-Lock-Logik in input.js). |
| 13 | 🟡 Mittel | droppedItems.js 56–61 | — | `itemTex` wird im `import()`-Callback vor seiner `const`-Deklaration referenziert (TDZ). Funktioniert nur durch async-Timing — **kein** Laufzeitfehler, aber fragil. Bei schneller Pickup-Auflösung ist ein `ReferenceError` nicht ausgeschlossen. |
| 14 | 🟢 Tief | droppedItems.js 214 / 227–228 | — | `item.innerMesh.geometry.dispose()` disposed auch bei **flachen Items** die modulweite `itemPlaneGeo` (Z. 15). Nach dem ersten aufgehobenen Werkzeug/Barren sind alle folgenden flachen Items defekt (Use-after-dispose auf geteiltem Objekt) — exakt der Bug, der bei `particleGeo` schon behoben wurde. |
| 15 | 🟢 Tief | package.json | 13–31 | **12 von 20 Dependencies sind unbenutzt**: `react`, `react-dom`, `@react-three/fiber`, `@react-three/drei`, `@react-three/cannon`, `zustand`, `@google/genai`, `motion`, `lucide-react`, `express`, `nanoid`, `dotenv` — im `scripts/`-Ordner kommt **keines** vor. `@tailwindcss/vite`/`@vitejs/plugin-react` konfigurieren einen React-Build, der Projektbody ist aber Vanilla JS. `dist/assets/index-*.js` ist 611 kB (gzip 160 kB) fast nur Three.js. |
| 16 | 🟢 Tief | languages/, metadata.json, .env.example | — | `languages/lang_de.js` / `lang_en.js` (je 153 Zeilen) werden **nirgends importiert**; die Sprachumschaltung läuft fest über String-Vergleiche in modals.js/hud.js. `.env.example` wirbt mit `GEMINI_API_KEY`, aber es gibt **keinen** Gemini-Code und `metadata.json` deklariert trotzdem `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. |
| 17 | 🟢 Tief | README.md | — | Ist unverändert das **AI-Studio-Template** („Run and deploy your AI Studio app", `GEMINI_API_KEY`, AI-Studio-Link) und beschreibt weder BrowserCraft noch `start.bat`/`npm run dev`. |
| 18 | 🟢 Tief | saveManager.js 12, 132 | — | `localStorage.getItem`/`removeItem` in `getActiveSlotId()`/`deleteSlotWorld()` sind ungeschützt, während `setItem` (17, 92) und `removeItem` (173) es sind. In Inkognito-Modi/bei deaktiviertem Storage wirft der Pfad uncaught. |
| 19 | 🟢 Tief | chat.js 57, 60, 74 | — | Drei `[PROMPT_INJECTION]`-Literal-Tags lecken in die Nutzer-Ausgabe (Chat-Log) — sieht nach Debug-Resten aus. |
| 20 | 🟢 Tief | inventory.js 23, 232 | — | `BLOCKS.COBBLESTONE \|\| BLOCKS.STONE` (alt. Befund 10, nie behoben): `COBBBLESTONE: 43` existiert inzwischen, aber Start-Slot 6 und das Moos-Bruchstein-Rezept nutzen weiter den `\|\|`-Ausdruck; unschön, aktuell aber harmlos. |

## Laufzeit-Verifikation

| Prüfung | Ergebnis |
|---|---|
| `npm run build` | ✅ 24 Module, 3.59 s |
| `npx tsc --noEmit` | ✅ Exit 0 |
| Dev-Server + Browser-Boot | ✅ **0 JS-Fehler**, Welt rendert (Gras, Wasser, Bäume, Schatten) |
| FPS (headless, Software-GL) | 38 FPS bei 128 Chunks |
| `THREE.REVISION` zur Laufzeit | `128` (CDN) neben npm `0.184.0` → Befund 12 bestätigt |
| Theme-Variablen zur Laufzeit | `accentBody="#ffaa00"` ≠ `accentHtml="#ff9a1f"` → Befund 3 bestätigt |
| `canvas[id^="rec-"]` zur Laufzeit | 8 (von 20 erwarteten) → Befund 6 bestätigt |
| Rezeptbuch-Klick-Keys zur Laufzeit | `'diamond_pickaxe'`, `'diamond_sword'` → kein Pattern → Befund 5 bestätigt |

## Geprüft und **kein** Bug

- **Atlas-UV-Mathematik** (`getTileUV`, textures.js) stimmt mit dem Canvas-Layout und `flipY=true` überein.
- **AO** funktioniert (Fix bestätigt), **Partikel** korrekt (Fix bestätigt).
- **`chunkGroup.userData`** ist sicher — Three.js 0.184 initialisiert es im Konstruktor (altes False Positive).
- **LoD-Skirt-UVs** korrekt nach Fix 13.
- **`saveManager`** Map↔Object-Serialisierung symmetrisch und korrekt.
- **`draw2DIcon`** hat `null`-Guard → fehlende Recipe-Canvases crashen nicht.
- **Renderer-Kill-Route:** `trimDistantChunks` + `clearAllChunks` geben Geometrien frei.

## Empfohlene Priorität

1. **Befund 1** (Sprint langsamer als Gehen) + **2** (Nebel tot) — 2 Zeilen, sofort sichtbar.
2. **Befund 3** (Themes tot) — die UI hat 8 Theme-Buttons, die alle gleich aussehen. Größter optischer Verlust.
3. **Befunde 4–7** (Crafting-Widersprüche + Diamant unminebar) — blockiert echten Spielablauf.
4. **Befund 12** (doppeltes Three.js) + **15** (12 tote Dependencies) — saubere Kürzung, Bundle stark kleiner.
5. **Befunde 8–11** (Tasten, Rotation, Void, Physik-Defaults) — Komfort/Politur.

## Neue Ideen (nicht umgesetzt, nur Vorschläge)

**Kurzfristig lohnend**
- **Sprint-Geschwindigkeit als echte Einstellung** (behebt Befund 1 gleich mit): `sprintSpeed: 9.0` in `settings.js`, Slider in den Gameplay-Tab.
- **Rezeptbuch als Datenquelle für `autoFillRecipe`**: Statt zwei Listen (`recipePatterns` + HTML-`onclick`) einmal `RECIPES` definieren und die Karten daraus rendern — beseitigt Befunde 4/5/6 dauerhaft.
- **Diamant-Drop reparieren** (Befund 7) ist eine Zeile und macht die Spitzhacke wieder lohnenswert.

**Mittelfristig**
- **Tag/Nach-Zeit speichern**: `worldTime` wird nicht persistiert → jedes Laden startet bei 13:02. Ein Feld in `saveSlotWorld` reicht.
- **Undurchdringliche Blöcke klar unterscheiden**: `isTransparentBlock` steuert nur Face-Culling; Wasser wird in **einem** transparenten Mesh mit `renderOrder=10` gezeichnet → keine korrekte Sortierung zwischen Wasser, Glas und Laub hintereinander.
- **Performance-Hebel für 128 Chunks**: `sOpaquePos`/`sOpaqueUv`/… sind modulweite `Float32Array`-Scratch-Puffer. Für den Ultra-LoD-Horizont sind das ~600 kB pro Puffer; ein `WeakMap` pro Chunk oder kleinere Puffer für Macro/Mega reduzieren den GC-Druck.
- **Taillast entfernen**: `autoprefixer`, `esbuild`, `tsx`, `@types/express`, `@react-three/*`, Tailwind-Plugin — wenn kein React mehr kommt, spart das ~40 MB `node_modules`.

**Groß**
- **Tatsächliche Biome/Strukturen**: `worldGen.js` hat Wasser, Höhlen, Erze, Bäume. Biome (Wüste, Tundra — Texturen für Schnee/Eis/Kies existieren bereits als PNG!) undstrukturen (Ruinen, Felsen) würden die vorhandene Asset-Basis nutzen, statt neue zu brauchen.
- **Redstone**: `REDSTONE_ORE: 41` ist definiert, hat Textur, ist abbaubar — aber elektrisch völlig inert. Der Klassiker für eine „echte" Mechanik.
- **Mobil/Touch**: `isDraggingFallback` (input.js:63) existiert für eingebettete iframes, aber es gibt keine Touch-Events. AI-Studio läuft oft in einem iframe → genau der Fall, in dem das Spiel unbedienbar ist.