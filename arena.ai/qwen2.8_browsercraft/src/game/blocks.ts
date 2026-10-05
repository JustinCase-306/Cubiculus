import { TILES } from "./textures";

/* ============================================================
   Block-Definitionen
   ============================================================ */

export type RenderLayer = "opaque" | "cutout" | "cross" | "glass" | "water" | "glow";

export interface BlockDef {
  id: number;
  key: string;
  name: string;
  tiles: { top: number; bottom: number; side: number };
  layer: RenderLayer;
  solid: boolean;
  /** verdeckt die Seitenflächen der Nachbarblöcke */
  opaque: boolean;
  unbreakable?: boolean;
  placeable?: boolean;
  /** Sound-Charakter */
  sound: "stone" | "dirt" | "wood" | "glass" | "sand" | "plant" | "liquid";
}

export const AIR = 0;
export const GRASS = 1;
export const DIRT = 2;
export const STONE = 3;
export const COBBLE = 4;
export const SAND = 5;
export const LOG = 6;
export const LEAVES = 7;
export const PLANKS = 8;
export const BRICKS = 9;
export const GLASS = 10;
export const WATER = 11;
export const GRAVEL = 12;
export const COAL = 13;
export const IRON = 14;
export const GOLD = 15;
export const BEDROCK = 16;
export const SNOW = 17;
export const GLOW = 18;
export const MOSSY = 19;
export const PUMPKIN = 20;
export const TALLGRASS = 21;
export const POPPY = 22;
export const DANDELION = 23;

const def = (
  id: number,
  key: string,
  name: string,
  tiles: { top: number; bottom?: number; side?: number },
  layer: RenderLayer,
  opts: Partial<BlockDef> = {}
): BlockDef => ({
  id,
  key,
  name,
  tiles: {
    top: tiles.top,
    bottom: tiles.bottom ?? tiles.top,
    side: tiles.side ?? tiles.top,
  },
  layer,
  solid: true,
  opaque: true,
  placeable: true,
  sound: "stone",
  ...opts,
});

export const BLOCKS: BlockDef[] = [];
BLOCKS[AIR] = {
  id: 0,
  key: "air",
  name: "Luft",
  tiles: { top: 0, bottom: 0, side: 0 },
  layer: "opaque",
  solid: false,
  opaque: false,
  placeable: false,
  sound: "stone",
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
BLOCKS[PUMPKIN] = def(20, "pumpkin", "Kürbis", { top: TILES.pumpkin }, "opaque", { sound: "plant" });
BLOCKS[TALLGRASS] = def(21, "tallgrass", "Hohes Gras", { top: TILES.tallgrass }, "cross", { sound: "plant", solid: false, opaque: false });
BLOCKS[POPPY] = def(22, "poppy", "Mohn", { top: TILES.poppy }, "cross", { sound: "plant", solid: false, opaque: false });
BLOCKS[DANDELION] = def(23, "dandelion", "Löwenzahn", { top: TILES.dandelion }, "cross", { sound: "plant", solid: false, opaque: false });

/** Alle Blöcke, die man ins Inventar legen kann */
export const PLACEABLE = BLOCKS.filter((b) => b && b.placeable);

export const DEFAULT_HOTBAR = [GRASS, STONE, COBBLE, LOG, PLANKS, BRICKS, GLASS, GLOW, LEAVES];

export function getBlock(id: number): BlockDef {
  return BLOCKS[id] ?? BLOCKS[AIR];
}
