// Cubiculus - Master Engine Orchestrator
import * as THREE from 'three';
import { BLOCKS } from './blocks.js';
import {
    initRenderEngine, scene, camera, renderer, sunLight, moonLight,
    selectionBox, crackingMesh, crackingMaterials, updateWorldChunks, clearAllChunks,
    updateMiningParticles, processChunkQueue, updateFog
} from './renderEngine.js';
import {
    modifiedWorldData, getBlock, resetWorldState,
    loadWorldState, setSimplex, setWorldSeed, getWorldSeed, findSafeSpawn,
    serializeWaterBlocks, applyWaterBlocks,
    tickWaterFlow, resetWaterFlow
} from './worldGen.js';
import { player, updatePlayerPhysics, checkVoxelCollision } from './physics.js';
import {
    initInventory, setInventoryData, getHeldItem,
    toggleInventory, toggleRecipeBook, updateInventoryUI, autoFillRecipe,
    handleSlotClick, handleSlotRightClick, setSelectedHotbarSlot,
    selectedHotbarSlot, inventory
} from './inventory.js';
import {
    getActiveSlotId, setActiveSlotId, saveSlotWorld, loadSlotWorld, deleteSlotWorld
} from './saveManager.js';
import { GameSettings } from './settings.js';
import { initAudio, playSound, setAudioVolume } from './audio.js';
import { updateDroppedItems, clearAllDroppedItems } from './droppedItems.js';

// Sub-modules
import { updateDayNightCycle } from './dayNight.js';
import {
    getTargetVoxel, handleMining, stopMining, handleBlockPlacement, dropHeldItem
} from './interaction.js';
import {
    initInput, isGameActive, keys, yaw, pitch, mouseState, requestGameLock,
    applyLookDelta
} from './input.js';
import { initTouchControls, getTouchMoveAxis, isTouchDevice } from './touchControls.js';
import {
    updateHUD, updateUnderwaterVisuals, toggleF3Overlay
} from './ui/hud.js';
import {
    initModals, toggleSettingsModal, switchSettingsTab, toggleSaveSlotsModal,
    refreshSaveSlotsUI, selectAndLoadSlot, exportSlot, deleteSlot,
    handleWorldImportFile, triggerResetModal, confirmReset, toggleLanguage,
    generateRandomSeed, applySeedFromInput, toggleLiquidGlassSetting,
    togglePixelUISetting, setThemeSetting, setCustomColor, updateSetting,
    applyLiquidGlassMode, applyPixelUIMode, applyUITheme, syncSettingsDisplay,
    getCurrentLang
} from './ui/modals.js';
import {
    startRebinding, resetKeybindings, renderKeybindsTable
} from './ui/keybinds.js';
import { initChat } from './ui/chat.js';

// Touch controls. touchHandle stays null on desktop; touchActive is the cheap flag
// the movement branch checks every frame. Must be declared before initGame runs,
// which assigns to them further down.
let touchHandle = null;
let touchActive = false;

let lastFrameTime = performance.now();

// Camera zoom state (FOV): 75 (default) down to 18 (max zoom-in)
let currentFov = 75;
let targetFov = 75;
export function getZoomLevel() { return targetFov; }
export function setZoomLevel(fov) { targetFov = Math.max(18, Math.min(75, fov)); }

// Initialize Game Engine on DOM load
window.addEventListener('DOMContentLoaded', () => {
    initGame();
});

