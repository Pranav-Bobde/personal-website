import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { useGoSteps } from "./use-go-steps";

/*
 * Synthesised sound for the press-Go widgets: plain Web Audio, no audio files, no
 * dependency. Every widget that uses it has the same on/off setting and plays through
 * one AudioContext, which only a click on Go can open, so browsers allow it. If audio
 * is missing or blocked, the widgets carry on silently.
 */
export type SoundCue = "tick" | "running" | "note" | "pass" | "success" | "failure" | "reset";

type Note = { at: number; hz: number; seconds: number; peak: number };
type Patch = { wave: OscillatorType; lowpassHz?: number; notes: Note[] };

const HZ = {
  C2: 65.41,
  E2: 82.41,
  C3: 130.81,
  G3: 196,
  G4: 392,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
  C6: 1046.5,
};

const tick = (at: number): Note => ({ at, hz: HZ.A5, seconds: 0.05, peak: 0.4 });

export const CUES: Record<SoundCue, Patch> = {
  /* One step moved on. */
  tick: { wave: "sine", notes: [tick(0)] },
  /* A check or lookup is in progress. */
  running: { wave: "sine", notes: [tick(0), tick(0.14), tick(0.28)] },
  /* Something appeared or moved. */
  note: { wave: "triangle", notes: [{ at: 0, hz: HZ.G4, seconds: 0.2, peak: 0.5 }] },
  /* A small win on the way to the outcome. */
  pass: {
    wave: "triangle",
    notes: [
      { at: 0, hz: HZ.G4, seconds: 0.16, peak: 0.45 },
      { at: 0.09, hz: HZ.C5, seconds: 0.24, peak: 0.45 },
    ],
  },
  /* The outcome is good: a C major arpeggio. */
  success: {
    wave: "triangle",
    notes: [
      { at: 0, hz: HZ.C5, seconds: 0.2, peak: 0.45 },
      { at: 0.09, hz: HZ.E5, seconds: 0.2, peak: 0.45 },
      { at: 0.18, hz: HZ.G5, seconds: 0.22, peak: 0.45 },
      { at: 0.27, hz: HZ.C6, seconds: 0.42, peak: 0.4 },
    ],
  },
  /* Something failed: a low buzz, filtered so it stays soft. */
  failure: {
    wave: "sawtooth",
    lowpassHz: 700,
    notes: [
      { at: 0, hz: HZ.E2, seconds: 0.22, peak: 0.55 },
      { at: 0.16, hz: HZ.C2, seconds: 0.36, peak: 0.55 },
    ],
  },
  /* Back to the start: G3 then C3, 100 ms apart. */
  reset: {
    wave: "sine",
    notes: [
      { at: 0, hz: HZ.G3, seconds: 0.14, peak: 0.55 },
      { at: 0.1, hz: HZ.C3, seconds: 0.2, peak: 0.55 },
    ],
  },
};

const MASTER_GAIN = 10 ** (-12 / 20);
const REVERB_MIX = 0.14;
const REVERB_SECONDS = 0.5;
const ATTACK_SECONDS = 0.006;

/* A short burst of decaying noise, which a convolver turns into a small room. */
function reverbImpulse(ctx: BaseAudioContext) {
  const length = Math.floor(ctx.sampleRate * REVERB_SECONDS);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  let seed = 1;
  for (let index = 0; index < length; index += 1) {
    seed = (seed * 16807) % 2147483647;
    const noise = seed / 1073741823.5 - 1;
    samples[index] = noise * (1 - index / length) ** 3;
  }
  return buffer;
}

export function buildOutput(ctx: BaseAudioContext) {
  const master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(ctx.destination);

  const reverb = ctx.createConvolver();
  reverb.buffer = reverbImpulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = REVERB_MIX;
  reverb.connect(wet);
  wet.connect(master);

  const input = ctx.createGain();
  input.connect(master);
  input.connect(reverb);
  return { input, master };
}

