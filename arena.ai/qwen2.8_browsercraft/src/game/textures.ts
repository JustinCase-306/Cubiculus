import * as THREE from "three";

/* ============================================================
   Prozeduraler Pixel-Textur-Atlas (16x16 Kacheln)
   Alles wird zur Laufzeit gemalt – keine externen Assets.
   ============================================================ */

export const TILE = 16;
export const ATLAS_COLS = 8;
export const ATLAS_ROWS = 4;

export const TILES = {
  grassTop: 0,
  grassSide: 1,
  dirt: 2,
  stone: 3,
  cobble: 4,
  sand: 5,
  logSide: 6,
  logTop: 7,
  leaves: 8,
  planks: 9,
  bricks: 10,
  water: 11,
  glass: 12,
  coal: 13,
  iron: 14,
  gold: 15,
  gravel: 16,
  snow: 17,
  bedrock: 18,
  glowstone: 19,
  mossy: 20,
  pumpkin: 21,
  tallgrass: 22,
  poppy: 23,
  dandelion: 24,
} as const;

type RGBA = [number, number, number, number];

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cl = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);

class Atlas {
  readonly w = TILE * ATLAS_COLS;
  readonly h = TILE * ATLAS_ROWS;
  readonly data: Uint8ClampedArray;

  constructor() {
    this.data = new Uint8ClampedArray(this.w * this.h * 4);
  }

  px(tile: number, x: number, y: number, c: RGBA) {
    if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
    const tx = tile % ATLAS_COLS;
    const ty = (tile / ATLAS_COLS) | 0;
    const i = ((ty * TILE + y) * this.w + (tx * TILE + x)) * 4;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
    this.data[i + 3] = c[3];
  }

  get(tile: number, x: number, y: number): RGBA {
    const tx = tile % ATLAS_COLS;
    const ty = (tile / ATLAS_COLS) | 0;
    const i = ((ty * TILE + y) * this.w + (tx * TILE + x)) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }

  fill(tile: number, fn: (x: number, y: number, rnd: () => number) => RGBA) {
    const rnd = mulberry32(tile * 7919 + 13);
    for (let y = 0; y < TILE; y++)
      for (let x = 0; x < TILE; x++) this.px(tile, x, y, fn(x, y, rnd));
  }

  blobs(tile: number, rnd: () => number, color: RGBA, count: number, r: number) {
    for (let i = 0; i < count; i++) {
      const cx = 1 + rnd() * (TILE - 2);
      const cy = 1 + rnd() * (TILE - 2);
      const rr = r * (0.6 + rnd() * 0.8);
      for (let y = 0; y < TILE; y++)
        for (let x = 0; x < TILE; x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
          if (d < rr) {
            const n = (rnd() * 2 - 1) * 14;
            this.px(tile, x, y, [cl(color[0] + n), cl(color[1] + n), cl(color[2] + n), color[3]]);
          }
        }
    }
  }

  /** Voronoi-Muster – perfekt für Kopfsteinpflaster / Kies / Bedrock */
  voronoi(tile: number, palette: RGBA[], seed: number, dark: RGBA, edge = 1.1) {
    const rnd = mulberry32(seed);
    const pts: { x: number; y: number; c: RGBA }[] = [];
    const n = palette.length * 2;
    for (let i = 0; i < n; i++)
      pts.push({
        x: rnd() * TILE,
        y: rnd() * TILE,
        c: palette[(rnd() * palette.length) | 0],
      });
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        let d1 = 1e9,
          d2 = 1e9,
          c = palette[0];
        for (const p of pts) {
          const d = Math.min(
            Math.hypot(x - p.x, y - p.y),
            Math.hypot(x - p.x + TILE, y - p.y),
            Math.hypot(x - p.x - TILE, y - p.y),
            Math.hypot(x - p.x, y - p.y + TILE),
            Math.hypot(x - p.x, y - p.y - TILE)
          );
          if (d < d1) {
            d2 = d1;
            d1 = d;
            c = p.c;
          } else if (d < d2) d2 = d;
        }
        const mortar = d2 - d1 < edge;
        const v = (rnd() * 2 - 1) * 9;
        const base = mortar ? dark : c;
        this.px(tile, x, y, [cl(base[0] + v), cl(base[1] + v), cl(base[2] + v), 255]);
      }
    }
  }

  clear(tile: number) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) this.px(tile, x, y, [0, 0, 0, 0]);
  }

  toCanvas(): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(this.w, this.h);
    img.data.set(this.data);
    ctx.putImageData(img, 0, 0);
    return c;
  }
}

