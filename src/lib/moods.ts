// Visual presets for the water. Colors are authored as sRGB hex and converted
// to linear-space floats before upload (the shader works in linear light and
// applies gamma at the end).

export interface Mood {
  id: string;
  label: string;
  deep: RGB;
  tileA: RGB;
  tileB: RGB;
  grout: RGB;
  sun: RGB;
  absorb: RGB;
  depth: number;
  caustic: number;
  wash: number;
  spec: number;
  tileCount: number;
  waveAmp: number;
  chroma: number;
  particles: number;
}

type RGB = [number, number, number];

function hexToLinear(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  const srgb = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  return srgb.map((c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  ) as RGB;
}

const absorb: RGB = [0.55, 0.15, 0.09];

export const MOODS: Mood[] = [
  {
    id: "deep",
    label: "Глубина",
    // Photo 1: calm saturated blue, soft diffuse light.
    deep: hexToLinear("#0a3d63"),
    tileA: hexToLinear("#8ccfe4"),
    tileB: hexToLinear("#7cc2da"),
    grout: hexToLinear("#0c364f"),
    sun: hexToLinear("#dff2ff"),
    absorb,
    depth: 2.4,
    caustic: 0.5,
    wash: 0.05,
    spec: 0.55,
    tileCount: 6.0,
    waveAmp: 0.9,
    chroma: 0.3,
    particles: 0.6,
  },
  {
    id: "sun",
    label: "Солнце",
    // Photo 2: bright shallow turquoise, strong caustics and white glints.
    deep: hexToLinear("#1b7d8c"),
    tileA: hexToLinear("#f2fcfb"),
    tileB: hexToLinear("#d9f3f1"),
    grout: hexToLinear("#0f6172"),
    sun: hexToLinear("#fff3da"),
    absorb,
    depth: 1.0,
    caustic: 1.15,
    wash: 0.6,
    spec: 1.5,
    tileCount: 8.2,
    waveAmp: 1.05,
    chroma: 1.1,
    particles: 0.2,
  },
  {
    id: "dusk",
    label: "Сумерки",
    // Quiet evening mood: deep teal-indigo and warm low sun.
    deep: hexToLinear("#07243f"),
    tileA: hexToLinear("#74adcb"),
    tileB: hexToLinear("#629abd"),
    grout: hexToLinear("#04182b"),
    sun: hexToLinear("#ffd39e"),
    absorb,
    depth: 2.1,
    caustic: 0.32,
    wash: 0.08,
    spec: 0.8,
    tileCount: 6.6,
    waveAmp: 0.7,
    chroma: 0.35,
    particles: 1.0,
  },
];

export const DEFAULT_MOOD = MOODS[0];

// Flat numeric layout used by the renderer for smooth interpolation.
export interface MoodState {
  deep: RGB;
  tileA: RGB;
  tileB: RGB;
  grout: RGB;
  sun: RGB;
  absorb: RGB;
  scalars: {
    depth: number;
    caustic: number;
    wash: number;
    spec: number;
    tileCount: number;
    waveAmp: number;
    chroma: number;
    particles: number;
  };
}

export function moodToState(m: Mood): MoodState {
  return {
    deep: [...m.deep] as RGB,
    tileA: [...m.tileA] as RGB,
    tileB: [...m.tileB] as RGB,
    grout: [...m.grout] as RGB,
    sun: [...m.sun] as RGB,
    absorb: [...m.absorb] as RGB,
    scalars: {
      depth: m.depth,
      caustic: m.caustic,
      wash: m.wash,
      spec: m.spec,
      tileCount: m.tileCount,
      waveAmp: m.waveAmp,
      chroma: m.chroma,
      particles: m.particles,
    },
  };
}

const LERP_KEYS = ["deep", "tileA", "tileB", "grout", "sun", "absorb"] as const;
const SCALAR_KEYS: (keyof MoodState["scalars"])[] = [
  "depth",
  "caustic",
  "wash",
  "spec",
  "tileCount",
  "waveAmp",
  "chroma",
  "particles",
];

function lerp(a: number, b: number, k: number) {
  return a + (b - a) * k;
}

/** Smoothly move `cur` toward `target`. Mutates and returns `cur`. */
export function lerpMood(cur: MoodState, target: MoodState, k: number): MoodState {
  for (const key of LERP_KEYS) {
    for (let i = 0; i < 3; i++) {
      cur[key][i] = lerp(cur[key][i], target[key][i], k);
    }
  }
  for (const key of SCALAR_KEYS) {
    cur.scalars[key] = lerp(cur.scalars[key], target.scalars[key], k);
  }
  return cur;
}
