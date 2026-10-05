// WebMinecraft Inventory & 2x2 Crafting Grid Logic
import { BLOCKS, isPlaceableBlock, blockNames } from './blocks.js';
import { draw2DIcon } from './textures.js';
import { playSound } from './audio.js';

export let inventory = [];
export let activeItemOnCursor = { type: BLOCKS.AIR, count: 0 };
export let selectedHotbarSlot = 1; // 1 to 9

// Initialize 45-slot inventory with default survival starter items
export function initInventory() {
    inventory = [];
    for (let i = 0; i < 45; i++) {
        inventory.push({ type: BLOCKS.AIR, count: 0 });
    }

    // Default starter kit in hotbar (slots 0 to 8)
    inventory[0] = { type: BLOCKS.WOOD_PICKAXE, count: 1 };
    inventory[1] = { type: BLOCKS.WOOD_SWORD, count: 1 };
    inventory[2] = { type: BLOCKS.DIRT, count: 32 };
    inventory[3] = { type: BLOCKS.WOOD, count: 16 };
    inventory[4] = { type: BLOCKS.PLANKS, count: 24 };
    inventory[5] = { type: BLOCKS.COBBLESTONE || BLOCKS.STONE, count: 16 };
    inventory[6] = { type: BLOCKS.GLASS, count: 8 };
    inventory[7] = { type: BLOCKS.SAND, count: 12 };
    inventory[8] = { type: BLOCKS.BRICK, count: 8 };

    // Build the recipe book cards once; they are generated from RECIPE_BOOK so
    // they always match the crafting patterns.
    renderRecipeBook();
}

export function setInventoryData(data) {
    if (Array.isArray(data) && data.length >= 45) {
        inventory = data;
    } else {
        initInventory();
    }
    updateInventoryUI();
}

export function setSelectedHotbarSlot(num) {
    if (num >= 1 && num <= 9) {
        selectedHotbarSlot = num;
        updateHotbarSelectionUI();
    }
}

export function getHeldItem() {
    const item = inventory[selectedHotbarSlot - 1];
    return item && item.count > 0 ? item : { type: BLOCKS.AIR, count: 0 };
}

// Returns the number of items actually inserted (0 if the inventory was full).
// Callers that retry per frame must use this to avoid inserting the same stack
// repeatedly and duplicating items.
export function addItemToInventory(type, count = 1) {
    let remaining = count;

    // 1. Stack with existing matching items
    for (let i = 0; i < 36; i++) {
        if (inventory[i].type === type && inventory[i].count < 64) {
            const add = Math.min(remaining, 64 - inventory[i].count);
            inventory[i].count += add;
            remaining -= add;
            if (remaining <= 0) break;
        }
    }

    // 2. Put into empty slot
    if (remaining > 0) {
        for (let i = 0; i < 36; i++) {
            if (inventory[i].type === BLOCKS.AIR || inventory[i].count === 0) {
                const add = Math.min(remaining, 64);
                inventory[i] = { type: type, count: add };
                remaining -= add;
                if (remaining <= 0) break;
            }
        }
    }

    updateInventoryUI();
    return count - Math.max(remaining, 0);
}