const stoneBase = (_x: number, _y: number, rnd: () => number): RGBA => {
  const v = (rnd() * 2 - 1) * 11;
  return [cl(127 + v), cl(127 + v), cl(129 + v), 255];
};

function paintAtlas(a: Atlas) {
  // --- Gras oben ---
  a.fill(TILES.grassTop, (_x, _y, rnd) => {
    const v = (rnd() * 2 - 1) * 20;
    const warm = rnd() < 0.12 ? 16 : 0;
    return [cl(98 + v + warm), cl(164 + v), cl(60 + v - warm * 0.4), 255];
  });

  // --- Gras Seite (Erde mit Grasrand) ---
  a.fill(TILES.dirt, (_x, _y, rnd) => {
    const v = (rnd() * 2 - 1) * 17;
    const dark = rnd() < 0.1 ? -22 : 0;
    return [cl(134 + v + dark), cl(97 + v * 0.8 + dark), cl(67 + v * 0.6 + dark), 255];
  });
  {
    const rnd = mulberry32(99);
    const depth: number[] = [];
    for (let x = 0; x < TILE; x++) depth.push(3 + ((rnd() * 3) | 0));
    for (let y = 0; y < TILE; y++)
      for (let x = 0; x < TILE; x++) {
        const d = a.get(TILES.dirt, x, y);
        if (y < depth[x]) {
          const v = (rnd() * 2 - 1) * 18;
          a.px(TILES.grassSide, x, y, [cl(96 + v), cl(160 + v), cl(58 + v), 255]);
        } else if (y === depth[x] && rnd() < 0.5) {
          a.px(TILES.grassSide, x, y, [cl(d[0] - 18), cl(d[1] + 24), cl(d[2] - 12), 255]);
        } else a.px(TILES.grassSide, x, y, d);
      }
  }

  // --- Stein ---
  a.fill(TILES.stone, stoneBase);
  a.blobs(TILES.stone, mulberry32(5), [104, 104, 108, 255], 4, 1.9);

  // --- Kopfsteinpflaster ---
  a.voronoi(
    TILES.cobble,
    [
      [132, 132, 134, 255],
      [114, 114, 118, 255],
      [148, 148, 148, 255],
      [100, 100, 106, 255],
    ],
    21,
    [72, 72, 76, 255],
    1.3
  );

  // --- Moosiges Kopfsteinpflaster ---
  a.voronoi(
    TILES.mossy,
    [
      [120, 130, 110, 255],
      [96, 122, 78, 255],
      [140, 142, 132, 255],
      [86, 116, 66, 255],
    ],
    21,
    [62, 74, 56, 255],
    1.3
  );

  // --- Sand ---
  a.fill(TILES.sand, (_x, _y, rnd) => {
    const v = (rnd() * 2 - 1) * 12;
    return [cl(222 + v), cl(209 + v), cl(163 + v), 255];
  });

  // --- Stamm ---
  a.fill(TILES.logSide, (x, _y, rnd) => {
    const stripe = [0, -12, 8, -6, 14, -14, 4, -8][x % 8];
    const v = (rnd() * 2 - 1) * 8;
    const edge = x === 0 || x === 15 ? -26 : 0;
    return [cl(107 + stripe + v + edge), cl(84 + stripe * 0.8 + v + edge), cl(51 + v + edge), 255];
  });
  a.fill(TILES.logTop, (x, y, rnd) => {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d > 7.2) return [78, 60, 36, 255];
    const ring = ((d * 1.5) | 0) % 2 === 0;
    const v = (rnd() * 2 - 1) * 8;
    return ring ? [cl(168 + v), cl(134 + v), cl(82 + v), 255] : [cl(138 + v), cl(108 + v), cl(64 + v), 255];
  });

  // --- Laub (mit Löchern -> cutout) ---
  a.fill(TILES.leaves, (_x, _y, rnd) => {
    if (rnd() < 0.13) return [0, 0, 0, 0];
    const v = (rnd() * 2 - 1) * 26;
    const lit = rnd() < 0.16 ? 26 : 0;
    return [cl(52 + v * 0.5 + lit * 0.4), cl(118 + v + lit), cl(44 + v * 0.5), 255];
  });

  // --- Bretter ---
  a.fill(TILES.planks, (x, y, rnd) => {
    const board = (y / 4) | 0;
    const shade = [0, 9, -8, 4][board % 4];
    const v = (rnd() * 2 - 1) * 9;
    if (y % 4 === 3) return [cl(112 + v), cl(88 + v), cl(52 + v), 255];
    if ((x + board * 5) % 16 === 0) return [cl(118 + v), cl(94 + v), cl(56 + v), 255];
    return [cl(178 + shade + v), cl(144 + shade + v), cl(90 + shade + v), 255];
  });

  // --- Ziegel ---
  a.fill(TILES.bricks, (x, y, rnd) => {
    const row = (y / 4) | 0;
    const off = row % 2 === 0 ? 0 : 4;
    const v = (rnd() * 2 - 1) * 12;
    if (y % 4 === 3 || (x + off) % 8 === 7)
      return [cl(190 + v * 0.4), cl(186 + v * 0.4), cl(180 + v * 0.4), 255];
    return [cl(152 + v), cl(74 + v * 0.7), cl(60 + v * 0.6), 255];
  });

  // --- Wasser ---
  a.fill(TILES.water, (x, y, rnd) => {
    const wave = Math.sin((x + y * 0.6) * 0.9) * 12;
    const v = (rnd() * 2 - 1) * 6;
    return [cl(44 + wave * 0.4 + v), cl(108 + wave + v), cl(196 + wave * 0.6 + v), 196];
  });

  // --- Glas ---
  a.fill(TILES.glass, (x, y, rnd) => {
    const border = x === 0 || y === 0 || x === TILE - 1 || y === TILE - 1;
    if (border) return [206, 232, 240, 255];
    if (x === 1 || y === 1 || x === TILE - 2 || y === TILE - 2) return [178, 214, 226, 120];
    if (x + y > 8 && x + y < 11) return [255, 255, 255, 70];
    if (x + y > 17 && x + y < 19) return [255, 255, 255, 48];
    void rnd;
    return [230, 245, 250, 22];
  });

  // --- Erze ---
  a.fill(TILES.coal, stoneBase);
  a.blobs(TILES.coal, mulberry32(31), [26, 26, 28, 255], 4, 2.3);
  a.fill(TILES.iron, stoneBase);
  a.blobs(TILES.iron, mulberry32(37), [214, 164, 122, 255], 4, 2.1);
  a.fill(TILES.gold, stoneBase);
  a.blobs(TILES.gold, mulberry32(43), [250, 214, 74, 255], 4, 2.0);

  // --- Kies ---
  a.voronoi(
    TILES.gravel,
    [
      [136, 128, 122, 255],
      [108, 102, 98, 255],
      [154, 146, 140, 255],
      [92, 84, 82, 255],
    ],
    57,
    [76, 70, 68, 255],
    1.0
  );

  // --- Schnee ---
  a.fill(TILES.snow, (_x, _y, rnd) => {
    const v = (rnd() * 2 - 1) * 7;
    const spark = rnd() < 0.04 ? 12 : 0;
    return [cl(236 + v + spark), cl(244 + v + spark), cl(250 + v), 255];
  });

  // --- Bedrock ---
  a.voronoi(
    TILES.bedrock,
    [
      [66, 66, 70, 255],
      [42, 42, 46, 255],
      [92, 92, 96, 255],
      [28, 28, 32, 255],
    ],
    71,
    [20, 20, 22, 255],
    1.2
  );

  // --- Leuchtstein ---
  a.fill(TILES.glowstone, (x, y, rnd) => {
    const v = (rnd() * 2 - 1) * 14;
    const cell = (((x / 4) | 0) + ((y / 4) | 0)) % 2 === 0;
    const base = cell ? [226, 178, 96] : [250, 220, 140];
    if (rnd() < 0.08) return [255, 246, 200, 255];
    return [cl(base[0] + v), cl(base[1] + v), cl(base[2] + v), 255];
  });

  // --- Kürbis ---
  a.fill(TILES.pumpkin, (x, _y, rnd) => {
    const ridge = Math.cos((x / TILE) * Math.PI * 4) * 22;
    const v = (rnd() * 2 - 1) * 8;
    return [cl(206 + ridge + v), cl(122 + ridge * 0.6 + v), cl(38 + v), 255];
  });

  // --- Pflanzen (cross-quads, cutout) ---
  const stem = (tile: number, x0: number, h: number, col: RGBA) => {
    for (let y = TILE - 1; y > TILE - 1 - h; y--) {
      const x = x0 + (y % 3 === 0 ? 1 : 0);
      a.px(tile, x, y, col);
      if (y % 4 === 0) a.px(tile, x - 1, y, [cl(col[0] - 20), cl(col[1] + 10), cl(col[2] - 20), 255]);
    }
  };

  // hohes Gras
  {
    const rnd = mulberry32(101);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) a.px(TILES.tallgrass, x, y, [0, 0, 0, 0]);
    for (let i = 0; i < 6; i++) {
      const x0 = 1 + ((rnd() * 13) | 0);
      const h = 7 + ((rnd() * 7) | 0);
      const bend = rnd() < 0.5 ? -1 : 1;
      for (let y = 0; y < h; y++) {
        const yy = TILE - 1 - y;
        const xx = x0 + (y > h - 3 ? bend : 0);
        const g = 120 + ((rnd() * 60) | 0);
        a.px(TILES.tallgrass, xx, yy, [cl(g * 0.45), cl(g), cl(g * 0.35), 255]);
      }
    }
  }
  // Mohn
  a.clear(TILES.poppy);
  stem(TILES.poppy, 7, 12, [58, 128, 48, 255]);
  for (let y = 2; y < 8; y++)
    for (let x = 4; x < 12; x++) {
      const d = Math.hypot(x - 7.5, y - 4.6);
      if (d < 3.2) a.px(TILES.poppy, x, y, [cl(208 - d * 16), cl(46 + d * 5), 40, 255]);
    }
  a.px(TILES.poppy, 7, 4, [40, 26, 20, 255]);
  a.px(TILES.poppy, 8, 5, [40, 26, 20, 255]);

  // Löwenzahn
  a.clear(TILES.dandelion);
  stem(TILES.dandelion, 7, 12, [62, 134, 50, 255]);
  for (let y = 2; y < 8; y++)
    for (let x = 4; x < 12; x++) {
      const d = Math.hypot(x - 7.5, y - 4.6);
      if (d < 3.0) a.px(TILES.dandelion, x, y, [cl(248 - d * 10), cl(214 - d * 12), cl(58 + d * 8), 255]);
    }
  a.px(TILES.dandelion, 7, 4, [196, 156, 32, 255]);
}

