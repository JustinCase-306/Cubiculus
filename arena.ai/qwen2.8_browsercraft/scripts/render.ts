import { writeFileSync, mkdirSync } from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";

// DOM-Stub, bevor die Spielmodule etwas zeichnen
(globalThis as unknown as { document: unknown }).document = {
  createElement: (tag: string) => (tag === "canvas" ? createCanvas(1, 1) : ({} as unknown)),
};

const { buildAtlas, tileCanvas, blockIconURL } = await import("../src/game/textures");
const { BLOCKS, PLACEABLE } = await import("../src/game/blocks");
const { World, SX, SZ } = await import("../src/game/world");

mkdirSync("tmp", { recursive: true });
const any = (v: unknown) => v as never;

/* ---------- 1) Atlas ---------- */
const { canvas: atlas } = buildAtlas();
const S = 9;
const out = createCanvas(atlas.width * S + 40, atlas.height * S + 40);
const octx = out.getContext("2d");
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

/* ---------- 2) Icon-Bogen ---------- */
const size = 72;
const pad = 10;
const cols = 6;
const rows = Math.ceil(PLACEABLE.length / cols);
const sheet = createCanvas(cols * (size + pad) + pad, rows * (size + pad) + pad);
const sctx = sheet.getContext("2d");
sctx.imageSmoothingEnabled = false;
sctx.fillStyle = "#132019";
sctx.fillRect(0, 0, sheet.width, sheet.height);
let i = 0;
for (const b of PLACEABLE) {
  const url = blockIconURL(any(atlas), b.tiles, size);
  const img = await loadImage(url);
  const x = pad + (i % cols) * (size + pad);
  const y = pad + Math.floor(i / cols) * (size + pad);
  sctx.fillStyle = "rgba(0,0,0,.35)";
  sctx.fillRect(x, y, size, size);
  sctx.drawImage(any(img), x, y, size, size);
  sctx.strokeStyle = "rgba(255,255,255,.18)";
  sctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  i++;
}
writeFileSync("tmp/icons.png", sheet.toBuffer("image/png"));
console.log("icons.png", sheet.width, sheet.height, PLACEABLE.length, "Blöcke");

/* ---------- 3) Weltkarte von oben ---------- */
const avg = (tile: number) => {
  const t = tileCanvas(any(atlas), tile, 1);
  const d = t.getContext("2d")!.getImageData(0, 0, 16, 16).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let k = 0; k < d.length; k += 4) {
    if (d[k + 3] < 40) continue;
    r += d[k]; g += d[k + 1]; b += d[k + 2]; n++;
  }
  return [n ? r / n : 200, n ? g / n : 200, n ? b / n : 200];
};
const colCache = new Map<number, number[]>();
const colorOf = (id: number) => {
  if (!colCache.has(id)) colCache.set(id, avg(BLOCKS[id].tiles.top));
  return colCache.get(id)!;
};

const w = new World(20260214);
const K = 8;
const map = createCanvas(SX * K, SZ * K);
const mctx = map.getContext("2d");
for (let z = 0; z < SZ; z++) {
  for (let x = 0; x < SX; x++) {
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
// Spawn markieren
mctx.fillStyle = "#ffffff";
mctx.fillRect(w.spawn.x * K - 4, w.spawn.z * K - 4, 8, 8);
mctx.strokeStyle = "#000";
mctx.strokeRect(w.spawn.x * K - 4, w.spawn.z * K - 4, 8, 8);
writeFileSync("tmp/worldmap.png", map.toBuffer("image/png"));
console.log("worldmap.png", map.width, map.height, "spawn", w.spawn);

/* ---------- 4) Höhlenschnitt ---------- */
const cut = createCanvas(SX * K, 48 * 3);
const cctx = cut.getContext("2d");
const zSlice = 40;
for (let y = 0; y < 48; y++) {
  for (let x = 0; x < SX; x++) {
    const id = w.get(x, 47 - y, zSlice);
    const c = id === 0 ? [10, 14, 20] : colorOf(id);
    cctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
    cctx.fillRect(x * K, y * 3, K, 3);
  }
}
writeFileSync("tmp/cut.png", cut.toBuffer("image/png"));
console.log("cut.png fertig");
