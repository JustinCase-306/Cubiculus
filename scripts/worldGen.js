// WebMinecraft High-Speed Voxel World Data & Procedural Generation Layer
// Uses contiguous 16KB Uint8Array per chunk (16x64x16) for instant zero-allocation lookups
import { BLOCKS } from './blocks.js';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64;
export const WATER_LEVEL = 18;

// Usable build height. CHUNK_HEIGHT is 64, so the ceiling sits a few blocks
// below the top: that headroom is what lets a jungle tree (canopy +12) finish
// without being truncated.
export const BUILD_MAX = 60;

// Tallest canopy any tree reaches above its trunk base. Jungle is the tallest at
// +12, so 13 blocks of headroom keeps every canopy complete.
export const MAX_CANOPY_HEIGHT = 13;
export const CHUNK_VOXELS = CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE; // 16,384

// Biome definitions
export const BIOMES = {
    PLAINS: { name: 'PLAINS', floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.006 },
    FOREST: { name: 'FOREST', floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.03 },
    BIRCH_FOREST: { name: 'BIRCH_FOREST', floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.032 },
    MOUNTAINS: { name: 'MOUNTAINS', floor: BLOCKS.GRASS, sub: BLOCKS.STONE, treeChance: 0.004 },
    DESERT: { name: 'DESERT', floor: BLOCKS.SAND, sub: BLOCKS.SANDSTONE, treeChance: 0.0 },
    BADLANDS: { name: 'BADLANDS', floor: BLOCKS.TERRACOTTA, sub: BLOCKS.TERRACOTTA, treeChance: 0.0 },
    SAVANNA: { name: 'SAVANNA', floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.008 },
    TAIGA: { name: 'TAIGA', floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.03 },
    SWAMP: { name: 'SWAMP', floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.014 },
    JUNGLE: { name: 'JUNGLE', floor: BLOCKS.GRASS, sub: BLOCKS.DIRT, treeChance: 0.05 },
    SNOWY_TUNDRA: { name: 'SNOWY_TUNDRA', floor: BLOCKS.SNOW, sub: BLOCKS.DIRT, treeChance: 0.01 },
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
    // Math.floor before the shift: `x >> 4` truncates toward zero and would pick a
    // different chunk than getBlock() reads for negative coordinates.
    const cx = Math.floor(startX) >> 4;
    const cz = Math.floor(startZ) >> 4;
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
    if (!simplex) return BIOMES.FOREST;

    // Climate fields at two scales: a broad continental trend plus a finer
    // regional variation. The old single low-frequency sample made one biome
    // swallow ~40% of the world (typically savanna), so forests were rare.
    const continentalness = simplex.noise2D(gx * 0.0016, gz * 0.0016);
    const temperature = simplex.noise2D(gx * 0.0021 + 800, gz * 0.0021 + 800) * 0.7
                      + simplex.noise2D(gx * 0.0006 + 300, gz * 0.0006 + 300) * 0.3;
    const humidity = simplex.noise2D(gx * 0.0024 - 600, gz * 0.0024 - 600) * 0.7
                   + simplex.noise2D(gx * 0.0007 - 200, gz * 0.0007 - 200) * 0.3;

    // High elevation = mountains
    if (continentalness > 0.46) {
        return BIOMES.MOUNTAINS;
    }

    // Cold: taiga when damp, snowy tundra when dry
    if (temperature < -0.30) {
        return (humidity > 0.0) ? BIOMES.TAIGA : BIOMES.SNOWY_TUNDRA;
    }

    // Hot and dry -> desert / badlands, but only when BOTH are clearly extreme,
    // otherwise the temperate band below gets a chance.
    if (temperature > 0.34 && humidity < -0.30) {
        return BIOMES.DESERT;
    }
    if (temperature > 0.40 && humidity < -0.12) {
        return BIOMES.BADLANDS;
    }
    if (temperature > 0.26 && humidity >= -0.12 && humidity < 0.16) {
        return BIOMES.SAVANNA;
    }

    // Warm and wet -> jungle
    if (temperature > 0.18 && humidity > 0.34) {
        return BIOMES.JUNGLE;
    }

    // Wet lowlands -> swamp
    if (humidity > 0.40 && continentalness < -0.10) {
        return BIOMES.SWAMP;
    }

    // Temperate band: forests dominate, plains appear where it is drier.
    if (humidity > 0.06) {
        return (temperature < -0.04) ? BIOMES.BIRCH_FOREST : BIOMES.FOREST;
    }
    if (humidity > -0.10) {
        return BIOMES.PLAINS;
    }

    return BIOMES.FOREST;
}

