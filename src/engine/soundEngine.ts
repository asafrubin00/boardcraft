// ── BoardCraft Web Audio Sound Engine ──
// Pure Web Audio API synthesis. No external audio files.
// AudioContext created lazily on first user interaction (autoplay policy).
// Master volume: 0.5 for consistent, non-overwhelming sound levels.

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

/** Generate a reverb impulse response buffer (decaying white noise). */
function createReverbImpulse(ctx: AudioContext, decaySeconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * decaySeconds;
  const buffer = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
  }
  return buffer;
}

/** Create a convolver reverb node with given decay. */
function getReverb(decaySeconds = 2): ConvolverNode {
  const ctx = getCtx();
  const convolver = ctx.createConvolver();
  convolver.buffer = createReverbImpulse(ctx, decaySeconds);
  return convolver;
}

/** Get a master gain node at current volume. */
function getMasterGain(): GainNode {
  const ctx = getCtx();
  const gain = ctx.createGain();
  gain.gain.value = masterVolume;
  gain.connect(ctx.destination);
  return gain;
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
  if (typeof window !== 'undefined') {
    localStorage.setItem(VOLUME_KEY, next);
    localStorage.setItem(STORAGE_KEY, soundEnabled ? 'on' : 'off');
  }
  return next;
}

// ── Low-level synthesis helpers ──

interface ADSROptions {
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
}

