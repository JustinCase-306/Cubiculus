// BrowserCraft - Keybinding Configuration & Rebinding Table
import { GameSettings, getKeyDisplayName, KEYBIND_LABELS, DEFAULT_KEYBINDS } from '../settings.js';
import { playSound } from '../audio.js';

let activeBindingAction = null;

export function getActiveBindingAction() {
    return activeBindingAction;
}

export function setActiveBindingAction(action) {
    activeBindingAction = action;
}

export function renderKeybindsTable(currentLang = 'DE') {
    const tbody = document.getElementById('keybinds-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const actions = Object.keys(DEFAULT_KEYBINDS);
    actions.forEach(action => {
        const tr = document.createElement('tr');
        const isRebinding = activeBindingAction === action;
        const currentCode = (GameSettings.keybinds && GameSettings.keybinds[action]) || DEFAULT_KEYBINDS[action];
        const displayKey = getKeyDisplayName(currentCode);
        
        // Resolve label string from object or fallback to action name
        const labelObj = KEYBIND_LABELS[action];
        const label = (typeof labelObj === 'object' && labelObj !== null)
            ? (labelObj[currentLang.toLowerCase()] || labelObj.de || action)
            : (labelObj || action);

        const promptText = currentLang === 'DE' ? '> TASTE DRUECKEN <' : '> PRESS ANY KEY <';

        tr.innerHTML = `
            <td class="font-bold text-[#222222] text-[8px]">${label}</td>
            <td style="text-align: right;">
                <button class="mc-btn mc-btn-sm ${isRebinding ? 'accent animate-pulse' : ''}" style="min-width: 140px;" onclick="window.startRebinding('${action}')">
                    ${isRebinding ? promptText : displayKey}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export function startRebinding(action, currentLang = 'DE') {
    playSound('ui_click');
    if (activeBindingAction === action) {
        activeBindingAction = null;
    } else {
        activeBindingAction = action;
    }
    renderKeybindsTable(currentLang);
}

export function resetKeybindings(currentLang = 'DE') {
    playSound('ui_click');
    GameSettings.resetKeybinds();
    activeBindingAction = null;
    renderKeybindsTable(currentLang);
}
