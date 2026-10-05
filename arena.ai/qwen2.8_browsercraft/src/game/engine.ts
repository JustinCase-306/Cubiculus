import * as THREE from "three";
import { sfx } from "./audio";
import { AIR, BLOCKS, DEFAULT_HOTBAR, TALLGRASS, POPPY, DANDELION, WATER, getBlock } from "./blocks";
import { makeBlockGeometry, makePlantGeometry } from "./blockgeo";
import { LAYERS, LayerKey, buildChunkGeometry, toBufferGeometry } from "./mesher";
import { cloudTexture, getAtlas, sunTexture } from "./textures";
import { CHUNK, CHUNKS_X, CHUNKS_Z, SEA, SX, SY, SZ, World } from "./world";

// Rohe sRGB-Mathematik (wie klassisches three.js) -> vorhersehbare Farben
THREE.ColorManagement.enabled = false;

export interface HudState {
  fps: number;
  x: number;
  y: number;
  z: number;
  clock: string;
  dayFactor: number;
  flying: boolean;
  underwater: boolean;
  sprinting: boolean;
  slot: number;
  hotbar: number[];
  broken: number;
  placed: number;
  locked: boolean;
  target: string;
  tris: number;
}

const DAY_LENGTH = 360; // Sekunden pro Tag
const EYE = 1.62;
const P_W = 0.6;
const P_H = 1.8;
const GRAVITY = 30;
const JUMP_V = 8.7;
const REACH = 5.2;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

interface Particle {
  p: THREE.Vector3;
  v: THREE.Vector3;
  life: number;
  max: number;
  size: number;
  c: THREE.Color;
}

/* ------------------------------------------------------------------ */

export class MiniCraft {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private world: World;
  private atlasCanvas: HTMLCanvasElement;
  private materials: Record<LayerKey, THREE.Material>;
  private chunkGroup = new THREE.Group();
  private chunkMeshes: THREE.Mesh[][] = [];
  private dirty = new Set<number>();

  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private ambient: THREE.AmbientLight;
  private skyMat!: THREE.ShaderMaterial;
  private skyDome!: THREE.Mesh;
  private stars!: THREE.Points;
  private sunMesh!: THREE.Mesh;
  private moonMesh!: THREE.Mesh;
  private celestial = new THREE.Group();
  private clouds!: THREE.Mesh;

  private highlight: THREE.LineSegments;
  private highlightGlow: THREE.Mesh;
  private handGroup = new THREE.Group();
  private handMesh: THREE.Mesh | null = null;
  private handMat: THREE.MeshLambertMaterial;

  private particles: Particle[] = [];
  private pMesh: THREE.InstancedMesh;
  private pDummy = new THREE.Object3D();
  private pColor = new THREE.Color();

  // Spieler
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  onGround = false;
  private wasGround = false;
  flying = false;
  inWater = false;
  headWater = false;
  private bob = 0;
  private stepDist = 0;
  private swing = 0;
  private sprintFov = 72;

  // Input
  private keys = new Set<string>();
  private mouseDown = [false, false, false];
  private breakTimer = 0;
  private placeTimer = 0;
  sensitivity = 0.0022;

  // Zustand
  hotbar = [...DEFAULT_HOTBAR];
  slot = 0;
  broken = 0;
  placed = 0;
  time = 0.08;
  locked = false;
  dayFactor = 1;
  disposed = false;

  private raf = 0;
  private last = performance.now();
  private fps = 60;
  private fpsAcc = 0;
  private fpsFrames = 0;
  private hudTimer = 0;
  private targetName = "";
  private hit: { x: number; y: number; z: number; nx: number; ny: number; nz: number } | null = null;

  onHud: (s: HudState) => void = () => {};
  onLock: (locked: boolean) => void = () => {};