// Multi-octave Fractal Noise with Continentalness & Mountain Ridge Splines
// Continuous terrain: height is derived from smooth noise, NOT from discrete
// biome baseH values. This removes harsh vertical cliffs at biome borders.
function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

// Fractal brownian motion helper. Every octave has its wavelength INSIDE the
// range a player can actually see, so the land keeps changing shape while you
// walk. The old terrain used a ~900-block continental wave plus a 67-block
// detail wave of amplitude 1.7, which read as a flat table from ground level.
function fbm(x, z, octaves, lacunarity, gain, baseFreq) {
    let sum = 0;
    let amp = 1;
    let freq = baseFreq;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
        sum += simplex.noise2D(x * freq, z * freq) * amp;
        norm += amp;
        amp *= gain;
        freq *= lacunarity;
    }
    return sum / norm;
}

// Ridged multifractal: produces sharp crests instead of rounded blobs, which is
// what makes mountains read as mountains.
function ridged(x, z, octaves, lacunarity, gain, baseFreq) {
    let sum = 0;
    let amp = 1;
    let freq = baseFreq;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
        const n = 1.0 - Math.abs(simplex.noise2D(x * freq, z * freq));
        sum += n * n * amp;
        norm += amp;
        amp *= gain;
        freq *= lacunarity;
    }
    return sum / norm;
}

