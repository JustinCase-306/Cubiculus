import * as THREE from "three";
import { AIR, getBlock } from "./blocks";
import { ATLAS_COLS, ATLAS_ROWS } from "./textures";

const EPS = 0.0012;

function rect(tile: number) {
  const col = tile % ATLAS_COLS;
  const row = (tile / ATLAS_COLS) | 0;
  const u0 = col / ATLAS_COLS + EPS;
  const u1 = (col + 1) / ATLAS_COLS - EPS;
  const v0 = 1 - (row + 1) / ATLAS_ROWS + EPS;
  const v1 = 1 - row / ATLAS_ROWS - EPS;
  return [u0, v0, u1, v1] as const;
}

/** Würfel-Geometrie mit korrekt auf den Atlas gemappten UVs */
export function makeBlockGeometry(id: number, size = 1): THREE.BufferGeometry {
  const b = getBlock(id);
  if (!b || id === AIR) return new THREE.BoxGeometry(size, size, size);
  const geo = new THREE.BoxGeometry(size, size, size);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  // Reihenfolge in BoxGeometry: +x, -x, +y, -y, +z, -z
  const tiles = [b.tiles.side, b.tiles.side, b.tiles.top, b.tiles.bottom, b.tiles.side, b.tiles.side];
  for (let f = 0; f < 6; f++) {
    const [u0, v0, u1, v1] = rect(tiles[f]);
    const map: [number, number][] = [
      [u0, v1],
      [u1, v1],
      [u0, v0],
      [u1, v0],
    ];
    for (let k = 0; k < 4; k++) uv.setXY(f * 4 + k, map[k][0], map[k][1]);
  }
  uv.needsUpdate = true;
  return geo;
}

/** Flaches Quad für Pflanzen */
export function makePlantGeometry(id: number, size = 1): THREE.BufferGeometry {
  const b = getBlock(id);
  const geo = new THREE.PlaneGeometry(size, size);
  const [u0, v0, u1, v1] = rect(b.tiles.top);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const map: [number, number][] = [
    [u0, v1],
    [u1, v1],
    [u0, v0],
    [u1, v0],
  ];
  for (let k = 0; k < 4; k++) uv.setXY(k, map[k][0], map[k][1]);
  uv.needsUpdate = true;
  return geo;
}
