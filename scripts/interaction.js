// BrowserCraft - Voxel Interaction, Mining & Block Placement System
import * as THREE from 'three';
import { BLOCKS, isPlaceableBlock, getToolMultiplier, breakTimes } from './blocks.js';
import { playSound } from './audio.js';
import { spawnDroppedItem } from './droppedItems.js';
import { spawnMiningParticles, rebuildChunkImmediate } from './renderEngine.js';
import { playerSetBlock, dirtyChunks } from './worldGen.js';

const raycaster = new THREE.Raycaster();
const rayOrigin = new THREE.Vector3();
const rayDir = new THREE.Vector3();

let miningTarget = null;
let miningTimeElapsed = 0;
let miningRequiredTime = 1.0;
let hitSoundCooldown = 0;

export function getMiningTarget() {
    return miningTarget;
}

// Fast 3D DDA Voxel Raycaster (up to 5.5 blocks range)
export function getTargetVoxel(camera, player, getBlock) {
    if (!camera || !player) return null;

    rayOrigin.set(player.pos.x, player.visualY + player.eye, player.pos.z);
    camera.getWorldDirection(rayDir);

    const maxDist = 5.5;
    let t = 0;
    const step = 0.05;

    let prevX = Math.floor(rayOrigin.x);
    let prevY = Math.floor(rayOrigin.y);
    let prevZ = Math.floor(rayOrigin.z);

    while (t < maxDist) {
        t += step;
        const curX = Math.floor(rayOrigin.x + rayDir.x * t);
        const curY = Math.floor(rayOrigin.y + rayDir.y * t);
        const curZ = Math.floor(rayOrigin.z + rayDir.z * t);

        const blk = getBlock(curX, curY, curZ);
        if (blk !== BLOCKS.AIR && blk !== BLOCKS.WATER) {
            let nx = prevX - curX;
            let ny = prevY - curY;
            let nz = prevZ - curZ;

            // Constrain normal to dominant axis
            if (nx !== 0 && (ny !== 0 || nz !== 0)) {
                if (Math.abs(rayDir.x) >= Math.abs(rayDir.y) && Math.abs(rayDir.x) >= Math.abs(rayDir.z)) {
                    ny = 0; nz = 0;
                } else if (Math.abs(rayDir.y) >= Math.abs(rayDir.x) && Math.abs(rayDir.y) >= Math.abs(rayDir.z)) {
                    nx = 0; nz = 0;
                } else {
                    nx = 0; ny = 0;
                }
            } else if (ny !== 0 && nz !== 0) {
                if (Math.abs(rayDir.y) >= Math.abs(rayDir.z)) nz = 0;
                else ny = 0;
            }

            if (nx === 0 && ny === 0 && nz === 0) {
                if (Math.abs(rayDir.y) > Math.abs(rayDir.x) && Math.abs(rayDir.y) > Math.abs(rayDir.z)) {
                    ny = rayDir.y > 0 ? -1 : 1;
                } else if (Math.abs(rayDir.x) > Math.abs(rayDir.z)) {
                    nx = rayDir.x > 0 ? -1 : 1;
                } else {
                    nz = rayDir.z > 0 ? -1 : 1;
                }
            }

            const normal = new THREE.Vector3(Math.sign(nx), Math.sign(ny), Math.sign(nz));
            return {
                x: curX,
                y: curY,
                z: curZ,
                block: blk,
                normal: normal,
                dist: t
            };
        }

        prevX = curX;
        prevY = curY;
        prevZ = curZ;
    }

    return null;
}

export function handleBlockPlacement(target, player, held, onBlockPlaced) {
    if (!target) return;
    if (!held || held.count <= 0 || !isPlaceableBlock(held.type)) return;

    const placeX = target.x + target.normal.x;
    const placeY = target.y + target.normal.y;
    const placeZ = target.z + target.normal.z;

    // Player AABB collision check
    const halfW = player.w / 2;
    const boxMin = new THREE.Vector3(player.pos.x - halfW, player.pos.y, player.pos.z - halfW);
    const boxMax = new THREE.Vector3(player.pos.x + halfW, player.pos.y + player.h, player.pos.z + halfW);

    if (
        placeX >= Math.floor(boxMin.x) && placeX <= Math.floor(boxMax.x) &&
        placeY >= Math.floor(boxMin.y) && placeY <= Math.floor(boxMax.y) &&
        placeZ >= Math.floor(boxMin.z) && placeZ <= Math.floor(boxMax.z)
    ) {
        return; // Prevents placing block inside player
    }

    playerSetBlock(placeX, placeY, placeZ, held.type);
    playSound('place');

    // Instantly rebuild dirty chunks so the placed block appears immediately on screen
    for (const key of Array.from(dirtyChunks)) {
        dirtyChunks.delete(key);
        const [cx, cz] = key.split(',').map(Number);
        rebuildChunkImmediate(cx, cz, 'full', true);
    }

    if (onBlockPlaced) onBlockPlaced(held);
}

