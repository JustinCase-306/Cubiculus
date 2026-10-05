import * as THREE from 'three';
import { Sfx } from './audio';
import { AIR, BLOCKS, blockColor, isLiquid, isSolid } from './blocks';
import { buildChunkGeometry } from './mesher';
import { getAtlasTexture, getWaterTexture, makeCloudTexture } from './textures';
import { CHUNK_SIZE, CHUNKS_X, CHUNKS_Z, WATER_LEVEL, WORLD_X, WORLD_Y, WORLD_Z, World } from './world';

const PLAYER_W = 0.6;
const PLAYER_H = 1.8;
const EYE_HEIGHT = 1.62;
const GRAVITY = 28;
const JUMP_SPEED = 8.6;
const WALK_SPEED = 4.6;
const SPRINT_SPEED = 7.4;
const FLY_SPEED = 11;
const FLY_SPRINT_SPEED = 22;
const REACH = 6;
const SAVE_KEY = 'minicraft.save.v1';

export interface GameStats {
  fps: number;
  x: number;
  y: number;
  z: number;
  flying: boolean;
  inWater: boolean;
  target: string | null;
  time: number;
  edits: number;
}

export interface EngineHooks {
  onStats(stats: GameStats): void;
  onLockChange(locked: boolean): void;
  onHotbarSelect(index: number): void;
  onHotbarScroll(delta: number): void;
  onToggleInventory(): void;
  onToast(message: string): void;
}

export interface EngineSettings {
  sensitivity: number;
  sound: boolean;
  dayCycle: boolean;
  renderDistance: number;
  fov: number;
}

interface RayHit {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
}

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  color: THREE.Color;
}

const SKY_KEYS: { t: number; sky: number; tint: number }[] = [
  { t: 0, sky: 0x88bdf2, tint: 0xffffff },
  { t: 0.22, sky: 0x9ec9f0, tint: 0xfaf4e8 },
  { t: 0.3, sky: 0xf0a267, tint: 0xffd2a8 },
  { t: 0.38, sky: 0x3a3f6b, tint: 0x8a92bd },
  { t: 0.5, sky: 0x0a1030, tint: 0x4a5687 },
  { t: 0.62, sky: 0x1c2450, tint: 0x6f79a8 },
  { t: 0.72, sky: 0xe8a878, tint: 0xf2d5b8 },
  { t: 0.82, sky: 0x8fc0ef, tint: 0xfdfdfd },
  { t: 1, sky: 0x88bdf2, tint: 0xffffff },
];

const MAX_PARTICLES = 400;

export class Engine {
  private container: HTMLElement;
  private hooks: EngineHooks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private fog: THREE.Fog;
  readonly world: World;
  readonly sfx = new Sfx();

  private opaqueMat: THREE.MeshBasicMaterial;
  private transMat: THREE.MeshBasicMaterial;
  private cloudMat: THREE.MeshBasicMaterial;
  private oceanMat: THREE.MeshBasicMaterial;
  private cloudTex: THREE.CanvasTexture;

  private chunkGroup = new THREE.Group();
  private chunkMeshes = new Map<string, { opaque?: THREE.Mesh; transparent?: THREE.Mesh }>();
  private dirtyChunks = new Set<string>();

  private highlight: THREE.LineSegments;
  private particleGeo: THREE.BufferGeometry;
  private particlePoints: THREE.Points;
  private particles: Particle[] = [];

  private position = new THREE.Vector3();
  private velocity = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private onGround = false;
  private flying = false;
  private inWater = false;
  private stepTimer = 0;
  private lastSpaceTap = 0;
  private wasInWater = false;

  private keys: Record<string, boolean> = {};
  private mouseLeft = false;
  private mouseRight = false;
  private breakCooldown = 0;
  private placeCooldown = 0;
  private touchMove = { x: 0, y: 0 };
  private touchUp = false;
  private touchDown = false;

  private locked = false;
  private raf = 0;
  private lastTime = performance.now();
  private frames = 0;
  private fpsTimer = 0;
  private fps = 60;
  private statsTimer = 0;
  private time = 0.12;
  private currentBlock = 1;
  private edits = 0;
  private idleSpin = true;
  private disposed = false;