// Left click slot handler
export function handleSlotClick(event, index) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Output slot (index 44)
    if (index === 44) {
        const outItem = inventory[44];
        if (outItem.type === BLOCKS.AIR || outItem.count <= 0) return;

        if (activeItemOnCursor.type === BLOCKS.AIR) {
            activeItemOnCursor = { ...outItem };
            inventory[44] = { type: BLOCKS.AIR, count: 0 };
            reduceCraftingIngredients();
            playSound('craft');
        } else if (activeItemOnCursor.type === outItem.type && activeItemOnCursor.count + outItem.count <= 64) {
            activeItemOnCursor.count += outItem.count;
            inventory[44] = { type: BLOCKS.AIR, count: 0 };
            reduceCraftingIngredients();
            playSound('craft');
        }

        checkCraftingRecipes();
        updateInventoryUI();
        return;
    }

    const slotItem = inventory[index];

    if (activeItemOnCursor.type === BLOCKS.AIR) {
        // Cursor is empty -> Pick up entire stack
        if (slotItem.type !== BLOCKS.AIR && slotItem.count > 0) {
            activeItemOnCursor = { ...slotItem };
            inventory[index] = { type: BLOCKS.AIR, count: 0 };
            playSound('pickup');
        }
    } else {
        // Cursor has item
        if (slotItem.type === BLOCKS.AIR || slotItem.count === 0) {
            // Drop entire stack into empty slot
            inventory[index] = { ...activeItemOnCursor };
            activeItemOnCursor = { type: BLOCKS.AIR, count: 0 };
            playSound('place');
        } else if (slotItem.type === activeItemOnCursor.type) {
            // Merge matching stacks
            if (slotItem.count + activeItemOnCursor.count <= 64) {
                inventory[index].count += activeItemOnCursor.count;
                activeItemOnCursor = { type: BLOCKS.AIR, count: 0 };
                playSound('place');
            } else {
                const diff = 64 - slotItem.count;
                inventory[index].count = 64;
                activeItemOnCursor.count -= diff;
                playSound('place');
            }
        } else {
            // Swap items
            const temp = { ...slotItem };
            inventory[index] = { ...activeItemOnCursor };
            activeItemOnCursor = temp;
            playSound('pickup');
        }
    }

    if (index >= 40 && index <= 43) {
        checkCraftingRecipes();
    }

    updateInventoryUI();
}

// Right click slot handler (Halve stack or place single item)
export function handleSlotRightClick(event, index) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (index === 44) return; // Output slot does not support right click

    const slotItem = inventory[index];

    if (activeItemOnCursor.type === BLOCKS.AIR) {
        // Pick up half the stack
        if (slotItem.type !== BLOCKS.AIR && slotItem.count > 0) {
            const takeAmt = Math.ceil(slotItem.count / 2);
            const keepAmt = slotItem.count - takeAmt;

            activeItemOnCursor = { type: slotItem.type, count: takeAmt };
            if (keepAmt > 0) {
                inventory[index].count = keepAmt;
            } else {
                inventory[index] = { type: BLOCKS.AIR, count: 0 };
            }
            playSound('pickup');
        }
    } else {
        // Drop exactly 1 item
        if (slotItem.type === BLOCKS.AIR || slotItem.count === 0) {
            inventory[index] = { type: activeItemOnCursor.type, count: 1 };
            activeItemOnCursor.count--;
            if (activeItemOnCursor.count <= 0) {
                activeItemOnCursor = { type: BLOCKS.AIR, count: 0 };
            }
            playSound('place');
        } else if (slotItem.type === activeItemOnCursor.type && slotItem.count < 64) {
            inventory[index].count++;
            activeItemOnCursor.count--;
            if (activeItemOnCursor.count <= 0) {
                activeItemOnCursor = { type: BLOCKS.AIR, count: 0 };
            }
            playSound('place');
        }
    }

    if (index >= 40 && index <= 43) {
        checkCraftingRecipes();
    }

    updateInventoryUI();
}

function reduceCraftingIngredients() {
    for (let i = 40; i <= 43; i++) {
        if (inventory[i].type !== BLOCKS.AIR && inventory[i].count > 0) {
            inventory[i].count--;
            if (inventory[i].count === 0) {
                inventory[i] = { type: BLOCKS.AIR, count: 0 };
            }
        }
    }
}