export function handleMining(dt, target, held, scene, crackingMesh, crackingMaterials) {
    if (!target) {
        stopMining(crackingMesh);
        return;
    }

    // Target change check
    if (!miningTarget || miningTarget.x !== target.x || miningTarget.y !== target.y || miningTarget.z !== target.z) {
        miningTarget = target;
        miningTimeElapsed = 0;
        const multiplier = getToolMultiplier(held ? held.type : BLOCKS.AIR, target.block);
        const baseBreakTime = breakTimes[target.block] || 0.5;
        miningRequiredTime = Math.max(0.08, baseBreakTime / multiplier);
    }

    miningTimeElapsed += dt;

    // Hit sound
    hitSoundCooldown -= dt;
    if (hitSoundCooldown <= 0) {
        hitSoundCooldown = 0.25;
        playSound('stone');
    }

    // Mining particles
    spawnMiningParticles(target.x, target.y, target.z, target.block, 1);

    // Cracking stage (0 to 4)
    const progress = Math.min(1.0, miningTimeElapsed / miningRequiredTime);
    const stage = Math.min(4, Math.floor(progress * 5));

    if (crackingMesh) {
        crackingMesh.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
        crackingMesh.material = crackingMaterials[stage];
        crackingMesh.visible = true;
    }

    // Break block
    if (miningTimeElapsed >= miningRequiredTime) {
        breakBlock(target, scene, crackingMesh);
    }
}

export function stopMining(crackingMesh) {
    miningTarget = null;
    miningTimeElapsed = 0;
    hitSoundCooldown = 0;
    if (crackingMesh) crackingMesh.visible = false;
}

function breakBlock(target, scene, crackingMesh) {
    const minedBlock = target.block;
    playerSetBlock(target.x, target.y, target.z, BLOCKS.AIR);
    playSound('break');
    spawnMiningParticles(target.x, target.y, target.z, minedBlock, 8);

    // Instantly rebuild dirty chunks so the broken block disappears immediately
    for (const key of Array.from(dirtyChunks)) {
        dirtyChunks.delete(key);
        const [cx, cz] = key.split(',').map(Number);
        rebuildChunkImmediate(cx, cz, 'full', true);
    }

    // Determine drop yield
    let dropType = minedBlock;
    let dropCount = 1;
    if (minedBlock === BLOCKS.COAL_ORE) dropType = BLOCKS.COAL;
    else if (minedBlock === BLOCKS.GRASS) dropType = BLOCKS.DIRT;
    // The diamond block is BLOCKS.DIAMOND; the old BLOCKS.DIAMOND_ORE did not
    // exist, so diamonds never dropped anything.
    else if (minedBlock === BLOCKS.DIAMOND) dropType = BLOCKS.DIAMOND;
    else if (minedBlock === BLOCKS.LEAVES || minedBlock === BLOCKS.JUNGLE_LEAVES ||
             minedBlock === BLOCKS.SNOW_LEAVES || minedBlock === BLOCKS.BIRCH_LEAVES) {
        dropType = (Math.random() < 0.25) ? BLOCKS.STICK : BLOCKS.AIR;
    }
    else if (minedBlock === BLOCKS.TALL_GRASS || minedBlock === BLOCKS.FLOWER_RED ||
             minedBlock === BLOCKS.FLOWER_YELLOW) {
        // Grass and flowers rarely give anything back: 20% chance, nothing else.
        dropType = (Math.random() < 0.20) ? minedBlock : BLOCKS.AIR;
    }

    if (dropType !== BLOCKS.AIR) {
        const spawnPos = new THREE.Vector3(target.x + 0.5, target.y + 0.35, target.z + 0.5);
        spawnDroppedItem(scene, dropType, dropCount, spawnPos);
    }
    stopMining(crackingMesh);
}

export function dropHeldItem(held, player, camera, scene, onDrop) {
    if (!held || held.count <= 0 || held.type === BLOCKS.AIR) return;

    const dropType = held.type;
    held.count--;
    if (held.count <= 0) {
        held.type = BLOCKS.AIR;
    }

    if (onDrop) onDrop();

    playSound('pickup');

    // Spawn physical 3D drop item with forward velocity
    const spawnPos = new THREE.Vector3(player.pos.x, player.visualY + player.eye - 0.2, player.pos.z);
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y += 0.2;
    forward.normalize().multiplyScalar(4.5);

    spawnDroppedItem(scene, dropType, 1, spawnPos, forward);
}