  settings: EngineSettings = {
    sensitivity: 1,
    sound: true,
    dayCycle: false,
    renderDistance: 90,
    fov: 75,
  };

  constructor(container: HTMLElement, hooks: EngineHooks, seed = Math.floor(Math.random() * 100000)) {
    this.container = container;
    this.hooks = hooks;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x88bdf2);
    this.fog = new THREE.Fog(0x88bdf2, 24, this.settings.renderDistance);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(
      this.settings.fov,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      1000,
    );
    this.camera.rotation.order = 'YXZ';

    const atlas = getAtlasTexture();
    this.opaqueMat = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true });
    this.transMat = new THREE.MeshBasicMaterial({
      map: atlas,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.scene.add(this.chunkGroup);

    // Umgebendes Meer
    this.oceanMat = new THREE.MeshBasicMaterial({
      map: getWaterTexture(),
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    this.scene.add(this.buildOuterOcean());

    // Wolken
    this.cloudTex = makeCloudTexture();
    this.cloudTex.repeat.set(6, 6);
    this.cloudMat = new THREE.MeshBasicMaterial({
      map: this.cloudTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      fog: false,
    });
    const clouds = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), this.cloudMat);
    clouds.rotation.x = -Math.PI / 2;
    clouds.position.set(WORLD_X / 2, WORLD_Y + 26, WORLD_Z / 2);
    this.scene.add(clouds);

    // Block-Markierung
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004));
    this.highlight = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthTest: true }),
    );
    this.highlight.visible = false;
    this.scene.add(this.highlight);

    // Partikel
    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3));
    this.particleGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3));
    this.particleGeo.setDrawRange(0, 0);
    this.particlePoints = new THREE.Points(
      this.particleGeo,
      new THREE.PointsMaterial({ size: 0.13, vertexColors: true, sizeAttenuation: true }),
    );
    this.particlePoints.frustumCulled = false;
    this.scene.add(this.particlePoints);

    this.world = new World(seed);
    this.buildAllChunks();
    this.respawn();

    this.addListeners();
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.animate);
  }

  // ---------------------------------------------------------------- Aufbau

  private buildOuterOcean(): THREE.Group {
    const group = new THREE.Group();
    const y = WATER_LEVEL + 0.875;
    const far = 420;
    const quads: [number, number, number, number][] = [
      [-far, -far, WORLD_X + far, 0],
      [-far, WORLD_Z, WORLD_X + far, WORLD_Z + far],
      [-far, 0, 0, WORLD_Z],
      [WORLD_X, 0, WORLD_X + far, WORLD_Z],
    ];
    for (const [x0, z0, x1, z1] of quads) {
      const w = x1 - x0;
      const d = z1 - z0;
      const geo = new THREE.PlaneGeometry(w, d);
      geo.rotateX(-Math.PI / 2);
      geo.translate(x0 + w / 2, y, z0 + d / 2);
      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
      uv.needsUpdate = true;
      group.add(new THREE.Mesh(geo, this.oceanMat));
    }
    return group;
  }

  private chunkKey(cx: number, cz: number) {
    return `${cx},${cz}`;
  }

  private buildChunk(cx: number, cz: number) {
    const key = this.chunkKey(cx, cz);
    const existing = this.chunkMeshes.get(key);
    if (existing) {
      if (existing.opaque) {
        this.chunkGroup.remove(existing.opaque);
        existing.opaque.geometry.dispose();
      }
      if (existing.transparent) {
        this.chunkGroup.remove(existing.transparent);
        existing.transparent.geometry.dispose();
      }
    }
    const { opaque, transparent } = buildChunkGeometry(this.world, cx, cz);
    const entry: { opaque?: THREE.Mesh; transparent?: THREE.Mesh } = {};
    if (opaque) {
      const mesh = new THREE.Mesh(opaque, this.opaqueMat);
      mesh.frustumCulled = true;
      this.chunkGroup.add(mesh);
      entry.opaque = mesh;
    }
    if (transparent) {
      const mesh = new THREE.Mesh(transparent, this.transMat);
      mesh.renderOrder = 1;
      this.chunkGroup.add(mesh);
      entry.transparent = mesh;
    }
    this.chunkMeshes.set(key, entry);
  }

  private buildAllChunks() {
    for (let cz = 0; cz < CHUNKS_Z; cz++) {
      for (let cx = 0; cx < CHUNKS_X; cx++) this.buildChunk(cx, cz);
    }
  }

  private markDirty(x: number, z: number) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const add = (a: number, b: number) => {
      if (a >= 0 && b >= 0 && a < CHUNKS_X && b < CHUNKS_Z) this.dirtyChunks.add(this.chunkKey(a, b));
    };
    add(cx, cz);
    if (x % CHUNK_SIZE === 0) add(cx - 1, cz);
    if (x % CHUNK_SIZE === CHUNK_SIZE - 1) add(cx + 1, cz);
    if (z % CHUNK_SIZE === 0) add(cx, cz - 1);
    if (z % CHUNK_SIZE === CHUNK_SIZE - 1) add(cx, cz + 1);
  }

  private flushDirty() {
    if (this.dirtyChunks.size === 0) return;
    for (const key of this.dirtyChunks) {
      const [cx, cz] = key.split(',').map(Number);
      this.buildChunk(cx, cz);
    }
    this.dirtyChunks.clear();
  }

  // ------------------------------------------------------------- Listener

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyE' && this.locked) {
      e.preventDefault();
      this.exitLock();
      this.hooks.onToggleInventory();
      return;
    }
    if (!this.locked) return;
    this.keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();

    if (e.code.startsWith('Digit')) {
      const n = Number(e.code.slice(5));
      if (n >= 1 && n <= 9) this.hooks.onHotbarSelect(n - 1);
    }
    if (e.code === 'Space') {
      const now = performance.now();
      if (now - this.lastSpaceTap < 300) this.toggleFly();
      this.lastSpaceTap = now;
    }
    if (e.code === 'KeyF') this.toggleFly();
    if (e.code === 'KeyR') {
      this.respawn();
      this.hooks.onToast('Zum Spawnpunkt teleportiert');
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.locked) return;
    const s = 0.0022 * this.settings.sensitivity;
    this.yaw -= e.movementX * s;
    this.pitch -= e.movementY * s;
    this.clampPitch();
  };

  private onMouseDown = (e: MouseEvent) => {
    if (!this.locked) return;
    if (e.button === 0) {
      this.mouseLeft = true;
      this.breakCooldown = 0;
    }
    if (e.button === 2) {
      this.mouseRight = true;
      this.placeCooldown = 0;
    }
    if (e.button === 1) {
      e.preventDefault();
      this.pickBlock();
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.mouseLeft = false;
    if (e.button === 2) this.mouseRight = false;
  };

  private onWheel = (e: WheelEvent) => {
    if (!this.locked) return;
    e.preventDefault();
    this.hooks.onHotbarScroll(e.deltaY > 0 ? 1 : -1);
  };

  private onContextMenu = (e: Event) => e.preventDefault();

  private onPointerLockChange = () => {
    const locked = document.pointerLockElement === this.renderer.domElement;
    this.locked = locked;
    if (!locked) {
      this.keys = {};
      this.mouseLeft = false;
      this.mouseRight = false;
      this.touchMove.x = 0;
      this.touchMove.y = 0;
    }
    this.hooks.onLockChange(locked);
  };

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private addListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  private removeListeners() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);
  }

  private clampPitch() {
    const limit = Math.PI / 2 - 0.02;
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
  }

  // ------------------------------------------------------------ Öffentlich

  requestLock() {
    try {
      const result = this.renderer.domElement.requestPointerLock?.() as unknown as Promise<void> | undefined;
      if (result && typeof result.catch === 'function') result.catch(() => undefined);
    } catch {
      /* Pointer Lock nicht verfügbar */
    }
  }

  exitLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  isLocked() {
    return this.locked;
  }

  setSelectedBlock(id: number) {
    this.currentBlock = id;
  }

  setSettings(partial: Partial<EngineSettings>) {
    Object.assign(this.settings, partial);
    this.sfx.enabled = this.settings.sound;
    this.fog.far = this.settings.renderDistance;
    this.fog.near = Math.min(24, this.settings.renderDistance * 0.35);
    this.camera.fov = this.settings.fov;
    this.camera.updateProjectionMatrix();
  }

  setTimeOfDay(t: number) {
    this.time = ((t % 1) + 1) % 1;
  }

  getTimeOfDay() {
    return this.time;
  }

  toggleFly() {
    this.flying = !this.flying;
    if (this.flying) this.velocity.y = 0;
    this.hooks.onToast(this.flying ? 'Flugmodus an' : 'Flugmodus aus');
    if (this.settings.sound) this.sfx.click();
  }

  respawn() {
    const spawn = this.world.spawnPoint();
    this.position.set(spawn.x, spawn.y, spawn.z);
    this.velocity.set(0, 0, 0);
    this.syncCamera();
  }

  private syncCamera() {
    this.camera.position.set(this.position.x, this.position.y + EYE_HEIGHT, this.position.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  newWorld(seed = Math.floor(Math.random() * 100000)) {
    this.world.generate(seed);
    this.buildAllChunks();
    this.respawn();
    this.hooks.onToast(`Neue Welt erzeugt (Seed ${seed})`);
  }

  saveWorld(): boolean {
    try {
      const payload = JSON.stringify({
        world: this.world.serialize(),
        player: { x: this.position.x, y: this.position.y, z: this.position.z, yaw: this.yaw, pitch: this.pitch },
      });
      localStorage.setItem(SAVE_KEY, payload);
      this.hooks.onToast('Welt gespeichert');
      return true;
    } catch {
      this.hooks.onToast('Speichern fehlgeschlagen (zu groß?)');
      return false;
    }
  }

  hasSave(): boolean {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch {
      return false;
    }
  }

  loadWorld(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        this.hooks.onToast('Kein Spielstand gefunden');
        return false;
      }
      const parsed = JSON.parse(raw) as { world: string; player?: { x: number; y: number; z: number; yaw: number; pitch: number } };
      if (!this.world.deserialize(parsed.world)) {
        this.hooks.onToast('Spielstand beschädigt');
        return false;
      }
      this.buildAllChunks();
      if (parsed.player) {
        this.position.set(parsed.player.x, parsed.player.y, parsed.player.z);
        this.yaw = parsed.player.yaw;
        this.pitch = parsed.player.pitch;
        this.clampPitch();
      } else {
        this.respawn();
      }
      this.velocity.set(0, 0, 0);
      this.syncCamera();
      this.hooks.onToast('Welt geladen');
      return true;
    } catch {
      this.hooks.onToast('Laden fehlgeschlagen');
      return false;
    }
  }

  // Touch-Steuerung
  setTouchMove(x: number, y: number) {
    this.touchMove.x = x;
    this.touchMove.y = y;
  }

  touchLook(dx: number, dy: number) {
    const s = 0.0042 * this.settings.sensitivity;
    this.yaw -= dx * s;
    this.pitch -= dy * s;
    this.clampPitch();
  }

  setTouchVertical(up: boolean, down: boolean) {
    this.touchUp = up;
    this.touchDown = down;
  }

  touchBreak(active: boolean) {
    this.mouseLeft = active;
    if (active) this.breakCooldown = 0;
  }

  touchPlace(active: boolean) {
    this.mouseRight = active;
    if (active) this.placeCooldown = 0;
  }

  setTouchLocked(v: boolean) {
    this.locked = v;
    this.hooks.onLockChange(v);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.removeListeners();
    this.chunkMeshes.forEach((entry) => {
      entry.opaque?.geometry.dispose();
      entry.transparent?.geometry.dispose();
    });
    this.chunkMeshes.clear();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  // ------------------------------------------------------------- Interaktion

  private raycast(): RayHit | null {
    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);
    const stepX = dir.x > 0 ? 1 : dir.x < 0 ? -1 : 0;
    const stepY = dir.y > 0 ? 1 : dir.y < 0 ? -1 : 0;
    const stepZ = dir.z > 0 ? 1 : dir.z < 0 ? -1 : 0;
    const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;
    let tMaxX = stepX !== 0 ? (stepX > 0 ? x + 1 - origin.x : origin.x - x) * tDeltaX : Infinity;
    let tMaxY = stepY !== 0 ? (stepY > 0 ? y + 1 - origin.y : origin.y - y) * tDeltaY : Infinity;
    let tMaxZ = stepZ !== 0 ? (stepZ > 0 ? z + 1 - origin.z : origin.z - z) * tDeltaZ : Infinity;
    let nx = 0;
    let ny = 0;
    let nz = 0;
    let t = 0;

    for (let i = 0; i < 128 && t <= REACH; i++) {
      if (this.world.inBounds(x, y, z)) {
        const id = this.world.get(x, y, z);
        if (id !== AIR && !isLiquid(id)) return { x, y, z, nx, ny, nz };
      }
      if (tMaxX <= tMaxY && tMaxX <= tMaxZ) {
        x += stepX;
        t = tMaxX;
        tMaxX += tDeltaX;
        nx = -stepX;
        ny = 0;
        nz = 0;
      } else if (tMaxY <= tMaxZ) {
        y += stepY;
        t = tMaxY;
        tMaxY += tDeltaY;
        nx = 0;
        ny = -stepY;
        nz = 0;
      } else {
        z += stepZ;
        t = tMaxZ;
        tMaxZ += tDeltaZ;
        nx = 0;
        ny = 0;
        nz = -stepZ;
      }
      if (y < -2 || y > WORLD_Y + 4) break;
    }
    return null;
  }

  private pickBlock() {
    const hit = this.raycast();
    if (!hit) return;
    const id = this.world.get(hit.x, hit.y, hit.z);
    if (id !== AIR) {
      this.currentBlock = id;
      this.hooks.onToast(`${BLOCKS[id]?.name ?? 'Block'} ausgewählt`);
    }
  }

  private breakBlock() {
    const hit = this.raycast();
    if (!hit) return;
    const id = this.world.get(hit.x, hit.y, hit.z);
    const def = BLOCKS[id];
    if (!def || def.unbreakable) {
      if (def?.unbreakable) this.hooks.onToast('Grundgestein lässt sich nicht abbauen');
      return;
    }
    this.world.set(hit.x, hit.y, hit.z, AIR);
    this.markDirty(hit.x, hit.z);
    this.edits++;
    this.spawnParticles(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, id);
    if (this.settings.sound) this.sfx.break_(0.8 + Math.random() * 0.4);
  }

  private placeBlock() {
    const hit = this.raycast();
    if (!hit) return;
    const tx = hit.x + hit.nx;
    const ty = hit.y + hit.ny;
    const tz = hit.z + hit.nz;
    if (!this.world.inBounds(tx, ty, tz)) return;
    const existing = this.world.get(tx, ty, tz);
    if (existing !== AIR && !isLiquid(existing)) return;
    if (isSolid(this.currentBlock) && this.blockIntersectsPlayer(tx, ty, tz)) return;
    this.world.set(tx, ty, tz, this.currentBlock);
    this.markDirty(tx, tz);
    this.edits++;
    if (this.settings.sound) this.sfx.place(0.85 + Math.random() * 0.3);
  }

  private blockIntersectsPlayer(x: number, y: number, z: number): boolean {
    const half = PLAYER_W / 2;
    const p = this.position;
    return (
      x + 1 > p.x - half &&
      x < p.x + half &&
      y + 1 > p.y &&
      y < p.y + PLAYER_H &&
      z + 1 > p.z - half &&
      z < p.z + half
    );
  }

  private spawnParticles(x: number, y: number, z: number, blockId: number) {
    const [r, g, b] = blockColor(blockId);
    const base = new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
    for (let i = 0; i < 14; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const shade = 0.75 + Math.random() * 0.45;
      this.particles.push({
        pos: new THREE.Vector3(x + (Math.random() - 0.5) * 0.7, y + (Math.random() - 0.5) * 0.7, z + (Math.random() - 0.5) * 0.7),
        vel: new THREE.Vector3((Math.random() - 0.5) * 3.4, Math.random() * 4 + 0.6, (Math.random() - 0.5) * 3.4),
        life: 0.6 + Math.random() * 0.5,
        color: base.clone().multiplyScalar(shade),
      });
    }
  }

  private updateParticles(dt: number) {
    const posAttr = this.particleGeo.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.particleGeo.getAttribute('color') as THREE.BufferAttribute;
    let count = 0;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 16 * dt;
      p.pos.addScaledVector(p.vel, dt);
      const bx = Math.floor(p.pos.x);
      const by = Math.floor(p.pos.y);
      const bz = Math.floor(p.pos.z);
      if (this.world.isSolidAt(bx, by, bz)) {
        p.pos.y = by + 1.02;
        p.vel.set(p.vel.x * 0.4, Math.abs(p.vel.y) * 0.18, p.vel.z * 0.4);
      }
    }
    for (const p of this.particles) {
      if (count >= MAX_PARTICLES) break;
      posAttr.setXYZ(count, p.pos.x, p.pos.y, p.pos.z);
      colAttr.setXYZ(count, p.color.r, p.color.g, p.color.b);
      count++;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    this.particleGeo.setDrawRange(0, count);
  }

  // ---------------------------------------------------------------- Physik

  private moveAxis(axis: 'x' | 'y' | 'z', amount: number) {
    if (amount === 0) return;
    const p = this.position;
    p[axis] += amount;
    const half = PLAYER_W / 2;
    const eps = 0.001;
    const minX = Math.floor(p.x - half + eps);
    const maxX = Math.floor(p.x + half - eps);
    const minY = Math.floor(p.y + eps);
    const maxY = Math.floor(p.y + PLAYER_H - eps);
    const minZ = Math.floor(p.z - half + eps);
    const maxZ = Math.floor(p.z + half - eps);

    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          if (!this.world.isSolidAt(x, y, z)) continue;
          if (axis === 'x') {
            p.x = amount > 0 ? x - half - eps : x + 1 + half + eps;
            this.velocity.x = 0;
          } else if (axis === 'z') {
            p.z = amount > 0 ? z - half - eps : z + 1 + half + eps;
            this.velocity.z = 0;
          } else {
            if (amount > 0) {
              p.y = y - PLAYER_H - eps;
            } else {
              p.y = y + 1 + eps;
              this.onGround = true;
            }
            this.velocity.y = 0;
          }
          return;
        }
      }
    }
  }

  private blockAtPoint(x: number, y: number, z: number): number {
    return this.world.get(Math.floor(x), Math.floor(y), Math.floor(z));
  }

  private updatePlayer(dt: number) {
    const feet = this.blockAtPoint(this.position.x, this.position.y + 0.2, this.position.z);
    const head = this.blockAtPoint(this.position.x, this.position.y + EYE_HEIGHT, this.position.z);
    this.inWater = isLiquid(feet) || isLiquid(head);
    if (this.inWater && !this.wasInWater && this.settings.sound) this.sfx.splash();
    this.wasInWater = this.inWater;

    let mx = 0;
    let mz = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) mz += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) mz -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
    mx += this.touchMove.x;
    mz += this.touchMove.y;
    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }

    const sprint = !!(this.keys['ControlLeft'] || this.keys['ControlRight'] || this.keys['ShiftLeft'] && !this.flying);
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const forwardX = -sin;
    const forwardZ = -cos;
    const rightX = cos;
    const rightZ = -sin;

    let speed = this.flying ? (sprint ? FLY_SPRINT_SPEED : FLY_SPEED) : sprint ? SPRINT_SPEED : WALK_SPEED;
    if (this.inWater && !this.flying) speed *= 0.62;

    const targetX = (forwardX * mz + rightX * mx) * speed;
    const targetZ = (forwardZ * mz + rightZ * mx) * speed;
    const accel = this.flying ? 10 : this.onGround ? 16 : 5;
    const k = Math.min(1, accel * dt);
    this.velocity.x += (targetX - this.velocity.x) * k;
    this.velocity.z += (targetZ - this.velocity.z) * k;

    const jumpKey = this.keys['Space'] || this.touchUp;
    const downKey = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchDown;

    if (this.flying) {
      let vy = 0;
      if (jumpKey) vy += this.keys['ControlLeft'] ? FLY_SPRINT_SPEED : FLY_SPEED;
      if (downKey) vy -= this.keys['ControlLeft'] ? FLY_SPRINT_SPEED : FLY_SPEED;
      this.velocity.y += (vy - this.velocity.y) * Math.min(1, 12 * dt);
      this.onGround = false;
    } else if (this.inWater) {
      this.velocity.y -= GRAVITY * 0.22 * dt;
      if (jumpKey) this.velocity.y = 3.6;
      this.velocity.y = Math.max(this.velocity.y, -4);
      this.velocity.y *= 0.96;
    } else {
      if (jumpKey && this.onGround) {
        this.velocity.y = JUMP_SPEED;
        this.onGround = false;
      }
      this.velocity.y -= GRAVITY * dt;
      this.velocity.y = Math.max(this.velocity.y, -52);
    }

    this.onGround = false;
    this.moveAxis('y', this.velocity.y * dt);
    this.moveAxis('x', this.velocity.x * dt);
    this.moveAxis('z', this.velocity.z * dt);

    // Weltgrenzen
    const margin = PLAYER_W / 2;
    this.position.x = Math.max(margin, Math.min(WORLD_X - margin, this.position.x));
    this.position.z = Math.max(margin, Math.min(WORLD_Z - margin, this.position.z));

    if (this.position.y < -8) {
      this.respawn();
      this.hooks.onToast('Du bist gefallen – zurück zum Spawn');
    }

    // Schritt-Sounds
    const horizontal = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.onGround && horizontal > 1.5) {
      this.stepTimer -= dt * horizontal;
      if (this.stepTimer <= 0) {
        this.stepTimer = 2.6;
        if (this.settings.sound) this.sfx.step();
      }
    } else {
      this.stepTimer = 0.6;
    }

    this.camera.position.set(this.position.x, this.position.y + EYE_HEIGHT, this.position.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  private updateSky(dt: number) {
    if (this.settings.dayCycle) this.time = (this.time + dt / 210) % 1;
    let a = SKY_KEYS[0];
    let b = SKY_KEYS[SKY_KEYS.length - 1];
    for (let i = 0; i < SKY_KEYS.length - 1; i++) {
      if (this.time >= SKY_KEYS[i].t && this.time <= SKY_KEYS[i + 1].t) {
        a = SKY_KEYS[i];
        b = SKY_KEYS[i + 1];
        break;
      }
    }
    const span = Math.max(0.0001, b.t - a.t);
    const f = Math.max(0, Math.min(1, (this.time - a.t) / span));
    const sky = new THREE.Color(a.sky).lerp(new THREE.Color(b.sky), f);
    const tint = new THREE.Color(a.tint).lerp(new THREE.Color(b.tint), f);
    (this.scene.background as THREE.Color).copy(sky);
    this.fog.color.copy(sky);
    this.opaqueMat.color.copy(tint);
    this.transMat.color.copy(tint);
    this.oceanMat.color.copy(tint);
    this.cloudMat.color.copy(tint);
    this.cloudMat.opacity = 0.35 + tint.g * 0.45;
  }

  private updateHighlight() {
    const hit = this.raycast();
    if (hit) {
      this.highlight.visible = true;
      this.highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
      return BLOCKS[this.world.get(hit.x, hit.y, hit.z)]?.name ?? null;
    }
    this.highlight.visible = false;
    return null;
  }

  private animate = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.animate);
    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0.1) dt = 0.1;

    this.frames++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsTimer);
      this.frames = 0;
      this.fpsTimer = 0;
    }

    if (this.locked) {
      this.idleSpin = false;
      this.updatePlayer(dt);
    } else if (this.idleSpin) {
      // Langsame Kamerafahrt im Startmenü
      this.yaw += dt * 0.07;
      this.pitch += (-0.12 - this.pitch) * Math.min(1, dt);
      this.syncCamera();
    }
    this.updateSky(dt);
    const target = this.locked ? this.updateHighlight() : null;
    if (!this.locked) this.highlight.visible = false;

    if (this.locked) {
      this.breakCooldown -= dt;
      this.placeCooldown -= dt;
      if (this.mouseLeft && this.breakCooldown <= 0) {
        this.breakBlock();
        this.breakCooldown = 0.22;
      }
      if (this.mouseRight && this.placeCooldown <= 0) {
        this.placeBlock();
        this.placeCooldown = 0.22;
      }
    }

    this.updateParticles(dt);
    this.flushDirty();
    this.cloudTex.offset.x = (this.cloudTex.offset.x + dt * 0.0035) % 1;

    this.statsTimer += dt;
    if (this.statsTimer >= 0.2) {
      this.statsTimer = 0;
      this.hooks.onStats({
        fps: this.fps,
        x: this.position.x,
        y: this.position.y,
        z: this.position.z,
        flying: this.flying,
        inWater: this.inWater,
        target,
        time: this.time,
        edits: this.edits,
      });
    }

    this.renderer.render(this.scene, this.camera);
  };
}
