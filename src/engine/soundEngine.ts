// ── BoardCraft Web Audio Sound Engine ──
// Pure Web Audio API synthesis. No external audio files.
// AudioContext created lazily on first user interaction (autoplay policy).
//
// Everything runs through one bus: voices → master gain → gentle compressor,
// with a shared room reverb they can send to. The palette is physical rather
// than "beepy" — paper, a rubber stamp, a gavel, brass chimes, a quiet office —
// to match the desk-and-boardroom look of the game.

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let contextInitialised = false;
let masterVolume = 0.5;

const STORAGE_KEY = 'boardcraft_sound';
const VOLUME_KEY = 'boardcraft_volume_state';

// ── Volume levels for cycling ──
export type VolumeLevel = 'muted' | 'quiet' | 'normal' | 'loud';
const VOLUME_VALUES: Record<VolumeLevel, number> = {
  muted: 0, quiet: 0.35, normal: 0.65, loud: 0.9,
};
const VOLUME_ORDER: VolumeLevel[] = ['muted', 'quiet', 'normal', 'loud'];

// ── AudioContext management ──

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ── Bus ──

interface Bus {
  ctx: AudioContext;
  /** Master: every voice ends up here */
  out: GainNode;
  /** Send into the shared room reverb */
  verb: GainNode;
  white: AudioBuffer;
  brown: AudioBuffer;
}

let bus: Bus | null = null;

function makeNoise(ctx: AudioContext, seconds: number, brown: boolean): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = w;
    }
  }
  return buffer;
}

/** A small, warm room: dense early energy, ~1.5s tail, darker as it decays. */
function makeImpulse(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const w = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6);
      // one-pole low-pass that closes over time
      const k = 0.55 - 0.45 * t;
      lp += k * (w - lp);
      data[i] = lp;
    }
  }
  return buffer;
}

/**
 * The bus, or null when sound is off or the browser hasn't allowed audio yet.
 * Returning null (rather than scheduling on a suspended context) matters: a
 * suspended context's clock is frozen, so queued sounds would all fire at once
 * on the first click.
 */
function getBus(): Bus | null {
  if (!soundEnabled || typeof window === 'undefined') return null;
  let ctx: AudioContext;
  try {
    ctx = getCtx();
  } catch {
    return null;
  }
  if (ctx.state !== 'running') return null;
  if (!bus || bus.ctx !== ctx) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 18;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    comp.connect(ctx.destination);
    const out = ctx.createGain();
    out.connect(comp);
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(ctx, 1.7);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    const verb = ctx.createGain();
    verb.connect(conv);
    conv.connect(wet);
    wet.connect(out);
    bus = { ctx, out, verb, white: makeNoise(ctx, 2, false), brown: makeNoise(ctx, 4, true) };
  }
  bus.out.gain.value = masterVolume;
  return bus;
}

export function ensureAudioContext(): void {
  if (contextInitialised) return;
  contextInitialised = true;
  if (typeof window === 'undefined') return;
  const handler = () => {
    getCtx();
    document.removeEventListener('click', handler);
    document.removeEventListener('touchstart', handler);
  };
  document.addEventListener('click', handler, { once: true });
  document.addEventListener('touchstart', handler, { once: true });
}

// ── Persistence ──

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) soundEnabled = stored === 'on';
  const vol = localStorage.getItem(VOLUME_KEY);
  if (vol !== null && VOLUME_VALUES[vol as VolumeLevel] !== undefined) {
    masterVolume = VOLUME_VALUES[vol as VolumeLevel];
    if (vol === 'muted') soundEnabled = false;
  }
  return soundEnabled;
}

export function setSoundEnabled(on: boolean): void {
  soundEnabled = on;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  }
}

export function getVolumeLevel(): VolumeLevel {
  if (!soundEnabled) return 'muted';
  if (masterVolume <= 0.01) return 'muted';
  if (masterVolume <= 0.45) return 'quiet';
  if (masterVolume <= 0.75) return 'normal';
  return 'loud';
}

export function cycleVolume(): VolumeLevel {
  const current = getVolumeLevel();
  const idx = VOLUME_ORDER.indexOf(current);
  const next = VOLUME_ORDER[(idx + 1) % VOLUME_ORDER.length];
  masterVolume = VOLUME_VALUES[next];
  soundEnabled = next !== 'muted';
  if (bus) bus.out.gain.setTargetAtTime(masterVolume, bus.ctx.currentTime, 0.05);
  if (typeof window !== 'undefined') {
    localStorage.setItem(VOLUME_KEY, next);
    localStorage.setItem(STORAGE_KEY, soundEnabled ? 'on' : 'off');
  }
  return next;
}