function initGame() {
    GameSettings.load();

    initAudio();
    setAudioVolume(GameSettings.volume);

    initRenderEngine(document.body);
    if (GameSettings.fogEnabled) updateFog(GameSettings.renderDistance);
    else if (scene) scene.fog = null;

    if (window.SimplexNoise) {
        setSimplex(new window.SimplexNoise());
    }

    initInventory();

    // Initialize sub-modules
    initModals({
        onSelectSlot: (slotId) => {
            loadCurrentSlot(slotId);
            requestGameLock();
        },
        onSaveWorld: () => saveCurrentGame(),
        onResetWorld: () => {
            const activeId = getActiveSlotId();
            deleteSlotWorld(activeId);
            loadCurrentSlot(activeId);
        },
        onSeedChanged: (newSeed) => applyNewWorldSeed(newSeed),
        onRenderDistanceChanged: (dist) => {
            if (GameSettings.fogEnabled) updateFog(dist);
            updateWorldChunks(player.pos, dist, true);
        }
    });

    initChat({
        onTeleport: (x, y, z) => {
            player.pos.set(x, y, z);
            player.visualY = y;
        }
    });

    initInput({
        onDrop: () => {
            const held = getHeldItem();
            dropHeldItem(held, player, camera, scene, () => {
                if (held.count <= 0) {
                    inventory[selectedHotbarSlot - 1] = { type: BLOCKS.AIR, count: 0 };
                }
                updateInventoryUI();
            });
        },
        onHotbarSelect: (num) => setSelectedHotbarSlot(num),
        onWheel: (deltaY) => {
            if (deltaY > 0) {
                let next = selectedHotbarSlot + 1;
                if (next > 9) next = 1;
                setSelectedHotbarSlot(next);
            } else if (deltaY < 0) {
                let prev = selectedHotbarSlot - 1;
                if (prev < 1) prev = 9;
                setSelectedHotbarSlot(prev);
            }
        },
        onRightClick: () => {
            const target = getTargetVoxel(camera, player, getBlock);
            const held = getHeldItem();
            handleBlockPlacement(target, player, held, () => {
                held.count--;
                if (held.count <= 0) {
                    inventory[selectedHotbarSlot - 1] = { type: BLOCKS.AIR, count: 0 };
                }
                updateInventoryUI();
            });
        },
        onEscape: () => handleGlobalEscape(),
        onZoom: (deltaY) => {
            // Shift+scroll: zoom the camera by narrowing/widening FOV (75 → 18)
            const newZoom = getZoomLevel() - Math.sign(deltaY) * 6;
            setZoomLevel(Math.max(18, Math.min(75, newZoom)));
        }
    });

    // Touch controls. Registered only on a device that reports touch, so a desktop
    // player gets no listeners and no UI at all.
    touchHandle = initTouchControls({
        // The canvas is the renderer's DOM element. game.js never had a binding
        // named `canvas`; referencing one threw a ReferenceError that aborted
        // initGame, so the render loop never started and the screen stayed black.
        canvas: renderer ? renderer.domElement : null,
        keys,
        mouseState,
        getYaw: () => yaw,
        // yaw/pitch are exported bindings from input.js and cannot be assigned
        // from here - rollup rejects that. applyLookDelta applies the relative
        // delta and does the clamping.
        setLook: (dYaw, dPitch) => applyLookDelta(dYaw, dPitch),
        stickBaseEl: document.getElementById('touch-stick-base'),
        stickKnobEl: document.getElementById('touch-stick-knob'),
        jumpBtn: document.getElementById('touch-jump'),
        sprintBtn: document.getElementById('touch-sprint'),
        inventoryBtn: document.getElementById('touch-inv'),
        onPlace: () => {
            const t = getTargetVoxel(camera, player, getBlock);
            const held = getHeldItem();
            handleBlockPlacement(t, player, held, () => {
                held.count--;
                if (held.count <= 0) {
                    inventory[selectedHotbarSlot - 1] = { type: BLOCKS.AIR, count: 0 };
                }
                updateInventoryUI();
            });
        },
        onOpenInventory: () => toggleInventory()
    });
    touchActive = touchHandle.enabled;

    // Load active slot save
    const activeSlot = getActiveSlotId();
    loadCurrentSlot(activeSlot);

    // Initial setup of UI styling & sounds
    setupUI();

    // Start game loop
    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function handleGlobalEscape() {
    const invOverlay = document.getElementById('inventory-overlay');
    const settingsModal = document.getElementById('settings-modal');
    const savesModal = document.getElementById('saves-modal');
    const confirmModal = document.getElementById('confirm-modal');

    if (confirmModal && !confirmModal.classList.contains('hidden')) {
        confirmModal.classList.add('hidden');
        return;
    }
    if (savesModal && !savesModal.classList.contains('hidden')) {
        savesModal.classList.add('hidden');
        return;
    }
    if (settingsModal && !settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
        return;
    }
    if (invOverlay && invOverlay.style.display === 'flex') {
        toggleInventory();
        return;
    }

    toggleSettingsModal();
}

function ensurePlayerUnstuck() {
    let attempts = 0;
    const halfW = player.w / 2;
    while (attempts < 60) {
        const boxMin = new THREE.Vector3(player.pos.x - halfW, player.pos.y, player.pos.z - halfW);
        const boxMax = new THREE.Vector3(player.pos.x + halfW, player.pos.y + player.h, player.pos.z + halfW);
        if (checkVoxelCollision(boxMin, boxMax)) {
            player.pos.y += 1.0;
            player.visualY = player.pos.y;
            attempts++;
        } else {
            break;
        }
    }
}

function loadCurrentSlot(slotId) {
    setActiveSlotId(slotId);
    const save = loadSlotWorld(slotId);
    clearAllChunks();
    clearAllDroppedItems(scene);

    if (save && save.modifiedWorldMap) {
        if (save.seed) {
            setWorldSeed(save.seed);
            GameSettings.worldSeed = save.seed;
        } else {
            setWorldSeed(GameSettings.worldSeed);
        }
        // Water comes back through applyWaterBlocks: the blocks are written directly
        // and the sources are replayed through the flow, so the spread is rebuilt
        // by the same code that created it.
        const waterSources = applyWaterBlocks(save.waterLevels);
        loadWorldState(save.modifiedWorldMap);
        if (waterSources.length) {
            for (const [wx, wy, wz] of waterSources) setWaterSource(wx, wy, wz);
        }
        if (save.inventory) setInventoryData(save.inventory);
        if (save.playerPos) {
            player.pos.set(save.playerPos.x, save.playerPos.y, save.playerPos.z);
            player.visualY = player.pos.y;
        } else {
            const spawn = findSafeSpawn(8, 8);
            player.pos.set(spawn.x, spawn.y, spawn.z);
            player.visualY = spawn.y;
        }
    } else {
        setWorldSeed(GameSettings.worldSeed);
        resetWorldState();
        resetWaterFlow();
        initInventory();
        const spawn = findSafeSpawn(8, 8);
        player.pos.set(spawn.x, spawn.y, spawn.z);
        player.visualY = spawn.y;
    }

    ensurePlayerUnstuck();
    updateInventoryUI();
    updateWorldChunks(player.pos, GameSettings.renderDistance, true);
    refreshSaveSlotsUI();
}

function saveCurrentGame() {
    const activeSlot = getActiveSlotId();
    saveSlotWorld(activeSlot, {
        modifiedWorldMap: modifiedWorldData,
        inventory: inventory,
        playerPos: player.pos,
        playerRot: { x: pitch, y: yaw },
        seed: getWorldSeed(),
        waterLevels: serializeWaterBlocks()
    });

    const indicator = document.getElementById('save-indicator');
    if (indicator) {
        indicator.innerText = getCurrentLang() === 'DE' ? "SPIELSTAND GESPEICHERT!" : "GAME SAVED!";
        indicator.style.display = 'block';
        setTimeout(() => { indicator.style.display = 'none'; }, 2000);
    }
    refreshSaveSlotsUI();
}

function applyNewWorldSeed(newSeed) {
    GameSettings.worldSeed = newSeed;
    setWorldSeed(newSeed);
    GameSettings.save();

    clearAllChunks();
    clearAllDroppedItems(scene);
    resetWorldState();
    resetWaterFlow();
    initInventory();

    const spawn = findSafeSpawn(8, 8);
    player.pos.set(spawn.x, spawn.y, spawn.z);
    player.visualY = spawn.y;
    ensurePlayerUnstuck();

    updateInventoryUI();
    updateWorldChunks(player.pos, GameSettings.renderDistance, true);

    const indicator = document.getElementById('save-indicator');
    if (indicator) {
        indicator.innerText = getCurrentLang() === 'DE' ? `WELT MIT SEED "${newSeed}" GENERIERT!` : `WORLD GENERATED WITH SEED "${newSeed}"!`;
        indicator.style.display = 'block';
        setTimeout(() => { indicator.style.display = 'none'; }, 2500);
    }
    syncSettingsDisplay();
}

function setupUI() {
    applyLiquidGlassMode(GameSettings.liquidGlass);
    applyPixelUIMode(GameSettings.pixelUI);
    applyUITheme(GameSettings.uiTheme);
    syncSettingsDisplay();
    renderKeybindsTable(getCurrentLang());

    // Hotbar click events
    const hotbarSlots = document.querySelectorAll('#hotbar .slot');
    hotbarSlots.forEach(s => {
        s.addEventListener('click', (e) => {
            e.stopPropagation();
            playSound('ui_click');
            const id = parseInt(s.getAttribute('data-id'), 10);
            setSelectedHotbarSlot(id);
        });
    });

    // UI Hover sounds on buttons
    const allButtons = document.querySelectorAll('.mc-btn, .mc-tab-btn, .mc-close-btn');
    allButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            playSound('ui_hover');
        });
    });
}

