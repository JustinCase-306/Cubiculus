// GameSettings Manager with Keybinds, Liquid Glass & Source Engine / Portal Overhaul
export const DEFAULT_KEYBINDS = {
    forward: 'KeyW',
    backward: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    jump: 'Space',
    crouch: 'ShiftLeft',
    sprint: 'ControlLeft',
    inventory: 'KeyE',
    drop: 'KeyQ',
    chat: 'KeyT'
};

export const KEYBIND_LABELS = {
    forward: { de: 'Vorwärts gehen', en: 'Move Forward' },
    backward: { de: 'Rückwärts gehen', en: 'Move Backward' },
    left: { de: 'Schritt nach links', en: 'Strafe Left' },
    right: { de: 'Schritt nach rechts', en: 'Strafe Right' },
    jump: { de: 'Springen (Jump)', en: 'Jump' },
    crouch: { de: 'Ducken / Schleichen', en: 'Crouch / Duck' },
    sprint: { de: 'Sprinten (Laufen)', en: 'Sprint' },
    inventory: { de: 'Inventar & Crafting', en: 'Inventory & Crafting' },
    drop: { de: 'Item wegwerfen', en: 'Drop Item' },
    chat: { de: 'Konsole / Chat', en: 'Chat / Console' }
};

export const UI_THEMES = {
    amber: {
        name: { de: 'Bernstein (Amber / HL2)', en: 'Amber Gold' },
        accent: '#ff9a1f',
        glow: 'rgba(255, 154, 31, 0.45)',
        dim: 'rgba(255, 154, 31, 0.18)',
        border: 'rgba(255, 154, 31, 0.35)',
        borderBright: 'rgba(255, 185, 90, 0.85)',
        bgDark: 'rgba(14, 18, 25, 0.88)'
    },
    portal: {
        name: { de: 'Cyan Blau (Portal)', en: 'Portal Cyan' },
        accent: '#00d2ff',
        glow: 'rgba(0, 210, 255, 0.45)',
        dim: 'rgba(0, 210, 255, 0.18)',
        border: 'rgba(0, 210, 255, 0.35)',
        borderBright: 'rgba(128, 235, 255, 0.9)',
        bgDark: 'rgba(12, 20, 28, 0.88)'
    },
    emerald: {
        name: { de: 'Smaragd Grün (Emerald)', en: 'Emerald Green' },
        accent: '#10b981',
        glow: 'rgba(16, 185, 129, 0.45)',
        dim: 'rgba(16, 185, 129, 0.18)',
        border: 'rgba(16, 185, 129, 0.35)',
        borderBright: 'rgba(110, 231, 183, 0.85)',
        bgDark: 'rgba(10, 22, 18, 0.88)'
    },
    amethyst: {
        name: { de: 'Amethyst Violett', en: 'Amethyst Purple' },
        accent: '#c084fc',
        glow: 'rgba(192, 132, 252, 0.45)',
        dim: 'rgba(192, 132, 252, 0.18)',
        border: 'rgba(192, 132, 252, 0.35)',
        borderBright: 'rgba(233, 213, 255, 0.85)',
        bgDark: 'rgba(18, 12, 26, 0.88)'
    },
    ruby: {
        name: { de: 'Rubin Rot (Nether)', en: 'Nether Ruby' },
        accent: '#f87171',
        glow: 'rgba(248, 113, 113, 0.45)',
        dim: 'rgba(248, 113, 113, 0.18)',
        border: 'rgba(248, 113, 113, 0.35)',
        borderBright: 'rgba(254, 202, 202, 0.85)',
        bgDark: 'rgba(24, 12, 14, 0.88)'
    },
    gold: {
        name: { de: 'Klassisches Gold (Pixel)', en: 'Classic Gold' },
        accent: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.45)',
        dim: 'rgba(245, 158, 11, 0.18)',
        border: 'rgba(245, 158, 11, 0.35)',
        borderBright: 'rgba(252, 211, 77, 0.85)',
        bgDark: 'rgba(20, 18, 12, 0.88)'
    },
    slate: {
        name: { de: 'Monochrom / Schiefer', en: 'Slate Monochrome' },
        accent: '#94a3b8',
        glow: 'rgba(148, 163, 184, 0.45)',
        dim: 'rgba(148, 163, 184, 0.18)',
        border: 'rgba(148, 163, 184, 0.35)',
        borderBright: 'rgba(226, 232, 240, 0.85)',
        bgDark: 'rgba(15, 18, 24, 0.88)'
    },
    custom: {
        name: { de: 'Eigene Farbe (Benutzerdefiniert)', en: 'Custom Colors' },
        accent: '#ff9a1f',
        glow: 'rgba(255, 154, 31, 0.45)',
        dim: 'rgba(255, 154, 31, 0.18)',
        border: 'rgba(255, 154, 31, 0.35)',
        borderBright: 'rgba(255, 200, 120, 0.85)',
        bgDark: 'rgba(14, 18, 25, 0.88)'
    }
};

