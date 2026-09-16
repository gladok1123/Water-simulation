// WebGL shaders for the pool-water simulation.
// The fragment shader renders a tiled pool floor viewed through an animated
// water surface: summed sine/Gerstner-like waves produce surface normals that
// refract the floor (warping the tile grid), caustic networks are faked with
// an interference pattern + geometric convergence, and sharp specular glints
// mimic sunlight reflecting off the ripples.

export const MAX_RIPPLES = 20;

export const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `
#extension GL_OES_standard_derivatives : enable
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform int   uRippleCount;
uniform vec4  uRipples[${MAX_RIPPLES}];

uniform vec3  uDeep;      // deep-water color (linear)
uniform vec3  uTileA;     // pool tile color variant A (linear)
uniform vec3  uTileB;     // pool tile color variant B (linear)
uniform vec3  uGrout;     // grout line color (linear)
uniform vec3  uSun;       // sunlight color / tint (linear)
uniform vec3  uAbsorb;    // per-channel absorption coefficients

uniform float uDepth;     // water depth in tile units
uniform float uCaustic;   // caustic intensity
uniform float uWash;      // broad sunlight wash intensity
uniform float uSpec;      // specular glint intensity
uniform float uTileCount; // vertical tile count
uniform float uWaveAmp;   // wave amplitude multiplier
uniform float uChroma;    // chromatic aberration amount
uniform float uParticles; // suspended particle amount

const float TAU = 6.28318530718;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Layered traveling waves — gentle swell plus fine capillary ripples.
float waveHeight(vec2 p, float t) {
  float h = 0.0;
  h += 0.100  * sin(dot(p, normalize(vec2( 1.00, 0.35))) * 1.10 + t * 0.50);
  h += 0.072  * sin(dot(p, normalize(vec2(-0.40, 1.00))) * 1.65 - t * 0.62);
  h += 0.046  * sin(dot(p, normalize(vec2(-1.00,-0.15))) * 2.60 + t * 0.85);
  h += 0.028  * sin(dot(p, normalize(vec2( 0.25,-1.00))) * 3.70 - t * 1.05);
  h += 0.016  * sin(dot(p, normalize(vec2( 0.80,-0.65))) * 6.20 + t * 1.45);
  h += 0.009  * sin(dot(p, normalize(vec2(-0.55, 0.55))) * 10.5 - t * 1.90);
  h += 0.005  * sin(dot(p, normalize(vec2( 0.30, 1.00))) * 17.0 + t * 2.30);

  // Interactive expanding ripple rings (droplets / touches).
  float aspect = uResolution.x / uResolution.y;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    if (i >= uRippleCount) break;
    vec4 r = uRipples[i];
    float age = t - r.z;
    if (age <= 0.0) continue;
    vec2 rp = (r.xy - 0.5) * vec2(aspect, 1.0) * uTileCount;
    float d = distance(p, rp);
    float front = age * 3.1;
    float envelope = exp(-age * 0.85) * exp(-abs(d - front) * 1.5) * r.w;
    h += sin((d - front) * 13.5) * 0.055 * envelope;
    // faint secondary ring
    envelope *= 0.35;
    h += sin((d - front + 0.55) * 13.5) * 0.055 * envelope;
  }
  return h * uWaveAmp;
}

vec3 waterNormal(vec2 p, float t) {
  float e = 0.045;
  float hL = waveHeight(p - vec2(e, 0.0), t);
  float hR = waveHeight(p + vec2(e, 0.0), t);
  float hD = waveHeight(p - vec2(0.0, e), t);
  float hU = waveHeight(p + vec2(0.0, e), t);
  return normalize(vec3(hL - hR, hD - hU, 2.0 * e));
}

// Classic cheap animated caustic network (Dave Wallin style).
float causticPattern(vec2 uv, float t) {
  vec2 p = mod(uv * TAU, TAU) - 250.0;
  vec2 i = p;
  float c = 1.0;
  float inten = 0.0045;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y),
                 sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten),
                          p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0;
  c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.25);
}

// Procedural tiled pool floor + the light that lands on it.
vec3 floorAt(vec2 fuv, float t, float baseFw) {
  vec2 cell = floor(fuv);
  vec2 f = fract(fuv);

  // Anti-aliased grout lines (pixel-constant width).
  float lw = max(fwidth(fuv.x), fwidth(fuv.y)) * 1.15;
  float dEdge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
  float grout = 1.0 - smoothstep(lw, lw * 2.4, dEdge);

  // Tile base with gentle per-tile color variation.
  float v1 = hash21(cell);
  float v2 = hash21(cell + 19.19);
  vec3 col = mix(uTileA, uTileB, v1);
  col *= 0.90 + 0.20 * v2;

  // Tiny dirt specks and imperfections.
  vec2 speckCell = floor(fuv * 38.0);
  float speck = hash21(speckCell + cell * 0.1);
  if (speck > 0.985) col *= 0.82;

  // Soft inner shadow next to the grout (ceramic bevel / AO).
  float ao = smoothstep(0.0, lw * 4.5, dEdge);
  col *= mix(0.68, 1.0, ao);

  // Grout itself, slightly varied.
  vec3 groutCol = uGrout * (0.75 + 0.5 * hash21(cell + 7.7));
  col = mix(col, groutCol, grout);

  // Large slow soft light patches.
  float soft = 0.5 + 0.5 * (
      0.6 * sin(dot(fuv, normalize(vec2(0.4, 1.0))) * 1.25 + t * 0.35)
    + 0.4 * sin(dot(fuv, normalize(vec2(-1.0, 0.3))) * 0.9 - t * 0.22));

  // Sharp caustic netting, two scales.
  float c1 = causticPattern(fuv * 1.15, t * 0.42);
  float c2 = causticPattern(fuv * 2.35 + 11.7, t * 0.62);
  float caustics = c1 * 0.95 + c2 * 0.38;

  // Geometric focusing: where refracted rays converge the floor brightens.
  float j = fwidth(fuv.x) + fwidth(fuv.y);
  float focus = clamp(1.4 - j / (baseFw + 1e-5), 0.0, 1.0);

  vec3 light = uSun * ((caustics + 0.10 * soft) * 1.05 + pow(focus, 2.0) * 0.7);
  col += light * uCaustic;

  return col;
}

// Drifting motes suspended in the water.
float motes(vec2 world, float t) {
  float m = 0.0;
  for (int layer = 0; layer < 2; layer++) {
    float fl = float(layer);
    float scale = 2.6 + fl * 2.2;
    vec2 g = world * scale + vec2(t * (0.020 + fl * 0.015), -t * (0.045 + fl * 0.03));
    vec2 id = floor(g);
    vec2 cf = fract(g) - 0.5;
    float h1 = hash21(id + fl * 17.3);
    float h2 = hash21(id + fl * 31.7);
    vec2 pos = cf - (vec2(h1, h2) - 0.5) * 0.7;
    float d = length(pos);
    float tw = 0.4 + 0.6 * sin(t * 0.6 + h1 * 19.0);
    m += smoothstep(0.055, 0.0, d) * tw * (0.7 - fl * 0.25);
  }
  return m;
}

float sparkle(vec2 world, float t, vec3 n) {
  vec2 grid = world * 110.0;
  vec2 id = floor(grid);
  vec2 cf = fract(grid) - 0.5;
  float h = hash21(id);
  float phase = h * TAU;
  float tw = pow(0.5 + 0.5 * sin(t * (1.5 + h * 3.0) + phase), 18.0);
  float star = smoothstep(0.30, 0.0, abs(cf.x)) * smoothstep(0.045, 0.0, abs(cf.y))
             + smoothstep(0.30, 0.0, abs(cf.y)) * smoothstep(0.045, 0.0, abs(cf.x));
  float gate = step(0.82, h) * step(0.25, n.z);
  return star * tw * gate * 0.5;
}

void main() {
  float t = uTime;
  float aspect = uResolution.x / uResolution.y;
  vec2 world = (vUv - 0.5) * vec2(aspect, 1.0) * uTileCount;

  vec3 n = waterNormal(world, t);

  // Refracted floor coordinate (small-angle Snell approximation).
  vec2 refr = n.xy * uDepth * 0.82;
  vec2 fuv = world + refr;
  float baseFw = fwidth(world.x) + fwidth(world.y);

  // Chromatic split of the refracted floor (rainbow fringes on tile edges).
  vec2 cOff = n.xy * (0.028 * uChroma * uDepth);
  vec3 floorCol;
  floorCol.r = floorAt(fuv + cOff, t, baseFw).r;
  floorCol.g = floorAt(fuv,        t, baseFw).g;
  floorCol.b = floorAt(fuv - cOff, t, baseFw).b;

  // Beer-Lambert absorption with depth.
  vec3 transmit = exp(-uAbsorb * uDepth);
  vec3 col = floorCol * transmit + uDeep * (1.0 - transmit);

  // Sun & sky reflected at the rippled surface.
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(0.42, 0.55, 0.62));
  vec3 H = normalize(L + V);
  float NdH = max(dot(n, H), 0.0);
  float sharp = pow(NdH, 240.0) * 1.7;
  float broad = pow(NdH, 22.0) * 0.18;
  float fres = pow(clamp(1.0 - n.z, 0.0, 1.0), 2.5) * 0.12;
  vec3 skyCol = mix(vec3(0.62, 0.82, 0.95), uSun, 0.45);
  col += uSun * sharp * uSpec;
  col += skyCol * (broad + fres) * (0.4 + uSpec * 0.5);

  // Tiny capillary glints.
  col += uSun * sparkle(world, t, n) * uSpec;

  // Broad sunlit wash (bright shallows corner).
  vec2 wq = vUv - vec2(0.80, 0.95);
  float wash = exp(-dot(wq, wq) * 4.2) * 0.55 + exp(-dot(wq, wq) * 1.1) * 0.22;
  col += uSun * wash * uWash;

  // Suspended motes.
  col += vec3(0.78, 0.92, 1.0) * motes(world, t) * 0.10 * uParticles;

  // Vignette.
  vec2 vg = vUv - 0.5;
  float vig = smoothstep(0.95, 0.30, dot(vg, vg) * 1.7);
  col *= mix(1.0, vig, 0.38);

  // Gentle grade + linear -> sRGB.
  col = pow(max(col, 0.0), vec3(0.95));
  col = pow(col, vec3(1.0 / 2.2));

  // Fine film grain.
  float grain = hash21(vUv * uResolution + fract(t) * 17.0) - 0.5;
  col += grain * 0.016;

  gl_FragColor = vec4(col, 1.0);
}
`;
