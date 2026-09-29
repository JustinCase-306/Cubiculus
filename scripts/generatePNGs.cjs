const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// PNG Encoder
function encodePNG(width, height, rgbaBuffer) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr.writeUInt8(8, 8); // 8-bit
    ihdr.writeUInt8(6, 9); // RGBA
    ihdr.writeUInt8(0, 10);
    ihdr.writeUInt8(0, 11);
    ihdr.writeUInt8(0, 12);
    
    const table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        table[i] = c;
    }
    function crc32(buf) {
        let crc = -1;
        for (let i = 0; i < buf.length; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
        }
        return (crc ^ (-1));
    }

    function makeChunk(type, data) {
        const len = data.length;
        const buf = Buffer.alloc(4 + 4 + len + 4);
        buf.writeUInt32BE(len, 0);
        buf.write(type, 4, 4, 'ascii');
        data.copy(buf, 8);
        const crc = crc32(buf.subarray(4, 8 + len));
        buf.writeInt32BE(crc, 8 + len);
        return buf;
    }

    // IDAT
    const rowBytes = width * 4;
    const raw = Buffer.alloc((1 + rowBytes) * height);
    for (let y = 0; y < height; y++) {
        raw[y * (1 + rowBytes)] = 0; // None filter
        rgbaBuffer.copy(raw, y * (1 + rowBytes) + 1, y * rowBytes, (y + 1) * rowBytes);
    }
    const compressed = zlib.deflateSync(raw);

    return Buffer.concat([
        signature,
        makeChunk('IHDR', ihdr),
        makeChunk('IDAT', compressed),
        makeChunk('IEND', Buffer.alloc(0))
    ]);
}

function makeBuffer() {
    return Buffer.alloc(16 * 16 * 4, 255);
}

function setPixel(buf, x, y, r, g, b, a = 255) {
    if (x < 0 || x >= 16 || y < 0 || y >= 16) return;
    const idx = (y * 16 + x) * 4;
    buf[idx] = Math.round(r);
    buf[idx + 1] = Math.round(g);
    buf[idx + 2] = Math.round(b);
    buf[idx + 3] = Math.round(a);
}

// Deterministic noise
function hash(x, y, s = 1) {
    return Math.abs(Math.sin(x * 12.9898 + y * 78.233 + s * 43.123) * 43758.5453) % 1;
}

// 1. GRASS TOP
function genGrassTop() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const h = hash(x, y, 10);
            if (h < 0.2) setPixel(buf, x, y, 114, 188, 50); // Light blade
            else if (h < 0.6) setPixel(buf, x, y, 92, 156, 38); // Base lush green
            else if (h < 0.85) setPixel(buf, x, y, 76, 136, 30); // Mid shadow
            else setPixel(buf, x, y, 60, 114, 24); // Deep shadow
        }
    }
    return buf;
}

// 2. DIRT
function genDirt() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const h = hash(x, y, 20);
            if (h < 0.08) setPixel(buf, x, y, 138, 138, 138); // Small pebble
            else if (h < 0.35) setPixel(buf, x, y, 142, 98, 64); // Light loam
            else if (h < 0.75) setPixel(buf, x, y, 120, 82, 52); // Mid earth
            else setPixel(buf, x, y, 98, 64, 40); // Dark soil
        }
    }
    return buf;
}

// 3. GRASS SIDE
function genGrassSide() {
    const buf = genDirt();
    const overhang = [3, 4, 3, 5, 4, 3, 4, 6, 4, 3, 5, 4, 3, 4, 5, 3];
    for (let x = 0; x < 16; x++) {
        const depth = overhang[x];
        for (let y = 0; y < depth; y++) {
            if (y === depth - 1) {
                setPixel(buf, x, y, 64, 118, 26); // Dark grass drip edge
            } else if (y === 0) {
                setPixel(buf, x, y, 108, 180, 46); // Top highlight
            } else {
                setPixel(buf, x, y, 86, 150, 36); // Mid grass
            }
        }
    }
    return buf;
}

