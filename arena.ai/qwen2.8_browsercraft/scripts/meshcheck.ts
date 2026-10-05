import { AIR, GRASS, STONE, WATER } from "../src/game/blocks";
import { buildChunkGeometry, LAYERS } from "../src/game/mesher";
import type { World } from "../src/game/world";

function mockWorld(fn: (x: number, y: number, z: number) => number) {
  return {
    get: fn,
    inside: (x: number, y: number, z: number) => x >= 0 && y >= 0 && z >= 0 && x < 80 && y < 48 && z < 80,
    isSolid: (x: number, y: number, z: number) => fn(x, y, z) !== AIR && fn(x, y, z) !== WATER,
  } as unknown as World;
}

function checkWinding(name: string, fn: (x: number, y: number, z: number) => number) {
  const w = mockWorld(fn);
  const data = buildChunkGeometry(w, 0, 0);
  let quads = 0;
  let bad = 0;
  for (const layer of LAYERS) {
    const g = data[layer];
    if (!g.positions.length) continue;
    for (let i = 0; i < g.indices.length; i += 3) {
      const [a, b, c] = [g.indices[i], g.indices[i + 1], g.indices[i + 2]];
      const p = (k: number) => [g.positions[k * 3], g.positions[k * 3 + 1], g.positions[k * 3 + 2]];
      const n = (k: number) => [g.normals[k * 3], g.normals[k * 3 + 1], g.normals[k * 3 + 2]];
      const A = p(a), B = p(b), C = p(c);
      const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
      const v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
      const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const dot = cr[0] * n(a)[0] + cr[1] * n(a)[1] + cr[2] * n(a)[2];
      const area = Math.hypot(cr[0], cr[1], cr[2]);
      quads++;
      if (dot <= 0 || area < 0.05) {
        bad++;
        if (bad < 4) console.log(`  ✗ ${name} layer=${layer} tri=${i / 3} dot=${dot.toFixed(3)} area=${area.toFixed(3)} n=${n(a)}`);
      }
    }
  }
  console.log(`${name}: ${quads} Dreiecke, ${bad} fehlerhaft`);
  return bad;
}

let fail = 0;

// 1) Einzelblock
fail += checkWinding("Einzelblock", (x, y, z) => (x === 8 && y === 8 && z === 8 ? STONE : AIR));

// 2) Flache Grasplattform 4x4
fail += checkWinding("Plattform", (x, y, z) => (y === 8 && x >= 6 && x < 10 && z >= 6 && z < 10 ? GRASS : AIR));

// 3) Treppe (AO + Kanten)
fail += checkWinding("Treppe", (x, y, z) => (x >= 4 && x < 12 && z === 8 && y >= 4 && y < 4 + (x - 4) ? STONE : AIR));

// 4) Wasserbecken mit Glaswand
fail += checkWinding("Wasser", (x, y, z) => {
  if (y === 5 && x >= 5 && x < 11 && z >= 5 && z < 11) return STONE;
  if (y > 5 && y <= 8 && x >= 5 && x < 11 && z >= 5 && z < 11) return WATER;
  return AIR;
});

// 5) Voll gefüllter Bereich (nur Außenflächen)
fail += checkWinding("Voller Würfel", (x, y, z) => (x >= 4 && x < 12 && y >= 4 && y < 12 && z >= 4 && z < 12 ? STONE : AIR));

// UV-Grenzen prüfen
{
  const w = mockWorld((x, y, z) => (x === 8 && y === 8 && z === 8 ? GRASS : AIR));
  const g = buildChunkGeometry(w, 0, 0).opaque;
  const tiles = new Set(g.uvs.filter((_, i) => i % 2 === 0).map((u) => Math.floor(u * 8)));
  console.log("UV-Spalten (0..7):", [...tiles].sort(), "min/max u:", Math.min(...g.uvs), Math.max(...g.uvs));
  const vOk = g.uvs.every((v, i) => (i % 2 === 0 ? v >= 0 && v <= 1 : v >= 0 && v <= 1));
  console.log("UVs im Atlas-Bereich:", vOk);
  console.log("Farbwerte:", [...new Set(g.colors.map((c) => c.toFixed(3)))].sort().join(" "));
}

console.log(fail === 0 ? "ALLE WINDINGS OK" : `FEHLER: ${fail}`);
