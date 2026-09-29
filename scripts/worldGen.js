// WebMinecraft High-Speed Voxel World Data & Procedural Generation Layer
// Uses contiguous 16KB Uint8Array per chunk (16x64x16) for instant zero-allocation lookups
import { BLOCKS } from './blocks.js';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64;
export const WATER_LEVEL = 18;
export const CHUNK_VOXELS = CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE; // 16,384

// Biome definitions
export const BIOMES = {
    PLAINS: { name: 'PLAINS', baseH: 22, varH: 8, floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.008 },
    FOREST: { name: 'FOREST', baseH: 24, varH: 10, floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.045 },
    BIRCH_FOREST: { name: 'BIRCH_FOREST', baseH: 24, varH: 9, floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.04 },
    MOUNTAINS: { name: 'MOUNTAINS', baseH: 36, varH: 26, floor: BLOCKS.GRASS, sub: BLOCKS.STONE, treeChance: 0.005 },
    DESERT: { name: 'DESERT', baseH: 21, varH: 6, floor: BLOCKS.SAND, sub: BLOCKS.SAND, treeChance: 0.012 },
    BADLANDS: { name: 'BADLANDS', baseH: 26, varH: 14, floor: BLOCKS.TERRACOTTA, sub: BLOCKS.TERRACOTTA, treeChance: 0.0 },
    SAVANNA: { name: 'SAVANNA', baseH: 23, varH: 7, floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.01 },
    TAIGA: { name: 'TAIGA', baseH: 25, varH: 11, floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.038 },
    SWAMP: { name: 'SWAMP', baseH: 19, varH: 3, floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.02 },
    JUNGLE: { name: 'JUNGLE', baseH: 25, varH: 12, floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.065 },
    SNOWY_TUNDRA: { name: 'SNOWY_TUNDRA', baseH: 22, varH: 6, floor: BLOCKS.SNOW, sub: BLOCKS.DIRT, treeChance: 0.015 }
};

let simplex = (typeof window !== 'undefined' && window.SimplexNoise) ? new window.SimplexNoise() : null;
let currentWorldSeed = "browsercraft";
let seedOffset = 0;

export function setSimplex(inst) {
    simplex = inst;
}

export function setWorldSeed(seed) {
    currentWorldSeed = String(seed || 'browsercraft').trim();
    let s = 1779033703 ^ currentWorldSeed.length;
    for (let i = 0; i < currentWorldSeed.length; i++) {
        s = Math.imul(s ^ currentWorldSeed.charCodeAt(i), 3432918353);
        s = s << 13 | s >>> 19;
    }
    seedOffset = Math.abs(s % 100000);
    const prng = function() {
        s |= 0; s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    if (typeof window !== 'undefined' && window.SimplexNoise) {
        simplex = new window.SimplexNoise(prng);
    }
}

export function getWorldSeed() {
    return currentWorldSeed;
}

export function findSafeSpawn(startX = 8, startZ = 8) {
    const cx = startX >> 4;
    const cz = startZ >> 4;
    generateChunkData(cx, cz);
    for (let y = CHUNK_HEIGHT - 2; y >= 2; y--) {
        const b = getBlock(startX, y, startZ);
        if (b !== BLOCKS.AIR && b !== BLOCKS.WATER) {
            return { x: startX + 0.5, y: y + 1.15, z: startZ + 0.5 };
        }
    }
    return { x: startX + 0.5, y: 36.0, z: startZ + 0.5 };
}

// Global high-speed chunk data storage (key: 'cx,cz' -> Uint8Array)
export const chunkDataMap = new Map();
export let modifiedWorldData = new Map();
export const generatedChunks = new Set();
export const dirtyChunks = new Set();

// Direct fast block getter
export function getBlock(x, y, z) {
    if (y < 0 || y >= CHUNK_HEIGHT) return BLOCKS.AIR;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    const cx = ix >> 4;
    const cz = iz >> 4;
    const chunk = chunkDataMap.get(`${cx},${cz}`);
    if (!chunk) return BLOCKS.AIR;
    return chunk[(iy << 8) | ((iz & 15) << 4) | (ix & 15)];
}

// Direct chunk array accessor
export function getChunkData(cx, cz) {
    return chunkDataMap.get(`${cx},${cz}`);
}

// Internal raw block setter
export function setBlockInternal(x, y, z, type) {
    if (y < 0 || y >= CHUNK_HEIGHT) return;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    const cx = ix >> 4;
    const cz = iz >> 4;
    const key = `${cx},${cz}`;
    let chunk = chunkDataMap.get(key);
    if (!chunk) {
        chunk = new Uint8Array(CHUNK_VOXELS);
        chunkDataMap.set(key, chunk);
    }
    chunk[(iy << 8) | ((iz & 15) << 4) | (ix & 15)] = type;
}

export function setBlock(x, y, z, type) {
    setBlockInternal(x, y, z, type);
}

export function playerSetBlock(x, y, z, type) {
    if (y < 0 || y >= CHUNK_HEIGHT) return;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);

    setBlockInternal(ix, iy, iz, type);
    const cellKey = `${ix},${iy},${iz}`;
    modifiedWorldData.set(cellKey, type);

    const cx = ix >> 4;
    const cz = iz >> 4;
    markChunkDirty(cx, cz);

    const lx = ix & 15;
    const lz = iz & 15;
    if (lx === 0) markChunkDirty(cx - 1, cz);
    if (lx === 15) markChunkDirty(cx + 1, cz);
    if (lz === 0) markChunkDirty(cx, cz - 1);
    if (lz === 15) markChunkDirty(cx, cz + 1);
}

