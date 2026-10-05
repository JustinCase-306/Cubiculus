// Prozedural erzeugte 16x16-Pixel-Texturen (kein externes Asset nötig).
import * as THREE from 'three';
import { mulberry32, tileableFbm } from './noise';

export const TILE_PX = 16;
export const ATLAS_COLS = 4;
export const ATLAS_ROWS = 4;

export const T = {
  GRASS_TOP: 0,
  GRASS_SIDE: 1,
  DIRT: 2,
  STONE: 3,
  COBBLE: 4,
  SAND: 5,
  LOG_SIDE: 6,
  LOG_TOP: 7,
  LEAVES: 8,
  PLANKS: 9,
  GLASS: 10,
  WATER: 11,
  BRICK: 12,
  SNOW: 13,
  BEDROCK: 14,
  GLOWSTONE: 15,
} as const;

type Ctx = CanvasRenderingContext2D;
type Painter = (ctx: Ctx, rnd: () => number) => void;

function px(ctx: Ctx, x: number, y: number, r: number, g: number, b: number, a = 1) {
  ctx.fillStyle = `rgba(${Math.max(0, Math.min(255, Math.round(r)))},${Math.max(0, Math.min(255, Math.round(g)))},${Math.max(0, Math.min(255, Math.round(b)))},${a})`;
  ctx.fillRect(x, y, 1, 1);
}

function noisyFill(ctx: Ctx, rnd: () => number, r: number, g: number, b: number, variance: number) {
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      const d = (rnd() - 0.5) * 2 * variance;
      px(ctx, x, y, r + d, g + d * 0.95, b + d * 0.9);
    }
  }
}

