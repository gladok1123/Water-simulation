// Fully synthesized ambient soundscape: looping filtered noise for the soft
// water "wash", a quiet three-note drone for warmth, and droplet "plinks"
// with a tape-style echo. No audio assets required.

export class WaterSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private shimmerGain: GainNode | null = null;
  private enabled = false;
  private wanderTimer: ReturnType<typeof setInterval> | null = null;

  get isEnabled() {
    return this.enabled;
  }

  private build() {
    if (this.ctx) return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    // Shared echo for droplets.
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.21;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(master);
    this.delay = delay;

    // --- Water wash: looping white noise through a low-pass filter -------
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      // Brown-ish noise for a softer, deeper wash.
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 420;
    noiseFilter.Q.value = 0.6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.16;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start();
    this.noiseFilter = noiseFilter;

    // High airy shimmer for livelier water.
    const shimmer = ctx.createBufferSource();
    shimmer.buffer = noiseBuf;
    shimmer.loop = true;
    shimmer.playbackRate.value = 0.73;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1900;
    bp.Q.value = 0.5;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.012;
    shimmer.connect(bp).connect(shimmerGain).connect(master);
    shimmer.start();
    this.shimmerGain = shimmerGain;

    // Slow random drift of the filters.
    this.wanderTimer = setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      noiseFilter.frequency.setTargetAtTime(340 + Math.random() * 260, t, 1.5);
      bp.frequency.setTargetAtTime(1500 + Math.random() * 900, t, 2.0);
      shimmerGain.gain.setTargetAtTime(0.006 + Math.random() * 0.014, t, 2.0);
    }, 3200);

    // --- Soft drone: C major pad, very quiet -----------------------------
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.035;
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 620;
    droneGain.connect(droneFilter).connect(master);

    const freqs = [130.81, 196.0, 261.63, 329.63];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      osc.detune.value = (i - 1.5) * 4;
      const g = ctx.createGain();
      g.gain.value = i === 3 ? 0.18 : 0.4;
      osc.connect(g).connect(droneGain);
      osc.start();
      // Very slow breathing of each voice.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.017;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = g.gain.value * 0.35;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();
    });
  }

  private delay: DelayNode | null = null;

  async enable() {
    this.build();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0.85, t, 0.6);
    this.enabled = true;
  }

  disable() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, 0.4);
    this.enabled = false;
  }

  /** Short pitched-down water droplet with an echo tail. */
  droplet(strength = 0.6) {
    if (!this.enabled || !this.ctx || !this.master || !this.delay) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.01;
    const base = 520 + Math.random() * 480;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(base * 1.8, t);
    osc.frequency.exponentialRampToValueAtTime(base * 0.45, t + 0.18);

    const g = ctx.createGain();
    const vol = 0.05 + strength * 0.09;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

    osc.connect(g);
    g.connect(this.master);
    g.connect(this.delay);
    osc.start(t);
    osc.stop(t + 0.7);

    // Small click of the impact.
    const click = ctx.createOscillator();
    click.type = "triangle";
    click.frequency.setValueAtTime(base * 2.6, t);
    click.frequency.exponentialRampToValueAtTime(base * 1.1, t + 0.03);
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(vol * 0.5, t);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    click.connect(cg);
    cg.connect(this.master);
    click.start(t);
    click.stop(t + 0.08);
  }

  dispose() {
    if (this.wanderTimer) clearInterval(this.wanderTimer);
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