// ── Voices ──

interface ToneOpts {
  f: number;
  /** Glide to this frequency over the note */
  f2?: number;
  /** Start offset in seconds */
  t?: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  /** Attack time */
  a?: number;
  /** Hold at full level before the decay starts */
  hold?: number;
  /** Reverb send 0–1 */
  verb?: number;
  /** Low-pass cutoff */
  lp?: number;
  pan?: number;
}

function route(b: Bus, node: AudioNode, verb = 0, pan = 0): void {
  let last: AudioNode = node;
  if (pan !== 0 && typeof b.ctx.createStereoPanner === 'function') {
    const p = b.ctx.createStereoPanner();
    p.pan.value = pan;
    last.connect(p);
    last = p;
  }
  last.connect(b.out);
  if (verb > 0) {
    const send = b.ctx.createGain();
    send.gain.value = verb;
    last.connect(send);
    send.connect(b.verb);
  }
}

function envelope(b: Bus, t0: number, dur: number, vol: number, a: number, hold: number): GainNode {
  const g = b.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + a);
  if (hold > 0) g.gain.setValueAtTime(vol, t0 + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  return g;
}

function tone(b: Bus, o: ToneOpts): void {
  const t0 = b.ctx.currentTime + (o.t ?? 0);
  const osc = b.ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.f, t0);
  if (o.f2 !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(o.f2, 1), t0 + o.dur);
  const g = envelope(b, t0, o.dur, o.vol ?? 0.1, o.a ?? 0.005, o.hold ?? 0);
  let last: AudioNode = osc;
  if (o.lp) {
    const f = b.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.lp;
    last.connect(f);
    last = f;
  }
  last.connect(g);
  route(b, g, o.verb, o.pan);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

interface NoiseOpts {
  t?: number;
  dur: number;
  vol?: number;
  kind?: BiquadFilterType;
  f: number;
  f2?: number;
  q?: number;
  a?: number;
  hold?: number;
  verb?: number;
  pan?: number;
  brown?: boolean;
}

function noise(b: Bus, o: NoiseOpts): void {
  const t0 = b.ctx.currentTime + (o.t ?? 0);
  const src = b.ctx.createBufferSource();
  src.buffer = o.brown ? b.brown : b.white;
  src.loop = true;
  const filt = b.ctx.createBiquadFilter();
  filt.type = o.kind ?? 'bandpass';
  filt.frequency.setValueAtTime(o.f, t0);
  if (o.f2 !== undefined) filt.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
  filt.Q.value = o.q ?? 0.8;
  const g = envelope(b, t0, o.dur, o.vol ?? 0.05, o.a ?? 0.005, o.hold ?? 0);
  src.connect(filt);
  filt.connect(g);
  route(b, g, o.verb, o.pan);
  src.start(t0, Math.random() * 1.5);
  src.stop(t0 + o.dur + 0.05);
}

/** Struck brass / glass: a fundamental with a few quieter, shorter overtones. */
function chime(b: Bus, f: number, vol: number, t = 0, dur = 1.5, verb = 0.6): void {
  const parts: [number, number, number][] = [[1, 1, 1], [2, 0.36, 0.7], [3.01, 0.15, 0.45], [4.2, 0.07, 0.3]];
  for (const [ratio, level, len] of parts) {
    tone(b, { f: f * ratio, t, dur: dur * len, vol: vol * level, a: 0.003, verb });
  }
}

/** A hand bell: inharmonic partials with a long tail. */
function bell(b: Bus, f: number, vol: number, t = 0): void {
  const parts: [number, number, number][] = [[0.5, 0.5, 3.6], [1, 1, 3.2], [1.19, 0.55, 2.4], [1.5, 0.4, 2.0], [2, 0.5, 1.7], [2.51, 0.28, 1.2], [3.01, 0.18, 0.9]];
  for (const [ratio, level, len] of parts) {
    tone(b, { f: f * ratio, t, dur: len, vol: vol * level, a: 0.004, verb: 0.7 });
  }
}

