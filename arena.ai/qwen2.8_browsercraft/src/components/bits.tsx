import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

/* ---------------- Scroll-Reveal ---------------- */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", seen && "is-in", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------------- Block-Button ---------------- */
export function BlockButton({
  children,
  onClick,
  tone = "grass",
  className,
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "grass" | "gold" | "stone" | "dark";
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const tones: Record<string, string> = {
    grass: "bg-[#5d9c34] text-[#eaffdc]",
    gold: "bg-[#e0a52c] text-[#2a1c02]",
    stone: "bg-[#7d8189] text-[#f2f4f6]",
    dark: "bg-[#1d2c22] text-[#cfe3c6]",
  };
  const sizes: Record<string, string> = {
    sm: "text-[9px] px-3 py-2",
    md: "text-[11px] px-5 py-3",
    lg: "text-[13px] px-7 py-4",
  };
  return (
    <button type="button" onClick={onClick} className={cn("btn-block pixel-edge-sm", tones[tone], sizes[size], className)}>
      {children}
    </button>
  );
}

/* ---------------- Kleiner CSS-Block (isometrisch) ---------------- */
export function CssCube({ size = 40, top, left, right, className }: { size?: number; top: string; left: string; right: string; className?: string }) {
  const w = size;
  const h = size * 0.58;
  return (
    <span className={cn("relative inline-block", className)} style={{ width: w, height: size * 1.08 }}>
      <span
        className="absolute left-0 top-0"
        style={{
          width: w,
          height: w,
          background: top,
          clipPath: "polygon(50% 0%, 100% 29%, 50% 58%, 0% 29%)",
        }}
      />
      <span
        className="absolute left-0"
        style={{
          top: h,
          width: w,
          height: h,
          background: left,
          clipPath: "polygon(0% 0%, 50% 29%, 50% 100%, 0% 71%)",
        }}
      />
      <span
        className="absolute left-0"
        style={{
          top: h,
          width: w,
          height: h,
          background: right,
          clipPath: "polygon(50% 29%, 100% 0%, 100% 71%, 50% 100%)",
        }}
      />
    </span>
  );
}

/* ---------------- Bodenprofil (reine CSS-Blöcke) ---------------- */
const PROFILE: { c: string; name: string }[] = [
  { c: "#6fae3c", name: "Gras" },
  { c: "#7c5334", name: "Erde" },
  { c: "#8b8d94", name: "Stein" },
  { c: "#2c2c30", name: "Steinkohle" },
  { c: "#d6a47a", name: "Eisenerz" },
  { c: "#f6d04a", name: "Golderz" },
  { c: "#3b6fc4", name: "Wasser" },
  { c: "#2a2a2e", name: "Grundgestein" },
  { c: "#141a16", name: "Höhle" },
];

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function TerrainCut({ cols = 26, rows = 11 }: { cols?: number; rows?: number }) {
  const [hover, setHover] = useState<string | null>(null);
  const cells = useRef<{ c: string; name: string }[]>([]);
  if (cells.current.length === 0) {
    const rnd = mulberry(4242);
    const out: { c: string; name: string }[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const surface = 2 + Math.round(Math.sin(x * 0.42) * 1.1 + Math.sin(x * 0.13 + 1.4) * 1.6);
        const lake = x > cols - 7 && y > surface - 1;
        let cell: { c: string; name: string };
        if (lake && y >= surface) cell = PROFILE[6];
        else if (y < surface) cell = { c: "transparent", name: "Luft" };
        else if (y === surface) cell = lake ? PROFILE[6] : PROFILE[0];
        else if (y < surface + 2) cell = PROFILE[1];
        else if (y === rows - 1) cell = PROFILE[7];
        else {
          const r = rnd();
          const cave = Math.sin(x * 0.7 + y * 1.3) * 0.5 + 0.5 > 0.86 && y > surface + 3;
          if (cave) cell = PROFILE[8];
          else if (r > 0.965) cell = PROFILE[5];
          else if (r > 0.92) cell = PROFILE[4];
          else if (r > 0.85) cell = PROFILE[3];
          else cell = PROFILE[2];
        }
        void rnd;
        out.push({ c: cell.c, name: cell.name });
      }
    }
    cells.current = out;
  }

  return (
    <div className="relative">
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        onMouseLeave={() => setHover(null)}
      >
        {cells.current.map((cell, i) => (
          <div
            key={i}
            onMouseEnter={() => cell.name !== "Luft" && setHover(cell.name)}
            className="aspect-square transition-transform duration-150 hover:scale-[1.28] hover:z-10 relative"
            style={{
              background: cell.c === "transparent" ? "rgba(255,255,255,0.02)" : cell.c,
              boxShadow: cell.c === "transparent" ? "none" : "inset 0 0 0 1px rgba(0,0,0,.22)",
            }}
          />
        ))}
      </div>
      <div className="mt-3 h-5 font-pixel text-[9px] text-grasslite/90">{hover ?? "› fahr mit der Maus über das Profil"}</div>
    </div>
  );
}

/* ---------------- Laufschrift ---------------- */
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden border-y-[3px] border-black/60 bg-[#7c5334] py-3">
      <div className="anim-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8 font-pixel text-[11px] text-[#f0e3c8]">
            {t}
            <span className="inline-block h-2.5 w-2.5 bg-[#f2b53c]" />
          </span>
        ))}
      </div>
    </div>
  );
}
