import type { SoundKind } from "./settings";

/**
 * Keystroke sounds synthesized once into AudioBuffers — no files to fetch,
 * and buffer playback keeps latency to a few ms.
 */

type Voice = Exclude<SoundKind, "off"> | "error";

let ctx: AudioContext | null = null;
const buffers = new Map<Voice, AudioBuffer>();

function render(c: AudioContext, seconds: number, fn: (t: number, i: number) => number) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = fn(i / c.sampleRate, i);
  return buf;
}

function build(c: AudioContext) {
  // Crisp mechanical click: filtered noise with a very fast decay.
  let last = 0;
  buffers.set(
    "click",
    render(c, 0.03, (t) => {
      const n = Math.random() * 2 - 1;
      last = n - last * 0.6; // crude high-pass for a "tick"
      return last * 0.5 * Math.exp(-t * 220);
    }),
  );
  // Soft pop: short pitched sine drop.
  buffers.set(
    "soft",
    render(c, 0.05, (t) => Math.sin(2 * Math.PI * (700 - t * 4000) * t) * 0.5 * Math.exp(-t * 90)),
  );
  // Typewriter: noisy strike on top of a low thump.
  buffers.set(
    "typewriter",
    render(c, 0.06, (t) => {
      const strike = (Math.random() * 2 - 1) * Math.exp(-t * 160) * 0.45;
      const thump = Math.sin(2 * Math.PI * 140 * t) * Math.exp(-t * 60) * 0.5;
      return strike + thump;
    }),
  );
  // Error: low square buzz.
  buffers.set(
    "error",
    render(c, 0.08, (t) => (Math.sin(2 * Math.PI * 180 * t) > 0 ? 0.25 : -0.25) * Math.exp(-t * 35)),
  );
}

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  ctx = new AudioContext({ latencyHint: "interactive" });
  build(ctx);
  return ctx;
}

export function playSound(voice: Voice, volume: number) {
  if (volume <= 0) return;
  const c = ensureContext();
  const buf = c && buffers.get(voice);
  if (!c || !buf) return;
  if (c.state === "suspended") void c.resume();

  const src = c.createBufferSource();
  src.buffer = buf;
  // Slight pitch variance so rapid typing doesn't sound robotic.
  src.playbackRate.value = voice === "error" ? 1 : 0.92 + Math.random() * 0.16;
  const gain = c.createGain();
  gain.gain.value = volume;
  src.connect(gain).connect(c.destination);
  src.start();
}