/** Baut den Atlas und liefert Canvas + THREE-Textur */
export function buildAtlas() {
  const a = new Atlas();
  paintAtlas(a);
  const canvas = a.toCanvas();
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return { canvas, texture, atlas: a };
}

/** Gemeinsamer Atlas (wird nur einmal gebaut) */
let shared: { canvas: HTMLCanvasElement; texture: THREE.Texture; atlas: Atlas } | null = null;
export function getAtlas() {
  if (!shared) shared = buildAtlas();
  return shared;
}

/** Eine einzelne Kachel als eigener Canvas (für Icons) */
export function tileCanvas(canvas: HTMLCanvasElement, tile: number, scale = 1) {
  const c = document.createElement("canvas");
  c.width = TILE * scale;
  c.height = TILE * scale;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const tx = (tile % ATLAS_COLS) * TILE;
  const ty = ((tile / ATLAS_COLS) | 0) * TILE;
  ctx.drawImage(canvas, tx, ty, TILE, TILE, 0, 0, TILE * scale, TILE * scale);
  return c;
}

/** Isometrisches Block-Icon (wie im Minecraft-Inventar) */
export function blockIconURL(
  canvas: HTMLCanvasElement,
  tiles: { top: number; side: number; bottom?: number },
  size = 64
): string {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  const s = size * 0.37;
  const cx = size / 2;
  const cy = size / 2 + s * 0.25;

  const face = (tile: number, A: number[], B: number[], D: number[], shade: number) => {
    const img = tileCanvas(canvas, tile, 1);
    ctx.save();
    ctx.setTransform((B[0] - A[0]) / TILE, (B[1] - A[1]) / TILE, (D[0] - A[0]) / TILE, (D[1] - A[1]) / TILE, A[0], A[1]);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    if (shade !== 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(A[0], A[1]);
      ctx.lineTo(B[0], B[1]);
      const C = [B[0] + D[0] - A[0], B[1] + D[1] - A[1]];
      ctx.lineTo(C[0], C[1]);
      ctx.lineTo(D[0], D[1]);
      ctx.closePath();
      ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
      ctx.fill();
      ctx.restore();
    }
    void s;
  };

  // Oberseite
  face(tiles.top, [cx - s, cy - s * 0.5], [cx, cy - s], [cx, cy], 0.1);
  // links
  face(tiles.side, [cx - s, cy - s * 0.5], [cx, cy], [cx - s, cy + s * 0.5], -0.28);
  // rechts
  face(tiles.side, [cx, cy], [cx + s, cy - s * 0.5], [cx + s, cy + s * 0.5], -0.1);

  return c.toDataURL();
}

