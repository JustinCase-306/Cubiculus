import * as THREE from "three";
import { AIR, LEAVES, WATER, getBlock } from "./blocks";
import { ATLAS_COLS, ATLAS_ROWS, TILE } from "./textures";
import { CHUNK, SX, SY, SZ, World } from "./world";

/* ============================================================
   Chunk-Mesher: nur sichtbare Flächen, mit Ambient Occlusion
   ============================================================ */

export type LayerKey = "opaque" | "cutout" | "glass" | "water" | "glow";
export const LAYERS: LayerKey[] = ["opaque", "cutout", "glass", "water", "glow"];

export function layerOf(id: number): LayerKey {
  const b = getBlock(id);
  if (b.layer === "cross" || b.layer === "cutout") return "cutout";
  return b.layer as LayerKey;
}

interface FaceCorner {
  pos: [number, number, number];
  uv: [number, number];
}
interface FaceDef {
  dir: [number, number, number];
  shade: number;
  corners: FaceCorner[];
}

// Reihenfolge: 0,1,2 / 2,1,3  (Front Facing CCW)
const FACES: FaceDef[] = [
  {
    dir: [-1, 0, 0],
    shade: 0.74,
    corners: [
      { pos: [0, 1, 0], uv: [0, 1] },
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [1, 0] },
    ],
  },
  {
    dir: [1, 0, 0],
    shade: 0.74,
    corners: [
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [1, 0, 1], uv: [0, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [1, 0, 0], uv: [1, 0] },
    ],
  },
  {
    dir: [0, -1, 0],
    shade: 0.52,
    corners: [
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 1] },
      { pos: [0, 0, 0], uv: [0, 1] },
    ],
  },
  {
    dir: [0, 1, 0],
    shade: 1.0,
    corners: [
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 0] },
    ],
  },
  {
    dir: [0, 0, -1],
    shade: 0.86,
    corners: [
      { pos: [1, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 1] },
    ],
  },
  {
    dir: [0, 0, 1],
    shade: 0.86,
    corners: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [0, 1] },
      { pos: [1, 1, 1], uv: [1, 1] },
    ],
  },
];

const EPS_U = 0.28 / (TILE * ATLAS_COLS);
const EPS_V = 0.28 / (TILE * ATLAS_ROWS);

function uvRect(tile: number) {
  const col = tile % ATLAS_COLS;
  const row = (tile / ATLAS_COLS) | 0;
  const u0 = col / ATLAS_COLS + EPS_U;
  const u1 = (col + 1) / ATLAS_COLS - EPS_U;
  const v0 = 1 - (row + 1) / ATLAS_ROWS + EPS_V;
  const v1 = 1 - row / ATLAS_ROWS - EPS_V;
  return [u0, v0, u1, v1] as const;
}

export interface GeomData {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  indices: number[];
}

const empty = (): GeomData => ({ positions: [], normals: [], uvs: [], colors: [], indices: [] });

function visible(world: World, self: number, nx: number, ny: number, nz: number) {
  const n = world.get(nx, ny, nz);
  if (n === AIR) return true;
  const nb = getBlock(n);
  if (nb.opaque) return false;
  if (self === WATER) return nb.layer === "cross";
  if (n === self) return self !== LEAVES; // Glas/Wasser: gleiche Blöcke keine Innenfläche
  if (nb.layer === "water") return self !== WATER;
  return true;
}

const AO_LEVELS = [0.5, 0.68, 0.85, 1.0];

