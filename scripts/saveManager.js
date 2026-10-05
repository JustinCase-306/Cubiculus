// WebMinecraft Multi-Slot Save Management System
// Supports 3 discrete world save slots, metadata, export to JSON, and import from JSON.

const ACTIVE_SLOT_KEY = 'web_minecraft_active_slot';
const LEGACY_SAVE_KEY = 'web_minecraft_save_v2';
const SLOT_PREFIX = 'web_minecraft_slot_';

export const SAVE_SLOTS = ['slot_1', 'slot_2', 'slot_3'];

// Ensure active slot is set
export function getActiveSlotId() {
    return localStorage.getItem(ACTIVE_SLOT_KEY) || 'slot_1';
}

export function setActiveSlotId(slotId) {
    if (SAVE_SLOTS.includes(slotId)) {
        try { localStorage.setItem(ACTIVE_SLOT_KEY, slotId); }
        catch (e) { console.error("Could not persist active slot:", e); }
    }
}

// Get metadata for a specific save slot
export function getSlotInfo(slotId) {
    migrateLegacySaveIfNeeded();
    const raw = localStorage.getItem(SLOT_PREFIX + slotId);
    if (!raw) {
        const slotNumber = slotId.replace('slot_', '');
        return {
            id: slotId,
            name: `Welt ${slotNumber}`,
            empty: true,
            lastPlayed: '-',
            blockCount: 0
        };
    }

    try {
        const data = JSON.parse(raw);
        return {
            id: slotId,
            name: data.name || `Welt ${slotId.replace('slot_', '')}`,
            empty: false,
            lastPlayed: data.lastPlayed || 'Unbekannt',
            blockCount: data.world ? Object.keys(data.world).length : 0,
            seed: data.seed || 'cubiculus'
        };
    } catch (e) {
        return {
            id: slotId,
            name: `Welt ${slotId.replace('slot_', '')}`,
            empty: true,
            lastPlayed: '-',
            blockCount: 0,
            seed: 'cubiculus'
        };
    }
}

export function listAllSlots() {
    return SAVE_SLOTS.map(id => getSlotInfo(id));
}

// Save world data into a slot
export function saveSlotWorld(slotId, payload) {
    const { modifiedWorldMap, inventory, playerPos, playerRot, worldName, seed } = payload;
    const existing = getSlotInfo(slotId);
    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE') + ' ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    // Convert Map to plain object
    const worldObj = {};
    if (modifiedWorldMap && modifiedWorldMap instanceof Map) {
        for (const [k, v] of modifiedWorldMap.entries()) {
            worldObj[k] = v;
        }
    } else if (modifiedWorldMap && typeof modifiedWorldMap === 'object') {
        Object.assign(worldObj, modifiedWorldMap);
    }

    const saveData = {
        name: worldName || (existing.empty ? `Welt ${slotId.replace('slot_', '')}` : existing.name),
        lastPlayed: dateStr,
        savedAt: Date.now(),
        world: worldObj,
        inventory: inventory || null,
        playerPos: playerPos ? { x: playerPos.x, y: playerPos.y, z: playerPos.z } : null,
        playerRot: playerRot ? { x: playerRot.x, y: playerRot.y, z: playerRot.z ?? 0 } : null,
        seed: seed || 'cubiculus'
    };

    try {
        localStorage.setItem(SLOT_PREFIX + slotId, JSON.stringify(saveData));
    } catch (e) {
        console.error("Save failed (storage full/unavailable):", e);
        return null;
    }
    setActiveSlotId(slotId);
    return saveData;
}

// Load world data from a slot
export function loadSlotWorld(slotId) {
    migrateLegacySaveIfNeeded();
    const raw = localStorage.getItem(SLOT_PREFIX + slotId);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        const modifiedMap = new Map();
        if (parsed.world && typeof parsed.world === 'object') {
            for (const [k, v] of Object.entries(parsed.world)) {
                modifiedMap.set(k, v);
            }
        }
        return {
            name: parsed.name,
            lastPlayed: parsed.lastPlayed,
            modifiedWorldMap: modifiedMap,
            inventory: parsed.inventory || null,
            playerPos: parsed.playerPos || null,
            playerRot: parsed.playerRot || null,
            seed: parsed.seed || 'cubiculus'
        };
    } catch (e) {
        console.error("Error parsing save slot:", e);
        return null;
    }
}

// Clear a slot completely
export function deleteSlotWorld(slotId) {
    localStorage.removeItem(SLOT_PREFIX + slotId);
}

// Export a slot as a downloadable JSON file
export function exportSlotJSON(slotId) {
    const raw = localStorage.getItem(SLOT_PREFIX + slotId);
    if (!raw) return false;

    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webminecraft_${slotId}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
}

// Import a world JSON into a target slot
export function importSlotJSON(slotId, jsonText) {
    try {
        const parsed = JSON.parse(jsonText);
        if (!parsed.world) throw new Error("Invalid save file format (missing 'world' property)");
        
        parsed.lastPlayed = new Date().toLocaleDateString('de-DE') + ' (Importiert)';
        localStorage.setItem(SLOT_PREFIX + slotId, JSON.stringify(parsed));
        return true;
    } catch (e) {
        console.error("Failed to import world:", e);
        return false;
    }
}

// Migrate old single save file into slot_1 automatically
function migrateLegacySaveIfNeeded() {
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
    const slot1 = localStorage.getItem(SLOT_PREFIX + 'slot_1');
    // Remove stale legacy blob even when slot_1 already exists (Bug 20)
    if (legacy && slot1) {
        try { localStorage.removeItem(LEGACY_SAVE_KEY); }
        catch (e) {}
    }
    if (legacy && !slot1) {
        try {
            const parsed = JSON.parse(legacy);
            parsed.name = 'Hauptwelt (Migriert)';
            parsed.lastPlayed = new Date().toLocaleDateString('de-DE');
            localStorage.setItem(SLOT_PREFIX + 'slot_1', JSON.stringify(parsed));
            localStorage.removeItem(LEGACY_SAVE_KEY);
        } catch (e) {
            console.warn("Legacy save migration skipped:", e);
        }
    }
}