/* Schedules one cue and returns a function that fades it out and cancels what hasn't played. */
export function scheduleCue(ctx: BaseAudioContext, input: AudioNode, cue: SoundCue, onEnded?: () => void) {
  const patch = CUES[cue];
  const start = ctx.currentTime + 0.01;
  const bus = ctx.createGain();

  if (patch.lowpassHz) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = patch.lowpassHz;
    bus.connect(filter);
    filter.connect(input);
  } else {
    bus.connect(input);
  }

  const oscillators = patch.notes.map((note) => {
    const time = start + note.at;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(note.peak, time + ATTACK_SECONDS);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + note.seconds);
    envelope.connect(bus);

    const oscillator = ctx.createOscillator();
    oscillator.type = patch.wave;
    oscillator.frequency.value = note.hz;
    oscillator.connect(envelope);
    oscillator.start(time);
    oscillator.stop(time + note.seconds + 0.01);
    return oscillator;
  });

  oscillators[oscillators.length - 1].onended = () => {
    bus.disconnect();
    onEnded?.();
  };

  return () => {
    const now = ctx.currentTime;
    bus.gain.setTargetAtTime(0, now, 0.006);
    oscillators.forEach((oscillator) => oscillator.stop(now + 0.03));
  };
}

const STORAGE_KEY = "blog-demo-sound";

const readStored = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
};

let enabled: boolean | null = null;
let output: (ReturnType<typeof buildOutput> & { ctx: AudioContext }) | null = null;
const live = new Set<{ owner: object; stop: () => void }>();
const listeners = new Set<() => void>();

const soundEnabled = () => {
  enabled ??= readStored();
  return enabled;
};

const stopVoices = (owner?: object) => {
  for (const voice of live) {
    if (owner && voice.owner !== owner) continue;
    voice.stop();
    live.delete(voice);
  }
};

function setSoundEnabled(next: boolean) {
  enabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    /* The setting then lasts for this page only. */
  }
  if (!next) stopVoices();
  if (output) {
    output.master.gain.setTargetAtTime(next ? MASTER_GAIN : 0, output.ctx.currentTime, 0.01);
  }
  listeners.forEach((listener) => listener());
}

/* Only the click on Go calls this. A cue before that has no output and stays silent. */
function openOutput() {
  if (!soundEnabled()) return;
  try {
    if (!output) {
      const ctx = new AudioContext();
      output = { ctx, ...buildOutput(ctx) };
    }
    void output.ctx.resume();
  } catch {
    output = null;
  }
}

function playCue(owner: object, cue: SoundCue) {
  stopVoices(owner);
  if (!output || !soundEnabled()) return;
  try {
    const voice = {
      owner,
      stop: scheduleCue(output.ctx, output.input, cue, () => live.delete(voice)),
    };
    live.add(voice);
  } catch {
    /* A failed sound must never stop the animation. */
  }
}

/* useGoSteps with a cue per step. cues[n] plays when step n starts, and cues[0] is the idle step. */
export function useSoundedGoSteps(stepMs: readonly number[], cues: readonly (SoundCue | null)[]) {
  const { step, done, go, reset } = useGoSteps(stepMs);
  const [owner] = useState(() => ({}));

  useEffect(() => {
    const cue = cues[step];
    if (cue) playCue(owner, cue);
  }, [step, cues, owner]);

  useEffect(() => () => stopVoices(owner), [owner]);

  return {
    step,
    done,
    go: () => {
      openOutput();
      go();
    },
    reset: () => {
      stopVoices(owner);
      if (step !== 0) playCue(owner, "reset");
      reset();
    },
    /* Back to the start with no reset sound, for a widget changing its scenario. */
    rewind: () => {
      stopVoices(owner);
      reset();
    },
  };
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function SoundToggle() {
  const on = useSyncExternalStore(subscribe, soundEnabled, () => true);
  const Icon = on ? Volume2 : VolumeX;

  return (
    <button
      type="button"
      className="demo-btn demo-sound"
      data-tone="muted"
      data-on={on}
      onClick={() => setSoundEnabled(!on)}
    >
      <Icon aria-hidden size={14} />
      {on ? "sound on" : "sound off"}
    </button>
  );
}
