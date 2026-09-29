// WebMinecraft Block & Item Definitions
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
    EMERALD_ORE: 42
};

// Which items can be placed in the 3D world as blocks
export function isPlaceableBlock(type) {
    return (
        type === BLOCKS.GRASS ||
        type === BLOCKS.DIRT ||
        type === BLOCKS.STONE ||
        type === BLOCKS.WOOD ||
        type === BLOCKS.SAND ||
        type === BLOCKS.LEAVES ||
        type === BLOCKS.PLANKS ||
        type === BLOCKS.GLASS ||
        type === BLOCKS.DIAMOND ||
        type === BLOCKS.BRICK ||
        type === BLOCKS.IRON_ORE ||
        type === BLOCKS.GOLD_ORE ||
        type === BLOCKS.COAL_ORE ||
        type === BLOCKS.SNOW ||
        type === BLOCKS.ICE ||
        type === BLOCKS.JUNGLE_WOOD ||
        type === BLOCKS.JUNGLE_LEAVES ||
        type === BLOCKS.SNOW_LEAVES ||
        type === BLOCKS.BIRCH_WOOD ||
        type === BLOCKS.BIRCH_LEAVES ||
        type === BLOCKS.SANDSTONE ||
        type === BLOCKS.GRAVEL ||
        type === BLOCKS.TERRACOTTA ||
        type === BLOCKS.CACTUS ||
        type === BLOCKS.MOSSY_COBBLESTONE ||
        type === BLOCKS.REDSTONE_ORE ||
        type === BLOCKS.EMERALD_ORE
    );
}

// Blocks that let light through or require special face culling
export function isTransparentBlock(type) {
    return (
        type === BLOCKS.AIR ||
        type === BLOCKS.WATER ||
        type === BLOCKS.GLASS ||
        type === BLOCKS.LEAVES ||
        type === BLOCKS.JUNGLE_LEAVES ||
        type === BLOCKS.SNOW_LEAVES ||
        type === BLOCKS.BIRCH_LEAVES ||
        type === BLOCKS.CACTUS ||
        type === BLOCKS.ICE
    );
}

// Blocks that block player movement and occlude other blocks
export function isSolidBlock(type) {
    return type !== BLOCKS.AIR && type !== BLOCKS.WATER;
}

// Mining break times in seconds
export const breakTimes = {
    [BLOCKS.GRASS]: 0.35,
    [BLOCKS.DIRT]: 0.35,
    [BLOCKS.SAND]: 0.35,
    [BLOCKS.GRAVEL]: 0.35,
    [BLOCKS.SNOW]: 0.25,
    [BLOCKS.LEAVES]: 0.15,
    [BLOCKS.JUNGLE_LEAVES]: 0.15,
    [BLOCKS.SNOW_LEAVES]: 0.15,
    [BLOCKS.BIRCH_LEAVES]: 0.15,
    [BLOCKS.CACTUS]: 0.25,
    [BLOCKS.WOOD]: 0.8,
    [BLOCKS.JUNGLE_WOOD]: 0.8,
    [BLOCKS.BIRCH_WOOD]: 0.8,
    [BLOCKS.PLANKS]: 0.6,
    [BLOCKS.STONE]: 1.2,
    [BLOCKS.SANDSTONE]: 1.0,
    [BLOCKS.TERRACOTTA]: 1.3,
    [BLOCKS.MOSSY_COBBLESTONE]: 1.3,
    [BLOCKS.COAL_ORE]: 1.3,
    [BLOCKS.IRON_ORE]: 1.5,
    [BLOCKS.REDSTONE_ORE]: 1.5,
    [BLOCKS.BRICK]: 1.4,
    [BLOCKS.GOLD_ORE]: 1.7,
    [BLOCKS.EMERALD_ORE]: 2.0,
    [BLOCKS.DIAMOND]: 2.2,
    [BLOCKS.GLASS]: 0.2,
    [BLOCKS.ICE]: 0.3
};

