// WebMinecraft Player Physics & Voxel Collision Engine
import * as THREE from 'three';
import { BLOCKS, isSolidBlock } from './blocks.js';
import { getBlock } from './worldGen.js';

export const player = {
    pos: new THREE.Vector3(8, 45, 8),
    vel: new THREE.Vector3(),
    visualY: 45,
    w: 0.6,
    h: 1.8,
    eye: 1.6,
    crouching: false,
    grounded: false,
    inWater: false,
    stepHeight: 1.15
};

// Check if an axis-aligned bounding box overlaps any solid block
export function checkVoxelCollision(boxMin, boxMax) {
    const minX = Math.floor(boxMin.x);
    const maxX = Math.floor(boxMax.x);
    const minY = Math.floor(boxMin.y);
    const maxY = Math.floor(boxMax.y);
    const minZ = Math.floor(boxMin.z);
    const maxZ = Math.floor(boxMax.z);

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            for (let z = minZ; z <= maxZ; z++) {
                const b = getBlock(x, y, z);
                if (isSolidBlock(b)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Check if player position is submerged in water (swimming depth)
export function checkInWater(pos) {
    const headBlock = getBlock(pos.x, pos.y + 1.2, pos.z);
    const chestBlock = getBlock(pos.x, pos.y + 0.8, pos.z);
    return (headBlock === BLOCKS.WATER || chestBlock === BLOCKS.WATER);
}

// Update player physics with full collision resolution
export function updatePlayerPhysics(dt, moveDir, isJumping, isSprinting, isCrouching) {
    // Crouch handling with ceiling clearance check
    const STAND_HEIGHT = 1.8;
    const CROUCH_HEIGHT = 1.25;
    const STAND_EYE = 1.6;
    const CROUCH_EYE = 1.05;

    const halfW = player.w / 2;

    if (isCrouching) {
        player.crouching = true;
    } else if (player.crouching) {
        // Wants to stand up: check if ceiling allows standing
        const ceilingBoxMin = new THREE.Vector3(player.pos.x - halfW, player.pos.y + CROUCH_HEIGHT, player.pos.z - halfW);
        const ceilingBoxMax = new THREE.Vector3(player.pos.x + halfW, player.pos.y + STAND_HEIGHT, player.pos.z + halfW);
        if (checkVoxelCollision(ceilingBoxMin, ceilingBoxMax)) {
            // Cannot stand up due to low ceiling, remain crouched
            player.crouching = true;
        } else {
            player.crouching = false;
        }
    }

    player.h = player.crouching ? CROUCH_HEIGHT : STAND_HEIGHT;
    const targetEye = player.crouching ? CROUCH_EYE : STAND_EYE;
    player.eye += (targetEye - player.eye) * Math.min(1, dt * 14.0);

    // Water check
    player.inWater = checkInWater(player.pos);

    // Speed calculation
    let baseSpeed = 4.3;
    if (isSprinting && !player.crouching) baseSpeed = 6.6;
    if (player.crouching) baseSpeed = 2.0;
    if (player.inWater) baseSpeed = 2.8;

    // Movement acceleration
    const targetVelX = moveDir.x * baseSpeed;
    const targetVelZ = moveDir.z * baseSpeed;

    const lerpFactor = player.grounded ? 12 : 3.5;
    player.vel.x += (targetVelX - player.vel.x) * Math.min(1, dt * lerpFactor);
    player.vel.z += (targetVelZ - player.vel.z) * Math.min(1, dt * lerpFactor);

    // Gravity & vertical movement
    if (player.inWater) {
        if (isJumping) {
            player.vel.y = 2.8; // Swim up
        } else if (player.crouching) {
            player.vel.y = -2.8; // Dive down
        } else {
            // Gentle buoyancy
            player.vel.y += (0.2 - player.vel.y) * Math.min(1, dt * 5.0);
        }
    } else {
        // Airborne gravity
        player.vel.y -= 26.0 * dt;
        if (player.vel.y < -40) player.vel.y = -40; // Terminal velocity

        if (isJumping && player.grounded) {
            player.vel.y = player.crouching ? 7.2 : 8.5; // Jump impulse
            player.grounded = false;
        }
    }

    // Step-by-step collision resolution on each axis
    // 1. Move Y (Vertical)
    player.pos.y += player.vel.y * dt;
    const boxMinY = new THREE.Vector3(player.pos.x - halfW, player.pos.y, player.pos.z - halfW);
    const boxMaxY = new THREE.Vector3(player.pos.x + halfW, player.pos.y + player.h, player.pos.z + halfW);

    if (checkVoxelCollision(boxMinY, boxMaxY)) {
        if (player.vel.y < 0) {
            // Landed on ground
            player.pos.y = Math.floor(player.pos.y) + 1.0;
            player.grounded = true;
            player.vel.y = 0;
        } else if (player.vel.y > 0) {
            // Hit ceiling
            player.pos.y = Math.floor(player.pos.y + player.h) - player.h - 0.01;
            player.vel.y = 0;
        }
    } else {
        player.grounded = false;
    }

    // 2. Move X (Horizontal) with Step-Up Auto-Jump
    const oldX = player.pos.x;
    player.pos.x += player.vel.x * dt;
    const boxMinX = new THREE.Vector3(player.pos.x - halfW, player.pos.y, player.pos.z - halfW);
    const boxMaxX = new THREE.Vector3(player.pos.x + halfW, player.pos.y + player.h, player.pos.z + halfW);

    if (checkVoxelCollision(boxMinX, boxMaxX)) {
        // Attempt stepping up if grounded
        let stepped = false;
        if (player.grounded) {
            const stepUpMin = new THREE.Vector3(player.pos.x - halfW, player.pos.y + player.stepHeight, player.pos.z - halfW);
            const stepUpMax = new THREE.Vector3(player.pos.x + halfW, player.pos.y + player.h + player.stepHeight, player.pos.z + halfW);
            if (!checkVoxelCollision(stepUpMin, stepUpMax)) {
                player.pos.y += player.stepHeight;
                stepped = true;
            }
        }
        if (!stepped) {
            player.pos.x = oldX;
            player.vel.x = 0;
        }
    }

    // 3. Move Z (Horizontal) with Step-Up Auto-Jump
    const oldZ = player.pos.z;
    player.pos.z += player.vel.z * dt;
    const boxMinZ = new THREE.Vector3(player.pos.x - halfW, player.pos.y, player.pos.z - halfW);
    const boxMaxZ = new THREE.Vector3(player.pos.x + halfW, player.pos.y + player.h, player.pos.z + halfW);

    if (checkVoxelCollision(boxMinZ, boxMaxZ)) {
        let stepped = false;
        if (player.grounded) {
            const stepUpMin = new THREE.Vector3(player.pos.x - halfW, player.pos.y + player.stepHeight, player.pos.z - halfW);
            const stepUpMax = new THREE.Vector3(player.pos.x + halfW, player.pos.y + player.h + player.stepHeight, player.pos.z + halfW);
            if (!checkVoxelCollision(stepUpMin, stepUpMax)) {
                player.pos.y += player.stepHeight;
                stepped = true;
            }
        }
        if (!stepped) {
            player.pos.z = oldZ;
            player.vel.z = 0;
        }
    }

    // Camera smoothing for steps
    player.visualY += (player.pos.y - player.visualY) * Math.min(1, dt * 25.0);

    // Fall safety: respawn if fallen into void
    if (player.pos.y < -10) {
        player.pos.set(8, 45, 8);
        player.vel.set(0, 0, 0);
        player.visualY = 45;
    }
}
