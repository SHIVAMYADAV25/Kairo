import { useRef, useState, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";
import { open as openUrl } from "@tauri-apps/plugin-shell";

interface Props {
  open: boolean;
  onClose: () => void;
  imageSrc?: string; // Naruto background image
  maskSrc?: string;  // Gundam helmet mask image
}

interface Leaf {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  swayAmplitude: number;
}

const X_ICON_PATH =
  "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z";
const LINKEDIN_ICON_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z";

/** Tauri webviews don't hand plain `<a target="_blank">` clicks off to the
 * system browser — there's no browser chrome to open a "new tab" into.
 * The shell plugin's `open()` explicitly launches the URL in the user's
 * default browser instead. Falls back to window.open for `vite dev`
 * (running as a plain web page, no Tauri runtime present). */
async function openExternal(url: string) {
  try {
    await openUrl(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function AboutDevModal({ open, onClose, imageSrc = "/bio.png", maskSrc = "/mask.avif" }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [tricked, setTricked] = useState(false);
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  useEffect(() => {
    if (open) {
      const generatedLeaves = Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * -12,
        duration: 8 + Math.random() * 6,
        size: 6 + Math.random() * 8,
        swayAmplitude: 20 + Math.random() * 30,
      }));
      setLeaves(generatedLeaves);
    }
  }, [open]);

  if (!open) return null;

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y };
    setDragging(true);
    setTricked(true);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !frameRef.current) return;
    const bounds = frameRef.current.getBoundingClientRect();
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;

    const maxX = bounds.width * 0.5;
    const maxY = bounds.height * 0.5;
    setPos({
      x: Math.max(-maxX, Math.min(maxX, dragState.current.baseX + dx)),
      y: Math.max(-maxY, Math.min(maxY, dragState.current.baseY + dy)),
    });
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    dragState.current = null;
    setDragging(false);
  };

  return (
    <>
      <style>{`
        @keyframes sakura-soft-fall {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% {
            transform: translateY(480px) translateX(var(--sway-distance)) rotate(450deg);
            opacity: 0;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 select-none" onClick={onClose}>
        <div
          className="relative flex w-[900px] min-h-[460px] max-w-full flex-col md:flex-row overflow-hidden rounded-xl border border-border bg-bg-panel shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ================= BACKGROUND: Sakura Fall ================= */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {leaves.map((leaf) => (
              <div
                key={leaf.id}
                className="absolute top-0 bg-gradient-to-br from-pink-300 to-pink-400 rounded-br-full rounded-tl-full shadow-sm opacity-0"
                style={{
                  left: `${leaf.left}%`,
                  width: `${leaf.size}px`,
                  height: `${leaf.size * 0.7}px`,
                  animation: `sakura-soft-fall ${leaf.duration}s linear infinite`,
                  animationDelay: `${leaf.delay}s`,
                  ["--sway-distance" as any]: `${leaf.swayAmplitude}px`,
                }}
              />
            ))}
          </div>

          {/* ================= LEFT SIDE: Text Content ================= */}
          <div className="flex-1 p-8 flex flex-col justify-center relative z-10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 className="text-[24px] font-bold text-text-primary leading-tight">
              Yoo dum dums <span className="text-accent">👋</span>
            </h2>
            <p className="mt-1 text-[16px] font-medium text-text-secondary">Shivam, this side.</p>
            <p className="mt-5 text-[14px] leading-relaxed text-text-secondary max-w-[360px]">
              Want a feature that's missing, or something feels broken? Don't just silently judge my code
              message me on whichever of these you actually use. I read everything.
            </p>

            <div className="flex items-center gap-3 mt-8">
              <a
                href="https://x.com/shivamdotdev"
                onClick={(e) => {
                  e.preventDefault();
                  openExternal("https://x.com/shivamdotdev");
                }}
                className="w-11 h-11 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 active:scale-95"
                aria-label="X Profile"
              >
                <svg className="w-[20px] h-[20px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d={X_ICON_PATH} />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/shivamdotdev"
                onClick={(e) => {
                  e.preventDefault();
                  openExternal("https://www.linkedin.com/in/shivamdotdev");
                }}
                className="w-11 h-11 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 active:scale-95"
                aria-label="LinkedIn Profile"
              >
                <svg className="w-[20px] h-[20px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d={LINKEDIN_ICON_PATH} />
                </svg>
              </a>
            </div>

            {/* Faded gradient divider replaced the sharp border-t line */}
            <div className="h-[1px] w-full max-w-[360px] mt-8 bg-gradient-to-r from-transparent via-border/40 to-transparent" />

            {/* Subtle learning redirect note */}
            <p className="mt-4 text-[12px] text-text-muted max-w-[360px] leading-normal">
              If you want to learn how you can make your own Kairo, please{" "}
              <a
                href="https://kairo-seven-livid.vercel.app/about"
                onClick={(e) => {
                  e.preventDefault();
                  openExternal("https://kairo-seven-livid.vercel.app/about");
                }}
                className="text-accent hover:underline inline-flex items-center font-medium transition-colors"
              >
                have a look at this blog
              </a>
              .
            </p>
          </div>

          {/* ================= RIGHT SIDE: Visual Card Gag ================= */}
          <div className="flex-1 bg-bg-base/70 backdrop-blur-[1px] border-t md:border-t-0 md:border-l border-border p-8 flex flex-col items-center justify-center gap-5 relative z-10">
            <div
              ref={frameRef}
              className="relative w-full max-w-[320px] aspect-square rounded-2xl bg-bg-elevated/80 border border-border overflow-hidden touch-none p-2 shadow-inner flex items-center justify-center"
            >
              <img
                src={imageSrc}
                alt="Character Illustration"
                className="w-full h-full object-cover rounded-xl opacity-90 pointer-events-none select-none"
              />

              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, touchAction: "none" }}
                className={`absolute top-[7%] left-[42%] w-[45%] aspect-square z-20 cursor-grab active:cursor-grabbing ${
                  dragging ? "" : "transition-transform duration-200 ease-out"
                }`}
              >
                <img
                  src={maskSrc}
                  alt="Draggable overlay helmet mask"
                  className="w-full h-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] scale-x-[-1] pointer-events-none select-none"
                />
              </div>
            </div>

            <p
              key={tricked ? "tricked" : "prompt"}
              className="text-[20px] text-accent text-center leading-snug px-2 select-none"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              {tricked ? "Hahaha, it's anime character bro 😂" : "psst... drag the mask onto him 👆"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}