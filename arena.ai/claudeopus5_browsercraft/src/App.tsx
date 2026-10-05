import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, DebugPanel, HintBar, Hotbar, Toast, WaterOverlay } from './components/Hud';
import { InventoryPanel, PauseMenu, StartScreen } from './components/Overlays';
import { TouchControls } from './components/TouchControls';
import { DEFAULT_HOTBAR } from './game/blocks';
import { Engine, type EngineSettings, type GameStats } from './game/engine';

const SETTINGS_KEY = 'minicraft.settings.v1';
const HOTBAR_KEY = 'minicraft.hotbar.v1';

const DEFAULT_SETTINGS: EngineSettings = {
  sensitivity: 1,
  sound: true,
  dayCycle: false,
  renderDistance: 95,
  fov: 75,
};

const INITIAL_STATS: GameStats = {
  fps: 0,
  x: 0,
  y: 0,
  z: 0,
  flying: false,
  inWater: false,
  target: null,
  time: 0.12,
  edits: 0,
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const toastTimer = useRef<number | null>(null);

  const isTouch = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    [],
  );

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [toast, setToast] = useState<string | null>(null);
  const [settings, setSettings] = useState<EngineSettings>(() => loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS));
  const [hotbar, setHotbar] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(HOTBAR_KEY);
      const parsed = raw ? (JSON.parse(raw) as number[]) : null;
      return Array.isArray(parsed) && parsed.length === 9 ? parsed : DEFAULT_HOTBAR;
    } catch {
      return DEFAULT_HOTBAR;
    }
  });
  const [selected, setSelected] = useState(0);

  const settingsRef = useRef(settings);
  const hotbarRef = useRef(hotbar);
  const selectedRef = useRef(selected);
  settingsRef.current = settings;
  hotbarRef.current = hotbar;
  selectedRef.current = selected;

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  // Engine einmalig aufbauen
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let engine: Engine;
    try {
      engine = new Engine(container, {
        onStats: setStats,
        onLockChange: setLocked,
        onHotbarSelect: (i) => setSelected(i),
        onHotbarScroll: (d) => setSelected((prev) => (prev + d + 9) % 9),
        onToggleInventory: () => setInventoryOpen((v) => !v),
        onToast: showToast,
      });
    } catch (e) {
      console.error(e);
      setError('WebGL konnte nicht gestartet werden. Bitte einen aktuellen Browser mit Hardwarebeschleunigung nutzen.');
      return;
    }
    engineRef.current = engine;
    engine.setSettings(settingsRef.current);
    engine.setSelectedBlock(hotbarRef.current[selectedRef.current]);
    setHasSave(engine.hasSave());
    setReady(true);
    return () => {
      setReady(false);
      engine.dispose();
      engineRef.current = null;
    };
  }, [showToast]);

  // Einstellungen an Engine + Speicher
  useEffect(() => {
    engineRef.current?.setSettings(settings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignorieren */
    }
  }, [settings]);

  // Aktiven Block an Engine
  useEffect(() => {
    engineRef.current?.setSelectedBlock(hotbar[selected]);
    try {
      localStorage.setItem(HOTBAR_KEY, JSON.stringify(hotbar));
    } catch {
      /* ignorieren */
    }
  }, [hotbar, selected]);

  const resume = useCallback(() => {
    setInventoryOpen(false);
    const engine = engineRef.current;
    if (!engine) return;
    // Fokus lösen, damit die Leertaste nicht den zuletzt geklickten Button auslöst
    (document.activeElement as HTMLElement | null)?.blur?.();
    if (isTouch) engine.setTouchLocked(true);
    else engine.requestLock();
  }, [isTouch]);

  const start = useCallback(() => {
    setStarted(true);
    resume();
  }, [resume]);

  // Tasten für die Overlays
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!inventoryOpen) return;
      if (e.code === 'KeyE' || e.code === 'Escape') {
        e.preventDefault();
        setInventoryOpen(false);
        if (e.code === 'KeyE') resume();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inventoryOpen, resume]);

  const menuOpen = started && !locked && !inventoryOpen;
  const hudVisible = started && !inventoryOpen && locked;

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <div ref={containerRef} className="absolute inset-0" />

      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 text-center">
          <div className="mc-panel max-w-md p-6 text-sm text-red-300">{error}</div>
        </div>
      )}

      {hudVisible && (
        <>
          <WaterOverlay active={stats.inWater} />
          <Crosshair />
          <DebugPanel stats={stats} blocksPlaced={stats.edits} />
          {!isTouch && <HintBar />}
          <Hotbar
            hotbar={hotbar}
            selected={selected}
            interactive={isTouch}
            onSelect={(i) => {
              setSelected(i);
              if (!locked && !isTouch) resume();
            }}
          />
        </>
      )}

      <Toast message={toast} />

      {hudVisible && isTouch && ready && engineRef.current && (
        <TouchControls
          engine={engineRef.current}
          onMenu={() => {
            engineRef.current?.setTouchLocked(false);
          }}
        />
      )}

      {!started && !error && (
        <StartScreen
          onStart={start}
          hasSave={hasSave}
          onLoad={() => {
            engineRef.current?.loadWorld();
            start();
          }}
          onNewWorld={(seed) => {
            engineRef.current?.newWorld(seed);
            start();
          }}
          isTouch={isTouch}
        />
      )}

      {menuOpen && !error && (
        <PauseMenu
          onResume={resume}
          onSave={() => {
            if (engineRef.current?.saveWorld()) setHasSave(true);
          }}
          onLoad={() => {
            engineRef.current?.loadWorld();
            resume();
          }}
          hasSave={hasSave}
          onNewWorld={(seed) => {
            engineRef.current?.newWorld(seed);
            resume();
          }}
          onRespawn={() => {
            engineRef.current?.respawn();
            resume();
          }}
          settings={settings}
          onSettings={(partial) => setSettings((prev) => ({ ...prev, ...partial }))}
          time={stats.time}
          onTime={(t) => engineRef.current?.setTimeOfDay(t)}
        />
      )}

      {inventoryOpen && (
        <InventoryPanel
          hotbar={hotbar}
          selected={selected}
          onPick={(id) => {
            setHotbar((prev) => prev.map((b, i) => (i === selected ? id : b)));
          }}
          onSelectSlot={setSelected}
          onClose={resume}
        />
      )}
    </div>
  );
}
