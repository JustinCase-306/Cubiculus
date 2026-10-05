import { AIR, BEDROCK, COAL, COBBLE, DIRT, GOLD, GRASS, GRAVEL, IRON, LEAVES, LOG, MOSSY, POPPY, DANDELION, SAND, SNOW, STONE, TALLGRASS, WATER } from "./blocks";

/* ============================================================
   Weltgenerierung (Value-Noise FBM, Höhlen, Erze, Bäume)
   ============================================================ */

export const SX = 80;
export const SY = 48;
export const SZ = 80;
export const CHUNK = 16;
export const SEA = 18;
export const CHUNKS_X = SX / CHUNK;
export const CHUNKS_Z = SZ / CHUNK;

function hash2(x: number, y: number, seed: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function hash3(x: number, y: number, z: number, seed: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 1103515245) ^ Math.imul(z | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function noise2(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const tx = smooth(x - xi), ty = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
}

function noise3(x: number, y: number, z: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const tx = smooth(x - xi), ty = smooth(y - yi), tz = smooth(z - zi);
  const c00 = lerp(hash3(xi, yi, zi, seed), hash3(xi + 1, yi, zi, seed), tx);
  const c10 = lerp(hash3(xi, yi + 1, zi, seed), hash3(xi + 1, yi + 1, zi, seed), tx);
  const c01 = lerp(hash3(xi, yi, zi + 1, seed), hash3(xi + 1, yi, zi + 1, seed), tx);
  const c11 = lerp(hash3(xi, yi + 1, zi + 1, seed), hash3(xi + 1, yi + 1, zi + 1, seed), tx);
  return lerp(lerp(c00, c10, ty), lerp(c01, c11, ty), tz);
}

function fbm2(x: number, y: number, seed: number, octaves = 4, lac = 2, gain = 0.5) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise2(x * freq, y * freq, seed + i * 1013) * amp;
    norm += amp;
    amp *= gain;
    freq *= lac;
  }
  return sum / norm;
}

export class World {
  readonly data: Uint8Array;
  readonly heights: Int16Array;
  seed: number;
  spawn = { x: SX / 2 + 0.5, y: 30, z: SZ / 2 + 0.5 };

  constructor(seed: number) {
    this.seed = seed | 0;
    this.data = new Uint8Array(SX * SY * SZ);
    this.heights = new Int16Array(SX * SZ);
    this.generate();
  }

  idx(x: number, y: number, z: number) {
    return (y * SZ + z) * SX + x;
  }

  inside(x: number, y: number, z: number) {
    return x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
  }

  get(x: number, y: number, z: number): number {
    if (!this.inside(x, y, z)) return AIR;
    return this.data[this.idx(x, y, z)];
  }

  set(x: number, y: number, z: number, id: number) {
    if (!this.inside(x, y, z)) return;
    this.data[this.idx(x, y, z)] = id;
    if (y >= this.heights[z * SX + x] && id !== AIR) this.heights[z * SX + x] = y;
  }

  isSolid(x: number, y: number, z: number) {
    const b = this.get(x, y, z);
    return b !== AIR && b !== WATER && b !== TALLGRASS && b !== POPPY && b !== DANDELION;
  }

  /** Oberster nicht-Luft-Block einer Säule */
  topY(x: number, z: number) {
    for (let y = SY - 1; y >= 0; y--) {
      const b = this.get(x, y, z);
      if (b !== AIR && b !== WATER) return y;
    }
    return 0;
  }

  private heightAt(x: number, z: number) {
    const s = this.seed;
    const cont = fbm2(x / 62, z / 62, s, 4);
    const detail = fbm2(x / 18, z / 18, s + 991, 3);
    const ridge = Math.pow(fbm2(x / 34, z / 34, s + 4242, 3), 2.1);

    // Insel-Falloff: zum Rand hin fällt das Gelände ins Meer ab
    const nx = (x - SX / 2) / (SX / 2);
    const nz = (z - SZ / 2) / (SZ / 2);
    const r = Math.min(1, Math.hypot(nx, nz) * 1.06);
    const falloff = r > 0.74 ? Math.pow((r - 0.74) / 0.26, 1.55) * 19 : 0;

    let h = 11 + cont * 15 + detail * 4.5 + ridge * 17 - falloff;
    return Math.max(2, Math.min(SY - 12, Math.round(h)));
  }

