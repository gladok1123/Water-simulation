"use client";

import { useEffect, useRef, useState } from "react";
import WaterCanvas from "@/components/WaterCanvas";
import Controls from "@/components/Controls";
import BreathingOverlay from "@/components/BreathingOverlay";
import { WaterSound } from "@/lib/sound";

export default function HomePage() {
  const [entered, setEntered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [moodId, setMoodId] = useState("deep");
  const [soundOn, setSoundOn] = useState(false);
  const [dropsOn, setDropsOn] = useState(true);
  const [breathingOn, setBreathingOn] = useState(false);

  const soundRef = useRef<WaterSound | null>(null);

  useEffect(() => {
    return () => soundRef.current?.dispose();
  }, []);

  const handleEnter = async () => {
    if (!soundRef.current) soundRef.current = new WaterSound();
    await soundRef.current.enable();
    setSoundOn(true);
    setEntered(true);
    setTimeout(() => setHidden(true), 1100);
  };

  const toggleSound = async () => {
    if (!soundRef.current) soundRef.current = new WaterSound();
    if (soundOn) {
      soundRef.current.disable();
      setSoundOn(false);
    } else {
      await soundRef.current.enable();
      setSoundOn(true);
    }
  };

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#0a3d63] text-white">
      <WaterCanvas
        moodId={moodId}
        autoDrops={dropsOn}
        onDrop={(s) => soundRef.current?.droplet(s)}
        onInteract={() => soundRef.current?.droplet(1)}
      />

      {/* Legibility gradients */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-sky-950/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-sky-950/30 to-transparent" />

      {/* Header */}
      <header
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-5 pt-5 transition-all duration-1000 sm:px-8 sm:pt-7 ${
          entered ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3.5s5.5 6 5.5 10.2a5.5 5.5 0 1 1-11 0C6.5 9.5 12 3.5 12 3.5Z"
                stroke="white"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="font-serif text-xl leading-none tracking-[0.18em] text-white">ШТИЛЬ</p>
            <p className="mt-1 text-[0.62rem] uppercase tracking-[0.3em] text-white/65">
              медитация на воде
            </p>
          </div>
        </div>
        <p className="mt-2 hidden max-w-[14rem] text-right text-[0.7rem] font-light leading-relaxed tracking-wide text-white/60 md:block">
          Касайтесь воды — от прикосновений расходятся круги
        </p>
      </header>

      <BreathingOverlay active={breathingOn && entered} />

      <div
        className={`transition-opacity duration-1000 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      >
        <Controls
          moodId={moodId}
          onMoodChange={setMoodId}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          dropsOn={dropsOn}
          onToggleDrops={() => setDropsOn((v) => !v)}
          breathingOn={breathingOn}
          onToggleBreathing={() => setBreathingOn((v) => !v)}
        />
      </div>

      {/* Intro overlay */}
      {!hidden && (
        <div
          className={`absolute inset-0 z-40 flex items-center justify-center bg-gradient-to-b from-[#08324f]/70 via-[#0d5a83]/45 to-[#0a3d63]/70 backdrop-blur-sm transition-opacity duration-1000 ${
            entered ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex max-w-md flex-col items-center px-8 text-center">
            <p className="mb-6 text-[0.68rem] uppercase tracking-[0.5em] text-cyan-100/70">
              расслабляющая симуляция
            </p>
            <h1 className="font-serif text-6xl font-light leading-tight text-white sm:text-7xl">
              Штиль
            </h1>
            <p className="mt-5 text-sm font-light leading-relaxed text-white/75 sm:text-base">
              Бирюзовая вода бассейна, солнечные блики на кафеле и медленные
              волны. Дышите в такт кругам и никуда не спешите.
            </p>
            <button
              type="button"
              onClick={handleEnter}
              className="intro-pulse group mt-10 rounded-full border border-white/30 bg-white/10 px-9 py-3.5 text-sm uppercase tracking-[0.3em] text-white backdrop-blur-md transition-all duration-300 hover:border-white/60 hover:bg-white/20"
            >
              Прикоснуться к воде
            </button>
            <p className="mt-6 text-[0.68rem] uppercase tracking-[0.3em] text-white/45">
              в наушниках спокойнее
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
