import { useEffect, useMemo, useState } from "react";
import { PLACEABLE } from "@/game/blocks";
import { allIcons } from "@/game/icons";
import { CONTROLS } from "@/game/controls";
import { sfx } from "@/game/audio";
import BlockPreview from "@/components/BlockPreview";
import { BlockButton, CssCube, Marquee, Reveal, TerrainCut } from "@/components/bits";
import { cn } from "@/utils/cn";

const SPECKS = [
  { l: "6%", t: "22%", s: 8, c: "#6fae3c", d: 0 },
  { l: "14%", t: "68%", s: 6, c: "#f2b53c", d: 1.2 },
  { l: "28%", t: "12%", s: 5, c: "#74b6ea", d: 2.4 },
  { l: "41%", t: "80%", s: 9, c: "#7c5334", d: 0.6 },
  { l: "57%", t: "18%", s: 6, c: "#a3d95f", d: 1.8 },
  { l: "69%", t: "74%", s: 7, c: "#8b8d94", d: 3.1 },
  { l: "82%", t: "28%", s: 5, c: "#f2b53c", d: 2.2 },
  { l: "91%", t: "62%", s: 8, c: "#6fae3c", d: 0.9 },
  { l: "47%", t: "46%", s: 4, c: "#ece7d9", d: 4.0 },
  { l: "75%", t: "8%", s: 6, c: "#7c5334", d: 1.5 },
  { l: "19%", t: "44%", s: 5, c: "#74b6ea", d: 3.6 },
  { l: "88%", t: "86%", s: 7, c: "#a3d95f", d: 2.8 },
];

function SectionLabel({ index, text }: { index: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-pixel text-[10px] text-gold">{index}</span>
      <span className="h-[3px] w-10 bg-grass" />
      <span className="font-pixel text-[10px] tracking-[0.22em] text-grasslite">{text}</span>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="pixel-edge-sm inline-flex items-center gap-2 border-[3px] border-black/60 bg-[#16231b] px-3 py-2 font-pixel text-[8px] text-bone/80 transition-transform duration-150 hover:-translate-y-0.5 hover:text-grasslite">
      {children}
    </span>
  );
}