export function markChunkDirty(cx, cz) {
    dirtyChunks.add(`${cx},${cz}`);
}

// Compatibility worldData proxy object for legacy callers
export const worldData = {
    get(key) {
        const [x, y, z] = key.split(',').map(Number);
        return getBlock(x, y, z);
    },
    set(key, val) {
        const [x, y, z] = key.split(',').map(Number);
        setBlock(x, y, z, val);
    },
    has(key) {
        const [x, y, z] = key.split(',').map(Number);
        return getBlock(x, y, z) !== BLOCKS.AIR;
    },
    delete(key) {
        const [x, y, z] = key.split(',').map(Number);
        setBlock(x, y, z, BLOCKS.AIR);
    },
    clear() {
        chunkDataMap.clear();
    }
};

export function resetWorldState() {
    chunkDataMap.clear();
    modifiedWorldData.clear();
    generatedChunks.clear();
    dirtyChunks.clear();
}

export function loadWorldState(savedModifiedMap) {
    resetWorldState();
    if (savedModifiedMap && savedModifiedMap instanceof Map) {
        modifiedWorldData = new Map(savedModifiedMap);
        for (const [key, type] of modifiedWorldData.entries()) {
            const [x, y, z] = key.split(',').map(Number);
            setBlockInternal(x, y, z, type);
        }
    }
}

// Expansive, coherent macro climate map
export function getBiome(gx, gz) {
    if (!simplex) return BIOMES.PLAINS;

    const continentalness = simplex.noise2D(gx * 0.0009, gz * 0.0009);
    const temperature = simplex.noise2D(gx * 0.0007 + 800, gz * 0.0007 + 800);
    const humidity = simplex.noise2D(gx * 0.0008 - 600, gz * 0.0008 - 600);

    // High elevation = Majestic Mountains
    if (continentalness > 0.42) {
        return BIOMES.MOUNTAINS;
    }

    // Polar/frigid zone (only in truly cold climate zones)
    if (temperature < -0.48) {
        return (humidity > 0.0) ? BIOMES.TAIGA : BIOMES.SNOWY_TUNDRA;
    }

    // Hot & Dry
    if (temperature > 0.32) {
        if (humidity < -0.22) return BIOMES.DESERT;
        if (humidity < 0.08) return BIOMES.BADLANDS;
        return BIOMES.SAVANNA;
    }

    // Warm & Wet
    if (temperature > 0.15 && humidity > 0.38) {
        return BIOMES.JUNGLE;
    }

    // Wet lowlands
    if (humidity > 0.45 && continentalness < -0.05) {
        return BIOMES.SWAMP;
    }

    // Temperate zones
    if (humidity > 0.15) {
        return (temperature < 0.0) ? BIOMES.BIRCH_FOREST : BIOMES.FOREST;
    }

    return BIOMES.PLAINS;
}

