import type { HudState } from "@/game/engine";
import { BLOCKS } from "@/game/blocks";
import { blockIcon } from "@/game/icons";
import { cn } from "@/utils/cn";

const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("pixel-edge-sm border-[3px] border-black/70 bg-[#0d1512]/72 backdrop-blur-[2px] px-3 py-2", className)}>
    {children}
  </div>
);

export default function Hud({
  hud,
  onSelectSlot,
  onOpenInventory,
}: {
  hud: HudState;
  onSelectSlot: (i: number) => void;
  onOpenInventory: () => void;
}) {
  const night = hud.dayFactor < 0.45;
  const current = BLOCKS[hud.hotbar[hud.slot]];

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* Unterwasser + Vignette */}
      <div className={cn("absolute inset-0 water-overlay transition-opacity duration-500", hud.underwater ? "opacity-100" : "opacity-0")} />
      <div className="absolute inset-0 vignette" />

      {/* Fadenkreuz */}
      <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 mix-blend-difference">
        <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white" />
        <span className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 bg-white" />
      </div>

      {/* Links oben: Status */}
      <div className="absolute left-4 top-4 flex flex-col gap-2">
        <Panel className="min-w-[188px]">
          <div className="font-pixel text-[8px] text-grasslite/80">POSITION</div>
          <div className="mt-1.5 grid grid-cols-3 gap-1 font-pixel text-[10px] text-bone hud-shadow">
            <span>X {Math.floor(hud.x)}</span>
            <span>Y {Math.floor(hud.y)}</span>
            <span>Z {Math.floor(hud.z)}</span>
          </div>
          <div className="mt-2 h-[6px] w-full bg-black/60">
            <div
              className="h-full transition-all duration-200"
              style={{ width: `${Math.min(100, (hud.fps / 60) * 100)}%`, background: hud.fps > 45 ? "#6fae3c" : hud.fps > 28 ? "#f2b53c" : "#c4553c" }}
            />
          </div>
          <div className="mt-1 flex justify-between font-pixel text-[8px] text-bone/60">
            <span>{hud.fps} FPS</span>
            <span>{(hud.tris / 1000).toFixed(0)}K TRIS</span>
          </div>
        </Panel>

        <div className="flex gap-2">
          {hud.flying && (
            <Panel className="font-pixel text-[8px] text-sky">
              ✦ FLUGMODUS
            </Panel>
          )}
          {hud.sprinting && !hud.flying && (
            <Panel className="font-pixel text-[8px] text-gold">» SPRINT</Panel>
          )}
          {hud.underwater && <Panel className="font-pixel text-[8px] text-sky">≈ UNTERWASSER</Panel>}
        </div>
      </div>

      {/* Rechts oben: Uhr & Statistik */}
      <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
        <Panel className="min-w-[168px]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-pixel text-[8px] text-grasslite/80">WELTZEIT</div>
              <div className="font-pixel text-[15px] text-bone hud-shadow">{hud.clock}</div>
            </div>
            <div
              className="h-8 w-8 border-[3px] border-black/70 transition-colors duration-700"
              style={{
                background: night ? "#dfe7f5" : "#f2b53c",
                boxShadow: night ? "0 0 14px rgba(200,220,255,.5)" : "0 0 18px rgba(242,181,60,.65)",
              }}
            />
          </div>
          <div className="mt-2 h-[6px] w-full bg-black/60">
            <div className="h-full bg-gradient-to-r from-[#1b2c46] via-[#f2b53c] to-[#1b2c46]" style={{ width: "100%" }} />
          </div>
          <div className="mt-1 font-pixel text-[8px] text-bone/60">{night ? "◐ NACHT" : "☀ TAG"}</div>
        </Panel>

        <Panel className="min-w-[168px]">
          <div className="flex justify-between font-pixel text-[9px] text-bone/85">
            <span className="text-rust">▼ {hud.broken}</span>
            <span className="text-grasslite">▲ {hud.placed}</span>
          </div>
          <div className="mt-1 font-pixel text-[7px] text-bone/45">ABGEBAUT / GESETZT</div>
        </Panel>
      </div>

      {/* Ziel-Block */}
      {hud.target && (
        <div className="absolute left-1/2 top-[58%] -translate-x-1/2">
          <span className="font-pixel text-[9px] text-bone/80 hud-shadow">{hud.target}</span>
        </div>
      )}

      {/* Hotbar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="font-pixel text-[10px] text-bone hud-shadow opacity-90">{current?.name ?? ""}</div>
        <div className="pointer-events-auto flex gap-1.5 border-[3px] border-black/70 bg-[#0d1512]/55 p-1.5">
          {hud.hotbar.map((id, i) => (
            <button
              key={i}
              onClick={() => onSelectSlot(i)}
              onDoubleClick={onOpenInventory}
              className={cn("slot pixel-edge-sm grid place-items-center", i === hud.slot && "active")}
              title={`${i + 1} · ${BLOCKS[id]?.name ?? ""} (Doppelklick = Inventar)`}
            >
              <img src={blockIcon(id, 48)} alt={BLOCKS[id]?.name} width={40} height={40} draggable={false} />
              <span className="absolute left-1 top-0.5 font-pixel text-[7px] text-bone/55">{i + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tipps unten rechts */}
      <div className="absolute bottom-6 right-4 hidden text-right font-pixel text-[8px] leading-[1.9] text-bone/45 lg:block">
        <div>LINKSKLICK · ABBAUEN</div>
        <div>RECHTSKLICK · SETZEN</div>
        <div>E · INVENTAR &nbsp; F · FLIEGEN</div>
        <div>ESC · PAUSE</div>
      </div>
    </div>
  );
}