/** Play a tone with proper ADSR envelope. */
function playToneADSR(
  freq: number,
  duration: number,
  startTime: number,
  type: OscillatorType = 'sine',
  volume = 0.12,
  adsr: ADSROptions = {},
  freqEnd?: number,
  destination?: AudioNode,
): void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const { attack = 0.02, decay = 0.1, sustain = 0.7, release = 0.15 } = adsr;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(freqEnd, startTime + duration);
  }

  const vol = volume * masterVolume;
  const attackEnd = startTime + attack;
  const decayEnd = attackEnd + decay;
  const releaseStart = startTime + duration - release;

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(vol, attackEnd);
  gain.gain.linearRampToValueAtTime(vol * sustain, decayEnd);
  if (releaseStart > decayEnd) {
    gain.gain.setValueAtTime(vol * sustain, releaseStart);
  }
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(destination ?? ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/** Play a tone through a low-pass filter. */
function playFilteredADSR(
  freq: number,
  duration: number,
  startTime: number,
  type: OscillatorType,
  volume: number,
  filterFreq: number,
  adsr?: ADSROptions,
  freqEnd?: number,
  destination?: AudioNode,
): void {
  const ctx = getCtx();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 1;
  filter.connect(destination ?? ctx.destination);
  playToneADSR(freq, duration, startTime, type, volume, adsr, freqEnd, filter);
}

/** Play a tone through convolver reverb with dry/wet split. */
function playWithReverb(
  freq: number,
  duration: number,
  startTime: number,
  type: OscillatorType,
  volume: number,
  filterFreq: number,
  reverbDecay = 2,
  adsr?: ADSROptions,
  freqEnd?: number,
): void {
  const ctx = getCtx();
  const master = getMasterGain();

  // Dry path
  const dryFilter = ctx.createBiquadFilter();
  dryFilter.type = 'lowpass';
  dryFilter.frequency.value = filterFreq;
  dryFilter.Q.value = 1;
  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.7;
  dryFilter.connect(dryGain);
  dryGain.connect(master);

  // Wet path
  const wetFilter = ctx.createBiquadFilter();
  wetFilter.type = 'lowpass';
  wetFilter.frequency.value = filterFreq * 0.8;
  wetFilter.Q.value = 1;
  const reverb = getReverb(reverbDecay);
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.3;
  wetFilter.connect(reverb);
  reverb.connect(wetGain);
  wetGain.connect(master);

  const splitter = ctx.createGain();
  splitter.gain.value = 1;
  splitter.connect(dryFilter);
  splitter.connect(wetFilter);

  playToneADSR(freq, duration, startTime, type, volume, adsr, freqEnd, splitter);
}

/** Play white noise burst (for card deal, applause). */
function playNoiseBurst(
  duration: number,
  startTime: number,
  volume: number,
  bandpassLow: number,
  bandpassHigh: number,
  adsr: ADSROptions = {},
  destination?: AudioNode,
  ampModRate?: number,
): void {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * Math.ceil(duration + 1);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Bandpass via two filters
  const hipass = ctx.createBiquadFilter();
  hipass.type = 'highpass';
  hipass.frequency.value = bandpassLow;
  hipass.Q.value = 0.5;

  const lopass = ctx.createBiquadFilter();
  lopass.type = 'lowpass';
  lopass.frequency.value = bandpassHigh;
  lopass.Q.value = 0.5;

  const gain = ctx.createGain();
  const { attack = 0.01, decay = 0.05, sustain = 0.7, release = 0.1 } = adsr;
  const vol = volume * masterVolume;

  const attackEnd = startTime + attack;
  const decayEnd = attackEnd + decay;
  const releaseStart = startTime + duration - release;

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(vol, attackEnd);
  gain.gain.linearRampToValueAtTime(vol * sustain, decayEnd);
  if (releaseStart > decayEnd) {
    gain.gain.setValueAtTime(vol * sustain, releaseStart);
  }
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  source.connect(hipass);
  hipass.connect(lopass);

  if (ampModRate) {
    // Amplitude modulation via LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = ampModRate;
    lfoGain.gain.value = 0.5; // modulation depth
    lfo.connect(lfoGain);
    const modGain = ctx.createGain();
    modGain.gain.value = 0.5; // bias so it doesn't go silent
    lfoGain.connect(modGain.gain);
    lopass.connect(modGain);
    modGain.connect(gain);
    lfo.start(startTime);
    lfo.stop(startTime + duration + 0.1);
  } else {
    lopass.connect(gain);
  }

  gain.connect(destination ?? ctx.destination);
  source.start(startTime);
  source.stop(startTime + duration + 0.1);
}

// ── Public sound functions ──

/** BOARD_SEAT_DROP — short satisfying click: 600hz sine, 0.08s */
export function playBoardSeatDrop(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playToneADSR(600, 0.08, now, 'sine', 0.15, {
    attack: 0.003, decay: 0.03, sustain: 0.3, release: 0.03,
  });
}

/** BOARD_SEAT_REMOVE — descending whoosh: 500hz→200hz, 0.15s */
export function playBoardSeatRemove(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playToneADSR(500, 0.15, now, 'sine', 0.12, {
    attack: 0.005, decay: 0.05, sustain: 0.4, release: 0.05,
  }, 200);
}

/** BOARD_CONFIRM — warm three-note chord: 392+494+587hz, 0.6s */
export function playBoardConfirm(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const adsr = { attack: 0.03, decay: 0.15, sustain: 0.5, release: 0.2 };
  playToneADSR(392, 0.6, now, 'sine', 0.08, adsr);
  playToneADSR(494, 0.6, now, 'sine', 0.08, adsr);
  playToneADSR(587, 0.6, now, 'sine', 0.08, adsr);
}

/** DIRECTOR_SELECT — soft click: 523hz triangle, 0.1s */
export function playDirectorSelect(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playToneADSR(523, 0.1, now, 'triangle', 0.08, {
    attack: 0.005, decay: 0.03, sustain: 0.4, release: 0.04,
  });
}

/** CARD_DEAL — white noise burst filtered 2000-4000hz, 0.06s */
export function playCardDeal(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playNoiseBurst(0.06, now, 0.08, 2000, 4000, {
    attack: 0.003, decay: 0.02, sustain: 0.3, release: 0.02,
  });
}

/** PARTIAL_SUCCESS — neutral 369hz sine, 0.4s gentle fade */
export function playPartialSuccess(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playToneADSR(369, 0.4, now, 'sine', 0.1, {
    attack: 0.04, decay: 0.1, sustain: 0.5, release: 0.15,
  });
}

/** SUCCESS — ascending two-note: 440→554hz, each 0.25s, with delayed copy for reverb feel */
export function playSuccess(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const adsr = { attack: 0.01, decay: 0.06, sustain: 0.6, release: 0.1 };
  // Main notes
  playToneADSR(440, 0.25, now, 'sine', 0.1, adsr);
  playToneADSR(554, 0.25, now + 0.25, 'sine', 0.1, adsr);
  // Delayed copy at 30% volume for reverb effect
  playToneADSR(440, 0.25, now + 0.05, 'sine', 0.03, adsr);
  playToneADSR(554, 0.25, now + 0.3, 'sine', 0.03, adsr);
}

/** CRITICAL_SUCCESS — ascending three-note fanfare: 440→554→659hz, sawtooth + lowpass 800hz, with reverb */
export function playCriticalSuccess(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const adsr = { attack: 0.01, decay: 0.05, sustain: 0.6, release: 0.08 };
  playWithReverb(440, 0.2, now, 'sawtooth', 0.08, 800, 2, adsr);
  playWithReverb(554, 0.2, now + 0.2, 'sawtooth', 0.08, 800, 2, adsr);
  playWithReverb(659, 0.2, now + 0.4, 'sawtooth', 0.08, 800, 2, adsr);
}

/** FAILURE — descending two-note: 294→220hz, slight detuning */
export function playFailure(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const adsr = { attack: 0.02, decay: 0.08, sustain: 0.6, release: 0.12 };
  playToneADSR(294, 0.3, now, 'sine', 0.1, adsr);
  playToneADSR(291, 0.3, now, 'sine', 0.04, adsr); // detuned -3hz
  playToneADSR(220, 0.3, now + 0.3, 'sine', 0.1, adsr);
  playToneADSR(217, 0.3, now + 0.3, 'sine', 0.04, adsr); // detuned -3hz
}

/** CRITICAL_FAILURE — dissonant low chord: 185+220hz, square softened at 400hz, 0.8s */
export function playCriticalFailure(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const adsr = { attack: 0.03, decay: 0.15, sustain: 0.5, release: 0.25 };
  playFilteredADSR(185, 0.8, now, 'square', 0.08, 400, adsr);
  playFilteredADSR(220, 0.8, now, 'square', 0.08, 400, adsr);
}

/** AGM_BELL — bell: 523+659hz triangle, sharp attack, 2s exponential decay, reverb */
export function playAGMBell(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const adsr = { attack: 0.01, decay: 0.3, sustain: 0.2, release: 1.0 };
  playWithReverb(523, 2.0, now, 'triangle', 0.1, 4000, 3, adsr);
  playWithReverb(659, 2.0, now, 'triangle', 0.07, 4000, 3, adsr);
}

/** AGM_APPLAUSE — filtered noise: bandpass 800-3000hz, amp mod 7hz, 2.8s */
export function playAGMApplause(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playNoiseBurst(2.8, now, 0.06, 800, 3000, {
    attack: 0.3, decay: 0.2, sustain: 0.7, release: 0.5,
  }, ctx.destination, 7);
}

/** RESOLUTION_PASS — ascending major third: 392→523hz, each 0.15s */
export function playResolutionPass(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const adsr = { attack: 0.008, decay: 0.04, sustain: 0.6, release: 0.05 };
  playToneADSR(392, 0.15, now, 'sine', 0.1, adsr);
  playToneADSR(523, 0.15, now + 0.15, 'sine', 0.1, adsr);
}

/** RESOLUTION_FAIL — descending minor third: 311→220hz, with wave shaper distortion */
export function playResolutionFail(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Create a subtle wave shaper for distortion feel
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    curve[i] = (Math.PI + 3) * x / (Math.PI + 3 * Math.abs(x));
  }
  shaper.curve = curve;
  shaper.oversample = '2x';
  shaper.connect(ctx.destination);

  const adsr = { attack: 0.008, decay: 0.04, sustain: 0.6, release: 0.05 };
  playToneADSR(311, 0.15, now, 'sine', 0.1, adsr, undefined, shaper);
  playToneADSR(220, 0.15, now + 0.15, 'sine', 0.1, adsr, undefined, shaper);
}