// 4. STONE
function genStone() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const h = hash(x, y, 30);
            if (h < 0.25) setPixel(buf, x, y, 144, 144, 144);
            else if (h < 0.65) setPixel(buf, x, y, 128, 128, 128);
            else if (h < 0.88) setPixel(buf, x, y, 112, 112, 112);
            else setPixel(buf, x, y, 96, 96, 96);
        }
    }
    return buf;
}

// 5. COBBLESTONE
function genCobblestone() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const isBorder = (x % 5 === 0 || y % 4 === 0 || (x + y) % 7 === 0);
            if (isBorder) {
                setPixel(buf, x, y, 68, 68, 68); // Mortar crevice
            } else {
                const h = hash(x, y, 40);
                if (h < 0.2) setPixel(buf, x, y, 155, 155, 155);
                else if (h < 0.6) setPixel(buf, x, y, 128, 128, 128);
                else setPixel(buf, x, y, 100, 100, 100);
            }
        }
    }
    return buf;
}

// 6. PLANKS
function genPlanks() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        const plankIdx = Math.floor(y / 4);
        const isPlankBorder = (y % 4 === 3);
        const seamX = (plankIdx % 2 === 0) ? 8 : 12;

        for (let x = 0; x < 16; x++) {
            if (isPlankBorder || x === seamX) {
                setPixel(buf, x, y, 108, 76, 42); // Dark groove
            } else {
                const h = hash(x, y, 50);
                if (h < 0.25) setPixel(buf, x, y, 185, 145, 96); // Highlight grain
                else if (h < 0.75) setPixel(buf, x, y, 168, 130, 84); // Base oak
                else setPixel(buf, x, y, 150, 115, 72); // Shadow grain
            }
        }
    }
    return buf;
}

// 7. SAND
function genSand() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const h = hash(x, y, 60);
            if (h < 0.15) setPixel(buf, x, y, 235, 222, 165);
            else if (h < 0.65) setPixel(buf, x, y, 222, 206, 148);
            else if (h < 0.9) setPixel(buf, x, y, 206, 188, 132);
            else setPixel(buf, x, y, 188, 170, 116);
        }
    }
    return buf;
}

// 8. LEAVES (Oak)
function genLeaves() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const h = hash(x, y, 70);
            if (h < 0.22) {
                setPixel(buf, x, y, 0, 0, 0, 0); // Transparent gap
            } else if (h < 0.5) {
                setPixel(buf, x, y, 78, 142, 38, 255); // Vibrant leaf
            } else if (h < 0.8) {
                setPixel(buf, x, y, 56, 112, 28, 255); // Mid leaf
            } else {
                setPixel(buf, x, y, 42, 88, 20, 255); // Dark foliage
            }
        }
    }
    return buf;
}

// 9. GLASS
function genGlass() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const isBorder = (x === 0 || x === 15 || y === 0 || y === 15);
            const isStreak1 = (x === y + 2 && x >= 3 && x <= 7);
            const isStreak2 = (x === y + 3 && x >= 10 && x <= 13);
            if (isBorder) {
                setPixel(buf, x, y, 230, 245, 255, 240); // Crisp frame
            } else if (isStreak1 || isStreak2) {
                setPixel(buf, x, y, 255, 255, 255, 220); // Glare reflection
            } else {
                setPixel(buf, x, y, 200, 230, 255, 25); // Transparent glass pane
            }
        }
    }
    return buf;
}

// 10. ORES (Helper)
function genOre(rO, gO, bO, seed) {
    const buf = genStone();
    const oreSpots = [
        [3, 3], [4, 3], [3, 4], [4, 4],
        [8, 7], [9, 7], [9, 8], [8, 9],
        [12, 11], [13, 11], [12, 12],
        [6, 12], [7, 13]
    ];
    for (const [ox, oy] of oreSpots) {
        const h = hash(ox, oy, seed);
        const r = Math.min(255, rO + (h - 0.5) * 40);
        const g = Math.min(255, gO + (h - 0.5) * 40);
        const b = Math.min(255, bO + (h - 0.5) * 40);
        setPixel(buf, ox, oy, r, g, b);
        // Dark outline for ore
        if (ox > 0 && hash(ox - 1, oy, seed) > 0.6) setPixel(buf, ox - 1, oy, 40, 40, 40);
    }
    return buf;
}

