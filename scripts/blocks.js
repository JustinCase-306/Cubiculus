// WebMinecraft Block & Item Definitions
//
// Single source of truth: every block carries its own properties instead of
// being spread across BLOCKS / breakTimes / blockColors / blockNames and two
// hand-maintained predicate lists. Adding a block is now one entry, and a
// missing name, colour or break time can no longer silently happen.
export const BLOCKS = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    WOOD: 4,
    SAND: 5,
    LEAVES: 6,
    WATER: 7,
    PLANKS: 8,
    GLASS: 9,
    DIAMOND: 10,
    BRICK: 11,
    IRON_ORE: 12,
    GOLD_ORE: 13,
    COAL_ORE: 14,
    STICK: 15,
    IRON_INGOT: 16,
    GOLD_INGOT: 17,
    COAL: 18,
    WOOD_PICKAXE: 19,
    STONE_PICKAXE: 20,
    IRON_PICKAXE: 21,
    GOLD_PICKAXE: 22,
    DIAMOND_PICKAXE: 23,
    WOOD_SWORD: 24,
    STONE_SWORD: 25,
    IRON_SWORD: 26,
    GOLD_SWORD: 27,
    DIAMOND_SWORD: 28,
    SNOW: 29,
    ICE: 30,
    JUNGLE_WOOD: 31,
    JUNGLE_LEAVES: 32,
    SNOW_LEAVES: 33,
    BIRCH_WOOD: 34,
    BIRCH_LEAVES: 35,
    SANDSTONE: 36,
    GRAVEL: 37,
    TERRACOTTA: 38,
    CACTUS: 39,
    MOSSY_COBBLESTONE: 40,
    REDSTONE_ORE: 41,
    EMERALD_ORE: 42,
    COBBLESTONE: 43,
    TALL_GRASS: 44,
    FLOWER_RED: 45,
    FLOWER_YELLOW: 46
};