// Multi-octave Fractal Noise with Continentalness & Mountain Ridge Splines
export function getTerrainHeight(gx, gz, biome) {
    if (!simplex) return 22;

    const cont = simplex.noise2D(gx * 0.0012, gz * 0.0012);
    const mid = simplex.noise2D(gx * 0.0045, gz * 0.0045);
    const fine = simplex.noise2D(gx * 0.015, gz * 0.015);

    let h = 0;
    if (biome.name === 'MOUNTAINS') {
        // Jagged mountain ridges using sharp Billow/Ridge noise
        const r1 = 1.0 - Math.abs(simplex.noise2D(gx * 0.0045, gz * 0.0045));
        const r2 = 1.0 - Math.abs(simplex.noise2D(gx * 0.011, gz * 0.011));
        const ridge = (r1 * r1) * 0.72 + r2 * 0.28;
        h = 32 + ridge * 28 + mid * 6 + fine * 2.0;
    } else if (biome.name === 'BADLANDS') {
        // Flat-topped stepped mesa plateaus
        const raw = biome.baseH + cont * 12 + mid * 5 + fine * 1.5;
        h = (raw > 28) ? Math.floor(raw / 4) * 4 + 2 : raw;
    } else if (biome.name === 'DESERT') {
        // Rolling sand dunes
        const dune = Math.sin(gx * 0.02 + simplex.noise2D(gz * 0.008, gx * 0.008) * 2.2);
        h = biome.baseH + cont * 4 + dune * 3.5 + fine * 1.2;
    } else if (biome.name === 'SWAMP') {
        // Shallow waterlogged flatland
        h = WATER_LEVEL + 1 + Math.max(-2, mid * 2.2 + fine * 1.0);
    } else {
        // Standard rich natural terrain with smooth multi-octave FBM
        h = biome.baseH + cont * (biome.varH * 0.62) + mid * (biome.varH * 0.38) + fine * 1.5;
    }

    return Math.max(3, Math.min(CHUNK_HEIGHT - 3, Math.floor(h)));
}

// Fast zero-allocation procedural height & biome sampler for distant LoD chunks
export function getProceduralHeightAndBiome(gx, gz) {
    if (!simplex && typeof window !== 'undefined' && window.SimplexNoise) {
        simplex = new window.SimplexNoise();
    }
    const biome = getBiome(gx, gz);
    const h = getTerrainHeight(gx, gz, biome);
    return { h, biome };
}

// Ultra-fast deterministic surface point query for Macro and Mega LoD horizon meshes
export function getSurfacePoint(gx, gz) {
    if (!simplex && typeof window !== 'undefined' && window.SimplexNoise) {
        simplex = new window.SimplexNoise();
    }
    const biome = getBiome(gx, gz);
    const h = getTerrainHeight(gx, gz, biome);

    let surfaceY = h;
    let surfaceBlock = biome.floor;

    if (h < WATER_LEVEL) {
        surfaceY = WATER_LEVEL;
        surfaceBlock = (biome.name === 'SNOWY_TUNDRA') ? BLOCKS.ICE : BLOCKS.WATER;
    } else if (h === WATER_LEVEL || h === WATER_LEVEL + 1) {
        // Natural sandy or gravel beach shoreline
        if (biome.name === 'SWAMP') {
            surfaceBlock = BLOCKS.DIRT;
        } else if (biome.name === 'SNOWY_TUNDRA') {
            surfaceBlock = BLOCKS.GRAVEL;
        } else if (biome.name === 'BADLANDS') {
            surfaceBlock = BLOCKS.TERRACOTTA;
        } else {
            surfaceBlock = BLOCKS.SAND;
        }
    } else if (biome.name === 'MOUNTAINS') {
        if (h >= 52) {
            surfaceBlock = BLOCKS.SNOW; // Authentic alpine peak summit cap
        } else if (h >= 44) {
            // Mountain stone/gravel cliff slope
            const isGravel = (((gx * 31 + gz * 43) >>> 0) % 7) === 0;
            surfaceBlock = isGravel ? BLOCKS.GRAVEL : BLOCKS.STONE;
        }
    }

    return {
        y: surfaceY,
        rawH: h,
        block: surfaceBlock,
        biome: biome,
        isWater: (h < WATER_LEVEL && biome.name !== 'SNOWY_TUNDRA')
    };
}

// Trims unmodified full chunk data arrays outside maxRadius to free browser RAM
export function trimDistantChunks(playerCx, playerCz, maxRadius = 16) {
    for (const key of Array.from(chunkDataMap.keys())) {
        const [cx, cz] = key.split(',').map(Number);
        if (Math.abs(cx - playerCx) > maxRadius || Math.abs(cz - playerCz) > maxRadius) {
            let hasMod = false;
            for (const mKey of modifiedWorldData.keys()) {
                const [mx, , mz] = mKey.split(',').map(Number);
                if ((mx >> 4) === cx && (mz >> 4) === cz) {
                    hasMod = true;
                    break;
                }
            }
            if (!hasMod) {
                chunkDataMap.delete(key);
                generatedChunks.delete(key);
            }
        }
    }
}