// Water flow runs on its own slow clock instead of every frame.
const WATER_FLOW_INTERVAL = 0.55;      // seconds between flow steps
const WATER_FLOW_CHUNKS_PER_TICK = 1; // chunks touched per step
let waterFlowAccum = 0;

function gameLoop(now) {
    requestAnimationFrame(gameLoop);

    const dt = Math.min(0.08, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (isGameActive) {
        // 1. Compute movement vector
        const moveDir = new THREE.Vector3();
        if (keys.forward) moveDir.z -= 1;
        if (keys.backward) moveDir.z += 1;
        if (keys.left) moveDir.x -= 1;
        if (keys.right) moveDir.x += 1;

        // The virtual stick writes the same axes the WASD keys do, so it feeds the
        // physics step directly instead of faking key events.
        if (touchActive) {
            const t = getTouchMoveAxis();
            if (t && (t.x !== 0 || t.y !== 0)) {
                moveDir.x += t.x;
                moveDir.z -= t.y;
            }
        }

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        }

        // 2. Physics & Voxel collision
        updatePlayerPhysics(dt, moveDir, keys.jump, keys.sprint, keys.crouch);

        // 3. Update Camera
        if (camera) {
            camera.position.set(player.pos.x, player.visualY + player.eye, player.pos.z);
            camera.rotation.order = 'YXZ';
            camera.rotation.y = yaw;
            camera.rotation.x = pitch;

            // Smooth FOV zoom interpolation (Shift+scroll)
            if (currentFov !== targetFov) {
                currentFov += (targetFov - currentFov) * Math.min(1, dt * 12);
                if (Math.abs(targetFov - currentFov) < 0.1) currentFov = targetFov;
                camera.fov = currentFov;
                camera.updateProjectionMatrix();
            }
        }

        // 4. Target voxel & mining
        const target = getTargetVoxel(camera, player, getBlock);
        if (target) {
            if (selectionBox) {
                selectionBox.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
                selectionBox.visible = true;
            }
            if (mouseState.isDown && mouseState.button === 0) {
                const held = getHeldItem();
                handleMining(dt, target, held, scene, crackingMesh, crackingMaterials);
            } else {
                stopMining(crackingMesh);
            }
        } else {
            if (selectionBox) selectionBox.visible = false;
            stopMining(crackingMesh);
        }

        // 5. World Chunks & Meshing
        updateWorldChunks(player.pos, GameSettings.renderDistance);
        processChunkQueue();

        // 5b. Water flow: a few chunks per second is plenty, running it every
        // frame would be pure overhead since water moves one block per tick.
        waterFlowAccum += dt;
        if (waterFlowAccum >= WATER_FLOW_INTERVAL && isGameActive) {
            waterFlowAccum = 0;
            let budget = WATER_FLOW_CHUNKS_PER_TICK;
            const pcx = Math.floor(player.pos.x / 16);
            const pcz = Math.floor(player.pos.z / 16);
            for (let ring = 0; ring <= 2 && budget > 0; ring++) {
                for (let dz = -ring; dz <= ring && budget > 0; dz++) {
                    for (let dx = -ring; dx <= ring && budget > 0; dx++) {
                        // only the outer edge of each ring is new work
                        if (ring > 0 && Math.abs(dx) !== ring && Math.abs(dz) !== ring) continue;
                        if (tickWaterFlow(pcx + dx, pcz + dz) > 0) budget--;
                    }
                }
            }
        }

        // 6. Dropped Physical Items & Magnetic Pickup
        updateDroppedItems(scene, dt, player.pos);

        // 7. Mining Particles & Underwater Tint
        updateMiningParticles(dt);
        updateUnderwaterVisuals(player, getBlock, GameSettings);

        // 8. Day / Night Sky Progression
        updateDayNightCycle(dt, scene, sunLight, moonLight, player.pos);

        // 9. Update HUD
        updateHUD(player, scene, yaw, getWorldSeed(), getCurrentLang());
    }

    // Render Scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Auto-save interval (every 60s)
setInterval(() => {
    if (isGameActive && modifiedWorldData.size > 0) {
        saveCurrentGame();
    }
}, 60000);

// Global Window Functions for HTML onclicks
window.requestGameLock = requestGameLock;
window.toggleInventory = toggleInventory;
window.toggleRecipeBook = toggleRecipeBook;
window.autoFillRecipe = autoFillRecipe;
window.handleSlotClick = handleSlotClick;
window.handleSlotRightClick = handleSlotRightClick;

window.toggleF3Overlay = toggleF3Overlay;
window.toggleSettingsModal = toggleSettingsModal;
window.switchSettingsTab = switchSettingsTab;
window.toggleSaveSlotsModal = toggleSaveSlotsModal;
window.selectAndLoadSlot = selectAndLoadSlot;
window.exportSlot = exportSlot;
window.deleteSlot = deleteSlot;
window.handleWorldImportFile = handleWorldImportFile;
window.saveWorld = () => saveCurrentGame();
window.triggerResetModal = triggerResetModal;
window.confirmReset = confirmReset;
window.toggleLanguage = toggleLanguage;

window.startRebinding = startRebinding;
window.resetKeybindings = resetKeybindings;
window.generateRandomSeed = generateRandomSeed;
window.applySeedFromInput = applySeedFromInput;
window.toggleLiquidGlassSetting = toggleLiquidGlassSetting;
window.togglePixelUISetting = togglePixelUISetting;
window.setThemeSetting = setThemeSetting;
window.setCustomColor = setCustomColor;
window.updateSetting = updateSetting;
window.toggleFogSetting = function() {
    playSound('ui_click');
    GameSettings.fogEnabled = !GameSettings.fogEnabled;
    const lbl = document.getElementById('cfg-fog-enabled-lbl');
    if (lbl) lbl.innerText = GameSettings.fogEnabled ? 'AN' : 'OFF';
    if (scene) {
        if (GameSettings.fogEnabled) updateFog(GameSettings.renderDistance);
        else scene.fog = null;
    }
    GameSettings.save();
};
window.testAudioSound = function() { playSound('ui_click'); };