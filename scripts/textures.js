// WebMinecraft High-Definition Pixel-Art Textures & Unified Texture Atlas
import * as THREE from 'three';
import { BLOCKS } from './blocks.js';

// Tile size in pixels for individual textures in the atlas
export const TILE_SIZE = 16;
export const ATLAS_COLS = 8;
export const ATLAS_ROWS = 8;
export const ATLAS_SIZE = 128; // 8 * 16 = 128px

// Tile indices inside the atlas grid
export const TILES = {
    GRASS_TOP: 0,
    GRASS_SIDE: 1,
    DIRT: 2,
    STONE: 3,
    WOOD_SIDE: 4,
    WOOD_TOP: 5,
    LEAVES: 6,
    SAND: 7,
    WATER: 8,
    PLANKS: 9,
    GLASS: 10,
    DIAMOND_ORE: 11,
    BRICK: 12,
    IRON_ORE: 13,
    GOLD_ORE: 14,
    COAL_ORE: 15,
    SNOW: 16,
    ICE: 17,
    JUNGLE_WOOD_SIDE: 18,
    JUNGLE_WOOD_TOP: 19,
    JUNGLE_LEAVES: 20,
    SNOW_LEAVES: 21,
    COBBLESTONE: 22,
    BIRCH_WOOD_SIDE: 23,
    BIRCH_WOOD_TOP: 24,
    BIRCH_LEAVES: 25,
    SANDSTONE_SIDE: 26,
    SANDSTONE_TOP: 27,
    GRAVEL: 28,
    TERRACOTTA: 29,
    CACTUS_SIDE: 30,
    CACTUS_TOP: 31,
    MOSSY_COBBLESTONE: 32,
    REDSTONE_ORE: 33,
    EMERALD_ORE: 34
};

// Map each block type to its face tile indices: [right(+X), left(-X), top(+Y), bottom(-Y), front(+Z), back(-Z)]
export const BLOCK_FACES = {
    [BLOCKS.GRASS]: [TILES.GRASS_SIDE, TILES.GRASS_SIDE, TILES.GRASS_TOP, TILES.DIRT, TILES.GRASS_SIDE, TILES.GRASS_SIDE],
    [BLOCKS.DIRT]: [TILES.DIRT, TILES.DIRT, TILES.DIRT, TILES.DIRT, TILES.DIRT, TILES.DIRT],
    [BLOCKS.STONE]: [TILES.STONE, TILES.STONE, TILES.STONE, TILES.STONE, TILES.STONE, TILES.STONE],
    [BLOCKS.WOOD]: [TILES.WOOD_SIDE, TILES.WOOD_SIDE, TILES.WOOD_TOP, TILES.WOOD_TOP, TILES.WOOD_SIDE, TILES.WOOD_SIDE],
    [BLOCKS.SAND]: [TILES.SAND, TILES.SAND, TILES.SAND, TILES.SAND, TILES.SAND, TILES.SAND],
    [BLOCKS.LEAVES]: [TILES.LEAVES, TILES.LEAVES, TILES.LEAVES, TILES.LEAVES, TILES.LEAVES, TILES.LEAVES],
    [BLOCKS.WATER]: [TILES.WATER, TILES.WATER, TILES.WATER, TILES.WATER, TILES.WATER, TILES.WATER],
    [BLOCKS.PLANKS]: [TILES.PLANKS, TILES.PLANKS, TILES.PLANKS, TILES.PLANKS, TILES.PLANKS, TILES.PLANKS],
    [BLOCKS.GLASS]: [TILES.GLASS, TILES.GLASS, TILES.GLASS, TILES.GLASS, TILES.GLASS, TILES.GLASS],
    [BLOCKS.DIAMOND]: [TILES.DIAMOND_ORE, TILES.DIAMOND_ORE, TILES.DIAMOND_ORE, TILES.DIAMOND_ORE, TILES.DIAMOND_ORE, TILES.DIAMOND_ORE],
    [BLOCKS.BRICK]: [TILES.BRICK, TILES.BRICK, TILES.BRICK, TILES.BRICK, TILES.BRICK, TILES.BRICK],
    [BLOCKS.IRON_ORE]: [TILES.IRON_ORE, TILES.IRON_ORE, TILES.IRON_ORE, TILES.IRON_ORE, TILES.IRON_ORE, TILES.IRON_ORE],
    [BLOCKS.GOLD_ORE]: [TILES.GOLD_ORE, TILES.GOLD_ORE, TILES.GOLD_ORE, TILES.GOLD_ORE, TILES.GOLD_ORE, TILES.GOLD_ORE],
    [BLOCKS.COAL_ORE]: [TILES.COAL_ORE, TILES.COAL_ORE, TILES.COAL_ORE, TILES.COAL_ORE, TILES.COAL_ORE, TILES.COAL_ORE],
    [BLOCKS.SNOW]: [TILES.SNOW, TILES.SNOW, TILES.SNOW, TILES.DIRT, TILES.SNOW, TILES.SNOW],
    [BLOCKS.ICE]: [TILES.ICE, TILES.ICE, TILES.ICE, TILES.ICE, TILES.ICE, TILES.ICE],
    [BLOCKS.JUNGLE_WOOD]: [TILES.JUNGLE_WOOD_SIDE, TILES.JUNGLE_WOOD_SIDE, TILES.JUNGLE_WOOD_TOP, TILES.JUNGLE_WOOD_TOP, TILES.JUNGLE_WOOD_SIDE, TILES.JUNGLE_WOOD_SIDE],
    [BLOCKS.JUNGLE_LEAVES]: [TILES.JUNGLE_LEAVES, TILES.JUNGLE_LEAVES, TILES.JUNGLE_LEAVES, TILES.JUNGLE_LEAVES, TILES.JUNGLE_LEAVES, TILES.JUNGLE_LEAVES],
    [BLOCKS.SNOW_LEAVES]: [TILES.SNOW_LEAVES, TILES.SNOW_LEAVES, TILES.SNOW_LEAVES, TILES.SNOW_LEAVES, TILES.SNOW_LEAVES, TILES.SNOW_LEAVES],
    [BLOCKS.BIRCH_WOOD]: [TILES.BIRCH_WOOD_SIDE, TILES.BIRCH_WOOD_SIDE, TILES.BIRCH_WOOD_TOP, TILES.BIRCH_WOOD_TOP, TILES.BIRCH_WOOD_SIDE, TILES.BIRCH_WOOD_SIDE],
    [BLOCKS.BIRCH_LEAVES]: [TILES.BIRCH_LEAVES, TILES.BIRCH_LEAVES, TILES.BIRCH_LEAVES, TILES.BIRCH_LEAVES, TILES.BIRCH_LEAVES, TILES.BIRCH_LEAVES],
    [BLOCKS.SANDSTONE]: [TILES.SANDSTONE_SIDE, TILES.SANDSTONE_SIDE, TILES.SANDSTONE_TOP, TILES.SANDSTONE_TOP, TILES.SANDSTONE_SIDE, TILES.SANDSTONE_SIDE],
    [BLOCKS.GRAVEL]: [TILES.GRAVEL, TILES.GRAVEL, TILES.GRAVEL, TILES.GRAVEL, TILES.GRAVEL, TILES.GRAVEL],
    [BLOCKS.TERRACOTTA]: [TILES.TERRACOTTA, TILES.TERRACOTTA, TILES.TERRACOTTA, TILES.TERRACOTTA, TILES.TERRACOTTA, TILES.TERRACOTTA],
    [BLOCKS.CACTUS]: [TILES.CACTUS_SIDE, TILES.CACTUS_SIDE, TILES.CACTUS_TOP, TILES.CACTUS_TOP, TILES.CACTUS_SIDE, TILES.CACTUS_SIDE],
    [BLOCKS.MOSSY_COBBLESTONE]: [TILES.MOSSY_COBBLESTONE, TILES.MOSSY_COBBLESTONE, TILES.MOSSY_COBBLESTONE, TILES.MOSSY_COBBLESTONE, TILES.MOSSY_COBBLESTONE, TILES.MOSSY_COBBLESTONE],
    [BLOCKS.COBBLESTONE]: [TILES.COBBLESTONE, TILES.COBBLESTONE, TILES.COBBLESTONE, TILES.COBBLESTONE, TILES.COBBLESTONE, TILES.COBBLESTONE],
    [BLOCKS.REDSTONE_ORE]: [TILES.REDSTONE_ORE, TILES.REDSTONE_ORE, TILES.REDSTONE_ORE, TILES.REDSTONE_ORE, TILES.REDSTONE_ORE, TILES.REDSTONE_ORE],
    [BLOCKS.EMERALD_ORE]: [TILES.EMERALD_ORE, TILES.EMERALD_ORE, TILES.EMERALD_ORE, TILES.EMERALD_ORE, TILES.EMERALD_ORE, TILES.EMERALD_ORE]
};