export function getKeyDisplayName(code) {
    if (!code) return 'NICHT BELEGT';
    if (code.startsWith('Key')) return code.replace('Key', '');
    if (code.startsWith('Digit')) return code.replace('Digit', '');
    if (code === 'Space') return 'LEERTASTE';
    if (code === 'ShiftLeft') return 'L-UMSCHALT';
    if (code === 'ShiftRight') return 'R-UMSCHALT';
    if (code === 'ControlLeft') return 'L-STRG';
    if (code === 'ControlRight') return 'R-STRG';
    if (code === 'AltLeft') return 'L-ALT';
    if (code === 'AltRight') return 'R-ALT';
    if (code === 'Tab') return 'TAB';
    if (code === 'Enter') return 'ENTER';
    if (code === 'Backspace') return 'RÜCKTASTE';
    if (code === 'ArrowUp') return 'PFEIL HOCH';
    if (code === 'ArrowDown') return 'PFEIL RUNTER';
    if (code === 'ArrowLeft') return 'PFEIL LINKS';
    if (code === 'ArrowRight') return 'PFEIL RECHTS';
    return code;
}

export const GameSettings = {
    // Internal physics constants (maintained for compatibility with game loop)
    speed: 7.2,                  
    jumpHeight: 11.8,            
    gravity: 44.0,               
    underwaterColor: "#000620",  
    underwaterDensity: 0.85,     
    leavesOpacity: 0.85,         

    // Audio & Graphics
    volume: 0.70,                // Audio master volume (0.0 to 1.0)
    font: 'pixel',               // 'pixel' (Press Start 2P) or 'sans'
    pixelUI: true,               // Authentic Pixelated UI Borders & Hotbar/Inventory slots
    renderDistance: 128,         // active chunk loading radius around player (4-128 chunks via Hierarchical LoD)
    lodEnabled: true,            // Level of Detail rendering for distant chunks
    fogEnabled: true,            // graphic fog toggle
    fogDensity: 0.015,           // customizable fog thickness (0.005 to 0.05)

    // Themes & Liquid Glass
    liquidGlass: true,           // High-intensity Liquid Glass Mode
    uiTheme: 'amber',            // 'amber' | 'portal' | 'emerald' | 'amethyst' | 'ruby' | 'gold' | 'slate' | 'custom'
    customAccentColor: '#ff9a1f', // Hex color picker for custom theme
    customGlowColor: '#ff9a1f',
    customBgColor: '#0e141f',
    hudVisible: true,            // HUD toggle
    crosshairStyle: 'source',    // 'source' | 'portal' | 'minimal'

    // World Seed
    worldSeed: 'browsercraft',

    // Configurable Keybinds
    keybinds: { ...DEFAULT_KEYBINDS },

    // Save current settings to localStorage
    save() {
        localStorage.setItem("webminecraft_enhanced_configs", JSON.stringify({
            speed: this.speed,
            jumpHeight: this.jumpHeight,
            gravity: this.gravity,
            underwaterColor: this.underwaterColor,
            underwaterDensity: this.underwaterDensity,
            leavesOpacity: this.leavesOpacity,
            
            // Saved options
            volume: this.volume,
            font: this.font,
            pixelUI: this.pixelUI,
            renderDistance: this.renderDistance,
            lodEnabled: this.lodEnabled,
            fogEnabled: this.fogEnabled,
            fogDensity: this.fogDensity,

            // Themes & Liquid Glass
            liquidGlass: this.liquidGlass,
            uiTheme: this.uiTheme,
            customAccentColor: this.customAccentColor,
            customGlowColor: this.customGlowColor,
            customBgColor: this.customBgColor,
            worldSeed: this.worldSeed,
            keybinds: this.keybinds
        }));
    },

    // Load settings from localStorage
    load() {
        try {
            const data = localStorage.getItem("webminecraft_enhanced_configs");
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.speed !== undefined) this.speed = parseFloat(parsed.speed);
                if (parsed.jumpHeight !== undefined) this.jumpHeight = parseFloat(parsed.jumpHeight);
                if (parsed.gravity !== undefined) this.gravity = parseFloat(parsed.gravity);
                if (parsed.underwaterColor !== undefined) this.underwaterColor = parsed.underwaterColor;
                if (parsed.underwaterDensity !== undefined) this.underwaterDensity = parseFloat(parsed.underwaterDensity);
                if (parsed.leavesOpacity !== undefined) this.leavesOpacity = parseFloat(parsed.leavesOpacity);
                
                // Load options
                if (parsed.volume !== undefined) this.volume = parseFloat(parsed.volume);
                if (parsed.font !== undefined) this.font = parsed.font;
                if (parsed.pixelUI !== undefined) this.pixelUI = parsed.pixelUI === true || parsed.pixelUI === 'true';
                if (parsed.renderDistance !== undefined) {
                    const parsedVal = parseInt(parsed.renderDistance, 10);
                    this.renderDistance = (isNaN(parsedVal) || parsedVal < 4) ? 128 : Math.min(128, Math.max(4, parsedVal));
                } else {
                    this.renderDistance = 128;
                }
                if (parsed.lodEnabled !== undefined) this.lodEnabled = parsed.lodEnabled === true || parsed.lodEnabled === 'true';
                if (parsed.fogEnabled !== undefined) this.fogEnabled = parsed.fogEnabled === true || parsed.fogEnabled === 'true';
                if (parsed.fogDensity !== undefined) this.fogDensity = parseFloat(parsed.fogDensity);

                // Load themes & liquid glass
                if (parsed.liquidGlass !== undefined) this.liquidGlass = parsed.liquidGlass === true || parsed.liquidGlass === 'true';
                if (parsed.uiTheme !== undefined) this.uiTheme = parsed.uiTheme;
                if (parsed.customAccentColor !== undefined) this.customAccentColor = parsed.customAccentColor;
                if (parsed.customGlowColor !== undefined) this.customGlowColor = parsed.customGlowColor;
                if (parsed.customBgColor !== undefined) this.customBgColor = parsed.customBgColor;
                if (parsed.worldSeed !== undefined) this.worldSeed = String(parsed.worldSeed);
                if (parsed.keybinds && typeof parsed.keybinds === 'object') {
                    this.keybinds = { ...DEFAULT_KEYBINDS, ...parsed.keybinds };
                }
            }
        } catch (e) {
            console.warn("Could not load configurations:", e);
        }
    },

    resetKeybinds() {
        this.keybinds = { ...DEFAULT_KEYBINDS };
        this.save();
    },

    setKeybind(action, code) {
        if (this.keybinds[action] !== undefined) {
            this.keybinds[action] = code;
            this.save();
        }
    },

    // Get color code as an RGBA color string with dynamic density
    getUnderwaterColorRGBA() {
        const hex = this.underwaterColor || "#000620";
        let r = 0, g = 6, b = 32;
        if (hex.startsWith("#")) {
            const h = hex.slice(1);
            if (h.length === 3) {
                r = parseInt(h[0] + h[0], 16);
                g = parseInt(h[1] + h[1], 16);
                b = parseInt(h[2] + h[2], 16);
            } else if (h.length === 6) {
                r = parseInt(h.slice(0, 2), 16);
                g = parseInt(h.slice(2, 4), 16);
                b = parseInt(h.slice(4, 6), 16);
            }
        }
        return `rgba(${r}, ${g}, ${b}, ${this.underwaterDensity})`;
    }
};

// Auto load configurations on import
GameSettings.load();
