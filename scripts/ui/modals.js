// BrowserCraft - Modals Controller (Settings, Save Slots, Confirm Reset, Themes)
import { GameSettings, UI_THEMES } from '../settings.js';
import { listAllSlots, getActiveSlotId, exportSlotJSON, importSlotJSON, deleteSlotWorld } from '../saveManager.js';
import { playSound, setAudioVolume } from '../audio.js';
import { renderKeybindsTable } from './keybinds.js';

let currentLang = 'DE';
let modalHooks = {
    onSelectSlot: null,
    onSaveWorld: null,
    onResetWorld: null,
    onSeedChanged: null,
    onRenderDistanceChanged: null
};

export function getCurrentLang() {
    return currentLang;
}

export function initModals(hooks = {}) {
    modalHooks = { ...modalHooks, ...hooks };
}

export function toggleSettingsModal(event) {
    if (event) event.stopPropagation();
    playSound('ui_click');
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        syncSettingsDisplay();
        renderKeybindsTable(currentLang);
        if (document.pointerLockElement) document.exitPointerLock();
    } else {
        modal.classList.add('hidden');
    }
}

export function switchSettingsTab(tabName) {
    playSound('ui_click');
    const tabs = ['keyboard', 'graphics', 'audio', 'gameplay'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        const content = document.getElementById(`tab-content-${t}`);
        if (btn) {
            if (t === tabName) btn.classList.add('active');
            else btn.classList.remove('active');
        }
        if (content) {
            if (t === tabName) content.classList.remove('hidden');
            else content.classList.add('hidden');
        }
    });
}

export function toggleSaveSlotsModal(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('saves-modal');
    if (!modal) return;
    playSound('ui_click');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        refreshSaveSlotsUI();
        if (document.pointerLockElement) document.exitPointerLock();
    } else {
        modal.classList.add('hidden');
    }
}

