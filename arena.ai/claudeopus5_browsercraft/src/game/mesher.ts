import * as THREE from 'three';
import { AIR, BLOCKS, isOpaque } from './blocks';
import { tileUV } from './textures';
import { CHUNK_SIZE, World, WORLD_X, WORLD_Y, WORLD_Z } from './world';

type Vec3 = [number, number, number];

interface FaceDef {
  dir: Vec3;
  corners: Vec3[];
  t1: Vec3;
  t2: Vec3;
  shade: number;
  tile: 'top' | 'side' | 'bottom';
}

const FACES: FaceDef[] = [
  {
    // +X
    dir: [1, 0, 0],
    corners: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
    t1: [0, 0, -1],
    t2: [0, 1, 0],
    shade: 0.42,
    tile: 'side',
  },
  {
    // -X
    dir: [-1, 0, 0],
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    t1: [0, 0, 1],
    t2: [0, 1, 0],
    shade: 0.42,
    tile: 'side',
  },
  {
    // +Y
    dir: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    t1: [1, 0, 0],
    t2: [0, 0, -1],
    shade: 1,
    tile: 'top',
  },
  {
    // -Y
    dir: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    t1: [1, 0, 0],
    t2: [0, 0, 1],
    shade: 0.26,
    tile: 'bottom',
  },
  {
    // +Z
    dir: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    t1: [1, 0, 0],
    t2: [0, 1, 0],
    shade: 0.66,
    tile: 'side',
  },
  {
    // -Z
    dir: [0, 0, -1],
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    t1: [-1, 0, 0],
    t2: [0, 1, 0],
    shade: 0.66,
    tile: 'side',
  },
];

const CORNER_SIGNS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

const AO_LEVELS = [0.3, 0.52, 0.76, 1];

interface Buffers {
  pos: number[];
  uv: number[];
  color: number[];
  index: number[];
}

const newBuffers = (): Buffers => ({ pos: [], uv: [], color: [], index: [] });

function toGeometry(b: Buffers): THREE.BufferGeometry | null {
  if (b.index.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(b.color, 3));
  geo.setIndex(b.index);
  geo.computeBoundingSphere();
  return geo;
}

export function buildChunkGeometry(
  world: World,
  cx: number,
  cz: number,
): { opaque: THREE.BufferGeometry | null; transparent: THREE.BufferGeometry | null } {
  const solid = newBuffers();
  const trans = newBuffers();
  const x0 = cx * CHUNK_SIZE;
  const z0 = cz * CHUNK_SIZE;

  for (let ly = 0; ly < WORLD_Y; ly++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const x = x0 + lx;
        const z = z0 + lz;
        const id = world.get(x, ly, z);
        if (id === AIR) continue;
        const block = BLOCKS[id];
        if (!block) continue;
        const target = block.opaque ? solid : trans;
        const liquid = !!block.liquid;
        const liquidTop = liquid && world.getForMesh(x, ly + 1, z) !== id;

        for (const face of FACES) {
          const nx = x + face.dir[0];
          const ny = ly + face.dir[1];
          const nz = z + face.dir[2];
          if (liquid && (nx < 0 || nz < 0 || nx >= WORLD_X || nz >= WORLD_Z)) continue;
          const neighbor = world.getForMesh(nx, ny, nz);
          if (neighbor === id) continue;
          if (isOpaque(neighbor)) continue;
          if (liquid && !block.opaque && neighbor !== AIR && BLOCKS[neighbor] && !BLOCKS[neighbor].opaque) continue;

          const tile = block.tiles[face.tile];
          const [u0, v0, u1, v1] = tileUV(tile);
          const uvs: [number, number][] = [
            [u0, v0],
            [u1, v0],
            [u1, v1],
            [u0, v1],
          ];

          const light: number[] = [];
          for (let c = 0; c < 4; c++) {
            const [s1, s2] = CORNER_SIGNS[c];
            let ao = 3;
            if (!block.emissive) {
              const side1 = isOpaque(
                world.getForMesh(
                  x + face.dir[0] + face.t1[0] * s1,
                  ly + face.dir[1] + face.t1[1] * s1,
                  z + face.dir[2] + face.t1[2] * s1,
                ),
              )
                ? 1
                : 0;
              const side2 = isOpaque(
                world.getForMesh(
                  x + face.dir[0] + face.t2[0] * s2,
                  ly + face.dir[1] + face.t2[1] * s2,
                  z + face.dir[2] + face.t2[2] * s2,
                ),
              )
                ? 1
                : 0;
              const corner = isOpaque(
                world.getForMesh(
                  x + face.dir[0] + face.t1[0] * s1 + face.t2[0] * s2,
                  ly + face.dir[1] + face.t1[1] * s1 + face.t2[1] * s2,
                  z + face.dir[2] + face.t1[2] * s1 + face.t2[2] * s2,
                ),
              )
                ? 1
                : 0;
              ao = side1 && side2 ? 0 : 3 - (side1 + side2 + corner);
            }
            const shade = block.emissive ? 1 : face.shade;
            light.push(AO_LEVELS[ao] * shade);
          }

          const start = target.pos.length / 3;
          for (let c = 0; c < 4; c++) {
            const corner = face.corners[c];
            let vy = ly + corner[1];
            if (liquidTop && corner[1] === 1) vy = ly + 0.875;
            target.pos.push(x + corner[0], vy, z + corner[2]);
            target.uv.push(uvs[c][0], uvs[c][1]);
            const l = light[c];
            target.color.push(l, l, l);
          }

          // Dreiecke so drehen, dass der AO-Verlauf sauber aussieht
          if (light[0] + light[2] > light[1] + light[3]) {
            target.index.push(start, start + 1, start + 2, start, start + 2, start + 3);
          } else {
            target.index.push(start + 1, start + 2, start + 3, start + 1, start + 3, start);
          }
        }
      }
    }
  }

  return { opaque: toGeometry(solid), transparent: toGeometry(trans) };
}