export function getTerrainHeight(gx, gz, biome) {
    if (!simplex) return 24;

    // Broad continental trend: decides land vs. ocean and where mountains sit.
    const cont = simplex.noise2D(gx * 0.0011, gz * 0.0011);

    // Detail octaves. Wavelengths ~440/220/110/55 blocks with matching amplitudes
    // give ~12 blocks of visible relief across a few hundred blocks of travel.
    const broad = fbm(gx, gz, 4, 2.0, 0.5, 0.0022);
    const detail = fbm(gx + 5000, gz - 3000, 3, 2.0, 0.5, 0.011);

    // Start above the water line, then carve oceans explicitly so flooding is a
    // deliberate feature instead of an accident of the noise distribution.
    let h = 27 + cont * 20 + broad * 12 + detail * 3.4;

    // Mountain mass: broad range plus a ridged crest for sharp peaks. Only kicks
    // in on high continentalness so lowlands stay walkable.
    const t = smoothstep(0.04, 0.40, cont);
    if (t > 0) {
        const crest = ridged(gx, gz, 4, 2.0, 0.5, 0.0035);
        h += t * 10 * (0.35 + crest * 0.65);
        h += t * t * 24 * Math.pow(crest, 1.6);
    }

    // Push genuine lowlands below the water line to carve out oceans/lakes.
    if (h < 16) h = 7 + (h - 7) * 0.5;

    // Mild per-biome material-aware tuning (continuous, small deltas only).
    if (biome.name === 'SWAMP') {
        // Shallow waterlogged flats: pull the surface down to just above the
        // water line using the local broad undulation as the floor.
        h = Math.min(h, WATER_LEVEL + 1 + broad * 2.2);
    } else if (biome.name === 'BADLANDS') {
        // Scalloped, stepped mesas without abrupt edge walls
        h = h < 27 ? h : Math.floor(h / 3) * 3 + 1;
    } else if (biome.name === 'PLAINS' || biome.name === 'FOREST' ||
               biome.name === 'BIRCH_FOREST' || biome.name === 'SAVANNA') {
        // Rolling lowlands: keep the big shape but add a gentle large-scale tilt
        // so plains are not a featureless table.
        h += broad * 4.5;
    } else if (biome.name === 'MOUNTAINS') {
        // Bare rock high up, snow on the peaks.
        h += detail * 1.5;
    }

    // Soft height ceiling.
    //
    // A hard Math.min(CHUNK_HEIGHT - 3, h) slices every tall mountain flat at the
    // same y, which produces a plateau of identically-height peaks. Compressing
    // the excess asymptotically keeps every peak its own height while still
    // staying inside the column.
    if (h > BUILD_MAX) {
        const over = h - BUILD_MAX;
        h = BUILD_MAX + over / (1 + over * 0.28);
    }

    return Math.max(3, Math.min(BUILD_MAX, Math.floor(h)));
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

// ---------------------------------------------------------------------------
// Water flow
//
// Generated water is static: every column fills to WATER_LEVEL and stays there,
// so digging a channel does nothing and water never finds a low spot. This runs
// a short settle pass over the chunks near the player so water spreads sideways
// and falls into holes.
//
// Rules (one block per tick, in the order people expect):
//   1. water with air below falls
//   2. water spreads to the side when the block below that side is solid
//   3. water only spreads downhill or level - never uphill
// ---------------------------------------------------------------------------

// How many flow steps a chunk may still settle. Water needs several passes to
// fall into a pit and fill it, so this is a countdown rather than a one-shot
// latch; a chunk that stops changing drains to zero and is then left alone.
const flowCooldown = new Map();
const FLOW_SETTLE_STEPS = 6;

// Returns the number of blocks that moved.
export function tickWaterFlow(cx, cz) {
    const key = `${cx},${cz}`;
    const left = flowCooldown.get(key) || 0;
    if (left <= 0) return 0;
    flowCooldown.set(key, left - 1);

    let moved = 0;

    // Operate on a scratch copy so a single pass cannot cascade arbitrarily far.
    const pending = [];

    for (let x = 0; x < CHUNK_SIZE; x++) {
        const gx = cx * CHUNK_SIZE + x;
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const gz = cz * CHUNK_SIZE + z;

            for (let y = 2; y < CHUNK_HEIGHT - 1; y++) {
                if (getBlock(gx, y, gz) !== BLOCKS.WATER) continue;

                // 1. fall straight down
                if (getBlock(gx, y - 1, gz) === BLOCKS.AIR) {
                    pending.push([gx, y - 1, gz, BLOCKS.WATER]);
                    continue;
                }

                const below = getBlock(gx, y - 1, gz);
                const canSpread = below !== BLOCKS.AIR && below !== BLOCKS.WATER;

                // 3. only move to a side that is not higher
                if (canSpread) {
                    for (const [dx, dz] of FLOW_DIRS) {
                        const nx = gx + dx, nz = gz + dz;
                        if (getBlock(nx, y, nz) !== BLOCKS.AIR) continue;

                        const supportY = findSurfaceY(nx, nz);
                        // no floor at all -> the side column is a hole, water pours in
                        if (supportY < 0) {
                            pending.push([nx, y, nz, BLOCKS.WATER]);
                            continue;
                        }
                        // the target column's floor must be at or below our floor
                        if (supportY <= y - 1) {
                            pending.push([nx, y, nz, BLOCKS.WATER]);
                        }
                    }
                }
            }
        }
    }

    for (const [x, y, z, id] of pending) {
        if (getBlock(x, y, z) !== BLOCKS.AIR) continue;
        setBlockInternal(x, y, z, id);
        moved++;
        if (moved >= FLOW_BUDGET) break;
    }

    if (moved > 0) {
        // keep settling: a moving chunk earns a fresh countdown
        flowCooldown.set(key, FLOW_SETTLE_STEPS);

        // mark the chunk and its neighbours: spread can cross a border
        markChunkDirty(cx, cz);
        markChunkDirty(cx - 1, cz);
        markChunkDirty(cx + 1, cz);
        markChunkDirty(cx, cz - 1);
        markChunkDirty(cx, cz + 1);
    }
    return moved;
}

const FLOW_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FLOW_BUDGET = 64;

// Highest solid block in a column, or -1 when the column is empty all the way
// down (which means an open pit).
function findSurfaceY(gx, gz) {
    for (let y = CHUNK_HEIGHT - 2; y >= 1; y--) {
        const b = getBlock(gx, y, gz);
        if (b === BLOCKS.AIR || b === BLOCKS.WATER) continue;
        return y;
    }
    return -1;
}

// Give every loaded chunk a settling budget. Called once after generation so
// existing pools and lakes start flowing without waiting for the player to walk
// over them.
export function primeWaterFlow() {
    flowCooldown.clear();
    for (const key of generatedChunks.keys()) {
        const [cx, cz] = key.split(',');
        flowCooldown.set(`${cx},${cz}`, FLOW_SETTLE_STEPS);
    }
}