function thud(b: Bus, t: number, vol: number, f = 120, f2 = 48, dur = 0.22): void {
  tone(b, { f, f2, t, dur, vol, a: 0.002, verb: 0.2 });
  noise(b, { t, dur: 0.07, vol: vol * 0.55, kind: 'lowpass', f: 700, a: 0.001, verb: 0.2 });
}

function slide(b: Bus, t: number, vol: number): void {
  noise(b, { t, dur: 0.24, vol: 0.125 * vol, f: 2400, f2: 5200, q: 0.7, a: 0.035 });
  noise(b, { t: t + 0.02, dur: 0.09, vol: 0.036 * vol, kind: 'highpass', f: 6000, a: 0.01 });
}

function knock(b: Bus, t: number, vol: number): void {
  tone(b, { f: 210, f2: 120, t, dur: 0.1, vol: 0.34 * vol, type: 'triangle', a: 0.001, verb: 0.4 });
  noise(b, { t, dur: 0.03, vol: 0.16 * vol, f: 1300, q: 1.2, a: 0.001, verb: 0.4 });
}

// ── Public sound functions ──

/** A director takes a seat: the chair settles, then a brass chime. */
export function playBoardSeatDrop(): void {
  const b = getBus();
  if (!b) return;
  thud(b, 0, 0.3, 150, 85, 0.16);
  chime(b, 1174.7, 0.085, 0.03, 1.4);
  chime(b, 1760, 0.035, 0.1, 1.1);
}

/** A director leaves the table: a soft falling breath. */
export function playBoardSeatRemove(): void {
  const b = getBus();
  if (!b) return;
  noise(b, { dur: 0.24, vol: 0.06, f: 1800, f2: 500, q: 0.9, a: 0.02 });
  tone(b, { f: 220, f2: 140, dur: 0.2, vol: 0.07, a: 0.01 });
}

/** The board is locked: a heavy latch, then a warm chord that hangs in the room. */
export function playBoardConfirm(): void {
  const b = getBus();
  if (!b) return;
  thud(b, 0, 0.42, 95, 46, 0.28);
  tone(b, { f: 73.4, t: 0.05, dur: 1.5, vol: 0.14, a: 0.02 });
  [146.8, 220, 293.7, 370, 440].forEach((f, i) => {
    tone(b, { f, t: 0.08 + i * 0.045, dur: 2.3, vol: 0.075, type: 'triangle', lp: 1800, a: 0.006, verb: 0.65 });
  });
  chime(b, 880, 0.04, 0.34, 1.8);
}

/** Small wooden tick for hovering and picking. */
export function playDirectorSelect(): void {
  const b = getBus();
  if (!b) return;
  tone(b, { f: 1500, f2: 900, dur: 0.045, vol: 0.12, type: 'triangle', a: 0.001 });
  noise(b, { dur: 0.016, vol: 0.055, kind: 'highpass', f: 5000, a: 0.001 });
}

/** A sheet of paper sliding across the desk. */
export function playCardDeal(): void {
  const b = getBus();
  if (!b) return;
  slide(b, 0, 1);
}
export const playPaperSlide = playCardDeal;

/** Turning a page. */
export function playPageTurn(): void {
  const b = getBus();
  if (!b) return;
  noise(b, { dur: 0.17, vol: 0.11, f: 3200, f2: 1800, q: 0.8, a: 0.012 });
  noise(b, { t: 0.09, dur: 0.11, vol: 0.062, f: 4600, q: 1, a: 0.01 });
}

/** Opening a folder: the cover lifts, the page underneath shifts. */
export function playFolderOpen(): void {
  const b = getBus();
  if (!b) return;
  slide(b, 0, 0.9);
  noise(b, { t: 0.8, dur: 0.3, vol: 0.05, f: 900, f2: 2600, q: 0.7, a: 0.1 });
  tone(b, { f: 130, f2: 90, t: 1.3, dur: 0.12, vol: 0.1, a: 0.004 });
}

/** A rubber stamp coming down on paper. */
export function playStamp(): void {
  const b = getBus();
  if (!b) return;
  thud(b, 0, 0.5);
  noise(b, { dur: 0.035, vol: 0.07, f: 2500, q: 1, a: 0.001 });
}

/** Two raps of the gavel. */
export function playGavel(): void {
  const b = getBus();
  if (!b) return;
  knock(b, 0, 1);
  knock(b, 0.26, 0.8);
}