// 2x2 Crafting Recipes Checker
export function checkCraftingRecipes() {
    const in0 = inventory[40].type;
    const in1 = inventory[41].type;
    const in2 = inventory[42].type;
    const in3 = inventory[43].type;

    let out = { type: BLOCKS.AIR, count: 0 };

    // 1 Wood Log -> 4 Planks
    if ((in0 === BLOCKS.WOOD || in0 === BLOCKS.JUNGLE_WOOD || in0 === BLOCKS.BIRCH_WOOD) && in1 === BLOCKS.AIR && in2 === BLOCKS.AIR && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.PLANKS, count: 4 };
    }
    // 4 Sand -> 1 Sandstone (Minecraft-accurate ratio)
    else if (in0 === BLOCKS.SAND && in1 === BLOCKS.SAND && in2 === BLOCKS.SAND && in3 === BLOCKS.SAND) {
        out = { type: BLOCKS.SANDSTONE, count: 1 };
    }
    // Cobblestone (or Stone) + Leaves -> Mossy Cobblestone.
    // The || has to sit outside the comparison: in0 === (A || B) evaluates the || first
    // and collapses to A, so stone was silently rejected.
    else if ((in0 === BLOCKS.COBBLESTONE || in0 === BLOCKS.STONE) && in1 === BLOCKS.LEAVES && in2 === BLOCKS.AIR && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.MOSSY_COBBLESTONE, count: 1 };
    }
    // 2 Planks vertical -> 4 Sticks
    else if (in0 === BLOCKS.PLANKS && in2 === BLOCKS.PLANKS && in1 === BLOCKS.AIR && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.STICK, count: 4 };
    }
    // 1 Sand -> 1 Glass
    else if (in0 === BLOCKS.SAND && in1 === BLOCKS.AIR && in2 === BLOCKS.AIR && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.GLASS, count: 1 };
    }
    // 1 Iron Ore -> 1 Iron Ingot
    else if (in0 === BLOCKS.IRON_ORE && in1 === BLOCKS.AIR && in2 === BLOCKS.AIR && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.IRON_INGOT, count: 1 };
    }
    // 1 Gold Ore -> 1 Gold Ingot
    else if (in0 === BLOCKS.GOLD_ORE && in1 === BLOCKS.AIR && in2 === BLOCKS.AIR && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.GOLD_INGOT, count: 1 };
    }
    // 2 Sand + 2 Dirt -> 4 Bricks (clay substitute, no collision with sandstone)
    else if (in0 === BLOCKS.SAND && in1 === BLOCKS.SAND && in2 === BLOCKS.DIRT && in3 === BLOCKS.DIRT) {
        out = { type: BLOCKS.BRICK, count: 4 };
    }
    // Pickaxes (top row 2 material, bottom row 1 stick)
    else if (in0 === BLOCKS.PLANKS && in1 === BLOCKS.PLANKS && in2 === BLOCKS.STICK && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.WOOD_PICKAXE, count: 1 };
    }
    else if (in0 === BLOCKS.STONE && in1 === BLOCKS.STONE && in2 === BLOCKS.STICK && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.STONE_PICKAXE, count: 1 };
    }
    else if (in0 === BLOCKS.IRON_INGOT && in1 === BLOCKS.IRON_INGOT && in2 === BLOCKS.STICK && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.IRON_PICKAXE, count: 1 };
    }
    else if (in0 === BLOCKS.GOLD_INGOT && in1 === BLOCKS.GOLD_INGOT && in2 === BLOCKS.STICK && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.GOLD_PICKAXE, count: 1 };
    }
    else if (in0 === BLOCKS.DIAMOND && in1 === BLOCKS.DIAMOND && in2 === BLOCKS.STICK && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.DIAMOND_PICKAXE, count: 1 };
    }
    // Swords (top slot material, bottom slot stick)
    else if (in0 === BLOCKS.PLANKS && in2 === BLOCKS.STICK && in1 === BLOCKS.AIR && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.WOOD_SWORD, count: 1 };
    }
    else if (in0 === BLOCKS.STONE && in2 === BLOCKS.STICK && in1 === BLOCKS.AIR && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.STONE_SWORD, count: 1 };
    }
    else if (in0 === BLOCKS.IRON_INGOT && in2 === BLOCKS.STICK && in1 === BLOCKS.AIR && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.IRON_SWORD, count: 1 };
    }
    else if (in0 === BLOCKS.GOLD_INGOT && in2 === BLOCKS.STICK && in1 === BLOCKS.AIR && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.GOLD_SWORD, count: 1 };
    }
    else if (in0 === BLOCKS.DIAMOND && in2 === BLOCKS.STICK && in1 === BLOCKS.AIR && in3 === BLOCKS.AIR) {
        out = { type: BLOCKS.DIAMOND_SWORD, count: 1 };
    }

    inventory[44] = out;
}

