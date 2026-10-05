import { T, makeBlockIcon, tileAverageColor } from './textures';

export interface BlockDef {
  id: number;
  name: string;
  tiles: { top: number; side: number; bottom: number };
  /** Blockiert die Sicht auf Nachbarflächen. */
  opaque: boolean;
  /** Kollidiert mit dem Spieler. */
  solid: boolean;
  /** Flüssigkeit (Wasser). */
  liquid?: boolean;
  /** Leuchtet, wird nicht abgedunkelt. */
  emissive?: boolean;
  /** Kann nicht abgebaut werden. */
  unbreakable?: boolean;
}

const def = (
  id: number,
  name: string,
  top: number,
  side = top,
  bottom = top,
  extra: Partial<BlockDef> = {},
): BlockDef => ({
  id,
  name,
  tiles: { top, side, bottom },
  opaque: true,
  solid: true,
  ...extra,
});

export const AIR = 0;

export const BLOCKS: Record<number, BlockDef> = {
  1: def(1, 'Gras', T.GRASS_TOP, T.GRASS_SIDE, T.DIRT),
  2: def(2, 'Erde', T.DIRT),
  3: def(3, 'Stein', T.STONE),
  4: def(4, 'Bruchstein', T.COBBLE),
  5: def(5, 'Sand', T.SAND),
  6: def(6, 'Holzstamm', T.LOG_TOP, T.LOG_SIDE, T.LOG_TOP),
  7: def(7, 'Laub', T.LEAVES),
  8: def(8, 'Holzbretter', T.PLANKS),
  9: def(9, 'Glas', T.GLASS, T.GLASS, T.GLASS, { opaque: false }),
  10: def(10, 'Wasser', T.WATER, T.WATER, T.WATER, { opaque: false, solid: false, liquid: true }),
  11: def(11, 'Ziegel', T.BRICK),
  12: def(12, 'Schnee', T.SNOW),
  13: def(13, 'Leuchtstein', T.GLOWSTONE, T.GLOWSTONE, T.GLOWSTONE, { emissive: true }),
  14: def(14, 'Grundgestein', T.BEDROCK, T.BEDROCK, T.BEDROCK, { unbreakable: true }),
};

export const PLACEABLE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 10];

export const DEFAULT_HOTBAR = [1, 2, 3, 4, 8, 6, 7, 5, 9];

export function getBlock(id: number): BlockDef | undefined {
  return BLOCKS[id];
}

export function isOpaque(id: number): boolean {
  if (id === AIR) return false;
  return BLOCKS[id]?.opaque ?? true;
}

export function isSolid(id: number): boolean {
  if (id === AIR) return false;
  return BLOCKS[id]?.solid ?? true;
}

export function isLiquid(id: number): boolean {
  return BLOCKS[id]?.liquid ?? false;
}

const iconCache = new Map<number, string>();

export function blockIcon(id: number): string {
  const cached = iconCache.get(id);
  if (cached) return cached;
  const b = BLOCKS[id];
  const url = b ? makeBlockIcon(b.tiles.top, b.tiles.side) : '';
  iconCache.set(id, url);
  return url;
}

export function blockColor(id: number): [number, number, number] {
  const b = BLOCKS[id];
  if (!b) return [1, 1, 1];
  return tileAverageColor(b.tiles.side);
}