  private generate() {
    const s = this.seed;

    // --- Gelände ---
    for (let z = 0; z < SZ; z++) {
      for (let x = 0; x < SX; x++) {
        const h = this.heightAt(x, z);
        this.heights[z * SX + x] = h;
        const beach = h <= SEA + 1;
        const peak = h >= 31;

        for (let y = 0; y <= h; y++) {
          let id: number = STONE;
          if (y === 0) id = BEDROCK;
          else if (y === 1 && hash2(x * 3 + z, y, s) < 0.55) id = BEDROCK;
          else if (y === h) {
            if (beach) id = h <= SEA ? GRAVEL : SAND;
            else if (peak) id = SNOW;
            else id = GRASS;
          } else if (y > h - 4) {
            id = beach ? SAND : DIRT;
          } else {
            id = STONE;
            const r = hash3(x, y, z, s + 55);
            if (y < 14 && r < 0.006) id = GOLD;
            else if (y < 24 && r < 0.016) id = IRON;
            else if (r < 0.034) id = COAL;
            else if (r > 0.985) id = GRAVEL;
          }

          // --- Höhlen ---
          if (y > 1 && y < h - 1 && id !== BEDROCK) {
            const c1 = noise3(x / 15, y / 11, z / 15, s + 7);
            const c2 = noise3(x / 7.5, y / 6, z / 7.5, s + 99);
            const worm = Math.abs(c1 - 0.5) < 0.055 && Math.abs(c2 - 0.5) < 0.16;
            const pocket = c1 > 0.7 && c2 > 0.62;
            if (worm || pocket) {
              if (!(h <= SEA && y > h - 3)) {
                this.data[this.idx(x, y, z)] = AIR;
                continue;
              }
            }
          }
          this.data[this.idx(x, y, z)] = id;
        }

        // --- Wasser ---
        for (let y = h + 1; y <= SEA; y++) this.data[this.idx(x, y, z)] = WATER;
      }
    }

    // --- Bäume, Felsen & Pflanzen ---
    for (let z = 3; z < SZ - 3; z++) {
      for (let x = 3; x < SX - 3; x++) {
        const h = this.heights[z * SX + x];
        const top = this.get(x, h, z);
        if (top !== GRASS) continue;
        const r = hash2(x, z, s + 31);

        if (r < 0.024) {
          this.tree(x, h + 1, z, s);
        } else if (r > 0.9965) {
          // kleiner Fels
          const hh = 1 + (hash2(x, z, s + 5) < 0.4 ? 1 : 0);
          for (let dy = 0; dy < hh; dy++)
            for (let dx = -1; dx <= 1; dx++)
              for (let dz = -1; dz <= 1; dz++) {
                if (Math.abs(dx) + Math.abs(dz) + dy > 2) continue;
                this.set(x + dx, h + 1 + dy, z + dz, hash3(x + dx, dy, z + dz, s) < 0.35 ? MOSSY : COBBLE);
              }
        } else if (r < 0.14) {
          this.set(x, h + 1, z, TALLGRASS);
        } else if (r < 0.152) {
          this.set(x, h + 1, z, hash2(x, z, s + 3) < 0.5 ? POPPY : DANDELION);
        }
      }
    }

    // --- Spawn suchen (höchster Grasblock nahe der Mitte) ---
    let best = { x: SX / 2, y: SY - 1, z: SZ / 2, score: -1 };
    for (let z = SZ / 2 - 12; z < SZ / 2 + 12; z++) {
      for (let x = SX / 2 - 12; x < SX / 2 + 12; x++) {
        const h = this.heights[(z | 0) * SX + (x | 0)];
        if (this.get(x | 0, h, z | 0) !== GRASS) continue;
        const d = Math.hypot(x - SX / 2, z - SZ / 2);
        const score = h - d * 0.35;
        if (score > best.score) best = { x: x | 0, y: h, z: z | 0, score };
      }
    }
    // Fläche einebnen, damit man nicht im Baum steht
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        const bx = best.x + dx, bz = best.z + dz;
        for (let y = best.y + 1; y < best.y + 6; y++) this.set(bx, y, bz, AIR);
      }
    this.spawn = { x: best.x + 0.5, y: best.y + 1.2, z: best.z + 0.5 };
  }

  private tree(x: number, y: number, z: number, seed: number) {
    const rnd = hash2(x, z, seed + 77);
    const trunk = 4 + Math.floor(rnd * 3);
    for (let i = 0; i < trunk; i++) this.set(x, y + i, z, LOG);
    const topY = y + trunk;
    for (let dy = -2; dy <= 2; dy++) {
      const radius = dy <= 0 ? 2 : dy === 1 ? 2 : 1;
      for (let dx = -radius; dx <= radius; dx++)
        for (let dz = -radius; dz <= radius; dz++) {
          const d = Math.hypot(dx, dz) + Math.abs(dy) * 0.6;
          if (d > radius + 0.9) continue;
          if (dx === 0 && dz === 0 && dy < 2) continue;
          if (hash3(x + dx, topY + dy, z + dz, seed + 13) < 0.12) continue;
          const bx = x + dx, by = topY + dy, bz = z + dz;
          if (this.get(bx, by, bz) === AIR) this.set(bx, by, bz, LEAVES);
        }
    }
    this.set(x, topY + 2, z, LEAVES);
  }
}