// Auto fill recipe template
export function autoFillRecipe(recipeKey) {
    // Clear current crafting grid into backpack if possible
    for (let i = 40; i <= 43; i++) {
        if (inventory[i].type !== BLOCKS.AIR && inventory[i].count > 0) {
            addItemToInventory(inventory[i].type, inventory[i].count);
            inventory[i] = { type: BLOCKS.AIR, count: 0 };
        }
    }

    // Built from RECIPE_BOOK so the grid can never disagree with the cards. The
    // craft slot comes from the recipe itself, not from the input order.
    const recipePatterns = {};
    for (const r of RECIPE_BOOK) {
        recipePatterns[r.key] = r.in.map(([slot, type]) => ({ slot, type, count: 1 }));
    }

    const pattern = recipePatterns[recipeKey];
    if (!pattern) return;

    for (const req of pattern) {
        inventory[req.slot] = { type: req.type, count: req.count };
    }

    checkCraftingRecipes();
    updateInventoryUI();
    playSound('place');
}

// UI Synchronizers
export function updateInventoryUI() {
    // 1. Hotbar HUD (slots 0 to 8)
    for (let i = 0; i < 9; i++) {
        const item = inventory[i];
        const canvas = document.getElementById(`icon-${i}`);
        const qtyEl = document.getElementById(`qty-${i}`);

        if (canvas) {
            if (item && item.type !== BLOCKS.AIR && item.count > 0) {
                draw2DIcon(canvas, item.type);
                if (qtyEl) qtyEl.innerText = item.count > 1 ? item.count : '';
            } else {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (qtyEl) qtyEl.innerText = '';
            }
        }
    }

    // 2. Hotbar Selection
    updateHotbarSelectionUI();

    // 3. Inventory Overlay (Hotbar 0..8, Backpack 9..35, Crafting 40..44)
    renderInventorySlots();

    // 4. Cursor Item
    const cursorEl = document.getElementById('cursor-item');
    const cursorCanvas = document.getElementById('cursor-canvas');
    const cursorQty = document.getElementById('cursor-qty');

    if (cursorEl && cursorCanvas && cursorQty) {
        if (activeItemOnCursor.type !== BLOCKS.AIR && activeItemOnCursor.count > 0) {
            cursorEl.style.display = 'block';
            draw2DIcon(cursorCanvas, activeItemOnCursor.type);
            cursorQty.innerText = activeItemOnCursor.count > 1 ? activeItemOnCursor.count : '';
        } else {
            cursorEl.style.display = 'none';
        }
    }
}

let hotbarTooltipTimeout = null;
function updateHotbarSelectionUI() {
    const slots = document.querySelectorAll('#hotbar .slot');
    slots.forEach((s, idx) => {
        if (idx === selectedHotbarSlot - 1) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });

    const item = inventory[selectedHotbarSlot - 1];
    const tooltip = document.getElementById('hotbar-item-name');
    if (tooltip) {
        if (item && item.type !== BLOCKS.AIR && item.count > 0) {
            const name = blockNames[item.type] || 'Gegenstand';
            tooltip.innerText = name;
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0px)';
            if (hotbarTooltipTimeout) clearTimeout(hotbarTooltipTimeout);
            hotbarTooltipTimeout = setTimeout(() => {
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translateY(4px)';
            }, 1800);
        } else {
            tooltip.style.opacity = '0';
        }
    }
}

let mcTooltipEl = null;
export function showItemTooltip(e, slotIndex) {
    const item = inventory[slotIndex];
    if (!item || item.type === BLOCKS.AIR || item.count <= 0) {
        hideItemTooltip();
        return;
    }
    if (!mcTooltipEl) {
        mcTooltipEl = document.createElement('div');
        mcTooltipEl.className = 'mc-tooltip';
        document.body.appendChild(mcTooltipEl);
    }
    const name = blockNames[item.type] || 'Item';
    mcTooltipEl.innerText = item.count > 1 ? `${name} (x${item.count})` : name;
    mcTooltipEl.style.display = 'block';
    mcTooltipEl.style.left = `${e.clientX + 12}px`;
    mcTooltipEl.style.top = `${e.clientY - 20}px`;
}

export function hideItemTooltip() {
    if (mcTooltipEl) mcTooltipEl.style.display = 'none';
}