export function refreshSaveSlotsUI() {
    const container = document.getElementById('saves-slots-container');
    if (!container) return;

    const slots = listAllSlots();
    const activeId = getActiveSlotId();
    container.innerHTML = '';

    slots.forEach((slot, idx) => {
        const card = document.createElement('div');
        const isActive = slot.id === activeId;
        card.className = `mc-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${isActive ? 'bg-[#9e9e9e]' : ''}`;

        const slotIndexLabel = `SLOT ${idx + 1}`;
        const activeLabel = currentLang === 'DE' ? 'AKTIV' : 'ACTIVE';
        const emptyLabel = currentLang === 'DE' ? 'LEER' : 'EMPTY';
        const playedLabel = currentLang === 'DE' ? 'Gespielt' : 'Played';
        const blocksLabel = currentLang === 'DE' ? 'Bloecke' : 'Blocks';
        const playBtnLabel = isActive 
            ? (currentLang === 'DE' ? 'AKTUALISIEREN' : 'REFRESH') 
            : (currentLang === 'DE' ? 'LADEN & SPIELEN' : 'LOAD & PLAY');
        const deleteBtnLabel = currentLang === 'DE' ? 'LOESCHEN' : 'DELETE';

        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-[#8b8b8b] border-2 border-[#373737] flex items-center justify-center text-[8px] font-bold select-none text-[#222222]">
                    ${slotIndexLabel}
                </div>
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                        <span class="text-[#222222] text-[9px] font-bold">${slot.name}</span>
                        ${isActive ? `<span class="bg-[#55ff55] text-black text-[7px] px-1.5 py-0.5 border border-[#205020] font-bold">${activeLabel}</span>` : ''}
                        ${slot.empty ? `<span class="bg-[#888888] text-white text-[7px] px-1.5 py-0.5 font-bold">${emptyLabel}</span>` : ''}
                        <span class="text-[7px] text-[#444444] font-mono">SEED: ${slot.seed || 'browsercraft'}</span>
                    </div>
                    <div class="text-[#555555] text-[7px] flex gap-3">
                        <span>${playedLabel}: ${slot.lastPlayed}</span>
                        <span>${blocksLabel}: ${slot.blockCount}</span>
                    </div>
                </div>
            </div>
            <div class="flex flex-wrap gap-2">
                <button class="mc-btn mc-btn-sm ${isActive ? 'accent' : ''}" onclick="window.selectAndLoadSlot('${slot.id}')">
                    ${playBtnLabel}
                </button>
                <button class="mc-btn mc-btn-sm" onclick="window.exportSlot('${slot.id}')" ${slot.empty ? 'disabled' : ''}>
                    EXPORT
                </button>
                <button class="mc-btn mc-btn-sm danger" onclick="window.deleteSlot('${slot.id}')" ${slot.empty ? 'disabled' : ''}>
                    ${deleteBtnLabel}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

export function selectAndLoadSlot(slotId) {
    playSound('ui_click');
    const modal = document.getElementById('saves-modal');
    if (modal) modal.classList.add('hidden');
    if (modalHooks.onSelectSlot) modalHooks.onSelectSlot(slotId);
}

export function exportSlot(slotId) {
    playSound('ui_click');
    exportSlotJSON(slotId);
}

export function deleteSlot(slotId) {
    playSound('ui_click');
    const confirmPrompt = currentLang === 'DE' 
        ? "Moechtest du diesen Spielstand wirklich loeschen?" 
        : "Do you really want to delete this save?";
    if (confirm(confirmPrompt)) {
        deleteSlotWorld(slotId);
        if (getActiveSlotId() === slotId) {
            if (modalHooks.onSelectSlot) modalHooks.onSelectSlot(slotId);
        } else {
            refreshSaveSlotsUI();
        }
    }
}

export function handleWorldImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const activeId = getActiveSlotId();
        const success = importSlotJSON(activeId, content);
        if (success) {
            playSound('pickup');
            if (modalHooks.onSelectSlot) modalHooks.onSelectSlot(activeId);
            const successMsg = currentLang === 'DE' 
                ? "Welt erfolgreich in den aktiven Slot importiert!" 
                : "World successfully imported into active slot!";
            alert(successMsg);
        } else {
            const errorMsg = currentLang === 'DE' 
                ? "Fehler beim Importieren der Datei. Ungueltiges Format!" 
                : "Import failed. Invalid format!";
            alert(errorMsg);
        }
    };
    reader.readAsText(file);
}

export function triggerResetModal(event) {
    if (event) event.stopPropagation();
    playSound('ui_click');
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.remove('hidden');
}

export function confirmReset(confirmed) {
    playSound('ui_click');
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.add('hidden');
    if (confirmed && modalHooks.onResetWorld) {
        modalHooks.onResetWorld();
    }
}

export function toggleLanguage(event) {
    if (event) event.stopPropagation();
    playSound('ui_click');
    currentLang = currentLang === 'DE' ? 'EN' : 'DE';
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) langBtn.innerText = `SPRACHE: ${currentLang}`;
    renderKeybindsTable(currentLang);
    refreshSaveSlotsUI();
}

export function generateRandomSeed() {
    playSound('ui_click');
    const randomSeed = Math.random().toString(36).substring(2, 10);
    const input = document.getElementById('cfg-world-seed-input');
    if (input) input.value = randomSeed;
}

export function applySeedFromInput() {
    playSound('ui_click');
    const input = document.getElementById('cfg-world-seed-input');
    const newSeed = (input && input.value.trim()) || 'browsercraft';
    if (modalHooks.onSeedChanged) modalHooks.onSeedChanged(newSeed);
}

export function toggleLiquidGlassSetting() {
    GameSettings.liquidGlass = !GameSettings.liquidGlass;
    applyLiquidGlassMode(GameSettings.liquidGlass);
    GameSettings.save();
    playSound('ui_click');
    syncSettingsDisplay();
}

export function togglePixelUISetting() {
    playSound('ui_click');
    GameSettings.pixelUI = !GameSettings.pixelUI;
    applyPixelUIMode(GameSettings.pixelUI);
    GameSettings.save();
    syncSettingsDisplay();
}

export function setThemeSetting(theme) {
    playSound('ui_click');
    GameSettings.uiTheme = theme;
    applyUITheme(theme);
    GameSettings.save();
    syncSettingsDisplay();
}

export function setCustomColor(type, hex) {
    if (type === 'accent') {
        GameSettings.customAccent = hex;
    } else if (type === 'glow') {
        GameSettings.customGlow = hex;
    }
    GameSettings.uiTheme = 'custom';
    applyUITheme('custom');
    GameSettings.save();
    syncSettingsDisplay();
}

export function applyLiquidGlassMode(enabled) {
    if (enabled) {
        document.body.classList.add('liquid-glass-mode');
    } else {
        document.body.classList.remove('liquid-glass-mode');
    }
}

export function applyPixelUIMode(enabled) {
    if (enabled) {
        document.body.classList.add('pixel-ui');
    } else {
        document.body.classList.remove('pixel-ui');
    }
}

export function applyUITheme(theme) {
    const themeClasses = ['theme-halflife', 'theme-amber', 'theme-portal', 'theme-emerald', 'theme-amethyst', 'theme-ruby', 'theme-gold', 'theme-slate', 'theme-custom'];
    themeClasses.forEach(cls => document.body.classList.remove(cls));

    if (theme === 'custom') {
        document.body.classList.add('theme-custom');
        document.documentElement.style.setProperty('--theme-accent', GameSettings.customAccent || '#55ff55');
        document.documentElement.style.setProperty('--theme-glow', GameSettings.customGlow || 'rgba(85, 255, 85, 0.45)');
    } else {
        const themeDef = UI_THEMES[theme] || UI_THEMES['emerald'];
        document.body.classList.add(`theme-${theme}`);
        if (themeDef) {
            document.documentElement.style.setProperty('--theme-accent', themeDef.accent);
            document.documentElement.style.setProperty('--theme-glow', themeDef.glow);
        }
    }
}

export function syncSettingsDisplay() {
    // Glass
    const glassLbl = document.getElementById('cfg-glass-lbl');
    const glassBtn = document.getElementById('cfg-glass-btn');
    if (glassLbl) glassLbl.innerText = GameSettings.liquidGlass ? 'AKTIVIERT' : 'DEAKTIVIERT';
    if (glassBtn) {
        glassBtn.innerText = GameSettings.liquidGlass ? 'GLAS-MODUS DEAKTIVIEREN' : 'GLAS-MODUS AKTIVIEREN';
        if (GameSettings.liquidGlass) glassBtn.classList.add('accent');
        else glassBtn.classList.remove('accent');
    }

    // Pixel UI
    const pixelLbl = document.getElementById('cfg-pixel-ui-lbl');
    const pixelBtn = document.getElementById('cfg-pixel-ui-btn');
    if (pixelLbl) pixelLbl.innerText = GameSettings.pixelUI ? 'AKTIVIERT' : 'DEAKTIVIERT';
    if (pixelBtn) {
        pixelBtn.innerText = GameSettings.pixelUI ? 'PIXEL-UI DEAKTIVIEREN' : 'PIXEL-UI AKTIVIEREN';
        if (GameSettings.pixelUI) pixelBtn.classList.add('accent');
        else pixelBtn.classList.remove('accent');
    }

    // Themes
    const themeLbl = document.getElementById('cfg-theme-lbl');
    const activeTheme = UI_THEMES[GameSettings.uiTheme];
    if (themeLbl) themeLbl.innerText = activeTheme ? activeTheme.name.de : (GameSettings.uiTheme === 'custom' ? 'EIGENE' : 'KLASSISCH');

    const themeButtons = ['amber', 'portal', 'emerald', 'amethyst', 'ruby', 'gold', 'slate', 'custom'];
    themeButtons.forEach(t => {
        const btn = document.getElementById(`btn-theme-${t}`);
        if (btn) {
            if (GameSettings.uiTheme === t) btn.classList.add('accent');
            else btn.classList.remove('accent');
        }
    });

    // Custom pickers
    const customAccent = document.getElementById('cfg-custom-accent');
    const customGlow = document.getElementById('cfg-custom-glow');
    if (customAccent) customAccent.value = GameSettings.customAccent || '#55ff55';
    if (customGlow) customGlow.value = GameSettings.customGlow || '#55ff55';

    // Seed
    const seedLbl = document.getElementById('cfg-active-seed-lbl');
    const seedInput = document.getElementById('cfg-world-seed-input');
    if (seedLbl) seedLbl.innerText = GameSettings.worldSeed;
    if (seedInput && !seedInput.matches(':focus')) seedInput.value = GameSettings.worldSeed;

    // Render distance
    const rdInput = document.getElementById('cfg-render-dist');
    const rdLbl = document.getElementById('cfg-render-dist-lbl');
    if (rdInput) rdInput.value = GameSettings.renderDistance;
    if (rdLbl) {
        const rd = GameSettings.renderDistance;
        let suffix = '';
        if (rd >= 128) suffix = ' (Ultra-LoD Horizon)';
        else if (rd >= 64) suffix = ' (LoD Horizon)';
        else if (rd >= 32) suffix = ' (LoD)';
        rdLbl.innerText = `${rd} Chunks${suffix}`;
    }

    // Fog
    const fogLbl = document.getElementById('cfg-fog-enabled-lbl');
    if (fogLbl) fogLbl.innerText = GameSettings.fogEnabled ? 'AN' : 'OFF';

    // Volume
    const volInput = document.getElementById('cfg-volume');
    const volLbl = document.getElementById('cfg-volume-lbl');
    const volInput2 = document.getElementById('cfg-volume-2');
    const volLbl2 = document.getElementById('cfg-volume-lbl-2');
    if (volInput) volInput.value = GameSettings.volume;
    if (volLbl) volLbl.innerText = `${Math.round(GameSettings.volume * 100)}%`;
    if (volInput2) volInput2.value = GameSettings.volume;
    if (volLbl2) volLbl2.innerText = `${Math.round(GameSettings.volume * 100)}%`;

    // Leaves
    const leavesInput = document.getElementById('cfg-leaves');
    const leavesLbl = document.getElementById('cfg-leaves-lbl');
    if (leavesInput) leavesInput.value = GameSettings.leavesOpacity;
    if (leavesLbl) leavesLbl.innerText = GameSettings.leavesOpacity;

    // Underwater
    const uwColInput = document.getElementById('cfg-underwater-color');
    const uwColLbl = document.getElementById('cfg-underwater-color-lbl');
    if (uwColInput) uwColInput.value = GameSettings.underwaterColor;
    if (uwColLbl) uwColLbl.innerText = GameSettings.underwaterColor;
}

export function updateSetting(key, val) {
    if (key === 'volume') {
        GameSettings.volume = parseFloat(val);
        setAudioVolume(GameSettings.volume);
        const lbl = document.getElementById('cfg-volume-lbl');
        if (lbl) lbl.innerText = `${Math.round(GameSettings.volume * 100)}%`;
        const lbl2 = document.getElementById('cfg-volume-lbl-2');
        if (lbl2) lbl2.innerText = `${Math.round(GameSettings.volume * 100)}%`;
    } else if (key === 'renderDistance') {
        GameSettings.renderDistance = parseInt(val, 10);
        const lbl = document.getElementById('cfg-render-dist-lbl');
        if (lbl) {
            const rd = GameSettings.renderDistance;
            let suffix = '';
            if (rd >= 128) suffix = ' (Ultra-LoD Horizon)';
            else if (rd >= 64) suffix = ' (LoD Horizon)';
            else if (rd >= 32) suffix = ' (LoD)';
            lbl.innerText = `${rd} Chunks${suffix}`;
        }
        if (modalHooks.onRenderDistanceChanged) modalHooks.onRenderDistanceChanged(GameSettings.renderDistance);
    } else if (key === 'fogDensity') {
        GameSettings.fogDensity = parseFloat(val);
    } else if (key === 'leavesOpacity') {
        GameSettings.leavesOpacity = parseFloat(val);
        const lbl = document.getElementById('cfg-leaves-lbl');
        if (lbl) lbl.innerText = val;
    } else if (key === 'underwaterColor') {
        GameSettings.underwaterColor = val;
        const lbl = document.getElementById('cfg-underwater-color-lbl');
        if (lbl) lbl.innerText = val;
    }
    GameSettings.save();
}
