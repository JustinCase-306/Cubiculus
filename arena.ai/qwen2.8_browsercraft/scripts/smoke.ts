import { BLOCKS } from "../src/game/blocks";
import { buildChunkGeometry } from "../src/game/mesher";
import { CHUNKS_X, CHUNKS_Z, SEA, World } from "../src/game/world";

const t0 = Date.now();
const w = new World(1234);
console.log("welt erzeugt in", Date.now() - t0, "ms");

const counts: number[] = new Array(24).fill(0);
for (let i = 0; i < w.data.length; i++) counts[w.data[i]]++;
console.log(
  counts
    .map((c, i) => `${BLOCKS[i]?.key ?? i}=${c}`)
    .filter((s) => !s.endsWith("=0"))
    .join("  ")
);
console.log("spawn", w.spawn, "sea", SEA);

// Höhenverteilung
let min = 999,
  max = -999,
  waterCols = 0,
  grassCols = 0;
for (let i = 0; i < w.heights.length; i++) {
  min = Math.min(min, w.heights[i]);
  max = Math.max(max, w.heights[i]);
  if (w.heights[i] <= SEA) waterCols++;
  else grassCols++;
}
console.log("höhe min/max", min, max, "wasserflächen", waterCols, "land", grassCols);

let t1 = Date.now();
let verts = 0;
let quads = 0;
const perLayer: Record<string, number> = {};
for (let cz = 0; cz < CHUNKS_Z; cz++) {
  for (let cx = 0; cx < CHUNKS_X; cx++) {
    const d = buildChunkGeometry(w, cx, cz);
    for (const k of Object.keys(d) as (keyof typeof d)[]) {
      const g = d[k];
      if (!g.positions.length) continue;
      perLayer[k] = (perLayer[k] ?? 0) + g.indices.length / 6;
      verts += g.positions.length / 3;
      quads += g.indices.length / 6;
      for (const v of g.positions) if (!Number.isFinite(v)) throw new Error(`NaN position in ${k}`);
      for (const v of g.uvs) if (!(v >= 0 && v <= 1)) throw new Error(`uv außerhalb ${v}`);
      for (const v of g.colors) if (!(v > 0 && v <= 1.001)) throw new Error(`farbe kaputt ${v}`);
      const n = g.positions.length / 3;
      for (const idx of g.indices) if (idx < 0 || idx >= n) throw new Error("index außerhalb");
      for (const v of g.normals) if (!Number.isFinite(v)) throw new Error("normale NaN");
    }
  }
}
console.log("meshing in", Date.now() - t1, "ms | verts", verts, "| quads", quads);
console.log("layer", perLayer);

// Einzel-Chunk Dauer (für Block-Änderungen relevant)
const t2 = Date.now();
for (let i = 0; i < 5; i++) buildChunkGeometry(w, i % CHUNKS_X, 1);
console.log("1 chunk ≈", (Date.now() - t2) / 5, "ms");

// Set/Get + Nachbarlogik
w.set(10, 30, 10, 0);
console.log("nach remove:", w.get(10, 30, 10), "topY", w.topY(10, 10));
console.log("isSolid boden:", w.isSolid(10, 0, 10), "rand außen:", w.get(-5, 10, 10), w.get(500, 10, 10));
console.log("OK");