function renderInventorySlots() {
    // Backpack grid
    const bpContainer = document.getElementById('inv-backpack-grid');
    if (bpContainer && bpContainer.children.length === 0) {
        // Initialize 27 backpack slots (9 to 35)
        for (let i = 9; i <= 35; i++) {
            const slotEl = document.createElement('div');
            slotEl.className = 'mc-slot';
            slotEl.id = `inv-slot-${i}`;
            slotEl.onclick = (e) => handleSlotClick(e, i);
            slotEl.oncontextmenu = (e) => { handleSlotRightClick(e, i); return false; };
            slotEl.onmouseenter = (e) => showItemTooltip(e, i);
            slotEl.onmouseleave = () => hideItemTooltip();

            const c = document.createElement('canvas');
            c.width = 16; c.height = 16;
            slotEl.appendChild(c);

            const q = document.createElement('div');
            q.className = 'qty';
            slotEl.appendChild(q);

            bpContainer.appendChild(slotEl);
        }
    }

    // Mirrored Hotbar grid in Inventory overlay
    const hbContainer = document.getElementById('inv-hotbar-grid');
    if (hbContainer && hbContainer.children.length === 0) {
        for (let i = 0; i < 9; i++) {
            const slotEl = document.createElement('div');
            slotEl.className = 'mc-slot';
            slotEl.id = `inv-slot-${i}`;
            slotEl.onclick = (e) => handleSlotClick(e, i);
            slotEl.oncontextmenu = (e) => { handleSlotRightClick(e, i); return false; };
            slotEl.onmouseenter = (e) => showItemTooltip(e, i);
            slotEl.onmouseleave = () => hideItemTooltip();

            const c = document.createElement('canvas');
            c.width = 16; c.height = 16;
            slotEl.appendChild(c);

            const q = document.createElement('div');
            q.className = 'qty';
            slotEl.appendChild(q);

            hbContainer.appendChild(slotEl);
        }
    }

    // Populate all slot canvases (0 to 35)
    for (let i = 0; i <= 35; i++) {
        const slotEl = document.getElementById(`inv-slot-${i}`);
        if (!slotEl) continue;
        const c = slotEl.querySelector('canvas');
        const q = slotEl.querySelector('.qty');
        const item = inventory[i];

        if (item && item.type !== BLOCKS.AIR && item.count > 0) {
            draw2DIcon(c, item.type);
            if (q) q.innerText = item.count > 1 ? item.count : '';
        } else {
            if (c) {
                const ctx = c.getContext('2d');
                ctx.clearRect(0, 0, c.width, c.height);
            }
            if (q) q.innerText = '';
        }
    }

    // Crafting inputs (40 to 43)
    for (let i = 40; i <= 43; i++) {
        const slotEl = document.getElementById(`craft-in-${i - 40}`);
        if (!slotEl) continue;
        let c = slotEl.querySelector('canvas');
        let q = slotEl.querySelector('.qty');
        if (!c) {
            c = document.createElement('canvas');
            c.width = 16; c.height = 16;
            slotEl.appendChild(c);
            q = document.createElement('div');
            q.className = 'qty';
            slotEl.appendChild(q);
        }
        const item = inventory[i];
        if (item && item.type !== BLOCKS.AIR && item.count > 0) {
            draw2DIcon(c, item.type);
            if (q) q.innerText = item.count > 1 ? item.count : '';
        } else {
            const ctx = c.getContext('2d');
            ctx.clearRect(0, 0, c.width, c.height);
            if (q) q.innerText = '';
        }
    }

    // Crafting output (44)
    const outSlot = document.getElementById('craft-out');
    if (outSlot) {
        let c = outSlot.querySelector('canvas');
        let q = outSlot.querySelector('.qty');
        if (!c) {
            c = document.createElement('canvas');
            c.width = 16; c.height = 16;
            outSlot.appendChild(c);
            q = document.createElement('div');
            q.className = 'qty';
            outSlot.appendChild(q);
        }
        const item = inventory[44];
        if (item && item.type !== BLOCKS.AIR && item.count > 0) {
            draw2DIcon(c, item.type);
            if (q) q.innerText = item.count > 1 ? item.count : '';
        } else {
            const ctx = c.getContext('2d');
            ctx.clearRect(0, 0, c.width, c.height);
            if (q) q.innerText = '';
        }
    }
}

