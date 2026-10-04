// Cubiculus - In-Game Chat System & Commands
import { setWorldTime } from '../dayNight.js';

let chatHooks = {
    onTeleport: null
};

export function initChat(hooks = {}) {
    chatHooks = { ...chatHooks, ...hooks };
}

export function isChatActive() {
    const input = document.getElementById('chat-input');
    return input && !input.classList.contains('hidden') && document.activeElement === input;
}

export function openChat() {
    const input = document.getElementById('chat-input');
    if (input) {
        input.classList.remove('hidden');
        input.focus();
        if (document.pointerLockElement) document.exitPointerLock();
    }
}

export function closeChat() {
    const input = document.getElementById('chat-input');
    if (input) {
        input.value = '';
        input.classList.add('hidden');
    }
}

export function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const msg = input.value.trim();
    if (msg.length > 0) {
        addChatMessage("Player: " + msg);
        handleChatCommand(msg);
    }
    closeChat();
}

export function addChatMessage(text) {
    const msgsEl = document.getElementById('chat-messages');
    if (!msgsEl) return;
    const line = document.createElement('div');
    line.innerText = text;
    msgsEl.appendChild(line);
    msgsEl.scrollTop = msgsEl.scrollHeight;
}

function handleChatCommand(cmd) {
    if (cmd.startsWith('/time set day')) {
        setWorldTime(0.5);
        addChatMessage("[System] Zeit auf Tag gesetzt.");
    } else if (cmd.startsWith('/time set night')) {
        setWorldTime(0.0);
        addChatMessage("[System] Zeit auf Nacht gesetzt.");
    } else if (cmd.startsWith('/clear')) {
        const msgsEl = document.getElementById('chat-messages');
        if (msgsEl) msgsEl.innerHTML = '';
    } else if (cmd.startsWith('/help')) {
        addChatMessage("Befehle: /time set day, /time set night, /clear, /tp x y z");
    } else if (cmd.startsWith('/tp')) {
        const parts = cmd.split(' ');
        if (parts.length >= 4) {
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const z = parseFloat(parts[3]);
            if (!isNaN(x) && !isNaN(y) && !isNaN(z) && chatHooks.onTeleport) {
                chatHooks.onTeleport(x, y, z);
                addChatMessage(`[System] Teleportiert zu ${x}, ${y}, ${z}`);
            }
        }
    }
}
