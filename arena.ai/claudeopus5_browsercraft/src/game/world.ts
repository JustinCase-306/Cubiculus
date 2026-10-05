import { AIR, isSolid } from './blocks';
import { fbm2D, hash2, mulberry32 } from './noise';

export const WORLD_X = 64;
export const WORLD_Y = 48;
export const WORLD_Z = 64;
export const CHUNK_SIZE = 16;
export const CHUNKS_X = WORLD_X / CHUNK_SIZE;
export const CHUNKS_Z = WORLD_Z / CHUNK_SIZE;
export const WATER_LEVEL = 13;

const B = {
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 5,
  LOG: 6,
  LEAVES: 7,
  WATER: 10,
  SNOW: 12,
  BEDROCK: 14,
};

export class World {
  readonly data: Uint8Array;
  seed: number;

  constructor(seed = 1) {
    this.data = new Uint8Array(WORLD_X * WORLD_Y * WORLD_Z);
    this.seed = seed;
    this.generate(seed);
  }

  index(x: number, y: number, z: number): number {
    return (y * WORLD_Z + z) * WORLD_X + x;
  }

  inBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && y >= 0 && z >= 0 && x < WORLD_X && y < WORLD_Y && z < WORLD_Z;
  }

  get(x: number, y: number, z: number): number {
    if (!this.inBounds(x, y, z)) return AIR;
    return this.data[this.index(x, y, z)];
  }

  /** Wie get(), behandelt aber alles unterhalb der Welt als fest (keine Bodenflächen rendern). */
  getForMesh(x: number, y: number, z: number): number {
    if (y < 0) return B.BEDROCK;
    return this.get(x, y, z);
  }

  set(x: number, y: number, z: number, id: number) {
    if (!this.inBounds(x, y, z)) return;
    this.data[this.index(x, y, z)] = id;
  }

  isSolidAt(x: number, y: number, z: number): boolean {
    if (y < 0) return false;
    if (x < 0 || z < 0 || x >= WORLD_X || z >= WORLD_Z) return false;
    return isSolid(this.get(x, y, z));
  }

  heightAt(x: number, z: number): number {
    for (let y = WORLD_Y - 1; y >= 0; y--) {
      const id = this.get(x, y, z);
      if (id !== AIR && id !== B.WATER) return y;
    }
    return 0;
  }

  generate(seed: number) {
    this.seed = seed;
    this.data.fill(0);
    const rnd = mulberry32(seed);
    const heights = new Int16Array(WORLD_X * WORLD_Z);

    for (let z = 0; z < WORLD_Z; z++) {
      for (let x = 0; x < WORLD_X; x++) {
        const raw = fbm2D(x * 0.04, z * 0.04, seed, 4);
        const hills = Math.max(0, Math.min(1, (raw - 0.5) * 1.35 + 0.5));
        const mountainMask = fbm2D(x * 0.018, z * 0.018, seed + 5501, 2);
        const mountains = Math.max(0, mountainMask - 0.56) * 50;
        const detail = fbm2D(x * 0.14, z * 0.14, seed + 991, 2) * 2.2;
        let h = Math.round(5 + hills * 17 + mountains + detail);
        h = Math.max(1, Math.min(WORLD_Y - 12, h));
        heights[z * WORLD_X + x] = h;

        for (let y = 0; y <= h; y++) {
          let id: number = B.STONE;
          if (y === 0) id = B.BEDROCK;
          else if (y === h) {
            if (h <= WATER_LEVEL + 1) id = B.SAND;
            else if (h >= 27) id = B.SNOW;
            else id = B.GRASS;
          } else if (y > h - 4) {
            id = h <= WATER_LEVEL + 1 ? B.SAND : B.DIRT;
          }
          if (y >= h - 2 && h >= 29 && y < h) id = B.STONE;
          this.set(x, y, z, id);
        }
        for (let y = h + 1; y <= WATER_LEVEL; y++) this.set(x, y, z, B.WATER);
      }
    }

    // Bäume
    for (let z = 3; z < WORLD_Z - 3; z++) {
      for (let x = 3; x < WORLD_X - 3; x++) {
        const h = heights[z * WORLD_X + x];
        if (h <= WATER_LEVEL + 1 || h >= 26) continue;
        if (this.get(x, h, z) !== B.GRASS) continue;
        if (hash2(x, z, seed + 13) > 0.038) continue;
        // Abstand zu anderen Bäumen
        let tooClose = false;
        for (let dz = -2; dz <= 2 && !tooClose; dz++) {
          for (let dx = -2; dx <= 2; dx++) {
            if ((dx || dz) && this.get(x + dx, h + 2, z + dz) === B.LOG) {
              tooClose = true;
              break;
            }
          }
        }
        if (tooClose) continue;
        const trunk = 4 + Math.floor(rnd() * 3);
        for (let y = 1; y <= trunk; y++) this.set(x, h + y, z, B.LOG);
        const top = h + trunk;
        for (let dy = -2; dy <= 1; dy++) {
          const radius = dy <= -1 ? 2 : 1;
          for (let dz = -radius; dz <= radius; dz++) {
            for (let dx = -radius; dx <= radius; dx++) {
              if (Math.abs(dx) === radius && Math.abs(dz) === radius && rnd() < 0.6) continue;
              const y = top + dy;
              if (dx === 0 && dz === 0 && dy < 1) continue;
              if (this.get(x + dx, y, z + dz) === AIR) this.set(x + dx, y, z + dz, B.LEAVES);
            }
          }
        }
      }
    }
  }

  /** Sicherer Spawnpunkt in Weltmitte. */
  spawnPoint(): { x: number; y: number; z: number } {
    const cx = Math.floor(WORLD_X / 2);
    const cz = Math.floor(WORLD_Z / 2);
    for (let r = 0; r < 20; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const x = cx + dx;
          const z = cz + dz;
          const h = this.heightAt(x, z);
          if (h > WATER_LEVEL && this.get(x, h + 1, z) === AIR && this.get(x, h + 2, z) === AIR) {
            return { x: x + 0.5, y: h + 1.05, z: z + 0.5 };
          }
        }
      }
    }
    return { x: cx + 0.5, y: WATER_LEVEL + 3, z: cz + 0.5 };
  }

  serialize(): string {
    const runs: number[] = [];
    let current = this.data[0];
    let count = 1;
    for (let i = 1; i < this.data.length; i++) {
      const v = this.data[i];
      if (v === current && count < 65535) count++;
      else {
        runs.push(current, count);
        current = v;
        count = 1;
      }
    }
    runs.push(current, count);
    return JSON.stringify({ v: 1, seed: this.seed, size: [WORLD_X, WORLD_Y, WORLD_Z], runs });
  }

  deserialize(raw: string): boolean {
    try {
      const parsed = JSON.parse(raw) as { v: number; seed: number; size: number[]; runs: number[] };
      if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.runs)) return false;
      const [sx, sy, sz] = parsed.size;
      if (sx !== WORLD_X || sy !== WORLD_Y || sz !== WORLD_Z) return false;
      let i = 0;
      for (let r = 0; r < parsed.runs.length; r += 2) {
        const value = parsed.runs[r];
        const count = parsed.runs[r + 1];
        for (let c = 0; c < count && i < this.data.length; c++) this.data[i++] = value;
      }
      this.seed = parsed.seed ?? this.seed;
      return i === this.data.length;
    } catch {
      return false;
    }
  }
}