// layer drives RENDERING only:
//   solid  - full cube, occludes neighbours
//   trans  - full cube but see-through (leaves, glass, ice, water)
//   cross  - two diagonal quads, no collision (plants)
//   item   - not a world block
//
// placeable and solid are separate flags:
//   placeable - can be put into the world from the hotbar (air/water cannot)
//   solid     - blocks player movement (items answer true to keep the old
//               behaviour of the previous isSolidBlock implementation)
const DEFS = [
    // id, name, color, breakTime, layer, placeable, solid
    [BLOCKS.AIR, 'Luft', 0x000000, 0, 'trans', false, false],
    [BLOCKS.GRASS, 'Grasblock', 0x5c8e32, 0.35, 'solid', true, true],
    [BLOCKS.DIRT, 'Erde', 0x765438, 0.35, 'solid', true, true],
    [BLOCKS.STONE, 'Stein', 0x828282, 1.2, 'solid', true, true],
    [BLOCKS.WOOD, 'Holzstamm', 0x58422E, 0.8, 'solid', true, true],
    [BLOCKS.SAND, 'Sand', 0xdbca9a, 0.35, 'solid', true, true],
    [BLOCKS.LEAVES, 'Laub', 0x366822, 0.15, 'trans', true, true],
    [BLOCKS.WATER, 'Wasser', 0x2e5cff, 0, 'trans', false, false],
    [BLOCKS.PLANKS, 'Holzbretter', 0xbf945c, 0.6, 'solid', true, true],
    [BLOCKS.GLASS, 'Glas', 0xffffff, 0.2, 'trans', true, true],
    [BLOCKS.DIAMOND, 'Diamant-Erz', 0x33e3ff, 2.2, 'solid', true, true],
    [BLOCKS.BRICK, 'Ziegelstein', 0x934b37, 1.4, 'solid', true, true],
    [BLOCKS.IRON_ORE, 'Eisenerz', 0xd4a373, 1.5, 'solid', true, true],
    [BLOCKS.GOLD_ORE, 'Golderz', 0xfad02c, 1.7, 'solid', true, true],
    [BLOCKS.COAL_ORE, 'Kohleerz', 0x333333, 1.3, 'solid', true, true],
    [BLOCKS.STICK, 'Stock', 0xa07850, 0, 'item', false, true],
    [BLOCKS.IRON_INGOT, 'Eisenbarren', 0xd8d8d8, 0, 'item', false, true],
    [BLOCKS.GOLD_INGOT, 'Goldbarren', 0xfad02c, 0, 'item', false, true],
    [BLOCKS.COAL, 'Kohle', 0x1a1a1a, 0, 'item', false, true],
    [BLOCKS.WOOD_PICKAXE, 'Holzspitzhacke', 0xa07850, 0, 'item', false, true],
    [BLOCKS.STONE_PICKAXE, 'Steinspitzhacke', 0x9a9a9a, 0, 'item', false, true],
    [BLOCKS.IRON_PICKAXE, 'Eisenspitzhacke', 0xd8d8d8, 0, 'item', false, true],
    [BLOCKS.GOLD_PICKAXE, 'Goldspitzhacke', 0xfad02c, 0, 'item', false, true],
    [BLOCKS.DIAMOND_PICKAXE, 'Diamantspitzhacke', 0x33e3ff, 0, 'item', false, true],
    [BLOCKS.WOOD_SWORD, 'Holzschwert', 0xa07850, 0, 'item', false, true],
    [BLOCKS.STONE_SWORD, 'Steinschwert', 0x9a9a9a, 0, 'item', false, true],
    [BLOCKS.IRON_SWORD, 'Eisenschwert', 0xd8d8d8, 0, 'item', false, true],
    [BLOCKS.GOLD_SWORD, 'Goldschwert', 0xfad02c, 0, 'item', false, true],
    [BLOCKS.DIAMOND_SWORD, 'Diamantschwert', 0x33e3ff, 0, 'item', false, true],
    [BLOCKS.SNOW, 'Schnee', 0xf0f5ff, 0.25, 'solid', true, true],
    [BLOCKS.ICE, 'Eis', 0x99ccff, 0.3, 'trans', true, true],
    [BLOCKS.JUNGLE_WOOD, 'Dschungelholz', 0x5c4028, 0.8, 'solid', true, true],
    [BLOCKS.JUNGLE_LEAVES, 'Dschungellaub', 0x256d1b, 0.15, 'trans', true, true],
    [BLOCKS.SNOW_LEAVES, 'Schneelaub', 0x477853, 0.15, 'trans', true, true],
    [BLOCKS.BIRCH_WOOD, 'Birkenholz', 0xd8d6cf, 0.8, 'solid', true, true],
    [BLOCKS.BIRCH_LEAVES, 'Birkenlaub', 0x6ba33b, 0.15, 'trans', true, true],
    [BLOCKS.SANDSTONE, 'Sandstein', 0xded29b, 1.0, 'solid', true, true],
    [BLOCKS.GRAVEL, 'Kies', 0x7a7775, 0.35, 'solid', true, true],
    [BLOCKS.TERRACOTTA, 'Terrakotta', 0x985e43, 1.3, 'solid', true, true],
    [BLOCKS.CACTUS, 'Kaktus', 0x527d26, 0.25, 'trans', true, true],
    [BLOCKS.MOSSY_COBBLESTONE, 'Bemooster Bruchstein', 0x587352, 1.3, 'solid', true, true],
    [BLOCKS.REDSTONE_ORE, 'Redstone-Erz', 0xb31414, 1.5, 'solid', true, true],
    [BLOCKS.EMERALD_ORE, 'Smaragd-Erz', 0x13c740, 2.0, 'solid', true, true],
    [BLOCKS.COBBLESTONE, 'Bruchstein', 0x7f7f7f, 1.2, 'solid', true, true],
    [BLOCKS.TALL_GRASS, 'Grasbusch', 0x5c8e32, 0.05, 'cross', true, false],
    [BLOCKS.FLOWER_RED, 'Rote Blume', 0xc9405a, 0.05, 'cross', true, false],
    [BLOCKS.FLOWER_YELLOW, 'Gelbe Blume', 0xe8d44a, 0.05, 'cross', true, false]
];

// id -> { name, color, breakTime, layer, placeable, solid }
export const BLOCK_DEFS = {};
for (const [id, name, color, breakTime, layer, placeable, solid] of DEFS) {
    BLOCK_DEFS[id] = { id, name, color, breakTime, layer, placeable, solid };
}

