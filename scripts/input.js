// Cubiculus - Input Manager (Keyboard, Mouse, PointerLock & Dragging Fallback)
import { GameSettings, DEFAULT_KEYBINDS } from './settings.js';
import { playSound } from './audio.js';
import { getActiveBindingAction, setActiveBindingAction, renderKeybindsTable } from './ui/keybinds.js';
import { isChatActive, openChat, closeChat, sendChatMessage } from './ui/chat.js';
import { toggleInventory } from './inventory.js';

export let isGameActive = false;
export let isPointerLocked = false;
export let isDraggingFallback = false;
let dragPrevMouse = { x: 0, y: 0 };

export let yaw = 0;
export let pitch = 0;

export function setYaw(y) { yaw = y; }
export function setPitch(p) { pitch = p; }

// Relative look, used by the touch layer. yaw/pitch are exported bindings, so an
// importing module cannot assign to them - rollup rejects that outright. Routing
// the delta through here keeps the clamping in one place.
export function applyLookDelta(dYaw, dPitch) {
    yaw += dYaw;
    pitch += dPitch;
    pitch = Math.max(-Math.PI * 0.49, Math.min(Math.PI * 0.49, pitch));
}

export const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    crouch: false
};

export let mouseState = {
    isDown: false,
    button: -1
};

let inputCallbacks = {
    onDrop: null,
    onHotbarSelect: null,
    onRightClick: null,
    onEscape: null,
    onZoom: null
};

export function initInput(callbacks = {}) {
    inputCallbacks = { ...inputCallbacks, ...callbacks };
    setupInputListeners();
    setupPointerLock();
}

export function setIsGameActive(active) {
    isGameActive = active;
}

export function requestGameLock() {
    // Close any modal that might still be open so we do not grab the pointer
    // while a menu is covering the screen.
    for (const id of ['settings-modal', 'saves-modal', 'confirm-modal']) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }
    const invOverlay = document.getElementById('inventory-overlay');
    if (invOverlay) invOverlay.style.display = 'none';

    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = 'none';

    isGameActive = true;

    // Request Pointer Lock (or activate drag fallback if inside restricted iframe)
    try {
        const promise = document.body.requestPointerLock();
        if (promise && promise.catch) {
            promise.catch(() => {
                isDraggingFallback = true;
            });
        }
    } catch (err) {
        isDraggingFallback = true;
    }
}

function setupPointerLock() {
    // Clicking the pause overlay resumes the game. Without this you had to hit
    // the specific "back to game" button, and clicking anywhere else did nothing.
    document.addEventListener('mousedown', (e) => {
        const overlay = document.getElementById('overlay');
        if (!overlay || overlay.style.display === 'none' || !overlay.contains(e.target)) return;
        // Let the menu buttons handle their own clicks.
        if (e.target.closest('button') || e.target.closest('input') ||
            e.target.closest('.mc-tab-btn')) return;
        e.preventDefault();
        requestGameLock();
    });

    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = (document.pointerLockElement === document.body);
        if (!isPointerLocked) {
            const settingsModal = document.getElementById('settings-modal');
            const savesModal = document.getElementById('saves-modal');
            const invOverlay = document.getElementById('inventory-overlay');

            const isModalOpen = (settingsModal && !settingsModal.classList.contains('hidden')) ||
                                (savesModal && !savesModal.classList.contains('hidden')) ||
                                (invOverlay && invOverlay.style.display === 'flex');

            if (!isModalOpen) {
                const overlay = document.getElementById('overlay');
                if (overlay) overlay.style.display = 'flex';
                isGameActive = false;
            }
        }
    });
}

