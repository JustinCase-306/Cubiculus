// BrowserCraft - Day / Night Cycle & Dynamic Sky Simulation
import * as THREE from 'three';

export let worldTime = 0.25; // 0.0 to 1.0 (0.25 = sunrise, 0.5 = midday, 0.75 = sunset, 0.0 = midnight)
export const DAY_LENGTH_SECONDS = 360; // 6 minutes full day-night cycle

export function setWorldTime(time) {
    worldTime = time % 1.0;
}

export function getWorldTime() {
    return worldTime;
}

export function getFormattedTime(lang = 'DE') {
    const hours = Math.floor((worldTime * 24 + 6) % 24);
    const minutes = Math.floor((worldTime * 24 * 60) % 60);
    const isDay = hours >= 6 && hours < 19;
    const hh = hours < 10 ? '0' + hours : hours;
    const mm = minutes < 10 ? '0' + minutes : minutes;
    const prefix = isDay 
        ? (lang === 'DE' ? 'Tag' : 'Day') 
        : (lang === 'DE' ? 'Nacht' : 'Night');
    return `${prefix} (${hh}:${mm})`;
}

export function updateDayNightCycle(dt, scene, sunLight, moonLight, playerPos) {
    worldTime = (worldTime + dt / DAY_LENGTH_SECONDS) % 1.0;

    // Angle in radians (0.25 = top sun, 0.75 = bottom sun)
    const angle = worldTime * Math.PI * 2;
    const sunDist = 110;
    const sunX = Math.cos(angle) * sunDist;
    const sunY = Math.sin(angle) * sunDist;

    if (sunLight && playerPos) {
        sunLight.position.set(
            playerPos.x + sunX * 0.7,
            playerPos.y + Math.max(35, sunY * 0.75),
            playerPos.z + 28
        );
        sunLight.target.position.set(playerPos.x, playerPos.y, playerPos.z);
        sunLight.target.updateMatrixWorld();
        const sinA = Math.sin(angle);
        sunLight.intensity = Math.max(0, sinA) * 1.05;
        sunLight.castShadow = sinA > 0.05;
    }

    if (moonLight) {
        moonLight.position.set(-sunX, -sunY, -30);
        moonLight.intensity = Math.max(0, -Math.sin(angle)) * 0.3;
    }

    // Sky Color interpolation
    if (scene && scene.background) {
        const dayColor = new THREE.Color(0x78a7ff);
        const sunsetColor = new THREE.Color(0xd87a55);
        const nightColor = new THREE.Color(0x0a0e20);

        let skyCol = new THREE.Color();
        const sinA = Math.sin(angle);

        if (sinA > 0.2) {
            skyCol.copy(dayColor);
        } else if (sinA > -0.1) {
            const factor = (sinA + 0.1) / 0.3;
            skyCol.lerpColors(sunsetColor, dayColor, factor);
        } else if (sinA > -0.3) {
            const factor = (sinA + 0.3) / 0.2;
            skyCol.lerpColors(nightColor, sunsetColor, factor);
        } else {
            skyCol.copy(nightColor);
        }

        scene.background.copy(skyCol);
        if (scene.fog) {
            scene.fog.color.copy(skyCol);
        }
    }
}