// Forget the flow bookkeeping, e.g. after a world reset or load.
export function resetWaterFlow() {
    flowCooldown.clear();
}

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
        if (biome.name === 'SNOWY_TUNDRA') {
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

    // Step 1: Pre-calculate 2D height, biome and slope per column.
    //
    // The 16x16 grid plus a one-block border (18x18 = 324 samples) is evaluated
    // in one sweep. Computing the four neighbour heights per column instead cost
    // 1280 evaluations and made chunk generation about 2.5x slower.
    const heights = new Int32Array(256);
    const biomes = new Array(256);
    const slopes = new Float32Array(256);

    const PAD = 1;
    const W = CHUNK_SIZE + PAD * 2;          // 18
    const gridH = new Int32Array(W * W);

    for (let j = 0; j < W; j++) {
        const gz = cz * CHUNK_SIZE + j - PAD;
        for (let i = 0; i < W; i++) {
            const gx = cx * CHUNK_SIZE + i - PAD;
            gridH[j * W + i] = getTerrainHeight(gx, gz, getBiome(gx, gz));
        }
    }

    for (let x = 0; x < CHUNK_SIZE; x++) {
        const gx = cx * CHUNK_SIZE + x;
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const gz = cz * CHUNK_SIZE + z;
            const colIdx = (z << 4) | x;
            const biome = getBiome(gx, gz);
            biomes[colIdx] = biome;

            const i1 = x + PAD, j1 = z + PAD;
            const h = gridH[j1 * W + i1];
            heights[colIdx] = h;

            // Local steepness: steep ground gets bare rock instead of a grass
            // blanket, otherwise every cliff in the world ends up green.
            let maxDrop = 0;
            for (let dj = -1; dj <= 1; dj++) {
                for (let di = -1; di <= 1; di++) {
                    if (di === 0 && dj === 0) continue;
                    const d = Math.abs(gridH[(j1 + dj) * W + (i1 + di)] - h);
                    if (d > maxDrop) maxDrop = d;
                }
            }
            slopes[colIdx] = maxDrop;
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
                            const slope = slopes[colIdx];
                            // Snow line: above this altitude the ground is white.
                            // The threshold is jittered per column so the line
                            // snakes across the slope instead of forming a flat
                            // horizontal stripe.
                            const snowLine = 50 + Math.round(
                                simplex.noise2D(gx * 0.05, gz * 0.05) * 4
                            );

                            if (y < WATER_LEVEL + 2 && biome.name !== 'BADLANDS' && biome.name !== 'SWAMP') {
                                chunk[blockIdx] = (biome.name === 'SNOWY_TUNDRA') ? BLOCKS.GRAVEL : BLOCKS.SAND;
                            } else if (h >= snowLine) {
                                chunk[blockIdx] = BLOCKS.SNOW;
                            } else if (slope >= 3 && h >= 32) {
                                // Cliff faces are bare rock, but only up in the hills.
                                // Applying this at any altitude painted entire lowland
                                // slopes grey.
                                const rocky = biome.name === 'MOUNTAINS' || biome.name === 'BADLANDS';
                                chunk[blockIdx] = rocky ? BLOCKS.STONE :
                                    (((gx * 31 + gz * 43) >>> 0) % 5 === 0 ? BLOCKS.GRAVEL : BLOCKS.STONE);
                            } else if (biome.name === 'MOUNTAINS') {
                                if (h >= 42) {
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
                            // Deep bedrock strata. Ores are added afterwards by the
                            // ore-vein pass, so this layer stays plain stone/gravel.
                            const hash = (((gx * 73856093) ^ (y * 19349663) ^ (gz * 83492791)) >>> 0) / 4294967296;
                            if (hash < 0.09) {
                                chunk[blockIdx] = BLOCKS.GRAVEL;
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

        }
    }

    // Step 2b: Expand ore seeds into connected veins.
    // Seeds sit on a coarse 4x4 grid rather than on every column, so neighbouring
    // veins do not overlap and each one keeps its full length.
    for (let sx = 0; sx < CHUNK_SIZE; sx += 4) {
        for (let sz = 0; sz < CHUNK_SIZE; sz += 4) {
            for (let ox = 0; ox < 4; ox++) {
                for (let oz = 0; oz < 4; oz++) {
                    const x = sx + ox, z = sz + oz;
                    const gx = cx * CHUNK_SIZE + x;
                    const gz = cz * CHUNK_SIZE + z;
                    const colIdx = (z << 4) | x;
                    const biome = biomes[colIdx];
                    const h = heights[colIdx];
                    if (h < 5) continue;

                    const oreRoll = hash2D(gx, gz, 0x0EA7);
                    const mountain = biome.name === 'MOUNTAINS';
                    let oreType = 0;
                    let maxY = h - 5;
                    if (oreRoll < 0.052) { oreType = BLOCKS.COAL_ORE; maxY = Math.min(maxY, 52); }
                    else if (oreRoll < 0.079) { oreType = BLOCKS.IRON_ORE; maxY = Math.min(maxY, 44); }
                    else if (oreRoll < 0.092) { oreType = BLOCKS.GOLD_ORE; maxY = Math.min(maxY, 28); }
                    else if (mountain && oreRoll < 0.103) { oreType = BLOCKS.EMERALD_ORE; maxY = Math.min(maxY, 40); }
                    else if (oreRoll < 0.112) { oreType = BLOCKS.REDSTONE_ORE; maxY = Math.min(maxY, 16); }
                    else if (oreRoll < 0.120 && h < 12) { oreType = BLOCKS.DIAMOND; maxY = Math.min(maxY, 11); }
                    if (oreType === 0 || maxY < 2) continue;

                    const veinY = 2 + Math.floor(hash2D(gx, gz, 0x77A1) * (maxY - 2));
                    // Only start a vein in solid stone that survived cave carving.
                    const idx = (veinY << 8) | ((gz & 15) << 4) | (gx & 15);
                    if (chunk[idx] !== BLOCKS.STONE) continue;
                    placeOreVein(cx, cz, oreType, veinY, gx, gz);
                }
            }
        }
    }

    // Step 3: Vegetation, trees and decoration.
    // This runs as its own pass AFTER the terrain of the whole chunk exists. It used
    // to sit inside the column loop above, where canSpawnTree() queried columns that
    // were still all-AIR, so trees could be planted into each other and the result
    // depended on the order chunks happened to be generated in.
    for (let x = 0; x < CHUNK_SIZE; x++) {
        const gx = cx * CHUNK_SIZE + x;
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const gz = cz * CHUNK_SIZE + z;
            const colIdx = (z << 4) | x;
            const biome = biomes[colIdx];
            const h = heights[colIdx];

            // Need clearance for the tallest tree (jungle canopy reaches +12).
            // Compare against BUILD_MAX, not CHUNK_HEIGHT: the terrain tops out
            // below the chunk ceiling, and using the wrong bound silently removed
            // every tree from high ground.
            if (h < WATER_LEVEL + 1 || h + MAX_CANOPY_HEIGHT >= BUILD_MAX) continue;

            // Cluster mask: a low-frequency field that is only positive inside
            // groves. Combined with a per-column hash this produces dense forest
            // patches separated by open land, instead of an even sprinkle that
            // reads as dotted lines across the terrain.
            const grove = treeClusterMask(gx, gz, biome.name);
            if (grove <= 0) continue;

            const vegHash = hash2D(gx, gz, 0x51A7);

            if (biome.name === 'DESERT' && grove > 0.9 && vegHash < 0.05) {
                const cHeight = 2 + (vegHash > 0.025 ? 1 : 0);
                for (let ci = 1; ci <= cHeight; ci++) {
                    setBlockInternal(gx, h + ci, gz, BLOCKS.CACTUS);
                }
            } else if (biome.name === 'TAIGA' && grove > 0.85 && vegHash < 0.02) {
                setBlockInternal(gx, h + 1, gz, BLOCKS.MOSSY_COBBLESTONE);
            } else if (grove > 0 && vegHash < grove * biome.treeChance * 26) {
                createTree(gx, h + 1, gz, biome.name);
            }
        }
    }

    // Step 3b: Ground cover (tall grass + flowers). Runs last so it never places a
    // plant where a tree just took the space.
    for (let x = 0; x < CHUNK_SIZE; x++) {
        const gx = cx * CHUNK_SIZE + x;
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const gz = cz * CHUNK_SIZE + z;
            const colIdx = (z << 4) | x;
            const biome = biomes[colIdx];
            const h = heights[colIdx];
            decorateGroundCover(gx, gz, h, biome);
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

// Well-mixed coordinate hash. The previous vegetation hash used
// ((gx*A) ^ (gz*B)) which correlates along the axes and produced visible rows.
function hash2D(x, z, salt) {
    let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(salt, 1274126177)) | 0;
    h = (h ^ (h >>> 13)) | 0;
    h = Math.imul(h, 1274126177);
    h = (h ^ (h >>> 16)) >>> 0;
    return (h % 100000) / 100000;
}

// Returns 0..1; 1 means "deep inside a grove", 0 means "open land".
// Uses two low-frequency noise octaves so groves have soft, organic borders
// and vary in size, instead of trees being sprinkled uniformly.
function treeClusterMask(gx, gz, biomeName) {
    if (!simplex) return 1;
    const density = BIOMES[biomeName] ? BIOMES[biomeName].treeChance : 0.01;
    // Wetter biomes get bigger groves, dry ones almost none.
    const spread = biomeName === 'JUNGLE' ? 0.016 :
                   biomeName === 'FOREST' || biomeName === 'BIRCH_FOREST' ? 0.013 :
                   biomeName === 'TAIGA' ? 0.012 :
                   biomeName === 'PLAINS' || biomeName === 'SAVANNA' ? 0.007 :
                   biomeName === 'SWAMP' ? 0.008 : 0.0;
    if (spread <= 0) return 0;
    const n = simplex.noise2D(gx * spread, gz * spread);
    // squash: only the positive part of the noise becomes a grove
    const grove = Math.max(0, n) / (1 - density);
    return grove > 1 ? 1 : grove;
}



// Ground cover: tall grass and flowers on grass/snow-free soil, in plains-like biomes.
// Only plants on a clear grass surface one block above water, and never on a block
// that a tree or cactus already occupies.
function decorateGroundCover(gx, gz, h, biome) {
    if (h < WATER_LEVEL + 1 || h + 1 >= BUILD_MAX) return;

    const name = biome.name;

    // The cell must actually be free before anything is placed.
    const above = getBlock(gx, h + 1, gz);
    if (above !== BLOCKS.AIR) return;

    const surface = getBlock(gx, h, gz);
    const roll = hash2D(gx, gz, 0x9E37);
    const accent = hash2D(gx, gz, 0x85EB);

    switch (name) {
        case 'PLAINS':
        case 'FOREST':
        case 'BIRCH_FOREST':
        case 'SAVANNA':
        case 'JUNGLE': {
            if (surface !== BLOCKS.GRASS) return;
            if (accent < 0.012) {
                const yellow = hash2D(gx, gz, 0xC2B2) < 0.5;
                setBlockInternal(gx, h + 1, gz, yellow ? BLOCKS.FLOWER_YELLOW : BLOCKS.FLOWER_RED);
            } else if (roll < 0.10) {
                setBlockInternal(gx, h + 1, gz, BLOCKS.TALL_GRASS);
            }
            return;
        }

        case 'TAIGA': {
            // Cold forest floor: mossy patches instead of flowers.
            if (surface !== BLOCKS.GRASS) return;
            if (roll < 0.09) {
                setBlockInternal(gx, h + 1, gz, BLOCKS.MOSSY_COBBLESTONE);
            } else if (roll < 0.14) {
                setBlockInternal(gx, h + 1, gz, BLOCKS.TALL_GRASS);
            }
            return;
        }

        case 'SWAMP': {
            // Murky, waterlogged ground: lily pads of moss and dead shrubs.
            if (surface !== BLOCKS.GRASS && surface !== BLOCKS.DIRT) return;
            if (roll < 0.05) {
                setBlockInternal(gx, h + 1, gz, BLOCKS.MOSSY_COBBLESTONE);
            } else if (roll < 0.09) {
                setBlockInternal(gx, h + 1, gz, BLOCKS.TALL_GRASS);
            }
            return;
        }

        case 'DESERT': {
            // Sparse dead bushes and cactus; bare sand between.
            if (surface !== BLOCKS.SAND) return;
            if (roll < 0.006) {
                const tall = hash2D(gx, gz, 0x5A5A) < 0.5;
                setBlockInternal(gx, h + 1, gz, BLOCKS.CACTUS);
                if (tall) setBlockInternal(gx, h + 2, gz, BLOCKS.CACTUS);
            }
            return;
        }

        case 'BADLANDS': {
            if (surface !== BLOCKS.TERRACOTTA) return;
            if (roll < 0.008) setBlockInternal(gx, h + 1, gz, BLOCKS.CACTUS);
            return;
        }

        case 'SNOWY_TUNDRA': {
            // Snow with the occasional frozen shrub.
            if (surface !== BLOCKS.SNOW && surface !== BLOCKS.GRAVEL) return;
            if (roll < 0.012) setBlockInternal(gx, h + 1, gz, BLOCKS.TALL_GRASS);
            return;
        }

        case 'MOUNTAINS': {
            // Bare rock and snow up here, so only loose gravel collects.
            if (surface !== BLOCKS.GRASS && surface !== BLOCKS.STONE &&
                surface !== BLOCKS.GRAVEL) return;
            if (roll < 0.010) setBlockInternal(gx, h + 1, gz, BLOCKS.GRAVEL);
            return;
        }
    }
}

// Ore veins: a seeded seed block with a few connected neighbours, which reads far
// more like real mining than the old single scattered ore voxels.
function placeOreVein(cx, cz, oreType, y, gx, gz) {
    // Veins are clipped to the chunk that started them. Letting them spill into a
    // neighbour made generation order-dependent: whichever chunk was built first
    // wrote the ore, the other one did not.
    const minX = cx * CHUNK_SIZE;
    const minZ = cz * CHUNK_SIZE;
    const put = (x, yy, z) => {
        if (yy < 1 || yy >= CHUNK_HEIGHT) return;
        if (x < minX || x >= minX + CHUNK_SIZE) return;
        if (z < minZ || z >= minZ + CHUNK_SIZE) return;
        setBlockInternal(x, yy, z, oreType);
    };

    // A vein starting on the very last column would be clipped down to its single
    // seed block, which just looks like loose scatter. Bias the walk inward instead.
    const inwardX = (gx - minX >= CHUNK_SIZE - 3) ? -1 : 1;
    const inwardZ = (gz - minZ >= CHUNK_SIZE - 3) ? -1 : 1;

    // Build the whole run in memory first, then commit. Writing cell-by-cell left
    // behind 1-2 block stubs whenever the walk hit the chunk border, which showed up
    // as loose single ore voxels scattered through the stone.
    const size = 3 + Math.floor(hash2D(gx, gz, 0x51ED + y) * 4);
    const dirX = (hash2D(gx, gz, 0x2C1B) < 0.5 ? 1 : -1) * inwardX;
    const dirZ = (hash2D(gx, gz, 0x7D3E) < 0.5 ? 1 : -1) * inwardZ;

    const cells = [[gx, y, gz]];
    let px = gx, py = y, pz = gz;
    for (let i = 1; i < size; i++) {
        // Exactly one axis per step, so every new block is face-adjacent to the
        // previous one. Stepping two axes at once left diagonally touching voxels
        // that looked like a seam but were not actually connected.
        const roll = hash2D(px, py * 31 + pz, 0x1F83 + i);
        if (roll < 0.5) px += dirX;
        else if (roll < 0.72) py += 1;
        else pz += dirZ;

        if (py < 1 || py >= CHUNK_HEIGHT) break;
        if (px < minX || px >= minX + CHUNK_SIZE) break;
        if (pz < minZ || pz >= minZ + CHUNK_SIZE) break;
        cells.push([px, py, pz]);
    }

    // Too short to read as a seam: skip it entirely rather than leave debris.
    if (cells.length < 3) return;

    for (const [x, yy, z] of cells) put(x, yy, z);
}

// Footprint of the biggest canopy this generator can build (jungle: +-3 wide,
// up to +12 above the trunk base). The old +-2 / 0..5 box let new trunks punch
// straight through the upper leaves of a neighbouring tree.
function canSpawnTree(x, y, z) {
    for (let ox = -3; ox <= 3; ox++) {
        for (let oz = -3; oz <= 3; oz++) {
            for (let oy = 0; oy <= 13; oy++) {
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