const painters: Painter[] = [
  // GRASS_TOP
  (ctx, rnd) => {
    noisyFill(ctx, rnd, 116, 174, 84, 16);
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(rnd() * 16);
      const y = Math.floor(rnd() * 16);
      const dark = rnd() < 0.55;
      px(ctx, x, y, dark ? 92 : 142, dark ? 146 : 194, dark ? 62 : 96);
    }
  },
  // GRASS_SIDE
  (ctx, rnd) => {
    noisyFill(ctx, rnd, 141, 101, 70, 16);
    for (let x = 0; x < 16; x++) {
      const h = 3 + Math.floor(rnd() * 3);
      for (let y = 0; y < h; y++) {
        const d = (rnd() - 0.5) * 24;
        px(ctx, x, y, 112 + d, 170 + d, 80 + d * 0.8);
      }
      if (rnd() < 0.35) {
        const d = (rnd() - 0.5) * 20;
        px(ctx, x, h, 100 + d, 152 + d, 72 + d);
      }
    }
  },
  // DIRT
  (ctx, rnd) => {
    noisyFill(ctx, rnd, 141, 101, 70, 18);
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(rnd() * 16);
      const y = Math.floor(rnd() * 16);
      px(ctx, x, y, 110, 76, 50);
    }
  },
  // STONE
  (ctx, rnd) => {
    noisyFill(ctx, rnd, 131, 131, 134, 14);
    for (let i = 0; i < 16; i++) {
      const x = Math.floor(rnd() * 15);
      const y = Math.floor(rnd() * 16);
      const shade = rnd() < 0.5 ? -24 : 20;
      px(ctx, x, y, 131 + shade, 131 + shade, 134 + shade);
      px(ctx, x + 1, y, 131 + shade * 0.7, 131 + shade * 0.7, 134 + shade * 0.7);
    }
  },
  // COBBLE
  (ctx, rnd) => {
    noisyFill(ctx, rnd, 86, 86, 90, 10);
    for (let i = 0; i < 12; i++) {
      const w = 3 + Math.floor(rnd() * 3);
      const h = 3 + Math.floor(rnd() * 3);
      const x0 = Math.floor(rnd() * (16 - w));
      const y0 = Math.floor(rnd() * (16 - h));
      const base = 118 + rnd() * 42;
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          const edge = y === y0 + h - 1 || x === x0 + w - 1;
          const d = (rnd() - 0.5) * 16 - (edge ? 26 : 0);
          px(ctx, x, y, base + d, base + d, base + d + 4);
        }
      }
    }
  },
  // SAND
  (ctx, rnd) => {
    noisyFill(ctx, rnd, 222, 208, 158, 12);
    for (let i = 0; i < 18; i++) px(ctx, Math.floor(rnd() * 16), Math.floor(rnd() * 16), 198, 182, 134);
  },
  // LOG_SIDE
  (ctx, rnd) => {
    for (let x = 0; x < 16; x++) {
      const stripe = Math.sin(x * 1.6) * 9 + (x % 5 === 2 ? -18 : 0);
      for (let y = 0; y < 16; y++) {
        const d = (rnd() - 0.5) * 12 + stripe;
        px(ctx, x, y, 112 + d, 86 + d * 0.8, 52 + d * 0.6);
      }
    }
  },
  // LOG_TOP
  (ctx, rnd) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = x - 7.5;
        const dy = y - 7.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ring = Math.sin(dist * 2.6) * 0.5 + 0.5;
        const d = (rnd() - 0.5) * 10;
        if (dist > 6.8) px(ctx, x, y, 106 + d, 82 + d, 50 + d);
        else px(ctx, x, y, 138 + ring * 32 + d, 110 + ring * 28 + d, 68 + ring * 22 + d);
      }
    }
  },
  // LEAVES
  (ctx, rnd) => {
    noisyFill(ctx, rnd, 60, 132, 54, 20);
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rnd() * 16);
      const y = Math.floor(rnd() * 16);
      if (rnd() < 0.5) px(ctx, x, y, 36, 88, 36);
      else px(ctx, x, y, 92, 168, 72);
    }
  },
  // PLANKS
  (ctx, rnd) => {
    for (let y = 0; y < 16; y++) {
      const row = Math.floor(y / 4);
      const tone = (row % 2 === 0 ? 6 : -6) + Math.sin(row * 2.3) * 4;
      const seam = (row * 5 + 3) % 16;
      for (let x = 0; x < 16; x++) {
        let d = (rnd() - 0.5) * 9 + tone;
        if (y % 4 === 3) d -= 46;
        if (x === seam) d -= 40;
        px(ctx, x, y, 168 + d, 136 + d * 0.9, 86 + d * 0.7);
      }
    }
  },
  // GLASS
  (ctx, rnd) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const border = x === 0 || y === 0 || x === 15 || y === 15;
        if (border) px(ctx, x, y, 208, 232, 240, 0.85);
        else if (rnd() < 0.04) px(ctx, x, y, 255, 255, 255, 0.35);
        else px(ctx, x, y, 200, 228, 238, 0.1);
      }
    }
    for (let i = 3; i < 9; i++) px(ctx, i, 12 - i, 255, 255, 255, 0.5);
    for (let i = 3; i < 7; i++) px(ctx, i + 1, 13 - i, 255, 255, 255, 0.3);
  },
  // WATER
  (ctx, rnd) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const wave = Math.sin((x + y * 0.7) * 0.85) * 12 + Math.sin(y * 1.3) * 6;
        const d = (rnd() - 0.5) * 8 + wave;
        px(ctx, x, y, 48 + d * 0.5, 104 + d * 0.8, 196 + d, 0.82);
      }
    }
  },
  // BRICK
  (ctx, rnd) => {
    for (let y = 0; y < 16; y++) {
      const row = Math.floor(y / 4);
      for (let x = 0; x < 16; x++) {
        const mortarH = y % 4 === 0;
        const mortarV = (x + (row % 2) * 4) % 8 === 0;
        if (mortarH || mortarV) {
          const d = (rnd() - 0.5) * 8;
          px(ctx, x, y, 178 + d, 170 + d, 162 + d);
        } else {
          const d = (rnd() - 0.5) * 14;
          px(ctx, x, y, 152 + d, 78 + d * 0.7, 60 + d * 0.6);
        }
      }
    }
  },
  // SNOW
  (ctx, rnd) => {
    noisyFill(ctx, rnd, 244, 249, 253, 7);
    for (let i = 0; i < 14; i++) px(ctx, Math.floor(rnd() * 16), Math.floor(rnd() * 16), 222, 234, 248);
  },
  // BEDROCK
  (ctx, rnd) => {
    noisyFill(ctx, rnd, 84, 84, 88, 22);
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(rnd() * 16);
      const y = Math.floor(rnd() * 16);
      const dark = rnd() < 0.6;
      px(ctx, x, y, dark ? 44 : 126, dark ? 44 : 126, dark ? 48 : 130);
    }
  },
  // GLOWSTONE
  (ctx, rnd) => {
    noisyFill(ctx, rnd, 152, 116, 58, 14);
    for (let i = 0; i < 11; i++) {
      const x = Math.floor(rnd() * 14);
      const y = Math.floor(rnd() * 14);
      px(ctx, x, y, 255, 228, 146);
      px(ctx, x + 1, y, 246, 210, 120);
      px(ctx, x, y + 1, 246, 210, 120);
      px(ctx, x + 1, y + 1, 232, 188, 100);
    }
  },
];

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

let tileCanvases: HTMLCanvasElement[] | null = null;
let atlasTexture: THREE.CanvasTexture | null = null;
let averages: [number, number, number][] | null = null;