// Generates procedural terrain into a 16KB Uint8Array in < 0.3ms
export function generateChunkData(cx, cz) {
    const chunkKey = `${cx},${cz}`;
    let chunk = chunkDataMap.get(chunkKey);
    if (generatedChunks.has(chunkKey) && chunk) {
        return chunk;
    }
    generatedChunks.add(chunkKey);

    if (!chunk) {
        chunk = new Uint8Array(CHUNK_VOXELS);
        chunkDataMap.set(chunkKey, chunk);
    }

    if (!simplex) {
        if (typeof window !== 'undefined' && window.SimplexNoise) {
            simplex = new window.SimplexNoise();
        }
    }

    // Step 1: Pre-calculate 2D height and biome column values
    const heights = new Int32Array(256);
    const biomes = new Array(256);

    for (let x = 0; x < CHUNK_SIZE; x++) {
        const gx = cx * CHUNK_SIZE + x;
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const gz = cz * CHUNK_SIZE + z;
            const colIdx = (z << 4) | x;
            const biome = getBiome(gx, gz);
            biomes[colIdx] = biome;
            heights[colIdx] = getTerrainHeight(gx, gz, biome);
        }
    }

    // Step 2: Linear column block population (vectorizable JIT loop)
    for (let x = 0; x < CHUNK_SIZE; x++) {
        const gx = cx * CHUNK_SIZE + x;
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const gz = cz * CHUNK_SIZE + z;
            const colIdx = (z << 4) | x;
            const biome = biomes[colIdx];
            const h = heights[colIdx];

            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                const blockIdx = (y << 8) | (z << 4) | x;

                // Respect any pre-set blocks (e.g. from trees extending from neighbor chunks)
                if (chunk[blockIdx] !== BLOCKS.AIR) continue;

                // Cave carving (optimized 3D noise)
                let isCave = false;
                if (simplex && y < h - 2 && y > 2) {
                    const largeCave = simplex.noise3D(gx * 0.025, y * 0.05, gz * 0.025);
                    if (largeCave > 0.65) {
                        isCave = true;
                    } else if (largeCave > 0.46) {
                        const wormCave = simplex.noise3D(gx * 0.08, y * 0.11, gz * 0.08);
                        if (wormCave > 0.62) isCave = true;
                    }
                }

                if (!isCave) {
                    if (y <= h) {
                        if (y === h) {
                            if (y < WATER_LEVEL + 2 && biome.name !== 'BADLANDS' && biome.name !== 'SWAMP') {
                                chunk[blockIdx] = (biome.name === 'SNOWY_TUNDRA') ? BLOCKS.GRAVEL : BLOCKS.SAND;
                            } else if (biome.name === 'MOUNTAINS') {
                                if (h >= 52) {
                                    chunk[blockIdx] = BLOCKS.SNOW;
                                } else if (h >= 44) {
                                    const isGravel = (((gx * 31 + gz * 43) >>> 0) % 7) === 0;
                                    chunk[blockIdx] = isGravel ? BLOCKS.GRAVEL : BLOCKS.STONE;
                                } else {
                                    chunk[blockIdx] = BLOCKS.GRASS;
                                }
                            } else {
                                chunk[blockIdx] = biome.floor;
                            }
                        } else if (y > h - 4) {
                            if (biome.name === 'DESERT') {
                                chunk[blockIdx] = (y === h - 3) ? BLOCKS.SANDSTONE : BLOCKS.SAND;
                            } else if (biome.name === 'BADLANDS') {
                                chunk[blockIdx] = BLOCKS.TERRACOTTA;
                            } else if (y < WATER_LEVEL + 1) {
                                chunk[blockIdx] = BLOCKS.SAND;
                            } else {
                                chunk[blockIdx] = biome.sub;
                            }
                        } else if (y === 0) {
                            chunk[blockIdx] = BLOCKS.STONE;
                        } else {
                            // Rich ore distribution & underground strata
                            const hash = (((gx * 73856093) ^ (y * 19349663) ^ (gz * 83492791)) >>> 0) / 4294967296;
                            if (y < 12 && hash < 0.012) {
                                chunk[blockIdx] = BLOCKS.DIAMOND;
                            } else if (y < 16 && hash < 0.024) {
                                chunk[blockIdx] = BLOCKS.REDSTONE_ORE;
                            } else if (y < 28 && hash < 0.038) {
                                chunk[blockIdx] = BLOCKS.GOLD_ORE;
                            } else if (biome.name === 'MOUNTAINS' && y > 28 && hash < 0.045) {
                                chunk[blockIdx] = BLOCKS.EMERALD_ORE;
                            } else if (y < 46 && hash < 0.065) {
                                chunk[blockIdx] = BLOCKS.IRON_ORE;
                            } else if (hash < 0.09) {
                                chunk[blockIdx] = BLOCKS.GRAVEL;
                            } else if (hash < 0.16) {
                                chunk[blockIdx] = BLOCKS.COAL_ORE;
                            } else {
                                chunk[blockIdx] = BLOCKS.STONE;
                            }
                        }
                    } else if (y <= WATER_LEVEL) {
                        if (biome.name === 'SNOWY_TUNDRA' && y === WATER_LEVEL) {
                            chunk[blockIdx] = BLOCKS.ICE;
                        } else {
                            chunk[blockIdx] = BLOCKS.WATER;
                        }
                    }
                }
            }

            // Step 3: Natural Vegetation, Tree, and Cactus Placement
            if (h >= WATER_LEVEL + 1) {
                const vegHash = (((gx * 15485863) ^ (gz * 32452843)) >>> 0) / 4294967296;
                if (biome.name === 'DESERT' && vegHash < 0.012) {
                    const cHeight = 2 + (vegHash > 0.006 ? 1 : 0);
                    for (let ci = 1; ci <= cHeight; ci++) {
                        setBlockInternal(gx, h + ci, gz, BLOCKS.CACTUS);
                    }
                } else if (biome.name === 'TAIGA' && vegHash < 0.005) {
                    setBlockInternal(gx, h + 1, gz, BLOCKS.MOSSY_COBBLESTONE);
                } else if (biome.treeChance > 0 && vegHash < biome.treeChance) {
                    createTree(gx, h + 1, gz, biome.name);
                }
            }
        }
    }

    // Step 4: Overlay any persistent player modifications for this chunk
    for (const [key, modType] of modifiedWorldData.entries()) {
        const [mx, my, mz] = key.split(',').map(Number);
        if ((mx >> 4) === cx && (mz >> 4) === cz) {
            chunk[(my << 8) | ((mz & 15) << 4) | (mx & 15)] = modType;
        }
    }

    return chunk;
}

