import { initAmbientSounds, playSound } from './audio.js';
import { lang as de } from './lang_de.js';
import { lang as en } from './lang_en.js';

        const textureCache = {};
        function createPixelTexture(type) {
            if (textureCache[type]) return textureCache[type];
            const canvas = document.createElement('canvas');
            canvas.width = 16; canvas.height = 16;
            const ctx = canvas.getContext('2d');
            const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

            const getCustomSpritePixel = (type, x, y) => {
                if (type === 'item_stick') {
                    const stickSprite = [
                        "................",
                        "..............oo",
                        ".............obo",
                        "............obd.",
                        "...........obd..",
                        "..........obd...",
                        ".........obd....",
                        "........obd.....",
                        ".......obd......",
                        "......obd.......",
                        ".....obd........",
                        "....obd.........",
                        "...obd..........",
                        "..obd...........",
                        ".obd............",
                        "oo.............."
                    ];
                    const char = stickSprite[y][x];
                    if (char === 'o') return [45, 27, 13, 255];
                    if (char === 'b') return [140, 105, 60, 255];
                    if (char === 'd') return [90, 65, 35, 255];
                    return null;
                }
                if (type === 'item_coal') {
                    const coalSprite = [
                        ".....ooooo......",
                        "....ohmmmso.....",
                        "...ohhmmmsso....",
                        "..ohhmmmssso....",
                        ".ohhmmmssssoo...",
                        ".ohmmmmssssoo...",
                        "ohmmmmsssssoo...",
                        "ommmmmsssssoo...",
                        "ommmmssssssoo...",
                        "osssmmmssssoo...",
                        ".ossssssssso....",
                        "..ossssssso.....",
                        "...ooossooo.....",
                        ".....ooo........",
                        "................",
                        "................"
                    ];
                    const char = coalSprite[y][x];
                    if (char === 'o') return [15, 15, 15, 255];
                    if (char === 'h') return [110, 110, 110, 255];
                    if (char === 'm') return [45, 45, 45, 255];
                    if (char === 's') return [26, 26, 26, 255];
                    return null;
                }
                if (type === 'item_iron_ingot' || type === 'item_gold_ingot') {
                    const ingotSprite = [
                        "................",
                        "......ooooo.....",
                        ".....ohhhhhh....",
                        "....ohmmmmmsso..",
                        "...ohmmmmmsssoo.",
                        "..ohmmmmmsssooo.",
                        ".ohmmmmmsssooo..",
                        "ohmmmmmsssooo...",
                        "ommmmsssooo.....",
                        "ossssssooo......",
                        ".ooooooo........",
                        "................",
                        "................",
                        "................",
                        "................",
                        "................"
                    ];
                    const char = ingotSprite[y][x];
                    if (char === '.') return null;
                    if (type === 'item_iron_ingot') {
                        if (char === 'o') return [75, 75, 75, 255];
                        if (char === 'h') return [255, 255, 255, 255];
                        if (char === 'm') return [215, 215, 215, 255];
                        if (char === 's') return [160, 160, 160, 255];
                    } else { // gold
                        if (char === 'o') return [110, 85, 20, 255];
                        if (char === 'h') return [255, 245, 175, 255];
                        if (char === 'm') return [250, 215, 50, 255];
                        if (char === 's') return [195, 155, 15, 255];
                    }
                    return null;
                }
                
                if (type.startsWith('tool_')) {
                    const isPick = type.includes('pickaxe');
                    const isSword = type.includes('sword');
                    
                    let hColor, mColor, sColor;
                    if (type.includes('wood')) {
                        hColor = [185, 142, 89]; mColor = [140, 105, 60]; sColor = [90, 65, 35];
                    } else if (type.includes('stone')) {
                        hColor = [160, 160, 160]; mColor = [110, 110, 110]; sColor = [70, 70, 70];
                    } else if (type.includes('iron')) {
                        hColor = [255, 255, 255]; mColor = [220, 220, 220]; sColor = [165, 165, 165];
                    } else if (type.includes('gold')) {
                        hColor = [255, 245, 175]; mColor = [250, 215, 50]; sColor = [195, 155, 15];
                    } else if (type.includes('diamond')) {
                        hColor = [210, 255, 255]; mColor = [77, 237, 242]; sColor = [33, 165, 183];
                    }
                    
                    if (isPick) {
                        const pickaxeSprite = [
                            "......ooomoo....",
                            "....oohhhmssso..",
                            "...ohhhmsoooss..",
                            "..ohhms...odbdo.",
                            ".ohms......odbdo",
                            "ooos........odb.",
                            ".............odb",
                            "............odb.",
                            "...........odb..",
                            "..........odb...",
                            ".........odb....",
                            "........odb.....",
                            ".......odb......",
                            "......odb.......",
                            ".....oo.........",
                            "................"
                        ];
                        const char = pickaxeSprite[y][x];
                        if (char === '.') return null;
                        if (char === 'o') return [30, 30, 30, 255];
                        if (char === 'h') return [...hColor, 255];
                        if (char === 'm') return [...mColor, 255];
                        if (char === 's') return [...sColor, 255];
                        if (char === 'b') return [140, 105, 60, 255];
                        if (char === 'd') return [90, 65, 35, 255];
                        return null;
                    }
                    
                    if (isSword) {
                        const swordSprite = [
                            "..............oo",
                            ".............oho",
                            "............ohmo",
                            "...........ohmso",
                            "..........ohmso.",
                            ".........ohmso..",
                            "........ohmso...",
                            ".......ohmso....",
                            "......ohmso.....",
                            ".....ohmso......",
                            "....ohmso.......",
                            "...occco........",
                            "..oossccoo......",
                            "...odbdooo......",
                            "....odbdo.......",
                            ".....oo........."
                        ];
                        const char = swordSprite[y][x];
                        if (char === '.') return null;
                        if (char === 'o') return [30, 30, 30, 255];
                        if (char === 'h') return [...hColor, 255];
                        if (char === 'm') return [...mColor, 255];
                        if (char === 's') return [...sColor, 255];
                        if (char === 'c') return [90, 90, 90, 255];
                        if (char === 'b') return [140, 105, 60, 255];
                        if (char === 'd') return [90, 65, 35, 255];
                        return null;
                    }
                }
                return null;
            };

            for(let x=0; x<16; x++) {
                for(let y=0; y<16; y++) {
                    let r, g, b, a = 1.0;
                    
                    const customPixel = getCustomSpritePixel(type, x, y);
                    if (customPixel !== null) {
                        r = customPixel[0];
                        g = customPixel[1];
                        b = customPixel[2];
                        a = customPixel[3] / 255;
                    } else if (type === 'grass_top') {
                        let v = rand(130, 170);
                        r = 90; g = v; b = 45;
                        if (Math.random() < 0.1) { r -= 10; g -= 20; } // Specks
                    } else if (type === 'grass_side') {
                        if (y < 4 || (y < 8 && Math.random() > (y - 3) / 4)) {
                            let v = rand(130, 170);
                            r = 90; g = v; b = 45;
                        } else {
                            let v = rand(40, 60);
                            r = v + 50; g = v + 20; b = v;
                        }
                    } else if (type === 'dirt') {
                        let v = rand(40, 60);
                        r = v + 50; g = v + 20; b = v;
                        if (Math.random() < 0.05) { r += 20; g += 15; } // Pebbles
                    } else if (type === 'stone') {
                        let v = rand(100, 120);
                        r = g = b = v;
                        if (Math.random() < 0.1) { r -= 15; g -= 15; b -= 15; } // Noise
                    } else if (type === 'stone_cobble') {
                        const isBorder = (x === 0 || y === 0 || x === 7 || y === 7 || x === 8 || y === 8 || x === 15 || y === 15);
                        let v = isBorder ? rand(60, 80) : rand(100, 130);
                        r = g = b = v;
                    } else if (type === 'wood_side') {
                        // High-fidelity repeating vertical Oak wood bark with beautiful rich highlights and detailed crevices
                        const oakLogBark = [
                            "dd..hhhh..dd..hh",
                            "dd..hhhh..dd..hh",
                            "d.mm.hh.mm.d.mm.",
                            "d.mm.hh.mm.d.mm.",
                            ".lmm..d..lmm..d.",
                            ".lmm..d..lmm..d.",
                            "mlmm.dd.mlmm.dd.",
                            "mlmm.dd.mlmm.dd.",
                            "dd..hhhh..dd..hh",
                            "dd..hhhh..dd..hh",
                            "d.mm.hh.mm.d.mm.",
                            "d.mm.hh.mm.d.mm.",
                            ".lmm..d..lmm..d.",
                            ".lmm..d..lmm..d.",
                            "mlmm.dd.mlmm.dd.",
                            "mlmm.dd.mlmm.dd."
                        ];
                        const char = oakLogBark[y] ? oakLogBark[y][x] : 'm';
                        if (char === '.') {
                            r = rand(40, 48); g = rand(26, 32); b = rand(14, 18); // deepest dark crevice
                        } else if (char === 'd') {
                            r = rand(66, 74); g = rand(46, 52); b = rand(26, 32); // dark bark
                        } else if (char === 'm') {
                            r = rand(98, 106); g = rand(72, 80); b = rand(44, 52); // medium brown bark
                        } else if (char === 'l') {
                            r = rand(130, 140); g = rand(100, 110); b = rand(64, 74); // light brown highlight
                        } else { // 'h'
                            r = rand(150, 160); g = rand(120, 130); b = rand(80, 90); // extra light highlight ridge
                        }
                        if (char !== '.' && Math.random() < 0.12) {
                            r += rand(-3, 3); g += rand(-2, 2); b += rand(-1, 1);
                        }
                    } else if (type === 'wood_top') {
                        // Concentric tree growth rings with light wood core and dark outer bark ring
                        const dist = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
                        if (dist > 6.5) {
                            r = rand(60, 68); g = rand(40, 48); b = rand(24, 30); // dark bark rim
                        } else {
                            let isRingLine = false;
                            const d_int = Math.floor(dist);
                            if (d_int === 2 || d_int === 5) {
                                isRingLine = true;
                            }
                            if (isRingLine) {
                                r = rand(145, 155); g = rand(110, 120); b = rand(70, 80); // darker rings
                            } else {
                                r = rand(185, 195); g = rand(150, 160); b = rand(105, 115); // light wood core
                            }
                            if (Math.random() < 0.12) {
                                r += rand(-4, 4); g += rand(-3, 3); b += rand(-2, 2);
                            }
                        }
                    } else if (type === 'leaves') {
                        // High-contrast translucent oak leaves with rich moss highlights
                        let v = rand(70, 105);
                        r = 30; g = v; b = 22;
                        if (Math.random() < 0.28) a = 0; // Natural open transparent holes in foliage
                    } else if (type === 'sand') {
                        let v = rand(205, 225);
                        r = v; g = v - 12; b = v - 64;
                        if (Math.random() < 0.12) { r -= 15; g -= 15; } // Noise grains
                    } else if (type === 'water') {
                        // Fluid water texture base (darker, deeper blue)
                        r = 15; g = 45; b = 150; a = 0.65;
                        if ((x + y) % 4 === 0) { r += 10; g += 10; b += 10; }
                    } else if (type === 'planks') {
                        // Super clean classic 16x16 Minecraft oak planks
                        let row = Math.floor(y / 4);
                        let localY = y % 4;
                        
                        // Planks vertical joints
                        let isJoint = false;
                        if (row === 0 && x === 11) isJoint = true;
                        if (row === 1 && x === 3) isJoint = true;
                        if (row === 2 && x === 7) isJoint = true;
                        if (row === 3 && x === 15) isJoint = true;
                        
                        let isBorder = (localY === 3 || isJoint);
                        if (isBorder) {
                            // Dark lines separating planks
                            r = 100; g = 75; b = 45;
                        } else {
                            // Base warm oak color
                            r = 196; g = 156; b = 103;
                            // Top highlight of each row for depth
                            if (localY === 0) {
                                r += 24; g += 24; b += 22;
                            } else if (localY === 2) {
                                // Bottom shadow
                                r -= 26; g -= 24; b -= 20;
                            }
                            // Add wood grain noise
                            if (Math.random() < 0.15) {
                                r += rand(-8, 8); g += rand(-6, 6); b += rand(-4, 4);
                            }
                        }
                    } else if (type === 'glass') {
                        const isStreak = (x + y === 7) || (x + y === 16) || x === 0 || y === 0 || x === 15 || y === 15;
                        r = 210; g = 245; b = 255; a = isStreak ? 0.35 : 0.04;
                    } else if (type === 'diamond_ore' || type === 'iron_ore' || type === 'gold_ore' || type === 'coal_ore') {
                        // High-fidelity Minecraft stone background with organic metallic ore clusters
                        let v = rand(102, 118);
                        r = g = b = v;
                        if ((x * 7 + y * 13) % 5 === 0) { r -= 10; g -= 10; b -= 10; } // Stone noise
                        
                        // Check if this pixel is part of an ore cluster (pre-determined organic pattern)
                        const cluster = (
                            (x===3 && y===3) || (x===4 && y===3) || (x===4 && y===4) ||
                            (x===9 && y===2) || (x===10 && y===3) ||
                            (x===2 && y===10) || (x===3 && y===11) || (x===4 && y===10) ||
                            (x===11 && y===11) || (x===12 && y===12) || (x===12 && y===10) ||
                            (x===7 && y===7) || (x===8 && y===8) || (x===6 && y===8)
                        );
                        if (cluster) {
                            if (type === 'diamond_ore') {
                                r = 60; g = 220; b = 255; // Diamond Cyan
                            } else if (type === 'iron_ore') {
                                r = 215; g = 145; b = 110; // Iron Peach
                            } else if (type === 'gold_ore') {
                                r = 235; g = 185; b = 40; // Gold Metallic
                            } else if (type === 'coal_ore') {
                                r = 35; g = 35; b = 35; // Coal Carbon Black
                            }
                        }
                    } else if (type === 'brick') {
                        // Realistic brick grid (4 rows of bricks with gray mortar)
                        const row = Math.floor(y / 4);
                        const localY = y % 4;
                        let isMortar = (localY === 0);
                        
                        if (!isMortar) {
                            if (row === 0 || row === 2) {
                                isMortar = (x === 4 || x === 12);
                            } else {
                                isMortar = (x === 0 || x === 8);
                            }
                        }
                        
                        if (isMortar) {
                            // Light gray cement mortar line
                            let v = rand(150, 165);
                            r = g = b = v;
                        } else {
                            // Bricks: Warm Red / Terracotta colors
                            r = rand(140, 175);
                            g = rand(50, 75);
                            b = rand(35, 55);
                            
                            // Highlight top and left inside the brick
                            if (localY === 1 || (row === 0 || row === 2 ? x === 5 || x === 13 : x === 1 || x === 9)) {
                                r += 25; g += 15; b += 10;
                            }
                            // Shadow bottom inside the brick
                            if (localY === 3) {
                                r -= 25; g -= 15; b -= 10;
                            }
                        }
                    } else if (type === 'item_stick') {
                        // Slanted wooden stick item (diagonal layout)
                        const isStick = (Math.abs(x - y) <= 1 && x >= 3 && x <= 12);
                        if (isStick) {
                            r = 100; g = 75; b = 45; // brown
                            if (x === y) { r += 20; g += 15; } // highlight
                        } else {
                            a = 0; // transparent
                        }
                    } else if (type === 'item_iron_ingot' || type === 'item_gold_ingot') {
                        // Metallic ingot shape
                        const isIngot = (x >= 4 && x <= 11 && y >= 5 && y <= 10 && Math.abs((x - 7.5) + (y - 7.5)) <= 4.5);
                        if (isIngot) {
                            if (type === 'item_iron_ingot') {
                                r = 190; g = 192; b = 196; // Silver/Iron
                                if (x + y <= 12) { r += 35; g += 35; b += 35; } // Highlight shine
                                if (x + y >= 17) { r -= 35; g -= 35; b -= 35; } // Shadow
                            } else {
                                r = 245; g = 205; b = 50; // Yellow Gold
                                if (x + y <= 12) { r += 10; g += 35; b += 35; } // Highlight shine
                                if (x + y >= 17) { r -= 40; g -= 35; b -= 35; } // Shadow
                            }
                        } else {
                            a = 0;
                        }
                    } else if (type === 'item_coal') {
                        // Carbon lump shape
                        const distToCenter = Math.hypot(x - 7.5, y - 7.5);
                        if (distToCenter <= 4.5 && Math.random() < 0.90) {
                            r = g = b = rand(25, 45); // dark coal charcoal
                            if (x < 7 && y < 7) { r += 15; g += 15; b += 15; } // specular gray highlight
                        } else {
                            a = 0;
                        }
                    } else if (type.startsWith('tool_')) {
                        // Standard pixel tool template (Pickaxe or Sword)
                        const isPick = type.includes('pickaxe');
                        const isSword = type.includes('sword');
                        let matColor = [200, 200, 200]; // default Iron
                        
                        if (type.includes('wood')) matColor = [140, 105, 60];
                        else if (type.includes('stone')) matColor = [110, 110, 110];
                        else if (type.includes('gold')) matColor = [245, 205, 40];
                        else if (type.includes('diamond')) matColor = [40, 215, 245];
                        
                        // Check if pixel is part of the stick handle
                        const isHandle = (x === y && x >= 2 && x <= 8);
                        // Check if center hub
                        const isHub = (x === 9 && y === 9);
                        // Pickaxe head
                        const isPickHead = isPick && !isHandle && (
                            (x === 9 && (y === 10 || y === 11 || y === 12)) ||
                            (y === 9 && (x === 10 || x === 11 || x === 12)) ||
                            (x === 8 && y === 13) || (x === 13 && y === 8) ||
                            (x === 7 && y === 14) || (x === 14 && y === 7)
                        );
                        // Sword blade
                        const isSwordBlade = isSword && !isHandle && (
                            (x === y && x >= 5 && x <= 14) ||
                            (x === y + 1 && x >= 5 && x <= 13) ||
                            (x === y - 1 && x >= 5 && x <= 13)
                        );
                        // Sword crossguard
                        const isSwordGuard = isSword && (
                            (x === 4 && y === 3) || (x === 3 && y === 4) ||
                            (x === 5 && y === 3) || (x === 3 && y === 5)
                        );
                        
                        if (isHandle) {
                            r = 100; g = 75; b = 45; // brown wood stick
                        } else if (isHub || isSwordGuard) {
                            r = 80; g = 80; b = 80; // dark metal guard/center
                        } else if (isPickHead || isSwordBlade) {
                            r = matColor[0]; g = matColor[1]; b = matColor[2];
                            // Shading
                            if (x + y <= 18) { r += 20; g += 20; b += 20; } // shiny highlight
                            else { r -= 20; g -= 20; b -= 20; } // shadow edge
                        } else {
                            a = 0;
                        }
                    }

                    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            textureCache[type] = { tex, canvas };
            return textureCache[type];
        }

        // Blöcke und Items Definitionen (ID-Mapping)
        const BLOCKS = { 
            AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, 
            WOOD: 4, SAND: 5, LEAVES: 6, WATER: 7, 
            PLANKS: 8, GLASS: 9, DIAMOND: 10, BRICK: 11,
            IRON_ORE: 12, GOLD_ORE: 13, COAL_ORE: 14, 
            STICK: 15, IRON_INGOT: 16, GOLD_INGOT: 17, COAL: 18,
            WOOD_PICKAXE: 19, STONE_PICKAXE: 20, IRON_PICKAXE: 21, GOLD_PICKAXE: 22, DIAMOND_PICKAXE: 23,
            WOOD_SWORD: 24, STONE_SWORD: 25, IRON_SWORD: 26, GOLD_SWORD: 27, DIAMOND_SWORD: 28
        };
        
        const texData = {
            grassTop: createPixelTexture('grass_top'), grassSide: createPixelTexture('grass_side'),
            dirt: createPixelTexture('dirt'), stone: createPixelTexture('stone'),
            woodSide: createPixelTexture('wood_side'), woodTop: createPixelTexture('wood_top'),
            leaves: createPixelTexture('leaves'), sand: createPixelTexture('sand'),
            water: createPixelTexture('water'), planks: createPixelTexture('planks'),
            glass: createPixelTexture('glass'), diamond: createPixelTexture('diamond_ore'),
            brick: createPixelTexture('brick'),
            ironOre: createPixelTexture('iron_ore'),
            goldOre: createPixelTexture('gold_ore'),
            coalOre: createPixelTexture('coal_ore'),
            stick: createPixelTexture('item_stick'),
            ironIngot: createPixelTexture('item_iron_ingot'),
            goldIngot: createPixelTexture('item_gold_ingot'),
            coal: createPixelTexture('item_coal'),
            woodPickaxe: createPixelTexture('tool_wood_pickaxe'),
            stonePickaxe: createPixelTexture('tool_stone_pickaxe'),
            ironPickaxe: createPixelTexture('tool_iron_pickaxe'),
            goldPickaxe: createPixelTexture('tool_gold_pickaxe'),
            diamondPickaxe: createPixelTexture('tool_diamond_pickaxe'),
            woodSword: createPixelTexture('tool_wood_sword'),
            stoneSword: createPixelTexture('tool_stone_sword'),
            ironSword: createPixelTexture('tool_iron_sword'),
            goldSword: createPixelTexture('tool_gold_sword'),
            diamondSword: createPixelTexture('tool_diamond_sword')
        };

        const materials = {
            [BLOCKS.GRASS]: [
                new THREE.MeshLambertMaterial({ map: texData.grassSide.tex }),
                new THREE.MeshLambertMaterial({ map: texData.grassSide.tex }),
                new THREE.MeshLambertMaterial({ map: texData.grassTop.tex }),
                new THREE.MeshLambertMaterial({ map: texData.dirt.tex }),
                new THREE.MeshLambertMaterial({ map: texData.grassSide.tex }),
                new THREE.MeshLambertMaterial({ map: texData.grassSide.tex }),
            ],
            [BLOCKS.DIRT]: new THREE.MeshLambertMaterial({ map: texData.dirt.tex }),
            [BLOCKS.STONE]: new THREE.MeshLambertMaterial({ map: texData.stone.tex }),
            [BLOCKS.WOOD]: [
                new THREE.MeshLambertMaterial({ map: texData.woodSide.tex }),
                new THREE.MeshLambertMaterial({ map: texData.woodSide.tex }),
                new THREE.MeshLambertMaterial({ map: texData.woodTop.tex }), // Oben
                new THREE.MeshLambertMaterial({ map: texData.woodTop.tex }), // Unten
                new THREE.MeshLambertMaterial({ map: texData.woodSide.tex }),
                new THREE.MeshLambertMaterial({ map: texData.woodSide.tex }),
            ],
            [BLOCKS.SAND]: new THREE.MeshLambertMaterial({ map: texData.sand.tex }),
            [BLOCKS.LEAVES]: new THREE.MeshLambertMaterial({ map: texData.leaves.tex, transparent: true, opacity: 0.90, side: THREE.DoubleSide, alphaTest: 0.2, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
            [BLOCKS.WATER]: new THREE.MeshLambertMaterial({ map: texData.water.tex, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
            [BLOCKS.PLANKS]: new THREE.MeshLambertMaterial({ map: texData.planks.tex }),
            [BLOCKS.GLASS]: new THREE.MeshLambertMaterial({ map: texData.glass.tex, transparent: true, opacity: 0.40, side: THREE.DoubleSide }),
            [BLOCKS.DIAMOND]: new THREE.MeshLambertMaterial({ map: texData.diamond.tex }),
            [BLOCKS.BRICK]: new THREE.MeshLambertMaterial({ map: texData.brick.tex }),
            [BLOCKS.IRON_ORE]: new THREE.MeshLambertMaterial({ map: texData.ironOre.tex }),
            [BLOCKS.GOLD_ORE]: new THREE.MeshLambertMaterial({ map: texData.goldOre.tex }),
            [BLOCKS.COAL_ORE]: new THREE.MeshLambertMaterial({ map: texData.coalOre.tex }),
            [BLOCKS.STICK]: new THREE.MeshLambertMaterial({ map: texData.stick.tex }),
            [BLOCKS.IRON_INGOT]: new THREE.MeshLambertMaterial({ map: texData.ironIngot.tex }),
            [BLOCKS.GOLD_INGOT]: new THREE.MeshLambertMaterial({ map: texData.goldIngot.tex }),
            [BLOCKS.COAL]: new THREE.MeshLambertMaterial({ map: texData.coal.tex }),
            [BLOCKS.WOOD_PICKAXE]: new THREE.MeshLambertMaterial({ map: texData.woodPickaxe.tex }),
            [BLOCKS.STONE_PICKAXE]: new THREE.MeshLambertMaterial({ map: texData.stonePickaxe.tex }),
            [BLOCKS.IRON_PICKAXE]: new THREE.MeshLambertMaterial({ map: texData.ironPickaxe.tex }),
            [BLOCKS.GOLD_PICKAXE]: new THREE.MeshLambertMaterial({ map: texData.goldPickaxe.tex }),
            [BLOCKS.DIAMOND_PICKAXE]: new THREE.MeshLambertMaterial({ map: texData.diamondPickaxe.tex }),
            [BLOCKS.WOOD_SWORD]: new THREE.MeshLambertMaterial({ map: texData.woodSword.tex }),
            [BLOCKS.STONE_SWORD]: new THREE.MeshLambertMaterial({ map: texData.stoneSword.tex }),
            [BLOCKS.IRON_SWORD]: new THREE.MeshLambertMaterial({ map: texData.ironSword.tex }),
            [BLOCKS.GOLD_SWORD]: new THREE.MeshLambertMaterial({ map: texData.goldSword.tex }),
            [BLOCKS.DIAMOND_SWORD]: new THREE.MeshLambertMaterial({ map: texData.diamondSword.tex })
        };

        const blockNames = {
            [BLOCKS.GRASS]: "Grasblock", [BLOCKS.DIRT]: "Erde", [BLOCKS.STONE]: "Stein",
            [BLOCKS.WOOD]: "Holzstamm", [BLOCKS.SAND]: "Sand", [BLOCKS.LEAVES]: "Laub",
            [BLOCKS.WATER]: "Wasser", [BLOCKS.PLANKS]: "Holzbretter", [BLOCKS.GLASS]: "Glas",
            [BLOCKS.DIAMOND]: "Diamant-Erz", [BLOCKS.BRICK]: "Ziegelstein",
            [BLOCKS.IRON_ORE]: "Eisenerz", [BLOCKS.GOLD_ORE]: "Golderz", [BLOCKS.COAL_ORE]: "Kohleerz",
            [BLOCKS.STICK]: "Stock", [BLOCKS.IRON_INGOT]: "Eisenbarren", [BLOCKS.GOLD_INGOT]: "Goldbarren",
            [BLOCKS.COAL]: "Kohle",
            [BLOCKS.WOOD_PICKAXE]: "Holzspitzhacke", [BLOCKS.STONE_PICKAXE]: "Steinspitzhacke",
            [BLOCKS.IRON_PICKAXE]: "Eisenspitzhacke", [BLOCKS.GOLD_PICKAXE]: "Goldspitzhacke",
            [BLOCKS.DIAMOND_PICKAXE]: "Diamantspitzhacke",
            [BLOCKS.WOOD_SWORD]: "Holzschwert", [BLOCKS.STONE_SWORD]: "Steinschwert",
            [BLOCKS.IRON_SWORD]: "Eisenschwert", [BLOCKS.GOLD_SWORD]: "Goldschwert",
            [BLOCKS.DIAMOND_SWORD]: "Diamantschwert"
        };

        function loadCustomTextures() {
            const sideImg = new Image();
            sideImg.onload = () => {
                if (sideImg.width === 0 || sideImg.height === 0) return;
                const item = texData.woodSide;
                if (item && item.canvas) {
                    item.canvas.width = sideImg.width;
                    item.canvas.height = sideImg.height;
                    const ctx = item.canvas.getContext('2d');
                    ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);
                    ctx.drawImage(sideImg, 0, 0);
                    item.tex.needsUpdate = true;
                    if (typeof updateInventoryUI === 'function') updateInventoryUI();
                    if (typeof updateHeldItemUI === 'function') updateHeldItemUI();
                }
            };
            sideImg.onerror = () => {
                console.warn("Failed to load sprites/LogSide.png, using procedural fallback.");
            };
            sideImg.src = 'sprites/LogSide.png';

            const topImg = new Image();
            topImg.onload = () => {
                if (topImg.width === 0 || topImg.height === 0) return;
                const item = texData.woodTop;
                if (item && item.canvas) {
                    item.canvas.width = topImg.width;
                    item.canvas.height = topImg.height;
                    const ctx = item.canvas.getContext('2d');
                    ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);
                    ctx.drawImage(topImg, 0, 0);
                    item.tex.needsUpdate = true;
                    if (typeof updateInventoryUI === 'function') updateInventoryUI();
                    if (typeof updateHeldItemUI === 'function') updateHeldItemUI();
                }
            };
            topImg.onerror = () => {
                console.warn("Failed to load sprites/LogTop.png, using procedural fallback.");
            };
            topImg.src = 'sprites/LogTop.png';

            const waterImg = new Image();
            waterImg.onload = () => {
                if (waterImg.width === 0 || waterImg.height === 0) return;
                const item = texData.water;
                if (item && item.canvas) {
                    item.canvas.width = waterImg.width;
                    item.canvas.height = waterImg.height;
                    const ctx = item.canvas.getContext('2d');
                    ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);
                    ctx.drawImage(waterImg, 0, 0);
                    item.tex.needsUpdate = true;
                    if (typeof updateInventoryUI === 'function') updateInventoryUI();
                    if (typeof updateHeldItemUI === 'function') updateHeldItemUI();
                }
            };
            waterImg.onerror = () => {
                console.warn("Failed to load sprites/WaterTop.png, using procedural fallback.");
            };
            waterImg.src = 'sprites/WaterTop.png';
        }

        loadCustomTextures();

        function draw2DIcon(canvas, blockType) {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const scale = 4;
            canvas.width = 16 * scale; canvas.height = 16 * scale;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (blockType === BLOCKS.LEAVES) {
                ctx.fillStyle = '#1e5218';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            const getIconTexture = (type) => {
                if (type === BLOCKS.GRASS) return texData.grassTop.canvas;
                if (type === BLOCKS.DIRT) return texData.dirt.canvas;
                if (type === BLOCKS.STONE) return texData.stone.canvas;
                if (type === BLOCKS.WOOD) return texData.woodTop.canvas;
                if (type === BLOCKS.SAND) return texData.sand.canvas;
                if (type === BLOCKS.PLANKS) return texData.planks.canvas;
                if (type === BLOCKS.GLASS) return texData.glass.canvas;
                if (type === BLOCKS.DIAMOND) return texData.diamond.canvas;
                if (type === BLOCKS.BRICK) return texData.brick.canvas;
                if (type === BLOCKS.LEAVES) return texData.leaves.canvas;
                if (type === BLOCKS.WATER) return texData.water.canvas;
                if (type === BLOCKS.IRON_ORE) return texData.ironOre.canvas;
                if (type === BLOCKS.GOLD_ORE) return texData.goldOre.canvas;
                if (type === BLOCKS.COAL_ORE) return texData.coalOre.canvas;
                if (type === BLOCKS.STICK) return texData.stick.canvas;
                if (type === BLOCKS.IRON_INGOT) return texData.ironIngot.canvas;
                if (type === BLOCKS.GOLD_INGOT) return texData.goldIngot.canvas;
                if (type === BLOCKS.COAL) return texData.coal.canvas;
                if (type === BLOCKS.WOOD_PICKAXE) return texData.woodPickaxe.canvas;
                if (type === BLOCKS.STONE_PICKAXE) return texData.stonePickaxe.canvas;
                if (type === BLOCKS.IRON_PICKAXE) return texData.ironPickaxe.canvas;
                if (type === BLOCKS.GOLD_PICKAXE) return texData.goldPickaxe.canvas;
                if (type === BLOCKS.DIAMOND_PICKAXE) return texData.diamondPickaxe.canvas;
                if (type === BLOCKS.WOOD_SWORD) return texData.woodSword.canvas;
                if (type === BLOCKS.STONE_SWORD) return texData.stoneSword.canvas;
                if (type === BLOCKS.IRON_SWORD) return texData.ironSword.canvas;
                if (type === BLOCKS.GOLD_SWORD) return texData.goldSword.canvas;
                if (type === BLOCKS.DIAMOND_SWORD) return texData.diamondSword.canvas;
                return texData.stone.canvas;
            };

            const sourceCanvas = getIconTexture(blockType);
            ctx.imageSmoothingEnabled = false;
            ctx.mozImageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
            ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, canvas.width, canvas.height);
        }

        function getPixelTextureCanvas(type) {
            if (type === BLOCKS.GRASS) return texData.grassTop.canvas;
            if (type === BLOCKS.DIRT) return texData.dirt.canvas;
            if (type === BLOCKS.STONE) return texData.stone.canvas;
            if (type === BLOCKS.WOOD) return texData.woodTop.canvas;
            if (type === BLOCKS.SAND) return texData.sand.canvas;
            if (type === BLOCKS.PLANKS) return texData.planks.canvas;
            if (type === BLOCKS.GLASS) return texData.glass.canvas;
            if (type === BLOCKS.DIAMOND) return texData.diamond.canvas;
            if (type === BLOCKS.BRICK) return texData.brick.canvas;
            if (type === BLOCKS.LEAVES) return texData.leaves.canvas;
            if (type === BLOCKS.WATER) return texData.water.canvas;
            if (type === BLOCKS.IRON_ORE) return texData.ironOre.canvas;
            if (type === BLOCKS.GOLD_ORE) return texData.goldOre.canvas;
            if (type === BLOCKS.COAL_ORE) return texData.coalOre.canvas;
            if (type === BLOCKS.STICK) return texData.stick.canvas;
            if (type === BLOCKS.IRON_INGOT) return texData.ironIngot.canvas;
            if (type === BLOCKS.GOLD_INGOT) return texData.goldIngot.canvas;
            if (type === BLOCKS.COAL) return texData.coal.canvas;
            if (type === BLOCKS.WOOD_PICKAXE) return texData.woodPickaxe.canvas;
            if (type === BLOCKS.STONE_PICKAXE) return texData.stonePickaxe.canvas;
            if (type === BLOCKS.IRON_PICKAXE) return texData.ironPickaxe.canvas;
            if (type === BLOCKS.GOLD_PICKAXE) return texData.goldPickaxe.canvas;
            if (type === BLOCKS.DIAMOND_PICKAXE) return texData.diamondPickaxe.canvas;
            if (type === BLOCKS.WOOD_SWORD) return texData.woodSword.canvas;
            if (type === BLOCKS.STONE_SWORD) return texData.stoneSword.canvas;
            if (type === BLOCKS.IRON_SWORD) return texData.ironSword.canvas;
            if (type === BLOCKS.GOLD_SWORD) return texData.goldSword.canvas;
            if (type === BLOCKS.DIAMOND_SWORD) return texData.diamondSword.canvas;
            return null;
        }

        let isSwinging = false;
        let swingProgress = 0;
        function swingHeldItem() {
            if (isSwinging) return;
            isSwinging = true;
            swingProgress = 0;
        }

        function updateHeldItemUI() {
            update3DHeldItemUI();
        }

        function update3DHeldItemUI() {
            if (typeof handGroup === 'undefined' || !handGroup) return;
            // Purge existing 3D hand/arm and item meshes safe and clean
            while (handGroup.children.length > 0) {
                const child = handGroup.children[0];
                handGroup.remove(child);
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }

            const activeItem = inventory[selectedID - 1];
            
            // Build Steve's 100% 3D Arm always
            const armPivot = new THREE.Group();
            handGroup.add(armPivot);

            // Cyan Sleeve (cyan shirt color)
            const sleeveGeo = new THREE.BoxGeometry(0.07, 0.07, 0.18);
            const sleeveMat = new THREE.MeshLambertMaterial({ color: 0x00a3b3 });
            const sleeveMesh = new THREE.Mesh(sleeveGeo, sleeveMat);
            sleeveMesh.position.set(0, 0, 0.08);
            armPivot.add(sleeveMesh);

            // Skin Hand
            const handGeo = new THREE.BoxGeometry(0.068, 0.068, 0.07);
            const handMat = new THREE.MeshLambertMaterial({ color: 0xf0b28a });
            const handMesh = new THREE.Mesh(handGeo, handMat);
            handMesh.position.set(0, 0, -0.045);
            armPivot.add(handMesh);

            // If we have an active item
            if (activeItem && activeItem.type !== BLOCKS.AIR && activeItem.count > 0) {
                const isBlock = (activeItem.type >= 1 && activeItem.type <= 19);

                if (isBlock) {
                    // Holding a real 3D block!
                    let blockMat = materials[activeItem.type];
                    if (!blockMat) blockMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

                    const blockGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
                    const blockMesh = new THREE.Mesh(blockGeo, blockMat);
                    blockMesh.position.set(-0.04, 0.05, -0.09);
                    blockMesh.rotation.set(0.3, 0.4, 0.2);
                    handGroup.add(blockMesh);
                } else {
                    // Holding a TOOL / ITEM!
                    const toolGroup = new THREE.Group();
                    toolGroup.position.set(-0.03, 0.04, -0.08);
                    toolGroup.rotation.set(0.2, 0.4, 1.25); // angled point forward-right

                    let hColor = 0x8c693c, mColor = 0x8c693c, sColor = 0x5a4123;
                    const typeId = activeItem.type;

                    // Detect tool material colors for authentic look
                    if (typeId === BLOCKS.WOOD_PICKAXE || typeId === BLOCKS.WOOD_SWORD) {
                        hColor = 0xb98e59; mColor = 0x8c693c; sColor = 0x5a4123;
                    } else if (typeId === BLOCKS.STONE_PICKAXE || typeId === BLOCKS.STONE_SWORD) {
                        hColor = 0xa0a0a0; mColor = 0x6e6e6e; sColor = 0x464646;
                    } else if (typeId === BLOCKS.IRON_PICKAXE || typeId === BLOCKS.IRON_SWORD || typeId === BLOCKS.IRON_INGOT) {
                        hColor = 0xffffff; mColor = 0xdcdcdc; sColor = 0xa5a5a5;
                    } else if (typeId === BLOCKS.GOLD_PICKAXE || typeId === BLOCKS.GOLD_SWORD || typeId === BLOCKS.GOLD_INGOT) {
                        hColor = 0xfff5af; mColor = 0xfad732; sColor = 0xc39b0f;
                    } else if (typeId === BLOCKS.DIAMOND_PICKAXE || typeId === BLOCKS.DIAMOND_SWORD) {
                        hColor = 0xd2ffff; mColor = 0x4dedf2; sColor = 0x21a5b7;
                    }

                    const isPick = (typeId === BLOCKS.WOOD_PICKAXE || typeId === BLOCKS.STONE_PICKAXE || typeId === BLOCKS.IRON_PICKAXE || typeId === BLOCKS.GOLD_PICKAXE || typeId === BLOCKS.DIAMOND_PICKAXE);
                    const isSword = (typeId === BLOCKS.WOOD_SWORD || typeId === BLOCKS.STONE_SWORD || typeId === BLOCKS.IRON_SWORD || typeId === BLOCKS.GOLD_SWORD || typeId === BLOCKS.DIAMOND_SWORD);

                    if (isPick) {
                        const stickGeo = new THREE.BoxGeometry(0.012, 0.012, 0.24);
                        const stickMat = new THREE.MeshLambertMaterial({ color: 0x8c693c });
                        const stickMesh = new THREE.Mesh(stickGeo, stickMat);
                        stickMesh.rotation.x = Math.PI / 4;
                        toolGroup.add(stickMesh);

                        const headGeo = new THREE.BoxGeometry(0.015, 0.16, 0.035);
                        const headMat = new THREE.MeshLambertMaterial({ color: mColor });
                        const headMesh = new THREE.Mesh(headGeo, headMat);
                        headMesh.position.set(0, 0.06, -0.06);
                        headMesh.rotation.x = Math.PI / 4;
                        toolGroup.add(headMesh);
                    } else if (isSword) {
                        const bladeGeo = new THREE.BoxGeometry(0.01, 0.025, 0.24);
                        const bladeMat = new THREE.MeshLambertMaterial({ color: mColor });
                        const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
                        bladeMesh.position.set(0, 0, -0.1);
                        toolGroup.add(bladeMesh);

                        const guardGeo = new THREE.BoxGeometry(0.014, 0.08, 0.016);
                        const guardMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
                        const guardMesh = new THREE.Mesh(guardGeo, guardMat);
                        guardMesh.position.set(0, 0, -0.01);
                        toolGroup.add(guardMesh);

                        const handleGeo = new THREE.BoxGeometry(0.012, 0.012, 0.06);
                        const handleMat = new THREE.MeshLambertMaterial({ color: 0x8c693c });
                        const handleMesh = new THREE.Mesh(handleGeo, handleMat);
                        handleMesh.position.set(0, 0, 0.03);
                        toolGroup.add(handleMesh);
                    } else if (typeId === BLOCKS.STICK) {
                        const stickGeo = new THREE.BoxGeometry(0.012, 0.012, 0.25);
                        const stickMat = new THREE.MeshLambertMaterial({ color: 0x8c693c });
                        const stickMesh = new THREE.Mesh(stickGeo, stickMat);
                        stickMesh.rotation.set(0.3, 0.3, 0.4);
                        toolGroup.add(stickMesh);
                    } else if (typeId === BLOCKS.IRON_INGOT || typeId === BLOCKS.GOLD_INGOT) {
                        const ingotGeo = new THREE.BoxGeometry(0.025, 0.05, 0.12);
                        const ingotMat = new THREE.MeshLambertMaterial({ color: mColor });
                        const ingotMesh = new THREE.Mesh(ingotGeo, ingotMat);
                        ingotMesh.rotation.set(0.4, 0.2, 0.1);
                        toolGroup.add(ingotMesh);
                    } else if (typeId === BLOCKS.COAL) {
                        const lumpGeo = new THREE.BoxGeometry(0.05, 0.05, 0.06);
                        const lumpMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
                        const lumpMesh = new THREE.Mesh(lumpGeo, lumpMat);
                        toolGroup.add(lumpMesh);
                    }

                    handGroup.add(toolGroup);
                }
            }
        }

        const iconTypes = [
            BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.STONE, 
            BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.SAND, 
            BLOCKS.GLASS, BLOCKS.BRICK, BLOCKS.DIAMOND
        ];

        // 9 Hotbar-Slots für das HUD-Rendering initialisieren
        iconTypes.forEach((type, i) => {
            const canvas = document.getElementById(`icon-${i}`);
            if(canvas) draw2DIcon(canvas, type);
        });

        // Inventar Datenstruktur (0-8: Hotbar, 9-35: Backpack, 40-43: Crafting Input, 44: Crafting Output)
        let inventory = Array(45).fill(null).map(() => ({ type: BLOCKS.AIR, count: 0 }));
        let activeItemOnCursor = { type: BLOCKS.AIR, count: 0 };

        // Start-Ausrüstung ist jetzt komplett leer für ein echtes Minecraft-Survival-Abenteuer!

        const breakTimes = {
            [BLOCKS.GRASS]: 0.3, [BLOCKS.DIRT]: 0.3, [BLOCKS.STONE]: 1.0,
            [BLOCKS.WOOD]: 0.6, [BLOCKS.SAND]: 0.25, [BLOCKS.BRICK]: 1.0,
            [BLOCKS.GLASS]: 0.15, [BLOCKS.DIAMOND]: 2.0, [BLOCKS.PLANKS]: 0.4
        };
        let isLeftMouseDown = false;
        let mineProgress = 0;
        let mineTarget = null;

        // Inventar UI Rendering & Synchronisation
        function updateInventoryUI() {
            // HUD Hotbar aktualisieren
            for (let i = 0; i < 9; i++) {
                const qtyEl = document.getElementById(`qty-${i}`);
                const iconCanvas = document.getElementById(`icon-${i}`);
                const slot = document.querySelector(`.slot[data-id="${i+1}"]`);
                const item = inventory[i];

                if (item && item.type !== BLOCKS.AIR && item.count > 0) {
                    qtyEl.innerText = item.count;
                    iconCanvas.style.display = "block";
                    draw2DIcon(iconCanvas, item.type);
                    slot.style.opacity = '1';
                } else {
                    qtyEl.innerText = "";
                    iconCanvas.style.display = "none";
                    slot.style.opacity = '0.4';
                }
            }

            // Backpack-Slots im Inventar befüllen (Slots 9 bis 35)
            const backpackGrid = document.getElementById('inv-backpack-grid');
            if (backpackGrid) {
                backpackGrid.innerHTML = '';
                for (let i = 9; i <= 35; i++) {
                    const slotEl = createMCGUISlot(i);
                    backpackGrid.appendChild(slotEl);
                }
            }

            // Hotbar-Slots im Inventar befüllen (Slots 0 bis 8)
            const hotbarGrid = document.getElementById('inv-hotbar-grid');
            if (hotbarGrid) {
                hotbarGrid.innerHTML = '';
                for (let i = 0; i < 9; i++) {
                    const slotEl = createMCGUISlot(i);
                    if (i === (selectedID - 1)) {
                        slotEl.classList.add('active');
                    }
                    hotbarGrid.appendChild(slotEl);
                }
            }

            // Crafting-Slots rendern
            for (let i = 0; i < 4; i++) {
                const craftSlot = document.getElementById(`craft-in-${i}`);
                if (craftSlot) {
                    craftSlot.innerHTML = '';
                    const item = inventory[40 + i];
                    if (item && item.type !== BLOCKS.AIR && item.count > 0) {
                        const canvas = document.createElement('canvas');
                        draw2DIcon(canvas, item.type);
                        craftSlot.appendChild(canvas);
                        const qty = document.createElement('div');
                        qty.className = 'qty';
                        qty.innerText = item.count;
                        craftSlot.appendChild(qty);
                    }
                }
            }

            // Crafting Output rendern
            const outSlot = document.getElementById('craft-out');
            if (outSlot) {
                outSlot.innerHTML = '';
                const item = inventory[44];
                if (item && item.type !== BLOCKS.AIR && item.count > 0) {
                    const canvas = document.createElement('canvas');
                    canvas.style.width = '40px'; canvas.style.height = '40px';
                    draw2DIcon(canvas, item.type);
                    outSlot.appendChild(canvas);
                    const qty = document.createElement('div');
                    qty.className = 'qty';
                    qty.innerText = item.count;
                    outSlot.appendChild(qty);
                }
            }

            // Cursor-Item Rendering
            const cursorEl = document.getElementById('cursor-item');
            const cursorCanvas = document.getElementById('cursor-canvas');
            const cursorQty = document.getElementById('cursor-qty');
            if (activeItemOnCursor && activeItemOnCursor.type !== BLOCKS.AIR && activeItemOnCursor.count > 0) {
                cursorEl.style.display = 'block';
                draw2DIcon(cursorCanvas, activeItemOnCursor.type);
                cursorQty.innerText = activeItemOnCursor.count;
            } else {
                cursorEl.style.display = 'none';
            }
            updateHeldItemUI();
        }

        // Hilfsfunktion zur Erstellung eines Minecraft-Inventar-Slots
        function createMCGUISlot(index) {
            const slot = document.createElement('div');
            slot.className = 'mc-slot';
            slot.setAttribute('onclick', `handleSlotClick(event, ${index})`);
            slot.setAttribute('oncontextmenu', `handleSlotRightClick(event, ${index}); return false;`);
            
            const item = inventory[index];
            if (item && item.type !== BLOCKS.AIR && item.count > 0) {
                const canvas = document.createElement('canvas');
                draw2DIcon(canvas, item.type);
                slot.appendChild(canvas);
                
                const qty = document.createElement('div');
                qty.className = 'qty';
                qty.innerText = item.count;
                slot.appendChild(qty);
            }
            return slot;
        }

        // Minecraft Crafting-Rezeptprüfung (2x2 Grid)
        function checkCraftingRecipes() {
            const c0 = inventory[40].type;
            const c1 = inventory[41].type;
            const c2 = inventory[42].type;
            const c3 = inventory[43].type;

            // Rezept 1: 1x Holzstamm -> 4x Holzbretter (PLANKS)
            if ((c0 === BLOCKS.WOOD && c1 === 0 && c2 === 0 && c3 === 0) ||
                (c0 === 0 && c1 === BLOCKS.WOOD && c2 === 0 && c3 === 0) ||
                (c0 === 0 && c1 === 0 && c2 === BLOCKS.WOOD && c3 === 0) ||
                (c0 === 0 && c1 === 0 && c2 === 0 && c3 === BLOCKS.WOOD)) {
                inventory[44] = { type: BLOCKS.PLANKS, count: 4 };
                return;
            }

            // Rezept 2: 4x Stein in quadratischem Verbund -> 4x Ziegelstein (BRICK)
            if (c0 === BLOCKS.STONE && c1 === BLOCKS.STONE && c2 === BLOCKS.STONE && c3 === BLOCKS.STONE) {
                inventory[44] = { type: BLOCKS.BRICK, count: 4 };
                return;
            }

            // Rezept 3: 1x Sand -> 1x Glas (GLASS)
            if ((c0 === BLOCKS.SAND && c1 === 0 && c2 === 0 && c3 === 0) ||
                (c0 === 0 && c1 === BLOCKS.SAND && c2 === 0 && c3 === 0) ||
                (c0 === 0 && c1 === 0 && c2 === BLOCKS.SAND && c3 === 0) ||
                (c0 === 0 && c1 === 0 && c2 === 0 && c3 === BLOCKS.SAND)) {
                inventory[44] = { type: BLOCKS.GLASS, count: 1 };
                return;
            }

            // Rezept 4: 2x Planks vertikal übereinander -> 4x Stock (STICK)
            if ((c0 === BLOCKS.PLANKS && c2 === BLOCKS.PLANKS && c1 === 0 && c3 === 0) ||
                (c1 === BLOCKS.PLANKS && c3 === BLOCKS.PLANKS && c0 === 0 && c2 === 0)) {
                inventory[44] = { type: BLOCKS.STICK, count: 4 };
                return;
            }

            // Rezept 5: 1x Eisenerz -> 1x Eisenbarren (IRON_INGOT)
            if ((c0 === BLOCKS.IRON_ORE && c1 === 0 && c2 === 0 && c3 === 0) ||
                (c0 === 0 && c1 === BLOCKS.IRON_ORE && c2 === 0 && c3 === 0) ||
                (c0 === 0 && c1 === 0 && c2 === BLOCKS.IRON_ORE && c3 === 0) ||
                (c0 === 0 && c1 === 0 && c2 === 0 && c3 === BLOCKS.IRON_ORE)) {
                inventory[44] = { type: BLOCKS.IRON_INGOT, count: 1 };
                return;
            }

            // Rezept 6: 1x Golderz -> 1x Goldbarren (GOLD_INGOT)
            if ((c0 === BLOCKS.GOLD_ORE && c1 === 0 && c2 === 0 && c3 === 0) ||
                (c0 === 0 && c1 === BLOCKS.GOLD_ORE && c2 === 0 && c3 === 0) ||
                (c0 === 0 && c1 === 0 && c2 === BLOCKS.GOLD_ORE && c3 === 0) ||
                (c0 === 0 && c1 === 0 && c2 === 0 && c3 === BLOCKS.GOLD_ORE)) {
                inventory[44] = { type: BLOCKS.GOLD_INGOT, count: 1 };
                return;
            }

            // Pickaxe Rezepte (2x Material oben, 2x Stock unten)
            // Holzspitzhacke
            if (c0 === BLOCKS.PLANKS && c1 === BLOCKS.PLANKS && c2 === BLOCKS.STICK && c3 === BLOCKS.STICK) {
                inventory[44] = { type: BLOCKS.WOOD_PICKAXE, count: 1 };
                return;
            }
            // Steinspitzhacke
            if (c0 === BLOCKS.STONE && c1 === BLOCKS.STONE && c2 === BLOCKS.STICK && c3 === BLOCKS.STICK) {
                inventory[44] = { type: BLOCKS.STONE_PICKAXE, count: 1 };
                return;
            }
            // Eisenspitzhacke
            if (c0 === BLOCKS.IRON_INGOT && c1 === BLOCKS.IRON_INGOT && c2 === BLOCKS.STICK && c3 === BLOCKS.STICK) {
                inventory[44] = { type: BLOCKS.IRON_PICKAXE, count: 1 };
                return;
            }
            // Goldspitzhacke
            if (c0 === BLOCKS.GOLD_INGOT && c1 === BLOCKS.GOLD_INGOT && c2 === BLOCKS.STICK && c3 === BLOCKS.STICK) {
                inventory[44] = { type: BLOCKS.GOLD_PICKAXE, count: 1 };
                return;
            }
            // Diamantspitzhacke
            if (c0 === BLOCKS.DIAMOND && c1 === BLOCKS.DIAMOND && c2 === BLOCKS.STICK && c3 === BLOCKS.STICK) {
                inventory[44] = { type: BLOCKS.DIAMOND_PICKAXE, count: 1 };
                return;
            }

            // Sword Rezepte (1x Material oben, 1x Stock unten - links o. rechts platziert)
            // Holzschwert
            if ((c0 === BLOCKS.PLANKS && c2 === BLOCKS.STICK && c1 === 0 && c3 === 0) ||
                (c1 === BLOCKS.PLANKS && c3 === BLOCKS.STICK && c0 === 0 && c2 === 0)) {
                inventory[44] = { type: BLOCKS.WOOD_SWORD, count: 1 };
                return;
            }
            // Steinschwert
            if ((c0 === BLOCKS.STONE && c2 === BLOCKS.STICK && c1 === 0 && c3 === 0) ||
                (c1 === BLOCKS.STONE && c3 === BLOCKS.STICK && c0 === 0 && c2 === 0)) {
                inventory[44] = { type: BLOCKS.STONE_SWORD, count: 1 };
                return;
            }
            // Eisenschwert
            if ((c0 === BLOCKS.IRON_INGOT && c2 === BLOCKS.STICK && c1 === 0 && c3 === 0) ||
                (c1 === BLOCKS.IRON_INGOT && c3 === BLOCKS.STICK && c0 === 0 && c2 === 0)) {
                inventory[44] = { type: BLOCKS.IRON_SWORD, count: 1 };
                return;
            }
            // Goldschwert
            if ((c0 === BLOCKS.GOLD_INGOT && c2 === BLOCKS.STICK && c1 === 0 && c3 === 0) ||
                (c1 === BLOCKS.GOLD_INGOT && c3 === BLOCKS.STICK && c0 === 0 && c2 === 0)) {
                inventory[44] = { type: BLOCKS.GOLD_SWORD, count: 1 };
                return;
            }
            // Diamantschwert
            if ((c0 === BLOCKS.DIAMOND && c2 === BLOCKS.STICK && c1 === 0 && c3 === 0) ||
                (c1 === BLOCKS.DIAMOND && c3 === BLOCKS.STICK && c0 === 0 && c2 === 0)) {
                inventory[44] = { type: BLOCKS.DIAMOND_SWORD, count: 1 };
                return;
            }

            // Nichts passendes gefunden
            inventory[44] = { type: BLOCKS.AIR, count: 0 };
        }

        // Drag & Drop / Click Handling für Links-Klick in Inventar-Slots
        function handleSlotClick(event, index) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            let slotItem = inventory[index];

            // Wenn wir auf den Output-Slot klicken
            if (index === 44) {
                if (slotItem.type !== BLOCKS.AIR && slotItem.count > 0) {
                    if (activeItemOnCursor.type === BLOCKS.AIR) {
                        // Cursor nimmt gecraftetes Item
                        activeItemOnCursor = { type: slotItem.type, count: slotItem.count };
                        reduceCraftingMaterials();
                    } else if (activeItemOnCursor.type === slotItem.type && activeItemOnCursor.count + slotItem.count <= 64) {
                        activeItemOnCursor.count += slotItem.count;
                        reduceCraftingMaterials();
                    }
                }
                checkCraftingRecipes();
                updateInventoryUI();
                return;
            }

            // Allgemeines Links-Klick Handling (Ganze Stacks bewegen)
            if (activeItemOnCursor.type === BLOCKS.AIR) {
                // Hand ist leer -> Item aus Slot aufheben
                if (slotItem.type !== BLOCKS.AIR && slotItem.count > 0) {
                    activeItemOnCursor = { ...slotItem };
                    inventory[index] = { type: BLOCKS.AIR, count: 0 };
                }
            } else {
                // Hand hat ein Item
                if (slotItem.type === BLOCKS.AIR) {
                    // Slot ist leer -> Komplett ablegen
                    inventory[index] = { ...activeItemOnCursor };
                    activeItemOnCursor = { type: BLOCKS.AIR, count: 0 };
                } else if (slotItem.type === activeItemOnCursor.type) {
                    // Gleicher Typ -> Zusammenführen
                    if (slotItem.count + activeItemOnCursor.count <= 64) {
                        inventory[index].count += activeItemOnCursor.count;
                        activeItemOnCursor = { type: BLOCKS.AIR, count: 0 };
                    } else {
                        const diff = 64 - slotItem.count;
                        inventory[index].count = 64;
                        activeItemOnCursor.count -= diff;
                    }
                } else {
                    // Anderes Item -> Tauschen
                    const temp = { ...slotItem };
                    inventory[index] = { ...activeItemOnCursor };
                    activeItemOnCursor = temp;
                }
            }

            if (index >= 40 && index <= 43) {
                checkCraftingRecipes();
            }

            updateInventoryUI();
        }

        // Rechts-Klick Handling im Inventar (Minecraft Style)
        function handleSlotRightClick(event, index) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            if (index === 44) return; // Output Slot reagiert nicht auf Rechtsklick

            let slotItem = inventory[index];

            if (activeItemOnCursor.type === BLOCKS.AIR) {
                // Hand ist leer -> Genau die Hälfte des Slot-Stacks aufnehmen (aufgerundet)
                if (slotItem.type !== BLOCKS.AIR && slotItem.count > 0) {
                    const takeAmt = Math.ceil(slotItem.count / 2);
                    const keepAmt = slotItem.count - takeAmt;
                    
                    activeItemOnCursor = { type: slotItem.type, count: takeAmt };
                    
                    if (keepAmt > 0) {
                        inventory[index].count = keepAmt;
                    } else {
                        inventory[index] = { type: BLOCKS.AIR, count: 0 };
                    }
                }
            } else {
                // Hand hat ein Item -> Platziere genau 1 Item vom Cursor im Slot
                if (slotItem.type === BLOCKS.AIR) {
                    inventory[index] = { type: activeItemOnCursor.type, count: 1 };
                    activeItemOnCursor.count--;
                    if (activeItemOnCursor.count <= 0) {
                        activeItemOnCursor = { type: BLOCKS.AIR, count: 0 };
                    }
                } else if (slotItem.type === activeItemOnCursor.type) {
                    if (slotItem.count < 64) {
                        inventory[index].count++;
                        activeItemOnCursor.count--;
                        if (activeItemOnCursor.count <= 0) {
                            activeItemOnCursor = { type: BLOCKS.AIR, count: 0 };
                        }
                    }
                }
            }

            if (index >= 40 && index <= 43) {
                checkCraftingRecipes();
            }

            updateInventoryUI();
        }

        function reduceCraftingMaterials() {
            for (let i = 40; i <= 43; i++) {
                if (inventory[i].type !== BLOCKS.AIR && inventory[i].count > 0) {
                    inventory[i].count--;
                    if (inventory[i].count === 0) {
                        inventory[i] = { type: BLOCKS.AIR, count: 0 };
                    }
                }
            }
        }

        // Mausbewegung-Listener für schwebendes Item
        document.addEventListener('mousemove', (e) => {
            const cursorEl = document.getElementById('cursor-item');
            if (cursorEl && cursorEl.style.display === 'block') {
                cursorEl.style.left = e.clientX + 'px';
                cursorEl.style.top = e.clientY + 'px';
            }
        });

        // 3D Engine & Simplex Terrain Setup
        const simplex = new SimplexNoise();
        const CHUNK_SIZE = 16;
        const CHUNK_HEIGHT = 64;
        const RENDER_DISTANCE = 3;
        const WATER_LEVEL = 18; 
        
        let worldData = new Map();
        let modifiedWorldData = new Map(); // SPEICHER-OPTIMIERUNG: Trackt NUR Spieler-Änderungen!
        const activeChunks = new Map();
        const generatedChunks = new Set();
        const droppedItems = []; // Array für physisch droppende Blöcke

        const saveName = 'web_minecraft_save_v2';
        let savedWorldData = localStorage.getItem(saveName);
        if (savedWorldData) {
            try {
                const parsed = JSON.parse(savedWorldData);
                if (parsed.world) {
                    // Lade nur modifizierte Blöcke
                    modifiedWorldData = new Map(Object.entries(parsed.world));
                    // Übernimm diese Änderungen direkt in die aktive Welt, damit die Terrain-Generierung sie überspringt
                    worldData = new Map(modifiedWorldData);
                    inventory = parsed.inventory || inventory;
                }
            } catch (e) {
                console.warn("Laden fehlgeschlagen, spiele neue Welt.", e);
            }
        }

        function getBlock(x, y, z) {
            if (y < 0 || y >= CHUNK_HEIGHT) return BLOCKS.AIR;
            const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
            return worldData.get(key) || BLOCKS.AIR;
        }

        function setBlock(x, y, z, type) {
            if (y < 0 || y >= CHUNK_HEIGHT) return;
            const bx = Math.floor(x);
            const by = Math.floor(y);
            const bz = Math.floor(z);
            const key = `${bx},${by},${bz}`;
            if (type === BLOCKS.AIR) worldData.set(key, BLOCKS.AIR);
            else worldData.set(key, type);
            
            const cx = Math.floor(bx / CHUNK_SIZE);
            const cz = Math.floor(bz / CHUNK_SIZE);
            markChunkDirty(cx, cz);

            // Falls an einer Chunk-Grenze geändert wurde, müssen auch die Nachbar-Chunks neu gerendert werden (behebt Nahtstellen/Culling-Fehler)
            const rx = bx - cx * CHUNK_SIZE;
            const rz = bz - cz * CHUNK_SIZE;
            if (rx === 0) markChunkDirty(cx - 1, cz);
            if (rx === CHUNK_SIZE - 1) markChunkDirty(cx + 1, cz);
            if (rz === 0) markChunkDirty(cx, cz - 1);
            if (rz === CHUNK_SIZE - 1) markChunkDirty(cx, cz + 1);
        }

        // Schnittstelle für Spieleraktionen (Abbauen/Platzieren), um modifizierte Blöcke aufzuzeichnen
        function playerSetBlock(x, y, z, type) {
            const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
            modifiedWorldData.set(key, type); // Merke dir nur die Spieler-Änderung für den LocalStorage
            setBlock(x, y, z, type);
        }

        function markChunkDirty(cx, cz) {
            const key = `${cx},${cz}`;
            if (activeChunks.has(key)) {
                scene.remove(activeChunks.get(key));
                activeChunks.delete(key);
            }
        }

        function getBiome(gx, gz) {
            const bNoise = simplex.noise2D(gx * 0.002, gz * 0.002);
            
            let floor = BLOCKS.GRASS;
            let sub = BLOCKS.DIRT;
            let treeChance = 0.015;
            let name = 'PLAINS';

            if (bNoise < -0.4) {
                floor = BLOCKS.SAND; sub = BLOCKS.SAND; treeChance = 0.0; name = 'DESERT';
            } else if (bNoise < -0.2) {
                const t = (bNoise - (-0.4)) / 0.2;
                floor = (t < 0.5) ? BLOCKS.SAND : BLOCKS.GRASS;
                sub = (t < 0.5) ? BLOCKS.SAND : BLOCKS.DIRT;
                treeChance = t * 0.015;
                name = (t < 0.5) ? 'DESERT' : 'PLAINS';
            } else if (bNoise < 0.25) {
                floor = BLOCKS.GRASS; sub = BLOCKS.DIRT; treeChance = 0.015; name = 'PLAINS';
            } else if (bNoise < 0.45) {
                const t = (bNoise - 0.25) / 0.2;
                floor = BLOCKS.GRASS; sub = BLOCKS.DIRT;
                treeChance = 0.015 + t * 0.105;
                name = 'PLAINS';
            } else {
                floor = BLOCKS.GRASS; sub = BLOCKS.DIRT; treeChance = 0.12; name = 'FOREST';
            }

            return { floor, sub, treeChance, bNoise, name };
        }

        function getHeight(gx, gz, bNoise = null) {
            const noise = (bNoise === null) ? simplex.noise2D(gx * 0.002, gz * 0.002) : bNoise;
            
            const n2 = simplex.noise2D(gx * 0.02, gz * 0.02) * 5;
            const hp = simplex.noise2D(gx * 0.005, gz * 0.005) * 16 + 28;
            const hd = simplex.noise2D(gx * 0.004, gz * 0.004) * 8 + 28;
            const hf = simplex.noise2D(gx * 0.005, gz * 0.005) * 24 + 28;

            let h;
            if (noise < -0.4) {
                h = hd;
            } else if (noise < -0.2) {
                const t = (noise - (-0.4)) / 0.2;
                h = hd * (1 - t) + hp * t;
            } else if (noise < 0.25) {
                h = hp;
            } else if (noise < 0.45) {
                const t = (noise - 0.25) / 0.2;
                h = hp * (1 - t) + hf * t;
            } else {
                h = hf;
            }

            return Math.floor(h + n2);
        }

        function generateDataForChunk(cx, cz) {
            const chunkKey = `${cx},${cz}`;
            if (generatedChunks.has(chunkKey)) return;
            generatedChunks.add(chunkKey);

            for(let x=0; x<CHUNK_SIZE; x++) {
                for(let z=0; z<CHUNK_SIZE; z++) {
                    const gx = cx * CHUNK_SIZE + x;
                    const gz = cz * CHUNK_SIZE + z;

                    const biome = getBiome(gx, gz);
                    const h = getHeight(gx, gz, biome.bNoise);
                    for(let y=0; y<CHUNK_HEIGHT; y++) {
                        const cellKey = `${gx},${y},${gz}`;
                        if (worldData.has(cellKey)) continue;

                        let type = BLOCKS.AIR;

                        // --- NEW CAVE SYSTEM (Large & Small Caves) ---
                        // Large caves (low frequency, high threshold)
                        const largeCave = simplex.noise3D(gx * 0.02, y * 0.05, gz * 0.02);
                        // Small "worm" caves (high frequency)
                        const wormCave = simplex.noise3D(gx * 0.1, y * 0.12, gz * 0.1);
                        
                        let isCave = false;
                        if (y < h - 3 && y > 1) {
                            if (largeCave > 0.65) isCave = true; // Chambers
                            if (wormCave > 0.6) isCave = true;  // Worms
                        }

                        if (!isCave) {
                            if (y <= h) {
                                if (y === h) type = (y < WATER_LEVEL + 1) ? BLOCKS.SAND : biome.floor;
                                else if (y > h - 3) type = (h < WATER_LEVEL + 1) ? BLOCKS.SAND : biome.sub;
                                else {
                                    if (y < 12 && Math.random() < 0.015) type = BLOCKS.DIAMOND;
                                    else type = BLOCKS.STONE;
                                }
                            } else if (y <= WATER_LEVEL) {
                                type = (biome.name === 'DESERT') ? BLOCKS.SAND : BLOCKS.WATER;
                            }
                        } else if (y <= WATER_LEVEL && y > h - 10) {
                            // Some caves near surface filled with water? No, let's keep them air for now.
                        }

                        if (type !== BLOCKS.AIR) worldData.set(cellKey, type);
                    }
                    if (h > WATER_LEVEL + 2 && Math.random() < biome.treeChance) createTree(gx, h + 1, gz);
                }
            }
        }

        function createTree(x, y, z) {
            const h = 5;
            const trunkCx = Math.floor(x / CHUNK_SIZE);
            const trunkCz = Math.floor(z / CHUNK_SIZE);

            // Wood / Stamm
            for(let i=0; i<h; i++) {
                const key = `${x},${y+i},${z}`;
                if (!worldData.has(key)) {
                    worldData.set(key, BLOCKS.WOOD);
                }
            }

            // Leaves / Laub
            for(let ox=-2; ox<=2; ox++) {
                for(let oz=-2; oz<=2; oz++) {
                    for(let oy=0; oy<3; oy++) {
                        if (Math.abs(ox) + Math.abs(oz) + Math.abs(oy) > 3.2) continue;
                        const lx = x + ox;
                        const lz = z + oz;
                        const key = `${lx},${y+h-2+oy},${lz}`;
                        if (!worldData.has(key)) {
                            worldData.set(key, BLOCKS.LEAVES);
                            
                            // Wenn Laub in Nachbar-Chunks ragt, markiere diese als dirty (behebt unsichtbare, aber kollidierende Blätter)
                            const leafCx = Math.floor(lx / CHUNK_SIZE);
                            const leafCz = Math.floor(lz / CHUNK_SIZE);
                            if ((leafCx !== trunkCx || leafCz !== trunkCz) && activeChunks.has(`${leafCx},${leafCz}`)) {
                                markChunkDirty(leafCx, leafCz);
                            }
                        }
                    }
                }
            }
        }

        // Three.js Scene Setup
        const scene = new THREE.Scene();
        const baseSkyColor = new THREE.Color(0x78A7FF);
        const nightSkyColor = new THREE.Color(0x0a0a14);
        const sunsetSkyColor = new THREE.Color(0xFD5E53);

        scene.background = baseSkyColor.clone();
        scene.fog = new THREE.Fog(0x78A7FF, 25, 80);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        scene.add(camera);
        const handGroup = new THREE.Group();
        camera.add(handGroup);
        handGroup.position.set(0.35, -0.32, -0.42);
        handGroup.rotation.set(0.1, -0.2, 0.05);

        const renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const sun = new THREE.DirectionalLight(0xfffcd3, 0.6);
        sun.position.set(50, 100, 50);
        scene.add(sun);

        const moon = new THREE.DirectionalLight(0x90b0ff, 0.2);
        moon.position.set(-50, -100, -50);
        scene.add(moon);

        // Pointer Lock Sicherheitsüberprüfung
        (function() {
            const originalRequestPointerLock = Element.prototype.requestPointerLock;
            Element.prototype.requestPointerLock = function(...args) {
                try {
                    const promise = originalRequestPointerLock.apply(this, args);
                    if (promise && typeof promise.catch === 'function') {
                        return promise.catch((err) => {
                            console.warn("Pointer lock deferred: ", err.message);
                        });
                    }
                    return promise;
                } catch (err) {
                    console.warn("Pointer lock handled: ", err.message);
                }
            };
        })();

        const controls = new THREE.PointerLockControls(camera, document.body);
        const overlay = document.getElementById('overlay');

        function requestGameLock() {
            if (document.getElementById('inventory-overlay').style.display !== 'flex') {
                controls.lock();
                initAmbientSounds();
            }
        }

        controls.addEventListener('lock', () => {
            overlay.style.display = 'none';
        });
        controls.addEventListener('unlock', () => {
            const cInput = document.getElementById('chat-input');
            const invOverlay = document.getElementById('inventory-overlay');
            if (cInput.classList.contains('hidden') && invOverlay.style.display !== 'flex') {
                overlay.style.display = 'flex';
            }
        });

        // Sonne & Mond im Retro-Look (schwebende Voxel)
        const sunGeo = new THREE.BoxGeometry(14, 14, 14);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffcd3, fog: false });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        scene.add(sunMesh);

        const moonGeo = new THREE.BoxGeometry(10, 10, 10);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xdddddd, fog: false });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        scene.add(moonMesh);

        // Abbau-Rahmen (Selection Indicator) - jetzt als ultra-realistischer Minecraft-Strikter Outlines-Rahmen ohne diagonale Linien!
        const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
        const selectionBox = new THREE.LineSegments(
            edgeGeo,
            new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2.5, transparent: true, opacity: 0.8 })
        );
        scene.add(selectionBox);

        // Abbau-Risse (Cracking Material System)
        const crackingTextures = [];
        const crackingMaterials = [];
        let crackingMesh = null;

        function initCrackingTextures() {
            for (let stage = 1; stage <= 5; stage++) {
                const canvas = document.createElement('canvas');
                canvas.width = 16; canvas.height = 16;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 16, 16);
                ctx.strokeStyle = "rgba(0, 0, 0, 0.72)";
                ctx.lineWidth = 1.2;
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                // Gekreuzte Risse für authentische Abbau-Animationen
                if (stage >= 1) {
                    ctx.moveTo(3, 4); ctx.lineTo(8, 6); ctx.lineTo(12, 4);
                }
                if (stage >= 2) {
                    ctx.moveTo(8, 6); ctx.lineTo(6, 11); ctx.lineTo(11, 13);
                }
                if (stage >= 3) {
                    ctx.moveTo(3, 4); ctx.lineTo(1, 8); ctx.lineTo(6, 11);
                    ctx.moveTo(12, 4); ctx.lineTo(14, 9); ctx.lineTo(11, 13);
                }
                if (stage >= 4) {
                    ctx.moveTo(6, 11); ctx.lineTo(4, 15);
                    ctx.moveTo(11, 13); ctx.lineTo(13, 15);
                    ctx.moveTo(8, 6); ctx.lineTo(8, 1);
                }
                if (stage >= 5) {
                    ctx.moveTo(1, 8); ctx.lineTo(3, 14);
                    ctx.moveTo(14, 9); ctx.lineTo(15, 14);
                    ctx.moveTo(8, 1); ctx.lineTo(13, 2);
                }
                ctx.stroke();
                
                const tex = new THREE.CanvasTexture(canvas);
                tex.magFilter = THREE.NearestFilter;
                crackingTextures.push(tex);
                
                crackingMaterials.push(new THREE.MeshBasicMaterial({
                    map: tex,
                    transparent: true,
                    polygonOffset: true,
                    polygonOffsetFactor: -1.2, // Verhindert Z-Fighting perfekt!
                    polygonOffsetUnits: -1.2,
                    depthWrite: false
                }));
            }

            // Cracking Mesh initialisieren
            const crackingMeshGeo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
            crackingMesh = new THREE.Mesh(crackingMeshGeo, crackingMaterials[0]);
            crackingMesh.visible = false;
            scene.add(crackingMesh);
        }

        // Aufruf auf Start
        initCrackingTextures();

        // Abbau-Partikel System
        const miningParticles = [];
        const particleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const blockColors = {
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
            [BLOCKS.BRICK]: 0x934b37
        };

        function spawnMiningParticles(bx, by, bz, blockType, count = 2) {
            const color = blockColors[blockType] || 0xffffff;
            const particleMat = new THREE.MeshBasicMaterial({ color: color });
            
            for(let i=0; i<count; i++) {
                const pMesh = new THREE.Mesh(particleGeo, particleMat);
                pMesh.position.set(
                    bx + 0.15 + Math.random() * 0.7,
                    by + 0.15 + Math.random() * 0.7,
                    bz + 0.15 + Math.random() * 0.7
                );
                scene.add(pMesh);
                
                miningParticles.push({
                    mesh: pMesh,
                    vel: new THREE.Vector3(
                        (Math.random() - 0.5) * 2.5,
                        1.5 + Math.random() * 3.0,
                        (Math.random() - 0.5) * 2.5
                    ),
                    gravity: 12,
                    life: 0.4 + Math.random() * 0.3
                });
            }
        }

        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const waterPlaneGeo = new THREE.PlaneGeometry(1, 1);
        waterPlaneGeo.rotateX(-Math.PI/2);

        function renderChunk(cx, cz) {
            generateDataForChunk(cx, cz);
            const chunkGroup = new THREE.Group();
            const blockPositions = {};
            const waterPos = [];

            for(let x=0; x<CHUNK_SIZE; x++) {
                for(let z=0; z<CHUNK_SIZE; z++) {
                    const gx = cx * CHUNK_SIZE + x;
                    const gz = cz * CHUNK_SIZE + z;

                    for(let y=0; y<CHUNK_HEIGHT; y++) {
                        const type = getBlock(gx, y, gz);
                        if (type === BLOCKS.AIR) continue;
                        
                        if (type === BLOCKS.WATER) {
                            if (getBlock(gx, y+1, gz) === BLOCKS.AIR) waterPos.push(new THREE.Vector3(gx, y, gz));
                            continue;
                        }

                        // Backface Culling auf Block-Ebene zur Performance-Optimierung (Blöcke hinter Glas, Wasser o. Laub sind sichtbar)
                        const isOpaque = (bx, by, bz) => {
                            const t = getBlock(bx, by, bz);
                            return t !== BLOCKS.AIR && t !== BLOCKS.WATER && t !== BLOCKS.GLASS && t !== BLOCKS.LEAVES;
                        };

                        const isHidden = 
                            isOpaque(gx+1, y, gz) && isOpaque(gx-1, y, gz) &&
                            isOpaque(gx, y+1, gz) && isOpaque(gx, y-1, gz) &&
                            isOpaque(gx, y, gz+1) && isOpaque(gx, y, gz-1);

                        if (!isHidden) {
                            if (!blockPositions[type]) blockPositions[type] = [];
                            blockPositions[type].push(new THREE.Vector3(gx, y, gz));
                        }
                    }
                }
            }

            for (const type in blockPositions) {
                const list = blockPositions[type];
                const imMesh = new THREE.InstancedMesh(boxGeo, materials[type], list.length);
                const dummy = new THREE.Object3D();
                list.forEach((p, i) => {
                    dummy.position.set(p.x + 0.5, p.y + 0.5, p.z + 0.5);
                    dummy.updateMatrix();
                    imMesh.setMatrixAt(i, dummy.matrix);
                });
                chunkGroup.add(imMesh);
            }

            if (waterPos.length > 0) {
                const wm = new THREE.InstancedMesh(waterPlaneGeo, materials[BLOCKS.WATER], waterPos.length);
                const dummy = new THREE.Object3D();
                waterPos.forEach((p, i) => {
                    dummy.position.set(p.x + 0.5, p.y + 1.0, p.z + 0.5);
                    dummy.updateMatrix();
                    wm.setMatrixAt(i, dummy.matrix);
                });
                chunkGroup.add(wm);
            }

            scene.add(chunkGroup);
            activeChunks.set(`${cx},${cz}`, chunkGroup);
        }

        function updateWorldChunks() {
            const px = Math.floor(camera.position.x / CHUNK_SIZE);
            const pz = Math.floor(camera.position.z / CHUNK_SIZE);
            
            // 1. Zuerst Daten für einen größeren Radius generieren (bietet nahtloses Culling & verhindert, dass Spieler in ungeladene Welten laufen)
            const dataRadius = RENDER_DISTANCE + 1;
            for(let x = px - dataRadius; x <= px + dataRadius; x++) {
                for(let z = pz - dataRadius; z <= pz + dataRadius; z++) {
                    generateDataForChunk(x, z);
                }
            }

            // 2. Chunks im RENDER_DISTANCE Bereich rendern
            for(let x = px - RENDER_DISTANCE; x <= px + RENDER_DISTANCE; x++) {
                for(let z = pz - RENDER_DISTANCE; z <= pz + RENDER_DISTANCE; z++) {
                    if (!activeChunks.has(`${x},${z}`)) renderChunk(x, z);
                }
            }

            // 3. Weit entfernte Chunks entladen, um Systemressourcen/Grafikkartenspeicher zu schonen
            const unloadDistance = RENDER_DISTANCE + 2;
            for (const key of activeChunks.keys()) {
                const [cx, cz] = key.split(',').map(Number);
                if (Math.abs(cx - px) > unloadDistance || Math.abs(cz - pz) > unloadDistance) {
                    const mesh = activeChunks.get(key);
                    scene.remove(mesh);
                    activeChunks.delete(key);
                }
            }

            document.getElementById('chunkCount').innerText = activeChunks.size;
        }

        const player = {
            pos: new THREE.Vector3(8, 45, 8),
            vel: new THREE.Vector3(),
            visualY: 45,
            w: 0.6, h: 1.8, eye: 1.6, grounded: false,
            inWater: false, stepHeight: 1.1
        };

        let selectedID = 1; // 1 bis 9
        const keys = {};

        const chatInput = document.getElementById('chat-input');
        const chatContainer = document.getElementById('chat-container');

        // Physische Dropped Items Logik (Schwebende Blöcke im Raum)
        function spawnDroppedItem(type, px, py, pz) {
            const itemGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
            
            let itemMat = materials[type];
            const itemMesh = new THREE.Mesh(itemGeo, itemMat);
            
            // Aufpoppen mit Impuls
            itemMesh.position.set(px + 0.5, py + 0.5, pz + 0.5);
            scene.add(itemMesh);

            droppedItems.push({
                mesh: itemMesh,
                type: type,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 2.5,
                    4.5,
                    (Math.random() - 0.5) * 2.5
                ),
                collected: false,
                grounded: false,
                spawnTime: Date.now()
            });
        }

        // Toggles & Key Handling
        window.onkeydown = (e) => {
            if (e.code === 'Enter') {
                toggleChat();
                e.preventDefault();
                return;
            }

            if (document.activeElement === chatInput) return;

            // Inventar mit 'KeyE' umschalten
            if (e.code === 'KeyE') {
                toggleInventory();
                e.preventDefault();
                return;
            }

            // Gegenstand abwerfen mit 'KeyQ' (nur wenn nicht im Chat)
            if (e.code === 'KeyQ') {
                const activeIndex = selectedID - 1; // hotbar index 0-8
                const activeItem = inventory[activeIndex];
                if (activeItem && activeItem.type !== BLOCKS.AIR && activeItem.count > 0) {
                    // Position vor der Kamera berechnen
                    const px = camera.position.x;
                    const py = camera.position.y - 0.5;
                    const pz = camera.position.z;

                    const dir = new THREE.Vector3();
                    camera.getWorldDirection(dir);
                    dir.normalize();

                    // Vor dem Spieler werfen (0.5 Abzug für spawnDroppedItem Zentrierung)
                    const spawnX = px + dir.x * 1.2 - 0.5;
                    const spawnY = py + dir.y * 1.2 - 0.5;
                    const spawnZ = pz + dir.z * 1.2 - 0.5;

                    spawnDroppedItem(activeItem.type, spawnX, spawnY, spawnZ);

                    // Menge dekrementieren im Inventar
                    activeItem.count--;
                    if (activeItem.count <= 0) {
                        inventory[activeIndex] = { type: BLOCKS.AIR, count: 0 };
                    }
                    updateInventoryUI();
                    updateHeldItemUI();
                    playSound('break'); // Procedural drop key-press feedback sound

                    e.preventDefault();
                    return;
                }
            }

            keys[e.code] = true;
            if (e.code.startsWith('Digit')) {
                const val = parseInt(e.code.slice(-1));
                if (val >= 1 && val <= 9) {
                    setSelectedSlot(val);
                }
            }
        };

        window.onkeyup = (e) => {
            if (document.activeElement === chatInput) return;
            keys[e.code] = false;
        };

        // Mausrad zum Scrollen durch die Hotbar
        window.onwheel = (e) => {
            if (document.getElementById('inventory-overlay').style.display === 'flex') return;
            let current = selectedID;
            if (e.deltaY > 0) {
                current++;
                if (current > 9) current = 1;
            } else {
                current--;
                if (current < 1) current = 9;
            }
            setSelectedSlot(current);
        };

        function setSelectedSlot(slotNum) {
            selectedID = slotNum;
            document.querySelectorAll('.slot').forEach(s => s.classList.remove('active'));
            document.querySelector(`.slot[data-id="${slotNum}"]`).classList.add('active');
            updateHeldItemUI();
        }

        function toggleInventory() {
            const invOverlay = document.getElementById('inventory-overlay');
            if (invOverlay.style.display === 'flex') {
                invOverlay.style.display = 'none';
                
                // Schmeißt getragenes Cursor-Item ins normale Inventar zurück
                if (activeItemOnCursor.type !== BLOCKS.AIR && activeItemOnCursor.count > 0) {
                    addItemToInventoryDirectly(activeItemOnCursor.type, activeItemOnCursor.count);
                    activeItemOnCursor = { type: BLOCKS.AIR, count: 0 };
                }
                
                controls.lock();
            } else {
                invOverlay.style.display = 'flex';
                controls.unlock();
                isLeftMouseDown = false;
                mineProgress = 0;
                mineTarget = null;
            }
            updateInventoryUI();
        }

        const I18N = {
            DE: de,
            EN: en
        };

        let currentLang = localStorage.getItem('mine_lang') || 'DE';

        function updateLanguageUI() {
            const t = I18N[currentLang];
            
            // Main elements
            const playBtn = document.getElementById('play-btn');
            if (playBtn) playBtn.innerText = t.play;
            const langBtn = document.getElementById('lang-btn');
            if (langBtn) langBtn.innerText = t.langBtn;

            const saveIndicator = document.getElementById('save-indicator');
            if (saveIndicator) saveIndicator.innerText = t.saveIndicator;

            const hudSystemTitle = document.getElementById('hud-system-title');
            if (hudSystemTitle) hudSystemTitle.innerText = t.hudSystemTitle;

            const hudPosLbl = document.getElementById('hud-pos-lbl');
            if (hudPosLbl) hudPosLbl.innerText = t.hudPosLbl;

            const hudTimeLbl = document.getElementById('hud-time-lbl');
            if (hudTimeLbl) hudTimeLbl.innerText = t.hudTimeLbl;

            const hudChunksLbl = document.getElementById('hud-chunks-lbl');
            if (hudChunksLbl) hudChunksLbl.innerText = t.hudChunksLbl;

            const chatInputEl = document.getElementById('chat-input');
            if (chatInputEl) chatInputEl.placeholder = t.chatPlaceholder;

            const resetModalTitle = document.getElementById('reset-modal-title');
            if (resetModalTitle) resetModalTitle.innerText = t.resetModalTitle;

            const resetModalDesc = document.getElementById('reset-modal-desc');
            if (resetModalDesc) resetModalDesc.innerText = t.resetModalDesc;

            const resetModalYes = document.getElementById('reset-modal-yes');
            if (resetModalYes) resetModalYes.innerText = t.yes;

            const resetModalNo = document.getElementById('reset-modal-no');
            if (resetModalNo) resetModalNo.innerText = t.no;

            const recipesBookTitle = document.getElementById('recipes-book-title');
            if (recipesBookTitle) recipesBookTitle.innerText = t.recipesBookTitle;

            const recipesBtn = document.getElementById('recipes-btn');
            if (recipesBtn) recipesBtn.innerText = t.recipesBtn;

            const closeBtn = document.getElementById('close-btn');
            if (closeBtn) closeBtn.innerText = t.closeBtn;

            const invHeaderTitle = document.getElementById('inv-header-title');
            if (invHeaderTitle) invHeaderTitle.innerText = t.inventoryAndCrafting;

            const invCraftingLbl = document.getElementById('inv-crafting-lbl');
            if (invCraftingLbl) invCraftingLbl.innerText = t.crafting;

            const invBackpackLbl = document.getElementById('inv-backpack-lbl');
            if (invBackpackLbl) invBackpackLbl.innerText = t.inventory;

            const invHotbarLbl = document.getElementById('inv-hotbar-lbl');
            if (invHotbarLbl) invHotbarLbl.innerText = t.hotbar;

            const recipeAutoHint = document.getElementById('recipe-auto-hint');
            if (recipeAutoHint) recipeAutoHint.innerText = t.clickToFill;

            // Recipe Titles & Descs
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.innerText = val;
            };

            setVal("recipe-planks-title", t.recipePlanksTitle);
            setVal("recipe-planks-desc", t.recipePlanksDesc);
            setVal("recipe-stick-title", t.recipeStickTitle);
            setVal("recipe-stick-desc", t.recipeStickDesc);
            setVal("recipe-glass-title", t.recipeGlassTitle);
            setVal("recipe-glass-desc", t.recipeGlassDesc);
            setVal("recipe-ironingot-title", t.recipeIronIngotTitle);
            setVal("recipe-ironingot-desc", t.recipeIronIngotDesc);
            setVal("recipe-goldingot-title", t.recipeGoldIngotTitle);
            setVal("recipe-goldingot-desc", t.recipeGoldIngotDesc);
            setVal("recipe-brick-title", t.recipeBrickTitle);
            setVal("recipe-brick-desc", t.recipeBrickDesc);

            setVal("recipe-wpick-title", t.recipeWPickTitle);
            setVal("recipe-wpick-desc", t.recipeWPickDesc);
            setVal("recipe-spick-title", t.recipeSPickTitle);
            setVal("recipe-spick-desc", t.recipeSPickDesc);
            setVal("recipe-ipick-title", t.recipeIPickTitle);
            setVal("recipe-ipick-desc", t.recipeIPickDesc);
            setVal("recipe-gpick-title", t.recipeGPickTitle);
            setVal("recipe-gpick-desc", t.recipeGPickDesc);
            setVal("recipe-dpick-title", t.recipeDPickTitle);
            setVal("recipe-dpick-desc", t.recipeDPickDesc);

            setVal("recipe-wsword-title", t.recipeWSwordTitle);
            setVal("recipe-wsword-desc", t.recipeWSwordDesc);
            setVal("recipe-ssword-title", t.recipeSSwordTitle);
            setVal("recipe-ssword-desc", t.recipeSSwordDesc);
            setVal("recipe-isword-title", t.recipeISwordTitle);
            setVal("recipe-isword-desc", t.recipeISwordDesc);
            setVal("recipe-gsword-title", t.recipeGSwordTitle);
            setVal("recipe-gsword-desc", t.recipeGSwordDesc);
            setVal("recipe-dsword-title", t.recipeDSwordTitle);
            setVal("recipe-dsword-desc", t.recipeDSwordDesc);

            const controlsList = document.getElementById('controls-list');
            if (controlsList) {
                controlsList.innerHTML = `
                    <div><b class="text-[#ffff55]">WASD + SPACE:</b> ${t.wasd}</div>
                    <div><b class="text-[#ffff55]">SHIFT:</b> ${t.shift}</div>
                    <div><b class="text-[#ffff55]">CTRL:</b> ${t.ctrl}</div>
                    <div><b class="text-[#ffff55]">L-CLICK:</b> ${t.leftClick}</div>
                    <div><b class="text-[#ffff55]">R-CLICK:</b> ${t.rightClick}</div>
                    <div><b class="text-[#ff5555]">KEY E:</b> ${t.keyE}</div>
                    <div><b class="text-[#ffff55]">WHEEL / 1-9:</b> ${t.mouseWheel}</div>
                    <div><b class="text-[#ff5555]">ENTER:</b> ${t.enter}</div>
                `;
            }

            localStorage.setItem('mine_lang', currentLang);
        }

        function toggleLanguage(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            currentLang = currentLang === 'DE' ? 'EN' : 'DE';
            updateLanguageUI();
        }

        function drawRecipeBookCanvases() {
            try {
                draw2DIcon(document.getElementById('rec-in-planks'), BLOCKS.WOOD);
                draw2DIcon(document.getElementById('rec-out-planks'), BLOCKS.PLANKS);
                draw2DIcon(document.getElementById('rec-out-stick'), BLOCKS.STICK);
                draw2DIcon(document.getElementById('rec-in-glass'), BLOCKS.SAND);
                draw2DIcon(document.getElementById('rec-out-glass'), BLOCKS.GLASS);
                draw2DIcon(document.getElementById('rec-in-ironingot'), BLOCKS.IRON_ORE);
                draw2DIcon(document.getElementById('rec-out-ironingot'), BLOCKS.IRON_INGOT);
                draw2DIcon(document.getElementById('rec-in-goldingot'), BLOCKS.GOLD_ORE);
                draw2DIcon(document.getElementById('rec-out-goldingot'), BLOCKS.GOLD_INGOT);
                draw2DIcon(document.getElementById('rec-out-brick'), BLOCKS.BRICK);
                draw2DIcon(document.getElementById('rec-out-woodpick'), BLOCKS.WOOD_PICKAXE);
                draw2DIcon(document.getElementById('rec-out-stonepick'), BLOCKS.STONE_PICKAXE);
                draw2DIcon(document.getElementById('rec-out-ironpick'), BLOCKS.IRON_PICKAXE);
                draw2DIcon(document.getElementById('rec-out-goldpick'), BLOCKS.GOLD_PICKAXE);
                draw2DIcon(document.getElementById('rec-out-diamondpick'), BLOCKS.DIAMOND_PICKAXE);
                draw2DIcon(document.getElementById('rec-out-woodsword'), BLOCKS.WOOD_SWORD);
                draw2DIcon(document.getElementById('rec-out-stonesword'), BLOCKS.STONE_SWORD);
                draw2DIcon(document.getElementById('rec-out-ironsword'), BLOCKS.IRON_SWORD);
                draw2DIcon(document.getElementById('rec-out-goldsword'), BLOCKS.GOLD_SWORD);
                draw2DIcon(document.getElementById('rec-out-diamondsword'), BLOCKS.DIAMOND_SWORD);
            } catch(e) {}
        }

        function toggleRecipeBook() {
            const panel = document.getElementById('recipe-book-panel');
            if (panel) {
                if (panel.classList.contains('hidden')) {
                    panel.classList.remove('hidden');
                    drawRecipeBookCanvases();
                } else {
                    panel.classList.add('hidden');
                }
            }
        }

        function clearCraftingGrid() {
            for (let i = 40; i <= 43; i++) {
                if (inventory[i] && inventory[i].type !== BLOCKS.AIR && inventory[i].count > 0) {
                    addItemToInventoryDirectly(inventory[i].type, inventory[i].count);
                    inventory[i] = { type: BLOCKS.AIR, count: 0 };
                }
            }
        }

        function findAndExtractItem(type, amount) {
            let totalAvailable = 0;
            for (let i = 0; i < 36; i++) {
                if (inventory[i] && inventory[i].type === type) {
                    totalAvailable += inventory[i].count;
                }
            }
            if (totalAvailable < amount) return false;

            let needed = amount;
            for (let i = 0; i < 36; i++) {
                if (inventory[i] && inventory[i].type === type) {
                    if (inventory[i].count >= needed) {
                        inventory[i].count -= needed;
                        if (inventory[i].count === 0) {
                            inventory[i] = { type: BLOCKS.AIR, count: 0 };
                        }
                        return true;
                    } else {
                        needed -= inventory[i].count;
                        inventory[i] = { type: BLOCKS.AIR, count: 0 };
                    }
                }
            }
            return true;
        }

        function hasItemAndCount(type, amount) {
            let totalAvailable = 0;
            for (let i = 0; i < 36; i++) {
                if (inventory[i] && inventory[i].type === type) {
                    totalAvailable += inventory[i].count;
                }
            }
            return totalAvailable >= amount;
        }

        function autoFillRecipe(recipeType) {
            // Erst Gitter leeren
            clearCraftingGrid();

            const t = I18N[currentLang];

            if (recipeType === 'planks') {
                if (findAndExtractItem(BLOCKS.WOOD, 1)) {
                    inventory[40] = { type: BLOCKS.WOOD, count: 1 };
                    addChatMessage(t.craftPlanksFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftPlanksNeed, "text-yellow-400");
                }
            } else if (recipeType === 'stick') {
                if (findAndExtractItem(BLOCKS.PLANKS, 2)) {
                    inventory[40] = { type: BLOCKS.PLANKS, count: 1 };
                    inventory[42] = { type: BLOCKS.PLANKS, count: 1 };
                    addChatMessage(t.craftStickFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftStickNeed, "text-yellow-400");
                }
            } else if (recipeType === 'glass') {
                if (findAndExtractItem(BLOCKS.SAND, 1)) {
                    inventory[40] = { type: BLOCKS.SAND, count: 1 };
                    addChatMessage(t.craftGlassFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftGlassNeed, "text-yellow-400");
                }
            } else if (recipeType === 'ironingot') {
                if (findAndExtractItem(BLOCKS.IRON_ORE, 1)) {
                    inventory[40] = { type: BLOCKS.IRON_ORE, count: 1 };
                    addChatMessage(t.craftIronIngotFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftIronIngotNeed, "text-yellow-400");
                }
            } else if (recipeType === 'goldingot') {
                if (findAndExtractItem(BLOCKS.GOLD_ORE, 1)) {
                    inventory[40] = { type: BLOCKS.GOLD_ORE, count: 1 };
                    addChatMessage(t.craftGoldIngotFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftGoldIngotNeed, "text-yellow-400");
                }
            } else if (recipeType === 'brick') {
                if (findAndExtractItem(BLOCKS.STONE, 4)) {
                    inventory[40] = { type: BLOCKS.STONE, count: 1 };
                    inventory[41] = { type: BLOCKS.STONE, count: 1 };
                    inventory[42] = { type: BLOCKS.STONE, count: 1 };
                    inventory[43] = { type: BLOCKS.STONE, count: 1 };
                    addChatMessage(t.craftBrickFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftBrickNeed, "text-yellow-400");
                }
            } else if (recipeType === 'wood_pickaxe') {
                if (hasItemAndCount(BLOCKS.PLANKS, 2) && hasItemAndCount(BLOCKS.STICK, 2)) {
                    findAndExtractItem(BLOCKS.PLANKS, 2);
                    findAndExtractItem(BLOCKS.STICK, 2);
                    inventory[40] = { type: BLOCKS.PLANKS, count: 1 };
                    inventory[41] = { type: BLOCKS.PLANKS, count: 1 };
                    inventory[42] = { type: BLOCKS.STICK, count: 1 };
                    inventory[43] = { type: BLOCKS.STICK, count: 1 };
                    addChatMessage(t.craftWPickFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftWPickNeed, "text-yellow-400");
                }
            } else if (recipeType === 'stone_pickaxe') {
                if (hasItemAndCount(BLOCKS.STONE, 2) && hasItemAndCount(BLOCKS.STICK, 2)) {
                    findAndExtractItem(BLOCKS.STONE, 2);
                    findAndExtractItem(BLOCKS.STICK, 2);
                    inventory[40] = { type: BLOCKS.STONE, count: 1 };
                    inventory[41] = { type: BLOCKS.STONE, count: 1 };
                    inventory[42] = { type: BLOCKS.STICK, count: 1 };
                    inventory[43] = { type: BLOCKS.STICK, count: 1 };
                    addChatMessage(t.craftSPickFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftSPickNeed, "text-yellow-400");
                }
            } else if (recipeType === 'iron_pickaxe') {
                if (hasItemAndCount(BLOCKS.IRON_INGOT, 2) && hasItemAndCount(BLOCKS.STICK, 2)) {
                    findAndExtractItem(BLOCKS.IRON_INGOT, 2);
                    findAndExtractItem(BLOCKS.STICK, 2);
                    inventory[40] = { type: BLOCKS.IRON_INGOT, count: 1 };
                    inventory[41] = { type: BLOCKS.IRON_INGOT, count: 1 };
                    inventory[42] = { type: BLOCKS.STICK, count: 1 };
                    inventory[43] = { type: BLOCKS.STICK, count: 1 };
                    addChatMessage(t.craftIPickFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftIPickNeed, "text-yellow-400");
                }
            } else if (recipeType === 'gold_pickaxe') {
                if (hasItemAndCount(BLOCKS.GOLD_INGOT, 2) && hasItemAndCount(BLOCKS.STICK, 2)) {
                    findAndExtractItem(BLOCKS.GOLD_INGOT, 2);
                    findAndExtractItem(BLOCKS.STICK, 2);
                    inventory[40] = { type: BLOCKS.GOLD_INGOT, count: 1 };
                    inventory[41] = { type: BLOCKS.GOLD_INGOT, count: 1 };
                    inventory[42] = { type: BLOCKS.STICK, count: 1 };
                    inventory[43] = { type: BLOCKS.STICK, count: 1 };
                    addChatMessage(t.craftGPickFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftGPickNeed, "text-yellow-400");
                }
            } else if (recipeType === 'diamond_pickaxe') {
                if (hasItemAndCount(BLOCKS.DIAMOND, 2) && hasItemAndCount(BLOCKS.STICK, 2)) {
                    findAndExtractItem(BLOCKS.DIAMOND, 2);
                    findAndExtractItem(BLOCKS.STICK, 2);
                    inventory[40] = { type: BLOCKS.DIAMOND, count: 1 };
                    inventory[41] = { type: BLOCKS.DIAMOND, count: 1 };
                    inventory[42] = { type: BLOCKS.STICK, count: 1 };
                    inventory[43] = { type: BLOCKS.STICK, count: 1 };
                    addChatMessage(t.craftDPickFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftDPickNeed, "text-yellow-400");
                }
            } else if (recipeType === 'wood_sword') {
                if (hasItemAndCount(BLOCKS.PLANKS, 1) && hasItemAndCount(BLOCKS.STICK, 1)) {
                    findAndExtractItem(BLOCKS.PLANKS, 1);
                    findAndExtractItem(BLOCKS.STICK, 1);
                    inventory[40] = { type: BLOCKS.PLANKS, count: 1 };
                    inventory[42] = { type: BLOCKS.STICK, count: 1 };
                    addChatMessage(t.craftWSwordFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftWSwordNeed, "text-yellow-400");
                }
            } else if (recipeType === 'stone_sword') {
                if (hasItemAndCount(BLOCKS.STONE, 1) && hasItemAndCount(BLOCKS.STICK, 1)) {
                    findAndExtractItem(BLOCKS.STONE, 1);
                    findAndExtractItem(BLOCKS.STICK, 1);
                    inventory[40] = { type: BLOCKS.STONE, count: 1 };
                    inventory[42] = { type: BLOCKS.STICK, count: 1 };
                    addChatMessage(t.craftSSwordFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftSSwordNeed, "text-yellow-400");
                }
            } else if (recipeType === 'iron_sword') {
                if (hasItemAndCount(BLOCKS.IRON_INGOT, 1) && hasItemAndCount(BLOCKS.STICK, 1)) {
                    findAndExtractItem(BLOCKS.IRON_INGOT, 1);
                    findAndExtractItem(BLOCKS.STICK, 1);
                    inventory[40] = { type: BLOCKS.IRON_INGOT, count: 1 };
                    inventory[42] = { type: BLOCKS.STICK, count: 1 };
                    addChatMessage(t.craftISwordFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftISwordNeed, "text-yellow-400");
                }
            } else if (recipeType === 'gold_sword') {
                if (hasItemAndCount(BLOCKS.GOLD_INGOT, 1) && hasItemAndCount(BLOCKS.STICK, 1)) {
                    findAndExtractItem(BLOCKS.GOLD_INGOT, 1);
                    findAndExtractItem(BLOCKS.STICK, 1);
                    inventory[40] = { type: BLOCKS.GOLD_INGOT, count: 1 };
                    inventory[42] = { type: BLOCKS.STICK, count: 1 };
                    addChatMessage(t.craftGSwordFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftGSwordNeed, "text-yellow-400");
                }
            } else if (recipeType === 'diamond_sword') {
                if (hasItemAndCount(BLOCKS.DIAMOND, 1) && hasItemAndCount(BLOCKS.STICK, 1)) {
                    findAndExtractItem(BLOCKS.DIAMOND, 1);
                    findAndExtractItem(BLOCKS.STICK, 1);
                    inventory[40] = { type: BLOCKS.DIAMOND, count: 1 };
                    inventory[42] = { type: BLOCKS.STICK, count: 1 };
                    addChatMessage(t.craftDSwordFilled, "text-green-400");
                } else {
                    addChatMessage(t.craftDSwordNeed, "text-yellow-400");
                }
            }

            checkCraftingRecipes();
            updateInventoryUI();
        }

        // Chat Steuerung
        function toggleChat() {
            if (chatInput.classList.contains('hidden')) {
                chatInput.classList.remove('hidden');
                chatContainer.style.background = 'rgba(0, 0, 0, 0.55)';
                controls.unlock();
                setTimeout(() => chatInput.focus(), 20);
            } else {
                sendChatMessage();
            }
        }

        function closeChat() {
            chatInput.value = '';
            chatInput.classList.add('hidden');
            chatContainer.style.background = 'rgba(0, 0, 0, 0.25)';
            chatInput.blur();
            controls.lock();
        }

        function addChatMessage(msg, color = 'text-white') {
            const chatMessages = document.getElementById('chat-messages');
            const msgEl = document.createElement('div');
            msgEl.className = color;
            msgEl.innerText = msg;
            chatMessages.appendChild(msgEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            while (chatMessages.children.length > 30) {
                chatMessages.removeChild(chatMessages.firstChild);
            }
        }

        function formatGameTime() {
            const totalMinutes = Math.floor((gameTime / 2.0) * 1440);
            const hour = (Math.floor(totalMinutes / 60) + 6) % 24;
            const minute = totalMinutes % 60;
            return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        }

        function parseGameTime(timeStr) {
            const parts = timeStr.trim().split(':');
            let h = parseInt(parts[0]);
            let m = parseInt(parts[1]) || 0;
            if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) return null;
            let hoursSince6 = (h - 6 + 24) % 24;
            let totalMinutes = hoursSince6 * 60 + m;
            return (totalMinutes / 1440) * 2.0;
        }

        function sendChatMessage() {
            const val = chatInput.value.trim();
            const t = I18N[currentLang];
            if (val) {
                if (val.startsWith('/')) {
                    const parts = val.split(' ');
                    const cmd = parts[0].toLowerCase();
                    const arg = parts.slice(1).join(' ');

                    if (cmd === '/save') {
                        saveWorldDirect();
                    } else if (cmd === '/load') {
                        loadWorldDirect();
                    } else if (cmd === '/craft' || cmd === '/recipes' || cmd === '/rezept' || cmd === '/rezepte') {
                        const invOverlay = document.getElementById('inventory-overlay');
                        if (invOverlay.style.display !== 'flex') {
                            toggleInventory();
                        }
                        const panel = document.getElementById('recipe-book-panel');
                        if (panel && panel.classList.contains('hidden')) {
                            toggleRecipeBook();
                        }
                        addChatMessage(t.recipeBookOpened, 'text-green-400');
                    } else if (cmd === '/time') {
                        let timeVal = arg;
                        if (arg.toLowerCase().startsWith('set ')) {
                            timeVal = arg.substring(4);
                        }
                        const parsed = parseGameTime(timeVal);
                        if (parsed !== null) {
                            gameTime = parsed;
                            addChatMessage(`${t.timeChanged} ${timeVal}`, 'text-yellow-400');
                        } else {
                            addChatMessage(t.timeErrorFormat, 'text-red-500');
                        }
                    } else {
                        addChatMessage(`${t.unknownCommand} ${cmd}`, 'text-red-500');
                    }
                } else {
                    addChatMessage(`<Player> ${val.toUpperCase()}`, 'text-white');
                }
            }
            closeChat();
        }

        const raycaster = new THREE.Raycaster();
        
        window.onmousedown = (e) => {
            if (!controls.isLocked || document.activeElement === chatInput || document.getElementById('inventory-overlay').style.display === 'flex') return;
            
            swingHeldItem();
            
            if (e.button === 0) {
                isLeftMouseDown = true;
            } else if (e.button === 2) {
                raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                const intersects = raycaster.intersectObjects(Array.from(activeChunks.values()), true);

                if (intersects.length > 0 && intersects[0].distance < 5.5) {
                    const hit = intersects[0];
                    const pos = hit.point.clone();
                    const normal = hit.face.normal.clone();
                    const targetPos = pos.clone().sub(normal.clone().multiplyScalar(0.05));
                    const bx = Math.floor(targetPos.x);
                    const by = Math.floor(targetPos.y);
                    const bz = Math.floor(targetPos.z);
                    const targetedBlockType = getBlock(bx, by, bz);

                    if (targetedBlockType === BLOCKS.WATER) return;

                    // Hole aktives Item aus der ausgewählten Hotbar-Spalte (Index 0 bis 8)
                    const activeIndexInHotbar = selectedID - 1;
                    const itemToPlace = inventory[activeIndexInHotbar];

                    if (!itemToPlace || itemToPlace.type === BLOCKS.AIR || itemToPlace.count <= 0) return;

                    const buildPos = pos.clone().add(normal.clone().multiplyScalar(0.05));
                    const nbx = Math.floor(buildPos.x);
                    const nby = Math.floor(buildPos.y);
                    const nbz = Math.floor(buildPos.z);
                    
                    // Kollisionsprüfung mit dem Spieler (Präzise Bounding-Box)
                    const pr = player.w / 2;
                    const pMinX = player.pos.x - pr;
                    const pMaxX = player.pos.x + pr;
                    const pMinY = player.pos.y;
                    const pMaxY = player.pos.y + player.h;
                    const pMinZ = player.pos.z - pr;
                    const pMaxZ = player.pos.z + pr;

                    const intersectsPlayer = (
                        nbx < pMaxX && (nbx + 1) > pMinX &&
                        nby < pMaxY && (nby + 1) > pMinY &&
                        nbz < pMaxZ && (nbz + 1) > pMinZ
                    );

                    if (intersectsPlayer) return;
                    
                    // SPEICHER-OPTIMIERUNG: Nutze playerSetBlock statt setBlock
                    playerSetBlock(nbx, nby, nbz, itemToPlace.type);
                    playSound('place');
                    
                    // Verbrauche das Item im Hotbar-Slot
                    inventory[activeIndexInHotbar].count--;
                    if (inventory[activeIndexInHotbar].count <= 0) {
                        inventory[activeIndexInHotbar] = { type: BLOCKS.AIR, count: 0 };
                    }
                    updateInventoryUI();
                }
            }
        };

        window.onmouseup = (e) => {
            if (e.button === 0) {
                isLeftMouseDown = false;
                mineProgress = 0;
                mineTarget = null;
            }
        };

        function isSolid(x, y, z) {
            const b = getBlock(x, y, z);
            return b !== BLOCKS.AIR && b !== BLOCKS.WATER;
        }

        // Spieler-Kollisionsberechnung (AABB)
        function checkCollision(pos) {
            const r = player.w / 2;
            const yMin = pos.y;
            const yMax = pos.y + player.h;
            for(let x = Math.floor(pos.x - r); x <= Math.floor(pos.x + r); x++) {
                for(let y = Math.floor(yMin); y <= Math.floor(yMax); y++) {
                    for(let z = Math.floor(pos.z - r); z <= Math.floor(pos.z + r); z++) {
                        if (isSolid(x, y, z)) return true;
                    }
                }
            }
            return false;
        }

        function saveWorld(e) {
            if (e) e.stopPropagation();
            saveWorldDirect();
        }

        function saveWorldDirect() {
            try {
                // SPEICHER-OPTIMIERUNG: Wir speichern AUSSCHLIESSLICH die modifizierten Blöcke (modifiedWorldData)!
                const rawObj = Object.fromEntries(modifiedWorldData);
                const saveState = {
                    world: rawObj,
                    inventory: inventory
                };
                const t = I18N[currentLang];
                localStorage.setItem(saveName, JSON.stringify(saveState));
                
                const ind = document.getElementById('save-indicator');
                if (ind) {
                    ind.innerText = t.saveIndicator;
                    ind.style.opacity = "1";
                    ind.style.transform = "translateY(0)";
                    setTimeout(() => {
                        ind.style.opacity = "0";
                        ind.style.transform = "translateY(-20px)";
                    }, 2500);
                }

                addChatMessage(t.worldSaved, "text-green-400");
            } catch (err) {
                console.error("Speichern fehlgeschlagen: ", err);
                const t = I18N[currentLang];
                addChatMessage(t.worldSaveFailed, "text-red-500");
            }
        }

        function loadWorldDirect() {
            let saved = localStorage.getItem(saveName);
            const t = I18N[currentLang];
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.world) {
                        // SPEICHER-OPTIMIERUNG: Lade modifizierte Blöcke neu
                        modifiedWorldData = new Map(Object.entries(parsed.world));
                        worldData = new Map(modifiedWorldData);
                        inventory = parsed.inventory || inventory;
                    }
                    updateInventoryUI();
                    
                    // Rendere Chunks neu
                    for (const [key, mesh] of activeChunks.entries()) {
                        scene.remove(mesh);
                    }
                    activeChunks.clear();
                    updateWorldChunks();
                    
                    addChatMessage(t.worldLoaded, "text-green-400");
                } catch (e) {
                    addChatMessage(t.worldLoadFailed, "text-red-500");
                }
            } else {
                addChatMessage(t.worldNotFound, "text-yellow-400");
            }
        }

        function triggerResetModal(e) {
            if (e) e.stopPropagation();
            document.getElementById('confirm-modal').classList.remove('hidden');
            controls.unlock();
        }

        function confirmReset(yes) {
            document.getElementById('confirm-modal').classList.add('hidden');
            const t = I18N[currentLang];
            if (yes) {
                localStorage.removeItem(saveName);
                addChatMessage(t.worldResetMsg, "text-red-500");
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                controls.lock();
            }
        }

        // Hilfsfunktion: Blöcke direkt ins Inventar einspeisen
        function addItemToInventoryDirectly(type, amt) {
            // Erst versuchen auf bestehende Stapel zu legen
            for (let i = 0; i < 36; i++) {
                if (inventory[i] && inventory[i].type === type && inventory[i].count + amt <= 64) {
                    inventory[i].count += amt;
                    return;
                }
            }
            // Freien Slot suchen (erst Hotbar, dann Backpack)
            for (let i = 0; i < 36; i++) {
                if (!inventory[i] || inventory[i].type === BLOCKS.AIR) {
                    inventory[i] = { type: type, count: amt };
                    return;
                }
            }
        }

        let gameTime = 0.5; // Startzeit um 12 Uhr mittags
        const CYCLE_DURATION_SECONDS = 1200; // Ein kompletter 20-Minuten-Tag-Nacht-Rhythmus
        
        function animateLoop() {
            requestAnimationFrame(animateLoop);
            const dt = 0.016;

            // Zeitfortlauf berechnen
            gameTime += (2.0 / CYCLE_DURATION_SECONDS) * dt;
            if (gameTime > 2.0) gameTime = 0.0;

            const sunAngle = gameTime * Math.PI;
            
            const orbitRadius = 130;
            const px = camera.position.x;
            const py = camera.position.y;
            const pz = camera.position.z;

            // Sonne & Mond Bahnbewegung um den Spieler herum
            const sx = px + Math.cos(sunAngle) * orbitRadius;
            const sy = py + Math.sin(sunAngle) * orbitRadius;
            const sz = pz + 10;

            const mx = px - Math.cos(sunAngle) * orbitRadius;
            const my = py - Math.sin(sunAngle) * orbitRadius;
            const mz = pz - 10;

            sunMesh.position.set(sx, sy, sz);
            moonMesh.position.set(mx, my, mz);

            sun.position.set(sx, sy, sz);
            moon.position.set(mx, my, mz);

            const sunY = Math.sin(sunAngle);
            let activeSky, activeFog, lightIntensity, envStatus;

            // Himmel & Beleuchtung weich anpassen
            if (sunY > 0.2) {
                activeSky = baseSkyColor;
                activeFog = baseSkyColor;
                lightIntensity = 0.7 * sunY;
                envStatus = "TAG";
            } else if (sunY > -0.2) {
                const factor = (sunY + 0.2) / 0.4;
                activeSky = sunsetSkyColor.clone().lerp(baseSkyColor, factor);
                activeFog = sunsetSkyColor.clone().lerp(baseSkyColor, factor);
                lightIntensity = 0.35;
                envStatus = "DAEMMERUNG";
            } else {
                activeSky = nightSkyColor;
                activeFog = nightSkyColor;
                lightIntensity = 0.12;
                envStatus = "NACHT";
            }
            window.currentEnvStatus = envStatus;

            scene.background.lerp(activeSky, 0.03);
            scene.fog.color.lerp(activeFog, 0.03);
            ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, lightIntensity, 0.03);
            
            const t = I18N[currentLang];
            let envStatusText = "";
            if (envStatus === "TAG") {
                envStatusText = t.timeDay;
            } else if (envStatus === "DAEMMERUNG") {
                envStatusText = t.timeSunset;
            } else if (envStatus === "NACHT") {
                envStatusText = t.timeNight;
            }
            document.getElementById('time').innerText = `${envStatusText} (${formatGameTime()})`;

            // Physics, Dropped Items & Mining Logik
            if (controls.isLocked && document.activeElement !== chatInput) {
                
                // Unterwasser Check
                const feetBlock = getBlock(player.pos.x, player.pos.y, player.pos.z);
                const waistBlock = getBlock(player.pos.x, player.pos.y + 0.9, player.pos.z);
                player.inWater = (feetBlock === BLOCKS.WATER || waistBlock === BLOCKS.WATER);

                const headBlock = getBlock(camera.position.x, camera.position.y, camera.position.z);
                const isHeadInWater = (headBlock === BLOCKS.WATER);
                document.getElementById('underwater-tint').style.display = isHeadInWater ? 'block' : 'none';
                if (materials && materials[BLOCKS.LEAVES]) {
                    materials[BLOCKS.LEAVES].visible = !isHeadInWater;
                }

                const moveDir = new THREE.Vector3();
                if (keys['KeyW']) moveDir.z += 1;
                if (keys['KeyS']) moveDir.z -= 1;
                if (keys['KeyA']) moveDir.x -= 1;
                if (keys['KeyD']) moveDir.x += 1;
                moveDir.normalize();

                const camDir = new THREE.Vector3();
                camera.getWorldDirection(camDir); camDir.y = 0; camDir.normalize();
                const camSide = new THREE.Vector3().crossVectors(camera.up, camDir).normalize();
                
                // Crouching (Schleichen) with Shift, Sprinting with Ctrl
                const isCrouching = (keys['ShiftLeft'] || keys['ShiftRight']) && player.grounded;
                const isSprinting = (keys['ControlLeft'] || keys['ControlRight']) && !player.inWater && !isCrouching && moveDir.z > 0;
                
                let speed = player.inWater ? 3.0 : 7.2;
                if (isSprinting) {
                    speed *= 1.35; // Sprint 35% faster
                } else if (isCrouching) {
                    speed *= 0.55; // Crouch 45% slower
                }
                
                player.vel.x = (camDir.x * moveDir.z - camSide.x * moveDir.x) * speed;
                player.vel.z = (camDir.z * moveDir.z - camSide.z * moveDir.x) * speed;

                if (player.inWater) {
                    player.vel.y -= 5 * dt;
                    player.vel.y *= 0.9;
                    if (keys['Space']) player.vel.y = 3.5;
                } else {
                    player.vel.y -= 44 * dt; // Crisp high gravity for realistic jumping (was 38 - moon-like)
                    if (keys['Space'] && player.grounded && !isCrouching) {
                        player.vel.y = 11.8; // Snappy realistic bounce height (was 12)
                        player.grounded = false;
                        playSound('jump');
                    }
                }

                let dx = player.vel.x * dt;
                let dz = player.vel.z * dt;

                // Crouching Ledge-Guard: stop player from falling off ledges when sneaking
                if (isCrouching && player.grounded) {
                    // Check horizontal step for X
                    const testX = player.pos.clone();
                    testX.x += dx;
                    let hasBlockBelowX = false;
                    for (let ox = -0.3; ox <= 0.3; ox += 0.3) {
                        for (let oz = -0.3; oz <= 0.3; oz += 0.3) {
                            const bx = Math.floor(testX.x + ox);
                            const by = Math.floor(testX.y - 0.1);
                            const bz = Math.floor(testX.z + oz);
                            const bl = getBlock(bx, by, bz);
                            if (bl !== BLOCKS.AIR && bl !== BLOCKS.WATER) {
                                hasBlockBelowX = true;
                                break;
                            }
                        }
                        if (hasBlockBelowX) break;
                    }
                    if (!hasBlockBelowX) dx = 0;

                    // Check horizontal step for Z
                    const testZ = player.pos.clone();
                    testZ.z += dz;
                    let hasBlockBelowZ = false;
                    for (let ox = -0.3; ox <= 0.3; ox += 0.3) {
                        for (let oz = -0.3; oz <= 0.3; oz += 0.3) {
                            const bx = Math.floor(testZ.x + ox);
                            const by = Math.floor(testZ.y - 0.1);
                            const bz = Math.floor(testZ.z + oz);
                            const bl = getBlock(bx, by, bz);
                            if (bl !== BLOCKS.AIR && bl !== BLOCKS.WATER) {
                                hasBlockBelowZ = true;
                                break;
                            }
                        }
                        if (hasBlockBelowZ) break;
                    }
                    if (!hasBlockBelowZ) dz = 0;
                }

                const hNext = player.pos.clone();
                hNext.x += dx;
                hNext.z += dz;

                // Step-up collision handling (Only trigger when grounded to prevent 2-block climbing)
                if (checkCollision(hNext)) {
                    if (player.grounded) {
                        hNext.y += 1.02; // exact 1-block height step-up threshold
                        if (!checkCollision(hNext)) {
                            player.pos.copy(hNext);
                        } else {
                            player.vel.x = 0; player.vel.z = 0;
                        }
                    } else {
                        player.vel.x = 0; player.vel.z = 0;
                    }
                } else {
                    player.pos.x = hNext.x;
                    player.pos.z = hNext.z;
                }

                const vNext = player.pos.clone();
                vNext.y += player.vel.y * dt;
                if (checkCollision(vNext)) {
                    if (player.vel.y < 0) player.grounded = true;
                    player.vel.y = 0;
                } else {
                    player.pos.y = vNext.y;
                    if (player.vel.y !== 0) player.grounded = false;
                }

                // Smooth camera eye height when crouching vs standing
                const currentEyePos = isCrouching ? 1.18 : 1.62;
                const targetVisualY = player.pos.y + currentEyePos;
                player.visualY += (targetVisualY - player.visualY) * 0.25;
                camera.position.set(player.pos.x, player.visualY, player.pos.z);
                
                // Update 3D handGroup swing & bobbing animations
                if (isSwinging) {
                    swingProgress += dt * 7.5; // Fast responsive swing
                    if (swingProgress >= 1.0) {
                        isSwinging = false;
                        swingProgress = 0;
                    }
                }

                if (typeof handGroup !== 'undefined' && handGroup) {
                    let bobX = 0, bobY = 0, bobZ = 0;
                    const isWalking = (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']) && player.grounded && controls.isLocked;
                    if (isWalking) {
                        const t = Date.now() * 0.008;
                        bobX = Math.sin(t) * 0.015;
                        bobY = Math.abs(Math.cos(t * 2)) * 0.01;
                        bobZ = Math.sin(t) * 0.01;
                    }
                    
                    let swingRotX = 0, swingRotY = 0, swingRotZ = 0;
                    let swingPosX = 0, swingPosY = 0, swingPosZ = 0;
                    
                    if (isSwinging) {
                        const swingAngle = Math.sin(swingProgress * Math.PI);
                        swingRotY = swingAngle * 0.6;
                        swingRotX = -swingAngle * 0.7;
                        swingRotZ = -swingAngle * 0.4;
                        swingPosX = -swingAngle * 0.08;
                        swingPosY = swingAngle * 0.05;
                        swingPosZ = -swingAngle * 0.06;
                    }

                    handGroup.position.set(
                        0.35 + bobX + swingPosX,
                        -0.32 + bobY + swingPosY,
                        -0.42 + bobZ + swingPosZ
                    );
                    handGroup.rotation.set(
                        0.1 + swingRotX,
                        -0.2 + swingRotY,
                        0.05 + swingRotZ
                    );
                }
                
                // Mining Logik
                raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                const intersects = raycaster.intersectObjects(Array.from(activeChunks.values()), true);
                if (intersects.length > 0 && intersects[0].distance < 5.5) {
                    const hit = intersects[0];
                    const p = hit.point.clone().sub(hit.face.normal.clone().multiplyScalar(0.05));
                    const bx = Math.floor(p.x);
                    const by = Math.floor(p.y);
                    const bz = Math.floor(p.z);
                    const targetedType = getBlock(bx, by, bz);
                    
                    if (targetedType !== BLOCKS.WATER && targetedType !== BLOCKS.AIR) {
                        selectionBox.position.set(bx + 0.5, by + 0.5, bz + 0.5);
                        selectionBox.visible = true;
                        
                        if (isLeftMouseDown) {
                            const tPos = new THREE.Vector3(bx, by, bz);
                            if (!mineTarget || !mineTarget.equals(tPos)) {
                                mineTarget = tPos;
                                mineProgress = 0;
                            }
                            mineProgress += dt;
                            
                            const reqTime = breakTimes[targetedType] || 0.4;
                            const progressRatio = Math.min(mineProgress / reqTime, 1.0);
                            
                            // Visual outline pulsing
                            const pulse = 1.0 + Math.sin(Date.now() * 0.015) * 0.012;
                            selectionBox.scale.set(pulse, pulse, pulse);
                            
                            // Cracks progress feedback (0 to 5 stages)
                            const stageIndex = Math.floor(progressRatio * 5.9);
                            if (stageIndex >= 1 && crackingMesh) {
                                crackingMesh.material = crackingMaterials[Math.min(stageIndex - 1, 4)];
                                crackingMesh.position.set(bx + 0.5, by + 0.5, bz + 0.5);
                                crackingMesh.visible = true;
                            } else if (crackingMesh) {
                                crackingMesh.visible = false;
                            }
                            
                            // Particles during constant mining chipping
                            if (Math.random() < 0.22) {
                                spawnMiningParticles(bx, by, bz, targetedType, 2);
                            }
                            
                            if (mineProgress >= reqTime) {
                                // Final blowout particle blast
                                spawnMiningParticles(bx, by, bz, targetedType, 15);
                                if (crackingMesh) crackingMesh.visible = false;
                                
                                // SPEICHER-OPTIMIERUNG: Nutze playerSetBlock statt setBlock
                                playerSetBlock(bx, by, bz, BLOCKS.AIR);
                                playSound('break');

                                // Physikalisches Drop-Item erzeugen
                                let dropType = targetedType;
                                if (dropType === BLOCKS.GRASS) dropType = BLOCKS.DIRT; // Gras droppt Erde
                                spawnDroppedItem(dropType, bx, by, bz);

                                mineProgress = 0;
                                mineTarget = null;
                            }
                        } else {
                            mineProgress = 0;
                            mineTarget = null;
                            selectionBox.scale.set(1, 1, 1);
                            if (crackingMesh) crackingMesh.visible = false;
                        }
                    } else {
                        selectionBox.visible = false;
                        if (crackingMesh) crackingMesh.visible = false;
                        mineProgress = 0;
                        mineTarget = null;
                    }
                } else {
                    selectionBox.visible = false;
                    if (crackingMesh) crackingMesh.visible = false;
                    mineProgress = 0;
                    mineTarget = null;
                }
            }

            // Physische Dropped Items simulieren
            for (let i = droppedItems.length - 1; i >= 0; i--) {
                const item = droppedItems[i];
                if (item.collected) continue;

                // Rotation & Bobbing (Auf- und Abschweben wenn am Boden)
                item.mesh.rotation.y += 1.8 * dt;
                item.mesh.rotation.x = 0.4;

                const itemX = Math.floor(item.mesh.position.x);
                const itemYBelow = Math.floor(item.mesh.position.y - 0.125);
                const itemZ = Math.floor(item.mesh.position.z);

                const standingOnSolid = isSolid(itemX, itemYBelow, itemZ);

                if (standingOnSolid) {
                    const snapY = itemYBelow + 1.125;
                    const blockAtSnapHeight = getBlock(itemX, Math.floor(snapY), itemZ);
                    const isOccupied = blockAtSnapHeight !== BLOCKS.AIR && blockAtSnapHeight !== BLOCKS.WATER;
                    
                    if (isOccupied) {
                        // Prevent upward teleporting through ceilings, let it bounce softly instead
                        if (!item.grounded) {
                            item.vel.set(0, 0, 0);
                        }
                    } else {
                        if (!item.grounded) {
                            // Sanft einrasten auf dem Block
                            item.mesh.position.y = snapY;
                            item.vel.set(0, 0, 0);
                            item.grounded = true;
                        }
                        // Leichter Schwebekontur-Effekt im Stehen
                        const timeFactor = Date.now() * 0.005;
                        item.mesh.position.y = snapY + Math.sin(timeFactor) * 0.06;
                    }
                } else {
                    item.grounded = false;
                }

                if (!item.grounded) {
                    // Physik-Simulation in der Luft
                    item.vel.y -= 9.8 * dt; // Schwerkraft
                    item.mesh.position.x += item.vel.x * dt;
                    item.mesh.position.y += item.vel.y * dt;
                    item.mesh.position.z += item.vel.z * dt;
                    
                    // Reibungsverlust in der Luft
                    item.vel.x *= 0.92;
                    item.vel.z *= 0.92;
                }

                // Magnet-Effekt (Anziehung zum Spieler)
                const playerEyePos = player.pos.clone();
                const distToPlayer = item.mesh.position.distanceTo(playerEyePos);

                if (distToPlayer < 2.5 && (Date.now() - item.spawnTime > 600)) {
                    // Item fliegt aktiv in Richtung des Spielers
                    const flyDir = playerEyePos.clone().sub(item.mesh.position).normalize();
                    item.mesh.position.addScaledVector(flyDir, 12.0 * dt);
                    item.grounded = false; // Löst sich vom Boden
                    
                    if (distToPlayer < 0.8) {
                        // Aufgesammelt!
                        item.collected = true;
                        playSound('pickup');
                        scene.remove(item.mesh);
                        
                        addItemToInventoryDirectly(item.type, 1);
                        updateInventoryUI();
                        
                        droppedItems.splice(i, 1);
                    }
                }
            }

            // Mining-Partikel simulieren (Schwerkraft & Einbrennen)
            for (let i = miningParticles.length - 1; i >= 0; i--) {
                const p = miningParticles[i];
                p.life -= dt;
                if (p.life <= 0) {
                    scene.remove(p.mesh);
                    p.mesh.geometry.dispose();
                    miningParticles.splice(i, 1);
                } else {
                    p.vel.y -= p.gravity * dt;
                    p.mesh.position.addScaledVector(p.vel, dt);
                    const s = Math.max(0.01, p.life * 2.0);
                    p.mesh.scale.set(s, s, s);
                }
            }

            updateWorldChunks();
            document.getElementById('pos').innerText = `${Math.floor(player.pos.x)} / ${Math.floor(player.pos.y)} / ${Math.floor(player.pos.z)}`;
            renderer.render(scene, camera);
        }

        function generateMainMenuBackground() {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 16;
            tempCanvas.height = 16;
            const tempCtx = tempCanvas.getContext('2d');
            const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
            
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    let r, g, b;
                    let n = rand(0, 100);
                    if (n < 15) {
                        r = rand(65, 75); g = rand(45, 55); b = rand(30, 40);
                    } else if (n < 30) {
                        r = rand(120, 135); g = rand(85, 95); b = rand(55, 65);
                    } else {
                        r = rand(90, 105); g = rand(65, 75); b = rand(40, 50);
                    }
                    tempCtx.fillStyle = `rgb(${r},${g},${b})`;
                    tempCtx.fillRect(x, y, 1, 1);
                }
            }
            const dataUrl = tempCanvas.toDataURL();
            const overlay = document.getElementById('overlay');
            if (overlay) {
                overlay.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(${dataUrl})`;
                overlay.style.backgroundRepeat = 'repeat';
                overlay.style.backgroundSize = '128px 128px';
                overlay.style.imageRendering = 'pixelated';
            }
        }

        // Expose functions globally for HTML inline click handlers
        window.requestGameLock = requestGameLock;
        window.toggleLanguage = toggleLanguage;
        window.saveWorld = saveWorld;
        window.triggerResetModal = triggerResetModal;
        window.confirmReset = confirmReset;
        window.toggleRecipeBook = toggleRecipeBook;
        window.autoFillRecipe = autoFillRecipe;
        window.toggleInventory = toggleInventory;
        window.handleSlotClick = handleSlotClick;
        window.handleSlotRightClick = handleSlotRightClick;

        window.onload = () => {
            generateMainMenuBackground();
            updateLanguageUI();
            updateInventoryUI();
            updateWorldChunks();
            animateLoop();
        };

        window.onresize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
    