/** Wolkentextur (flache Minecraft-Wolken) */
export function cloudTexture() {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  const rnd = mulberry32(1234);
  const grid = 8;
  const cells: number[] = [];
  for (let i = 0; i < (S / grid) * (S / grid); i++) cells.push(rnd());
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const gx = ((x / grid) | 0) % (S / grid);
      const gy = ((y / grid) | 0) % (S / grid);
      const v = cells[gy * (S / grid) + gx];
      const on = v > 0.58;
      const i = (y * S + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = on ? 225 : 0;
    }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** Quadratische Sonne / Mond (Minecraft-Style) */
export function sunTexture(moon = false) {
  const S = 32;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  const rnd = mulberry32(moon ? 77 : 42);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const v = rnd() * 24;
      if (moon) {
        const d = Math.hypot(x - 16, y - 16);
        const crater = Math.hypot(x - 11, y - 20) < 3.4 || Math.hypot(x - 22, y - 12) < 2.6;
        img.data[i] = crater ? 190 : 228 - v * 0.3;
        img.data[i + 1] = crater ? 196 : 234 - v * 0.3;
        img.data[i + 2] = crater ? 210 : 246;
        img.data[i + 3] = d > 15.6 ? 0 : 255;
      } else {
        img.data[i] = 255;
        img.data[i + 1] = 240 - v;
        img.data[i + 2] = 160 - v * 2;
        img.data[i + 3] = 255;
      }
    }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}
