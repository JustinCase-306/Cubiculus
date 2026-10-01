// WebMinecraft 3D Physical Dropped Items System
// Spawns spinning, bobbing 3D items with gravity, voxel collisions, and player magnetic pickup.

import * as THREE from 'three';
import { BLOCKS, blockNames } from './blocks.js';
import { getAtlasTexture, getTileUV, BLOCK_FACES, TILES } from './textures.js';
import { getBlock } from './worldGen.js';
import { addItemToInventory } from './inventory.js';
import { playSound } from './audio.js';

export const activeDroppedItems = [];

// Shared item box geometry (0.28 scale mini block)
const itemBoxGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
const itemPlaneGeo = new THREE.PlaneGeometry(0.32, 0.32);

// Reusable vector objects to avoid GC churn
const _tempVec = new THREE.Vector3();

export function spawnDroppedItem(scene, type, count = 1, position, initialVel = null, pickupDelay = 0.5) {
    if (!scene || !type || type === BLOCKS.AIR || count <= 0) return null;

    const group = new THREE.Group();
    group.position.copy(position);

    const atlas = getAtlasTexture();
    
    // Check if it's a flat tool / item (Stick, Ingot, Pickaxe, Sword, Coal)
    const isFlatItem = (
        type === BLOCKS.STICK ||
        type === BLOCKS.TALL_GRASS ||
        type === BLOCKS.FLOWER_RED ||
        type === BLOCKS.FLOWER_YELLOW ||
        type === BLOCKS.IRON_INGOT ||
        type === BLOCKS.GOLD_INGOT ||
        type === BLOCKS.COAL ||
        type === BLOCKS.WOOD_PICKAXE ||
        type === BLOCKS.STONE_PICKAXE ||
        type === BLOCKS.IRON_PICKAXE ||
        type === BLOCKS.GOLD_PICKAXE ||
        type === BLOCKS.DIAMOND_PICKAXE ||
        type === BLOCKS.WOOD_SWORD ||
        type === BLOCKS.STONE_SWORD ||
        type === BLOCKS.IRON_SWORD ||
        type === BLOCKS.GOLD_SWORD ||
        type === BLOCKS.DIAMOND_SWORD
    );

    let mesh;

    if (isFlatItem) {
        // Draw 2D canvas texture for the item
        const itemCanvas = document.createElement('canvas');
        itemCanvas.width = 16;
        itemCanvas.height = 16;
        const ctx = itemCanvas.getContext('2d');
        
        const itemTex = new THREE.CanvasTexture(itemCanvas);

        // Draw into the canvas and flag the texture. Referencing itemTex AFTER
        // its declaration avoids the temporal-dead-zone error that made the
        // update never run, leaving the quad empty (black).
        import('./textures.js').then(module => {
            module.draw2DIcon(itemCanvas, type);
            itemTex.needsUpdate = true;
        }).catch(() => {
            // Atlas unavailable: paint a simple silhouette rather than black.
            ctx.clearRect(0, 0, 16, 16);
            ctx.fillStyle = '#7fae4e';
            ctx.fillRect(7, 4, 2, 11);
            itemTex.needsUpdate = true;
        });
        itemTex.magFilter = THREE.NearestFilter;
        itemTex.minFilter = THREE.NearestFilter;

        const mat = new THREE.MeshLambertMaterial({
            map: itemTex,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide
        });

        mesh = new THREE.Mesh(itemPlaneGeo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    } else {
        // 3D Voxel block representation with custom face UV mapping from the atlas
        const faces = BLOCK_FACES[type] || [TILES.STONE, TILES.STONE, TILES.STONE, TILES.STONE, TILES.STONE, TILES.STONE];
        const geo = itemBoxGeo.clone();
        
        // Generate UV attributes matching the block faces
        const uvAttr = geo.attributes.uv;
        // 6 faces * 4 vertices = 24 vertices
        // Face order in Three.js BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
        for (let f = 0; f < 6; f++) {
            const tileIdx = faces[f] !== undefined ? faces[f] : TILES.STONE;
            const [u0, v0, u1, v1] = getTileUV(tileIdx);
            
            const baseIdx = f * 4;
            // Vertices 0, 1, 2, 3 of each face
            uvAttr.setXY(baseIdx + 0, u0, v1);
            uvAttr.setXY(baseIdx + 1, u1, v1);
            uvAttr.setXY(baseIdx + 2, u0, v0);
            uvAttr.setXY(baseIdx + 3, u1, v0);
        }
        uvAttr.needsUpdate = true;

        const mat = new THREE.MeshLambertMaterial({
            map: atlas,
            transparent: type === BLOCKS.GLASS || type === BLOCKS.WATER || type === BLOCKS.LEAVES,
            alphaTest: (type === BLOCKS.LEAVES || type === BLOCKS.JUNGLE_LEAVES || type === BLOCKS.SNOW_LEAVES) ? 0.2 : 0.0
        });

        mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }

    scene.add(group);

    const defaultVel = initialVel || new THREE.Vector3(
        (Math.random() - 0.5) * 1.6,
        2.8 + Math.random() * 0.8,
        (Math.random() - 0.5) * 1.6
    );

    const itemEntity = {
        type: type,
        count: count,
        mesh: group,
        innerMesh: mesh,
        vel: defaultVel,
        age: Math.random() * 10,
        pickupDelay: pickupDelay, // Delay before player can pick up
        onGround: false
    };

    activeDroppedItems.push(itemEntity);
    return itemEntity;
}

export function updateDroppedItems(scene, dt, playerPos) {
    if (!scene || activeDroppedItems.length === 0) return;

    const gravity = 16.0;
    const playerChestY = playerPos.y + 0.8;

    for (let i = activeDroppedItems.length - 1; i >= 0; i--) {
        const item = activeDroppedItems[i];
        item.age += dt;
        if (item.pickupDelay > 0) {
            item.pickupDelay -= dt;
        }

        // 1. Rotation and Bobbing
        item.innerMesh.rotation.y += dt * 2.2;
        const bobOffset = Math.sin(item.age * 3.5) * 0.06;

        // 2. Physics & Floor Collision
        if (!item.onGround) {
            item.vel.y -= gravity * dt;
            item.mesh.position.x += item.vel.x * dt;
            item.mesh.position.z += item.vel.z * dt;
            item.mesh.position.y += item.vel.y * dt;

            // Horizontal drag
            item.vel.x *= Math.max(0, 1.0 - dt * 2.5);
            item.vel.z *= Math.max(0, 1.0 - dt * 2.5);

            // Ground voxel collision check
            const checkX = Math.floor(item.mesh.position.x);
            const checkY = Math.floor(item.mesh.position.y - 0.15);
            const checkZ = Math.floor(item.mesh.position.z);
            const groundBlock = getBlock(checkX, checkY, checkZ);

            if (groundBlock !== BLOCKS.AIR && groundBlock !== BLOCKS.WATER) {
                // Landed on block surface
                item.mesh.position.y = checkY + 1.15;
                item.vel.set(0, 0, 0);
                item.onGround = true;
            }
        } else {
            // Apply slight bobbing while resting on ground
            const checkX = Math.floor(item.mesh.position.x);
            const checkY = Math.floor(item.mesh.position.y - 0.3);
            const checkZ = Math.floor(item.mesh.position.z);
            const blockBelow = getBlock(checkX, checkY, checkZ);
            
            // Check if block beneath was mined away
            if (blockBelow === BLOCKS.AIR) {
                item.onGround = false;
            } else {
                item.innerMesh.position.y = bobOffset;
            }
        }

        // 3. Player Pickup Magnetism
        const dx = playerPos.x - item.mesh.position.x;
        const dy = playerChestY - item.mesh.position.y;
        const dz = playerPos.z - item.mesh.position.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (item.pickupDelay <= 0) {
            // Magnet radius: ~2.0 blocks
            if (distSq < 4.0) {
                const dist = Math.sqrt(distSq);
                const magnetSpeed = Math.max(4.0, (2.0 - dist) * 10.0);
                item.mesh.position.x += (dx / dist) * magnetSpeed * dt;
                item.mesh.position.y += (dy / dist) * magnetSpeed * dt;
                item.mesh.position.z += (dz / dist) * magnetSpeed * dt;
                item.onGround = false;
            }

            // Pickup touch radius: 0.65 blocks
            if (distSq < 0.55) {
                // addItemToInventory returns how many were ACTUALLY inserted, so a
                // full inventory takes a partial stack instead of re-adding the whole
                // pile on the next frame (which duplicated items).
                const added = addItemToInventory(item.type, item.count);
                if (added > 0) {
                    playSound('pickup');
                    showPickupToast(item.type, added);

                    item.count -= added;
                    if (item.count > 0) {
                        // Partial pickup: shrink the remaining pile and keep waiting.
                        continue;
                    }

                    // Fully picked up: remove the entity
                    scene.remove(item.mesh);
                    disposeItemGeometry(item.innerMesh);
                    activeDroppedItems.splice(i, 1);
                    continue;
                }
            }
        }
    }
}

// Flat items (stick, ingots, tools, coal) all share the module-level
// itemPlaneGeo. Disposing it would break every other flat item still on the
// ground, so only per-item geometries (block items clone itemBoxGeo) are freed.
function disposeItemGeometry(mesh) {
    if (mesh && mesh.geometry && mesh.geometry !== itemPlaneGeo && mesh.geometry !== itemBoxGeo) {
        mesh.geometry.dispose();
    }
}

export function clearAllDroppedItems(scene) {
    if (!scene) return;
    for (const item of activeDroppedItems) {
        scene.remove(item.mesh);
        disposeItemGeometry(item.innerMesh);
    }
    activeDroppedItems.length = 0;
}

// Quick HUD popup when item is picked up
function showPickupToast(type, count) {
    const name = blockNames[type] || 'Item';
    const toast = document.getElementById('pickup-toast');
    if (toast) {
        toast.innerText = `+ ${count} ${name}`;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0px)';
        
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
        }, 1600);
    }
}
