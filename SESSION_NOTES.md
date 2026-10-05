# Cubiculus — Stand 2026-10-04, Ende der Session

17 Commits heute, Working Tree sauber, alles auf `main` gepusht.

## Wichtigste Lehre aus heute

Bei Grafik-/Mesher-Änderungen **immer die Browser-Konsole prüfen, BEVOR** ich "fertig" melde.
`node --check` prüft nur Syntax. Heute crashed das Spiel zweimal wegen
Laufzeitfehlern, die ich per `node --check` nicht sehen konnte:

- `ReferenceError: lx is not defined` (variablenname im falschen Scope)
- `Cannot access 'corners' before initialization` (TDZ, Block vor Deklaration)

Beidemale war die Ursache im Mesher `renderEngine.js`, beidemale fiel es sofort auf,
sobald ich die Konsole gelesen habe. Vorher hatte ich 3-4 Anlaeufe gebraucht.

Zweite Lehre: Bei "mach X"-Anweisungen **Rueckfrage, ob X global oder lokal gemeint
ist**. "Rampen / schraege Hoehen" habe ich auf alle Bloecke angewendet, gemeint war
nur Wasser. Hat das ganze Spiel optisch zerstoert.

---

## Erledigt heute

| Thema | Status |
|---|---|
| Inventar-Panel aus Overlay gerissen (Layout kaputt) | behoben, `3b0a22f` |
| 6 kaputte Rezepte (Schwerter lieferten Spitzhacken) | behoben, `af68164` |
| Log-/Wassertextur neu gezeichnet | `9a5bbcc` |
| Wasser fliessen (fill statt move, Minecraft-Level 0-7) | `39208bf`, `6358c1b` |
| Wasser-Scene: Seitenflaechen + schraege Oberflaeche | `0f44d02`, `3b8e7ad` |
| Hoehenlimit: harter Cut -> weiche Kompression | `9a5bbcc`, `ab27ae1` |
| Biome: 8 von 11 hatten dieselbe Oberflaeche | `9a5bbcc` |
| Stein mitten im Sandstrand | `ab27ae1` |
| Umbenennung BrowserCraft -> **Cubiculus** | `ac16285` |

### Wasser-Fluid-System (der grosse Block heute)
- Level 0-7 wie Minecraft, jede Ausbreitung +1, bei 7 stoppt es
- Reichweite begrenzt auf 7 Bloecke von der Quelle
- Oberflaeche faellt 1/8 Block pro Level
- Fuellt Senken auf statt sich zu bewegen (verhindert Flooding)
- Seitliche Neigungen, damit man nicht hindurchsieht
- Schraege Oberflaeche statt Stufen (`3b8e7ad`)
- 0% Wasservolumen-Wachstum in der echten Welt gemessen

---

## Offen fuer die naechste Session

### Prioritaet 1 — Crafting
- **Alle 18 Rezepte verifizieren.** Ein Test zeigte brick -> BRICK x4 korrekt, aber
  die Schleife ueber alle Rezepte war fehlerhaft: `autoFillRecipe` schreibt
  `inventory[44]` selbst, ein vorher gesetztes AIR wird ueberschrieben.
  **RICHTIG messen:** Grid (40..43) belegen, dann die Funktion aufrufen, die
  `inventory[44]` aus dem Grid ableitet — nicht `inventory[44]` als Ergebnis lesen.
  Erwartung: planks=PLANKS x4, stick=STICK x4, brick=BRICK x4, *_pickaxe x1,
  *_sword x1, *_ingot x1, glass=GLASS x1, sandstone=SANDSTONE x1, mossy=MOSSY x1.

### Prioritaet 2 — Doppelte Three.js-Instanz
`index.html` laedt r128 vom CDN, die Module importieren npm-Three 0.184.
Verursacht die "Multiple instances of Three.js"-Warnung und war die Ursache
mehrerer schwer zu debugbender Fehler. Fix: CDN-Script raus, nur npm-Three.

### Prioritaet 3 — Optik, die der User sehen will
- Wasser-Nachtsicht pruefen (heute nur nachts verifiziert)
- Die dunklen Rasterlinien im Wasser — laut Commit `091ff60` behoben, aber
  nie bei Tageslicht bestaetigt
- Schwebende Dropped Items ueber Wasser (Items fallen nicht)
- Sandterrassen oben rechts wirken kuenstlich

### Untracked, kein Commit
- `CODE_REVIEW_2026-10-01.md`, `SESSION_NOTES.md` (interne Doku, nicht committen)
- `arena.ai/` — User sagte "ja zu beidem", Commit steht aus. 589K, eigene
  package-lock, kein node_modules. Evtl. `.gitignore` dafuer statt committen.

### Netlify
Nur wenn der User es wieder aufmacht. Projekt laeuft ueber manuellen Drop,
kein CLI-Token, keine `netlify.toml`. Wege: Token schicken ODER Netlify mit
GitHub verbinden (dann deployed Netlify bei jedem Push selbst).

---

## Test-Regeln fuer die naechste Session

1. Messungen in der **laufenden** Instanz, nicht per frischem
   `import('/scripts/x.js')` — eine frische Modulinstanz hat keine generierten
   Chunks und liest alles als 0. Live-Modul ueber den HMR-Pfad:
   ```js
   const hot = re => performance.getEntriesByType('resource').map(r=>r.name)
       .filter(n => re.test(n)).find(n => /\?t=\d+/.test(n));
   ```
2. Chunk-Bereich im Test == Chunk-Bereich, der generiert wurde. `getBlock` liest
   ausserhalb generierter Chunks AIR. Vorher 3x falsch gemessen.
3. Nach `setWorldSeed` immer `resetWorldState()` — sonst liefern alle Seeds
   identische Zahlen (alte Chunks bleiben).
4. Der Spiel-Loop ueberschreibt die Kamera jeden Frame. Fuer Kameratests die
   `player.pos`/`yaw`/`pitch` aus `physics.js` setzen, nicht `camera`.
5. Exit-Codes in Datei schreiben, nicht durch Pipes leiten — `$?` kam sonst vom
   `grep`, nicht vom `tsc`.