/** The board deliberates: a low murmur under a ticking clock (~1.3s). */
export function playDeliberation(): void {
  const b = getBus();
  if (!b) return;
  noise(b, { t: 0.3, dur: 1.15, vol: 0.05, f: 340, q: 0.8, a: 0.3, verb: 0.3 });
  noise(b, { t: 0.35, dur: 1.05, vol: 0.02, f: 900, q: 1.4, a: 0.3, verb: 0.3 });
  [0.5, 0.82, 1.14].forEach((t) => tone(b, { f: 900, f2: 700, t, dur: 0.035, vol: 0.045, type: 'triangle', a: 0.001 }));
}

/** PARTIAL_SUCCESS — an open, unresolved interval. */
export function playPartialSuccess(): void {
  const b = getBus();
  if (!b) return;
  chime(b, 587.3, 0.1, 0, 1.3);
  chime(b, 440, 0.06, 0.13, 1.3);
}

/** SUCCESS — a rising fourth over a warm bed. */
export function playSuccess(): void {
  const b = getBus();
  if (!b) return;
  [220, 277.2, 329.6].forEach((f) => tone(b, { f, dur: 1.3, vol: 0.032, a: 0.15, verb: 0.5 }));
  chime(b, 659.3, 0.11, 0, 1.3);
  chime(b, 880, 0.12, 0.16, 1.6);
}

/** CRITICAL_SUCCESS — a full rising arpeggio with a shimmer on top. */
export function playCriticalSuccess(): void {
  const b = getBus();
  if (!b) return;
  tone(b, { f: 110, dur: 1.6, vol: 0.09, a: 0.03 });
  [220, 277.2, 329.6, 440].forEach((f) => tone(b, { f, dur: 2.0, vol: 0.036, a: 0.18, verb: 0.55 }));
  [440, 554.4, 659.3, 880].forEach((f, i) => chime(b, f, 0.1, i * 0.11, 1.5));
  chime(b, 1760, 0.05, 0.52, 2.0);
}

/** FAILURE — a falling semitone, low and muted. */
export function playFailure(): void {
  const b = getBus();
  if (!b) return;
  thud(b, 0, 0.22, 80, 55, 0.2);
  tone(b, { f: 174.6, dur: 0.75, vol: 0.13, type: 'triangle', lp: 900, a: 0.02, verb: 0.5 });
  tone(b, { f: 164.8, t: 0.32, dur: 0.9, vol: 0.13, type: 'triangle', lp: 900, a: 0.02, verb: 0.5 });
}

/** CRITICAL_FAILURE — a heavy drop and a dark cluster. */
export function playCriticalFailure(): void {
  const b = getBus();
  if (!b) return;
  thud(b, 0, 0.5, 70, 38, 0.6);
  noise(b, { dur: 0.55, vol: 0.1, kind: 'lowpass', f: 300, a: 0.01, verb: 0.4, brown: true });
  [110, 116.5, 155.6].forEach((f) => tone(b, { f, t: 0.05, dur: 1.7, vol: 0.06, type: 'sawtooth', lp: 500, a: 0.06, verb: 0.6 }));
}

/** AGM_BELL — the meeting is called to order. */
export function playAGMBell(): void {
  const b = getBus();
  if (!b) return;
  bell(b, 392, 0.16);
  knock(b, 1.2, 0.7);
  knock(b, 1.46, 0.55);
}

/** AGM_APPLAUSE — a room of individual claps rather than a wash of noise. */
export function playAGMApplause(): void {
  const b = getBus();
  if (!b) return;
  for (let i = 0; i < 90; i++) {
    const t = Math.pow(Math.random(), 0.8) * 2.6;
    // swell in, thin out
    const density = Math.sin(Math.min(1, t / 2.6) * Math.PI);
    noise(b, {
      t, dur: 0.035, vol: (0.02 + Math.random() * 0.035) * (0.4 + density),
      f: 1100 + Math.random() * 1700, q: 1.4, a: 0.001, verb: 0.5, pan: Math.random() * 1.6 - 0.8,
    });
  }
}

/** RESOLUTION_PASS — stamped, with a bright confirmation. */
export function playResolutionPass(): void {
  const b = getBus();
  if (!b) return;
  thud(b, 0, 0.42);
  chime(b, 784, 0.07, 0.1, 1.1);
  chime(b, 1046.5, 0.07, 0.22, 1.3);
}

