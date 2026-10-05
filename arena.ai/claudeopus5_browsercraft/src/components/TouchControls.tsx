import { useRef, useState } from 'react';
import type { Engine } from '../game/engine';

export function TouchControls({ engine, onMenu }: { engine: Engine; onMenu: () => void }) {
  const stickRef = useRef<HTMLDivElement>(null);
  const stickPointer = useRef<number | null>(null);
  const lookPointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const handleStickMove = (e: React.PointerEvent) => {
    if (stickPointer.current !== e.pointerId) return;
    const rect = stickRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = (e.clientX - cx) / (rect.width / 2);
    let dy = (e.clientY - cy) / (rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    setKnob({ x: dx, y: dy });
    engine.setTouchMove(dx, -dy);
  };

  const endStick = (e: React.PointerEvent) => {
    if (stickPointer.current !== e.pointerId) return;
    stickPointer.current = null;
    setKnob({ x: 0, y: 0 });
    engine.setTouchMove(0, 0);
  };

  const holdButton = (action: (v: boolean) => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      action(true);
    },
    onPointerUp: () => action(false),
    onPointerCancel: () => action(false),
  });

  return (
    <div className="absolute inset-0 z-30 select-none">
      {/* Blickfeld: rechte Bildschirmhälfte */}
      <div
        className="absolute inset-y-0 right-0 w-1/2"
        onPointerDown={(e) => {
          lookPointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          const l = lookPointer.current;
          if (!l || l.id !== e.pointerId) return;
          engine.touchLook(e.clientX - l.x, e.clientY - l.y);
          l.x = e.clientX;
          l.y = e.clientY;
        }}
        onPointerUp={() => (lookPointer.current = null)}
        onPointerCancel={() => (lookPointer.current = null)}
      />

      {/* Joystick */}
      <div
        ref={stickRef}
        className="absolute bottom-24 left-6 h-32 w-32 rounded-full border-2 border-white/25 bg-black/30"
        onPointerDown={(e) => {
          stickPointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          handleStickMove(e);
        }}
        onPointerMove={handleStickMove}
        onPointerUp={endStick}
        onPointerCancel={endStick}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 rounded-full border-2 border-white/40 bg-white/25"
          style={{ transform: `translate(calc(-50% + ${knob.x * 34}px), calc(-50% + ${knob.y * 34}px))` }}
        />
      </div>

      {/* Aktionstasten */}
      <div className="absolute bottom-24 right-6 grid grid-cols-2 gap-3">
        <button
          className="h-16 w-16 rounded-full border-2 border-white/30 bg-red-600/50 text-xs font-bold text-white"
          {...holdButton((v: boolean) => engine.touchBreak(v))}
        >
          ⛏
        </button>
        <button
          className="h-16 w-16 rounded-full border-2 border-white/30 bg-emerald-600/50 text-xs font-bold text-white"
          {...holdButton((v: boolean) => engine.touchPlace(v))}
        >
          🧱
        </button>
        <button
          className="h-16 w-16 rounded-full border-2 border-white/30 bg-sky-600/50 text-xs font-bold text-white"
          onPointerDown={() => engine.toggleFly()}
        >
          ✈
        </button>
        <button
          className="h-16 w-16 rounded-full border-2 border-white/30 bg-white/20 text-xs font-bold text-white"
          {...holdButton((v: boolean) => engine.setTouchVertical(v, false))}
        >
          ⤒
        </button>
      </div>

      <button
        className="absolute right-3 top-14 rounded-sm border-2 border-white/25 bg-black/40 px-3 py-2 text-[11px] text-white"
        onClick={onMenu}
      >
        Menü
      </button>
    </div>
  );
}