export function toggleInventory() {
    const invOverlay = document.getElementById('inventory-overlay');
    if (!invOverlay) return;

    if (invOverlay.style.display === 'flex') {
        invOverlay.style.display = 'none';
        if (document.exitPointerLock) {
            // Player closed inventory
        }
    } else {
        invOverlay.style.display = 'flex';
        updateInventoryUI();
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }
}

export function toggleRecipeBook() {
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


// Recipe book definition. One entry per recipe, used both to render the cards
// and to fill the grid, so a card can no longer point at a pattern that does
// not exist (the old hand-written HTML had two such dead cards).
// Recipe book definition: the single source of truth for both the cards and the
// grid fill. `in` lists [craftSlot, blockType] pairs - the slot is explicit
// because the grid is 2x2 (slots 40..43) and the position decides the recipe:
//   40 41      pickaxe / bar   (material material)
//   42 43
//   40 42      sword           (material  .  )
//   41 43                     ( .        stick)
const RECIPE_BOOK = [
    { key: 'planks',      label: 'BRETTER (x4)',      out: BLOCKS.PLANKS,         in: [[40, BLOCKS.WOOD]] },
    { key: 'stick',       label: 'STOCK (x4)',        out: BLOCKS.STICK,          in: [[40, BLOCKS.PLANKS], [42, BLOCKS.PLANKS]] },
    { key: 'glass',       label: 'GLAS (x1)',         out: BLOCKS.GLASS,          in: [[40, BLOCKS.SAND]] },
    { key: 'ironingot',   label: 'EISEN (x1)',        out: BLOCKS.IRON_INGOT,     in: [[40, BLOCKS.IRON_ORE]] },
    { key: 'goldingot',   label: 'GOLD (x1)',         out: BLOCKS.GOLD_INGOT,     in: [[40, BLOCKS.GOLD_ORE]] },
    { key: 'brick',       label: 'ZIEGEL (x4)',       out: BLOCKS.BRICK,          in: [[40, BLOCKS.SAND], [41, BLOCKS.SAND], [42, BLOCKS.DIRT], [43, BLOCKS.DIRT]] },
    { key: 'sandstone',   label: 'SANDSTEIN (x1)',    out: BLOCKS.SANDSTONE,      in: [[40, BLOCKS.SAND], [41, BLOCKS.SAND], [42, BLOCKS.SAND], [43, BLOCKS.SAND]] },
    { key: 'mossy',       label: 'BEMOOSTER (x1)',    out: BLOCKS.MOSSY_COBBLESTONE, in: [[40, BLOCKS.COBBLESTONE], [41, BLOCKS.LEAVES]] },
    { key: 'woodpick',    label: 'HOLZSPITZHACKE',    out: BLOCKS.WOOD_PICKAXE,   in: [[40, BLOCKS.PLANKS], [41, BLOCKS.PLANKS], [42, BLOCKS.STICK]] },
    { key: 'stonepick',   label: 'STEINSPITZHACKE',   out: BLOCKS.STONE_PICKAXE,  in: [[40, BLOCKS.STONE], [41, BLOCKS.STONE], [42, BLOCKS.STICK]] },
    { key: 'ironpick',    label: 'EISENSPITZHACKE',   out: BLOCKS.IRON_PICKAXE,   in: [[40, BLOCKS.IRON_INGOT], [41, BLOCKS.IRON_INGOT], [42, BLOCKS.STICK]] },
    { key: 'goldpick',    label: 'GOLDSPITZHACKE',    out: BLOCKS.GOLD_PICKAXE,   in: [[40, BLOCKS.GOLD_INGOT], [41, BLOCKS.GOLD_INGOT], [42, BLOCKS.STICK]] },
    { key: 'diamondpick', label: 'DIAMANTSPITZHACKE', out: BLOCKS.DIAMOND_PICKAXE, in: [[40, BLOCKS.DIAMOND], [41, BLOCKS.DIAMOND], [42, BLOCKS.STICK]] },
    { key: 'woodsword',   label: 'HOLZSCHWERT',       out: BLOCKS.WOOD_SWORD,     in: [[40, BLOCKS.PLANKS], [42, BLOCKS.STICK]] },
    { key: 'stonesword',  label: 'STEINSCHWERT',      out: BLOCKS.STONE_SWORD,    in: [[40, BLOCKS.STONE], [42, BLOCKS.STICK]] },
    { key: 'ironsword',   label: 'EISENSCHWERT',      out: BLOCKS.IRON_SWORD,     in: [[40, BLOCKS.IRON_INGOT], [42, BLOCKS.STICK]] },
    { key: 'goldsword',   label: 'GOLDSCHWERT',       out: BLOCKS.GOLD_SWORD,     in: [[40, BLOCKS.GOLD_INGOT], [42, BLOCKS.STICK]] },
    { key: 'diamondsword', label: 'DIAMANTSCHWERT',   out: BLOCKS.DIAMOND_SWORD,  in: [[40, BLOCKS.DIAMOND], [42, BLOCKS.STICK]] }
];

// Builds the recipe book DOM and draws every icon. Called once at boot.
export function renderRecipeBook() {
    const list = document.getElementById('recipe-book-list');
    if (!list) return;
    list.innerHTML = '';

    // Collect while building, draw once at the end: the icons need the canvas to
    // be in the document already.
    const inputCanvases = [];
    const outputCanvases = [];

    for (const r of RECIPE_BOOK) {
        const card = document.createElement('div');
        card.className = 'mc-recipe-card';
        card.setAttribute('onclick', 'autoFillRecipe(\'' + r.key + '\')');

        const title = document.createElement('span');
        title.className = 'text-[8px] font-bold accent-label';
        title.textContent = r.label;

        // The inputs are laid out as the real 2x2 crafting grid (slots 40..43),
        // so every card is the same height and the position shows where the item
        // goes. Unused cells stay empty.
        const grid = document.createElement('div');
        grid.className = 'rec-grid';

        for (let slot = 40; slot <= 43; slot++) {
            const entry = r.in.find(([s]) => s === slot);
            const cell = document.createElement('div');
            cell.className = 'rec-cell';
            if (entry) {
                const cv = document.createElement('canvas');
                cv.id = 'rec-in-' + r.key + '-' + slot;
                cv.width = 16; cv.height = 16;
                cell.appendChild(cv);
                inputCanvases.push([cv, entry[1]]);
            }
            grid.appendChild(cell);
        }

        const arrow = document.createElement('span');
        arrow.className = 'text-[10px] font-bold accent-text';
        arrow.textContent = '>';

        const outSlot = document.createElement('div');
        outSlot.className = 'mc-slot';
        outSlot.style.pointerEvents = 'none';
        const outCv = document.createElement('canvas');
        outCv.id = 'rec-out-' + r.key;
        outCv.width = 16; outCv.height = 16;
        outSlot.appendChild(outCv);

        const row = document.createElement('div');
        row.className = 'rec-row';
        row.appendChild(grid);
        row.appendChild(arrow);
        row.appendChild(outSlot);

        card.appendChild(title);
        card.appendChild(row);
        list.appendChild(card);

        outputCanvases.push([outCv, r.out]);
    }

    for (const [cv, type] of inputCanvases) draw2DIcon(cv, type);
    for (const [cv, type] of outputCanvases) draw2DIcon(cv, type);
}

export function drawRecipeBookCanvases() {
    // The cards are built (and their icons drawn) by renderRecipeBook(); calling
    // it again is cheap and keeps the panel correct if it was re-rendered.
    renderRecipeBook();
}

// Track mouse for dragging item & tooltip
if (typeof document !== 'undefined') {
    document.addEventListener('mousemove', (e) => {
        const cursorEl = document.getElementById('cursor-item');
        if (cursorEl && cursorEl.style.display === 'block') {
            cursorEl.style.left = `${e.clientX}px`;
            cursorEl.style.top = `${e.clientY}px`;
        }
        if (mcTooltipEl && mcTooltipEl.style.display === 'block') {
            mcTooltipEl.style.left = `${e.clientX + 14}px`;
            mcTooltipEl.style.top = `${e.clientY - 22}px`;
        }
    });
}