export default function Landing({ onPlay }: { onPlay: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const icons = useMemo(() => allIcons(64), []);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", f, { passive: true });
    f();
    return () => window.removeEventListener("scroll", f);
  }, []);

  const start = () => {
    sfx.resume();
    sfx.ui(true);
    onPlay();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink text-bone">
      {/* ---------- Hintergrund-Ebenen ---------- */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="bg-blocks absolute inset-0 opacity-70" />
        <div className="bg-blocks-fine absolute inset-0 opacity-60" />
        <div className="absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(111,174,60,0.16),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 h-[60vh] w-[60vw] bg-[radial-gradient(60%_60%_at_20%_80%,rgba(116,182,234,0.1),transparent_70%)]" />
        <div className="torch absolute -right-24 top-24 h-[420px] w-[420px] rounded-full" />
        <div className="torch absolute -left-32 bottom-10 h-[380px] w-[380px] rounded-full" style={{ animationDelay: "1.4s" }} />
        {SPECKS.map((s, i) => (
          <span
            key={i}
            className="anim-float absolute opacity-45"
            style={{
              left: s.l,
              top: s.t,
              width: s.s,
              height: s.s,
              background: s.c,
              animationDelay: `${s.d}s`,
              animationDuration: `${5 + (i % 5)}s`,
              boxShadow: "0 0 10px rgba(0,0,0,.4)",
            }}
          />
        ))}
      </div>

      {/* ---------- Navigation ---------- */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-300",
          scrolled ? "border-b-[3px] border-black/70 bg-[#0d1512]/92 backdrop-blur-sm py-2" : "py-4"
        )}
      >
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5">
          <a href="#top" className="group flex items-center gap-3">
            <span className="anim-float" style={{ animationDuration: "4.5s" }}>
              <CssCube size={30} top="#6fae3c" left="#7c5334" right="#5f3f27" />
            </span>
            <span className="font-pixel text-[13px] tracking-tight text-bone transition-colors group-hover:text-grasslite">
              MINI<span className="text-grass">CRAFT</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            {[
              ["#welt", "Die Welt"],
              ["#steuerung", "Steuerung"],
              ["#bloecke", "Blöcke"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="relative font-pixel text-[9px] text-bone/60 transition-colors hover:text-grasslite after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:w-0 after:bg-grass after:transition-all hover:after:w-full"
              >
                {label}
              </a>
            ))}
          </nav>

          <BlockButton size="sm" tone="grass" onClick={start}>
            ▶ SPIELEN
          </BlockButton>
        </div>
      </header>

      <main className="relative z-10" id="top">
        {/* ---------- Hero ---------- */}
        <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-14 pt-32 lg:grid-cols-[1.02fr_0.98fr] lg:pb-20 lg:pt-36">
          <div>
            <Reveal>
              <span className="pixel-edge-sm inline-flex items-center gap-2.5 border-[3px] border-black/60 bg-[#16231b] px-3 py-2">
                <span className="anim-ring inline-block h-2.5 w-2.5 bg-grasslite" />
                <span className="font-pixel text-[8px] tracking-[0.16em] text-bone/75">
                  EIN MINI-MINECRAFT · LÄUFT IM BROWSER
                </span>
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 font-pixel leading-[1.04]">
                <span className="block text-[clamp(2.3rem,7.6vw,4.6rem)] text-bone px-shadow-green">MINI</span>
                <span className="mt-2 block text-[clamp(2.3rem,7.6vw,4.6rem)] text-grasslite px-shadow-gold">CRAFT</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-7 max-w-[52ch] text-[17px] leading-relaxed text-bone/70">
                Eine kleine Blockwelt, die es vorher nicht gab: <strong className="font-semibold text-bone">80 × 80 Blöcke</strong>, prozedural
                erzeugt mit Bergen, Stränden, Seen, Höhlen und Erzadern. Du brichst Blöcke mit der linken Maustaste, baust mit der rechten –
                und wenn die Sonne untergeht, leuchten deine Leuchtsteine.
              </p>
            </Reveal>

            <Reveal delay={220}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <BlockButton size="lg" tone="grass" onClick={start} className="anim-ring">
                  ▶ WELT BETRETEN
                </BlockButton>
                <a href="#steuerung">
                  <BlockButton size="lg" tone="dark">
                    STEUERUNG
                  </BlockButton>
                </a>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-9 flex flex-wrap gap-2.5">
                <Chip>23 BLOCKSORTEN</Chip>
                <Chip>HÖHLEN & ERZE</Chip>
                <Chip>TAG / NACHT</Chip>
                <Chip>WASSER & PHYSIK</Chip>
                <Chip>KEIN DOWNLOAD</Chip>
              </div>
            </Reveal>
          </div>

          {/* Vorschau-Fenster */}
          <Reveal delay={140} className="relative">
            <div className="pixel-edge relative mx-auto w-full max-w-[560px] border-[4px] border-black bg-[#132019] shadow-[0_26px_70px_rgba(0,0,0,0.55)]">
              <div className="flex items-center gap-2 border-b-[3px] border-black/70 bg-[#1b2c22] px-3 py-2">
                <span className="h-3 w-3 bg-rust" />
                <span className="h-3 w-3 bg-gold" />
                <span className="h-3 w-3 bg-grass" />
                <span className="ml-2 font-pixel text-[8px] text-bone/50">welt_vorschau.mc</span>
                <span className="ml-auto font-pixel text-[8px] text-grasslite/70">● LIVE</span>
              </div>
              <div className="relative h-[300px] w-full bg-[radial-gradient(70%_70%_at_50%_40%,rgba(116,182,234,0.16),transparent_70%)] sm:h-[380px]">
                <BlockPreview className="absolute inset-0" />
                <div className="pointer-events-none absolute bottom-3 left-3 flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="anim-float h-7 w-7 border-[3px] border-black/70 bg-[#0d1512]/70"
                      style={{ animationDelay: `${i * 0.35}s`, animationDuration: "5s" }}
                    />
                  ))}
                </div>
                <div className="pointer-events-none absolute right-3 top-3 border-[3px] border-black/60 bg-[#0d1512]/70 px-2 py-1 font-pixel text-[7px] text-bone/60">
                  SEED: ZUFALL
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t-[3px] border-black/70 bg-[#1b2c22] px-3 py-2.5">
                <span className="font-pixel text-[8px] text-bone/45">GRASBLOCK · EICHE · LEUCHTSTEIN</span>
                <button onClick={start} className="font-pixel text-[8px] text-gold transition-transform hover:translate-x-1">
                  ANFASSEN →
                </button>
              </div>
            </div>
          </Reveal>
        </section>

        <Marquee items={["BLÖCKE BRECHEN", "HÄUSER BAUEN", "HÖHLEN ERKUNDEN", "ERZE SAMMELN", "SONNENUNTERGANG", "FLIEGEN MIT F"]} />

        {/* ---------- Die Welt ---------- */}
        <section id="welt" className="mx-auto max-w-[1240px] px-5 py-20 lg:py-28">
          <Reveal>
            <SectionLabel index="01" text="DIE WELT" />
            <h2 className="mt-5 max-w-[22ch] text-[clamp(1.9rem,4.6vw,3.4rem)] font-black leading-[1.05] tracking-tight">
              Eine Insel, die beim Laden <span className="text-grasslite">aus dem Nichts</span> entsteht.
            </h2>
            <p className="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-bone/60">
              Jeder Seed erzeugt anderes Gelände: Rausch- und Hügelnoise stapeln sich zu Bergen, darunter fressen sich wurmförmige Höhlen
              durch den Stein. Kohle, Eisen und Gold liegen dort, wo man sie finden muss.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-5">
            <Reveal className="lg:col-span-3" delay={60}>
              <div className="pixel-edge-sm h-full border-[4px] border-black bg-[#132019] p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-pixel text-[12px] text-bone">BODENPROFIL</h3>
                  <span className="font-pixel text-[8px] text-bone/40">Y = 0 … 48</span>
                </div>
                <div className="mt-5">
                  <TerrainCut />
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-bone/55">
                  Oben Gras, drei Blöcke Erde, dann Stein mit Erzen – und ganz unten Grundgestein, das sich nicht abbauen lässt.
                </p>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-2" delay={120}>
              <div className="pixel-edge-sm h-full border-[4px] border-black bg-[#132019] p-5">
                <h3 className="font-pixel text-[12px] text-bone">TAG & NACHT</h3>
                <div className="relative mt-6 grid h-40 place-items-center overflow-hidden border-[3px] border-black/60 bg-[linear-gradient(180deg,#12233f_0%,#2b4a76_45%,#6fae3c_46%,#3d6b2c_100%)]">
                  <div className="anim-orbit absolute h-[150px] w-[150px]">
                    <span className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 bg-gold shadow-[0_0_22px_rgba(242,181,60,.85)]" />
                    <span className="absolute bottom-0 left-1/2 h-5 w-5 -translate-x-1/2 bg-[#dfe7f5] shadow-[0_0_18px_rgba(200,220,255,.6)]" />
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-end gap-1">
                    {[10, 16, 22, 14].map((h, i) => (
                      <span key={i} className="w-4 bg-[#2f5d33]" style={{ height: h }} />
                    ))}
                  </div>
                  <div className="absolute bottom-4 right-4 h-5 w-5 bg-[#f6d04a] shadow-[0_0_16px_rgba(246,208,74,.9)]" />
                </div>
                <p className="mt-4 text-[14px] leading-relaxed text-bone/55">
                  Sechs Minuten pro Umlauf. Himmel, Nebel, Sonnenlicht und Sterne wechseln mit – und nachts willst du Leuchtstein dabei haben.
                </p>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-2" delay={60}>
              <div className="pixel-edge-sm h-full border-[4px] border-black bg-[#132019] p-5">
                <h3 className="font-pixel text-[12px] text-bone">HÖHLEN & ERZE</h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  {[
                    ["#2c2c30", "Kohle"],
                    ["#d6a47a", "Eisen"],
                    ["#f6d04a", "Gold"],
                    ["#8b8d94", "Kies"],
                  ].map(([c, n]) => (
                    <div key={n} className="group flex flex-col items-center gap-2">
                      <span
                        className="anim-float h-11 w-11 border-[3px] border-black transition-transform duration-200 group-hover:scale-110"
                        style={{ background: c as string, animationDuration: "4.2s" }}
                      />
                      <span className="font-pixel text-[7px] text-bone/50 group-hover:text-grasslite">{n}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[14px] leading-relaxed text-bone/55">
                  Grab dich nach unten: 3D-Noise frisst Tunnel und Kammern in den Stein. Je tiefer, desto seltener und wertvoller das Erz.
                </p>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-3" delay={120}>
              <div className="pixel-edge-sm h-full border-[4px] border-black bg-[#132019] p-5">
                <h3 className="font-pixel text-[12px] text-bone">PHYSIK, WASSER & PARTIKEL</h3>
                <div className="mt-5 flex flex-wrap items-end gap-4">
                  <div className="relative h-24 w-24 overflow-hidden border-[3px] border-black/60 bg-[#0f1a14]">
                    <span className="anim-jump absolute bottom-0 left-1/2 h-8 w-8 -translate-x-1/2 bg-[#6fae3c]" />
                    <span className="absolute bottom-0 left-0 h-2 w-full bg-[#7c5334]" />
                  </div>
                  <div className="relative h-24 w-24 overflow-hidden border-[3px] border-black/60 bg-[#0f1a14]">
                    <span className="anim-wave absolute inset-x-0 bottom-0 h-14 bg-[#3b6fc4]/70" />
                    <span className="absolute bottom-3 left-6 h-6 w-6 bg-[#8b8d94]" />
                    <span className="absolute bottom-3 left-13 h-6 w-6 bg-[#7c5334]" />
                  </div>
                  <ul className="ml-1 space-y-2 text-[14px] text-bone/60">
                    {[
                      "Schwerkraft, Sprünge und Block-Kollision",
                      "Schwimmen mit Auftrieb statt Fallschaden",
                      "Splitter-Partikel in der Farbe des Blocks",
                      "Ambient Occlusion an jeder Kante",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2">
                        <span className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 bg-grass" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- Steuerung ---------- */}
        <section id="steuerung" className="border-y-[4px] border-black/70 bg-[#101a14]/80">
          <div className="mx-auto max-w-[1240px] px-5 py-20 lg:py-24">
            <Reveal>
              <SectionLabel index="02" text="STEUERUNG" />
              <h2 className="mt-5 max-w-[24ch] text-[clamp(1.9rem,4.6vw,3.4rem)] font-black leading-[1.05] tracking-tight">
                Zehn Tasten. Mehr braucht es <span className="text-gold">nicht.</span>
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <Reveal delay={60}>
                <div className="pixel-edge-sm border-[4px] border-black bg-[#132019] p-6">
                  <div className="font-pixel text-[9px] text-bone/45">TASTATUR</div>
                  <div className="mt-5 flex flex-col items-center gap-2">
                    <span className="keycap">W</span>
                    <div className="flex gap-2">
                      <span className="keycap">A</span>
                      <span className="keycap">S</span>
                      <span className="keycap">D</span>
                    </div>
                    <span className="keycap mt-3 w-56">LEER</span>
                    <div className="mt-2 flex gap-2">
                      <span className="keycap">SHIFT</span>
                      <span className="keycap">F</span>
                      <span className="keycap">E</span>
                      <span className="keycap">R</span>
                    </div>
                  </div>

                  <div className="mt-8 font-pixel text-[9px] text-bone/45">MAUS</div>
                  <div className="mt-4 flex items-center gap-5">
                    <svg viewBox="0 0 64 96" className="h-24 w-16" aria-hidden>
                      <rect x="6" y="4" width="52" height="88" rx="24" fill="#1b2c22" stroke="#0a110d" strokeWidth="4" />
                      <rect className="mouse-btn-l" x="10" y="8" width="20" height="30" rx="8" fill="#6fae3c" />
                      <rect className="mouse-btn-r" x="34" y="8" width="20" height="30" rx="8" fill="#f2b53c" />
                      <rect x="29" y="14" width="6" height="14" rx="3" fill="#0a110d" />
                    </svg>
                    <div className="space-y-2 font-pixel text-[9px] leading-relaxed">
                      <div className="text-grasslite">LINKS = ABBAUEN</div>
                      <div className="text-gold">RECHTS = SETZEN</div>
                      <div className="text-bone/50">RAD = SLOT WECHSELN</div>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CONTROLS.map((c, i) => (
                    <div
                      key={c.label}
                      className="group flex items-center gap-3 border-[3px] border-black/50 bg-[#0d1512]/50 px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-grass/70 hover:bg-[#16231b]"
                      style={{ transitionDelay: `${i * 8}ms` }}
                    >
                      <div className="flex shrink-0 gap-1">
                        {c.keys.map((k) => (
                          <span key={k} className="keycap sm group-hover:press">
                            {k}
                          </span>
                        ))}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold text-bone/90">{c.label}</div>
                        {c.hint && <div className="truncate font-pixel text-[7px] text-bone/35">{c.hint}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- Blöcke ---------- */}
        <section id="bloecke" className="mx-auto max-w-[1240px] px-5 py-20 lg:py-28">
          <Reveal>
            <SectionLabel index="03" text="BLOCKAUSWAHL" />
            <h2 className="mt-5 max-w-[26ch] text-[clamp(1.9rem,4.6vw,3.4rem)] font-black leading-[1.05] tracking-tight">
              Alles, was du in die Hand nehmen kannst.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[16px] leading-relaxed text-bone/60">
              Jedes Icon ist zur Laufzeit aus 16×16 Pixeln gemalt – kein einziges Bild wird heruntergeladen. Im Spiel legst du per{" "}
              <span className="font-pixel text-[11px] text-gold">E</span> jeden Block in jeden Hotbar-Slot.
            </p>
          </Reveal>

          <div className="mt-12 flex flex-wrap gap-4">
            {PLACEABLE.map((b, i) => (
              <Reveal key={b.id} delay={i * 22}>
                <button
                  onClick={() => {
                    sfx.resume();
                    sfx.place(b.sound);
                  }}
                  className="group flex w-[92px] flex-col items-center gap-2"
                  style={{ marginTop: `${(i % 3) * 14}px` }}
                >
                  <span className="pixel-edge-sm grid h-[72px] w-[72px] place-items-center border-[3px] border-black/70 bg-[#132019] transition-all duration-200 group-hover:-translate-y-1.5 group-hover:border-grasslite/80 group-hover:bg-[#1d3023]">
                    <img
                      src={icons[b.id]}
                      alt={b.name}
                      width={56}
                      height={56}
                      draggable={false}
                      className="transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-7deg]"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </span>
                  <span className="text-center font-pixel text-[7px] leading-tight text-bone/45 transition-colors group-hover:text-grasslite">
                    {b.name.toUpperCase()}
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="relative overflow-hidden border-y-[4px] border-black/70 bg-[#1b2c22]">
          <div className="torch absolute -left-20 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full" />
          <div className="torch absolute -right-20 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full" style={{ animationDelay: "1.8s" }} />
          <div className="bg-blocks absolute inset-0 opacity-60" />
          <Reveal className="relative mx-auto flex max-w-[1240px] flex-col items-start gap-8 px-5 py-20 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-pixel text-[clamp(1.3rem,3.6vw,2.2rem)] leading-[1.3] text-bone px-shadow">
                BEREIT, DEN ERSTEN
                <br />
                <span className="text-grasslite">BLOCK ZU BRECHEN?</span>
              </h2>
              <p className="mt-5 max-w-[46ch] text-[16px] text-bone/60">
                Kein Download, kein Konto, keine Wartezeit. Ein Klick und du stehst auf einer frisch generierten Insel.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <BlockButton size="lg" tone="gold" onClick={start}>
                ▶ JETZT SPIELEN
              </BlockButton>
              <span className="font-pixel text-[8px] text-bone/40">MAUS + TASTATUR EMPFOHLEN</span>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="relative z-10 bg-ink">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <CssCube size={24} top="#6fae3c" left="#7c5334" right="#5f3f27" />
            <span className="font-pixel text-[10px] text-bone/70">
              MINI<span className="text-grass">CRAFT</span>
            </span>
          </div>
          <p className="max-w-[64ch] font-pixel text-[8px] leading-[1.9] text-bone/30">
            INOFFIZIELLES BROWSER-SPIEL IM VOXEL-LOOK. NICHT MIT MOJANG ODER MICROSOFT VERBUNDEN.
            <br />
            TEXTUREN, WELT UND SOUND WERDEN BEIM LADEN PROZEDURAL ERZEUGT.
          </p>
          <a href="#top" className="font-pixel text-[9px] text-grasslite transition-transform hover:-translate-y-0.5">
            ↑ NACH OBEN
          </a>
        </div>
      </footer>
    </div>
  );
}
