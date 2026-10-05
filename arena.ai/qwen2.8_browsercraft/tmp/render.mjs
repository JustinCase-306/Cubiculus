var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/game/textures.ts
var textures_exports = {};
__export(textures_exports, {
  ATLAS_COLS: () => ATLAS_COLS,
  ATLAS_ROWS: () => ATLAS_ROWS,
  TILE: () => TILE,
  TILES: () => TILES,
  blockIconURL: () => blockIconURL,
  buildAtlas: () => buildAtlas,
  cloudTexture: () => cloudTexture,
  getAtlas: () => getAtlas,
  sunTexture: () => sunTexture,
  tileCanvas: () => tileCanvas
});
import * as THREE from "three";
function mulberry32(a) {
  return function() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function paintAtlas(a) {
  a.fill(TILES.grassTop, (_x, _y, rnd) => {
    const v = (rnd() * 2 - 1) * 20;
    const warm = rnd() < 0.12 ? 16 : 0;
    return [cl(98 + v + warm), cl(164 + v), cl(60 + v - warm * 0.4), 255];
  });
  a.fill(TILES.dirt, (_x, _y, rnd) => {
    const v = (rnd() * 2 - 1) * 17;
    const dark = rnd() < 0.1 ? -22 : 0;
    return [cl(134 + v + dark), cl(97 + v * 0.8 + dark), cl(67 + v * 0.6 + dark), 255];
  });
  {
    const rnd = mulberry32(99);
    const depth = [];
    for (let x = 0; x < TILE; x++) depth.push(3 + (rnd() * 3 | 0));
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
  a.fill(TILES.stone, stoneBase);
  a.blobs(TILES.stone, mulberry32(5), [104, 104, 108, 255], 4, 1.9);
  a.voronoi(
    TILES.cobble,
    [
      [132, 132, 134, 255],
      [114, 114, 118, 255],
      [148, 148, 148, 255],
      [100, 100, 106, 255]
    ],
    21,
    [72, 72, 76, 255],
    1.3
  );
  a.voronoi(
    TILES.mossy,
    [
      [120, 130, 110, 255],
      [96, 122, 78, 255],
      [140, 142, 132, 255],
      [86, 116, 66, 255]
    ],
    21,
    [62, 74, 56, 255],
    1.3
  );
  a.fill(TILES.sand, (_x, _y, rnd) => {
    const v = (rnd() * 2 - 1) * 12;
    return [cl(222 + v), cl(209 + v), cl(163 + v), 255];
  });
  a.fill(TILES.logSide, (x, _y, rnd) => {
    const stripe = [0, -12, 8, -6, 14, -14, 4, -8][x % 8];
    const v = (rnd() * 2 - 1) * 8;
    const edge = x === 0 || x === 15 ? -26 : 0;
    return [cl(107 + stripe + v + edge), cl(84 + stripe * 0.8 + v + edge), cl(51 + v + edge), 255];
  });
  a.fill(TILES.logTop, (x, y, rnd) => {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d > 7.2) return [78, 60, 36, 255];
    const ring = (d * 1.5 | 0) % 2 === 0;
    const v = (rnd() * 2 - 1) * 8;
    return ring ? [cl(168 + v), cl(134 + v), cl(82 + v), 255] : [cl(138 + v), cl(108 + v), cl(64 + v), 255];
  });
  a.fill(TILES.leaves, (_x, _y, rnd) => {
    if (rnd() < 0.13) return [0, 0, 0, 0];
    const v = (rnd() * 2 - 1) * 26;
    const lit = rnd() < 0.16 ? 26 : 0;
    return [cl(52 + v * 0.5 + lit * 0.4), cl(118 + v + lit), cl(44 + v * 0.5), 255];
  });
  a.fill(TILES.planks, (x, y, rnd) => {
    const board = y / 4 | 0;
    const shade = [0, 9, -8, 4][board % 4];
    const v = (rnd() * 2 - 1) * 9;
    if (y % 4 === 3) return [cl(112 + v), cl(88 + v), cl(52 + v), 255];
    if ((x + board * 5) % 16 === 0) return [cl(118 + v), cl(94 + v), cl(56 + v), 255];
    return [cl(178 + shade + v), cl(144 + shade + v), cl(90 + shade + v), 255];
  });
  a.fill(TILES.bricks, (x, y, rnd) => {
    const row = y / 4 | 0;
    const off = row % 2 === 0 ? 0 : 4;
    const v = (rnd() * 2 - 1) * 12;
    if (y % 4 === 3 || (x + off) % 8 === 7)
      return [cl(190 + v * 0.4), cl(186 + v * 0.4), cl(180 + v * 0.4), 255];
    return [cl(152 + v), cl(74 + v * 0.7), cl(60 + v * 0.6), 255];
  });
  a.fill(TILES.water, (x, y, rnd) => {
    const wave = Math.sin((x + y * 0.6) * 0.9) * 12;
    const v = (rnd() * 2 - 1) * 6;
    return [cl(44 + wave * 0.4 + v), cl(108 + wave + v), cl(196 + wave * 0.6 + v), 196];
  });
  a.fill(TILES.glass, (x, y, rnd) => {
    const border = x === 0 || y === 0 || x === TILE - 1 || y === TILE - 1;
    if (border) return [206, 232, 240, 255];
    if (x === 1 || y === 1 || x === TILE - 2 || y === TILE - 2) return [178, 214, 226, 120];
    if (x + y > 8 && x + y < 11) return [255, 255, 255, 70];
    if (x + y > 17 && x + y < 19) return [255, 255, 255, 48];
    void rnd;
    return [230, 245, 250, 22];
  });
  a.fill(TILES.coal, stoneBase);
  a.blobs(TILES.coal, mulberry32(31), [26, 26, 28, 255], 4, 2.3);
  a.fill(TILES.iron, stoneBase);
  a.blobs(TILES.iron, mulberry32(37), [214, 164, 122, 255], 4, 2.1);
  a.fill(TILES.gold, stoneBase);
  a.blobs(TILES.gold, mulberry32(43), [250, 214, 74, 255], 4, 2);
  a.voronoi(
    TILES.gravel,
    [
      [136, 128, 122, 255],
      [108, 102, 98, 255],
      [154, 146, 140, 255],
      [92, 84, 82, 255]
    ],
    57,
    [76, 70, 68, 255],
    1
  );
  a.fill(TILES.snow, (_x, _y, rnd) => {
    const v = (rnd() * 2 - 1) * 7;
    const spark = rnd() < 0.04 ? 12 : 0;
    return [cl(236 + v + spark), cl(244 + v + spark), cl(250 + v), 255];
  });
  a.voronoi(
    TILES.bedrock,
    [
      [66, 66, 70, 255],
      [42, 42, 46, 255],
      [92, 92, 96, 255],
      [28, 28, 32, 255]
    ],
    71,
    [20, 20, 22, 255],
    1.2
  );
  a.fill(TILES.glowstone, (x, y, rnd) => {
    const v = (rnd() * 2 - 1) * 14;
    const cell = ((x / 4 | 0) + (y / 4 | 0)) % 2 === 0;
    const base = cell ? [226, 178, 96] : [250, 220, 140];
    if (rnd() < 0.08) return [255, 246, 200, 255];
    return [cl(base[0] + v), cl(base[1] + v), cl(base[2] + v), 255];
  });
  a.fill(TILES.pumpkin, (x, _y, rnd) => {
    const ridge = Math.cos(x / TILE * Math.PI * 4) * 22;
    const v = (rnd() * 2 - 1) * 8;
    return [cl(206 + ridge + v), cl(122 + ridge * 0.6 + v), cl(38 + v), 255];
  });
  const stem = (tile, x0, h, col) => {
    for (let y = TILE - 1; y > TILE - 1 - h; y--) {
      const x = x0 + (y % 3 === 0 ? 1 : 0);
      a.px(tile, x, y, col);
      if (y % 4 === 0) a.px(tile, x - 1, y, [cl(col[0] - 20), cl(col[1] + 10), cl(col[2] - 20), 255]);
    }
  };
  {
    const rnd = mulberry32(101);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) a.px(TILES.tallgrass, x, y, [0, 0, 0, 0]);
    for (let i2 = 0; i2 < 6; i2++) {
      const x0 = 1 + (rnd() * 13 | 0);
      const h = 7 + (rnd() * 7 | 0);
      const bend = rnd() < 0.5 ? -1 : 1;
      for (let y = 0; y < h; y++) {
        const yy = TILE - 1 - y;
        const xx = x0 + (y > h - 3 ? bend : 0);
        const g = 120 + (rnd() * 60 | 0);
        a.px(TILES.tallgrass, xx, yy, [cl(g * 0.45), cl(g), cl(g * 0.35), 255]);
      }
    }
  }
  a.clear(TILES.poppy);
  stem(TILES.poppy, 7, 12, [58, 128, 48, 255]);
  for (let y = 2; y < 8; y++)
    for (let x = 4; x < 12; x++) {
      const d = Math.hypot(x - 7.5, y - 4.6);
      if (d < 3.2) a.px(TILES.poppy, x, y, [cl(208 - d * 16), cl(46 + d * 5), 40, 255]);
    }
  a.px(TILES.poppy, 7, 4, [40, 26, 20, 255]);
  a.px(TILES.poppy, 8, 5, [40, 26, 20, 255]);
  a.clear(TILES.dandelion);
  stem(TILES.dandelion, 7, 12, [62, 134, 50, 255]);
  for (let y = 2; y < 8; y++)
    for (let x = 4; x < 12; x++) {
      const d = Math.hypot(x - 7.5, y - 4.6);
      if (d < 3) a.px(TILES.dandelion, x, y, [cl(248 - d * 10), cl(214 - d * 12), cl(58 + d * 8), 255]);
    }
  a.px(TILES.dandelion, 7, 4, [196, 156, 32, 255]);
}
function buildAtlas() {
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
function getAtlas() {
  if (!shared) shared = buildAtlas();
  return shared;
}
function tileCanvas(canvas, tile, scale = 1) {
  const c = document.createElement("canvas");
  c.width = TILE * scale;
  c.height = TILE * scale;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const tx = tile % ATLAS_COLS * TILE;
  const ty = (tile / ATLAS_COLS | 0) * TILE;
  ctx.drawImage(canvas, tx, ty, TILE, TILE, 0, 0, TILE * scale, TILE * scale);
  return c;
}
function blockIconURL(canvas, tiles, size2 = 64) {
  const c = document.createElement("canvas");
  c.width = size2;
  c.height = size2;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const s = size2 * 0.37;
  const cx = size2 / 2;
  const cy = size2 / 2 + s * 0.25;
  const face = (tile, A, B, D, shade) => {
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
  face(tiles.top, [cx - s, cy - s * 0.5], [cx, cy - s], [cx, cy], 0.1);
  face(tiles.side, [cx - s, cy - s * 0.5], [cx, cy], [cx - s, cy + s * 0.5], -0.28);
  face(tiles.side, [cx, cy], [cx + s, cy - s * 0.5], [cx + s, cy + s * 0.5], -0.1);
  return c.toDataURL();
}
function cloudTexture() {
  const S2 = 128;
  const c = document.createElement("canvas");
  c.width = S2;
  c.height = S2;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(S2, S2);
  const rnd = mulberry32(1234);
  const grid = 8;
  const cells = [];
  for (let i2 = 0; i2 < S2 / grid * (S2 / grid); i2++) cells.push(rnd());
  for (let y = 0; y < S2; y++)
    for (let x = 0; x < S2; x++) {
      const gx = (x / grid | 0) % (S2 / grid);
      const gy = (y / grid | 0) % (S2 / grid);
      const v = cells[gy * (S2 / grid) + gx];
      const on = v > 0.58;
      const i2 = (y * S2 + x) * 4;
      img.data[i2] = 255;
      img.data[i2 + 1] = 255;
      img.data[i2 + 2] = 255;
      img.data[i2 + 3] = on ? 225 : 0;
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
function sunTexture(moon = false) {
  const S2 = 32;
  const c = document.createElement("canvas");
  c.width = S2;
  c.height = S2;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(S2, S2);
  const rnd = mulberry32(moon ? 77 : 42);
  for (let y = 0; y < S2; y++)
    for (let x = 0; x < S2; x++) {
      const i2 = (y * S2 + x) * 4;
      const v = rnd() * 24;
      if (moon) {
        const d = Math.hypot(x - 16, y - 16);
        const crater = Math.hypot(x - 11, y - 20) < 3.4 || Math.hypot(x - 22, y - 12) < 2.6;
        img.data[i2] = crater ? 190 : 228 - v * 0.3;
        img.data[i2 + 1] = crater ? 196 : 234 - v * 0.3;
        img.data[i2 + 2] = crater ? 210 : 246;
        img.data[i2 + 3] = d > 15.6 ? 0 : 255;
      } else {
        img.data[i2] = 255;
        img.data[i2 + 1] = 240 - v;
        img.data[i2 + 2] = 160 - v * 2;
        img.data[i2 + 3] = 255;
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
var TILE, ATLAS_COLS, ATLAS_ROWS, TILES, cl, Atlas, stoneBase, shared;
var init_textures = __esm({
  "src/game/textures.ts"() {
    "use strict";
    TILE = 16;
    ATLAS_COLS = 8;
    ATLAS_ROWS = 4;
    TILES = {
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
      dandelion: 24
    };
    cl = (v) => v < 0 ? 0 : v > 255 ? 255 : v | 0;
    Atlas = class {
      w = TILE * ATLAS_COLS;
      h = TILE * ATLAS_ROWS;
      data;
      constructor() {
        this.data = new Uint8ClampedArray(this.w * this.h * 4);
      }
      px(tile, x, y, c) {
        if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
        const tx = tile % ATLAS_COLS;
        const ty = tile / ATLAS_COLS | 0;
        const i2 = ((ty * TILE + y) * this.w + (tx * TILE + x)) * 4;
        this.data[i2] = c[0];
        this.data[i2 + 1] = c[1];
        this.data[i2 + 2] = c[2];
        this.data[i2 + 3] = c[3];
      }
      get(tile, x, y) {
        const tx = tile % ATLAS_COLS;
        const ty = tile / ATLAS_COLS | 0;
        const i2 = ((ty * TILE + y) * this.w + (tx * TILE + x)) * 4;
        return [this.data[i2], this.data[i2 + 1], this.data[i2 + 2], this.data[i2 + 3]];
      }
      fill(tile, fn) {
        const rnd = mulberry32(tile * 7919 + 13);
        for (let y = 0; y < TILE; y++)
          for (let x = 0; x < TILE; x++) this.px(tile, x, y, fn(x, y, rnd));
      }
      blobs(tile, rnd, color, count, r) {
        for (let i2 = 0; i2 < count; i2++) {
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
      voronoi(tile, palette, seed, dark, edge = 1.1) {
        const rnd = mulberry32(seed);
        const pts = [];
        const n = palette.length * 2;
        for (let i2 = 0; i2 < n; i2++)
          pts.push({
            x: rnd() * TILE,
            y: rnd() * TILE,
            c: palette[rnd() * palette.length | 0]
          });
        for (let y = 0; y < TILE; y++) {
          for (let x = 0; x < TILE; x++) {
            let d1 = 1e9, d2 = 1e9, c = palette[0];
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
      clear(tile) {
        for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) this.px(tile, x, y, [0, 0, 0, 0]);
      }
      toCanvas() {
        const c = document.createElement("canvas");
        c.width = this.w;
        c.height = this.h;
        const ctx = c.getContext("2d");
        const img = ctx.createImageData(this.w, this.h);
        img.data.set(this.data);
        ctx.putImageData(img, 0, 0);
        return c;
      }
    };
    stoneBase = (_x, _y, rnd) => {
      const v = (rnd() * 2 - 1) * 11;
      return [cl(127 + v), cl(127 + v), cl(129 + v), 255];
    };
    shared = null;
  }
});

// src/game/blocks.ts
var blocks_exports = {};
__export(blocks_exports, {
  AIR: () => AIR,
  BEDROCK: () => BEDROCK,
  BLOCKS: () => BLOCKS,
  BRICKS: () => BRICKS,
  COAL: () => COAL,
  COBBLE: () => COBBLE,
  DANDELION: () => DANDELION,
  DEFAULT_HOTBAR: () => DEFAULT_HOTBAR,
  DIRT: () => DIRT,
  GLASS: () => GLASS,
  GLOW: () => GLOW,
  GOLD: () => GOLD,
  GRASS: () => GRASS,
  GRAVEL: () => GRAVEL,
  IRON: () => IRON,
  LEAVES: () => LEAVES,
  LOG: () => LOG,
  MOSSY: () => MOSSY,
  PLACEABLE: () => PLACEABLE,
  PLANKS: () => PLANKS,
  POPPY: () => POPPY,
  PUMPKIN: () => PUMPKIN,
  SAND: () => SAND,
  SNOW: () => SNOW,
  STONE: () => STONE,
  TALLGRASS: () => TALLGRASS,
  WATER: () => WATER,
  getBlock: () => getBlock
});
function getBlock(id) {
  return BLOCKS[id] ?? BLOCKS[AIR];
}
var AIR, GRASS, DIRT, STONE, COBBLE, SAND, LOG, LEAVES, PLANKS, BRICKS, GLASS, WATER, GRAVEL, COAL, IRON, GOLD, BEDROCK, SNOW, GLOW, MOSSY, PUMPKIN, TALLGRASS, POPPY, DANDELION, def, BLOCKS, PLACEABLE, DEFAULT_HOTBAR;
var init_blocks = __esm({
  "src/game/blocks.ts"() {
    "use strict";
    init_textures();
    AIR = 0;
    GRASS = 1;
    DIRT = 2;
    STONE = 3;
    COBBLE = 4;
    SAND = 5;
    LOG = 6;
    LEAVES = 7;
    PLANKS = 8;
    BRICKS = 9;
    GLASS = 10;
    WATER = 11;
    GRAVEL = 12;
    COAL = 13;
    IRON = 14;
    GOLD = 15;
    BEDROCK = 16;
    SNOW = 17;
    GLOW = 18;
    MOSSY = 19;
    PUMPKIN = 20;
    TALLGRASS = 21;
    POPPY = 22;
    DANDELION = 23;
    def = (id, key, name, tiles, layer, opts = {}) => ({
      id,
      key,
      name,
      tiles: {
        top: tiles.top,
        bottom: tiles.bottom ?? tiles.top,
        side: tiles.side ?? tiles.top
      },
      layer,
      solid: true,
      opaque: true,
      placeable: true,
      sound: "stone",
      ...opts
    });
    BLOCKS = [];
    BLOCKS[AIR] = {
      id: 0,
      key: "air",
      name: "Luft",
      tiles: { top: 0, bottom: 0, side: 0 },
      layer: "opaque",
      solid: false,
      opaque: false,
      placeable: false,
      sound: "stone"
    };
    BLOCKS[GRASS] = def(1, "grass", "Grasblock", { top: TILES.grassTop, bottom: TILES.dirt, side: TILES.grassSide }, "opaque", { sound: "dirt" });
    BLOCKS[DIRT] = def(2, "dirt", "Erde", { top: TILES.dirt }, "opaque", { sound: "dirt" });
    BLOCKS[STONE] = def(3, "stone", "Stein", { top: TILES.stone }, "opaque", { sound: "stone" });
    BLOCKS[COBBLE] = def(4, "cobble", "Kopfsteinpflaster", { top: TILES.cobble }, "opaque", { sound: "stone" });
    BLOCKS[SAND] = def(5, "sand", "Sand", { top: TILES.sand }, "opaque", { sound: "sand" });
    BLOCKS[LOG] = def(6, "log", "Eichenstamm", { top: TILES.logTop, bottom: TILES.logTop, side: TILES.logSide }, "opaque", { sound: "wood" });
    BLOCKS[LEAVES] = def(7, "leaves", "Eichenlaub", { top: TILES.leaves }, "cutout", { sound: "plant", opaque: false });
    BLOCKS[PLANKS] = def(8, "planks", "Eichenbretter", { top: TILES.planks }, "opaque", { sound: "wood" });
    BLOCKS[BRICKS] = def(9, "bricks", "Ziegelsteine", { top: TILES.bricks }, "opaque", { sound: "stone" });
    BLOCKS[GLASS] = def(10, "glass", "Glas", { top: TILES.glass }, "glass", { sound: "glass", opaque: false });
    BLOCKS[WATER] = def(11, "water", "Wasser", { top: TILES.water }, "water", { sound: "liquid", opaque: false, solid: false, placeable: false });
    BLOCKS[GRAVEL] = def(12, "gravel", "Kies", { top: TILES.gravel }, "opaque", { sound: "sand" });
    BLOCKS[COAL] = def(13, "coal", "Steinkohleerz", { top: TILES.coal }, "opaque", { sound: "stone" });
    BLOCKS[IRON] = def(14, "iron", "Eisenerz", { top: TILES.iron }, "opaque", { sound: "stone" });
    BLOCKS[GOLD] = def(15, "gold", "Golderz", { top: TILES.gold }, "opaque", { sound: "stone" });
    BLOCKS[BEDROCK] = def(16, "bedrock", "Grundgestein", { top: TILES.bedrock }, "opaque", { sound: "stone", unbreakable: true, placeable: false });
    BLOCKS[SNOW] = def(17, "snow", "Schnee", { top: TILES.snow }, "opaque", { sound: "dirt" });
    BLOCKS[GLOW] = def(18, "glowstone", "Leuchtstein", { top: TILES.glowstone }, "glow", { sound: "glass" });
    BLOCKS[MOSSY] = def(19, "mossy", "Bemoostes Pflaster", { top: TILES.mossy }, "opaque", { sound: "stone" });
    BLOCKS[PUMPKIN] = def(20, "pumpkin", "K\xFCrbis", { top: TILES.pumpkin }, "opaque", { sound: "plant" });
    BLOCKS[TALLGRASS] = def(21, "tallgrass", "Hohes Gras", { top: TILES.tallgrass }, "cross", { sound: "plant", solid: false, opaque: false });
    BLOCKS[POPPY] = def(22, "poppy", "Mohn", { top: TILES.poppy }, "cross", { sound: "plant", solid: false, opaque: false });
    BLOCKS[DANDELION] = def(23, "dandelion", "L\xF6wenzahn", { top: TILES.dandelion }, "cross", { sound: "plant", solid: false, opaque: false });
    PLACEABLE = BLOCKS.filter((b) => b && b.placeable);
    DEFAULT_HOTBAR = [GRASS, STONE, COBBLE, LOG, PLANKS, BRICKS, GLASS, GLOW, LEAVES];
  }
});

// src/game/world.ts
var world_exports = {};
__export(world_exports, {
  CHUNK: () => CHUNK,
  CHUNKS_X: () => CHUNKS_X,
  CHUNKS_Z: () => CHUNKS_Z,
  SEA: () => SEA,
  SX: () => SX,
  SY: () => SY,
  SZ: () => SZ,
  World: () => World
});
function hash2(x, y, seed) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ h >>> 13, 1274126177);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function hash3(x, y, z, seed) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 1103515245) ^ Math.imul(z | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ h >>> 15, 2246822519);
  h = Math.imul(h ^ h >>> 13, 3266489917);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function noise2(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const tx = smooth(x - xi), ty = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
}
function noise3(x, y, z, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const tx = smooth(x - xi), ty = smooth(y - yi), tz = smooth(z - zi);
  const c00 = lerp(hash3(xi, yi, zi, seed), hash3(xi + 1, yi, zi, seed), tx);
  const c10 = lerp(hash3(xi, yi + 1, zi, seed), hash3(xi + 1, yi + 1, zi, seed), tx);
  const c01 = lerp(hash3(xi, yi, zi + 1, seed), hash3(xi + 1, yi, zi + 1, seed), tx);
  const c11 = lerp(hash3(xi, yi + 1, zi + 1, seed), hash3(xi + 1, yi + 1, zi + 1, seed), tx);
  return lerp(lerp(c00, c10, ty), lerp(c01, c11, ty), tz);
}
function fbm2(x, y, seed, octaves = 4, lac = 2, gain = 0.5) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i2 = 0; i2 < octaves; i2++) {
    sum += noise2(x * freq, y * freq, seed + i2 * 1013) * amp;
    norm += amp;
    amp *= gain;
    freq *= lac;
  }
  return sum / norm;
}
var SX, SY, SZ, CHUNK, SEA, CHUNKS_X, CHUNKS_Z, smooth, lerp, World;
var init_world = __esm({
  "src/game/world.ts"() {
    "use strict";
    init_blocks();
    SX = 80;
    SY = 48;
    SZ = 80;
    CHUNK = 16;
    SEA = 18;
    CHUNKS_X = SX / CHUNK;
    CHUNKS_Z = SZ / CHUNK;
    smooth = (t) => t * t * (3 - 2 * t);
    lerp = (a, b, t) => a + (b - a) * t;
    World = class {
      data;
      heights;
      seed;
      spawn = { x: SX / 2 + 0.5, y: 30, z: SZ / 2 + 0.5 };
      constructor(seed) {
        this.seed = seed | 0;
        this.data = new Uint8Array(SX * SY * SZ);
        this.heights = new Int16Array(SX * SZ);
        this.generate();
      }
      idx(x, y, z) {
        return (y * SZ + z) * SX + x;
      }
      inside(x, y, z) {
        return x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
      }
      get(x, y, z) {
        if (!this.inside(x, y, z)) return AIR;
        return this.data[this.idx(x, y, z)];
      }
      set(x, y, z, id) {
        if (!this.inside(x, y, z)) return;
        this.data[this.idx(x, y, z)] = id;
        if (y >= this.heights[z * SX + x] && id !== AIR) this.heights[z * SX + x] = y;
      }
      isSolid(x, y, z) {
        const b = this.get(x, y, z);
        return b !== AIR && b !== WATER && b !== TALLGRASS && b !== POPPY && b !== DANDELION;
      }
      /** Oberster nicht-Luft-Block einer Säule */
      topY(x, z) {
        for (let y = SY - 1; y >= 0; y--) {
          const b = this.get(x, y, z);
          if (b !== AIR && b !== WATER) return y;
        }
        return 0;
      }
      heightAt(x, z) {
        const s = this.seed;
        const cont = fbm2(x / 62, z / 62, s, 4);
        const detail = fbm2(x / 18, z / 18, s + 991, 3);
        const ridge = Math.pow(fbm2(x / 34, z / 34, s + 4242, 3), 2.1);
        const nx = (x - SX / 2) / (SX / 2);
        const nz = (z - SZ / 2) / (SZ / 2);
        const r = Math.min(1, Math.hypot(nx, nz) * 1.06);
        const falloff = r > 0.74 ? Math.pow((r - 0.74) / 0.26, 1.55) * 19 : 0;
        let h = 11 + cont * 15 + detail * 4.5 + ridge * 17 - falloff;
        return Math.max(2, Math.min(SY - 12, Math.round(h)));
      }
      generate() {
        const s = this.seed;
        for (let z = 0; z < SZ; z++) {
          for (let x = 0; x < SX; x++) {
            const h = this.heightAt(x, z);
            this.heights[z * SX + x] = h;
            const beach = h <= SEA + 1;
            const peak = h >= 31;
            for (let y = 0; y <= h; y++) {
              let id = STONE;
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
                if (y < 14 && r < 6e-3) id = GOLD;
                else if (y < 24 && r < 0.016) id = IRON;
                else if (r < 0.034) id = COAL;
                else if (r > 0.985) id = GRAVEL;
              }
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
            for (let y = h + 1; y <= SEA; y++) this.data[this.idx(x, y, z)] = WATER;
          }
        }
        for (let z = 3; z < SZ - 3; z++) {
          for (let x = 3; x < SX - 3; x++) {
            const h = this.heights[z * SX + x];
            const top = this.get(x, h, z);
            if (top !== GRASS) continue;
            const r = hash2(x, z, s + 31);
            if (r < 0.024) {
              this.tree(x, h + 1, z, s);
            } else if (r > 0.9965) {
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
        for (let dx = -1; dx <= 1; dx++)
          for (let dz = -1; dz <= 1; dz++) {
            const bx = best.x + dx, bz = best.z + dz;
            for (let y = best.y + 1; y < best.y + 6; y++) this.set(bx, y, bz, AIR);
          }
        this.spawn = { x: best.x + 0.5, y: best.y + 1.2, z: best.z + 0.5 };
      }
      tree(x, y, z, seed) {
        const rnd = hash2(x, z, seed + 77);
        const trunk = 4 + Math.floor(rnd * 3);
        for (let i2 = 0; i2 < trunk; i2++) this.set(x, y + i2, z, LOG);
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
    };
  }
});

// scripts/render.ts
import { writeFileSync, mkdirSync } from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";
globalThis.document = {
  createElement: (tag) => tag === "canvas" ? createCanvas(1, 1) : {}
};
var { buildAtlas: buildAtlas2, tileCanvas: tileCanvas2, blockIconURL: blockIconURL2 } = await Promise.resolve().then(() => (init_textures(), textures_exports));
var { BLOCKS: BLOCKS2, PLACEABLE: PLACEABLE2 } = await Promise.resolve().then(() => (init_blocks(), blocks_exports));
var { World: World2, SX: SX2, SZ: SZ2 } = await Promise.resolve().then(() => (init_world(), world_exports));
mkdirSync("tmp", { recursive: true });
var any = (v) => v;
var { canvas: atlas } = buildAtlas2();
var S = 9;
var out = createCanvas(atlas.width * S + 40, atlas.height * S + 40);
var octx = out.getContext("2d");
octx.imageSmoothingEnabled = false;
octx.fillStyle = "#1b1b1b";
octx.fillRect(0, 0, out.width, out.height);
octx.drawImage(any(atlas), 20, 20, atlas.width * S, atlas.height * S);
octx.strokeStyle = "rgba(255,0,255,.35)";
octx.lineWidth = 1;
for (let c = 0; c <= 8; c++) {
  octx.beginPath();
  octx.moveTo(20 + c * 16 * S, 20);
  octx.lineTo(20 + c * 16 * S, 20 + atlas.height * S);
  octx.stroke();
}
for (let r = 0; r <= 4; r++) {
  octx.beginPath();
  octx.moveTo(20, 20 + r * 16 * S);
  octx.lineTo(20 + atlas.width * S, 20 + r * 16 * S);
  octx.stroke();
}
writeFileSync("tmp/atlas.png", out.toBuffer("image/png"));
console.log("atlas.png", out.width, out.height);
var size = 72;
var pad = 10;
var cols = 6;
var rows = Math.ceil(PLACEABLE2.length / cols);
var sheet = createCanvas(cols * (size + pad) + pad, rows * (size + pad) + pad);
var sctx = sheet.getContext("2d");
sctx.imageSmoothingEnabled = false;
sctx.fillStyle = "#132019";
sctx.fillRect(0, 0, sheet.width, sheet.height);
var i = 0;
for (const b of PLACEABLE2) {
  const url = blockIconURL2(any(atlas), b.tiles, size);
  const img = await loadImage(url);
  const x = pad + i % cols * (size + pad);
  const y = pad + Math.floor(i / cols) * (size + pad);
  sctx.fillStyle = "rgba(0,0,0,.35)";
  sctx.fillRect(x, y, size, size);
  sctx.drawImage(any(img), x, y, size, size);
  sctx.strokeStyle = "rgba(255,255,255,.18)";
  sctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  i++;
}
writeFileSync("tmp/icons.png", sheet.toBuffer("image/png"));
console.log("icons.png", sheet.width, sheet.height, PLACEABLE2.length, "Bl\xF6cke");
var avg = (tile) => {
  const t = tileCanvas2(any(atlas), tile, 1);
  const d = t.getContext("2d").getImageData(0, 0, 16, 16).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let k = 0; k < d.length; k += 4) {
    if (d[k + 3] < 40) continue;
    r += d[k];
    g += d[k + 1];
    b += d[k + 2];
    n++;
  }
  return [n ? r / n : 200, n ? g / n : 200, n ? b / n : 200];
};
var colCache = /* @__PURE__ */ new Map();
var colorOf = (id) => {
  if (!colCache.has(id)) colCache.set(id, avg(BLOCKS2[id].tiles.top));
  return colCache.get(id);
};
var w = new World2(20260214);
var K = 8;
var map = createCanvas(SX2 * K, SZ2 * K);
var mctx = map.getContext("2d");
for (let z = 0; z < SZ2; z++) {
  for (let x = 0; x < SX2; x++) {
    let id = 0;
    let top = 0;
    for (let y = 47; y >= 0; y--) {
      const b = w.get(x, y, z);
      if (b !== 0) {
        id = b;
        top = y;
        break;
      }
    }
    const c = colorOf(id);
    const shade = 0.62 + Math.min(1, top / 40) * 0.5;
    mctx.fillStyle = `rgb(${Math.min(255, c[0] * shade) | 0},${Math.min(255, c[1] * shade) | 0},${Math.min(255, c[2] * shade) | 0})`;
    mctx.fillRect(x * K, z * K, K, K);
  }
}
mctx.fillStyle = "#ffffff";
mctx.fillRect(w.spawn.x * K - 4, w.spawn.z * K - 4, 8, 8);
mctx.strokeStyle = "#000";
mctx.strokeRect(w.spawn.x * K - 4, w.spawn.z * K - 4, 8, 8);
writeFileSync("tmp/worldmap.png", map.toBuffer("image/png"));
console.log("worldmap.png", map.width, map.height, "spawn", w.spawn);
var cut = createCanvas(SX2 * K, 48 * 3);
var cctx = cut.getContext("2d");
var zSlice = 40;
for (let y = 0; y < 48; y++) {
  for (let x = 0; x < SX2; x++) {
    const id = w.get(x, 47 - y, zSlice);
    const c = id === 0 ? [10, 14, 20] : colorOf(id);
    cctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
    cctx.fillRect(x * K, y * 3, K, 3);
  }
}
writeFileSync("tmp/cut.png", cut.toBuffer("image/png"));
console.log("cut.png fertig");