/** RESOLUTION_FAIL — stamped, with a low falling tone. */
export function playResolutionFail(): void {
  const b = getBus();
  if (!b) return;
  thud(b, 0, 0.42);
  tone(b, { f: 196, f2: 174.6, t: 0.1, dur: 0.75, vol: 0.12, type: 'triangle', lp: 700, a: 0.02, verb: 0.5 });
}

/** YEAR_END_TRIUMPH — bass, a major bed, a rising figure and a bell to finish. */
export function playYearEndTriumph(): void {
  const b = getBus();
  if (!b) return;
  tone(b, { f: 65.4, dur: 2.6, vol: 0.12, a: 0.05 });
  [130.8, 164.8, 196, 261.6].forEach((f) => tone(b, { f, t: 0.1, dur: 3.2, vol: 0.045, a: 0.35, verb: 0.6 }));
  [523.25, 659.3, 784, 1046.5].forEach((f, i) => chime(b, f, 0.09, 0.35 + i * 0.16, 1.6));
  bell(b, 523.25, 0.1, 1.05);
}

/** YEAR_END_DEFEAT — three slow falling notes. */
export function playYearEndDefeat(): void {
  const b = getBus();
  if (!b) return;
  thud(b, 0, 0.3, 75, 42, 0.5);
  [196, 155.6, 130.8].forEach((f, i) => tone(b, { f, t: 0.15 + i * 0.55, dur: 1.3, vol: 0.12, type: 'triangle', lp: 800, a: 0.06, verb: 0.65 }));
}

/** YEAR_END_NEUTRAL — an open fifth, left hanging. */
export function playYearEndNeutral(): void {
  const b = getBus();
  if (!b) return;
  [164.8, 246.9].forEach((f) => tone(b, { f, dur: 1.8, vol: 0.04, a: 0.2, verb: 0.5 }));
  chime(b, 329.6, 0.09, 0.1, 1.6);
  chime(b, 493.9, 0.07, 0.3, 1.6);
}

/** Wildcard — a quick glassy run, up and back. */
export function playWildcard(): void {
  const b = getBus();
  if (!b) return;
  noise(b, { dur: 0.5, vol: 0.03, f: 1500, f2: 6000, q: 1.5, a: 0.2 });
  [523.25, 659.3, 784, 987.8, 784].forEach((f, i) => chime(b, f, 0.07, i * 0.085, 0.7));
}

/** Dispatches to triumph/defeat/neutral based on SV. */
export function playYearEnd(sv: number): void {
  if (sv > 105) {
    playYearEndTriumph();
  } else if (sv < 95) {
    playYearEndDefeat();
  } else {
    playYearEndNeutral();
  }
}

/** Play outcome sound based on tier. */
export function playOutcomeSound(tier: string): void {
  switch (tier) {
    case 'CRITICAL_SUCCESS':
      playCriticalSuccess();
      break;
    case 'SUCCESS':
      playSuccess();
      break;
    case 'PARTIAL_SUCCESS':
      playPartialSuccess();
      break;
    case 'FAILURE':
      playFailure();
      break;
    case 'CRITICAL_FAILURE':
      playCriticalFailure();
      break;
  }
}

// ── The office ──

/** One footfall on a wooden floor. `side` alternates -1 / 1 for a slight stereo sway. */
export function playFootstep(side = 0): void {
  const b = getBus();
  if (!b) return;
  const v = 0.85 + Math.random() * 0.3;
  noise(b, { dur: 0.09, vol: 0.13 * v, kind: 'lowpass', f: 240 + Math.random() * 60, a: 0.002, verb: 0.35, pan: side * 0.18 });
  tone(b, { f: 88 + Math.random() * 10, f2: 60, dur: 0.085, vol: 0.1 * v, a: 0.002, verb: 0.35, pan: side * 0.18 });
  noise(b, { t: 0.012, dur: 0.02, vol: 0.02 * v, f: 1800, q: 1, a: 0.001, verb: 0.3 });
}