  constructor(canvas: HTMLCanvasElement, seed: number) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.08, 900);
    this.scene.add(this.camera);

    const atlas = getAtlas();
    this.atlasCanvas = atlas.canvas;

    this.materials = {
      opaque: new THREE.MeshLambertMaterial({ map: atlas.texture, vertexColors: true }),
      cutout: new THREE.MeshLambertMaterial({
        map: atlas.texture,
        vertexColors: true,
        transparent: false,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      }),
      glass: new THREE.MeshLambertMaterial({
        map: atlas.texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      water: new THREE.MeshLambertMaterial({
        map: atlas.texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      glow: new THREE.MeshBasicMaterial({ map: atlas.texture, vertexColors: true }),
    };

    this.scene.add(this.chunkGroup);

    // --- Licht ---
    this.ambient = new THREE.AmbientLight(0xffffff, 0.26);
    this.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x6a5a44, 0.32);
    this.sun = new THREE.DirectionalLight(0xfff2d8, 0.62);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -46;
    sc.right = 46;
    sc.top = 46;
    sc.bottom = -46;
    sc.near = 1;
    sc.far = 240;
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.06;
    this.scene.add(this.sun, this.sun.target, this.ambient, this.hemi);

    this.scene.fog = new THREE.Fog(0x9dc4f0, 52, 190);

    this.buildSky();
    this.buildClouds();

    // --- Block-Markierung ---
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004));
    this.highlight = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.6, depthTest: true })
    );
    this.highlight.visible = false;
    this.highlightGlow = new THREE.Mesh(
      new THREE.BoxGeometry(1.002, 1.002, 1.002),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false })
    );
    this.highlightGlow.visible = false;
    this.scene.add(this.highlight, this.highlightGlow);

    // --- Partikel ---
    this.pMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ vertexColors: false }),
      260
    );
    this.pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.pMesh.frustumCulled = false;
    this.pMesh.count = 260;
    for (let i = 0; i < 260; i++) {
      this.particles.push({
        p: new THREE.Vector3(),
        v: new THREE.Vector3(),
        life: 0,
        max: 1,
        size: 0.1,
        c: new THREE.Color(1, 1, 1),
      });
      this.pDummy.position.set(0, -999, 0);
      this.pDummy.scale.setScalar(0.0001);
      this.pDummy.updateMatrix();
      this.pMesh.setMatrixAt(i, this.pDummy.matrix);
      this.pMesh.setColorAt(i, this.pColor.setRGB(1, 1, 1));
    }
    this.scene.add(this.pMesh);

    // --- Hand / gehaltenes Block-Viewmodel ---
    this.handMat = new THREE.MeshLambertMaterial({ map: atlas.texture, depthTest: false, transparent: true });
    this.handGroup.renderOrder = 999;
    this.camera.add(this.handGroup);
    this.updateHandMesh();

    // --- Welt ---
    this.world = new World(seed);
    this.buildAllChunks();
    this.pos.set(this.world.spawn.x, this.world.spawn.y + 1, this.world.spawn.z);
    this.yaw = Math.PI * 0.25;
    this.pitch = -0.12;

    this.bindEvents();
    this.last = performance.now();
    this.loop();
  }

  /* ---------------- Himmel, Sonne, Sterne, Wolken ---------------- */

  private buildSky() {
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x4f8fe8) },
        bottomColor: { value: new THREE.Color(0xbcd9f7) },
        sunColor: { value: new THREE.Color(0xffe6a8) },
        sunDir: { value: new THREE.Vector3(0, 1, 0) },
      },
      vertexShader: `
        varying vec3 vDir;
        void main(){
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 topColor; uniform vec3 bottomColor; uniform vec3 sunColor; uniform vec3 sunDir;
        varying vec3 vDir;
        void main(){
          float h = clamp(vDir.y * 1.15 + 0.06, 0.0, 1.0);
          vec3 c = mix(bottomColor, topColor, pow(h, 0.75));
          float s = pow(max(dot(normalize(vDir), normalize(sunDir)), 0.0), 10.0);
          c += sunColor * s * 0.55;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), this.skyMat);
    this.skyDome.renderOrder = -10;
    this.skyDome.frustumCulled = false;
    this.scene.add(this.skyDome);

    // Sterne
    const N = 700;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * 0.95 + 0.05;
      const r = 400;
      arr[i * 3] = Math.cos(u) * Math.sqrt(1 - v * v) * r;
      arr[i * 3 + 1] = v * r;
      arr[i * 3 + 2] = Math.sin(u) * Math.sqrt(1 - v * v) * r;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    this.stars = new THREE.Points(
      sg,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.6,
        sizeAttenuation: false,
        fog: false,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      })
    );
    this.stars.frustumCulled = false;
    this.celestial.add(this.stars);

    const mk = (tex: THREE.Texture, size: number) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, depthWrite: false, side: THREE.DoubleSide })
      );
      m.frustumCulled = false;
      return m;
    };
    this.sunMesh = mk(sunTexture(false), 42);
    this.moonMesh = mk(sunTexture(true), 30);
    this.sunMesh.renderOrder = -9;
    this.moonMesh.renderOrder = -9;
    this.stars.renderOrder = -9;
    this.celestial.add(this.sunMesh, this.moonMesh);
    this.scene.add(this.celestial);
  }

  private buildClouds() {
    const tex = cloudTexture();
    tex.repeat.set(5, 5);
    this.clouds = new THREE.Mesh(
      new THREE.PlaneGeometry(760, 760),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        fog: true,
        side: THREE.DoubleSide,
      })
    );
    this.clouds.rotation.x = -Math.PI / 2;
    this.clouds.position.y = 66;
    this.clouds.renderOrder = -8;
    this.scene.add(this.clouds);
  }

  /* ---------------- Chunk-Meshes ---------------- */

  private buildAllChunks() {
    for (let cz = 0; cz < CHUNKS_Z; cz++) for (let cx = 0; cx < CHUNKS_X; cx++) this.buildChunk(cx, cz);
  }

  private buildChunk(cx: number, cz: number) {
    const key = cz * CHUNKS_X + cx;
    const old = this.chunkMeshes[key];
    if (old) {
      for (const m of old) {
        this.chunkGroup.remove(m);
        m.geometry.dispose();
      }
    }
    const meshes: THREE.Mesh[] = [];
    const data = buildChunkGeometry(this.world, cx, cz);
    for (const layer of LAYERS) {
      const geo = toBufferGeometry(data[layer]);
      if (!geo) continue;
      const mesh = new THREE.Mesh(geo, this.materials[layer]);
      mesh.castShadow = layer === "opaque" || layer === "cutout" || layer === "glow";
      mesh.receiveShadow = layer !== "water";
      mesh.renderOrder = layer === "water" ? 3 : layer === "glass" ? 2 : 0;
      meshes.push(mesh);
      this.chunkGroup.add(mesh);
    }
    this.chunkMeshes[key] = meshes;
  }

  private markDirty(x: number, z: number) {
    const cx = Math.floor(x / CHUNK);
    const cz = Math.floor(z / CHUNK);
    const add = (a: number, b: number) => {
      if (a >= 0 && b >= 0 && a < CHUNKS_X && b < CHUNKS_Z) this.dirty.add(b * CHUNKS_X + a);
    };
    add(cx, cz);
    if (x % CHUNK === 0) add(cx - 1, cz);
    if (x % CHUNK === CHUNK - 1) add(cx + 1, cz);
    if (z % CHUNK === 0) add(cx, cz - 1);
    if (z % CHUNK === CHUNK - 1) add(cx, cz + 1);
  }

  private flushDirty() {
    if (!this.dirty.size) return;
    for (const key of this.dirty) {
      const cz = Math.floor(key / CHUNKS_X);
      const cx = key % CHUNKS_X;
      this.buildChunk(cx, cz);
    }
    this.dirty.clear();
  }

  /* ---------------- Events ---------------- */

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
    if (this.keys.has(e.code)) return;
    this.keys.add(e.code);

    if (e.code === "KeyF") {
      this.flying = !this.flying;
      this.vel.y = 0;
      sfx.ui(this.flying);
      this.pushHud();
    }
    if (e.code === "KeyR") this.respawn();
    if (e.code === "KeyE" && this.locked) {
      this.onInventory?.();
      document.exitPointerLock();
    }
    if (e.code.startsWith("Digit")) {
      const n = parseInt(e.code.slice(5), 10);
      if (n >= 1 && n <= 9) this.setSlot(n - 1);
    }
    if (e.code === "Escape" && this.locked) document.exitPointerLock();
  };

  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);

  private onMouseMove = (e: MouseEvent) => {
    if (!this.locked) return;
    this.yaw -= e.movementX * this.sensitivity;
    this.pitch -= e.movementY * this.sensitivity;
    this.pitch = clamp(this.pitch, -Math.PI / 2 + 0.001, Math.PI / 2 - 0.001);
    if (this.yaw > Math.PI) this.yaw -= Math.PI * 2;
    if (this.yaw < -Math.PI) this.yaw += Math.PI * 2;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (!this.locked) return;
    this.mouseDown[e.button] = true;
    if (e.button === 0) {
      this.breakBlock();
      this.breakTimer = 0.24;
      this.swing = 1;
    }
    if (e.button === 2) {
      this.placeBlock();
      this.placeTimer = 0.2;
      this.swing = 1;
    }
  };

  private onMouseUp = (e: MouseEvent) => (this.mouseDown[e.button] = false);

  private onWheel = (e: WheelEvent) => {
    if (!this.locked) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    this.setSlot((this.slot + dir + 9) % 9);
  };

  private onLockChange = () => {
    this.locked = document.pointerLockElement === this.canvas;
    this.lockRetries = 0;
    if (!this.locked) {
      this.keys.clear();
      this.mouseDown = [false, false, false];
    } else sfx.resume();
    this.onLock(this.locked);
    this.pushHud();
  };

  private onResize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private onContext = (e: Event) => e.preventDefault();

  private bindEvents() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("resize", this.onResize);
    document.addEventListener("pointerlockchange", this.onLockChange);
    document.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: true });
    this.canvas.addEventListener("contextmenu", this.onContext);
  }

  private lockRetries = 0;

  lock() {
    sfx.resume();
    if (document.pointerLockElement === this.canvas) return;
    try {
      const r = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      if (r && typeof r.catch === "function")
        r.catch(() => {
          // Browser-Sperre nach ESC: kurzer Warteaufschlag, dann erneut versuchen
          if (this.lockRetries++ < 3 && !this.disposed) window.setTimeout(() => this.lock(), 350);
        });
    } catch {
      if (this.lockRetries++ < 3 && !this.disposed) window.setTimeout(() => this.lock(), 350);
    }
  }

  onInventory: (() => void) | null = null;

  /* ---------------- Aktionen ---------------- */

  setSlot(i: number) {
    if (i === this.slot) return;
    this.slot = i;
    this.updateHandMesh();
    sfx.ui(true);
    this.pushHud();
  }

  setSlotBlock(slot: number, id: number) {
    this.hotbar[slot] = id;
    this.updateHandMesh();
    this.pushHud();
  }

  respawn() {
    this.pos.set(this.world.spawn.x, this.world.spawn.y + 1, this.world.spawn.z);
    this.vel.set(0, 0, 0);
    this.flying = false;
    sfx.ui(false);
    this.pushHud();
  }

  newWorld(seed: number) {
    this.world = new World(seed);
    this.buildAllChunks();
    this.pos.set(this.world.spawn.x, this.world.spawn.y + 1, this.world.spawn.z);
    this.vel.set(0, 0, 0);
    this.broken = 0;
    this.placed = 0;
    this.time = 0.08;
    this.pushHud();
  }

  private raycast() {
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, "YXZ"));
    const o = this.camera.position;
    let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
    const stepX = dir.x > 0 ? 1 : -1;
    const stepY = dir.y > 0 ? 1 : -1;
    const stepZ = dir.z > 0 ? 1 : -1;
    const tdx = Math.abs(1 / (dir.x || 1e-9));
    const tdy = Math.abs(1 / (dir.y || 1e-9));
    const tdz = Math.abs(1 / (dir.z || 1e-9));
    let tx = dir.x > 0 ? (x + 1 - o.x) * tdx : (o.x - x) * tdx;
    let ty = dir.y > 0 ? (y + 1 - o.y) * tdy : (o.y - y) * tdy;
    let tz = dir.z > 0 ? (z + 1 - o.z) * tdz : (o.z - z) * tdz;
    let nx = 0, ny = 0, nz = 0;
    let t = 0;
    for (let i = 0; i < 160 && t <= REACH; i++) {
      const id = this.world.get(x, y, z);
      if (id !== AIR && id !== WATER) return { x, y, z, nx, ny, nz };
      if (tx < ty && tx < tz) {
        x += stepX; t = tx; tx += tdx; nx = -stepX; ny = 0; nz = 0;
      } else if (ty < tz) {
        y += stepY; t = ty; ty += tdy; nx = 0; ny = -stepY; nz = 0;
      } else {
        z += stepZ; t = tz; tz += tdz; nx = 0; ny = 0; nz = -stepZ;
      }
    }
    return null;
  }

  private breakBlock() {
    const h = this.hit;
    if (!h) return;
    const id = this.world.get(h.x, h.y, h.z);
    const b = getBlock(id);
    if (id === AIR || id === WATER || b.unbreakable) {
      sfx.ui(false);
      return;
    }
    this.world.set(h.x, h.y, h.z, AIR);
    // Pflanzen darüber fallen lassen
    const above = this.world.get(h.x, h.y + 1, h.z);
    if (above === TALLGRASS || above === POPPY || above === DANDELION) this.world.set(h.x, h.y + 1, h.z, AIR);
    this.markDirty(h.x, h.z);
    this.spawnBurst(h.x + 0.5, h.y + 0.5, h.z + 0.5, id, 16, 3.4);
    sfx.dig(b.sound);
    this.broken++;
    this.pushHud();
  }

  private placeBlock() {
    const h = this.hit;
    if (!h) return;
    const id = this.hotbar[this.slot];
    const b = getBlock(id);
    if (!b || id === AIR) return;
    const px = h.x + h.nx, py = h.y + h.ny, pz = h.z + h.nz;
    if (!this.world.inside(px, py, pz)) return;
    const cur = this.world.get(px, py, pz);
    if (cur !== AIR && cur !== WATER && cur !== TALLGRASS && cur !== POPPY && cur !== DANDELION) return;
    if (b.solid && this.intersectsPlayer(px, py, pz)) {
      sfx.ui(false);
      return;
    }
    this.world.set(px, py, pz, id);
    this.markDirty(px, pz);
    this.spawnBurst(px + 0.5, py + 0.5, pz + 0.5, id, 6, 1.6);
    sfx.place(b.sound);
    this.placed++;
    this.pushHud();
  }

  private intersectsPlayer(bx: number, by: number, bz: number) {
    const minX = this.pos.x - P_W / 2, maxX = this.pos.x + P_W / 2;
    const minY = this.pos.y, maxY = this.pos.y + P_H;
    const minZ = this.pos.z - P_W / 2, maxZ = this.pos.z + P_W / 2;
    return maxX > bx && minX < bx + 1 && maxY > by && minY < by + 1 && maxZ > bz && minZ < bz + 1;
  }

  /* ---------------- Partikel ---------------- */

  private tileColor(id: number) {
    const b = getBlock(id);
    const tile = b.tiles.side ?? b.tiles.top;
    const col = tile === undefined ? b.tiles.top : tile;
    return this.averageColor(col);
  }

  private colorCache = new Map<number, THREE.Color>();
  private averageColor(tile: number) {
    const cached = this.colorCache.get(tile);
    if (cached) return cached;
    const ctx = this.atlasCanvas.getContext("2d")!;
    const tx = (tile % 8) * 16;
    const ty = ((tile / 8) | 0) * 16;
    const d = ctx.getImageData(tx, ty, 16, 16).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 40) continue;
      r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
    }
    const c = new THREE.Color((r / n / 255) || 1, (g / n / 255) || 1, (b / n / 255) || 1);
    this.colorCache.set(tile, c);
    return c;
  }

  private spawnBurst(x: number, y: number, z: number, id: number, count: number, power: number) {
    const base = this.tileColor(id);
    let spawned = 0;
    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const p = this.particles[i];
      if (p.life > 0) continue;
      p.p.set(x + (Math.random() - 0.5) * 0.8, y + (Math.random() - 0.5) * 0.8, z + (Math.random() - 0.5) * 0.8);
      p.v.set((Math.random() - 0.5) * power, Math.random() * power * 0.9 + 1.2, (Math.random() - 0.5) * power);
      p.max = 0.55 + Math.random() * 0.6;
      p.life = p.max;
      p.size = 0.07 + Math.random() * 0.09;
      const j = 0.82 + Math.random() * 0.36;
      p.c.setRGB(clamp(base.r * j, 0, 1), clamp(base.g * j, 0, 1), clamp(base.b * j, 0, 1));
      spawned++;
    }
  }

  private updateParticles(dt: number) {
    let any = false;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.life <= 0) {
        this.pDummy.position.set(0, -999, 0);
        this.pDummy.scale.setScalar(0.0001);
        this.pDummy.rotation.set(0, 0, 0);
        this.pDummy.updateMatrix();
        this.pMesh.setMatrixAt(i, this.pDummy.matrix);
        continue;
      }
      any = true;
      p.life -= dt;
      p.v.y -= 24 * dt;
      const nx = p.p.x + p.v.x * dt;
      const ny = p.p.y + p.v.y * dt;
      const nz = p.p.z + p.v.z * dt;
      if (this.world.isSolid(Math.floor(nx), Math.floor(p.p.y), Math.floor(p.p.z))) { p.v.x *= -0.35; } else p.p.x = nx;
      if (this.world.isSolid(Math.floor(p.p.x), Math.floor(ny), Math.floor(p.p.z))) {
        p.v.y *= -0.28;
        p.v.x *= 0.72;
        p.v.z *= 0.72;
      } else p.p.y = ny;
      if (this.world.isSolid(Math.floor(p.p.x), Math.floor(p.p.y), Math.floor(nz))) { p.v.z *= -0.35; } else p.p.z = nz;

      const k = clamp(p.life / p.max, 0, 1);
      this.pDummy.position.copy(p.p);
      this.pDummy.scale.setScalar(p.size * (0.35 + k * 0.65));
      this.pDummy.rotation.set(p.life * 4 + i, p.life * 3, 0);
      this.pDummy.updateMatrix();
      this.pMesh.setMatrixAt(i, this.pDummy.matrix);
      this.pMesh.setColorAt(i, p.c);
    }
    if (any) {
      this.pMesh.instanceMatrix.needsUpdate = true;
      if (this.pMesh.instanceColor) this.pMesh.instanceColor.needsUpdate = true;
    }
  }

  /* ---------------- Hand-Viewmodel ---------------- */

  private updateHandMesh() {
    if (this.handMesh) {
      this.handGroup.remove(this.handMesh);
      this.handMesh.geometry.dispose();
      (this.handMesh.material as THREE.Material).dispose();
      this.handMesh = null;
    }
    const id = this.hotbar[this.slot];
    const b = getBlock(id);
    if (!b || id === AIR) return;

    const geo = b.layer === "cross" ? makePlantGeometry(id, 0.44) : makeBlockGeometry(id, 0.34);
    let mat: THREE.Material;
    if (b.layer === "glow") {
      mat = new THREE.MeshBasicMaterial({ map: this.handMat.map, depthTest: false });
    } else {
      const m = this.handMat.clone();
      m.alphaTest = b.layer === "cross" || b.layer === "cutout" ? 0.5 : 0;
      m.transparent = b.layer === "glass";
      m.side = b.layer === "cross" ? THREE.DoubleSide : THREE.FrontSide;
      mat = m;
    }
    this.handMesh = new THREE.Mesh(geo, mat);
    this.handMesh.renderOrder = 999;
    this.handMesh.position.set(0.46, -0.36, -0.62);
    this.handMesh.rotation.set(0.12, -0.62, 0.16);
    this.handGroup.add(this.handMesh);
  }

  /* ---------------- Physik ---------------- */

  /** Automatisch auf einen Block hochsteigen (wie Auto-Jump) */
  private stepUp(axis: "x" | "z", delta: number): boolean {
    if (this.flying || !this.wasGround || this.inWater) return false;
    const savedY = this.pos.y;
    for (const rise of [0.3, 0.62, 0.9, 1.06]) {
      this.pos.y = savedY + rise;
      this.pos[axis] += delta;
      if (!this.hits()) return true;
      this.pos[axis] -= delta;
    }
    this.pos.y = savedY;
    return false;
  }

  private collide(dx: number, dy: number, dz: number) {
    const w = P_W / 2;
    // X
    if (dx !== 0) {
      const v = this.vel.x;
      this.pos.x += dx;
      if (this.hits()) {
        this.pos.x = dx > 0 ? Math.floor(this.pos.x + w) - w - 1e-4 : Math.floor(this.pos.x - w) + 1 + w + 1e-4;
        this.vel.x = this.stepUp("x", dx) ? v : 0;
      }
    }
    // Z
    if (dz !== 0) {
      const v = this.vel.z;
      this.pos.z += dz;
      if (this.hits()) {
        this.pos.z = dz > 0 ? Math.floor(this.pos.z + w) - w - 1e-4 : Math.floor(this.pos.z - w) + 1 + w + 1e-4;
        this.vel.z = this.stepUp("z", dz) ? v : 0;
      }
    }
    // Y
    if (dy !== 0) {
      this.pos.y += dy;
      if (this.hits()) {
        if (dy < 0) {
          const impact = Math.abs(this.vel.y);
          this.pos.y = Math.floor(this.pos.y) + 1 + 1e-4;
          if (!this.onGround && impact > 6 && !this.flying) sfx.land(impact);
          this.onGround = true;
        } else {
          this.pos.y = Math.floor(this.pos.y + P_H) - P_H - 1e-4;
        }
        this.vel.y = 0;
      } else if (dy < 0) this.onGround = false;
    }
  }

  private hits() {
    const w = P_W / 2;
    const minX = Math.floor(this.pos.x - w), maxX = Math.floor(this.pos.x + w);
    const minY = Math.floor(this.pos.y), maxY = Math.floor(this.pos.y + P_H);
    const minZ = Math.floor(this.pos.z - w), maxZ = Math.floor(this.pos.z + w);
    for (let y = minY; y <= maxY; y++)
      for (let z = minZ; z <= maxZ; z++)
        for (let x = minX; x <= maxX; x++) if (this.world.isSolid(x, y, z)) return true;
    return false;
  }

  private blockAt(px: number, py: number, pz: number) {
    return this.world.get(Math.floor(px), Math.floor(py), Math.floor(pz));
  }

  private updatePlayer(dt: number) {
    const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    let fwd = (this.keys.has("KeyW") ? 1 : 0) - (this.keys.has("KeyS") ? 1 : 0);
    let str = (this.keys.has("KeyD") ? 1 : 0) - (this.keys.has("KeyA") ? 1 : 0);
    const len = Math.hypot(fwd, str);
    if (len > 0) { fwd /= len; str /= len; }

    const feet = this.blockAt(this.pos.x, this.pos.y + 0.35, this.pos.z);
    const head = this.blockAt(this.pos.x, this.pos.y + EYE, this.pos.z);
    const wasWater = this.inWater;
    this.inWater = feet === WATER;
    this.headWater = head === WATER;
    if (this.inWater && !wasWater && Math.abs(this.vel.y) > 3) sfx.splash();

    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    // Vorwärts = -Z der Kamera
    const wishX = fwd * -sin + str * cos;
    const wishZ = fwd * -cos + str * -sin;

    let speed = this.flying ? (sprint ? 21 : 10.5) : sprint ? 6.6 : 4.6;
    if (this.inWater && !this.flying) speed *= 0.58;

    const accel = this.onGround || this.flying ? 16 : 5.5;
    this.vel.x += (wishX * speed - this.vel.x) * clamp(accel * dt, 0, 1);
    this.vel.z += (wishZ * speed - this.vel.z) * clamp(accel * dt, 0, 1);

    if (this.flying) {
      let vy = 0;
      if (this.keys.has("Space")) vy += speed * 0.75;
      if (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")) vy -= speed * 0.75;
      this.vel.y += (vy - this.vel.y) * clamp(14 * dt, 0, 1);
    } else if (this.inWater) {
      this.vel.y -= 9 * dt;
      if (this.keys.has("Space")) this.vel.y = 3.6;
      this.vel.y = clamp(this.vel.y, -3.4, 4.2);
    } else {
      this.vel.y -= GRAVITY * dt;
      this.vel.y = Math.max(this.vel.y, -52);
      if (this.keys.has("Space") && this.onGround) {
        this.vel.y = JUMP_V;
        this.onGround = false;
        sfx.jump();
      }
    }

    // in Teilschritten bewegen (Anti-Tunneling)
    const steps = Math.max(1, Math.ceil((Math.max(Math.abs(this.vel.x), Math.abs(this.vel.y), Math.abs(this.vel.z)) * dt) / 0.35));
    const sdt = dt / steps;
    this.onGround = false;
    for (let i = 0; i < steps; i++) this.collide(this.vel.x * sdt, this.vel.y * sdt, this.vel.z * sdt);

    // Bodentest (damit onGround stabil bleibt)
    const saved = this.pos.y;
    this.pos.y -= 0.06;
    if (this.hits()) this.onGround = true;
    this.pos.y = saved;
    this.wasGround = this.onGround;

    // Schritte & Kamera-Wackeln
    const hspeed = Math.hypot(this.vel.x, this.vel.z);
    if (this.onGround && hspeed > 0.6) {
      this.stepDist += hspeed * dt;
      this.bob += hspeed * dt * 1.5;
      if (this.stepDist > 2.1) {
        this.stepDist = 0;
        const ground = this.blockAt(this.pos.x, this.pos.y - 0.2, this.pos.z);
        sfx.step(getBlock(ground).sound === "stone" ? "dirt" : getBlock(ground).sound);
      }
    } else this.bob += dt * 0.6;

    // Grenzen & Leere
    this.pos.x = clamp(this.pos.x, 0.4, SX - 0.4);
    this.pos.z = clamp(this.pos.z, 0.4, SZ - 0.4);
    if (this.pos.y < -6) this.respawn();
    if (this.pos.y > SY + 40) { this.pos.y = SY + 40; this.vel.y = 0; }

    // FOV
    const targetFov = 72 + (sprint && hspeed > 5 ? 6 : 0) + (this.flying ? 4 : 0) + (this.inWater ? -4 : 0);
    this.sprintFov += (targetFov - this.sprintFov) * clamp(6 * dt, 0, 1);
    this.camera.fov = this.sprintFov;
    this.camera.updateProjectionMatrix();
  }

  /* ---------------- Tag / Nacht ---------------- */

  private updateSky(dt: number) {
    this.time = (this.time + dt / DAY_LENGTH) % 1;
    const ang = this.time * Math.PI * 2;
    const sunDir = new THREE.Vector3(Math.cos(ang) * 0.72, Math.sin(ang), 0.34).normalize();
    this.dayFactor = clamp(sunDir.y * 2.6 + 0.42, 0, 1);
    const dusk = clamp(1 - Math.abs(sunDir.y) * 3.4, 0, 1);

    const dayTop = new THREE.Color(0x4d90e8), dayBot = new THREE.Color(0xbcd9f7);
    const nightTop = new THREE.Color(0x04060f), nightBot = new THREE.Color(0x131f3d);
    const duskTop = new THREE.Color(0x3b4a86), duskBot = new THREE.Color(0xf08a45);

    const top = nightTop.clone().lerp(dayTop, this.dayFactor).lerp(duskTop, dusk * 0.55);
    const bot = nightBot.clone().lerp(dayBot, this.dayFactor).lerp(duskBot, dusk * 0.7);

    (this.skyMat.uniforms.topColor.value as THREE.Color).copy(top);
    (this.skyMat.uniforms.bottomColor.value as THREE.Color).copy(bot);
    (this.skyMat.uniforms.sunDir.value as THREE.Vector3).copy(sunDir);
    (this.skyMat.uniforms.sunColor.value as THREE.Color).setRGB(1, 0.72 + dusk * 0.1, 0.45);

    const fogCol = bot.clone().lerp(top, 0.25);
    (this.scene.fog as THREE.Fog).color.copy(fogCol);
    this.renderer.setClearColor(fogCol, 1);

    this.sun.color.setRGB(1, 0.94 - dusk * 0.28, 0.84 - dusk * 0.45);
    this.sun.intensity = 0.09 + this.dayFactor * 0.53;
    this.hemi.intensity = 0.055 + this.dayFactor * 0.265;
    this.hemi.color.copy(top);
    this.ambient.intensity = 0.13 + this.dayFactor * 0.13;

    // Licht folgt dem Spieler
    const p = this.pos;
    this.sun.position.set(p.x + sunDir.x * 90, p.y + sunDir.y * 90, p.z + sunDir.z * 90);
    this.sun.target.position.set(p.x, p.y, p.z);
    this.sun.target.updateMatrixWorld();
    this.sun.visible = this.sun.intensity > 0.02;

    this.celestial.position.copy(this.camera.position);
    this.skyDome.position.copy(this.camera.position);
    this.sunMesh.position.copy(sunDir).multiplyScalar(360);
    this.moonMesh.position.copy(sunDir).multiplyScalar(-360);
    this.sunMesh.quaternion.copy(this.camera.quaternion);
    this.moonMesh.quaternion.copy(this.camera.quaternion);
    this.sunMesh.visible = sunDir.y > -0.25;
    this.moonMesh.visible = sunDir.y < 0.25;
    this.stars.rotation.y = ang * 0.5;
    (this.stars.material as THREE.PointsMaterial).opacity = clamp(1 - this.dayFactor * 1.6, 0, 1) * 0.9;

    this.clouds.position.set(this.camera.position.x, 66, this.camera.position.z);
    const m = this.clouds.material as THREE.MeshBasicMaterial;
    if (m.map) {
      m.map.offset.x = (performance.now() * 0.0000045) % 1;
      m.map.offset.y = (performance.now() * 0.0000021) % 1;
    }
    m.opacity = 0.2 + this.dayFactor * 0.45;
    m.color.setRGB(0.55 + this.dayFactor * 0.45, 0.58 + this.dayFactor * 0.42, 0.7 + this.dayFactor * 0.3);

    // Unterwasser
    if (this.headWater) {
      (this.scene.fog as THREE.Fog).color.setHex(0x1d4f8c);
      (this.scene.fog as THREE.Fog).near = 0.1;
      (this.scene.fog as THREE.Fog).far = 26;
    } else {
      (this.scene.fog as THREE.Fog).near = 52;
      (this.scene.fog as THREE.Fog).far = 190;
    }
  }

  clockLabel() {
    const hours = (this.time * 24 + 6) % 24;
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  /* ---------------- HUD ---------------- */

  private pushHud() {
    let tris = 0;
    for (const arr of this.chunkMeshes) if (arr) for (const m of arr) tris += (m.geometry.index?.count ?? 0) / 3;
    this.onHud({
      fps: Math.round(this.fps),
      x: this.pos.x,
      y: this.pos.y,
      z: this.pos.z,
      clock: this.clockLabel(),
      dayFactor: this.dayFactor,
      flying: this.flying,
      underwater: this.headWater,
      sprinting: this.keys.has("ShiftLeft") || this.keys.has("ShiftRight"),
      slot: this.slot,
      hotbar: [...this.hotbar],
      broken: this.broken,
      placed: this.placed,
      locked: this.locked,
      target: this.targetName,
      tris: Math.round(tris),
    });
  }

  /* ---------------- Hauptloop ---------------- */

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.12) dt = 0.12;

    this.fpsAcc += dt;
    this.fpsFrames++;
    if (this.fpsAcc > 0.4) {
      this.fps = this.fpsFrames / this.fpsAcc;
      this.fpsAcc = 0;
      this.fpsFrames = 0;
    }

    if (this.locked) {
      this.updatePlayer(dt);
      this.breakTimer -= dt;
      this.placeTimer -= dt;
      if (this.mouseDown[0] && this.breakTimer <= 0) {
        this.breakBlock();
        this.breakTimer = 0.22;
        this.swing = 1;
      }
      if (this.mouseDown[2] && this.placeTimer <= 0) {
        this.placeBlock();
        this.placeTimer = 0.2;
        this.swing = 1;
      }
    } else {
      this.vel.multiplyScalar(0.86);
    }

    this.flushDirty();

    // Kamera
    const bobAmt = this.onGround && !this.flying ? Math.min(1, Math.hypot(this.vel.x, this.vel.z) / 5) : 0;
    const eye = EYE + Math.sin(this.bob * 2) * 0.055 * bobAmt;
    this.camera.position.set(
      this.pos.x + Math.cos(this.bob) * 0.035 * bobAmt,
      this.pos.y + eye,
      this.pos.z
    );
    this.camera.rotation.set(this.pitch, this.yaw, Math.cos(this.bob * 2) * 0.014 * bobAmt, "YXZ");

    // Hand-Animation
    if (this.handMesh) {
      this.swing = Math.max(0, this.swing - dt * 4.6);
      const s = Math.sin((1 - this.swing) * Math.PI);
      const sw = this.swing > 0 ? s : 0;
      this.handMesh.position.set(
        0.46 - sw * 0.1,
        -0.36 - sw * 0.16 + Math.sin(this.bob * 2) * 0.018 * bobAmt,
        -0.62 - sw * 0.1
      );
      this.handMesh.rotation.set(0.12 + sw * 0.9, -0.62 + sw * 0.35, 0.16 - sw * 0.4);
    }

    // Ziel-Block
    this.hit = this.locked ? this.raycast() : null;
    if (this.hit) {
      const id = this.world.get(this.hit.x, this.hit.y, this.hit.z);
      this.targetName = getBlock(id).name;
      this.highlight.visible = true;
      this.highlightGlow.visible = true;
      this.highlight.position.set(this.hit.x + 0.5, this.hit.y + 0.5, this.hit.z + 0.5);
      this.highlightGlow.position.copy(this.highlight.position);
      const pulse = 0.08 + Math.sin(performance.now() * 0.006) * 0.04;
      (this.highlightGlow.material as THREE.MeshBasicMaterial).opacity = pulse;
    } else {
      this.targetName = "";
      this.highlight.visible = false;
      this.highlightGlow.visible = false;
    }

    this.updateParticles(dt);
    this.updateSky(dt);

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.12;
      this.pushHud();
    }

    this.renderer.render(this.scene, this.camera);
  };

  /* ---------------- Aufräumen ---------------- */

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("pointerlockchange", this.onLockChange);
    document.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("contextmenu", this.onContext);
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    for (const arr of this.chunkMeshes) if (arr) for (const m of arr) m.geometry.dispose();
    for (const k of LAYERS) this.materials[k].dispose();
    this.renderer.dispose();
  }
}

export { SEA, SX, SY, SZ, BLOCKS };