export function buildChunkGeometry(world: World, cx: number, cz: number) {
  const out: Record<LayerKey, GeomData> = {
    opaque: empty(),
    cutout: empty(),
    glass: empty(),
    water: empty(),
    glow: empty(),
  };

  const x0 = cx * CHUNK;
  const z0 = cz * CHUNK;

  for (let y = 0; y < SY; y++) {
    for (let z = z0; z < z0 + CHUNK; z++) {
      for (let x = x0; x < x0 + CHUNK; x++) {
        const id = world.get(x, y, z);
        if (id === AIR) continue;
        const block = getBlock(id);
        const layer = layerOf(id);
        const g = out[layer];

        if (block.layer === "cross") {
          // Pflanze: zwei gekreuzte Quads
          const [u0, v0, u1, v1] = uvRect(block.tiles.top);
          const quads: [number, number, number, number][] = [
            [0.12, 0.12, 0.88, 0.88],
            [0.88, 0.12, 0.12, 0.88],
          ];
          for (const q of quads) {
            const i = g.positions.length / 3;
            const corners = [
              [x + q[0], y, z + q[1]],
              [x + q[2], y, z + q[3]],
              [x + q[0], y + 0.95, z + q[1]],
              [x + q[2], y + 0.95, z + q[3]],
            ];
            const uvs = [
              [u0, v0],
              [u1, v0],
              [u0, v1],
              [u1, v1],
            ];
            for (let k = 0; k < 4; k++) {
              g.positions.push(corners[k][0], corners[k][1], corners[k][2]);
              g.normals.push(0, 1, 0);
              g.uvs.push(uvs[k][0], uvs[k][1]);
              const c = 0.94;
              g.colors.push(c, c, c);
            }
            g.indices.push(i, i + 1, i + 2, i + 2, i + 1, i + 3);
          }
          continue;
        }

        const waterTop = id === WATER && world.get(x, y + 1, z) !== WATER ? 0.875 : 1;

        for (let f = 0; f < 6; f++) {
          const face = FACES[f];
          const [dx, dy, dz] = face.dir;
          if (!visible(world, id, x + dx, y + dy, z + dz)) continue;

          const tile = dy === 1 ? block.tiles.top : dy === -1 ? block.tiles.bottom : block.tiles.side;
          const [u0, v0, u1, v1] = uvRect(tile);

          // Ambient-Occlusion-Nachbarn (Achsen senkrecht zur Flächennormale)
          const axis = dx !== 0 ? 0 : dy !== 0 ? 1 : 2;
          const t1 = (axis + 1) % 3;
          const t2 = (axis + 2) % 3;

          const solidAt = (ox: number, oy: number, oz: number) => {
            const b = world.get(x + dx + ox, y + dy + oy, z + dz + oz);
            return b !== AIR && getBlock(b).opaque ? 1 : 0;
          };

          const ao: number[] = [];
          const start = g.positions.length / 3;
          for (let c = 0; c < 4; c++) {
            const corner = face.corners[c];
            const py = corner.pos[1] === 1 && waterTop !== 1 ? waterTop : corner.pos[1];

            const s1 = [0, 0, 0];
            const s2 = [0, 0, 0];
            s1[t1] = corner.pos[t1] === 1 ? 1 : -1;
            s2[t2] = corner.pos[t2] === 1 ? 1 : -1;

            let light = face.shade;
            if (layer === "opaque" || layer === "glass") {
              const a = solidAt(s1[0], s1[1], s1[2]);
              const b = solidAt(s2[0], s2[1], s2[2]);
              const cc = solidAt(s1[0] + s2[0], s1[1] + s2[1], s1[2] + s2[2]);
              const lvl = a && b ? 0 : 3 - (a + b + cc);
              light *= AO_LEVELS[lvl];
              ao.push(lvl);
            } else ao.push(3);

            g.positions.push(x + corner.pos[0], y + py, z + corner.pos[2]);
            g.normals.push(dx, dy, dz);
            g.uvs.push(u0 + corner.uv[0] * (u1 - u0), v0 + corner.uv[1] * (v1 - v0));
            if (layer === "glow") g.colors.push(1, 0.96, 0.84);
            else g.colors.push(light, light, light);
          }

          // Quad-Triangulation je nach AO drehen (verhindert Interpolations-Artefakte)
          if (ao[0] + ao[3] > ao[1] + ao[2])
            g.indices.push(start, start + 1, start + 3, start, start + 3, start + 2);
          else g.indices.push(start, start + 1, start + 2, start + 2, start + 1, start + 3);
        }
      }
    }
  }
  return out;
}

export function toBufferGeometry(g: GeomData): THREE.BufferGeometry | null {
  if (g.positions.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(g.positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(g.normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(g.uvs, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(g.colors, 3));
  geo.setIndex(g.indices);
  geo.computeBoundingSphere();
  return geo;
}

export const WORLD_SIZE = { SX, SY, SZ, CHUNK };
