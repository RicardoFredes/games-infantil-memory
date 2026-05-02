import * as Tone from 'tone';
import { noteToFreq } from '@/lib/notes';
import type { NoteStep } from '@/games/memory-lights/types';

let initialized = false;

export async function initAudio(): Promise<void> {
  if (initialized) return;

  const audioSession = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (audioSession) {
    try { audioSession.type = 'playback'; } catch {}
  }

  await Tone.start();

  const ctx = Tone.getContext().rawContext as AudioContext;
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch {}
  }

  timeoutPlayer = new Tone.Player({
    url: '/audio/dragon-studio-cuckoo-clock-359874.mp3',
    volume: -8,
  }).toDestination();
  await Tone.loaded();
  initialized = true;
}

function createBell(): Tone.Synth {
  return new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.5 },
  }).toDestination();
}

export function playNote(note: string, duration = '8n', volume = -12): void {
  if (!initialized) return;
  const synth = createBell();
  synth.volume.value = volume;
  synth.triggerAttackRelease(noteToFreq(note), duration);
}

export function playSequence(steps: NoteStep[], gapMs: number, volume: number): void {
  if (!initialized) return;
  const synth = createBell();
  synth.volume.value = volume;

  const now = Tone.now();
  steps.forEach((step, i) => {
    const time = now + (i * gapMs) / 1000;
    synth.triggerAttackRelease(noteToFreq(step.note), step.duration, time);
  });
}

export function playTap(): void {
  if (!initialized) return;
  const synth = createBell();
  synth.volume.value = -20;
  synth.triggerAttackRelease(noteToFreq('G5'), '128n');
}

export function playPop(): void {
  if (!initialized) return;
  const synth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0 },
  }).toDestination();
  synth.volume.value = -22;
  synth.triggerAttackRelease('64n');
}

export function playConfettiSfx(): void {
  if (!initialized) return;
  const synth = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
  }).toDestination();
  synth.volume.value = -18;
  synth.triggerAttackRelease('16n');
}

export function playScoreTick(): void {
  if (!initialized) return;
  const synth = createBell();
  synth.volume.value = -22;
  synth.triggerAttackRelease(noteToFreq('C6'), '128n');
}

let bgPlayer: Tone.Player | null = null;
let bgPlayerUrl: string | null = null;

export async function startBackgroundMusic(
  url = '/audio/leberch-suspense-511168.mp3',
  volume = -16,
): Promise<void> {
  if (!initialized) return;
  if (bgPlayer && bgPlayerUrl === url) {
    bgPlayer.volume.value = volume;
    return;
  }
  stopBackgroundMusic();

  bgPlayer = new Tone.Player({
    url,
    loop: true,
    volume,
  }).toDestination();
  bgPlayerUrl = url;

  await Tone.loaded();
  bgPlayer.start();
}

export function stopBackgroundMusic(): void {
  if (bgPlayer) {
    bgPlayer.stop();
    bgPlayer.dispose();
    bgPlayer = null;
    bgPlayerUrl = null;
  }
}

export function stopAllAudio(): void {
  stopBackgroundMusic();
  if (timeoutPlayer) {
    try { timeoutPlayer.stop(); } catch {}
    try { timeoutPlayer.dispose(); } catch {}
    timeoutPlayer = null;
  }
  try {
    Tone.getTransport().stop();
    Tone.getTransport().cancel(0);
  } catch {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', stopAllAudio);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) stopAllAudio();
  });
}

let timeoutPlayer: Tone.Player | null = null;

const cardMatchArpeggio: NoteStep[] = [
  { note: 'C5', duration: '16n' },
  { note: 'E5', duration: '16n' },
  { note: 'G5', duration: '8n' },
];

const cardWinArpeggio: NoteStep[] = [
  { note: 'C5', duration: '8n' },
  { note: 'E5', duration: '8n' },
  { note: 'G5', duration: '8n' },
  { note: 'C6', duration: '4n' },
  { note: 'E6', duration: '4n' },
];

export function playCardMatch(volume = -10): void {
  if (!initialized) return;
  playSequence(cardMatchArpeggio, 90, volume);
}

export function playCardWin(volume = -8): void {
  if (!initialized) return;
  playSequence(cardWinArpeggio, 130, volume);
  const noise = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.005, decay: 0.4, sustain: 0 },
  }).toDestination();
  noise.volume.value = volume - 6;
  noise.triggerAttackRelease('8n', Tone.now() + 0.02);
}

export function playTimeoutSfx(): void {
  if (!initialized) return;
  try {
    if (!timeoutPlayer) {
      timeoutPlayer = new Tone.Player({
        url: '/audio/dragon-studio-cuckoo-clock-359874.mp3',
        volume: -8,
      }).toDestination();
    }
    timeoutPlayer.start(0, 0.55);
  } catch {
    // ignore audio errors
  }
}