// 11. BRICK
function genBrick() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        const row = Math.floor(y / 4);
        const isHorizMortar = (y % 4 === 3);
        const stagger = (row % 2 === 0) ? 8 : 0;

        for (let x = 0; x < 16; x++) {
            const isVertMortar = ((x + stagger) % 8 === 7);
            if (isHorizMortar || isVertMortar) {
                setPixel(buf, x, y, 185, 175, 165); // Mortar
            } else {
                const h = hash(x, y, 80);
                if (h < 0.25) setPixel(buf, x, y, 175, 78, 64);
                else if (h < 0.7) setPixel(buf, x, y, 155, 62, 50);
                else setPixel(buf, x, y, 135, 50, 40);
            }
        }
    }
    return buf;
}

// 12. SNOW
function genSnow() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const h = hash(x, y, 90);
            if (h < 0.3) setPixel(buf, x, y, 255, 255, 255);
            else if (h < 0.7) setPixel(buf, x, y, 242, 248, 255);
            else setPixel(buf, x, y, 225, 235, 248);
        }
    }
    return buf;
}

// 13. ICE
function genIce() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const h = hash(x, y, 95);
            if (h < 0.2) setPixel(buf, x, y, 185, 220, 255, 210);
            else if (h < 0.7) setPixel(buf, x, y, 155, 195, 245, 200);
            else setPixel(buf, x, y, 135, 175, 230, 215);
        }
    }
    return buf;
}

// 14. LOG SIDE
function genLogSide() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const h = hash(x, y, 110);
            const isBarkRidge = (x % 4 === 0);
            if (isBarkRidge) {
                setPixel(buf, x, y, 78, 54, 32);
            } else if (h < 0.35) {
                setPixel(buf, x, y, 120, 88, 54);
            } else if (h < 0.75) {
                setPixel(buf, x, y, 102, 74, 44);
            } else {
                setPixel(buf, x, y, 86, 60, 36);
            }
        }
    }
    return buf;
}

// 15. LOG TOP
function genLogTop() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const isBark = (x === 0 || x === 15 || y === 0 || y === 15);
            if (isBark) {
                setPixel(buf, x, y, 86, 60, 36);
            } else {
                const dx = x - 7.5;
                const dy = y - 7.5;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const ring = Math.floor(dist) % 2 === 0;
                if (dist < 2.0) {
                    setPixel(buf, x, y, 135, 102, 65);
                } else if (ring) {
                    setPixel(buf, x, y, 155, 120, 80);
                } else {
                    setPixel(buf, x, y, 140, 108, 70);
                }
            }
        }
    }
    return buf;
}

// 16. WATER
function genWater() {
    const buf = makeBuffer();
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const wave = Math.sin((x + y * 0.5) * 0.8);
            if (wave > 0.5) setPixel(buf, x, y, 64, 128, 245, 195);
            else if (wave > -0.2) setPixel(buf, x, y, 42, 98, 225, 195);
            else setPixel(buf, x, y, 28, 76, 200, 205);
        }
    }
    return buf;
}

const textures = {
    'grass_top.png': genGrassTop(),
    'grass_side.png': genGrassSide(),
    'dirt.png': genDirt(),
    'stone.png': genStone(),
    'cobblestone.png': genCobblestone(),
    'wood_side.png': genLogSide(),
    'wood_top.png': genLogTop(),
    'leaves.png': genLeaves(),
    'sand.png': genSand(),
    'water.png': genWater(),
    'planks.png': genPlanks(),
    'glass.png': genGlass(),
    'diamond_ore.png': genOre(46, 230, 255, 301),
    'coal_ore.png': genOre(34, 34, 38, 302),
    'iron_ore.png': genOre(216, 175, 147, 303),
    'gold_ore.png': genOre(255, 215, 0, 304),
    'brick.png': genBrick(),
    'snow.png': genSnow(),
    'ice.png': genIce()
};

// Write to /sprites and /public/textures
const dirs = ['sprites', 'public/textures'];
for (const dir of dirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    for (const [name, buf] of Object.entries(textures)) {
        const png = encodePNG(16, 16, buf);
        fs.writeFileSync(path.join(dir, name), png);
    }
}

console.log(`Generated ${Object.keys(textures).length} PNG textures in sprites/ and public/textures/!`);