// Seeded pseudorandom for deterministic crisp pixel art
function createRandom(seed = 12345) {
    let s = seed;
    return function() {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

// Generate pixel art for each tile onto a canvas context at (offsetX, offsetY)
function renderTileToCanvas(ctx, tileIndex, ox, oy) {
    const rng = createRandom(tileIndex * 7919 + 101);
    const rand = (min, max) => Math.floor(rng() * (max - min + 1) + min);

    // Helper to blend color
    const setCol = (rx, ry, r, g, b, a = 1.0) => {
        ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
        ctx.fillRect(ox + rx, oy + ry, 1, 1);
    };

    // Pre-render stone base for ores & stone
    const getStoneNoise = (x, y) => {
        const val = ((x * 7 + y * 13 + ((x ^ y) * 3)) % 11) / 11;
        if (val < 0.25) return [142, 142, 142];
        if (val < 0.65) return [125, 125, 125];
        if (val < 0.88) return [110, 110, 110];
        return [96, 96, 96];
    };

    for (let py = 0; py < 16; py++) {
        for (let px = 0; px < 16; px++) {
            let r = 128, g = 128, b = 128, a = 1.0;

            switch (tileIndex) {
                case TILES.GRASS_TOP: {
                    // Authentic rich Minecraft grass palette
                    const hash = (px * 31 + py * 17 + ((px ^ py) * 7)) % 100;
                    if (hash < 18) { r = 112; g = 185; b = 48; } // Bright blade highlight
                    else if (hash < 55) { r = 94; g = 157; b = 38; } // Mid lush green
                    else if (hash < 82) { r = 76; g = 138; b = 30; } // Shadow green
                    else { r = 62; g = 118; b = 24; } // Deep blade shadow
                    break;
                }

                case TILES.GRASS_SIDE: {
                    // Jagged organic grass overhang with dripping blades over rich soil
                    const overhang = [
                        3, 4, 3, 5, 4, 3, 4, 6, 4, 3, 5, 4, 3, 4, 5, 3
                    ][px];

                    if (py < overhang) {
                        // Grass blade
                        if (py === overhang - 1) {
                            // Dark edge of grass
                            r = 65; g = 120; b = 25;
                        } else if (py === 0) {
                            r = 105; g = 175; b = 45;
                        } else {
                            r = 85; g = 150; b = 35;
                        }
                    } else {
                        // Rich dark loamy dirt with small pebbles
                        const dHash = (px * 13 + py * 29 + ((px ^ py) * 11)) % 100;
                        if (dHash < 8) {
                            // Tiny stone pebble
                            r = 138; g = 138; b = 138;
                        } else if (dHash < 32) {
                            r = 145; g = 102; b = 68; // Light loam
                        } else if (dHash < 75) {
                            r = 122; g = 84; b = 54; // Mid rich earth
                        } else {
                            r = 98; g = 66; b = 42; // Deep shadow soil
                        }
                    }
                    break;
                }

                case TILES.DIRT: {
                    const dHash = (px * 19 + py * 37 + ((px ^ py) * 13)) % 100;
                    if (dHash < 6) {
                        r = 138; g = 138; b = 138; // Pebble
                    } else if (dHash < 30) {
                        r = 145; g = 102; b = 68;
                    } else if (dHash < 75) {
                        r = 122; g = 84; b = 54;
                    } else {
                        r = 98; g = 66; b = 42;
                    }
                    break;
                }

                case TILES.STONE: {
                    const [sr, sg, sb] = getStoneNoise(px, py);
                    r = sr; g = sg; b = sb;
                    break;
                }

                case TILES.COBBLESTONE: {
                    // Authentic cobblestone with distinct rounded stones, highlights and mortar crevices
                    // Map cobblestone pattern
                    const cobbleMap = [
                        [1,1,1,0,2,2,2,2,0,1,1,1,1,0,2,2],
                        [1,3,1,0,2,3,3,2,0,1,3,3,1,0,2,3],
                        [1,1,1,0,2,2,2,2,0,1,1,1,1,0,2,2],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [2,2,0,1,1,1,1,0,2,2,2,0,1,1,1,0],
                        [2,3,0,1,3,3,1,0,2,3,2,0,1,3,1,0],
                        [2,2,0,1,1,1,1,0,2,2,2,0,1,1,1,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [1,1,1,1,0,2,2,2,2,0,1,1,1,0,2,2],
                        [1,3,3,1,0,2,3,3,2,0,1,3,1,0,2,3],
                        [1,1,1,1,0,2,2,2,2,0,1,1,1,0,2,2],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [2,2,2,0,1,1,1,0,2,2,2,2,0,1,1,1],
                        [2,3,2,0,1,3,1,0,2,3,3,2,0,1,3,1],
                        [2,2,2,0,1,1,1,0,2,2,2,2,0,1,1,1],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                    ];
                    const val = cobbleMap[py][px];
                    if (val === 0) {
                        r = 60; g = 60; b = 60; // Deep mortar crevice
                    } else if (val === 3) {
                        r = 155; g = 155; b = 155; // Stone top highlight
                    } else if (val === 2) {
                        r = 128; g = 128; b = 128; // Mid stone
                    } else {
                        r = 100; g = 100; b = 100; // Shadow stone edge
                    }
                    break;
                }

                case TILES.WOOD_SIDE: {
                    // Authentic Oak Log bark with vertical striations, ridges and deep bark crevices
                    const barkCol = px % 4;
                    const bNoise = ((py * 7 + px * 13) % 7);
                    if (barkCol === 0) {
                        r = 65 + bNoise; g = 45 + bNoise; b = 28; // Deep shadow crevice
                    } else if (barkCol === 1) {
                        r = 128 + bNoise * 2; g = 96 + bNoise; b = 58; // Bark ridge highlight
                    } else if (barkCol === 2) {
                        r = 108 + bNoise; g = 78 + bNoise; b = 48; // Mid bark
                    } else {
                        r = 85 + bNoise; g = 60 + bNoise; b = 36; // Shadow bark
                    }
                    break;
                }

                case TILES.WOOD_TOP: {
                    // Tree rings with heartwood center and dark outer bark boundary
                    const dx = px - 7.5;
                    const dy = py - 7.5;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 6.4) {
                        r = 75; g = 52; b = 32; // Outer bark rim
                    } else {
                        const ring = Math.floor(dist * 1.5) % 2;
                        const wNoise = (px * 3 + py * 5) % 5;
                        if (dist < 1.8) {
                            r = 165; g = 125; b = 75; // Heartwood core
                        } else if (ring === 0) {
                            r = 195 + wNoise; g = 158 + wNoise; b = 102; // Light ring
                        } else {
                            r = 168 + wNoise; g = 132 + wNoise; b = 82; // Dark growth ring
                        }
                    }
                    break;
                }

                case TILES.PLANKS: {
                    // Horizontal oak boards with dark seams, nail rivets, and woodgrain
                    const isHorizontalSeam = (py === 3 || py === 7 || py === 11 || py === 15);
                    const isVerticalSeam = (py < 4 && px === 8) || (py >= 4 && py < 8 && px === 12) ||
                                           (py >= 8 && py < 12 && px === 4) || (py >= 12 && px === 10);
                    const isNail = (
                        (py === 1 && (px === 7 || px === 9)) ||
                        (py === 5 && (px === 11 || px === 13)) ||
                        (py === 9 && (px === 3 || px === 5)) ||
                        (py === 13 && (px === 9 || px === 11))
                    );

                    if (isHorizontalSeam || isVerticalSeam) {
                        r = 95; g = 68; b = 38; // Inset groove
                    } else if (isNail) {
                        r = 70; g = 50; b = 30; // Iron nail rivet
                    } else if (py === 0 || py === 4 || py === 8 || py === 12) {
                        r = 205; g = 165; b = 112; // Top board bevel highlight
                    } else {
                        const pNoise = (px * 7 + py * 13) % 15;
                        r = 182 + pNoise; g = 142 + pNoise; b = 92;
                    }
                    break;
                }

                case TILES.LEAVES: {
                    // Lush Oak foliage with alpha punch-through cutouts
                    const leafPattern = [
                        [0,1,1,2,0,1,2,2,1,0,1,1,2,1,0,1],
                        [1,2,3,1,1,2,3,2,1,1,2,3,2,1,1,2],
                        [1,3,2,1,2,3,1,1,2,2,3,2,1,2,3,1],
                        [0,1,1,0,1,2,1,0,1,1,2,1,0,1,2,0],
                        [1,2,2,1,0,1,2,2,1,0,1,2,2,1,1,1],
                        [2,3,3,2,1,2,3,3,2,1,2,3,3,2,1,2],
                        [1,3,2,1,1,3,2,2,1,1,3,2,1,1,2,1],
                        [0,1,1,0,1,1,1,0,1,1,1,1,0,1,1,0],
                        [1,1,2,1,0,1,2,2,1,0,1,2,2,1,0,1],
                        [2,3,2,1,1,2,3,2,1,1,2,3,2,1,1,2],
                        [1,3,3,2,1,3,2,1,2,2,3,2,1,2,3,1],
                        [0,1,2,1,0,1,1,0,1,1,2,1,0,1,2,0],
                        [1,2,2,1,1,2,2,1,1,0,1,2,2,1,1,1],
                        [2,3,3,2,2,3,3,2,1,1,2,3,3,2,1,2],
                        [1,2,2,1,1,2,2,1,1,2,3,2,1,1,2,1],
                        [0,1,1,0,0,1,1,0,1,1,1,0,0,1,1,0]
                    ];
                    const lVal = leafPattern[py][px];
                    if (lVal === 0) {
                        a = 0; // Cutout
                    } else if (lVal === 3) {
                        r = 85; g = 175; b = 45; // Bright sunlit leaf tip
                    } else if (lVal === 2) {
                        r = 65; g = 145; b = 32; // Mid lush leaf
                    } else {
                        r = 45; g = 110; b = 22; // Shadow leaf
                    }
                    break;
                }

                case TILES.GLASS: {
                    // Modern clear glass pane with subtle frame & reflective diagonal glints
                    const isBorder = (px === 0 || px === 15 || py === 0 || py === 15);
                    const isGlint = (
                        (px + py === 6 && px >= 2 && px <= 4) ||
                        (px + py === 7 && px >= 2 && px <= 5) ||
                        (px + py === 20 && px >= 9 && px <= 11)
                    );
                    if (isBorder) {
                        r = 220; g = 238; b = 250; a = 0.85;
                    } else if (isGlint) {
                        r = 255; g = 255; b = 255; a = 0.65;
                    } else {
                        r = 185; g = 215; b = 240; a = 0.12;
                    }
                    break;
                }

                case TILES.DIAMOND_ORE: {
                    const [sr, sg, sb] = getStoneNoise(px, py);
                    // Distinctive diamond gemstone clusters
                    const isDiamond = (
                        (px >= 3 && px <= 6 && py >= 3 && py <= 6 && (px !== 3 || py !== 3)) ||
                        (px >= 9 && px <= 13 && py >= 7 && py <= 11 && (px !== 13 || py !== 11)) ||
                        (px >= 4 && px <= 7 && py >= 11 && py <= 14)
                    );
                    const isSparkle = (px === 4 && py === 4) || (px === 10 && py === 8) || (px === 5 && py === 12);
                    const isGemEdge = (px === 3 || px === 6 || py === 3 || py === 6 || px === 9 || py === 7);

                    if (isSparkle) {
                        r = 235; g = 255; b = 255; // White diamond glint
                    } else if (isDiamond) {
                        if (isGemEdge) {
                            r = 40; g = 180; b = 210; // Dark cyan rim
                        } else {
                            r = 90; g = 242; b = 255; // Brilliant cyan
                        }
                    } else {
                        r = sr; g = sg; b = sb;
                    }
                    break;
                }

                case TILES.GOLD_ORE: {
                    const [sr, sg, sb] = getStoneNoise(px, py);
                    const isGold = (
                        (px >= 3 && px <= 6 && py >= 4 && py <= 7) ||
                        (px >= 9 && px <= 13 && py >= 8 && py <= 12) ||
                        (px >= 5 && px <= 8 && py >= 12 && py <= 14)
                    );
                    const isGlint = (px === 4 && py === 5) || (px === 11 && py === 9);
                    if (isGlint) {
                        r = 255; g = 255; b = 180;
                    } else if (isGold) {
                        r = 252; g = 218; b = 45;
                    } else {
                        r = sr; g = sg; b = sb;
                    }
                    break;
                }

                case TILES.IRON_ORE: {
                    const [sr, sg, sb] = getStoneNoise(px, py);
                    const isIron = (
                        (px >= 3 && px <= 7 && py >= 4 && py <= 7) ||
                        (px >= 8 && px <= 13 && py >= 9 && py <= 12) ||
                        (px >= 4 && px <= 7 && py >= 11 && py <= 14)
                    );
                    const isHighlight = (px === 4 && py === 5) || (px === 10 && py === 10);
                    if (isHighlight) {
                        r = 238; g = 205; b = 180;
                    } else if (isIron) {
                        r = 195; g = 158; b = 132;
                    } else {
                        r = sr; g = sg; b = sb;
                    }
                    break;
                }

                case TILES.COAL_ORE: {
                    const [sr, sg, sb] = getStoneNoise(px, py);
                    const isCoal = (
                        (px >= 3 && px <= 7 && py >= 3 && py <= 7) ||
                        (px >= 8 && px <= 13 && py >= 8 && py <= 12) ||
                        (px >= 4 && px <= 8 && py >= 11 && py <= 14)
                    );
                    const isFacet = (px === 4 && py === 4) || (px === 10 && py === 9);
                    if (isFacet) {
                        r = 55; g = 55; b = 55;
                    } else if (isCoal) {
                        r = 22; g = 22; b = 22;
                    } else {
                        r = sr; g = sg; b = sb;
                    }
                    break;
                }

                case TILES.SAND: {
                    // Warm golden dunes with ripple lines
                    const sNoise = (px * 11 + py * 23 + ((px ^ py) * 7)) % 100;
                    const ripple = Math.sin((px + py * 1.5) * 0.8) * 6;
                    if (sNoise < 15) {
                        r = 236 + ripple; g = 222 + ripple; b = 175;
                    } else if (sNoise < 70) {
                        r = 225 + ripple; g = 210 + ripple; b = 158;
                    } else {
                        r = 208 + ripple; g = 192 + ripple; b = 142;
                    }
                    break;
                }

                case TILES.WATER: {
                    // Crystal cyan-blue translucent water with shimmering surface ripple
                    const wave = Math.sin((px * 0.6 + py * 0.4) * 3.14) * 18;
                    r = Math.floor(40 + wave * 0.3);
                    g = Math.floor(118 + wave * 0.5);
                    b = Math.floor(238 + wave * 0.4);
                    a = 0.72;
                    break;
                }

                case TILES.BRICK: {
                    // Running bond red terracotta bricks with crisp cement mortar
                    const isMortarY = (py === 3 || py === 7 || py === 11 || py === 15);
                    const isMortarX = (py < 4 && (px === 0 || px === 8)) ||
                                      (py >= 4 && py < 8 && (px === 4 || px === 12)) ||
                                      (py >= 8 && py < 12 && (px === 0 || px === 8)) ||
                                      (py >= 12 && (px === 4 || px === 12));

                    if (isMortarY || isMortarX) {
                        r = 210; g = 205; b = 200; // Mortar
                    } else if (py === 0 || py === 4 || py === 8 || py === 12) {
                        r = 188; g = 85; b = 65; // Brick top highlight
                    } else {
                        const bNoise = (px * 7 + py * 11) % 15;
                        r = 158 + bNoise; g = 62 + bNoise; b = 45;
                    }
                    break;
                }

                case TILES.SNOW: {
                    const sNoise = (px * 13 + py * 19) % 15;
                    r = 248 + sNoise; g = 250 + sNoise; b = 255;
                    break;
                }

                case TILES.ICE: {
                    const iNoise = (px * 7 + py * 11) % 20;
                    r = 168 + iNoise; g = 210 + iNoise; b = 255;
                    a = 0.75;
                    break;
                }

                case TILES.JUNGLE_WOOD_SIDE: {
                    const col = px % 4;
                    const jNoise = ((py * 5 + px * 7) % 6);
                    if (col === 0) { r = 68; g = 48; b = 28; }
                    else if (col === 1) { r = 118 + jNoise; g = 85 + jNoise; b = 48; }
                    else { r = 95 + jNoise; g = 68 + jNoise; b = 38; }
                    break;
                }

                case TILES.JUNGLE_WOOD_TOP: {
                    const dist = Math.hypot(px - 7.5, py - 7.5);
                    if (dist > 6.4) { r = 70; g = 50; b = 30; }
                    else if (Math.floor(dist * 1.5) % 2 === 0) { r = 185; g = 145; b = 92; }
                    else { r = 155; g = 118; b = 74; }
                    break;
                }

                case TILES.JUNGLE_LEAVES: {
                    const leafVal = ((px * 3 + py * 7) % 11);
                    if (leafVal < 2) a = 0;
                    else if (leafVal < 5) { r = 45; g = 145; b = 25; }
                    else if (leafVal < 8) { r = 32; g = 115; b = 18; }
                    else { r = 58; g = 168; b = 34; }
                    break;
                }

                case TILES.SNOW_LEAVES: {
                    if (py < 4) {
                        r = 245; g = 248; b = 255; // Snow dusting
                    } else {
                        const sVal = ((px * 5 + py * 7) % 10);
                        if (sVal < 2) a = 0;
                        else { r = 48; g = 105; b = 58; }
                    }
                    break;
                }

                case TILES.BIRCH_WOOD_SIDE: {
                    // Distinctive white birch bark with horizontal dark lenticels/notches
                    const bVal = (px * 13 + py * 31) % 17;
                    const isNotch = (py === 3 && px > 4 && px < 11) ||
                                    (py === 8 && px > 1 && px < 7) ||
                                    (py === 12 && px > 9 && px < 15) ||
                                    (py === 14 && px > 3 && px < 6);
                    if (isNotch) {
                        r = 38; g = 38; b = 38; // Dark birch notch
                    } else if (bVal < 4) {
                        r = 205; g = 203; b = 195; // Light warm shadow
                    } else if (bVal < 14) {
                        r = 228; g = 226; b = 220; // Pure birch white
                    } else {
                        r = 180; g = 178; b = 172; // Gray fleck
                    }
                    break;
                }

                case TILES.BIRCH_WOOD_TOP: {
                    const dx = px - 7.5;
                    const dy = py - 7.5;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 6.4) {
                        r = 220; g = 218; b = 212; // Birch white outer bark
                    } else if (dist < 1.8) {
                        r = 185; g = 158; b = 120; // Core
                    } else {
                        const ring = Math.floor(dist * 1.5) % 2;
                        r = (ring === 0) ? 210 : 190;
                        g = (ring === 0) ? 185 : 165;
                        b = (ring === 0) ? 145 : 125;
                    }
                    break;
                }

                case TILES.BIRCH_LEAVES: {
                    const bVal = ((px * 7 + py * 13) % 11);
                    if (bVal < 2) a = 0;
                    else if (bVal < 6) { r = 110; g = 168; b = 52; } // Fresh bright yellow-green
                    else if (bVal < 9) { r = 85; g = 142; b = 38; }
                    else { r = 135; g = 190; b = 65; }
                    break;
                }

                case TILES.SANDSTONE_SIDE: {
                    // Stratified horizontal golden desert rock
                    const isBorder = (py === 0 || py === 15);
                    const isStrat = (py === 4 || py === 5 || py === 10);
                    const sNoise = (px * 11 + py * 17) % 12;
                    if (isBorder) {
                        r = 190; g = 175; b = 125;
                    } else if (isStrat) {
                        r = 215 + sNoise; g = 200 + sNoise; b = 145 + sNoise;
                    } else {
                        r = 225 + sNoise; g = 210 + sNoise; b = 155 + sNoise;
                    }
                    break;
                }

                case TILES.SANDSTONE_TOP: {
                    const sNoise = (px * 13 + py * 19) % 15;
                    r = 220 + sNoise; g = 205 + sNoise; b = 150 + sNoise;
                    break;
                }

                case TILES.GRAVEL: {
                    // Natural rounded river pebbles & granite flecks
                    const gNoise = (px * 23 + py * 41 + ((px ^ py) * 9)) % 100;
                    if (gNoise < 15) { r = 95; g = 92; b = 90; } // Dark flint
                    else if (gNoise < 45) { r = 125; g = 122; b = 118; }
                    else if (gNoise < 75) { r = 145; g = 140; b = 136; }
                    else if (gNoise < 90) { r = 165; g = 158; b = 152; } // Quartz speck
                    else { r = 110; g = 98; b = 95; } // Granite fleck
                    break;
                }

                case TILES.TERRACOTTA: {
                    // Rich warm baked red clay
                    const tNoise = (px * 17 + py * 29) % 10;
                    r = 152 + tNoise; g = 94 + tNoise; b = 67 + tNoise;
                    break;
                }

                case TILES.CACTUS_SIDE: {
                    // Deep ribbed green vertical stripes with needle spines
                    const rib = px % 4;
                    const isNeedle = (py % 4 === 1 && (px === 1 || px === 5 || px === 9 || px === 13)) ||
                                     (py % 4 === 3 && (px === 3 || px === 7 || px === 11 || px === 15));
                    if (isNeedle) {
                        r = 230; g = 240; b = 200; // Spine needle
                    } else if (rib === 0) {
                        r = 45; g = 92; b = 25; // Shadow rib
                    } else if (rib === 2) {
                        r = 85; g = 145; b = 42; // Crest highlight
                    } else {
                        r = 65; g = 120; b = 32;
                    }
                    break;
                }

                case TILES.CACTUS_TOP: {
                    const dx = px - 7.5;
                    const dy = py - 7.5;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 7.0) a = 0;
                    else if (dist < 2.0) { r = 50; g = 100; b = 28; }
                    else { r = 72; g = 132; b = 36; }
                    break;
                }

                case TILES.MOSSY_COBBLESTONE: {
                    // Cobblestone with creeping lush moss
                    const [sr, sg, sb] = getStoneNoise(px, py);
                    const isMoss = ((px * 19 + py * 29 + ((px ^ py) * 11)) % 100) < 45;
                    if (isMoss) {
                        r = 68; g = 125; b = 38; // Lush green moss
                    } else {
                        r = sr; g = sg; b = sb;
                    }
                    break;
                }

                case TILES.REDSTONE_ORE: {
                    const [sr, sg, sb] = getStoneNoise(px, py);
                    const isGem = (
                        (px >= 3 && px <= 5 && py >= 4 && py <= 6) ||
                        (px >= 10 && px <= 12 && py >= 2 && py <= 4) ||
                        (px >= 7 && px <= 9 && py >= 11 && py <= 13) ||
                        (px >= 12 && px <= 14 && py >= 9 && py <= 11)
                    );
                    if (isGem) {
                        if (px === 4 && py === 5 || px === 11 && py === 3 || px === 8 && py === 12) {
                            r = 255; g = 80; b = 80; // Bright crimson glow
                        } else {
                            r = 185; g = 20; b = 20;
                        }
                    } else {
                        r = sr; g = sg; b = sb;
                    }
                    break;
                }

                case TILES.EMERALD_ORE: {
                    const [sr, sg, sb] = getStoneNoise(px, py);
                    const isGem = (
                        (px >= 5 && px <= 8 && py >= 5 && py <= 8) ||
                        (px >= 10 && px <= 13 && py >= 10 && py <= 13)
                    );
                    if (isGem) {
                        if ((px === 6 && py === 6) || (px === 11 && py === 11)) {
                            r = 85; g = 255; b = 120; // Pure emerald sparkle
                        } else {
                            r = 20; g = 195; b = 65;
                        }
                    } else {
                        r = sr; g = sg; b = sb;
                    }
                    break;
                }

                default: {
                    r = 128; g = 128; b = 128;
                }
            }

            ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
            ctx.fillRect(ox + px, oy + py, 1, 1);
        }
    }
}