function canSpawnTree(x, y, z) {
    for (let ox = -2; ox <= 2; ox++) {
        for (let oz = -2; oz <= 2; oz++) {
            for (let oy = 0; oy <= 5; oy++) {
                const blk = getBlock(x + ox, y + oy, z + oz);
                if (blk === BLOCKS.LEAVES || blk === BLOCKS.JUNGLE_LEAVES || blk === BLOCKS.SNOW_LEAVES ||
                    blk === BLOCKS.BIRCH_LEAVES || blk === BLOCKS.WOOD || blk === BLOCKS.JUNGLE_WOOD ||
                    blk === BLOCKS.BIRCH_WOOD) {
                    return false;
                }
            }
        }
    }
    return true;
}

export function createTree(x, y, z, biomeName) {
    if (!canSpawnTree(x, y, z)) return;

    const trunkCx = x >> 4;
    const trunkCz = z >> 4;

    if (biomeName === 'BIRCH_FOREST') {
        const h = 5 + (Math.abs((x * 29 + z * 13) % 3));
        for (let i = 0; i < h; i++) {
            setBlockInternal(x, y + i, z, BLOCKS.BIRCH_WOOD);
        }
        for (let ox = -2; ox <= 2; ox++) {
            for (let oz = -2; oz <= 2; oz++) {
                for (let oy = 0; oy < 3; oy++) {
                    if (Math.abs(ox) + Math.abs(oz) + Math.abs(oy) > 3.2) continue;
                    const lx = x + ox;
                    const lz = z + oz;
                    const targetY = y + h - 2 + oy;
                    if (getBlock(lx, targetY, lz) === BLOCKS.AIR) {
                        setBlockInternal(lx, targetY, lz, BLOCKS.BIRCH_LEAVES);
                        const leafCx = lx >> 4;
                        const leafCz = lz >> 4;
                        if (leafCx !== trunkCx || leafCz !== trunkCz) markChunkDirty(leafCx, leafCz);
                    }
                }
            }
        }
    } else if (biomeName === 'TAIGA') {
        // Conical pine/spruce tree
        const h = 6 + (Math.abs((x * 19 + z * 37) % 3));
        for (let i = 0; i < h; i++) {
            setBlockInternal(x, y + i, z, BLOCKS.WOOD);
        }
        for (let oy = 2; oy <= h + 1; oy++) {
            const rad = (oy === h + 1) ? 0 : (oy >= h - 1 ? 1 : 2);
            for (let ox = -rad; ox <= rad; ox++) {
                for (let oz = -rad; oz <= rad; oz++) {
                    if (rad === 2 && Math.abs(ox) === 2 && Math.abs(oz) === 2) continue;
                    const lx = x + ox;
                    const lz = z + oz;
                    const targetY = y + oy;
                    if (getBlock(lx, targetY, lz) === BLOCKS.AIR) {
                        setBlockInternal(lx, targetY, lz, BLOCKS.LEAVES);
                        const leafCx = lx >> 4;
                        const leafCz = lz >> 4;
                        if (leafCx !== trunkCx || leafCz !== trunkCz) markChunkDirty(leafCx, leafCz);
                    }
                }
            }
        }
    } else if (biomeName === 'JUNGLE') {
        const h = 8 + (Math.abs((x * 31 + z * 17) % 4));
        for (let i = 0; i < h; i++) {
            setBlockInternal(x, y + i, z, BLOCKS.JUNGLE_WOOD);
        }
        for (let ox = -3; ox <= 3; ox++) {
            for (let oz = -3; oz <= 3; oz++) {
                for (let oy = 0; oy < 4; oy++) {
                    if (Math.abs(ox) + Math.abs(oz) + Math.abs(oy) > 4.2) continue;
                    const lx = x + ox;
                    const lz = z + oz;
                    const targetY = y + h - 2 + oy;
                    if (getBlock(lx, targetY, lz) === BLOCKS.AIR) {
                        setBlockInternal(lx, targetY, lz, BLOCKS.JUNGLE_LEAVES);
                        const leafCx = lx >> 4;
                        const leafCz = lz >> 4;
                        if (leafCx !== trunkCx || leafCz !== trunkCz) markChunkDirty(leafCx, leafCz);
                    }
                }
            }
        }
    } else if (biomeName === 'SNOWY_TUNDRA') {
        const h = 5;
        for (let i = 0; i < h; i++) {
            setBlockInternal(x, y + i, z, BLOCKS.WOOD);
        }
        for (let ox = -2; ox <= 2; ox++) {
            for (let oz = -2; oz <= 2; oz++) {
                for (let oy = 0; oy < 3; oy++) {
                    if (Math.abs(ox) + Math.abs(oz) + (oy * 1.2) > 3.2) continue;
                    const lx = x + ox;
                    const lz = z + oz;
                    const targetY = y + h - 2 + oy;
                    if (getBlock(lx, targetY, lz) === BLOCKS.AIR) {
                        setBlockInternal(lx, targetY, lz, BLOCKS.SNOW_LEAVES);
                        const leafCx = lx >> 4;
                        const leafCz = lz >> 4;
                        if (leafCx !== trunkCx || leafCz !== trunkCz) markChunkDirty(leafCx, leafCz);
                    }
                }
            }
        }
    } else {
        // Classic Oak Tree for Plains, Forest, Savanna, Swamp
        const h = 5;
        for (let i = 0; i < h; i++) {
            setBlockInternal(x, y + i, z, BLOCKS.WOOD);
        }
        for (let ox = -2; ox <= 2; ox++) {
            for (let oz = -2; oz <= 2; oz++) {
                for (let oy = 0; oy < 3; oy++) {
                    if (Math.abs(ox) + Math.abs(oz) + Math.abs(oy) > 3.2) continue;
                    const lx = x + ox;
                    const lz = z + oz;
                    const targetY = y + h - 2 + oy;
                    if (getBlock(lx, targetY, lz) === BLOCKS.AIR) {
                        setBlockInternal(lx, targetY, lz, BLOCKS.LEAVES);
                        const leafCx = lx >> 4;
                        const leafCz = lz >> 4;
                        if (leafCx !== trunkCx || leafCz !== trunkCz) markChunkDirty(leafCx, leafCz);
                    }
                }
            }
        }
    }
}