export function getBlockDef(type) {
    return BLOCK_DEFS[type];
}

// Back-compat lookup tables, now derived instead of hand-maintained.
export const blockNames = {};
export const blockColors = {};
export const breakTimes = {};
for (const id in BLOCK_DEFS) {
    const d = BLOCK_DEFS[id];
    blockNames[id] = d.name;
    blockColors[id] = d.color;
    breakTimes[id] = d.breakTime;
}

const isLayer = (type, layer) => {
    const d = BLOCK_DEFS[type];
    return !!d && d.layer === layer;
};

// Which items can be placed in the 3D world as blocks
export function isPlaceableBlock(type) {
    const d = BLOCK_DEFS[type];
    return !!d && d.placeable;
}

// Blocks that let light through or require special face culling
export function isTransparentBlock(type) {
    return isLayer(type, 'trans') || isLayer(type, 'cross');
}

// Blocks rendered as an X of two diagonal quads (tall grass, flowers). They are
// non-solid: no player collision and no ambient occlusion onto their neighbours.
export function isCrossShaped(type) {
    return isLayer(type, 'cross');
}

// Blocks that block player movement and occlude other blocks
export function isSolidBlock(type) {
    const d = BLOCK_DEFS[type];
    return !!d && d.solid;
}

// Mining speed multiplier depending on the held tool
export function getToolMultiplier(heldType, targetBlock) {
    const isPickaxe = (
        heldType === BLOCKS.WOOD_PICKAXE ||
        heldType === BLOCKS.STONE_PICKAXE ||
        heldType === BLOCKS.IRON_PICKAXE ||
        heldType === BLOCKS.GOLD_PICKAXE ||
        heldType === BLOCKS.DIAMOND_PICKAXE
    );

    const isSword = (
        heldType === BLOCKS.WOOD_SWORD ||
        heldType === BLOCKS.STONE_SWORD ||
        heldType === BLOCKS.IRON_SWORD ||
        heldType === BLOCKS.GOLD_SWORD ||
        heldType === BLOCKS.DIAMOND_SWORD
    );

    const isRockOrOre = (
        targetBlock === BLOCKS.STONE ||
        targetBlock === BLOCKS.COAL_ORE ||
        targetBlock === BLOCKS.IRON_ORE ||
        targetBlock === BLOCKS.GOLD_ORE ||
        targetBlock === BLOCKS.DIAMOND ||
        targetBlock === BLOCKS.BRICK ||
        targetBlock === BLOCKS.SANDSTONE ||
        targetBlock === BLOCKS.TERRACOTTA ||
        targetBlock === BLOCKS.MOSSY_COBBLESTONE ||
        targetBlock === BLOCKS.COBBLESTONE ||
        targetBlock === BLOCKS.REDSTONE_ORE ||
        targetBlock === BLOCKS.EMERALD_ORE
    );

    const isLeafBlock = (
        targetBlock === BLOCKS.LEAVES ||
        targetBlock === BLOCKS.JUNGLE_LEAVES ||
        targetBlock === BLOCKS.SNOW_LEAVES ||
        targetBlock === BLOCKS.BIRCH_LEAVES
    );

    if (isPickaxe && isRockOrOre) {
        if (heldType === BLOCKS.DIAMOND_PICKAXE) return 9.0;
        if (heldType === BLOCKS.GOLD_PICKAXE) return 7.5;
        if (heldType === BLOCKS.IRON_PICKAXE) return 5.5;
        if (heldType === BLOCKS.STONE_PICKAXE) return 3.5;
        if (heldType === BLOCKS.WOOD_PICKAXE) return 2.0;
    }

    if (isSword && isLeafBlock) {
        if (heldType === BLOCKS.DIAMOND_SWORD) return 7.0;
        if (heldType === BLOCKS.GOLD_SWORD) return 5.5;
        if (heldType === BLOCKS.IRON_SWORD) return 4.5;
        if (heldType === BLOCKS.STONE_SWORD) return 3.5;
        if (heldType === BLOCKS.WOOD_SWORD) return 2.5;
    }

    return 1.0;
}