// Master Atlas Texture Holder
let atlasCanvas = null;
let atlasTexture = null;
let opaqueMaterial = null;
let transparentMaterial = null;

// Tile metadata for Texture Pack and Custom PNG Management
export const TILE_META = [
    { id: TILES.GRASS_TOP, name: 'Gras Oben', file: 'grass_top.png' },
    { id: TILES.GRASS_SIDE, name: 'Gras Seite', file: 'grass_side.png' },
    { id: TILES.DIRT, name: 'Erde', file: 'dirt.png' },
    { id: TILES.STONE, name: 'Stein', file: 'stone.png' },
    { id: TILES.COBBLESTONE, name: 'Bruchstein', file: 'cobblestone.png' },
    { id: TILES.WOOD_SIDE, name: 'Holz Seite', file: 'wood_side.png' },
    { id: TILES.WOOD_TOP, name: 'Holz Oben', file: 'wood_top.png' },
    { id: TILES.PLANKS, name: 'Holzbretter', file: 'planks.png' },
    { id: TILES.LEAVES, name: 'Laub', file: 'leaves.png' },
    { id: TILES.SAND, name: 'Sand', file: 'sand.png' },
    { id: TILES.WATER, name: 'Wasser', file: 'water.png' },
    { id: TILES.GLASS, name: 'Glas', file: 'glass.png' },
    { id: TILES.DIAMOND_ORE, name: 'Diamanterz', file: 'diamond_ore.png' },
    { id: TILES.IRON_ORE, name: 'Eisenerz', file: 'iron_ore.png' },
    { id: TILES.GOLD_ORE, name: 'Golderz', file: 'gold_ore.png' },
    { id: TILES.COAL_ORE, name: 'Kohleerz', file: 'coal_ore.png' },
    { id: TILES.BRICK, name: 'Ziegel', file: 'brick.png' },
    { id: TILES.SNOW, name: 'Schnee', file: 'snow.png' },
    { id: TILES.ICE, name: 'Eis', file: 'ice.png' },
    { id: TILES.BIRCH_WOOD_SIDE, name: 'Birkenholz Seite', file: 'birch_side.png' },
    { id: TILES.BIRCH_WOOD_TOP, name: 'Birkenholz Oben', file: 'birch_top.png' },
    { id: TILES.BIRCH_LEAVES, name: 'Birkenlaub', file: 'birch_leaves.png' },
    { id: TILES.SANDSTONE_SIDE, name: 'Sandstein Seite', file: 'sandstone_side.png' },
    { id: TILES.SANDSTONE_TOP, name: 'Sandstein Oben', file: 'sandstone_top.png' },
    { id: TILES.GRAVEL, name: 'Kies', file: 'gravel.png' },
    { id: TILES.TERRACOTTA, name: 'Terrakotta', file: 'terracotta.png' },
    { id: TILES.CACTUS_SIDE, name: 'Kaktus Seite', file: 'cactus_side.png' },
    { id: TILES.CACTUS_TOP, name: 'Kaktus Oben', file: 'cactus_top.png' },
    { id: TILES.MOSSY_COBBLESTONE, name: 'Bemooster Bruchstein', file: 'mossy_cobblestone.png' },
    { id: TILES.REDSTONE_ORE, name: 'Redstone-Erz', file: 'redstone_ore.png' },
    { id: TILES.EMERALD_ORE, name: 'Smaragd-Erz', file: 'emerald_ore.png' }
];