function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
        // Rebinding key state check
        const activeBinding = getActiveBindingAction();
        if (activeBinding) {
            e.preventDefault();
            e.stopPropagation();
            if (e.code === 'Escape') {
                setActiveBindingAction(null);
                renderKeybindsTable();
                return;
            }
            GameSettings.setKeybind(activeBinding, e.code);
            setActiveBindingAction(null);
            playSound('ui_click');
            renderKeybindsTable();
            return;
        }

        // Chat input guard
        if (isChatActive()) {
            if (e.key === 'Enter') sendChatMessage();
            if (e.key === 'Escape') closeChat();
            return;
        }

        // Escape handling
        if (e.key === 'Escape') {
            if (inputCallbacks.onEscape) inputCallbacks.onEscape();
            return;
        }

        // F3 Debug Overlay toggle
        if (e.code === 'F3') {
            e.preventDefault();
            if (window.toggleF3Overlay) window.toggleF3Overlay();
            return;
        }

        const kb = GameSettings.keybinds || DEFAULT_KEYBINDS;

        // Inventory toggle
        if (e.code === kb.inventory || e.code === 'KeyE') {
            toggleInventory();
            return;
        }

        // Drop item
        if (e.code === kb.drop || e.code === 'KeyQ') {
            if (inputCallbacks.onDrop) inputCallbacks.onDrop();
            return;
        }

        // Chat open
        if (e.code === kb.chat || e.code === 'KeyT' || e.code === 'Enter') {
            e.preventDefault();
            openChat();
            return;
        }

        // Movement keys. preventDefault on Ctrl prevents browser shortcuts
        // like "Ctrl+W" (close tab) / "Ctrl+T" from firing while sprinting.
        if (e.code === kb.forward || e.code === 'KeyW' || e.code === 'ArrowUp') keys.forward = true;
        if (e.code === kb.backward || e.code === 'KeyS' || e.code === 'ArrowDown') keys.backward = true;
        if (e.code === kb.left || e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
        if (e.code === kb.right || e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
        if (e.code === kb.jump || e.code === 'Space') { keys.jump = true; e.preventDefault(); }
        if (e.code === kb.crouch || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            if (!keys.crouch) playSound('crouch');
            keys.crouch = true;
        }
        if (e.code === kb.sprint || e.code === 'ControlLeft' || e.code === 'ControlRight') {
            keys.sprint = true;
            e.preventDefault();
        }

        // Hotbar selection keys (1..9)
        if (e.code.startsWith('Digit')) {
            const digit = parseInt(e.code.replace('Digit', ''), 10);
            if (digit >= 1 && digit <= 9 && inputCallbacks.onHotbarSelect) {
                inputCallbacks.onHotbarSelect(digit);
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        const kb = GameSettings.keybinds || DEFAULT_KEYBINDS;
        if (e.code === kb.forward || e.code === 'KeyW' || e.code === 'ArrowUp') keys.forward = false;
        if (e.code === kb.backward || e.code === 'KeyS' || e.code === 'ArrowDown') keys.backward = false;
        if (e.code === kb.left || e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
        if (e.code === kb.right || e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
        if (e.code === kb.jump || e.code === 'Space') keys.jump = false;
        if (e.code === kb.crouch || e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.crouch = false;
        if (e.code === kb.sprint || e.code === 'ControlLeft' || e.code === 'ControlRight') keys.sprint = false;
    });

    // Mouse wheel: Shift+scroll = zoom, normal scroll = hotbar
    window.addEventListener('wheel', (e) => {
        if (!isGameActive) return;
        if (e.shiftKey) {
            // Zoom with Shift held
            if (inputCallbacks.onZoom) inputCallbacks.onZoom(e.deltaY);
        } else {
            if (inputCallbacks.onWheel) inputCallbacks.onWheel(e.deltaY);
        }
    }, { passive: true });

    // Mouse Clicks
    window.addEventListener('mousedown', (e) => {
        if (!isGameActive) return;
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || 
            e.target.closest('#inventory-overlay') || e.target.closest('#settings-modal') || 
            e.target.closest('#saves-modal') || e.target.closest('#confirm-modal')) {
            return;
        }

        if (e.button === 0) {
            mouseState.isDown = true;
            mouseState.button = 0;
        } else if (e.button === 2) {
            e.preventDefault();
            if (inputCallbacks.onRightClick) inputCallbacks.onRightClick();
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            mouseState.isDown = false;
        }
    });

    window.addEventListener('contextmenu', (e) => {
        if (isGameActive) e.preventDefault();
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
        if (!isGameActive) return;

        if (isPointerLocked) {
            const sens = 0.0022;
            yaw -= e.movementX * sens;
            pitch -= e.movementY * sens;
            pitch = Math.max(-Math.PI * 0.49, Math.min(Math.PI * 0.49, pitch));
        } else if (isDraggingFallback) {
            const dx = e.clientX - dragPrevMouse.x;
            const dy = e.clientY - dragPrevMouse.y;
            dragPrevMouse = { x: e.clientX, y: e.clientY };

            const sens = 0.0035;
            yaw -= dx * sens;
            pitch -= dy * sens;
            pitch = Math.max(-Math.PI * 0.49, Math.min(Math.PI * 0.49, pitch));
        }
    });
}
