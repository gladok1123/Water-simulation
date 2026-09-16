"use client";

import { useEffect, useRef, useState } from "react";

const PHASES = [
  { key: "in", label: "Вдох", duration: 4000 },
  { key: "hold", label: "Задержка", duration: 2000 },
  { key: "out", label: "Выдох", duration: 6000 },
] as const;

const MIN_SCALE = 0.68;
const MAX_SCALE = 1;

function cycleWord(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "цикл";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "цикла";
  return "циклов";
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export default function BreathingOverlay({ active }: { active: boolean }) {
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<(typeof PHASES)[number]["key"]>("in");
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let start = performance.now();
    let lastPhase = "";
    let cycleStart = 0;

    const tick = (now: number) => {
      const total = PHASES.reduce((s, p) => s + p.duration, 0);
      const elapsed = (now - start) % total;

      let acc = 0;
      let scale = MIN_SCALE;
      let currentKey: (typeof PHASES)[number]["key"] = "in";

      for (let i = 0; i < PHASES.length; i++) {
        const p = PHASES[i];
        if (elapsed < acc + p.duration) {
          const local = (elapsed - acc) / p.duration;
          currentKey = p.key;
          if (p.key === "in") scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * easeInOut(local);
          else if (p.key === "out") scale = MAX_SCALE - (MAX_SCALE - MIN_SCALE) * easeInOut(local);
          else scale = MAX_SCALE;
          break;
        }
        acc += p.duration;
      }

      if (currentKey !== lastPhase) {
        lastPhase = currentKey;
        setPhase(currentKey);
        if (currentKey === "in") {
          if (cycleStart) setCycles((c) => c + 1);
          cycleStart = 1;
        }
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(4)})`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(-50%, -50%) scale(${(scale * 1.18).toFixed(4)})`;
        glowRef.current.style.opacity = (0.35 + scale * 0.45).toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;

  const label = PHASES.find((p) => p.key === phase)?.label ?? "";

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
      <div
        ref={glowRef}
        className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] rounded-full bg-cyan-200/40 blur-3xl"
        style={{ transform: "translate(-50%, -50%)" }}
      />
      <div
        ref={ringRef}
        className="absolute left-1/2 top-1/2 flex h-72 w-72 items-center justify-center rounded-full border border-white/40 bg-white/5 shadow-[0_0_60px_rgba(165,230,255,0.25),inset_0_0_50px_rgba(255,255,255,0.12)] backdrop-blur-[2px]"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div className="absolute inset-3 rounded-full border border-white/15" />
        <div className="text-center">
          <p className="font-serif text-3xl font-light tracking-wide text-white drop-shadow-[0_2px_12px_rgba(10,60,90,0.6)]">
            {label}
          </p>
          <p className="mt-2 h-4 text-[0.7rem] uppercase tracking-[0.35em] text-white/70">
            {cycles > 0 && `${cycles} ${cycleWord(cycles)}`}
          </p>
        </div>
      </div>
      <p className="absolute bottom-32 text-xs font-light tracking-[0.3em] text-white/60 uppercase sm:bottom-36">
        следуйте за кругом
      </p>
    </div>
  );
}