export function getAtlasCanvas() {
    return atlasCanvas;
}

export function getAtlasTexture() {
    if (atlasTexture) return atlasTexture;

    atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = ATLAS_SIZE;
    atlasCanvas.height = ATLAS_SIZE;
    const ctx = atlasCanvas.getContext('2d');
    ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);

    // 1. Initial render with procedural fallbacks (instant availability)
    const totalTiles = Object.keys(TILES).length;
    for (let i = 0; i < totalTiles; i++) {
        const col = i % ATLAS_COLS;
        const row = Math.floor(i / ATLAS_COLS);
        const ox = col * TILE_SIZE;
        const oy = row * TILE_SIZE;
        renderTileToCanvas(ctx, i, ox, oy);
    }

    atlasTexture = new THREE.CanvasTexture(atlasCanvas);
    atlasTexture.magFilter = THREE.NearestFilter;
    atlasTexture.minFilter = THREE.NearestFilter;
    atlasTexture.generateMipmaps = false;

    // 2. Load authentic PNG textures asynchronously
    loadAllPNGTextures();

    return atlasTexture;
}

// Load default PNGs and apply any custom user uploaded textures
export function loadAllPNGTextures() {
    if (!atlasCanvas) return;
    const ctx = atlasCanvas.getContext('2d');

    for (const item of TILE_META) {
        const tileIdx = item.id;
        const col = tileIdx % ATLAS_COLS;
        const row = Math.floor(tileIdx / ATLAS_COLS);
        const ox = col * TILE_SIZE;
        const oy = row * TILE_SIZE;

        // Check for user-uploaded custom PNG first
        const customData = localStorage.getItem('webmc_custom_png_' + tileIdx);
        if (customData) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(ox, oy, TILE_SIZE, TILE_SIZE);
                ctx.drawImage(img, 0, 0, img.width, img.height, ox, oy, TILE_SIZE, TILE_SIZE);
                if (atlasTexture) atlasTexture.needsUpdate = true;
                window.dispatchEvent(new CustomEvent('mc_textures_updated', { detail: { tileIdx } }));
            };
            img.src = customData;
            continue;
        }

        // Otherwise load default PNG file
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            ctx.clearRect(ox, oy, TILE_SIZE, TILE_SIZE);
            ctx.drawImage(img, 0, 0, img.width, img.height, ox, oy, TILE_SIZE, TILE_SIZE);
            if (atlasTexture) atlasTexture.needsUpdate = true;
            window.dispatchEvent(new CustomEvent('mc_textures_updated', { detail: { tileIdx } }));
        };
        img.onerror = () => {
            // Fallback stays in place
        };
        img.src = `/textures/${item.file}`;
    }
}

