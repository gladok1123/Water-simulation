"use client";

import { useEffect, useRef } from "react";
import { FRAGMENT_SHADER, MAX_RIPPLES, VERTEX_SHADER } from "@/lib/shaders";
import {
  DEFAULT_MOOD,
  lerpMood,
  moodToState,
  MOODS,
  type MoodState,
} from "@/lib/moods";

interface Ripple {
  x: number;
  y: number;
  t: number;
  strength: number;
}

interface WaterCanvasProps {
  moodId: string;
  autoDrops: boolean;
  onDrop?: (strength: number) => void;
  onInteract?: () => void;
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error: " + log);
  }
  return shader;
}

export default function WaterCanvas({
  moodId,
  autoDrops,
  onDrop,
  onInteract,
}: WaterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ moodId, autoDrops, onDrop, onInteract });
  propsRef.current = { moodId, autoDrops, onDrop, onInteract };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    gl.getExtension("OES_standard_derivatives");

    // Program --------------------------------------------------------------
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      time: u("uTime"),
      resolution: u("uResolution"),
      rippleCount: u("uRippleCount"),
      ripples: u("uRipples"),
      deep: u("uDeep"),
      tileA: u("uTileA"),
      tileB: u("uTileB"),
      grout: u("uGrout"),
      sun: u("uSun"),
      absorb: u("uAbsorb"),
      depth: u("uDepth"),
      caustic: u("uCaustic"),
      wash: u("uWash"),
      spec: u("uSpec"),
      tileCount: u("uTileCount"),
      waveAmp: u("uWaveAmp"),
      chroma: u("uChroma"),
      particles: u("uParticles"),
    };

    // State ----------------------------------------------------------------
    const ripples: Ripple[] = [];
    const moodTargets = new Map(MOODS.map((m) => [m.id, moodToState(m)]));
    let simTime = 0;
    let lastTs: number | null = null;
    let current: MoodState = moodToState(DEFAULT_MOOD);
    let dropTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    let lastMoveRipple = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const addRipple = (nx: number, ny: number, strength: number) => {
      ripples.push({ x: nx, y: ny, t: simTime, strength });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    };

    const scheduleDrop = () => {
      if (dropTimer) clearTimeout(dropTimer);
      const delay = 2600 + Math.random() * 4200;
      dropTimer = setTimeout(() => {
        if (disposed) return;
        if (propsRef.current.autoDrops) {
          addRipple(0.08 + Math.random() * 0.84, 0.08 + Math.random() * 0.84, 0.5);
          propsRef.current.onDrop?.(0.4 + Math.random() * 0.3);
        }
        scheduleDrop();
      }, delay);
    };
    scheduleDrop();

    const toGlCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / rect.width,
        y: 1 - (clientY - rect.top) / rect.height,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      const p = toGlCoords(e.clientX, e.clientY);
      addRipple(p.x, p.y, 1.0);
      propsRef.current.onInteract?.();
    };
    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastMoveRipple < 110) return;
      lastMoveRipple = now;
      const p = toGlCoords(e.clientX, e.clientY);
      addRipple(p.x, p.y, 0.16);
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);

    // Render loop ----------------------------------------------------------
    const frame = (ts: number) => {
      if (disposed) return;
      const dt = lastTs === null ? 0.016 : Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      simTime += dt;

      resize();

      // Ease current mood toward the selected one.
      const target =
        moodTargets.get(propsRef.current.moodId) ?? moodTargets.get(DEFAULT_MOOD.id)!;
      current = lerpMood(current, target, 1 - Math.exp(-dt * 2.4));

      // Prune spent ripples.
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (simTime - ripples[i].t > 7) ripples.splice(i, 1);
      }

      gl.uniform1f(uniforms.time, simTime);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);

      const rippleData = new Float32Array(MAX_RIPPLES * 4);
      for (let i = 0; i < MAX_RIPPLES; i++) {
        const r = ripples[i];
        if (r) {
          rippleData[i * 4] = r.x;
          rippleData[i * 4 + 1] = r.y;
          rippleData[i * 4 + 2] = r.t;
          rippleData[i * 4 + 3] = r.strength;
        } else {
          rippleData[i * 4 + 2] = -100;
        }
      }
      gl.uniform1i(uniforms.rippleCount, ripples.length);
      gl.uniform4fv(uniforms.ripples, rippleData);

      gl.uniform3fv(uniforms.deep, current.deep);
      gl.uniform3fv(uniforms.tileA, current.tileA);
      gl.uniform3fv(uniforms.tileB, current.tileB);
      gl.uniform3fv(uniforms.grout, current.grout);
      gl.uniform3fv(uniforms.sun, current.sun);
      gl.uniform3fv(uniforms.absorb, current.absorb);
      gl.uniform1f(uniforms.depth, current.scalars.depth);
      gl.uniform1f(uniforms.caustic, current.scalars.caustic);
      gl.uniform1f(uniforms.wash, current.scalars.wash);
      gl.uniform1f(uniforms.spec, current.scalars.spec);
      gl.uniform1f(uniforms.tileCount, current.scalars.tileCount);
      gl.uniform1f(uniforms.waveAmp, current.scalars.waveAmp);
      gl.uniform1f(uniforms.chroma, current.scalars.chroma);
      gl.uniform1f(uniforms.particles, current.scalars.particles);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    let raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (dropTimer) clearTimeout(dropTimer);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="water-cursor absolute inset-0 h-full w-full touch-none"
      aria-hidden="true"
    />
  );
}
