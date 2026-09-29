// BrowserCraft - In-Game HUD, F3 Debug Screen & Underwater Screen Tint
import { BLOCKS } from '../blocks.js';
import { playSound } from '../audio.js';
import { getFormattedTime } from '../dayNight.js';

let frameCount = 0;
let lastFpsTime = performance.now();
let currentFps = 60;

export function toggleF3Overlay() {
    playSound('ui_click');
    const f3 = document.getElementById('f3-overlay');
    if (!f3) return;
    if (f3.style.display === 'flex') {
        f3.style.display = 'none';
    } else {
        f3.style.display = 'flex';
    }
}

export function updateHUD(player, scene, yaw, worldSeed, currentLang = 'DE') {
    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime >= 500) {
        currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        frameCount = 0;
        lastFpsTime = now;
        const fpsEl = document.getElementById('fps-badge');
        if (fpsEl) fpsEl.innerText = `${currentFps} FPS`;
    }

    if (!player) return;

    // XYZ Position
    const posEl = document.getElementById('pos');
    if (posEl) {
        posEl.innerText = `${player.pos.x.toFixed(1)} / ${player.pos.y.toFixed(1)} / ${player.pos.z.toFixed(1)}`;
    }

    // Integer Block Coordinates
    const blockPosEl = document.getElementById('block-pos');
    if (blockPosEl) {
        blockPosEl.innerText = `${Math.floor(player.pos.x)} ${Math.floor(player.pos.y)} ${Math.floor(player.pos.z)}`;
    }

    // Facing Direction
    const facingEl = document.getElementById('facing');
    if (facingEl) {
        const normalizedYaw = ((yaw % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        let dir = currentLang === 'DE' ? 'Nord (-Z)' : 'North (-Z)';
        if (normalizedYaw >= Math.PI * 0.25 && normalizedYaw < Math.PI * 0.75) {
            dir = currentLang === 'DE' ? 'West (-X)' : 'West (-X)';
        } else if (normalizedYaw >= Math.PI * 0.75 && normalizedYaw < Math.PI * 1.25) {
            dir = currentLang === 'DE' ? 'Sued (+Z)' : 'South (+Z)';
        } else if (normalizedYaw >= Math.PI * 1.25 && normalizedYaw < Math.PI * 1.75) {
            dir = currentLang === 'DE' ? 'Ost (+X)' : 'East (+X)';
        }
        facingEl.innerText = dir;
    }

    // Day / Night Time
    const timeEl = document.getElementById('time');
    if (timeEl) {
        timeEl.innerText = getFormattedTime(currentLang);
    }

    // World Seed
    const seedEl = document.getElementById('f3-seed');
    if (seedEl) {
        seedEl.innerText = worldSeed || 'browsercraft';
    }

    // Crouch Status in F3
    const crouchF3 = document.getElementById('f3-crouch');
    if (crouchF3) {
        crouchF3.innerText = player.crouching 
            ? (currentLang === 'DE' ? 'Ja' : 'Yes') 
            : (currentLang === 'DE' ? 'Nein' : 'No');
    }

    // Dynamic Crouch Tag Indicator above Hotbar
    const crouchTag = document.getElementById('hud-crouch-tag');
    if (crouchTag) {
        crouchTag.style.display = player.crouching ? 'block' : 'none';
    }
}

export function updateUnderwaterVisuals(player, getBlock, GameSettings) {
    const tintEl = document.getElementById('underwater-tint');
    if (!tintEl || !player) return;

    // Only activate screen tint when eye level is physically inside water
    const eyeX = Math.floor(player.pos.x);
    const eyeY = Math.floor(player.visualY + player.eye);
    const eyeZ = Math.floor(player.pos.z);
    const eyeBlock = getBlock(eyeX, eyeY, eyeZ);

    if (eyeBlock === BLOCKS.WATER) {
        tintEl.style.backgroundColor = GameSettings.getUnderwaterColorRGBA();
        tintEl.style.display = 'block';
    } else {
        tintEl.style.display = 'none';
    }
}