// Upload a custom user PNG for a specific tile
export function uploadCustomPNG(tileIdx, dataUrl) {
    if (!atlasCanvas) getAtlasTexture();
    const ctx = atlasCanvas.getContext('2d');
    const col = tileIdx % ATLAS_COLS;
    const row = Math.floor(tileIdx / ATLAS_COLS);
    const ox = col * TILE_SIZE;
    const oy = row * TILE_SIZE;

    const img = new Image();
    img.onload = () => {
        ctx.clearRect(ox, oy, TILE_SIZE, TILE_SIZE);
        ctx.drawImage(img, 0, 0, img.width, img.height, ox, oy, TILE_SIZE, TILE_SIZE);
        if (atlasTexture) atlasTexture.needsUpdate = true;
        try {
            localStorage.setItem('webmc_custom_png_' + tileIdx, dataUrl);
        } catch (e) {
            console.warn('Could not save custom texture to localStorage:', e);
        }
        window.dispatchEvent(new CustomEvent('mc_textures_updated', { detail: { tileIdx } }));
    };
    img.src = dataUrl;
}

// Reset all textures to default PNGs
export function resetTexturesToDefault() {
    for (const item of TILE_META) {
        localStorage.removeItem('webmc_custom_png_' + item.id);
    }
    // Re-render procedural & reload default PNGs
    if (atlasCanvas) {
        const ctx = atlasCanvas.getContext('2d');
        const totalTiles = Object.keys(TILES).length;
        for (let i = 0; i < totalTiles; i++) {
            const col = i % ATLAS_COLS;
            const row = Math.floor(i / ATLAS_COLS);
            const ox = col * TILE_SIZE;
            const oy = row * TILE_SIZE;
            renderTileToCanvas(ctx, i, ox, oy);
        }
        loadAllPNGTextures();
        if (atlasTexture) atlasTexture.needsUpdate = true;
        window.dispatchEvent(new CustomEvent('mc_textures_updated', { detail: { reset: true } }));
    }
}

