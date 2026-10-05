import { BLOCKS, PLACEABLE } from "./blocks";
import { blockIconURL, getAtlas, tileCanvas } from "./textures";

const cache = new Map<string, string>();

/** Isometrisches Icon für einen Block (Pflanzen -> flache Kachel) */
export function blockIcon(id: number, size = 64): string {
  const key = `${id}:${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const b = BLOCKS[id];
  const { canvas } = getAtlas();
  let url: string;
  if (!b) url = "";
  else if (b.layer === "cross") {
    const pad = Math.round(size * 0.12);
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const t = tileCanvas(canvas, b.tiles.top, 1);
    ctx.drawImage(t, pad, pad, size - pad * 2, size - pad * 2);
    url = c.toDataURL();
  } else {
    url = blockIconURL(canvas, b.tiles, size);
  }
  cache.set(key, url);
  return url;
}

export function allIcons(size = 64) {
  const out: Record<number, string> = {};
  for (const b of PLACEABLE) out[b.id] = blockIcon(b.id, size);
  return out;
}
