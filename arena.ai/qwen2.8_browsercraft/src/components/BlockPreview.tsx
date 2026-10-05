import { useEffect, useRef } from "react";
import * as THREE from "three";
import { BRICKS, DIRT, DANDELION, GLOW, GRASS, LOG, STONE } from "@/game/blocks";
import { makeBlockGeometry, makePlantGeometry } from "@/game/blockgeo";
import { getAtlas } from "@/game/textures";

THREE.ColorManagement.enabled = false;

interface Orbiter {
  mesh: THREE.Mesh;
  radius: number;
  speed: number;
  phase: number;
  y: number;
  spin: number;
}

/** Drehscheibe mit Blöcken – die "Lebendigkeit" der Startseite */
export default function BlockPreview({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.6, 7.4);

    const { texture } = getAtlas();
    const mat = new THREE.MeshLambertMaterial({ map: texture });
    const plantMat = new THREE.MeshLambertMaterial({ map: texture, alphaTest: 0.5, side: THREE.DoubleSide });

    const group = new THREE.Group();
    scene.add(group);

    const hero = new THREE.Mesh(makeBlockGeometry(GRASS, 2.1), mat);
    group.add(hero);

    const orbiters: Orbiter[] = [];
    const mk = (id: number, size: number, radius: number, speed: number, phase: number, y: number, spin = 0.7) => {
      const m = new THREE.Mesh(makeBlockGeometry(id, size), mat);
      group.add(m);
      orbiters.push({ mesh: m, radius, speed, phase, y, spin });
    };
    mk(LOG, 0.78, 2.9, 0.42, 0.4, 0.55);
    mk(STONE, 0.62, 3.4, -0.3, 2.4, -0.75);
    mk(GLOW, 0.7, 2.5, 0.55, 4.2, -0.25, 1.1);
    mk(BRICKS, 0.56, 3.7, 0.24, 1.2, 1.15);
    mk(DIRT, 0.5, 3.1, -0.46, 5.4, 1.0);

    const plant = new THREE.Mesh(makePlantGeometry(DANDELION, 0.85), plantMat);
    group.add(plant);

    const amb = new THREE.AmbientLight(0xffffff, 0.85);
    const key = new THREE.DirectionalLight(0xfff3d6, 1.15);
    key.position.set(3.5, 6, 4);
    const fill = new THREE.DirectionalLight(0x88b4ff, 0.4);
    fill.position.set(-4, -1, -3);
    scene.add(amb, key, fill);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = (performance.now() - t0) / 1000;

      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      hero.rotation.y = t * 0.42;
      hero.rotation.x = Math.sin(t * 0.5) * 0.12;
      hero.position.y = Math.sin(t * 0.9) * 0.12;

      for (const o of orbiters) {
        const a = t * o.speed + o.phase;
        o.mesh.position.set(Math.cos(a) * o.radius, o.y + Math.sin(t * 0.8 + o.phase) * 0.22, Math.sin(a) * o.radius * 0.75);
        o.mesh.rotation.y = a * o.spin * 2;
        o.mesh.rotation.z = Math.sin(a) * 0.25;
      }
      plant.position.set(Math.cos(-t * 0.35) * 2.2, 1.5 + Math.sin(t * 1.2) * 0.15, Math.sin(-t * 0.35) * 1.6);
      plant.rotation.y = t * 0.8;

      group.rotation.y = pointer.x * 0.35;
      group.rotation.x = -pointer.y * 0.2;
      camera.position.x = pointer.x * 0.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      for (const o of orbiters) o.mesh.geometry.dispose();
      hero.geometry.dispose();
      plant.geometry.dispose();
      mat.dispose();
      plantMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