// Returns [u0, v0, u1, v1] coordinates for a given tile index
export function getTileUV(tileIndex) {
    const col = tileIndex % ATLAS_COLS;
    const row = Math.floor(tileIndex / ATLAS_COLS);
    
    // UV space: u in [0, 1], v in [0, 1] with v=0 at bottom in WebGL
    const u0 = col / ATLAS_COLS;
    const u1 = (col + 1) / ATLAS_COLS;
    
    // In canvas (0,0) is top-left; in Three.js texture coordinate v=1 is top, v=0 is bottom
    const v1 = 1.0 - (row / ATLAS_ROWS);
    const v0 = 1.0 - ((row + 1) / ATLAS_ROWS);

    return [u0, v0, u1, v1];
}

// Get the master materials for chunk rendering
export function getChunkMaterials() {
    const tex = getAtlasTexture();

    if (!opaqueMaterial) {
        opaqueMaterial = new THREE.MeshLambertMaterial({
            map: tex,
            vertexColors: true
        });
    }

    if (!transparentMaterial) {
        transparentMaterial = new THREE.MeshLambertMaterial({
            map: tex,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.15,
            side: THREE.DoubleSide
        });
    }

    return { opaque: opaqueMaterial, transparent: transparentMaterial };
}

// Standalone 2D icon drawer for inventory, hotbar, and recipe book
export function draw2DIcon(canvas, blockType) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 16;
    canvas.height = 16;
    ctx.clearRect(0, 0, 16, 16);

    // Check if it's an item (tool, stick, ingot, coal)
    if (blockType === BLOCKS.STICK) {
        ctx.fillStyle = "#8a582c";
        for (let i = 3; i <= 12; i++) {
            ctx.fillRect(i, 15 - i, 2, 2);
        }
        return;
    }

    if (blockType === BLOCKS.IRON_INGOT || blockType === BLOCKS.GOLD_INGOT) {
        const isGold = blockType === BLOCKS.GOLD_INGOT;
        ctx.fillStyle = isGold ? "#ffd030" : "#d8d8e0";
        ctx.fillRect(4, 6, 8, 4);
        ctx.fillStyle = isGold ? "#fff080" : "#ffffff";
        ctx.fillRect(4, 6, 8, 1);
        ctx.fillStyle = isGold ? "#b89010" : "#9090a0";
        ctx.fillRect(4, 9, 8, 1);
        return;
    }

    if (blockType === BLOCKS.COAL) {
        ctx.fillStyle = "#222225";
        ctx.fillRect(5, 5, 6, 6);
        ctx.fillRect(4, 6, 8, 4);
        ctx.fillStyle = "#45454a";
        ctx.fillRect(5, 5, 2, 2);
        return;
    }

    // Tools (Pickaxes & Swords)
    const isPickaxe = (
        blockType === BLOCKS.WOOD_PICKAXE || blockType === BLOCKS.STONE_PICKAXE ||
        blockType === BLOCKS.IRON_PICKAXE || blockType === BLOCKS.GOLD_PICKAXE ||
        blockType === BLOCKS.DIAMOND_PICKAXE
    );
    const isSword = (
        blockType === BLOCKS.WOOD_SWORD || blockType === BLOCKS.STONE_SWORD ||
        blockType === BLOCKS.IRON_SWORD || blockType === BLOCKS.GOLD_SWORD ||
        blockType === BLOCKS.DIAMOND_SWORD
    );

    if (isPickaxe || isSword) {
        let matColor = "#e0e0e0"; // Iron
        if (blockType === BLOCKS.WOOD_PICKAXE || blockType === BLOCKS.WOOD_SWORD) matColor = "#9e6e3c";
        else if (blockType === BLOCKS.STONE_PICKAXE || blockType === BLOCKS.STONE_SWORD) matColor = "#8a8a8a";
        else if (blockType === BLOCKS.GOLD_PICKAXE || blockType === BLOCKS.GOLD_SWORD) matColor = "#ffd700";
        else if (blockType === BLOCKS.DIAMOND_PICKAXE || blockType === BLOCKS.DIAMOND_SWORD) matColor = "#2ee6ff";

        // Stick handle
        ctx.fillStyle = "#6e4620";
        for (let i = 2; i <= 8; i++) {
            ctx.fillRect(i, 15 - i, 1, 1);
        }

        if (isPickaxe) {
            ctx.fillStyle = matColor;
            ctx.fillRect(9, 3, 4, 2);
            ctx.fillRect(11, 5, 2, 4);
            ctx.fillRect(7, 2, 3, 2);
            ctx.fillRect(12, 7, 2, 3);
        } else {
            // Crossguard & Blade
            ctx.fillStyle = "#4a4a4a";
            ctx.fillRect(7, 8, 3, 1);
            ctx.fillRect(8, 7, 1, 3);
            ctx.fillStyle = matColor;
            for (let i = 8; i <= 13; i++) {
                ctx.fillRect(i, 15 - i, 2, 2);
            }
        }
        return;
    }

    // For standard blocks, extract the representative tile from the atlas (or fallback)
    const faces = BLOCK_FACES[blockType];
    const tileIndex = faces ? (faces[2] !== undefined ? faces[2] : faces[0]) : TILES.STONE;
    if (atlasCanvas) {
        const col = tileIndex % ATLAS_COLS;
        const row = Math.floor(tileIndex / ATLAS_COLS);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(atlasCanvas, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0, 0, 16, 16);
    } else {
        renderTileToCanvas(ctx, tileIndex, 0, 0);
    }
}
