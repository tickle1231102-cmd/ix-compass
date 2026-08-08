"use client";

/** Lightweight procedural SFX — no audio assets required. */

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  if (sharedCtx.state === "suspended") {
    void sharedCtx.resume();
  }
  return sharedCtx;
}

function tone(
  ctx: AudioContext,
  {
    freq,
    type = "sine",
    start = 0,
    duration = 0.2,
    gain = 0.08,
    slideTo,
  }: {
    freq: number;
    type?: OscillatorType;
    start?: number;
    duration?: number;
    gain?: number;
    slideTo?: number;
  }
) {
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, slideTo),
      t0 + duration
    );
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** Soft click / unwrap tap when gift is opened */
export function playGiftClick() {
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, { freq: 420, type: "triangle", duration: 0.08, gain: 0.06 });
  tone(ctx, {
    freq: 180,
    type: "sine",
    start: 0.02,
    duration: 0.12,
    gain: 0.04,
    slideTo: 90,
  });
}

/** Soft whoosh as particles / lid motion spreads */
export function playGiftWhoosh() {
  const ctx = getCtx();
  if (!ctx) return;
  // Filtered noise burst
  const t0 = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.55;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(600, t0);
  filter.frequency.exponentialRampToValueAtTime(2200, t0 + 0.45);
  filter.Q.value = 0.7;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
  src.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + 0.56);
}

/** Short chime when X / Welcome completes */
export function playGiftChime() {
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, { freq: 523.25, type: "sine", duration: 0.35, gain: 0.07 });
  tone(ctx, {
    freq: 659.25,
    type: "sine",
    start: 0.06,
    duration: 0.4,
    gain: 0.055,
  });
  tone(ctx, {
    freq: 783.99,
    type: "triangle",
    start: 0.12,
    duration: 0.5,
    gain: 0.04,
  });
}