// Colors for particles and minimaps
export const blockColors = {
    [BLOCKS.GRASS]: 0x5c8e32,
    [BLOCKS.DIRT]: 0x765438,
    [BLOCKS.STONE]: 0x828282,
    [BLOCKS.WOOD]: 0x58422E,
    [BLOCKS.SAND]: 0xdbca9a,
    [BLOCKS.LEAVES]: 0x366822,
    [BLOCKS.WATER]: 0x2e5cff,
    [BLOCKS.PLANKS]: 0xbf945c,
    [BLOCKS.GLASS]: 0xffffff,
    [BLOCKS.DIAMOND]: 0x33e3ff,
    [BLOCKS.BRICK]: 0x934b37,
    [BLOCKS.IRON_ORE]: 0xd4a373,
    [BLOCKS.GOLD_ORE]: 0xfad02c,
    [BLOCKS.COAL_ORE]: 0x333333,
    [BLOCKS.SNOW]: 0xf0f5ff,
    [BLOCKS.ICE]: 0x99ccff,
    [BLOCKS.JUNGLE_WOOD]: 0x5c4028,
    [BLOCKS.JUNGLE_LEAVES]: 0x256d1b,
    [BLOCKS.SNOW_LEAVES]: 0x477853,
    [BLOCKS.BIRCH_WOOD]: 0xd8d6cf,
    [BLOCKS.BIRCH_LEAVES]: 0x6ba33b,
    [BLOCKS.SANDSTONE]: 0xded29b,
    [BLOCKS.GRAVEL]: 0x7a7775,
    [BLOCKS.TERRACOTTA]: 0x985e43,
    [BLOCKS.CACTUS]: 0x527d26,
    [BLOCKS.MOSSY_COBBLESTONE]: 0x587352,
    [BLOCKS.REDSTONE_ORE]: 0xb31414,
    [BLOCKS.EMERALD_ORE]: 0x13c740
};

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

export const blockNames = {
    [BLOCKS.GRASS]: "Grasblock",
    [BLOCKS.DIRT]: "Erde",
    [BLOCKS.STONE]: "Stein",
    [BLOCKS.WOOD]: "Holzstamm",
    [BLOCKS.SAND]: "Sand",
    [BLOCKS.LEAVES]: "Laub",
    [BLOCKS.WATER]: "Wasser",
    [BLOCKS.PLANKS]: "Holzbretter",
    [BLOCKS.GLASS]: "Glas",
    [BLOCKS.DIAMOND]: "Diamant-Erz",
    [BLOCKS.BRICK]: "Ziegelstein",
    [BLOCKS.IRON_ORE]: "Eisenerz",
    [BLOCKS.GOLD_ORE]: "Golderz",
    [BLOCKS.COAL_ORE]: "Kohleerz",
    [BLOCKS.STICK]: "Stock",
    [BLOCKS.IRON_INGOT]: "Eisenbarren",
    [BLOCKS.GOLD_INGOT]: "Goldbarren",
    [BLOCKS.COAL]: "Kohle",
    [BLOCKS.WOOD_PICKAXE]: "Holzspitzhacke",
    [BLOCKS.STONE_PICKAXE]: "Steinspitzhacke",
    [BLOCKS.IRON_PICKAXE]: "Eisenspitzhacke",
    [BLOCKS.GOLD_PICKAXE]: "Goldspitzhacke",
    [BLOCKS.DIAMOND_PICKAXE]: "Diamantspitzhacke",
    [BLOCKS.WOOD_SWORD]: "Holzschwert",
    [BLOCKS.STONE_SWORD]: "Steinschwert",
    [BLOCKS.IRON_SWORD]: "Eisenschwert",
    [BLOCKS.GOLD_SWORD]: "Goldschwert",
    [BLOCKS.DIAMOND_SWORD]: "Diamantschwert",
    [BLOCKS.SNOW]: "Schnee",
    [BLOCKS.ICE]: "Eis",
    [BLOCKS.JUNGLE_WOOD]: "Dschungelholz",
    [BLOCKS.JUNGLE_LEAVES]: "Dschungellaub",
    [BLOCKS.SNOW_LEAVES]: "Schneelaub",
    [BLOCKS.BIRCH_WOOD]: "Birkenholz",
    [BLOCKS.BIRCH_LEAVES]: "Birkenlaub",
    [BLOCKS.SANDSTONE]: "Sandstein",
    [BLOCKS.GRAVEL]: "Kies",
    [BLOCKS.TERRACOTTA]: "Terrakotta",
    [BLOCKS.CACTUS]: "Kaktus",
    [BLOCKS.MOSSY_COBBLESTONE]: "Bemooster Bruchstein",
    [BLOCKS.REDSTONE_ORE]: "Redstone-Erz",
    [BLOCKS.EMERALD_ORE]: "Smaragd-Erz"
};
