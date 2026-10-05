import { useEffect, useRef, useState } from "react";
import { BLOCKS, PLACEABLE } from "@/game/blocks";
import { MiniCraft, type HudState } from "@/game/engine";
import { blockIcon } from "@/game/icons";
import { sfx } from "@/game/audio";
import { CONTROLS } from "@/game/controls";
import Hud from "@/components/Hud";
import { BlockButton } from "@/components/bits";
import { cn } from "@/utils/cn";

export default function GameView({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MiniCraft | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const [loading, setLoading] = useState(true);
  const [invOpen, setInvOpen] = useState(false);
  const [seed, setSeed] = useState(() => (Math.random() * 1e9) | 0);
  const [sound, setSound] = useState(true);
  const [everLocked, setEverLocked] = useState(false);

  // Welt bauen (mit einer Frame Pause, damit das Ladebild sichtbar ist)
  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || !canvasRef.current) return;
      const e = new MiniCraft(canvasRef.current, seed);
      e.onHud = (s) => setHud(s);
      e.onInventory = () => setInvOpen(true);
      e.onLock = (l) => {
        if (l) {
          setInvOpen(false);
          setEverLocked(true);
        }
      };
      engineRef.current = e;
      setLoading(false);
    }, 50);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      engineRef.current?.dispose();
      engineRef.current = null;
      setHud(null);
      setEverLocked(false);
    };
  }, [seed]);

  // Inventar mit ESC / E schließen
  useEffect(() => {
    if (!invOpen) return;
    const h = (ev: KeyboardEvent) => {
      if (ev.code === "Escape" || ev.code === "KeyE") {
        ev.preventDefault();
        setInvOpen(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [invOpen]);

  const resume = () => {
    setInvOpen(false);
    engineRef.current?.lock();
  };

  const pickBlock = (id: number) => {
    const e = engineRef.current;
    if (!e) return;
    e.setSlotBlock(e.slot, id);
    sfx.place(BLOCKS[id]?.sound ?? "stone");
    setInvOpen(false);
    e.lock();
  };

  const paused = !!hud && !hud.locked && !invOpen && !loading;

  return (
    <div className="fixed inset-0 overflow-hidden bg-ink">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {hud && !loading && <Hud hud={hud} onSelectSlot={(i) => engineRef.current?.setSlot(i)} onOpenInventory={() => setInvOpen(true)} />}

      {/* ---------------- Laden ---------------- */}
      {loading && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-ink">
          <div className="bg-blocks absolute inset-0 opacity-60" />
          <div className="relative flex flex-col items-center gap-6">
            <div className="anim-float" style={{ ["--r" as string]: "0deg" }}>
              <div className="h-16 w-16 border-[3px] border-black bg-[#6fae3c] shadow-[6px_6px_0_rgba(0,0,0,.5)]" />
            </div>
            <div className="font-pixel text-[12px] text-grasslite">WELT WIRD GENERIERT…</div>
            <div className="h-3 w-64 border-[3px] border-black bg-[#1b2c22] p-[2px]">
              <div className="h-full w-1/3 animate-pulse bg-[#6fae3c]" />
            </div>
            <div className="font-pixel text-[8px] text-bone/40">TERRAIN · HÖHLEN · ERZE · BÄUME</div>
          </div>
        </div>
      )}

      {/* ---------------- Inventar ---------------- */}
      {invOpen && hud && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/60 backdrop-blur-[3px]">
          <div className="anim-bob-in pixel-edge w-[min(760px,94vw)] border-[4px] border-black bg-[#16231b]/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,.6)]">
            <div className="flex items-end justify-between">
              <div>
                <div className="font-pixel text-[10px] text-grasslite/70">KREATIV-INVENTAR</div>
                <h3 className="mt-2 font-pixel text-[16px] text-bone hud-shadow">BLOCK WÄHLEN</h3>
              </div>
              <div className="font-pixel text-[9px] text-bone/50">SLOT {hud.slot + 1}</div>
            </div>

            {/* Slot-Reihe */}
            <div className="mt-4 flex flex-wrap gap-1.5 border-[3px] border-black/70 bg-[#0d1512]/60 p-1.5">
              {hud.hotbar.map((id, i) => (
                <button
                  key={i}
                  onClick={() => engineRef.current?.setSlot(i)}
                  className={cn("slot pixel-edge-sm grid place-items-center", i === hud.slot && "active")}
                  title={`Slot ${i + 1}`}
                >
                  <img src={blockIcon(id, 48)} alt={BLOCKS[id]?.name} width={38} height={38} draggable={false} />
                </button>
              ))}
            </div>

            {/* Blockraster */}
            <div className="mt-3 grid max-h-[46vh] grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2 overflow-y-auto pr-1">
              {PLACEABLE.map((b) => (
                <button
                  key={b.id}
                  onClick={() => pickBlock(b.id)}
                  className="group flex flex-col items-center gap-1 border-[3px] border-black/60 bg-[#0d1512]/50 p-2 transition-all hover:-translate-y-1 hover:border-grasslite/70 hover:bg-[#1f3225]"
                >
                  <img
                    src={blockIcon(b.id, 56)}
                    alt={b.name}
                    width={48}
                    height={48}
                    draggable={false}
                    className="transition-transform group-hover:scale-110 group-hover:rotate-[-6deg]"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span className="font-pixel text-[7px] leading-tight text-bone/70 group-hover:text-bone">{b.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="font-pixel text-[8px] text-bone/40">KLICK = IN SLOT {hud.slot + 1} LEGEN · ESC = SCHLIESSEN</span>
              <BlockButton tone="dark" size="sm" onClick={() => setInvOpen(false)}>
                SCHLIESSEN
              </BlockButton>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Pause ---------------- */}
      {paused && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/55 backdrop-blur-[2px]" onClick={resume}>
          <div
            className="anim-bob-in pixel-edge w-[min(880px,94vw)] border-[4px] border-black bg-[#13201a]/96 p-6 shadow-[0_24px_70px_rgba(0,0,0,.65)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-pixel text-[10px] text-grasslite/70">{everLocked ? "SPIEL PAUSIERT" : "WILLKOMMEN IN DER BLOCKWELT"}</div>
                <h2 className="mt-2 font-pixel text-[20px] text-bone hud-shadow">{everLocked ? "PAUSE" : "BEREIT?"}</h2>
              </div>
              <div className="text-right font-pixel text-[8px] leading-[1.9] text-bone/45">
                <div>SEED {seed}</div>
                <div>
                  ABBAU {hud?.broken ?? 0} · GESETZT {hud?.placed ?? 0}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[1fr_auto]">
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {CONTROLS.map((c) => (
                  <div key={c.label} className="flex items-center gap-2 border-[3px] border-black/50 bg-[#0d1512]/50 px-2 py-1.5">
                    <div className="flex gap-1">
                      {c.keys.map((k) => (
                        <span key={k} className="keycap sm">
                          {k}
                        </span>
                      ))}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-bone/90">{c.label}</div>
                      {c.hint && <div className="truncate font-pixel text-[7px] text-bone/35">{c.hint}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex w-full flex-col gap-2.5 md:w-52">
                <BlockButton tone="grass" size="md" onClick={resume}>
                  {everLocked ? "WEITERSPIELEN" : "LOS GEHT'S"}
                </BlockButton>
                <BlockButton tone="gold" size="sm" onClick={() => setSeed((Math.random() * 1e9) | 0)}>
                  NEUE WELT
                </BlockButton>
                <BlockButton
                  tone="stone"
                  size="sm"
                  onClick={() => {
                    const v = !sound;
                    setSound(v);
                    sfx.setEnabled(v);
                  }}
                >
                  TON: {sound ? "AN" : "AUS"}
                </BlockButton>
                <BlockButton tone="dark" size="sm" onClick={onExit}>
                  ZUR STARTSEITE
                </BlockButton>
                <p className="mt-1 font-pixel text-[7px] leading-[1.8] text-bone/35">
                  TIPP: MIT F FLIEGST DU.
                  <br />
                  MAUSRAD WECHSELT DEN SLOT.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hinweis für Touch-Geräte */}
      <div className="pointer-events-none absolute bottom-1 left-1/2 z-20 -translate-x-1/2 font-pixel text-[7px] text-bone/25 lg:hidden">
        MINI CRAFT BRAUCHT MAUS + TASTATUR
      </div>
    </div>
  );
}
