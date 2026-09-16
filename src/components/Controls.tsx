"use client";

import type { ComponentType, ReactNode } from "react";
import { MOODS } from "@/lib/moods";

interface ControlsProps {
  moodId: string;
  onMoodChange: (id: string) => void;
  soundOn: boolean;
  onToggleSound: () => void;
  dropsOn: boolean;
  onToggleDrops: () => void;
  breathingOn: boolean;
  onToggleBreathing: () => void;
}

function WaveIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 9c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className={active ? "opacity-100" : "opacity-80"}
      />
      <path
        d="M2 15c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="opacity-60"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    </svg>
  );
}

const MOOD_ICONS: Record<string, ComponentType<{ active?: boolean }>> = {
  deep: WaveIcon,
  sun: SunIcon,
  dusk: MoonIcon,
};

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {on ? (
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M15.5 9.5a4 4 0 0 1 0 5" />
          <path d="M18 7a7.5 7.5 0 0 1 0 10" className="opacity-70" />
        </g>
      ) : (
        <path d="m16 9.5 4 5M20 9.5l-4 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

function DropIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5s5.5 6 5.5 10.2a5.5 5.5 0 1 1-11 0C6.5 9.5 12 3.5 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        className={on ? "" : "opacity-70"}
      />
      {on && <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />}
    </svg>
  );
}

function BreathIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" className={on ? "" : "opacity-70"} />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.4" className={on ? "opacity-100" : "opacity-40"} />
    </svg>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
        active
          ? "bg-white/90 text-sky-900 shadow-[0_0_18px_rgba(180,230,255,0.55)]"
          : "text-white/75 hover:bg-white/15 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function Controls({
  moodId,
  onMoodChange,
  soundOn,
  onToggleSound,
  dropsOn,
  onToggleDrops,
  breathingOn,
  onToggleBreathing,
}: ControlsProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-5 sm:pb-7">
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-white/20 bg-sky-950/30 px-2 py-1.5 shadow-[0_10px_40px_rgba(5,35,60,0.35)] backdrop-blur-xl sm:gap-2 sm:px-3">
        <div className="flex items-center gap-1 rounded-full bg-white/5 p-1">
          {MOODS.map((m) => {
            const Icon = MOOD_ICONS[m.id] ?? WaveIcon;
            const selected = m.id === moodId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onMoodChange(m.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-300 sm:text-[0.8rem] ${
                  selected
                    ? "bg-white/90 text-sky-900 shadow-[0_0_16px_rgba(180,230,255,0.45)]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Icon />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mx-1 hidden h-6 w-px bg-white/15 sm:block" />

        <ToggleButton label={soundOn ? "Выключить звук" : "Включить звук"} active={soundOn} onClick={onToggleSound}>
          <SoundIcon on={soundOn} />
        </ToggleButton>
        <ToggleButton label={dropsOn ? "Убрать капли" : "Капли воды"} active={dropsOn} onClick={onToggleDrops}>
          <DropIcon on={dropsOn} />
        </ToggleButton>
        <ToggleButton
          label={breathingOn ? "Выключить дыхание" : "Дыхательный круг"}
          active={breathingOn}
          onClick={onToggleBreathing}
        >
          <BreathIcon on={breathingOn} />
        </ToggleButton>
      </div>
    </div>
  );
}