function buildTiles() {
  if (tileCanvases) return tileCanvases;
  tileCanvases = painters.map((paint, i) => {
    const c = makeCanvas(TILE_PX, TILE_PX);
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    paint(ctx, mulberry32(1337 + i * 977));
    return c;
  });
  return tileCanvases;
}

export function getTileCanvas(tile: number): HTMLCanvasElement {
  return buildTiles()[tile];
}

export function getAtlasTexture(): THREE.CanvasTexture {
  if (atlasTexture) return atlasTexture;
  const tiles = buildTiles();
  const atlas = makeCanvas(ATLAS_COLS * TILE_PX, ATLAS_ROWS * TILE_PX);
  const ctx = atlas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  tiles.forEach((tileCanvas, i) => {
    const col = i % ATLAS_COLS;
    const row = Math.floor(i / ATLAS_COLS);
    ctx.drawImage(tileCanvas, col * TILE_PX, row * TILE_PX);
  });
  const tex = new THREE.CanvasTexture(atlas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  atlasTexture = tex;
  return tex;
}

/** UV-Rechteck [u0, v0, u1, v1] einer Kachel im Atlas. */
export function tileUV(tile: number): [number, number, number, number] {
  const col = tile % ATLAS_COLS;
  const row = Math.floor(tile / ATLAS_COLS);
  const e = 0.0008;
  const u0 = col / ATLAS_COLS + e;
  const u1 = (col + 1) / ATLAS_COLS - e;
  const v1 = 1 - row / ATLAS_ROWS - e;
  const v0 = 1 - (row + 1) / ATLAS_ROWS + e;
  return [u0, v0, u1, v1];
}

export function tileAverageColor(tile: number): [number, number, number] {
  if (!averages) averages = [];
  const cached = averages[tile];
  if (cached) return cached;
  const ctx = getTileCanvas(tile).getContext('2d')!;
  const data = ctx.getImageData(0, 0, TILE_PX, TILE_PX).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255;
    if (a < 0.15) continue;
    r += data[i] * a;
    g += data[i + 1] * a;
    b += data[i + 2] * a;
    n += a;
  }
  if (n === 0) n = 1;
  const avg: [number, number, number] = [r / n / 255, g / n / 255, b / n / 255];
  averages[tile] = avg;
  return avg;
}

function shaded(tile: number, factor: number): HTMLCanvasElement {
  const src = getTileCanvas(tile);
  const c = makeCanvas(TILE_PX, TILE_PX);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  if (factor < 1) ctx.fillStyle = `rgba(0,0,0,${1 - factor})`;
  else ctx.fillStyle = `rgba(255,255,255,${factor - 1})`;
  ctx.fillRect(0, 0, TILE_PX, TILE_PX);
  return c;
}

/** Isometrisches Würfel-Icon als Data-URL (für Hotbar & Inventar). */
export function makeBlockIcon(topTile: number, sideTile: number, size = 48): string {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const s = size / 48;
  const top = shaded(topTile, 1);
  const left = shaded(sideTile, 0.62);
  const right = shaded(sideTile, 0.82);

  // Deckfläche: Raute L(6,15) -> T(24,6) -> R(42,15) -> B(24,24)
  ctx.save();
  ctx.transform((18 * s) / 16, (-9 * s) / 16, (18 * s) / 16, (9 * s) / 16, 6 * s, 15 * s);
  ctx.drawImage(top, 0, 0, TILE_PX, TILE_PX);
  ctx.restore();

  // Linke Seite
  ctx.save();
  ctx.transform((18 * s) / 16, (9 * s) / 16, 0, (18 * s) / 16, 6 * s, 15 * s);
  ctx.drawImage(left, 0, 0, TILE_PX, TILE_PX);
  ctx.restore();

  // Rechte Seite
  ctx.save();
  ctx.transform((18 * s) / 16, (-9 * s) / 16, 0, (18 * s) / 16, 24 * s, 24 * s);
  ctx.drawImage(right, 0, 0, TILE_PX, TILE_PX);
  ctx.restore();

  return c.toDataURL();
}

let waterTexture: THREE.CanvasTexture | null = null;

/** Eigenständige, kachelbare Wassertextur für das Meer außerhalb der Welt. */
export function getWaterTexture(): THREE.CanvasTexture {
  if (waterTexture) return waterTexture;
  const tex = new THREE.CanvasTexture(getTileCanvas(T.WATER));
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  waterTexture = tex;
  return tex;
}

export function makeCloudTexture(): THREE.CanvasTexture {
  const size = 128;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = tileableFbm((x / size) * 8, (y / size) * 8, 8, 4242, 4);
      const a = Math.max(0, Math.min(1, (n - 0.53) * 4.5));
      const i = (y * size + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(a * 235);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