/** The office door: latch, a slow hinge, air moving. */
export function playDoorOpen(): void {
  const b = getBus();
  if (!b) return;
  tone(b, { f: 320, f2: 190, dur: 0.045, vol: 0.12, type: 'triangle', a: 0.001, verb: 0.4 });
  noise(b, { dur: 0.02, vol: 0.06, f: 2600, q: 1, a: 0.001, verb: 0.4 });
  tone(b, { f: 96, f2: 72, t: 0.12, dur: 1.1, vol: 0.03, type: 'sawtooth', lp: 520, a: 0.25, verb: 0.5 });
  noise(b, { t: 0.1, dur: 1.3, vol: 0.03, f: 480, f2: 900, q: 0.6, a: 0.5, verb: 0.4 });
}

/** The laptop: hinge, then a soft start-up chord. */
export function playLaptopBoot(): void {
  const b = getBus();
  if (!b) return;
  tone(b, { f: 900, f2: 600, dur: 0.03, vol: 0.04, type: 'triangle', a: 0.001 });
  [349.2, 523.25, 659.3, 784, 1046.5].forEach((f, i) => {
    tone(b, { f, t: 0.5 + i * 0.07, dur: 2.4, vol: 0.045, a: 0.3, hold: 0.3, verb: 0.7 });
  });
  noise(b, { t: 0.5, dur: 1.4, vol: 0.008, kind: 'highpass', f: 7000, a: 0.5 });
}

/** Pushing into the screen: a rising rush that lands on a soft low hit. */
export function playZoomWhoosh(seconds = 1.6): void {
  const b = getBus();
  if (!b) return;
  noise(b, { dur: seconds, vol: 0.085, f: 300, f2: 3400, q: 1.1, a: seconds * 0.72 });
  tone(b, { f: 58, f2: 150, dur: seconds, vol: 0.1, a: seconds * 0.75 });
  thud(b, seconds - 0.06, 0.26, 70, 40, 0.5);
  chime(b, 880, 0.035, seconds - 0.02, 1.8);
}

// Room tone: a low hush, a faint band of city through the glass, a trace of
// air-handling hum. Quiet enough to be noticed only when it stops.
let ambience: { gain: GainNode; stop: () => void } | null = null;
let ambienceWanted = false;

function beginAmbience(): void {
  if (ambience || !ambienceWanted) return;
  const b = getBus();
  if (!b) return;
  const { ctx } = b;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 3);
  gain.connect(b.out);
  const nodes: AudioScheduledSourceNode[] = [];

  const room = ctx.createBufferSource();
  room.buffer = b.brown;
  room.loop = true;
  const roomLp = ctx.createBiquadFilter();
  roomLp.type = 'lowpass';
  roomLp.frequency.value = 210;
  const roomGain = ctx.createGain();
  roomGain.gain.value = 0.11;
  room.connect(roomLp); roomLp.connect(roomGain); roomGain.connect(gain);
  nodes.push(room);

  const city = ctx.createBufferSource();
  city.buffer = b.white;
  city.loop = true;
  const cityBp = ctx.createBiquadFilter();
  cityBp.type = 'bandpass';
  cityBp.frequency.value = 620;
  cityBp.Q.value = 0.5;
  const cityGain = ctx.createGain();
  cityGain.gain.value = 0.007;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.004;
  lfo.connect(lfoDepth); lfoDepth.connect(cityGain.gain);
  city.connect(cityBp); cityBp.connect(cityGain); cityGain.connect(gain);
  nodes.push(city, lfo);

  for (const [f, v] of [[58, 0.012], [116, 0.004]] as const) {
    const hum = ctx.createOscillator();
    hum.frequency.value = f;
    const hg = ctx.createGain();
    hg.gain.value = v;
    hum.connect(hg); hg.connect(gain);
    nodes.push(hum);
  }
  nodes.forEach((n) => n.start());
  ambience = {
    gain,
    stop: () => {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      nodes.forEach((n) => { try { n.stop(t + 1.3); } catch { /* already stopped */ } });
    },
  };
}

/** Start the office room tone. Safe to call before the browser allows audio: it begins on the first click or key. */
export function startOfficeAmbience(): void {
  ambienceWanted = true;
  beginAmbience();
  if (!ambience && typeof window !== 'undefined') {
    const retry = () => {
      window.removeEventListener('pointerdown', retry);
      window.removeEventListener('keydown', retry);
      // the context resumes asynchronously after the gesture
      window.setTimeout(beginAmbience, 120);
    };
    window.addEventListener('pointerdown', retry);
    window.addEventListener('keydown', retry);
  }
}

export function stopOfficeAmbience(): void {
  ambienceWanted = false;
  ambience?.stop();
  ambience = null;
}