/** YEAR_END_TRIUMPH — layered chord build: bass, then triad, then shimmer. 2s total */
export function playYearEndTriumph(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Bass 130hz, 0.5s
  playWithReverb(130, 0.5, now, 'sine', 0.08, 600, 3, {
    attack: 0.03, decay: 0.1, sustain: 0.6, release: 0.15,
  });
  // Triad 261+329+392hz together, 1s starting at 0.3s
  const chordAdsr = { attack: 0.03, decay: 0.2, sustain: 0.5, release: 0.3 };
  playWithReverb(261, 1.0, now + 0.3, 'sine', 0.06, 2500, 3, chordAdsr);
  playWithReverb(329, 1.0, now + 0.3, 'sine', 0.06, 2500, 3, chordAdsr);
  playWithReverb(392, 1.0, now + 0.3, 'sine', 0.06, 2500, 3, chordAdsr);
  // Shimmer 523hz at 0.8s, 0.8s
  playWithReverb(523, 0.8, now + 0.8, 'sine', 0.04, 4000, 3, {
    attack: 0.05, decay: 0.15, sustain: 0.4, release: 0.2,
  });
}

/** YEAR_END_DEFEAT — slow descending minor: 392→311→261, each 0.5s, slow attack, reverb */
export function playYearEndDefeat(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const adsr = { attack: 0.15, decay: 0.1, sustain: 0.5, release: 0.15 };
  playWithReverb(392, 0.5, now, 'sine', 0.06, 1200, 3, adsr);
  playWithReverb(311, 0.5, now + 0.5, 'sine', 0.06, 1200, 3, adsr);
  playWithReverb(261, 0.5, now + 1.0, 'sine', 0.06, 1200, 3, adsr);
}

/** YEAR_END_NEUTRAL — single sustained 329hz sine, 1s gentle fade */
export function playYearEndNeutral(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playToneADSR(329, 1.0, now, 'sine', 0.08, {
    attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.3,
  });
}

/** Playful ascending-then-descending flourish for wildcard events. */
export function playWildcard(): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const adsr = { attack: 0.005, decay: 0.03, sustain: 0.5, release: 0.04 };
  const notes = [523, 659, 784, 659, 523];
  notes.forEach((freq, i) => {
    playWithReverb(freq, 0.1, now + i * 0.1, 'triangle', 0.08, 3000, 0.8, adsr);
  });
}

/** Dispatches to triumph/defeat/neutral based on SV. */
export function playYearEnd(sv: number): void {
  if (!soundEnabled) return;
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
